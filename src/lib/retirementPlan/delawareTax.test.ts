import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { delawareTax } from "./delawareTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "de", stateTreatment: "verified-resident-location",
    delawareContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number) {
  const ceilings = [2000, 5000, 10000, 20000, 25000, 60000, Infinity];
  const rates = [0, .022, .039, .048, .052, .0555, .066];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

describe("restricted Delaware annual settlement", () => {
  it("applies the graduated schedule after the standard deduction and $110 personal credit", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const de = estimateHouseholdTax(terms);
    const taxable = 80000 - 3250;
    expect(de.stateTax).toBeCloseTo(Math.max(0, bracketTax(taxable) - 110), 6);
    expect(de.localTax).toBe(0);
  });

  it("uses the doubled married standard deduction and personal credit", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const de = estimateHouseholdTax(terms);
    const taxable = 100000 - 6500;
    expect(de.stateTax).toBeCloseTo(Math.max(0, bracketTax(taxable) - 220), 6);
  });

  it("adds $2,500 to the standard deduction per condition (65+ and blind, separately) up to $5,000 per person", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: true, eligibleForSeniorDeduction: true }] });
    const de = delawareTax(terms, 0, 0, 0);
    expect(de.standardDeduction).toBe(3250 + 2500 + 2500);
  });

  it("adds a separate $110 credit for a taxpayer or spouse 60 or older", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1960-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    const de = delawareTax(terms, 0, 0, 0);
    expect(de.personalCredit).toBe(110 + 110);
  });

  it("excludes Social Security from the Delaware tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("excludes up to $12,500 of pension plus retirement-ordinary for an owner 60 or older", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1960-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 5000 }] });
    const de = delawareTax(terms, 20000, 0, 20000);
    expect(de.pensionExclusion).toBe(12500);
  });

  it("caps an under-60 owner's exclusion at $2,000 of their own pension only", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000 }] });
    const de = delawareTax(terms, 20000, 0, 20000);
    expect(de.pensionExclusion).toBe(2000);
  });

  it("requires explicit confirmation of the restricted Delaware assumptions", () => {
    expect(() => delawareTax(input({ delawareContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => delawareTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "de", deContract: "confirmed" };
    const de = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(de.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(de.years[0].result.tax.localTax).toBe(0);
    expect(de.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(de.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Delaware confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "de" })).toThrow(/Confirm/);
  });
});
