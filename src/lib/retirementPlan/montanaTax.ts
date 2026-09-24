import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, federal-taxable-income-conformed, PRE-CREDIT planning estimate.
 * Rates and thresholds reviewed 2026-09-24 against the Montana Department of
 * Revenue's 2025 Form 2 Individual Income Tax Instructions:
 * - Montana starts from FEDERAL TAXABLE INCOME, not federal AGI directly:
 *   Form 2, Line 1 is federal AGI, Line 2 is the federal standard or itemized
 *   deduction plus the Form 1040 Schedule 1-A additional deductions
 *   (including the temporary enhanced senior deduction), and Line 3 removes
 *   that deduction from AGI -- explicitly excluding the federal qualified
 *   business income deduction, which this planner never computes anyway.
 *   Montana has no separate state standard deduction or personal exemption.
 * - Line 6: a $5,660 subtraction (the 2025 figure; Montana adjusts it
 *   annually for inflation, not modeled here) for each spouse who is 65 or
 *   older by year end.
 * - The enacted two-bracket ordinary-income schedule for tax year 2026
 *   (House Bill 337): 4.7% up to $47,500 (single/MFS) or $95,000 (married
 *   filing jointly), 5.65% above. HB 337 enacts a further reduction (5.4%,
 *   wider brackets) beginning tax year 2027; that already-enacted future
 *   schedule is not modeled, matching this project's single-base-year
 *   convention for every other state.
 * - Social Security is federal-inclusion in Montana (no state-level
 *   exemption or credit), so it is already reflected in federal AGI with no
 *   Montana-specific adjustment needed.
 * https://revenue.mt.gov/files/forms/Montana-Individual-Income-Tax-Return-Form-2-Instructions/2025_Montana_Individual_Income_Tax_Return_Form_2_Instructions.pdf
 *
 * Uses enacted law, not a prediction of future legislation. Montana has no
 * local income tax; localTax is always zero. Montana's preferential net
 * long-term capital gains rate (3% below, 4.1% above, a threshold tied to
 * ordinary income -- both well under the 4.7%/5.65% ordinary rates) is NOT
 * modeled: all Montana taxable income is taxed at the ordinary rates,
 * overstating Montana tax for a household with taxable net long-term capital
 * gains. The working-military-retiree and military-survivor-benefit
 * subtraction (up to 50% of military retirement income, gated by specific
 * residency-history eligibility this planner cannot verify) is not modeled,
 * understating the benefit for such households. Montana's Schedule I
 * miscellaneous additions/subtractions (out-of-state municipal bond
 * interest, U.S. obligation interest, MSA and 529/ABLE contributions,
 * railroad retirement) are not modeled. Only single and married-filing-
 * jointly are supported. No credits are modeled. Montana parameters are not
 * inflation-indexed in this model, matching the restricted New York,
 * Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania, Colorado, New
 * Mexico, Minnesota, Utah, Connecticut and Vermont estimates' convention.
 */

const AGE_SUBTRACTION_PER_PERSON = 5660;

const STATE_BRACKETS: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [{ upTo: 47500, rate: .047 }, { upTo: Infinity, rate: .0565 }],
  married: [{ upTo: 95000, rate: .047 }, { upTo: Infinity, rate: .0565 }],
};

export function montanaTax(input: HouseholdTaxInput, agi: number, standardDeduction: number, seniorDeduction: number) {
  if (input.montanaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Montana planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Montana projection year.");
  const ageSubtraction = input.people.filter(person => ageAtYearEnd(person.birthDate, input.year) >= 65).length * AGE_SUBTRACTION_PER_PERSON;
  const taxable = Math.max(0, agi - standardDeduction - seniorDeduction - ageSubtraction);
  const stateTax = sumBrackets(taxable, STATE_BRACKETS[input.filing]);
  return {
    stateTax, localTax: 0, ageSubtraction,
    warning: "Montana pre-credit estimate: starts from federal taxable income (federal AGI less the federal standard/"
      + "itemized deduction and Schedule 1-A additional deductions, excluding the QBI deduction), since Montana has no "
      + "separate state standard deduction or personal exemption. A $5,660 subtraction applies for each spouse 65 or "
      + "older by year end (the 2025 figure; Montana's annual inflation adjustment is not modeled). The enacted 2026 "
      + "two-bracket schedule applies (4.7%/5.65%); the already-enacted, lower 2027 schedule is not modeled. Social "
      + "Security is fully taxable in Montana with no state-level exemption or credit. Montana's preferential net "
      + "long-term capital gains rate (3%/4.1%, well under the ordinary rates) is not modeled, so all taxable income is "
      + "taxed at ordinary rates, overstating tax for a household with taxable net long-term capital gains. The working-"
      + "military-retiree and survivor-benefit subtraction is not modeled, since this planner cannot verify the specific "
      + "residency-history eligibility it requires. Montana has no local income tax. Only single and married-filing-"
      + "jointly are supported. No credits are modeled. Montana parameters are not inflation-indexed in this model. "
      + "Future legislation is not predicted. Not a tax return.",
  };
}
