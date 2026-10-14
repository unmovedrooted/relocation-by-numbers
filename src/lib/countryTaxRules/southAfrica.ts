/**
 * South Africa: personal income tax for the 2026/27 tax year (1 March 2026 to 28 February 2027), in rand, and the employee's UIF.
 *
 * South African Revenue Service, Budget 2026 FAQ
 * (https://www.sars.gov.za/about/sars-tax-and-customs-system/budget/budget-2026-frequently-asked-questions/, read 2026-10-14): 18% to
 * ZAR 245,100; 26% to 383,100 (base 44,118); 31% to 530,200 (base 79,998); 36% to 695,800 (base 125,599); 39% to 887,000 (base
 * 185,215); 41% to 1,878,600 (base 259,783); 45% above (base 666,339). Rebates: primary ZAR 17,820; secondary (65 and over) 9,765;
 * tertiary (75 and over) 3,249. The page notes the figures are subject to Parliament's process.
 * UIF 1% of pay up to a monthly ceiling of ZAR 17,712 (long-standing, not re-read). Retirees are assumed to be 65 to 74.
 *
 * Not modeled: the medical scheme fees credit (ZAR 376 a month for each of the first two members), the additional medical credit,
 * the retirement-fund deduction (27.5% of income), the skills development levy (employer only), and the interest exemption.
 */
export const SOUTH_AFRICA_TAX_YEAR_LABEL = "2026/27";

const BRACKETS = [
  { upTo: 245_100, rate: 0.18 }, { upTo: 383_100, rate: 0.26 }, { upTo: 530_200, rate: 0.31 }, { upTo: 695_800, rate: 0.36 },
  { upTo: 887_000, rate: 0.39 }, { upTo: 1_878_600, rate: 0.41 }, { upTo: Infinity, rate: 0.45 },
] as const;

export function southAfricaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; uif: number } {
  const g = Math.max(0, income);
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS) {
    if (g <= previous) break;
    tax += (Math.min(g, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  const rebates = 17_820 + (scenario === "retired" ? 9_765 : 0);
  return { incomeTax: Math.max(0, tax - rebates), uif: scenario === "local" ? 0.01 * Math.min(g, 17_712 * 12) : 0 };
}
