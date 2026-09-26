import { describe, expect, it } from "vitest";
import { runHouseholdYear, type HouseholdYearInput, type YearAccount, type YearPerson } from "./householdYear";
import { deferredAnnuitySurrender } from "./accountTax";

const person: YearPerson = { id: "one", birthDate: "1965-01-01", blind: false, eligibleForSeniorDeduction: true,
  iraBasis: 0, iraAdditionalTaxExceptionAmount: 0, rothAdditionalTaxExceptionAmount: 0,
  roth: { firstContributionYear: null, regularContributionBasis: 0, conversions: [] } };
const reserve: YearAccount = { id: "reserve", ownerId: "one", kind: "cash", balance: 0, annualReturn: 0, interestTreatment: "none" };
const ira: YearAccount = { id: "ira", ownerId: "one", kind: "traditional-ira", balance: 100000, annualReturn: 0,
  rmd: { table: "uniform", priorDecemberBalance: 100000 } };
const roth: YearAccount = { id: "roth", ownerId: "one", kind: "roth-ira", balance: 0, annualReturn: 0 };
function input(overrides: Partial<HouseholdYearInput> = {}): HouseholdYearInput {
  return { year: 2026, distributionDate: "2026-07-01", filing: "single", state: "fl", stateTreatment: "existing-2025-proxy",
    people: [person], accounts: [reserve, ira, roth], income: [], spending: 40000, conversions: [],
    withdrawalOrder: ["reserve", "ira", "roth"], surplusAccountId: "reserve", lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}
function reconciled(result: ReturnType<typeof runHouseholdYear>) {
  expect(result.retirementIncome.reduce((sum, item) => sum + item.amount, 0)).toBeCloseTo(result.accountIncome.retirementOrdinary, 6);
  expect(result.cash.cashResidual).toBeCloseTo(0, 5);
  expect(result.cash.portfolioResidual).toBeCloseTo(0, 5);
  expect(result.cash.tax).toBeCloseTo(result.tax.total, 6);
  for (const account of result.nextState.accounts) {
    expect(Number.isFinite(account.balance)).toBe(true);
    expect(account.balance).toBeGreaterThanOrEqual(0);
    expect(account.balance).toBeCloseTo(result.cash.accounts.find(item => item.accountId === account.id)!.ending, 6);
  }
}

describe("Connected annual household: independent cash and tax answers", () => {
  it("retains each IRA owner's taxable distribution and conversion separately", () => {
    const result = runHouseholdYear(input({ filing: "married", spending: 150000,
      people: [person, { ...person, id: "two" }],
      accounts: [reserve, ira, roth, { ...ira, id: "two-ira", ownerId: "two" }],
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }],
      withdrawalOrder: ["ira", "two-ira"] }));
    expect(result.retirementIncome).toContainEqual({ ownerId: "one", source: "ira-conversion", date: "2026-07-01", amount: 10000, earlyDistributionTaxable: 0 });
    expect(result.retirementIncome.find(item => item.ownerId === "one" && item.source === "traditional-ira")?.amount).toBe(90000);
    expect(result.retirementIncome.find(item => item.ownerId === "two" && item.source === "traditional-ira")?.amount).toBeGreaterThan(60000);
    reconciled(result);
  });
  it("funds $40,000 spending from a pre-tax IRA with actual 2026 federal brackets", () => {
    // Tax=.12W-2180 in this bracket. W-tax=40k -> W=37820/.88.
    const result = runHouseholdYear(input());
    expect(result.cash.voluntaryWithdrawals).toBeCloseTo(37820 / 0.88, 5);
    expect(result.tax.total).toBeCloseTo(37820 / 0.88 - 40000, 5);
    expect(result.nextState.accounts.find(item => item.id === "ira")!.balance).toBeCloseTo(100000 - 37820 / 0.88, 5);
    expect(result.cash.spendingFunded).toBe(true);
    reconciled(result);
  });
  it("uses aggregate IRA basis across accounts and saves only FINAL basis", () => {
    const result = runHouseholdYear(input({ people: [{ ...person, iraBasis: 20000 }],
      accounts: [reserve, { ...ira, balance: 40000 }, { ...ira, id: "ira-b", balance: 60000 }, roth],
      withdrawalOrder: ["ira", "ira-b"] }));
    // Taxable fraction 80%; tax=.096W-2180; W=37820/.904.
    const gross = 37820 / 0.904;
    expect(result.cash.voluntaryWithdrawals).toBeCloseTo(gross, 5);
    expect(result.nextState.people[0].iraBasis).toBeCloseTo(20000 - gross * 0.2, 5);
    expect(result.accountIncome.retirementOrdinary).toBeCloseTo(gross * 0.8, 5);
    expect(result.nextState.accounts.find(item => item.id === "ira")!.balance).toBe(0);
    reconciled(result);
  });
  it("pays a $40k conversion's tax from cash without counting conversion as spending cash", () => {
    const result = runHouseholdYear(input({ accounts: [{ ...reserve, balance: 10000 }, ira, roth], spending: 0,
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 40000 }] }));
    expect(result.tax.total).toBe(2620);
    expect(result.cash.voluntaryWithdrawals).toBeCloseTo(2620, 5);
    expect(result.nextState.accounts.find(item => item.id === "reserve")!.balance).toBeCloseTo(7380, 5);
    expect(result.nextState.accounts.find(item => item.id === "ira")!.balance).toBe(60000);
    expect(result.nextState.accounts.find(item => item.id === "roth")!.balance).toBe(40000);
    expect(result.nextState.people[0].roth).toEqual({ firstContributionYear: 2026, regularContributionBasis: 0,
      conversions: [{ year: 2026, taxablePrincipal: 40000, nontaxablePrincipal: 0 }] });
    reconciled(result);
  });
  it("pays conversion taxes and taxes on extra IRA withdrawals with one combined calculation", () => {
    const result = runHouseholdYear(input({ accounts: [{ ...reserve, balance: 1500 }, ira, roth], spending: 20000,
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 40000 }] }));
    // $1,500 cash + $24,000 IRA - $5,500 combined tax = $20,000 spending.
    expect(result.cash.voluntaryWithdrawals).toBeCloseTo(25500, 5);
    expect(result.tax.total).toBeCloseTo(5500, 5);
    expect(result.accountIncome.retirementOrdinary).toBeCloseTo(64000, 5);
    expect(result.nextState.accounts.find(item => item.id === "ira")!.balance).toBeCloseTo(36000, 5);
    expect(result.nextState.people[0].roth.conversions[0].taxablePrincipal).toBe(40000);
    reconciled(result);
  });
  it("carries the taxable and nontaxable portions of an IRA conversion into Roth history", () => {
    const result = runHouseholdYear(input({ people: [{ ...person, iraBasis: 20000 }], spending: 0,
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }] }));
    expect(result.nextState.people[0].iraBasis).toBe(18000);
    expect(result.nextState.people[0].roth.conversions).toEqual([{ year: 2026, taxablePrincipal: 8000, nontaxablePrincipal: 2000 }]);
    expect(result.accountIncome.retirementOrdinary).toBe(8000);
    expect(result.tax.total).toBe(0);
    reconciled(result);
  });
  it("funds nonqualified Roth IRA earnings using regular tax and early-distribution tax", () => {
    const result = runHouseholdYear(input({ people: [{ ...person, birthDate: "1980-01-01",
      roth: { firstContributionYear: 2010, regularContributionBasis: 20000, conversions: [] } }],
      accounts: [reserve, { ...roth, balance: 100000 }], withdrawalOrder: ["roth"] }));
    // Tax=.1*(W-36100) + .1*(W-20000); W-tax=40000 -> W=42987.5.
    expect(result.cash.voluntaryWithdrawals).toBeCloseTo(42987.5, 5);
    expect(result.tax.regularFederal).toBeCloseTo(688.75, 5);
    expect(result.tax.earlyDistributionTax).toBeCloseTo(2298.75, 5);
    reconciled(result);
  });
  it("combines salary and pension but applies payroll tax only to salary", () => {
    const result = runHouseholdYear(input({ accounts: [reserve], withdrawalOrder: [], income: [
      { ownerId: "one", kind: "wages", amount: 30000 }, { ownerId: "one", kind: "pension", amount: 20000 }] }));
    expect(result.tax.regularFederal).toBe(3820);
    expect(result.tax.socialSecurityPayroll + result.tax.medicarePayroll).toBe(2295);
    expect(result.tax.total).toBe(6115);
    expect(result.cash.surplus).toBe(3885);
    expect(result.nextState.accounts[0].balance).toBe(3885);
    reconciled(result);
  });
  it("connects Social Security inclusion, deductions and retained cash", () => {
    const result = runHouseholdYear(input({ people: [{ ...person, birthDate: "1960-01-01" }], accounts: [reserve],
      withdrawalOrder: [], spending: 48000, income: [
        { ownerId: "one", kind: "pension", amount: 30000 }, { ownerId: "one", kind: "social-security", amount: 20000 }] }));
    expect(result.tax.taxableBenefits).toBe(9600);
    expect(result.tax.total).toBe(1606);
    expect(result.cash.surplus).toBe(394);
    reconciled(result);
  });
  it("computes RMDs from prior December balances and retains excess cash", () => {
    const result = runHouseholdYear(input({ people: [{ ...person, birthDate: "1951-01-01" }], spending: 6000,
      accounts: [reserve, { ...ira, balance: 246000, rmd: { table: "uniform", priorDecemberBalance: 246000 } }], withdrawalOrder: ["ira"] }));
    expect(result.cash.requiredWithdrawals).toBe(10000);
    expect(result.tax.total).toBe(0);
    expect(result.cash.surplus).toBe(4000);
    expect(result.nextState.accounts.find(item => item.id === "ira")!.balance).toBe(236000);
    reconciled(result);
  });
  it("keeps spouse RMDs and IRA basis separate", () => {
    const result = runHouseholdYear(input({ filing: "married", people: [
      { ...person, birthDate: "1951-01-01" }, { ...person, id: "two", birthDate: "1960-01-01", iraBasis: 20000 }],
      spending: 0, accounts: [reserve, { ...ira, balance: 246000, rmd: { table: "uniform", priorDecemberBalance: 246000 } },
        { ...ira, id: "ira-two", ownerId: "two" }], withdrawalOrder: ["ira", "ira-two"] }));
    expect(result.cash.requiredWithdrawals).toBe(10000);
    expect(result.cash.accounts.find(item => item.accountId === "ira-two")!.requiredWithdrawal).toBe(0);
    expect(result.nextState.people[1].iraBasis).toBe(20000);
    reconciled(result);
  });
  it("returns shortfall rather than negative assets when the year cannot be funded", () => {
    const result = runHouseholdYear(input({ accounts: [reserve, { ...ira, balance: 10000 }], withdrawalOrder: ["ira"] }));
    expect(result.cash.voluntaryWithdrawals).toBe(10000);
    expect(result.cash.shortfall).toBe(30000);
    expect(result.cash.spendingFunded).toBe(false);
    expect(result.nextState.accounts.find(item => item.id === "ira")!.balance).toBe(0);
    reconciled(result);
  });
  it("recovers employer-plan basis pro rata without consuming the owner's IRA basis", () => {
    const plan: YearAccount = { id: "plan", ownerId: "one", kind: "401k", balance: 100000, annualReturn: 0,
      rmd: { table: "uniform", priorDecemberBalance: 100000 }, deferRmdWhileWorking: false,
      afterTaxBasis: 20000, additionalTaxExceptionAmount: 0 };
    const result = runHouseholdYear(input({ accounts: [reserve, plan], withdrawalOrder: ["plan"] }));
    const gross = 37820 / 0.904;
    expect(result.cash.voluntaryWithdrawals).toBeCloseTo(gross, 5);
    expect(result.nextState.accounts[1]).toMatchObject({ afterTaxBasis: expect.any(Number) });
    if (result.nextState.accounts[1].kind !== "401k") throw new Error("Expected plan");
    expect(result.nextState.accounts[1].afterTaxBasis).toBeCloseTo(20000 - gross * 0.2, 5);
    expect(result.nextState.people[0].iraBasis).toBe(0);
    reconciled(result);
    expect(() => runHouseholdYear(input({ accounts: [reserve, plan, roth], withdrawalOrder: ["plan"],
      conversions: [{ sourceId: "plan", destinationId: "roth", amount: 1000 }] }))).toThrow(/After-tax employer-plan/);
  });
  it("moves a pre-tax 401k conversion into owner Roth history without early tax", () => {
    const plan: YearAccount = { id: "plan", ownerId: "one", kind: "401k", balance: 100000, annualReturn: 0,
      rmd: { table: "uniform", priorDecemberBalance: 100000 }, deferRmdWhileWorking: false,
      afterTaxBasis: 0, additionalTaxExceptionAmount: 0 };
    const result = runHouseholdYear(input({ people: [{ ...person, birthDate: "1980-01-01" }],
      accounts: [{ ...reserve, balance: 10000 }, plan, roth], spending: 0, withdrawalOrder: ["reserve"],
      conversions: [{ sourceId: "plan", destinationId: "roth", amount: 40000 }] }));
    expect(result.tax.total).toBe(2620);
    expect(result.tax.earlyDistributionTax).toBe(0);
    expect(result.nextState.people[0].roth.conversions).toEqual([{ year: 2026, taxablePrincipal: 40000, nontaxablePrincipal: 0 }]);
    reconciled(result);
  });
  it("uses pro-rata nonqualified Roth 401k earnings, not Roth IRA contribution-first ordering", () => {
    const plan: YearAccount = { id: "plan", ownerId: "one", kind: "roth-401k", balance: 100000, annualReturn: 0,
      contributionBasis: 20000, firstContributionYear: 2010, hasInPlanRollover: false, additionalTaxExceptionAmount: 0 };
    const result = runHouseholdYear(input({ people: [{ ...person, birthDate: "1980-01-01" }],
      accounts: [reserve, plan], spending: 10000, withdrawalOrder: ["plan"] }));
    // Taxable earnings remain below the standard deduction; early tax=.08W.
    expect(result.cash.voluntaryWithdrawals).toBeCloseTo(10000 / 0.92, 5);
    expect(result.tax.regularFederal).toBe(0);
    expect(result.tax.earlyDistributionTax).toBeCloseTo(10000 / 0.92 * 0.08, 5);
    reconciled(result);
  });
  it("includes tax on retained savings interest without treating interest as withdrawn cash", () => {
    const savings: YearAccount = { id: "bank", ownerId: "one", kind: "cash", balance: 100000, annualReturn: 0.05, interestTreatment: "taxable" };
    const result = runHouseholdYear(input({ accounts: [reserve, savings], withdrawalOrder: [], spending: 0,
      income: [{ ownerId: "one", kind: "pension", amount: 30000 }] }));
    expect(result.accountIncome.investmentOrdinary).toBe(5000);
    expect(result.tax.total).toBe(2020);
    expect(result.cash.surplus).toBe(27980);
    expect(result.nextState.accounts[1].balance).toBe(105000);
    reconciled(result);
  });
});

