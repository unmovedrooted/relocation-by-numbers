import { describe, expect, it } from "vitest";
import { iraEligibility, iraEligibility2026, type IraEligibilityInput } from "./contributionEligibility";
import { projectedIraThresholds } from "./thresholdProjection";
import { runEligibleContributions, type IraOwnerPolicy } from "./eligibleContributions2026";
import { runRetirementTimeline, type TimelineInput } from "./timeline";
import type { HouseholdYearInput, YearAccount } from "./householdYear";

const projection = { kind: "project-2026-law", annualBracketGrowth: .1, annualPayrollCapGrowth: .1, statePolicy: "freeze-2025-proxy" } as const;
const eligibility = (patch: Partial<IraEligibilityInput> = {}): IraEligibilityInput => ({ year: 2027, ageAtYearEnd: 49,
  filing: "single", taxableCompensation: 200000, rothMagi: 175500, deductionMagi: 94000,
  coveredByWorkplacePlan: true, spouseCoveredByWorkplacePlan: false, traditionalContributed: 0, rothContributed: 0, ...patch });
const cash: YearAccount = { id: "cash", ownerId: "one", kind: "cash", balance: 100000, annualReturn: 0, interestTreatment: "none" };
const ira: YearAccount = { id: "ira", ownerId: "one", kind: "traditional-ira", balance: 0, annualReturn: 0, rmd: { table: "uniform", priorDecemberBalance: 0 } };
const owner: IraOwnerPolicy = { ownerId: "one", traditionalAccountId: "ira", coveredByWorkplacePlan: true,
  spouseCoveredByWorkplacePlan: false, deductionChoice: "deduct-eligible", allocation: "traditional-first" };
function annual(patch: Partial<HouseholdYearInput> = {}): HouseholdYearInput {
  return { year: 2027, distributionDate: "2027-12-31", projection, filing: "single", state: "fl", stateTreatment: "existing-2025-proxy",
    people: [{ id: "one", birthDate: "1978-06-01", blind: false, eligibleForSeniorDeduction: true, iraBasis: 0,
      iraAdditionalTaxExceptionAmount: 0, rothAdditionalTaxExceptionAmount: 0,
      roth: { firstContributionYear: null, regularContributionBasis: 0, conversions: [] } }],
    accounts: [cash, ira], income: [{ ownerId: "one", kind: "wages", amount: 94000 }], spending: 10000,
    contributions: [{ accountId: "ira", amount: 20000, taxTreatment: "after-tax", eligibility: "externally-validated" }],
    conversions: [], withdrawalOrder: ["cash", "ira"], surplusAccountId: "cash", lossCarryover: { shortTerm: 0, longTerm: 0 }, ...patch };
}

