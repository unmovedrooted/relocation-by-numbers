/**
 * When a move pays back its upfront cost: the first year in which the portfolio on the "move" path is at least the portfolio on the
 * "stay" path. Both series are year-end balances starting at year 0 (today, after the moving cost has been paid on the move path).
 *
 * Returns 0 when the move path is not behind at the start, the year number when it catches up, or null when it never does within
 * the series.
 */
export function breakEvenYear(stay: readonly number[], moved: readonly number[]): number | null {
  const n = Math.min(stay.length, moved.length);
  for (let y = 0; y < n; y++) {
    if (moved[y] >= stay[y]) return y;
  }
  return null;
}
