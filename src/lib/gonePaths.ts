import {
  ALLOWED_CITY_DETAIL_PAGES,
  ALLOWED_COMPARE_ROUTES,
  ALLOWED_FIRE_CITY_PAGES,
  COMPARE_ORIGIN_HUBS,
} from "./seo-allowlists";

/**
 * City-page URLs the site no longer publishes. The page types below only exist for the cities in seo-allowlists.ts; any other
 * city or city pair is gone on purpose (thin programmatic pages that were removed), so the proxy answers 410 instead of 404.
 * This reads the same allowlists the pages use, so adding a city there publishes it here too.
 */
const has = (list: readonly string[], id: string) => list.includes(id);

export function isGonePath(pathname: string): boolean {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const [family, a, b, ...rest] = parts;
  if (!family || !a || rest.length > 0) return false;

  switch (family) {
    case "fire-in":
    case "best-cities-for-fire":
      return b === undefined && !has(ALLOWED_FIRE_CITY_PAGES, a);
    case "cost-of-living":
    case "salary-needed-in":
      return b === undefined && !has(ALLOWED_CITY_DETAIL_PAGES, a);
    case "cost-of-living-in":
      // Allowed cities are redirected to /cost-of-living/:city by next.config before the proxy runs.
      return b === undefined && !has(ALLOWED_CITY_DETAIL_PAGES, a);
    case "compare":
      if (b === undefined) return !has(COMPARE_ORIGIN_HUBS, a);
      return !ALLOWED_COMPARE_ROUTES.some((route) => route.from === a && route.to === b);
    default:
      return false;
  }
}
