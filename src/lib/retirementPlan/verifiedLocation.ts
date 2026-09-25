import { CITIES } from "../cities";
import { STATES, type StateCode } from "../states";

export const VERIFIED_RETIREMENT_STATES: readonly string[] = ["fl", "tx", "ny", "md", "in", "dc", "il", "nj", "pa", "co", "nm", "mn", "ut", "ct", "vt", "mt", "ri", "ca", "va", "az", "ga", "nc", "sc", "oh", "ma", "ia", "ms", "mo", "ak", "nv", "sd", "tn", "wy", "nh", "wa", "al", "ar", "de", "ks", "ky", "ne", "wv", "id", "la", "mi", "ok", "wi"];

/** Full-year resident, individual income only. No cross-border income sourcing,
 * business/entity taxes, property taxes or sales taxes. Reviewed 2026-09-25.
 * Florida Constitution, Article VII section 5:
 * https://leg.state.fl.us/Statutes/index.cfm?Mode=Constitution&Submenu=3
 * Texas Constitution Article VIII section 24-a; Comptroller individual income
 * treatment and local confirmation (Harris County 2025):
 * https://tcss.legis.texas.gov/resources/CN/htm/CN.8.htm
 * https://comptroller.texas.gov/economy/fiscal-notes/archive/2023/oct/resilient.php
 * https://hcoed.harriscountytx.gov/docs/publications/HarrisCountyAtaGlance_2025.pdf
 * Alaska Department of Revenue, Tax Division: "The State of Alaska currently
 * does not have an individual income tax" (personal income tax repealed 1980,
 * not reenacted). https://tax.alaska.gov/programs/programs/index.aspx?10001
 * Nevada Department of Taxation: "No State Income Tax on Individuals ...
 * Nevada residents do not pay state tax on income earned from salaries,
 * wages, or similar compensation," and Nevada Constitution Article 10,
 * Section 1 restricts enacting one without voter approval.
 * https://tax.nv.gov/about-nevada-department-of-taxation/income-tax-in-nevada
 * South Dakota Department of Revenue: "South Dakota is one of seven states
 * that does not impose a state income tax." https://dor.sd.gov/individuals/taxes/
 * Tennessee Department of Revenue: the Hall Income Tax (the state's only tax
 * on individual income, applying solely to interest and dividends) "was
 * repealed for tax periods that begin on January 1, 2021, or later";
 * Tennessee has never taxed wages, pensions or retirement distributions.
 * https://www.tn.gov/revenue/taxes/hall-income-tax.html
 * Wyoming has no individual income tax and no income-tax division within its
 * Department of Revenue (Excise Tax, Mineral Tax and Property Tax divisions
 * only). https://revenue.wyo.gov/
 * New Hampshire Department of Revenue Administration: the state's Interest
 * and Dividends Tax (New Hampshire's only tax on individual income, applying
 * solely to interest and dividends) was fully repealed "for tax periods
 * beginning on or after January 1, 2025"; New Hampshire has never taxed
 * wages, pensions, retirement distributions or capital gains.
 * https://www.revenue.nh.gov/news-and-media/repeal-nh-interest-and-dividends-tax-now-effect
 * A verified SS exclusion alone does NOT verify a complete state return.
 */
export function verifiedRetirementLocation(state: string, cityId = "") {
  if (!STATES.some(item => item.code === state)) throw new RangeError("Choose a valid retirement state.");
  const city = cityId ? CITIES.find(item => item.id === cityId) : undefined;
  if (!(state === "ny" && cityId === "ny-outside-nyc-yonkers") && cityId && (!city || city.state !== state)) throw new RangeError("Choose a city in the selected retirement state.");
  if (!VERIFIED_RETIREMENT_STATES.includes(state)) throw new RangeError("Retirement income-tax treatment is not yet verified for this state. Only Florida, Texas, Alaska, Nevada, South Dakota, Tennessee, Wyoming, New Hampshire, restricted New York, restricted Maryland, restricted Indiana, restricted DC, restricted Illinois, restricted New Jersey, restricted Pennsylvania, restricted Colorado, restricted New Mexico, restricted Minnesota, restricted Utah, restricted Connecticut, restricted Vermont, restricted Montana, restricted Rhode Island, restricted California, restricted Virginia, restricted Arizona, restricted Georgia, restricted North Carolina, restricted South Carolina, restricted Ohio, restricted Massachusetts, restricted Iowa, restricted Mississippi, restricted Missouri, restricted Washington, restricted Alabama, restricted Arkansas, restricted Delaware, restricted Kansas, restricted Kentucky, restricted Nebraska, restricted West Virginia, restricted Idaho, restricted Louisiana, restricted Michigan, restricted Oklahoma and restricted Wisconsin scenarios are enabled; no zero-tax fallback has been used.");
  if (state === "ny" && !["nyc-ny", "ny-outside-nyc-yonkers"].includes(cityId)) throw new RangeError("Choose NYC or explicitly outside NYC and Yonkers; other New York city cases are unsupported.");
  const PRE_CREDIT_NAMES: Partial<Record<StateCode, string>> = { ny: "New York", md: "Maryland", in: "Indiana", dc: "DC", il: "Illinois", nj: "New Jersey", pa: "Pennsylvania", co: "Colorado", nm: "New Mexico", mn: "Minnesota", ut: "Utah", ct: "Connecticut", vt: "Vermont", mt: "Montana", ri: "Rhode Island", ca: "California", va: "Virginia", az: "Arizona", ga: "Georgia", nc: "North Carolina", sc: "South Carolina", oh: "Ohio", ma: "Massachusetts", ia: "Iowa", ms: "Mississippi", mo: "Missouri", wa: "Washington", al: "Alabama", ar: "Arkansas", de: "Delaware",
  ks: "Kansas", ky: "Kentucky", ne: "Nebraska", wv: "West Virginia",
  id: "Idaho", la: "Louisiana", mi: "Michigan", ok: "Oklahoma", wi: "Wisconsin" };
  const ZERO_TAX_NAMES: Partial<Record<StateCode, string>> = { fl: "Florida", tx: "Texas", ak: "Alaska", nv: "Nevada", sd: "South Dakota", tn: "Tennessee", wy: "Wyoming", nh: "New Hampshire" };
  return { state: state as StateCode, cityId, stateTax: 0, localTax: 0,
    warning: PRE_CREDIT_NAMES[state as StateCode] ? `${PRE_CREDIT_NAMES[state as StateCode]} requires the separate pre-credit state/local tax calculation; this location validation is not a tax estimate.` : `${ZERO_TAX_NAMES[state as StateCode]} full-year resident individual income-tax treatment: state and local income tax are zero. Assumes all modeled income is free of another jurisdiction's income tax; cross-border work and part-year moves are unsupported. Holds current treatment through the horizon. Property, sales and business taxes are not calculated.` };
}
