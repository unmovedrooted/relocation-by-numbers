/**
 * Vietnam: personal income tax (PIT) on employment income for 2026, in dong, and the employee's social insurance.
 *
 * Personal Income Tax Law No. 109/2025/QH15 (enacted 10 December 2025) and Resolution 110/2025/UBTVQH15 on the deductions, from summaries by
 * KPMG, Viet An Law and others read 2026-10-14 (the official gazette text was not fetched): five brackets on monthly taxable income of 5% to
 * VND 10 million; 10% to 30 million; 20% to 60 million; 30% to 100 million; 35% above (one source lists 15% and 25% for the middle
 * brackets; the majority of sources give 10% and 20%); personal deduction VND 15.5 million a month (VND 186 million a year); dependant
 * deduction VND 6.2 million a month. They apply to the tax period starting 1 January 2026.
 * Employee social insurance 10.5% (social 8%, health 1.5%, unemployment 1%) on pay up to 20 times the base salary of VND 2.34 million a
 * month for social and health insurance (VND 46.8 million), deductible from taxable income; the unemployment cap (20 times the regional
 * minimum wage) is not modeled and the same cap is used.
 *
 * Non-residents are handled by the Asia calculator (flat 20% on Vietnam-source income). Retirees and remote workers paid abroad
 * pay no Vietnamese insurance here. Not modeled: dependants, charitable and pension-fund deductions, and the employer-paid
 * benefits that are tax-exempt.
 */
export const VIETNAM_TAX_YEAR_LABEL = "2026";
export const VIETNAM_PERSONAL_DEDUCTION = 186_000_000;

export function vietnamTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const g = Math.max(0, income);
  const contributions = scenario === "local" ? 0.105 * Math.min(g, 46_800_000 * 12) : 0;
  const taxable = Math.max(0, g - contributions - VIETNAM_PERSONAL_DEDUCTION);
  const incomeTax = 0.05 * Math.min(taxable, 120_000_000) + 0.10 * Math.max(0, Math.min(taxable, 360_000_000) - 120_000_000)
    + 0.20 * Math.max(0, Math.min(taxable, 720_000_000) - 360_000_000) + 0.30 * Math.max(0, Math.min(taxable, 1_200_000_000) - 720_000_000)
    + 0.35 * Math.max(0, taxable - 1_200_000_000);
  return { incomeTax, contributions };
}
