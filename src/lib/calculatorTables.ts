import { STATES, type StateCode } from "./states";
import type { FilingStatus } from "./tax";
import { UNIFORM } from "./retirementPlan/rules";
import { rmdStartAge } from "./rmdRules";
import { estimateNetBreakdown, getFederalBrackets, getFederalStandardDeduction } from "./wageTax";

/**
 * Reference tables shown under the calculators. Every number is computed from the same tables and engines the calculators
 * use (the IRS Uniform Lifetime Table, the 2026 federal brackets, the wage tax engine), so the tables cannot drift from them.
 */

// ─── RMD ─────────────────────────────────────────────────────────────────────

export const RMD_BALANCES = [250_000, 500_000, 1_000_000] as const;
export const RMD_FIRST_AGE = 73;
export const RMD_LAST_AGE = 100;

export type RmdRow = Readonly<{ age: number; divisor: number; pctOfBalance: number; amounts: readonly number[] }>;

/** Uniform Lifetime Table rows: RMD = prior year-end balance / divisor. */
export function rmdRows(): RmdRow[] {
  const rows: RmdRow[] = [];
  for (let age = RMD_FIRST_AGE; age <= RMD_LAST_AGE; age++) {
    const divisor = UNIFORM[age];
    rows.push({ age, divisor, pctOfBalance: 100 / divisor, amounts: RMD_BALANCES.map((b) => b / divisor) });
  }
  return rows;
}

/** First RMD age by birth-year group. */
export function rmdStartAgeRows(): { group: string; age: number }[] {
  return [
    { group: "July 1949 to 1950", age: rmdStartAge(1950) },
    { group: "1951 to 1959", age: rmdStartAge(1955) },
    { group: "1960 or later", age: rmdStartAge(1960) },
  ];
}

// ─── Paycheck ────────────────────────────────────────────────────────────────

export const PAYCHECK_SALARIES = [75_000, 100_000, 150_000] as const;

export type PaycheckStateRow = Readonly<{
  code: StateCode;
  name: string;
  /** Take-home pay at each salary in PAYCHECK_SALARIES: single filer, no 401(k) deferral, no local tax. */
  net: readonly number[];
  /** State income tax plus employee-paid state payroll programs at the middle salary. */
  stateTaxAt100k: number;
}>;

/** Take-home pay in every state and DC for a single filer, from the site's wage tax engine. */
export function paycheckStateRows(): PaycheckStateRow[] {
  return STATES.map(({ code, name }) => {
    const breakdowns = PAYCHECK_SALARIES.map((grossAnnual) => estimateNetBreakdown({ grossAnnual, state: code, filing: "single", k401Pct: 0 }));
    const mid = breakdowns[1];
    return { code, name, net: breakdowns.map((b) => b.net), stateTaxAt100k: mid.state + mid.statePayroll };
  });
}

// ─── Roth conversion ─────────────────────────────────────────────────────────

export const ROTH_BASE_INCOMES = [40_000, 80_000, 120_000] as const;
export const ROTH_CONVERSIONS = [10_000, 25_000, 50_000, 100_000] as const;

/** Federal income tax on a taxable income, from the 2026 brackets. */
export function federalTax(filing: FilingStatus, taxableIncome: number): number {
  let tax = 0;
  let floor = 0;
  for (const { upTo, rate } of getFederalBrackets(filing)) {
    if (taxableIncome <= floor) break;
    tax += (Math.min(taxableIncome, upTo) - floor) * rate;
    floor = upTo;
  }
  return tax;
}

export type RothRow = Readonly<{ baseIncome: number; conversion: number; tax: number; averageRatePct: number; topRatePct: number }>;

/** Extra federal tax caused by converting `conversion` on top of `baseIncome` of other taxable income (after the standard deduction). */
export function rothRows(filing: FilingStatus = "single"): RothRow[] {
  const brackets = getFederalBrackets(filing);
  const rateAt = (income: number) => (brackets.find((b) => income <= b.upTo) ?? brackets[brackets.length - 1]).rate;
  const rows: RothRow[] = [];
  for (const baseIncome of ROTH_BASE_INCOMES) {
    for (const conversion of ROTH_CONVERSIONS) {
      const tax = federalTax(filing, baseIncome + conversion) - federalTax(filing, baseIncome);
      rows.push({ baseIncome, conversion, tax, averageRatePct: (tax / conversion) * 100, topRatePct: rateAt(baseIncome + conversion) * 100 });
    }
  }
  return rows;
}

export function federalBracketRows(filing: FilingStatus): { from: number; upTo: number; rate: number }[] {
  let from = 0;
  return getFederalBrackets(filing).map(({ upTo, rate }) => {
    const row = { from, upTo, rate: rate * 100 };
    from = upTo;
    return row;
  });
}

export { getFederalStandardDeduction };

// ─── Withdrawals ─────────────────────────────────────────────────────────────

export const WITHDRAWAL_RATES = [3, 3.5, 4, 4.5, 5, 6, 7] as const;
export const REAL_RETURNS = [0, 2, 3, 4, 5] as const;
export const WITHDRAWAL_HORIZON_YEARS = 60;

/**
 * Whole years a balance lasts when the first withdrawal is `ratePct` of the starting balance and later withdrawals rise
 * with inflation, with the balance earning `realReturnPct` above inflation. Withdrawals are taken at the end of each year.
 * Returns null when the balance is never exhausted within WITHDRAWAL_HORIZON_YEARS.
 */
export function yearsMoneyLasts(ratePct: number, realReturnPct: number): number | null {
  const w = ratePct / 100;
  const r = realReturnPct / 100;
  let balance = 1;
  for (let year = 1; year <= WITHDRAWAL_HORIZON_YEARS; year++) {
    balance = balance * (1 + r) - w;
    // This year's withdrawal could not be paid in full, so the money covered the years before it.
    if (balance < -1e-9) return year - 1;
  }
  return null;
}
