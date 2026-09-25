import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { nebraskaTax } from "./nebraskaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ne", stateTreatment: "verified-resident-location",
    nebraskaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number, ceilings: number[]) {
  const rates = [.0246, .0351, .044, .0455];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

describe("restricted Nebraska annual settlement", () => {
  it("applies the graduated schedule after the standard deduction and $171 personal credit", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const ne = estimateHouseholdTax(terms);
    const taxable = 60000 - 8600;
    expect(ne.stateTax).toBeCloseTo(Math.max(0, bracketTax(taxable, [3990, 23930, 38580, Infinity]) - 171), 6);
    expect(ne.localTax).toBe(0);
  });

  it("doubles the married bracket breakpoints, standard deduction and personal credit", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 90000 }] });
    const ne = estimateHouseholdTax(terms);
    const taxable = 90000 - 17200;
    expect(ne.stateTax).toBeCloseTo(Math.max(0, bracketTax(taxable, [7980, 47860, 77160, Infinity]) - 342), 6);
  });

  it("adds $2,000 (single) per condition -- 65 or older or blind -- to the standard deduction", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: true, eligibleForSeniorDeduction: true }] });
    const ne = nebraskaTax(terms, 0, 0);
    expect(ne.standardDeduction).toBe(8600 + 2000 + 2000);
  });

  it("excludes Social Security from the Nebraska tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = nebraskaTax(terms, 60000, 0);
    const withSs = nebraskaTax(terms, 78000, 18000);
    expect(withSs.neAgi).toBe(withoutSs.neAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("fully taxes pension income and the retirement-ordinary aggregate", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "federal-government" }] });
    const ne = nebraskaTax(terms, 30000, 0);
    expect(ne.neAgi).toBe(30000);
  });

  it("requires explicit confirmation of the restricted Nebraska assumptions", () => {
    expect(() => nebraskaTax(input({ nebraskaContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => nebraskaTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ne", neContract: "confirmed" };
    const ne = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ne.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ne.years[0].result.tax.localTax).toBe(0);
    expect(ne.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ne.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Nebraska confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ne" })).toThrow(/Confirm/);
  });
});
