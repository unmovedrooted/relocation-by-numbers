import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { georgiaTax } from "./georgiaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ga", stateTreatment: "verified-resident-location",
    georgiaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Georgia annual settlement", () => {
  it("applies the flat 5.19% rate net of the standard deduction, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const ga = estimateHouseholdTax(terms);
    expect(ga.stateTax).toBeCloseTo((40000 - 12000) * 0.0519, 6);
    expect(ga.localTax).toBe(0);
  });

  it("doubles the standard deduction for married filing jointly", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const ga = estimateHouseholdTax(terms);
    expect(ga.stateTax).toBeCloseTo((60000 - 24000) * 0.0519, 6);
  });

  it("excludes Social Security from the Georgia tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("excludes up to $35,000 of pension income for a spouse aged 62-64", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1963-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 50000 }] });
    const ga = georgiaTax(terms, 50000, 0, 0);
    expect(ga.retirementIncomeExclusion).toBe(35000);
  });

  it("excludes up to $65,000 of pension income for a spouse aged 65 or older", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1958-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 80000 }] });
    const ga = georgiaTax(terms, 80000, 0, 0);
    expect(ga.retirementIncomeExclusion).toBe(65000);
  });

  it("gives no exclusion to a spouse under 62", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1990-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 20000 }] });
    expect(georgiaTax(terms, 20000, 0, 0).retirementIncomeExclusion).toBe(0);
  });

  it("includes up to $5,000 of the owner's own wages in the exclusion pool", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1958-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 20000 }, { ownerId: "one", kind: "pension", amount: 10000 }] });
    const ga = georgiaTax(terms, 30000, 0, 0);
    // Earned portion capped at 5000, plus 10000 pension = 15000, well under the 65000 cap.
    expect(ga.retirementIncomeExclusion).toBe(15000);
  });

  it("splits the aggregate 401(k)/IRA/annuity figure 50/50 between two qualifying spouses", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1958-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1958-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const ga = georgiaTax(terms, 60000, 0, 60000);
    // Each spouse gets 30000 (half of retirementOrdinary), both under the 65000 cap.
    expect(ga.retirementIncomeExclusion).toBe(60000);
  });

  it("caps each spouse's exclusion independently at their own age tier", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1958-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1963-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    // Each spouse gets 50000 (half of 100000); the 65+ spouse stays under 65000, but the
    // 62-64 spouse is capped at 35000. Total = 50000 + 35000 = 85000.
    const ga = georgiaTax(terms, 100000, 0, 100000);
    expect(ga.retirementIncomeExclusion).toBe(85000);
  });

  it("requires explicit confirmation of the restricted Georgia assumptions", () => {
    expect(() => georgiaTax(input({ georgiaContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => georgiaTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ga", gaContract: "confirmed" };
    const ga = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ga.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ga.years[0].result.tax.localTax).toBe(0);
    expect(ga.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ga.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Georgia confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ga" })).toThrow(/Confirm/);
  });
});
