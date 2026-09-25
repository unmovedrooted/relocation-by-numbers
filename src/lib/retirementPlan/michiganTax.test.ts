import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { michiganTax } from "./michiganTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "mi", stateTreatment: "verified-resident-location",
    michiganContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Michigan annual settlement", () => {
  it("applies the flat 4.25% rate net of the personal exemption", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const mi = estimateHouseholdTax(terms);
    expect(mi.stateTax).toBeCloseTo((60000 - 5600) * 0.0425, 6);
    expect(mi.localTax).toBe(0);
  });

  it("doubles the personal exemption for a two-person married household", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const mi = estimateHouseholdTax(terms);
    expect(mi.stateTax).toBeCloseTo((100000 - 5600 * 2) * 0.0425, 6);
  });

  it("excludes Social Security at any income level", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = michiganTax(terms, 60000, 0, 0);
    const withSs = michiganTax(terms, 78000, 18000, 0);
    expect(withSs.miAgi).toBe(withoutSs.miAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("excludes pension income and the retirement-ordinary aggregate up to a combined cap, at any age", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 20000, pensionType: "private" }] });
    const mi = michiganTax(terms, 50000, 0, 20000);
    expect(mi.retirementSubtraction).toBe(40000);
  });

  it("caps the combined retirement subtraction at $67,610 single", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 50000, pensionType: "private" }] });
    const mi = michiganTax(terms, 100000, 0, 30000);
    expect(mi.retirementSubtraction).toBe(67610);
  });

  it("requires explicit confirmation of the restricted Michigan assumptions", () => {
    expect(() => michiganTax(input({ michiganContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => michiganTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "mi", miContract: "confirmed" };
    const mi = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(mi.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(mi.years[0].result.tax.localTax).toBe(0);
    expect(mi.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(mi.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Michigan confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "mi" })).toThrow(/Confirm/);
  });
});
