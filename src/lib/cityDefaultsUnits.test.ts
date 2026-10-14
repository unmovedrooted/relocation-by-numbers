import { describe, expect, it } from "vitest";
import { getCityDefaultsByCode, getCityDefaultsLocal, getCityDefaultsUsd } from "./internationalCityDefaults";
import { USD_TO_LOCAL } from "./internationalFx";

describe("city default units", () => {
  it("keeps euro-denominated Lisbon amounts as they are in local currency", () => {
    expect(getCityDefaultsLocal("PT-LIS")!.monthlyDefaults.rent).toBe(2200);
  });

  it("converts Lisbon to dollars at the Treasury rate", () => {
    expect(getCityDefaultsUsd("PT-LIS")!.monthlyDefaults.rent).toBe(Math.round(2200 / USD_TO_LOCAL.PT));
  });

  it("converts dollar rows such as Bangkok to baht for local-currency fields", () => {
    const usd = getCityDefaultsByCode("TH-BKK")!.monthlyDefaults.rent;
    expect(getCityDefaultsLocal("TH-BKK")!.monthlyDefaults.rent).toBe(Math.round(usd * USD_TO_LOCAL.TH));
    expect(getCityDefaultsUsd("TH-BKK")!.monthlyDefaults.rent).toBe(usd);
  });

  it("returns null for an unknown code", () => {
    expect(getCityDefaultsLocal("XX-NOPE")).toBeNull();
    expect(getCityDefaultsUsd("XX-NOPE")).toBeNull();
  });
});
