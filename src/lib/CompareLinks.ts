// src/lib/compareLinks.ts

import { MAJOR_CITIES } from "./majorCities";
import { ALLOWED_COMPARE_ROUTES } from "./seo-allowlists";

function cityLabelById(id: string) {
  const c = MAJOR_CITIES.find((x) => x.id === id);
  return c ? c.name : id;
}

function isMajorCityId(id: string) {
  return MAJOR_CITIES.some((c) => c.id === id);
}

/**
 * Cost-of-living page helper:
 * Builds links like "NYC vs Austin" where `targetCityId` is always one side.
 */
export function buildCompareAgainstCityLinks(
  targetCityId: string,
  opts?: { limit?: number }
) {
  const limit = opts?.limit ?? 4;

  if (!isMajorCityId(targetCityId)) return [];

  const targetLabel = cityLabelById(targetCityId);

  return MAJOR_CITIES
    .filter((c) =>
      ALLOWED_COMPARE_ROUTES.some(
        (route) => route.from === c.id && route.to === targetCityId,
      ),
    )
    .slice(0, limit)
    .map((c) => ({
      href: `/compare/${c.id}/${targetCityId}`,
      label: `${c.name} vs ${targetLabel}`,
    }));
}
