import { DEFAULT_PATHS, withdrawalSuccessRate } from "./monteCarlo";

/**
 * The largest level real withdrawal (today's dollars, taken at the start of each year) that lasts `horizon` years in at least `target`
 * of the simulated markets (0 to 1). The answer depends on the model: the expected return, the volatility and the number of paths. The
 * simulation uses a fixed seed, so the same inputs always give the same answer, and the search reuses the same random draws at every
 * step, so the success rate only falls as the withdrawal rises and a bisection finds the boundary.
 */
export function solveWithdrawalForSuccess(opts: {
  startBalance: number;
  horizon: number;
  realReturn: number;
  volatility: number;
  target: number;
  nPaths?: number;
  seed?: number;
}): { withdrawal: number; successRate: number } {
  const start = Math.max(0, opts.startBalance);
  const horizon = Math.max(1, Math.round(opts.horizon));
  if (start <= 0) return { withdrawal: 0, successRate: 1 };
  const maxYears = Math.max(horizon, 30);
  const rate = (w: number) =>
    withdrawalSuccessRate({ startBalance: start, annualWithdrawal: w, realReturn: opts.realReturn, volatility: opts.volatility, maxYears, horizon, nPaths: opts.nPaths ?? DEFAULT_PATHS, seed: opts.seed });
  const target = Math.min(1, Math.max(0, opts.target));
  if (rate(start) >= target) return { withdrawal: start, successRate: rate(start) };
  let lo = 0;
  let hi = start;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (rate(mid) >= target) lo = mid;
    else hi = mid;
  }
  return { withdrawal: lo, successRate: rate(lo) };
}

/**
 * The gross withdrawal needed so that, after income tax, `afterTaxTarget` is left to spend. `taxOn` returns the income tax on a gross
 * withdrawal; it must not fall as the withdrawal rises (true of income tax), which lets a bisection find the answer.
 */
export function grossForAfterTax(afterTaxTarget: number, taxOn: (gross: number) => number): number {
  if (!(afterTaxTarget > 0)) return 0;
  let lo = afterTaxTarget;
  let hi = afterTaxTarget * 3 + 10000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (mid - taxOn(mid) >= afterTaxTarget) hi = mid;
    else lo = mid;
  }
  return hi;
}
