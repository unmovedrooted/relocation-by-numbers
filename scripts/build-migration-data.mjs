// Builds src/data/irsMigration.json from the IRS Statistics of Income state-to-state migration files.
// Source: https://www.irs.gov/statistics/soi-tax-stats-migration-data (state outflow files, one per pair of consecutive tax years).
// n1 = returns filed in the destination state that were filed in the origin state the year before (households),
// n2 = exemptions on those returns (people), AGI = adjusted gross income of those returns in thousands of dollars.
// Run: node scripts/build-migration-data.mjs
import { writeFileSync } from "node:fs";

const FILES = [
  { code: "1819", label: "2018-19" },
  { code: "1920", label: "2019-20" },
  { code: "2021", label: "2020-21" },
  { code: "2122", label: "2021-22" },
  { code: "2223", label: "2022-23" },
];
const STATE_FIPS_MAX = 56;

function parseCsv(text) {
  return text.trim().split(/\r?\n/).slice(1).map((line) => line.split(","));
}

const flowsByYear = []; // per year: Map("origin>dest" -> {n1, n2, agi})
let stateCodes = new Map(); // fips -> abbreviation

for (const { code } of FILES) {
  const res = await fetch(`https://www.irs.gov/pub/irs-soi/stateoutflow${code}.csv`);
  if (!res.ok) throw new Error(`stateoutflow${code}.csv: HTTP ${res.status}`);
  const rows = parseCsv(await res.text());
  // Same-state rows (non-migrants) give each state's abbreviation.
  for (const [y1, y2, abbr] of rows) if (y1 === y2 && Number(y1) <= STATE_FIPS_MAX) stateCodes.set(y1, abbr.toLowerCase());
  const flows = new Map();
  for (const [y1, y2, , , n1, n2, agi] of rows) {
    if (y1 === y2 || Number(y1) > STATE_FIPS_MAX || Number(y2) > STATE_FIPS_MAX) continue;
    flows.set(`${y1}>${y2}`, { n1: Number(n1), n2: Number(n2), agi: Number(agi) });
  }
  flowsByYear.push(flows);
}

const out = { meta: {
  source: "IRS Statistics of Income, state-to-state migration data (state outflow files)",
  url: "https://www.irs.gov/statistics/soi-tax-stats-migration-data",
  generatedOn: new Date().toISOString().slice(0, 10),
  years: FILES.map((f) => f.label),
  note: "h = households (returns); p = people (exemptions) in the latest year; a = adjusted gross income in thousands of dollars in the latest year. Keys are origin>destination state codes. Small flows the IRS suppresses are absent.",
}, flows: {} };

const keys = new Set(flowsByYear.flatMap((m) => [...m.keys()]));
for (const key of keys) {
  const [a, b] = key.split(">");
  const from = stateCodes.get(a);
  const to = stateCodes.get(b);
  if (!from || !to) continue;
  const h = flowsByYear.map((m) => m.get(key)?.n1 ?? 0);
  const latest = flowsByYear[flowsByYear.length - 1].get(key);
  out.flows[`${from}>${to}`] = latest ? { h, p: latest.n2, a: latest.agi } : { h };
}

writeFileSync(new URL("../src/data/irsMigration.json", import.meta.url), JSON.stringify(out));
console.log(`wrote ${Object.keys(out.flows).length} flows for ${stateCodes.size} states`);
