import { describe, expect, it } from "vitest";
import { capitalLotSale, deferredAnnuityWithdrawal, dividendIncome, esppLotSale, qualifiedPlanWithdrawal,
  rothIraWithdrawal, rothPlanWithdrawal, savingsInterest, sumTaxCharacter, taxCharacter,
  traditionalIraOwnerYear, type EarlyDistribution } from "./accountTax";
import { settleAnnualCashFlow, type CashAccount } from "./cashFlow";

const older: EarlyDistribution = { birthDate: "1960-01-01", distributionDate: "2026-07-01", additionalTaxExceptionAmount: 0 };
const younger: EarlyDistribution = { ...older, birthDate: "1980-01-01" };
const stock = { shares: 100, adjustedBasis: 2000, acquiredDate: "2024-01-01" };
const espp = { shares: 100, purchasePrice: 20, offeringDate: "2020-01-01", purchaseDate: "2021-07-01",
  offeringFairMarketValue: 22, purchaseFairMarketValue: 23, offeringOptionPrice: 20 };
const roth = { ...younger, balance: 100000, regularContributionBasis: 20000,
  firstContributionYear: 2010, conversions: [], withdrawal: 10000 };

describe("Taxable shares and ESPP", () => {
  it("allocates actual lot basis to a partial sale, with fees in capital gain", () => {
    const result = capitalLotSale(stock, 25, 30, "2026-01-02", 5);
    expect(result).toMatchObject({ grossProceeds: 750, proceeds: 745, basisUsed: 500,
      character: { longTermGain: 245, shortTermGain: 0 }, remainingLot: { shares: 75, adjustedBasis: 1500 } });
  });
  it("removes only the sold basis, leaving unrealized gains untaxed", () => {
    const first = capitalLotSale(stock, 25, 30, "2026-01-02");
    const second = capitalLotSale(first.remainingLot, 75, 40, "2026-01-03");
    expect(first.basisUsed + second.basisUsed).toBe(2000);
    expect(second.remainingLot.adjustedBasis).toBe(0);
    expect(second.remainingLot.shares).toBe(0);
    expect(first.character.longTermGain + second.character.longTermGain).toBe(1750);
  });
  it("keeps one-year anniversary sales short-term and the next day long-term", () => {
    expect(capitalLotSale(stock, 1, 30, "2025-01-01").character.shortTermGain).toBe(10);
    expect(capitalLotSale(stock, 1, 30, "2025-01-02").character.longTermGain).toBe(10);
  });
  it("preserves losses and fractional-share basis without rounding", () => {
    const result = capitalLotSale(stock, 0.125, 19.1234, "2026-01-02", 0.01);
    expect(result.basisUsed).toBe(2.5);
    expect(result.character.longTermGain).toBeCloseTo(-0.119575, 10);
    expect(result.remainingLot.adjustedBasis).toBe(1997.5);
  });
  it("supports a zero-basis lot and a genuine zero-price sale without inventing basis", () => {
    expect(capitalLotSale({ ...stock, adjustedBasis: 0 }, 1, 30, "2026-01-02").character.longTermGain).toBe(30);
    expect(capitalLotSale(stock, 100, 0, "2026-01-02").character.longTermGain).toBe(-2000);
    expect(capitalLotSale({ ...stock, shares: 0, adjustedBasis: 0 }, 0, 0, "2026-01-02").basisUsed).toBe(0);
  });
  it("maps the reviewed ESPP qualifying fee example without changing the formula", () => {
    const result = esppLotSale(espp, 100, 21, "2023-01-01", 10);
    expect(result.character).toMatchObject({ esppCompensation: 100, longTermGain: -10, retirementOrdinary: 0 });
    expect(result.proceeds).toBe(2090);
  });
  it("preserves disqualifying compensation even on a loss sale", () => {
    const result = esppLotSale(espp, 50, 18, "2022-01-01");
    expect(result.character).toMatchObject({ esppCompensation: 150, shortTermGain: -250 });
    expect(result.remainingLot.shares).toBe(50);
    expect(result.remainingLot.purchasePrice).toBe(20);
  });
  it("does not combine long-term ESPP capital gain with ordinary compensation", () => {
    const result = esppLotSale({ ...espp, offeringDate: "2021-01-01" }, 100, 30, "2022-07-02");
    expect(result.qualifying).toBe(false);
    expect(result.character).toMatchObject({ esppCompensation: 300, longTermGain: 700, shortTermGain: 0 });
  });
  it("rejects over-sales, bad dates, fees, empty-lot basis and overflowing products", () => {
    expect(() => capitalLotSale(stock, 101, 30, "2026-01-01")).toThrow();
    expect(() => capitalLotSale(stock, 1, 30, "2023-01-01")).toThrow();
    expect(() => capitalLotSale(stock, 1, 30, "2026-02-30")).toThrow();
    expect(() => capitalLotSale(stock, 1, 30, "2026-01-01", 31)).toThrow();
    expect(() => capitalLotSale({ ...stock, shares: 0 }, 0, 30, "2026-01-01")).toThrow();
    expect(() => capitalLotSale({ ...stock, shares: 1e12 }, 1e12, 1e12, "2026-01-01")).toThrow();
    expect(() => esppLotSale({ ...espp, shares: 1e12 }, 1, 20, "2026-01-01")).toThrow();
  });
});

