/**
 * Panama: income tax on Panama-source income and the employee's social contributions, in U.S. dollars (balboas).
 *
 * Direccion General de Ingresos (DGI), "Personas Naturales" tariff (https://dgi.mef.gob.pa/DInforme/Tarifa, read through a search
 * extract 2026-10-14; the page shows no update date): 0% up to B/. 11,000; 15% on the excess from 11,000 to 50,000 (B/. 5,850 at
 * 50,000); 25% above. Panama taxes only income earned in Panama; foreign-source income is exempt.
 * Employee contributions: social security (CSS) 9.75% and educational insurance 1.25% of gross pay (11%), from payroll guides.
 *
 * Remote workers paid from abroad and retirees living on foreign pensions are shown as paying nothing in Panama. Not modeled: the
 * deductions the DGI lists (medical, school, mortgage interest, retirement fund), the thirteenth-month payments, and the
 * Pensionado programme benefits.
 */
export const PANAMA_TAX_YEAR_LABEL = "2026";

export function panamaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  if (scenario !== "local") return { incomeTax: 0, contributions: 0 };
  const g = Math.max(0, income);
  return {
    incomeTax: 0.15 * Math.max(0, Math.min(g, 50_000) - 11_000) + 0.25 * Math.max(0, g - 50_000),
    contributions: 0.11 * g,
  };
}
