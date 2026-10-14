/**
 * Colombia: income tax on resident individuals' labor income for 2026, in Colombian pesos.
 *
 * Tax value unit (UVT) for 2026: COP 52,374, DIAN Resolution 000238 of 15 December 2025
 * https://normograma.dian.gov.co/dian/compilacion/docs/resolucion_dian_0238_2025.htm (read 2026-10-14).
 * Rate table of article 241 of the Estatuto Tributario (as amended by Law 2277 of 2022): 0% to 1,090 UVT, 19% to 1,700,
 * 28% to 4,100, 33% to 8,670, 35% to 18,970, 37% to 31,000 and 39% above.
 * Employee health (4%) and pension (4%) contributions are not taxed. The 25% exempt labor income (article 206) is capped at
 * 790 UVT a year, and deductions plus exempt income together at 40% of net income and 1,340 UVT, as amended by Law 2277.
 *
 * The statute text itself could not be reached when this was written (the Senate and Function Publica servers refused the
 * connection), so the table, the contribution rates and these caps are the long-standing law as already coded and as
 * summarised by DIAN, not re-read line by line. Only the UVT is newly verified.
 *
 * Not modeled: the extra 1% solidarity pension contribution above four minimum wages, dependants and other deductions,
 * the cedular treatment of capital and non-labor income, and the withholding schedule.
 */
export const COLOMBIA_TAX_YEAR_LABEL = "2026";
export const COLOMBIA_UVT = 52_374;

const BRACKETS_UVT = [
  { upTo: 1_090, rate: 0 }, { upTo: 1_700, rate: 0.19 }, { upTo: 4_100, rate: 0.28 }, { upTo: 8_670, rate: 0.33 },
  { upTo: 18_970, rate: 0.35 }, { upTo: 31_000, rate: 0.37 }, { upTo: Infinity, rate: 0.39 },
] as const;

export function colombiaTaxOnUvt(uvt: number): number {
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS_UVT) {
    if (uvt <= previous) break;
    tax += (Math.min(uvt, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax;
}

export function colombiaTax(annualIncome: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const gross = Math.max(0, annualIncome);
  // Employees pay 4% health and 4% pension; pensioners pay health only; remote work for a foreign employer pays neither.
  const contributions = scenario === "local" ? 0.08 * gross : scenario === "retired" ? 0.04 * gross : 0;
  const net = gross - contributions;
  const exempt = Math.min(0.25 * net, 790 * COLOMBIA_UVT);
  const capped = Math.min(exempt, 0.40 * net, 1_340 * COLOMBIA_UVT);
  const taxable = Math.max(0, net - capped);
  return { incomeTax: colombiaTaxOnUvt(taxable / COLOMBIA_UVT) * COLOMBIA_UVT, contributions };
}
