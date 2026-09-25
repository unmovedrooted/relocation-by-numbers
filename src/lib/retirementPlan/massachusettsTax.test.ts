import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { massachusettsTax } from "./massachusettsTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ma", stateTreatment: "verified-resident-location",
    massachusettsContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Massachusetts annual settlement", () => {
  it("applies the flat 5% rate net of the single personal exemption, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ma = estimateHouseholdTax(terms);
    expect(ma.stateTax).toBeCloseTo((80000 - 4400) * 0.05, 6);
    expect(ma.localTax).toBe(0);
  });

  it("gives married filers the joint exemption, not doubled per person", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const ma = estimateHouseholdTax(terms);
    expect(ma.stateTax).toBeCloseTo((100000 - 8800) * 0.05, 6);
  });

  it("adds $700 per owner 65 or older and $2,200 per legally blind owner", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: true, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ma = massachusettsTax(terms, 80000, 0);
    expect(ma.exemptions).toBe(4400 + 700 + 2200);
  });

  it("excludes Social Security from the Massachusetts tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("applies the additional 4% Fair Share surtax above $1,107,750, not doubled for married filers", () => {
    const single = input({ income: [{ ownerId: "one", kind: "wages", amount: 1200000 }] });
    const ma = massachusettsTax(single, 1200000, 0);
    const taxable = 1200000 - 4400;
    const surtax = (taxable - 1107750) * 0.04;
    expect(ma.stateTax).toBeCloseTo(taxable * 0.05 + surtax, 6);
  });

  it("excludes a federal or other-government contributory pension from the tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", pensionType: "federal-government", amount: 30000 }] });
    const ma = massachusettsTax(terms, 30000, 0);
    expect(ma.pensionExclusion).toBe(30000);
    expect(ma.stateTax).toBe(0);
  });

  it("keeps a private or unspecified pension fully taxable", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", pensionType: "private", amount: 30000 }] });
    const ma = massachusettsTax(terms, 30000, 0);
    expect(ma.pensionExclusion).toBe(0);
    expect(ma.stateTax).toBeCloseTo((30000 - 4400) * 0.05, 6);
  });

  it("requires explicit confirmation of the restricted Massachusetts assumptions", () => {
    expect(() => massachusettsTax(input({ massachusettsContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => massachusettsTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ma", maContract: "confirmed" };
    const ma = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ma.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ma.years[0].result.tax.localTax).toBe(0);
    expect(ma.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ma.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Massachusetts confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ma" })).toThrow(/Confirm/);
  });
});
