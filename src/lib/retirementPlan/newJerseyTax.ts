import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, exemption-based, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-23 against:
 * - NJ Division of Taxation, "New Jersey Tax Rate Schedules" (effective for
 *   2020 and after, unchanged through the 2025 filing season per current
 *   NJ-1040 guidance): the full graduated bracket schedule for Single/MFS
 *   and Married Filing Jointly/HOH/QW, including the 2018-enacted 10.75%
 *   top bracket above $1,000,000.
 *   https://www.nj.gov/treasury/taxation/pdf/current/njtaxratesch.pdf
 * - NJ Division of Taxation, "NJ Income Tax – Exemptions": the $1,000 base
 *   exemption for the taxpayer and spouse, and the additional $1,000
 *   exemption each for age 65+ and for blind/disabled, each as of the last
 *   day of the tax year.
 *   https://www.nj.gov/treasury/taxation/njit2.shtml
 * - NJ Division of Taxation, "NJ Income Tax – Retirement Income" and
 *   "Retirement Income Exclusions": confirms Social Security and Railroad
 *   Retirement benefits are untaxed and excluded from the "total income"
 *   eligibility test; the Pension, Annuity and IRA Withdrawal Exclusion
 *   requires the taxpayer or spouse to be 62 or older (or disabled) by
 *   year end and total income of $150,000 or less; the maximum exclusion is
 *   $100,000 (married/CU filing jointly), $75,000 (single/HOH/qualifying
 *   widow(er)) or $50,000 (married/CU filing separately) when total income
 *   is $100,000 or less, phasing down to 50%/25% (joint), 37.5%/18.75%
 *   (single/HOH) or 25%/12.5% (separate) of that maximum across the
 *   $100,001-$125,000 and $125,001-$150,000 bands, and eliminated above
 *   $150,000.
 *   https://www.nj.gov/treasury/taxation/njit6.shtml
 *   https://www.nj.gov/treasury/taxation/njit7.shtml
 *
 * Uses enacted law, not a prediction of future legislation. New Jersey has
 * no local income tax; localTax is always zero. This planner has no
 * "married filing separately" status and no disability flag, so only the
 * single and married-filing-jointly exclusion tiers are supported, and only
 * age 62+ (not disability) unlocks the exclusion. Eligibility is a
 * HOUSEHOLD gate, matching NJ's joint-return treatment: if either spouse is
 * 62 or older, the exclusion applies to the household's combined eligible
 * income, not to each owner's own income separately (unlike Maryland or
 * Indiana's per-owner worksheets). Eligible income combines income entered
 * as "pension" with this planner's aggregate 401(k)/IRA/annuity distribution
 * figure; the latter cannot be separated from a nonqualified annuity
 * withdrawal, so this planner cannot confirm every dollar actually qualifies
 * under GIT-1. No itemized deductions, credits or dependent exemptions are
 * modeled. New Jersey parameters remain nominal; the household's
 * inflation/threshold-growth assumption does not index them, matching the
 * restricted New York, Maryland, Indiana, DC and Illinois estimates'
 * convention.
 */

const EXEMPTION = 1000;
const MAX_EXCLUSION: Record<FilingStatus, number> = { single: 75000, married: 100000 };
const PHASE_100_125: Record<FilingStatus, number> = { single: .375, married: .5 };
const PHASE_125_150: Record<FilingStatus, number> = { single: .1875, married: .25 };

const STATE_BRACKETS: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [
    { upTo: 20000, rate: .014 }, { upTo: 35000, rate: .0175 }, { upTo: 40000, rate: .035 }, { upTo: 75000, rate: .05525 },
    { upTo: 500000, rate: .0637 }, { upTo: 1000000, rate: .0897 }, { upTo: Infinity, rate: .1075 },
  ],
  married: [
    { upTo: 20000, rate: .014 }, { upTo: 50000, rate: .0175 }, { upTo: 70000, rate: .0245 }, { upTo: 80000, rate: .035 },
    { upTo: 150000, rate: .05525 }, { upTo: 500000, rate: .0637 }, { upTo: 1000000, rate: .0897 }, { upTo: Infinity, rate: .1075 },
  ],
};

function isAged(birthDate: string, ageThreshold: number, year: number) {
  return birthDate <= `${year - ageThreshold}-12-31`;
}

function personalExemptions(input: HouseholdTaxInput, year: number) {
  let total = 0;
  for (const person of input.people) {
    total += EXEMPTION;
    if (isAged(person.birthDate, 65, year)) total += EXEMPTION;
    if (person.blind) total += EXEMPTION;
  }
  return total;
}

function retirementExclusion(input: HouseholdTaxInput, year: number, totalIncome: number, retirementOrdinary: number) {
  const eligible = input.people.some(person => isAged(person.birthDate, 62, year));
  if (!eligible || totalIncome > 150000) return 0;
  const eligibleIncome = input.income.filter(item => item.kind === "pension").reduce((sum, item) => sum + item.amount, 0) + retirementOrdinary;
  const capped = Math.min(eligibleIncome, MAX_EXCLUSION[input.filing]);
  const multiplier = totalIncome <= 100000 ? 1 : totalIncome <= 125000 ? PHASE_100_125[input.filing] : PHASE_125_150[input.filing];
  return capped * multiplier;
}

export function newJerseyTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.newJerseyContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted New Jersey planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported New Jersey projection year.");
  const totalIncome = federalAgi - taxableBenefits;
  const exclusion = retirementExclusion(input, input.year, totalIncome, retirementOrdinary);
  const njAgi = totalIncome - exclusion;
  const taxable = Math.max(0, njAgi - personalExemptions(input, input.year));
  const stateTax = sumBrackets(taxable, STATE_BRACKETS[input.filing]);
  return {
    stateTax, localTax: 0, njAgi, retirementExclusion: exclusion,
    warning: "New Jersey pre-credit estimate: enacted graduated brackets (reviewed 2026-09-23), $1,000 personal exemptions "
      + "(plus $1,000 each for age 65+ or blind), and Social Security fully excluded. The Pension, Annuity and IRA Withdrawal "
      + "Exclusion applies only if an owner is 62 or older by year end (disability-based eligibility is unsupported) and the "
      + "household's total income (federal AGI less Social Security) is $150,000 or less, combining income entered as "
      + "\"pension\" with this planner's aggregate 401(k)/IRA/annuity distribution figure, capped and phased down by filing "
      + "status; that aggregate figure cannot be separated from a nonqualified annuity withdrawal that may not actually "
      + "qualify. Only single and married-filing-jointly tiers are supported. New Jersey has no local income tax. Itemized "
      + "deductions, credits and dependent exemptions are excluded. New Jersey parameters are not inflation-indexed in this "
      + "model. Future legislation is not predicted. Not a tax return.",
  };
}
