#!/usr/bin/env node
/**
 * Builds src/data/governmentData.json from U.S. government files.
 *
 *   node scripts/build-government-data.mjs <acsDir> <beaMsaCsv> <beaStateCsv> [--report]
 *
 * Inputs (download once; they are not committed):
 *   acsDir      a folder holding, from the Census Bureau's ACS 2020-2024 5-year table-based summary file
 *               (https://www2.census.gov/programs-surveys/acs/summary_file/2024/table-based-SF/):
 *                 documentation/Geos20245YR.txt
 *                 data/5YRData/acsdt5y2024-b25058.dat   median contract rent
 *                 data/5YRData/acsdt5y2024-b25064.dat   median gross rent
 *                 data/5YRData/acsdt5y2024-b25077.dat   median value of owner-occupied homes
 *                 data/5YRData/acsdt5y2024-b25103.dat   median real estate taxes paid
 *   beaMsaCsv   MARPP_MSA_2008_2024.csv from https://apps.bea.gov/regional/zip/MARPP.zip
 *   beaStateCsv SARPP_STATE_2008_2024.csv from https://apps.bea.gov/regional/zip/SARPP.zip
 *
 * Every city in src/lib/cities.ts is matched to its Census place and, for price levels, to its BEA metropolitan
 * area. Cities with no metropolitan area use the state's price parities. Nothing is estimated or smoothed.
 */
