import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, own-standard-deduction, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-24 against Virginia Tax's published guidance:
 * - The four-bracket schedule, identical for every filing status (Virginia
 *   does not double thresholds for married filers): 2% to $3,000, 3% to
 *   $5,000, 5% to $17,000, 5.75% above.
 *   https://www.individual.tax.virginia.gov/income-tax-calculator
 * - The standard deduction: $8,750 single/$17,500 married.
 *   https://www.tax.virginia.gov/deductions
 * - The Age Deduction for Taxpayers Age 65 and Over: up to $12,000 per
 *   qualifying spouse, reduced dollar-for-dollar once household "adjusted
 *   federal AGI" (federal AGI less taxable Social Security and Tier 1
 *   Railroad Retirement benefits, ignoring fixed-date conformity
 *   adjustments this planner does not model) exceeds $50,000 (single) or
 *   $75,000 (married); a spouse born on or before January 1, 1939 instead
 *   receives the full $12,000 regardless of income (a permanent 2004
 *   grandfather date, not a rolling age-65 threshold).
 *   https://www.tax.virginia.gov/subtractions
 * - Social Security is excluded per Virginia's existing "exempt"
 *   classification and location-layer subtraction already used elsewhere in
 *   this planner.
 *   https://www.tax.virginia.gov/subtractions
 *
 * Uses enacted law, not a prediction of future legislation. Virginia has no
 * local income tax; localTax is always zero. The reached-65 test uses simple
 * year subtraction (birth year at or before the tax year minus 65), matching
 * this planner's convention elsewhere; Virginia's own "born on or before
 * Jan. 1" wording is precise to the day, which this simplification does not
 * capture. Virginia's growing military retirement pay subtraction is not
 * modeled, since this planner cannot identify military retirement income,
 * understating the benefit for such a household. Only single and married-
 * filing-jointly are supported. Itemized deductions and credits are
 * excluded. Virginia's dollar figures are not further inflation-indexed in
 * this model, matching the restricted New York, Maryland, Indiana, DC,
 * Illinois, New Jersey, Pennsylvania, Colorado, New Mexico, Minnesota, Utah,
 * Connecticut, Vermont, Montana, Rhode Island and California estimates'
 * convention.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 8750, married: 17500 };
const AGE_DEDUCTION_MAX = 12000;
const AGE_DEDUCTION_THRESHOLD: Record<FilingStatus, number> = { single: 50000, married: 75000 };
const GRANDFATHER_BIRTH_YEAR = 1939;

const STATE_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 3000, rate: .02 }, { upTo: 5000, rate: .03 }, { upTo: 17000, rate: .05 }, { upTo: Infinity, rate: .0575 },
];

function ageDeduction(input: HouseholdTaxInput, adjustedFederalAgi: number) {
  const excess = Math.max(0, adjustedFederalAgi - AGE_DEDUCTION_THRESHOLD[input.filing]);
  return input.people.reduce((sum, person) => {
    if (ageAtYearEnd(person.birthDate, input.year) < 65) return sum;
    const birthYear = Number(person.birthDate.slice(0, 4));
    if (birthYear <= GRANDFATHER_BIRTH_YEAR) return sum + AGE_DEDUCTION_MAX;
    return sum + Math.max(0, AGE_DEDUCTION_MAX - excess);
  }, 0);
}

export function virginiaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.virginiaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Virginia planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Virginia projection year.");
  const adjustedFederalAgi = federalAgi - taxableBenefits;
  const deduction = ageDeduction(input, adjustedFederalAgi);
  const taxable = Math.max(0, adjustedFederalAgi - STANDARD_DEDUCTION[input.filing] - deduction);
  const stateTax = sumBrackets(taxable, STATE_BRACKETS);
  return {
    stateTax, localTax: 0, ageDeduction: deduction,
    warning: "Virginia pre-credit estimate: the enacted four-bracket schedule (2%/3%/5%/5.75%, identical for every filing "
      + "status), Virginia's own standard deduction ($8,750 single/$17,500 married), and the Age Deduction for taxpayers 65 "
      + "or older by year end (up to $12,000 per qualifying spouse, reduced dollar-for-dollar once household federal AGI "
      + "less taxable Social Security exceeds $50,000/$75,000; a spouse born on or before January 1, 1939 keeps the full "
      + "$12,000 regardless of income, a fixed 2004 grandfather date). Social Security is fully excluded. Virginia's growing "
      + "military retirement pay subtraction is not modeled, since this planner cannot identify military retirement income, "
      + "understating the benefit for such a household. Virginia has no local income tax. Only single and married-filing-"
      + "jointly are supported. Itemized deductions and credits are excluded. Virginia's dollar figures are not further "
      + "inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
