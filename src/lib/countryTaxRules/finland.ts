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
 * Deductions for 2026, from the Taxpayers' Association's guidance on the deductions made from earned income (extracts of the vero.fi
 * guidance; the municipal earned income deduction was abolished for 2026 and replaced by a bigger work income tax credit):
 *   - basic deduction (perusvahennys): at most EUR 4,265, reduced by 18% of pure earned income above that, so it ends near EUR 27,959;
 *     it applies to both state and municipal tax;
 *   - work income tax credit (tyotulovahennys): 18% of wages (taken here as wages less EUR 2,500, an assumption for low pay), at most
 *     EUR 3,430, reduced by 2% of pure earned income above EUR 35,000 up to EUR 50,550; it is taken off the state tax first and any
 *     excess off the municipal tax. This produces the roughly EUR 29,200 of wages at which state tax starts, as the page says.
 * Not modeled: the pensioner income deduction (retirees therefore pay a little too much), the church tax (about 1% for members), the
 * public broadcasting tax, the credit's increase for children, and municipal differences. Retirees pay no employee contributions.
 */
export const FINLAND_TAX_YEAR_LABEL = "2026";
export const FINLAND_MUNICIPAL_AVERAGE = 0.075;

export function finlandStateTax(taxable: number): number {
  const t = Math.max(0, taxable);
  return 0.1264 * Math.min(t, 22_000) + 0.19 * Math.max(0, Math.min(t, 32_600) - 22_000) + 0.3025 * Math.max(0, Math.min(t, 40_100) - 32_600)
    + 0.3325 * Math.max(0, Math.min(t, 52_100) - 40_100) + 0.375 * Math.max(0, t - 52_100);
}

export function finlandBasicDeduction(pureEarned: number): number {
  return Math.max(0, 4_265 - 0.18 * Math.max(0, pureEarned - 4_265));
}

export function finlandWorkCredit(wages: number, pureEarned: number): number {
  const full = Math.min(3_430, 0.18 * Math.max(0, wages - 2_500));
  return Math.max(0, full - 0.02 * Math.min(Math.max(0, pureEarned - 35_000), 15_550));
}

export function finlandTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const g = Math.max(0, income);
  const employee = scenario === "local" ? (0.0715 + 0.006) * g : 0;
  const base = g - employee;
  const health = (scenario === "retired" ? 0.0149 : 0.011) * base + (scenario === "local" && g >= 17_255 ? 0.0088 * g : 0);
  const taxableBase = Math.max(0, base - finlandBasicDeduction(base));
  const credit = scenario === "retired" ? 0 : finlandWorkCredit(g, base);
  const incomeTax = Math.max(0, finlandStateTax(taxableBase) + FINLAND_MUNICIPAL_AVERAGE * taxableBase - credit);
  return { incomeTax, contributions: employee + health };
}
