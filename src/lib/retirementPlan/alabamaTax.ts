import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, income-tested-standard-deduction, PRE-CREDIT planning
 * estimate. Rates and thresholds reviewed 2026-09-25 against the Alabama
 * Department of Revenue's 2025 Form 40 booklet:
 * - Graduated brackets, identical dollar breakpoints for every filing
 *   status: 2% to $500, 4% from $500 to $3,000, 5% above $3,000 (doubled
 *   to $1,000/$6,000 for married filing jointly).
 * - An income-tested standard deduction, phasing down as Alabama AGI rises:
 *   $3,000 (single) or $8,500 (married filing jointly) at $25,999 Alabama
 *   AGI or below, stepping down by $25 (single) or $175 (married) per
 *   $500 of AGI above that, to a $2,500 (single) or $5,000 (married) floor
 *   at $35,500 AGI and above.
 * - A $1,500 (single) or $3,000 (married filing jointly) personal
 *   exemption.
 * - A federal income tax deduction: uncapped for individuals, equal to
 *   federal regular tax plus federal AMT plus the Net Investment Income
 *   Tax, less certain refundable federal credits (EIC, additional child
 *   tax credit, etc., all zero in this planner).
 * - Social Security is fully excluded from Alabama gross income. So is any
 *   "defined benefit retirement plan in accordance with IRC 414(j)" and a
 *   list of specific government systems (U.S. Civil Service, Alabama
 *   Teachers'/Employees'/Judicial Retirement, military retirement pay,
 *   TVA, and others) -- these amounts are simply never reported. IRA,
 *   401(k), 403(b), SEP, Keogh and other defined-contribution distributions
 *   are fully taxable.
 *   https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f40bk.pdf
 *
 * Uses enacted law, not a prediction of future legislation. Income entered
 * as annual pension is treated as a qualifying defined-benefit pension and
 * fully excluded, regardless of pensionType, since this planner's "pension"
 * income represents a traditional pension rather than an account
 * distribution; this planner's aggregate 401(k)/IRA/annuity distribution
 * figure remains fully taxable, with no separate basis recovery for
 * nondeductible contributions made before 1982. Alabama's local
 * occupational and municipal income taxes (levied in some cities, distinct
 * from a working payroll tax) are not modeled; localTax is always 0. Only
 * single and married-filing-jointly are supported. Itemized deductions,
 * the dependent exemption and all other credits are excluded. Alabama's
 * dollar figures are not further inflation-indexed in this model. Future
 * legislation is not predicted. Not a tax return.
 */

const PERSONAL_EXEMPTION: Record<FilingStatus, number> = { single: 1500, married: 3000 };
const STANDARD_DEDUCTION_MAX: Record<FilingStatus, number> = { single: 3000, married: 8500 };
const STANDARD_DEDUCTION_MIN: Record<FilingStatus, number> = { single: 2500, married: 5000 };
const STANDARD_DEDUCTION_STEP: Record<FilingStatus, number> = { single: 25, married: 175 };
const BRACKET_LOW: Record<FilingStatus, number> = { single: 500, married: 1000 };
const BRACKET_HIGH: Record<FilingStatus, number> = { single: 3000, married: 6000 };

function standardDeduction(agi: number, filing: FilingStatus) {
  const steps = Math.ceil(Math.max(0, agi - 25999) / 500);
  return Math.max(STANDARD_DEDUCTION_MIN[filing], STANDARD_DEDUCTION_MAX[filing] - STANDARD_DEDUCTION_STEP[filing] * steps);
}

function bracketTax(taxable: number, filing: FilingStatus) {
  const low = BRACKET_LOW[filing], high = BRACKET_HIGH[filing];
  return Math.min(taxable, low) * .02 + Math.max(0, Math.min(taxable, high) - low) * .04 + Math.max(0, taxable - high) * .05;
}

function pensionSubtraction(input: HouseholdTaxInput) {
  return input.income.filter(item => item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
}

export function alabamaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, regularFederal: number, alternativeMinimumTax: number, niit: number) {
  if (input.alabamaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Alabama planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Alabama projection year.");
  const alAgi = Math.max(0, federalAgi - taxableBenefits - pensionSubtraction(input));
  const deduction = standardDeduction(alAgi, input.filing);
  const federalTaxDeduction = Math.max(0, regularFederal + alternativeMinimumTax + niit);
  const taxable = Math.max(0, alAgi - deduction - PERSONAL_EXEMPTION[input.filing] - federalTaxDeduction);
  const stateTax = bracketTax(taxable, input.filing);
  return {
    stateTax, localTax: 0, alAgi, standardDeduction: deduction, federalTaxDeduction,
    warning: "Alabama pre-credit estimate: enacted graduated brackets (2% to $500 single/$1,000 married, 4% to "
      + "$3,000/$6,000, 5% above), reviewed 2026-09-25. Alabama's own standard deduction phases down from $3,000 (single) "
      + "or $8,500 (married) at $25,999 Alabama AGI or below, to a $2,500/$5,000 floor at $35,500 and above, on top of a "
      + "$1,500/$3,000 personal exemption. Alabama's uncapped deduction for federal income tax paid (federal regular tax "
      + "plus AMT plus the Net Investment Income Tax) is also subtracted. Social Security is fully excluded. Income "
      + "entered as annual pension is treated as a qualifying defined-benefit pension (or one of Alabama's specifically "
      + "exempt government systems) and fully excluded regardless of pensionType; this planner's aggregate 401(k)/IRA/"
      + "annuity distribution figure remains fully taxable, without Alabama's separate pre-1982 basis recovery. Alabama's "
      + "local occupational and municipal income taxes, levied in some cities, are not modeled. Only single and "
      + "married-filing-jointly are supported. Itemized deductions, the dependent exemption and other credits are "
      + "excluded. Alabama's dollar figures are not further inflation-indexed in this model. Future legislation is not "
      + "predicted. Not a tax return.",
  };
}
