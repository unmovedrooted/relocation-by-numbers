import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, own-standard-deduction, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-24 against Virginia Tax's published guidance:
 * - The four-bracket schedule, identical for every filing status (Virginia
 *   does not double thresholds for married filers): 2% to $3,000, 3% to
 *   $5,000, 5% to $17,000, 5.75% above.
 *   https://www.individual.tax.virginia.gov/income-tax-calculator
 * - The standard deduction: $8,750 single/$17,500 married for 2026. The 2026 Appropriation Act
 *   (HB 30, Special Session I, Chapter 1, third enactment clause; Virginia Tax 2026 Legislative Summary,
 *   read 2026-10-04) sets $9,200/$18,400 for taxable year 2027 and $9,300/$18,600 for 2028 and 2029, and the
 *   increased amounts sunset after 2029, reverting to $3,000/$6,000 for 2030 and later. The sunset is
 *   modeled as enacted (no extension is assumed, though the legislature has extended these amounts before).
 *   https://www.tax.virginia.gov/sites/default/files/inline-files/2026-legislative-summary.pdf
 *   https://www.tax.virginia.gov/deductions
 * - The Age Deduction for Taxpayers Age 65 and Over: up to $12,000 per
 *   qualifying spouse, reduced dollar-for-dollar once household "adjusted
 *   federal AGI" (federal AGI less taxable Social Security and Tier 1
 *   Railroad Retirement benefits, ignoring fixed-date conformity
 *   adjustments this planner does not model) exceeds $50,000 (single) or
 *   $75,000 (married); a spouse born on or before January 1, 1939 instead
 *   receives the full $12,000 regardless of income (a permanent 2004
 *   grandfather date, not a rolling age-65 threshold). Per the 2025 Form 760 instructions and
 *   Age 65 and Older Deduction Worksheet (read 2026-10-04), income-based claimants share one
 *   limit of $12,000 each, reduced by the combined AFAGI above the threshold (two married
 *   claimants: $24,000 less the excess, not each spouse reduced separately), and a taxpayer is
 *   eligible when born on or before January 1 of the year after the tax year, less 64 (2025: January 1, 1961).
 *   https://www.tax.virginia.gov/sites/default/files/vatax-pdf/2025-760-instructions.pdf
 * - Personal exemptions (Form 760 instructions, line 12): $930 per taxpayer and spouse, and $800 more
 *   for each who is 65 or older on or before January 1 of the following year or blind. No change was
 *   found in Virginia Tax's 2026 Legislative Summary.
 *   https://www.tax.virginia.gov/subtractions
 * - Social Security is excluded per Virginia's existing "exempt"
 *   classification and location-layer subtraction already used elsewhere in
 *   this planner.
 *   https://www.tax.virginia.gov/subtractions
 *
 * Uses enacted law, not a prediction of future legislation. Virginia has no
 * local income tax; localTax is always zero. Eligibility for the age deduction and the
 * age exemption uses Virginia's own day-precise cutoff (born on or before January 1 of the
 * tax year minus 64). Virginia's growing military retirement pay subtraction is not
 * modeled, since this planner cannot identify military retirement income,
 * understating the benefit for such a household. Only single and married-
 * filing-jointly are supported. Itemized deductions and credits are
 * excluded. Virginia's dollar figures are not further inflation-indexed in
 * this model, matching the restricted New York, Maryland, Indiana, DC,
 * Illinois, New Jersey, Pennsylvania, Colorado, New Mexico, Minnesota, Utah,
 * Connecticut, Vermont, Montana, Rhode Island and California estimates'
 * convention.
 */

