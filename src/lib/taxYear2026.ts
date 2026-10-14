import type { FilingStatus } from "./tax";

/**
 * Federal and payroll figures for tax year 2026, with their sources.
 *
 * Every value below was read from the IRS document named beside it (verified 2026-10-13).
 * Replace the whole file each year (the IRS publishes the next year's figures in the fall;
 * Rev. Proc. for income tax adjustments is normally released in October or November).
 */
export const TAX_YEAR = 2026;
export const TAX_RULES_VERIFIED_ON = "2026-10-13";

type Bracket = { upTo: number; rate: number };

/** Rev. Proc. 2025-32, section 4.14 (standard deduction) and section 4.01, Tables 1 and 3 (rate tables). */
export const FEDERAL_2026 = Object.freeze({
  source: "IRS Rev. Proc. 2025-32 (2026 inflation adjustments)",
  standardDeduction: { single: 16_100, married: 32_200 } as Record<FilingStatus, number>,
  brackets: {
    single: [
      { upTo: 12_400, rate: 0.10 },
      { upTo: 50_400, rate: 0.12 },
      { upTo: 105_700, rate: 0.22 },
      { upTo: 201_775, rate: 0.24 },
      { upTo: 256_225, rate: 0.32 },
      { upTo: 640_600, rate: 0.35 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
    married: [
      { upTo: 24_800, rate: 0.10 },
      { upTo: 100_800, rate: 0.12 },
      { upTo: 211_400, rate: 0.22 },
      { upTo: 403_550, rate: 0.24 },
      { upTo: 512_450, rate: 0.32 },
      { upTo: 768_700, rate: 0.35 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
    ],
  } as Record<FilingStatus, Bracket[]>,
});

/** IRS Rev. Proc. 2025-32, section 3.39: the foreign earned income exclusion for taxable years beginning in 2026 (IRC 911(b)(2)(D)(i)), per qualifying person. */
export const FOREIGN_EARNED_INCOME_EXCLUSION_2026 = 132_900;

/** IRS Publication 15 (2026) for the wage base; rates are statutory (IRC 3101, 3111); Additional Medicare thresholds per the Instructions for Form 8959. */
export const PAYROLL_2026 = Object.freeze({
  source: "IRS Publication 15 (2026); Instructions for Form 8959",
  socialSecurityWageBase: 184_500,
  socialSecurityRate: 0.062,
  medicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: { single: 200_000, married: 250_000 } as Record<FilingStatus, number>,
});

/** IRS Notice 2025-67 (retirement plan and IRA limits) and Rev. Proc. 2025-19 (HSA), verified 2026-10-13. */
export const CONTRIBUTION_LIMITS_2026 = Object.freeze({
  source: "IRS Notice 2025-67; IRS Rev. Proc. 2025-19; IRS Publication 969",
  employee401k: 24_500,
  catchUp50: 8_000,
  /** Ages 60 to 63; the Notice leaves this amount unchanged at 11,250. */
  catchUp60to63: 11_250,
  /** Prior-year wages above this amount require catch-up contributions to be made as Roth (not modeled). */
  rothCatchUpWageThreshold: 150_000,
  ira: 7_500,
  iraCatchUp50: 1_100,
  hsa: { self: 4_400, family: 8_750, catchUp55: 1_000 },
  hdhpMinDeductible: { self: 1_700, family: 3_400 },
  hdhpMaxOutOfPocket: { self: 8_500, family: 17_000 },
});
