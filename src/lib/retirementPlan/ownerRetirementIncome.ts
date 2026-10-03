import type { HouseholdTaxInput } from "./householdTax";

/**
 * Per-owner taxable retirement-account income, from the annual engine's owner-level records.
 * The records must reconcile to the aggregate figure the state module is given, so a household
 * is never silently split evenly between spouses. When earlyDistributionBase is supplied
 * (states that exclude income subject to the federal early-distribution tax), each owner's
 * early-distribution portion is removed from that owner's own total only.
 */
export function ownerRetirementIncome(input: HouseholdTaxInput, retirementOrdinary: number, stateName: string, earlyDistributionBase?: number) {
  const totals = new Map(input.people.map(person => [person.id, 0]));
  const early = new Map(input.people.map(person => [person.id, 0]));
  let attributed = 0;
  let attributedEarly = 0;
  for (const item of input.retirementIncome ?? []) {
    const earlyAmount = item.earlyDistributionTaxable ?? 0;
    if (!totals.has(item.ownerId) || !Number.isFinite(item.amount) || item.amount < 0
      || !Number.isFinite(earlyAmount) || earlyAmount < 0) {
      throw new RangeError(`Invalid ${stateName} retirement income attribution.`);
    }
    attributed += item.amount;
    attributedEarly += earlyAmount;
    totals.set(item.ownerId, totals.get(item.ownerId)! + item.amount);
    early.set(item.ownerId, early.get(item.ownerId)! + earlyAmount);
  }
  if (!Number.isFinite(retirementOrdinary) || retirementOrdinary < 0 || Math.abs(attributed - retirementOrdinary) > 1e-5
    || (earlyDistributionBase !== undefined && Math.abs(attributedEarly - earlyDistributionBase) > 1e-5)) {
    throw new RangeError(`${stateName} requires reconciled owner-level retirement income.`);
  }
  if (earlyDistributionBase === undefined) return totals;
  return new Map([...totals].map(([id, amount]) => [id, Math.max(0, amount - early.get(id)!)]));
}
