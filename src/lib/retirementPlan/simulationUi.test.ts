import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { simulationRequest } from "./simulationDraft";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";

const input = buildPreviewInput(PREVIEW_DEFAULTS);
it("requires explicit volatility and confirmation without changing raw drafts", () => {
  const draft = { "one-ira": "13.1250" };
  expect(simulationRequest(input, "200", "42", draft, true).volatilityByAccount["one-ira"]).toBe(.13125);
  expect(draft["one-ira"]).toBe("13.1250");
  expect(() => simulationRequest(input, "200", "42", {}, true)).toThrow(/volatility/);
  expect(() => simulationRequest(input, "200", "42", draft, false)).toThrow(/Confirm/);
});
it("rejects blank, fractional and out-of-range simulation settings", () => {
  for (const paths of ["", "0", "1.5", "1001", "NaN"]) expect(() => simulationRequest(input, paths, "42", { "one-ira": "0" }, true)).toThrow();
  for (const seed of ["", "-1", "1.5", "4294967296"]) expect(() => simulationRequest(input, "1", seed, { "one-ira": "0" }, true)).toThrow();
  for (const value of ["", "-1", "101", "Infinity"]) expect(() => simulationRequest(input, "1", "0", { "one-ira": value }, true)).toThrow();
});
it("retains the exact zero-volatility contract", () => {
  expect(simulationRequest(input, "1", "0", { "one-ira": "0.0000" }, true)).toMatchObject({ paths: 1, seed: 0, volatilityByAccount: { "one-ira": 0 }, conversionPolicy: "fixed-input-schedule" });
});
it("isolates worker messages, cancellation, unmount and all scenario edits", () => {
  const ui = readFileSync("src/components/RetirementSimulation.tsx", "utf8");
  const parent = readFileSync("src/components/RetirementPlanPreview.tsx", "utf8");
  expect(ui).toContain("if (worker.current !== active) return");
  expect(ui).toContain("worker.current?.terminate()");
  expect(ui).toContain("useEffect(() => () =>");
  expect(ui).toContain("Cancel simulation");
  expect(ui).toContain("setResult(null)");
  expect(parent).toContain("key={JSON.stringify([values, accounts, saving, medicare, conversions, runVersion])}");
  expect(parent).toContain("addPreviewConversions(buildPreviewInput(values, accounts, saving, medicare), conversions)");
  expect(ui).toContain("elsewhere on this page remain the fixed-return projection");
});
