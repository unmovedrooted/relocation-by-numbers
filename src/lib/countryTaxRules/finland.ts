/**
 * Finland: state and municipal income tax, health insurance contributions and employee contributions for 2026, in euros.
 *
 * State scale for 2026 as given by the Finnish Taxpayers' Association (Veronmaksajat), read 2026-10-14 (the vero.fi tables could not be
 * fetched): 12.64% from the first euro; 19.00% from EUR 22,000 (tax at that limit EUR 2,780.80); 30.25% from 32,600; 33.25% from 40,100; 37.50% from
 * 52,100. The page notes that state tax starts at roughly EUR 29,200 of wages after the employee deductions.
 * Health insurance contributions for 2026 (Government decree 1026/2025, from search extracts of the Government and Veronmaksajat
 * pages): medical care contribution 1.10% of taxable earned income (1.49% on pension and benefit income) and daily allowance contribution 0.88% of
 * wages, not charged when wages and business income are below EUR 17,255.
 * Municipal tax: an average of about 7.5% since the 2024 social and health services reform (rates run from about 4.4% to 10.9%;
 * the average comes from a calculator site, not an official table). The old model used 21.5%, the pre-reform level.
 * Employee pension contribution 7.15% and unemployment insurance about 0.6% (from summaries, not re-read), deducted from taxable income.
 *
 * NOT modeled, so tax on wages is overstated by about 2 to 4 percentage points at middle incomes: the earned income deduction
 * (ansiotulovahennys), the basic deduction (perusvahennys), the work income tax credit (tyotulovahennys) and the pensioner income
 * credit; plus the church tax (about 1% for members) and the public broadcasting tax. Retirees pay no employee contributions.
 */
export const FINLAND_TAX_YEAR_LABEL = "2026";
export const FINLAND_MUNICIPAL_AVERAGE = 0.075;

export function finlandStateTax(taxable: number): number {
  const t = Math.max(0, taxable);
  return 0.1264 * Math.min(t, 22_000) + 0.19 * Math.max(0, Math.min(t, 32_600) - 22_000) + 0.3025 * Math.max(0, Math.min(t, 40_100) - 32_600)
    + 0.3325 * Math.max(0, Math.min(t, 52_100) - 40_100) + 0.375 * Math.max(0, t - 52_100);
}

export function finlandTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const g = Math.max(0, income);
  const employee = scenario === "local" ? (0.0715 + 0.006) * g : 0;
  const base = g - employee;
  const health = (scenario === "retired" ? 0.0149 : 0.011) * base + (scenario === "local" && g >= 17_255 ? 0.0088 * g : 0);
  return { incomeTax: finlandStateTax(base) + FINLAND_MUNICIPAL_AVERAGE * base, contributions: employee + health };
}
