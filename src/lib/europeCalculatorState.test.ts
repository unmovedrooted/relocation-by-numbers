import { describe, expect, it } from "vitest";
import { citiesForCountry } from "./internationalCities";
import { getCityDefaultsByCode } from "./internationalCityDefaults";
import { USD_TO_LOCAL } from "./internationalFx";
import {
  buildEuropeSearchParams,
  createEuropeCityPresetPatch,
  createEuropeInitialState,
  EUROPE_CALCULATOR_DEFAULT_STATE,
} from "./europeCalculatorState";

const europeCountries = new Set([
  "GB", "PT", "ES", "DE", "NL", "FR", "IT", "IE", "CH", "AT", "BE", "DK", "SE", "NO", "FI",
  "PL", "CZ", "HU", "GR", "TR", "HR", "EE", "LV", "LT", "RO", "BG", "SI", "SK", "MT", "CY",
]);
const sortedCities = (countryCode: string) => [...citiesForCountry(countryCode)].sort((a, b) =>
  a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" }),
);
const initialize = (query = "") => createEuropeInitialState(
  new URLSearchParams(query),
  (countryCode) => countryCode === "US" || europeCountries.has(countryCode),
  (countryCode) => europeCountries.has(countryCode),
  (countryCode) => sortedCities(countryCode)[0]?.code ?? "",
  (cityCode, countryCode) => citiesForCountry(countryCode).some((city) => city.code === cityCode),
);

