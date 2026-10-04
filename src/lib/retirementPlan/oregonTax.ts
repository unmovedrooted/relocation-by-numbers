import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/** Restricted Oregon planning estimate.
 * 2026 DOR inflation-adjusted amounts supersede early OR-ESTIMATE amounts:
 * https://www.oregon.gov/dor/forms/FormsPubs/withholding-tax-formulas_206-436_2026.pdf
 * https://www.oregon.gov/dor/forms/FormsPubs/combined-payroll_211-155-2_2026.pdf
 * Age/blind amounts confirmed in 2026 OR-W-4 instructions:
 * https://www.oregon.gov/dor/forms/FormsPubs/form-or-W-4-instr_101-402-1_2026.pdf
 * January 1 age cutoff: OR-40 instructions, standard deduction, line 17.
 * https://www.oregon.gov/dor/forms/FormsPubs/form-or-40-inst_101-040-1_2025.pdf
 * ORS 316.695 provides the stepped federal-tax subtraction.
 * Future years freeze
 * these parameters. Marginal integration retains cents instead of rounded chart bases.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 2910, married: 5820 };
const AGE_OR_BLIND_ADDITION: Record<FilingStatus, number> = { single: 1200, married: 1000 };
const EXEMPTION_CREDIT_PER_PERSON = 263;
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
    // Oregon includes a 65th birthday on January 1 following the tax year.
    sum + (person.birthDate <= `${input.year - 64}-01-01` ? 1 : 0) + (person.blind ? 1 : 0), 0);
  const standardDeduction = STANDARD_DEDUCTION[input.filing] + ageOrBlindConditions * AGE_OR_BLIND_ADDITION[input.filing];
  const taxable = Math.max(0, orAgi - standardDeduction);
  const baseTax = marginal(taxable, BRACKET_CEILINGS[input.filing], BRACKET_RATES);
  const exemptionCredit = federalAgi <= EXEMPTION_CREDIT_AGI_LIMIT[input.filing] ? EXEMPTION_CREDIT_PER_PERSON * input.people.length : 0;
  const stateTax = Math.max(0, baseTax - exemptionCredit);
  return {
    stateTax, localTax: 0, orAgi, federalTaxSubtraction,
    warning: "Oregon planning estimate using the enacted graduated schedule (4.75% to 9.9% at $4,550/$11,400/"
      + "$125,000 single, doubled for married filing jointly) applied after the 2026 standard deduction ($2,910 "
      + "single/$5,820 married filing jointly, plus $1,200 single or $1,000 married per person per age-65-or-blind "
      + "condition; age 65 by January 1 following the tax year) and a $263-per-exemption credit that phases to $0 above $100,000 (single) or $200,000 (married "
      + "filing jointly) federal AGI. Social Security and tier 1 Railroad Retirement Board benefits are fully exempt. "
      + "The federal tax liability subtraction uses stepped caps with the 2026 $8,750 maximum ($5,000 single AGI bands; "
      + "$10,000 married bands). Parameters use published 2026 DOR amounts, including updated deduction and credit amounts from the withholding publication, not a complete final-return calculation. Age/blind additions are confirmed in 2026 guidance. Future years do not use "
      + "indexed amounts. Federal liability uses modeled regular income tax, not the complete Oregon worksheet "
      + "with federal credits and other adjustments. Oregon's federal pension income "
      + "subtraction for service before October 1, 1991, Retirement Income Credit and one-time kicker credit are not "
      + "modeled. Only single and married-filing-jointly are supported. Itemized deductions and other credits are "
      + "excluded.",
  };
}
