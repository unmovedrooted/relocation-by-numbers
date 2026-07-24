// ─────────────────────────────────────────────────────────────────────────
// RENT vs BUY, monthly net-worth simulation.
//
// Both scenarios start with the same cash (down payment + buyer closing costs).
// The buyer spends it on the home; the renter invests it. Each month, whoever
// has the lower housing cost invests the difference at the investment return,
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
};

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
  const downPayment = i.homePrice * (i.downPct / 100);
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
    const buyCost = pi + propTax + insurance + i.hoaMonthly + maintenance;
    const rentCost = rent + i.rentersInsuranceMonthly;

    if (m === 1) {
      firstMonthBuyCost = buyCost;
      firstMonthRentCost = rentCost;
    }
    totalBuyOutOfPocket += buyCost;
    totalRentPaid += rentCost;

    // Whoever pays less banks the difference.
    const diff = buyCost - rentCost;
    if (diff > 0) renterPortfolio += diff;
    else buyerSide += -diff;

    // Amortize the loan for the month.
    const interest = loanBal * mRate;
    const principal = Math.min(loanBal, Math.max(0, pi - interest));
    loanBal = Math.max(0, loanBal - principal);

    // Grow investments and home value.
    renterPortfolio *= 1 + invMonthly;
    buyerSide *= 1 + invMonthly;
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
