import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Idaho resident annual settlement.
 *
 * Verified against the Idaho State Tax Commission's own 2025 Form 39R and
 * instructions (EFO00088/EIN00046, rev. 03-02-2026): a flat 5.3% rate
 * above a small 0%-taxed threshold ($4,811 single/$9,622 married filing
 * jointly for 2025, indexed annually and held here pending Idaho's 2026
 * publication) under House Bill 40 (2025), which is the state's current,
 * ongoing rate, not a one-year cut. Idaho conforms to the federal
 * standard deduction, passed in from this planner's federal computation.
 * https://tax.idaho.gov/document-mngr/forms_EFO00088/
 *
 * Social Security and Railroad Retirement benefits included in federal
 * income are fully subtracted (Form 39R, Part B, line 7).
 *
 * The Idaho Retirement Benefits Deduction (Form 39R, Part B, line 8) is a
 * household-level cap -- $48,216 single/$72,324 married filing jointly
 * for 2025, held here pending Idaho's 2026 publication -- reduced by the
 * household's gross Social Security and Railroad Retirement benefits
 * received, then limited to the qualifying retirement benefits actually
 * received. Qualifying benefits are narrow: Civil Service Retirement
 * System (CSRS, not FERS) annuities where eligibility was established
 * before 1984, Idaho Firefighters' Retirement Fund and certain Idaho
 * city police pension benefits, and military retired pay, for a
 * recipient who is 65 or older (or disabled, or a retired service member
 * who is 62 or older, disabled, or under 62 with sufficient earned
 * income). This planner cannot distinguish CSRS from FERS, identify
 * Idaho firefighter/police pension funds, or identify military retired
 * pay, so only pension income with a federal-government pensionType,
 * for an owner 65 or older, is treated as qualifying -- understating the
 * deduction for a firefighter, police or military retiree, or for a
 * retired service member claiming the separate age/disability test.
 * This planner's aggregate 401(k)/IRA/annuity distribution figure and a
 * private or unspecified pensionType are fully taxable.
 */

const FLAT_RATE = .053;
const ZERO_BRACKET_THRESHOLD: Record<FilingStatus, number> = { single: 4811, married: 9622 };
const RETIREMENT_DEDUCTION_CAP: Record<FilingStatus, number> = { single: 48216, married: 72324 };

export function idahoTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, standardDeduction: number) {
  if (input.idahoContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Idaho planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Idaho projection year.");
  const grossSocialSecurity = input.income.filter(item => item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0);
  const qualifyingRetirementBenefits = input.people
    .filter(person => ageAtYearEnd(person.birthDate, input.year) >= 65)
    .reduce((sum, person) => sum + input.income
      .filter(item => item.ownerId === person.id && item.kind === "pension" && item.pensionType === "federal-government")
      .reduce((personSum, item) => personSum + item.amount, 0), 0);
  const retirementDeductionAvailable = Math.max(0, RETIREMENT_DEDUCTION_CAP[input.filing] - grossSocialSecurity);
  const retirementDeduction = Math.min(retirementDeductionAvailable, qualifyingRetirementBenefits);
  const idAgi = Math.max(0, federalAgi - taxableBenefits - retirementDeduction);
  const taxable = Math.max(0, idAgi - standardDeduction);
  const stateTax = Math.max(0, taxable - ZERO_BRACKET_THRESHOLD[input.filing]) * FLAT_RATE;
  return {
    stateTax, localTax: 0, idAgi, retirementDeduction,
    warning: "Idaho pre-credit estimate using the enacted, ongoing flat 5.3% rate above the latest published (2025) "
      + "0%-taxed threshold ($4,811 single/$9,622 married filing jointly, indexed annually and held pending Idaho's "
      + "2026 publication), applied after Idaho's federal-conformity standard deduction. Social Security and Railroad "
      + "Retirement benefits are fully exempt. A household-level Retirement Benefits Deduction (the latest published, "
      + "2025, $48,216 single/$72,324 married filing jointly cap, reduced by gross Social Security and Railroad "
      + "Retirement benefits received) is limited to pension income with a federal-government pensionType for an owner "
      + "65 or older, approximating pre-1984 Civil Service Retirement System benefits; Idaho's separate exclusions for "
      + "its own firefighter and police pension funds, military retired pay, and the retired-service-member age/"
      + "disability test are not modeled. This planner's aggregate 401(k)/IRA/annuity distribution figure, and a "
      + "private or unspecified pension, remain fully taxable. Only single and married-filing-jointly are supported. "
      + "Itemized deductions and credits are excluded.",
  };
}
