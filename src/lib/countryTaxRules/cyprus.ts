/**
 * Cyprus: personal income tax, social insurance and the GESY health contribution for 2026, in euros.
 *
 * Tax reform in force from 1 January 2026 (Law 244(I)/2025, Official Gazette no. 5070 of 31 December 2025), as reported by adviser guides read
 * 2026-10-14 (the Tax Department pages were not fetched): 0% to EUR 22,000; 20% to 32,000; 25% to 42,000; 30% to 72,000; 35% above
 * (previously 0% to 19,500 and 35% above 60,000).
 * Employee social insurance 8.8% of pay up to maximum insurable earnings of about EUR 68,904 a year (the ceiling differs between
 * sources); GESY 2.65% of pay up to EUR 180,000 (one source says 200,000); both are deductible from taxable income. Retirees are
 * assumed to pay GESY at 1.7% as in the earlier file, which was not re-read; they pay no social insurance.
 *
 * Remote workers paid abroad pay income tax on the scale with no Cypriot contributions here. Not modeled: the 20% deduction for
 * employees in the first years of a Cyprus job, the 50% exemption for new residents, the 5% flat option on foreign pensions, the
 * non-dom regime, and the special defence contribution on passive income (now under Law 245(I)/2025).
 */
export const CYPRUS_TAX_YEAR_LABEL = "2026";

export function cyprusTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const g = Math.max(0, income);
  const social = scenario === "local" ? 0.088 * Math.min(g, 68_904) : 0;
  const ghs = scenario === "local" ? 0.0265 * Math.min(g, 180_000) : scenario === "retired" ? 0.017 * g : 0;
  const taxable = Math.max(0, g - social - ghs);
  const incomeTax = 0.20 * Math.max(0, Math.min(taxable, 32_000) - 22_000) + 0.25 * Math.max(0, Math.min(taxable, 42_000) - 32_000)
    + 0.30 * Math.max(0, Math.min(taxable, 72_000) - 42_000) + 0.35 * Math.max(0, taxable - 72_000);
  return { incomeTax, contributions: social + ghs };
}
