import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, flat-rate, PRE-CREDIT planning estimate. Rates and thresholds
 * reviewed 2026-09-26 against the North Carolina Department of Revenue's
 * 2025 D-401 Individual Income Tax Instructions:
 * Rate updated from NCDOR's Tax Rate Schedules for years after 2025:
 * https://www.ncdor.gov/taxes-forms/individual-income-tax/tax-rate-schedules
 * Rates for 2027 and later are from Section 44.1 of Senate Bill 257 (Session 2025, ratified 2026,
 * signed 2026-07-07; ratified text read 2026-10-04, G.S. 105-153.7(a)):
 * 3.99% for 2026, 3.49% for 2027-2029, 3.24% for 2030-2032 and 2.99% after 2032. The act repealed the
 * old revenue-triggered reductions for those years and kept a separate General Fund revenue trigger
 * (G.S. 105-153.7(a1), a further 0.25-point cut, floor 2.49%) and authority for further cuts after 2034;
 * those contingent reductions are not assumed. The act leaves the standard deduction unchanged.
 * https://www.ncleg.gov/Sessions/2025/Bills/Senate/PDF/S257v7.pdf
 * - The flat 3.99% rate (Form D-400, Line 15) and the standard deduction
 *   ($12,750 single/MFS-not-itemizing, $25,500 married filing jointly).
 *   North Carolina gives no additional standard deduction for a taxpayer 65
 *   or older or blind.
 *   https://www.ncdor.gov/2025-d-401-individual-income-tax-instructions
 * - Social Security and Tier 1/Tier 2 Railroad Retirement benefits included
 *   in federal AGI are fully subtracted (Schedule S, Line 19), matching
 *   North Carolina's existing "exempt" classification in this planner.
 * - The Bailey settlement exclusion (Schedule S, Line 20) fully exempts
 *   retirement benefits from the NC Teachers' and State Employees'
 *   Retirement System, the NC Local Governmental Employees' Retirement
 *   System, the NC Consolidated Judicial Retirement System, the Federal
 *   Employees' Retirement System, or the US Civil Service Retirement
 *   System, but only for a retiree with five or more years of creditable
 *   service as of August 12, 1989; the separate Uniformed Services
 *   retirement deduction (Schedule S, Line 21) requires 20+ years of
 *   service or a medical retirement. Neither is modeled: this planner has
 *   no way to determine a modeled owner's years of creditable service as
 *   of a historical date, or whether their pension is a military
 *   retirement, so all pension income entered here is treated as fully
 *   taxable in North Carolina regardless of pensionType. This
 *   understates the benefit, and overstates tax, for any household that
 *   would actually qualify for either exclusion -- a significant,
 *   well-known North Carolina provision this planner cannot verify.
 *
 * Uses enacted law, not a prediction of future legislation. North Carolina
 * has no local income tax; localTax is always zero. This planner's
 * aggregate 401(k)/IRA/annuity distribution figure is also fully taxable,
 * since a traditional IRA or 401(k) is not itself a Bailey-covered defined
 * benefit plan (Bailey covers only the specific listed defined-benefit
 * systems and pre-1989 state §401(k)/§457 contributions this planner cannot
 * distinguish). Only single and married-filing-jointly are supported.
 * Itemized deductions and credits (including the credit for tax paid to
 * another state) are excluded. North Carolina's dollar figures are not
 * further inflation-indexed in this model, matching the restricted New
 * York, Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania, Colorado,
 * New Mexico, Minnesota, Utah, Connecticut, Vermont, Montana, Rhode Island,
 * California, Virginia, Arizona and Georgia estimates' convention.
 */

/** G.S. 105-153.7(a) as rewritten by S.B. 257 (2026): the unconditional schedule, without the (a1) revenue triggers. */
function stateRate(year: number) {
  if (year <= 2026) return .0399;
  if (year <= 2029) return .0349;
  if (year <= 2032) return .0324;
  return .0299;
}
const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 12750, married: 25500 };

export function northCarolinaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.northCarolinaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted North Carolina planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported North Carolina projection year.");
  const taxable = Math.max(0, federalAgi - taxableBenefits - STANDARD_DEDUCTION[input.filing]);
  const stateTax = taxable * stateRate(input.year);
  return {
    stateTax, localTax: 0,
    warning: "North Carolina pre-credit estimate: the enacted rate schedule (3.99% for 2026, 3.49% for 2027-2029, 3.24% for 2030-2032 and 2.99% "
      + "after 2032 under Senate Bill 257 of 2026, reviewed 2026-10-04; its separate revenue-triggered further cuts are not assumed) "
      + "and North Carolina's own standard deduction ($12,750 single/$25,500 married; no additional amount for age 65 or blindness). Social Security "
      + "is fully excluded. North Carolina's Bailey settlement exclusion (full exemption for certain NC state/local/federal "
      + "government retirement benefits, but only for a retiree vested with 5+ years of service as of August 12, 1989) and "
      + "its separate Uniformed Services retirement deduction (20+ years of service or medical retirement) are not modeled, "
      + "since this planner has no way to verify a modeled owner's years of service as of a historical date or whether a "
      + "pension is a military retirement; all pension income and this planner's aggregate 401(k)/IRA/annuity distribution "
      + "figure are treated as fully taxable, understating the benefit for a household that would actually qualify. North "
      + "Carolina has no local income tax. Only single and married-filing-jointly are supported. Itemized deductions and "
      + "credits are excluded. North Carolina's dollar figures are not further inflation-indexed in this model. Future "
      + "legislation is not predicted. Not a tax return.",
  };
}
