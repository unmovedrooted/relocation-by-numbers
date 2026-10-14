/**
 * Bulgaria: flat personal income tax and employee social contributions, in euros (the euro replaced the lev on 2026-01-01).
 *
 * Income tax: flat 10% of the taxable base, after the employee's social contributions.
 * Maximum monthly insurable income for employees in 2026: EUR 2,111.64 from January to July and EUR 2,300.00 from
 * August to December: National Social Security Institute (NOI), https://nssi.bg/dohod01082026/ and the 2026 State Social
 * Security Budget Law. Annual cap here: 7 x 2,111.64 + 5 x 2,300.
 * Employee contribution rates: NOI's table of insurance contributions, last row published for 2025
 * https://nssi.bg/wp-content/uploads/Trudov_dogovor_vnoski.pdf: employee share of the state pension-and-benefits
 * insurance 8.38% for people born after 1959 (10.58% for earlier births) plus health insurance 3.2%.
 * Those 2025 rates are assumed unchanged for 2026; the 2026 table was not found. Read 2026-10-13.
 *
 * Not modeled: the 2025 table's separate treatment of different labor categories, voluntary pension funds, and the
 * exemption of Bulgarian state pensions from income tax.
 */
export const BULGARIA_TAX_YEAR_LABEL = "2026";
export const BULGARIA_INCOME_TAX_RATE = 0.10;
export const BULGARIA_EMPLOYEE_SOCIAL_RATE = 0.0838 + 0.032;
export const BULGARIA_INSURABLE_INCOME_CAP = 7 * 2_111.64 + 5 * 2_300;

export function bulgariaTax(income: number, retired: boolean): { incomeTax: number; socialContributions: number } {
  const gross = Math.max(0, income);
  const socialContributions = retired ? 0 : BULGARIA_EMPLOYEE_SOCIAL_RATE * Math.min(gross, BULGARIA_INSURABLE_INCOME_CAP);
  return { incomeTax: BULGARIA_INCOME_TAX_RATE * Math.max(0, gross - socialContributions), socialContributions };
}
