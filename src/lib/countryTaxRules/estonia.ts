/**
 * Estonia: income tax for 2026 and the employee's contributions, in euros.
 *
 * Maksu- ja Tolliamet (EMTA), read 2026-10-14: income tax 22%; the basic exemption is EUR 700 a month (EUR 8,400 a year) from
 * 2026 and no longer shrinks as income rises (EUR 776 a month, EUR 9,312 a year, from pensionable age)
 * https://www.emta.ee/uudised/maksumuudatused-2026 and https://www.emta.ee/en/private-client/taxes-and-payment/tax-incentives/calculation-basic-exemption
 * Employee unemployment insurance 1.6% for 2025-2028 (Riigi Teataja, https://www.riigiteataja.ee/akt/124092024004); funded pension
 * contribution 2% of wages by default (members may choose 4% or 6%). Both are deducted before income tax. EMTA states there is
 * no 2% security tax on wages or pensions.
 *
 * Not modeled: choosing a higher pension contribution, the basic-exemption application rules (only one payer may apply it),
 * and the increased exemption for people with a disability.
 */
export const ESTONIA_TAX_YEAR_LABEL = "2026";
export const ESTONIA_INCOME_TAX_RATE = 0.22;
export const ESTONIA_BASIC_EXEMPTION = 8_400;
export const ESTONIA_BASIC_EXEMPTION_PENSIONABLE_AGE = 9_312;
export const ESTONIA_EMPLOYEE_CONTRIBUTION_RATE = 0.016 + 0.02;

export function estoniaTax(income: number, retired: boolean): { incomeTax: number; contributions: number } {
  const gross = Math.max(0, income);
  const contributions = retired ? 0 : ESTONIA_EMPLOYEE_CONTRIBUTION_RATE * gross;
  const exemption = retired ? ESTONIA_BASIC_EXEMPTION_PENSIONABLE_AGE : ESTONIA_BASIC_EXEMPTION;
  return { incomeTax: ESTONIA_INCOME_TAX_RATE * Math.max(0, gross - contributions - exemption), contributions };
}
