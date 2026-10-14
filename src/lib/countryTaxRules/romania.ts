/**
 * Romania: income tax and employee contributions for 2026, in lei.
 *
 * Income tax 10% and the employee contributions CAS (pension) 25% and CASS (health) 10% of gross pay, from 2026 payroll summaries
 * (the ANAF and Fiscal Code pages were not read in this session). The tax is charged on pay after the contributions, so the
 * total on a salary is 35% + 10% x 65% = 41.5%, not the 45% the old model used. The minimum wage is RON 4,050 a month until 30 June
 * 2026 and RON 4,325 after (HG 146/2026, per summaries), with RON 200 a month of it exempt from tax from July; not modeled.
 * Pensions: the part of a pension above RON 3,000 a month pays 10% income tax and 10% CASS (summaries; the abolition of CASS on
 * pensions from 2027 was discussed but is not law as far as the sources show).
 *
 * Remote workers paid by a foreign employer are shown with the 10% income tax only; whether CASS applies depends on their income
 * ladder. Not modeled: the personal deduction, the dividend rate of 8%, and the self-employed (PFA) regime.
 */
export const ROMANIA_TAX_YEAR_LABEL = "2026";
const PENSION_EXEMPT_ANNUAL = 3_000 * 12;

export function romaniaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const g = Math.max(0, income);
  if (scenario === "local") {
    const contributions = 0.35 * g;
    return { incomeTax: 0.10 * (g - contributions), contributions };
  }
  if (scenario === "retired") {
    const excess = Math.max(0, g - PENSION_EXEMPT_ANNUAL);
    return { incomeTax: 0.10 * excess, contributions: 0.10 * excess };
  }
  return { incomeTax: 0.10 * g, contributions: 0 };
}
