// ─────────────────────────────────────────────────────────────────────────
// RENT vs BUY, monthly net-worth simulation.
//
// Both scenarios start with the same cash (down payment + buyer closing costs).
// The buyer spends it on the home; the renter invests it. Each month, whoever
// has the lower housing cost invests the difference (at the end of each month) at the investment return,
// so the comparison is apples-to-apples. Net worth = what you'd walk away with
// if you liquidated that month: the buyer's home equity net of selling costs
// plus any side investments, vs. the renter's portfolio. The break-even is the
// first month the buyer's net worth catches the renter's.
// ─────────────────────────────────────────────────────────────────────────

export type RentVsBuyInput = {
  // Buy (percentages as whole numbers, e.g. 20 for 20%)
  homePrice: number;
  downPct: number;
  mortgageRatePct: number;
  loanYears: number;
  propertyTaxPct: number; // annual, % of home value
  homeInsuranceAnnual: number; // $/yr
  hoaMonthly: number; // $/mo
  maintenancePct: number; // annual, % of home value
  buyClosingPct: number; // % of price, upfront
  appreciationPct: number; // annual
  sellingCostPct: number; // % of sale price
  // Rent
  monthlyRent: number;
  rentGrowthPct: number; // annual
  rentersInsuranceMonthly: number;
  // Shared
  investmentReturnPct: number; // annual, opportunity cost
  years: number; // horizon
  /** Share of mortgage interest recovered as a tax saving, % (0 = none; the default when omitted). */
  taxBenefitPct?: number;
};

/**
 * Starting assumptions shared by the Rent vs. Buy and mortgage calculators, so both begin from the same numbers and a difference
 * between their answers comes from what the visitor changes, not from different defaults.
 */
export const RENT_VS_BUY_DEFAULTS = {
  mortgageRatePct: 6.75,
  propertyTaxPct: 1.1,
  homeInsuranceAnnual: 1800,
  maintenancePct: 1,
  buyClosingPct: 2.5,
  appreciationPct: 3.5,
  sellingCostPct: 6,
  rentGrowthPct: 3,
  rentersInsuranceMonthly: 15,
  investmentReturnPct: 7,
  taxBenefitPct: 0,
} as const;

export type RentVsBuyResult = {
  months: number;
  downPayment: number;
  closingCosts: number;
  monthlyPI: number;
  firstMonthBuyCost: number;
  firstMonthRentCost: number;
  buyerNetWorth: number[]; // per month (liquidation value)
  renterNetWorth: number[];
  finalBuyer: number;
  finalRenter: number;
  breakEvenMonth: number; // -1 if never within horizon
  totalBuyOutOfPocket: number;
  totalRentPaid: number;
  finalHomeValue: number;
  finalLoanBalance: number;
};

export function simulateRentVsBuy(i: RentVsBuyInput): RentVsBuyResult {
  const months = Math.max(1, Math.round(i.years * 12));
  const downPayment = i.homePrice * (Math.min(100, Math.max(0, i.downPct)) / 100);
  const closingCosts = i.homePrice * (i.buyClosingPct / 100);
  const loan0 = Math.max(0, i.homePrice - downPayment);
  const mRate = i.mortgageRatePct / 100 / 12;
  const nLoan = Math.max(1, Math.round(i.loanYears * 12));
  const monthlyPI = loan0 <= 0 ? 0 : mRate === 0 ? loan0 / nLoan : (loan0 * mRate) / (1 - Math.pow(1 + mRate, -nLoan));

  // Effective monthly rates from annual (geometric).
  const invMonthly = Math.pow(1 + i.investmentReturnPct / 100, 1 / 12) - 1;
  const apprMonthly = Math.pow(1 + i.appreciationPct / 100, 1 / 12) - 1;

  let loanBal = loan0;
  let homeValue = i.homePrice;
  let renterPortfolio = downPayment + closingCosts; // renter invests the buyer's upfront cash
  let buyerSide = 0; // buyer invests when their monthly cost is below rent (later years)
  let rent = i.monthlyRent;

  const buyerNetWorth: number[] = [];
  const renterNetWorth: number[] = [];
  let totalBuyOutOfPocket = downPayment + closingCosts;
  let totalRentPaid = 0;
  let breakEvenMonth = -1;
  let firstMonthBuyCost = 0;
  let firstMonthRentCost = 0;

  for (let m = 1; m <= months; m++) {
    const propTax = (homeValue * (i.propertyTaxPct / 100)) / 12;
    const insurance = i.homeInsuranceAnnual / 12;
    const maintenance = (homeValue * (i.maintenancePct / 100)) / 12;
    const pi = m <= nLoan ? monthlyPI : 0;
    const interest = loanBal * mRate;
    const taxSaving = interest * ((i.taxBenefitPct ?? 0) / 100);
    const buyCost = pi + propTax + insurance + i.hoaMonthly + maintenance - taxSaving;
    const rentCost = rent + i.rentersInsuranceMonthly;

    if (m === 1) {
      firstMonthBuyCost = buyCost;
      firstMonthRentCost = rentCost;
    }
    totalBuyOutOfPocket += buyCost;
    totalRentPaid += rentCost;

    // Whoever pays less banks the difference at the end of the month (the same deposit timing as the other calculators).
    const diff = buyCost - rentCost;

    // Amortize the loan for the month.
    const principal = Math.min(loanBal, Math.max(0, pi - interest));
    loanBal = Math.max(0, loanBal - principal);

    // Grow investments and home value.
    renterPortfolio = renterPortfolio * (1 + invMonthly) + Math.max(0, diff);
    buyerSide = buyerSide * (1 + invMonthly) + Math.max(0, -diff);
    homeValue *= 1 + apprMonthly;

    // Rent steps up annually.
    if (m % 12 === 0) rent *= 1 + i.rentGrowthPct / 100;

    // Net worth if liquidated this month.
    const buyerEquityNet = homeValue * (1 - i.sellingCostPct / 100) - loanBal;
    const bNW = buyerEquityNet + buyerSide;
    const rNW = renterPortfolio;
    buyerNetWorth.push(bNW);
    renterNetWorth.push(rNW);
    if (breakEvenMonth < 0 && bNW >= rNW) breakEvenMonth = m;
  }

  return {
    months,
    downPayment,
    closingCosts,
    monthlyPI,
    firstMonthBuyCost,
    firstMonthRentCost,
    buyerNetWorth,
    renterNetWorth,
    finalBuyer: buyerNetWorth[buyerNetWorth.length - 1],
    finalRenter: renterNetWorth[renterNetWorth.length - 1],
    breakEvenMonth,
    totalBuyOutOfPocket,
    totalRentPaid,
    finalHomeValue: homeValue,
    finalLoanBalance: loanBal,
  };
}

