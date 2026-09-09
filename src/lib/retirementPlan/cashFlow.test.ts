import { describe, expect, it } from "vitest";
import { settleAnnualCashFlow, type AnnualCashFlowInput, type CashAccount, type TaxContext } from "./cashFlow";
import { iraBasisAllocation, requiredDistribution, taxableSocialSecurity } from "./rules";

// These controlled tax functions test accounting, not a new tax-law model.
const noTax = () => 0;
const grossWithdrawals = (context: TaxContext) => context.withdrawals.reduce((sum, item) => sum + item.total, 0);
const account = (id: string, balance: number, kind: CashAccount["kind"] = "cash", ownerId = "one", annualReturn = 0): CashAccount =>
  ({ id, balance, kind, ownerId, annualReturn });

function input(overrides: Partial<AnnualCashFlowInput> = {}): AnnualCashFlowInput {
  return {
    year: 2026,
    accounts: [account("reserve", 0), account("ira", 100000, "traditional-ira"), account("roth", 0, "roth-ira")],
    income: [], spending: 60000, requiredWithdrawals: [], conversions: [],
    withdrawalOrder: ["reserve", "ira", "roth"], surplusAccountId: "reserve",
    calculateTax: noTax, ...overrides,
  };
}

function assertReconciled(result: ReturnType<typeof settleAnnualCashFlow>, precision = 5) {
  expect(result.cashResidual).toBeCloseTo(0, precision);
  expect(result.portfolioResidual).toBeCloseTo(0, precision);
  expect(result.income + result.requiredWithdrawals + result.voluntaryWithdrawals + result.shortfall)
    .toBeCloseTo(result.spending + result.tax + result.surplus, precision);
  for (const item of result.accounts) {
    expect(item.ending).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(item.ending)).toBe(true);
    expect(item.opening - item.requiredWithdrawal - item.voluntaryWithdrawal - item.conversionOut
      + item.conversionIn + item.surplusDeposit + item.investmentChange).toBeCloseTo(item.ending, precision);
  }
}

