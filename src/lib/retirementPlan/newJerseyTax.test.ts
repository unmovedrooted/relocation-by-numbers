import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { newJerseyTax } from "./newJerseyTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "nj", stateTreatment: "verified-resident-location",
    newJerseyContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted New Jersey annual settlement", () => {
  it("computes the exact single bracket tax on wages, with no local tax", () => {
    // Taxable = 80000 - 1000 (base exemption) = 79000.
    // Tax: 20000*.014 + 15000*.0175 + 5000*.035 + 35000*.05525 + 4000*.0637
    // = 280+262.5+175+1933.75+254.8 = 2906.05.
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const nj = estimateHouseholdTax(terms);
    expect(nj.stateTax).toBeCloseTo(2906.05, 6);
    expect(nj.localTax).toBe(0);
  });

  it("uses the married bracket schedule and married exemption", () => {
    // Taxable = 200000 - 2000 = 198000.
    // Tax: 20000*.014+30000*.0175+20000*.0245+10000*.035+70000*.05525+48000*.0637
    // = 280+525+490+350+3867.5+3057.6 = 8570.1.
    const terms = input({ filing: "married", people: [...input().people, { ...input().people[0], id: "two" }],
      income: [{ ownerId: "one", kind: "wages", amount: 200000 }] });
    expect(newJerseyTax(terms, 200000, 0, 0).stateTax).toBeCloseTo(8570.1, 6);
  });

  it("fully excludes Social Security from New Jersey AGI", () => {
    const withSS = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }, { ownerId: "one", kind: "social-security", amount: 30000 }] });
    const nj = estimateHouseholdTax(withSS);
    expect(nj.taxableBenefits).toBeGreaterThan(0);
    expect(nj.stateTax).toBeCloseTo(2906.05, 6); // unchanged from the no-SS case.
  });

  it("grants no retirement exclusion below age 62, even with total income under $150,000", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 40000 }] }); // owner born 1975, age 51.
    expect(newJerseyTax(terms, 40000, 0, 0).retirementExclusion).toBe(0);
  });

  it("fully excludes eligible retirement income up to the single cap when total income is at or under $100,000", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }], // turns 66 in 2026.
      income: [{ ownerId: "one", kind: "pension", amount: 60000 }] });
    const nj = newJerseyTax(terms, 60000, 0, 0);
    expect(nj.retirementExclusion).toBe(60000);
    expect(nj.njAgi).toBe(0);
  });

  it("caps the exclusion at the single $75,000 maximum", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }],
      income: [{ ownerId: "one", kind: "pension", amount: 90000 }] });
    expect(newJerseyTax(terms, 90000, 0, 0).retirementExclusion).toBe(75000);
  });

  it("phases the single exclusion to 37.5% between $100,001 and $125,000 total income", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }],
      income: [{ ownerId: "one", kind: "pension", amount: 110000 }] });
    // capped at 75000 (single max), * 37.5% = 28125.
    expect(newJerseyTax(terms, 110000, 0, 0).retirementExclusion).toBeCloseTo(28125, 6);
  });

  it("phases the single exclusion to 18.75% between $125,001 and $150,000 total income", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }],
      income: [{ ownerId: "one", kind: "pension", amount: 140000 }] });
    expect(newJerseyTax(terms, 140000, 0, 0).retirementExclusion).toBeCloseTo(75000 * .1875, 6);
  });

  it("eliminates the exclusion entirely above $150,000 total income", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }],
      income: [{ ownerId: "one", kind: "pension", amount: 160000 }] });
    expect(newJerseyTax(terms, 160000, 0, 0).retirementExclusion).toBe(0);
  });

  it("unlocks the household exclusion if either spouse is 62 or older, covering combined pension income", () => {
    const terms = input({ filing: "married", people: [{ ...input().people[0], id: "one", birthDate: "1975-01-01" }, // 51.
      { ...input().people[0], id: "two", birthDate: "1960-01-01" }], // 66.
      income: [{ ownerId: "one", kind: "pension", amount: 50000 }, { ownerId: "two", kind: "pension", amount: 20000 }] });
    // Combined 70000, under married cap of 100000, total income 70000 <= 100000: full exclusion.
    expect(newJerseyTax(terms, 70000, 0, 0).retirementExclusion).toBe(70000);
  });

  it("includes retirement-account (401k/IRA/annuity) distributions in the eligible exclusion pool", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }] });
    expect(newJerseyTax(terms, 40000, 0, 40000).retirementExclusion).toBe(40000);
  });

  it("grants additional $1,000 exemptions for age 65 and blindness", () => {
    // Exemptions = 1000 base + 1000 age + 1000 blind = 3000. Taxable = 50000-3000 = 47000.
    // Tax: 20000*.014+15000*.0175+5000*.035+7000*.05525 = 280+262.5+175+386.75 = 1104.25.
    const terms = input({ people: [{ ...input().people[0], birthDate: "1955-01-01", blind: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 50000 }] });
    expect(newJerseyTax(terms, 50000, 0, 0).stateTax).toBeCloseTo(1104.25, 6);
  });

  it("requires explicit confirmation of the restricted New Jersey assumptions", () => {
    expect(() => newJerseyTax(input({ newJerseyContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => newJerseyTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "nj", njContract: "confirmed" };
    const nj = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(nj.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(nj.years[0].result.tax.localTax).toBe(0);
    expect(nj.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(nj.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit New Jersey confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "nj" })).toThrow(/Confirm/);
  });
});
