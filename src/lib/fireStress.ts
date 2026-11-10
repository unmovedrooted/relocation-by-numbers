import { withdrawalSuccessRate } from "./monteCarlo";

/**
 * Two honesty checks for a FIRE result: how much the FIRE age moves when markets do not deliver the average return every year,
 * and whether the portfolio lasts once withdrawals start.
 */

export type FireAgeRange = Readonly<{
  /** FIRE age in the better tenth of simulated markets, the middle one, and the worse tenth. null when not reached within the projection. */
  early: number | null;
  median: number | null;
  late: number | null;
  /** Share of simulated markets that reach FIRE within the projection, 0 to 1. */
  reachedShare: number;
  paths: number;
}>;

/** Summarizes years-to-FIRE across simulated markets (null = not reached within the projection). */
export function fireAgeRange(currentAge: number, yearsToFire: readonly (number | null)[]): FireAgeRange {
  const n = yearsToFire.length;
  if (n === 0) return { early: null, median: null, late: null, reachedShare: 0, paths: 0 };
  const sorted = yearsToFire.map((y) => (y === null ? Number.POSITIVE_INFINITY : y)).sort((a, b) => a - b);
  const at = (p: number) => {
    const v = sorted[Math.min(n - 1, Math.max(0, Math.round((p / 100) * (n - 1))))];
    return Number.isFinite(v) ? currentAge + v : null;
  };
  return { early: at(10), median: at(50), late: at(90), reachedShare: sorted.filter(Number.isFinite).length / n, paths: n };
}

export type RetirementStress = Readonly<{
  /** Years the money has to last: from the FIRE age to `endAge`. */
  horizon: number;
  /** Share of simulated markets in which the planned spending lasts the whole horizon, 0 to 1. */
  successRate: number;
  /** The same with spending cut by 10%. */
  successRateTenPctLess: number;
  /** Full years the money lasts if the market falls 30% in the first year and then earns the expected return; null when it lasts the horizon. */
  badStartYears: number | null;
}>;

export const BAD_START_DROP = 0.3;

/**
 * Stress test in today's dollars. The starting portfolio is the FIRE number (spending divided by the withdrawal rate), spending is
 * constant in real terms, and returns are after inflation.
 */
export function retirementStress(opts: {
  annualSpending: number;
  withdrawalRatePct: number;
  /** Expected return after inflation, as a decimal. */
  realReturn: number;
  /** Standard deviation of annual returns, as a decimal. */
  volatility: number;
  fireAge: number;
  endAge?: number;
}): RetirementStress | null {
  const swr = opts.withdrawalRatePct / 100;
  const spending = Math.max(0, opts.annualSpending);
  const horizon = Math.round((opts.endAge ?? 95) - opts.fireAge);
  if (!(swr > 0) || !(spending > 0) || horizon < 1) return null;
  const startBalance = spending / swr;
  const rate = (annualWithdrawal: number) =>
    withdrawalSuccessRate({ startBalance, annualWithdrawal, realReturn: opts.realReturn, volatility: opts.volatility, maxYears: horizon, horizon });

  // A 30% fall in the first year, then the expected return every year after.
  let balance = startBalance;
  let badStartYears: number | null = null;
  for (let y = 1; y <= horizon; y++) {
    if (balance < spending) {
      badStartYears = y - 1;
      break;
    }
    balance = (balance - spending) * (y === 1 ? 1 - BAD_START_DROP : 1 + opts.realReturn);
  }

  return { horizon, successRate: rate(spending), successRateTenPctLess: rate(spending * 0.9), badStartYears };
}
