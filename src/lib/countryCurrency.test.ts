import { describe, expect, it } from "vitest";
import { COUNTRY_CURRENCY, USD_TO_LOCAL } from "./internationalFx";

describe("country currencies", () => {
  it("names a currency for every country that has an exchange rate", () => {
    const missing = Object.keys(USD_TO_LOCAL).filter((code) => code !== "XCD" && !COUNTRY_CURRENCY[code]);
    expect(missing).toEqual([]);
  });

  it("uses the local currency, not USD, where the rate is not 1", () => {
    for (const [code, rate] of Object.entries(USD_TO_LOCAL)) {
      if (rate !== 1) expect(COUNTRY_CURRENCY[code], code).not.toBe("USD");
    }
  });

  it("keeps the dollarized countries on USD", () => {
    for (const code of ["EC", "PA", "PR", "VI"]) expect(COUNTRY_CURRENCY[code]).toBe("USD");
  });
});
