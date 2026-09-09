/** Pure financial primitives for the connected retirement planner.
 * These helpers deliberately do not reuse the standalone RMD calculator's
 * fixed start age or treat a household distribution as its only income.
 */

function finite(name: string, value: number, min = 0) {
  if (!Number.isFinite(value) || value < min) {
    throw new RangeError(`${name} must be finite and at least ${min}.`);
  }
}

function calendarDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError("Use YYYY-MM-DD dates.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError("Invalid calendar date.");
  }
  return date;
}

function anniversary(date: Date, years: number) {
  const result = new Date(date);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  // February 29 becomes February 28 in a non-leap year.
  if (result.getUTCMonth() !== date.getUTCMonth()) result.setUTCDate(0);
  return result;
}

export type EsppLot = {
  shares: number;
  offeringDate: string;
  purchaseDate: string;
  purchasePrice: number;
  offeringFairMarketValue: number;
  purchaseFairMarketValue: number;
  /** Option price computed as if exercised on the offering date (Form 3922). */
  offeringOptionPrice: number;
};

export type EsppSale = {
  proceeds: number;
  originalBasis: number;
  adjustedBasis: number;
  ordinaryIncome: number;
  shortTermGain: number;
  longTermGain: number;
  qualifying: boolean;
  sharesRemaining: number;
};

/** Section 423 ESPP sale only. Nonqualified plans are not interchangeable.
 * IRS Pub. 525, employee stock purchase plans, examples 10 and 11.
 * Selling fees reduce proceeds, not purchase-date compensation.
 */
export function esppSale(lot: EsppLot, shares: number, price: number, saleDate: string, fees = 0): EsppSale {
  for (const [key, value] of Object.entries({ shares: lot.shares, purchasePrice: lot.purchasePrice,
    offeringFairMarketValue: lot.offeringFairMarketValue, purchaseFairMarketValue: lot.purchaseFairMarketValue,
    offeringOptionPrice: lot.offeringOptionPrice, sharesToSell: shares, price, fees })) finite(key, value);
  if (shares > lot.shares || (shares === 0 && fees !== 0)) throw new RangeError("Invalid sale quantity or fees.");
  if (lot.offeringOptionPrice > lot.offeringFairMarketValue || lot.purchasePrice > lot.purchaseFairMarketValue) {
    throw new RangeError("ESPP option and purchase prices cannot exceed their corresponding market values.");
  }
  const offered = calendarDate(lot.offeringDate);
  const purchased = calendarDate(lot.purchaseDate);
  const sold = calendarDate(saleDate);
  if (purchased < offered || sold < purchased) throw new RangeError("ESPP dates are out of order.");
  if (fees > shares * price) throw new RangeError("Fees cannot exceed sale proceeds.");
  const longTerm = sold > anniversary(purchased, 1);
  const qualifying = longTerm && sold > anniversary(offered, 2);
  const proceeds = shares * price - fees;
  const originalBasis = shares * lot.purchasePrice;
  const ordinaryIncome = qualifying
    ? Math.max(0, Math.min(shares * (lot.offeringFairMarketValue - lot.offeringOptionPrice), shares * price - originalBasis))
    : shares * (lot.purchaseFairMarketValue - lot.purchasePrice);
  const adjustedBasis = originalBasis + ordinaryIncome;
  const gain = proceeds - adjustedBasis;
  return { proceeds, originalBasis, adjustedBasis, ordinaryIncome,
    shortTermGain: longTerm ? 0 : gain, longTermGain: longTerm ? gain : 0,
    qualifying, sharesRemaining: lot.shares - shares };
}

/** Birthdate, not current age, determines the statutory birth cohort. */
export function rmdStartAge(birthDate: string): number {
  const date = calendarDate(birthDate);
  if (date < calendarDate("1949-07-01")) return 70.5;
  if (date.getUTCFullYear() <= 1950) return 72;
  if (date.getUTCFullYear() <= 1959) return 73;
  return 75;
}

export function ageAtYearEnd(birthDate: string, year: number) {
  if (!Number.isInteger(year)) throw new RangeError("Year must be an integer.");
  return year - calendarDate(birthDate).getUTCFullYear();
}

export function firstRmdYear(birthDate: string): number {
  const date = calendarDate(birthDate);
  const age = rmdStartAge(birthDate);
  if (age === 70.5) {
    // Determine the year containing the 70-and-a-half birthday.
    date.setUTCFullYear(date.getUTCFullYear() + 70);
    date.setUTCMonth(date.getUTCMonth() + 6);
    return date.getUTCFullYear();
  }
  return date.getUTCFullYear() + age;
}