describe("Interest, dividends and classification", () => {
  it("taxes interest credited to savings without treating principal as interest", () => {
    expect(savingsInterest(400)).toEqual(taxCharacter({ investmentOrdinary: 400 }));
    expect(savingsInterest(0)).toEqual(taxCharacter());
  });
  it("splits $1,000 dividends with a $700 qualified subset without double counting", () => {
    expect(dividendIncome(1000, 700)).toEqual(taxCharacter({ investmentOrdinary: 300, qualifiedDividends: 700 }));
    expect(() => dividendIncome(100, 101)).toThrow();
  });
  it("combines categories without silently netting or discarding capital losses", () => {
    const result = sumTaxCharacter([savingsInterest(400), dividendIncome(1000, 700),
      taxCharacter({ retirementOrdinary: 10000, additionalTaxBase: 2000 }),
      taxCharacter({ esppCompensation: 300, shortTermGain: -500, longTermGain: 100 })]);
    expect(result).toEqual({ retirementOrdinary: 10000, investmentOrdinary: 700, esppCompensation: 300,
      qualifiedDividends: 700, shortTermGain: -500, longTermGain: 100, additionalTaxBase: 2000 });
  });
  it.each([NaN, Infinity, -1, 1e13])("rejects invalid ordinary income and credited interest: %s", value => {
    expect(() => savingsInterest(value)).toThrow();
    expect(() => taxCharacter({ retirementOrdinary: value })).toThrow();
  });
});

describe("Traditional IRA aggregation and qualified-plan basis", () => {
  it("aggregates two IRAs before computing $20k/$100k pro-rata basis", () => {
    const result = traditionalIraOwnerYear({ ownerId: "one", basis: 20000, accounts: [
      { accountId: "ira-a", endingValue: 20000, distributions: 10000, conversions: 0 },
      { accountId: "ira-b", endingValue: 60000, distributions: 0, conversions: 10000 },
    ] });
    expect(result).toMatchObject({ nontaxableDistributions: 2000, nontaxableConversions: 2000,
      taxableDistributions: 8000, taxableConversions: 8000, remainingBasis: 16000,
      character: { retirementOrdinary: 16000 } });
  });
  it("does not share one spouse's basis with the other", () => {
    const one = traditionalIraOwnerYear({ ownerId: "one", basis: 10000, accounts: [
      { accountId: "a", endingValue: 0, distributions: 10000, conversions: 0 }] });
    const two = traditionalIraOwnerYear({ ownerId: "two", basis: 0, accounts: [
      { accountId: "b", endingValue: 0, distributions: 10000, conversions: 0 }] });
    expect(one.character.retirementOrdinary).toBe(0);
    expect(two.character.retirementOrdinary).toBe(10000);
  });
  it("retains unused IRA basis and rejects duplicate account IDs", () => {
    expect(traditionalIraOwnerYear({ ownerId: "one", basis: 1000, accounts: [] }).remainingBasis).toBe(1000);
    const entry = { accountId: "a", endingValue: 1, distributions: 0, conversions: 0 };
    expect(() => traditionalIraOwnerYear({ ownerId: "one", basis: 0, accounts: [entry, entry] })).toThrow();
  });
  it("treats fully pre-tax 401k cash as ordinary retirement income", () => {
    const result = qualifiedPlanWithdrawal({ ...older, balance: 100000, afterTaxBasis: 0, withdrawal: 10000 });
    expect(result.basisUsed).toBe(0);
    expect(result.character).toEqual(taxCharacter({ retirementOrdinary: 10000 }));
  });
  it("recovers after-tax plan basis pro rata, separate from IRA basis", () => {
    const result = qualifiedPlanWithdrawal({ ...younger, balance: 25000, afterTaxBasis: 10000, withdrawal: 5000 });
    expect(result).toMatchObject({ basisUsed: 2000, remainingBasis: 8000, remainingBalance: 20000,
      character: { retirementOrdinary: 3000, additionalTaxBase: 3000 } });
  });
  it("does not exempt ordinary income merely because an early-tax exception applies", () => {
    const result = qualifiedPlanWithdrawal({ ...younger, balance: 25000, afterTaxBasis: 10000, withdrawal: 5000,
      additionalTaxExceptionAmount: 1000 });
    expect(result.character.retirementOrdinary).toBe(3000);
    expect(result.character.additionalTaxBase).toBe(2000);
  });
  it("handles the exact age-59-and-a-half date, not calendar-year age", () => {
    const base = { ...older, birthDate: "1966-01-02", balance: 10000, afterTaxBasis: 0, withdrawal: 1000 };
    expect(qualifiedPlanWithdrawal({ ...base, distributionDate: "2025-07-01" }).character.additionalTaxBase).toBe(1000);
    expect(qualifiedPlanWithdrawal({ ...base, distributionDate: "2025-07-02" }).character.additionalTaxBase).toBe(0);
  });
});

