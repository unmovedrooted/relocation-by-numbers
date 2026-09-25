import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { southCarolinaTax } from "./southCarolinaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "sc", stateTreatment: "verified-resident-location",
    southCarolinaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted South Carolina annual settlement", () => {
  it("applies the two-bracket schedule net of the full SCIAD, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 30000 }] });
    const sc = estimateHouseholdTax(terms);
    // AGI 30000 <= 40000, full $15,000 SCIAD. Taxable = 30000-15000 = 15000, entirely in the 1.99% band.
    expect(sc.stateTax).toBeCloseTo(15000 * 0.0199, 6);
    expect(sc.localTax).toBe(0);
  });

  it("applies the 5.21%-minus-$966 formula above $30,000 taxable income", () => {
    const sc = southCarolinaTax(input(), 100000, 0, 0);
    // AGI 100000 > 95000, SCIAD = 0. Taxable = 100000. Tax = 100000*.0521 - 966 = 5210-966 = 4244.
    expect(sc.stateTax).toBeCloseTo(4244, 6);
  });

  it("phases the SCIAD down linearly and reaches zero at the top of the range", () => {
    const at = southCarolinaTax(input(), 40000, 0, 0);
    const mid = southCarolinaTax(input(), 40000 + 27500, 0, 0);
    const zero = southCarolinaTax(input(), 95000, 0, 0);
    // At 40000: full 15000 SCIAD. Taxable = 25000, tax = 25000*.0199 = 497.5.
    expect(at.stateTax).toBeCloseTo(25000 * 0.0199, 6);
    // At AGI 67500 (27500 of 55000 width into the phase-out), SCIAD is halved to 7500. Taxable = 60000.
    expect(mid.stateTax).toBeCloseTo(60000 * 0.0521 - 966, 6);
    // At 95000, SCIAD is fully phased out. Taxable = 95000.
    expect(zero.stateTax).toBeCloseTo(95000 * 0.0521 - 966, 6);
  });

  it("doubles the SCIAD base and phase-out range for married filing jointly", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const sc = southCarolinaTax(terms, 80000, 0, 0);
    // AGI 80000 <= 80000, full $30,000 SCIAD. Taxable = 50000, tax = 50000*.0521-966 = 2605-966=1639.
    expect(sc.stateTax).toBeCloseTo(1639, 6);
  });

  it("excludes Social Security from the South Carolina tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 100000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("caps the general retirement deduction at $3,000 under 65 and $10,000 at 65+", () => {
    const under65 = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000 }] });
    const over65 = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 15000 }] });
    expect(southCarolinaTax(under65, 5000, 0, 0).generalRetirementDeduction).toBe(3000);
    expect(southCarolinaTax(over65, 15000, 0, 0).generalRetirementDeduction).toBe(10000);
  });

  it("gives a 65+ spouse the Age 65 Deduction reduced only by that spouse's own general deduction", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [
      { ownerId: "one", kind: "pension", amount: 1000 },
      { ownerId: "two", kind: "pension", amount: 3000 },
    ] });
    const sc = southCarolinaTax(terms, 4000, 0, 0);
    // Only "one" (65+) counts: cap 15000, reduced by their own 1000 deduction = 14000.
    // The under-65 spouse's 3000 deduction does not reduce it.
    expect(sc.age65Deduction).toBe(14000);
  });

  it("gives $30,000 combined Age 65 Deduction when both spouses are 65 or older", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1950-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    expect(southCarolinaTax(terms, 0, 0, 0).age65Deduction).toBe(30000);
  });

  it("requires explicit confirmation of the restricted South Carolina assumptions", () => {
    expect(() => southCarolinaTax(input({ southCarolinaContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => southCarolinaTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "sc", scContract: "confirmed" };
    const sc = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(sc.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(sc.years[0].result.tax.localTax).toBe(0);
    expect(sc.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(sc.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit South Carolina confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "sc" })).toThrow(/Confirm/);
  });
});