describe("Projected IRA eligibility", () => {
  it("preserves verified 2026 behavior and requires an explicit future policy", () => {
    expect(iraEligibility(eligibility({ year: 2026 }))).toEqual(iraEligibility2026(eligibility({ year: 2026 })));
    expect(() => iraEligibility(eligibility())).toThrow(/explicit/);
    expect(() => iraEligibility2026(eligibility())).toThrow(/2026/);
  });
  it("indexes phaseout starting points to nearest $1000 but never widens bands", () => {
    const t = projectedIraThresholds(2027, .1);
    expect(t.rothSingle).toEqual([168000, 183000]);
    expect(t.rothMarried).toEqual([266000, 276000]);
    expect(t.deductionSingle).toEqual([89000, 99000]);
    expect(t.deductionMarried).toEqual([142000, 162000]);
    for (const year of [2026, 2036, 2060]) {
      const ranges = projectedIraThresholds(year, .03);
      expect(ranges.rothSingle[1] - ranges.rothSingle[0]).toBe(15000);
      expect(ranges.deductionMarried[1] - ranges.deductionMarried[0]).toBe(20000);
      expect(ranges.deductionSpouseCovered[1] - ranges.deductionSpouseCovered[0]).toBe(10000);
    }
  });
  it.each([[168000, 8000], [175500, 4000], [182999, 200], [183000, 0]])("Roth MAGI %i yields %i", (magi, amount) => {
    expect(iraEligibility(eligibility({ rothMagi: magi }), projection).rothRemaining).toBe(amount);
  });
  it("uses each year's age, combined room, compensation and catch-up increment", () => {
    expect(iraEligibility(eligibility({ ageAtYearEnd: 50 }), projection).annualLimit).toBe(9200);
    expect(iraEligibility(eligibility({ taxableCompensation: 0 }), projection).combinedLimit).toBe(0);
    expect(iraEligibility(eligibility({ rothMagi: 100000, traditionalContributed: 3000, rothContributed: 1000 }), projection).rothRemaining).toBe(4000);
    expect(iraEligibility(eligibility(), { ...projection, annualBracketGrowth: 0 }).annualLimit).toBe(7500);
  });
  it("deducts the projected phaseout amount and preserves the nondeductible basis", () => {
    const result = runEligibleContributions(annual(), [owner]);
    // Limit $8k; deduction band $89k–$99k; $94k MAGI = half deductible.
    expect(result.tax.iraDeduction).toBe(4000);
    expect(result.tax.agi).toBe(90000);
    expect(result.nextState.people[0].iraBasis).toBe(4000);
    expect(result.eligibleContributions[0].amount).toBe(8000);
    expect(result.cash.accounts.find(a => a.accountId === "ira")!.contributionDeposit).toBe(8000);
  });
  it("re-evaluates MAGI after actual funded pretax contributions in a future year", () => {
    const plan: YearAccount = { id: "plan", ownerId: "one", kind: "401k", balance: 0, annualReturn: 0,
      rmd: { table: "uniform", priorDecemberBalance: 0 }, afterTaxBasis: 0, deferRmdWhileWorking: false, additionalTaxExceptionAmount: 0 };
    const result = runEligibleContributions(annual({ accounts: [cash, ira, plan], income: [{ ownerId: "one", kind: "wages", amount: 104000 }],
      contributions: [...annual().contributions!, { accountId: "plan", amount: 10000, taxTreatment: "pretax-401k", eligibility: "externally-validated" }] }), [owner]);
    expect(result.tax.pretaxDeferrals).toBe(10000);
    expect(result.tax.iraDeduction).toBe(4000);
    expect(result.tax.agi + result.tax.iraDeduction).toBe(94000);
  });
  it("retains unsupported-case guards instead of guessing a future tax result", () => {
    expect(() => runEligibleContributions(annual({ projection: undefined }), [owner])).toThrow(/explicit/);
    expect(() => runEligibleContributions(annual({ income: [...annual().income, { ownerId: "one", kind: "social-security", amount: 1 }] }), [owner])).toThrow(/wages\/pensions/);
    expect(() => runEligibleContributions(annual({ spending: 200000 }), [owner])).toThrow(/shortfalls/);
  });
  it("funds projected Roth room with after-tax dollars and records contribution basis", () => {
    const roth: YearAccount = { id: "roth", ownerId: "one", kind: "roth-ira", balance: 0, annualReturn: 0 };
    const result = runEligibleContributions(annual({ accounts: [cash, roth], income: [{ ownerId: "one", kind: "wages", amount: 175500 }],
      contributions: [{ accountId: "roth", amount: 8000, taxTreatment: "after-tax", eligibility: "externally-validated" }], withdrawalOrder: ["cash"] }),
    [{ ...owner, traditionalAccountId: undefined, rothAccountId: "roth" }]);
    expect(result.eligibleContributions[0].amount).toBe(4000);
    expect(result.tax.iraDeduction).toBe(0);
    expect(result.tax.agi).toBe(175500);
    expect(result.nextState.people[0].roth.regularContributionBasis).toBe(4000);
    expect(result.nextState.people[0].roth.firstContributionYear).toBe(2027);
  });
});

describe("Annual IRA timeline integration", () => {
  function timeline(): TimelineInput {
    const base = annual();
    return { startYear: 2027, endYear: 2029, spendingAnnual: 10000, inflation: 0, taxProjection: projection,
      filing: base.filing, state: base.state, stateTreatment: base.stateTreatment, people: base.people, accounts: base.accounts,
      retirementDates: { one: "2029-01-01" }, income: [{ id: "wages", ownerId: "one", kind: "wages", annualAmount: 100000, annualGrowth: 0,
        startDate: "2027-01-01", endDate: null }], contributions: [{ id: "saving", accountId: "ira", annualAmount: 20000,
        annualGrowth: 0, startDate: "2027-01-01", endDate: null, taxTreatment: "after-tax", eligibility: "externally-validated" }],
      contributionCapacities: [], iraPoliciesByYear: Object.fromEntries([2027, 2028, 2029].map(year => [year, [{ ...owner, coveredByWorkplacePlan: false }]])),
      withdrawalOrder: ["cash", "ira"], surplusAccountId: "cash", lossCarryover: base.lossCarryover, timing: "calendar-day-proration-annual-growth" };
  }
  it("recalculates age and caps each year, then stops contributions at retirement", () => {
    const input = timeline();
    const snapshot = JSON.stringify(input);
    const result = runRetirementTimeline(input);
    expect(result.years.map(row => row.contributions[0].eligible)).toEqual([8000, 10300, 0]);
    expect(result.years.map(row => row.result.tax.iraDeduction)).toEqual([8000, 10300, 0]);
    expect(result.years.map(row => row.result.nextState.people[0].iraBasis)).toEqual([0, 0, 0]);
    expect(result.years.every(row => Math.abs(row.reconciliationResidual) < 1e-6)).toBe(true);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
  it("respects annual coverage/deduction elections and accumulates only nondeductible basis", () => {
    const input = timeline();
    const result = runRetirementTimeline({ ...input, iraPoliciesByYear: { ...input.iraPoliciesByYear,
      2028: [{ ...owner, coveredByWorkplacePlan: false, deductionChoice: "nondeductible" }] } });
    expect(result.years[1].result.tax.iraDeduction).toBe(0);
    expect(result.years[1].result.nextState.people[0].iraBasis).toBe(10300);
  });
  it("does not silently replace missing annual eligibility with an assumed limit", () => {
    expect(() => runRetirementTimeline({ ...timeline(), iraPoliciesByYear: { 2027: [owner] } })).toThrow(/Missing explicit contribution capacity/);
  });
});
