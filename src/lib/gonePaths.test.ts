import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isGonePath } from "./gonePaths";
import sitemap from "../app/sitemap";
import { ALLOWED_CITY_DETAIL_PAGES, ALLOWED_COMPARE_ROUTES, ALLOWED_FIRE_CITY_PAGES, COMPARE_ORIGIN_HUBS } from "./seo-allowlists";

describe("removed city pages answer 410, published ones do not", () => {
  it("never marks a URL in the sitemap as gone", () => {
    const urls = sitemap().map((entry) => new URL(entry.url).pathname);
    expect(urls.length).toBeGreaterThan(50);
    for (const path of urls) expect(isGonePath(path), path).toBe(false);
  });

  it("never marks an allowlisted page as gone", () => {
    for (const id of ALLOWED_FIRE_CITY_PAGES) {
      expect(isGonePath(`/best-cities-for-fire/${id}`), id).toBe(false);
    }
    for (const id of ALLOWED_CITY_DETAIL_PAGES) {
      expect(isGonePath(`/cost-of-living/${id}`), id).toBe(false);
      expect(isGonePath(`/salary-needed-in/${id}`), id).toBe(false);
      expect(isGonePath(`/cost-of-living-in/${id}`), id).toBe(false);
    }
    for (const id of COMPARE_ORIGIN_HUBS) expect(isGonePath(`/compare/${id}`), id).toBe(false);
    for (const { from, to } of ALLOWED_COMPARE_ROUTES) expect(isGonePath(`/compare/${from}/${to}`), `${from}/${to}`).toBe(false);
  });

  it("tolerates a trailing slash on published pages", () => {
    expect(isGonePath("/best-cities-for-fire/austin-tx/")).toBe(false);
    expect(isGonePath("/compare/nyc-ny/austin-tx/")).toBe(false);
  });

  it.each([
    "/compare/chicago-il/denver-co",
    "/compare/nyc-ny/la-ca",
    "/compare/chicago-il",
    "/cost-of-living/phoenix-az",
    "/cost-of-living-in/wichita-ks",
    "/fire-in/wilmington-de",
    "/fire-in/austin-tx",
    "/salary-needed-in/portland-or",
    "/best-cities-for-fire/phoenix-az",
  ])("%s is gone", (path) => {
    expect(isGonePath(path)).toBe(true);
  });

  it("leaves other sections alone", () => {
    for (const path of ["/", "/fire-calculator", "/compare", "/cost-of-living", "/fire-in", "/fire-with-50k-salary", "/about"]) {
      expect(isGonePath(path), path).toBe(false);
    }
  });

  it("the FIRE-in pages redirect to the matching best-cities page", () => {
    const config = readFileSync("next.config.ts", "utf8");
    for (const id of ALLOWED_FIRE_CITY_PAGES) expect(config, id).toContain(id);
    expect(config).toContain('destination: "/best-cities-for-fire/:cityId"');
  });
});
