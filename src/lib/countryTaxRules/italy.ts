/**
 * Italy: IRPEF for 2026, in euros, with the employee and pension deductions (detrazioni) and the employee's INPS contribution.
 *
 * Chamber of Deputies topic page "Tassazione delle persone fisiche" (https://temi.camera.it/leg19/temi/19_tl18_irpef.html, read
 * 2026-10-14), art. 11 and 13 TUIR as amended by Law 199/2025: 23% to EUR 28,000; 33% to EUR 50,000 (cut from 35% on 1 January
 * 2026; the cut is neutralised above EUR 200,000 of income, not modeled); 43% above. Employee deduction: EUR 1,955 up to
 * EUR 15,000 (at least EUR 690); EUR 1,910 + 1,190 x (28,000 - income) / 13,000 to EUR 28,000; 1,910 x (50,000 - income) /
 * 22,000 to EUR 50,000; plus EUR 65 between EUR 25,000 and 35,000. Pension deduction: EUR 1,955 up to EUR 8,500 (at least
 * EUR 713); 700 + 1,255 x (28,000 - income) / 19,500 to EUR 28,000; 700 x (50,000 - income) / 22,000 to EUR 50,000; plus
 * EUR 50 between EUR 25,000 and 29,000. Mandatory social contributions are deductible from income. MEF confirms the 33% rate
 * (https://www.mef.gov.it/focus/Principali-misure-della-legge-di-bilancio-2026/).
 * INPS employee contribution 9.19% of gross pay is the long-standing rate and was not re-read on an INPS page; the extra 1%
 * above about EUR 56,000 and the contribution ceiling are not modeled.
 *
 * Not modeled: the 2025 "cuneo fiscale" relief for incomes up to EUR 40,000 (not read), family and other deductions, the
 * neutralisation above EUR 200,000, and the TFR. Regional and municipal surtaxes are applied by the caller.
 */
export const ITALY_TAX_YEAR_LABEL = "2026";
export const ITALY_INPS_EMPLOYEE_RATE = 0.0919;
export const ITALY_NEW_RESIDENT_FLAT_TAX = 300_000;

export function italyIrpefGross(taxable: number): number {
  return 0.23 * Math.min(taxable, 28_000) + 0.33 * Math.max(0, Math.min(taxable, 50_000) - 28_000) + 0.43 * Math.max(0, taxable - 50_000);
}

export function italyEmployeeDeduction(income: number): number {
  if (income <= 0) return 0;
  if (income <= 15_000) return Math.max(1_955, 690);
  const base = income <= 28_000 ? 1_910 + 1_190 * (28_000 - income) / 13_000
    : income <= 50_000 ? 1_910 * (50_000 - income) / 22_000 : 0;
  return base + (income > 25_000 && income <= 35_000 ? 65 : 0);
}

export function italyPensionDeduction(income: number): number {
  if (income <= 0) return 0;
  if (income <= 8_500) return Math.max(1_955, 713);
  const base = income <= 28_000 ? 700 + 1_255 * (28_000 - income) / 19_500
    : income <= 50_000 ? 700 * (50_000 - income) / 22_000 : 0;
  return base + (income > 25_000 && income <= 29_000 ? 50 : 0);
}

export function italyTax(income: number, scenario: "local" | "remote" | "retired"): { irpef: number; inps: number; taxable: number } {
  const gross = Math.max(0, income);
  const inps = scenario === "local" ? ITALY_INPS_EMPLOYEE_RATE * gross : 0;
  const taxable = gross - inps;
  const deduction = scenario === "retired" ? italyPensionDeduction(taxable) : italyEmployeeDeduction(taxable);
  return { irpef: Math.max(0, italyIrpefGross(taxable) - deduction), inps, taxable };
}
