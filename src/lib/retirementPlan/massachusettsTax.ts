import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, flat-rate, PRE-CREDIT planning estimate. Rates and thresholds
 * reviewed 2026-09-24 against the Massachusetts Department of Revenue:
 * - The flat 5% rate on ordinary income (wages, pensions, interest,
 *   dividends and most other income), plus the additional 4% "Fair Share"
 *   surtax on income over $1,107,750 for tax year 2026 -- a single
 *   threshold that is not doubled for married filers, matching California's
 *   Mental Health Services Act surtax structure in this planner.
 *   https://www.mass.gov/info-details/tax-rates
 * - Massachusetts has no standard deduction, only personal exemptions:
 *   $4,400 single/MFS, $8,800 married filing jointly, plus $700 per owner
 *   65 or older by year end and $2,200 per legally blind owner.
 *   https://www.mass.gov/info-details/personal-income-tax-exemptions
 * - Pension income from a contributory retirement plan of the US
 *   government or Massachusetts (and its political subdivisions) is fully
 *   excluded from Massachusetts gross income. Social Security is excluded
 *   per this planner's existing "exempt" classification.
 *   https://www.mass.gov/info-details/tax-treatment-of-government-pensions-in-massachusetts
 *
 * - Capital gains (2025 Form 1 instructions, "Schedule B" and "Schedule D",
 *   and the DOR tax-rates page https://www.mass.gov/info-details/tax-rates,
 *   updated 2025-12-30): net short-term capital gains are taxed at 8.5%
 *   instead of 5%; long-term gains (excluding collectibles) and dividends
 *   are taxed at 5%. Short-term losses and long-term losses offset gains
 *   of the other term, and a remaining net capital loss is deductible only
 *   up to $2,000 against interest and dividends (not the federal $3,000
 *   against all income). Exemptions apply first to 5% non-gain income, then
 *   to the 8.5% short-term gains, then to long-term gains (the form's
 *   excess-exemption worksheet; this planner takes interest and dividends as
 *   part of the 5% non-gain income, the order that cannot understate tax).
 *
 * Uses enacted law, not a prediction of future legislation. Massachusetts
 * has no local income tax; localTax is always zero. The government-pension
 * exclusion applies to income entered as annual pension for an owner with a
 * federal-government or other-government pension type; a private or
 * unspecified pension, and this planner's aggregate 401(k)/IRA/annuity
 * distribution figure, are not contributory government pensions and remain
 * fully taxable. Massachusetts also excludes an out-of-state government
 * pension when the paying state reciprocally exempts Massachusetts
 * pensions, a state-by-state reciprocity test this planner cannot
 * evaluate; treating "other-government" as exempt therefore may overstate
 * the exclusion for an out-of-state government pension without
 * reciprocity. Massachusetts's 12% rate and 50% deduction for long-term
 * gains on collectibles, the qualified-small-business-stock exclusion and
 * the 3% start-up stock rate are not modeled, since this planner does not
 * distinguish those assets. Only single and married-filing-jointly are supported. Itemized
 * deductions and credits are excluded. Massachusetts's dollar figures are
 * not further inflation-indexed in this model, matching the restricted New
 * York, Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania, Colorado,
 * New Mexico, Minnesota, Utah, Connecticut, Vermont, Montana, Rhode Island,
 * California, Virginia, Arizona, Georgia, North Carolina, South Carolina
 * and Ohio estimates' convention.
 */

const STATE_RATE = .05;
const SURTAX_RATE = .04;
const SURTAX_THRESHOLD = 1107750;
const PERSONAL_EXEMPTION: Record<FilingStatus, number> = { single: 4400, married: 8800 };
const AGE_65_EXEMPTION_PER_PERSON = 700;
const BLIND_EXEMPTION_PER_PERSON = 2200;

function governmentPensionExclusion(input: HouseholdTaxInput) {
  return input.income
    .filter(item => item.kind === "pension" && (item.pensionType === "federal-government" || item.pensionType === "other-government"))
    .reduce((sum, item) => sum + item.amount, 0);
}

const SHORT_TERM_GAIN_RATE = .085;
const CAPITAL_LOSS_LIMIT_AGAINST_INCOME = 2000;

