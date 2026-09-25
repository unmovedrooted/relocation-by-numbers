import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, standard-deduction, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-25 against Arkansas's enacted 2026 schedule
 * (Act 1 of the 2024 Second Extraordinary Session, continuing the state's
 * multi-year rate-reduction path) and the 2025 AR1000F instructions:
 * - Graduated brackets, the same for every filing status: 0% to $5,600,
 *   2% to $11,200, 3% to $16,000, 3.4% to $26,400, 3.7% above $26,400.
 *   https://tax.thomsonreuters.com/news/arkansas-cuts-individual-and-corporate-income-tax-rates/
 * - Standard deduction: $2,470 (single/head of household/married filing
 *   separately) or $4,940 (married filing jointly), unchanged from 2025.
 * - A $29 personal tax credit per taxpayer and spouse, plus $29 for each
 *   taxpayer or spouse who is legally blind.
 * - Social Security, Railroad Retirement and U.S. active-duty military
 *   compensation are fully exempt and never reported. A $6,000-per-taxpayer
 *   exemption applies to the combined total of income from an
 *   employer-sponsored retirement plan (any age, lump-sum or installment)
 *   and a traditional IRA distribution taken after age 59 1/2; military
 *   retirement pay is separately and fully exempt, without regard to this
 *   $6,000 cap.
 *   https://www.dfa.arkansas.gov/wp-content/uploads/2025_AR1000F_and_AR1000NR_Instructions.pdf
 *
 * Uses enacted law, not a prediction of future legislation. Income entered
 * as annual pension is attributed to its own owner and capped at $6,000 per
 * owner; this planner's aggregate 401(k)/IRA/annuity distribution figure is
 * split evenly between spouses and excluded, up to each owner's remaining
 * $6,000 capacity, except the portion that triggers the federal
 * early-distribution penalty, used as a proxy for Arkansas's own age-59 1/2
 * test on IRA distributions (this proxy does not distinguish an
 * employer-plan distribution, which needs no age test, from an IRA
 * distribution, which does). Arkansas's separate, unlimited military
 * retirement pay exemption is not modeled, since this planner cannot
 * identify military retirement income, understating the benefit for a
 * military retiree with more than $6,000 of such pay. The small $29
 * age-65 "65 Special" credit (available only to a taxpayer not claiming any
 * retirement-income exemption) and Arkansas's own net-capital-gain
 * exclusion are not modeled. Only single and married-filing-jointly are
 * supported. Itemized deductions and other credits are excluded. Arkansas's
 * dollar figures are not further inflation-indexed in this model. Future
 * legislation is not predicted. Not a tax return.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 2470, married: 4940 };
const PERSONAL_CREDIT_PER_PERSON = 29;
const RETIREMENT_CAP_PER_PERSON = 6000;
const BRACKET_CEILINGS = [5600, 11200, 16000, 26400, Infinity];
const BRACKET_RATES = [0, .02, .03, .034, .037];

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function arkansasTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number, earlyDistributionBase: number) {
  if (input.arkansasContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Arkansas planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Arkansas projection year.");
  const perOwnerOrdinary = Math.max(0, retirementOrdinary - earlyDistributionBase) / input.people.length;
  let retirementExclusion = 0;
  let personalCredit = 0;
  for (const person of input.people) {
    const ownPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
    retirementExclusion += Math.min(RETIREMENT_CAP_PER_PERSON, ownPension + perOwnerOrdinary);
    personalCredit += PERSONAL_CREDIT_PER_PERSON + (person.blind ? PERSONAL_CREDIT_PER_PERSON : 0);
  }
  const arAgi = Math.max(0, federalAgi - taxableBenefits - retirementExclusion);
  const taxable = Math.max(0, arAgi - STANDARD_DEDUCTION[input.filing]);
  const grossTax = marginal(taxable, BRACKET_CEILINGS, BRACKET_RATES);
  const stateTax = Math.max(0, grossTax - personalCredit);
  return {
    stateTax, localTax: 0, retirementExclusion, personalCredit,
    warning: "Arkansas pre-credit estimate: the enacted graduated schedule (0% to $5,600, 2%/3%/3.4% through $26,400, "
      + "3.7% above), the same brackets for every filing status, applied after the $2,470 single/$4,940 married standard "
      + "deduction, reviewed 2026-09-25. A $29 personal credit per taxpayer and spouse, plus $29 per taxpayer or spouse "
      + "legally blind, applies against computed tax. Social Security is fully exempt. Income entered as annual pension, "
      + "and this planner's aggregate 401(k)/IRA/annuity distribution figure (split evenly between spouses), is excluded "
      + "up to $6,000 per owner, except the portion of the distribution figure that triggers the federal "
      + "early-distribution penalty, used as a proxy for Arkansas's own age-59 1/2 test on IRA distributions (a proxy "
      + "that does not distinguish an employer-plan distribution, which needs no age test, from an IRA distribution, "
      + "which does). Arkansas's separate, unlimited military retirement pay exemption, its small age-65 credit, and its "
      + "own net-capital-gain exclusion are not modeled. Only single and married-filing-jointly are supported. Itemized "
      + "deductions and other credits are excluded. Arkansas's dollar figures are not further inflation-indexed in this "
      + "model. Future legislation is not predicted. Not a tax return.",
  };
}
