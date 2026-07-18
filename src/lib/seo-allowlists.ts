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
