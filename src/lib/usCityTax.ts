import { estimateNetBreakdown } from "./wageTax";
import type { StateCode } from "./states";
import type { FilingStatus } from "./tax";

/** The U.S. cities offered in the international calculators, with the state and city whose income tax rules apply. */
export const US_CITY_TAX_LOCATION: Record<string, { state: StateCode; cityId: string }> = {
  "US-NYC": { state: "ny", cityId: "nyc-ny" },
  "US-LAX": { state: "ca", cityId: "la-ca" },
  "US-MIA": { state: "fl", cityId: "miami-fl" },
  "US-CHI": { state: "il", cityId: "chicago-il" },
  "US-ATL": { state: "ga", cityId: "atlanta-ga" },
  "US-AUS": { state: "tx", cityId: "austin-tx" },
  "US-DAL": { state: "tx", cityId: "dallas-tx" },
  "US-SEA": { state: "wa", cityId: "seattle-wa" },
  "US-BNA": { state: "tn", cityId: "nashville-tn" },
  "US-CLT": { state: "nc", cityId: "charlotte-nc" },
};

/**
 * Effective tax rate (federal, state, local and payroll) for wages earned in one of the listed U.S. cities, from the same engine
 * as the main relocation calculator. Returns null when the city is not listed or there is no income, so callers fall back to
 * the federal-only estimate.
 */
export function usWageEffectiveRate(cityCode: string, annualIncomeUsd: number, filing: FilingStatus): number | null {
  const place = US_CITY_TAX_LOCATION[cityCode];
  if (!place || !(annualIncomeUsd > 0)) return null;
  const b = estimateNetBreakdown({ grossAnnual: annualIncomeUsd, state: place.state, filing, k401Pct: 0, cityId: place.cityId });
  return b.gross > 0 ? Math.min(0.9, Math.max(0, b.totalTax / b.gross)) : null;
}
