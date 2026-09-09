import { finiteDollars, taxProjectionFactors, type TaxProjectionPolicy } from "./householdTax";
import { projectThreshold } from "./thresholdProjection";

/** Full-coverage Medicare B/D surcharges only, CMS/SSA 2026 tables.
 * Standard B premiums and the chosen D plan premium stay in the spending budget.
 * See FUTURE_ELIGIBILITY_IRMAA_CONTRACT.md for sources and exclusions.
 */
export type IrmaaTaxRecord = Readonly<{ taxYear: number; filing: "single" | "married"; magi: number }>;
export type MedicareEnrollment = Readonly<{ ownerId: string; partBMonths: number; partDMonths: number }>;
export type IrmaaTimelinePolicy = Readonly<{
  budgetTreatment: "surcharges-outside-spending";
  /** Independent explicit premium-cost scenario; not an income threshold rate. */
  annualSurchargeGrowth: number;
  historicalIncome: readonly IrmaaTaxRecord[];
  /** Explicit covered months; an absent owner/year means no modeled enrollment. */
  enrollmentByYear: Readonly<Record<number, readonly MedicareEnrollment[]>>;
}>;

export function irmaaMagi(agi: number, taxExemptInterest: number) {
  finiteDollars(agi, "IRMAA AGI", true);
  finiteDollars(taxExemptInterest, "IRMAA tax-exempt interest");
  return finiteDollars(agi + taxExemptInterest, "IRMAA MAGI", true);
}

export function calculateIrmaa(input: {
  premiumYear: number; income: IrmaaTaxRecord; partBMonths: number; partDMonths: number;
  projection?: TaxProjectionPolicy; annualSurchargeGrowth: number;
}) {
  const { premiumYear, income, partBMonths, partDMonths, annualSurchargeGrowth } = input;
  taxProjectionFactors(premiumYear, input.projection);
  if (!Number.isInteger(income.taxYear) || income.taxYear !== premiumYear - 2) throw new RangeError("IRMAA requires the tax record from exactly two years earlier.");
  if (!["single", "married"].includes(income.filing)) throw new RangeError("IRMAA supports single or married filing jointly only.");
  finiteDollars(income.magi, "Historical IRMAA MAGI", true);
  for (const months of [partBMonths, partDMonths]) {
    if (!Number.isInteger(months) || months < 0 || months > 12) throw new RangeError("Medicare enrollment months must be integers from 0 to 12.");
  }
  if (!Number.isFinite(annualSurchargeGrowth) || annualSurchargeGrowth < 0 || annualSurchargeGrowth > .2) throw new RangeError("IRMAA surcharge growth must be a decimal from 0 to 0.2.");
  const growth = input.projection?.annualBracketGrowth ?? 0;
  // Index single thresholds first, then double for MFJ (SSA Act 1839(i)(3)).
  const multiplier = income.filing === "married" ? 2 : 1;
  const lower = [109000, 137000, 171000, 205000].map(base =>
    projectThreshold(base, premiumYear, 2026, growth, 1000, "nearest") * multiplier);
  // Highest tier is frozen through 2027; 2028 is the first one-year increase.
  const topSingle = projectThreshold(500000, Math.max(2027, premiumYear), 2027, growth, 1000, "nearest");
  const top = topSingle * (income.filing === "married" ? 1.5 : 1);
  const lowerTier = lower.findIndex(bound => income.magi <= bound);
  const tier = lowerTier >= 0 ? lowerTier : income.magi < top ? 4 : 5;
  const factor = (1 + annualSurchargeGrowth) ** (premiumYear - 2026);
  // CMS premiums are expressed in dimes; rounding here defines the monthly bill.
  const monthlyB = Math.round([0, 81.2, 202.9, 324.6, 446.3, 487][tier] * factor * 10) / 10;
  const monthlyD = Math.round([0, 14.5, 37.5, 60.4, 83.3, 91][tier] * factor * 10) / 10;
  const annualB = finiteDollars(monthlyB * partBMonths, "Annual Part B IRMAA");
  const annualD = finiteDollars(monthlyD * partDMonths, "Annual Part D IRMAA");
  return Object.freeze({ dataYear: 2026, premiumYear, incomeYear: income.taxYear, magi: income.magi,
    filing: income.filing, isProjection: premiumYear !== 2026, tier,
    thresholds: Object.freeze([...lower, top]), monthlyB, monthlyD, partBMonths, partDMonths,
    annualB, annualD, total: annualB + annualD });
}
