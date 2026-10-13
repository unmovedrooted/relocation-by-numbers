import type { StateCode } from "./states";
import type { FilingStatus } from "./tax";
import { estimateNetAnnual, EMPLOYEE_401K_LIMIT } from "./wageTax";

/**
 * Before-and-after comparison for a move: what the household keeps each month now, what it would keep after the
 * move, why the two differ, what the move costs up front, and how wide the answer could reasonably be.
 */

/** A dollar amount and whether the user typed it or the site estimated it. Only estimated amounts get a range. */
export type Item = Readonly<{ amount: number; estimated: boolean }>;

/** How far an estimated figure may be off, as a share of the figure. These are planning assumptions, not statistics. */
export const RANGE_SPREAD = { housing: 0.10, living: 0.15, oneTime: 0.25 } as const;

export type OneTimeCosts = Readonly<{
  /** Movers or truck. */
  movers: Item;
  /** Travel, storage and other trip costs. */
  travel: Item;
  /** Furniture and setup. */
  setup: Item;
  /** Fee for ending the current lease early. */
  leaseBreak: Item;
  /** Application, broker, pet and other fees that are not returned. */
  fees: Item;
  /** Months the household pays rent or a mortgage in both places. */
  overlapMonths: number;
  /** Deposit paid at the new home that is returned when the household leaves. */
  refundableDeposit: Item;
  /** Down payment when buying: cash that must be on hand but becomes home equity, so it is not a cost of the move. */
  downPayment?: Item;
}>;

export type MoveInputs = Readonly<{
  filing: FilingStatus;
  k401Pct1: number;
  k401Pct2: number;
  currentIncome1: number;
  currentIncome2: number;
  offerIncome1: number;
  offerIncome2: number;
  currentState: StateCode;
  currentCityId: string;
  targetState: StateCode;
  targetCityId: string;
  /** Monthly housing cost now and after the move. */
  currentHousing: Item;
  targetHousing: Item;
  /** Monthly non-housing living costs now and after the move. */
  currentLiving: Item;
  targetLiving: Item;
  oneTime: OneTimeCosts;
}>;

export type MoveScenario = Readonly<{
  monthlyChange: number;
  /** Twelve months of the monthly change minus the one-time costs that are spent (deposits that come back are excluded). */
  firstYearImpact: number;
  /** One-time costs that are spent. */
  spentOneTime: number;
  /** Cash needed before and at the move: spent costs plus the refundable deposit. */
  cashUpfront: number;
  /** Months of positive monthly change needed to earn back the spent costs; null when the monthly change is not positive. */
  monthsToRecover: number | null;
}>;

export type MoveBreakdown = Readonly<{
  /** Change in pay after tax, with taxes still those of the current location. */
  salary: number;
  /** Change in taxes from moving the tax residence, on the offered pay. */
  taxes: number;
  /** Negative when housing costs more after the move. */
  housing: number;
  /** Negative when everyday costs more after the move. */
  otherCosts: number;
}>;

export type MoveResult = Readonly<{
  currentNetMonthly: number;
  offerNetMonthly: number;
  currentLeftover: number;
  targetLeftover: number;
  expected: MoveScenario;
  low: MoveScenario;
  high: MoveScenario;
  breakdown: MoveBreakdown;
  /** Names of estimated figures, so the page can ask the user to replace them. */
  estimatedItems: readonly string[];
}>;

/** Household take-home for a year. Each earner's 401(k) is capped on their own wages (IRS elective deferral limit). */
export function householdNetAnnual(
  income1: number,
  income2: number,
  state: StateCode,
  filing: FilingStatus,
  k401Pct1: number,
  k401Pct2: number,
  cityId: string,
): number {
  if (income2 === 0) return estimateNetAnnual({ grossAnnual: income1, state, filing, k401Pct: k401Pct1, cityId });
  if (filing === "married") {
    const k1 = Math.min(income1 * (k401Pct1 / 100), EMPLOYEE_401K_LIMIT);
    const k2 = Math.min(income2 * (k401Pct2 / 100), EMPLOYEE_401K_LIMIT);
    return estimateNetAnnual({
      grossAnnual: income1 + income2, state, filing: "married", k401Pct: 0, k401Dollar: k1 + k2,
      earnerWages: [income1, income2], cityId,
    });
  }
  return (
    estimateNetAnnual({ grossAnnual: income1, state, filing: "single", k401Pct: k401Pct1, cityId }) +
    estimateNetAnnual({ grossAnnual: income2, state, filing: "single", k401Pct: k401Pct2, cityId })
  );
}

