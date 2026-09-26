import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { hawaiiTax } from "./hawaiiTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "hi", stateTreatment: "verified-resident-location",
    hawaiiContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number, ceilings: number[]) {
  const rates = [.014, .032, .055, .064, .068, .072, .076, .079, .0825, .09, .10, .11];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

const SINGLE_CEILINGS = [9600, 14400, 19200, 24000, 36000, 48000, 125000, 175000, 225000, 275000, 325000, Infinity];
const MARRIED_CEILINGS = [19200, 28800, 38400, 48000, 72000, 96000, 250000, 350000, 450000, 550000, 650000, Infinity];

describe("restricted Hawaii annual settlement", () => {
  it("applies the graduated schedule after the standard deduction and $1,144 personal exemption", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const hi = estimateHouseholdTax(terms);
    const taxable = 60000 - 4400 - 1144;
    expect(hi.stateTax).toBeCloseTo(bracketTax(taxable, SINGLE_CEILINGS), 6);
    expect(hi.localTax).toBe(0);
  });

  it("doubles the married bracket thresholds, standard deduction and exemption", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 90000 }] });
    const hi = estimateHouseholdTax(terms);
    const taxable = 90000 - 8800 - 2288;
    expect(hi.stateTax).toBeCloseTo(bracketTax(taxable, MARRIED_CEILINGS), 6);
  });

  it("reconciles exactly against the instructions' own Tax Table example ($23,275 taxable income)", () => {
    const single = hawaiiTax(input(), 23275 + 4400 + 1144, 0);
    expect(single.stateTax).toBeCloseTo(813, 0);
    const marriedTerms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const married = hawaiiTax(marriedTerms, 23275 + 8800 + 2288, 0);
    expect(married.stateTax).toBeCloseTo(399, 0);
  });

  it("excludes Social Security and Railroad Retirement from the Hawaii tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = hawaiiTax(terms, 60000, 0);
    const withSs = hawaiiTax(terms, 78000, 18000);
    expect(withSs.hiAgi).toBe(withoutSs.hiAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("fully excludes income entered as annual pension, of any pensionType, at any age", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "private" }] });
    const hi = hawaiiTax(terms, 30000, 0);
    expect(hi.pensionExclusion).toBe(30000);
    expect(hi.hiAgi).toBe(0);
  });

  it("does not exclude this planner's aggregate 401(k)/IRA/annuity distribution figure", () => {
    const terms = input({ income: [] });
    const hi = hawaiiTax(terms, 40000, 0);
    expect(hi.pensionExclusion).toBe(0);
    expect(hi.hiAgi).toBe(40000);
  });

  it("requires explicit confirmation of the restricted Hawaii assumptions", () => {
    expect(() => hawaiiTax(input({ hawaiiContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => hawaiiTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "hi", hiContract: "confirmed" };
    const hi = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(hi.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(hi.years[0].result.tax.localTax).toBe(0);
    expect(hi.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(hi.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Hawaii confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "hi" })).toThrow(/Confirm/);
  });
});
