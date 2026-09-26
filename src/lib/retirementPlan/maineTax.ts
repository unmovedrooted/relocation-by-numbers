import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Maine resident annual settlement.
 *
 * Verified against Maine Revenue Services' own 2026 individual income tax
 * rate schedule (Income/Estate Tax Division, revised 05-20-2026) and 2026
 * Form 1040ES-ME instructions: a graduated schedule (5.8%/6.75%/7.15% at
 * $27,400/$64,850 single or married filing separately, $54,850/$129,750
 * married filing jointly), plus the already-enacted 2% surcharge on Maine
 * taxable income above $1,000,000 single/$1,500,000 married filing jointly,
 * the 2026 standard deduction ($15,700 single/$31,400 married filing
 * jointly, plus $2,050 single or $1,650 married per person per age-65-or-
 * blind condition), and a $5,300 per-person personal exemption.
 * https://www.maine.gov/revenue/sites/maine.gov.revenue/files/2026-05/ind_tax_rate_sched_2026_rev.pdf
 * https://www.maine.gov/revenue/sites/maine.gov.revenue/files/inline-files/26_1040es_fillable.pdf
 *
 * Social Security and Railroad Retirement benefits included in federal
 * income are fully subtracted. A per-taxpayer Pension Income Deduction (the
 * 2026 $49,824 cap, equal to the Social Security full-retirement-age benefit
 * as of January 1, 2026) covers qualifying pension and retirement-plan
 * income under IRC sections 401(a), 401(k), 403, 408, 408A and 457(b),
 * reduced by that owner's own gross Social Security and Railroad Retirement
 * benefits received, with no age restriction; this planner applies it to
 * each owner's own pension income (any pensionType) plus a share of this
 * planner's aggregate 401(k)/IRA/annuity distribution figure. Maine's
 * separate, fully uncapped military retirement pay exemption is not
 * modeled, since this planner cannot identify military retired pay.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 15700, married: 31400 };
const AGE_OR_BLIND_ADDITION: Record<FilingStatus, number> = { single: 2050, married: 1650 };
const PERSONAL_EXEMPTION_PER_PERSON = 5300;
const PENSION_DEDUCTION_CAP = 49824;
const SURCHARGE_THRESHOLD: Record<FilingStatus, number> = { single: 1000000, married: 1500000 };
const SURCHARGE_RATE = .02;
const BRACKET_CEILINGS: Record<FilingStatus, number[]> = {
  single: [27400, 64850, Infinity],
  married: [54850, 129750, Infinity],
};
const BRACKET_RATES = [.058, .0675, .0715];

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function maineTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.maineContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Maine planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Maine projection year.");
  const perOwnerOrdinary = retirementOrdinary / input.people.length;
  let pensionDeduction = 0;
  let ageOrBlindConditions = 0;
  for (const person of input.people) {
    const ownPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
    const ownGrossSocialSecurity = input.income.filter(item => item.ownerId === person.id && item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0);
    const cap = Math.max(0, PENSION_DEDUCTION_CAP - ownGrossSocialSecurity);
    pensionDeduction += Math.min(cap, ownPension + perOwnerOrdinary);
    ageOrBlindConditions += (ageAtYearEnd(person.birthDate, input.year) >= 65 ? 1 : 0) + (person.blind ? 1 : 0);
  }
  const meAgi = Math.max(0, federalAgi - taxableBenefits - pensionDeduction);
  const standardDeduction = STANDARD_DEDUCTION[input.filing] + ageOrBlindConditions * AGE_OR_BLIND_ADDITION[input.filing];
  const exemption = PERSONAL_EXEMPTION_PER_PERSON * input.people.length;
  const taxable = Math.max(0, meAgi - standardDeduction - exemption);
  const baseTax = marginal(taxable, BRACKET_CEILINGS[input.filing], BRACKET_RATES);
  const surcharge = Math.max(0, taxable - SURCHARGE_THRESHOLD[input.filing]) * SURCHARGE_RATE;
  const stateTax = baseTax + surcharge;
  return {
    stateTax, localTax: 0, meAgi, pensionDeduction,
    warning: "Maine pre-credit estimate using the enacted 2026 graduated schedule (5.8%/6.75%/7.15% at $27,400/$64,850 "
      + "single, $54,850/$129,750 married filing jointly) plus the enacted 2% surcharge on Maine taxable income above "
      + "$1,000,000 single/$1,500,000 married filing jointly, applied after the 2026 standard deduction ($15,700 "
      + "single/$31,400 married filing jointly, plus $2,050 single or $1,650 married per person per age-65-or-blind "
      + "condition) and a $5,300 per-person personal exemption. Social Security and Railroad Retirement benefits are "
      + "fully exempt. Each owner's own pension income of any pensionType, plus a share of this planner's aggregate "
      + "401(k)/IRA/annuity distribution figure, is excluded up to a $49,824 per-owner cap reduced by that owner's own "
      + "gross Social Security and Railroad Retirement benefits, at any age, but Maine's separate, fully uncapped "
      + "military retirement pay exemption is not modeled. Only single and married-filing-jointly are supported. "
      + "Itemized deductions and other credits are excluded.",
  };
}
