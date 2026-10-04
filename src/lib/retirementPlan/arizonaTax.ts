import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, flat-rate, PRE-CREDIT planning estimate. Rates and thresholds
 * reviewed 2026-09-24 against:
 * - Arizona Department of Revenue, 2025 Individual Income Tax Highlights: the
 *   flat 2.5% rate for all income levels and filing statuses (the old X/Y
 *   bracket tables are obsolete), and the 2025 standard deduction ($15,750
 *   single/MFS, $31,500 married filing jointly; $16,100/$32,200 for 2026, see below). Arizona eliminated separate
 *   personal exemptions in its 2019 conformity overhaul; the standard
 *   deduction is the only broad-based subtraction.
 *   https://azdor.gov/forms/individual-income-tax-highlights
 * - ARS 43-1041(A) and (H), read 2026-10-04 (https://www.azleg.gov/ars/43/01041.htm): the standard
 *   deduction is $15,750 single/MFS, $23,625 head of household and $31,500 joint, and for each year
 *   after 2019 the Department adjusts those amounts for inflation "in the same manner in which the
 *   federal basic standard deduction is adjusted". The 2026 federal basic standard deduction is
 *   $16,100 single and $32,200 joint (Rev. Proc. 2025-32), so those are Arizona's 2026 amounts. Later
 *   years hold the 2026 amounts (no forecast of federal indexing). From 2026, paragraph I.2 also
 *   adds up to $1,000 single/$2,000 joint of charitable contributions to the standard
 *   deduction; this planner has no charitable-giving input, so that is not modeled.
 * - Arizona Revised Statutes 43-1022: Social Security and Tier 1 Railroad
 *   Retirement benefits included in federal AGI are fully subtracted
 *   (paragraph 10); benefits, annuities and pensions from the U.S.
 *   government, Arizona state retirement system, or a county/city/town
 *   retirement plan are subtracted up to $2,500 per taxpayer (paragraph 2);
 *   military retired or retainer pay has its own separate, uncapped
 *   subtraction (paragraph 26).
 *   https://www.azleg.gov/ars/43/01022.htm
 *
 * 2026 session (checked 2026-10-04): H.B. 4168, the 2026-2027 omnibus (signed 2026-06-13, effective
 * 2026-09-12; House engrossed text read from https://www.azleg.gov/legtext/57leg/2R/bills/HB4168H.pdf), resets the
 * ARS 43-1041 base amounts to $15,750/$23,625/$31,500 for taxable years from 2025 (still indexed under subsection H,
 * which is how the $16,100/$32,200 above arises; the legislature's own summary dates the new base from 2026 and the bill's retroactivity clause from 2025, so
 * Arizona's published 2026 amount could be $15,750 instead, a difference of under $10 of tax), adds to ARS 43-1022 a subtraction of the federal
 * enhanced senior deduction (IRC 151(d)(5)(C)) for taxable years from 2025, which is modeled here using the
 * planner's own federal senior deduction (so it ends when the federal deduction does, after 2028), also
 * subtractions for qualified tips, overtime and vehicle loan interest (not modeled: this planner has no such income
 * kinds), and caps the SALT itemized deduction at $10,000 from 2026 (itemizing is not modeled).
 *
 * Uses enacted law, not a prediction of future legislation. Arizona has no
 * local income tax; localTax is always zero. The $2,500-per-owner government
 * pension subtraction applies only to income entered as annual pension for
 * an owner with a federal-government or other-government pension type
 * (treated as Arizona state/local government here); a private or
 * unspecified pension, and this planner's aggregate 401(k)/IRA/annuity
 * distribution figure, do not qualify and remain fully taxable. Arizona's
 * separate, uncapped military retirement pay subtraction is not modeled,
 * since this planner cannot identify military retirement income,
 * understating the benefit for such a household. Only single and married-
 * filing-jointly are supported. Itemized deductions and credits (including
 * the various charitable-organization tax credits) are excluded. Arizona's
 * dollar figures are not further inflation-indexed in this model, matching
 * the restricted New York, Maryland, Indiana, DC, Illinois, New Jersey,
 * Pennsylvania, Colorado, New Mexico, Minnesota, Utah, Connecticut, Vermont,
 * Montana, Rhode Island, California and Virginia estimates' convention.
 */

const STATE_RATE = .025;
const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 16100, married: 32200 };
const GOVERNMENT_PENSION_CAP_PER_PERSON = 2500;

function governmentPensionSubtraction(input: HouseholdTaxInput) {
  return input.people.reduce((sum, person) => {
    const pension = input.income
      .filter(item => item.kind === "pension" && item.ownerId === person.id
        && (item.pensionType === "federal-government" || item.pensionType === "other-government"))
      .reduce((s, item) => s + item.amount, 0);
    return sum + Math.min(pension, GOVERNMENT_PENSION_CAP_PER_PERSON);
  }, 0);
}

/** `seniorDeduction` is the federal enhanced senior deduction already computed for the household (ARS 43-1022(35), HB 4168). */
export function arizonaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, seniorDeduction = 0) {
  if (input.arizonaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Arizona planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Arizona projection year.");
  const pensionSubtraction = governmentPensionSubtraction(input);
  if (!Number.isFinite(seniorDeduction) || seniorDeduction < 0) throw new RangeError("Invalid Arizona senior deduction.");
  const taxable = Math.max(0, federalAgi - taxableBenefits - pensionSubtraction - seniorDeduction - STANDARD_DEDUCTION[input.filing]);
  const stateTax = taxable * STATE_RATE;
  return {
    stateTax, localTax: 0, pensionSubtraction, seniorDeduction,
    warning: "Arizona pre-credit estimate: the enacted flat 2.5% rate (reviewed 2026-09-24) and Arizona's own standard "
      + "deduction ($16,100 single/$32,200 married for 2026, tracking the federal basic standard deduction under ARS 43-1041(H), held for later years; Arizona has no separate personal exemption; the new charitable add-on of up to $1,000/$2,000 is not modeled). Social Security is fully "
      + "excluded. Up to $2,500 per owner of income entered as annual pension with a federal-government or other-government "
      + "pension type is excluded; a private or unspecified pension, and this planner's aggregate 401(k)/IRA/annuity "
      + "distribution figure, remain fully taxable. Arizona also subtracts the federal enhanced senior deduction (up to $6,000 per qualifying owner, through 2028) as "
      + "enacted in 2026; its tips, overtime and vehicle-loan-interest subtractions are not modeled. Arizona's separate, uncapped military retirement pay subtraction is not "
      + "modeled, since this planner cannot identify military retirement income. Arizona has no local income tax. Only "
      + "single and married-filing-jointly are supported. Itemized deductions and credits are excluded. Arizona's dollar "
      + "figures are not further inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
