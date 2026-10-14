/**
 * Japan: national income tax, reconstruction surtax, resident (inhabitant) tax and employee social insurance for 2026, in yen.
 *
 * National Tax Agency, read 2026-10-14:
 *   - rates (https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm): 5% to JPY 1.95 million, 10% to 3.3 million, 20%
 *     to 6.95 million, 23% to 9 million, 33% to 18 million, 40% to 40 million, 45% above; reconstruction surtax 2.1% of the tax
 *     (1.1% plus a 1% defense tax from 2027, not applied);
 *   - employment income after the deduction (the NTA table lists the resulting income, 2025 onward;
 *     https://www.nta.go.jp/english/taxes/individual/12012.htm): nothing to JPY 650,999;
 *     A - 650,000 to 1,899,999; B x 2.8 - 80,000 to 3,599,999; B x 3.2 - 440,000 to 6,599,999; A x 0.9 - 1,100,000 to 8,499,999;
 *     A - 1,950,000 above (B = A / 4 rounded down to 1,000). The higher minimum for 2026-27 (JPY 740,000) is not applied;
 *   - basic deduction (https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1199.htm): the page's table was only partly
 *     readable; JPY 1.04 million up to total income of JPY 4.89 million, 670,000 to 6.55 million, 620,000 to 23.5 million, then
 *     480,000 / 320,000 / 160,000 / 0 are used (2026 values after the reform effective 1 December 2026, middle rows inferred);
 *   - public pension deduction for age 65 or older, other income up to JPY 10 million: JPY 1.1 million up to pensions of 3.3 million;
 *     x 75% - 275,000 to 4.1 million (confirmed by the NTA worked example); x 85% - 685,000 to 7.7 million; x 95% - 1,455,000 to
 *     10 million; minus 1,955,000 above (standard table, not re-read; the images on the NTA page were unreadable).
 * Employee social insurance (MHLW and Japan Health Insurance Association summaries, secondary): health 9.9% average shared
 * equally (4.95%), child-support levy 0.23% shared (0.115%), employees' pension 9.15% on pay up to JPY 650,000 a month, and
 * employment insurance 0.5%; long-term care (1.62%, ages 40 to 64) not included. Caps not re-read.
 * Resident tax: 10% of income after a JPY 430,000 basic deduction (not re-read) plus about JPY 5,000 per person.
 *
 * Not modeled: dependants, life-insurance and other deductions, furusato nozei, National Health Insurance and National Pension for
 * the self-employed, remote workers and retirees (retirees are shown without health insurance premiums), and the 2026 minimum
 * employment deduction.
 */
export const JAPAN_TAX_YEAR_LABEL = "2026";
const MAN = 10_000;

/** Employment income (salary less the employment income deduction), from the NTA table. */
export function japanEmploymentIncome(a: number): number {
  if (a < 651_000) return 0;
  const b = Math.floor(a / 4 / 1000) * 1000;
  if (a < 1_900_000) return a - 650_000;
  if (a < 3_600_000) return b * 2.8 - 80_000;
  if (a < 6_600_000) return b * 3.2 - 440_000;
  if (a < 8_500_000) return a * 0.9 - 1_100_000;
  return a - 1_950_000;
}

export function japanPensionDeduction(p: number): number {
  if (p <= 3_300_000) return Math.min(p, 1_100_000);
  if (p <= 4_100_000) return p * 0.75 - 275_000;
  if (p <= 7_700_000) return p * 0.85 - 685_000;
  if (p <= 10_000_000) return p * 0.95 - 1_455_000;
  return 1_955_000;
}

export function japanBasicDeduction(totalIncome: number): number {
  if (totalIncome <= 489 * MAN) return 104 * MAN;
  if (totalIncome <= 655 * MAN) return 67 * MAN;
  if (totalIncome <= 2_350 * MAN) return 62 * MAN;
  if (totalIncome <= 2_400 * MAN) return 48 * MAN;
  if (totalIncome <= 2_450 * MAN) return 32 * MAN;
  if (totalIncome <= 2_500 * MAN) return 16 * MAN;
  return 0;
}

const BRACKETS = [
  { upTo: 1_950_000, rate: 0.05 }, { upTo: 3_300_000, rate: 0.10 }, { upTo: 6_950_000, rate: 0.20 },
  { upTo: 9_000_000, rate: 0.23 }, { upTo: 18_000_000, rate: 0.33 }, { upTo: 40_000_000, rate: 0.40 },
  { upTo: Infinity, rate: 0.45 },
] as const;

export function japanNationalTax(taxable: number): number {
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS) {
    if (taxable <= previous) break;
    tax += (Math.min(taxable, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax * 1.021;
}

export function japanTax(income: number, scenario: "local" | "remote" | "retired"): { nationalTax: number; residentTax: number; socialInsurance: number } {
  const gross = Math.max(0, income);
  const socialInsurance = scenario === "local"
    ? (0.0495 + 0.00115 + 0.005) * gross + 0.0915 * Math.min(gross, 650_000 * 12)
    : 0;
  const net = scenario === "retired" ? Math.max(0, gross - japanPensionDeduction(gross)) : japanEmploymentIncome(gross);
  const nationalTaxable = Math.max(0, net - socialInsurance - japanBasicDeduction(net));
  const residentTaxable = Math.max(0, net - socialInsurance - 430_000);
  const nationalTax = japanNationalTax(nationalTaxable);
  const residentTax = residentTaxable > 0 ? 0.10 * residentTaxable + 5_000 : 0;
  return { nationalTax, residentTax, socialInsurance };
}
