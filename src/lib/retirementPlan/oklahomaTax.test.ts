import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { oklahomaTax } from "./oklahomaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ok", stateTreatment: "verified-resident-location",
    oklahomaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number, ceilings: number[]) {
  const rates = [.0025, .0075, .0175, .0275, .0375, .0475];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

describe("restricted Oklahoma annual settlement", () => {
  it("applies the graduated schedule after the standard deduction and $1,000 personal exemption", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const ok = estimateHouseholdTax(terms);
    const taxable = 60000 - 6350 - 1000;
    expect(ok.stateTax).toBeCloseTo(bracketTax(taxable, [1000, 2500, 3750, 4900, 7200, Infinity]), 6);
    expect(ok.localTax).toBe(0);
  });

  it("doubles the married bracket thresholds, standard deduction and exemption", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 90000 }] });
    const ok = estimateHouseholdTax(terms);
    const taxable = 90000 - 12700 - 2000;
    expect(ok.stateTax).toBeCloseTo(bracketTax(taxable, [2000, 5000, 7500, 9800, 14400, Infinity]), 6);
  });

  it("exactly reconciles the packet's own $100,000-and-over tax computation worksheet constants", () => {
    const single = oklahomaTax(input(), 100000 + 6350 + 1000, 0, 0);
    expect(single.stateTax).toBeCloseTo(4562, -1);
    const marriedTerms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const married = oklahomaTax(marriedTerms, 100000 + 12700 + 2000, 0, 0);
    expect(married.stateTax).toBeCloseTo(4373, 0);
  });

  it("excludes Social Security from the Oklahoma tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = oklahomaTax(terms, 60000, 0, 0);
    const withSs = oklahomaTax(terms, 78000, 18000, 0);
    expect(withSs.okAgi).toBe(withoutSs.okAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("caps a combined pension and retirement-ordinary exclusion at $10,000 per owner, at any age", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000, pensionType: "private" }] });
    const ok = oklahomaTax(terms, 30000, 0, 20000);
    expect(ok.retirementExclusion).toBe(10000);
  });

  it("adds a further $1,000 special exemption per owner 65 or older when household Federal AGI is low enough", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    const low = oklahomaTax(terms, 14000, 0, 0);
    expect(low.stateTax).toBeCloseTo(bracketTax(14000 - 6350 - 2000, [1000, 2500, 3750, 4900, 7200, Infinity]), 6);
    const high = oklahomaTax(terms, 20000, 0, 0);
    expect(high.stateTax).toBeCloseTo(bracketTax(20000 - 6350 - 1000, [1000, 2500, 3750, 4900, 7200, Infinity]), 6);
  });

  it("requires explicit confirmation of the restricted Oklahoma assumptions", () => {
    expect(() => oklahomaTax(input({ oklahomaContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => oklahomaTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ok", okContract: "confirmed" };
    const ok = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ok.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ok.years[0].result.tax.localTax).toBe(0);
    expect(ok.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ok.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Oklahoma confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ok" })).toThrow(/Confirm/);
  });
});
