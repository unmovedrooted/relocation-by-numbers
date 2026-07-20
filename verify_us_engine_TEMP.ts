import { computeUsCityResult } from "./src/lib/compareEngines/us";
import { findCity } from "./src/lib/cities";
import { estimateNetAnnual } from "./src/lib/tax";
import { monthlyHousingCost } from "./src/lib/housing";

const austin = findCity("austin-tx");
const nyc = findCity("nyc-ny");
if (!austin || !nyc) throw new Error("city lookup failed");

const grossAnnual = 120000;
const filing = "single" as const;
const k401Pct = 10;

// Rent mode
const rentAssumptions = { rentersInsMonthly: 20, parkingMonthly: 100 };
const buyAssumptions = { downPct: 20, ratePct: 6.5, termYears: 30, propertyTaxPct: 1.0, homeInsMonthly: 150, hoaMonthly: 0, pmiAnnualPct: 0.6 };

const austinRent = computeUsCityResult({ city: austin, grossAnnual, filing, k401Pct, mode: "rent", buy: buyAssumptions, rent: rentAssumptions });
const nycRent = computeUsCityResult({ city: nyc, grossAnnual, filing, k401Pct, mode: "rent", buy: buyAssumptions, rent: rentAssumptions });

console.log("=== RENT MODE ===");
console.log("Austin:", JSON.stringify(austinRent, null, 2));
console.log("NYC:", JSON.stringify(nycRent, null, 2));

// Manual cross-check of net income using the raw lib function directly
const austinNetAnnual = estimateNetAnnual({ grossAnnual, state: austin.state, filing, k401Pct, cityId: austin.id });
const nycNetAnnual = estimateNetAnnual({ grossAnnual, state: nyc.state, filing, k401Pct, cityId: nyc.id });
console.log("\nCross-check net monthly Austin:", (austinNetAnnual/12).toFixed(2), "vs engine:", austinRent.netMonthly.toFixed(2));
console.log("Cross-check net monthly NYC:", (nycNetAnnual/12).toFixed(2), "vs engine:", nycRent.netMonthly.toFixed(2));

// Buy mode
const austinBuy = computeUsCityResult({ city: austin, grossAnnual, filing, k401Pct, mode: "buy", buy: buyAssumptions, rent: rentAssumptions });
console.log("\n=== BUY MODE (Austin) ===");
console.log(JSON.stringify(austinBuy, null, 2));

const manualBuy = monthlyHousingCost({
  homePrice: austin.medianHomePrice ?? 400000,
  downPct: 20, ratePct: 6.5, termYears: 30, propertyTaxPct: 1.0, homeInsMonthly: 150, hoaMonthly: 0,
});
console.log("\nManual monthlyHousingCost total (no PMI, down=20 so PMI=0):", manualBuy.totalMonthly.toFixed(2));
console.log("Engine housingMonthly:", austinBuy.housingMonthly.toFixed(2));
