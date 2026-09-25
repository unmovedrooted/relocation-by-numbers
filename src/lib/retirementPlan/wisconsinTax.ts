import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Wisconsin resident annual settlement.
 *
 * Verified against the Wisconsin Department of Revenue's own 2025 tax
 * rate guidance (Guidance Document 100047, interpreting law as of
 * January 16, 2026) for the graduated schedule -- 3.50%/4.40%/5.30%/
 * 7.65% at $14,680/$50,480/$323,290 single or head of household and
 * $19,580/$67,300/$431,060 married filing jointly -- reconciled exactly
 * against the 2025 Form 1 instructions' own $100,000-and-over tax
 * computation worksheet constants for both filing statuses.
 * https://www.revenue.wi.gov/Pages/FAQS/pcs-taxrates.aspx
 * https://www.revenue.wi.gov/TaxForms2025/2025-Form1-Inst.pdf
 *
 * Wisconsin's standard deduction phases out under a statutory formula
 * (sec. 71.05(22), Wis. Stats.) of 12% of Wisconsin AGI above a
 * threshold for single/head of household and 19.778% for married filing
 * jointly; this planner reconstructs the current (2025) inflation-
 * indexed threshold and maximum for each filing status from the 2025
 * Standard Deduction Table (max $13,560 single/$25,110 married filing
 * jointly, phasing to $0 at $132,500 single/$155,169 married filing
 * jointly) as a continuous linear formula, which may differ from
 * Wisconsin's own published table by a small amount (observed up to
 * roughly $100) in some income ranges due to the state's own table-based
 * rounding. A $700 personal exemption per person (self and spouse, not
 * claimed as a dependent), plus a separate $250 exemption per person 65
 * or older, is added on top.
 *
 * Social Security and military retirement benefits are fully exempt (not
 * modeled here since this planner cannot identify military retirement
 * income). Wisconsin's separate exemption for local, state and federal
 * government pension benefits paid from an account established before
 * 1964 is not modeled, since this planner cannot verify a modeled
 * owner's decades-old service history. Starting with the 2025 taxable
 * year, an owner 67 or older may subtract up to $24,000 of qualifying
 * retirement-plan or IRA income ($48,000 for a married couple filing
 * jointly if both spouses are 67 or older); this planner applies the cap
 * per owner 67 or older to that owner's own pension income plus a share
 * of this planner's aggregate 401(k)/IRA/annuity distribution figure.
 * Wisconsin's separate $5,000 low-income (federal AGI under $15,000
 * single/$30,000 married) age-65 retirement subtraction is not modeled.
 * https://www.revenue.wi.gov/DOR%20Publications/pb126.pdf
 */

const BRACKETS = {
  single: { ceilings: [14680, 50480, 323290, Infinity], rates: [.035, .044, .053, .0765] },
  married: { ceilings: [19580, 67300, 431060, Infinity], rates: [.035, .044, .053, .0765] },
};
const STANDARD_DEDUCTION_MAX = { single: 13560, married: 25110 };
const STANDARD_DEDUCTION_PHASEOUT_RATE = { single: .12, married: .19778 };
const STANDARD_DEDUCTION_PHASEOUT_THRESHOLD = { single: 19300, married: 28204 };
const PERSONAL_EXEMPTION_PER_PERSON = 700;
const SENIOR_EXEMPTION_PER_PERSON = 250;
const RETIREMENT_SUBTRACTION_CAP_PER_PERSON = 24000;

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function wisconsinTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.wisconsinContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Wisconsin planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Wisconsin projection year.");
  const perOwnerOrdinary = retirementOrdinary / input.people.length;
  let retirementSubtraction = 0;
  let personalExemption = 0;
  for (const person of input.people) {
    personalExemption += PERSONAL_EXEMPTION_PER_PERSON;
    if (ageAtYearEnd(person.birthDate, input.year) >= 67) {
      const ownPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
      retirementSubtraction += Math.min(RETIREMENT_SUBTRACTION_CAP_PER_PERSON, ownPension + perOwnerOrdinary);
    }
    if (ageAtYearEnd(person.birthDate, input.year) >= 65) personalExemption += SENIOR_EXEMPTION_PER_PERSON;
  }
  const wiAgi = Math.max(0, federalAgi - taxableBenefits - retirementSubtraction);
  const standardDeduction = Math.min(STANDARD_DEDUCTION_MAX[input.filing],
    Math.max(0, STANDARD_DEDUCTION_MAX[input.filing] - STANDARD_DEDUCTION_PHASEOUT_RATE[input.filing] * Math.max(0, wiAgi - STANDARD_DEDUCTION_PHASEOUT_THRESHOLD[input.filing])));
  const taxable = Math.max(0, wiAgi - standardDeduction - personalExemption);
  const { ceilings, rates } = BRACKETS[input.filing];
  const stateTax = marginal(taxable, ceilings, rates);
  return {
    stateTax, localTax: 0, wiAgi, standardDeduction, retirementSubtraction,
    warning: "Wisconsin pre-credit estimate using the enacted graduated schedule (3.50% to 7.65% at $14,680/$50,480/"
      + "$323,290 single, $19,580/$67,300/$431,060 married filing jointly) applied after a linear reconstruction of "
      + "Wisconsin's own income-phased standard deduction table (which may differ from the official table by a small "
      + "amount in some income ranges) and a $700 personal exemption per person plus $250 per person 65 or older. "
      + "Social Security and military retirement pay are fully exempt. An owner 67 or older excludes up to $24,000 of "
      + "that owner's own pension income plus a share of this planner's aggregate 401(k)/IRA/annuity distribution "
      + "figure, but Wisconsin's separate low-income age-65 $5,000 subtraction and its exemption for pre-1964 "
      + "government pension accounts are not modeled. Only single and married-filing-jointly are supported. Itemized "
      + "deductions and credits are excluded.",
  };
}
