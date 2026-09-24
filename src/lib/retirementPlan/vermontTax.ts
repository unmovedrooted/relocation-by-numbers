import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { stateSocialSecurityInclusion } from "./stateSocialSecurityCoverage";
import { ageAtYearEnd } from "./rules";

/** Restricted, own-standard-deduction, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-24 against the Vermont Department of Taxes 2025
 * Form IN-111 Income Tax Return Booklet (Rev. 10/25):
 * - The four-bracket schedule (3.35%/6.60%/7.60%/8.75%) for single (Schedule X:
 *   $0/$49,400/$119,700/$249,700) and married filing jointly (Schedule Y-1:
 *   $0/$82,500/$199,450/$304,000); the booklet's own under-$75,000 tax-table
 *   split is a rounding convenience, not a rate change, and is not modeled.
 * - Form IN-111 instructions: Vermont's own standard deduction ($7,650 single /
 *   $15,300 married, not federal-conformed), a further $1,250 for each
 *   federal-standard-deduction-style age-65-or-blind condition, and a $5,300
 *   personal exemption for each of self and spouse (dependents are not
 *   supported by this household model). Line 8's minimum-tax floor: once
 *   federal AGI exceeds $150,000, the tax is the GREATER of 3% of federal AGI
 *   (less U.S. obligation interest, not modeled here) or the bracket-schedule
 *   amount on Vermont Taxable Income.
 * - The Retirement Income Exemption Worksheet: a taxpayer elects EITHER a
 *   Social Security benefit exclusion OR a contributory government-retirement
 *   -system exclusion (capped at $10,000), never both, sharing one phase-out:
 *   full exclusion below $55,000 (single/HOH/MFS) or $70,000 (married) federal
 *   AGI, phased to zero by $65,000/$80,000. This planner reuses the already-
 *   verified stateSocialSecurityInclusion Vermont branch for the Social
 *   Security side and assumes a taxpayer elects whichever side gives the
 *   larger subtraction.
 * https://tax.vermont.gov/sites/tax/files/documents/Income-Booklet-2025.pdf
 *
 * Uses enacted law, not a prediction of future legislation. Vermont has no
 * local income tax; localTax is always zero. All modeled tax-exempt interest
 * is added back as Vermont-taxable, since Vermont exempts only interest from
 * Vermont's own state/local obligations and this planner cannot identify
 * Vermont-specific bonds; interest from U.S. government obligations, which
 * Vermont does exempt, is not separately tracked by this planner and so is
 * not subtracted, overstating Vermont tax for a household holding Treasury
 * interest under this planner's generic tax-exempt-interest figure. The
 * "other retirement income" election covers only income entered as annual
 * pension for an owner with a federal-government or other-government pension
 * type; Vermont's separate, uncapped Military Retirement Income Exemption
 * (enacted 2025) is not modeled, since this planner cannot identify military
 * retirement pay, understating the benefit for such households. Railroad
 * retirement, the capital gains exclusion, the medical expense deduction, and
 * the student loan interest subtraction are not modeled. Only single and
 * married-filing-jointly are supported. No credits are modeled. Vermont
 * parameters are not inflation-indexed in this model, matching the restricted
 * New York, Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania,
 * Colorado, New Mexico, Minnesota, Utah and Connecticut estimates' convention.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 7650, married: 15300 };
const ADDITIONAL_PER_BOX = 1250;
const PERSONAL_EXEMPTION = 5300;

const STATE_BRACKETS: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [
    { upTo: 49400, rate: .0335 }, { upTo: 119700, rate: .066 }, { upTo: 249700, rate: .076 }, { upTo: Infinity, rate: .0875 },
  ],
  married: [
    { upTo: 82500, rate: .0335 }, { upTo: 199450, rate: .066 }, { upTo: 304000, rate: .076 }, { upTo: Infinity, rate: .0875 },
  ],
};

function additionalDeductionBoxes(input: HouseholdTaxInput) {
  let boxes = 0;
  for (const person of input.people) {
    if (ageAtYearEnd(person.birthDate, input.year) >= 65) boxes++;
    if (person.blind) boxes++;
  }
  return boxes;
}

export function vermontTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, taxExemptInterest: number) {
  if (input.vermontContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Vermont planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Vermont projection year.");
  const lower = input.filing === "married" ? 70000 : 55000;
  const fraction = Math.max(0, Math.min(1, (lower + 10000 - federalAgi) / 10000));
  const otherRetirementIncome = Math.min(10000, input.income
    .filter(item => item.kind === "pension" && (item.pensionType === "federal-government" || item.pensionType === "other-government"))
    .reduce((sum, item) => sum + item.amount, 0));
  const socialSecurityIfElected = taxableBenefits * fraction;
  const otherRetirementIfElected = otherRetirementIncome * fraction;
  const election = socialSecurityIfElected >= otherRetirementIfElected ? "social-security" as const : "other-retirement" as const;
  const ssResult = stateSocialSecurityInclusion({
    state: "vt", year: input.year, futurePolicy: input.year > 2026 ? "hold-2026-law" : undefined,
    filing: input.filing === "married" ? "married-joint" : "single", federalAgi,
    grossBenefits: input.income.filter(item => item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0),
    federallyTaxableBenefits: taxableBenefits, vtExclusionElection: election,
  });
  const socialSecuritySubtraction = taxableBenefits - ssResult.taxableBenefits!;
  const otherRetirementSubtraction = election === "other-retirement" ? otherRetirementIfElected : 0;
  const modifiedAgi = federalAgi + taxExemptInterest - socialSecuritySubtraction - otherRetirementSubtraction;
  const deduction = STANDARD_DEDUCTION[input.filing] + additionalDeductionBoxes(input) * ADDITIONAL_PER_BOX
    + PERSONAL_EXEMPTION * (input.filing === "married" ? 2 : 1);
  const taxable = Math.max(0, modifiedAgi - deduction);
  const stateTax = Math.max(sumBrackets(taxable, STATE_BRACKETS[input.filing]), federalAgi > 150000 ? federalAgi * 0.03 : 0);
  return {
    stateTax, localTax: 0, socialSecuritySubtraction, otherRetirementSubtraction,
    warning: "Vermont pre-credit estimate: enacted 2025 brackets (reviewed 2026-09-24), Vermont's own standard deduction "
      + "($7,650 single/$15,300 married, plus $1,250 per age-65-or-blind condition) and $5,300-per-person personal "
      + "exemption, and the Retirement Income Exemption election between excluding Social Security benefits or up to "
      + "$10,000 of federal/other-government pension income (assumed to be whichever gives the larger subtraction), both "
      + "phased out between $55,000-$65,000 (single) or $70,000-$80,000 (married) federal AGI. Once federal AGI exceeds "
      + "$150,000, tax is the greater of the bracket calculation or 3% of federal AGI. All entered tax-exempt interest is "
      + "added back as Vermont-taxable, since this planner cannot identify Vermont-specific municipal bonds, and interest "
      + "from U.S. obligations is not separately tracked or subtracted. Vermont's separate, uncapped Military Retirement "
      + "Income Exemption is not modeled, since this planner cannot identify military retirement pay. Railroad retirement, "
      + "the capital gains exclusion, the medical expense deduction and the student loan interest subtraction are excluded. "
      + "Vermont has no local income tax. Only single and married-filing-jointly are supported. No credits are modeled. "
      + "Vermont parameters are not inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
