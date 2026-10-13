import raw from "../data/governmentData.json";
import type { StateCode } from "./states";

/**
 * Rent, home value, property tax and price-level data from the U.S. Census Bureau and the Bureau of Economic Analysis.
 * The file src/data/governmentData.json is produced by scripts/build-government-data.mjs from the agencies' own
 * downloads; nothing in it is estimated or smoothed. See the `meta` block for tables and vintages.
 */
export type CensusRecord = {
  geoId?: string;
  placeName?: string;
  /** Value the app uses for rent: recent-mover rent (contract-rent basis) when reliable, else the all-renter median. */
  rentUsed: number | null;
  rentBasis: "recent-movers" | "all-renters" | null;
  /** Value the app uses for home price: recent-buyer median value when reliable, else the all-owner median. */
  homeValueUsed: number | null;
  homeValueBasis: "recent-movers" | "all-owners" | null;
  propertyTaxRatePct: number | null;
  medianContractRent: number | null;
  medianGrossRent: number | null;
  recentMoverGrossRent: number | null;
  medianHomeValue: number | null;
  recentMoverHomeValue: number | null;
  medianRealEstateTaxesPaid: number | null;
};

export type PriceParities = {
  level?: "metro" | "state";
  geoFips?: string;
  geoName: string;
  allItems: number | null;
  goods: number | null;
  housing: number | null;
  utilities: number | null;
  otherServices: number | null;
};

type CityRecord = { name: string; state: StateCode; census?: CensusRecord; rpp?: PriceParities };
type StateRecord = { census: CensusRecord | null; rpp: PriceParities | null };

type Data = {
  meta: { generatedOn: string; census: { vintage: string; source: string; tables: Record<string, string>; note: string }; bea: { vintage: string; source: string; note: string } };
  nation: { census: CensusRecord };
  states: Record<string, StateRecord>;
  cities: Record<string, CityRecord>;
};

const data = raw as unknown as Data;

export const GOVERNMENT_DATA_META = data.meta;
export const NATIONAL_CENSUS = data.nation.census;

export function governmentCity(id: string): CityRecord | undefined {
  return data.cities[id];
}

export function governmentState(state: StateCode): StateRecord | undefined {
  return data.states[state];
}

/** A price-level ratio (national average = 1) from a BEA index (national average = 100). */
export const ratio = (index: number | null | undefined): number | undefined =>
  typeof index === "number" && Number.isFinite(index) && index > 0 ? Math.round((index / 100) * 1000) / 1000 : undefined;

/** One-line description of where a city's rent and home price come from, for display. */
export function censusBasisNote(rec: CensusRecord | null | undefined): string {
  if (!rec) return "";
  const rent = rec.rentBasis === "recent-movers" ? "rent paid by households that moved in during 2023 or later" : "median rent paid by all renters";
  const home = rec.homeValueBasis === "recent-movers" ? "owner-reported value of homes bought in 2023 or later" : "median owner-reported home value";
  return `Census Bureau American Community Survey 2020-2024: ${rent}; ${home}.`;
}
