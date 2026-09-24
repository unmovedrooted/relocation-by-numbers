import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, flat-rate, PRE-CREDIT planning estimate. Rates and thresholds
 * reviewed 2026-09-24 against the Georgia Department of Revenue's 2025
 * IT-511 Individual Income Tax Booklet:
 * - The flat 5.19% rate (Form 500, Line 16) and the standard deduction
 *   ($12,000 single/MFS/HOH/QSS, $24,000 married filing jointly, Form 500,
 *   Line 11). Georgia eliminated the personal exemption for the taxpayer and
 *   spouse; only the $4,000-per-dependent exemption remains, not applicable
 *   to this planner's two-adult household model.
 *   https://dor.georgia.gov/it-511-individual-income-tax-instruction-booklet
 * - Social Security (and Railroad Retirement) included in federal AGI is
 *   fully subtracted (Schedule 1, Line 8), matching Georgia's existing
 *   "exempt" classification in this planner.
 * - The Retirement Income Exclusion (Schedule 1, Line 7, computed on
 *   Schedule 1 page 2): up to $35,000 per spouse who is 62-64 (or under 62
 *   and permanently disabled, not modeled here), or up to $65,000 per spouse
 *   who is 65 or older; each spouse qualifies separately on their own age
 *   and own income. The exclusion pool is that spouse's own taxable
 *   pensions, taxable IRA distributions, interest, dividends, capital
 *   gains, rental/royalty/partnership income, and up to $5,000 of that
 *   spouse's own earned income (wages), before being capped at the age
 *   tier. Social Security and Railroad Retirement are excluded from this
 *   pool since they are already fully subtracted separately.
 *
 * Uses enacted law, not a prediction of future legislation. Georgia has no
 * local income tax; localTax is always zero. This planner's Retirement
 * Income Exclusion pool includes, per qualifying owner, only that owner's
 * own income entered as "pension" plus up to $5,000 of that owner's own
 * wages; this planner's aggregate 401(k)/IRA/annuity distribution figure is
 * not tracked per owner, so for a married household it is split 50/50
 * between spouses, mirroring Georgia's own instruction to allocate jointly
 * owned retirement-income property at 50% to each taxpayer. Taxable
 * interest, dividends, capital gains and rental/royalty/partnership income
 * are not included in the exclusion pool at all, since this planner does
 * not track them per owner; this understates the exclusion, and therefore
 * overstates tax, for a household with meaningful taxable investment
 * income outside a traditional IRA or 401(k). The disability-based
 * under-62 exclusion and Georgia's separate military retirement income
 * exclusion are not modeled. Only single and married-filing-jointly are
 * supported. Itemized deductions and credits are excluded. Georgia's
 * dollar figures are not further inflation-indexed in this model, matching
 * the restricted New York, Maryland, Indiana, DC, Illinois, New Jersey,
 * Pennsylvania, Colorado, New Mexico, Minnesota, Utah, Connecticut,
 * Vermont, Montana, Rhode Island, California, Virginia and Arizona
 * estimates' convention.
 */

const STATE_RATE = .0519;
const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 12000, married: 24000 };
const EARNED_INCOME_CAP_PER_PERSON = 5000;

function retirementIncomeExclusionCap(age: number) {
  if (age >= 65) return 65000;
  if (age >= 62) return 35000;
  return 0;
}

function retirementIncomeExclusion(input: HouseholdTaxInput, year: number, retirementOrdinary: number) {
  const perOwnerOrdinary = retirementOrdinary / input.people.length;
  return input.people.reduce((sum, person) => {
    const cap = retirementIncomeExclusionCap(ageAtYearEnd(person.birthDate, year));
    if (cap === 0) return sum;
    const pension = input.income.filter(item => item.kind === "pension" && item.ownerId === person.id).reduce((s, item) => s + item.amount, 0);
    const wages = input.income.filter(item => item.kind === "wages" && item.ownerId === person.id).reduce((s, item) => s + item.amount, 0);
    const earnedPortion = Math.min(wages, EARNED_INCOME_CAP_PER_PERSON);
    const unearnedPortion = pension + perOwnerOrdinary;
    return sum + Math.min(cap, earnedPortion + unearnedPortion);
  }, 0);
}

export function georgiaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.georgiaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Georgia planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Georgia projection year.");
  const exclusion = retirementIncomeExclusion(input, input.year, retirementOrdinary);
  const gaAgi = federalAgi - taxableBenefits - exclusion;
  const taxable = Math.max(0, gaAgi - STANDARD_DEDUCTION[input.filing]);
  const stateTax = taxable * STATE_RATE;
  return {
    stateTax, localTax: 0, retirementIncomeExclusion: exclusion,
    warning: "Georgia pre-credit estimate: the enacted flat 5.19% rate (reviewed 2026-09-24) and Georgia's own standard "
      + "deduction ($12,000 single/$24,000 married; Georgia has no personal exemption for the taxpayer or spouse). Social "
      + "Security is fully excluded. The Retirement Income Exclusion gives each spouse who is 62-64 up to $35,000, or 65 or "
      + "older up to $65,000, of their own income entered as \"pension,\" up to $5,000 of their own wages, and a 50/50 share "
      + "of this planner's aggregate 401(k)/IRA/annuity distribution figure (mirroring Georgia's own joint-property "
      + "allocation rule, since that figure is not tracked per owner). Taxable interest, dividends, capital gains and rental "
      + "income are not included in the exclusion pool, since this planner does not track them per owner, understating the "
      + "exclusion for a household with meaningful taxable investment income. The disability-based under-62 exclusion and "
      + "Georgia's separate military retirement income exclusion are not modeled. Georgia has no local income tax. Only "
      + "single and married-filing-jointly are supported. Itemized deductions and credits are excluded. Georgia's dollar "
      + "figures are not further inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
