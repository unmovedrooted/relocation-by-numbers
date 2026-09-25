import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { ohioTax } from "./ohioTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "oh", stateTreatment: "verified-resident-location",
    ohioContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Ohio annual settlement", () => {
  it("applies the flat 2.75% rate above $26,050 net of the exemption, with no local tax", () => {
    // AGI 60000, one exemption of 2400 (MAGI 60000 <= 80000 tier is actually 2150; MAGI here is 60000 which is >40000 so tier=2150).
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const oh = estimateHouseholdTax(terms);
    const taxable = 60000 - 2150;
    expect(oh.stateTax).toBeCloseTo((taxable - 26050) * 0.0275, 6);
    expect(oh.localTax).toBe(0);
  });

  it("taxes nothing below the $26,050 threshold", () => {
    const oh = ohioTax(input(), 20000, 0, 0);
    expect(oh.stateTax).toBe(0);
  });

  it("gives each spouse their own exemption on a joint return", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 30000 }] });
    const oh = estimateHouseholdTax(terms);
    // MAGI 30000 <= 40000, exemption 2400 per person x 2 = 4800. Taxable = 30000-4800 = 25200, under 26050 -> $0.
    expect(oh.stateTax).toBe(0);
  });

  it("excludes Social Security from the Ohio tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("gives the maximum $200 Retirement Income Credit for combined retirement income over $8,000", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 9000 }] });
    const oh = ohioTax(terms, 9000, 0, 0);
    expect(oh.retirementIncomeCredit).toBe(200);
  });

  it("scales the Retirement Income Credit by the published table", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 2000 }] });
    expect(ohioTax(terms, 2000, 0, 0).retirementIncomeCredit).toBe(50);
  });

  it("denies the Retirement Income Credit and Senior Citizen Credit above the $100,000 MAGI-less-exemptions limit", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 150000 }, { ownerId: "one", kind: "pension", amount: 9000 }] });
    const oh = ohioTax(terms, 159000, 0, 0);
    expect(oh.retirementIncomeCredit).toBe(0);
    expect(oh.seniorCitizenCredit).toBe(0);
  });

  it("gives the $50 Senior Citizen Credit when any owner is 65 or older", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    expect(ohioTax(terms, 30000, 0, 0).seniorCitizenCredit).toBe(50);
  });

  it("requires explicit confirmation of the restricted Ohio assumptions", () => {
    expect(() => ohioTax(input({ ohioContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => ohioTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "oh", ohContract: "confirmed" };
    const oh = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(oh.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(oh.years[0].result.tax.localTax).toBe(0);
    expect(oh.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(oh.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Ohio confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "oh" })).toThrow(/Confirm/);
  });
});
