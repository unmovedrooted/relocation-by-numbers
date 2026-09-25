import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, two-bracket, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-24 against South Carolina's Act 110 of 2026
 * (the state's first major income tax restructuring in decades) and SC
 * Revenue Ruling #21-13:
 * - SC Information Letter #26-20: the enacted two-bracket schedule for tax
 *   years beginning after 2025 (1.99% up to $29,999; 5.21% times taxable
 *   income minus $966 at $30,000 or more), computed on South Carolina
 *   taxable income directly. South Carolina decoupled from IRC 63(b)-(g)
 *   (including the federal standard deduction), so the calculation starts
 *   from federal AGI rather than federal taxable income, and is replaced by
 *   the new South Carolina Income Adjusted Deduction (SCIAD): $15,000
 *   single/MFS, $30,000 married filing jointly, phased out on a straight
 *   fraction of federal AGI over $40,000 (single) or $80,000 (married),
 *   reaching $0 at $95,000/$190,000, with the reduction rounded down to
 *   the nearest $10.
 *   https://dor.sc.gov/sites/dor/files/policies/IL26-20.pdf
 * - SC Revenue Ruling #21-13 and S.C. Code Ann. Sections 12-6-1170 and
 *   12-6-1171 (unaffected by Act 110): the General Retirement Income
 *   Deduction (up to $3,000 per owner under 65, or $10,000 at 65+, for the
 *   original owner's own qualified retirement income under IRC Sections
 *   401/403/408/457 or a public pension); and the Age 65 and Older
 *   Deduction against any type of income (up to $15,000 per spouse 65 or
 *   older, $30,000 combined if both spouses are 65+ on a joint return),
 *   reduced only by the general retirement deduction each 65-or-older
 *   owner separately claims. Social Security is separately, fully exempt
 *   under Code Section 12-6-1120(4).
 *   https://dor.sc.gov/sites/dor/files/policies/RR21-13.pdf
 *
 * Uses enacted law, not a prediction of future legislation. South Carolina
 * has no local income tax; localTax is always zero. The General Retirement
 * Income Deduction pool is, per owner, that owner's own income entered as
 * "pension" plus a 50/50 share (for a married household) of this planner's
 * aggregate 401(k)/IRA/annuity distribution figure, since that figure is
 * not tracked per owner. South Carolina's separate, more generous military
 * retirement deductions under Section 12-6-1171 (up to $17,500 of earned
 * income at any age, or $30,000 of military retirement income at 65+) are
 * not modeled, since this planner cannot identify military retirement
 * income; this understates the benefit for a household that would qualify.
 * Only single and married-filing-jointly are supported. Itemized
 * deductions and credits (including the SC Earned Income Tax Credit) are
 * excluded. South Carolina's own dollar figures are not further
 * inflation-indexed in this model beyond the enacted 2026 amounts, matching
 * the restricted New York, Maryland, Indiana, DC, Illinois, New Jersey,
 * Pennsylvania, Colorado, New Mexico, Minnesota, Utah, Connecticut,
 * Vermont, Montana, Rhode Island, California, Virginia, Arizona, Georgia
 * and North Carolina estimates' convention.
 */

const SCIAD_BASE: Record<FilingStatus, number> = { single: 15000, married: 30000 };
const SCIAD_THRESHOLD: Record<FilingStatus, number> = { single: 40000, married: 80000 };
const SCIAD_WIDTH: Record<FilingStatus, number> = { single: 55000, married: 110000 };
const GENERAL_RETIREMENT_CAP: { under65: number; over65: number } = { under65: 3000, over65: 10000 };
const AGE_65_CAP_PER_PERSON = 15000;

function sciad(input: HouseholdTaxInput, federalAgi: number) {
  const base = SCIAD_BASE[input.filing];
  const excess = Math.max(0, federalAgi - SCIAD_THRESHOLD[input.filing]);
  const reduction = Math.floor((base * excess / SCIAD_WIDTH[input.filing]) / 10) * 10;
  return Math.max(0, base - reduction);
}

function generalRetirementDeduction(input: HouseholdTaxInput, retirementOrdinary: number) {
  const perOwnerOrdinary = retirementOrdinary / input.people.length;
  return input.people.map(person => {
    const pension = input.income.filter(item => item.kind === "pension" && item.ownerId === person.id).reduce((s, item) => s + item.amount, 0);
    const cap = ageAtYearEnd(person.birthDate, input.year) >= 65 ? GENERAL_RETIREMENT_CAP.over65 : GENERAL_RETIREMENT_CAP.under65;
    return Math.min(pension + perOwnerOrdinary, cap);
  });
}

function age65Deduction(input: HouseholdTaxInput, deductionsByPerson: number[]) {
  let cap = 0, reduction = 0;
  input.people.forEach((person, index) => {
    if (ageAtYearEnd(person.birthDate, input.year) >= 65) {
      cap += AGE_65_CAP_PER_PERSON;
      reduction += deductionsByPerson[index];
    }
  });
  return Math.max(0, cap - reduction);
}

export function southCarolinaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.southCarolinaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted South Carolina planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported South Carolina projection year.");
  const generalDeductions = generalRetirementDeduction(input, retirementOrdinary);
  const generalRetirement = generalDeductions.reduce((a, b) => a + b, 0);
  const age65 = age65Deduction(input, generalDeductions);
  const scAgi = federalAgi - taxableBenefits;
  const taxable = Math.max(0, scAgi - generalRetirement - age65 - sciad(input, federalAgi));
  const stateTax = taxable < 30000 ? taxable * 0.0199 : taxable * 0.0521 - 966;
  return {
    stateTax: Math.max(0, stateTax), localTax: 0, generalRetirementDeduction: generalRetirement, age65Deduction: age65,
    warning: "South Carolina pre-credit estimate: Act 110 of 2026's enacted two-bracket schedule (1.99% to $29,999; 5.21% "
      + "times taxable income minus $966 at $30,000 or more, reviewed 2026-09-24), computed on federal AGI directly (South "
      + "Carolina decoupled from the federal standard deduction). The new South Carolina Income Adjusted Deduction (SCIAD, "
      + "$15,000 single/$30,000 married) phases out on a straight fraction of federal AGI over $40,000 (single) or $80,000 "
      + "(married), reaching $0 at $95,000/$190,000. Social Security is fully excluded. The General Retirement Income "
      + "Deduction gives each owner up to $3,000 (under 65) or $10,000 (65+) of their own income entered as \"pension\" plus "
      + "a 50/50 share of this planner's aggregate 401(k)/IRA/annuity distribution figure (that figure is not tracked per "
      + "owner). The Age 65 and Older Deduction adds up to $15,000 per spouse 65 or older against any income, reduced by "
      + "that spouse's own general retirement deduction. South Carolina's separate, more generous military retirement "
      + "deductions (up to $17,500 of earned income at any age, or $30,000 of military retirement income at 65+) are not "
      + "modeled, since this planner cannot identify military retirement income, understating the benefit for a household "
      + "that would qualify. South Carolina has no local income tax. Only single and married-filing-jointly are supported. "
      + "Itemized deductions and credits are excluded. South Carolina's dollar figures are not further inflation-indexed in "
      + "this model. Future legislation is not predicted. Not a tax return.",
  };
}