describe("Nonqualified deferred annuity earnings-first allocation", () => {
  const annuity = { ...older, treatment: "post-1982-nonqualified-pre-annuity" as const,
    balance: 16000, investmentInContract: 10000, withdrawal: 7000 };
  it("reproduces the IRS $7,000 withdrawal example: $6,000 income/$1,000 basis", () => {
    const result = deferredAnnuityWithdrawal(annuity);
    expect(result).toMatchObject({ basisUsed: 1000, remainingBasis: 9000, remainingBalance: 9000,
      character: { investmentOrdinary: 6000, retirementOrdinary: 0 } });
  });
  it("uses earnings first, not a proportional exclusion ratio", () => {
    const result = deferredAnnuityWithdrawal({ ...annuity, withdrawal: 3000 });
    expect(result.basisUsed).toBe(0);
    expect(result.character.investmentOrdinary).toBe(3000);
    expect(result.remainingBasis).toBe(10000);
  });
  it("recovers basis after earnings were exhausted on a preceding withdrawal", () => {
    const first = deferredAnnuityWithdrawal(annuity);
    const second = deferredAnnuityWithdrawal({ ...annuity, balance: first.remainingBalance,
      investmentInContract: first.remainingBasis, withdrawal: 4000 });
    expect(second.character.investmentOrdinary).toBe(0);
    expect(second.remainingBasis).toBe(5000);
  });
  it("retains unused basis on an underwater partial withdrawal without inventing a gain", () => {
    const result = deferredAnnuityWithdrawal({ ...annuity, balance: 8000, withdrawal: 3000 });
    expect(result.character.investmentOrdinary).toBe(0);
    expect(result.remainingBasis).toBe(7000);
    expect(result.remainingBalance).toBe(5000);
  });
  it("flags early distribution income separately for potential additional tax", () => {
    const result = deferredAnnuityWithdrawal({ ...annuity, ...younger });
    expect(result.character.additionalTaxBase).toBe(6000);
  });
  it("rejects a full surrender instead of silently carrying closed-contract basis", () => {
    expect(() => deferredAnnuityWithdrawal({ ...annuity, withdrawal: 16000 })).toThrow(/Full annuity surrender/);
  });
});

