import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { louisianaTax } from "./louisianaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "la", stateTreatment: "verified-resident-location",
    louisianaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Louisiana annual settlement", () => {
  it("applies the flat 3% rate net of the standard deduction", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const la = estimateHouseholdTax(terms);
    expect(la.stateTax).toBeCloseTo((60000 - 12500) * 0.03, 6);
    expect(la.localTax).toBe(0);
  });

  it("uses the doubled married standard deduction", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 90000 }] });
    const la = estimateHouseholdTax(terms);
    expect(la.stateTax).toBeCloseTo((90000 - 25000) * 0.03, 6);
  });

  it("excludes Social Security from the Louisiana tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = louisianaTax(terms, 60000, 0, 0);
    const withSs = louisianaTax(terms, 78000, 18000, 0);
    expect(withSs.laAgi).toBe(withoutSs.laAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("fully excludes pension income with a government pensionType at any age", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "federal-government" }] });
    const la = louisianaTax(terms, 30000, 0, 0);
    expect(la.laAgi).toBe(0);
  });

  it("excludes a private pension and retirement-ordinary aggregate up to $12,000 for an owner 65 or older", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 5000, pensionType: "private" }] });
    const la = louisianaTax(terms, 25000, 0, 20000);
    expect(la.retirementExemption).toBe(12000);
  });

  it("does not extend the private pension exemption to an owner under 65", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000, pensionType: "private" }] });
    const la = louisianaTax(terms, 25000, 0, 20000);
    expect(la.retirementExemption).toBe(0);
  });

  it("requires explicit confirmation of the restricted Louisiana assumptions", () => {
    expect(() => louisianaTax(input({ louisianaContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => louisianaTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "la", laContract: "confirmed" };
    const la = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(la.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(la.years[0].result.tax.localTax).toBe(0);
    expect(la.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(la.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Louisiana confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "la" })).toThrow(/Confirm/);
  });
});
