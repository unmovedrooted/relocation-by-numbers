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
 * - 2025 Schedule IN-153 instructions (Capital Gains Exclusion, Rev. 10/25,
 *   https://tax.vermont.gov/sites/tax/files/documents/IN-153-Instr-2025.pdf):
 *   the Flat Exclusion is $5,000 or the net adjusted capital gain, whichever is
 *   less, and no more than 40% of federal taxable income; qualified dividends
 *   do not qualify and no exclusion exists when the federal return shows a
 *   net capital loss. The $5,000 is fixed in 32 V.S.A. 5811(21)(B)(ii) and, unlike the exemption and
 *   deductions, is not inflation-indexed. The Percentage
 *   Exclusion (40% of gains from assets held over three years, up to
 *   $350,000) excludes publicly traded stocks, bonds and homes, which this
 *   planner cannot distinguish from other assets, so only the Flat Exclusion
 *   is modeled.
 *
 * 2026 amounts (checked 2026-10-04): 32 V.S.A. 5811(21)(D) indexes the personal exemption, standard
 * deduction and age-65/blind additional deduction annually with the federal 1(f)(3) method, and the
 * Department of Taxes had not yet published its 2026 return booklet or rate schedule. Its 2026
 * Income Tax Withholding Instructions, Tables, and Charts (GB-1210-2026, effective 2026-01-01) are
 * built on the same parameters: the 2025 edition (GB-1210-2025) reproduces the 2025 return exactly
 * (annual single table starts at $3,825 = half the $7,650 standard deduction; its 3.35% band ends at
 * $53,225 = $3,825 + $49,400; married starts at $11,475 = $15,300 - $3,825 and ends at $93,975 =
 * $11,475 + $82,500), so the 2026 edition gives: single first threshold $3,925, bands ending
 * $54,675/$126,775/$260,225 (standard deduction $7,850; brackets $50,750/$122,850/$256,300);
 * married first threshold $11,775, bands ending $96,475/$216,525/$323,825 (standard deduction
 * $15,700; brackets $84,700/$204,750/$312,050); one allowance $5,400 (personal exemption). These
 * are the 2026 constants below. The 2026 age-65/blind additional deduction is not shown there, so
 * $1,250 is the 2025 amount, held and disclosed.
 * https://tax.vermont.gov/sites/tax/files/documents/GB-1210-2026.pdf
 * 2026 session: Act 164 (miscellaneous tax act) conforms to federal law as of 2025-12-31 and adds
 * a QSBS addback, an apportionment change and a 2027 R&D credit increase, and the Department of
 * Taxes' 2026 legislation page lists no change to the deduction, exemption, brackets, retirement or
 * Social Security exemptions, or the capital gains exclusion; the bracket and investment-income
 * proposals (DR 26-0804) did not pass. Act 71 of 2025 (S.51, the $55,000/$70,000 thresholds and the
 * military retirement exemption) was already in effect for 2025.
 * https://tax.vermont.gov/tax-law-and-guidance/tax-legislation/2026
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
 * retirement, the Percentage Exclusion on capital gains, the medical expense deduction, and
 * the student loan interest subtraction are not modeled. Only single and
 * married-filing-jointly are supported. No credits are modeled. Vermont
 * parameters are not inflation-indexed beyond 2026 in this model, matching the restricted
 * New York, Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania,
 * Colorado, New Mexico, Minnesota, Utah and Connecticut estimates' convention.
 */

// 2026 amounts derived from the Department's 2026 withholding tables (see header); the additional deduction is the 2025 amount.
const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 7850, married: 15700 };
const ADDITIONAL_PER_BOX = 1250;
const PERSONAL_EXEMPTION = 5400;

const STATE_BRACKETS: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [
    { upTo: 50750, rate: .0335 }, { upTo: 122850, rate: .066 }, { upTo: 256300, rate: .076 }, { upTo: Infinity, rate: .0875 },
  ],
  married: [
    { upTo: 84700, rate: .0335 }, { upTo: 204750, rate: .066 }, { upTo: 312050, rate: .076 }, { upTo: Infinity, rate: .0875 },
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

const FLAT_CAPITAL_GAIN_EXCLUSION = 5000;

export function vermontTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, taxExemptInterest: number, netCapitalGain = 0, federalTaxableIncome?: number) {
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
  if (!Number.isFinite(netCapitalGain) || netCapitalGain < 0) throw new RangeError("Invalid Vermont net capital gain.");
  if ((netCapitalGain > 0 && federalTaxableIncome === undefined)
    || (federalTaxableIncome !== undefined && (!Number.isFinite(federalTaxableIncome) || federalTaxableIncome < 0))) {
    throw new RangeError("Vermont requires finite nonnegative federal taxable income when gains are present.");
  }
  const capitalGainsExclusion = Math.min(FLAT_CAPITAL_GAIN_EXCLUSION, netCapitalGain, 0.4 * (federalTaxableIncome ?? 0));
  const modifiedAgi = federalAgi + taxExemptInterest - socialSecuritySubtraction - otherRetirementSubtraction - capitalGainsExclusion;
  const deduction = STANDARD_DEDUCTION[input.filing] + additionalDeductionBoxes(input) * ADDITIONAL_PER_BOX
    + PERSONAL_EXEMPTION * (input.filing === "married" ? 2 : 1);
  const taxable = Math.max(0, modifiedAgi - deduction);
  const stateTax = Math.max(sumBrackets(taxable, STATE_BRACKETS[input.filing]), federalAgi > 150000 ? federalAgi * 0.03 : 0);
  return {
    stateTax, localTax: 0, socialSecuritySubtraction, otherRetirementSubtraction, capitalGainsExclusion,
    warning: "Vermont pre-credit estimate: enacted 2026 brackets (the 2025 brackets indexed, taken from the Department of Taxes' 2026 withholding tables because "
      + "its 2026 return booklet is not yet published; reviewed 2026-10-04), Vermont's own standard deduction "
      + "($7,850 single/$15,700 married, from the same tables, plus $1,250 per age-65-or-blind condition, the 2025 amount held "
      + "because the 2026 figure is not yet published) and $5,400-per-person personal "
      + "exemption, and the Retirement Income Exemption election between excluding Social Security benefits or up to "
      + "$10,000 of federal/other-government pension income (assumed to be whichever gives the larger subtraction), both "
      + "phased out between $55,000-$65,000 (single) or $70,000-$80,000 (married) federal AGI. Once federal AGI exceeds "
      + "$150,000, tax is the greater of the bracket calculation or 3% of federal AGI. All entered tax-exempt interest is "
      + "added back as Vermont-taxable, since this planner cannot identify Vermont-specific municipal bonds, and interest "
      + "from U.S. obligations is not separately tracked or subtracted. Vermont's separate, uncapped Military Retirement "
      + "Income Exemption is not modeled, since this planner cannot identify military retirement pay. Railroad retirement, "
      + "the Percentage Exclusion on capital gains (publicly traded stock and homes do not qualify, and this planner cannot tell them apart), the medical expense deduction and the student loan interest subtraction are excluded. The $5,000 Flat Capital Gains Exclusion (limited to net capital gain and 40% of federal taxable income; fixed in statute and not indexed) is applied. "
      + "Vermont has no local income tax. Only single and married-filing-jointly are supported. No credits are modeled. "
      + "Vermont's 2026 amounts are held for later years rather than inflation-indexed. Future legislation is not predicted. Not a tax return.",
  };
}
