import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, federal-taxable-income-based, PRE-CREDIT planning estimate.
 * Rates and thresholds reviewed 2026-09-25 against:
 * - Iowa Department of Revenue, "IDR Announces 2026 Individual Income Tax
 *   and Interest Rates": a flat 3.8% rate applies to all taxable individual
 *   income for tax year 2026, regardless of filing status (an acceleration,
 *   via 2024's SF 574, of the flat-tax conversion originally scheduled for
 *   2026 under HF 2317).
 *   https://revenue.iowa.gov/press-release/2025-10-21/idr-announces-2026-individual-income-tax-and-interest-rates
 * - 2025 IA 1040 form: Iowa taxable income (line 4) equals FEDERAL TAXABLE
 *   INCOME (line 2, after the federal standard/itemized deduction) plus net
 *   Iowa modifications (line 3) -- there is no separate Iowa standard
 *   deduction. Schedule 1 subtracts Social Security benefits (line 5, in
 *   full) and "IRA/Pension/Railroad retirement income" (line 7). Step 3
 *   grants a $40 Personal Credit ($80 married filing jointly) plus a $20
 *   credit for each taxpayer 65 or older or blind, against computed tax.
 *   https://revenue.iowa.gov/media/4400/download?inline=
 * - Iowa Department of Revenue, "Retirement Income Tax Guidance": the
 *   pension/retirement income exclusion (Iowa Code section 422.7(31)/(61))
 *   applies to a taxpayer 55 years of age or older (by December 31) or
 *   disabled, with no dollar cap, covering IRAs, 401(k)/403(b)/457 and other
 *   employer plans, SEP/SIMPLE plans, IPERS and other governmental pensions,
 *   and annuities.
 *   https://revenue.iowa.gov/taxes/tax-guidance/individual-income-tax/retirement-income-tax-guidance
 *
 * Uses enacted law, not a prediction of future legislation. Iowa's separate,
 * unconditional exclusion for MILITARY retirement pay (available at any age)
 * is not modeled, since this planner cannot identify military retirement
 * income; an owner under 55 with a military pension is therefore shown as
 * fully taxable here, understating the benefit for that household. The
 * disability-based exclusion for an owner under 55 is not modeled, since
 * this planner has no disability field. The retirement income exclusion is
 * evaluated per owner: this planner's aggregate 401(k)/IRA/annuity
 * distribution figure is split evenly between spouses and excluded only for
 * a qualifying (55+) owner's own share. Only single and
 * married-filing-jointly are supported. Itemized deductions and all other
 * credits are excluded. Iowa's dollar figures are not further
 * inflation-indexed in this model, matching the restricted New York,
 * Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania, Colorado, New
 * Mexico, Minnesota, Utah, Connecticut, Vermont, Montana, Rhode Island,
 * California, Virginia, Arizona, Georgia, North Carolina, South Carolina,
 * Ohio and Massachusetts estimates' convention.
 */

const STATE_RATE = .038;
const PERSONAL_CREDIT: Record<FilingStatus, number> = { single: 40, married: 80 };
const AGE_OR_BLIND_CREDIT_PER_PERSON = 20;

export function iowaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, federalTaxableIncome: number, retirementOrdinary: number) {
  if (input.iowaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Iowa planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Iowa projection year.");
  const perOwnerShare = retirementOrdinary / input.people.length;
  let retirementExclusion = 0;
  for (const person of input.people) {
    if (ageAtYearEnd(person.birthDate, input.year) < 55) continue;
    const ownPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
    retirementExclusion += ownPension + perOwnerShare;
  }
  const taxable = Math.max(0, federalTaxableIncome - taxableBenefits - retirementExclusion);
  const grossTax = taxable * STATE_RATE;
  const exemptionCredit = PERSONAL_CREDIT[input.filing]
    + input.people.filter(person => ageAtYearEnd(person.birthDate, input.year) >= 65).length * AGE_OR_BLIND_CREDIT_PER_PERSON
    + input.people.filter(person => person.blind).length * AGE_OR_BLIND_CREDIT_PER_PERSON;
  const stateTax = Math.max(0, grossTax - exemptionCredit);
  return {
    stateTax, localTax: 0, retirementExclusion, exemptionCredit,
    warning: "Iowa pre-credit estimate: the enacted flat 3.8% rate (reviewed 2026-09-25) applied to federal taxable income "
      + "(after the federal standard/itemized deduction), with no separate Iowa standard deduction. Social Security is fully "
      + "subtracted. A $40 Personal Credit ($80 married filing jointly) plus $20 per taxpayer 65 or older and a separate $20 "
      + "per taxpayer legally blind (both can apply to the same taxpayer) is applied against computed tax. Income entered as "
      + "annual pension, and this planner's aggregate 401(k)/IRA/annuity "
      + "distribution figure (split evenly between spouses), is excluded for each owner who is 55 or older by year end; a "
      + "younger owner's retirement income remains fully taxable, including Iowa's separate, unconditional military "
      + "retirement pay exclusion and its disability-based exclusion for an owner under 55, neither of which this planner "
      + "can identify. Only single and married-filing-jointly are supported. Itemized deductions and other credits are "
      + "excluded. Iowa's dollar figures are not further inflation-indexed in this model. Future legislation is not "
      + "predicted. Not a tax return.",
  };
}
