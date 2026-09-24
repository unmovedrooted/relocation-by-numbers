import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, standard-deduction, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-23 against:
 * - DC Office of Tax and Revenue, 2026 Form D-40ES booklet (REV. 03/2026):
 *   the "Tax Rate Table" (identical for every filing status), and the
 *   "Worksheet to Estimate DC Tax Payments" standard-deduction figures
 *   ($16,100 single/MFS/dependent, $32,200 MFJ/MFS-same-return/qualifying
 *   widow(er)) and additional aged-or-blind amount ($1,650 per box, or
 *   $2,050 per box if unmarried and not a surviving spouse) — these dollar
 *   figures are identical to this planner's own 2026 federal standard
 *   deduction, reflecting DC's conformity to the federal amounts.
 *   https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/2026_D40ES_Book_wLinks04012026.pdf
 * - D.C. Code § 47-1803.02(a)(2): confirms Social Security and tier 1
 *   Railroad Retirement benefits are excluded from DC gross income
 *   (subparagraph (L)), and that the $3,000 government pension/military
 *   retired pay/annuity exclusion (subparagraph (N)(i)) expired for taxable
 *   years beginning on or after January 1, 2015 and so does not apply here.
 *   https://code.dccouncil.gov/us/dc/council/code/sections/47-1803.02
 *
 * Uses enacted law, not a prediction of future legislation. DC has no
 * county-equivalent local income tax layer, so every DC location shares the
 * same calculation; localTax is always zero. DC's bracket schedule does not
 * vary by filing status. The expired $3,000 pension exclusion is correctly
 * NOT applied. D.C. Code § 47-1803.02(a)(2)(N)(ii) still excludes DC/federal
 * government SURVIVOR benefits (age 62+, no dollar cap) with no stated
 * expiration, but this planner's income model has no way to distinguish a
 * survivor annuity from an owner's own pension, so that exclusion is not
 * modeled; any such income must be entered as ordinary pension income and
 * will be fully taxed here, understating the true benefit for a qualifying
 * survivor. No itemized deductions or credits are modeled. DC parameters
 * remain nominal; the household's inflation/threshold-growth assumption does
 * not index them, matching the restricted New York, Maryland and Indiana
 * estimates' convention.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 16100, married: 32200 };

const STATE_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 10000, rate: .04 }, { upTo: 40000, rate: .06 }, { upTo: 60000, rate: .065 },
  { upTo: 250000, rate: .085 }, { upTo: 500000, rate: .0925 }, { upTo: 1000000, rate: .0975 },
  { upTo: Infinity, rate: .1075 },
];

function standardDeduction(input: HouseholdTaxInput, year: number) {
  let additional = 0;
  for (const person of input.people) {
    if (person.birthDate <= `${year - 65}-12-31`) additional++;
    if (person.blind) additional++;
  }
  return STANDARD_DEDUCTION[input.filing] + additional * (input.filing === "married" ? 1650 : 2050);
}

export function dcTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.dcContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted DC planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported DC projection year.");
  const dcAgi = federalAgi - taxableBenefits;
  const taxable = Math.max(0, dcAgi - standardDeduction(input, input.year));
  const stateTax = sumBrackets(taxable, STATE_BRACKETS);
  return {
    stateTax, localTax: 0, dcAgi,
    warning: "DC pre-credit estimate: enacted 2026 tax brackets (reviewed 2026-09-23, unchanged from the 2025 schedule per "
      + "the 2026 D-40ES booklet), a standard deduction matching the household's federal 2026 figures, and Social Security "
      + "fully excluded. DC's expired $3,000 government pension exclusion (sunset before 2015) is correctly not applied: "
      + "pension, IRA and annuity income are fully taxable here. DC's separate, uncapped survivor-benefit exclusion for a "
      + "DC/federal government survivor age 62 or older is not modeled, since this planner cannot distinguish a survivor "
      + "annuity from an owner's own pension. DC has no local income tax; localTax is always zero. Itemized deductions and "
      + "credits are excluded. DC parameters are not inflation-indexed in this model. Future legislation is not predicted. "
      + "Not a tax return.",
  };
}
