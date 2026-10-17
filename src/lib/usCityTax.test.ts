import { describe, expect, it } from "vitest";
import { US_CITY_TAX_LOCATION, usWageEffectiveRate } from "./usCityTax";
import { estimateNetBreakdown } from "./wageTax";
import { estimateInternationalTax } from "./internationalTaxes";
import { findCity } from "./cities";
import { INTERNATIONAL_CITIES } from "./internationalCities";

describe("U.S. city tax for the international calculators", () => {
  it("uses the main calculator's engine, so New York City includes state and city income tax", () => {
    const rate = usWageEffectiveRate("US-NYC", 150_000, "single")!;
    const b = estimateNetBreakdown({ grossAnnual: 150_000, state: "ny", filing: "single", k401Pct: 0, cityId: "nyc-ny" });
    expect(rate).toBeCloseTo(b.totalTax / 150_000, 10);
    expect(b.state).toBeGreaterThan(5_000);
    expect(b.local).toBeGreaterThan(3_000);
    const federalOnly = estimateInternationalTax({ countryCode: "US", annualIncome: 150_000, filing: "single", isRetired: false, incomeScenario: "local", answers: {} }).effectiveRate;
    expect(rate).toBeGreaterThan(federalOnly + 0.07);
  });

  it("a no-income-tax state costs less than New York", () => {
    expect(usWageEffectiveRate("US-AUS", 150_000, "single")!).toBeLessThan(usWageEffectiveRate("US-NYC", 150_000, "single")!);
  });

  it("returns null for unlisted cities and for no income", () => {
    expect(usWageEffectiveRate("PT-LIS", 150_000, "single")).toBeNull();
    expect(usWageEffectiveRate("US-NYC", 0, "single")).toBeNull();
  });

  it("every U.S. city offered in the international calculators is mapped to a real city", () => {
    for (const city of INTERNATIONAL_CITIES.filter((c) => c.countryCode === "US")) {
      const place = US_CITY_TAX_LOCATION[city.code];
      expect(place, city.code).toBeDefined();
      expect(findCity(place.cityId), place.cityId).toBeTruthy();
    }
  });
});
