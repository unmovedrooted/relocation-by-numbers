/**
 * Costa Rica: salary income tax for fiscal period 2026 and the worker's social charges, in colones.
 *
 * Monthly brackets for employees, retirees and pensioners: Ministerio de Hacienda, "Tramos del impuesto sobre la renta para
 * el periodo fiscal 2026" https://www.hacienda.go.cr/docs/TramosRenta2026.pdf (read 2026-10-14): no tax up to CRC 918,000 a
 * month, 10% to 1,347,000, 15% to 2,364,000, 20% to 4,727,000 and 25% above. Monthly credit CRC 2,590 per spouse and CRC 1,710
 * per child.
 * Worker charges: CCSS health (SEM) 5.50% and pension (IVM) 4.33% from January 2026
 * (https://aissfa.ccss.sa.cr/noticias/noticia?v=822124515110) plus 1.00% to the Banco Popular (Ley de Proteccion al
 * Trabajador): 10.83% of pay. Some CCSS pages still show the 2025 pension rate of 4.17%.
 *
 * Costa Rica taxes income from services performed in the country, so remote income is taxed here with no CCSS; digital
 * nomad visa holders have a separate exemption that is not modeled. Pensioners are assumed to pay no CCSS on the pension.
 * Not modeled: children's credits, the minimum contribution bases, solidarista savings, and the aguinaldo (13th month).
 */
export const COSTA_RICA_TAX_YEAR_LABEL = "2026";
export const COSTA_RICA_WORKER_CHARGE_RATE = 0.055 + 0.0433 + 0.01;
export const COSTA_RICA_SPOUSE_CREDIT_MONTHLY = 2_590;

const MONTHLY_BRACKETS = [
  { upTo: 918_000, rate: 0 }, { upTo: 1_347_000, rate: 0.10 }, { upTo: 2_364_000, rate: 0.15 },
  { upTo: 4_727_000, rate: 0.20 }, { upTo: Infinity, rate: 0.25 },
] as const;

export function costaRicaMonthlyTax(monthly: number): number {
  let tax = 0;
  let previous = 0;
  for (const b of MONTHLY_BRACKETS) {
    if (monthly <= previous) break;
    tax += (Math.min(monthly, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax;
}

export function costaRicaTax(annualIncome: number, scenario: "local" | "remote" | "retired", married: boolean): { incomeTax: number; workerCharges: number } {
  const monthly = Math.max(0, annualIncome) / 12;
  const gross = costaRicaMonthlyTax(monthly);
  const credit = married && gross > 0 ? COSTA_RICA_SPOUSE_CREDIT_MONTHLY : 0;
  const charges = scenario === "local" ? COSTA_RICA_WORKER_CHARGE_RATE * monthly : 0;
  return { incomeTax: Math.max(0, gross - credit) * 12, workerCharges: charges * 12 };
}