describe("Roth IRA ordering, five-year clocks and recapture", () => {
  it("withdraws regular contribution basis first without tax or penalty", () => {
    const result = rothIraWithdrawal(roth);
    expect(result).toMatchObject({ qualified: false, contributionUsed: 10000, conversionUsed: 0, earningsUsed: 0,
      remainingContributionBasis: 10000, character: taxCharacter() });
  });
  it("draws older conversions before newer ones regardless of input order", () => {
    const result = rothIraWithdrawal({ ...roth, regularContributionBasis: 0, withdrawal: 12000,
      conversions: [{ year: 2025, taxablePrincipal: 10000, nontaxablePrincipal: 0 },
        { year: 2018, taxablePrincipal: 8000, nontaxablePrincipal: 2000 }] });
    expect(result.conversionUsed).toBe(12000);
    expect(result.character).toEqual(taxCharacter({ additionalTaxBase: 2000 }));
    expect(result.remainingConversions).toEqual([{ year: 2018, taxablePrincipal: 0, nontaxablePrincipal: 0 },
      { year: 2025, taxablePrincipal: 8000, nontaxablePrincipal: 0 }]);
  });
  it("aggregates same-year conversions before taking taxable principal first", () => {
    const result = rothIraWithdrawal({ ...roth, regularContributionBasis: 0, withdrawal: 4000,
      conversions: [{ year: 2025, taxablePrincipal: 0, nontaxablePrincipal: 5000 },
        { year: 2025, taxablePrincipal: 5000, nontaxablePrincipal: 0 }] });
    expect(result.character.additionalTaxBase).toBe(4000);
    expect(result.remainingConversions).toEqual([{ year: 2025, taxablePrincipal: 1000, nontaxablePrincipal: 5000 }]);
  });
  it("does not tax conversion principal as ordinary income for a second time", () => {
    const result = rothIraWithdrawal({ ...roth, withdrawal: 45000,
      conversions: [{ year: 2025, taxablePrincipal: 15000, nontaxablePrincipal: 5000 }] });
    expect(result.contributionUsed).toBe(20000);
    expect(result.conversionUsed).toBe(20000);
    expect(result.earningsUsed).toBe(5000);
    expect(result.character.retirementOrdinary).toBe(5000);
    expect(result.character.additionalTaxBase).toBe(20000);
  });
  it("expires conversion recapture on January 1 of the fifth following tax year", () => {
    const base = { ...roth, regularContributionBasis: 0,
      conversions: [{ year: 2021, taxablePrincipal: 10000, nontaxablePrincipal: 0 }] };
    expect(rothIraWithdrawal({ ...base, distributionDate: "2025-12-31" }).character.additionalTaxBase).toBe(10000);
    expect(rothIraWithdrawal({ ...base, distributionDate: "2026-01-01" }).character.additionalTaxBase).toBe(0);
  });
  it("requires both age eligibility and the first-Roth five-year clock for tax-free earnings", () => {
    const base = { ...roth, ...older, firstContributionYear: 2022, regularContributionBasis: 0 };
    expect(rothIraWithdrawal(base)).toMatchObject({ qualified: false,
      character: { retirementOrdinary: 10000, additionalTaxBase: 0 } });
    expect(rothIraWithdrawal({ ...base, distributionDate: "2027-01-01" })).toMatchObject({ qualified: true,
      character: { retirementOrdinary: 0, additionalTaxBase: 0 } });
  });
  it("does not make earnings tax-free merely because the account is old", () => {
    const result = rothIraWithdrawal({ ...roth, regularContributionBasis: 0 });
    expect(result.qualified).toBe(false);
    expect(result.character).toEqual(taxCharacter({ retirementOrdinary: 10000, additionalTaxBase: 10000 }));
  });
  it("reduces only additional-tax base for an explicit exception", () => {
    const result = rothIraWithdrawal({ ...roth, regularContributionBasis: 0, additionalTaxExceptionAmount: 5000 });
    expect(result.character.retirementOrdinary).toBe(10000);
    expect(result.character.additionalTaxBase).toBe(5000);
  });
  it("preserves unused contribution basis when losses exceed earnings", () => {
    const result = rothIraWithdrawal({ ...roth, balance: 10000, withdrawal: 10000 });
    expect(result.remainingBalance).toBe(0);
    expect(result.remainingContributionBasis).toBe(10000);
    expect(result.character).toEqual(taxCharacter());
  });
  it("retains conversion character correctly through repeated withdrawals", () => {
    const first = rothIraWithdrawal({ ...roth, regularContributionBasis: 0, withdrawal: 7000,
      conversions: [{ year: 2025, taxablePrincipal: 10000, nontaxablePrincipal: 5000 }] });
    const second = rothIraWithdrawal({ ...roth, regularContributionBasis: 0, withdrawal: 7000,
      balance: first.remainingBalance, conversions: first.remainingConversions });
    expect(first.character.additionalTaxBase + second.character.additionalTaxBase).toBe(10000);
    expect(second.remainingConversions).toEqual([{ year: 2025, taxablePrincipal: 0, nontaxablePrincipal: 1000 }]);
  });
});

