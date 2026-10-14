/**
 * Denmark: personal income tax for 2026, in kroner.
 *
 * skat.dk (Skattestyrelsen), read 2026-10-14:
 *  - Bottom-bracket tax 12.01% of income above the personal allowance (DKK 54,100 in 2026, DKK 51,600 in 2025);
 *    middle-bracket tax 7.5% of personal income above DKK 641,200; top-bracket tax 7.5% above DKK 777,900; additional top-bracket
 *    tax 5% above DKK 2,592,700, all measured after the labour market contribution.
 *    https://skat.dk/en-us/help/botton-bracket-middle-bracket-top-bracket-and-additional-top-bracket-tax
 *  - Employment allowance 12.75% of income up to DKK 63,471; job allowance 4.5% of income above DKK 235,200, up to DKK 3,100.
 *    https://skat.dk/en-us/individuals/deductions-and-allowances/deductions-and-allowances-when-working/employment-and-job-allowances
 * Skatteministeriet: average municipal tax 25.049% for 2026 (church tax for members averages 0.867%, not included):
 *    https://skm.dk/tal-og-metode/satser/statistik-i-kommunerne/kommuneskatter-gennemsnitsprocenter-2007-2026
 * Labour market contribution (AM-bidrag): 8% of earned income, not charged on pensions.
 *
 * The personal allowance figure of DKK 54,100 comes from skat.dk text found through search; the AM rate is the long-standing
 * statutory 8%. Not modeled: church tax, the transport deduction, the senior employment allowance, and each municipality's
 * own rate (23.39% to 26.30%). A married filer is given both personal allowances (one earner uses the spouse's).
 */
export const DENMARK_TAX_YEAR_LABEL = "2026";
export const DENMARK_PERSONAL_ALLOWANCE = 54_100;
export const DENMARK_AVERAGE_MUNICIPAL_RATE = 0.25049;

export function denmarkTax(income: number, opts: { retired: boolean; married: boolean }): { total: number } {
  const gross = Math.max(0, income);
  const am = opts.retired ? 0 : 0.08 * gross;
  const personal = gross - am; // personal income, after the labour market contribution
  const allowance = DENMARK_PERSONAL_ALLOWANCE * (opts.married ? 2 : 1);
  const employment = opts.retired ? 0 : Math.min(0.1275 * personal, 63_471);
  const job = opts.retired ? 0 : Math.min(Math.max(0, 0.045 * (personal - 235_200)), 3_100);
  const taxable = Math.max(0, personal - employment - job);

  const bottom = 0.1201 * Math.max(0, personal - allowance);
  const municipal = DENMARK_AVERAGE_MUNICIPAL_RATE * Math.max(0, taxable - allowance);
  const middle = 0.075 * Math.max(0, personal - 641_200);
  const top = 0.075 * Math.max(0, personal - 777_900);
  const additional = 0.05 * Math.max(0, personal - 2_592_700);
  return { total: am + bottom + municipal + middle + top + additional };
}
