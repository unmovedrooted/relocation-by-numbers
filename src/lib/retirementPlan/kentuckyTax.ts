import type { HouseholdTaxInput } from "./householdTax";

/**
 * Restricted, verified Kentucky resident annual settlement.
 *
 * Verified against 2025 HB 1 (signed February 6, 2025), which sets
 * Kentucky's flat individual income tax rate at 3.5% for taxable years
 * beginning on or after January 1, 2026 (continuing the state's
 * already-enacted, unconditionally scheduled step-downs from 4% in 2024
 * and 4.5% in 2023 -- not a prediction of future legislation), and the
 * Kentucky Department of Revenue's 2026 standard deduction announcement
 * of $3,360 per taxpayer (revenue.ky.gov, "Kentucky DOR Announces 2026
 * Standard Deduction"; the deduction is computed annually under KRS
 * 141.081 and applies per taxpayer, not doubled for a joint return, since
 * Kentucky computes each spouse's tax separately even on a combined
 * return).
 *
 * Social Security is fully exempt. Kentucky's Schedule P Pension Income
 * Exclusion covers "all pension and retirement income paid under a
 * written retirement plan," explicitly including pensions, annuities,
 * IRA accounts and 401(k) and similar deferred compensation plans, up to
 * $31,110 -- "for each taxpayer," computed and claimed separately by a
 * taxpayer and spouse regardless of filing status.
 * https://revenue.ky.gov/Forms/Schedule%20P%20(2025).pdf
 *
 * Because the tax is flat, the excluded amount is what matters, not which
 * spouse's income it comes from, so this planner applies the $31,110 cap
 * per owner to that owner's own pension income plus an even share of the
 * household's aggregate 401(k)/IRA/annuity distribution figure. Schedule
 * P's separate, larger exemption for government pension income
 * attributable to service credit earned before January 1, 1998 is not
 * modeled, since this planner cannot verify a modeled owner's date of
 * retirement or years of qualifying service -- understating the
 * exclusion for such a retiree.
 */

const FLAT_RATE = .035;
const STANDARD_DEDUCTION_PER_PERSON = 3360;
const PENSION_EXCLUSION_CAP = 31110;

export function kentuckyTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.kentuckyContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Kentucky planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Kentucky projection year.");
  const perOwnerOrdinary = retirementOrdinary / input.people.length;
  let pensionExclusion = 0;
  for (const person of input.people) {
    const ownPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
    pensionExclusion += Math.min(PENSION_EXCLUSION_CAP, ownPension + perOwnerOrdinary);
  }
  const standardDeduction = STANDARD_DEDUCTION_PER_PERSON * input.people.length;
  const kyAgi = Math.max(0, federalAgi - taxableBenefits - pensionExclusion);
  const taxable = Math.max(0, kyAgi - standardDeduction);
  const stateTax = taxable * FLAT_RATE;
  return {
    stateTax, localTax: 0, kyAgi, pensionExclusion,
    warning: "Kentucky pre-credit estimate using the enacted, unconditionally scheduled flat 3.5% rate for 2026, applied "
      + "after a $3,360 standard deduction per taxpayer, not a prediction of future legislation. Social Security is fully "
      + "exempt. Each owner's own pension income plus a share of this planner's aggregate 401(k)/IRA/annuity distribution "
      + "figure is excluded up to $31,110 per owner, but Schedule P's separate, larger exclusion for qualifying government "
      + "pension service credit earned before January 1, 1998 is not modeled. Only single and married-filing-jointly are "
      + "supported. Itemized deductions and credits are excluded.",
  };
}
