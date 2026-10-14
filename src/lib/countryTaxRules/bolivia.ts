/**
 * Bolivia: RC-IVA (the complementary VAT regime that works as the income tax on salaries) and the employee's pension contribution for 2026, in bolivianos.
 *
 * From adviser and payroll summaries read 2026-10-14 (the Servicio de Impuestos Nacionales pages were not reachable and sources
 * disagreed, so this stays a planning estimate): national minimum wage BOB 3,300 a month from 1 January 2026 (DS 5516, published
 * 13 January 2026); RC-IVA of 13% on salary after the employee's AFP contribution of 12.71%, less a non-taxable amount of two
 * minimum wages, charged only when the net monthly salary is above four minimum wages (BOB 13,200). The 13% credit for
 * invoices presented to the employer is not modeled, and it can cancel the tax entirely.
 *
 * Bolivia taxes only Bolivian-source income, so remote workers paid abroad and retirees on foreign pensions are shown as paying
 * nothing; whether Bolivian pensions are exempt was not confirmed. Not modeled: the invoice credit, self-employment (IT and IUE) and
 * the thirteenth-month bonus.
 */
export const BOLIVIA_TAX_YEAR_LABEL = "2026";
const MINIMUM_WAGE = 3_300;

export function boliviaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  if (scenario !== "local") return { incomeTax: 0, contributions: 0 };
  const monthly = Math.max(0, income) / 12;
  const afp = 0.1271 * monthly;
  const net = monthly - afp;
  const tax = net > 4 * MINIMUM_WAGE ? 0.13 * Math.max(0, net - 2 * MINIMUM_WAGE) : 0;
  return { incomeTax: 12 * tax, contributions: 12 * afp };
}
