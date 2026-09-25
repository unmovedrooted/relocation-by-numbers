import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Nebraska resident annual settlement.
 *
 * Verified against the Nebraska Department of Revenue's 2025 Individual
 * Income Tax and Amended Return Booklet (8-307-2025), which confirms the
 * top rate reduced to 5.20% for 2025 under LB 754 (2023) and the $171
 * personal exemption credit per exemption (Form 1040N, lines 18/6).
 * https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_Individual_Income_Tax_Booklet.pdf
 *
 * Nebraska has not yet published its 2026 booklet, so the bracket
 * schedule below (0%/2.46%/3.51%/4.40%/4.55% at $3,990/$23,930/$38,580,
 * doubled for married filing jointly) and the standard deduction
 * ($8,600 single/$17,200 married, plus $2,000 per condition -- 65 or
 * older or blind -- for single filers and $1,650 per condition for
 * married filers) are the latest published (2025) figures held here
 * pending Nebraska's 2026 inflation-adjustment publication; only LB 754's
 * already-enacted step-down of the top rate to 4.55% for 2026 is
 * separately confirmed. The $171 personal exemption credit is likewise
 * the latest published figure.
 *
 * Social Security is fully excluded from federal AGI for Nebraska
 * purposes for all filers, with no income threshold (Schedule I, line
 * 31). Nebraska's only broad retirement-income exclusions are for
 * military retirement benefits and Civil Service Retirement System
 * (CSRS, but not FERS) federal annuities; this planner cannot identify
 * either a modeled pension as military or distinguish CSRS from FERS
 * federal civil service benefits, so all pension income and this
 * planner's aggregate 401(k)/IRA/annuity distribution figure remain
 * fully taxable, understating the exclusion for such a retiree.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 8600, married: 17200 };
const STANDARD_DEDUCTION_STEP: Record<FilingStatus, number> = { single: 2000, married: 1650 };
const PERSONAL_EXEMPTION_CREDIT = 171;
const BRACKET_CEILINGS_SINGLE = [3990, 23930, 38580, Infinity];
const BRACKET_RATES = [.0246, .0351, .044, .0455];

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function nebraskaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.nebraskaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Nebraska planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Nebraska projection year.");
  let standardDeduction = STANDARD_DEDUCTION[input.filing];
  let personalCredit = 0;
  for (const person of input.people) {
    standardDeduction += ((ageAtYearEnd(person.birthDate, input.year) >= 65 ? 1 : 0) + (person.blind ? 1 : 0)) * STANDARD_DEDUCTION_STEP[input.filing];
    personalCredit += PERSONAL_EXEMPTION_CREDIT;
  }
  const neAgi = Math.max(0, federalAgi - taxableBenefits);
  const taxable = Math.max(0, neAgi - standardDeduction);
  const ceilings = input.filing === "married" ? BRACKET_CEILINGS_SINGLE.map(c => c * 2) : BRACKET_CEILINGS_SINGLE;
  const grossTax = marginal(taxable, ceilings, BRACKET_RATES);
  const stateTax = Math.max(0, grossTax - personalCredit);
  return {
    stateTax, localTax: 0, neAgi, standardDeduction, personalCredit,
    warning: "Nebraska pre-credit estimate using the latest published (2025) graduated schedule (2.46%/3.51%/4.40% at "
      + "$3,990/$23,930, doubled for married filing jointly) topped by the enacted, unconditionally scheduled 4.55% top "
      + "rate for 2026, held pending Nebraska's 2026 inflation-adjustment publication for the lower breakpoints. Applied "
      + "after the latest published (2025) standard deduction ($8,600 single/$17,200 married, plus $2,000 per condition "
      + "-- 65 or older or blind -- for single filers and $1,650 per condition for married filers) and a $171 personal "
      + "exemption credit per person. Social Security is fully exempt; income entered as annual pension and this "
      + "planner's aggregate 401(k)/IRA/annuity distribution figure remain fully taxable, since this planner cannot "
      + "identify military retirement pay or distinguish CSRS from FERS federal civil service annuities. Only single and "
      + "married-filing-jointly are supported. Itemized deductions and other credits are excluded.",
  };
}
