import raw from "../data/irsMigration.json";

/**
 * State-to-state moves from the IRS Statistics of Income migration files (households that filed a return in a different state than
 * the year before). State level only: the IRS publishes no city-to-city flows in these files. Built by scripts/build-migration-data.mjs.
 */
type Flow = { h: number[]; p?: number; a?: number };
const data = raw as unknown as { meta: { source: string; url: string; years: string[]; generatedOn: string }; flows: Record<string, Flow> };

export const MIGRATION_META = data.meta;

export type MigrationPair = {
  years: string[];
  trend: number[];
  households: number;
  people: number | null;
  averageAgi: number | null;
  reverseHouseholds: number;
  netToDestination: number;
  /** Rank of the destination among all states people leave the origin for (1 = the most common). */
  destinationRank: number | null;
  peakYear: string;
  peakHouseholds: number;
  changeFromPeakPct: number | null;
  changeSinceFirstPct: number | null;
};

const stateOf = (id: string) => id.toLowerCase();

export function migrationPair(fromState: string, toState: string): MigrationPair | null {
  const from = stateOf(fromState);
  const to = stateOf(toState);
  if (from === to) return null;
  const flow = data.flows[`${from}>${to}`];
  const reverse = data.flows[`${to}>${from}`];
  if (!flow) return null;
  const trend = flow.h;
  const households = trend[trend.length - 1];
  const peakHouseholds = Math.max(...trend);
  const peakIndex = trend.indexOf(peakHouseholds);
  const latestIndex = trend.length - 1;
  const rank = destinationRank(from, to);
  return {
    years: data.meta.years,
    trend,
    households,
    people: flow.p ?? null,
    averageAgi: flow.a && households > 0 ? Math.round((flow.a * 1000) / households) : null,
    reverseHouseholds: reverse ? reverse.h[latestIndex] : 0,
    netToDestination: households - (reverse ? reverse.h[latestIndex] : 0),
    destinationRank: rank,
    peakYear: data.meta.years[peakIndex],
    peakHouseholds,
    changeFromPeakPct: peakIndex !== latestIndex && peakHouseholds > 0 ? ((households - peakHouseholds) / peakHouseholds) * 100 : null,
    changeSinceFirstPct: trend[0] > 0 ? ((households - trend[0]) / trend[0]) * 100 : null,
  };
}

/** The states people most often move to from `fromState`, with the latest year's households. */
export function topDestinations(fromState: string, count: number): { state: string; households: number }[] {
  const from = stateOf(fromState);
  return Object.entries(data.flows)
    .filter(([key]) => key.startsWith(`${from}>`))
    .map(([key, f]) => ({ state: key.split(">")[1], households: f.h[f.h.length - 1] }))
    .sort((a, b) => b.households - a.households)
    .slice(0, count);
}

function destinationRank(from: string, to: string): number | null {
  const all = Object.entries(data.flows)
    .filter(([key]) => key.startsWith(`${from}>`))
    .map(([key, f]) => ({ state: key.split(">")[1], households: f.h[f.h.length - 1] }))
    .sort((a, b) => b.households - a.households);
  const i = all.findIndex((x) => x.state === to);
  return i === -1 ? null : i + 1;
}
