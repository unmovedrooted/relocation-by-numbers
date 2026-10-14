/**
 * Austria: income tax (Einkommensteuer / Lohnsteuer) and employee social insurance for 2026.
 *
 * Tariff and the 2026 indexation (brackets raised by two thirds of 2.6% inflation): Federal Ministry of Finance,
 * "Steuertarif" https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/steuertarif-steuerabsetzbetraege.html
 * (its EUR 40,000 example, EUR 7,447.20 of tax, is a test below). The 55% rate above EUR 1 million is temporary until 2029.
 * Credits (Verkehrsabsetzbetrag EUR 496, Pensionistenabsetzbetrag up to EUR 1,020): BMF "Steuerabsetzbetraege"
 * https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/uebersicht-steuerabsetzbetraege.html
 * Social insurance: Dachverband der Sozialversicherungstraeger, "Beitragsrechtliche Werte 2026"
 * https://www.sozialversicherung.at/cdscontent/load?contentid=10008.806858
 * (maximum contribution base EUR 6,930 a month, EUR 13,860 a year for special payments; health 3.87%, pension 10.25%).
 * Read 2026-10-13. The Steuerbuch 2026 shows older pensioner-credit thresholds than the BMF web page; the web page is used.
 *
 * Not modeled: the 13th and 14th salary (taxed at a flat 6% within limits), reduced unemployment insurance at low pay, the
 * pensioner health contribution, sole-earner and child credits, commuter allowance and other deductions.
 */
export const AUSTRIA_TAX_YEAR_LABEL = "2026";

const BRACKETS = [
  { upTo: 13_539, rate: 0 },
  { upTo: 21_992, rate: 0.20 },
  { upTo: 36_458, rate: 0.30 },
  { upTo: 70_365, rate: 0.40 },
  { upTo: 104_859, rate: 0.48 },
  { upTo: 1_000_000, rate: 0.50 },
  { upTo: Infinity, rate: 0.55 },
] as const;

/** Employee social insurance: health 3.87%, pension 10.25%, unemployment 3%, Chamber of Labour 0.5%, housing 0.5%. */
export const AUSTRIA_EMPLOYEE_SOCIAL_RATE = 0.0387 + 0.1025 + 0.03 + 0.005 + 0.005;
/** 12 months at the monthly maximum plus the special-payment maximum. */
export const AUSTRIA_SOCIAL_BASE_CAP = 6_930 * 12 + 13_860;
export const AUSTRIA_VERKEHRSABSETZBETRAG = 496;
const WERBUNGSKOSTENPAUSCHALE = 132;

export function austriaBracketTax(taxableIncome: number): number {
  let tax = 0;
  let previous = 0;
  for (const b of BRACKETS) {
    if (taxableIncome <= previous) break;
    tax += (Math.min(taxableIncome, b.upTo) - previous) * b.rate;
    previous = b.upTo;
  }
  return tax;
}

/** Pensioner credit: EUR 1,020 up to a pension of EUR 21,614, falling evenly to zero at EUR 31,494. */
export function austriaPensionerCredit(pension: number): number {
  if (pension <= 21_614) return 1_020;
  if (pension >= 31_494) return 0;
  return 1_020 * (31_494 - pension) / (31_494 - 21_614);
}

/** Total tax and employee social insurance in euros. Working income pays social insurance, which is deductible; pensions do not. */
export function austriaTax(income: number, retired: boolean): { incomeTax: number; socialInsurance: number } {
  const gross = Math.max(0, income);
  const socialInsurance = retired ? 0 : AUSTRIA_EMPLOYEE_SOCIAL_RATE * Math.min(gross, AUSTRIA_SOCIAL_BASE_CAP);
  const base = Math.max(0, gross - socialInsurance - (retired ? 0 : WERBUNGSKOSTENPAUSCHALE));
  const credit = retired ? austriaPensionerCredit(gross) : AUSTRIA_VERKEHRSABSETZBETRAG;
  return { incomeTax: Math.max(0, austriaBracketTax(base) - credit), socialInsurance };
}
