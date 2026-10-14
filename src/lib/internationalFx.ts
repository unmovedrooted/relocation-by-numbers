/**
 * Local currency per U.S. dollar.
 *
 * Source: U.S. Department of the Treasury, Bureau of the Fiscal Service, Treasury Reporting Rates of Exchange as of
 * 2026-09-30 (https://fiscaldata.treasury.gov/datasets/treasury-reporting-rates-exchange/treasury-reporting-rates-of-exchange).
 * These are the official quarterly rates federal agencies use, not a live market rate: they can differ from today's
 * rate by several percent. Update them each quarter from the same dataset.
 *
 * Euro-area countries use the euro row. Bulgaria uses the euro row times the fixed conversion rate of 1.95583 lev per
 * euro. Territories and countries that use the U.S. dollar are 1. A few entries are not Treasury figures and say why
 * beside the number.
 */
export const FX_SOURCE = {
  name: "U.S. Treasury Reporting Rates of Exchange",
  asOf: "2026-09-30",
  url: "https://fiscaldata.treasury.gov/datasets/treasury-reporting-rates-exchange/treasury-reporting-rates-of-exchange",
} as const;

export const USD_TO_LOCAL: Record<string, number> = {
  US: 1,
  GB: 0.752,
  CA: 1.418,
  MX: 18.134,
  AE: 3.673,
  KR: 1355.01,
  SG: 1.277,
  AU: 1.435,
  NZ: 1.64,  // not updated: Treasury's published row repeats the euro rate, which cannot be right
  PH: 62.658,
  TW: 31.864,
  CR: 453.56,
  CH: 0.835,
  DK: 6.583,
  SE: 9.983,
  NO: 9.59,
  PL: 3.846,
  CZ: 20.981,
  HU: 322.34,
  EC: 1,
  BO: 11.96,
  BL: 0.881,
  "BQ-BO": 1,
  "BQ-SA": 1,
  "BQ-SE": 1,
  GP: 0.881,
  MF: 0.881,
  MQ: 0.881,
  GY: 215,
  SR: 37.388,
  VE: 621.47,
  UY: 40.27,
  PY: 5837.37,
  TR: 49.001,
  RO: 4.648,
  BG: 1.7231,
  PA: 1,
  CO: 3325,
  BR: 5.205,
  DO: 59.26,
  AR: 1545,
  CL: 973.27,
  PE: 3.44,
  MY: 4.074,
  ID: 17865.69,
  ZA: 16.393,
  TH: 33.58,
  JM: 159,
  BB: 2.02,
  TT: 6.743,
  KY: 0.82,
  BS: 1,
  XCD: 2.7,
  CW: 1.79,  // not updated: Treasury's published row repeats the euro rate, which cannot be right
  SX: 1.79,  // not updated: Treasury's published row repeats the euro rate, which cannot be right
  AG: 2.7,
  DM: 2.7,
  GD: 2.7,
  KN: 2.7,
  LC: 2.7,
  MS: 2.7,
  VC: 2.7,
  AW: 1.79,  // not updated: Treasury lists no Aruban florin row; kept the official peg of 1.79 per U.S. dollar
  HT: 130.4,
  CU: 24,
  PR: 1,
  TC: 1,
  VG: 1,
  VI: 1,
  SA: 3.75,
  PT: 0.881,
  ES: 0.881,
  DE: 0.881,
  FR: 0.881,
  IT: 0.881,
  NL: 0.881,
  IE: 0.881,
  AT: 0.881,
  BE: 0.881,
  FI: 0.881,
  GR: 0.881,
  HR: 0.881,
  EE: 0.881,
  LV: 0.881,
  LT: 0.881,
  SI: 0.881,
  SK: 0.881,
  MT: 0.881,
  CY: 0.881,
  JP: 157.09,
  VN: 25959,
  HK: 7.846,
  IN: 95.83,
  CN: 6.705,
  QA: 3.64,
  OM: 0.385,
};

export function convertUsdAnnualIncomeToLocal(
  annualIncomeUsd: number,
  countryCode: string
): number {
  const rate = USD_TO_LOCAL[countryCode] ?? 1;
  return annualIncomeUsd * rate;
}

export function convertUsdAmountToLocal(
  amountUsd: number,
  countryCode: string
): number {
  const rate = USD_TO_LOCAL[countryCode] ?? 1;
  return amountUsd * rate;
}
