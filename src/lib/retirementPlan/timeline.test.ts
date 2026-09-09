import { describe, expect, it } from "vitest";
import { activeYearFraction, runRetirementTimeline, type TimelineInput, type TimelineContribution } from "./timeline";
import { runHouseholdYear, type YearAccount, type YearPerson } from "./householdYear";

const person: YearPerson = { id: "one", birthDate: "1965-01-01", blind: false, eligibleForSeniorDeduction: true,
  iraBasis: 0, iraAdditionalTaxExceptionAmount: 0, rothAdditionalTaxExceptionAmount: 0,
  roth: { firstContributionYear: null, regularContributionBasis: 0, conversions: [] } };
const reserve: YearAccount = { id: "cash", ownerId: "one", kind: "cash", balance: 100000, annualReturn: 0, interestTreatment: "none" };
const plan: YearAccount = { id: "plan", ownerId: "one", kind: "401k", balance: 0, annualReturn: 0,
  rmd: { table: "uniform", priorDecemberBalance: 0 }, deferRmdWhileWorking: false, afterTaxBasis: 0, additionalTaxExceptionAmount: 0 };
const ira: YearAccount = { id: "ira", ownerId: "one", kind: "traditional-ira", balance: 100000, annualReturn: 0,
  rmd: { table: "uniform", priorDecemberBalance: 100000 } };
const roth: YearAccount = { id: "roth", ownerId: "one", kind: "roth-ira", balance: 0, annualReturn: 0 };
const policy = { kind: "project-2026-law", annualBracketGrowth: 0, annualPayrollCapGrowth: 0, statePolicy: "freeze-2025-proxy" } as const;
function input(overrides: Partial<TimelineInput> = {}): TimelineInput {
  return { startYear: 2026, endYear: 2028, spendingAnnual: 10000, inflation: 0, taxProjection: policy,
    filing: "single", state: "fl", stateTreatment: "existing-2025-proxy", people: [person], accounts: [reserve],
    retirementDates: { one: "2028-01-01" }, income: [], contributions: [], contributionCapacities: [],
    withdrawalOrder: ["cash"], surplusAccountId: "cash", lossCarryover: { shortTerm: 0, longTerm: 0 },
    timing: "calendar-day-proration-annual-growth", ...overrides };
}
const salary = { id: "salary", ownerId: "one", kind: "wages", annualAmount: 50000, annualGrowth: 0, startDate: "2026-01-01", endDate: null } as const;
const saving: TimelineContribution = { id: "saving", accountId: "plan", annualAmount: 10000, annualGrowth: 0,
  startDate: "2026-01-01", endDate: null, taxTreatment: "pretax-401k", eligibility: "externally-validated" };
const capacities = [2026, 2027, 2028].map(year => ({ year, ownerId: "one", planEmployee: 20000, iraCombined: 7000, rothIra: 7000 }));
function reconciled(result: ReturnType<typeof runRetirementTimeline>) {
  for (const row of result.years) {
    expect(row.reconciliationResidual).toBeCloseTo(0, 5);
    expect(row.result.cash.cashResidual).toBeCloseTo(0, 5);
    expect(row.result.cash.portfolioResidual).toBeCloseTo(0, 5);
    expect(row.result.cash.tax).toBeCloseTo(row.result.tax.total, 5);
    for (const account of row.result.nextState.accounts) {
      expect(Number.isFinite(account.balance)).toBe(true);
      expect(account.balance).toBeGreaterThanOrEqual(0);
    }
  }
}

