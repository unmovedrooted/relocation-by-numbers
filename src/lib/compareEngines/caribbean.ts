/**
 * Pure calculation engine for the Caribbean region of the compare-cities tool.
 *
 * Caribbean is architecturally different from the other four international
 * regions: its countries live in a separate list (CARIBBEAN_COUNTRIES, not
 * INTERNATIONAL_COUNTRIES) and its tax math runs through a dedicated
 * per-country config engine (caribbeanTax/engine.ts + caribbeanTax/countries/*)
 * rather than the single estimateInternationalTax fallback. Caribbean
 * countries also have no entries in internationalCities.ts, so
 * CaribbeanRelocationCalculator.tsx itself falls back to country-level
 * rent/cost defaults for any Caribbean destination — this engine does the
 * same, using each country's defaultRentSingle/healthcareMonthlySingle.
 *
 * Tax handling mirrors the real calculator's degrade path: if a country has
 * a dedicated tax config (hasTaxConfig), use estimateScenarioTax with that
 * config; otherwise fall back to the shared estimateInternationalTax, the
 * same graceful fallback the calculator and every other region use.
 */
import { getCaribbeanCountryByCode } from "../caribbeanCountries";
import { hasTaxConfig, getCountryTaxConfig } from "../caribbeanTax/index";
import { estimateScenarioTax } from "../caribbeanTax/engine";
import type { IncomeScenario, FilingStatus as CaribFilingStatus, CaribbeanTaxCode } from "../caribbeanTax/types";
import { estimateInternationalTax, type FilingStatus } from "../internationalTaxes";
import { USD_TO_LOCAL } from "../internationalFx";
import { estimateMortgageMonthly } from "../mortgage";
import { estimateHomePriceFromRent, DEFAULT_TAX_INSURANCE_PCT } from "./homePrice";

export type CaribCompareMode = "working" | "retired";
export type CaribSalaryType = "local" | "remote";
export type CaribHousingMode = "rent" | "buy";

export type CaribBuyAssumptions = {
  downPct: number;
  ratePct: number;
  termYears: number;
};

export type CaribCompareInput = {
  countryCode: string;
  grossAnnualUsd: number;
  filing: FilingStatus;
  mode: CaribCompareMode;
  /** Only relevant when mode === "working". Defaults to "remote" — the
   *  calculator's own default salaryType — since compare view doesn't ask. */
  salaryType?: CaribSalaryType;
  /** Defaults to "rent". */
  housingMode?: CaribHousingMode;
  /** Only used when housingMode === "buy". */
  buy?: CaribBuyAssumptions;
};

export type CaribCompareResult = {
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
  /** Only set when housingMode === "buy". Rough estimate — see homePrice.ts. */
  estimatedHomePrice?: number;
};

function convertUsdToLocal(amountUsd: number, countryCode: string): number {
  const rate = USD_TO_LOCAL[countryCode] ?? 1;
  return amountUsd * rate;
}

export function computeCaribCityResult(input: CaribCompareInput): CaribCompareResult {
  const { countryCode, grossAnnualUsd, filing, mode, salaryType = "remote", housingMode = "rent", buy } = input;
  const salaryReady = Number.isFinite(grossAnnualUsd) && grossAnnualUsd > 0;

  const country = getCaribbeanCountryByCode(countryCode);
  const countryName = country?.name ?? countryCode;

  const scenario: IncomeScenario =
    mode === "retired" ? "retired" : salaryType === "local" ? "local" : "remote";
  const caribFiling: CaribFilingStatus = filing === "married" ? "married_joint" : "single";

  let effTaxPct = 0;
  let taxLabel = "Tax estimate unavailable";
  let taxConfidencePlaceholder = true;
  let netAnnualUsd = 0;

  if (salaryReady) {
    const config = hasTaxConfig(countryCode)
      ? getCountryTaxConfig(countryCode as CaribbeanTaxCode)
      : undefined;

    if (config) {
      const localGross = convertUsdToLocal(grossAnnualUsd, countryCode);
      const result = estimateScenarioTax({
        config,
        scenario,
        grossIncomeLocalCurrency: localGross,
        filingStatus: caribFiling,
      });
      effTaxPct = result.effectiveRate * 100;
      taxLabel = result.isDisclaimer
        ? `${countryName}: ${result.notes[0] ?? "Tax model incomplete"}`
        : `${countryName} ${scenario} income (${result.taxYearLabel})`;
      taxConfidencePlaceholder = result.confidence === "pending" || result.isDisclaimer;
      netAnnualUsd = result.isDisclaimer ? grossAnnualUsd : grossAnnualUsd * (1 - result.effectiveRate);
    } else {
      const fallback = estimateInternationalTax({
        countryCode,
        annualIncome: convertUsdToLocal(grossAnnualUsd, countryCode),
        filing,
        isRetired: mode === "retired",
      });
      effTaxPct = fallback.effectiveRate * 100;
      taxLabel = fallback.label;
      taxConfidencePlaceholder = fallback.confidence === "placeholder";
      netAnnualUsd = grossAnnualUsd * (1 - fallback.effectiveRate);
    }
  }

  const netMonthly = netAnnualUsd / 12;

  // No per-city cost data exists for Caribbean territories — use the same
  // country-level fallback formula the shared international engine uses.
  const baseRent = country?.defaultRentSingle ?? 1_200;
  const baseHealthcare = country?.healthcareMonthlySingle ?? 150;
  const groceries = baseRent * 0.18;
  const utilities = baseRent * 0.08;
  const transport = baseRent * 0.07;

  let housingLine: number;
  let housingLabel: string;
  let estimatedHomePrice: number | undefined;

  if (housingMode === "buy") {
    estimatedHomePrice = estimateHomePriceFromRent(baseRent);
    const downPct = (buy?.downPct ?? 20) / 100;
    const ratePct = (buy?.ratePct ?? 7) / 100;
    const termYears = buy?.termYears ?? 30;
    housingLine = estimateMortgageMonthly(estimatedHomePrice, {
      downPct, rate: ratePct, years: termYears, taxAndInsurancePct: DEFAULT_TAX_INSURANCE_PCT,
    }) ?? 0;
    housingLabel = `Est. home price ${estimatedHomePrice.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}`;
  } else {
    housingLine = baseRent;
    housingLabel = `Est. rent ${baseRent.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}/mo`;
  }

  const housingMonthly = housingLine + groceries + utilities + transport + baseHealthcare;
  const monthlyFlexibility = netMonthly - housingMonthly;
  const pctOfIncome = netMonthly > 0 ? (housingMonthly / netMonthly) * 100 : 0;

  return {
    cityCode: countryCode,
    cityName: country?.mainCity ?? countryName,
    countryCode,
    countryName,
    netMonthly,
    effTaxPct,
    taxLabel,
    taxConfidencePlaceholder,
    housingMonthly,
    housingLabel,
    monthlyFlexibility,
    pctOfIncome,
    estimatedHomePrice,
  };
}
