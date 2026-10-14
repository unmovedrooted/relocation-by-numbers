/**
 * Greece: income tax on employment and pension income for 2026, in euros, and the employee's EFKA contributions.
 *
 * Ministry of Finance, Annual Progress Report 2026 ("Tax reform": rates cut by 2 points between EUR 10,000 and 40,000, a new
 * 39% band for EUR 40,000 to 60,000 instead of 44%) and the Ministry's tax guide https://minfin.gov.gr/en/tax-policy/tax-guide/income-taxation/
 * (read 2026-10-14). Scale for a taxpayer with no children: 9% to EUR 10,000; 20% to 20,000; 26% to 30,000; 34% to 40,000;
 * 39% to 60,000; 44% above. Tax reduction: EUR 777 with no children, cut by EUR 20 for every EUR 1,000 of income above
 * EUR 12,000, and never more than the tax due.
 * EFKA employee contributions: 13.87% of earnings (the long-standing statutory total), up to the maximum insurable earnings
 * (EUR 7,572.62 a month per TEKA, over 14 monthly payments); pensioners are assumed to pay 6% health contribution.
 * The contribution rate, ceiling and pensioner rate were not re-read on an EFKA page in this session.
 *
 * Not modeled: reductions for children (lower rates and larger credits), the youth rates, the solidarity contribution (abolished for
 * private-sector income from 2023), the tax-free allowances for some benefits, and the special regimes for new residents.
 */
export const GREECE_TAX_YEAR_LABEL = "2026";
export const GREECE_EMPLOYEE_CONTRIBUTION_RATE = 0.1387;
export const GREECE_CONTRIBUTION_CEILING = 14 * 7_572.62;

const BRACKETS = [
  { upTo: 10_000, rate: 0.09 }, { upTo: 20_000, rate: 0.20 }, { upTo: 30_000, rate: 0.26 },
  { upTo: 40_000, rate: 0.34 }, { upTo: 60_000, rate: 0.39 }, { upTo: Infinity, rate: 0.44 },
] as const;

export function greeceBracketTax(taxable: number): number {
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS) {
    if (taxable <= previous) break;
    tax += (Math.min(taxable, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax;
}

export function greeceTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const gross = Math.max(0, income);
  const contributions = scenario === "local" ? GREECE_EMPLOYEE_CONTRIBUTION_RATE * Math.min(gross, GREECE_CONTRIBUTION_CEILING)
    : scenario === "retired" ? 0.06 * gross : 0;
  const taxable = Math.max(0, gross - contributions);
  const tax = greeceBracketTax(taxable);
  const reduction = Math.max(0, 777 - 20 * Math.max(0, taxable - 12_000) / 1_000);
  return { incomeTax: Math.max(0, tax - reduction), contributions };
}
