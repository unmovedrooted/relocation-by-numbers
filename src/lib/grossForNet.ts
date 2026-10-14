/**
 * The gross income that leaves a wanted net income after a progressive tax.
 *
 * Dividing the wanted net by (1 - the effective rate at the current income) understates the gross needed when the wanted net
 * puts you in a higher bracket (and overstates it when it puts you in a lower one), so this solves
 * gross * (1 - rate(gross)) = net by bisection. `rateAt` returns the effective tax rate (0 to 1) at a gross income, in any
 * currency as long as the same currency is used for the net and the gross.
 */
export function grossForNet(netWanted: number, rateAt: (gross: number) => number): number {
  if (!Number.isFinite(netWanted) || netWanted <= 0) return 0;
  const netAt = (gross: number) => {
    const rate = Math.min(Math.max(rateAt(gross), 0), 1);
    return gross * (1 - rate);
  };
  let lo = netWanted; // gross is never below the wanted net
  let hi = netWanted * 2;
  for (let i = 0; i < 40 && netAt(hi) < netWanted; i++) hi *= 2;
  if (netAt(hi) < netWanted) return 0; // tax takes (nearly) everything at any income: no answer
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (netAt(mid) < netWanted) lo = mid; else hi = mid;
  }
  return hi;
}
