/**
 * Lithuania: personal income tax (GPM) and employee social contributions for 2026, in euros.
 *
 * Rates and thresholds quoted from the State Tax Inspectorate (VMI) summary "Mokesčių įstatymo pakeitimai nuo 2026-01-01"
 * (https://www.vmi.lt/evmi/documents/20142/391071/Mokesčių+įstatymo+pakeitimai+nuo+2026-01-01.pdf, which returned 403 to the fetch
 * tool; read through search extracts, 2026-10-14): 20% on annual income up to 36 times the average wage (VDU, EUR 2,312.15 a
 * month in 2026): EUR 83,237.40; 25% from there to 60 VDU: EUR 138,729; 32% above.
 * Non-taxable income (NPD) in 2026: monthly 747 - 0.49 x (gross - 1,153), so EUR 8,964 a year at pay up to EUR 13,836 and nothing
 * from about EUR 32,130 (secondary summaries of the law; the VMI NPD table also returned 403).
 * Employee social contributions: 19.5% in total (VSD 12.52% and health PSD 6.98%; employee rate not re-read on Sodra's pages, which
 * say 2026 rates are unchanged from 2025), on pay up to 43 VDU = EUR 99,422.45 a year (Sodra's 2026 sheet).
 * Employee contributions are not deductible from the income tax base.
 *
 * Retirees pay income tax with the same NPD (the pensioner NPD rules were not found) and no contributions; remote workers paid by a
 * foreign employer pay no Lithuanian contributions. Not modeled: additional NPD for dependants, disability and the 15% rate on some
 * income, voluntary pension deductions.
 */
export const LITHUANIA_TAX_YEAR_LABEL = "2026";
export const LITHUANIA_EMPLOYEE_CONTRIBUTION_RATE = 0.195;
const BAND_20 = 36 * 2_312.15; // 83,237.40
const BAND_25 = 60 * 2_312.15; // 138,729
const CONTRIBUTION_CEILING = 43 * 2_312.15; // 99,422.45

export function lithuaniaNpd(gross: number): number {
  return Math.max(0, Math.min(8_964, 8_964 - 0.49 * (gross - 13_836)));
}

export function lithuaniaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const gross = Math.max(0, income);
  const contributions = scenario === "local" ? LITHUANIA_EMPLOYEE_CONTRIBUTION_RATE * Math.min(gross, CONTRIBUTION_CEILING) : 0;
  const taxable = Math.max(0, gross - lithuaniaNpd(gross));
  const incomeTax = 0.20 * Math.min(taxable, BAND_20) + 0.25 * Math.max(0, Math.min(taxable, BAND_25) - BAND_20) + 0.32 * Math.max(0, taxable - BAND_25);
  return { incomeTax, contributions };
}
