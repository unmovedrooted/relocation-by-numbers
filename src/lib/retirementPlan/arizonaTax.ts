import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, flat-rate, PRE-CREDIT planning estimate. Rates and thresholds
 * reviewed 2026-09-24 against:
 * - Arizona Department of Revenue, 2025 Individual Income Tax Highlights: the
 *   flat 2.5% rate for all income levels and filing statuses (the old X/Y
 *   bracket tables are obsolete), and the 2025 standard deduction ($15,750
 *   single/MFS, $31,500 married filing jointly). Arizona eliminated separate
 *   personal exemptions in its 2019 conformity overhaul; the standard
 *   deduction is the only broad-based subtraction.
 *   https://azdor.gov/forms/individual-income-tax-highlights
 * - Arizona Revised Statutes 43-1022: Social Security and Tier 1 Railroad
 *   Retirement benefits included in federal AGI are fully subtracted
 *   (paragraph 10); benefits, annuities and pensions from the U.S.
 *   government, Arizona state retirement system, or a county/city/town
 *   retirement plan are subtracted up to $2,500 per taxpayer (paragraph 2);
 *   military retired or retainer pay has its own separate, uncapped
 *   subtraction (paragraph 26).
 *   https://www.azleg.gov/ars/43/01022.htm
 *
 * Uses enacted law, not a prediction of future legislation. Arizona has no
 * local income tax; localTax is always zero. The $2,500-per-owner government
 * pension subtraction applies only to income entered as annual pension for
 * an owner with a federal-government or other-government pension type
 * (treated as Arizona state/local government here); a private or
 * unspecified pension, and this planner's aggregate 401(k)/IRA/annuity
 * distribution figure, do not qualify and remain fully taxable. Arizona's
 * separate, uncapped military retirement pay subtraction is not modeled,
 * since this planner cannot identify military retirement income,
 * understating the benefit for such a household. Only single and married-
 * filing-jointly are supported. Itemized deductions and credits (including
 * the various charitable-organization tax credits) are excluded. Arizona's
 * dollar figures are not further inflation-indexed in this model, matching
 * the restricted New York, Maryland, Indiana, DC, Illinois, New Jersey,
 * Pennsylvania, Colorado, New Mexico, Minnesota, Utah, Connecticut, Vermont,
 * Montana, Rhode Island, California and Virginia estimates' convention.
 */

const STATE_RATE = .025;
const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 15750, married: 31500 };
const GOVERNMENT_PENSION_CAP_PER_PERSON = 2500;

function governmentPensionSubtraction(input: HouseholdTaxInput) {
  return input.people.reduce((sum, person) => {
    const pension = input.income
      .filter(item => item.kind === "pension" && item.ownerId === person.id
        && (item.pensionType === "federal-government" || item.pensionType === "other-government"))
      .reduce((s, item) => s + item.amount, 0);
    return sum + Math.min(pension, GOVERNMENT_PENSION_CAP_PER_PERSON);
  }, 0);
}

export function arizonaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.arizonaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Arizona planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Arizona projection year.");
  const pensionSubtraction = governmentPensionSubtraction(input);
  const taxable = Math.max(0, federalAgi - taxableBenefits - pensionSubtraction - STANDARD_DEDUCTION[input.filing]);
  const stateTax = taxable * STATE_RATE;
  return {
    stateTax, localTax: 0, pensionSubtraction,
    warning: "Arizona pre-credit estimate: the enacted flat 2.5% rate (reviewed 2026-09-24) and Arizona's own standard "
      + "deduction ($15,750 single/$31,500 married; Arizona has no separate personal exemption). Social Security is fully "
      + "excluded. Up to $2,500 per owner of income entered as annual pension with a federal-government or other-government "
      + "pension type is excluded; a private or unspecified pension, and this planner's aggregate 401(k)/IRA/annuity "
      + "distribution figure, remain fully taxable. Arizona's separate, uncapped military retirement pay subtraction is not "
      + "modeled, since this planner cannot identify military retirement income. Arizona has no local income tax. Only "
      + "single and married-filing-jointly are supported. Itemized deductions and credits are excluded. Arizona's dollar "
      + "figures are not further inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