describe("Europe calculator URL state", () => {
  it("initializes the effective Lisbon defaults without a post-hydration jump", () => {
    expect(initialize()).toEqual(EUROPE_CALCULATOR_DEFAULT_STATE);
    expect(initialize().depositRequired).toBe("4400");
  });

  it("hydrates direct URL values without allowing Lisbon presets to overwrite them", () => {
    const state = initialize("mode=retired&rent=1234.56&deposit=99.5&groceries=321.25&currency=DESTINATION");
    expect(state).toMatchObject({
      mode: "retired", destinationRent: "1234.56", depositRequired: "99.5",
      groceries: "321.25", currencyDisplay: "DESTINATION",
    });
  });

  it("preserves exact decimal strings and explicit blanks", () => {
    const state = initialize("salary=123456.780&rent=&carCost=487.25");
    expect(state.salary).toBe("123456.780");
    expect(state.destinationRent).toBe("");
    expect(state.carCostMonthly).toBe("487.25");
    const output = buildEuropeSearchParams(state);
    expect(output.has("rent")).toBe(false);
    expect(output.get("salary")).toBe("123456.780");
  });

  it("preserves valid conditional tax answers", () => {
    const state = initialize(`toCountry=GB&taxAnswers=${encodeURIComponent(JSON.stringify({ region: "england", resident: "yes" }))}`);
    expect(state.conditionalAnswers).toEqual({ region: "england", resident: "yes" });
    expect(JSON.parse(buildEuropeSearchParams(state).get("taxAnswers") ?? "{}")).toEqual(state.conditionalAnswers);
  });

  it.each([
    ["malformed JSON", "{"],
    ["array JSON", '["england"]'],
    ["primitive JSON", "42"],
  ])("rejects %s tax answers", (_name, raw) => {
    expect(initialize(`taxAnswers=${encodeURIComponent(raw)}`).conditionalAnswers).toEqual({});
  });

  it("normalizes current and destination cities to their selected countries", () => {
    const state = initialize("fromCountry=GB&fromCityCode=US-NYC&toCountry=DE&toCityCode=PT-LIS");
    expect(state.fromCityCode).toBe(sortedCities("GB")[0]?.code);
    expect(state.toCityCode).toBe(sortedCities("DE")[0]?.code);
  });

  it("rejects unknown current countries and non-European destinations", () => {
    const state = initialize("fromCountry=XX&toCountry=US&fromCityCode=XX-NOPE&toCityCode=US-NYC");
    expect(state).toMatchObject({ fromCountry: "US", toCountry: "PT", fromCityCode: sortedCities("US")[0]?.code });
    expect(citiesForCountry("PT").some((city) => city.code === state.toCityCode)).toBe(true);
  });

  it("keeps working and retired values separate and retains a hidden car value", () => {
    const state = initialize("mode=retired&salary=150001.25&retirement=70002.50&car=no&carCost=487.25");
    expect(state).toMatchObject({
      mode: "retired", salary: "150001.25", retirementIncome: "70002.50",
      needCar: "no", carCostMonthly: "487.25",
    });
  });

  it("keeps display currency presentation-only in serialized state", () => {
    const usd = initialize("currency=USD&rent=2200&savings=25000");
    const destination = { ...usd, currencyDisplay: "DESTINATION" as const };
    expect(buildEuropeSearchParams(destination).get("rent")).toBe("2200");
    expect(buildEuropeSearchParams(destination).get("savings")).toBe("25000");
    expect(buildEuropeSearchParams(destination).get("currency")).toBe("DESTINATION");
  });

  it("creates the destination-city preset exactly once from the existing dataset", () => {
    const lisbon = getCityDefaultsByCode("PT-LIS");
    expect(lisbon).toBeDefined();
    const patch = createEuropeCityPresetPatch(lisbon!);
    expect(patch).toMatchObject({
      destinationRent: "2200", depositRequired: "4400", firstMonthRent: "2200",
      groceries: "420", utilities: "150", transportation: "45", healthcare: "120",
      visaCost: "250", flightCost: "650", furnitureSetup: "1200",
    });
    expect(createEuropeCityPresetPatch(lisbon!)).toEqual(patch);
  });

  it("does not reinitialize a later user edit", () => {
    const state = initialize("rent=1234.56");
    state.destinationRent = "1777.25";
    expect(buildEuropeSearchParams(state).get("rent")).toBe("1777.25");
  });

  it("preserves every existing URL key and does not introduce scenarioVersion", () => {
    const output = buildEuropeSearchParams(initialize("taxAnswers=%7B%22region%22%3A%22england%22%7D"));
    expect([...output.keys()]).toEqual(expect.arrayContaining([
      "mode", "filing", "fromCountry", "toCountry", "fromCityCode", "toCityCode", "salary", "retirement",
      "currency", "salaryType", "adults", "children", "rent", "deposit", "firstRent", "lastRent", "furnished",
      "utilIncl", "groceries", "utilities", "transport", "healthcare", "visa", "flight", "shipping", "tempStay",
      "admin", "furniture", "emergency", "savings", "car", "carCost", "taxAnswers",
    ]));
    expect(output.has("scenarioVersion")).toBe(false);
  });

  it("matches the production Lisbon known answers without NaN or Infinity", () => {
    const state = initialize();
    const rate = USD_TO_LOCAL.PT;
    const rent = Number(state.destinationRent) / rate;
    const utilities = Number(state.utilities) / rate;
    const living = (Number(state.groceries) + Number(state.transportation) + Number(state.healthcare)) / rate;
    const housing = rent + utilities;
    const upfront = [
      state.depositRequired, state.firstMonthRent, state.lastMonthRent, state.visaCost, state.flightCost,
      state.shippingCost, state.temporaryStay, state.adminFees, state.furnitureSetup, state.emergencyCashBuffer,
    ].reduce((sum, value) => sum + Number(value), 0) / rate;
    expect(rent).toBeCloseTo(2588.235294, 6);
    expect(utilities).toBeCloseTo(176.470588, 6);
    expect(living).toBeCloseTo(688.235294, 6);
    expect(housing).toBeCloseTo(2764.705882, 6);
    expect(upfront).toBeCloseTo(19058.823529, 6);
    for (const result of [rent, utilities, living, housing, upfront]) {
      expect(Number.isFinite(result)).toBe(true);
    }
  });
});
