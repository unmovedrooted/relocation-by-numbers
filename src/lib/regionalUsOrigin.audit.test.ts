import { describe, expect, it } from "vitest";
import { loadCalculator } from "./regionalHarness";

// The regional calculators take the current side's tax for a U.S. city from the main engine, so New York City includes state and
// city income tax (previously every regional calculator used federal and payroll tax only).
describe("regional calculators: current-side tax for a U.S. origin city", () => {
  for (const region of ["Europe", "Asia", "Caribbean", "SouthAmerica"]) {
    it(`${region}: New York City take-home is below the federal-only figure and Austin's is above it`, async () => {
      const calc = await loadCalculator(region);
      const base = { toCountry: region === "Asia" ? "SG" : region === "Caribbean" ? "JM" : region === "SouthAmerica" ? "CO" : "PT", mode: "working", salary: "150000", salaryType: "remote" };
      const federalOnly = calc({ ...base, fromCityCode: "" }).netMonthlyFrom as number;
      const nyc = calc({ ...base, fromCityCode: "US-NYC" }).netMonthlyFrom as number;
      const austin = calc({ ...base, fromCityCode: "US-AUS" }).netMonthlyFrom as number;
      expect(nyc).toBeLessThan(federalOnly - 500);
      expect(austin).toBeCloseTo(federalOnly, 0);
      expect(nyc).toBeLessThan(austin);
    });
  }
});
