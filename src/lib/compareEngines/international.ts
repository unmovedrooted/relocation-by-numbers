/**
 * Pure calculation engine for the international side of the compare-cities
 * tool (Caribbean, Asia, Europe, South America, International regions).
 *
 * Each of those five regional calculators (Caribbean/Asia/Europe/South
 * America/InternationalRelocationCalculator.tsx) has its own results
 * useMemo, and three of them (Caribbean, Asia, and — for some countries —
 * others) layer a dedicated per-country tax engine with conditional
 * follow-up questions on top of a shared fallback: estimateInternationalTax.
 * That fallback is what every regional component itself calls when a
 * country lacks a dedicated engine or the user hasn't answered the
 * conditional questions yet, so it's a real, already-shipped estimation
 * path — not a new approximation invented for this tool.
 *
 * For the compare view (which needs 2-3 results at once, side by side,
 * without a multi-step conditional-question form per country) this engine
 * intentionally always uses that shared fallback rather than replicating
 * each region's dedicated engine + conditional-question UI. Housing and
 * living costs reuse the exact same city/country default data as every
 * regional calculator (getCityDefaultsByCode, getCityCostMultipliers), so
 * only the *tax* precision is simplified — for an exact scenario with a
 * country-specific tax engine and follow-up questions, the page links back
 * to the matching full regional calculator.
 */
import { estimateInternationalTax, type FilingStatus } from "../internationalTaxes";
import { getCityDefaultsByCode } from "../internationalCityDefaults";
import { getCityCostMultipliers } from "../internationalCityCosts";
import { getCountryByCode } from "../internationalCountries";
import { getInternationalCityByCode } from "../internationalCities";
import { USD_TO_LOCAL } from "../internationalFx";

export type IntlMode = "working" | "retired";

export type IntlCompareInput = {
  countryCode: string;
  cityCode?: string;
  /** Gross annual income, already in USD. */
  grossAnnualUsd: number;
  filing: FilingStatus;
  mode: IntlMode;
};

export type IntlCompareResult = {
  cityCode: string;
  cityName: string;
  countryCode: string;
  countryName: string;
  netMonthly: number;
  effTaxPct: number;
  taxLabel: string;
  taxConfidencePlaceholder: boolean;
  housingMonthly: number;
  housingLabel: string;
  monthlyFlexibility: number;
  pctOfIncome: number;
};

function convertUsdToLocal(amountUsd: number, countryCode: string): number {
  const rate = USD_TO_LOCAL[countryCode] ?? 1;
  return amountUsd * rate;
}

export function computeIntlCityResult(input: IntlCompareInput): IntlCompareResult {
  const { countryCode, cityCode, grossAnnualUsd, filing, mode } = input;
  const salaryReady = Number.isFinite(grossAnnualUsd) && grossAnnualUsd > 0;

  const country = getCountryByCode(countryCode);
  const city = cityCode ? getInternationalCityByCode(cityCode) : undefined;
  const cityName = city?.name ?? country?.name ?? countryCode;
  const countryName = country?.name ?? countryCode;

  const taxEstimate = salaryReady
    ? estimateInternationalTax({
        countryCode,
        annualIncome: convertUsdToLocal(grossAnnualUsd, countryCode),
        filing,
        isRetired: mode === "retired",
      })
    : null;

  const effTaxPct = taxEstimate ? taxEstimate.effectiveRate * 100 : 0;
  const netAnnualUsd = salaryReady ? grossAnnualUsd * (1 - (taxEstimate?.effectiveRate ?? 0)) : 0;
  const netMonthly = netAnnualUsd / 12;

  const cityDefaults = cityCode ? getCityDefaultsByCode(cityCode) : undefined;
  const multipliers = cityCode ? getCityCostMultipliers(cityCode) : null;

  let housingMonthly: number;
  let housingLabel: string;

  if (cityDefaults) {
    // City-level defaults are already calibrated — no extra multiplier.
    const d = cityDefaults.monthlyDefaults;
    housingMonthly = d.rent + d.groceries + d.utilities + d.transport + d.healthcare;
    housingLabel = `Est. rent ${d.rent.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}/mo`;
  } else {
    // No city-specific data — fall back to country-level single-adult
    // defaults, scaled by city multipliers when available.
    const baseRent = country?.defaultRentSingle ?? 1_200;
    const baseHealthcare = country?.healthcareMonthlySingle ?? 100;
    const mult = multipliers ?? { housing: 1, transit: 1, groceries: 1, utilities: 1 };
    const rent = baseRent * mult.housing;
    const groceries = baseRent * 0.18 * mult.groceries;
    const utilities = baseRent * 0.08 * mult.utilities;
    const transport = baseRent * 0.07 * mult.transit;
    housingMonthly = rent + groceries + utilities + transport + baseHealthcare;
    housingLabel = `Est. rent ${rent.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}/mo`;
  }

  const monthlyFlexibility = netMonthly - housingMonthly;
  const pctOfIncome = netMonthly > 0 ? (housingMonthly / netMonthly) * 100 : 0;

  return {
    cityCode: cityCode ?? countryCode,
    cityName,
    countryCode,
    countryName,
    netMonthly,
    effTaxPct,
    taxLabel: taxEstimate?.label ?? "Tax estimate unavailable",
    taxConfidencePlaceholder: taxEstimate?.confidence === "placeholder",
    housingMonthly,
    housingLabel,
    monthlyFlexibility,
    pctOfIncome,
  };
}
