/**
 * Chile: Impuesto Unico de Segunda Categoria (wage income tax) for 2026 and the employee's mandatory pension and health
 * contributions, in Chilean pesos.
 *
 * Table: Servicio de Impuestos Internos, "Monto de Calculo del Impuesto Unico de Segunda Categoria" 2026
 * https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm: exempt to 13.5 UTM a month, then 4% to 30,
 * 8% to 50, 13.5% to 70, 23% to 90, 30.4% to 120, 35% to 310 and 40% above (the old 150-UTM break and 35.5% rate are gone).
 * The monthly tax unit (UTM) used is October 2026, CLP 72,151: https://www.sii.cl/valores_y_fechas/utm/utm2026.htm
 * Contribution ceiling: Superintendencia de Pensiones, 90.0 UF a month from February 2026
 * https://www.spensiones.cl/portal/institucional/594/w3-article-16921.html, with the UF at CLP 41,157.43 on 2026-10-14
 * (https://www.sii.cl/valores_y_fechas/uf/uf2026.htm). Pension 10% and health 7% of pay up to the ceiling are deductible.
 * Read 2026-10-14.
 *
 * Not modeled: the pension fund's commission, unemployment insurance, voluntary pension savings, and the annual global
 * complementary tax return. The UTM and UF move every month, so peso figures drift a little through the year.
 */
export const CHILE_TAX_YEAR_LABEL = "2026";
export const CHILE_UTM = 72_151;
export const CHILE_CONTRIBUTION_CEILING = 90 * 41_157.43;

const UTM_BRACKETS = [
  { upTo: 13.5, rate: 0 }, { upTo: 30, rate: 0.04 }, { upTo: 50, rate: 0.08 }, { upTo: 70, rate: 0.135 },
  { upTo: 90, rate: 0.23 }, { upTo: 120, rate: 0.304 }, { upTo: 310, rate: 0.35 }, { upTo: Infinity, rate: 0.40 },
] as const;

/** Monthly tax in pesos on a monthly taxable base in pesos. */
export function chileMonthlyTax(base: number): number {
  const utm = Math.max(0, base) / CHILE_UTM;
  let tax = 0;
  let previous = 0;
  for (const b of UTM_BRACKETS) {
    if (utm <= previous) break;
    tax += (Math.min(utm, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax * CHILE_UTM;
}

/** Annual tax and contributions, from annual income paid evenly over 12 months. */
export function chileTax(annualIncome: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const monthly = Math.max(0, annualIncome) / 12;
  const covered = Math.min(monthly, CHILE_CONTRIBUTION_CEILING);
  // Employees pay 10% pension and 7% health; pensioners pay the 7% health contribution; remote work for a foreign employer pays neither.
  const contributions = scenario === "local" ? 0.17 * covered : scenario === "retired" ? 0.07 * covered : 0;
  return { incomeTax: chileMonthlyTax(monthly - contributions) * 12, contributions: contributions * 12 };
}
