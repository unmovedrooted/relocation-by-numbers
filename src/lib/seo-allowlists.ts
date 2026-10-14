import type { StateCode } from "@/lib/states";

export const ALLOWED_FIRE_CITY_PAGES = [
  "charlotte-nc",
  "austin-tx",
  "miami-fl",
  "atlanta-ga",
  "denver-co",
  "seattle-wa",
  "nyc-ny",
  "dallas-tx",
  "raleigh-nc",
  "boston-ma",
] as const;

export const ALLOWED_CITY_DETAIL_PAGES = [
  "nyc-ny",
  "charlotte-nc",
  "austin-tx",
  "la-ca",
  "seattle-wa",
  "boston-ma",
  "miami-fl",
] as const;

export const ALLOWED_COMPARE_ROUTES = [
  { from: "nyc-ny", to: "charlotte-nc" },
  { from: "nyc-ny", to: "austin-tx" },
  { from: "nyc-ny", to: "miami-fl" },
  { from: "la-ca", to: "austin-tx" },
  { from: "la-ca", to: "charlotte-nc" },
  { from: "seattle-wa", to: "dallas-tx" },
  { from: "seattle-wa", to: "miami-fl" },
  { from: "boston-ma", to: "miami-fl" },
  { from: "boston-ma", to: "charlotte-nc" },
  { from: "seattle-wa", to: "charlotte-nc" },
] as const;

/** Origin cities that have a /compare/[from] hub (each has at least one indexed pair). Chicago has no pairs, so no hub. */
export const COMPARE_ORIGIN_HUBS = ["nyc-ny", "la-ca", "seattle-wa", "boston-ma"] as const;

/** Destinations listed on every hub; pairs outside ALLOWED_COMPARE_ROUTES link to the prefilled calculator instead. */
export const COMPARE_HUB_DESTINATIONS = ["charlotte-nc", "austin-tx", "miami-fl", "dallas-tx"] as const;

export const ALLOWED_STATE_CODES: StateCode[] = [
  "tx",
  "fl",
  "tn",
  "nc",
  "ga",
  "nv",
  "wa",
  "az",
  "co",
  "ny",
  "ca",
  "ma",
];
