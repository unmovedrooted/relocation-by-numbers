import type { HouseholdTaxInput } from "./householdTax";
import { ownerRetirementIncome } from "./ownerRetirementIncome";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Wisconsin resident annual settlement.
 *
 * Verified against the Wisconsin Department of Revenue's 2026 Form 1-ES
 * instructions (D-101A, January 2026, read 2026-10-04): the 2026 schedule
 * 3.50%/4.40%/5.30%/7.65% at $15,110/$51,950/$332,720 single or head of
 * household and $20,150/$69,260/$443,630 married filing jointly. (The 2025
 * schedule was $14,680/$50,480/$323,290 and $19,580/$67,300/$431,060; earlier
 * versions of this module used it for 2026.) Later years hold the 2026
 * amounts, which Wisconsin indexes annually.
 * https://www.revenue.wi.gov/TaxForms2026/2026-Form1-ES-Inst.pdf
 *
 * Wisconsin's standard deduction phases out under a statutory formula
 * (sec. 71.05(22), Wis. Stats.) of 12% of Wisconsin AGI above a
 * threshold for single/head of household and 19.778% for married filing
 * jointly. The 2026 Standard Deduction schedules in the same instructions
 * give $13,960 less 12% of income over $20,120 (zero above $136,453) for
 * single filers and $25,840 less 19.778% of income over $29,040 (zero above
 * $159,690) for married filing jointly, applied here as a continuous linear
 * formula. A $700 personal exemption per person (self and spouse, not
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
 * per owner 67 or older to that owner's own pension income plus that
 * owner's own attributed 401(k)/IRA/annuity distributions.
 * Wisconsin's separate $5,000 low-income (federal AGI under $15,000
 * single/$30,000 married) age-65 retirement subtraction is not modeled.
 * https://www.revenue.wi.gov/DOR%20Publications/pb126.pdf
 *
 * Capital gains: 2025 Schedule WD instructions (read 2026-10-04) exclude 30% of the net capital gain from
 * assets held more than one year (60% for farm assets, not modeled). The exclusion is a Schedule AD
 * adjustment, so it lowers Wisconsin income before the standard deduction phase-out.
 * https://www.revenue.wi.gov/TaxForms2025/2025-ScheduleWD-Inst.pdf
 */

const BRACKETS = {
  single: { ceilings: [15110, 51950, 332720, Infinity], rates: [.035, .044, .053, .0765] },
  married: { ceilings: [20150, 69260, 443630, Infinity], rates: [.035, .044, .053, .0765] },
};
const STANDARD_DEDUCTION_MAX = { single: 13960, married: 25840 };
const STANDARD_DEDUCTION_PHASEOUT_RATE = { single: .12, married: .19778 };
const STANDARD_DEDUCTION_PHASEOUT_THRESHOLD = { single: 20120, married: 29040 };
const PERSONAL_EXEMPTION_PER_PERSON = 700;
const SENIOR_EXEMPTION_PER_PERSON = 250;
const RETIREMENT_SUBTRACTION_CAP_PER_PERSON = 24000;
const CAPITAL_GAIN_EXCLUSION_RATE = .3;

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function wisconsinTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number, netCapitalGain = 0) {
  if (input.wisconsinContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Wisconsin planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Wisconsin projection year.");
  const ownerRetirement = ownerRetirementIncome(input, retirementOrdinary, "Wisconsin");
  let retirementSubtraction = 0;
  let personalExemption = 0;
  for (const person of input.people) {
    personalExemption += PERSONAL_EXEMPTION_PER_PERSON;
    if (ageAtYearEnd(person.birthDate, input.year) >= 67) {
      const ownPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
      retirementSubtraction += Math.min(RETIREMENT_SUBTRACTION_CAP_PER_PERSON, ownPension + ownerRetirement.get(person.id)!);
    }
    if (ageAtYearEnd(person.birthDate, input.year) >= 65) personalExemption += SENIOR_EXEMPTION_PER_PERSON;
  }
  if (!Number.isFinite(netCapitalGain) || netCapitalGain < 0) throw new RangeError("Invalid Wisconsin net capital gain.");
  const capitalGainExclusion = CAPITAL_GAIN_EXCLUSION_RATE * netCapitalGain;
  const wiAgi = Math.max(0, federalAgi - taxableBenefits - retirementSubtraction - capitalGainExclusion);
  const standardDeduction = Math.min(STANDARD_DEDUCTION_MAX[input.filing],
    Math.max(0, STANDARD_DEDUCTION_MAX[input.filing] - STANDARD_DEDUCTION_PHASEOUT_RATE[input.filing] * Math.max(0, wiAgi - STANDARD_DEDUCTION_PHASEOUT_THRESHOLD[input.filing])));
  const taxable = Math.max(0, wiAgi - standardDeduction - personalExemption);
  const { ceilings, rates } = BRACKETS[input.filing];
  const stateTax = marginal(taxable, ceilings, rates);
  return {
    stateTax, localTax: 0, wiAgi, standardDeduction, retirementSubtraction, capitalGainExclusion,
    warning: "Wisconsin pre-credit estimate using the enacted graduated schedule (3.50% to 7.65% at $15,110/$51,950/"
      + "$332,720 single, $20,150/$69,260/$443,630 married filing jointly, Wisconsin's 2026 amounts held for later years) "
      + "applied after Wisconsin's own income-phased standard deduction ($13,960 less 12% of income over $20,120 single; "
      + "$25,840 less 19.778% of income over $29,040 married) and a $700 personal exemption per person plus $250 per person 65 or older. "
      + "Social Security and military retirement pay are fully exempt. " + "Wisconsin excludes 30% of net capital gain from assets held more than one year (Schedule WD instructions, 2025); the 60% rate for farm assets is not modeled, and the exclusion lowers the Wisconsin income that phases out the standard deduction." + " An owner 67 or older excludes up to $24,000 of "
      + "that owner's own pension income plus that owner's own attributed 401(k)/IRA/annuity distributions, "
      + "but Wisconsin's separate low-income age-65 $5,000 subtraction and its exemption for pre-1964 "
      + "government pension accounts are not modeled. Only single and married-filing-jointly are supported. Itemized "
      + "deductions and credits are excluded.",
  };
}
