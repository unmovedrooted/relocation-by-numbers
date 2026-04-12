export const USD_TO_LOCAL: Record<string, number> = {
  US: 1,
  TH: 36,
  PT: 0.92,
  ES: 0.92,
  GB: 0.79,
  CA: 1.35,
  MX: 16.8,
  AE: 3.67,
  JP: 150,
  KR: 1330,
  SG: 1.35,
  AU: 1.52,
  NZ: 1.64,
  DE: 0.92,
  FR: 0.92,
  IT: 0.92,
  NL: 0.92,
  IE: 0.92,
  CH: 0.90,
  AT: 0.92, 
  BE: 0.92,
  DK: 6.85,
  SE: 10.45,
  NO: 10.7,
  FI: 0.92,
  PL: 3.95,
  CZ: 23.2,
  HU: 365,
  EC: 1,
  BO: 6.91,
  GY: 209,
  SR: 36.5,
  VE: 36.5,
  UY: 39.5,
  PY: 7600,
  GR: 0.92,
  TR: 32.0,
  HR: 0.92,
  EE: 0.92,
  LV: 0.92,
  LT: 0.92,
  RO: 4.58,
  BG: 1.80,
  SI: 0.92,
  SK: 0.92,
  MT: 0.92,
  CY: 0.92,
  PA: 1,
  CO: 3920,
  BR: 4.95,
  DO: 58.5,
  AR: 900,
  CL: 970,
  PE: 3.72,
  VN: 24500,
  MY: 4.70,
  ID: 15700,
  ZA: 18.3,
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
