/**
 * New Zealand: resident income tax and the ACC earners' levy for 2026-27, in NZ dollars.
 *
 * Inland Revenue (https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals,
 * page last updated 3 June 2025, read 2026-10-14): 10.5% to NZD 15,600; 17.5% to 53,500; 30% to 78,100; 33% to 180,000; 39% above
 * (the 2025-26 scale; the page shows no change for 2026-27). The old code kept the superseded NZD 14,000 first threshold.
 * ACC earners' levy for 1 April 2026 to 31 March 2027: 1.75% (GST inclusive) of earnings up to NZD 156,641, from payroll summaries
 * of the ACC regulations (ACC's own page quotes the GST-exclusive 1.52%).
 *
 * NZ Superannuation is taxed at the same rates and carries no earners' levy; a remote worker paid by a foreign employer pays
 * no NZ levy here. Not modeled: KiwiSaver contributions (optional, 3.5% minimum from 1 April 2026), the low-income and
 * working-for-families credits, and student-loan repayments.
 */
export const NEW_ZEALAND_TAX_YEAR_LABEL = "2026-27";
const BRACKETS = [
  { upTo: 15_600, rate: 0.105 }, { upTo: 53_500, rate: 0.175 }, { upTo: 78_100, rate: 0.30 },
  { upTo: 180_000, rate: 0.33 }, { upTo: Infinity, rate: 0.39 },
] as const;

export function newZealandTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; acc: number } {
  const gross = Math.max(0, income);
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS) {
    if (gross <= previous) break;
    tax += (Math.min(gross, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return { incomeTax: tax, acc: scenario === "local" ? 0.0175 * Math.min(gross, 156_641) : 0 };
}
