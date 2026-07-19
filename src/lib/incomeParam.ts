// src/lib/incomeParam.ts
// Shared helper for FIRE calculator pages that accept an `?income=` URL
// param (used to prefill FireCalculator's initialIncome from a relocation
// calculator "See your FIRE number" link).

export function parseIncomeParam(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  // Sanity bound — same order of magnitude as salary inputs elsewhere on the site.
  return Math.min(n, 10_000_000);
}
