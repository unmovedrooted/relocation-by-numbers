import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { rhodeIslandTax } from "./rhodeIslandTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ri", stateTreatment: "verified-resident-location",
    rhodeIslandContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Rhode Island annual settlement", () => {
  it("applies the uniform bracket schedule to income net of the standard deduction and exemption, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const ri = estimateHouseholdTax(terms);
    // Taxable = 40000 - 11200 - 5250 = 23550, entirely in the 3.75% band.
    expect(ri.stateTax).toBeCloseTo(23550 * 0.0375, 6);
    expect(ri.localTax).toBe(0);
  });

  it("taxes income above $82,050 at 4.75% and above $186,450 at 5.99%", () => {
    const ri = rhodeIslandTax(input(), 200000, 0, 0);
    // Taxable = 200000 - 11200 - 5250 = 183550.
    // Tax = 82050*3.75% + (183550-82050)*4.75% = 3076.875 + 4821.25 = 7898.125.
    expect(ri.stateTax).toBeCloseTo(7898.125, 6);
  });

  it("doubles the exemption count for married filing jointly", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const ri = rhodeIslandTax(terms, 60000, 0, 0);
    // Taxable = 60000 - 22400 - 2*5250 = 27100.
    expect(ri.stateTax).toBeCloseTo(27100 * 0.0375, 6);
  });

  it("phases the standard deduction and exemption down by 25% per $7,450 of modified AGI above $261,000", () => {
    const single = 11200 + 5250;
    expect(rhodeIslandTax(input(), 261000, 0, 0).deductionUsed).toBeCloseTo(single, 6);
    expect(rhodeIslandTax(input(), 261000 + 1, 0, 0).deductionUsed).toBeCloseTo(single * 0.75, 6);
    expect(rhodeIslandTax(input(), 261000 + 7450, 0, 0).deductionUsed).toBeCloseTo(single * 0.75, 6);
    expect(rhodeIslandTax(input(), 261000 + 7450 + 1, 0, 0).deductionUsed).toBeCloseTo(single * 0.5, 6);
    expect(rhodeIslandTax(input(), 261000 + 4 * 7450, 0, 0).deductionUsed).toBe(0);
  });

  it("excludes Social Security only for a spouse who has reached full retirement age, below the AGI threshold", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const ri = rhodeIslandTax(terms, 50000, 15000, 0);
    expect(ri.socialSecuritySubtraction).toBe(15000);
  });

  it("does not exclude Social Security for a spouse under full retirement age", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1995-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const ri = rhodeIslandTax(terms, 50000, 15000, 0);
    expect(ri.socialSecuritySubtraction).toBe(0);
  });

  it("fully taxes Social Security once federal AGI reaches the single/HOH/MFS threshold", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(rhodeIslandTax(terms, 106999.99, 15000, 0).socialSecuritySubtraction).toBe(15000);
    expect(rhodeIslandTax(terms, 107000, 15000, 0).socialSecuritySubtraction).toBe(0);
  });

  it("excludes up to $50,000 of pension income per qualifying owner", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 70000 }] });
    const ri = rhodeIslandTax(terms, 60000, 0, 0);
    expect(ri.pensionSubtraction).toBe(50000);
  });

  it("does not exclude pension income for an owner under full retirement age", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1995-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 30000 }] });
    const ri = rhodeIslandTax(terms, 60000, 0, 0);
    expect(ri.pensionSubtraction).toBe(0);
  });

  it("sums the per-owner pension exclusion across a qualifying married couple", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1951-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [
      { ownerId: "one", kind: "pension", amount: 60000 },
      { ownerId: "two", kind: "pension", amount: 20000 },
    ] });
    const ri = rhodeIslandTax(terms, 100000, 0, 0);
    expect(ri.pensionSubtraction).toBe(70000);
  });

  it("adds back tax-exempt interest as Rhode Island-taxable", () => {
    const withInterest = rhodeIslandTax(input(), 40000, 0, 10000);
    const without = rhodeIslandTax(input(), 40000, 0, 0);
    expect(withInterest.stateTax - without.stateTax).toBeCloseTo(10000 * 0.0375, 6);
  });

  it("requires explicit confirmation of the restricted Rhode Island assumptions", () => {
    expect(() => rhodeIslandTax(input({ rhodeIslandContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => rhodeIslandTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ri", riContract: "confirmed" };
    const ri = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ri.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ri.years[0].result.tax.localTax).toBe(0);
    expect(ri.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ri.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Rhode Island confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ri" })).toThrow(/Confirm/);
  });
});
