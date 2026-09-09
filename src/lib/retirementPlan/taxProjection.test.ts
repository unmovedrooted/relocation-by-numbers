import { describe, expect, it } from "vitest";
import { estimateHouseholdTax, taxProjectionFactors, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { runHouseholdYear, type HouseholdYearInput } from "./householdYear";
const policy = { kind: "project-2026-law", annualBracketGrowth: 0.1, annualPayrollCapGrowth: 0.1, statePolicy: "freeze-2025-proxy" } as const;
function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "fl", stateTreatment: "existing-2025-proxy", people: [
    { id: "one", birthDate: "1965-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [{ ownerId: "one", kind: "pension", amount: 50000 }], accountIncome: taxCharacter({}),
    lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}
describe("Explicit future tax projection", () => {
  it("never inflates Social Security taxability thresholds over a long horizon", () => {
    for (const year of [2026, 2046, 2056]) for (const growth of [0, .025, .1]) {
      const result = estimateHouseholdTax(input({ year,
        projection: { ...policy, annualBracketGrowth: growth, annualPayrollCapGrowth: growth },
        income: [{ ownerId: "one", kind: "pension", amount: 30000 },
          { ownerId: "one", kind: "social-security", amount: 20000 }] }));
      expect(result.taxableBenefits).toBe(9600);
    }
  });
  it("requires a policy for future years while retaining exact 2026 answers", () => {
    expect(() => estimateHouseholdTax(input({ year: 2027 }))).toThrow(/explicit/);
    expect(estimateHouseholdTax(input()).total).toBe(3820);
    expect(estimateHouseholdTax(input({ projection: policy })).total).toBe(3820);
    expect(() => taxProjectionFactors(2027, { ...policy, annualBracketGrowth: NaN })).toThrow();
  });
  it("indexes brackets/deductions, without rounding future scenario amounts to published-dollar increments", () => {
    const result = estimateHouseholdTax(input({ year: 2027, projection: policy, income: [{ ownerId: "one", kind: "pension", amount: 55000 }] }));
    expect(result.standardDeduction).toBeCloseTo(17710, 8);
    expect(result.regularFederal).toBeCloseTo(4202, 8);
    expect(result.taxYear).toBe(2027);
    expect(result.federalBaseYear).toBe(2026);
    expect(result.isProjection).toBe(true);
  });
  it("allows explicit zero bracket growth and separately projects the payroll cap", () => {
    const result = estimateHouseholdTax(input({ year: 2027, projection: { ...policy, annualBracketGrowth: 0 },
      income: [{ ownerId: "one", kind: "wages", amount: 300000 }] }));
    expect(result.standardDeduction).toBe(16100);
    expect(result.socialSecurityPayroll).toBeCloseTo(184500 * 1.1 * 0.062, 8);
    expect(result.additionalMedicare).toBeCloseTo(900, 8); // The $200k threshold is NOT indexed.
  });
  it("keeps NIIT and Social Security inclusion thresholds in nominal dollars", () => {
    const result = estimateHouseholdTax(input({ year: 2027, projection: policy,
      income: [{ ownerId: "one", kind: "pension", amount: 190000 }, { ownerId: "one", kind: "interest", amount: 30000 }] }));
    expect(result.niit).toBe(760);
    const benefits = estimateHouseholdTax(input({ year: 2027, projection: policy,
      income: [{ ownerId: "one", kind: "pension", amount: 30000 }, { ownerId: "one", kind: "social-security", amount: 20000 }] }));
    expect(benefits.taxableBenefits).toBe(9600);
  });
  it("ages taxpayers using the modeled year, including the January 1 deduction boundary", () => {
    const person = { id: "one", birthDate: "1963-01-01", blind: false, eligibleForSeniorDeduction: true };
    expect(estimateHouseholdTax(input({ people: [person] })).standardDeduction).toBe(16100);
    const next = estimateHouseholdTax(input({ year: 2027, projection: { ...policy, annualBracketGrowth: 0 }, people: [person] }));
    expect(next.standardDeduction).toBe(18150);
    expect(next.seniorDeduction).toBe(6000);
  });
  it("expires the temporary senior deduction after 2028, not all age-based deductions", () => {
    const terms = input({ projection: { ...policy, annualBracketGrowth: 0 }, people: [
      { id: "one", birthDate: "1960-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    expect(estimateHouseholdTax({ ...terms, year: 2028 }).seniorDeduction).toBe(6000);
    const later = estimateHouseholdTax({ ...terms, year: 2029 });
    expect(later.seniorDeduction).toBe(0);
    expect(later.standardDeduction).toBe(18150);
    expect(later.total).toBe(3574);
  });
  it("does not inflate the $3,000 loss deduction or nominal carryover basis", () => {
    const result = estimateHouseholdTax(input({ year: 2027, projection: policy, lossCarryover: { shortTerm: 10000, longTerm: 0 } }));
    expect(result.capitalDeduction).toBe(3000);
    expect(result.nextLossCarryover.shortTerm).toBe(7000);
  });
  it("deducts traditional employee deferrals for income tax but not payroll tax", () => {
    const result = estimateHouseholdTax(input({ income: [{ ownerId: "one", kind: "wages", amount: 50000 }],
      pretax401k: [{ ownerId: "one", amount: 10000 }] }));
    expect(result.agi).toBe(40000);
    expect(result.regularFederal).toBe(2620);
    expect(result.socialSecurityPayroll).toBe(3100);
    expect(result.medicarePayroll).toBe(725);
    expect(result.total).toBe(6445);
    expect(() => estimateHouseholdTax(input({ pretax401k: [{ ownerId: "one", amount: 1000 }] }))).toThrow(/wages/);
  });
  it("advances the Roth conversion five-tax-year clock without resetting its history", () => {
    const terms: HouseholdYearInput = { year: 2026, distributionDate: "2026-12-31", filing: "single", state: "fl",
      stateTreatment: "existing-2025-proxy", projection: policy, income: [], spending: 0,
      people: [{ id: "one", birthDate: "1980-01-01", blind: false, eligibleForSeniorDeduction: true,
        iraBasis: 0, iraAdditionalTaxExceptionAmount: 0, rothAdditionalTaxExceptionAmount: 0,
        roth: { firstContributionYear: null, regularContributionBasis: 0, conversions: [] } }],
      accounts: [{ id: "cash", ownerId: "one", kind: "cash", balance: 0, annualReturn: 0, interestTreatment: "none" },
        { id: "ira", ownerId: "one", kind: "traditional-ira", balance: 10000, annualReturn: 0,
          rmd: { table: "uniform", priorDecemberBalance: 10000 } },
        { id: "roth", ownerId: "one", kind: "roth-ira", balance: 0, annualReturn: 0 }],
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }], withdrawalOrder: ["roth"],
      surplusAccountId: "cash", lossCarryover: { shortTerm: 0, longTerm: 0 } };
    const converted = runHouseholdYear(terms);
    const next = { ...terms, ...converted.nextState, conversions: [], spending: 10000 };
    const early = runHouseholdYear({ ...next, year: 2030, distributionDate: "2030-12-31" });
    const mature = runHouseholdYear({ ...next, year: 2031, distributionDate: "2031-12-31" });
    expect(early.tax.earlyDistributionTax).toBe(1000);
    expect(early.cash.shortfall).toBe(1000);
    expect(mature.tax.earlyDistributionTax).toBe(0);
    expect(mature.cash.shortfall).toBe(0);
    expect(mature.accountIncome.retirementOrdinary).toBe(0);
  });
});
