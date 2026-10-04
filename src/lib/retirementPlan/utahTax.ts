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
 * - Taxpayer Tax Credit (UCA 59-10-1018, TC-40 lines 11-20, 2025 instructions
 *   https://files.tax.utah.gov/tax/forms/current/tc-40inst.pdf pages 8-9):
 *   6% of (the federal standard deduction plus $2,111 per qualifying
 *   dependent), reduced by 1.3% of Utah taxable income above a base amount
 *   (2026: $18,696 single, $37,392 married filing jointly), never below zero. It
 *   is applied first, before the Social Security Benefits Credit, which can
 *   then only reduce the remaining tax. The statutory bases are $15,095 single and
 *   $30,190 joint (UCA 59-10-1018(4)), increased annually by the CPI-U ratio of the
 *   preceding calendar year to 2020 (59-10-1018(5), computed as IRC 1(f)(4): the
 *   12-month average ending August 31), rounded to a whole dollar with the joint base
 *   twice the single base. That method reproduces the published 2025 base exactly
 *   (15,095 x 1.20656 = $18,213) and gives $15,095 x 1.23849 = $18,696 for 2026
 *   (BLS CPI-U, series CUUR0000SA0). The Tax Commission had not published its 2026
 *   TC-40 instructions in any document available on 2026-10-04, so the 2026 bases are
 *   statute-derived; replace them with the published amounts when released. Later
 *   years hold the 2026 bases. The $2,111 dependent exemption is not used: this planner
 *   has no dependents, and it assumes the standard deduction rather than itemizing.
 *
 * Uses enacted law, not a prediction of future legislation. Utah's separate
 * Retirement Credit
 * for qualifying birth-year cohorts is also not modeled (this planner
 * always reports no competing credit claimed). No itemized deductions or
 * other credits are modeled. Utah has no local income tax; localTax is
 * always zero. Only single and married-filing-jointly are supported. Utah
 * parameters are not inflation-indexed in this model, matching the
 * restricted New York, Maryland, Indiana, DC, Illinois, New Jersey,
 * Pennsylvania, Colorado, New Mexico and Minnesota estimates' convention.
 */

const STATE_RATE = .0445;
const TAXPAYER_CREDIT_RATE = .06;
const TAXPAYER_CREDIT_PHASE_OUT_RATE = .013;
const TAXPAYER_CREDIT_PHASE_OUT_BASE: Record<"single" | "married", number> = { single: 18696, married: 37392 };

export function utahTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, taxExemptInterest: number, standardDeduction: number) {
  if (input.utahContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Utah planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Utah projection year.");
  const utahTaxableIncome = Math.max(0, federalAgi);
  const baseTax = utahTaxableIncome * STATE_RATE;
  if (!Number.isFinite(standardDeduction) || standardDeduction < 0) throw new RangeError("Invalid Utah standard deduction.");
  const initialTaxpayerCredit = TAXPAYER_CREDIT_RATE * standardDeduction;
  const taxpayerCreditPhaseOut = TAXPAYER_CREDIT_PHASE_OUT_RATE * Math.max(0, utahTaxableIncome - TAXPAYER_CREDIT_PHASE_OUT_BASE[input.filing]);
  const taxpayerTaxCredit = Math.min(baseTax, Math.max(0, initialTaxpayerCredit - taxpayerCreditPhaseOut));
  const taxAfterTaxpayerCredit = baseTax - taxpayerTaxCredit;
  const ssResult = stateSocialSecurityInclusion({
    state: "ut", year: input.year, futurePolicy: input.year > 2026 ? "hold-2026-law" : undefined,
    filing: input.filing === "married" ? "married-joint" : "single", federalAgi,
    grossBenefits: input.income.filter(item => item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0),
    federallyTaxableBenefits: taxableBenefits,
    utah: { excludedInterest: taxExemptInterest, additionsToAgi: 0, benefitsIncludedInStateIncome: taxableBenefits,
      remainingTaxLiability: taxAfterTaxpayerCredit, competingRetirementCreditClaimed: false },
  });
  if (ssResult.status !== "supported-credit") throw new RangeError("Utah Social Security credit computation failed unexpectedly.");
  const socialSecurityCredit = ssResult.allowedCredit;
  const stateTax = Math.max(0, taxAfterTaxpayerCredit - socialSecurityCredit);
  return {
    stateTax, localTax: 0, socialSecurityCredit, taxpayerTaxCredit,
    warning: "Utah pre-credit estimate: Utah's flat 4.45% rate applies directly to federal AGI, with NO separate Utah "
      + "standard deduction (reviewed 2026-09-23). Social Security receives a nonrefundable credit equal to 4.45% of "
      + "taxable benefits, phased out above $54,000 (single) or $90,000 (married) modified AGI and capped at the Utah tax "
      + "otherwise due; Utah does not exclude Social Security from its own income base at all. Utah's general Taxpayer Tax "
      + "Credit (6% of the federal standard deduction, phased out by 1.3% of income above $18,696 single/$37,392 married; "
      + "2026 base amounts computed from the statutory CPI formula because the Tax Commission had not yet published them; the published 2025 bases were $18,213/$36,426) is applied before the Social Security credit; no "
      + "dependents are modeled. The separate birth-year-gated Retirement Credit is not modeled. Utah has no local "
      + "income tax. Itemized deductions and other credits are excluded. Utah parameters are not inflation-indexed in this "
      + "model. Future legislation is not predicted. Not a tax return.",
  };
}
