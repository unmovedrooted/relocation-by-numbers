/** Scenario projection from a published/verified base, NOT future tax law.
 * Compound from the original base without losing fractional growth each year.
 * Increment rounding applies to cumulative increases, preserving the base.
 */
export function projectThreshold(base: number, year: number, baseYear: number, annualGrowth: number, increment: number, rounding: "down" | "nearest" = "down") {
  if (!Number.isFinite(base) || base < 0 || base > 1e12 || !Number.isInteger(year) || !Number.isInteger(baseYear)
    || baseYear < 2026 || year < baseYear || year > 2126 || !Number.isFinite(annualGrowth) || annualGrowth < 0 || annualGrowth > .2
    || !Number.isFinite(increment) || increment <= 0 || !["down", "nearest"].includes(rounding)) throw new RangeError("Invalid threshold projection inputs.");
  const increase = base * ((1 + annualGrowth) ** (year - baseYear) - 1);
  const steps = increase / increment;
  // Only compensate for machine precision at an exact increment boundary.
  const result = base + Math.floor(steps + (rounding === "nearest" ? .5 : 0)
    + 8 * Number.EPSILON * Math.max(1, base / increment, Math.abs(steps))) * increment;
  if (!Number.isFinite(result) || result > 1e12) throw new RangeError("Projected threshold exceeds supported bounds.");
  return result;
}

/** IRC 219(g)(8), 408A(c)(3): nearest $1,000 increases; band widths are fixed.
 * Published rounded 2026 bases + scenario growth, not a forecast of IRS tables.
 */
export function projectedIraThresholds(year: number, annualGrowth: number) {
  const start = (base: number) => projectThreshold(base, year, 2026, annualGrowth, 1000, "nearest");
  const range = (base: number, width: number) => Object.freeze([start(base), start(base) + width] as const);
  return Object.freeze({ rothSingle: range(153000, 15000), rothMarried: range(242000, 10000),
    deductionSingle: range(81000, 10000), deductionMarried: range(129000, 20000),
    deductionSpouseCovered: range(242000, 10000) });
}

export function projectedContributionLimits(year: number, annualGrowth: number) {
  const project = (base: number, increment: number) => projectThreshold(base, year, 2026, annualGrowth, increment);
  return Object.freeze({ baseYear: 2026, year, isProjection: year !== 2026, annualGrowth,
    iraRegular: project(7500, 500), iraCatchUp: project(1100, 100),
    planRegular: project(24500, 500), planCatchUp: project(8000, 500),
    planCatchUpAge60To63: project(11250, 500) });
}
