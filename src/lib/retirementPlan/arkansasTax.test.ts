import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { arkansasTax } from "./arkansasTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ar", stateTreatment: "verified-resident-location",
    arkansasContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number) {
  const ceilings = [5600, 11200, 16000, 26400, Infinity];
  const rates = [0, .02, .03, .034, .037];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

describe("restricted Arkansas annual settlement", () => {
  it("applies the Act 1 (2026S1) upper table and bracket adjustment above $94,700 net income", () => {
    const gross = (taxable: number) => arkansasTax(input(), taxable + 2470, 0, 0, 0).stateTax + 29;
    const upper = (taxable: number) => 94 + .037 * (taxable - 4700);
    expect(gross(94700)).toBeCloseTo(bracketTax(94700), 6);
    expect(gross(94701)).toBeCloseTo(upper(94701) - 290, 6);
    expect(gross(94800)).toBeCloseTo(upper(94800) - 290, 6);
    expect(gross(94801)).toBeCloseTo(upper(94801) - 280, 6);
    expect(gross(96000)).toBeCloseTo(upper(96000) - 170, 6);
    expect(gross(97600)).toBeCloseTo(upper(97600) - 10, 6);
    expect(gross(97601)).toBeCloseTo(upper(97601), 6);
    expect(gross(250000)).toBeCloseTo(94 + .037 * 245300, 6);
    // The upper table recaptures the lower-bracket benefit: $287.30 more than the graduated schedule at the same income.
    expect(gross(250000) - bracketTax(250000)).toBeCloseTo(287.3, 6);
    // The adjustment steps down $10 per $100 band, so tax rises $10.037 across the last band edge and the first.
    expect(gross(97601) - gross(97600)).toBeCloseTo(10.037, 6);
    expect(gross(94801) - gross(94800)).toBeCloseTo(10.037, 6);
  });

  it("applies the graduated schedule after the standard deduction and $29 personal credit", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const ar = estimateHouseholdTax(terms);
    const taxable = 60000 - 2470;
    expect(ar.stateTax).toBeCloseTo(Math.max(0, bracketTax(taxable) - 29), 6);
    expect(ar.localTax).toBe(0);
  });

  it("uses the doubled married standard deduction and personal credit", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ar = estimateHouseholdTax(terms);
    const taxable = 80000 - 4940;
    expect(ar.stateTax).toBeCloseTo(Math.max(0, bracketTax(taxable) - 58), 6);
  });

  it("adds a separate $29 credit per taxpayer or spouse who is legally blind", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1975-01-01", blind: true, eligibleForSeniorDeduction: true }] });
    const ar = arkansasTax(terms, 0, 0, 0, 0);
    expect(ar.personalCredit).toBe(29 + 29);
  });

  it("excludes Social Security from the Arkansas tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("caps the combined pension and retirement-ordinary exclusion at $6,000 per owner", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 3000 }] });
    const ar = arkansasTax({ ...terms, retirementIncome: [{ ownerId: "one", source: "traditional-ira", date: "2026-07-01", amount: 6000 }] }, 30000, 0, 6000, 0);
    expect(ar.retirementExclusion).toBe(6000);
  });

  it("excludes the retirement-ordinary figure except the early-distribution-penalty base", () => {
    const ar = arkansasTax(input({ retirementIncome: [{ ownerId: "one", source: "traditional-ira", date: "2026-07-01", amount: 8000, earlyDistributionTaxable: 2000 }] }), 30000, 0, 8000, 2000);
    expect(ar.retirementExclusion).toBe(6000);
  });

  it("requires explicit confirmation of the restricted Arkansas assumptions", () => {
    expect(() => arkansasTax(input({ arkansasContract: undefined }), 0, 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => arkansasTax(input({ year: 2025 }), 0, 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ar", arContract: "confirmed" };
    const ar = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ar.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ar.years[0].result.tax.localTax).toBe(0);
    expect(ar.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ar.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Arkansas confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ar" })).toThrow(/Confirm/);
  });
});
