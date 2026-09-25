import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { westVirginiaTax } from "./westVirginiaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "wv", stateTreatment: "verified-resident-location",
    westVirginiaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number) {
  const ceilings = [10000, 25000, 40000, 60000, Infinity];
  const rates = [.0211, .0281, .0316, .0422, .0458];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

describe("restricted West Virginia annual settlement", () => {
  it("applies the graduated schedule after the $2,000 per-person exemption", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const wv = estimateHouseholdTax(terms);
    expect(wv.stateTax).toBeCloseTo(bracketTax(80000 - 2000), 6);
    expect(wv.localTax).toBe(0);
  });

  it("uses the same bracket schedule for a married household, with a doubled exemption", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const wv = estimateHouseholdTax(terms);
    expect(wv.stateTax).toBeCloseTo(bracketTax(80000 - 4000), 6);
  });

  it("fully excludes Social Security when federal AGI is at or below the threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 30000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const wv = westVirginiaTax(terms, 50000, 20000, 0);
    expect(wv.wvAgi).toBe(30000);
  });

  it("excludes only 65% of Social Security when federal AGI exceeds the threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const wv = westVirginiaTax(terms, 80000, 20000, 0);
    expect(wv.wvAgi).toBe(80000 - 20000 * 0.65);
  });

  it("uses the doubled married Social Security threshold", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const wv = westVirginiaTax(terms, 90000, 20000, 0);
    expect(wv.wvAgi).toBe(90000 - 20000);
  });

  it("caps a government pension exclusion at $2,000 per owner", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000, pensionType: "federal-government" }] });
    const wv = westVirginiaTax(terms, 5000, 0, 0);
    expect(wv.governmentPensionExclusion).toBe(2000);
  });

  it("fully taxes a private or unspecified pension", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000, pensionType: "private" }] });
    const wv = westVirginiaTax(terms, 5000, 0, 0);
    expect(wv.governmentPensionExclusion).toBe(0);
  });

  it("gives an owner 65 or older up to $8,000 of further exclusion against other income", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    const wv = westVirginiaTax(terms, 20000, 0, 20000);
    expect(wv.seniorDeduction).toBe(8000);
  });

  it("nets the senior deduction against Social Security and government-pension exclusions already claimed", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "social-security", amount: 3000 }, { ownerId: "one", kind: "pension", amount: 1000, pensionType: "federal-government" }] });
    const wv = westVirginiaTax(terms, 30000, 3000, 20000);
    expect(wv.seniorDeduction).toBeCloseTo(8000 - 3000 - 1000, 6);
  });

  it("does not extend the senior deduction to an owner under 65", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    const wv = westVirginiaTax(terms, 20000, 0, 20000);
    expect(wv.seniorDeduction).toBe(0);
  });

  it("requires explicit confirmation of the restricted West Virginia assumptions", () => {
    expect(() => westVirginiaTax(input({ westVirginiaContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => westVirginiaTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "wv", wvContract: "confirmed" };
    const wv = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(wv.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(wv.years[0].result.tax.localTax).toBe(0);
    expect(wv.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(wv.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit West Virginia confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "wv" })).toThrow(/Confirm/);
  });
});
