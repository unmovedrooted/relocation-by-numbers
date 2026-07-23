// ─────────────────────────────────────────────────────────────────────────
// MONTE CARLO ENGINE (seeded, reproducible)
//
// Models market volatility and sequence-of-returns risk by running many
// simulated market "lifetimes." Annual real returns are drawn from a
// lognormal distribution calibrated so the arithmetic mean equals the user's
// expected real return and the standard deviation equals the chosen
// volatility. Everything runs in real (today's-dollar) terms, consistent with
// the deterministic calculators. A fixed seed makes results reproducible so
// shared links and saved scenarios reproduce exactly and the numbers don't
// jitter between renders.
// ─────────────────────────────────────────────────────────────────────────

export const DEFAULT_SEED = 0x9e3779b1;
export const DEFAULT_PATHS = 5000;

// Deterministic PRNG. Same seed → same stream.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard normal via Box–Muller.
function nextNormal(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Lognormal params for annual (1 + return) matching arithmetic mean & stdev.
function lognormalParams(meanReturn: number, stdev: number): { mu: number; sigma: number } {
  const M = 1 + meanReturn;
  const S = Math.max(0, stdev);
  if (M <= 0 || S === 0) return { mu: Math.log(Math.max(1e-9, M)), sigma: 0 };
  const variance = Math.log(1 + (S * S) / (M * M));
  const sigma = Math.sqrt(variance);
  const mu = Math.log(M) - variance / 2;
  return { mu, sigma };
}

export type Percentiles = { p10: number; p50: number; p90: number };
export type YearBand = { year: number; p10: number; p50: number; p90: number };

// Percentile of an ascending-sorted array (linear interpolation).
function percentileSorted(sorted: Float64Array, p: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  if (n === 1) return sorted[0];
  const idx = (p / 100) * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ── Risk presets: volatility (stdev of annual real returns). Expected return
// stays whatever the user entered, so the Monte Carlo mean reconciles with the
// deterministic view; the preset only sets how much the market swings. ──
export type RiskLevel = "conservative" | "balanced" | "aggressive" | "custom";
export const RISK_PRESETS: Record<Exclude<RiskLevel, "custom">, { label: string; volatilityPct: number; blurb: string }> = {
  conservative: { label: "Conservative", volatilityPct: 8, blurb: "Bond-heavy — smaller swings" },
  balanced: { label: "Balanced", volatilityPct: 13, blurb: "Mixed stocks & bonds" },
  aggressive: { label: "Aggressive", volatilityPct: 18, blurb: "Mostly stocks — bigger swings" },
};

// ─────────────────────────────────────────────────────────────────────────
// ACCUMULATION: contribute at start of each year, then a random year of growth.
// ─────────────────────────────────────────────────────────────────────────
export function accumulationPaths(opts: {
  startBalance: number;
  annualContribution: number;
  realReturn: number;
  volatility: number;
  years: number;
  nPaths?: number;
  seed?: number;
}): { endingBalance: Percentiles; mean: number; byYear: YearBand[] } {
  const start = Math.max(0, opts.startBalance);
  const contribution = Math.max(0, opts.annualContribution);
  const years = Math.max(0, Math.round(opts.years));
  const nPaths = Math.max(1, opts.nPaths ?? DEFAULT_PATHS);
  const { mu, sigma } = lognormalParams(opts.realReturn, opts.volatility);
  const rng = mulberry32(opts.seed ?? DEFAULT_SEED);

  // yearCols[y] holds every path's balance at year y (0..years).
  const yearCols: Float64Array[] = Array.from({ length: years + 1 }, () => new Float64Array(nPaths));
  let sumEnding = 0;

  for (let p = 0; p < nPaths; p++) {
    let balance = start;
    yearCols[0][p] = balance;
    for (let y = 1; y <= years; y++) {
      balance += contribution;
      const growth = Math.exp(mu + sigma * nextNormal(rng)); // (1 + real return)
      balance *= growth;
      if (balance < 0) balance = 0;
      yearCols[y][p] = balance;
    }
    sumEnding += balance;
  }

  const byYear: YearBand[] = yearCols.map((col, y) => {
    const sorted = col.slice().sort();
    return { year: y, p10: percentileSorted(sorted, 10), p50: percentileSorted(sorted, 50), p90: percentileSorted(sorted, 90) };
  });
  const end = byYear[byYear.length - 1];

  return {
    endingBalance: { p10: end.p10, p50: end.p50, p90: end.p90 },
    mean: sumEnding / nPaths,
    byYear,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// WITHDRAWAL: withdraw a fixed real amount at the start of each year, then a
// random year of growth. Records how long the money lasts and the balance
// path (floored at 0 once depleted).
// ─────────────────────────────────────────────────────────────────────────
export function withdrawalPaths(opts: {
  startBalance: number;
  annualWithdrawal: number;
  realReturn: number;
  volatility: number;
  maxYears: number;
  nPaths?: number;
  seed?: number;
}): {
  yearsLasted: Percentiles;
  meanYears: number;
  byYear: YearBand[];
  successRateAt: (horizon: number) => number;
} {
  const start = Math.max(0, opts.startBalance);
  const W = Math.max(0, opts.annualWithdrawal);
  const maxYears = Math.max(1, Math.round(opts.maxYears));
  const nPaths = Math.max(1, opts.nPaths ?? DEFAULT_PATHS);
  const { mu, sigma } = lognormalParams(opts.realReturn, opts.volatility);
  const rng = mulberry32(opts.seed ?? DEFAULT_SEED);

  const yearCols: Float64Array[] = Array.from({ length: maxYears + 1 }, () => new Float64Array(nPaths));
  const yearsLastedArr = new Float64Array(nPaths);
  let sumYears = 0;

  for (let p = 0; p < nPaths; p++) {
    let balance = start;
    yearCols[0][p] = balance;
    let depletedAt = maxYears; // survived the whole horizon unless set earlier
    let depleted = false;
    for (let y = 1; y <= maxYears; y++) {
      if (!depleted) {
        if (balance < W) {
          depleted = true;
          depletedAt = y - 1; // funded (y-1) full years
          balance = 0;
        } else {
          balance -= W;
          const growth = Math.exp(mu + sigma * nextNormal(rng));
          balance *= growth;
          if (balance < 0) balance = 0;
        }
      } else {
        // keep drawing so every path consumes the same number of randoms —
        // preserves reproducibility/independence across the grid.
        nextNormal(rng);
      }
      yearCols[y][p] = balance;
    }
    yearsLastedArr[p] = depletedAt;
    sumYears += depletedAt;
  }

  const byYear: YearBand[] = yearCols.map((col, y) => {
    const sorted = col.slice().sort();
    return { year: y, p10: percentileSorted(sorted, 10), p50: percentileSorted(sorted, 50), p90: percentileSorted(sorted, 90) };
  });

  const sortedYears = yearsLastedArr.slice().sort();
  const successRateAt = (horizon: number) => {
    const h = Math.max(0, Math.round(horizon));
    let survived = 0;
    for (let i = 0; i < yearsLastedArr.length; i++) if (yearsLastedArr[i] >= h) survived++;
    return survived / yearsLastedArr.length;
  };

  return {
    yearsLasted: {
      p10: percentileSorted(sortedYears, 10),
      p50: percentileSorted(sortedYears, 50),
      p90: percentileSorted(sortedYears, 90),
    },
    meanYears: sumYears / nPaths,
    byYear,
    successRateAt,
  };
}