import { readFileSync, writeFileSync, existsSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [acsDir, beaMsaCsv, beaStateCsv] = process.argv.slice(2);
if (!acsDir || !beaMsaCsv || !beaStateCsv) {
  console.error("usage: node scripts/build-government-data.mjs <acsDir> <beaMsaCsv> <beaStateCsv>");
  process.exit(1);
}

const ACS_VINTAGE = "2020-2024 American Community Survey 5-year estimates (Census Bureau, released December 2025)";
const BEA_VINTAGE = "2024 Regional Price Parities (Bureau of Economic Analysis, released February 2026)";

// ── Cities and states from the app ───────────────────────────────────────────
const citiesSrc = readFileSync(join(root, "src/lib/cities.ts"), "utf8");
const cities = [...citiesSrc.matchAll(/\{\s*id:\s*"([a-z0-9-]+)",\s*name:\s*"([^"]+)",\s*state:\s*"([a-z]{2})"/g)]
  .map((m) => ({ id: m[1], name: m[2], state: m[3] }));
const statesSrc = readFileSync(join(root, "src/lib/states.ts"), "utf8");
const states = [...statesSrc.matchAll(/\{\s*code:\s*"([a-z]{2})",\s*name:\s*"([^"]+)"\s*\}/g)].map((m) => ({ code: m[1], name: m[2] }));
const stateName = Object.fromEntries(states.map((s) => [s.code, s.name]));

// City names that differ from the Census place name (the Census name is matched exactly after the suffix).
const PLACE_NAME = {
  "nyc-ny": "New York",
  "saint-paul-mn": "St. Paul",
  "st-louis-mo": "St. Louis",
  "honolulu-hi": "Urban Honolulu",
  "la-ca": "Los Angeles",
  "sf-ca": "San Francisco",
  "sd-ca": "San Diego",
  "nashville-tn": "Nashville-Davidson",
  "louisville-ky": "Louisville/Jefferson County",
  "lexington-ky": "Lexington-Fayette",
  "augusta-ga": "Augusta-Richmond County",
  "boise-id": "Boise City",
  "washington-dc": "Washington",
};
// Preference among designations when a name has several matches in one state.
const DESIGNATION_RANK = [
  / city$/, / city \(balance\)$/, / metropolitan government \(balance\)$/, / metro government \(balance\)$/,
  / consolidated government \(balance\)$/, / urban county$/, / municipality$/, / city and borough$/, / town$/, / village$/, / CDP$/,
];

function norm(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); }

async function eachLine(file, fn) {
  const rl = createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
  let header = null;
  for await (const line of rl) {
    if (!header) { header = line.split("|"); continue; }
    fn(line.split("|"), header);
  }
}

// ── Census geography ─────────────────────────────────────────────────────────
const placesByState = new Map(); // STUSAB -> [{ geoId, name }]
const stateGeo = new Map();      // STUSAB (lower) -> geoId
await eachLine(join(acsDir, "Geos20245YR.txt"), (cols, header) => {
  const get = (k) => cols[header.indexOf(k)];
  if (get("COMPONENT") !== "00") return;
  const level = get("SUMLEVEL");
  if (level === "160") {
    const st = get("STUSAB");
    if (!placesByState.has(st)) placesByState.set(st, []);
    placesByState.get(st).push({ geoId: get("GEO_ID"), name: get("NAME") });
  } else if (level === "040") {
    stateGeo.set(get("STUSAB").toLowerCase(), get("GEO_ID"));
  }
});

function findPlace(city) {
  const base = norm(PLACE_NAME[city.id] ?? city.name);
  const st = stateName[city.state];
  const list = placesByState.get(city.state.toUpperCase()) ?? [];
  const matches = list.filter((p) => {
    const n = norm(p.name);
    if (!n.endsWith(`, ${st}`)) return false;
    const head = n.slice(0, n.length - st.length - 2);
    return head === base || head.startsWith(`${base} `);
  });
  const ranked = matches.map((p) => {
    const head = norm(p.name).slice(0, -(st.length + 2));
    const rank = DESIGNATION_RANK.findIndex((re) => re.test(head));
    return { ...p, rank: rank < 0 ? 99 : rank, head };
  }).filter((p) => p.head === base || p.head.startsWith(`${base} `)).sort((a, b) => a.rank - b.rank);
  // Keep only candidates whose head, minus the designation, equals the base name exactly.
  const exact = ranked.filter((p) => DESIGNATION_RANK.some((re) => p.head === `${base}${p.head.slice(base.length)}` && re.test(p.head) && p.head.slice(0, p.head.length - (p.head.match(re)?.[0].length ?? 0)) === base));
  return { chosen: (exact[0] ?? ranked[0]) ?? null, count: (exact.length || ranked.length), all: (exact.length ? exact : ranked).slice(0, 4).map((p) => p.name) };
}

// ── ACS tables ───────────────────────────────────────────────────────────────
async function loadTable(table, wanted, line = "001") {
  const out = new Map();
  await eachLine(join(acsDir, `acsdt5y2024-${table}.dat`), (cols, header) => {
    const id = cols[0];
    if (!wanted.has(id)) return;
    const est = Number(cols[header.findIndex((h) => h.endsWith(`_E${line}`))]);
    const moe = Number(cols[header.findIndex((h) => h.endsWith(`_M${line}`))]);
    out.set(id, { value: Number.isFinite(est) && est > 0 ? est : null, moe: Number.isFinite(moe) ? moe : null });
  });
  return out;
}

const cityPlaces = new Map();
const unresolved = [];
for (const c of cities) {
  if (c.id.startsWith("other-")) continue;
  const r = findPlace(c);
  if (!r.chosen) { unresolved.push(c.id); continue; }
  cityPlaces.set(c.id, { geoId: r.chosen.geoId, name: r.chosen.name, candidates: r.count > 1 ? r.all : undefined });
}
const wanted = new Set([...cityPlaces.values()].map((p) => p.geoId));
for (const g of stateGeo.values()) wanted.add(g);
wanted.add("0100000US");

const tables = {};
for (const t of ["b25058", "b25064", "b25077", "b25103"]) tables[t] = await loadTable(t, wanted);
// Households that moved in during 2023 or later (line 002): the Census Bureau's measure of rents on new leases
// and values of recently bought homes.
tables.b25113 = await loadTable("b25113", wanted, "002");
tables.b25109 = await loadTable("b25109", wanted, "002");

const MAX_RELATIVE_MOE = 0.25; // use the recent-mover figure only when its 90% margin of error is within 25% of the estimate

function acsRecord(geoId) {
  const g = (t) => tables[t].get(geoId) ?? { value: null, moe: null };
  const reliable = (r) => r.value && r.moe !== null && r.moe / r.value <= MAX_RELATIVE_MOE;
  const contract = g("b25058"), gross = g("b25064"), moverGross = g("b25113");
  const value = g("b25077"), moverValue = g("b25109"), tax = g("b25103").value;

  // Contract rent excludes utilities. Recent-mover rent is published only as gross rent (contract rent plus
  // estimated utilities and fuels), so remove the utilities share using the same place's all-renter ratio.
  const ratio = contract.value && gross.value ? contract.value / gross.value : null;
  const moverContractEstimate = reliable(moverGross) && ratio ? Math.round(moverGross.value * ratio) : null;
  const homeValueRecent = reliable(moverValue) ? moverValue.value : null;
  const homeValueForRate = value.value;
  return {
    // Values the app uses:
    rentUsed: moverContractEstimate ?? contract.value,
    rentBasis: moverContractEstimate ? "recent-movers" : contract.value ? "all-renters" : null,
    homeValueUsed: homeValueRecent ?? value.value,
    homeValueBasis: homeValueRecent ? "recent-movers" : value.value ? "all-owners" : null,
    propertyTaxRatePct: homeValueForRate && tax ? Math.round((tax / homeValueForRate) * 10000) / 100 : null,
    // Source figures:
    medianContractRent: contract.value, medianContractRentMoe: contract.moe,
    medianGrossRent: gross.value, medianGrossRentMoe: gross.moe,
    recentMoverGrossRent: moverGross.value, recentMoverGrossRentMoe: moverGross.moe,
    medianHomeValue: value.value, medianHomeValueMoe: value.moe,
    recentMoverHomeValue: moverValue.value, recentMoverHomeValueMoe: moverValue.moe,
    medianRealEstateTaxesPaid: tax,
  };
}

// ── BEA price parities ───────────────────────────────────────────────────────
function parseCsvLine(line) {
  const out = []; let cur = ""; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') q = !q; else if (ch === "," && !q) { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
function loadRpp(file) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.trim());
  const header = parseCsvLine(lines[0]);
  const yearIdx = header.indexOf("2024");
  const byGeo = new Map();
  for (const line of lines.slice(1)) {
    const c = parseCsvLine(line);
    if (c.length < header.length) continue;
    const [fips, name] = [c[0], c[1]];
    const code = Number(c[4]);
    const v = Number(c[yearIdx]);
    if (!Number.isFinite(v)) continue;
    if (!byGeo.has(fips)) byGeo.set(fips, { fips, name, lines: {} });
    byGeo.get(fips).lines[code] = v;
  }
  return byGeo;
}
const msa = loadRpp(beaMsaCsv);
const stateRpp = loadRpp(beaStateCsv);
const msaList = [...msa.values()].filter((m) => /Metropolitan Statistical Area/.test(m.name));
const stateByName = new Map([...stateRpp.values()].map((s) => [s.name.replace(/\s*\*+$/, ""), s]));

const MSA_OVERRIDE = {
  "meridian-id": "Boise City, ID", "nampa-id": "Boise City, ID",
  "overland-park-ks": "Kansas City, MO-KS", "kansas-city-ks": "Kansas City, MO-KS", "kansas-city-mo": "Kansas City, MO-KS",
  "bellevue-ne": "Omaha, NE-IA", "naperville-il": "Chicago-Naperville-Elgin, IL-IN", "aurora-il": "Chicago-Naperville-Elgin, IL-IN",
  "cranston-ri": "Providence-Warwick, RI-MA", "warwick-ri": "Providence-Warwick, RI-MA",
  "paterson-nj": "New York-Newark-Jersey City, NY-NJ", "newark-nj": "New York-Newark-Jersey City, NY-NJ", "jersey-city-nj": "New York-Newark-Jersey City, NY-NJ",
  "newark-de": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD", "wilmington-de": "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD",
  "saint-paul-mn": "Minneapolis-St. Paul-Bloomington, MN-WI", "minneapolis-mn": "Minneapolis-St. Paul-Bloomington, MN-WI", "rochester-mn": "Rochester, MN",
  "aurora-co": "Denver-Aurora-Centennial, CO", "mesa-az": "Phoenix-Mesa-Chandler, AZ", "henderson-nv": "Las Vegas-Henderson-North Las Vegas, NV",
  "fayetteville-ar": "Fayetteville-Springdale-Rogers, AR", "fort-smith-ar": "Fort Smith, AR-OK",
  "kahului-hi": "Kahului-Wailuku, HI",
  "evansville-in": "Evansville, IN", "davenport-ia": "Davenport-Moline-Rock Island, IA-IL",
  "frederick-md": "Washington-Arlington-Alexandria, DC-VA-MD-WV", "rockville-md": "Washington-Arlington-Alexandria, DC-VA-MD-WV",
  "nashville-tn": "Nashville-Davidson--Murfreesboro--Franklin, TN", "augusta-ga": "Augusta-Richmond County, GA-SC",
  "lexington-ky": "Lexington-Fayette, KY",
  "norman-ok": "Oklahoma City, OK", "salem-or": "Salem, OR", "eugene-or": "Eugene-Springfield, OR",
  "durham-nc": "Durham-Chapel Hill, NC", "raleigh-nc": "Raleigh-Cary, NC",
  "hattiesburg-ms": "Hattiesburg, MS", "gulfport-ms": "Gulfport-Biloxi, MS", "jackson-ms": "Jackson, MS",
  "bridgeport-ct": "Bridgeport-Stamford-Danbury, CT", "new-haven-ct": "New Haven, CT", "hartford-ct": "Hartford-West Hartford-East Hartford, CT",
  "colorado-springs-co": "Colorado Springs, CO", "albany-ny": "Albany-Schenectady-Troy, NY", "buffalo-ny": "Buffalo-Cheektowaga, NY",
  "nyc-ny": "New York-Newark-Jersey City, NY-NJ",
};

function msaTitle(m) { return m.name.replace(/\s*\(?Metropolitan Statistical Area\)?\s*$/, "").trim(); }
function findMsa(city) {
  const override = MSA_OVERRIDE[city.id];
  if (override) {
    const hit = msaList.find((m) => msaTitle(m) === override);
    return { msa: hit ?? null, how: hit ? "override" : "override-not-found" };
  }
  const ab = city.state.toUpperCase();
  const base = norm(PLACE_NAME[city.id] ?? city.name).replace(/^St\. /, "St. ");
  const hits = msaList.filter((m) => {
    const t = msaTitle(m);
    const [cityPart, statePart] = t.split(/,\s*/);
    if (!statePart || !statePart.split("-").includes(ab)) return false;
    return cityPart.split("-").map(norm).some((p) => p === base || p === `Saint ${base.replace(/^St\. /, "")}`);
  });
  return { msa: hits[0] ?? null, how: hits.length > 1 ? "multiple" : hits.length ? "name" : "none", n: hits.length };
}

function rppRecord(m) {
  const l = m.lines;
  return { allItems: l[1] ?? null, goods: l[2] ?? null, housing: l[3] ?? null, utilities: l[4] ?? null, otherServices: l[5] ?? null };
}

// ── Assemble ─────────────────────────────────────────────────────────────────
const out = {
  meta: {
    generatedOn: new Date().toISOString().slice(0, 10),
    census: {
      vintage: ACS_VINTAGE,
      source: "https://www2.census.gov/programs-surveys/acs/summary_file/2024/table-based-SF/",
      tables: {
        B25058: "Median contract rent (dollars per month, renter-occupied units paying cash rent)",
        B25064: "Median gross rent (contract rent plus estimated utilities and fuels)",
        B25077: "Median value of owner-occupied housing units (owner-reported)",
        B25103: "Median real estate taxes paid (dollars per year, owner-occupied units)",
        B25113: "Median gross rent by year householder moved into unit (the 2023 or later column is used for new-lease rents)",
        B25109: "Median value by year householder moved into unit (the 2023 or later column is used for recent purchases)",
      },
      note: "Property tax rate is the median real estate taxes paid divided by the median home value for the same place.",
    },
    bea: {
      vintage: BEA_VINTAGE,
      source: "https://apps.bea.gov/regional/zip/MARPP.zip and https://apps.bea.gov/regional/zip/SARPP.zip",
      note: "Indexes use the United States = 100. Goods are used for groceries and transportation; Services: Other for healthcare; Services: Housing for housing; Services: Utilities for utilities.",
    },
  },
  nation: { census: acsRecord("0100000US") },
  states: {},
  cities: {},
};

for (const s of states) {
  const geo = stateGeo.get(s.code);
  const rpp = stateByName.get(s.name);
  out.states[s.code] = { census: geo ? { geoId: geo, ...acsRecord(geo) } : null, rpp: rpp ? { geoName: rpp.name, ...rppRecord(rpp) } : null };
}

const report = { noPlace: unresolved, ambiguousPlace: [], msaMissing: [], msaMultiple: [], noRent: [], noHome: [], noTax: [] };
for (const c of cities) {
  const isOther = c.id.startsWith("other-");
  const rec = { name: c.name, state: c.state };
  if (!isOther) {
    const place = cityPlaces.get(c.id);
    if (place) {
      rec.census = { geoId: place.geoId, placeName: place.name, ...acsRecord(place.geoId) };
      if (place.candidates) report.ambiguousPlace.push(`${c.id}: chose "${place.name}" among ${place.candidates.join(" | ")}`);
      if (!rec.census.medianContractRent) report.noRent.push(c.id);
      if (!rec.census.medianHomeValue) report.noHome.push(c.id);
      if (!rec.census.medianRealEstateTaxesPaid) report.noTax.push(c.id);
    }
    const f = findMsa(c);
    if (f.msa) { rec.rpp = { level: "metro", geoFips: f.msa.fips, geoName: f.msa.name, ...rppRecord(f.msa) }; if (f.how === "multiple") report.msaMultiple.push(`${c.id}: ${f.msa.name}`); }
    else report.msaMissing.push(`${c.id} (${f.how})`);
  }
  if (!rec.rpp) {
    const sr = out.states[c.state]?.rpp;
    if (sr) rec.rpp = { level: "state", geoName: sr.geoName, allItems: sr.allItems, goods: sr.goods, housing: sr.housing, utilities: sr.utilities, otherServices: sr.otherServices };
  }
  out.cities[c.id] = rec;
}

writeFileSync(join(root, "src/data/governmentData.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`cities: ${cities.length}, with a Census place: ${cityPlaces.size}, states: ${states.length}`);
for (const [k, v] of Object.entries(report)) console.log(`\n${k} (${v.length})\n${v.join("\n")}`);
