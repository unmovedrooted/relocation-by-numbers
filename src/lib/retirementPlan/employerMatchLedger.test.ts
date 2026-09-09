import { describe, expect, it } from "vitest";
import { runHouseholdYear, type HouseholdYearInput, type YearAccount, type YearPerson } from "./householdYear";
import { runRetirementTimeline, type TimelineInput } from "./timeline";
import type { EmployerMatchPlan } from "./employerMatchLedger";

const person: YearPerson = { id: "one", birthDate: "1965-01-01", blind: false, eligibleForSeniorDeduction: true,
  iraBasis: 0, iraAdditionalTaxExceptionAmount: 0, rothAdditionalTaxExceptionAmount: 0,
  roth: { firstContributionYear: null, regularContributionBasis: 0, conversions: [] } };
const cash: YearAccount = { id: "cash", ownerId: "one", kind: "cash", balance: 0, annualReturn: 0, interestTreatment: "none" };
const plan: YearAccount = { id: "plan", ownerId: "one", kind: "401k", balance: 0, annualReturn: .1,
  rmd: { table: "uniform", priorDecemberBalance: 0 }, deferRmdWhileWorking: false, afterTaxBasis: 0, additionalTaxExceptionAmount: 0 };
const match: EmployerMatchPlan = { ownerId: "one", destinationAccountId: "plan", employeeAccountIds: ["plan"],
  terms: { eligibleCompensation: 50000, compensationCap: 360000, regularEmployeeCapacity: 24500, catchUpCapacity: 0,
    annualAdditionsLimit: 72000, otherAnnualAdditions: 0,
    tiers: [{ throughCompensationFraction: .06, employerPerEmployeeDollar: .5 }],
    assumptions: { eligibility: "externally-validated", matching: "annual-true-up", vesting: "fully-vested", employerTaxTreatment: "traditional-pretax" } } };
