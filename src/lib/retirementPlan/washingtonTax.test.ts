import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { washingtonTax } from "./washingtonTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "wa", stateTreatment: "verified-resident-location",
    washingtonContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Washington annual settlement", () => {
  it("taxes long-term capital gains above the $278,000 deduction at 7%", () => {
    const terms = input({ accountIncome: taxCharacter({ longTermGain: 400000 }) });
    const wa = estimateHouseholdTax(terms);
    expect(wa.stateTax).toBeCloseTo((400000 - 278000) * 0.07, 6);
    expect(wa.localTax).toBe(0);
  });

  it("adds the 2.9% surtax above $1,000,000 of taxable gain", () => {
    const wa = washingtonTax(input(), 1500000);
    const taxable = 1500000 - 278000;
    expect(wa.stateTax).toBeCloseTo(taxable * 0.07 + (taxable - 1000000) * 0.029, 6);
  });

  it("does not double the deduction for married filers", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], accountIncome: taxCharacter({ longTermGain: 400000 }) });
    const wa = estimateHouseholdTax(terms);
    expect(wa.stateTax).toBeCloseTo((400000 - 278000) * 0.07, 6);
  });

  it("does not tax short-term gains, wages, pensions or Social Security", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 },
      { ownerId: "one", kind: "pension", amount: 20000 }, { ownerId: "one", kind: "social-security", amount: 20000 }],
      accountIncome: taxCharacter({ shortTermGain: 500000, retirementOrdinary: 50000 }) });
    const wa = washingtonTax(terms, 0);
    expect(wa.stateTax).toBe(0);
  });

  it("results in zero tax for a net long-term capital loss", () => {
    const wa = washingtonTax(input(), -50000);
    expect(wa.stateTax).toBe(0);
  });

  it("requires explicit confirmation of the restricted Washington assumptions", () => {
    expect(() => washingtonTax(input({ washingtonContract: undefined }), 400000)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => washingtonTax(input({ year: 2025 }), 400000)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "wa", waContract: "confirmed" };
    const wa = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(wa.years[0].result.tax.stateTax).toBe(0);
    expect(wa.years[0].result.tax.localTax).toBe(0);
    expect(wa.years[0].endingPortfolio).toBe(florida.years[0].endingPortfolio);
    expect(wa.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Washington confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "wa" })).toThrow(/Confirm/);
  });
});
