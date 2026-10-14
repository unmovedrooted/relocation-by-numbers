/**
 * Philippines: graduated income tax and employee social contributions for 2026, in pesos.
 *
 * Bureau of Internal Revenue graduated rates from the TRAIN law (RA 10963), unchanged from 2023 and for 2026 (checked in summaries; the
 * BIR pages were not fetched): 0% to PHP 250,000; 15% to 400,000; 20% to 800,000; 25% to 2,000,000; 30% to 8,000,000; 35% above.
 * Employee contributions (payroll summaries of the SSS, PhilHealth and Pag-IBIG tables, not the agencies' pages): SSS 5% of the monthly
 * salary credit up to PHP 35,000; PhilHealth 2.5% (half of 5%) of monthly pay between PHP 10,000 and 100,000; Pag-IBIG 2% of pay
 * up to PHP 10,000 (PHP 200 a month). Mandatory contributions are deductible from taxable income.
 *
 * Not modeled: the 13th-month pay and other benefits exempt up to PHP 90,000, the optional 8% tax for self-employed people, and
 * the SSS provident-fund split above PHP 20,000. Retirees and remote workers paid abroad pay no Philippine contributions here.
 */
export const PHILIPPINES_TAX_YEAR_LABEL = "2026";

export function philippinesContributions(income: number): number {
  const monthly = Math.max(0, income) / 12;
  if (monthly <= 0) return 0;
  const sss = 0.05 * Math.min(monthly, 35_000);
  const philHealth = 0.025 * Math.min(Math.max(monthly, 10_000), 100_000);
  const pagIbig = Math.min(0.02 * monthly, 200);
  return 12 * (sss + philHealth + pagIbig);
}

export function philippinesIncomeTax(taxable: number): number {
  const t = Math.max(0, taxable);
  return 0.15 * Math.max(0, Math.min(t, 400_000) - 250_000) + 0.20 * Math.max(0, Math.min(t, 800_000) - 400_000)
    + 0.25 * Math.max(0, Math.min(t, 2_000_000) - 800_000) + 0.30 * Math.max(0, Math.min(t, 8_000_000) - 2_000_000)
    + 0.35 * Math.max(0, t - 8_000_000);
}

export function philippinesTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const contributions = scenario === "local" ? philippinesContributions(income) : 0;
  return { incomeTax: philippinesIncomeTax(Math.max(0, income) - contributions), contributions };
}
