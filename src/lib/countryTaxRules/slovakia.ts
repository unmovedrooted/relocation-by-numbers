/**
 * Slovakia: personal income tax and employee contributions for 2026, in euros.
 *
 * 2026 consolidation package (Act 261/2025, amending Act 595/2003): four rates on the annual tax base, from tax-adviser and
 * accounting-firm summaries (the Financial Administration pages were not reachable): 19% to EUR 43,983.32; 25% to 60,349.21;
 * 30% to 75,010.32; 35% above. Non-taxable part of the tax base: EUR 5,966.73 up to a base of EUR 26,083.13, then
 * EUR 14,661.11 minus one third of the base, reaching zero at EUR 43,983.33 (checked for continuity at both ends).
 * Employee social insurance 9.4% (old-age 4%, disability 3%, sickness 1.4%, unemployment 1%) on pay up to a monthly cap of
 * EUR 16,764, deductible from the tax base. Employee health insurance 5% from 2026 (4% before), with no ceiling, not deductible.
 *
 * Retirees are shown with income tax only and no contributions; Slovak state pensions are largely tax-exempt, which is not modeled.
 * Remote workers paid by a foreign employer pay no Slovak contributions here. Not modeled: spouse's allowance, child bonus,
 * the 15% rate for the self-employed, and pillar-II pension savings.
 */
export const SLOVAKIA_TAX_YEAR_LABEL = "2026";
const SOCIAL_CAP_ANNUAL = 16_764 * 12;

export function slovakiaNonTaxablePart(base: number): number {
  if (base <= 26_083.13) return 5_966.73;
  return Math.max(0, 14_661.11 - base / 3);
}

export function slovakiaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const g = Math.max(0, income);
  const social = scenario === "local" ? 0.094 * Math.min(g, SOCIAL_CAP_ANNUAL) : 0;
  const health = scenario === "local" ? 0.05 * g : 0;
  const base = g - social;
  const taxable = Math.max(0, base - slovakiaNonTaxablePart(base));
  const incomeTax = 0.19 * Math.min(taxable, 43_983.32) + 0.25 * Math.max(0, Math.min(taxable, 60_349.21) - 43_983.32)
    + 0.30 * Math.max(0, Math.min(taxable, 75_010.32) - 60_349.21) + 0.35 * Math.max(0, taxable - 75_010.32);
  return { incomeTax, contributions: social + health };
}
