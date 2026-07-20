import { computeCaribCityResult } from "./src/lib/compareEngines/caribbean";
import { getCaribbeanCountryByCode, CARIBBEAN_COUNTRY_CODES } from "./src/lib/caribbeanCountries";
import { hasTaxConfig, getCountryTaxConfig } from "./src/lib/caribbeanTax/index";
import { estimateScenarioTax } from "./src/lib/caribbeanTax/engine";
import { USD_TO_LOCAL } from "./src/lib/internationalFx";

const common = { grossAnnualUsd: 100000, filing: "single" as const, mode: "working" as const };

console.log("=== Countries with dedicated tax config ===");
for (const cc of ["DO", "JM", "BS", "KY", "PR", "TT"]) {
  const r = computeCaribCityResult({ countryCode: cc, ...common });
  const configPresent = hasTaxConfig(cc);
  console.log(cc, getCaribbeanCountryByCode(cc)?.name, "| hasConfig:", configPresent,
    "| netMonthly:", r.netMonthly.toFixed(2), "| effTax%:", r.effTaxPct.toFixed(2),
    "| taxLabel:", r.taxLabel, "| housing:", r.housingMonthly.toFixed(2), "| flex:", r.monthlyFlexibility.toFixed(2));
}

console.log("\n=== Cross-check DO (remote scenario) against direct engine call ===");
const doConfig = getCountryTaxConfig("DO");
if (doConfig) {
  const localGross = 100000 * (USD_TO_LOCAL["DO"] ?? 1);
  const direct = estimateScenarioTax({ config: doConfig, scenario: "remote", grossIncomeLocalCurrency: localGross, filingStatus: "single" });
  console.log("direct effectiveRate:", direct.effectiveRate, "isDisclaimer:", direct.isDisclaimer, "notes:", direct.notes);
  const engine = computeCaribCityResult({ countryCode: "DO", ...common });
  console.log("engine effTaxPct:", engine.effTaxPct, "expected:", direct.effectiveRate * 100, "isDisclaimer path netMonthly should equal gross/12 if disclaimer:", direct.isDisclaimer);
}

console.log("\n=== All 29 Caribbean codes - no crash check ===");
let crashes = 0;
for (const cc of CARIBBEAN_COUNTRY_CODES) {
  try {
    const r = computeCaribCityResult({ countryCode: cc, ...common });
    if (!Number.isFinite(r.netMonthly) || !Number.isFinite(r.housingMonthly)) {
      console.log("BAD VALUE for", cc, r);
    }
  } catch (e) {
    crashes++;
    console.log("CRASH for", cc, e);
  }
}
console.log("Total crashes:", crashes, "/ 29");

console.log("\n=== Retired mode + zero income edge cases ===");
console.log(JSON.stringify(computeCaribCityResult({ countryCode: "KY", grossAnnualUsd: 80000, filing: "married", mode: "retired" }), null, 2));
console.log(JSON.stringify(computeCaribCityResult({ countryCode: "DO", grossAnnualUsd: 0, filing: "single", mode: "working" }), null, 2));
