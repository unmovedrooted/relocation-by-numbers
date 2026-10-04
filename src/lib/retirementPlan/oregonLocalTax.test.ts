import { describe, expect, it } from "vitest";
import { oregonLocalTax, type OregonLocalContract } from "./oregonLocalTax";
import { buildPreviewInput, calculatePreview, PREVIEW_DEFAULTS } from "./preview";
import { initialAccountEditor, newAccountDraft } from "./previewAccounts";
import { evaluateBracketStrategies } from "./bracketStrategies";

const both: OregonLocalContract = { metro: "resident", multnomah: "resident", adjustments: "none-confirmed" };
const values = { ...PREVIEW_DEFAULTS, state: "or", orContract: "confirmed", orMetro: "resident", orMultnomah: "resident", orLocalAdjustments: "none-confirmed", "one-pensionType": "private" };

describe("restricted Oregon SHS/PFA", () => {
  it.each([
    [2026, "single", 300000, 1720, 3375],
    [2026, "married", 500000, 2950, 6000],
    [2027, "single", 300000, 1680, 3375],
    [2027, "married", 500000, 2890, 6000],
    [2028, "single", 300000, 1680, 4775],
    [2028, "married", 500000, 2890, 8400],
    [2030, "single", 300000, 1680, 4775],
    [2031, "single", 300000, 0, 4775],
  ] as const)("reconciles %s %s taxable income %s", (year, filing, income, shs, pfa) => {
    const result = oregonLocalTax(year, filing, income, both);
    expect(result.shs).toBeCloseTo(shs, 8);
    expect(result.pfa).toBeCloseTo(pfa, 8);
    expect(result.localTax).toBeCloseTo(shs + pfa, 8);
  });
  it("applies exact thresholds without premature rounding", () => {
    expect(oregonLocalTax(2026, "single", 125000, both).pfa).toBe(0);
    expect(oregonLocalTax(2026, "single", 125000.01, both).pfa).toBeCloseTo(.00015, 9);
    expect(oregonLocalTax(2026, "single", 128000, both).shs).toBe(0);
    expect(oregonLocalTax(2026, "single", 128000.01, both).shs).toBeCloseTo(.0001, 9);
    expect(oregonLocalTax(2026, "single", 250000.01, both).pfa).toBeCloseTo(1875.0003, 8);
    expect(oregonLocalTax(2026, "married", 200000, both).pfa).toBe(0);
    expect(oregonLocalTax(2026, "married", 400000.01, both).pfa).toBeCloseTo(3000.0003, 8);
  });
  it("keeps jurisdiction membership independent", () => {
    expect(oregonLocalTax(2026, "single", 300000, { ...both, metro: "outside-no-source" }).localTax).toBe(3375);
    expect(oregonLocalTax(2026, "single", 300000, { ...both, multnomah: "outside-no-source" }).localTax).toBe(1720);
    expect(oregonLocalTax(2026, "single", 300000, { ...both, metro: "outside-no-source", multnomah: "outside-no-source" }).localTax).toBe(0);
  });
  it("rejects unknown contracts and malformed numerical input", () => {
    expect(() => oregonLocalTax(2026, "single", 0, undefined)).toThrow(/Confirm/);
    for (const amount of [-1, NaN, Infinity]) expect(() => oregonLocalTax(2026, "single", amount, both)).toThrow();
    for (const year of [2025, 2026.5, 2127]) expect(() => oregonLocalTax(year, "single", 0, both)).toThrow();
    for (const key of ["orMetro", "orMultnomah", "orLocalAdjustments"]) {
      expect(() => buildPreviewInput({ ...values, [key]: "" })).toThrow(/Confirm/);
      expect(() => buildPreviewInput({ ...values, [key]: "unsupported" })).toThrow(/Confirm/);
    }
  });
  it("carries local tax into annual cash settlement without changing state tax", () => {
    const sample = { ...values, endYear: "2026", "one-salary": "300000" };
    const inside = calculatePreview(sample).years[0];
    const outside = calculatePreview({ ...sample, orMetro: "outside-no-source", orMultnomah: "outside-no-source" }).years[0];
    // $300,000 AGI - $2,910 deduction; federal subtraction fully phased out.
    // SHS: 169,090*.01; PFA: 172,090*.015 + 47,090*.015.
    expect(inside.result.tax.localTax).toBeCloseTo(4978.6, 6);
    expect(inside.result.tax.stateTax).toBe(outside.result.tax.stateTax);
    expect(outside.endingPortfolio - inside.endingPortfolio).toBeCloseTo(4978.6, 5);
    expect(inside.reconciliationResidual).toBeCloseTo(0, 5);
  });
  it("blocks unknown and public pensions instead of taxing exempt income", () => {
    for (const type of ["unspecified", "federal-government", "other-government"]) {
      expect(() => calculatePreview({ ...values, "one-pensionStart": "2026-01-01", "one-pensionType": type })).toThrow(/private pensions/);
    }
  });
  it("passes jurisdiction choices through the bracket-strategy candidates", () => {
    const editor = initialAccountEditor();
    editor.accounts.push(newAccountDraft("roth", "roth-ira"));
    editor.owners.one.rothFirstYear = "2020";
    const input = buildPreviewInput({ ...values, endYear: "2026", spending: "0", cash: "100000", "one-salary": "0" }, editor);
    const result = evaluateBracketStrategies(input, { ownerId: "one", sourceId: "one-ira", destinationId: "roth", window: { start: 2026, end: 2026 }, terminalRate: "20" });
    expect(result.candidates).toHaveLength(4);
    expect(result.candidates[0].projection!.years[0].result.tax.localTax).toBe(0);
    const high = result.candidates.find(c => c.target === 24)!;
    expect(high.status).toBe("eligible");
    expect(high.projection!.years[0].result.tax.localTax).toBeGreaterThan(0);
    expect(high.projection!.years[0].reconciliationResidual).toBeCloseTo(0, 5);
  });
});
