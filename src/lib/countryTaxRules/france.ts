/**
 * France: income tax on 2025 earnings, declared in 2026, with the employee's social contributions, in euros.
 *
 * Income tax scale per part, indexed 0.9% by law 2026-103 of 19 February 2026: 0% to EUR 11,600; 11% to 29,579; 30% to 84,577;
 * 41% to 181,917; 45% above. Decote (full-rate relief for small tax bills): single, tax below EUR 1,982: 897 less 45.25% of the
 * tax; joint, tax below 3,277: 1,483 less 45.25%. Standard 10% allowance for professional expenses, minimum EUR 509 and
 * maximum EUR 14,555. Sources: economie.gouv.fr and impots.gouv.fr "Calcul de l'impot 2026 sur les revenus 2025"
 * (https://www.economie.gouv.fr/particuliers/impots-et-fiscalite/gerer-mon-impot-sur-le-revenu/comment-calculer-votre-impot-dapres-le-bareme-de-limpot-sur-le-revenu,
 * https://simulateur-ir-ifi.impots.gouv.fr/calcul_impot/2026/simplifie/index.htm), read 2026-10-14.
 * Employee contributions 2026 (private sector), Urssaf and Agirc-Arrco: old-age insurance 6.90% up to the social security
 * ceiling (EUR 48,060 in 2026) and 0.40% on all pay; Agirc-Arrco tranche 1 3.15%; equilibrium contribution (CEG) 0.86%; CET 0.14%.
 * CSG 9.2% (6.8% deductible) and CRDS 0.5% on 98.25% of gross pay. The tranche 2 employee rates (Agirc-Arrco 8.64%, CEG
 * 1.08%, on pay between one and eight ceilings) are the standard published shares, not re-read this session.
 *
 * Not modeled: child parts (each child adds half a part), tax credits and reductions, the quotient familial cap, the exceptional
 * contribution on high incomes, the pensioner allowance and pension CSG rates (the pension case is approximate), and the 13th month.
 */
export const FRANCE_TAX_YEAR_LABEL = "2026 return, 2025 income";
export const FRANCE_SOCIAL_SECURITY_CEILING = 48_060;

const BRACKETS = [
  { upTo: 11_600, rate: 0 }, { upTo: 29_579, rate: 0.11 }, { upTo: 84_577, rate: 0.30 },
  { upTo: 181_917, rate: 0.41 }, { upTo: Infinity, rate: 0.45 },
] as const;

export function franceBracketTax(perPart: number): number {
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS) {
    if (perPart <= previous) break;
    tax += (Math.min(perPart, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax;
}

/** Employee social contributions other than CSG and CRDS, on gross pay. */
export function franceEmployeeContributions(gross: number): number {
  const tranche1 = Math.min(gross, FRANCE_SOCIAL_SECURITY_CEILING);
  const tranche2 = Math.min(Math.max(0, gross - FRANCE_SOCIAL_SECURITY_CEILING), 7 * FRANCE_SOCIAL_SECURITY_CEILING);
  const capped = Math.min(gross, 8 * FRANCE_SOCIAL_SECURITY_CEILING);
  return 0.069 * tranche1 + 0.004 * gross + 0.0315 * tranche1 + 0.0864 * tranche2 + 0.0086 * tranche1 + 0.0108 * tranche2 + 0.0014 * capped;
}

export type FranceScenario = "local" | "remote" | "retired";

export function franceTax(income: number, opts: { scenario: FranceScenario; married: boolean }): { incomeTax: number; contributions: number } {
  const gross = Math.max(0, income);
  const parts = opts.married ? 2 : 1;
  const retired = opts.scenario === "retired";
  const employee = opts.scenario === "local";

  const contributions = employee ? franceEmployeeContributions(gross) : 0;
  const csgBase = 0.9825 * Math.min(gross, 192_240);
  // Pensions: standard CSG 8.3%, CRDS 0.5% and the 0.3% solidarity levy; the reduced rates for low pensions are not applied.
  const csgCrds = employee ? 0.097 * csgBase : retired ? 0.091 * gross : 0;
  const deductibleCsg = employee ? 0.068 * csgBase : retired ? 0.059 * gross : 0;

  const netImposable = Math.max(0, gross - contributions - deductibleCsg);
  const allowance = employee || opts.scenario === "remote"
    ? Math.min(Math.max(0.10 * netImposable, 509), 14_555, netImposable)
    : retired ? Math.min(Math.max(0.10 * netImposable, 450), 4_399, netImposable) : 0;
  const taxable = Math.max(0, netImposable - allowance);

  const gross_tax = franceBracketTax(taxable / parts) * parts;
  const threshold = opts.married ? 3_277 : 1_982;
  const decote = gross_tax < threshold ? Math.max(0, (opts.married ? 1_483 : 897) - 0.4525 * gross_tax) : 0;
  return { incomeTax: Math.max(0, gross_tax - decote), contributions: contributions + csgCrds };
}
