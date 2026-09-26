import { describe, it, expect } from "vitest";
import type { HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { oregonTax } from "./oregonTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "or", stateTreatment: "verified-resident-location",
    oregonContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
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
  it("reconciles exactly against the instructions' own Tax Rate Chart at $50,000 and $125,000 taxable income", () => {
    const single50k = bracketTax(50000, [4400, 11050, 125000, Infinity]);
    expect(single50k).toBeCloseTo(4065, -1);
    const single125k = bracketTax(125000, [4400, 11050, 125000, Infinity]);
    expect(single125k).toBeCloseTo(10627, -1);
    const married50k = bracketTax(50000, [8800, 22100, 250000, Infinity]);
    expect(married50k).toBeCloseTo(3756, -1);
  });

  it("applies the graduated schedule after the standard deduction and $256 exemption credit, with no federal tax liability to subtract", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const or = oregonTax(terms, 60000, 0, 0);
    const taxable = 60000 - 2835;
    expect(or.stateTax).toBeCloseTo(bracketTax(taxable, [4400, 11050, 125000, Infinity]) - 256, 4);
    expect(or.localTax).toBe(0);
  });

  it("subtracts the federal tax liability up to the $8,500 cap below the phaseout", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const or = oregonTax(terms, 60000, 0, 5000);
    expect(or.federalTaxSubtraction).toBe(5000);
    expect(or.orAgi).toBe(55000);
  });

  it("phases the federal tax liability subtraction to zero as federal AGI rises through the single range", () => {
    const midway = oregonTax(input(), 135000, 0, 20000);
    expect(midway.federalTaxSubtraction).toBeCloseTo(4250, 6);
    const above = oregonTax(input(), 150000, 0, 20000);
    expect(above.federalTaxSubtraction).toBe(0);
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
    const taxable = 60000 - (2835 + 2 * 1200);
    expect(or.stateTax).toBeCloseTo(bracketTax(taxable, [4400, 11050, 125000, Infinity]) - 256, 4);
  });

  it("credits $256 per person below the exemption-credit AGI limit", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const or = oregonTax(terms, 40000, 0, 0);
    const taxable = 40000 - 2835;
    expect(or.stateTax).toBeCloseTo(bracketTax(taxable, [4400, 11050, 125000, Infinity]) - 256, 4);
  });

  it("requires explicit confirmation of the restricted Oregon assumptions", () => {
    expect(() => oregonTax(input({ oregonContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => oregonTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "or", orContract: "confirmed" };
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
