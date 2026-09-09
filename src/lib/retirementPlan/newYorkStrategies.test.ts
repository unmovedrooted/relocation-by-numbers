import { expect, it } from "vitest";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { initialAccountEditor, newAccountDraft } from "./previewAccounts";
import { evaluateBracketStrategies } from "./bracketStrategies";
import { strategyCsvRows } from "./strategyCsv";
function fixture() {
  const editor = initialAccountEditor();
  editor.accounts.push(newAccountDraft("roth", "roth-ira"));
  editor.accounts.forEach(account => account.fields.returns = "0");
  editor.owners.one.rothFirstYear = "2020";
  return buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ny", cityId: "nyc-ny", nyContract: "confirmed",
    "one-pensionType": "private", endYear: "2028", spending: "0", cash: "100000", "one-salary": "0" }, editor);
}
const request = { ownerId: "one", sourceId: "one-ira", destinationId: "roth", window: { start: 2026, end: 2026 }, terminalRate: "20" };
it("settles and exports each NY strategy with candidate-specific taxes and limitations", () => {
  const input = fixture();
  const result = evaluateBracketStrategies(input, request);
  const florida = evaluateBracketStrategies({ ...input, state: "fl", cityId: "" }, request);
  expect(result.candidates.every(candidate => candidate.status === "eligible")).toBe(true);
  for (const candidate of result.candidates.filter(candidate => candidate.target)) {
    const row = candidate.projection!.years[0];
    const fl = florida.candidates.find(item => item.target === candidate.target)!.projection!.years[0];
    expect(row.result.tax.stateTax).toBeGreaterThan(0);
    expect(row.result.tax.localTax).toBeGreaterThan(0);
    expect(row.result.cash.tax).toBe(row.result.tax.total);
    expect(row.endingPortfolio).toBeLessThan(fl.endingPortfolio);
    expect(row.result.tax.total - fl.result.tax.total).toBeCloseTo(row.result.tax.stateTax + row.result.tax.localTax!, 5);
  }
  const rows = strategyCsvRows(result, { input, request, completedAt: "2026-09-08T00:00:00Z" });
  expect(rows.some(row => row.section === "limitation" && String(row.value).includes("New York/NYC pre-credit"))).toBe(true);
  expect(rows.some(row => String(row.value).includes("State tax remains the existing proxy"))).toBe(false);
  for (const candidate of result.candidates) {
    const name = candidate.target ? `Fill to ${candidate.target}%` : "No conversions";
    const total = rows.find(row => row.strategy === name && row.field === "total_taxes");
    expect(total?.value).toBe(candidate.projection!.years.reduce((sum, row) => sum + row.result.tax.total, 0));
  }
});
it("cannot rank an unsupported NY contract", () => {
  expect(() => evaluateBracketStrategies({ ...fixture(), newYorkContract: undefined }, request)).toThrow(/Confirm/);
  expect(() => evaluateBracketStrategies({ ...fixture(), cityId: "" }, request)).toThrow(/Yonkers/);
});
