import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { maineTax } from "./maineTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "me", stateTreatment: "verified-resident-location",
    maineContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number, ceilings: number[]) {
  const rates = [.058, .0675, .0715];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

describe("restricted Maine annual settlement", () => {
  it("applies the graduated schedule after the standard deduction and $5,300 personal exemption", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const me = estimateHouseholdTax(terms);
    const taxable = 60000 - 15700 - 5300;
    expect(me.stateTax).toBeCloseTo(bracketTax(taxable, [27400, 64850, Infinity]), 6);
    expect(me.localTax).toBe(0);
  });

  it("doubles the married bracket thresholds and standard deduction, doubles the exemption", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const me = estimateHouseholdTax(terms);
    const taxable = 100000 - 31400 - 10600;
    expect(me.stateTax).toBeCloseTo(bracketTax(taxable, [54850, 129750, Infinity]), 6);
  });

  it("adds the enacted 2% surcharge above $1,000,000 taxable income single", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 1100000 }] });
    const me = maineTax(terms, 1100000, 0, 0);
    const taxable = 1100000 - 15700 - 5300;
    const expected = bracketTax(taxable, [27400, 64850, Infinity]) + (taxable - 1000000) * .02;
    expect(me.stateTax).toBeCloseTo(expected, 6);
  });

  it("adds $2,050 per age-65-or-blind condition for a single filer", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: true, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const me = estimateHouseholdTax(terms);
    const taxable = 60000 - (15700 + 2 * 2050) - 5300;
    expect(me.stateTax).toBeCloseTo(bracketTax(taxable, [27400, 64850, Infinity]), 6);
  });

  it("excludes Social Security and Railroad Retirement from the Maine tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = maineTax(terms, 60000, 0, 0);
    const withSs = maineTax(terms, 78000, 18000, 0);
    expect(withSs.meAgi).toBe(withoutSs.meAgi);
  });

  it("caps the per-owner pension income deduction at $49,824, reduced by that owner's own Social Security", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 60000, pensionType: "private" },
      { ownerId: "one", kind: "social-security", amount: 10000 }] });
    const me = maineTax(terms, 60000, 0, 20000);
    expect(me.pensionDeduction).toBe(49824 - 10000);
  });

  it("does not require the owner to be 65 or older for the pension deduction", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1995-01-01", blind: false, eligibleForSeniorDeduction: false }],
      income: [{ ownerId: "one", kind: "pension", amount: 20000, pensionType: "private" }] });
    const me = maineTax(terms, 20000, 0, 0);
    expect(me.pensionDeduction).toBe(20000);
  });

  it("requires explicit confirmation of the restricted Maine assumptions", () => {
    expect(() => maineTax(input({ maineContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => maineTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "me", meContract: "confirmed" };
    const me = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(me.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(me.years[0].result.tax.localTax).toBe(0);
    expect(me.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(me.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Maine confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "me" })).toThrow(/Confirm/);
  });
});
