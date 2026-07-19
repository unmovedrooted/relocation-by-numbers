export type EuropeMode = "working" | "retired";
export type EuropeFilingStatus = "single" | "married";
export type EuropeSalaryType = "local" | "remote";
export type EuropeFurnishedType = "furnished" | "unfurnished";
export type EuropeYesNo = "yes" | "no";
export type EuropeCurrencyDisplay = "USD" | "CURRENT" | "DESTINATION";

export type EuropeCalculatorState = {
  mode: EuropeMode;
  salary: string;
  retirementIncome: string;
  filing: EuropeFilingStatus;
  fromCountry: string;
  toCountry: string;
  fromCityCode: string;
  toCityCode: string;
  currencyDisplay: EuropeCurrencyDisplay;
  salaryType: EuropeSalaryType;
  adults: string;
  children: string;
  conditionalAnswers: Record<string, string>;
  destinationRent: string;
  depositRequired: string;
  firstMonthRent: string;
  lastMonthRent: string;
  furnished: EuropeFurnishedType;
  utilitiesIncluded: EuropeYesNo;
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
  needCar: EuropeYesNo;
  carCostMonthly: string;
};

export const EUROPE_CALCULATOR_DEFAULT_STATE: EuropeCalculatorState = {
  mode: "working", salary: "150000", retirementIncome: "70000", filing: "single",
  fromCountry: "US", toCountry: "PT", fromCityCode: "US-NYC", toCityCode: "PT-LIS",
  currencyDisplay: "USD", salaryType: "remote", adults: "1", children: "0",
  conditionalAnswers: {}, destinationRent: "2200", depositRequired: "4400",
  firstMonthRent: "2200", lastMonthRent: "0", furnished: "unfurnished",
  utilitiesIncluded: "no", groceries: "420", utilities: "150", transportation: "45",
  healthcare: "120", visaCost: "250", flightCost: "650", shippingCost: "400",
  temporaryStay: "1800", adminFees: "300", furnitureSetup: "1200",
  emergencyCashBuffer: "5000", currentSavings: "25000", needCar: "no",
  carCostMonthly: "300",
};

type EuropeCityPreset = {
  monthlyDefaults: { rent: number; groceries: number; utilities: number; transport: number; healthcare: number };
  housing: { depositMonths: number; lastMonthRentDefault: number; furnishedSetupCost: number; utilitiesIncludedDefault: EuropeYesNo };
  startupCosts: { visa: number; flight: number; shipping: number; temporaryStay: number; adminFees: number; emergencyBuffer: number };
};

export function createEuropeCityPresetPatch(preset: EuropeCityPreset) {
  return {
    destinationRent: String(preset.monthlyDefaults.rent),
    depositRequired: String(preset.monthlyDefaults.rent * preset.housing.depositMonths),
    firstMonthRent: String(preset.monthlyDefaults.rent),
    lastMonthRent: String(preset.housing.lastMonthRentDefault),
    utilitiesIncluded: preset.housing.utilitiesIncludedDefault,
    groceries: String(preset.monthlyDefaults.groceries),
    utilities: String(preset.monthlyDefaults.utilities),
    transportation: String(preset.monthlyDefaults.transport),
    healthcare: String(preset.monthlyDefaults.healthcare),
    visaCost: String(preset.startupCosts.visa),
    flightCost: String(preset.startupCosts.flight),
    shippingCost: String(preset.startupCosts.shipping),
    temporaryStay: String(preset.startupCosts.temporaryStay),
    adminFees: String(preset.startupCosts.adminFees),
    furnitureSetup: String(preset.housing.furnishedSetupCost),
    emergencyCashBuffer: String(preset.startupCosts.emergencyBuffer),
  };
}

