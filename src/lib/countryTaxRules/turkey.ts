/**
 * Turkey: income tax on wages, stamp tax and employee social security for 2026, in lira.
 *
 * Wage-income tax scale for 2026 (Revenue Administration revaluation of 25.49%, from Forbes Turkiye, Bloomberg HT and tax-adviser
 * summaries read 2026-10-14; the Revenue Administration communique itself was not fetched): 15% to TRY 190,000; 20% to 400,000; 27% to
 * 1,500,000 (for wages; 1,000,000 for other income); 35% to 5,300,000; 40% above.
 * Employee social security (SGK) 14% plus unemployment insurance 1% of gross pay, deductible from the income tax base, on pay up to
 * a monthly ceiling of 9 times the gross minimum wage (TRY 33,030 in 2026, so TRY 297,270; from SGK summaries, not re-read).
 * Stamp tax 0.759% of gross pay. The minimum-wage exemption removes the income tax and stamp tax that fall on the minimum wage:
 * the tax on a base of 12 x TRY 28,075.50 and the stamp tax on 12 x TRY 33,030 (net and gross minimum wage, per summaries).
 *
 * Remote workers paid abroad are taxed on the scale without the exemption or SGK. State pensions and foreign pensions brought
 * into Turkey are generally exempt from income tax, so retirees are shown as paying nothing; that depends on the pension and on
 * transferring it, so check before relying on it. Not modeled: municipal and health fees, the child allowance and the
 * housing-loan deductions.
 */
export const TURKEY_TAX_YEAR_LABEL = "2026";
const MIN_GROSS = 33_030;
const MIN_NET = 28_075.5;

export function turkeyScaleTax(base: number): number {
  const b = Math.max(0, base);
  return 0.15 * Math.min(b, 190_000) + 0.20 * Math.max(0, Math.min(b, 400_000) - 190_000) + 0.27 * Math.max(0, Math.min(b, 1_500_000) - 400_000)
    + 0.35 * Math.max(0, Math.min(b, 5_300_000) - 1_500_000) + 0.40 * Math.max(0, b - 5_300_000);
}

export function turkeyTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; stampTax: number; contributions: number } {
  const g = Math.max(0, income);
  if (scenario === "retired") return { incomeTax: 0, stampTax: 0, contributions: 0 };
  if (scenario === "remote") return { incomeTax: turkeyScaleTax(g), stampTax: 0, contributions: 0 };
  const contributions = 0.15 * Math.min(g, 9 * MIN_GROSS * 12);
  const incomeTax = Math.max(0, turkeyScaleTax(g - contributions) - turkeyScaleTax(MIN_NET * 12));
  const stampTax = Math.max(0, 0.00759 * (g - MIN_GROSS * 12));
  return { incomeTax, stampTax, contributions };
}
