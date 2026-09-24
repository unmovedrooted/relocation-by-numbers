import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { northCarolinaTax } from "./northCarolinaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "nc", stateTreatment: "verified-resident-location",
    northCarolinaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted North Carolina annual settlement", () => {
  it("applies the flat 4.25% rate net of the standard deduction, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const nc = estimateHouseholdTax(terms);
    expect(nc.stateTax).toBeCloseTo((40000 - 12750) * 0.0425, 6);
    expect(nc.localTax).toBe(0);
  });

  it("doubles the standard deduction for married filing jointly", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const nc = estimateHouseholdTax(terms);
    expect(nc.stateTax).toBeCloseTo((60000 - 25500) * 0.0425, 6);
  });

  it("excludes Social Security from the North Carolina tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("does not exclude pension income at any owner age, even a federal-government pension", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 20000, pensionType: "federal-government" }] });
    const nc = northCarolinaTax(terms, 20000, 0);
    // Not excluded: taxable = 20000 - 12750 = 7250.
    expect(nc.stateTax).toBeCloseTo((20000 - 12750) * 0.0425, 6);
  });

  it("requires explicit confirmation of the restricted North Carolina assumptions", () => {
    expect(() => northCarolinaTax(input({ northCarolinaContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => northCarolinaTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "nc", ncContract: "confirmed" };
    const nc = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(nc.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(nc.years[0].result.tax.localTax).toBe(0);
    expect(nc.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(nc.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit North Carolina confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "nc" })).toThrow(/Confirm/);
  });
});
