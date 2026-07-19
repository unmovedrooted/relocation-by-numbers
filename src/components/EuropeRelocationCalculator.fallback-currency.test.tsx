import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { convertUsdAmountToLocal, USD_TO_LOCAL } from "../lib/internationalFx";

const source = readFileSync(
  fileURLToPath(new URL("./EuropeRelocationCalculator.tsx", import.meta.url)),
  "utf8",
);

describe("Europe relocation fallback currency contract", () => {
  it("localizes USD fallback values before storing destination inputs", () => {
    expect(convertUsdAmountToLocal(1400, "CZ")).toBe(32480);
    expect(convertUsdAmountToLocal(1100, "HU")).toBe(401500);
    expect(32480 / USD_TO_LOCAL.CZ).toBe(1400);
    expect(401500 / USD_TO_LOCAL.HU).toBe(1100);
    expect(source).toContain("const local = (amountUsd: number) => String(convertUsdToLocal(amountUsd, countryCode))");
  });

  it("replaces every currency-sensitive fallback instead of retaining prior-country values", () => {
    const fallback = source.slice(source.indexOf("function applyCountryFallback"), source.indexOf("function changeFromCountry"));
    for (const setter of [
      "setDestinationRent", "setDepositRequired", "setFirstMonthRent", "setLastMonthRent",
      "setGroceries", "setUtilities", "setTransportation", "setHealthcare",
      "setVisaCost", "setFlightCost", "setShippingCost", "setTemporaryStay",
      "setAdminFees", "setFurnitureSetup", "setEmergencyCashBuffer", "setCarCostMonthly",
    ]) {
      expect(fallback).toContain(`${setter}(`);
    }
  });

  it("refreshes hidden car cost for both city presets and country fallbacks", () => {
    const cityPreset = source.slice(source.indexOf("function applyCityDefaults"), source.indexOf("function applyCountryFallback"));
    const countryFallback = source.slice(source.indexOf("function applyCountryFallback"), source.indexOf("function changeFromCountry"));
    expect(cityPreset).toContain("setCarCostMonthly");
    expect(countryFallback).toContain("setCarCostMonthly");
  });

  it("uses the same corrected paths for reset", () => {
    const reset = source.slice(source.indexOf("function resetInputsKeepContext"), source.indexOf("const badge"));
    expect(reset).toContain("applyCityDefaults(toCityCode)");
    expect(reset).toContain("applyCountryFallback(toCountry)");
  });
});