const policy = { kind: "project-2026-law", annualBracketGrowth: 0, annualPayrollCapGrowth: 0, statePolicy: "freeze-2025-proxy" } as const;
function year(changes: Partial<HouseholdYearInput> = {}): HouseholdYearInput {
  return { year: 2026, distributionDate: "2026-12-31", filing: "single", state: "fl", stateTreatment: "existing-2025-proxy",
    people: [person], accounts: [cash, plan], income: [{ ownerId: "one", kind: "wages", amount: 50000 }], spending: 30000,
    contributions: [{ accountId: "plan", amount: 10000, taxTreatment: "pretax-401k", eligibility: "externally-validated" }],
    conversions: [], withdrawalOrder: ["cash", "plan"], surplusAccountId: "cash", lossCarryover: { shortTerm: 0, longTerm: 0 },
    employerMatchPlans: [match], ...changes };
}
function reconcile(result: ReturnType<typeof runHouseholdYear>) {
  expect(result.cash.cashResidual).toBeCloseTo(0, 5);
  expect(result.cash.portfolioResidual).toBeCloseTo(0, 5);
  const wealth = result.cash.accounts.reduce((sum, account) => sum + account.ending, 0);
  const expected = result.cash.accounts.reduce((sum, account) => sum + account.opening + account.investmentChange, 0)
    + result.cash.income + result.employerContributions + result.cash.shortfall - result.cash.spending - result.tax.total;
  expect(wealth).toBeCloseTo(expected, 5);
}
describe("employer deposits in the connected ledger", () => {
  it("adds external employer wealth and growth without changing tax, income or employee cash", () => {
    const base = runHouseholdYear(year({ employerMatchPlans: [] })); const r = runHouseholdYear(year());
    expect(r.employerContributions).toBe(1500);
    expect(r.tax).toEqual(base.tax); expect(r.cash.income).toBe(50000);
    expect(r.cash.contributions).toBe(10000); expect(r.cash.surplus).toBe(base.cash.surplus);
    expect(r.nextState.accounts[1]).toMatchObject({ balance: 12650, afterTaxBasis: 0, rmd: { priorDecemberBalance: 12650 } });
    reconcile(r);
  });
  it("matches only funded saving when household cash is tight", () => {
    const r = runHouseholdYear(year({ spending: 40000 }));
    expect(r.cash.contributions).toBeCloseTo(2355 / .88, 5);
    expect(r.employerContributions).toBeCloseTo((2355 / .88) * .5, 5);
    reconcile(r);
  });
  it("cannot use employer assets to fund same-year spending or employee savings", () => {
    const r = runHouseholdYear(year({ spending: 60000 }));
    expect(r.cash.contributions).toBe(0); expect(r.employerContributions).toBe(0);
    expect(r.cash.spendingFunded).toBe(false); reconcile(r);
  });
  it("zero-rate matching preserves all previous financial results", () => {
    const base = runHouseholdYear(year({ employerMatchPlans: [] }));
    const r = runHouseholdYear(year({ employerMatchPlans: [{ ...match, terms: { ...match.terms, tiers: [] } }] }));
    expect(r.nextState).toEqual(base.nextState); expect(r.tax).toEqual(base.tax);
    expect(r.cash.accounts).toMatchObject(base.cash.accounts);
    expect(r.employerContributions).toBe(0); reconcile(r);
  });
  it("matches Roth employee contributions into a separate pretax plan without increasing its basis", () => {
    const roth: YearAccount = { id: "roth", ownerId: "one", kind: "roth-401k", balance: 0, annualReturn: 0,
      contributionBasis: 0, firstContributionYear: 2026, hasInPlanRollover: false, additionalTaxExceptionAmount: 0 };
    const r = runHouseholdYear(year({ accounts: [cash, plan, roth],
      contributions: [{ accountId: "roth", amount: 6000, taxTreatment: "after-tax", eligibility: "externally-validated" }],
      employerMatchPlans: [{ ...match, employeeAccountIds: ["roth"] }] }));
    expect(r.nextState.accounts[1].balance).toBeCloseTo(1650, 8);
    expect(r.nextState.accounts[1]).toMatchObject({ afterTaxBasis: 0 });
    expect(r.nextState.accounts[2]).toMatchObject({ balance: 6000, contributionBasis: 6000 }); reconcile(r);
  });
  it("rejects duplicate groups, cross-owner sources and invalid destinations", () => {
    expect(() => runHouseholdYear(year({ employerMatchPlans: [match, match] }))).toThrow(/one group/);
    expect(() => runHouseholdYear(year({ employerMatchPlans: [{ ...match, ownerId: "two" }] }))).toThrow(/same-owner/);
    expect(() => runHouseholdYear(year({ employerMatchPlans: [{ ...match, destinationAccountId: "cash" }] }))).toThrow(/traditional 401k/);
    expect(() => runHouseholdYear(year({ employerMatchPlans: [{ ...match, employeeAccountIds: ["cash"] }] }))).toThrow(/employee plan/);
  });
  it("rejects excessive compensation and unvalidated employee requests", () => {
    expect(() => runHouseholdYear(year({ employerMatchPlans: [{ ...match, terms: { ...match.terms, eligibleCompensation: 60000 } }] }))).toThrow(/wages/);
    expect(() => runHouseholdYear(year({ employerMatchPlans: [{ ...match, terms: { ...match.terms, regularEmployeeCapacity: 5000 } }] }))).toThrow(/capacities/);
  });
  it("carries employer deposits and growth into the following year's RMD", () => {
    const input: TimelineInput = { startYear: 2026, endYear: 2027, spendingAnnual: 0, inflation: 0, taxProjection: policy,
      filing: "single", state: "fl", stateTreatment: "existing-2025-proxy", people: [{ ...person, birthDate: "1951-01-01" }],
      accounts: [cash, plan], retirementDates: { one: "2027-01-01" },
      income: [{ id: "wage", ownerId: "one", kind: "wages", annualAmount: 50000, annualGrowth: 0, startDate: "2026-01-01", endDate: null }],
      contributions: [{ id: "save", accountId: "plan", annualAmount: 10000, annualGrowth: 0, startDate: "2026-01-01", endDate: null, taxTreatment: "pretax-401k", eligibility: "externally-validated" }],
      contributionCapacities: [{ year: 2026, ownerId: "one", planEmployee: 24500, iraCombined: 0, rothIra: 0 }],
      employerMatchesByYear: { 2026: [match] }, withdrawalOrder: ["cash", "plan"], surplusAccountId: "cash", lossCarryover: { shortTerm: 0, longTerm: 0 }, timing: "calendar-day-proration-annual-growth" };
    const snapshot = JSON.stringify(input); const r = runRetirementTimeline(input);
    expect(r.years[0].result.employerContributions).toBe(1500);
    expect(r.years[1].result.employerContributions).toBe(0);
    expect(r.years[1].result.cash.requiredWithdrawals).toBeCloseTo(12650 / 23.7, 8);
    r.years.forEach(row => { expect(row.reconciliationResidual).toBeCloseTo(0, 5); reconcile(row.result); });
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
