/**
 * Poland: personal income tax (PIT) on the general scale, employee ZUS contributions and the health contribution, for 2026, in zloty.
 *
 * PIT scale (art. 27 of the PIT Act, unchanged since 2022 per tax summaries; the podatki.gov.pl page was not reachable): 12% up to
 * PLN 120,000 less the tax-reducing amount of PLN 3,600 (12% of the PLN 30,000 tax-free amount), then PLN 10,800 plus 32% above.
 * Employee ZUS: pension 9.76% and disability 1.5% on pay up to the annual cap of PLN 282,600 (Minister of Family, Labour and Social
 * Policy announcement of 19 November 2025, M.P. item 1206, read through podatki.biz), sickness 2.45% on all pay; together 13.71%,
 * deducted from the PIT base. Health contribution 9% of pay after ZUS, not deductible. Standard costs of obtaining income:
 * PLN 3,000 a year (secondary sources).
 *
 * A married couple is modeled as two equal earners using the joint-filing split. Pensions carry no ZUS but 9% health contribution
 * and no costs deduction; remote workers paid abroad are shown without ZUS or health contributions. Not modeled: the youth and
 * family reliefs, the child credit, the PIT-exempt amounts for seniors working, and special schemes for entrepreneurs.
 */
export const POLAND_TAX_YEAR_LABEL = "2026";
export const POLAND_ZUS_ANNUAL_CAP = 282_600;

function scaleTax(base: number): number {
  const b = Math.max(0, base);
  return b <= 120_000 ? Math.max(0, 0.12 * b - 3_600) : 10_800 + 0.32 * (b - 120_000);
}

export function polandTax(income: number, filing: "single" | "married", scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const gross = Math.max(0, income);
  const split = filing === "married" ? 2 : 1;
  const each = gross / split;
  let zus = 0;
  let health = 0;
  if (scenario === "local") {
    zus = (0.0976 + 0.015) * Math.min(each, POLAND_ZUS_ANNUAL_CAP) + 0.0245 * each;
    health = 0.09 * (each - zus);
  } else if (scenario === "retired") {
    health = 0.09 * each;
  }
  const costs = scenario === "retired" ? 0 : Math.min(3_000, each);
  const incomeTax = scaleTax(each - zus - costs);
  return { incomeTax: incomeTax * split, contributions: (zus + health) * split };
}
