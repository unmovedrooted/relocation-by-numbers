import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { spendingSearchRequest, type SpendingSearchDraft } from "./spendingSearchDraft";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";

const input = buildPreviewInput(PREVIEW_DEFAULTS);
const baseDraft: SpendingSearchDraft = { minSpending: "20000", maxSpending: "80000", resolution: "1000", successTarget: "90", paths: "5", seed: "42", volatility: { "one-ira": "13.1250" } };

it("converts a valid draft without mutating it, and requires confirmation", () => {
  const draft = { ...baseDraft };
  const request = spendingSearchRequest(input, draft, true);
  expect(request).toEqual({
    minSpending: 20000, maxSpending: 80000, resolution: 1000, successTarget: 0.9,
    simulation: { paths: 5, seed: 42, volatilityByAccount: { "one-ira": 0.13125 }, returnModel: "lognormal-shared-market-nominal", conversionPolicy: "fixed-input-schedule" },
  });
  expect(draft).toEqual(baseDraft);
  expect(() => spendingSearchRequest(input, draft, false)).toThrow(/Confirm/);
});

it("rejects a missing, non-numeric or out-of-range volatility for any invested account", () => {
  for (const volatility of [{}, { "one-ira": "" }, { "one-ira": "-1" }, { "one-ira": "101" }, { "one-ira": "NaN" }]) {
    expect(() => spendingSearchRequest(input, { ...baseDraft, volatility }, true)).toThrow(/volatility/);
  }
});

it("rejects an inverted or missing spending range", () => {
  for (const patch of [{ minSpending: "" }, { maxSpending: "" }, { minSpending: "80000", maxSpending: "80000" }, { minSpending: "80000", maxSpending: "20000" }, { minSpending: "-1" }]) {
    expect(() => spendingSearchRequest(input, { ...baseDraft, ...patch }, true)).toThrow();
  }
});

it("rejects a non-whole or non-positive resolution", () => {
  for (const resolution of ["", "0", "-1", "1.5", "NaN"]) expect(() => spendingSearchRequest(input, { ...baseDraft, resolution }, true)).toThrow();
});

it("rejects a success target outside 1–100%", () => {
  for (const successTarget of ["", "0", "-1", "101", "NaN", "Infinity"]) expect(() => spendingSearchRequest(input, { ...baseDraft, successTarget }, true)).toThrow();
});

it("rejects blank, fractional and out-of-range path counts and seeds", () => {
  for (const paths of ["", "0", "1.5", "1001", "NaN"]) expect(() => spendingSearchRequest(input, { ...baseDraft, paths }, true)).toThrow();
  for (const seed of ["", "-1", "1.5", "4294967296"]) expect(() => spendingSearchRequest(input, { ...baseDraft, seed }, true)).toThrow();
});

it("isolates worker messages, cancellation, unmount and stale results", () => {
  const ui = readFileSync("src/components/RetirementSpendingSearch.tsx", "utf8");
  const parent = readFileSync("src/components/RetirementPlanPreview.tsx", "utf8");
  expect(ui).toContain("if (workerRef.current !== worker) return");
  expect(ui).toContain("workerRef.current?.terminate()");
  expect(ui).toContain("useEffect(() => () =>");
  expect(ui).toContain("Cancel search");
  expect(ui).toContain("setReport(null)");
  expect(ui).toContain("not a guaranteed maximum");
  expect(parent).toContain("<RetirementSpendingSearch");
  expect(parent).toContain("addPreviewConversions(buildPreviewInput(values, accounts, saving, medicare), conversions)");
});
