import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { kentuckyTax } from "./kentuckyTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ky", stateTreatment: "verified-resident-location",
    kentuckyContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Kentucky annual settlement", () => {
  it("applies the flat 3.5% rate net of the standard deduction", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const ky = estimateHouseholdTax(terms);
    expect(ky.stateTax).toBeCloseTo((60000 - 3360) * 0.035, 6);
    expect(ky.localTax).toBe(0);
  });

  it("doubles the standard deduction for a two-person married household", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const ky = estimateHouseholdTax(terms);
    expect(ky.stateTax).toBeCloseTo((100000 - 3360 * 2) * 0.035, 6);
  });

  it("excludes Social Security from the Kentucky tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = kentuckyTax(terms, 60000, 0, 0);
    const withSs = kentuckyTax(terms, 78000, 18000, 0);
    expect(withSs.kyAgi).toBe(withoutSs.kyAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("caps the combined pension and retirement-ordinary exclusion at $31,110 per owner", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 20000 }] });
    const ky = kentuckyTax(terms, 50000, 0, 20000);
    expect(ky.pensionExclusion).toBe(31110);
  });

  it("gives each owner in a married household their own $31,110 exclusion", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "pension", amount: 40000 }, { ownerId: "two", kind: "pension", amount: 40000 }] });
    const ky = kentuckyTax(terms, 80000, 0, 0);
    expect(ky.pensionExclusion).toBe(31110 * 2);
  });

  it("requires explicit confirmation of the restricted Kentucky assumptions", () => {
    expect(() => kentuckyTax(input({ kentuckyContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => kentuckyTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ky", kyContract: "confirmed" };
    const ky = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ky.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ky.years[0].result.tax.localTax).toBe(0);
    expect(ky.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ky.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Kentucky confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ky" })).toThrow(/Confirm/);
  });
});
