import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { virginiaTax } from "./virginiaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "va", stateTreatment: "verified-resident-location",
    virginiaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Virginia annual settlement", () => {
  it("applies the four-bracket schedule net of the standard deduction, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 15000 }] });
    const va = estimateHouseholdTax(terms);
    // Taxable = 15000 - 8750 = 6250. Tax = 3000*2% + 2000*3% + 1250*5% = 60+60+62.5 = 182.5.
    expect(va.stateTax).toBeCloseTo(182.5, 6);
    expect(va.localTax).toBe(0);
  });

  it("uses the same bracket thresholds for married filing jointly, not doubled", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 25000 }] });
    const va = estimateHouseholdTax(terms);
    // Taxable = 25000 - 17500 = 7500. Tax = 3000*2%+2000*3%+2500*5% = 60+60+125 = 245.
    expect(va.stateTax).toBeCloseTo(245, 6);
  });

  it("taxes income above $17,000 at 5.75%", () => {
    const va = virginiaTax(input(), 50000, 0);
    // Taxable = 50000-8750 = 41250. Tax = 60+60+600+(41250-17000)*5.75% = 720+1394.375 = 2114.375.
    expect(va.stateTax).toBeCloseTo(2114.375, 6);
  });

  it("gives a spouse 65 or older by year end a $12,000 age deduction below the income threshold", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const va = virginiaTax(terms, 40000, 0);
    expect(va.ageDeduction).toBe(12000);
  });

  it("phases the age deduction down dollar-for-dollar above $50,000 (single) adjusted federal AGI", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    expect(virginiaTax(terms, 55000, 0).ageDeduction).toBe(7000);
    expect(virginiaTax(terms, 62000, 0).ageDeduction).toBe(0);
  });

  it("uses the $75,000 married threshold and doubles the age deduction for two qualifying spouses", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1951-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    expect(virginiaTax(terms, 75000, 0).ageDeduction).toBe(24000);
    expect(virginiaTax(terms, 80000, 0).ageDeduction).toBe(14000);
  });

  it("gives the full $12,000 regardless of income to a spouse born on or before January 1, 1939", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1938-06-01", blind: false, eligibleForSeniorDeduction: true }] });
    const va = virginiaTax(terms, 500000, 0);
    expect(va.ageDeduction).toBe(12000);
  });

  it("does not apply the age deduction to a spouse under 65", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1990-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    expect(virginiaTax(terms, 40000, 0).ageDeduction).toBe(0);
  });

  it("tests the age-deduction threshold against federal AGI net of taxable Social Security", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    // federalAgi 70000 less 20000 taxable SS = adjusted 50000, at the threshold: full $12,000.
    expect(virginiaTax(terms, 70000, 20000).ageDeduction).toBe(12000);
  });

  it("excludes Social Security from the Virginia tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("requires explicit confirmation of the restricted Virginia assumptions", () => {
    expect(() => virginiaTax(input({ virginiaContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => virginiaTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "va", vaContract: "confirmed" };
    const va = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(va.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(va.years[0].result.tax.localTax).toBe(0);
    expect(va.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(va.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Virginia confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "va" })).toThrow(/Confirm/);
  });
});
