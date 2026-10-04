import { CITIES } from "../cities";

/** States whose resident-location selector asks for a city or county. */
export const CITY_FIELD_STATES: readonly string[] = ["ny", "md", "in", "pa"];

/**
 * The city or county name shown for a resident location, or "" for a state with no such selector. Shared by the
 * CSV and PDF exports so both label a location the same way.
 */
export function locationLabel(state: string, cityId: string): string {
  if (!CITY_FIELD_STATES.includes(state)) return "";
  if (cityId === "ny-outside-nyc-yonkers") return "Outside NYC and Yonkers";
  return CITIES.find(city => city.id === cityId)?.name ?? "Outside listed cities";
}
