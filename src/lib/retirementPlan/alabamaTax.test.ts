import { describe, it, expect } from "vitest";
import type { HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { alabamaTax } from "./alabamaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "al", stateTreatment: "verified-resident-location",
    alabamaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Alabama annual settlement", () => {
  it("applies the graduated 2%/4%/5% brackets net of the standard deduction, personal exemption and federal tax deduction", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const al = alabamaTax(terms, 40000, 0, 0, 0, 0);
    const alAgi = 40000;
    const deduction = al.standardDeduction;
    const taxable = Math.max(0, alAgi - deduction - 1500 - al.federalTaxDeduction);
    const bracketTax = Math.min(taxable, 500) * 0.02 + Math.max(0, Math.min(taxable, 3000) - 500) * 0.04 + Math.max(0, taxable - 3000) * 0.05;
    expect(al.stateTax).toBeCloseTo(bracketTax, 6);
    expect(al.localTax).toBe(0);
  });

  it("phases the standard deduction down as Alabama AGI rises, to a floor", () => {
    const low = alabamaTax(input({ income: [{ ownerId: "one", kind: "wages", amount: 20000 }] }), 20000, 0, 0, 0, 0);
    const high = alabamaTax(input({ income: [{ ownerId: "one", kind: "wages", amount: 100000 }] }), 100000, 0, 0, 0, 0);
    expect(low.standardDeduction).toBe(3000);
    expect(high.standardDeduction).toBe(2500);
  });

  it("doubles the bracket breakpoints and standard deduction ceiling for married filers", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const al = alabamaTax(terms, 20000, 0, 0, 0, 0);
    expect(al.standardDeduction).toBe(8500);
  });

  it("excludes Social Security from the Alabama tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = alabamaTax(terms, 60000, 0, 0, 0, 0);
    const withSs = alabamaTax(terms, 78000, 18000, 0, 0, 0);
    expect(withSs.alAgi).toBe(withoutSs.alAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("fully excludes pension income regardless of pensionType", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000 }] });
    const al = alabamaTax(terms, 30000, 0, 0, 0, 0);
    expect(al.alAgi).toBe(0);
    expect(al.stateTax).toBe(0);
  });

  it("subtracts the uncapped federal income tax deduction", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const withoutFederal = alabamaTax(terms, 60000, 0, 0, 0, 0);
    const withFederal = alabamaTax(terms, 60000, 0, 8000, 0, 0);
    expect(withFederal.federalTaxDeduction).toBe(8000);
    expect(withFederal.stateTax).toBeLessThan(withoutFederal.stateTax);
  });

  it("requires explicit confirmation of the restricted Alabama assumptions", () => {
    expect(() => alabamaTax(input({ alabamaContract: undefined }), 0, 0, 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => alabamaTax(input({ year: 2025 }), 0, 0, 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "al", alContract: "confirmed" };
    const al = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(al.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(al.years[0].result.tax.localTax).toBe(0);
    expect(al.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(al.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Alabama confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "al" })).toThrow(/Confirm/);
  });
});