/** 2026 Appropriation Act: 2026 $8,750/$17,500; 2027 $9,200/$18,400; 2028-2029 $9,300/$18,600; reverts to $3,000/$6,000 from 2030. */
function standardDeduction(year: number, filing: FilingStatus) {
  const [single, married] = year <= 2026 ? [8750, 17500] : year === 2027 ? [9200, 18400] : year <= 2029 ? [9300, 18600] : [3000, 6000];
  return filing === "married" ? married : single;
}
const NOTE = "Virginia personal exemptions of $930 for the taxpayer and spouse, plus $800 for each owner who is 65 or older by January 1 of the following year or blind, are subtracted. The Age Deduction follows Virginia's worksheet: a married couple with two income-based claimants shares one $24,000 limit reduced by the amount their combined adjusted federal AGI exceeds $75,000, and eligibility uses Virginia's day-precise cutoff of a birth date on or before January 1 of the tax year minus 64.";
const AGE_DEDUCTION_MAX = 12000;
const PERSONAL_EXEMPTION = 930;
const AGE_OR_BLIND_EXEMPTION = 800;
const AGE_DEDUCTION_THRESHOLD: Record<FilingStatus, number> = { single: 50000, married: 75000 };
const GRANDFATHER_BIRTH_DATE = "1939-01-01";

/** Virginia counts a taxpayer as 65 for the tax year when born on or before January 1 of the following year, less 65 years. */
const isAge65 = (birthDate: string, year: number) => birthDate <= `${year - 64}-01-01`;

const STATE_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 3000, rate: .02 }, { upTo: 5000, rate: .03 }, { upTo: 17000, rate: .05 }, { upTo: Infinity, rate: .0575 },
];

/** Age 65 and Older Deduction Worksheet: spouses born by January 1, 1939 take the full amount; the other eligible
 * owners share one limit of $12,000 each, reduced by the household's AFAGI above the income threshold. */
function ageDeduction(input: HouseholdTaxInput, adjustedFederalAgi: number) {
  const eligible = input.people.filter(person => isAge65(person.birthDate, input.year));
  const grandfathered = eligible.filter(person => person.birthDate <= GRANDFATHER_BIRTH_DATE).length;
  const incomeBased = eligible.length - grandfathered;
  const excess = Math.max(0, adjustedFederalAgi - AGE_DEDUCTION_THRESHOLD[input.filing]);
  return grandfathered * AGE_DEDUCTION_MAX + Math.max(0, incomeBased * AGE_DEDUCTION_MAX - excess);
}

function exemptionAllowance(input: HouseholdTaxInput) {
  return input.people.length * PERSONAL_EXEMPTION
    + input.people.reduce((sum, person) => sum + (isAge65(person.birthDate, input.year) ? AGE_OR_BLIND_EXEMPTION : 0) + (person.blind ? AGE_OR_BLIND_EXEMPTION : 0), 0);
}

export function virginiaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.virginiaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Virginia planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Virginia projection year.");
  const adjustedFederalAgi = federalAgi - taxableBenefits;
  const deduction = ageDeduction(input, adjustedFederalAgi);
  const exemptions = exemptionAllowance(input);
  const taxable = Math.max(0, adjustedFederalAgi - standardDeduction(input.year, input.filing) - deduction - exemptions);
  const stateTax = sumBrackets(taxable, STATE_BRACKETS);
  return {
    stateTax, localTax: 0, ageDeduction: deduction, exemptions,
    warning: "Virginia pre-credit estimate: the enacted four-bracket schedule (2%/3%/5%/5.75%, identical for every filing "
      + "status), Virginia's own standard deduction ($8,750 single/$17,500 married in 2026, $9,200/$18,400 in 2027, $9,300/$18,600 in 2028-2029, "
      + "and reverting to $3,000/$6,000 from 2030 because the increase is scheduled to sunset; no extension is assumed), and the Age Deduction for taxpayers 65 "
      + "or older (up to $12,000 per qualifying spouse, reduced dollar-for-dollar once household federal AGI "
      + "less taxable Social Security exceeds $50,000/$75,000; a spouse born on or before January 1, 1939 keeps the full "
      + "$12,000 regardless of income, a fixed 2004 grandfather date). " + NOTE + " Social Security is fully excluded. Virginia's growing "
      + "military retirement pay subtraction is not modeled, since this planner cannot identify military retirement income, "
      + "understating the benefit for such a household. Virginia has no local income tax. Only single and married-filing-"
      + "jointly are supported. Itemized deductions and credits are excluded. Virginia's dollar figures are not further "
      + "inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
