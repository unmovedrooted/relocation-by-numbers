import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { arizonaTax } from "./arizonaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "az", stateTreatment: "verified-resident-location",
    arizonaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Arizona annual settlement", () => {
  it("applies the flat 2.5% rate net of the standard deduction, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const az = estimateHouseholdTax(terms);
    expect(az.stateTax).toBeCloseTo((40000 - 15750) * 0.025, 6);
    expect(az.localTax).toBe(0);
  });

  it("doubles the standard deduction for married filing jointly", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const az = estimateHouseholdTax(terms);
    expect(az.stateTax).toBeCloseTo((60000 - 31500) * 0.025, 6);
  });

  it("excludes Social Security from the Arizona tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("excludes up to $2,500 of a federal-government pension per owner", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000, pensionType: "federal-government" }] });
    const az = arizonaTax(terms, 5000, 0);
    expect(az.pensionSubtraction).toBe(2500);
  });

  it("excludes up to $2,500 of an other-government pension per owner", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 1500, pensionType: "other-government" }] });
    const az = arizonaTax(terms, 1500, 0);
    expect(az.pensionSubtraction).toBe(1500);
  });

  it("does not exclude a private or unspecified pension", () => {
    const privatePension = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000, pensionType: "private" }] });
    const unspecified = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000, pensionType: "unspecified" }] });
    expect(arizonaTax(privatePension, 5000, 0).pensionSubtraction).toBe(0);
    expect(arizonaTax(unspecified, 5000, 0).pensionSubtraction).toBe(0);
  });

  it("sums the per-owner government pension exclusion for a married couple", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [
      { ownerId: "one", kind: "pension", amount: 5000, pensionType: "federal-government" },
      { ownerId: "two", kind: "pension", amount: 5000, pensionType: "other-government" },
    ] });
    const az = arizonaTax(terms, 10000, 0);
    expect(az.pensionSubtraction).toBe(5000);
  });

  it("requires explicit confirmation of the restricted Arizona assumptions", () => {
    expect(() => arizonaTax(input({ arizonaContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => arizonaTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "az", azContract: "confirmed" };
    const az = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(az.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(az.years[0].result.tax.localTax).toBe(0);
    expect(az.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(az.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Arizona confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "az" })).toThrow(/Confirm/);
  });
});
