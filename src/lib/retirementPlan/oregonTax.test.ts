import { describe, it, expect } from "vitest";
import type { HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { oregonTax } from "./oregonTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "or", stateTreatment: "verified-resident-location",
    oregonContract: "verified-law-precredit", oregonLocal: { metro: "outside-no-source", multnomah: "outside-no-source", adjustments: "none-confirmed" }, people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number, ceilings: number[]) {
  const rates = [.0475, .0675, .0875, .099];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

describe("restricted Oregon annual settlement", () => {
  // Independent known answers: integrate each bracket explicitly; do not
  // reuse bracketTax or the engine's constants for these assertions.
  it("matches the updated single-filer known answer at $60,000 AGI", () => {
    // Taxable = 60,000 - 2,910 = 57,090.
    // 4,550*.0475 + 6,850*.0675 + 45,690*.0875 - 263.
    expect(oregonTax(input(), 60000, 0, 0).stateTax).toBeCloseTo(4413.375, 6);
  });

  it("matches the married known answer using two personal exemption credits", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1976-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    // Taxable = 100,000 - 5,820 = 94,180.
    // 9,100*.0475 + 13,700*.0675 + 71,380*.0875 - 526.
    expect(oregonTax(terms, 100000, 0, 0).stateTax).toBeCloseTo(7076.75, 6);
  });

  it.each([
    ["1961-12-31", false, 4308.375],
    ["1962-01-01", false, 4308.375],
    ["1962-01-02", false, 4413.375],
    ["1975-01-01", true, 4308.375],
    ["1962-01-01", true, 4203.375],
  ] as const)("checks age/blind eligibility for %s, blind=%s", (birthDate, blind, expected) => {
    expect(oregonTax(input({ people: [{ id: "one", birthDate, blind, eligibleForSeniorDeduction: true }] }), 60000, 0, 0).stateTax)
      .toBeCloseTo(expected, 6);
  });

  it("counts married age and blindness additions separately for both owners", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1962-01-01", blind: true, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1961-12-31", blind: true, eligibleForSeniorDeduction: true },
    ] });
    // Four $1,000 additions reduce tax by $350 from 7,076.75.
    expect(oregonTax(terms, 100000, 0, 0).stateTax).toBeCloseTo(6726.75, 6);
  });

  it.each(["single", "married"] as const)("preserves the exemption-credit cutoff for %s", filing => {
    const married = filing === "married";
    const person = { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true };
    const people = married ? [person, { ...person, id: "two" }] : [person];
    const terms = input({ filing, people });
    const limit = married ? 200000 : 100000;
    const at = oregonTax(terms, limit, 0, 0).stateTax;
    const above = oregonTax(terms, limit + .01, 0, 0).stateTax;
    expect(above - at).toBeCloseTo(263 * people.length + .01 * .0875, 6);
  });

  it("preserves the disclosed future-year freeze and zero-tax floor", () => {
    expect(oregonTax(input(), 0, 0, 0).stateTax).toBe(0);
    expect(oregonTax(input({ year: 2027 }), 60000, 0, 0).stateTax)
      .toBe(oregonTax(input(), 60000, 0, 0).stateTax);
  });

  it("checks unrounded marginal integration at $50,000 and $125,000 taxable income", () => {
    const single50k = bracketTax(50000, [4550, 11400, 125000, Infinity]);
    expect(single50k).toBeCloseTo(4056, 6);
    const single125k = bracketTax(125000, [4550, 11400, 125000, Infinity]);
    expect(single125k).toBeCloseTo(10618.5, 6);
    const married50k = bracketTax(50000, [9100, 22800, 250000, Infinity]);
    expect(married50k).toBeCloseTo(3737, 6);
  });

  it("applies the graduated schedule after the standard deduction and $263 exemption credit, with no federal tax liability to subtract", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const or = oregonTax(terms, 60000, 0, 0);
    const taxable = 60000 - 2910;
    expect(or.stateTax).toBeCloseTo(bracketTax(taxable, [4550, 11400, 125000, Infinity]) - 263, 4);
    expect(or.localTax).toBe(0);
  });

  it("subtracts the federal tax liability up to the $8,750 cap below the phaseout", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const or = oregonTax(terms, 60000, 0, 5000);
    expect(or.federalTaxSubtraction).toBe(5000);
    expect(or.orAgi).toBe(55000);
  });

  it("phases the federal tax liability subtraction to zero as federal AGI rises through the single range", () => {
    const midway = oregonTax(input(), 135000, 0, 20000);
    expect(midway.federalTaxSubtraction).toBe(3500);
    const above = oregonTax(input(), 150000, 0, 20000);
    expect(above.federalTaxSubtraction).toBe(0);
  });

  it.each(["single", "married"] as const)("matches every 2026 subtraction boundary for %s", filing => {
    const scale = filing === "single" ? 1 : 2;
    const bands = [[125000, 7000], [130000, 5250], [135000, 3500], [140000, 1750], [145000, 0]];
    for (const [boundary, cap] of bands) {
      expect(oregonTax(input({ filing }), boundary * scale - .01, 0, 20000).federalTaxSubtraction).toBe(cap + 1750);
      expect(oregonTax(input({ filing }), boundary * scale, 0, 20000).federalTaxSubtraction).toBe(cap);
      expect(oregonTax(input({ filing }), boundary * scale + .01, 0, 20000).federalTaxSubtraction).toBe(cap);
      expect(oregonTax(input({ filing }), boundary * scale, 0, 500).federalTaxSubtraction).toBe(Math.min(cap, 500));
      expect(oregonTax(input({ filing }), boundary * scale, 0, 0).federalTaxSubtraction).toBe(0);
    }
  });

  it("excludes Social Security and tier 1 Railroad Retirement from the Oregon tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = oregonTax(terms, 60000, 0, 0);
    const withSs = oregonTax(terms, 78000, 18000, 0);
    expect(withSs.orAgi).toBe(withoutSs.orAgi);
  });

  it("adds $1,200 per age-65-or-blind condition for a single filer", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: true, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const or = oregonTax(terms, 60000, 0, 0);
    const taxable = 60000 - (2910 + 2 * 1200);
    expect(or.stateTax).toBeCloseTo(bracketTax(taxable, [4550, 11400, 125000, Infinity]) - 263, 4);
  });

  it("credits $263 per person below the exemption-credit AGI limit", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const or = oregonTax(terms, 40000, 0, 0);
    const taxable = 40000 - 2910;
    expect(or.stateTax).toBeCloseTo(bracketTax(taxable, [4550, 11400, 125000, Infinity]) - 263, 4);
  });

  it("requires explicit confirmation of the restricted Oregon assumptions", () => {
    expect(() => oregonTax(input({ oregonContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => oregonTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "or", orContract: "confirmed", orMetro: "outside-no-source", orMultnomah: "outside-no-source", orLocalAdjustments: "none-confirmed" };
    const or = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(or.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(or.years[0].result.tax.localTax).toBe(0);
    expect(or.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(or.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Oregon confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "or" })).toThrow(/Confirm/);
  });
});
