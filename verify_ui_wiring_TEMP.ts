import { computeIntlCityResult } from "./src/lib/compareEngines/international";
import { computeCaribCityResult } from "./src/lib/compareEngines/caribbean";

// Mirror exactly what CompareCitiesCalculator.tsx does with default state values.
const nz = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const intlDownPct = "20", intlRatePct = "7", intlTermYears = "30";
const intlBuyAssumptions = { downPct: nz(intlDownPct), ratePct: nz(intlRatePct), termYears: nz(intlTermYears) };

const r1 = computeIntlCityResult({ countryCode: "TH", cityCode: "TH-BKK", grossAnnualUsd: 120000, filing: "single", mode: "working", housingMode: "buy", buy: intlBuyAssumptions });
console.log("Thailand buy:", r1.housingLabel, "monthly:", r1.housingMonthly.toFixed(0), "flex:", r1.monthlyFlexibility.toFixed(0));

const r2 = computeCaribCityResult({ countryCode: "BS", grossAnnualUsd: 120000, filing: "single", mode: "working", housingMode: "buy", buy: intlBuyAssumptions });
console.log("Bahamas buy:", r2.housingLabel, "monthly:", r2.housingMonthly.toFixed(0), "flex:", r2.monthlyFlexibility.toFixed(0));

// rent mode default (no buy field passed, since UI only sends it, harmless either way)
const r3 = computeIntlCityResult({ countryCode: "TH", cityCode: "TH-BKK", grossAnnualUsd: 120000, filing: "single", mode: "working", housingMode: "rent" });
console.log("Thailand rent:", r3.housingLabel, "monthly:", r3.housingMonthly.toFixed(0), "flex:", r3.monthlyFlexibility.toFixed(0));
