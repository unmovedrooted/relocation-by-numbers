import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { illinoisTax } from "./illinoisTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "il", stateTreatment: "verified-resident-location",
    illinoisContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Illinois annual settlement", () => {
  it("computes the exact flat 4.95% tax on wages, with no local tax", () => {
    // Taxable = 80000 - 2925 = 77075. Tax: 77075*.0495 = 3815.2125.
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const il = estimateHouseholdTax(terms);
    expect(il.stateTax).toBeCloseTo(3815.2125, 6);
    expect(il.localTax).toBe(0);
  });

  it("uses the married exemption allowance", () => {
    // Taxable = 200000 - 5850 = 194150. Tax: 194150*.0495 = 9610.425.
    const terms = input({ filing: "married", people: [...input().people, { ...input().people[0], id: "two" }],
      income: [{ ownerId: "one", kind: "wages", amount: 200000 }] });
    expect(illinoisTax(terms, 200000, 0, 0).stateTax).toBeCloseTo(9610.425, 6);
  });

  it("fully excludes Social Security from Illinois AGI", () => {
    const withSS = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }, { ownerId: "one", kind: "social-security", amount: 30000 }] });
    const il = estimateHouseholdTax(withSS);
    expect(il.taxableBenefits).toBeGreaterThan(0);
    expect(il.stateTax).toBeCloseTo(3815.2125, 6); // unchanged from the no-SS case.
  });

  it("fully excludes pension income at any owner age, with no age test", () => {
    // A 40-year-old owner's pension income is still fully subtracted.
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 50000 }] });
    const il = illinoisTax(terms, 50000, 0, 0);
    expect(il.ilAgi).toBe(0);
    expect(il.stateTax).toBe(0);
  });

  it("fully excludes retirement-account (401k/IRA/annuity) distributions", () => {
    const terms = input({});
    const il = illinoisTax(terms, 40000, 0, 40000);
    expect(il.ilAgi).toBe(0);
    expect(il.stateTax).toBe(0);
  });

  it("grants an additional $1,000 exemption for age 65 or blindness, stacking both", () => {
    // Base 2925 + 1000 age + 1000 blind = 4925. Taxable = 80000-4925 = 75075. Tax: 75075*.0495 = 3716.2125.
    const terms = input({ people: [{ ...input().people[0], birthDate: "1955-01-01", blind: true }], // turns 71 in 2026.
      income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    expect(illinoisTax(terms, 80000, 0, 0).stateTax).toBeCloseTo(3716.2125, 6);
  });

  it("eliminates the entire exemption allowance above the federal AGI cliff", () => {
    const overCliff = input({ income: [{ ownerId: "one", kind: "wages", amount: 260000 }] });
    // No exemption at all: taxable = 260000. Tax: 260000*.0495 = 12870.
    expect(illinoisTax(overCliff, 260000, 0, 0).stateTax).toBeCloseTo(12870, 6);

    const underCliff = input({ income: [{ ownerId: "one", kind: "wages", amount: 250000 }] });
    expect(illinoisTax(underCliff, 250000, 0, 0).stateTax).toBeCloseTo((250000 - 2925) * .0495, 6);
  });

  it("eliminates the married exemption only above the $500,000 married cliff", () => {
    const terms = input({ filing: "married", people: [...input().people, { ...input().people[0], id: "two" }] });
    expect(illinoisTax(terms, 500000, 0, 0).stateTax).toBeCloseTo((500000 - 5850) * .0495, 6);
    expect(illinoisTax(terms, 500001, 0, 0).stateTax).toBeCloseTo(500001 * .0495, 6);
  });

  it("requires explicit confirmation of the restricted Illinois assumptions", () => {
    expect(() => illinoisTax(input({ illinoisContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => illinoisTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "il", ilContract: "confirmed" };
    const il = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(il.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(il.years[0].result.tax.localTax).toBe(0);
    expect(il.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(il.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Illinois confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "il" })).toThrow(/Confirm/);
  });
});
