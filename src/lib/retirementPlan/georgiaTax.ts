import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ownerRetirementIncome } from "./ownerRetirementIncome";
import { ageAtYearEnd } from "./rules";

/** Restricted, flat-rate, PRE-CREDIT planning estimate. Rates and thresholds
 * reviewed against the Georgia Department of Revenue's 2025 IT-511
 * Individual Income Tax Booklet and, for 2026 and later, against House Bill 463
 * ("Georgia Economic Growth and Tax Relief Act of 2026", signed 2026-05-11,
 * applicable to taxable years beginning on or after January 1, 2026; text read
 * 2026-10-04 from https://gov.georgia.gov/document/2026-signed-legislation/hb-463/download):
 * - Flat rate: 5.19% for 2025; 4.99% for 2026 (O.C.G.A. 48-7-20(a.1)). HB 463 schedules
 *   0.125-point reductions each January 1 from 2027 until 3.99%, but each one is delayed
 *   a year whenever the December 1 revenue and reserve tests fail, so none is assumed:
 *   4.99% is held for 2027 and later.
 * - Standard deduction (48-7-27(a)(1)(B)): $15,000 single/MFS/HOH and $30,000 married
 *   filing jointly for 2026 ($12,000/$24,000 for 2025). HB 463 adds $375/$750 each January 1
 *   from 2027 up to $18,000/$36,000, subject to the same delay tests, so none is assumed:
 *   the 2026 amounts are held for 2027 and later.
 * - Retirement income exclusion (48-7-27(a)(5)(A)(xiii)-(xiv)): $35,000 per taxpayer
 *   62-64 and $65,000 per taxpayer 65 or older through 2026; $35,000 and $70,000 for tax
 *   years beginning on or after January 1, 2027, with no delay condition.
 * - HB 463 also excludes up to $1,750 of qualified overtime (2026-2028) and $1,750 of cash
 *   tips from 2026; this planner has no overtime or tip income kinds, so neither is
 *   modeled.
 * - Form 500 (2025 booklet): Line 16 rate and Line 11 standard deduction. Georgia eliminated the personal exemption for the taxpayer and
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
 * wages; each owner's own attributed 401(k)/IRA/annuity distributions are
 * counted for that owner. Taxable
 * interest, dividends, capital gains and rental/royalty/partnership income
 * are not included in the exclusion pool at all, since this planner's annual
 * tax input does not attribute them to individual owners; this understates the exclusion, and therefore
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

const STATE_RATE = .0499;
const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 15000, married: 30000 };
const RETIREMENT_EXCLUSION_65_PLUS_2026 = 65000;
const RETIREMENT_EXCLUSION_65_PLUS_2027_AND_LATER = 70000;
const EARNED_INCOME_CAP_PER_PERSON = 5000;

function retirementIncomeExclusionCap(age: number, year: number) {
  if (age >= 65) return year >= 2027 ? RETIREMENT_EXCLUSION_65_PLUS_2027_AND_LATER : RETIREMENT_EXCLUSION_65_PLUS_2026;
  if (age >= 62) return 35000;
  return 0;
}

function retirementIncomeExclusion(input: HouseholdTaxInput, year: number, retirementOrdinary: number) {
  const ownerRetirement = ownerRetirementIncome(input, retirementOrdinary, "Georgia");
  return input.people.reduce((sum, person) => {
    const cap = retirementIncomeExclusionCap(ageAtYearEnd(person.birthDate, year), year);
    if (cap === 0) return sum;
    const pension = input.income.filter(item => item.kind === "pension" && item.ownerId === person.id).reduce((s, item) => s + item.amount, 0);
    const wages = input.income.filter(item => item.kind === "wages" && item.ownerId === person.id).reduce((s, item) => s + item.amount, 0);
    const earnedPortion = Math.min(wages, EARNED_INCOME_CAP_PER_PERSON);
    const unearnedPortion = pension + ownerRetirement.get(person.id)!;
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
    warning: "Georgia pre-credit estimate: the flat 4.99% rate and Georgia's own standard "
      + "deduction ($15,000 single/$30,000 married), both enacted by House Bill 463 (2026) for 2026 and held for later years "
      + "because its further scheduled rate cuts and deduction increases depend on annual revenue tests and are not assumed; "
      + "Georgia has no personal exemption for the taxpayer or spouse. Social "
      + "Security is fully excluded. The Retirement Income Exclusion gives each spouse who is 62-64 up to $35,000, or 65 or "
      + "older up to $65,000 ($70,000 from 2027), of their own income entered as \"pension,\" up to $5,000 of their own wages, and that "
      + "owner's own attributed 401(k)/IRA/annuity distributions. Taxable interest, dividends, capital gains and rental "
      + "income are not included in the exclusion pool, since this planner's annual tax input does not attribute them to individual owners, understating the "
      + "exclusion for a household with meaningful taxable investment income. The disability-based under-62 exclusion and "
      + "Georgia's separate military retirement income exclusion are not modeled, nor is the new $1,750 overtime and $1,750 cash-tip exclusion, since this planner has no overtime or tip income. Georgia has no local income tax. Only "
      + "single and married-filing-jointly are supported. Itemized deductions and credits are excluded. Georgia's dollar "
      + "figures are not further inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
