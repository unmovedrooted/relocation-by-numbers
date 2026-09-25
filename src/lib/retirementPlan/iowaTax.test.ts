import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { iowaTax } from "./iowaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ia", stateTreatment: "verified-resident-location",
    iowaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Iowa annual settlement", () => {
  it("applies the flat 3.8% rate to federal taxable income, net of the $40 personal credit, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ia = estimateHouseholdTax(terms);
    const federalTaxableIncome = 80000 - 16100;
    expect(ia.stateTax).toBeCloseTo(federalTaxableIncome * 0.038 - 40, 6);
    expect(ia.localTax).toBe(0);
  });

  it("gives married filers the $80 personal credit instead of $40", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const ia = estimateHouseholdTax(terms);
    const federalTaxableIncome = 100000 - 32200;
    expect(ia.stateTax).toBeCloseTo(federalTaxableIncome * 0.038 - 80, 6);
  });

  it("adds a separate $20 credit for age 65+ and for legally blind, both usable by the same owner", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: true, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ia = iowaTax(terms, 80000, 0, 80000 - 16100, 0);
    expect(ia.exemptionCredit).toBe(40 + 20 + 20);
  });

  it("excludes Social Security from the Iowa tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("excludes pension and the retirement-ordinary figure for an owner 55 or older", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1965-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 20000 }] });
    const ia = iowaTax(terms, 20000, 0, 20000 - 16100, 30000);
    expect(ia.retirementExclusion).toBe(50000);
    expect(ia.stateTax).toBe(0);
  });

  it("keeps retirement income fully taxable for an owner under 55", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1995-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 20000 }] });
    const ia = iowaTax(terms, 20000, 0, Math.max(0, 20000 - 16100), 0);
    expect(ia.retirementExclusion).toBe(0);
  });

  it("splits the aggregate retirement-ordinary figure evenly between spouses", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1965-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1995-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const ia = iowaTax(terms, 40000, 0, 40000 - 32200, 40000);
    expect(ia.retirementExclusion).toBe(20000);
  });

  it("requires explicit confirmation of the restricted Iowa assumptions", () => {
    expect(() => iowaTax(input({ iowaContract: undefined }), 0, 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => iowaTax(input({ year: 2025 }), 0, 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ia", iaContract: "confirmed" };
    const ia = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ia.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ia.years[0].result.tax.localTax).toBe(0);
    expect(ia.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ia.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Iowa confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ia" })).toThrow(/Confirm/);
  });
});
