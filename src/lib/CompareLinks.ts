// src/lib/compareLinks.ts

import { MAJOR_CITIES } from "./majorCities";

function cityLabelById(id: string) {
  const c = MAJOR_CITIES.find((x) => x.id === id);
  return c ? c.name : id;
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

  const targetLabel = cityLabelById(targetCityId);

  return MAJOR_CITIES
    .filter((c) => c.id !== targetCityId) // ✅ prevents Austin vs Austin
    .slice(0, limit)
    .map((c) => ({
      href: `/compare/${c.id}/${targetCityId}`,
      label: `${c.name} vs ${targetLabel}`,
    }));
}