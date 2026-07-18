import { describe, expect, it } from "vitest";
import { citiesForCountry } from "./internationalCities";
import { createSouthAmericaInitialState } from "./southAmericaCalculatorState";

const southAmericaCountries = new Set(["CO", "BR", "AR", "CL", "PE", "EC", "UY", "PY", "BO", "GY", "SR", "VE"]);
const initialize = (query = "") => createSouthAmericaInitialState(
  new URLSearchParams(query),
  (countryCode) => southAmericaCountries.has(countryCode),
  (countryCode) => citiesForCountry(countryCode)[0]?.code ?? "",
  (cityCode, countryCode) => citiesForCountry(countryCode).some((city) => city.code === cityCode),
);

describe("South America calculator initialization", () => {
  it("initializes a new session with version 2 defaults", () => {
    const state = initialize();
    expect(state.scenarioContract.kind).toBe("v2");
    expect(state).toMatchObject({
      mode: "working", salary: "150000", retirementIncome: "70000",
      fromCountry: "US", toCountry: "CO", fromCityCode: "US-NYC", toCityCode: "CO-MDE",
      destinationRent: "550", currencyDisplay: "USD", needCar: "no", carCostMonthly: "350",
    });
  });

  it("hydrates an unversioned URL once with the legacy contract and raw decimal strings", () => {
    const state = initialize("toCountry=CO&toCityCode=CO-MDE&rent=612.75&groceries=245.5");
    expect(state.scenarioContract.kind).toBe("legacy");
    expect(state.destinationRent).toBe("612.75");
    expect(state.groceries).toBe("245.5");

    state.destinationRent = "700.25";
    expect(state.destinationRent).toBe("700.25");
  });

  it("preserves an unsupported version and its legacy-safe unit meaning", () => {
    const state = initialize("scenarioVersion=3&toCountry=CO&rent=550");
    expect(state.scenarioContract).toMatchObject({
      kind: "unsupported", requestedVersion: "3", destinationInputUnit: "destination-local",
    });
  });

  it("keeps working and retired income values separate", () => {
    const state = initialize("scenarioVersion=2&mode=retired&salary=123456.78&retirement=65432.10");
    expect(state.mode).toBe("retired");
    expect(state.salary).toBe("123456.78");
    expect(state.retirementIncome).toBe("65432.10");
  });

  it("keeps a hidden conditional car value available", () => {
    const state = initialize("scenarioVersion=2&car=no&carCost=487.25");
    expect(state.needCar).toBe("no");
    expect(state.carCostMonthly).toBe("487.25");
  });

  it("hydrates display currency without changing monetary inputs", () => {
    const usd = initialize("scenarioVersion=2&currency=USD&rent=550&savings=25000");
    const destination = initialize("scenarioVersion=2&currency=DESTINATION&rent=550&savings=25000");
    expect(destination.currencyDisplay).toBe("DESTINATION");
    expect(destination.destinationRent).toBe(usd.destinationRent);
    expect(destination.currentSavings).toBe(usd.currentSavings);
  });

  it("normalizes mismatched city selections to the first city for each country", () => {
    const state = initialize("scenarioVersion=2&fromCountry=GB&fromCityCode=US-NYC&toCountry=BR&toCityCode=CO-MDE");
    expect(state.fromCityCode).toBe(citiesForCountry("GB")[0]?.code);
    expect(state.toCityCode).toBe(citiesForCountry("BR")[0]?.code);
    expect(state.scenarioContract.destinationInputUnit).toBe("usd");
  });
});
