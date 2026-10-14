/**
 * Croatia: income tax on employment income for 2026, in euros, and the employee's pension contributions.
 *
 * Rates and threshold: Porezna uprava (Tax Administration), "Porezna osnovica i stope"
 * https://porezna-uprava.gov.hr/hr/porezna-osnovica-i-stope/4775 (read 2026-10-14): the lower rate applies up to EUR 60,000
 * a year (EUR 5,000 a month) and the higher rate above it. Each local unit sets its own rates within bands (municipality
 * 15-20% / 25-30%, city 15-21% / 25-31%, large city and county seat 15-22% / 25-32%, Zagreb 15-23% / 25-33%); where none is
 * set the default is 20% and 30%, which is what is used here. The old local surtax (prirez) no longer exists as such.
 * Personal allowance EUR 600 a month, and the 20% pension contribution (MIO) paid by employees: Tax Administration pages
 * "Osobni odbitak" and "Radnik". Income tax is calculated on gross pay less contributions and the allowance.
 *
 * Not modeled: the local rate of your municipality, higher allowances for dependants and disability, the health
 * contribution (paid by the employer), and the monthly cap on pension contributions.
 */
export const CROATIA_TAX_YEAR_LABEL = "2026";
export const CROATIA_PERSONAL_ALLOWANCE = 600 * 12;
export const CROATIA_PENSION_RATE = 0.20;
export const CROATIA_BRACKET = 60_000;

export function croatiaTax(income: number, retired: boolean): { incomeTax: number; contributions: number } {
  const gross = Math.max(0, income);
  const contributions = retired ? 0 : CROATIA_PENSION_RATE * gross;
  const base = Math.max(0, gross - contributions - CROATIA_PERSONAL_ALLOWANCE);
  const incomeTax = 0.20 * Math.min(base, CROATIA_BRACKET) + 0.30 * Math.max(0, base - CROATIA_BRACKET);
  return { incomeTax, contributions };
}
