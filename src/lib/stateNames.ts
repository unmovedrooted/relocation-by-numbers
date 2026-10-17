import { STATES, type StateCode } from "./states";

/** State code to full name, for page text. */
export const STATE_NAMES = Object.fromEntries(STATES.map((s) => [s.code, s.name])) as Record<StateCode, string>;
