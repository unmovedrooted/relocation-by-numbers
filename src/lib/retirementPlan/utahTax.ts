import type { HouseholdTaxInput } from "./householdTax";
import { stateSocialSecurityInclusion } from "./stateSocialSecurityCoverage";

/** Restricted, credit-based, PRE-CREDIT-other-than-Social-Security planning
 * estimate. Rates and thresholds reviewed 2026-09-23.
 *
 * Utah's individual income tax is fundamentally a CREDIT-based system, not a
 * deduction-based one: Utah taxable income conforms to federal AGI (with
 * Utah-specific additions/subtractions this planner does not model) and has
 * NO separate Utah standard deduction; the flat rate applies to that full
 * base, and relief instead arrives entirely through nonrefundable credits.
 * - Utah State Tax Commission, TC-40 instructions: Utah taxable income
 *   equals federal AGI plus Utah additions, less Utah subtractions (neither
 *   modeled here); the flat rate is applied directly to that amount, with no
 *   standard deduction.
 *   https://files.tax.utah.gov/tax/forms/current/tc-40.pdf
 * - This planner reuses the already-verified stateSocialSecurityInclusion
 *   Utah branch (cited there to the enacted 2026 statute) for the Social
 *   Security Benefits Credit: 4.45% of the federally taxable Social Security
 *   benefits included in Utah income (Utah does not subtract Social Security
 *   from its own income base at all), phased out by 2.5 cents per dollar of
 *   modified AGI over $54,000 (single) or $90,000 (married), and capped at
 *   the Utah tax otherwise due. The same 4.45% figure is this module's flat
 *   state rate, since Utah's credit is defined as "computed at the tax
 *   rate," making the two figures identical by statute, not by coincidence.
 *
 * Uses enacted law, not a prediction of future legislation. Utah's general
 * Taxpayer Tax Credit (a non-retirement-specific credit available to nearly
 * all Utah filers, phased out above roughly $18,200 single / $36,400
 * married AGI) is NOT modeled, so this planner OVERSTATES Utah tax for most
 * households relative to a real return. Utah's separate Retirement Credit
 * for qualifying birth-year cohorts is also not modeled (this planner
 * always reports no competing credit claimed). No itemized deductions or
 * other credits are modeled. Utah has no local income tax; localTax is
 * always zero. Only single and married-filing-jointly are supported. Utah
 * parameters are not inflation-indexed in this model, matching the
 * restricted New York, Maryland, Indiana, DC, Illinois, New Jersey,
 * Pennsylvania, Colorado, New Mexico and Minnesota estimates' convention.
 */

const STATE_RATE = .0445;

export function utahTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, taxExemptInterest: number) {
  if (input.utahContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Utah planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Utah projection year.");
  const utahTaxableIncome = Math.max(0, federalAgi);
  const baseTax = utahTaxableIncome * STATE_RATE;
  const ssResult = stateSocialSecurityInclusion({
    state: "ut", year: input.year, futurePolicy: input.year > 2026 ? "hold-2026-law" : undefined,
    filing: input.filing === "married" ? "married-joint" : "single", federalAgi,
    grossBenefits: input.income.filter(item => item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0),
    federallyTaxableBenefits: taxableBenefits,
    utah: { excludedInterest: taxExemptInterest, additionsToAgi: 0, benefitsIncludedInStateIncome: taxableBenefits,
      remainingTaxLiability: baseTax, competingRetirementCreditClaimed: false },
  });
  if (ssResult.status !== "supported-credit") throw new RangeError("Utah Social Security credit computation failed unexpectedly.");
  const socialSecurityCredit = ssResult.allowedCredit;
  const stateTax = Math.max(0, baseTax - socialSecurityCredit);
  return {
    stateTax, localTax: 0, socialSecurityCredit,
    warning: "Utah pre-credit estimate: Utah's flat 4.45% rate applies directly to federal AGI, with NO separate Utah "
      + "standard deduction (reviewed 2026-09-23). Social Security receives a nonrefundable credit equal to 4.45% of "
      + "taxable benefits, phased out above $54,000 (single) or $90,000 (married) modified AGI and capped at the Utah tax "
      + "otherwise due; Utah does not exclude Social Security from its own income base at all. Utah's general Taxpayer Tax "
      + "Credit (available to nearly all filers, unrelated to retirement) is NOT modeled, so this estimate OVERSTATES Utah "
      + "tax for most households. The separate birth-year-gated Retirement Credit is also not modeled. Utah has no local "
      + "income tax. Itemized deductions and other credits are excluded. Utah parameters are not inflation-indexed in this "
      + "model. Future legislation is not predicted. Not a tax return.",
  };
}
