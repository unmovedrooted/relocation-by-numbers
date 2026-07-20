import { computeIntlCityResult } from "./src/lib/compareEngines/international";
import { computeCaribCityResult } from "./src/lib/compareEngines/caribbean";
import { estimateMortgageMonthly } from "./src/lib/mortgage";
import { estimateHomePriceFromRent, PRICE_TO_RENT_RATIO, DEFAULT_TAX_INSURANCE_PCT } from "./src/lib/compareEngines/homePrice";

const common = { grossAnnualUsd: 100000, filing: "single" as const, mode: "working" as const };

console.log("=== Intl: Portugal (Lisbon) rent vs buy ===");
const rentPT = computeIntlCityResult({ countryCode: "PT", cityCode: "PT-LIS", ...common, housingMode: "rent" });
const buyPT = computeIntlCityResult({ countryCode: "PT", cityCode: "PT-LIS", ...common, housingMode: "buy" });
console.log("rent:", JSON.stringify(rentPT, null, 2));
console.log("buy:", JSON.stringify(buyPT, null, 2));

// Cross-check buy math independently
const rentAmount = 1600; // PT-LIS rent per internationalCityDefaults (need to confirm)
console.log("\nExpected home price from rent", rentAmount, "=", estimateHomePriceFromRent(rentAmount), "(ratio", PRICE_TO_RENT_RATIO, ")");
const expectedMortgage = estimateMortgageMonthly(estimateHomePriceFromRent(rentAmount), { downPct: 0.2, rate: 0.07, years: 30, taxAndInsurancePct: DEFAULT_TAX_INSURANCE_PCT });
console.log("Expected mortgage P&I+tax/ins:", expectedMortgage);
console.log("Engine's housingMonthly - (groceries+utilities+transport+healthcare) should ~= mortgage. Diff check below.");

console.log("\n=== Intl: custom buy assumptions (10% down, 5% rate, 15yr) ===");
const buyCustom = computeIntlCityResult({ countryCode: "PT", cityCode: "PT-LIS", ...common, housingMode: "buy", buy: { downPct: 10, ratePct: 5, termYears: 15 } });
console.log(JSON.stringify(buyCustom, null, 2));

console.log("\n=== Caribbean: Cayman Islands rent vs buy ===");
const rentKY = computeCaribCityResult({ countryCode: "KY", ...common, housingMode: "rent" });
const buyKY = computeCaribCityResult({ countryCode: "KY", ...common, housingMode: "buy" });
console.log("rent:", JSON.stringify(rentKY, null, 2));
console.log("buy:", JSON.stringify(buyKY, null, 2));

console.log("\n=== Edge cases: zero income buy mode, no crash ===");
console.log(JSON.stringify(computeIntlCityResult({ countryCode: "TH", grossAnnualUsd: 0, filing: "single", mode: "working", housingMode: "buy" }), null, 2));
console.log(JSON.stringify(computeCaribCityResult({ countryCode: "DO", grossAnnualUsd: 0, filing: "single", mode: "working", housingMode: "buy" }), null, 2));

console.log("\n=== All 29 Caribbean codes buy mode - no crash check ===");
import { CARIBBEAN_COUNTRY_CODES } from "./src/lib/caribbeanCountries";
let crashes = 0;
for (const cc of CARIBBEAN_COUNTRY_CODES) {
  try {
    const r = computeCaribCityResult({ countryCode: cc, ...common, housingMode: "buy" });
    if (!Number.isFinite(r.housingMonthly) || !Number.isFinite(r.estimatedHomePrice ?? 0)) {
      console.log("BAD VALUE", cc, r);
    }
  } catch (e) {
    crashes++;
    console.log("CRASH", cc, e);
  }
}
console.log("Caribbean buy-mode crashes:", crashes, "/ 29");
