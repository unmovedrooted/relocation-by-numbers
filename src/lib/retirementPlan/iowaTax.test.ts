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
      income: [{ ownerId: "one", kind: "pension", amount: 20000 }],
      retirementIncome: [{ ownerId: "one", source: "traditional-ira", date: "2026-07-01", amount: 30000 }] });
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

  // (60,200 - eligible withdrawals) * .038 - 80; retain cents.
  it.each([[40000, 0, 40000, 687.6], [0, 40000, 0, 2207.6], [30000, 10000, 30000, 1067.6]])(
    "attributes older=%i and younger=%i withdrawals without splitting", (older, younger, exclusion, tax) => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1965-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1995-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], retirementIncome: [
      { ownerId: "one", source: "traditional-ira", date: "2026-07-01", amount: older },
      { ownerId: "two", source: "401k", date: "2026-07-01", amount: younger },
    ] });
    const ia = iowaTax(terms, 92400, 0, 60200, 40000);
    expect(ia.retirementExclusion).toBe(exclusion);
    expect(ia.stateTax).toBeCloseTo(tax, 6);
  });

  it.each([["1971-12-31", 40000], ["1972-01-01", 0]])("uses year-end age for %s", (birthDate, expected) => {
    const terms = input({ people: [{ ...input().people[0], birthDate }], retirementIncome: [
      { ownerId: "one", source: "ira-conversion", date: "2026-01-01", amount: 40000 },
    ] });
    expect(iowaTax(terms, 60000, 0, 43900, 40000).retirementExclusion).toBe(expected);
  });

  it("does not exempt nonqualified annuities for an eligible owner", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1965-01-01" }], retirementIncome: [
      { ownerId: "one", source: "annuity", date: "2026-07-01", amount: 40000 },
    ] });
    expect(iowaTax(terms, 60000, 0, 43900, 40000).retirementExclusion).toBe(0);
  });

  it("excludes both eligible owners' unequal amounts independent of person order", () => {
    const terms = input({ filing: "married", people: [
      { ...input().people[0], birthDate: "1965-01-01" },
      { ...input().people[0], id: "two", birthDate: "1971-12-31" },
    ], retirementIncome: [
      { ownerId: "one", source: "traditional-ira", date: "2026-07-01", amount: 30000 },
      { ownerId: "two", source: "plan-conversion", date: "2026-07-01", amount: 10000 },
    ] });
    const result = iowaTax(terms, 92400, 0, 60200, 40000);
    expect(result.retirementExclusion).toBe(40000);
    expect(iowaTax({ ...terms, people: [...terms.people].reverse() }, 92400, 0, 60200, 40000)).toEqual(result);
  });

  it("rejects missing, mismatched, invalid and unknown-owner attribution", () => {
    expect(() => iowaTax(input(), 40000, 0, 23900, 40000)).toThrow(/reconciled/);
    for (const [ownerId, amount] of [["missing", 40000], ["one", -1], ["one", NaN], ["one", Infinity]] as const) {
      expect(() => iowaTax(input({ retirementIncome: [{ ownerId, amount, source: "traditional-ira", date: "2026-07-01" }] }), 40000, 0, 23900, 40000)).toThrow(/attribution/);
    }
    expect(() => iowaTax(input({ retirementIncome: [{ ownerId: "one", amount: 39999, source: "traditional-ira", date: "2026-07-01" }] }), 40000, 0, 23900, 40000)).toThrow(/reconciled/);
  });

  it("requires explicit confirmation of the restricted Iowa assumptions", () => {
    expect(() => iowaTax(input({ iowaContract: undefined }), 0, 0, 0, 0)).toThrow(/Confirm/);
  });

  it("uses actual IRA ownership through the preview and annual cash settlement", () => {
    const plan = buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ia", iaContract: "confirmed",
      household: "married", endYear: "2026", cash: "0", spending: "40000",
      "one-birth": "1965-01-01", "two-birth": "1972-01-01",
      "one-salary": "0", "two-salary": "0", "one-pension": "0", "two-pension": "0",
      "one-benefit": "0", "two-benefit": "0", "two-ira": "0" });
    const older = runRetirementTimeline(plan).years[0];
    const younger = runRetirementTimeline({ ...plan,
      accounts: plan.accounts.map(account => account.kind === "traditional-ira" ? { ...account, ownerId: "two" } : account),
    }).years[0];
    expect(older.result.tax.stateTax).toBe(0);
    expect(younger.result.tax.stateTax).toBeGreaterThan(0);
    expect(older.result.retirementIncome.every(item => item.ownerId === "one")).toBe(true);
    expect(younger.result.retirementIncome.every(item => item.ownerId === "two")).toBe(true);
    expect(Math.abs(older.reconciliationResidual)).toBeLessThan(1e-5);
    expect(Math.abs(younger.reconciliationResidual)).toBeLessThan(1e-5);
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
