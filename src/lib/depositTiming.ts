/**
 * Monthly end-of-month deposits inside an annual-return model.
 *
 * The calculators take an annual return r. A year of twelve equal deposits, each made at the end of its month and each growing at
 * the monthly rate m = (1 + r)^(1/12) - 1 (so twelve months of growth compound to exactly r), is worth
 * (annualContribution / 12) * ((1 + m)^12 - 1) / m = annualContribution * r / (12 * m) at the end of the year.
 *
 * This returns that last multiplier, g(r) = r / (12 * m). It is 1 when r = 0 (nothing is earned, so the deposits are just the
 * total) and a little above 1 when r > 0 (deposits made earlier in the year earn a part-year return). A year then grows as
 *
 *     balance_next = balance * (1 + r) + annualContribution * g(r)
 *
 * Depositing the whole year's contribution on January 1 instead (the old convention) would use (1 + r) in place of g(r).
 */
export function monthlyDepositFactor(annualReturn: number): number {
  if (!Number.isFinite(annualReturn) || annualReturn <= -1) return annualReturn <= -1 ? 1 / 12 : 1;
  if (Math.abs(annualReturn) < 1e-12) return 1;
  const monthly = Math.pow(1 + annualReturn, 1 / 12) - 1;
  return annualReturn / (12 * monthly);
}
