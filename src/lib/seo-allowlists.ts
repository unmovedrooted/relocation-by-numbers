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