describe("Annual taxable account and annuity state", () => {
  const broker: YearAccount = { id: "broker", ownerId: "one", kind: "taxable", balance: 100000, annualReturn: 0.1,
    returnTreatment: "price-only", transactionFees: 0,
    lots: [{ id: "lot", lot: { shares: 1000, adjustedBasis: 60000, acquiredDate: "2020-01-01" }, price: 100 }] };
  it("updates remaining shares and actual basis, without taxing retained appreciation", () => {
    const result = runHouseholdYear(input({ accounts: [reserve, broker], withdrawalOrder: ["broker"], spending: 60000 }));
    const next = result.nextState.accounts.find(item => item.id === "broker")!;
    expect(next.kind).toBe("taxable");
    if (next.kind !== "taxable") throw new Error("Expected taxable state");
    expect(next.balance).toBeCloseTo(44000, 5);
    expect(next.lots[0].lot.shares).toBeCloseTo(400, 6);
    expect(next.lots[0].lot.adjustedBasis).toBeCloseTo(24000, 5);
    expect(next.lots[0].price).toBeCloseTo(110, 10);
    expect(result.accountIncome.longTermGain).toBeCloseTo(24000, 5);
    expect(result.tax.total).toBe(0);
    reconciled(result);
  });
  it("carries unused capital losses without automatically consuming $3,000", () => {
    const result = runHouseholdYear(input({ accounts: [reserve, { ...broker, annualReturn: 0,
      lots: [{ id: "lot", lot: { shares: 1000, adjustedBasis: 150000, acquiredDate: "2020-01-01" }, price: 100 }] }],
      withdrawalOrder: ["broker"], spending: 30000 }));
    expect(result.accountIncome.longTermGain).toBeCloseTo(-15000, 5);
    expect(result.nextState.lossCarryover.longTerm).toBeCloseTo(15000, 5);
    const next = result.nextState.accounts[1];
    if (next.kind !== "taxable") throw new Error("Expected taxable state");
    expect(next.lots[0].lot.adjustedBasis).toBeCloseTo(105000, 5);
    reconciled(result);
  });
  it("keeps Section 423 compensation and capital gains distinct through full sale", () => {
    const result = runHouseholdYear(input({ accounts: [reserve, {
      id: "espp", ownerId: "one", kind: "espp", balance: 3000, annualReturn: 0, price: 30,
      returnTreatment: "price-only", transactionFees: 0,
      lot: { shares: 100, offeringDate: "2020-01-01", purchaseDate: "2021-07-01", purchasePrice: 20,
        offeringFairMarketValue: 22, purchaseFairMarketValue: 23, offeringOptionPrice: 20 },
    }], income: [{ ownerId: "one", kind: "pension", amount: 100000 }], spending: 100000, withdrawalOrder: ["espp"] }));
    expect(result.accountIncome.esppCompensation).toBe(200);
    expect(result.accountIncome.longTermGain).toBe(800);
    expect(result.tax.total).toBe(13334);
    expect(result.cash.shortfall).toBe(10334);
    const next = result.nextState.accounts[1];
    if (next.kind !== "espp") throw new Error("Expected ESPP state");
    expect(next.lot.shares).toBe(0);
    reconciled(result);
  });
  const annuity: YearAccount = { id: "annuity", ownerId: "one", kind: "annuity", balance: 16000, annualReturn: 0,
    investmentInContract: 10000, surrenderCharge: 0, additionalTaxExceptionAmount: 0, treatment: "post-1982-nonqualified-pre-annuity" };
  it("supports a no-charge, non-loss full annuity surrender during funding search", () => {
    const result = runHouseholdYear(input({ accounts: [reserve, annuity], spending: 16000, withdrawalOrder: ["annuity"] }));
    expect(result.accountIncome.investmentOrdinary).toBe(6000);
    expect(result.tax.total).toBe(0);
    expect(result.nextState.accounts[1]).toMatchObject({ balance: 0, investmentInContract: 0 });
    reconciled(result);
  });
  it("keeps basis intact when a partial annuity withdrawal uses earnings only", () => {
    const result = runHouseholdYear(input({ accounts: [reserve, annuity], spending: 5000, withdrawalOrder: ["annuity"] }));
    expect(result.accountIncome.investmentOrdinary).toBeCloseTo(5000, 5);
    expect(result.nextState.accounts[1]).toMatchObject({ investmentInContract: 10000 });
    expect(result.nextState.accounts[1].balance).toBeCloseTo(11000, 5);
    reconciled(result);
  });
  it("fails explicitly for underwater annuities rather than inventing surrender-loss tax treatment", () => {
    expect(() => runHouseholdYear(input({ accounts: [reserve, { ...annuity, balance: 8000 }], withdrawalOrder: ["annuity"] })))
      .toThrow(/Underwater annuity/);
  });
  it("the standalone surrender rule records charges and unrecovered basis without a guessed deduction", () => {
    const terms = { birthDate: "1965-01-01", distributionDate: "2026-07-01", additionalTaxExceptionAmount: 0,
      balance: 16000, investmentInContract: 10000, surrenderCharge: 1000 };
    expect(deferredAnnuitySurrender(terms)).toMatchObject({ cash: 15000, remainingBasis: 0,
      requiresLossReview: false, character: { investmentOrdinary: 5000 } });
    expect(deferredAnnuitySurrender({ ...terms, balance: 8000 })).toMatchObject({ cash: 7000,
      remainingBasis: 0, unrecoveredBasis: 3000, requiresLossReview: true, character: { investmentOrdinary: 0 } });
  });
});

