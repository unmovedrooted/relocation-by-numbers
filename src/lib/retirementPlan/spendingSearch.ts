import { simulateHousehold, type HouseholdSimulationRequest } from "./monteCarlo";
import type { TimelineInput } from "./timeline";

export type SpendingSearchRequest = Readonly<{
  /** Today's-dollars, first-year annual household spending. Inclusive lower bound. */
  minSpending: number;
  /** Today's-dollars, first-year annual household spending. Inclusive upper bound. */
  maxSpending: number;
  /** Whole-dollar precision to search to; the answer may be off by up to this amount. */
  resolution: number;
  /** Decimal success-rate threshold, e.g. 0.9 for 90%. No default is silently chosen. */
  successTarget: number;
  /** Reused unchanged for every candidate spending level, so only spending varies. */
  simulation: HouseholdSimulationRequest;
}>;

export type SpendingSearchCandidate = Readonly<{ spending: number; successRate: number }>;

export type SpendingSearchFound = Readonly<{
  spending: number;
  successRate: number;
  /** Full Monte Carlo result for the winning spending level, for charting/inspection. */
  simulation: ReturnType<typeof simulateHousehold>;
}>;

export type SpendingSearchResult = Readonly<{
  /** Highest tested spending level whose simulated success rate met the target.
   * Null when even the minimum of the requested range failed to meet it. */
  found: SpendingSearchFound | null;
  /** Every candidate actually simulated, in the order tested. */
  tested: readonly SpendingSearchCandidate[];
  warnings: readonly string[];
}>;

const MAX_ITERATIONS = 30;

/**
 * Finds the highest annual household spending level (today's dollars, first
 * year) whose Monte Carlo success rate meets the requested target, by
 * bisecting the requested [minSpending, maxSpending] range at the requested
 * dollar resolution. Every candidate reuses the exact same seed, path count,
 * return model and volatility assumptions from `request.simulation`, so only
 * spending varies between runs, keeping the comparison fair.
 *
 * This is a bounded search over the requested range, not a global solver.
 * The result is the highest spending FOUND within that range and resolution;
 * it is never asserted to be a true, unconditional maximum. Success rate is
 * not proven monotonic in spending, so a warning is added if the tested
 * points contradict that assumption.
 */
export function searchMaxSustainableSpending(
  input: TimelineInput,
  request: SpendingSearchRequest,
  onProgress?: (completed: number, total: number) => void,
): SpendingSearchResult {
  const { minSpending, maxSpending, resolution, successTarget, simulation } = request;
  if (!Number.isFinite(minSpending) || minSpending < 0) throw new RangeError("Minimum spending must be a finite dollar amount of at least $0.");
  if (!Number.isFinite(maxSpending) || maxSpending <= minSpending) throw new RangeError("Maximum spending must be a finite amount greater than the minimum.");
  if (!Number.isInteger(resolution) || resolution < 1) throw new RangeError("Resolution must be a whole dollar amount of at least $1.");
  if (resolution > maxSpending - minSpending) throw new RangeError("Resolution must be smaller than the requested spending range.");
  if (!Number.isFinite(successTarget) || successTarget <= 0 || successTarget > 1) throw new RangeError("Success target must be a decimal greater than 0 and at most 1.");
  if (input.annualReturnsByYear !== undefined) throw new RangeError("Spending search cannot run against an existing fixed return path.");

  const minUnits = Math.round(minSpending / resolution);
  const maxUnits = Math.round(maxSpending / resolution);
  if (maxUnits <= minUnits) throw new RangeError("Resolution is too coarse for the requested spending range.");
  const iterationsNeeded = Math.ceil(Math.log2(maxUnits - minUnits));
  if (iterationsNeeded > MAX_ITERATIONS) throw new RangeError("Requested range and resolution require too many simulated candidates; use a narrower range or a coarser resolution.");

  const totalSteps = iterationsNeeded + 2; // initial low/high checks, then bisection.
  const tested: SpendingSearchCandidate[] = [];
  let completed = 0;

  function evaluate(units: number) {
    const spending = units * resolution;
    const result = simulateHousehold({ ...input, spendingAnnual: spending }, simulation);
    completed++;
    tested.push({ spending, successRate: result.successRate });
    onProgress?.(completed, totalSteps);
    return { spending, successRate: result.successRate, result };
  }

  const warnings = [
    "This is the highest spending level found within the tested range and resolution, not a proven maximum.",
    "Every candidate reuses the same seed, path count, return model and volatility assumptions; only spending varies, for a fair comparison.",
  ];

  const low0 = evaluate(minUnits);
  if (low0.successRate < successTarget) {
    return Object.freeze({ found: null, tested: Object.freeze(tested), warnings: Object.freeze([...warnings,
      `No spending level from $${minSpending.toLocaleString()} up met the ${(successTarget * 100).toFixed(0)}% success target; even the minimum failed.`]) });
  }

  const high0 = evaluate(maxUnits);
  let best = low0;
  if (high0.successRate >= successTarget) {
    best = high0;
  } else {
    let low = minUnits, high = maxUnits; // low always met the target; high never has.
    for (let iteration = 0; high - low > 1 && iteration < MAX_ITERATIONS; iteration++) {
      const mid = low + Math.ceil((high - low) / 2);
      const candidate = evaluate(mid);
      if (candidate.successRate >= successTarget) { low = mid; best = candidate; } else { high = mid; }
    }
  }

  const bySpending = [...tested].sort((a, b) => a.spending - b.spending);
  const monotonic = bySpending.every((candidate, index) => index === 0 || candidate.successRate <= bySpending[index - 1].successRate + 1e-9);
  if (!monotonic) warnings.push("Tested success rates were not strictly non-increasing with spending; treat the result as approximate.");

  return Object.freeze({
    found: Object.freeze({ spending: best.spending, successRate: best.successRate, simulation: best.result }),
    tested: Object.freeze(tested),
    warnings: Object.freeze(warnings),
  });
}
