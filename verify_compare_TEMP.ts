import { citiesForState, findCity } from "./src/lib/cities";
import { computeUsCityResult } from "./src/lib/compareEngines/us";

for (const st of ["ny", "tx", "nc", "fl"] as const) {
  const cities = citiesForState(st);
  console.log(st, "-> first city:", cities[0]?.id, cities[0]?.name, "count:", cities.length);
}

const ny = findCity(citiesForState("ny")[0].id)!;
const tx = findCity(citiesForState("tx")[0].id)!;
const nc = findCity(citiesForState("nc")[0].id)!;

const common = {
  grossAnnual: 120000, filing: "single" as const, k401Pct: 10,
  buy: { downPct: 20, ratePct: 6.5, termYears: 30, propertyTaxPct: 1.0, homeInsMonthly: 150, hoaMonthly: 0, pmiAnnualPct: 0.6 },
  rent: { rentersInsMonthly: 20, parkingMonthly: 100 },
};

const results = [ny, tx, nc].map(c => computeUsCityResult({ city: c, mode: "rent", ...common }));
console.log("\nRent mode comparison:");
results.forEach(r => console.log(r.cityName, "| net/mo:", r.netMonthly.toFixed(0), "| housing:", r.housingMonthly.toFixed(0), "| flex:", r.monthlyFlexibility.toFixed(0)));

const buyResults = [ny, tx, nc].map(c => computeUsCityResult({ city: c, mode: "buy", ...common }));
console.log("\nBuy mode comparison:");
buyResults.forEach(r => console.log(r.cityName, "| net/mo:", r.netMonthly.toFixed(0), "| housing:", r.housingMonthly.toFixed(0), "| flex:", r.monthlyFlexibility.toFixed(0)));
