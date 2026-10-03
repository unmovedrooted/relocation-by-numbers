import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted Oregon planning estimate.
 * 2026 OR-ESTIMATE published planning amounts (not final return tables):
 * https://www.oregon.gov/dor/forms/FormsPubs/publication-or-estimate_101-026_2026.pdf
 * ORS 316.695 provides the stepped federal-tax subtraction.
 * Age/blind additions retain the disclosed 2025 baseline. Future years freeze
 * these parameters. Marginal integration retains cents instead of rounded chart bases.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 2900, married: 5800 };
const AGE_OR_BLIND_ADDITION: Record<FilingStatus, number> = { single: 1200, married: 1000 };
const EXEMPTION_CREDIT_PER_PERSON = 260;
const EXEMPTION_CREDIT_AGI_LIMIT: Record<FilingStatus, number> = { single: 100000, married: 200000 };
const FEDERAL_TAX_SUBTRACTION_CAP = 8750;
const FEDERAL_TAX_SUBTRACTION_PHASEOUT: Record<FilingStatus, { start: number; step: number }> = {
  single: { start: 125000, step: 5000 },
  married: { start: 250000, step: 10000 },
};
const BRACKET_CEILINGS: Record<FilingStatus, number[]> = {
  single: [4550, 11400, 125000, Infinity],
  married: [9100, 22800, 250000, Infinity],
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
  const subtractionCap = FEDERAL_TAX_SUBTRACTION_CAP - reductionSteps * 1750;
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
    warning: "Oregon pre-credit estimate using the enacted graduated schedule (4.75% to 9.9% at $4,550/$11,400/"
      + "$125,000 single, doubled for married filing jointly) applied after the 2026 estimated standard deduction ($2,900 "
      + "single/$5,800 married filing jointly, plus $1,200 single or $1,000 married per person per age-65-or-blind "
      + "condition) and a $260-per-exemption credit that phases to $0 above $100,000 (single) or $200,000 (married "
      + "filing jointly) federal AGI. Social Security and tier 1 Railroad Retirement Board benefits are fully exempt. "
      + "The federal tax liability subtraction uses stepped caps with the 2026 estimated maximum ($5,000 single AGI bands; "
      + "$10,000 married bands). Parameters use 2026 OR-ESTIMATE planning values, not final return tables; age/blind additions retain 2025 values. Future years do not use "
      + "indexed amounts. Federal liability uses modeled regular income tax, not the complete Oregon worksheet "
      + "with federal credits and other adjustments. Oregon's federal pension income "
      + "subtraction for service before October 1, 1991, Retirement Income Credit and one-time kicker credit are not "
      + "modeled. Only single and married-filing-jointly are supported. Itemized deductions and other credits are "
      + "excluded.",
  };
}
