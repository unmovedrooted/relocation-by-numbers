/**
 * Malta: personal income tax and employee social security (Class 1) for 2026, in euros.
 *
 * Rate tables as published by PwC Tax Summaries for basis year 2026 (https://taxsummaries.pwc.com/malta/individual/taxes-on-personal-income,
 * read 2026-10-14; the Malta Tax and Customs Administration pages returned 403 to the fetch tool, and PwC's married table has an
 * overlapping first band that the deduct amounts resolve): single computation 0% to EUR 12,000, 15% to 16,000 (deduct 1,800),
 * 25% to 60,000 (deduct 3,400), 35% above (deduct 9,400); married computation 0% to EUR 15,000, 15% to 23,000 (deduct 2,250),
 * 25% to 60,000 (deduct 4,550), 35% above (deduct 10,550). The deduct amounts and band edges agree with each other.
 * Employee Class 1 social security: 10% of the basic weekly wage up to EUR 55.93 a week for people born in 1962 or later, from
 * secondary summaries of the MTCA 2026 table; the flat EUR 22.94 a week at low pay is not modeled.
 *
 * A married couple is modeled as one earner on the married computation. Retirees and remote workers pay no Class 1 contribution
 * here (a remote worker may owe contributions in the home country). Not modeled: the new parent and family computations, the
 * non-domiciled remittance rules, and the 15% rate for some residence programmes.
 */
export const MALTA_TAX_YEAR_LABEL = "2026";
const MAX_WEEKLY_CONTRIBUTION = 55.93;

export function maltaIncomeTax(income: number, filing: "single" | "married"): number {
  const x = Math.max(0, income);
  const [t1, t2, d15, d25, d35] = filing === "married" ? [15_000, 23_000, 2_250, 4_550, 10_550] : [12_000, 16_000, 1_800, 3_400, 9_400];
  if (x <= t1) return 0;
  if (x <= t2) return 0.15 * x - d15;
  if (x <= 60_000) return 0.25 * x - d25;
  return 0.35 * x - d35;
}

export function maltaTax(income: number, filing: "single" | "married", scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const gross = Math.max(0, income);
  const contributions = scenario === "local" ? Math.min(0.10 * gross, MAX_WEEKLY_CONTRIBUTION * 52) : 0;
  return { incomeTax: maltaIncomeTax(gross, filing), contributions };
}
