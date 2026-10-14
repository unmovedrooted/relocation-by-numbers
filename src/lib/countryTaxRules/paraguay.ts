/**
 * Paraguay: personal income tax (IRP) on salaried income and the employee's IPS contribution, in guaranies.
 *
 * DNIT (Direccion Nacional de Ingresos Tributarios) brochure on IRP for personal services, dated 2024, read through a search extract
 * 2026-10-14 (the PDF text could not be extracted): 8% on net income up to PYG 50 million, 9% up to PYG 150 million, 10% above
 * (Law 6380/2019, article 69). Personal-services income is outside the tax while gross annual Paraguayan-source income is PYG 80
 * million or less. How the threshold works when it is exceeded (all income or only the excess) was not settled by the sources;
 * this model taxes net income on the full scale once the threshold is passed, which is the conservative reading.
 * Employee IPS social security: 9% of salary (employer share 16.5%), from payroll guides; deducted from net income here.
 *
 * Paraguay taxes only Paraguay-source income, so remote workers paid from abroad and retirees on foreign pensions are shown as
 * paying nothing. Not modeled: the deductible expenses the DNIT allows, the aguinaldo exemption and the IVA on services.
 * The old code compared guarani income with a USD 12,000 threshold, which made almost every salary look taxable.
 */
export const PARAGUAY_TAX_YEAR_LABEL = "2026";
export const PARAGUAY_IRP_THRESHOLD = 80_000_000;

export function paraguayTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  if (scenario !== "local") return { incomeTax: 0, contributions: 0 };
  const g = Math.max(0, income);
  const contributions = 0.09 * g;
  if (g <= PARAGUAY_IRP_THRESHOLD) return { incomeTax: 0, contributions };
  const net = g - contributions;
  const incomeTax = 0.08 * Math.min(net, 50_000_000) + 0.09 * Math.max(0, Math.min(net, 150_000_000) - 50_000_000) + 0.10 * Math.max(0, net - 150_000_000);
  return { incomeTax, contributions };
}