describe("One-year contract guards and deterministic snapshots", () => {
  it("rejects an incorrect price/balance relationship and mismatched distribution year", () => {
    expect(() => runHouseholdYear(input({ accounts: [reserve, { id: "stock", ownerId: "one", kind: "taxable",
      balance: 1000, annualReturn: 0, transactionFees: 0, returnTreatment: "price-only",
      lots: [{ id: "lot", lot: { shares: 10, adjustedBasis: 500, acquiredDate: "2020-01-01" }, price: 90 }] }], withdrawalOrder: ["stock"] })))
      .toThrow(/Lot value/);
    expect(() => runHouseholdYear(input({ distributionDate: "2027-01-01" }))).toThrow(/modeled year/);
  });
  it("rejects guessed Roth clocks and unknown ownership", () => {
    expect(() => runHouseholdYear(input({ accounts: [reserve, { ...roth, balance: 10000 }], withdrawalOrder: ["roth"] }))).toThrow(/original first/);
    expect(() => runHouseholdYear(input({ accounts: [reserve, { ...ira, ownerId: "missing" }] }))).toThrow(/unknown owner/);
  });
  it("preserves input values across repeated solves, including nested lot and Roth history", () => {
    const terms = input({ people: [{ ...person, iraBasis: 20000 }], conversions: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }] });
    const original = JSON.stringify(terms);
    const first = runHouseholdYear(terms);
    expect(runHouseholdYear(terms)).toEqual(first);
    expect(JSON.stringify(terms)).toBe(original);
    expect(first.nextState.people[0].iraBasis).toBeLessThan(20000);
    reconciled(first);
  });
  it("reconciles 60 different spending levels, losses and tax-bracket crossings", () => {
    for (let i = 0; i < 60; i++) {
      const result = runHouseholdYear(input({ spending: i * 1723.4567,
        accounts: [reserve, { ...ira, annualReturn: (i % 9 - 4) * 0.1 }, roth] }));
      reconciled(result);
      expect(result.tax.total).toBeGreaterThanOrEqual(0);
    }
  });
});
