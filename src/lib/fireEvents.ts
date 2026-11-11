/**
 * Life events for the FIRE calculator: dated changes in spending and income, and one-time costs.
 * All amounts are in today's dollars; the calculator inflates them to the year they happen.
 *
 *  - "one-time": a single cost at `startAge` (a down payment, a wedding, a car).
 *  - "spending": spending changes by `amount` dollars a month from `startAge` through `endAge` (positive = more spending).
 *  - "income":   take-home income changes by `amount` dollars a year from `startAge` through `endAge`
 *                (Social Security, a pension, part-time work, a raise or a pay cut as a negative amount).
 *
 * `endAge` of 0 means the change never ends.
 */
export type LifeEventKind = "one-time" | "spending" | "income";

export type LifeEvent = Readonly<{
  id: string;
  label: string;
  kind: LifeEventKind;
  startAge: number;
  endAge: number;
  amount: number;
}>;

export const MAX_LIFE_EVENTS = 6;

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Events with usable numbers; the rest are ignored so a half-typed row never changes the result. */
export function usableEvents(events: readonly LifeEvent[] | undefined): LifeEvent[] {
  return (events ?? []).filter((e) => num(e.amount) !== 0 && num(e.startAge) > 0 && (e.kind === "one-time" || e.endAge === 0 || e.endAge >= e.startAge));
}

const activeAt = (e: LifeEvent, age: number) =>
  e.kind === "one-time" ? age === e.startAge : age >= e.startAge && (e.endAge === 0 || age <= e.endAge);

/**
 * Net cash the events add in the year you are `age`, in today's dollars: income changes, minus spending changes, minus one-time costs.
 * Negative means the year costs more than it otherwise would.
 */
export function eventCashAt(events: readonly LifeEvent[] | undefined, age: number): number {
  let cash = 0;
  for (const e of usableEvents(events)) {
    if (!activeAt(e, age)) continue;
    if (e.kind === "income") cash += e.amount;
    else if (e.kind === "spending") cash -= e.amount * 12;
    else cash -= e.amount;
  }
  return cash;
}

/**
 * What the events mean for the portfolio needed to stop working at `fireAge`, in today's dollars:
 *
 *  - `perpetual`: the yearly amount the portfolio must cover for good, added to (or taken off) normal spending. It is the net of
 *    the changes that never end: lasting extra spending raises it, lasting income such as Social Security lowers it.
 *  - `bridge`: a lump sum for everything that differs from that lasting level after `fireAge`: one-time costs still to come,
 *    temporary spending or income, and the years before a lasting change starts. No investment growth is assumed on it.
 */
export function eventTarget(events: readonly LifeEvent[] | undefined, fireAge: number): { perpetual: number; bridge: number } {
  const list = usableEvents(events);
  if (list.length === 0) return { perpetual: 0, bridge: 0 };
  let perpetual = 0;
  let lastAge = fireAge;
  for (const e of list) {
    if (e.kind !== "one-time" && e.endAge === 0) perpetual += e.kind === "spending" ? e.amount * 12 : -e.amount;
    lastAge = Math.max(lastAge, e.startAge, e.endAge);
  }
  // After lastAge every temporary event is over and every lasting one has begun, so each later year equals the lasting level.
  let bridge = 0;
  for (let age = Math.ceil(fireAge); age <= lastAge; age++) bridge += -eventCashAt(list, age) - perpetual;
  return { perpetual, bridge };
}

/** One line describing an event, for the results summary. */
export function describeEvent(e: LifeEvent): string {
  const money = `$${Math.abs(Math.round(e.amount)).toLocaleString("en-US")}`;
  const name = e.label.trim() || (e.kind === "one-time" ? "One-time cost" : e.kind === "spending" ? "Spending change" : "Income change");
  if (e.kind === "one-time") return `${name}: ${money} at age ${e.startAge}`;
  const span = e.endAge === 0 ? `from age ${e.startAge}` : `ages ${e.startAge} to ${e.endAge}`;
  if (e.kind === "spending") return `${name}: ${e.amount >= 0 ? "+" : "-"}${money} a month of spending, ${span}`;
  return `${name}: ${e.amount >= 0 ? "+" : "-"}${money} a year of take-home income, ${span}`;
}
