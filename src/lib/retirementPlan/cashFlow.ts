/**
 * Annual cash settlement, not a complete retirement projection or tax model.
 *
 * The caller supplies independently calculated RMDs, a candidate conversion
 * policy, and a combined-household tax evaluator. No default zero-tax model is
 * provided. This separation lets the ledger be tested without inventing tax
 * rules or treating each account's distribution as the household's only income.
 *
 * Timing: opening balances -> required withdrawals -> conversions -> voluntary
 * withdrawals -> funded contributions/reinvest surplus -> annual returns. All amounts are in
 * the same year's nominal dollars. Return values are decimals, not percentages.
 */

export type CashAccount = Readonly<{
  id: string;
  ownerId: string;
  balance: number;
  kind: "cash" | "taxable" | "traditional-ira" | "401k" | "roth-ira" | "roth-401k" | "annuity" | "espp";
  annualReturn: number;
}>;

export type AccountAmount = Readonly<{ accountId: string; amount: number }>;
export type RothTransfer = Readonly<{
  sourceId: string;
  destinationId: string;
  amount: number;
}>;

export type CashIncome = Readonly<{
  ownerId: string;
  kind: "wages" | "pension" | "social-security" | "other";
  amount: number;
}>;

export type Withdrawal = Readonly<{
  accountId: string;
  required: number;
  voluntary: number;
  total: number;
}>;

export type TaxContext = Readonly<{
  year: number;
  income: readonly CashIncome[];
  openingAccounts: readonly CashAccount[];
  withdrawals: readonly Withdrawal[];
  conversions: readonly RothTransfer[];
  /** Before excess cash is deposited. For IRA basis, use endingBalances. */
  balancesBeforeGrowth: readonly AccountAmount[];
  /** After returns; the designated cash surplus account must have zero return. */
  endingBalances: readonly AccountAmount[];
  contributions?: readonly AccountAmount[];
}>;

export type AnnualCashFlowInput = Readonly<{
  year: number;
  accounts: readonly CashAccount[];
  income: readonly CashIncome[];
  spending: number;
  /** Requests: capped to external income after spending/tax, proportionally.
   * Deposited after withdrawals, before growth; never available to the search.
   */
  contributions?: readonly AccountAmount[];
  requiredWithdrawals: readonly AccountAmount[];
  conversions: readonly RothTransfer[];
  /** Each eligible account once, in the chosen order. Omitted assets are held. */
  withdrawalOrder: readonly string[];
  /** Explicit reserve for excess income/RMDs, including initially empty reserves. */
  surplusAccountId: string;
  /**
   * Annual combined-household tax liability in dollars, including conversion
   * and distribution taxes. Must be pure, finite, nonnegative, and continuous.
   * Along the supplied withdrawal order, cash after tax must be nondecreasing.
   * Tax cliffs/nonmonotone policies need a different funding search.
   * The future tax adapter must include account basis, payroll and investment
   * taxes as appropriate; this ledger itself does not classify taxable income.
   */
  calculateTax: (context: TaxContext) => number;
}>;

export type SettledAccount = Readonly<{
  accountId: string;
  opening: number;
  requiredWithdrawal: number;
  voluntaryWithdrawal: number;
  conversionOut: number;
  conversionIn: number;
  surplusDeposit: number;
  contributionDeposit: number;
  beforeGrowth: number;
  investmentChange: number;
  ending: number;
}>;

export type AnnualCashFlowResult = Readonly<{
  year: number;
  income: number;
  spending: number;
  contributions: number;
  requestedContributions: number;
  tax: number;
  requiredWithdrawals: number;
  voluntaryWithdrawals: number;
  conversions: readonly RothTransfer[];
  unmetRequiredWithdrawals: readonly AccountAmount[];
  shortfall: number;
  surplus: number;
  /** Funding is distinct from statutory-distribution compliance. */
  spendingFunded: boolean;
  requiredWithdrawalsSatisfied: boolean;
  accounts: readonly SettledAccount[];
  cashResidual: number;
  portfolioResidual: number;
}>;

