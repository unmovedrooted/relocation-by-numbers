/**
 * Latvia: personal income tax and employee social contributions for 2026, in euros.
 *
 * State Revenue Service (VID), read 2026-10-14:
 *   - rates (https://www.vid.gov.lv/lv/iedzivotaju-ienakuma-nodokla-likmes, updated 31.12.2025): 25.5% on annual income up to
 *     EUR 105,300 and 33% above; an additional 3% on taxable income above EUR 200,000; the salary tax on monthly pay and pensions is 25.5%;
 *   - employee social contribution (https://www.vid.gov.lv/lv/valsts-socialas-apdrosinasanas-obligato-iemaksu-likmes, updated 02.09.2026):
 *     10.50% general employee. The annual ceiling on the contribution base is EUR 105,300 (secondary sources; not on the VID page).
 * The non-taxable minimum is a fixed EUR 550 a month (EUR 6,600 a year) in 2026, from news summaries of the Saeima's amendment
 * (the VID page for it returned 404); it is not income-tested any more. Social contributions are deductible from taxable income.
 *
 * Pensions pay the same income tax and no social contributions; remote workers paid by a foreign employer pay no Latvian contributions.
 * Not modeled: the extra pensioner minimum (if any), dependants' relief, the solidarity-tax mechanics, mandatory health insurance (not
 * levied as a separate Latvian contribution).
 */
export const LATVIA_TAX_YEAR_LABEL = "2026";
export const LATVIA_EMPLOYEE_CONTRIBUTION_RATE = 0.105;
const CEILING = 105_300;
const NON_TAXABLE_MINIMUM = 550 * 12;

export function latviaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const gross = Math.max(0, income);
  const contributions = scenario === "local" ? LATVIA_EMPLOYEE_CONTRIBUTION_RATE * Math.min(gross, CEILING) : 0;
  const taxable = Math.max(0, gross - contributions - NON_TAXABLE_MINIMUM);
  const incomeTax = 0.255 * Math.min(taxable, CEILING) + 0.33 * Math.max(0, taxable - CEILING) + 0.03 * Math.max(0, taxable - 200_000);
  return { incomeTax, contributions };
}
