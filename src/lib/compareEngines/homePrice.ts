/**
 * International/Caribbean home-price estimator for the compare-cities tool's
 * Buy mode.
 *
 * None of the country/city data files in this app (internationalCountries.ts,
 * internationalCityDefaults.ts, caribbeanCountries.ts) carry a verified
 * home-price figure — only rent. Rather than inventing per-country prices
 * with no source, this derives a rough estimate from each destination's
 * already-verified rent figure using a flat price-to-rent ratio, a standard
 * real-estate rule of thumb (home price ≈ N years of rent). It's explicitly
 * a planning estimate, labeled as such in the UI, not a real listing price.
 */

// Home price ≈ 16x annual rent — a reasonable global mid-point. Actual
// price-to-rent ratios vary a lot by market (roughly 10-15 in cheaper
// markets, 25+ in tight/expensive ones), but with no per-country data to
// vary it responsibly, one flat, clearly-labeled multiplier is more honest
// than fabricating country-by-country ratios this app can't verify.
export const PRICE_TO_RENT_RATIO = 16;

// Placeholder combined property-tax + insurance rate (% of home price/year)
// used only for the Buy-mode monthly estimate, since no country here has a
// modeled property tax rate the way US_STATE_DEFAULTS does for US states.
export const DEFAULT_TAX_INSURANCE_PCT = 0.015;

export function estimateHomePriceFromRent(monthlyRent: number): number {
  if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) return 0;
  return monthlyRent * 12 * PRICE_TO_RENT_RATIO;
}
