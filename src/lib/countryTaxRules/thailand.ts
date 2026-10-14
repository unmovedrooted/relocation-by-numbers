/**
 * Thailand: personal income tax (PIT) on employment income and the employee's social security contribution for 2026, in baht.
 *
 * Revenue Department scale, unchanged and confirmed in PwC and law-firm summaries (the Revenue Department pages were not fetched):
 * 0% on the first THB 150,000 of net income; 5% to 300,000; 10% to 500,000; 15% to 750,000; 20% to 1,000,000; 25% to 2,000,000; 30% to
 * 5,000,000; 35% above. Deductions: expense deduction of 50% of employment income up to THB 100,000 and a personal allowance of
 * THB 60,000. Social security: 5% of pay up to a wage ceiling of THB 17,500 a month from 1 January 2026, so at most THB 875 a month
 * (THB 10,500 a year), per the Ministerial Regulation of 12 December 2025 (DLA Piper, KPMG and HLB summaries); it is deductible.
 *
 * Remote workers paid abroad and retirees pay no Thai social security here. Whether foreign income remitted to Thailand is taxed
 * depends on residency and timing; the Asia calculator asks about it. Not modeled: spouse, child and parent allowances, life
 * insurance and fund deductions, and the retiree allowances (THB 190,000 for age 65 and over).
 */
export const THAILAND_TAX_YEAR_LABEL = "2026";

export function thailandTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const g = Math.max(0, income);
  const contributions = scenario === "local" ? Math.min(0.05 * Math.min(g / 12, 17_500), 875) * 12 : 0;
  const deductions = Math.min(g * 0.5, 100_000) + 60_000 + contributions;
  const taxable = Math.max(0, g - deductions);
  const incomeTax = 0.05 * Math.max(0, Math.min(taxable, 300_000) - 150_000) + 0.10 * Math.max(0, Math.min(taxable, 500_000) - 300_000)
    + 0.15 * Math.max(0, Math.min(taxable, 750_000) - 500_000) + 0.20 * Math.max(0, Math.min(taxable, 1_000_000) - 750_000)
    + 0.25 * Math.max(0, Math.min(taxable, 2_000_000) - 1_000_000) + 0.30 * Math.max(0, Math.min(taxable, 5_000_000) - 2_000_000)
    + 0.35 * Math.max(0, taxable - 5_000_000);
  return { incomeTax, contributions };
}
