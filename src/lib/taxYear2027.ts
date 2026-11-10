import type { FilingStatus } from "./tax";

/**
 * Federal and payroll figures for tax year 2027, with their sources.
 *
 * Every value below was read from the agency document named beside it (verified 2026-11-10).
 * NOT YET USED BY THE CALCULATORS: they stay on src/lib/taxYear2026.ts until the switch to 2027 is made on purpose,
 * because the state rules in src/lib/retirementPlan are 2026 rules and the 2027 retirement-plan limits are not published.
 */
export const TAX_YEAR_2027 = 2027;
export const TAX_RULES_2027_VERIFIED_ON = "2026-11-10";

type Bracket = { upTo: number; rate: number };

/**
 * IRS Rev. Proc. 2026-35 (released 2026-11-05), https://www.irs.gov/pub/irs-drop/rp-26-35.pdf
 * Section 3.01, Tables 1 and 3 (rate tables); section 3.15 (standard deduction, and the additional amount for the aged or blind);
 * section 3.03 (maximum zero-rate and 15-percent-rate amounts for capital gains).
 * `baseTax` is the IRS table's own "the tax is $X plus..." amount at the start of each bracket; the test checks the brackets reproduce it.
 */
export const FEDERAL_2027 = Object.freeze({
  source: "IRS Rev. Proc. 2026-35 (2027 inflation adjustments)",
  sourceUrl: "https://www.irs.gov/pub/irs-drop/rp-26-35.pdf",
  standardDeduction: { single: 16_600, married: 33_200 } as Record<FilingStatus, number>,
  /** Per person who is 65 or older, and again if blind: $2,100 if unmarried and not a surviving spouse, $1,700 if married. */
  additionalStandardDeduction: { single: 2_100, married: 1_700 } as Record<FilingStatus, number>,
  brackets: {
    single: [
      { upTo: 12_800, rate: 0.10 },
      { upTo: 52_025, rate: 0.12 },
      { upTo: 109_125, rate: 0.22 },
      { upTo: 208_325, rate: 0.24 },
      { upTo: 264_550, rate: 0.32 },
      { upTo: 661_375, rate: 0.35 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
    married: [
      { upTo: 25_600, rate: 0.10 },
      { upTo: 104_050, rate: 0.12 },
      { upTo: 218_250, rate: 0.22 },
      { upTo: 416_650, rate: 0.24 },
      { upTo: 529_100, rate: 0.32 },
      { upTo: 793_650, rate: 0.35 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
  } as Record<FilingStatus, Bracket[]>,
  /** The tax at the start of each bracket as printed in the IRS tables, in bracket order. */
  baseTax: {
    single: [0, 1_280, 5_987, 18_549, 42_357, 60_349, 199_237.75],
    married: [0, 2_560, 11_974, 37_098, 84_714, 120_698, 213_290.5],
  } as Record<FilingStatus, number[]>,
  /** Long-term capital gains and qualified dividends: taxable income up to `zeroRateUpTo` is taxed at 0%, then 15% up to `fifteenRateUpTo`, then 20%. */
  capitalGains: {
    single: { zeroRateUpTo: 51_050, fifteenRateUpTo: 563_200 },
    married: { zeroRateUpTo: 102_100, fifteenRateUpTo: 633_600 },
  } as Record<FilingStatus, { zeroRateUpTo: number; fifteenRateUpTo: number }>,
});

/** IRS Rev. Proc. 2026-35, section 3.41: the foreign earned income exclusion for taxable years beginning in 2027 (IRC 911(b)(2)(D)(i)), per qualifying person. */
export const FOREIGN_EARNED_INCOME_EXCLUSION_2027 = 137_300;

/**
 * Social Security Administration, "Contribution and Benefit Base" (https://www.ssa.gov/oact/cola/cbb.html): the 2027 base is $192,300,
 * and the page states the 6.2% OASDI and 1.45% Medicare rates. The Additional Medicare Tax rate and thresholds are fixed by statute
 * (IRC 3101(b)(2)) and are not indexed. IRS Publication 15 for 2027 is published later and should agree.
 */
export const PAYROLL_2027 = Object.freeze({
  source: "Social Security Administration, Contribution and Benefit Base (2027); IRC 3101",
  sourceUrl: "https://www.ssa.gov/oact/cola/cbb.html",
  socialSecurityWageBase: 192_300,
  socialSecurityRate: 0.062,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: { single: 200_000, married: 250_000 } as Record<FilingStatus, number>,
});

/**
 * IRS Rev. Proc. 2026-24 (HSA and high-deductible health plan amounts for calendar year 2027),
 * https://www.irs.gov/pub/irs-drop/rp-26-24.pdf. The $1,000 catch-up at 55 is fixed by statute (IRC 223(b)(3)).
 *
 * `retirementPlans` is null on purpose. The IRS publishes the 401(k), IRA and catch-up limits in a separate cost-of-living notice
 * (Notice 2025-67 for 2026, released 2025-11-13). The 2027 notice had not been published when this file was verified, and
 * projected figures are not entered here. Fill it in from the notice itself, then update the test.
 */
export const CONTRIBUTION_LIMITS_2027 = Object.freeze({
  source: "IRS Rev. Proc. 2026-24 (HSA). The 2027 401(k) and IRA limits were not published as of 2026-11-10.",
  hsa: { self: 4_500, family: 9_000, catchUp55: 1_000 },
  hdhpMinDeductible: { self: 1_750, family: 3_500 },
  hdhpMaxOutOfPocket: { self: 8_700, family: 17_400 },
  retirementPlans: null as null | Readonly<{
    employee401k: number;
    catchUp50: number;
    catchUp60to63: number;
    rothCatchUpWageThreshold: number;
    ira: number;
    iraCatchUp50: number;
  }>,
});

/** Federal income tax on a taxable income under the 2027 rate tables. */
export function federalIncomeTax2027(filing: FilingStatus, taxableIncome: number): number {
  let tax = 0;
  let floor = 0;
  for (const { upTo, rate } of FEDERAL_2027.brackets[filing]) {
    if (taxableIncome <= floor) break;
    tax += (Math.min(taxableIncome, upTo) - floor) * rate;
    floor = upTo;
  }
  return tax;
}
