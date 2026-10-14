/**
 * Malaysia: resident individual income tax and employee contributions for 2026, in ringgit.
 *
 * Inland Revenue Board (LHDN) resident individual rates for Years of Assessment 2023, 2024 and 2025, the latest the page shows
 * (https://www.hasil.gov.my/en/?p=8319, read 2026-10-14): 0% to MYR 5,000; 1% to 20,000; 3% to 35,000; 6% to 50,000; 11% to
 * 70,000; 19% to 100,000; 25% to 400,000; 26% to 600,000; 28% to 2 million; 30% above.
 * Reliefs from LHDN-based summaries (the LHDN relief page was not reachable): individual MYR 9,000; EPF contributions up to
 * MYR 4,000 (the shared MYR 7,000 cap with life insurance is not modeled); a MYR 400 rebate when chargeable income is MYR 35,000 or less.
 * Employee contributions (not re-read on EPF or PERKESO pages): EPF 11% of pay; SOCSO 0.5% and EIS 0.2% on pay up to MYR 6,000 a month.
 *
 * Territorial treatment: foreign-sourced income received by a resident individual is exempt (through 2036), and approved pensions are
 * exempt, so the remote and retired scenarios are shown as no Malaysian income tax or contributions. That depends on the source of
 * the income and the conditions of the exemption, so check it before relying on it.
 *
 * Not modeled: spouse, child and parent reliefs, lifestyle and medical reliefs, the SOCSO relief, the MYR 7,000 EPF and insurance cap,
 * and zakat.
 */
export const MALAYSIA_TAX_YEAR_LABEL = "2026";

const BRACKETS = [
  { upTo: 5_000, rate: 0 }, { upTo: 20_000, rate: 0.01 }, { upTo: 35_000, rate: 0.03 }, { upTo: 50_000, rate: 0.06 },
  { upTo: 70_000, rate: 0.11 }, { upTo: 100_000, rate: 0.19 }, { upTo: 400_000, rate: 0.25 }, { upTo: 600_000, rate: 0.26 },
  { upTo: 2_000_000, rate: 0.28 }, { upTo: Infinity, rate: 0.30 },
] as const;

export function malaysiaBracketTax(chargeable: number): number {
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS) {
    if (chargeable <= previous) break;
    tax += (Math.min(chargeable, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax;
}

export function malaysiaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  if (scenario !== "local") return { incomeTax: 0, contributions: 0 };
  const gross = Math.max(0, income);
  const epf = 0.11 * gross;
  const perkeso = 0.007 * Math.min(gross, 6_000 * 12);
  const chargeable = Math.max(0, gross - 9_000 - Math.min(epf, 4_000));
  const rebate = chargeable <= 35_000 ? 400 : 0;
  return { incomeTax: Math.max(0, malaysiaBracketTax(chargeable) - rebate), contributions: epf + perkeso };
}