export type RentVsBuyThresholds = {
  /** Who is ahead in net worth at the chosen horizon. */
  winner: "buy" | "rent";
  /** Years until buying's net worth first catches the renter's (null if it never does within 40 years). */
  breakEvenYears: number | null;
  /** The home price at which the answer flips with everything else unchanged (null if it does not flip in the searched range). */
  homePrice: number | null;
  /** The monthly rent at which the answer flips. */
  monthlyRent: number | null;
  /** The yearly home appreciation, %, at which the answer flips. */
  appreciationPct: number | null;
};

/**
 * What would change the conclusion, worked out from the visitor's own scenario: the length of stay, home price, rent and appreciation at
 * which the other choice draws level at the chosen horizon, changing one thing at a time. A value is null when the answer does not flip
 * anywhere in the range searched (price 30% to 250% of the entered price, rent 30% to 300%, appreciation -3% to 12%).
 */
export function rentVsBuyThresholds(input: RentVsBuyInput): RentVsBuyThresholds {
  const lead = (i: RentVsBuyInput) => { const r = simulateRentVsBuy(i); return r.finalBuyer - r.finalRenter; };
  const winner: "buy" | "rent" = lead(input) >= 0 ? "buy" : "rent";
  const flipped = (i: RentVsBuyInput) => (winner === "rent" ? lead(i) >= 0 : lead(i) < 0);

  // Finds the value between `from` (the entered value, where nothing has flipped) and `limit` where the answer first flips.
  const boundary = (make: (x: number) => RentVsBuyInput, from: number, limit: number): number | null => {
    if (!flipped(make(limit))) return null;
    let lo = from;
    let hi = limit;
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (flipped(make(mid))) hi = mid; else lo = mid;
    }
    return hi;
  };

  const long = simulateRentVsBuy({ ...input, years: 40 });
  const breakEvenYears = long.breakEvenMonth > 0 ? Math.round((long.breakEvenMonth / 12) * 10) / 10 : null;

  // When renting is ahead, buying needs a lower price, higher rent or more appreciation; when buying is ahead, the reverse.
  const priceLimit = winner === "rent" ? input.homePrice * 0.3 : input.homePrice * 2.5;
  const rentLimit = winner === "rent" ? input.monthlyRent * 3 : input.monthlyRent * 0.3;
  const apprLimit = winner === "rent" ? 12 : -3;
  return {
    winner,
    breakEvenYears,
    homePrice: boundary((x) => ({ ...input, homePrice: x }), input.homePrice, priceLimit),
    monthlyRent: boundary((x) => ({ ...input, monthlyRent: x }), input.monthlyRent, rentLimit),
    appreciationPct: boundary((x) => ({ ...input, appreciationPct: x }), input.appreciationPct, apprLimit),
  };
}