describe("Calendar schedules and retirement boundaries", () => {
  it("handles UTC calendar days, leap years and exclusive endpoints", () => {
    expect(activeYearFraction(2026, "2026-01-01", "2026-07-01")).toBe(181 / 365);
    expect(activeYearFraction(2028, "2028-01-01", "2028-07-01")).toBe(182 / 366);
    expect(activeYearFraction(2028, "2028-02-29", "2028-03-01")).toBe(1 / 366);
    expect(activeYearFraction(2026, "2027-01-01", null)).toBe(0);
    expect(activeYearFraction(2026, "2025-01-01", "2026-01-01")).toBe(0);
  });
  it("stops wages and contributions on each owner's independent retirement date", () => {
    const result = runRetirementTimeline(input({ filing: "married", people: [person, { ...person, id: "two" }],
      accounts: [reserve, { ...reserve, id: "cash-two", ownerId: "two", balance: 0 }, plan, { ...plan, id: "plan-two", ownerId: "two" }],
      retirementDates: { one: "2027-07-01", two: "2028-01-01" }, income: [salary, { ...salary, id: "salary-two", ownerId: "two" }],
      contributions: [saving, { ...saving, id: "saving-two", accountId: "plan-two" }],
      contributionCapacities: [...capacities, ...capacities.map(item => ({ ...item, ownerId: "two" }))] }));
    expect(result.years[1].income.map(item => item.amount)).toEqual([50000 * 181 / 365, 50000]);
    expect(result.years[1].contributions[0].funded).toBeCloseTo(10000 * 181 / 365, 7);
    expect(result.years[1].contributions[1].funded).toBe(10000);
    expect(result.years[2].income.every(item => item.amount === 0)).toBe(true);
    expect(result.years[2].contributions.every(item => item.funded === 0)).toBe(true);
    expect(result.years[1].people.map(item => item.retiredAtYearEnd)).toEqual([true, false]);
    reconciled(result);
  });
  it("prorates pension and Social Security starts independently of employment", () => {
    const result = runRetirementTimeline(input({ retirementDates: { one: "2026-07-01" }, income: [salary,
      { ...salary, id: "pension", kind: "pension", annualAmount: 24000, startDate: "2026-07-01" },
      { ...salary, id: "ss", kind: "social-security", annualAmount: 12000, startDate: "2027-10-01" }] }));
    expect(result.years[0].income[0].amount).toBeCloseTo(50000 * 181 / 365, 8);
    expect(result.years[0].income[1].amount).toBeCloseTo(24000 * 184 / 365, 8);
    expect(result.years[0].income[2].amount).toBe(0);
    expect(result.years[1].income[2].amount).toBeCloseTo(12000 * 92 / 365, 8);
    expect(result.years[2].income.map(item => item.amount)).toEqual([0, 24000, 12000]);
    reconciled(result);
  });
  it("does not start employment or saving after an earlier retirement", () => {
    const result = runRetirementTimeline(input({ retirementDates: { one: "2025-01-01" }, accounts: [reserve, plan],
      income: [salary], contributions: [saving] }));
    expect(result.years.every(row => row.income[0].amount === 0 && row.result.cash.contributions === 0)).toBe(true);
  });
  it("inflates spending separately from each income stream without early rounding", () => {
    const result = runRetirementTimeline(input({ spendingAnnual: 10000.1234, inflation: 0.025,
      income: [{ ...salary, kind: "pension", annualAmount: 12000.4321, annualGrowth: 0.01 }] }));
    expect(result.years[2].spending).toBe(10000.1234 * 1.025 ** 2);
    expect(result.years[2].income[0].amount).toBe(12000.4321 * 1.01 ** 2);
    expect(result.years[2].endingPortfolioInStartYearDollars).toBe(result.years[2].endingPortfolio / 1.025 ** 2);
    reconciled(result);
  });
});

