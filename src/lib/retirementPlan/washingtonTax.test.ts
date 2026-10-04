import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { washingtonTax } from "./washingtonTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "wa", stateTreatment: "verified-resident-location",
    washingtonContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Washington annual settlement", () => {
  describe("9.9% income tax over $1 million from 2028 (ESSB 6346)", () => {
    const tax = (year: number, agi: number, lt = 0, st = 0, deduction = 0) => washingtonTax(input({ year }), lt, agi, st, deduction);
    it("does not apply before 2028", () => {
      expect(tax(2027, 5000000).stateTax).toBe(0);
      expect(tax(2027, 5000000).warning).not.toContain("From 2028");
    });
    it("taxes AGI above the shared $1,000,000 deduction at 9.9%", () => {
      expect(tax(2028, 1500000).stateTax).toBeCloseTo(49500, 6);
      expect(tax(2028, 1000000).stateTax).toBe(0);
      expect(tax(2028, 900000).stateTax).toBe(0);
      expect(tax(2060, 1500000).stateTax).toBeCloseTo(49500, 6);
      expect(tax(2028, 1500000).warning).toContain("Initiative 645");
      // The deduction is shared, not doubled, by a married couple.
      expect(washingtonTax(input({ year: 2028, filing: "married" }), 0, 1500000).stateTax).toBeCloseTo(49500, 6);
    });
    it("moves gains out of the income base and credits the capital gains tax against the income tax", () => {
      // $2,000,000 of gains alone: capital gains tax 7% x 1,722,000 + 2.9% x 722,000 = 141,478.
      // The income tax (9.9% x $1,000,000 = 99,000) is fully absorbed by the credit.
      const gainsOnly = tax(2028, 2000000, 2000000);
      expect(gainsOnly.capitalGainsTax).toBeCloseTo(141478, 6);
      expect(gainsOnly.incomeTax).toBeCloseTo(99000, 6);
      expect(gainsOnly.stateTax).toBeCloseTo(141478, 6);
      // $1,200,000 of wages plus $400,000 of gains: capital gains tax 7% x 122,000 = 8,540; income tax 9.9% x 600,000 = 59,400.
      const mixed = tax(2028, 1600000, 400000);
      expect(mixed.capitalGainsTax).toBeCloseTo(8540, 6);
      expect(mixed.netIncomeTax).toBeCloseTo(59400 - 8540, 6);
      expect(mixed.stateTax).toBeCloseTo(59400, 6);
    });
    it("leaves gains under the capital gains deduction out of the income base entirely", () => {
      // $200,000 of gains owes no capital gains tax, so it is not income-taxed either: 9.9% x (1,400,000 - 200,000 - 1,000,000).
      expect(tax(2028, 1400000, 200000).stateTax).toBeCloseTo(19800, 6);
    });
    it("adds back long-term losses that reduced AGI", () => {
      // A $50,000 long-term loss deducts $3,000 against other income, so AGI of 1,497,000 is restored to 1,500,000.
      expect(tax(2028, 1497000, -50000, 0, 3000).stateTax).toBeCloseTo(49500, 6);
      // A loss absorbed by short-term gains is restored too.
      expect(tax(2028, 1500000, -10000, 10000, 0).baseIncome).toBeCloseTo(1510000, 6);
    });
    it("rejects nonfinite inputs", () => {
      expect(() => tax(2028, NaN)).toThrow(/Invalid Washington/);
    });
  });

  it("taxes long-term capital gains above the $278,000 deduction at 7%", () => {
    const terms = input({ accountIncome: taxCharacter({ longTermGain: 400000 }) });
    const wa = estimateHouseholdTax(terms);
    expect(wa.stateTax).toBeCloseTo((400000 - 278000) * 0.07, 6);
    expect(wa.localTax).toBe(0);
  });

  it("adds the 2.9% surtax above $1,000,000 of taxable gain", () => {
    const wa = washingtonTax(input(), 1500000);
    const taxable = 1500000 - 278000;
    expect(wa.stateTax).toBeCloseTo(taxable * 0.07 + (taxable - 1000000) * 0.029, 6);
  });

  it("does not double the deduction for married filers", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], accountIncome: taxCharacter({ longTermGain: 400000 }) });
    const wa = estimateHouseholdTax(terms);
    expect(wa.stateTax).toBeCloseTo((400000 - 278000) * 0.07, 6);
  });

  it("does not tax short-term gains, wages, pensions or Social Security", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 },
      { ownerId: "one", kind: "pension", amount: 20000 }, { ownerId: "one", kind: "social-security", amount: 20000 }],
      accountIncome: taxCharacter({ shortTermGain: 500000, retirementOrdinary: 50000 }) });
    const wa = washingtonTax(terms, 0);
    expect(wa.stateTax).toBe(0);
  });

  it("results in zero tax for a net long-term capital loss", () => {
    const wa = washingtonTax(input(), -50000);
    expect(wa.stateTax).toBe(0);
  });

  it("requires explicit confirmation of the restricted Washington assumptions", () => {
    expect(() => washingtonTax(input({ washingtonContract: undefined }), 400000)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => washingtonTax(input({ year: 2025 }), 400000)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "wa", waContract: "confirmed" };
    const wa = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(wa.years[0].result.tax.stateTax).toBe(0);
    expect(wa.years[0].result.tax.localTax).toBe(0);
    expect(wa.years[0].endingPortfolio).toBe(florida.years[0].endingPortfolio);
    expect(wa.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("applies the 9.9% income tax from 2028 end to end for a household with over $1 million of income", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "wa", waContract: "confirmed", endYear: "2029", "one-salary": "1500000", "one-retirement": "2035-01-01" };
    const rows = runRetirementTimeline(buildPreviewInput(values)).years;
    const row = (year: number) => rows.find(item => item.year === year)!;
    expect(row(2027).result.tax.stateTax).toBeLessThan(1);
    const t = row(2028).result.tax;
    // Gains are taxed under the capital gains tax, not the income base; a modest default portfolio realizes none here.
    expect(t.stateTax).toBeGreaterThan(40000);
    expect(t.stateTax).toBeCloseTo(.099 * Math.max(0, t.agi - 1000000), 2);
    expect(t.warnings.join(" ")).toContain("Initiative 645");
    expect(rows.every(item => Math.abs(item.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Washington confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "wa" })).toThrow(/Confirm/);
  });
});
