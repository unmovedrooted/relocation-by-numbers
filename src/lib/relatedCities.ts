const MAJOR_CITY_IDS = [
  "nyc-ny",
  "charlotte-nc",
  "austin-tx",
  "la-ca",
  "seattle-wa",
  "boston-ma",
  "miami-fl",
] as const;

export function relatedCityIds(cityId: string, count = 4) {
  // simple deterministic: same order, skip current city, take first N
  return MAJOR_CITY_IDS.filter((id) => id !== cityId).slice(0, count);
}

export const TOP_COST_OF_LIVING_CITY_IDS = MAJOR_CITY_IDS;