describe("Contribution funding and tax character", () => {
  it("funds pre-tax 401k deposits, leaving FICA on full wages and reconciling wealth", () => {
    const result = runRetirementTimeline(input({ endYear: 2026, accounts: [{ ...reserve, balance: 0 }, plan],
      income: [salary], contributions: [saving], contributionCapacities: [capacities[0]], spendingAnnual: 30000 }));
    const row = result.years[0];
    // 50k wages - 10k deferral: federal 2620, payroll 3825; surplus 3555.
    expect(row.result.tax.pretaxDeferrals).toBe(10000);
    expect(row.result.tax.total).toBe(6445);
    expect(row.contributions[0].funded).toBe(10000);
    expect(row.result.cash.surplus).toBe(3555);
    expect(row.endingPortfolio).toBe(13555);
    reconciled(result);
  });
  it("reduces savings to income after spending/tax, even with abundant old assets", () => {
    const result = runRetirementTimeline(input({ endYear: 2026, accounts: [reserve, plan], income: [salary],
      contributions: [saving], contributionCapacities: [capacities[0]], spendingAnnual: 40000 }));
    // 50k - 40k - (7645 - .12C) - C = 0 -> C=2355/.88.
    const row = result.years[0];
    expect(row.contributions[0].requested).toBe(10000);
    expect(row.contributions[0].funded).toBeCloseTo(2355 / 0.88, 5);
    expect(row.result.cash.voluntaryWithdrawals).toBe(0);
    expect(row.result.nextState.accounts[0].balance).toBeCloseTo(100000, 5);
    reconciled(result);
  });
  it("never creates assets for unfunded contributions or borrows to make them", () => {
    const result = runRetirementTimeline(input({ accounts: [{ ...reserve, balance: 0 }, plan], income: [salary],
      contributions: [saving], contributionCapacities: capacities, spendingAnnual: 60000 }));
    expect(result.firstUnfundedYear).toBe(2026);
    expect(result.allYearsFunded).toBe(false);
    expect(result.years[0].result.cash.shortfall).toBe(17645);
    expect(result.years.every(row => row.result.cash.contributions === 0 && row.endingPortfolio === 0)).toBe(true);
    reconciled(result);
  });
  it("caps combined traditional/Roth employee plans across accounts before funding", () => {
    const rothPlan: YearAccount = { id: "roth-plan", ownerId: "one", kind: "roth-401k", balance: 0, annualReturn: 0,
      firstContributionYear: 2026, contributionBasis: 0, hasInPlanRollover: false, additionalTaxExceptionAmount: 0 };
    const result = runRetirementTimeline(input({ endYear: 2026, accounts: [reserve, plan, rothPlan], income: [salary], spendingAnnual: 0,
      contributions: [{ ...saving, annualAmount: 20000 }, { ...saving, id: "roth-saving", accountId: "roth-plan", annualAmount: 20000, taxTreatment: "after-tax" }],
      contributionCapacities: [capacities[0]] }));
    expect(result.years[0].contributions.map(item => item.eligible)).toEqual([10000, 10000]);
    expect(result.years[0].result.tax.pretaxDeferrals).toBe(10000);
    expect(result.nextState.accounts[2]).toMatchObject({ balance: 10000, contributionBasis: 10000 });
    reconciled(result);
  });
  it("adds nondeductible IRA and Roth basis separately under the combined IRA capacity", () => {
    const result = runRetirementTimeline(input({ endYear: 2026, accounts: [reserve, { ...ira, balance: 0 }, roth],
      income: [salary], spendingAnnual: 0, contributions: [
        { ...saving, accountId: "ira", taxTreatment: "after-tax", annualAmount: 5000 },
        { ...saving, id: "roth-saving", accountId: "roth", taxTreatment: "after-tax", annualAmount: 5000 }],
      contributionCapacities: [capacities[0]] }));
    expect(result.years[0].contributions.map(item => item.funded)).toEqual([3500, 3500]);
    expect(result.nextState.people[0].iraBasis).toBe(3500);
    expect(result.nextState.people[0].roth).toMatchObject({ regularContributionBasis: 3500, firstContributionYear: 2026 });
    expect(result.years[0].result.tax.pretaxDeferrals).toBe(0);
    expect(result.years[0].result.tax.total).toBe(7645);
    reconciled(result);
  });
  it("creates distinct dated brokerage lots rather than adding cash without basis", () => {
    const broker: YearAccount = { id: "broker", ownerId: "one", kind: "taxable", balance: 0, annualReturn: 0.1,
      returnTreatment: "price-only", transactionFees: 0, lots: [] };
    const result = runRetirementTimeline(input({ accounts: [reserve, broker], income: [salary], contributions: [
      { ...saving, accountId: "broker", taxTreatment: "after-tax", annualAmount: 1000, purchasePrices: { 2026: 100, 2027: 110 } }] }));
    const last = result.nextState.accounts[1];
    if (last.kind !== "taxable") throw new Error("Expected brokerage");
    expect(last.lots).toHaveLength(2);
    expect(last.lots[0].lot).toMatchObject({ adjustedBasis: 1000, shares: 10, acquiredDate: "2026-12-31" });
    expect(last.lots[1].lot.adjustedBasis).toBe(1000);
    expect(last.balance).toBeCloseTo(2541, 6); // 1000*1.1^3 + 1000*1.1^2
    reconciled(result);
  });
  it("treats cash deposits as principal, not taxable interest", () => {
    const bank: YearAccount = { id: "bank", ownerId: "one", kind: "cash", balance: 0, annualReturn: 0.05, interestTreatment: "taxable" };
    const result = runRetirementTimeline(input({ endYear: 2026, accounts: [reserve, bank], income: [salary], contributions: [
      { ...saving, accountId: "bank", taxTreatment: "after-tax", annualAmount: 1000 }] }));
    expect(result.nextState.accounts[1].balance).toBe(1050);
    expect(result.years[0].result.accountIncome.investmentOrdinary).toBe(50);
    reconciled(result);
  });
  it("does not turn excess RMDs into contribution funding", () => {
    const result = runRetirementTimeline(input({ endYear: 2026, spendingAnnual: 0,
      people: [{ ...person, birthDate: "1951-01-01" }], accounts: [{ ...reserve, balance: 0 },
        { ...ira, balance: 246000, rmd: { table: "uniform", priorDecemberBalance: 246000 } },
        { ...reserve, id: "bank", balance: 0 }], contributions: [
        { ...saving, accountId: "bank", taxTreatment: "after-tax", annualAmount: 5000 }] }));
    expect(result.years[0].result.cash.requiredWithdrawals).toBe(10000);
    expect(result.years[0].contributions[0].funded).toBe(0);
    expect(result.years[0].result.cash.surplus).toBe(10000);
    reconciled(result);
  });
});

