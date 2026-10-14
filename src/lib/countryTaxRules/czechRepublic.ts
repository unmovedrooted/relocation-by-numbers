/**
 * Czech Republic: personal income tax on employment income for 2026, in Czech koruna, plus employee insurance.
 *
 * Income tax: Financni sprava (Financial Administration), 15% on the base up to 36 times the average wage (CZK 1,762,812 for
 * 2026) and 23% above; basic taxpayer credit CZK 30,840 a year, not reduced:
 * https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/zamestnanci-zamestnavatele/obecne-informace and the 2026 tax
 * news https://financnisprava.gov.cz/cs/financni-sprava/media-a-verejnost/tiskove-zpravy-gfr/tiskove-zpravy-2026/danove-novinky-pro-rok-2026
 * (read 2026-10-14). The tax base is gross pay: the old "super-gross" wage was abolished in 2021.
 * Employee social insurance 7.1% (pension 6.5%, sickness 0.6%) up to 48 times the average wage, and health insurance 4.5%
 * with no cap, are the statutory rates; they were not re-read on cssz.cz in this session. The 2026 cap used is 48 x
 * CZK 48,967 = CZK 2,350,416, derived from the official average wage, not read from a published table.
 *
 * Not modeled: credits for children, spouse and students, mortgage-interest and pension-savings deductions, and the
 * solidarity surcharge (abolished from 2021).
 */
export const CZECH_TAX_YEAR_LABEL = "2026";
export const CZECH_AVERAGE_WAGE = 48_967;
export const CZECH_HIGHER_RATE_THRESHOLD = 36 * CZECH_AVERAGE_WAGE; // 1,762,812
export const CZECH_SOCIAL_CAP = 48 * CZECH_AVERAGE_WAGE; // 2,350,416
export const CZECH_BASIC_CREDIT = 30_840;

export function czechTax(income: number, retired: boolean): { incomeTax: number; insurance: number } {
  const gross = Math.max(0, income);
  const before = 0.15 * Math.min(gross, CZECH_HIGHER_RATE_THRESHOLD) + 0.23 * Math.max(0, gross - CZECH_HIGHER_RATE_THRESHOLD);
  const incomeTax = Math.max(0, before - CZECH_BASIC_CREDIT);
  const insurance = retired ? 0 : 0.071 * Math.min(gross, CZECH_SOCIAL_CAP) + 0.045 * gross;
  return { incomeTax, insurance };
}
