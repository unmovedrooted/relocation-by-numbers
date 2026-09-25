import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, own-standard-deduction, PRE-CREDIT planning estimate. Rates
 * and thresholds reviewed 2026-09-25 against:
 * - Mississippi Department of Revenue, "Individual Income Tax Frequently
 *   Asked Questions": the first $10,000 of taxable income is exempt (each
 *   spouse's own $10,000 on a joint return, so $20,000 combined), with the
 *   remainder taxed at a single statutory rate. Social Security is fully
 *   exempt. Retirement income, pensions and annuities -- including 401(k)
 *   and IRA distributions -- are exempt once the recipient has met the
 *   plan's retirement requirements; an early distribution (reported with
 *   federal Form 1099-R code 1) is not retirement income and remains
 *   taxable.
 *   https://www.dor.ms.gov/individual/individual-income-tax-frequently-asked-questions
 * - The enacted "Build Up Mississippi Act" (HB 1 of 2025) sets the rate
 *   above the exempt bracket at 4.0% for 2026, then a fixed, unconditional
 *   0.25-percentage-point annual reduction for 2027 (3.75%), 2028 (3.5%),
 *   2029 (3.25%) and 2030 (3.0%). Only after 2030 do further reductions
 *   become contingent on state revenue-growth triggers, which this planner
 *   does not predict; the rate is held at 3.0% for 2031 and later.
 *   https://tax.thomsonreuters.com/news/mississippi-governor-signs-legislation-phasing-out-individual-income-tax/
 * - The Mississippi 2026 withholding formula (reflecting the Department's
 *   published standard deduction and personal exemption amounts): a $2,300
 *   single/$4,600 married-filing-jointly standard deduction, and a $6,000
 *   single/$12,000 married-filing-jointly personal exemption, both taken
 *   before the $10,000/$20,000 exempt bracket.
 *   https://help.nfc.usda.gov/bulletins/2026/1768327516.htm
 *
 * Uses enacted law, not a prediction of future legislation. This planner's
 * aggregate 401(k)/IRA/annuity distribution figure is excluded except for
 * the portion that triggers the federal 10%-early-distribution-penalty base,
 * used as a proxy for Mississippi's own retirement-requirements test; a
 * distribution that avoids the federal penalty for a reason other than
 * reaching age 59 1/2 (disability, substantially equal payments, etc.) is
 * incorrectly excluded here. Only single and married-filing-jointly are
 * supported. Itemized deductions and credits are excluded. Mississippi's
 * dollar figures are not further inflation-indexed in this model, matching
 * the restricted New York, Maryland, Indiana, DC, Illinois, New Jersey,
 * Pennsylvania, Colorado, New Mexico, Minnesota, Utah, Connecticut, Vermont,
 * Montana, Rhode Island, California, Virginia, Arizona, Georgia, North
 * Carolina, South Carolina, Ohio, Massachusetts and Iowa estimates'
 * convention.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 2300, married: 4600 };
const PERSONAL_EXEMPTION: Record<FilingStatus, number> = { single: 6000, married: 12000 };
const EXEMPT_BRACKET: Record<FilingStatus, number> = { single: 10000, married: 20000 };

function stateRate(year: number) {
  if (year <= 2026) return .04;
  if (year === 2027) return .0375;
  if (year === 2028) return .035;
  if (year === 2029) return .0325;
  return .03;
}

function pensionSubtraction(input: HouseholdTaxInput) {
  return input.income.filter(item => item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
}

export function mississippiTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number, earlyDistributionBase: number) {
  if (input.mississippiContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Mississippi planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Mississippi projection year.");
  const excludableRetirementOrdinary = Math.max(0, retirementOrdinary - earlyDistributionBase);
  const msAgi = federalAgi - taxableBenefits - pensionSubtraction(input) - excludableRetirementOrdinary;
  const taxableIncome = Math.max(0, msAgi - STANDARD_DEDUCTION[input.filing] - PERSONAL_EXEMPTION[input.filing]);
  const taxable = Math.max(0, taxableIncome - EXEMPT_BRACKET[input.filing]);
  const stateTax = taxable * stateRate(input.year);
  return {
    stateTax, localTax: 0, excludableRetirementOrdinary,
    warning: "Mississippi pre-credit estimate: the first $10,000 of taxable income per spouse ($20,000 married filing "
      + "jointly) is exempt, with the remainder taxed at the enacted, unconditionally scheduled rate -- 4.0% for 2026, "
      + "stepping down to 3.75% (2027), 3.5% (2028), 3.25% (2029) and 3.0% (2030 and later); further post-2030 cuts are "
      + "contingent on state revenue-growth triggers and are not predicted here. Mississippi's own standard deduction "
      + "($2,300 single/$4,600 married) and personal exemption ($6,000 single/$12,000 married) apply before that exempt "
      + "bracket. Social Security is fully exempt. Income entered as annual pension is fully exempt, and this planner's "
      + "aggregate 401(k)/IRA/annuity distribution figure is excluded except for the portion that triggers the federal "
      + "early-distribution penalty, used as a proxy for Mississippi's own retirement-requirements test; this can "
      + "incorrectly exclude a distribution that avoids the federal penalty for another reason. Only single and "
      + "married-filing-jointly are supported. Itemized deductions and credits are excluded. Mississippi's dollar figures "
      + "are not further inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