describe("State continuity and plan failures", () => {
  it("matches a direct one-year run when no schedules need expansion", () => {
    const terms = input({ endYear: 2026 });
    const projected = runRetirementTimeline(terms).years[0].result;
    const direct = runHouseholdYear({ year: 2026, distributionDate: "2026-12-31", filing: terms.filing,
      state: terms.state, stateTreatment: terms.stateTreatment, projection: policy, accounts: terms.accounts, people: terms.people,
      income: [], spending: terms.spendingAnnual, conversions: [], withdrawalOrder: terms.withdrawalOrder,
      surplusAccountId: terms.surplusAccountId, lossCarryover: terms.lossCarryover });
    expect(projected).toEqual(direct);
  });
  it("carries prior December balances into each RMD without reusing the opening value", () => {
    const result = runRetirementTimeline(input({ people: [{ ...person, birthDate: "1951-01-01" }], spendingAnnual: 0,
      accounts: [{ ...reserve, balance: 0 }, { ...ira, balance: 246000, annualReturn: 0.1,
        rmd: { table: "uniform", priorDecemberBalance: 246000 } }], withdrawalOrder: ["cash", "ira"] }));
    expect(result.years[0].result.cash.requiredWithdrawals).toBe(10000);
    expect(result.years[1].result.cash.requiredWithdrawals).toBeCloseTo(259600 / 23.7, 6);
    expect(result.years[2].result.cash.requiredWithdrawals).toBeCloseTo((259600 - 259600 / 23.7) * 1.1 / 22.9, 6);
    reconciled(result);
  });
  it("ends a work-based 401k RMD deferral in the retirement calendar year", () => {
    const result = runRetirementTimeline(input({ people: [{ ...person, birthDate: "1951-01-01" }], spendingAnnual: 0,
      retirementDates: { one: "2027-07-01" }, accounts: [reserve, { ...plan, balance: 246000, deferRmdWhileWorking: true,
        rmd: { table: "uniform", priorDecemberBalance: 246000 } }] }));
    expect(result.years[0].result.cash.requiredWithdrawals).toBe(0);
    expect(result.years[1].result.cash.requiredWithdrawals).toBeCloseTo(246000 / 23.7, 6);
    reconciled(result);
  });
  it("carries remaining IRA basis and separate Roth conversion years forward", () => {
    const result = runRetirementTimeline(input({ people: [{ ...person, iraBasis: 20000 }], accounts: [reserve, ira, roth],
      spendingAnnual: 0, conversionsByYear: {
        2026: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }],
        2027: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }],
      } }));
    expect(result.nextState.people[0].iraBasis).toBe(16000);
    expect(result.nextState.people[0].roth.conversions).toEqual([
      { year: 2026, taxablePrincipal: 8000, nontaxablePrincipal: 2000 },
      { year: 2027, taxablePrincipal: 8000, nontaxablePrincipal: 2000 }]);
    reconciled(result);
  });
  it("carries unused capital losses in nominal dollars and consumes them in later income years", () => {
    const result = runRetirementTimeline(input({ lossCarryover: { shortTerm: 10000, longTerm: 0 }, spendingAnnual: 0,
      income: [{ ...salary, kind: "pension", annualAmount: 30000, startDate: "2027-01-01" }], inflation: 0.1 }));
    expect(result.years.map(row => row.result.nextState.lossCarryover.shortTerm)).toEqual([10000, 7000, 4000]);
    reconciled(result);
  });
  it("keeps a failed year failed even if a later pension rebuilds assets", () => {
    const result = runRetirementTimeline(input({ accounts: [{ ...reserve, balance: 5000 }],
      income: [{ ...salary, kind: "pension", annualAmount: 30000, startDate: "2027-01-01" }] }));
    expect(result.firstUnfundedYear).toBe(2026);
    expect(result.allYearsFunded).toBe(false);
    expect(result.years[0].endingPortfolio).toBe(0);
    expect(result.years[1].endingPortfolio).toBeGreaterThan(0);
    reconciled(result);
  });
  it("is deterministic and does not mutate opening basis or nested schedules", () => {
    const terms = input({ accounts: [reserve, ira, roth], people: [{ ...person, iraBasis: 20000 }],
      conversionsByYear: { 2026: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }] } });
    const original = JSON.stringify(terms);
    expect(runRetirementTimeline(terms)).toEqual(runRetirementTimeline(terms));
    expect(JSON.stringify(terms)).toBe(original);
  });
  it("handles a zero-asset, zero-spending horizon without NaN or fabricated cash", () => {
    const result = runRetirementTimeline(input({ accounts: [{ ...reserve, balance: 0 }], spendingAnnual: 0, endYear: 2065 }));
    expect(result.allYearsFunded).toBe(true);
    expect(result.years.every(row => row.endingPortfolio === 0 && row.result.tax.total === 0)).toBe(true);
    reconciled(result);
  });
  it("requires fresh joint-life divisors and applies the supplied year-specific values", () => {
    const result = runRetirementTimeline(input({ people: [{ ...person, birthDate: "1951-01-01" }], spendingAnnual: 0,
      accounts: [reserve, { ...ira, rmd: { table: "joint-life", divisor: 50, priorDecemberBalance: 100000 } }],
      jointLifeDivisors: { ira: { 2026: 40, 2027: 39, 2028: 38 } } }));
    expect(result.years[0].result.cash.requiredWithdrawals).toBe(2500);
    expect(result.years[1].result.cash.requiredWithdrawals).toBe(97500 / 39);
    reconciled(result);
  });
  it("reconciles 40 combinations of inflation, return, retirement and depletion", () => {
    for (let i = 0; i < 40; i++) {
      const result = runRetirementTimeline(input({ endYear: 2040, inflation: (i % 5) * 0.01,
        spendingAnnual: i * 2000.123, accounts: [reserve, { ...ira, annualReturn: (i % 7 - 3) * 0.03 }],
        withdrawalOrder: ["cash", "ira"], income: [salary], retirementDates: { one: `${2026 + i % 8}-07-01` } }));
      reconciled(result);
    }
  });
});

