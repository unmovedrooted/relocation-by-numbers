/**
 * Three additions to the mortgage calculator, kept as plain arithmetic so they can be tested:
 * the true monthly cost of owning, a renovation budget, and "buy here" against "stay where I am".
 */

/** Monthly principal and interest on a level-payment loan. */
export function loanPayment(principal: number, annualRatePct: number, termYears: number): number {
  if (!(principal > 0) || annualRatePct < 0 || !(termYears > 0)) return 0;
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ─── True monthly cost of owning ─────────────────────────────────────────────

export type TrueMonthlyCost = Readonly<{ payment: number; maintenance: number; utilities: number; total: number }>;

/**
 * The lender's monthly payment (principal, interest, property tax, insurance, HOA and PMI) plus the two costs a lender does not
 * count: a maintenance reserve (a percentage of the home's value per year) and utilities.
 */
export function trueMonthlyCost(opts: { payment: number; homePrice: number; maintenancePctPerYear: number; utilitiesMonthly: number }): TrueMonthlyCost {
  const payment = Math.max(0, opts.payment);
  const maintenance = (Math.max(0, opts.homePrice) * Math.max(0, opts.maintenancePctPerYear)) / 100 / 12;
  const utilities = Math.max(0, opts.utilitiesMonthly);
  return { payment, maintenance, utilities, total: payment + maintenance + utilities };
}

// ─── Renovation budget ───────────────────────────────────────────────────────

export type RenovationPlan = Readonly<{
  /** Renovation cost plus the contingency. */
  budget: number;
  contingency: number;
  /** Purchase price plus the renovation budget. */
  allInCost: number;
  /** Cash the renovation takes from savings (zero when it is financed). */
  cashForRenovation: number;
  /** Added to the monthly payment when the renovation is financed at the mortgage's rate and term. */
  addedMonthlyPayment: number;
  /** Savings left after the down payment, closing costs, moving costs and any cash paid for the renovation. */
  cashAfterEverything: number;
  /** That amount minus the reserve target; negative means the reserve is not fully funded. */
  reserveGap: number;
}>;

export function renovationPlan(opts: {
  homePrice: number;
  renovationCost: number;
  contingencyPct: number;
  financed: boolean;
  ratePct: number;
  termYears: number;
  savings: number;
  /** Down payment plus closing costs. */
  cashToClose: number;
  movingCosts: number;
  /** Cash the buyer wants left as an emergency reserve. */
  reserveTarget: number;
}): RenovationPlan | null {
  const cost = Math.max(0, opts.renovationCost);
  if (cost === 0) return null;
  const contingency = (cost * Math.max(0, opts.contingencyPct)) / 100;
  const budget = cost + contingency;
  const cashForRenovation = opts.financed ? 0 : budget;
  const cashAfterEverything = opts.savings - opts.cashToClose - Math.max(0, opts.movingCosts) - cashForRenovation;
  return {
    budget,
    contingency,
    allInCost: Math.max(0, opts.homePrice) + budget,
    cashForRenovation,
    addedMonthlyPayment: opts.financed ? loanPayment(budget, opts.ratePct, opts.termYears) : 0,
    cashAfterEverything,
    reserveGap: cashAfterEverything - Math.max(0, opts.reserveTarget),
  };
}

// ─── Buy here against staying where you are ──────────────────────────────────

export type StaySide = Readonly<{ takeHome: number; housing: number; otherSpending: number; leftOver: number }>;
export type StayVsBuy = Readonly<{ stay: StaySide; buy: StaySide; change: StaySide }>;

/**
 * Monthly comparison of staying in the current home and state against buying in the new state.
 * Take-home pay comes from the caller (the wage tax engine, each state's income tax). Other spending is the visitor's current
 * figure, scaled by the ratio of the two states' price levels for goods and services other than housing.
 */
export function stayVsBuy(opts: {
  takeHomeStayMonthly: number;
  takeHomeBuyMonthly: number;
  housingStayMonthly: number;
  housingBuyMonthly: number;
  otherSpendingStayMonthly: number;
  /** Price level for non-housing spending in each state (any common base, for example the national average = 100). */
  priceLevelStay: number;
  priceLevelBuy: number;
}): StayVsBuy {
  const scale = opts.priceLevelStay > 0 && opts.priceLevelBuy > 0 ? opts.priceLevelBuy / opts.priceLevelStay : 1;
  const side = (takeHome: number, housing: number, otherSpending: number): StaySide => ({ takeHome, housing, otherSpending, leftOver: takeHome - housing - otherSpending });
  const stay = side(opts.takeHomeStayMonthly, Math.max(0, opts.housingStayMonthly), Math.max(0, opts.otherSpendingStayMonthly));
  const buy = side(opts.takeHomeBuyMonthly, Math.max(0, opts.housingBuyMonthly), Math.max(0, opts.otherSpendingStayMonthly) * scale);
  return {
    stay,
    buy,
    change: { takeHome: buy.takeHome - stay.takeHome, housing: buy.housing - stay.housing, otherSpending: buy.otherSpending - stay.otherSpending, leftOver: buy.leftOver - stay.leftOver },
  };
}

/** Non-housing price level from BEA Regional Price Parities: the average of goods and other services. */
export function nonHousingPriceLevel(rpp: { goods: number | null; otherServices: number | null } | null | undefined): number | null {
  if (!rpp || typeof rpp.goods !== "number" || typeof rpp.otherServices !== "number") return null;
  return (rpp.goods + rpp.otherServices) / 2;
}
