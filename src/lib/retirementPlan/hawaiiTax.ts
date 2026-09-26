import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/**
 * Restricted, verified Hawaii resident annual settlement.
 *
 * Verified against the Hawaii Department of Taxation's own 2025 Form N-11
 * instructions (Tax Rate Schedules I and II, page 48; standard deduction and
 * personal exemption, page 20): a graduated schedule (1.40% to 11.00% at
 * $9,600/$14,400/$19,200/$24,000/$36,000/$48,000/$125,000/$175,000/$225,000/
 * $275,000/$325,000 single or married filing separately, exactly doubled for
 * married filing jointly), the 2025 standard deduction ($4,400 single/$8,800
 * married filing jointly, held here pending Hawaii's multi-year Act 46 (SLH
 * 2024) tax cut schedule for 2026 and later years) and a $1,144 personal
 * exemption per person. Reconciled exactly against the instructions' own Tax
 * Table example ($23,275 taxable income: $813 single, $399 married filing
 * jointly).
 * https://files.hawaii.gov/tax/forms/current/n11ins.pdf
 *
 * Social Security and Railroad Retirement Act (Tier 1) benefits included in
 * federal income are fully subtracted (Form N-11, line 14), per Tax
 * Information Release No. 96-5.
 *
 * Hawaii excludes qualifying distributions from an employer-funded pension
 * plan or public retirement system (Form N-11, line 13), but taxes deferred
 * compensation plans (401(k), 403(b), SARSEP, 457(b)) and self-funded IRA or
 * annuity distributions. This planner cannot distinguish a noncontributory
 * employer pension from a contributory one, so income entered as annual
 * pension, of any pensionType, is treated as a fully exempt qualifying
 * pension, while this planner's aggregate 401(k)/IRA/annuity distribution
 * figure remains fully taxable.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 4400, married: 8800 };
const PERSONAL_EXEMPTION_PER_PERSON = 1144;
const BRACKET_CEILINGS: Record<FilingStatus, number[]> = {
  single: [9600, 14400, 19200, 24000, 36000, 48000, 125000, 175000, 225000, 275000, 325000, Infinity],
  married: [19200, 28800, 38400, 48000, 72000, 96000, 250000, 350000, 450000, 550000, 650000, Infinity],
};
const BRACKET_RATES = [.014, .032, .055, .064, .068, .072, .076, .079, .0825, .09, .10, .11];

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function hawaiiTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.hawaiiContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Hawaii planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Hawaii projection year.");
  const pensionExclusion = input.income.filter(item => item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
  const hiAgi = Math.max(0, federalAgi - taxableBenefits - pensionExclusion);
  const exemption = PERSONAL_EXEMPTION_PER_PERSON * input.people.length;
  const taxable = Math.max(0, hiAgi - STANDARD_DEDUCTION[input.filing] - exemption);
  const stateTax = marginal(taxable, BRACKET_CEILINGS[input.filing], BRACKET_RATES);
  return {
    stateTax, localTax: 0, hiAgi, pensionExclusion,
    warning: "Hawaii pre-credit estimate using the enacted graduated schedule (1.40% to 11.00% at $9,600/$14,400/"
      + "$19,200/$24,000/$36,000/$48,000/$125,000/$175,000/$225,000/$275,000/$325,000 single, doubled for married "
      + "filing jointly) applied after the latest published (2025) standard deduction ($4,400 single/$8,800 married "
      + "filing jointly, held pending Hawaii's multi-year Act 46 (SLH 2024) tax cut schedule for 2026 and later years) "
      + "and a $1,144 personal exemption per person. Social Security and Railroad Retirement Tier 1 benefits are fully "
      + "exempt. Income entered as annual pension, of any pensionType, is treated as an exempt qualifying employer-"
      + "funded pension or public retirement system benefit, since this planner cannot distinguish a noncontributory "
      + "pension from a contributory one; this planner's aggregate 401(k)/IRA/annuity distribution figure remains "
      + "fully taxable. Only single and married-filing-jointly are supported. Itemized deductions and credits are "
      + "excluded.",
  };
}
