/**
 * Guyana: personal income tax and the employee NIS contribution for 2026, in Guyanese dollars.
 *
 * Guyana Revenue Authority notice "Revised Personal Allowance and Deductions for Income Tax 2026" (Income Tax (Amendment)
 * Act No. 3 of 2026, effective 1 January 2026), read 2026-10-14:
 * https://gra.gov.gy/notice-to-employers-employees-self-employed-persons-revised-personal-allowance-and-deductions-for-income-tax-2026/
 *   - personal allowance GYD 1,680,000 a year (GYD 140,000 a month), or one third of income after other allowances if that is greater;
 *   - 25% on chargeable income up to GYD 3,360,000 a year and 35% above;
 *   - NIS deduction: 5.6% of gross pay up to GYD 280,000 a month (a ceiling of GYD 15,680 a month).
 *
 * The old model treated the income as US dollars against dollar thresholds; the calculators pass income in local currency.
 *
 * Not modeled: the child deduction (GYD 10,000 a month per child under 18), insurance premium deductions, the second-job
 * and overtime deductions, and the NIS contributions of self-employed people.
 */
export const GUYANA_TAX_YEAR_LABEL = "2026";
export const GUYANA_ALLOWANCE = 1_680_000;
export const GUYANA_BAND = 3_360_000;
export const GUYANA_NIS_RATE = 0.056;
export const GUYANA_NIS_CEILING = 280_000 * 12;

export function guyanaTax(income: number, scenario: "local" | "remote" | "retired"): { incomeTax: number; nis: number } {
  const gross = Math.max(0, income);
  const nis = scenario === "local" ? GUYANA_NIS_RATE * Math.min(gross, GUYANA_NIS_CEILING) : 0;
  const balance = gross - nis;
  const allowance = Math.max(GUYANA_ALLOWANCE, balance / 3);
  const chargeable = Math.max(0, balance - allowance);
  return { incomeTax: 0.25 * Math.min(chargeable, GUYANA_BAND) + 0.35 * Math.max(0, chargeable - GUYANA_BAND), nis };
}