/** An estimated amount moved by `shift` of itself; an amount the user entered never moves. */
const adj = (item: Item, shift: number): number => (item.estimated ? item.amount * (1 + shift) : item.amount);

function oneTimeTotals(o: OneTimeCosts, targetHousingMonthly: number, spread: number) {
  const spent =
    adj(o.movers, spread) + adj(o.travel, spread) + adj(o.setup, spread) + adj(o.leaseBreak, spread) + adj(o.fees, spread) +
    Math.max(0, o.overlapMonths) * targetHousingMonthly;
  const refundable = adj(o.refundableDeposit, spread) + (o.downPayment ? adj(o.downPayment, spread) : 0);
  return { spent, cash: spent + refundable };
}

function scenario(
  netChangeMonthly: number,
  i: MoveInputs,
  /** +1 = costs come in higher than expected, -1 = lower, 0 = as estimated. */
  direction: -1 | 0 | 1,
): MoveScenario {
  const targetHousing = adj(i.targetHousing, direction * RANGE_SPREAD.housing);
  const targetLiving = adj(i.targetLiving, direction * RANGE_SPREAD.living);
  // The current costs are what the household pays now: if they are estimates, the bad case is that they were lower.
  const currentHousing = adj(i.currentHousing, -direction * RANGE_SPREAD.housing);
  const currentLiving = adj(i.currentLiving, -direction * RANGE_SPREAD.living);
  const monthlyChange = netChangeMonthly - (targetHousing - currentHousing) - (targetLiving - currentLiving);
  const { spent, cash } = oneTimeTotals(i.oneTime, targetHousing, direction * RANGE_SPREAD.oneTime);
  return {
    monthlyChange,
    firstYearImpact: monthlyChange * 12 - spent,
    spentOneTime: spent,
    cashUpfront: cash,
    monthsToRecover: monthlyChange > 0 ? Math.ceil(spent / monthlyChange) : spent === 0 ? 0 : null,
  };
}

export function compareMove(i: MoveInputs): MoveResult {
  const net = (inc1: number, inc2: number, state: StateCode, cityId: string) =>
    householdNetAnnual(inc1, inc2, state, i.filing, i.k401Pct1, i.k401Pct2, cityId) / 12;

  const currentNet = net(i.currentIncome1, i.currentIncome2, i.currentState, i.currentCityId);
  const offerNetAtCurrent = net(i.offerIncome1, i.offerIncome2, i.currentState, i.currentCityId);
  const offerNet = net(i.offerIncome1, i.offerIncome2, i.targetState, i.targetCityId);

  const netChange = offerNet - currentNet;
  const expected = scenario(netChange, i, 0);

  const breakdown: MoveBreakdown = {
    salary: offerNetAtCurrent - currentNet,
    taxes: offerNet - offerNetAtCurrent,
    housing: -(i.targetHousing.amount - i.currentHousing.amount),
    otherCosts: -(i.targetLiving.amount - i.currentLiving.amount),
  };

  const estimatedItems: string[] = [];
  if (i.currentHousing.estimated) estimatedItems.push("currentHousing");
  if (i.targetHousing.estimated) estimatedItems.push("targetHousing");
  if (i.currentLiving.estimated) estimatedItems.push("currentLiving");
  if (i.targetLiving.estimated) estimatedItems.push("targetLiving");
  for (const [k, v] of Object.entries(i.oneTime)) {
    if (typeof v === "object" && v.estimated) estimatedItems.push(k);
  }

  return {
    currentNetMonthly: currentNet,
    offerNetMonthly: offerNet,
    currentLeftover: currentNet - i.currentHousing.amount - i.currentLiving.amount,
    targetLeftover: offerNet - i.targetHousing.amount - i.targetLiving.amount,
    expected,
    low: scenario(netChange, i, 1),
    high: scenario(netChange, i, -1),
    breakdown,
    estimatedItems,
  };
}
