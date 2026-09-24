import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, exemptions-only, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-09 against:
 * - Indiana Department of Revenue, Departmental Notice #1, "How to Compute
 *   Withholding for State and County Income Tax" (effective Jan. 1, 2026,
 *   R46/01-26): the 2.95% flat 2026 state adjusted gross income tax rate, and
 *   the "Indiana County Tax Rates: Effective Jan. 1, 2026" table (Marion
 *   0.0202, Allen 0.0159, Vanderburgh 0.0125). Resolves an earlier aggregator
 *   discrepancy for Vanderburgh (1.20% vs. 1.25%) in favor of 1.25%.
 *   https://www.in.gov/dor/files/dn01.pdf
 * - Indiana Department of Revenue, Income Tax Information Bulletin #117,
 *   "Personal Exemptions and Special Rules" (Jan. 2024): the $1,000 self/
 *   spouse exemption, the $1,000 additional 65-or-older exemption, the $1,000
 *   additional blind exemption, and the $500 additional exemption for a
 *   taxpayer or spouse 65 or older with federal AGI under $40,000 (a lower
 *   $20,000 threshold applies only to married-filing-separately, a status
 *   this planner does not model).
 *   https://www.in.gov/dor/files/ib117.pdf
 * - Indiana Department of Revenue, "Deductions" (individual income tax):
 *   confirms Social Security and Railroad Retirement Board benefits are not
 *   taxed by Indiana, and describes the civil service annuity deduction (age
 *   62 or older, nonmilitary civil service pension, up to $16,000, reduced by
 *   the qualifying individual's own Social Security and tier 1 Railroad
 *   Retirement income) and a separate, fully-excluding military retirement
 *   pay deduction.
 *   https://www.in.gov/dor/i-am-a/individual/deductions/
 *
 * Uses enacted law, not a prediction of future legislation. Only Marion
 * County (Indianapolis), Allen County (Fort Wayne) and Vanderburgh County
 * (Evansville) are rated; every other Indiana county is unsupported. Because
 * this planner's income model does not distinguish a nonmilitary civil
 * service annuity from any other qualifying pension, the civil service
 * annuity deduction is applied to any income entered as "pension" for an
 * owner 62 or older, capped at $16,000 and reduced by that owner's own Social
 * Security; this is a simplification, not a claim that every such pension
 * qualifies. Indiana's separate, fully-excluding military retirement pay
 * deduction is not modeled: military retirement income must be entered as
 * ordinary pension income and will be capped like any other pension, which
 * understates the true benefit for military retirees. Dependent exemptions
 * and the first-time/adopted-child exemptions do not apply to this adult-only
 * retirement model. No itemized deductions or credits are modeled. Indiana
 * parameters remain nominal; the household's inflation/threshold-growth
 * assumption does not index them, matching the restricted New York and
 * Maryland estimates' convention.
 */

const STATE_RATE = .0295;
const CIVIL_SERVICE_ANNUITY_MAX = 16000;
const BASE_EXEMPTION = 1000;
const AGE_EXEMPTION = 1000;
const BLIND_EXEMPTION = 1000;
const LOW_INCOME_SENIOR_EXEMPTION = 500;
const LOW_INCOME_SENIOR_AGI_LIMIT = 40000;

/** Every Indiana cityId this planner rates, mapped to its county's flat rate;
 * every other Indiana location, including "other-in", is unsupported. */
const COUNTY_RATES: Record<string, number> = {
  "indianapolis-in": .0202, // Marion County.
  "fort-wayne-in": .0159, // Allen County.
  "evansville-in": .0125, // Vanderburgh County.
};

function localTaxAmount(cityId: string, taxable: number) {
  const rate = COUNTY_RATES[cityId];
  if (rate === undefined) throw new RangeError("Choose a supported Indiana location; this planner rates only Marion, Allen and Vanderburgh counties.");
  return taxable * rate;
}

function isAged(birthDate: string, ageThreshold: number, year: number) {
  return birthDate <= `${year - ageThreshold}-12-31`;
}

/** Cap each owner's own qualifying pension at $16,000, then reduce (not below
 * zero) by that owner's own gross Social Security. Unused capacity does not
 * transfer between owners. Railroad Retirement income is not a modeled income
 * kind and so cannot reduce the cap here. */
function civilServiceAnnuityDeduction(input: HouseholdTaxInput, year: number) {
  const grossSocialSecurity = new Map(input.people.map(person => [person.id, 0]));
  const qualifyingPension = new Map(input.people.map(person => [person.id, 0]));
  for (const item of input.income) {
    if (item.kind === "social-security") grossSocialSecurity.set(item.ownerId, grossSocialSecurity.get(item.ownerId)! + item.amount);
    else if (item.kind === "pension") qualifyingPension.set(item.ownerId, qualifyingPension.get(item.ownerId)! + item.amount);
  }
  let total = 0;
  for (const person of input.people) {
    if (!isAged(person.birthDate, 62, year)) continue;
    const capped = Math.min(qualifyingPension.get(person.id)!, CIVIL_SERVICE_ANNUITY_MAX);
    total += Math.max(0, capped - grossSocialSecurity.get(person.id)!);
  }
  return total;
}

function exemptions(input: HouseholdTaxInput, year: number, federalAgi: number) {
  let total = 0;
  for (const person of input.people) {
    total += BASE_EXEMPTION;
    const aged = isAged(person.birthDate, 65, year);
    if (aged) total += AGE_EXEMPTION;
    if (person.blind) total += BLIND_EXEMPTION;
    if (aged && federalAgi < LOW_INCOME_SENIOR_AGI_LIMIT) total += LOW_INCOME_SENIOR_EXEMPTION;
  }
  return total;
}

export function indianaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.indianaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Indiana planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Indiana projection year.");
  const deduction = civilServiceAnnuityDeduction(input, input.year);
  const inAgi = federalAgi - taxableBenefits - deduction;
  const taxable = Math.max(0, inAgi - exemptions(input, input.year, federalAgi));
  const stateTax = taxable * STATE_RATE;
  const localTax = localTaxAmount(input.cityId ?? "", taxable);
  return {
    stateTax, localTax, inAgi, civilServiceAnnuityDeduction: deduction,
    warning: "Indiana pre-credit estimate: enacted 2026 flat 2.95% state rate and flat county rates (reviewed 2026-09-09), "
      + "personal exemptions ($1,000 per person, plus $1,000 each for age 65+ or blind, plus $500 per qualifying senior when "
      + "federal AGI is under $40,000), and Social Security fully excluded. The civil service annuity deduction is applied "
      + "to income entered as \"pension\" for an owner 62 or older, capped at $16,000 and reduced by that owner's own Social "
      + "Security; this planner cannot verify the pension is actually a nonmilitary civil service annuity. Indiana's separate, "
      + "fully-excluding military retirement pay deduction is not modeled. Only Marion, Allen and Vanderburgh counties are "
      + "rated. Dependent exemptions, itemized deductions and credits are excluded. Indiana parameters are not "
      + "inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