describe("Unsupported/invalid timeline contracts fail explicitly", () => {
  it("rejects missing future-tax policy, invalid horizon, dates and amounts", () => {
    expect(() => runRetirementTimeline(input({ taxProjection: undefined! }))).toThrow(/explicit/);
    expect(() => runRetirementTimeline(input({ endYear: 2025 }))).toThrow(/horizon/);
    expect(() => runRetirementTimeline(input({ retirementDates: { one: "2027-02-30" } }))).toThrow(/date/);
    expect(() => runRetirementTimeline(input({ inflation: NaN }))).toThrow();
    expect(() => runRetirementTimeline(input({ spendingAnnual: -1 }))).toThrow();
    expect(() => runRetirementTimeline(input({ income: [{ ...salary, annualAmount: Infinity }] }))).toThrow();
  });
  it("requires per-year contribution capacities and prevents duplicate schedule keys", () => {
    expect(() => runRetirementTimeline(input({ accounts: [reserve, plan], income: [salary], contributions: [saving] }))).toThrow(/capacity/);
    expect(() => runRetirementTimeline(input({ income: [salary, salary] }))).toThrow(/unique/);
  });
  it("does not repeat one-off exception amounts or a fixed joint-life divisor", () => {
    expect(() => runRetirementTimeline(input({ people: [{ ...person, iraAdditionalTaxExceptionAmount: 1000 }] }))).toThrow(/exception/);
    expect(() => runRetirementTimeline(input({ accounts: [reserve, { ...ira, rmd: { table: "joint-life", divisor: 30, priorDecemberBalance: 100000 } }] }))).toThrow(/current-year joint-life/);
  });
});
