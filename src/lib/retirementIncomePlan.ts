/**
 * The retirement income picture for the Retirement Calculator: portfolio withdrawals plus Social Security and a pension,
 * the income tax on all of it, and how that compares with a spending target. All amounts are yearly and in today's dollars.
 *
 * The tax comes from the caller (the planner's household engine through retireeIncomeTax), so this file is plain arithmetic.
 */
export type RetirementIncomePlan = Readonly<{
  /** Portfolio withdrawals, Social Security and pension before tax. */
  grossAnnual: number;
  /** Federal plus state income tax, or null when it could not be estimated. */
  taxAnnual: number | null;
  afterTaxAnnual: number;
  afterTaxMonthly: number;
  /** After-tax monthly income minus the monthly spending target; null without a target. Negative means a shortfall. */
  gapMonthly: number | null;
  /** After-tax income as a share of the target, 0 to 1 and above; null without a target. */
  coverage: number | null;
  /** Extra savings that would close a shortfall at the withdrawal rate used, before tax; 0 when there is none, null without a target. */
  extraSavingsNeeded: number | null;
}>;

export function retirementIncomePlan(opts: {
  portfolioIncomeAnnual: number;
  socialSecurityAnnual: number;
  pensionAnnual: number;
  /** Monthly spending target; 0 or less means none was entered. */
  spendingTargetMonthly: number;
  /** Withdrawal rate behind portfolioIncomeAnnual, as a decimal (0.04 for the 4% rule). */
  withdrawalRate: number;
  taxAnnual: number | null;
}): RetirementIncomePlan {
  const grossAnnual = Math.max(0, opts.portfolioIncomeAnnual) + Math.max(0, opts.socialSecurityAnnual) + Math.max(0, opts.pensionAnnual);
  const afterTaxAnnual = grossAnnual - (opts.taxAnnual ?? 0);
  const afterTaxMonthly = afterTaxAnnual / 12;
  const target = opts.spendingTargetMonthly;
  if (!(target > 0)) return { grossAnnual, taxAnnual: opts.taxAnnual, afterTaxAnnual, afterTaxMonthly, gapMonthly: null, coverage: null, extraSavingsNeeded: null };
  const gapMonthly = afterTaxMonthly - target;
  const extraSavingsNeeded = gapMonthly < 0 && opts.withdrawalRate > 0 ? (-gapMonthly * 12) / opts.withdrawalRate : 0;
  return { grossAnnual, taxAnnual: opts.taxAnnual, afterTaxAnnual, afterTaxMonthly, gapMonthly, coverage: afterTaxMonthly / target, extraSavingsNeeded };
}

/** A spending target moved to another state: scaled by the ratio of the two states' overall price levels. Unchanged when either is missing. */
export function spendingInOtherState(targetMonthly: number, priceLevelHere: number | null | undefined, priceLevelThere: number | null | undefined): number {
  if (!(targetMonthly > 0)) return 0;
  if (!priceLevelHere || !priceLevelThere || priceLevelHere <= 0 || priceLevelThere <= 0) return targetMonthly;
  return targetMonthly * (priceLevelThere / priceLevelHere);
}
