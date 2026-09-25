import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, flat-rate, PRE-CREDIT planning estimate. Rates and thresholds
 * reviewed 2026-09-24 against the Ohio Department of Taxation's 2025 IT
 * 1040/SD 100 Instructions and Ohio's HB 96 (2025) budget act:
 * - HB 96 collapsed Ohio's remaining two nonzero brackets into a single
 *   flat 2.75% rate on Ohio taxable nonbusiness income above $26,050 for
 *   tax year 2026 and after (income up to $26,050 remains taxed at 0%),
 *   confirmed by multiple independent secondary sources describing the
 *   enacted law, since the 2025 booklet itself still shows the prior
 *   two-nonzero-bracket (2.75%/3.125%) schedule for tax year 2025.
 *   https://tax.ohio.gov/forms/ohio_individual/individual/2025/it1040-booklet.pdf
 * - Ohio has no standard deduction; instead a Personal and Dependent
 *   Exemption of $2,400/$2,150/$1,900/$0 per person (self, spouse, each
 *   dependent), tiered by modified adjusted gross income (MAGI) at
 *   $40,000/$80,000/$749,999, applies regardless of filing status.
 * - Social Security (and Railroad Retirement) included in federal AGI is
 *   fully subtracted (Schedule of Adjustments, Line 16/17), matching
 *   Ohio's existing "exempt" classification in this planner.
 * - The Retirement Income Credit (Schedule of Credits, Line 2): up to $200
 *   per return (not per spouse), looked up from the combined household's
 *   total eligible retirement income (pension/IRA/401(k) income received
 *   on account of retirement, excluding Social Security and uniformed
 *   services retirement), only if MAGI less exemptions is under $100,000.
 * - The Senior Citizen Credit (Schedule of Credits, Line 4): a flat $50 per
 *   return if any owner is 65 or older by year end and MAGI less
 *   exemptions is under $100,000.
 *
 * Uses enacted law, not a prediction of future legislation. Ohio has no
 * state-level local income tax in this planner (Ohio's municipal and school
 * district income taxes are separate, address-specific levies this planner
 * does not model). The Joint Filing Credit (up to $650, requiring each
 * spouse have $500+ of qualifying non-investment income) and the
 * alternative lump-sum retirement/distribution credits are not modeled,
 * understating the benefit for a two-earner household or one taking a
 * one-time total distribution. Ohio's military-specific deductions are not
 * modeled, since this planner cannot identify military retirement income.
 * Only single and married-filing-jointly are supported. Itemized
 * deductions and other credits are excluded. Ohio's dollar figures are not
 * further inflation-indexed in this model, matching the restricted New
 * York, Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania,
 * Colorado, New Mexico, Minnesota, Utah, Connecticut, Vermont, Montana,
 * Rhode Island, California, Virginia, Arizona, Georgia, North Carolina and
 * South Carolina estimates' convention.
 */

const BRACKET_THRESHOLD = 26050;
const STATE_RATE = .0275;
const CREDIT_MAGI_LIMIT = 100000;
const SENIOR_CREDIT = 50;

function exemptionPerPerson(magi: number) {
  if (magi <= 40000) return 2400;
  if (magi <= 80000) return 2150;
  if (magi <= 749999) return 1900;
  return 0;
}

function retirementIncomeCredit(amount: number) {
  if (amount <= 500) return 0;
  if (amount <= 1500) return 25;
  if (amount <= 3000) return 50;
  if (amount <= 5000) return 80;
  if (amount <= 8000) return 130;
  return 200;
}

export function ohioTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.ohioContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Ohio planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Ohio projection year.");
  const ohioAgi = federalAgi - taxableBenefits;
  const magi = ohioAgi;
  const exemption = input.people.length * exemptionPerPerson(magi);
  const magiLessExemptions = magi - exemption;
  const taxable = Math.max(0, ohioAgi - exemption);
  const bracketTax = Math.max(0, taxable - BRACKET_THRESHOLD) * STATE_RATE;
  const pensionIncome = input.income.filter(item => item.kind === "pension").reduce((s, item) => s + item.amount, 0);
  const eligibleForCredits = magiLessExemptions < CREDIT_MAGI_LIMIT;
  const retirementCredit = eligibleForCredits ? retirementIncomeCredit(pensionIncome + retirementOrdinary) : 0;
  const anySenior = input.people.some(person => ageAtYearEnd(person.birthDate, input.year) >= 65);
  const seniorCredit = eligibleForCredits && anySenior ? SENIOR_CREDIT : 0;
  const stateTax = Math.max(0, bracketTax - retirementCredit - seniorCredit);
  return {
    stateTax, localTax: 0, retirementIncomeCredit: retirementCredit, seniorCitizenCredit: seniorCredit,
    warning: "Ohio pre-credit estimate: the enacted flat 2.75% rate on Ohio taxable nonbusiness income above $26,050 "
      + "(reviewed 2026-09-24, income up to $26,050 remains taxed at 0%). Ohio has no standard deduction; instead a "
      + "Personal and Dependent Exemption of $2,400/$2,150/$1,900/$0 per person, tiered by modified adjusted gross income "
      + "at $40,000/$80,000/$749,999, applies regardless of filing status. Social Security is fully excluded. The "
      + "Retirement Income Credit (up to $200 per return, based on combined pension/IRA/401(k) income) and the Senior "
      + "Citizen Credit ($50 per return if any owner is 65 or older) both require modified adjusted gross income less "
      + "exemptions under $100,000. The Joint Filing Credit (up to $650) and the alternative lump-sum retirement and "
      + "distribution credits are not modeled, understating the benefit for a two-earner household or one taking a "
      + "one-time total distribution. Ohio's military-specific deductions are not modeled, since this planner cannot "
      + "identify military retirement income. Ohio's own municipal and school district income taxes are separate, "
      + "address-specific levies not modeled here; localTax is always zero. Only single and married-filing-jointly are "
      + "supported. Itemized deductions and other credits are excluded. Ohio's dollar figures are not further "
      + "inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
