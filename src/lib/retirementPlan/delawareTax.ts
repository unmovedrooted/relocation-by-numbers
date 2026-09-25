import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, standard-deduction, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-25 against the Delaware Division of
 * Revenue's 2025 Form PIT-RES instructions and the 2025 State Income Tax
 * Table/Schedule:
 * - Graduated brackets, identical for every filing status: 0% to $2,000,
 *   2.2% to $5,000, 3.9% to $10,000, 4.8% to $20,000, 5.2% to $25,000,
 *   5.55% to $60,000, 6.6% above $60,000.
 *   https://revenuefiles.delaware.gov/2025/TY25_taxtable.pdf
 * - Standard deduction: $3,250 (single/head of household/married filing
 *   separately) or $6,500 (married filing jointly), plus $2,500 per
 *   taxpayer or spouse who is 65 or older or legally blind (each
 *   condition separately, up to $5,000 per person).
 * - A $110 personal credit per taxpayer and spouse, plus a separate $110
 *   per taxpayer or spouse who is 60 or older.
 * - Social Security and Railroad Retirement benefits are fully excluded.
 *   A pension exclusion applies: for a taxpayer under 60 with a
 *   non-military pension, up to $2,000 of that pension; for a taxpayer 60
 *   or older, up to $12,500 of that taxpayer's own pension plus "eligible
 *   retirement income" (dividends, capital gains, interest, net rental
 *   income and qualified retirement plan distributions, including IRA and
 *   401(k) distributions) -- unused capacity does not carry over to a
 *   spouse.
 *   https://revenuefiles.delaware.gov/2025/PITForms_Instructions/Instructions/PIT-RES_Instructions_2025-01.pdf
 *
 * Uses enacted law, not a prediction of future legislation. This planner's
 * aggregate 401(k)/IRA/annuity distribution figure is split evenly between
 * spouses and, for an owner 60 or older, combined with that owner's own
 * pension income toward the $12,500 cap; the interest, dividend and
 * capital-gain components of "eligible retirement income" are not included,
 * since this planner does not track them per owner, understating the
 * exclusion for a household with meaningful taxable investment income. For
 * an owner under 60, only that owner's own pension income (not this
 * planner's 401(k)/IRA/annuity figure) is excluded, capped at $2,000, since
 * this planner cannot verify a military pension eligible for the larger
 * $12,500 under-60 exclusion. Only single and married-filing-jointly are
 * supported. Itemized deductions and other credits are excluded. Delaware's
 * dollar figures are not further inflation-indexed in this model. Future
 * legislation is not predicted. Not a tax return.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 3250, married: 6500 };
const ADDITIONAL_STANDARD_DEDUCTION_PER_CONDITION = 2500;
const PERSONAL_CREDIT_PER_PERSON = 110;
const AGE_60_CREDIT_PER_PERSON = 110;
const UNDER_60_NON_MILITARY_CAP = 2000;
const AGE_60_PLUS_CAP = 12500;
const BRACKET_CEILINGS = [2000, 5000, 10000, 20000, 25000, 60000, Infinity];
const BRACKET_RATES = [0, .022, .039, .048, .052, .0555, .066];

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function delawareTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.delawareContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Delaware planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Delaware projection year.");
  const perOwnerOrdinary = retirementOrdinary / input.people.length;
  let pensionExclusion = 0;
  let standardDeduction = 0;
  let personalCredit = 0;
  for (const person of input.people) {
    const age = ageAtYearEnd(person.birthDate, input.year);
    const ownPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
    pensionExclusion += age >= 60 ? Math.min(AGE_60_PLUS_CAP, ownPension + perOwnerOrdinary) : Math.min(UNDER_60_NON_MILITARY_CAP, ownPension);
    standardDeduction += ((age >= 65 ? 1 : 0) + (person.blind ? 1 : 0)) * ADDITIONAL_STANDARD_DEDUCTION_PER_CONDITION;
    personalCredit += PERSONAL_CREDIT_PER_PERSON + (age >= 60 ? AGE_60_CREDIT_PER_PERSON : 0);
  }
  standardDeduction += STANDARD_DEDUCTION[input.filing];
  const deAgi = Math.max(0, federalAgi - taxableBenefits - pensionExclusion);
  const taxable = Math.max(0, deAgi - standardDeduction);
  const grossTax = marginal(taxable, BRACKET_CEILINGS, BRACKET_RATES);
  const stateTax = Math.max(0, grossTax - personalCredit);
  return {
    stateTax, localTax: 0, pensionExclusion, standardDeduction, personalCredit,
    warning: "Delaware pre-credit estimate: the enacted graduated schedule (0% to $2,000, then 2.2%/3.9%/4.8%/5.2%/5.55% "
      + "through $60,000, 6.6% above), the same brackets for every filing status, reviewed 2026-09-25. The standard "
      + "deduction ($3,250 single/$6,500 married) adds $2,500 per taxpayer or spouse 65 or older and a separate $2,500 per "
      + "taxpayer or spouse legally blind. A $110 personal credit per taxpayer and spouse, plus a separate $110 per "
      + "taxpayer or spouse 60 or older, applies against computed tax. Social Security is fully excluded. For an owner 60 "
      + "or older, that owner's own pension income plus a share of this planner's aggregate 401(k)/IRA/annuity "
      + "distribution figure (split evenly between spouses) is excluded up to $12,500, unused capacity not shared with a "
      + "spouse; the interest, dividend, capital-gain and rental components of Delaware's broader \"eligible retirement "
      + "income\" definition are not included, understating the exclusion for a household with meaningful taxable "
      + "investment income. For an owner under 60, only that owner's own pension income is excluded, capped at $2,000, "
      + "since this planner cannot verify a military pension eligible for Delaware's larger $12,500 under-60 exclusion. "
      + "Only single and married-filing-jointly are supported. Itemized deductions and other credits are excluded. "
      + "Delaware's dollar figures are not further inflation-indexed in this model. Future legislation is not predicted. "
      + "Not a tax return.",
  };
}