describe("Annual household cash settlement: independently calculated answers", () => {
  it("withdraws $60,000 for $60,000 spending and retains $40,000 with no tax", () => {
    const result = settleAnnualCashFlow(input());
    expect(result.voluntaryWithdrawals).toBeCloseTo(60000, 5);
    expect(result.accounts[1].ending).toBeCloseTo(40000, 5);
    expect(result.spendingFunded).toBe(true);
    assertReconciled(result);
  });

  it("grosses up $60,000 spending to $75,000 at a controlled 20% tax", () => {
    const result = settleAnnualCashFlow(input({ calculateTax: context => grossWithdrawals(context) * 0.2 }));
    expect(result.voluntaryWithdrawals).toBeCloseTo(75000, 5);
    expect(result.tax).toBeCloseTo(15000, 5);
    expect(result.accounts[1].ending).toBeCloseTo(25000, 5);
    assertReconciled(result);
  });

  it("combines wages, pension and both owners before calculating annual tax", () => {
    const result = settleAnnualCashFlow(input({
      accounts: [account("reserve", 0), account("ira", 100000, "traditional-ira", "two")],
      income: [{ ownerId: "one", kind: "wages", amount: 30000 }, { ownerId: "two", kind: "pension", amount: 20000 }],
      withdrawalOrder: ["ira"],
      // (50,000 + W) * 0.8 = 60,000 -> W = 25,000.
      calculateTax: context => (context.income.reduce((sum, item) => sum + item.amount, 0) + grossWithdrawals(context)) * 0.2,
    }));
    expect(result.voluntaryWithdrawals).toBeCloseTo(25000, 5);
    expect(result.tax).toBeCloseTo(15000, 5);
    assertReconciled(result);
  });

  it("retains income exceeding spending and taxes in the explicit reserve", () => {
    const result = settleAnnualCashFlow(input({ income: [{ ownerId: "one", kind: "pension", amount: 100000 }], calculateTax: () => 20000 }));
    expect(result.voluntaryWithdrawals).toBe(0);
    expect(result.surplus).toBe(20000);
    expect(result.accounts[0].ending).toBe(20000);
    expect(result.accounts[1].ending).toBe(100000);
    assertReconciled(result);
  });

  it("counts required withdrawals once when funding spending", () => {
    const result = settleAnnualCashFlow(input({ requiredWithdrawals: [{ accountId: "ira", amount: 10000 }] }));
    expect(result.requiredWithdrawals).toBe(10000);
    expect(result.voluntaryWithdrawals).toBeCloseTo(50000, 5);
    expect(result.accounts[1].ending).toBeCloseTo(40000, 5);
    assertReconciled(result);
  });

  it("integrates the birth-cohort RMD helper without losing excess RMD cash", () => {
    const amount = requiredDistribution({ birthDate: "1960-01-01", year: 2035, priorDecemberBalance: 246000, accountType: "traditional-ira" });
    const result = settleAnnualCashFlow(input({ year: 2035,
      accounts: [account("reserve", 0), account("ira", 246000, "traditional-ira")],
      spending: 6000, requiredWithdrawals: [{ accountId: "ira", amount }], withdrawalOrder: ["ira"],
      calculateTax: context => grossWithdrawals(context) * 0.2,
    }));
    expect(result.requiredWithdrawals).toBe(10000);
    expect(result.tax).toBe(2000);
    expect(result.surplus).toBe(2000);
    expect(result.accounts[1].ending).toBe(236000);
    expect(result.voluntaryWithdrawals).toBe(0);
    assertReconciled(result);
  });

  it("reports unmet required withdrawals separately from household spending", () => {
    const result = settleAnnualCashFlow(input({ accounts: [account("reserve", 10000), account("ira", 1000, "traditional-ira")],
      requiredWithdrawals: [{ accountId: "ira", amount: 2000 }], withdrawalOrder: ["reserve", "ira"], spending: 5000,
    }));
    expect(result.requiredWithdrawals).toBe(1000);
    expect(result.unmetRequiredWithdrawals).toEqual([{ accountId: "ira", amount: 1000 }]);
    expect(result.spendingFunded).toBe(true);
    expect(result.requiredWithdrawalsSatisfied).toBe(false);
    assertReconciled(result);
  });

  it("keeps a $10,000 conversion out of cash while funding its $2,000 tax", () => {
    const result = settleAnnualCashFlow(input({ spending: 0,
      accounts: [account("reserve", 5000), account("ira", 100000, "traditional-ira"), account("roth", 0, "roth-ira")],
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }],
      calculateTax: context => context.conversions.reduce((sum, item) => sum + item.amount, 0) * 0.2,
    }));
    expect(result.voluntaryWithdrawals).toBeCloseTo(2000, 5);
    expect(result.accounts[0].ending).toBeCloseTo(3000, 5);
    expect(result.accounts[1].ending).toBe(90000);
    expect(result.accounts[2].ending).toBe(10000);
    expect(result.surplus).toBeLessThan(0.00001);
    assertReconciled(result);
  });

  it("funds conversion tax and tax on the withdrawal used to pay that tax", () => {
    // W - .2 * (W + 10,000) = 0 -> W = 2,500, tax = 2,500.
    const result = settleAnnualCashFlow(input({ spending: 0,
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }],
      calculateTax: context => (grossWithdrawals(context) + context.conversions[0].amount) * 0.2,
    }));
    expect(result.voluntaryWithdrawals).toBeCloseTo(2500, 5);
    expect(result.tax).toBeCloseTo(2500, 5);
    expect(result.accounts[1].ending).toBeCloseTo(87500, 5);
    expect(result.accounts[2].ending).toBe(10000);
    assertReconciled(result);
  });

  it("takes RMDs before checking available conversion principal", () => {
    expect(() => settleAnnualCashFlow(input({ requiredWithdrawals: [{ accountId: "ira", amount: 10000 }],
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 95000 }],
    }))).toThrow(/remaining after required/);
  });

  it("honors withdrawal ordering across account boundaries and tax rates", () => {
    const result = settleAnnualCashFlow(input({ accounts: [account("reserve", 20000), account("ira", 100000, "traditional-ira")],
      withdrawalOrder: ["reserve", "ira"],
      calculateTax: context => context.withdrawals.find(item => item.accountId === "ira")!.total * 0.2,
    }));
    // $20k cash + $50k IRA less $10k tax = $60k spending.
    expect(result.accounts[0].voluntaryWithdrawal).toBe(20000);
    expect(result.accounts[1].voluntaryWithdrawal).toBeCloseTo(50000, 5);
    expect(result.tax).toBeCloseTo(10000, 5);
    assertReconciled(result);
  });

  it("does not silently withdraw from accounts excluded by the policy", () => {
    const result = settleAnnualCashFlow(input({ withdrawalOrder: ["reserve"] }));
    expect(result.shortfall).toBe(60000);
    expect(result.accounts[1].ending).toBe(100000);
    expect(result.spendingFunded).toBe(false);
    assertReconciled(result);
  });

  it("reports depletion instead of borrowing money or allowing negative balances", () => {
    const result = settleAnnualCashFlow(input({ spending: 100000, calculateTax: context => grossWithdrawals(context) * 0.2 }));
    expect(result.voluntaryWithdrawals).toBe(100000);
    expect(result.shortfall).toBe(20000);
    expect(result.accounts.every(item => item.ending === 0)).toBe(true);
    assertReconciled(result);
  });

  it("reports conversion-tax shortfall without treating the conversion as cash", () => {
    const result = settleAnnualCashFlow(input({ spending: 0, withdrawalOrder: ["ira"],
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 100000 }], calculateTax: () => 20000,
    }));
    expect(result.shortfall).toBe(20000);
    expect(result.accounts[2].ending).toBe(100000);
    expect(result.spendingFunded).toBe(false);
    assertReconciled(result);
  });

  it("applies returns after distributions and transfers, not to spent principal", () => {
    const result = settleAnnualCashFlow(input({ spending: 20000,
      accounts: [account("reserve", 0), account("ira", 100000, "traditional-ira", "one", 0.1), account("roth", 0, "roth-ira", "one", 0.05)],
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }],
    }));
    expect(result.accounts[1].beforeGrowth).toBeCloseTo(70000, 5);
    expect(result.accounts[1].ending).toBeCloseTo(77000, 5);
    expect(result.accounts[2].ending).toBe(10500);
    assertReconciled(result);
  });

  it.each([-1, -0.3, 0, 0.05555, 1])("handles annual return %s without negative or nonfinite balances", annualReturn => {
    const result = settleAnnualCashFlow(input({ accounts: [account("reserve", 0), account("ira", 100000, "traditional-ira", "one", annualReturn)],
      withdrawalOrder: ["ira"], spending: 10000,
    }));
    expect(result.accounts[1].ending).toBeCloseTo(90000 * (1 + annualReturn), 4);
    assertReconciled(result);
  });

  it("allows zero income, zero spending, zero balances and empty withdrawal order", () => {
    const result = settleAnnualCashFlow(input({ accounts: [account("reserve", 0)], spending: 0, withdrawalOrder: [] }));
    expect(result.tax).toBe(0);
    expect(result.shortfall).toBe(0);
    expect(result.spendingFunded).toBe(true);
    assertReconciled(result);
  });

  it("preserves decimal cents instead of rounding intermediate withdrawals", () => {
    const result = settleAnnualCashFlow(input({ spending: 12345.678901, calculateTax: context => grossWithdrawals(context) * 0.12345 }));
    expect(result.voluntaryWithdrawals).toBeCloseTo(12345.678901 / (1 - 0.12345), 5);
    assertReconciled(result);
  });

  it("integrates IRA basis and conversions using ending aggregate IRA value", () => {
    const result = settleAnnualCashFlow(input({ spending: 10000,
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }],
      calculateTax: context => {
        const allocation = iraBasisAllocation(20000,
          context.endingBalances.find(item => item.accountId === "ira")!.amount,
          context.withdrawals.find(item => item.accountId === "ira")!.total,
          context.conversions[0].amount);
        return (allocation.taxableDistributions + allocation.taxableConversions) * 0.25;
      },
    }));
    // 20% basis; tax=.25*.8*(W+10k). W-tax=10k -> W=15k.
    expect(result.voluntaryWithdrawals).toBeCloseTo(15000, 5);
    expect(result.tax).toBeCloseTo(5000, 5);
    expect(result.accounts[1].ending).toBeCloseTo(75000, 5);
    assertReconciled(result);
  });

  it("passes year-end growth to the IRA basis evaluator", () => {
    const result = settleAnnualCashFlow(input({ spending: 0,
      accounts: [account("reserve", 10000), account("ira", 100000, "traditional-ira", "one", 0.1), account("roth", 0, "roth-ira")],
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 10000 }],
      calculateTax: context => iraBasisAllocation(20000,
        context.endingBalances.find(item => item.accountId === "ira")!.amount, 0, 10000).taxableConversions * 0.2,
    }));
    // End IRA $99k + conversion $10k; basis fraction $20k/$109k.
    expect(result.tax).toBeCloseTo(10000 * (1 - 20000 / 109000) * 0.2, 8);
    expect(result.accounts[1].ending).toBeCloseTo(99000, 8);
    assertReconciled(result);
  });

  it("re-evaluates Social Security inclusion as gross-up withdrawals change", () => {
    const result = settleAnnualCashFlow(input({ spending: 50000,
      income: [{ ownerId: "one", kind: "social-security", amount: 20000 }],
      calculateTax: context => {
        const withdrawals = grossWithdrawals(context);
        return (withdrawals + taxableSocialSecurity(20000, withdrawals, 0, false)) * 0.2;
      },
    }));
    // At the solution inclusion is capped at $17k: 20k+W-.2*(W+17k)=50k.
    expect(result.voluntaryWithdrawals).toBeCloseTo(41750, 5);
    expect(result.tax).toBeCloseTo(11750, 5);
    assertReconciled(result);
  });

  it("reconciles 200 varied two-account paths including shortfalls and losses", () => {
    for (let i = 1; i <= 200; i++) {
      const result = settleAnnualCashFlow(input({ spending: i * 1123.4567,
        accounts: [account("reserve", i * 13.111), account("ira", i * 799.777, "traditional-ira", "one", (i % 21 - 10) / 20)],
        withdrawalOrder: i % 2 ? ["reserve", "ira"] : ["ira", "reserve"],
        income: [{ ownerId: "one", kind: "pension", amount: i * 113.31 }],
        requiredWithdrawals: [{ accountId: "ira", amount: i * 4.123 }],
        calculateTax: context => Math.max(0, grossWithdrawals(context) - 1000) * 0.173,
      }));
      assertReconciled(result, 4);
    }
  });
});

