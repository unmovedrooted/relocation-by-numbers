import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { newYorkTax } from "./newYorkTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ny", cityId: "nyc-ny", stateTreatment: "verified-resident-location",
    newYorkContract: "fixed-2026-precredit", people: [{ id: "one", birthDate: "1960-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), retirementIncome: [], lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}
describe("restricted New York annual settlement", () => {
  it("independently computes $80k wages, including NYC in total exactly once", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ny = estimateHouseholdTax(terms), fl = estimateHouseholdTax({ ...terms, state: "fl", cityId: "" });
    expect(ny.stateTax).toBeCloseTo(3723, 6);
    expect(ny.localTax).toBeCloseTo(2665.89, 6);
    expect(ny.total - fl.total).toBeCloseTo(6388.89, 6);
    expect(ny.regularFederal).toBe(fl.regularFederal);
  });
  it("subtracts only federally taxable SS, not gross benefits twice", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }, { ownerId: "one", kind: "social-security", amount: 30000 }] });
    const ny = estimateHouseholdTax(terms);
    expect(ny.taxableBenefits).toBe(25500);
    expect(ny.stateTax).toBeCloseTo(3723, 6);
    expect(ny.localTax).toBeCloseTo(2665.89, 6);
  });
  it("does not transfer unused pension exclusion between spouses", () => {
    const terms = input({ filing: "married", people: [...input().people, { ...input().people[0], id: "two" }],
      income: [{ ownerId: "one", kind: "pension", pensionType: "private", amount: 30000 },
        { ownerId: "two", kind: "pension", pensionType: "private", amount: 15000 }] });
    const result = newYorkTax(terms, 45000, 0);
    expect(result.pensionExclusion).toBe(35000);
    expect(result.nyAgi).toBe(10000);
    expect(result.stateTax).toBe(0);
  });
  it.each(["ny-government", "federal-government"] as const)("subtracts eligible %s pension without an age limit", pensionType => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1980-01-01" }], income: [{ ownerId: "one", kind: "pension", pensionType, amount: 60000 }] });
    expect(newYorkTax(terms, 60000, 0).governmentExclusion).toBe(60000);
    expect(estimateHouseholdTax(terms).stateTax).toBe(0);
  });
  it("shares one $20k cap between IRA conversions and distributions", () => {
    const terms = input({ accountIncome: taxCharacter({ retirementOrdinary: 50000 }), retirementIncome: [
      { ownerId: "one", date: "2026-12-31", source: "traditional-ira", amount: 30000 },
      { ownerId: "one", date: "2026-12-31", source: "ira-conversion", amount: 20000 }] });
    expect(newYorkTax(terms, 50000, 0).pensionExclusion).toBe(20000);
    expect(() => newYorkTax({ ...terms, retirementIncome: [] }, 50000, 0)).toThrow(/reconciled/);
  });
  it("applies the exact transaction-age boundary", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1966-07-02" }], accountIncome: taxCharacter({ retirementOrdinary: 10000 }),
      retirementIncome: [{ ownerId: "one", date: "2026-01-01", source: "ira-conversion", amount: 10000 }] });
    expect(newYorkTax(terms, 10000, 0).pensionExclusion).toBe(0);
    expect(newYorkTax({ ...terms, retirementIncome: [{ ...terms.retirementIncome![0], date: "2026-01-02" }] }, 10000, 0).pensionExclusion).toBe(10000);
  });
  it("includes the 2026 high-income recapture phase-in", () => {
    expect(newYorkTax(input(), 120000, 0).stateTax).toBeCloseTo(6179.799, 6);
    expect(newYorkTax(input(), 30000000, 0).stateTax).toBeCloseTo((30000000 - 8000) * .109, 6);
  });
  it("blocks missing assumptions, ambiguous localities and eligibility", () => {
    expect(() => newYorkTax(input({ newYorkContract: undefined }), 0, 0)).toThrow(/Confirm/);
    expect(() => newYorkTax(input({ cityId: "" }), 0, 0)).toThrow(/Yonkers/);
    expect(() => newYorkTax(input({ income: [{ ownerId: "one", kind: "pension", amount: 1 }] }), 1, 0)).toThrow(/Specify/);
    expect(() => newYorkTax(input({ accountIncome: taxCharacter({ retirementOrdinary: 1 }) }), 1, 0)).toThrow(/reconciled/);
  });
  it("blocks pension birthday-year allocation and unverified plan withdrawals", () => {
    expect(() => newYorkTax(input({ people: [{ ...input().people[0], birthDate: "1966-07-02" }],
      income: [{ ownerId: "one", kind: "pension", pensionType: "private", amount: 10000 }] }), 10000, 0)).toThrow(/payment-date/);
    expect(() => newYorkTax(input({ accountIncome: taxCharacter({ retirementOrdinary: 1000 }), retirementIncome: [
      { ownerId: "one", source: "401k", date: "2026-12-31", amount: 1000 }] }), 1000, 0)).toThrow(/eligibility/);
  });
  it("handles zero, decimals and married recapture independently", () => {
    expect(newYorkTax(input(), 0, 0).stateTax).toBe(0);
    expect(newYorkTax(input(), 8000.25, 0).stateTax).toBeCloseTo(.25 * .039, 10);
    // 120000 - 16050 = 103950. First brackets = 668.85 + 283.80 + 221.45;
    // remaining 76050 * .054 = 4106.7, recapture = 333 * .247.
    expect(newYorkTax(input({ filing: "married" }), 120000, 0).stateTax).toBeCloseTo(5363.051, 6);
  });
  it("settles a complete projection with state and local cash costs", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ny", cityId: "nyc-ny", nyContract: "confirmed", "one-pensionType": "private" };
    const ny = runRetirementTimeline(buildPreviewInput(values));
    const outside = runRetirementTimeline(buildPreviewInput({ ...values, cityId: "ny-outside-nyc-yonkers" }));
    expect(ny.years[0].result.tax.localTax).toBeGreaterThan(0);
    expect(outside.years.every(row => row.result.tax.localTax === 0)).toBe(true);
    expect(ny.years[0].endingPortfolio).toBeLessThan(outside.years[0].endingPortfolio);
    expect(ny.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });
});
