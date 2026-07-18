export const SOUTH_AMERICA_SCENARIO_VERSION = "2";

export type SouthAmericaInputUnit = "destination-local" | "usd";
export type SouthAmericaScenarioContract =
  | { kind: "v2"; requestedVersion: "2"; destinationInputUnit: "usd" }
  | { kind: "legacy"; requestedVersion: null; destinationInputUnit: "destination-local" }
  | { kind: "unsupported"; requestedVersion: string; destinationInputUnit: "destination-local" };

export type SouthAmericaDestinationCostField =
  | "rent"
  | "deposit"
  | "firstRent"
  | "lastRent"
  | "groceries"
  | "utilities"
  | "transport"
  | "healthcare"
  | "carCost"
  | "visa"
  | "flight"
  | "shipping"
  | "tempStay"
  | "admin"
  | "furniture"
  | "emergency";

const SCENARIO_PARAMETERS = new Set([
  "mode", "filing", "fromCountry", "toCountry", "fromCityCode", "toCityCode",
  "salary", "retirement", "currency", "salaryType", "adults", "children",
  "rent", "deposit", "firstRent", "lastRent", "furnished", "utilIncl",
  "groceries", "utilities", "transport", "healthcare", "visa", "flight",
  "shipping", "tempStay", "admin", "furniture", "emergency", "savings",
  "car", "carCost",
]);

export function getSouthAmericaScenarioContract(params: URLSearchParams): SouthAmericaScenarioContract {
  const version = params.get("scenarioVersion");
  if (version === SOUTH_AMERICA_SCENARIO_VERSION) {
    return { kind: "v2", requestedVersion: "2", destinationInputUnit: "usd" };
  }
  if (version !== null) {
    return { kind: "unsupported", requestedVersion: version, destinationInputUnit: "destination-local" };
  }

  const hasScenarioValues = [...params.keys()].some((key) => SCENARIO_PARAMETERS.has(key));
  return hasScenarioValues
    ? { kind: "legacy", requestedVersion: null, destinationInputUnit: "destination-local" }
    : { kind: "v2", requestedVersion: "2", destinationInputUnit: "usd" };
}

export function getSouthAmericaFieldInputUnit(
  contract: SouthAmericaScenarioContract,
  field: SouthAmericaDestinationCostField,
): SouthAmericaInputUnit {
  // Historical shared URLs treated the flight field as USD while other
  // destination fields were interpreted in destination-local currency.
  if (contract.kind !== "v2" && field === "flight") return "usd";
  return contract.destinationInputUnit;
}

export function southAmericaInputToUsd(
  value: number,
  inputUnit: SouthAmericaInputUnit,
  convertDestinationLocalToUsd: (value: number) => number,
): number {
  return inputUnit === "usd" ? value : convertDestinationLocalToUsd(value);
}

export function applySouthAmericaScenarioVersion(
  params: URLSearchParams,
  contract: SouthAmericaScenarioContract,
): void {
  if (contract.kind === "v2") params.set("scenarioVersion", SOUTH_AMERICA_SCENARIO_VERSION);
  else if (contract.kind === "unsupported") params.set("scenarioVersion", contract.requestedVersion);
}
