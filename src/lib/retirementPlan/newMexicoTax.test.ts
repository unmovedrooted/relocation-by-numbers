import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { newMexicoTax } from "./newMexicoTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "nm", stateTreatment: "verified-resident-location",
    newMexicoContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted New Mexico annual settlement", () => {
  it("computes the exact single bracket tax on wages, with no local tax and no exemptions at higher income", () => {
    // Taxable = 80000 - 16100 (federal std deduction) = 63900.
    // Tax: 5500*.015 + 11000*.032 + 17000*.043 + 30400*.047 = 82.5+352+731+1428.8 = 2594.3.
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const nm = estimateHouseholdTax(terms);
    expect(nm.stateTax).toBeCloseTo(2594.3, 6);
    expect(nm.localTax).toBe(0);
  });

  it("uses the married bracket schedule", () => {
    const terms = input({ filing: "married", people: [...input().people, { ...input().people[0], id: "two" }] });
    // No exemptions at this income: taxable = 200000-32200=167800.
    // Tax: 8000*.015+17000*.032+25000*.043+50000*.047+67800*.049
    // = 120+544+1075+2350+3322.2 = 7411.2.
    expect(newMexicoTax(terms, 200000, 0, 32200).stateTax).toBeCloseTo(7411.2, 6);
  });

  it("fully excludes Social Security below the income threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // federalAgi 90000 <= 100000 single threshold: fully excluded.
    const nm = newMexicoTax(terms, 90000, 12000, 16100);
    expect(nm.socialSecurityExemption).toBe(12000);
  });

  it("taxes Social Security in full above the income threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const nm = newMexicoTax(terms, 150000, 12000, 16100);
    expect(nm.socialSecurityExemption).toBe(0);
  });

  it("grants the graduated age-65-or-blind exemption per qualifying person", () => {
    // Single, AGI 20000 falls in the 19,501-21,000 row: $6,000.
    const terms = input({ people: [{ ...input().people[0], birthDate: "1955-01-01" }] }); // turns 71 in 2026.
    expect(newMexicoTax(terms, 20000, 0, 16100).ageBlindExemption).toBe(6000);
  });

  it("grants a blind owner the same graduated exemption, without an age test", () => {
    const terms = input({ people: [{ ...input().people[0], blind: true }] }); // owner is 51, not 65.
    expect(newMexicoTax(terms, 20000, 0, 16100).ageBlindExemption).toBe(6000);
  });

  it("stacks the age-65-or-blind exemption for each qualifying spouse", () => {
    const terms = input({ filing: "married", people: [{ ...input().people[0], id: "one", birthDate: "1955-01-01" },
      { ...input().people[0], id: "two", birthDate: "1955-01-01" }] });
    // Married, AGI 35000 falls in the 33,001-36,000 row: $6,000 each = $12,000.
    expect(newMexicoTax(terms, 35000, 0, 32200).ageBlindExemption).toBe(12000);
  });

  it("eliminates the age-blind exemption above the top of the table", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1955-01-01" }] });
    expect(newMexicoTax(terms, 40000, 0, 16100).ageBlindExemption).toBe(0);
  });

  it("grants the low- and middle-income exemption, phased down by federal AGI", () => {
    // Single, AGI 25000: reduction = (25000-20000)*.15 = 750. Per-exemption = 2500-750 = 1750. 1 exemption.
    const terms = input({});
    expect(newMexicoTax(terms, 25000, 0, 16100).lowMiddleIncomeExemption).toBe(1750);
  });

  it("eliminates the low- and middle-income exemption above the eligibility ceiling", () => {
    const terms = input({});
    expect(newMexicoTax(terms, 40000, 0, 16100).lowMiddleIncomeExemption).toBe(0);
  });

  it("grants the low- and middle-income exemption once per household member", () => {
    const terms = input({ filing: "married", people: [{ ...input().people[0], id: "one" }, { ...input().people[0], id: "two" }] });
    // Married, AGI 54000: reduction = (54000-30000)*.10 = 2400. Per-exemption = 100. 2 exemptions = 200.
    expect(newMexicoTax(terms, 54000, 0, 32200).lowMiddleIncomeExemption).toBe(200);
  });

  it("requires explicit confirmation of the restricted New Mexico assumptions", () => {
    expect(() => newMexicoTax(input({ newMexicoContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => newMexicoTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "nm", nmContract: "confirmed" };
    const nm = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(nm.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(nm.years[0].result.tax.localTax).toBe(0);
    expect(nm.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(nm.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit New Mexico confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "nm" })).toThrow(/Confirm/);
  });
});
