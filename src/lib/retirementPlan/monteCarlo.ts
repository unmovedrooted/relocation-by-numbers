import { mulberry32 } from "../monteCarlo";
import { runRetirementTimeline, type TimelineInput } from "./timeline";

export type HouseholdSimulationRequest = Readonly<{
  paths: number;
  seed: number;
  /** Arithmetic standard deviations of annual nominal returns, as decimals.
   * Supply every non-cash/non-annuity account, including explicit zeroes. */
  volatilityByAccount: Readonly<Record<string, number>>;
  /** One normal shock shared across invested accounts in each year; independent
   * years. This is an explicit single-market assumption, not diversification. */
  returnModel: "lognormal-shared-market-nominal";
  conversionPolicy: "fixed-input-schedule";
}>;

function normal(random: () => number) {
  // 1-random is in (0,1], including when the generator returns zero.
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

/** Arithmetic mean/stdev calibration of 1+R. No real/nominal subtraction here.
 * https://www.itl.nist.gov/div898/handbook/eda/section3/eda3669.htm */
export function nominalReturnDraw(mean: number, volatility: number, shock: number) {
  if (!Number.isFinite(mean) || mean <= -1 || mean > 10 || !Number.isFinite(volatility)
    || volatility < 0 || volatility > 1 || !Number.isFinite(shock)) throw new RangeError("Invalid nominal return assumptions.");
  if (volatility === 0) return mean; // Exact deterministic reconciliation.
  const variance = Math.log1p((volatility / (1 + mean)) ** 2);
  const result = Math.expm1(Math.log1p(mean) - variance / 2 + Math.sqrt(variance) * shock);
  // Preserve the settlement engine's numerical domain. Never clamp or resample.
  if (!Number.isFinite(result) || result < -1 || result > 10) throw new RangeError("Simulated return exceeds the settlement engine's supported range.");
  return result;
}

function band(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = (p: number) => {
    const index = (sorted.length - 1) * p, low = Math.floor(index), high = Math.ceil(index);
    return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
  };
  return { p10: percentile(.1), p50: percentile(.5), p90: percentile(.9) };
}

/** Pure bounded engine; a UI should call this in a terminable Web Worker.
 * Errors abort the run, not the denominator. Unfunded paths remain in all bands. */
export function simulateHousehold(input: TimelineInput, request: HouseholdSimulationRequest,
  onProgress?: (completed: number) => void) {
  if (!Number.isInteger(request.paths) || request.paths < 1 || request.paths > 1000
    || !Number.isInteger(request.seed) || request.seed < 0 || request.seed > 0xffffffff) throw new RangeError("Use 1–1000 paths and an unsigned 32-bit seed.");
  if (request.returnModel !== "lognormal-shared-market-nominal"
    || request.conversionPolicy !== "fixed-input-schedule") throw new RangeError("Explicit simulation policies are required.");
  if (input.annualReturnsByYear !== undefined) throw new RangeError("Monte Carlo cannot replace an existing return path.");
  if ((input.endYear - input.startYear + 1) * input.accounts.length * request.paths > 2_000_000) throw new RangeError("Simulation exceeds the account-year work limit.");
  const invested = input.accounts.filter(account => account.kind !== "cash" && account.kind !== "annuity");
  if (Object.keys(request.volatilityByAccount).length !== invested.length
    || invested.some(account => !Object.hasOwn(request.volatilityByAccount, account.id))) throw new RangeError("Supply volatility for every invested account, and no cash/annuity or unknown accounts.");
  for (const account of invested) nominalReturnDraw(account.annualReturn, request.volatilityByAccount[account.id], 0);
  const deterministic = runRetirementTimeline(input); // Retain all existing validation.
  const columns = deterministic.years.map(() => [] as number[]);
  const realColumns = deterministic.years.map(() => [] as number[]);
  const firstFailures: Record<number, number> = {};
  let successfulPaths = 0;
  const random = mulberry32(request.seed);
  for (let path = 0; path < request.paths; path++) {
    const annualReturnsByYear: Record<number, Record<string, number>> = {};
    for (let year = input.startYear; year <= input.endYear; year++) {
      const shock = normal(random);
      annualReturnsByYear[year] = Object.fromEntries(input.accounts.map(account => [account.id,
        account.kind === "cash" || account.kind === "annuity" ? account.annualReturn
          : nominalReturnDraw(account.annualReturn, request.volatilityByAccount[account.id], shock)]));
    }
    const result = runRetirementTimeline({ ...input, annualReturnsByYear });
    if (result.allYearsFunded && result.allRmdsSatisfied) successfulPaths++;
    else {
      const failure = result.years.find(row => !row.result.cash.spendingFunded || !row.result.cash.requiredWithdrawalsSatisfied)!;
      firstFailures[failure.year] = (firstFailures[failure.year] ?? 0) + 1;
    }
    result.years.forEach((row, index) => {
      columns[index].push(row.endingPortfolio);
      realColumns[index].push(row.endingPortfolioInStartYearDollars);
    });
    onProgress?.(path + 1);
  }
  return {
    paths: request.paths, seed: request.seed, successfulPaths, successRate: successfulPaths / request.paths,
    firstFailures,
    byYear: deterministic.years.map((row, index) => ({ year: row.year,
      nominal: band(columns[index]), todayDollars: band(realColumns[index]) })),
    warnings: [...deterministic.warnings,
      "Simulation frequency is conditional on assumptions, not a guarantee or a calibrated forecast probability.",
      "Nominal lognormal returns use independent years and one shared normal market shock across invested accounts; no independent-account diversification is assumed. Cash and annuity returns stay fixed.",
      "Returns on brokerage/ESPP accounts are price-only; dividends remain separately supplied income. Fees and extra stochastic income are not invented.",
      "Manual conversion dollar schedules stay fixed on every path; no bracket-strategy optimization is rerun. Unsupported path errors abort the entire run.",
      "Annual percentiles include unfunded paths and are cross-sectional balances, not one investable trajectory. Existing spending, tax, RMD, basis, and IRMAA timing applies unchanged."],
  };
}
