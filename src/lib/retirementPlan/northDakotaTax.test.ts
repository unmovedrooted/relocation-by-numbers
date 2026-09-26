import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { northDakotaTax } from "./northDakotaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "nd", stateTreatment: "verified-resident-location",
    northDakotaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number, ceilings: number[]) {
  const rates = [0, .0195, .025];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

describe("restricted North Dakota annual settlement", () => {
  it("applies the three-tier schedule directly to federal taxable income, with no state standard deduction", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 300000 }] });
    const nd = estimateHouseholdTax(terms);
    expect(nd.stateTax).toBeCloseTo(bracketTax(nd.taxableIncome, [48475, 244825, Infinity]), 4);
    expect(nd.localTax).toBe(0);
  });

  it("uses the married bracket schedule", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 90000 }] });
    const nd = estimateHouseholdTax(terms);
    expect(nd.stateTax).toBeCloseTo(bracketTax(nd.taxableIncome, [80975, 298075, Infinity]), 4);
  });

  it("excludes Social Security and Tier 1 Railroad Retirement from the North Dakota tax base", () => {
    const nd = northDakotaTax(input(), 100000, 20000, 0);
    expect(nd.ndTaxableIncome).toBe(80000);
  });

  it("excludes 40% of the combined preferential-rate (qualified dividend and net long-term capital gain) income", () => {
    const nd = northDakotaTax(input(), 100000, 0, 30000);
    expect(nd.preferentialExclusion).toBe(12000);
    expect(nd.ndTaxableIncome).toBe(88000);
  });

  it("requires explicit confirmation of the restricted North Dakota assumptions", () => {
    expect(() => northDakotaTax(input({ northDakotaContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => northDakotaTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "nd", ndContract: "confirmed" };
    const nd = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(nd.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(nd.years[0].result.tax.localTax).toBe(0);
    expect(nd.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(nd.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit North Dakota confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "nd" })).toThrow(/Confirm/);
  });
});