/** Gains are net of MASSACHUSETTS carryovers (negative for losses). Federal gain income and loss deduction are removed from AGI before applying state amounts. */
export function massachusettsTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, shortTermGain = 0, longTermGain = 0,
  interestAndDividends = 0, capitalLossDeduction = 0, federalCapitalIncome = Math.max(0, shortTermGain + longTermGain)) {
  if (input.massachusettsContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Massachusetts planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Massachusetts projection year.");
  const pensionExclusion = governmentPensionExclusion(input);
  const ageExemption = input.people.filter(person => ageAtYearEnd(person.birthDate, input.year) >= 65).length * AGE_65_EXEMPTION_PER_PERSON;
  const blindExemption = input.people.filter(person => person.blind).length * BLIND_EXEMPTION_PER_PERSON;
  const exemptions = PERSONAL_EXEMPTION[input.filing] + ageExemption + blindExemption;
  for (const value of [shortTermGain, longTermGain, interestAndDividends, capitalLossDeduction, federalCapitalIncome]) {
    if (!Number.isFinite(value)) throw new RangeError("Invalid Massachusetts capital gain input.");
  }
  if (interestAndDividends < 0 || capitalLossDeduction < 0 || federalCapitalIncome < 0) throw new RangeError("Invalid Massachusetts capital gain input.");
  // Federal AGI deducts up to $3,000 of a net capital loss; Massachusetts allows only $2,000, and only against interest and dividends.
  const netCapital = shortTermGain + longTermGain;
  const stateLossDeduction = Math.min(Math.max(0, -netCapital), CAPITAL_LOSS_LIMIT_AGAINST_INCOME, interestAndDividends);
  const capitalLossAddBack = capitalLossDeduction - stateLossDeduction;
  // Use Massachusetts losses independently; federal use does not consume state losses.
  const shortTermLoss = Math.max(0, -shortTermGain - Math.max(0, longTermGain));
  const longTermLoss = Math.max(0, -longTermGain - Math.max(0, shortTermGain));
  const nextLossCarryover = Object.freeze({
    shortTerm: Math.max(0, shortTermLoss - stateLossDeduction),
    longTerm: Math.max(0, longTermLoss - Math.max(0, stateLossDeduction - shortTermLoss)),
  });
  const shortTermIncome = shortTermGain > 0 ? Math.max(0, shortTermGain + Math.min(0, longTermGain)) : 0;
  const longTermIncome = Math.max(0, Math.min(longTermGain, netCapital));
  const income = federalAgi - taxableBenefits - pensionExclusion + capitalLossAddBack
    - federalCapitalIncome + Math.max(0, netCapital);
  const taxable = Math.max(0, income - exemptions);
  const nonGainIncome = Math.max(0, income - shortTermIncome - longTermIncome);
  const shortTermTaxable = Math.max(0, shortTermIncome - Math.max(0, exemptions - nonGainIncome));
  const shortTermPremium = shortTermTaxable * (SHORT_TERM_GAIN_RATE - STATE_RATE);
  const surtax = Math.max(0, taxable - SURTAX_THRESHOLD) * SURTAX_RATE;
  const stateTax = taxable * STATE_RATE + shortTermPremium + surtax;
  return {
    stateTax, localTax: 0, pensionExclusion, exemptions, shortTermTaxable, capitalLossAddBack, nextLossCarryover,
    warning: "Massachusetts pre-credit estimate: the enacted flat 5% rate (reviewed 2026-09-24) plus the additional 4% Fair "
      + "Share surtax on taxable income over $1,107,750 (a single threshold, not doubled for married filers). State capital losses are carried separately from federal losses; opening state losses default to zero only when no federal carryover is supplied. Separate pre-existing state losses must be supplied explicitly; the preview starts with none. Massachusetts "
      + "has no standard deduction, only personal exemptions ($4,400 single/$8,800 married), plus $700 per owner 65 or older "
      + "and $2,200 per legally blind owner. Net short-term capital gains are taxed at 8.5% (after exemptions are applied first to 5% income); long-term gains and dividends are taxed at 5%; a net capital loss is deductible only up to $2,000 against interest and dividends, not the federal $3,000 against all income. Massachusetts's 12% rate and 50% deduction on collectibles, its qualified-small-business-stock exclusion and its 3% start-up stock rate are not modeled. Social Security is fully excluded. Pension income entered for an owner with a "
      + "federal-government or other-government pension type is treated as a fully exempt contributory government pension; "
      + "a private or unspecified pension, and this planner's aggregate 401(k)/IRA/annuity distribution figure, remain "
      + "fully taxable. Massachusetts also exempts an out-of-state government pension under a state-by-state reciprocity "
      + "test this planner cannot evaluate, so treating \"other-government\" as exempt may overstate the benefit for an "
      + "out-of-state pension without reciprocity. Massachusetts has no local income tax. Only single and "
      + "married-filing-jointly are supported. Itemized deductions and credits are excluded. Massachusetts's dollar "
      + "figures are not further inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
