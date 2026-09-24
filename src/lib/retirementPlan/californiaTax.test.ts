import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { californiaTax } from "./californiaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ca", stateTreatment: "verified-resident-location",
    californiaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted California annual settlement", () => {
  it("applies the nine-bracket single schedule net of the standard deduction and $153 exemption credit, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 20000 }] });
    const ca = estimateHouseholdTax(terms);
    // Taxable = 20000 - 5706 = 14294. Bracket tax: 11079*1% + (14294-11079)*2% = 110.79 + 64.3 = 175.09.
    // Minus the $153 exemption credit = 22.09.
    expect(ca.stateTax).toBeCloseTo(22.09, 6);
    expect(ca.localTax).toBe(0);
  });

  it("never returns a negative tax when the exemption credit exceeds the bracket tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 5706 }] });
    const ca = estimateHouseholdTax(terms);
    expect(ca.stateTax).toBe(0);
  });

  it("doubles every bracket threshold for married filing jointly", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const ca = estimateHouseholdTax(terms);
    // Taxable = 40000 - 11412 = 28588, entirely in the married 1% band (0-22158) plus part of the 2% band.
    // Tax = 22158*1% + (28588-22158)*2% = 221.58 + 128.6 = 350.18. Minus 2*153 = 306 exemption credit = 44.18.
    expect(ca.stateTax).toBeCloseTo(44.18, 6);
  });

  it("adds the 1% Mental Health Services Act surtax above $1,000,000 taxable income, using the same threshold regardless of filing status", () => {
    const single = californiaTax(input(), 1000000 + 5706 + 100000, 0);
    const married = californiaTax(input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] }), 1000000 + 11412 + 100000, 0);
    // Both scenarios have exactly $100,000 of taxable income above the flat $1,000,000 surtax threshold.
    const single2 = californiaTax(input(), 1000000 + 5706, 0);
    const married2 = californiaTax(input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] }), 1000000 + 11412, 0);
    // At $1.0-1.1M taxable income, single filers sit in the top 12.3% bracket (over $742,953),
    // while married filers sit in the 11.3% bracket (over $891,542, under $1,485,906).
    expect(single.stateTax - single2.stateTax).toBeGreaterThan(100000 * 0.123);
    expect(married.stateTax - married2.stateTax).toBeGreaterThan(100000 * 0.113);
  });

  it("excludes Social Security from the California tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("gives no exclusion for pension income: it is taxed the same as wages", () => {
    const wages = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const pension = input({ income: [{ ownerId: "one", kind: "pension", amount: 60000 }] });
    expect(estimateHouseholdTax(pension).stateTax).toBe(estimateHouseholdTax(wages).stateTax);
  });

  it("adds a $153 exemption credit for blindness and for reaching age 65", () => {
    const base = californiaTax(input(), 60000, 0).exemptionCredit;
    const blind = californiaTax(input({ people: [{ id: "one", birthDate: "1975-01-01", blind: true, eligibleForSeniorDeduction: true }] }), 60000, 0).exemptionCredit;
    const senior = californiaTax(input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }] }), 60000, 0).exemptionCredit;
    expect(blind).toBeCloseTo(base + 153, 6);
    expect(senior).toBeCloseTo(base + 153, 6);
  });

  it("phases the exemption credit out by $6 per $2,500 of federal AGI above $252,203 (single)", () => {
    const at = californiaTax(input(), 252203, 0).exemptionCredit;
    const above = californiaTax(input(), 252204, 0).exemptionCredit;
    const zero = californiaTax(input(), 252203 + 26 * 2500, 0).exemptionCredit;
    expect(at).toBeCloseTo(153, 6);
    expect(above).toBeCloseTo(153 - 6, 6);
    expect(zero).toBe(0);
  });

  it("requires explicit confirmation of the restricted California assumptions", () => {
    expect(() => californiaTax(input({ californiaContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => californiaTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ca", caContract: "confirmed" };
    const ca = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ca.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ca.years[0].result.tax.localTax).toBe(0);
    expect(ca.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ca.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit California confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ca" })).toThrow(/Confirm/);
  });
});
