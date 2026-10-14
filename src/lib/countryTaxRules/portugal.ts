/**
 * Portugal: IRS (mainland) on employment and pension income for 2026, in euros, and the employee's social security contribution.
 *
 * Portal das Financas, article 68 of the personal income tax code (CIRS) in the wording of Lei 73-A/2025 (State Budget 2026),
 * https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx, read 2026-10-14:
 * 12.5% to EUR 8,342; 15.7% to 12,587; 21.2% to 17,838; 24.1% to 23,089; 31.1% to 29,397; 34.9% to 43,090; 43.1% to 46,566; 44.6% to
 * 86,634; 48% above. The page's bands match the Cofidis summary of the 2026 scale.
 * Specific deduction for employment and pension income: 8.54 x IAS = EUR 4,587.09 for 2026 (secondary; IAS EUR 537.13), or the
 * employee's social security contributions if larger. Employee social security 11% of pay (long-standing TSU rate, not re-read).
 * Solidarity surcharge: 2.5% on taxable income from EUR 80,000 to 250,000 and 5% above (standard CIRS art. 68-A, not re-read).
 *
 * A married couple is modeled as one earner using the joint split (income quotient of two). Retirees pay no social security;
 * remote workers paid abroad pay none here. Not modeled: dependants and deductions (health, education, housing), IRS Jovem,
 * the non-habitual and IFICI regimes (handled separately), and the Azores and Madeira reductions.
 */
export const PORTUGAL_TAX_YEAR_LABEL = "2026";
export const PORTUGAL_SPECIFIC_DEDUCTION = 4_587.09;

const BRACKETS = [
  { upTo: 8_342, rate: 0.125 }, { upTo: 12_587, rate: 0.157 }, { upTo: 17_838, rate: 0.212 }, { upTo: 23_089, rate: 0.241 },
  { upTo: 29_397, rate: 0.311 }, { upTo: 43_090, rate: 0.349 }, { upTo: 46_566, rate: 0.431 }, { upTo: 86_634, rate: 0.446 },
  { upTo: Infinity, rate: 0.48 },
] as const;

export function portugalScaleTax(taxable: number): number {
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS) {
    if (taxable <= previous) break;
    tax += (Math.min(taxable, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax;
}

export function portugalTax(income: number, filing: "single" | "married", scenario: "local" | "remote" | "retired"): { incomeTax: number; contributions: number } {
  const gross = Math.max(0, income);
  const contributions = scenario === "local" ? 0.11 * gross : 0;
  const taxable = Math.max(0, gross - Math.max(PORTUGAL_SPECIFIC_DEDUCTION, contributions));
  const unit = filing === "married" ? taxable / 2 : taxable;
  const multiplier = filing === "married" ? 2 : 1;
  const surcharge = 0.025 * Math.max(0, Math.min(taxable, 250_000) - 80_000) + 0.05 * Math.max(0, taxable - 250_000);
  return { incomeTax: portugalScaleTax(unit) * multiplier + surcharge, contributions };
}
