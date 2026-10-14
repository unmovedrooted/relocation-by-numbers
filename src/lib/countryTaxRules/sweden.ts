/**
 * Sweden: municipal and state income tax for 2026, in kronor.
 *
 * Skatteverket, "Belopp och procent inkomstår 2026" (https://www.skatteverket.se/privat/skatter/beloppochprocent/2026.4.1522bf3f19aea8075ba21.html,
 * read 2026-10-14): state income tax of 20% on taxable earned income above the skiktgrans of SEK 643,000; average municipal tax 32.38%
 * (excluding the burial fee); basic allowance (grundavdrag) for people under 66 of SEK 25,100 at low incomes, at most 45,600 and
 * at least 17,400 at high incomes; for people 66 and over 65,800 at low incomes, at most 179,100 and at least 117,500 at high
 * incomes. The allowance steps follow the price base amount (SEK 59,200 in 2026): 0.423 times it up to 0.99 times, rising by 20% of
 * the excess to 0.77 times at 2.72 times, flat to 3.11 times, falling by 10% to 0.293 times at 7.88 times (the formula is the standing
 * rule; its end points match the page's rounded amounts). The general pension fee of 7% (at most SEK 47,100) is returned in full as a
 * tax reduction, so it is not counted.
 *
 * Not modeled: the jobbskatteavdrag (earned income tax credit, at most about SEK 52,400 a year for people under 66 according to
 * secondary sources; Skatteverket's page gives no formula), which lowers tax on employment income by up to about 5 percentage
 * points at middle incomes; the allowance for people 66 and over varies with income and is set at its minimum; the burial fee and
 * church fee; the public service fee; and municipal differences (28.9% to 35.7%). Employer contributions are paid on top of pay.
 */
export const SWEDEN_TAX_YEAR_LABEL = "2026";
export const SWEDEN_MUNICIPAL_RATE = 0.3238;
const PBB = 59_200;

export function swedenBasicAllowance(income: number, over66: boolean): number {
  if (over66) return 117_500;
  const x = income / PBB;
  if (x <= 0.99) return 0.423 * PBB;
  if (x <= 2.72) return 0.423 * PBB + 0.2 * (income - 0.99 * PBB);
  if (x <= 3.11) return 0.77 * PBB;
  if (x <= 7.88) return 0.77 * PBB - 0.1 * (income - 3.11 * PBB);
  return 0.293 * PBB;
}

export function swedenTax(income: number, retired: boolean): number {
  const a = Math.max(0, income);
  const taxable = Math.max(0, a - Math.min(a, swedenBasicAllowance(a, retired)));
  return SWEDEN_MUNICIPAL_RATE * taxable + 0.20 * Math.max(0, taxable - 643_000);
}
