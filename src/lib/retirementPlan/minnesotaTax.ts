import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { stateSocialSecurityInclusion } from "./stateSocialSecurityCoverage";
import { ageAtYearEnd } from "./rules";

/** Restricted, own-standard-deduction, PRE-CREDIT planning estimate. Rates
 * and thresholds reviewed 2026-09-23 against:
 * - Minnesota Department of Revenue press release, "Minnesota income tax
 *   brackets, standard deduction and dependent exemption amounts for tax
 *   year 2026" (2025-12-16): the four-bracket schedule (5.35%/6.80%/7.85%/
 *   9.85%) for single and married-filing-jointly, and the $15,300 (single)
 *   / $30,600 (married) 2026 standard deduction -- Minnesota's own figure,
 *   not conformed to the federal standard deduction.
 *   https://www.revenue.state.mn.us/press-release/2025-12-16/minnesota-income-tax-brackets-standard-deduction-and-dependent-exemption
 * - Minnesota's additional standard deduction for age 65+ or blind: $1,850
 *   per qualifying condition for unmarried filers, $1,450 per qualifying
 *   condition (per spouse) for married filers; a taxpayer who is both 65+
 *   and blind claims it twice.
 * - Minnesota Department of Revenue, Social Security Benefit Subtraction:
 *   this planner reuses the already-verified stateSocialSecurityInclusion
 *   Minnesota branch (simplified vs. alternate method, the larger
 *   controlling), computing the alternate method's required "provisional
 *   income" input as federal AGI less federally taxable Social Security,
 *   plus tax-exempt interest, plus half of gross Social Security benefits --
 *   the standard provisional-income formula the alternate method's own
 *   worksheet uses.
 *   https://www.revenue.state.mn.us/social-security-benefit-subtraction
 *
 * Uses enacted law, not a prediction of future legislation. Minnesota has no
 * local income tax; localTax is always zero. Minnesota's Qualified Public
 * Pension Subtraction (up to $25,000 married / $12,500 other filers) is NOT
 * modeled: it applies only to specific Minnesota and out-of-state public
 * pension plans whose service was not also covered by Social Security, a
 * distinction this planner's generic "pension" income kind cannot make: all
 * pension income is fully taxable here. Only single and married-filing-
 * jointly are supported. No itemized deductions or credits are modeled.
 * Minnesota parameters are not inflation-indexed in this model, matching the
 * restricted New York, Maryland, Indiana, DC, Illinois, New Jersey,
 * Pennsylvania, Colorado and New Mexico estimates' convention.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 15300, married: 30600 };
const ADDITIONAL_DEDUCTION: Record<FilingStatus, number> = { single: 1850, married: 1450 };

const STATE_BRACKETS: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [
    { upTo: 33310, rate: .0535 }, { upTo: 109430, rate: .068 }, { upTo: 203150, rate: .0785 }, { upTo: Infinity, rate: .0985 },
  ],
  married: [
    { upTo: 48700, rate: .0535 }, { upTo: 193480, rate: .068 }, { upTo: 337930, rate: .0785 }, { upTo: Infinity, rate: .0985 },
  ],
};

function standardDeduction(input: HouseholdTaxInput, year: number) {
  let additional = 0;
  for (const person of input.people) {
    if (ageAtYearEnd(person.birthDate, year) >= 65) additional++;
    if (person.blind) additional++;
  }
  return STANDARD_DEDUCTION[input.filing] + additional * ADDITIONAL_DEDUCTION[input.filing];
}

export function minnesotaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, taxExemptInterest: number) {
  if (input.minnesotaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Minnesota planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Minnesota projection year.");
  const grossBenefits = input.income.filter(item => item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0);
  const provisionalIncome = federalAgi - taxableBenefits + taxExemptInterest + 0.5 * grossBenefits;
  const ssResult = stateSocialSecurityInclusion({
    state: "mn", year: input.year, futurePolicy: input.year > 2026 ? "hold-2026-law" : undefined,
    filing: input.filing === "married" ? "married-joint" : "single", federalAgi, grossBenefits,
    federallyTaxableBenefits: taxableBenefits, mnProvisionalIncome: provisionalIncome,
  });
  const socialSecuritySubtraction = taxableBenefits - ssResult.taxableBenefits!;
  const taxable = Math.max(0, federalAgi - standardDeduction(input, input.year) - socialSecuritySubtraction);
  const stateTax = sumBrackets(taxable, STATE_BRACKETS[input.filing]);
  return {
    stateTax, localTax: 0, socialSecuritySubtraction,
    warning: "Minnesota pre-credit estimate: enacted 2026 brackets (reviewed 2026-09-23), Minnesota's own $15,300/$30,600 "
      + "standard deduction (plus $1,850/$1,450 per age-65-or-blind condition), and the larger of the simplified or "
      + "alternate-method Social Security subtraction. The Qualified Public Pension Subtraction is not modeled: it applies "
      + "only to specific public pension plans not coordinated with Social Security, which this planner cannot identify, so "
      + "pension income is fully taxable here. Minnesota has no local income tax. Only single and married-filing-jointly are "
      + "supported. Itemized deductions and credits are excluded. Minnesota parameters are not inflation-indexed in this "
      + "model. Future legislation is not predicted. Not a tax return.",
  };
}
