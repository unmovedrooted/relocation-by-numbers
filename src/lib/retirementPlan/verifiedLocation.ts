import { CITIES } from "../cities";
import { STATES, type StateCode } from "../states";

export const VERIFIED_RETIREMENT_STATES: readonly string[] = ["fl", "tx", "ny", "md", "in", "dc", "il", "nj", "pa", "co", "nm", "mn", "ut", "ct", "vt", "mt", "ri", "ca"];

/** Full-year resident, individual income only. No cross-border income sourcing,
 * business/entity taxes, property taxes or sales taxes. Reviewed 2026-09-08.
 * Florida Constitution, Article VII section 5:
 * https://leg.state.fl.us/Statutes/index.cfm?Mode=Constitution&Submenu=3
 * Texas Constitution Article VIII section 24-a; Comptroller individual income
 * treatment and local confirmation (Harris County 2025):
 * https://tcss.legis.texas.gov/resources/CN/htm/CN.8.htm
 * https://comptroller.texas.gov/economy/fiscal-notes/archive/2023/oct/resilient.php
 * https://hcoed.harriscountytx.gov/docs/publications/HarrisCountyAtaGlance_2025.pdf
 * A verified SS exclusion alone does NOT verify a complete state return.
 */
export function verifiedRetirementLocation(state: string, cityId = "") {
  if (!STATES.some(item => item.code === state)) throw new RangeError("Choose a valid retirement state.");
  const city = cityId ? CITIES.find(item => item.id === cityId) : undefined;
  if (!(state === "ny" && cityId === "ny-outside-nyc-yonkers") && cityId && (!city || city.state !== state)) throw new RangeError("Choose a city in the selected retirement state.");
  if (!VERIFIED_RETIREMENT_STATES.includes(state)) throw new RangeError("Retirement income-tax treatment is not yet verified for this state. Only Florida, Texas, restricted New York, restricted Maryland, restricted Indiana, restricted DC, restricted Illinois, restricted New Jersey, restricted Pennsylvania, restricted Colorado, restricted New Mexico, restricted Minnesota, restricted Utah, restricted Connecticut, restricted Vermont, restricted Montana, restricted Rhode Island and restricted California scenarios are enabled; no zero-tax fallback has been used.");
  if (state === "ny" && !["nyc-ny", "ny-outside-nyc-yonkers"].includes(cityId)) throw new RangeError("Choose NYC or explicitly outside NYC and Yonkers; other New York city cases are unsupported.");
  const PRE_CREDIT_NAMES: Partial<Record<StateCode, string>> = { ny: "New York", md: "Maryland", in: "Indiana", dc: "DC", il: "Illinois", nj: "New Jersey", pa: "Pennsylvania", co: "Colorado", nm: "New Mexico", mn: "Minnesota", ut: "Utah", ct: "Connecticut", vt: "Vermont", mt: "Montana", ri: "Rhode Island", ca: "California" };
  return { state: state as StateCode, cityId, stateTax: 0, localTax: 0,
    warning: PRE_CREDIT_NAMES[state as StateCode] ? `${PRE_CREDIT_NAMES[state as StateCode]} requires the separate pre-credit state/local tax calculation; this location validation is not a tax estimate.` : `${state === "tx" ? "Texas" : "Florida"} full-year resident individual income-tax treatment: state and local income tax are zero. Assumes all modeled income is free of another jurisdiction's income tax; cross-border work and part-year moves are unsupported. Holds current treatment through the horizon. Property, sales and business taxes are not calculated.` };
}
