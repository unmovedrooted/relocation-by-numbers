// Builds src/data/eiaElectricity.json from the U.S. Energy Information Administration's Electric Power Monthly, Table 5.6.B
// (average price of electricity to ultimate customers by end-use sector and state, year to date).
// Run: node scripts/build-electricity-data.mjs
import { writeFileSync } from "node:fs";

const TABLE_URL = "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=table_5_06_b";
const NAMES = {
  al: "Alabama", ak: "Alaska", az: "Arizona", ar: "Arkansas", ca: "California", co: "Colorado", ct: "Connecticut", de: "Delaware",
  dc: "District of Columbia", fl: "Florida", ga: "Georgia", hi: "Hawaii", id: "Idaho", il: "Illinois", in: "Indiana", ia: "Iowa",
  ks: "Kansas", ky: "Kentucky", la: "Louisiana", me: "Maine", md: "Maryland", ma: "Massachusetts", mi: "Michigan", mn: "Minnesota",
  ms: "Mississippi", mo: "Missouri", mt: "Montana", ne: "Nebraska", nv: "Nevada", nh: "New Hampshire", nj: "New Jersey",
  nm: "New Mexico", ny: "New York", nc: "North Carolina", nd: "North Dakota", oh: "Ohio", ok: "Oklahoma", or: "Oregon",
  pa: "Pennsylvania", ri: "Rhode Island", sc: "South Carolina", sd: "South Dakota", tn: "Tennessee", tx: "Texas", ut: "Utah",
  vt: "Vermont", va: "Virginia", wa: "Washington", wv: "West Virginia", wi: "Wisconsin", wy: "Wyoming",
};

const res = await fetch(TABLE_URL);
if (!res.ok) throw new Error(`EIA table: HTTP ${res.status}`);
const html = await res.text();
const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
const period = (text.match(/Year-to-Date through ([A-Za-z]+ 20\d\d)/) ?? [])[1];
if (!period) throw new Error("could not find the table period");
const released = (text.match(/Release Date:\s*([A-Za-z]+ \d+, 20\d\d)/) ?? [])[1] ?? "";

const price = {};
for (const [code, name] of Object.entries(NAMES)) {
  const pattern = "(?<![A-Za-z])" + name.replace(/ /g, "\\s") + "\\s+([0-9]+\\.[0-9]+)\\s+([0-9]+\\.[0-9]+)";
  const m = new RegExp(pattern).exec(text);
  if (!m) throw new Error(`no row for ${name}`);
  price[code] = Number(m[1]);
}

const us = /U\.S\. Total\s+([0-9]+\.[0-9]+)/.exec(text);
if (!us) throw new Error("no U.S. total row");

writeFileSync(new URL("../src/data/eiaElectricity.json", import.meta.url), JSON.stringify({
  meta: {
    source: "U.S. Energy Information Administration, Electric Power Monthly, Table 5.6.B: average price of electricity by end-use sector, by state, year to date",
    url: "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=table_5_06_b",
    period: `Year-to-date through ${period}`,
    released,
    generatedOn: new Date().toISOString().slice(0, 10),
    unit: "cents per kilowatt-hour, residential sector",
  },
  residentialCentsPerKwh: price,
  usResidentialCentsPerKwh: Number(us[1]),
}));
console.log(`wrote ${Object.keys(price).length} states, ${period}, released ${released}`);