describe("Annual ledger validation and isolation", () => {
  it.each([NaN, Infinity, -1, 1e13])("rejects invalid spending and opening balances: %s", value => {
    expect(() => settleAnnualCashFlow(input({ spending: value }))).toThrow();
    expect(() => settleAnnualCashFlow(input({ accounts: [account("reserve", value)], withdrawalOrder: [] }))).toThrow();
  });
  it.each([NaN, Infinity, -1, 1e13])("rejects invalid tax results: %s", value => {
    expect(() => settleAnnualCashFlow(input({ calculateTax: () => value }))).toThrow(/Household tax/);
  });
  it("requires an explicit tax evaluator", () => {
    expect(() => settleAnnualCashFlow(input({ calculateTax: undefined }))).toThrow(/tax evaluator/);
  });
  it("rejects duplicate account IDs and duplicate withdrawal entries", () => {
    expect(() => settleAnnualCashFlow(input({ accounts: [account("reserve", 0), account("reserve", 1)] }))).toThrow(/unique/);
    expect(() => settleAnnualCashFlow(input({ withdrawalOrder: ["ira", "ira"] }))).toThrow(/repeat/);
    expect(() => settleAnnualCashFlow(input({ requiredWithdrawals: [{ accountId: "ira", amount: 1 }, { accountId: "ira", amount: 2 }] }))).toThrow(/aggregated/);
  });
  it("rejects unknown account references and missing IDs", () => {
    expect(() => settleAnnualCashFlow(input({ withdrawalOrder: ["missing"] }))).toThrow(/Unknown account/);
    expect(() => settleAnnualCashFlow(input({ surplusAccountId: "missing" }))).toThrow(/Unknown account/);
    expect(() => settleAnnualCashFlow(input({ accounts: [account("", 0)] }))).toThrow(/ID/);
  });
  it("rejects invalid returns, years and growth overflow", () => {
    for (const annualReturn of [NaN, Infinity, -1.001, 10.001]) {
      expect(() => settleAnnualCashFlow(input({ accounts: [account("reserve", 0), account("ira", 1, "traditional-ira", "one", annualReturn)] }))).toThrow(/return/);
    }
    for (const year of [2023, 2026.5, NaN, 2301]) expect(() => settleAnnualCashFlow(input({ year }))).toThrow(/Year/);
    expect(() => settleAnnualCashFlow(input({ spending: 0, accounts: [account("reserve", 0), account("ira", 1e12, "traditional-ira", "one", 10)], withdrawalOrder: ["ira"] }))).toThrow(/Ending balance/);
  });
  it("requires an untaxed zero-return cash settlement reserve", () => {
    expect(() => settleAnnualCashFlow(input({ surplusAccountId: "ira" }))).toThrow(/reserve/);
    expect(() => settleAnnualCashFlow(input({ accounts: [account("reserve", 0, "cash", "one", 0.01)] }))).toThrow(/reserve/);
  });
  it("rejects cross-owner and unsupported conversion paths", () => {
    expect(() => settleAnnualCashFlow(input({ accounts: [account("reserve", 0), account("ira", 100000, "traditional-ira"), account("roth", 0, "roth-ira", "two")],
      conversions: [{ sourceId: "ira", destinationId: "roth", amount: 1000 }],
    }))).toThrow(/ownership/);
    expect(() => settleAnnualCashFlow(input({ conversions: [{ sourceId: "reserve", destinationId: "roth", amount: 0 }] }))).toThrow(/Conversions require/);
    expect(() => settleAnnualCashFlow(input({ requiredWithdrawals: [{ accountId: "roth", amount: 1 }] }))).toThrow(/required withdrawals/);
  });
  it("rejects a detected nonmonotonic cash-after-tax function", () => {
    expect(() => settleAnnualCashFlow(input({ calculateTax: context => grossWithdrawals(context) * 1.1 }))).toThrow(/nondecreasing/);
  });
  it("does not swallow tax-model exceptions", () => {
    expect(() => settleAnnualCashFlow(input({ calculateTax: () => { throw new Error("Unsupported tax treatment"); } }))).toThrow(/Unsupported tax/);
  });
  it("does not mutate the caller and isolates tax evaluations from writable references", () => {
    const source = input();
    const before = JSON.stringify(source);
    settleAnnualCashFlow({ ...source, calculateTax: context => {
      expect(Object.isFrozen(context)).toBe(true);
      expect(Object.isFrozen(context.openingAccounts[0])).toBe(true);
      expect(Object.isFrozen(context.withdrawals[0])).toBe(true);
      expect(Object.isFrozen(context.endingBalances)).toBe(true);
      return 0;
    } });
    expect(JSON.stringify(source)).toBe(before);
    expect(settleAnnualCashFlow(source)).toEqual(settleAnnualCashFlow(source));
  });
});
