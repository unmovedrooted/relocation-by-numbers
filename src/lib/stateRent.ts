import { citiesForState } from "./cities";
import type { StateCode } from "./states";

/** Average of the typical rents (Census) of a state's listed cities. The ranking and the state page both use this one figure. */
export function averageStateRent(state: StateCode): number | null {
  const rents = citiesForState(state)
    .filter((c) => !c.id.startsWith("other-"))
    .map((c) => c.defaultRent)
    .filter((r): r is number => typeof r === "number" && r > 0);
  return rents.length > 0 ? rents.reduce((a, b) => a + b, 0) / rents.length : null;
}