describe("Roth 401k differs from Roth IRA", () => {
  const plan = { ...younger, balance: 100000, contributionBasis: 40000,
    firstContributionYear: 2010, withdrawal: 10000, hasInPlanRollover: false };
  it("uses pro-rata earnings/basis for a nonqualified distribution", () => {
    const result = rothPlanWithdrawal(plan);
    expect(result).toMatchObject({ qualified: false, basisUsed: 4000, remainingBasis: 36000,
      character: { retirementOrdinary: 6000, additionalTaxBase: 6000 } });
    const ira = rothIraWithdrawal({ ...roth, regularContributionBasis: 40000 });
    expect(ira.character.retirementOrdinary).toBe(0);
  });
  it("excludes qualified plan earnings when both tests are met", () => {
    expect(rothPlanWithdrawal({ ...plan, ...older })).toMatchObject({ qualified: true, character: taxCharacter() });
  });
  it("retains taxable earnings when age is met but the plan clock is not", () => {
    expect(rothPlanWithdrawal({ ...plan, ...older, firstContributionYear: 2025 }))
      .toMatchObject({ qualified: false, character: { retirementOrdinary: 6000, additionalTaxBase: 0 } });
  });
  it("rejects untracked in-plan rollover recapture and pre-2006 contribution years", () => {
    expect(() => rothPlanWithdrawal({ ...plan, hasInPlanRollover: true })).toThrow(/recapture/);
    expect(() => rothPlanWithdrawal({ ...plan, firstContributionYear: 2005 })).toThrow(/2006/);
  });
});

describe("Validation, precision and isolation", () => {
  it.each([NaN, Infinity, -1, 1e13])("rejects invalid withdrawals throughout account rules: %s", withdrawal => {
    expect(() => rothIraWithdrawal({ ...roth, withdrawal })).toThrow();
    expect(() => qualifiedPlanWithdrawal({ ...older, balance: 100000, afterTaxBasis: 0, withdrawal })).toThrow();
    expect(() => deferredAnnuityWithdrawal({ ...older, balance: 100000, investmentInContract: 0, withdrawal,
      treatment: "post-1982-nonqualified-pre-annuity" })).toThrow();
  });
  it("rejects overspending, malformed chronology and future conversion years", () => {
    expect(() => rothIraWithdrawal({ ...roth, withdrawal: 100001 })).toThrow();
    expect(() => rothIraWithdrawal({ ...roth, firstContributionYear: 2027 })).toThrow();
    expect(() => rothIraWithdrawal({ ...roth, firstContributionYear: 2026,
      conversions: [{ year: 2025, taxablePrincipal: 1, nontaxablePrincipal: 0 }] })).toThrow();
    expect(() => rothIraWithdrawal({ ...roth, birthDate: "2026-02-30" })).toThrow();
    expect(() => rothIraWithdrawal({ ...roth, birthDate: "2030-01-01" })).toThrow();
  });
  it("preserves decimal basis and distribution components across 100 cases", () => {
    for (let i = 1; i <= 100; i++) {
      const result = qualifiedPlanWithdrawal({ ...younger, balance: 100000.123, afterTaxBasis: 12345.678,
        withdrawal: i * 123.456789 });
      expect(result.basisUsed + result.character.retirementOrdinary).toBeCloseTo(i * 123.456789, 9);
      expect(result.basisUsed + result.remainingBasis).toBeCloseTo(12345.678, 9);
      expect(result.remainingBalance + result.cash).toBeCloseTo(100000.123, 9);
    }
  });
  it("does not mutate basis or conversion objects during repeated tax evaluations", () => {
    const frozenLot = Object.freeze({ ...stock });
    const conversions = Object.freeze([Object.freeze({ year: 2025, taxablePrincipal: 20000, nontaxablePrincipal: 10000 })]);
    const original = JSON.stringify(conversions);
    const terms = { ...roth, conversions, regularContributionBasis: 0 };
    expect(rothIraWithdrawal(terms)).toEqual(rothIraWithdrawal(terms));
    capitalLotSale(frozenLot, 10, 30, "2026-01-01");
    expect(JSON.stringify(conversions)).toBe(original);
    expect(frozenLot.adjustedBasis).toBe(2000);
  });
});