function parseConditionalAnswers(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string");
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export function createEuropeInitialState(
  params: URLSearchParams,
  isKnownCountry: (countryCode: string) => boolean,
  isEuropeCountry: (countryCode: string) => boolean,
  firstCityForCountry: (countryCode: string) => string,
  cityBelongsToCountry: (cityCode: string, countryCode: string) => boolean,
): EuropeCalculatorState {
  const state: EuropeCalculatorState = {
    ...EUROPE_CALCULATOR_DEFAULT_STATE,
    conditionalAnswers: {},
  };
  const enumValue = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const value = params.get(key) as T | null;
    return value !== null && allowed.includes(value) ? value : fallback;
  };
  const raw = (key: string, fallback: string) => params.has(key) ? params.get(key) ?? "" : fallback;

  state.mode = enumValue("mode", ["working", "retired"], state.mode);
  state.filing = enumValue("filing", ["single", "married"], state.filing);
  const fromCountry = params.get("fromCountry");
  state.fromCountry = fromCountry && isKnownCountry(fromCountry) ? fromCountry : state.fromCountry;
  const toCountry = params.get("toCountry");
  state.toCountry = toCountry && isEuropeCountry(toCountry) ? toCountry : state.toCountry;
  state.fromCityCode = raw("fromCityCode", state.fromCityCode);
  state.toCityCode = raw("toCityCode", state.toCityCode);
  if (!cityBelongsToCountry(state.fromCityCode, state.fromCountry)) state.fromCityCode = firstCityForCountry(state.fromCountry);
  if (!cityBelongsToCountry(state.toCityCode, state.toCountry)) state.toCityCode = firstCityForCountry(state.toCountry);

  state.salary = raw("salary", state.salary);
  state.retirementIncome = raw("retirement", state.retirementIncome);
  state.currencyDisplay = enumValue("currency", ["USD", "CURRENT", "DESTINATION"], state.currencyDisplay);
  state.salaryType = enumValue("salaryType", ["remote", "local"], state.salaryType);
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
  state.conditionalAnswers = parseConditionalAnswers(params.get("taxAnswers"));
  return state;
}

export function buildEuropeSearchParams(state: EuropeCalculatorState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("mode", state.mode); params.set("filing", state.filing);
  params.set("fromCountry", state.fromCountry); params.set("toCountry", state.toCountry);
  if (state.fromCityCode) params.set("fromCityCode", state.fromCityCode);
  if (state.toCityCode) params.set("toCityCode", state.toCityCode);
  if (state.salary) params.set("salary", state.salary);
  if (state.retirementIncome) params.set("retirement", state.retirementIncome);
  params.set("currency", state.currencyDisplay); params.set("salaryType", state.salaryType);
  if (state.adults) params.set("adults", state.adults);
  if (state.children) params.set("children", state.children);
  if (state.destinationRent) params.set("rent", state.destinationRent);
  if (state.depositRequired) params.set("deposit", state.depositRequired);
  if (state.firstMonthRent) params.set("firstRent", state.firstMonthRent);
  if (state.lastMonthRent) params.set("lastRent", state.lastMonthRent);
  params.set("furnished", state.furnished); params.set("utilIncl", state.utilitiesIncluded);
  if (state.groceries) params.set("groceries", state.groceries);
  if (state.utilities) params.set("utilities", state.utilities);
  if (state.transportation) params.set("transport", state.transportation);
  if (state.healthcare) params.set("healthcare", state.healthcare);
  if (state.visaCost) params.set("visa", state.visaCost);
  if (state.flightCost) params.set("flight", state.flightCost);
  if (state.shippingCost) params.set("shipping", state.shippingCost);
  if (state.temporaryStay) params.set("tempStay", state.temporaryStay);
  if (state.adminFees) params.set("admin", state.adminFees);
  if (state.furnitureSetup) params.set("furniture", state.furnitureSetup);
  if (state.emergencyCashBuffer) params.set("emergency", state.emergencyCashBuffer);
  if (state.currentSavings) params.set("savings", state.currentSavings);
  params.set("car", state.needCar);
  if (state.carCostMonthly) params.set("carCost", state.carCostMonthly);
  if (Object.keys(state.conditionalAnswers).length > 0) {
    params.set("taxAnswers", JSON.stringify(state.conditionalAnswers));
  }
  return params;
}
