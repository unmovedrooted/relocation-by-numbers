import { findCity } from "./cities";
import { STATES, type StateCode } from "./states";
import type { FilingStatus } from "./tax";

/**
 * A move handed from the relocation calculators to the FIRE calculator through URL parameters.
 * Amounts are whole dollars; expenses are monthly and cover housing plus other living costs.
 */
export type FireMoveLink = Readonly<{
  income: number;
  state: StateCode;
  filing: FilingStatus;
  k401Pct: number;
  /** Monthly spending now. */
  expenses: number;
  movedIncome: number;
  movedState: StateCode;
  movedCityId: string;
  /** Monthly spending after the move. */
  movedExpenses: number;
  /** One-time costs that are spent (not refundable deposits or a down payment). */
  movedCost: number;
}>;

const NUM_KEYS = ["income", "k401", "expenses", "movedIncome", "movedExpenses", "movedCost"] as const;

export function buildFireLink(m: FireMoveLink, path = "/fire-calculator"): string {
  const p = new URLSearchParams();
  p.set("move", "1");
  p.set("income", String(Math.round(m.income)));
  p.set("state", m.state);
  p.set("filing", m.filing);
  p.set("k401", String(Math.round(m.k401Pct * 10) / 10));
  p.set("expenses", String(Math.round(m.expenses)));
  p.set("movedIncome", String(Math.round(m.movedIncome)));
  p.set("movedState", m.movedState);
  p.set("movedCity", m.movedCityId);
  p.set("movedExpenses", String(Math.round(m.movedExpenses)));
  p.set("movedCost", String(Math.round(m.movedCost)));
  return `${path}?${p.toString()}`;
}

const MAX_DOLLARS = 100_000_000;

function num(p: URLSearchParams, key: string): number | null {
  const raw = p.get(key);
  if (raw === null || raw.trim() === "") return null;
  const x = Number(raw);
  return Number.isFinite(x) && x >= 0 && x <= MAX_DOLLARS ? x : null;
}

/** Reads a move link. Returns null unless the link is flagged as a move and every figure is valid. */
export function parseFireLink(p: URLSearchParams): FireMoveLink | null {
  if (p.get("move") !== "1") return null;
  const n: Record<string, number> = {};
  for (const k of NUM_KEYS) {
    const v = num(p, k);
    if (v === null) return null;
    n[k] = v;
  }
  const codes = new Set<string>(STATES.map((s) => s.code));
  const state = p.get("state");
  const movedState = p.get("movedState");
  if (!state || !movedState || !codes.has(state) || !codes.has(movedState)) return null;
  const filing = p.get("filing");
  if (filing !== "single" && filing !== "married") return null;
  const movedCityId = p.get("movedCity") ?? "";
  const city = findCity(movedCityId);
  if (!city || city.state !== movedState) return null;
  if (n.k401 > 60 || n.income <= 0 || n.movedIncome <= 0) return null;
  return {
    income: n.income,
    state: state as StateCode,
    filing,
    k401Pct: n.k401,
    expenses: n.expenses,
    movedIncome: n.movedIncome,
    movedState: movedState as StateCode,
    movedCityId,
    movedExpenses: n.movedExpenses,
    movedCost: n.movedCost,
  };
}