describe("Account rules integrated with the real annual cash ledger", () => {
  const reserve: CashAccount = { id: "reserve", ownerId: "one", kind: "cash", balance: 0, annualReturn: 0 };
  const base = { year: 2026, income: [], spending: 10000, requiredWithdrawals: [], conversions: [], surplusAccountId: "reserve" };
  it("funds brokerage spending using tax on gain, not tax on gross sale proceeds", () => {
    const result = settleAnnualCashFlow({ ...base,
      accounts: [reserve, { ...reserve, id: "broker", kind: "taxable", balance: 100000 }], withdrawalOrder: ["broker"],
      calculateTax: context => {
        const gross = context.withdrawals.find(item => item.accountId === "broker")!.total;
        const sale = capitalLotSale({ shares: 1000, adjustedBasis: 60000, acquiredDate: "2020-01-01" }, gross / 100, 100, "2026-01-01");
        return sale.character.longTermGain * 0.15; // Controlled test rate, not a household tax model.
      },
    });
    // Gain is 40% of proceeds; 15% of gain = 6% of proceeds.
    expect(result.voluntaryWithdrawals).toBeCloseTo(10000 / 0.94, 5);
    expect(result.tax).toBeCloseTo((10000 / 0.94) * 0.06, 5);
    expect(result.shortfall).toBe(0);
    expect(result.cashResidual).toBeCloseTo(0, 6);
  });
  it("funds tax on retained savings interest without taxing savings withdrawals", () => {
    const result = settleAnnualCashFlow({ ...base, spending: 0,
      accounts: [reserve, { ...reserve, id: "hysa", balance: 10000, annualReturn: 0.04 }], withdrawalOrder: ["hysa"],
      calculateTax: context => {
        const principal = context.balancesBeforeGrowth.find(item => item.accountId === "hysa")!.amount;
        return savingsInterest(principal * 0.04).investmentOrdinary * 0.25;
      },
    });
    // W = .25 * .04 * (10,000-W) -> W = 100/1.01.
    expect(result.voluntaryWithdrawals).toBeCloseTo(100 / 1.01, 5);
    expect(result.tax).toBeCloseTo(100 / 1.01, 5);
    expect(result.accounts[1].ending).toBeCloseTo((10000 - 100 / 1.01) * 1.04, 5);
    expect(result.portfolioResidual).toBeCloseTo(0, 6);
  });
  it("grosses up a nonqualified Roth IRA withdrawal past contribution basis", () => {
    const result = settleAnnualCashFlow({ ...base, spending: 30000,
      accounts: [reserve, { ...reserve, id: "roth", kind: "roth-ira", balance: 100000 }], withdrawalOrder: ["roth"],
      calculateTax: context => {
        const amount = context.withdrawals.find(item => item.accountId === "roth")!.total;
        const character = rothIraWithdrawal({ ...roth, withdrawal: amount }).character;
        // Controlled 20% ordinary rate plus the separately identified 10% base.
        return character.retirementOrdinary * 0.2 + character.additionalTaxBase * 0.1;
      },
    });
    // W - .3*(W-20k) = 30k -> W = 24k/.7.
    expect(result.voluntaryWithdrawals).toBeCloseTo(24000 / 0.7, 5);
    expect(result.tax).toBeCloseTo(24000 / 0.7 - 30000, 5);
    expect(result.cashResidual).toBeCloseTo(0, 6);
  });
  it("uses both ESPP compensation and capital-gain character during gross-up", () => {
    const result = settleAnnualCashFlow({ ...base, spending: 1000,
      accounts: [reserve, { ...reserve, id: "espp", kind: "espp", balance: 3000 }], withdrawalOrder: ["espp"],
      calculateTax: context => {
        const gross = context.withdrawals.find(item => item.accountId === "espp")!.total;
        const character = esppLotSale(espp, gross / 30, 30, "2026-07-01").character;
        return character.esppCompensation * 0.2 + character.longTermGain * 0.15;
      },
    });
    // Each $30 sale has $2 compensation and $8 gain: controlled tax=$1.60/share.
    expect(result.voluntaryWithdrawals).toBeCloseTo(1000 / (1 - 1.6 / 30), 5);
    expect(result.shortfall).toBe(0);
    expect(result.portfolioResidual).toBeCloseTo(0, 6);
  });
  it("does not tax retained nonqualified-annuity growth as annual interest", () => {
    const result = settleAnnualCashFlow({ ...base, spending: 5000,
      accounts: [{ ...reserve, balance: 10000 }, { ...reserve, id: "annuity", kind: "annuity", balance: 16000, annualReturn: 0.1 }],
      requiredWithdrawals: [], withdrawalOrder: ["reserve"],
      calculateTax: context => {
        const amount = context.withdrawals.find(item => item.accountId === "annuity")!.total;
        return deferredAnnuityWithdrawal({ ...older, balance: 16000, investmentInContract: 10000,
          withdrawal: amount, treatment: "post-1982-nonqualified-pre-annuity" }).character.investmentOrdinary * 0.2;
      },
    });
    expect(result.tax).toBe(0);
    expect(result.accounts[1].ending).toBe(17600);
  });
});