// IRS Pub. 590-B, Table III (2022 onward); age 120 means 120 and older.
const UNIFORM: Record<number, number> = {
  70: 29.1, 71: 28.2, 72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9,
  78: 22, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16,
  86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8,
  93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4,
  101: 6, 102: 5.6, 103: 5.2, 104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1,
  108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4, 112: 3.3, 113: 3.1, 114: 3,
  115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3, 120: 2,
};

export function requiredDistribution(opts: {
  birthDate: string;
  year: number;
  priorDecemberBalance: number;
  accountType: "traditional-ira" | "401k" | "roth-ira" | "roth-401k";
  /** Table II divisor required when sole-beneficiary spouse is >10 years younger. */
  jointLifeDivisor?: number;
  youngerSpouseSoleBeneficiary?: boolean;
}): number {
  finite("Prior December balance", opts.priorDecemberBalance);
  if (!Number.isInteger(opts.year) || opts.year < 2024) throw new RangeError("Projection years must be 2024 or later.");
  if (opts.accountType === "roth-ira" || opts.accountType === "roth-401k") return 0;
  if (opts.year < firstRmdYear(opts.birthDate)) return 0;
  if (opts.youngerSpouseSoleBeneficiary && opts.jointLifeDivisor === undefined) {
    throw new RangeError("This beneficiary arrangement requires a Joint Life table divisor.");
  }
  const divisor = opts.youngerSpouseSoleBeneficiary
    ? opts.jointLifeDivisor! : UNIFORM[Math.min(120, ageAtYearEnd(opts.birthDate, opts.year))];
  if (!Number.isFinite(divisor) || divisor <= 0) throw new RangeError("Invalid RMD divisor.");
  return opts.priorDecemberBalance / divisor;
}

/** Simplified Pub. 915 worksheet: no lump-sum election, exclusions or repayments.
 * Thresholds are statutory nominal dollars, not inflation-adjusted thresholds.
 */
export function taxableSocialSecurity(benefits: number, otherIncome: number, taxExemptInterest: number, married: boolean) {
  finite("Benefits", benefits);
  finite("Other income", otherIncome, -Number.MAX_VALUE);
  finite("Tax-exempt interest", taxExemptInterest);
  const lower = married ? 32_000 : 25_000;
  const upper = married ? 44_000 : 34_000;
  const provisional = otherIncome + taxExemptInterest + benefits / 2;
  if (provisional <= lower) return 0;
  if (provisional <= upper) return Math.min(benefits / 2, (provisional - lower) / 2);
  return Math.min(benefits * 0.85, (provisional - upper) * 0.85 + Math.min(benefits / 2, (upper - lower) / 2));
}

/** Per-owner aggregate IRA basis reconciliation, not basis per IRA account.
 * Does not attempt Form 8606 rounding or outstanding-rollover adjustments.
 */
export function iraBasisAllocation(basis: number, endingAggregateValue: number, distributions: number, conversions: number) {
  for (const [key, value] of Object.entries({ basis, endingAggregateValue, distributions, conversions })) finite(key, value);
  const denominator = endingAggregateValue + distributions + conversions;
  const fraction = denominator > 0 ? Math.min(1, basis / denominator) : 0;
  const nontaxableDistributions = distributions * fraction;
  const nontaxableConversions = conversions * fraction;
  return { nontaxableDistributions, nontaxableConversions,
    taxableDistributions: distributions - nontaxableDistributions,
    taxableConversions: conversions - nontaxableConversions,
    remainingBasis: Math.max(0, basis - nontaxableDistributions - nontaxableConversions) };
}

/** Bisection of a continuous, nondecreasing after-tax cash function.
 * Returns a shortfall instead of assuming a depleted account pays the bill.
 * Tax functions with discontinuities need a separate candidate search.
 */
export function solveGrossWithdrawal(need: number, available: number, netCash: (gross: number) => number) {
  finite("Cash need", need);
  finite("Available balance", available);
  const evaluate = (gross: number) => {
    const result = netCash(gross);
    if (!Number.isFinite(result)) throw new RangeError("Tax calculation produced nonfinite cash.");
    return result;
  };
  const baseline = evaluate(0);
  if (baseline >= need) return { gross: 0, net: baseline, shortfall: 0 };
  const maximum = evaluate(available);
  if (maximum <= need) return { gross: available, net: maximum, shortfall: Math.max(0, need - maximum) };
  let low = 0;
  let high = available;
  for (let i = 0; i < 80 && high - low > 0.000001; i++) {
    const middle = low + (high - low) / 2;
    if (evaluate(middle) < need) low = middle;
    else high = middle;
  }
  return { gross: high, net: evaluate(high), shortfall: 0 };
}
