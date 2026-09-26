import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Oregon resident annual settlement.
 *
 * Verified against the Oregon Department of Revenue's own 2025 Form OR-40
 * instructions (150-101-040-1, Rev. 01-29-26): the graduated schedule
 * (4.75%/6.75%/8.75%/9.9%) is reconciled exactly against the instructions'
 * own Tax Rate Charts ($4,065 plus 8.75% over $50,000 single, $3,756 plus
 * 8.75% over $50,000 married filing jointly, and the $125,000/$250,000 top-
 * bracket breakpoints), giving thresholds of $4,400/$11,050/$125,000 single
 * or married filing separately, exactly doubled ($8,800/$22,100/$250,000)
 * for married filing jointly. The 2025 standard deduction ($2,835 single/
 * $5,670 married filing jointly) and its age-65-or-blind addition ($1,200
 * per condition for single, $1,000 per condition for married filing
 * jointly) are both confirmed directly.
 * https://www.oregon.gov/dor/forms/FormsPubs/form-or-40-inst_101-040-1_2025.pdf
 *
 * Social Security and tier 1 Railroad Retirement Board benefits included in
 * federal income are fully subtracted. The 2025 federal tax liability
 * subtraction follows Table 4's discrete caps ($5,000 single AGI bands,
 * $10,000 married-filing-jointly bands). These are 2025 parameters held
 * constant for projections, not verified 2026 or future indexed values. The $256-
 * per-exemption credit phases to $0 above $100,000 (single) or $200,000
 * (married filing jointly) federal AGI. Oregon's federal pension income
 * subtraction (for federal service before October 1, 1991), Retirement
 * Income Credit and one-time "kicker" credit are not modeled, since this
 * planner cannot identify pre-1991 federal service months or a taxpayer's
 * actual prior-year Oregon liability.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 2835, married: 5670 };
const AGE_OR_BLIND_ADDITION: Record<FilingStatus, number> = { single: 1200, married: 1000 };
const EXEMPTION_CREDIT_PER_PERSON = 256;
const EXEMPTION_CREDIT_AGI_LIMIT: Record<FilingStatus, number> = { single: 100000, married: 200000 };
const FEDERAL_TAX_SUBTRACTION_CAP = 8500;
const FEDERAL_TAX_SUBTRACTION_PHASEOUT: Record<FilingStatus, { start: number; step: number }> = {
  single: { start: 125000, step: 5000 },
  married: { start: 250000, step: 10000 },
};
const BRACKET_CEILINGS: Record<FilingStatus, number[]> = {
  single: [4400, 11050, 125000, Infinity],
  married: [8800, 22100, 250000, Infinity],
};
const BRACKET_RATES = [.0475, .0675, .0875, .099];

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function oregonTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, regularFederal: number) {
  if (input.oregonContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Oregon planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Oregon projection year.");
  const phaseout = FEDERAL_TAX_SUBTRACTION_PHASEOUT[input.filing];
  const reductionSteps = federalAgi < phaseout.start ? 0
    : Math.min(5, 1 + Math.floor((federalAgi - phaseout.start) / phaseout.step));
  const subtractionCap = FEDERAL_TAX_SUBTRACTION_CAP - reductionSteps * 1700;
  const federalTaxSubtraction = Math.min(regularFederal, subtractionCap);
  const orAgi = Math.max(0, federalAgi - taxableBenefits - federalTaxSubtraction);
  const ageOrBlindConditions = input.people.reduce((sum, person) =>
    sum + (ageAtYearEnd(person.birthDate, input.year) >= 65 ? 1 : 0) + (person.blind ? 1 : 0), 0);
  const standardDeduction = STANDARD_DEDUCTION[input.filing] + ageOrBlindConditions * AGE_OR_BLIND_ADDITION[input.filing];
  const taxable = Math.max(0, orAgi - standardDeduction);
  const baseTax = marginal(taxable, BRACKET_CEILINGS[input.filing], BRACKET_RATES);
  const exemptionCredit = federalAgi <= EXEMPTION_CREDIT_AGI_LIMIT[input.filing] ? EXEMPTION_CREDIT_PER_PERSON * input.people.length : 0;
  const stateTax = Math.max(0, baseTax - exemptionCredit);
  return {
    stateTax, localTax: 0, orAgi, federalTaxSubtraction,
    warning: "Oregon pre-credit estimate using the enacted graduated schedule (4.75% to 9.9% at $4,400/$11,050/"
      + "$125,000 single, doubled for married filing jointly) applied after the 2025 standard deduction ($2,835 "
      + "single/$5,670 married filing jointly, plus $1,200 single or $1,000 married per person per age-65-or-blind "
      + "condition) and a $256-per-exemption credit that phases to $0 above $100,000 (single) or $200,000 (married "
      + "filing jointly) federal AGI. Social Security and tier 1 Railroad Retirement Board benefits are fully exempt. "
      + "The federal tax liability subtraction uses the exact 2025 discrete caps ($5,000 single AGI bands; "
      + "$10,000 married bands). All Oregon parameters are held at 2025 values, not verified 2026 or future "
      + "indexed amounts. Federal liability uses modeled regular income tax, not the complete Oregon worksheet "
      + "with federal credits and other adjustments. Oregon's federal pension income "
      + "subtraction for service before October 1, 1991, Retirement Income Credit and one-time kicker credit are not "
      + "modeled. Only single and married-filing-jointly are supported. Itemized deductions and other credits are "
      + "excluded.",
  };
}
