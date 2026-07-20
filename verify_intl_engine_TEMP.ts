import { computeIntlCityResult } from "./src/lib/compareEngines/international";
import { citiesForCountry } from "./src/lib/internationalCities";
import { getCountryByCode } from "./src/lib/internationalCountries";
import { estimateInternationalTax } from "./src/lib/internationalTaxes";
import { getCityDefaultsByCode } from "./src/lib/internationalCityDefaults";
import { USD_TO_LOCAL } from "./src/lib/internationalFx";

const common = { grossAnnualUsd: 100000, filing: "single" as const, mode: "working" as const };

for (const cc of ["TH", "PT", "BR", "JP", "GB"]) {
  const cities = citiesForCountry(cc);
  const cityCode = cities[0]?.code;
  const engineResult = computeIntlCityResult({ countryCode: cc, cityCode, ...common });

  // cross-check independently
  const localGross = 100000 * (USD_TO_LOCAL[cc] ?? 1);
  const tax = estimateInternationalTax({ countryCode: cc, annualIncome: localGross, filing: "single", isRetired: false });
  const expectedNetMonthly = (100000 * (1 - tax.effectiveRate)) / 12;
  const cd = getCityDefaultsByCode(cityCode!);
  const expectedHousing = cd ? cd.monthlyDefaults.rent + cd.monthlyDefaults.groceries + cd.monthlyDefaults.utilities + cd.monthlyDefaults.transport + cd.monthlyDefaults.healthcare : null;

  console.log(cc, cityCode, getCountryByCode(cc)?.name,
    "| engine net:", engineResult.netMonthly.toFixed(2), "expected:", expectedNetMonthly.toFixed(2),
    "| engine housing:", engineResult.housingMonthly.toFixed(2), "expected:", expectedHousing?.toFixed(2),
    "| MATCH:", Math.abs(engineResult.netMonthly - expectedNetMonthly) < 0.01 && Math.abs(engineResult.housingMonthly - (expectedHousing ?? engineResult.housingMonthly)) < 0.01);
}
