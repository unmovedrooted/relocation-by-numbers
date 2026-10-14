/**
 * Peru: income tax on employment and pension income (fifth category) for 2026, in soles, and the employee's pension contribution.
 *
 * The tax unit (UIT) is S/ 5,500 for 2026 (Decreto Supremo 301-2025-EF, announced in El Peruano and by the Ministry of Economy and
 * Finance, read through search extracts 2026-10-14). Labour income is reduced by 7 UIT (S/ 38,500) and the remainder is taxed
 * at 8% up to 5 UIT, 14% up to 20 UIT, 17% up to 35 UIT, 20% up to 45 UIT and 30% above (article 53 of the income tax law, as
 * summarised by SUNAT guides; the SUNAT pages were not fetched).
 * Employee pension contribution: ONP 13% of pay, or about 13% to an AFP (10% to the fund plus commission and insurance), from
 * payroll summaries; it is not deductible.
 *
 * Not modeled: the extra 3 UIT deduction for spending on restaurants, medical care, rent and professional services, the
 * gratificaciones (two extra monthly salaries, which are part of annual pay), and pensioners' health contribution.
 */
export const PERU_TAX_YEAR_LABEL = "2026";
export const PERU_UIT = 5_500;

export function peruTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const g = Math.max(0, income);
  const net = Math.max(0, g - 7 * PERU_UIT) / PERU_UIT;
  const incomeUit = 0.08 * Math.min(net, 5) + 0.14 * Math.max(0, Math.min(net, 20) - 5) + 0.17 * Math.max(0, Math.min(net, 35) - 20)
    + 0.20 * Math.max(0, Math.min(net, 45) - 35) + 0.30 * Math.max(0, net - 45);
  return { incomeTax: incomeUit * PERU_UIT, contributions: scenario === "local" ? 0.13 * g : 0 };
}
