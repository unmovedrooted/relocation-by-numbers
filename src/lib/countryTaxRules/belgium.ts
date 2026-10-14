/**
 * Belgium: personal income tax for income year 2026 (assessment year 2027).
 *
 * Brackets (25% to 16,720; 40% to 29,510; 45% to 51,070; 50% above) and the basic tax-free allowance of EUR 11,180:
 * FPS Finance, "Tax rates" https://fin.belgium.be/en/private-individuals/tax-return/income/tax-rates
 * Employee flat-rate professional expenses: 30% of gross pay less social contributions, at most EUR 6,070 for income year 2026
 * (FPS Finance, "Beroepsinkomen" pages). Read 2026-10-13 (the finance.belgium.be page itself was behind a verification
 * challenge, so the mirror fin.belgium.be and the search summaries of the same pages were used).
 *
 * The tax-free allowance works as a tax reduction: the first EUR 11,180 is taxed at 25% and that tax is not charged.
 * Communal surcharge: an average of 7% of the national tax (it is set by each municipality, 0% to 9%): a planning assumption.
 * Employee social security contribution: 13.07% of gross pay.
 *
 * Not modeled: the marital quotient and extra allowances for dependants, pension-specific reductions, regional tax
 * credits, and the ceiling on social contributions. Married and cohabiting filers are treated as single earners.
 */
export const BELGIUM_TAX_YEAR_LABEL = "income year 2026";

const BRACKETS = [
  { upTo: 16_720, rate: 0.25 },
  { upTo: 29_510, rate: 0.40 },
  { upTo: 51_070, rate: 0.45 },
  { upTo: Infinity, rate: 0.50 },
] as const;

export const BELGIUM_BASIC_ALLOWANCE = 11_180;
export const BELGIUM_EXPENSE_FORFAIT_CAP = 6_070;
export const BELGIUM_EMPLOYEE_SOCIAL_RATE = 0.1307;
export const BELGIUM_AVERAGE_COMMUNAL_SURCHARGE = 0.07;

export function belgiumBracketTax(taxable: number): number {
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS) {
    if (taxable <= previous) break;
    tax += (Math.min(taxable, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax;
}

export function belgiumTax(income: number, retired: boolean): { nationalTax: number; communalSurcharge: number; socialSecurity: number } {
  const gross = Math.max(0, income);
  const socialSecurity = retired ? 0 : gross * BELGIUM_EMPLOYEE_SOCIAL_RATE;
  const net = gross - socialSecurity;
  const expenses = retired ? 0 : Math.min(0.30 * net, BELGIUM_EXPENSE_FORFAIT_CAP);
  const taxable = Math.max(0, net - expenses);
  const reduction = BELGIUM_BASIC_ALLOWANCE * BRACKETS[0].rate;
  const nationalTax = Math.max(0, belgiumBracketTax(taxable) - reduction);
  return { nationalTax, communalSurcharge: nationalTax * BELGIUM_AVERAGE_COMMUNAL_SURCHARGE, socialSecurity };
}
