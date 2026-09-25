import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/**
 * Restricted, verified Oklahoma resident annual settlement.
 *
 * Verified against the Oklahoma Tax Commission's own 2025 Form 511
 * packet: the graduated schedule (0.25%/0.75%/1.75%/2.75%/3.75%/4.75% at
 * $1,000/$2,500/$3,750/$4,900/$7,200 single or married filing separate,
 * with married filing jointly, head of household and qualifying
 * surviving spouse using exactly doubled thresholds) is reconciled
 * exactly against the packet's own $100,000-and-over tax computation
 * worksheet constants ($4,562 plus 4.75% single/MFS, $4,373 plus 4.75%
 * MFJ/HOH/QSS), and the standard deduction ($6,350 single/married filing
 * separate, $12,700 married filing jointly/qualifying surviving spouse,
 * $9,350 head of household) and $1,000 per-exemption personal exemption.
 * https://oklahoma.gov/content/dam/ok/en/tax/documents/forms/individuals/current/511-Pkt.pdf
 *
 * A further $1,000 Special Exemption applies for each taxpayer or spouse
 * 65 or older, but only when Federal AGI (household-wide, not per
 * spouse) is at or below $15,000 single or $25,000 married filing
 * jointly.
 *
 * Social Security included in Federal AGI is fully subtracted (Schedule
 * 511-A, line 2). A combined household-wide $10,000-per-person
 * retirement-benefits exclusion (Schedule 511-A, lines 5 and 6) covers
 * both named Oklahoma/federal government pension systems and any other
 * qualifying pension, annuity, IRA, 401(k), 403(b) or deferred
 * compensation income at any age, so this planner applies it to a
 * combined pool of that owner's own pension income (any pensionType)
 * plus a share of this planner's aggregate 401(k)/IRA/annuity
 * distribution figure. Oklahoma's separate, fully uncapped exclusions
 * for military retired pay and CSRS-in-lieu-of-Social-Security federal
 * annuities are not modeled, since this planner cannot identify either.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 6350, married: 12700 };
const PERSONAL_EXEMPTION_PER_PERSON = 1000;
const SPECIAL_EXEMPTION_AGI_LIMIT: Record<FilingStatus, number> = { single: 15000, married: 25000 };
const RETIREMENT_EXCLUSION_CAP = 10000;
const BRACKET_CEILINGS: Record<FilingStatus, number[]> = {
  single: [1000, 2500, 3750, 4900, 7200, Infinity],
  married: [2000, 5000, 7500, 9800, 14400, Infinity],
};
const BRACKET_RATES = [.0025, .0075, .0175, .0275, .0375, .0475];

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function oklahomaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.oklahomaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Oklahoma planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Oklahoma projection year.");
  const perOwnerOrdinary = retirementOrdinary / input.people.length;
  let retirementExclusion = 0;
  let specialExemption = 0;
  for (const person of input.people) {
    const ownPension = input.income.filter(item => item.ownerId === person.id && item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
    retirementExclusion += Math.min(RETIREMENT_EXCLUSION_CAP, ownPension + perOwnerOrdinary);
    if (ageAtYearEnd(person.birthDate, input.year) >= 65 && federalAgi <= SPECIAL_EXEMPTION_AGI_LIMIT[input.filing]) specialExemption += PERSONAL_EXEMPTION_PER_PERSON;
  }
  const okAgi = Math.max(0, federalAgi - taxableBenefits - retirementExclusion);
  const exemption = PERSONAL_EXEMPTION_PER_PERSON * input.people.length + specialExemption;
  const taxable = Math.max(0, okAgi - STANDARD_DEDUCTION[input.filing] - exemption);
  const stateTax = marginal(taxable, BRACKET_CEILINGS[input.filing], BRACKET_RATES);
  return {
    stateTax, localTax: 0, okAgi, retirementExclusion,
    warning: "Oklahoma pre-credit estimate using the enacted graduated schedule (0.25% to 4.75% at $1,000/$2,500/"
      + "$3,750/$4,900/$7,200 single, doubled for married filing jointly) applied after the standard deduction ($6,350 "
      + "single/$12,700 married filing jointly) and a $1,000 personal exemption per person, plus a further $1,000 per "
      + "person 65 or older when household Federal AGI is $15,000 or less (single) or $25,000 or less (married filing "
      + "jointly). Social Security is fully exempt. Each owner's own pension income of any pensionType, plus a share "
      + "of this planner's aggregate 401(k)/IRA/annuity distribution figure, is excluded up to a combined $10,000 per "
      + "owner, but Oklahoma's separate, uncapped exclusions for military retired pay and CSRS-in-lieu-of-Social-"
      + "Security federal annuities are not modeled. Only single and married-filing-jointly are supported. Itemized "
      + "deductions and other credits are excluded.",
  };
}
