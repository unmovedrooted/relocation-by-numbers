import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { wisconsinTax } from "./wisconsinTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "wi", stateTreatment: "verified-resident-location",
    wisconsinContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number, ceilings: number[]) {
  const rates = [.035, .044, .053, .0765];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

function standardDeduction(wiAgi: number, max: number, rate: number, threshold: number) {
  return Math.min(max, Math.max(0, max - rate * Math.max(0, wiAgi - threshold)));
}

describe("restricted Wisconsin annual settlement", () => {
  it("applies the graduated schedule after the phased standard deduction and $700 personal exemption", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const wi = estimateHouseholdTax(terms);
    const deduction = standardDeduction(60000, 13560, 0.12, 19300);
    const taxable = 60000 - deduction - 700;
    expect(wi.stateTax).toBeCloseTo(bracketTax(taxable, [14680, 50480, 323290, Infinity]), 4);
    expect(wi.localTax).toBe(0);
  });

  it("uses the married bracket schedule, phased standard deduction and exemption", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 90000 }] });
    const wi = estimateHouseholdTax(terms);
    const deduction = standardDeduction(90000, 25110, 0.19778, 28204);
    const taxable = 90000 - deduction - 1400;
    expect(wi.stateTax).toBeCloseTo(bracketTax(taxable, [19580, 67300, 431060, Infinity]), 4);
  });

  it("gives the maximum standard deduction below the phase-out threshold", () => {
    const wi = wisconsinTax(input({ income: [{ ownerId: "one", kind: "wages", amount: 15000 }] }), 15000, 0, 0);
    expect(wi.standardDeduction).toBe(13560);
  });

  it("excludes Social Security at any income level", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = wisconsinTax(terms, 60000, 0, 0);
    const withSs = wisconsinTax(terms, 78000, 18000, 0);
    expect(withSs.wiAgi).toBe(withoutSs.wiAgi);
  });

  it("excludes an owner 67 or older's own pension plus a share of the retirement-ordinary aggregate up to $24,000", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 30000 }] });
    const wi = wisconsinTax(terms, 50000, 0, 20000);
    expect(wi.retirementSubtraction).toBe(24000);
  });

  it("does not extend the retirement subtraction to an owner under 67", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000 }] });
    const wi = wisconsinTax(terms, 50000, 0, 20000);
    expect(wi.retirementSubtraction).toBe(0);
  });

  it("requires explicit confirmation of the restricted Wisconsin assumptions", () => {
    expect(() => wisconsinTax(input({ wisconsinContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => wisconsinTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "wi", wiContract: "confirmed" };
    const wi = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(wi.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(wi.years[0].result.tax.localTax).toBe(0);
    expect(wi.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(wi.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Wisconsin confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "wi" })).toThrow(/Confirm/);
  });
});
