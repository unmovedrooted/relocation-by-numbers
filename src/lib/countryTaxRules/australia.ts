/**
 * Australia: resident individual income tax for 2026-27 (1 July 2026 to 30 June 2027).
 *
 * Rates: Australian Taxation Office, "Tax rates - Australian resident", last updated 13 August 2026
 * https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents (read 2026-10-13).
 * Low income tax offset: ATO, last updated 8 June 2026
 * https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset
 * Medicare levy: 2% of taxable income (ATO resident rate tables).
 *
 * The 2025-26 rate for the first bracket was 16%; it is 15% from 2026-27 (14% is legislated for 2027-28, not modeled here).
 * Not modeled: the Medicare levy's low-income reduction, the Medicare levy surcharge, HELP repayments, and employer
 * superannuation (paid by the employer on top of salary, so not deducted here).
 */
export const AUSTRALIA_TAX_YEAR_LABEL = "2026-27";
export const AUSTRALIA_MEDICARE_LEVY = 0.02;

const BRACKETS = [
  { upTo: 18_200, rate: 0 },
  { upTo: 45_000, rate: 0.15 },
  { upTo: 135_000, rate: 0.30 },
  { upTo: 190_000, rate: 0.37 },
  { upTo: Infinity, rate: 0.45 },
] as const;

/** Tax on resident taxable income before the Medicare levy and offsets, in Australian dollars. */
export function australiaBracketTax(income: number): number {
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS) {
    if (income <= previous) break;
    tax += (Math.min(income, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax;
}

/** Low income tax offset: $700 up to $37,500, less 5c per dollar to $45,000, then $325 less 1.5c per dollar to $66,667. */
export function australiaLito(income: number): number {
  if (income <= 37_500) return 700;
  if (income <= 45_000) return 700 - 0.05 * (income - 37_500);
  if (income <= 66_667) return Math.max(0, 325 - 0.015 * (income - 45_000));
  return 0;
}

/** Income tax after the low income tax offset, plus the Medicare levy. */
export function australiaTax(income: number): { incomeTax: number; medicareLevy: number } {
  const income0 = Math.max(0, income);
  const incomeTax = Math.max(0, australiaBracketTax(income0) - australiaLito(income0));
  return { incomeTax, medicareLevy: income0 * AUSTRALIA_MEDICARE_LEVY };
}
