import { describe, expect, it } from "vitest";
import { buildCityReport } from "./cityReport";
import { ALLOWED_CITY_DETAIL_PAGES, ALLOWED_FIRE_CITY_PAGES } from "./seo-allowlists";

describe("single-city report numbers", () => {
  it("builds a complete report for every city that has a city page", () => {
    const ids = new Set<string>([...ALLOWED_CITY_DETAIL_PAGES, ...ALLOWED_FIRE_CITY_PAGES]);
    for (const id of ids) {
      const r = buildCityReport(id);
      expect(r, id).not.toBeNull();
      expect(r!.cost.priceLevel, `${id} price level`).not.toBeNull();
      expect(r!.cost.rent, `${id} rent`).not.toBeNull();
      expect(r!.cost.electricityCents, `${id} electricity`).not.toBeNull();
      expect(r!.housing.incomeToBuy, `${id} buy income`).not.toBeNull();
      expect(r!.migration.origins.length, `${id} origins`).toBeGreaterThan(3);
      expect(r!.migration.net).toBe(r!.migration.inflow - r!.migration.outflow);
      for (const row of r!.salaryRows) {
        expect(row.monthlyNet).toBeCloseTo(row.tax.net / 12, 6);
        expect(row.afterRent).toBeCloseTo(row.monthlyNet - r!.cost.rent!, 6);
      }
    }
  });

  it("a high-tax, high-cost city keeps less of the same salary than a no-income-tax one", () => {
    const ny = buildCityReport("nyc-ny")!;
    const tx = buildCityReport("austin-tx")!;
    expect(ny.taxAtHeadline.net).toBeLessThan(tx.taxAtHeadline.net);
    expect(ny.cost.priceLevel!).toBeGreaterThan(tx.cost.priceLevel!);
    expect(ny.housing.incomeToRent!).toBeGreaterThan(tx.housing.incomeToRent!);
  });
});
