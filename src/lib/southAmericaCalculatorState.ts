import { getSouthAmericaScenarioContract } from "./southAmericaCurrencyContract";

export type SouthAmericaCalculatorInitialState = {
  mode: "working" | "retired";
  salary: string;
  retirementIncome: string;
  filing: "single" | "married";
  fromCountry: string;
  toCountry: string;
  fromCityCode: string;
  toCityCode: string;
  currencyDisplay: "USD" | "CURRENT" | "DESTINATION";
  salaryType: "remote" | "local" | "freelance";
  adults: string;
  children: string;
  destinationRent: string;
  depositRequired: string;
  firstMonthRent: string;
  lastMonthRent: string;
  furnished: "furnished" | "unfurnished";
  utilitiesIncluded: "yes" | "no";
  groceries: string;
  utilities: string;
  transportation: string;
  healthcare: string;
  visaCost: string;
  flightCost: string;
  shippingCost: string;
  temporaryStay: string;
  adminFees: string;
  furnitureSetup: string;
  emergencyCashBuffer: string;
  currentSavings: string;
  needCar: "yes" | "no";
  carCostMonthly: string;
  scenarioContract: ReturnType<typeof getSouthAmericaScenarioContract>;
};

const defaults: Omit<SouthAmericaCalculatorInitialState, "scenarioContract"> = {
  mode: "working", salary: "150000", retirementIncome: "70000", filing: "single",
  fromCountry: "US", toCountry: "CO", fromCityCode: "US-NYC", toCityCode: "CO-MDE",
  currencyDisplay: "USD", salaryType: "remote", adults: "1", children: "0",
  destinationRent: "550", depositRequired: "550", firstMonthRent: "550", lastMonthRent: "0",
  furnished: "unfurnished", utilitiesIncluded: "no", groceries: "250", utilities: "80",
  transportation: "60", healthcare: "90", visaCost: "160", flightCost: "450",
  shippingCost: "400", temporaryStay: "1200", adminFees: "200", furnitureSetup: "900",
  emergencyCashBuffer: "3500", currentSavings: "25000", needCar: "no", carCostMonthly: "350",
};

export function createSouthAmericaInitialState(
  params: URLSearchParams,
  isSouthAmericaCountry: (countryCode: string) => boolean,
  firstCityForCountry: (countryCode: string) => string,
  cityBelongsToCountry: (cityCode: string, countryCode: string) => boolean,
): SouthAmericaCalculatorInitialState {
  const state: SouthAmericaCalculatorInitialState = {
    ...defaults,
    scenarioContract: getSouthAmericaScenarioContract(params),
  };

  const enumValue = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const value = params.get(key) as T | null;
    return value !== null && allowed.includes(value) ? value : fallback;
  };
  const raw = (key: string, fallback: string) => params.get(key) || fallback;

  state.mode = enumValue("mode", ["working", "retired"], state.mode);
  state.filing = enumValue("filing", ["single", "married"], state.filing);
  state.fromCountry = raw("fromCountry", state.fromCountry);
  const requestedToCountry = params.get("toCountry");
  state.toCountry = requestedToCountry && isSouthAmericaCountry(requestedToCountry)
    ? requestedToCountry
    : state.toCountry;
  state.fromCityCode = raw("fromCityCode", state.fromCityCode);
  state.toCityCode = raw("toCityCode", state.toCityCode);
  if (!cityBelongsToCountry(state.fromCityCode, state.fromCountry)) {
    state.fromCityCode = firstCityForCountry(state.fromCountry);
  }
  if (!cityBelongsToCountry(state.toCityCode, state.toCountry)) {
    state.toCityCode = firstCityForCountry(state.toCountry);
  }

  state.salary = raw("salary", state.salary);
  state.retirementIncome = raw("retirement", state.retirementIncome);
  state.currencyDisplay = enumValue("currency", ["USD", "CURRENT", "DESTINATION"], state.currencyDisplay);
  state.salaryType = enumValue("salaryType", ["remote", "local", "freelance"], state.salaryType);
  state.adults = raw("adults", state.adults);
  state.children = raw("children", state.children);
  state.destinationRent = raw("rent", state.destinationRent);
  state.depositRequired = raw("deposit", state.depositRequired);
  state.firstMonthRent = raw("firstRent", state.firstMonthRent);
  state.lastMonthRent = raw("lastRent", state.lastMonthRent);
  state.furnished = enumValue("furnished", ["furnished", "unfurnished"], state.furnished);
  state.utilitiesIncluded = enumValue("utilIncl", ["yes", "no"], state.utilitiesIncluded);
  state.groceries = raw("groceries", state.groceries);
  state.utilities = raw("utilities", state.utilities);
  state.transportation = raw("transport", state.transportation);
  state.healthcare = raw("healthcare", state.healthcare);
  state.visaCost = raw("visa", state.visaCost);
  state.flightCost = raw("flight", state.flightCost);
  state.shippingCost = raw("shipping", state.shippingCost);
  state.temporaryStay = raw("tempStay", state.temporaryStay);
  state.adminFees = raw("admin", state.adminFees);
  state.furnitureSetup = raw("furniture", state.furnitureSetup);
  state.emergencyCashBuffer = raw("emergency", state.emergencyCashBuffer);
  state.currentSavings = raw("savings", state.currentSavings);
  state.needCar = enumValue("car", ["yes", "no"], state.needCar);
  state.carCostMonthly = raw("carCost", state.carCostMonthly);
  return state;
}
