/**
 * Mexico: federal income tax (ISR) on salary and pension income for 2026, in pesos, and the employee's IMSS contributions.
 *
 * Servicio de Administracion Tributaria, Anexo 8 de la Resolucion Miscelanea Fiscal 2026 (DOF 28 December 2025),
 * https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo-8-RMF-2026_DOF-28122025.pdf, read 2026-10-14:
 * the annual tariff for 2026 under articles 97 and 152 of the ISR law, with limits updated 13.21% from 2025 (the first band ended at
 * MXN 8,952.49 in 2025 and ends at 10,135.11). Tax = fixed amount + rate x (income - lower limit).
 * IMSS employee share (from IMSS-based summaries, not the Ley del Seguro Social): sickness cash 0.25%, disability and life 0.625%,
 * old age 1.125% and pensioners' medical 0.375% of the contribution salary, plus 0.40% sickness in kind on the part above 3 UMA a day,
 * with the base capped at 25 UMA a day. UMA 2026 is MXN 117.31 a day (INEGI, from 1 February 2026). The contribution is not deductible.
 *
 * Mexican residents pay tax on world income. Pensions here are treated as fully taxable (the exemption of 15 UMA a day applies to
 * Mexican social-security pensions, not foreign ones). Remote workers paid by a foreign employer pay no IMSS.
 * Not modeled: the employment subsidy for low incomes, exempt benefits (the 30-day aguinaldo bonus, vacation premium), personal
 * deductions (medical, tuition, mortgage interest) and INFONAVIT.
 */
export const MEXICO_TAX_YEAR_LABEL = "2026";
const UMA_DAILY = 117.31;
const TARIFF = [
  { lower: 0.01, fixed: 0, rate: 0.0192 },
  { lower: 10_135.12, fixed: 194.59, rate: 0.064 },
  { lower: 86_022.12, fixed: 5_051.37, rate: 0.1088 },
  { lower: 151_176.20, fixed: 12_140.13, rate: 0.16 },
  { lower: 175_735.67, fixed: 16_069.64, rate: 0.1792 },
  { lower: 210_403.70, fixed: 22_282.14, rate: 0.2136 },
  { lower: 424_353.98, fixed: 67_981.92, rate: 0.2352 },
  { lower: 668_840.15, fixed: 125_485.07, rate: 0.30 },
  { lower: 1_276_925.99, fixed: 307_910.81, rate: 0.32 },
  { lower: 1_702_567.98, fixed: 444_116.23, rate: 0.34 },
  { lower: 5_107_703.93, fixed: 1_601_862.46, rate: 0.35 },
] as const;

export function mexicoIsr(income: number): number {
  if (income <= 0) return 0;
  let row: (typeof TARIFF)[number] = TARIFF[0];
  for (const r of TARIFF) if (income >= r.lower) row = r;
  return row.fixed + (income - row.lower) * row.rate;
}

export function mexicoImss(income: number): number {
  const cap = 25 * UMA_DAILY * 365;
  const base = Math.min(Math.max(0, income), cap);
  return 0.02375 * base + 0.004 * Math.max(0, base - 3 * UMA_DAILY * 365);
}

export function mexicoTax(income: number, scenario: "local" | "remote" | "retired"): { isr: number; imss: number } {
  return { isr: mexicoIsr(income), imss: scenario === "local" ? mexicoImss(income) : 0 };
}
