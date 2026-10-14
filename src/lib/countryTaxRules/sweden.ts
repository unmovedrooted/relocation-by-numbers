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
 * Jobbskatteavdrag (earned income tax credit, people under 66): Skatteverket publishes no simple formula, so it is read off the
 * official 2026 monthly tax table 33 (https://www.skatteverket.se/download/18.1522bf3f19aea8075ba61c/1765290465443/allmanna-tabeller-manad-tabell-33.pdf,
 * municipal rate 32.51% to 33.00%, which already includes the credit). For each income band of the table the credit is the
 * tax this module computes without it (at 32.75%) minus twelve times the table's tax; the resulting curve is stored below at 11
 * anchor incomes, scaled to the 32.38% average municipal rate, and interpolated. It rises to the maximum of about SEK 52,400
 * a year (Ekonomifakta; reached near SEK 500,000 of pay). Below SEK 96,606 it is the standard (income - allowance) x municipal rate.
 * The credit is capped at the tax due. It is an approximation: error is probably within SEK 1,000 to 2,000 a year.
 *
 * Not modeled: the allowance for people 66 and over varies with income and is set at its minimum; the burial fee and church fee;
 * the public service fee; and municipal differences (28.9% to 35.7%). Employer contributions are paid on top of pay.
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

// [annual pay, credit in SEK at the 32.38% average municipal rate]. Derived from Skatteverket's 2026 table 33 (see the header).
const JSA_ANCHORS: Array<[number, number]> = [
  [25_042, 0], [54_000, 9_335], [96_606, 11_173], [121_806, 12_553], [157_806, 14_532], [181_806, 17_307], [239_406, 24_317],
  [306_006, 31_642], [363_606, 37_849], [421_206, 44_060], [469_206, 49_154], [500_000, 52_403],
];

export function swedenJobbskatteavdrag(income: number): number {
  if (income <= JSA_ANCHORS[0][0]) return 0;
  for (let i = 1; i < JSA_ANCHORS.length; i++) {
    const [x1, y1] = JSA_ANCHORS[i];
    if (income <= x1) {
      const [x0, y0] = JSA_ANCHORS[i - 1];
      return y0 + ((income - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return JSA_ANCHORS[JSA_ANCHORS.length - 1][1];
}

export function swedenTax(income: number, retired: boolean): number {
  const a = Math.max(0, income);
  const taxable = Math.max(0, a - Math.min(a, swedenBasicAllowance(a, retired)));
  const before = SWEDEN_MUNICIPAL_RATE * taxable + 0.20 * Math.max(0, taxable - 643_000);
  return retired ? before : Math.max(0, before - swedenJobbskatteavdrag(a));
}
