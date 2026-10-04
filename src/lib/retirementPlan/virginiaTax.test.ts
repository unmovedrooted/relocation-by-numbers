import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { virginiaTax } from "./virginiaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "va", stateTreatment: "verified-resident-location",
    virginiaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Virginia annual settlement", () => {
  it("follows the 2026 Appropriation Act standard deduction schedule, including the 2030 sunset", () => {
    const person = { id: "one", birthDate: "1990-01-01", blind: false, eligibleForSeniorDeduction: true };
    const two = [person, { ...person, id: "two" }];
    // Taxable income of 40,000 at every step bracket-wise: 60 + 60 + 600 + (taxable - 17,000) x 5.75% above $17,000.
    const tax = (taxable: number) => 720 + (taxable - 17000) * .0575;
    const single = (year: number) => virginiaTax(input({ year, people: [person] }), 40000, 0).stateTax;
    const married = (year: number) => virginiaTax(input({ year, filing: "married", people: two }), 80000, 0).stateTax;
    expect(single(2026)).toBeCloseTo(tax(40000 - 8750 - 930), 6);
    expect(single(2027)).toBeCloseTo(tax(40000 - 9200 - 930), 6);
    expect(single(2028)).toBeCloseTo(tax(40000 - 9300 - 930), 6);
    expect(single(2029)).toBeCloseTo(tax(40000 - 9300 - 930), 6);
    expect(single(2030)).toBeCloseTo(tax(40000 - 3000 - 930), 6);
    expect(single(2044)).toBeCloseTo(tax(40000 - 3000 - 930), 6);
    expect(married(2027)).toBeCloseTo(tax(80000 - 18400 - 1860), 6);
    expect(married(2028)).toBeCloseTo(tax(80000 - 18600 - 1860), 6);
    expect(married(2030)).toBeCloseTo(tax(80000 - 6000 - 1860), 6);
  });

  it("applies the four-bracket schedule net of the standard deduction, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 15000 }] });
    const va = estimateHouseholdTax(terms);
    // Taxable = 15000 - 8750 - 930 = 5320. Tax = 3000*2% + 2000*3% + 320*5% = 60+60+16 = 136.
    expect(va.stateTax).toBeCloseTo(136, 6);
    expect(va.localTax).toBe(0);
  });

  it("uses the same bracket thresholds for married filing jointly, not doubled", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 25000 }] });
    const va = estimateHouseholdTax(terms);
    // Taxable = 25000 - 17500 - 1860 = 5640. Tax = 3000*2%+2000*3%+640*5% = 60+60+32 = 152.
    expect(va.stateTax).toBeCloseTo(152, 6);
  });

  it("taxes income above $17,000 at 5.75%", () => {
    const va = virginiaTax(input(), 50000, 0);
    // Taxable = 50000-8750-930 = 40320. Tax = 60+60+600+(40320-17000)*5.75% = 720+1340.9 = 2060.9.
    expect(va.stateTax).toBeCloseTo(2060.9, 6);
  });

  it("gives a spouse 65 or older by year end a $12,000 age deduction below the income threshold", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const va = virginiaTax(terms, 40000, 0);
    expect(va.ageDeduction).toBe(12000);
  });

  it("phases the age deduction down dollar-for-dollar above $50,000 (single) adjusted federal AGI", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    expect(virginiaTax(terms, 55000, 0).ageDeduction).toBe(7000);
    expect(virginiaTax(terms, 62000, 0).ageDeduction).toBe(0);
  });

  it("uses the $75,000 married threshold, with two income-based spouses sharing one $24,000 limit", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1951-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    expect(virginiaTax(terms, 75000, 0).ageDeduction).toBe(24000);
    // Worksheet lines 12-14: 2 x 12,000 less the 5,000 over the threshold, not each spouse reduced by 5,000.
    expect(virginiaTax(terms, 80000, 0).ageDeduction).toBe(19000);
    expect(virginiaTax(terms, 99000, 0).ageDeduction).toBe(0);
  });

  it("gives the full $12,000 regardless of income to a spouse born on or before January 1, 1939", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1938-06-01", blind: false, eligibleForSeniorDeduction: true }] });
    const va = virginiaTax(terms, 500000, 0);
    expect(va.ageDeduction).toBe(12000);
  });

  it("treats a spouse born after January 1, 1939 as income-based, and mixes the two kinds correctly", () => {
    const owner = (id: string, birthDate: string) => ({ id, birthDate, blind: false, eligibleForSeniorDeduction: true });
    // Born June 1939 is income-based (the grandfather date is January 1, 1939 itself).
    expect(virginiaTax(input({ people: [owner("one", "1939-06-01")] }), 500000, 0).ageDeduction).toBe(0);
    expect(virginiaTax(input({ people: [owner("one", "1939-01-01")] }), 500000, 0).ageDeduction).toBe(12000);
    // One grandfathered spouse keeps 12,000; the income-based spouse's own 12,000 is cut by the full excess.
    const mixed = input({ filing: "married", people: [owner("one", "1938-01-01"), owner("two", "1950-01-01")] });
    expect(virginiaTax(mixed, 80000, 0).ageDeduction).toBe(12000 + 7000);
  });

  it("uses Virginia's January 1 cutoff for age 65, one day later than year-end age", () => {
    const born = (birthDate: string) => input({ people: [{ id: "one", birthDate, blind: false, eligibleForSeniorDeduction: true }] });
    // For 2026 the cutoff is January 1, 1962 (a person born that day turns 65 on January 1, 2027).
    expect(virginiaTax(born("1962-01-01"), 40000, 0).ageDeduction).toBe(12000);
    expect(virginiaTax(born("1962-01-02"), 40000, 0).ageDeduction).toBe(0);
  });

  it("subtracts $930 per owner plus $800 for each owner 65 or older or blind", () => {
    const owner = (id: string, extra: object) => ({ id, birthDate: "1990-01-01", blind: false, eligibleForSeniorDeduction: true, ...extra });
    expect(virginiaTax(input({ people: [owner("one", {})] }), 0, 0).exemptions).toBe(930);
    expect(virginiaTax(input({ people: [owner("one", { blind: true })] }), 0, 0).exemptions).toBe(930 + 800);
    const couple = input({ filing: "married", people: [owner("one", { birthDate: "1950-01-01", blind: true }), owner("two", { birthDate: "1950-01-01" })] });
    expect(virginiaTax(couple, 0, 0).exemptions).toBe(1860 + 800 * 3);
    // Taxable income is reduced by the exemptions: 60000 - 17500 (standard deduction) - 1860.
    const young = input({ filing: "married", people: [owner("one", {}), owner("two", {})] });
    expect(virginiaTax(young, 60000, 0).stateTax).toBeCloseTo(60 + 60 + 600 + (60000 - 17500 - 1860 - 17000) * .0575, 6);
  });

  it("does not apply the age deduction to a spouse under 65", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1990-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    expect(virginiaTax(terms, 40000, 0).ageDeduction).toBe(0);
  });

  it("tests the age-deduction threshold against federal AGI net of taxable Social Security", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    // federalAgi 70000 less 20000 taxable SS = adjusted 50000, at the threshold: full $12,000.
    expect(virginiaTax(terms, 70000, 20000).ageDeduction).toBe(12000);
  });

  it("excludes Social Security from the Virginia tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("requires explicit confirmation of the restricted Virginia assumptions", () => {
    expect(() => virginiaTax(input({ virginiaContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => virginiaTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "va", vaContract: "confirmed" };
    const va = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(va.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(va.years[0].result.tax.localTax).toBe(0);
    expect(va.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(va.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Virginia confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "va" })).toThrow(/Confirm/);
  });
});
