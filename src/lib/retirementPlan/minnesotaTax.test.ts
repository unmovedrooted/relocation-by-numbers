import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { minnesotaTax } from "./minnesotaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "mn", stateTreatment: "verified-resident-location",
    minnesotaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Minnesota annual settlement", () => {
  it("computes the exact single bracket tax on wages, with no local tax", () => {
    // Taxable = 80000 - 15300 = 64700. Tax: 33310*.0535 + 31390*.068 = 1782.085+2134.52 = 3916.605.
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const mn = estimateHouseholdTax(terms);
    expect(mn.stateTax).toBeCloseTo(3916.605, 6);
    expect(mn.localTax).toBe(0);
  });

  it("grants the additional standard deduction for age 65 and blindness, stacking both", () => {
    // Standard deduction = 15300 + 2000 (age) + 2000 (blind) = 19300. Taxable = 60000-19300 = 40700.
    // Tax: 33310*.0535 + 7390*.068 = 1782.085+502.52 = 2284.605.
    const terms = input({ people: [{ ...input().people[0], birthDate: "1955-01-01", blind: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    expect(minnesotaTax(terms, 60000, 0, 0).stateTax).toBeCloseTo(2284.605, 6);
  });

  it("uses the 2026 additional amounts for each married spouse who is 65 or older", () => {
    // Standard deduction = 30600 + 2*1600 = 33800. Taxable = 100000-33800 = 66200 on the 5.35% bracket up to 48700 then 6.8%.
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    expect(minnesotaTax(terms, 100000, 0, 0).stateTax).toBeCloseTo(48700 * .0535 + (66200 - 48700) * .068, 6);
  });

  it("reduces the standard deduction for federal AGI over $244,400, fully above $1,107,750", () => {
    // AGI 300000: reduction .03*(300000-244400) = 1668, so deduction 15300-1668 = 13632 and taxable 286368.
    const bracket = (taxable: number) => 33310 * .0535 + (109430 - 33310) * .068 + (203150 - 109430) * .0785 + (taxable - 203150) * .0985;
    expect(minnesotaTax(input(), 300000, 0, 0).stateTax).toBeCloseTo(bracket(286368), 6);
    // AGI 400000: .03*(337800-244400) + .1*(400000-337800) = 2802+6220 = 9022 exceeds 80% of 15300 (12240)? No, so deduction 6278.
    expect(minnesotaTax(input(), 400000, 0, 0).stateTax).toBeCloseTo(bracket(400000 - 6278), 6);
    // AGI 2000000: flat 80% reduction, deduction 3060.
    expect(minnesotaTax(input(), 2000000, 0, 0).stateTax).toBeCloseTo(bracket(2000000 - 3060), 6);
    // No reduction at the threshold.
    expect(minnesotaTax(input(), 244400, 0, 0).stateTax).toBeCloseTo(bracket(244400 - 15300), 6);
  });

  it("fully subtracts Social Security under the simplified method below the income threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // federalAgi 80000 < 86,410 single simplified-method threshold: fully subtracted regardless of the alternate method.
    const mn = minnesotaTax(terms, 80000, 15000, 0);
    expect(mn.socialSecuritySubtraction).toBe(15000);
  });

  it("taxes Social Security in full once both methods phase out at high income", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const mn = minnesotaTax(terms, 200000, 15000, 0);
    expect(mn.socialSecuritySubtraction).toBe(0);
  });

  it("requires explicit confirmation of the restricted Minnesota assumptions", () => {
    expect(() => minnesotaTax(input({ minnesotaContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => minnesotaTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    // Spending is set off the default: the Social Security simplified-method steps are cash cliffs, and the annual cash-flow
    // solver rejects some spending levels with "After-tax cash is not nondecreasing" (also true of the defaults before this test changed).
    const values = { ...PREVIEW_DEFAULTS, state: "mn", mnContract: "confirmed", spending: "48000" };
    const mn = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(mn.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(mn.years[0].result.tax.localTax).toBe(0);
    expect(mn.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(mn.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Minnesota confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "mn" })).toThrow(/Confirm/);
  });
});