const MONEY_LIMIT = 1e12;
const CASH_TOLERANCE = 1e-6;

function amount(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0 || value > MONEY_LIMIT) {
    throw new RangeError(`${label} must be between 0 and ${MONEY_LIMIT}.`);
  }
  return value;
}

function total(values: readonly number[], label: string) {
  return amount(values.reduce((sum, value) => sum + value, 0), label);
}

function identifier(value: string, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new RangeError(`${label} is required.`);
}

/** Evaluate one candidate policy. Policy comparison must reject unfunded years. */
export function settleAnnualCashFlow(input: AnnualCashFlowInput): AnnualCashFlowResult {
  if (!Number.isInteger(input.year) || input.year < 2024 || input.year > 2300) {
    throw new RangeError("Year must be an integer between 2024 and 2300.");
  }
  if (typeof input.calculateTax !== "function") throw new TypeError("A household tax evaluator is required.");
  amount(input.spending, "Spending");
  if (input.accounts.length > 100 || input.income.length > 100) throw new RangeError("Too many accounts or income sources.");

  const accounts = input.accounts.map(account => {
    identifier(account.id, "Account ID");
    identifier(account.ownerId, "Owner ID");
    amount(account.balance, "Account balance");
    if (!["cash", "taxable", "traditional-ira", "401k", "roth-ira", "roth-401k", "annuity", "espp"].includes(account.kind)) {
      throw new RangeError("Unknown account kind.");
    }
    if (!Number.isFinite(account.annualReturn) || account.annualReturn < -1 || account.annualReturn > 10) {
      throw new RangeError("Annual return must be a decimal between -1 and 10.");
    }
    return Object.freeze({ ...account });
  });
  const indices = new Map(accounts.map((account, index) => [account.id, index]));
  if (indices.size !== accounts.length) throw new RangeError("Account IDs must be unique.");
  const indexOf = (id: string) => {
    const index = indices.get(id);
    if (index === undefined) throw new RangeError(`Unknown account: ${id}.`);
    return index;
  };
  const surplusIndex = indexOf(input.surplusAccountId);
  let contributed = accounts.map(() => 0);
  for (const item of input.contributions ?? []) {
    const index = indexOf(item.accountId);
    contributed[index] = amount(contributed[index] + amount(item.amount, "Contribution"), "Account contributions");
  }
  const requested = [...contributed];
  const requestedContributions = total(requested, "Household contributions");
  if (accounts[surplusIndex].kind !== "cash" || accounts[surplusIndex].annualReturn !== 0) {
    throw new RangeError("The settlement reserve must be a zero-return cash account.");
  }
  const owners = new Set(accounts.map(account => account.ownerId));
  const income = input.income.map(item => {
    identifier(item.ownerId, "Income owner ID");
    if (!owners.has(item.ownerId)) throw new RangeError("Income owner must have an account, which may have a zero balance.");
    if (!["wages", "pension", "social-security", "other"].includes(item.kind)) throw new RangeError("Unknown income kind.");
    amount(item.amount, "Income");
    return Object.freeze({ ...item });
  });
  const incomeTotal = total(income.map(item => item.amount), "Household income");
  const openingTotal = total(accounts.map(account => account.balance), "Opening portfolio");
  const order = input.withdrawalOrder.map(indexOf);
  if (new Set(order).size !== order.length) throw new RangeError("Withdrawal order must not repeat accounts.");

  const balances = accounts.map(account => account.balance);
  const required = accounts.map(() => 0);
  const convertedOut = accounts.map(() => 0);
  const convertedIn = accounts.map(() => 0);
  const unmet: AccountAmount[] = [];
  const requiredIds = new Set<string>();
  for (const withdrawal of input.requiredWithdrawals) {
    const index = indexOf(withdrawal.accountId);
    amount(withdrawal.amount, "Required withdrawal");
    if (requiredIds.has(withdrawal.accountId)) throw new RangeError("Required withdrawals must be aggregated per account.");
    requiredIds.add(withdrawal.accountId);
    if (!["traditional-ira", "401k", "annuity"].includes(accounts[index].kind)) {
      throw new RangeError("Owner-lifetime required withdrawals cannot be assigned to this account kind.");
    }
    const paid = Math.min(balances[index], withdrawal.amount);
    required[index] = paid;
    balances[index] -= paid;
    if (withdrawal.amount > paid) unmet.push({ accountId: withdrawal.accountId, amount: withdrawal.amount - paid });
  }
  const conversions = input.conversions.map(transfer => {
    amount(transfer.amount, "Conversion");
    const source = indexOf(transfer.sourceId);
    const destination = indexOf(transfer.destinationId);
    if (!["traditional-ira", "401k"].includes(accounts[source].kind) || accounts[destination].kind !== "roth-ira") {
      throw new RangeError("Conversions require a traditional IRA/401k source and Roth IRA destination.");
    }
    if (accounts[source].ownerId !== accounts[destination].ownerId) throw new RangeError("Conversions cannot transfer ownership.");
    if (transfer.amount > balances[source]) throw new RangeError("Conversion exceeds the balance remaining after required withdrawals.");
    balances[source] -= transfer.amount;
    balances[destination] = amount(balances[destination] + transfer.amount, "Converted destination balance");
    convertedOut[source] += transfer.amount;
    convertedIn[destination] += transfer.amount;
    return Object.freeze({ ...transfer });
  });
  const requiredTotal = total(required, "Required withdrawals");
  const maximum = total(order.map(index => balances[index]), "Available withdrawals");
  const openingAccounts = Object.freeze(accounts);
  const frozenIncome = Object.freeze(income);
  const frozenConversions = Object.freeze(conversions);

  const evaluate = (gross: number) => {
    const voluntary = accounts.map(() => 0);
    let remaining = gross;
    for (const index of order) {
      const paid = Math.min(remaining, balances[index]);
      voluntary[index] = paid;
      remaining = Math.max(0, remaining - paid);
    }
    const beforeGrowth = balances.map((balance, index) => Math.max(0, balance - voluntary[index]));
    const ending = beforeGrowth.map((balance, index) => amount((balance + contributed[index]) * (1 + accounts[index].annualReturn), "Ending balance"));
    const tax = amount(input.calculateTax(Object.freeze({
      year: input.year,
      income: frozenIncome,
      openingAccounts,
      withdrawals: Object.freeze(accounts.map((account, index) => Object.freeze({
        accountId: account.id, required: required[index], voluntary: voluntary[index],
        total: required[index] + voluntary[index],
      }))),
      conversions: frozenConversions,
      contributions: Object.freeze(accounts.map((account, index) => Object.freeze({ accountId: account.id, amount: contributed[index] }))),
      balancesBeforeGrowth: Object.freeze(accounts.map((account, index) => Object.freeze({ accountId: account.id, amount: beforeGrowth[index] + contributed[index] }))),
      endingBalances: Object.freeze(accounts.map((account, index) => Object.freeze({ accountId: account.id, amount: ending[index] }))),
    })), "Household tax");
    const withdrawn = total(voluntary, "Voluntary withdrawals");
    const net = incomeTotal + requiredTotal + withdrawn - tax;
    return { voluntary, beforeGrowth, tax, net, withdrawn };
  };

  // Spend/tax first. Contributions may use external income only, never RMDs,
  // conversions, old assets or another contribution. Preserve requested ratios.
  if (requestedContributions > 0) {
    const margin = (scale: number) => {
      contributed = requested.map(value => value * scale);
      return evaluate(0).net - requiredTotal - input.spending - total(contributed, "Contributions");
    };
    if (margin(1) < 0) {
      let low = 0;
      let high = 1;
      let lowMargin = margin(0);
      if (lowMargin >= 0) {
        let highMargin = margin(1);
        for (let i = 0; i < 80 && (high - low) * requestedContributions > CASH_TOLERANCE; i++) {
          const middle = (low + high) / 2;
          const available = margin(middle);
          if (available > lowMargin + CASH_TOLERANCE || available < highMargin - CASH_TOLERANCE) throw new RangeError("Contribution funding is not monotone.");
          if (available >= 0) { low = middle; lowMargin = available; }
          else { high = middle; highMargin = available; }
        }
      }
      margin(low);
    }
  }
  const contributionTotal = total(contributed, "Household contributions");
  const cashNeed = amount(input.spending + contributionTotal, "Spending and contributions");
  let settled = evaluate(0);
  if (settled.net < cashNeed) {
    let low = 0;
    let high = maximum;
    let lowNet = settled.net;
    let highResult = evaluate(high);
    let highNet = highResult.net;
    if (highNet + CASH_TOLERANCE < lowNet) throw new RangeError("After-tax cash is not nondecreasing; this tax policy requires a different solver.");
    if (highNet < cashNeed) {
      settled = highResult;
    } else {
      // Always retain the funded endpoint; do not round a tax gross-up down.
      for (let iteration = 0; iteration < 100 && high - low > CASH_TOLERANCE; iteration++) {
        const middle = low + (high - low) / 2;
        const candidate = evaluate(middle);
        if (candidate.net + CASH_TOLERANCE < lowNet || candidate.net > highNet + CASH_TOLERANCE) {
          throw new RangeError("After-tax cash is not nondecreasing; this tax policy requires a different solver.");
        }
        if (candidate.net < cashNeed) {
          low = middle;
          lowNet = candidate.net;
        } else {
          high = middle;
          highNet = candidate.net;
          highResult = candidate;
        }
      }
      settled = highResult;
    }
  }
  const shortfall = Math.max(0, cashNeed - settled.net);
  if (contributionTotal > 0 && shortfall > CASH_TOLERANCE) throw new RangeError("Unfunded contributions must be reduced before settlement; do not create unfunded assets.");
  const surplus = Math.max(0, settled.net - cashNeed);
  const resultAccounts = accounts.map((account, index): SettledAccount => {
    const surplusDeposit = index === surplusIndex ? surplus : 0;
    const beforeGrowth = amount(settled.beforeGrowth[index] + contributed[index] + surplusDeposit, "Balance before growth");
    const investmentChange = beforeGrowth * account.annualReturn;
    return Object.freeze({
      accountId: account.id, opening: account.balance,
      requiredWithdrawal: required[index], voluntaryWithdrawal: settled.voluntary[index],
      conversionOut: convertedOut[index], conversionIn: convertedIn[index],
      surplusDeposit, contributionDeposit: contributed[index], beforeGrowth, investmentChange,
      ending: amount(beforeGrowth + investmentChange, "Ending balance"),
    });
  });
  const endingTotal = total(resultAccounts.map(account => account.ending), "Ending portfolio");
  const investmentChange = resultAccounts.reduce((sum, account) => sum + account.investmentChange, 0);
  // Conversions cancel out of both household cash and household wealth.
  const cashResidual = incomeTotal + requiredTotal + settled.withdrawn + shortfall
    - input.spending - contributionTotal - settled.tax - surplus;
  const portfolioResidual = openingTotal + contributionTotal - requiredTotal - settled.withdrawn
    + surplus + investmentChange - endingTotal;
  return Object.freeze({
    year: input.year, income: incomeTotal, spending: input.spending, contributions: contributionTotal, requestedContributions, tax: settled.tax,
    requiredWithdrawals: requiredTotal, voluntaryWithdrawals: settled.withdrawn,
    conversions: frozenConversions,
    unmetRequiredWithdrawals: Object.freeze(unmet.map(item => Object.freeze(item))),
    shortfall, surplus, spendingFunded: shortfall <= CASH_TOLERANCE,
    requiredWithdrawalsSatisfied: unmet.length === 0,
    accounts: Object.freeze(resultAccounts), cashResidual, portfolioResidual,
  });
}
