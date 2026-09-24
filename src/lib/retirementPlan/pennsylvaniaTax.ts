import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, no-deduction, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-23 against:
 * - PA Department of Revenue, 2025 Form PA-40: the flat 3.07% (.0307)
 *   personal income tax rate, applied to net taxable income with NO
 *   standard deduction and NO personal exemption of any kind (PA's only
 *   broad relief is the separate, income-tested Tax Forgiveness credit on
 *   Schedule SP, not modeled here).
 *   https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforindividuals/pit/documents/2025/2025_pa-40.pdf
 * - PA Department of Revenue guidance on retirement income: Social Security
 *   is fully excluded; a "1099-R distribution code 7" (normal distribution
 *   after retirement, meeting the plan's or IRA's age/service conditions,
 *   e.g. age 59 1/2 for an IRA) is excluded from PA gross income, while an
 *   early distribution (codes 1/2) remains taxable.
 * - City of Philadelphia Department of Revenue: the resident Wage Tax rate
 *   of 3.74% effective July 1, 2025 (dropping to 3.735% on July 1, 2026,
 *   not modeled here).
 *   https://www.phila.gov/services/payments-assistance-taxes/taxes/income-taxes/earnings-tax-employees/
 * - Allentown School District's own published rate: a combined city+school
 *   resident Earned Income Tax rate of 1.975% for Allentown.
 *   https://www.allentownsd.org/offices/financial-operational-services/taxes
 * - Pittsburgh's combined resident Earned Income Tax rate of 3.00% (1% city
 *   + 2% school district) is corroborated across multiple secondary payroll/
 *   tax-guide sources; a direct fetch of the City of Pittsburgh's own
 *   Finance Department rate bulletin was blocked (connection refused) and
 *   so is not independently confirmed from a primary document this review.
 *
 * Uses enacted law, not a prediction of future legislation. Only
 * Philadelphia, Pittsburgh and Allentown are rated; every other Pennsylvania
 * municipality (of roughly 2,500 with their own Earned Income Tax rate) is
 * unsupported. Pennsylvania's local Earned Income Tax applies ONLY to
 * "earned income" (this planner's "wages"), never to pension, Social
 * Security or retirement-account distributions, unlike every other verified
 * state's local tax, which shares the state tax base. Income entered as
 * "pension" is always treated as a normal, age/service-qualified
 * distribution and fully excluded; this planner cannot verify an early or
 * disability-based pension case. This planner's aggregate 401(k)/IRA/
 * annuity distribution figure is excluded except for the portion that
 * triggers the federal 10%-early-distribution-penalty base, used as a proxy
 * for PA's own age-59 1/2 test; a distribution that avoids the federal
 * penalty through an exception other than reaching 59 1/2 (disability,
 * substantially equal payments, etc.) is incorrectly excluded here. No
 * itemized deductions or credits, including Tax Forgiveness, are modeled.
 * Pennsylvania parameters are not inflation-indexed in this model, matching
 * the restricted New York, Maryland, Indiana, DC, Illinois and New Jersey
 * estimates' convention.
 */

const STATE_RATE = .0307;

/** Every Pennsylvania cityId this planner rates; every other Pennsylvania
 * location, including "other-pa", is unsupported. */
const LOCAL_RATES: Record<string, number> = {
  "philadelphia-pa": .0374,
  "pittsburgh-pa": .03,
  "allentown-pa": .01975,
};

function localTaxAmount(cityId: string, wages: number) {
  const rate = LOCAL_RATES[cityId];
  if (rate === undefined) throw new RangeError("Choose a supported Pennsylvania location; this planner rates only Philadelphia, Pittsburgh and Allentown.");
  return wages * rate;
}

function pensionSubtraction(input: HouseholdTaxInput) {
  return input.income.filter(item => item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
}

export function pennsylvaniaTax(
  input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number, earlyDistributionBase: number, wages: number,
) {
  if (input.pennsylvaniaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Pennsylvania planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Pennsylvania projection year.");
  const excludableRetirementOrdinary = Math.max(0, retirementOrdinary - earlyDistributionBase);
  const paAgi = federalAgi - taxableBenefits - pensionSubtraction(input) - excludableRetirementOrdinary;
  const taxable = Math.max(0, paAgi);
  const stateTax = taxable * STATE_RATE;
  const localTax = localTaxAmount(input.cityId ?? "", wages);
  return {
    stateTax, localTax, paAgi,
    warning: "Pennsylvania pre-credit estimate: enacted flat 3.07% state rate (reviewed 2026-09-23), with NO standard "
      + "deduction or personal exemption of any kind. Social Security and income entered as \"pension\" are fully excluded. "
      + "This planner's aggregate 401(k)/IRA/annuity distribution figure is excluded except for the portion that triggers "
      + "the federal early-distribution penalty, used as a proxy for Pennsylvania's own age-59½ test; this can incorrectly "
      + "exclude a distribution that avoids the federal penalty for another reason. Only Philadelphia, Pittsburgh and "
      + "Allentown are rated, and unlike every other verified state here, Pennsylvania's local Earned Income Tax applies "
      + "only to wages, never to retirement income. Pittsburgh's local rate is corroborated across secondary sources, not "
      + "independently confirmed from the city's own primary rate bulletin. Tax Forgiveness and other credits are excluded. "
      + "Pennsylvania parameters are not inflation-indexed in this model. Future legislation is not predicted. Not a tax "
      + "return.",
  };
}
