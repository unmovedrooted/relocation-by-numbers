import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { kansasTax } from "./kansasTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ks", stateTreatment: "verified-resident-location",
    kansasContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Kansas annual settlement", () => {
  it("applies the graduated 5.2%/5.58% brackets net of the standard deduction and exemption allowance", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const ks = estimateHouseholdTax(terms);
    const taxable = 60000 - 3605 - 9160;
    const bracketTax = Math.min(taxable, 23000) * 0.052 + Math.max(0, taxable - 23000) * 0.0558;
    expect(ks.stateTax).toBeCloseTo(bracketTax, 6);
    expect(ks.localTax).toBe(0);
  });

  it("uses the doubled married bracket threshold, standard deduction and exemption", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ks = estimateHouseholdTax(terms);
    const taxable = 80000 - 8240 - 18320;
    const bracketTax = Math.min(taxable, 46000) * 0.052 + Math.max(0, taxable - 46000) * 0.0558;
    expect(ks.stateTax).toBeCloseTo(bracketTax, 6);
  });

  it("adds $850 (single) per condition -- 65 or older or blind -- to the standard deduction", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: true, eligibleForSeniorDeduction: true }] });
    const ks = kansasTax(terms, 0, 0);
    expect(ks.standardDeduction).toBe(3605 + 850 + 850);
  });

  it("excludes Social Security from the Kansas tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = kansasTax(terms, 60000, 0);
    const withSs = kansasTax(terms, 78000, 18000);
    expect(withSs.ksAgi).toBe(withoutSs.ksAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("fully excludes pension income with a government pensionType", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "federal-government" }] });
    const ks = kansasTax(terms, 30000, 0);
    expect(ks.ksAgi).toBe(0);
    expect(ks.stateTax).toBe(0);
  });

  it("fully taxes a private or unspecified pension", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "private" }] });
    const ks = kansasTax(terms, 30000, 0);
    expect(ks.ksAgi).toBe(30000);
  });

  it("requires explicit confirmation of the restricted Kansas assumptions", () => {
    expect(() => kansasTax(input({ kansasContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => kansasTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ks", ksContract: "confirmed" };
    const ks = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ks.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ks.years[0].result.tax.localTax).toBe(0);
    expect(ks.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ks.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Kansas confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ks" })).toThrow(/Confirm/);
  });
});
