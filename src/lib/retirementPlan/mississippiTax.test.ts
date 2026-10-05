import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { mississippiTax } from "./mississippiTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ms", stateTreatment: "verified-resident-location",
    mississippiContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Mississippi annual settlement", () => {
  it("applies the 4.0% 2026 rate above the standard deduction, personal exemption and $10,000 exempt bracket", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ms = estimateHouseholdTax(terms);
    const taxable = 80000 - 2300 - 6000 - 10000;
    expect(ms.stateTax).toBeCloseTo(taxable * 0.04, 6);
    expect(ms.localTax).toBe(0);
  });

  it("doubles the standard deduction, exemption and exempt bracket for married filers", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const ms = estimateHouseholdTax(terms);
    const taxable = 100000 - 4600 - 12000 - 20000;
    expect(ms.stateTax).toBeCloseTo(taxable * 0.04, 6);
  });

  it("takes an additional $1,500 for each taxpayer or spouse 65 or older and each who is blind", () => {
    const owner = (id: string, extra: object) => ({ id, birthDate: "1990-01-01", blind: false, eligibleForSeniorDeduction: true, ...extra });
    const additional = (people: ReturnType<typeof owner>[], filing: "single" | "married" = "single") =>
      mississippiTax(input({ filing, people }), 80000, 0, 0, 0).additionalExemptions;
    expect(additional([owner("one", {})])).toBe(0);
    expect(additional([owner("one", { birthDate: "1950-01-01" })])).toBe(1500);
    expect(additional([owner("one", { birthDate: "1950-01-01", blind: true })])).toBe(3000);
    expect(additional([owner("one", { birthDate: "1950-01-01" }), owner("two", { blind: true })], "married")).toBe(3000);
    // Age 65 on the day before the 65th birthday: a January 1 birthday in the next year still counts for 2026.
    expect(additional([owner("one", { birthDate: "1962-01-01" })])).toBe(1500);
    expect(additional([owner("one", { birthDate: "1962-01-02" })])).toBe(0);
    // The exemption reduces taxable income before the exempt bracket: (80000 - 2300 - 6000 - 1500 - 10000) at 4%.
    expect(mississippiTax(input({ people: [owner("one", { birthDate: "1950-01-01" })] }), 80000, 0, 0, 0).stateTax)
      .toBeCloseTo((80000 - 2300 - 6000 - 1500 - 10000) * .04, 6);
  });

  it("follows the enacted year-by-year rate schedule through 2030", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const taxable = 80000 - 2300 - 6000 - 10000;
    expect(mississippiTax(input({ ...terms, year: 2027 }), 80000, 0, 0, 0).stateTax).toBeCloseTo(taxable * 0.0375, 6);
    expect(mississippiTax(input({ ...terms, year: 2028 }), 80000, 0, 0, 0).stateTax).toBeCloseTo(taxable * 0.035, 6);
    expect(mississippiTax(input({ ...terms, year: 2029 }), 80000, 0, 0, 0).stateTax).toBeCloseTo(taxable * 0.0325, 6);
    expect(mississippiTax(input({ ...terms, year: 2030 }), 80000, 0, 0, 0).stateTax).toBeCloseTo(taxable * 0.03, 6);
    // The default owner (born 1975) is 75 in 2050 and would get the age exemption, so use a younger one.
    const young = [{ id: "one", birthDate: "1995-01-01", blind: false, eligibleForSeniorDeduction: true }];
    expect(mississippiTax(input({ ...terms, year: 2050, people: young }), 80000, 0, 0, 0).stateTax).toBeCloseTo(taxable * 0.03, 6);
  });

  it("excludes Social Security from the Mississippi tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("fully excludes pension income regardless of source", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000 }] });
    const ms = mississippiTax(terms, 30000, 0, 0, 0);
    expect(ms.stateTax).toBe(0);
  });

  it("excludes the retirement-ordinary figure except the early-distribution-penalty base", () => {
    const terms = input();
    const ms = mississippiTax(terms, 30000, 0, 30000, 5000);
    expect(ms.excludableRetirementOrdinary).toBe(25000);
    const taxable = Math.max(0, (30000 - 25000) - 2300 - 6000 - 10000);
    expect(ms.stateTax).toBeCloseTo(taxable * 0.04, 6);
  });

  it("requires explicit confirmation of the restricted Mississippi assumptions", () => {
    expect(() => mississippiTax(input({ mississippiContract: undefined }), 0, 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => mississippiTax(input({ year: 2025 }), 0, 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ms", msContract: "confirmed" };
    const ms = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ms.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ms.years[0].result.tax.localTax).toBe(0);
    expect(ms.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ms.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Mississippi confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ms" })).toThrow(/Confirm/);
  });
});
