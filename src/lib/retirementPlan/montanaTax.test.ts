import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { montanaTax } from "./montanaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "mt", stateTreatment: "verified-resident-location",
    montanaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Montana annual settlement", () => {
  it("applies the two-bracket single schedule to federal taxable income (AGI less the federal standard deduction), with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 30000 }] });
    const mt = estimateHouseholdTax(terms);
    // AGI 30000, federal standard deduction (single, 2026) 16100. Taxable = 13900, entirely in the 4.7% band.
    expect(mt.stateTax).toBeCloseTo(13900 * 0.047, 6);
    expect(mt.localTax).toBe(0);
  });

  it("taxes income above $47,500 (single) at 5.65%", () => {
    const mt = montanaTax(input(), 70000, 0, 0);
    // Taxable = 70000. Tax = 47500*4.7% + 22500*5.65% = 2232.5 + 1271.25 = 3503.75.
    expect(mt.stateTax).toBeCloseTo(3503.75, 6);
  });

  it("doubles the top-bracket threshold for married filing jointly", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const mt = montanaTax(terms, 95000, 0, 0);
    // Taxable = 95000, entirely inside the married 0-95000 4.7% band.
    expect(mt.stateTax).toBeCloseTo(95000 * 0.047, 6);
  });

  it("subtracts $5,660 for a spouse 65 or older by year end", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    const mt = montanaTax(terms, 30000, 0, 0);
    expect(mt.ageSubtraction).toBe(5660);
    // Taxable = 30000-5660 = 24340.
    expect(mt.stateTax).toBeCloseTo(24340 * 0.047, 6);
  });

  it("doubles the age-65 subtraction when both spouses qualify", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1958-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const mt = montanaTax(terms, 30000, 0, 0);
    expect(mt.ageSubtraction).toBe(11320);
  });

  it("does not apply the age-65 subtraction to a spouse under 65", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1990-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    const mt = montanaTax(terms, 30000, 0, 0);
    expect(mt.ageSubtraction).toBe(0);
  });

  it("subtracts the OBBBA senior deduction passed through from the household calculation", () => {
    const withSenior = montanaTax(input(), 40000, 10000, 6000);
    const without = montanaTax(input(), 40000, 10000, 0);
    expect(without.stateTax - withSenior.stateTax).toBeCloseTo(6000 * 0.047, 6);
  });

  it("fully taxes Social Security as ordinary income, with no Montana-specific exemption", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const withSocialSecurity = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const wagesResult = estimateHouseholdTax(wagesOnly);
    const withSsResult = estimateHouseholdTax(withSocialSecurity);
    expect(withSsResult.stateTax).toBeGreaterThan(wagesResult.stateTax);
  });

  it("requires explicit confirmation of the restricted Montana assumptions", () => {
    expect(() => montanaTax(input({ montanaContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => montanaTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "mt", mtContract: "confirmed" };
    const mt = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(mt.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(mt.years[0].result.tax.localTax).toBe(0);
    expect(mt.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(mt.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Montana confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "mt" })).toThrow(/Confirm/);
  });
});
