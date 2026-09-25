import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, federal-standard-deduction, PRE-CREDIT planning estimate.
 * Rates and thresholds reviewed 2026-09-25 against the Missouri Department
 * of Revenue's 2025 Form MO-A (2025 Individual Income Tax Adjustments,
 * Part 3) and 2025/2026 Income Tax Reference Guide and withholding formula:
 * - Missouri taxable income equals Missouri adjusted gross income (federal
 *   AGI, with no additions/subtractions modeled here beyond the pension/
 *   Social Security items below) less Missouri's own standard deduction,
 *   which "equals the allowable federal standard deduction" ($16,100
 *   single/$32,200 married filing jointly for 2026). The same graduated
 *   bracket schedule -- 0% to $1,348, then 2.0%/2.5%/3.0%/3.5%/4.0%/4.5% in
 *   $1,348 steps, then 4.7% above $9,436 -- applies regardless of filing
 *   status.
 *   https://dor.mo.gov/forms/Withholding%20Formula_2026.pdf
 * - Social Security and Social Security Disability: a 100% deduction of the
 *   taxable benefit for a taxpayer who is 62 or older by year end (no income
 *   limit); this planner does not model the separate disability-based
 *   eligibility for a younger owner.
 * - Public pension (from any federal, state or local government, excluding
 *   military retirement pay, which is separately and fully exempt): capped
 *   at the maximum Social Security benefit per taxpayer ($47,633 for tax
 *   year 2025, the latest published figure -- Missouri has not yet
 *   published its 2026-indexed cap at this review, so this planner holds
 *   the 2025 amount, understating the cap for 2026 and later), reduced by
 *   that same taxpayer's own Social Security/disability deduction.
 * - Private pension (annuities, pensions, IRAs and 401(k) plans funded by a
 *   private source): capped at $6,000 per taxpayer, then the household's
 *   combined capped amount is reduced dollar-for-dollar by the excess of
 *   (Missouri AGI less taxable Social Security) over $25,000 (single/head
 *   of household) or $32,000 (married filing jointly).
 *   https://dor.mo.gov/forms/MO-A_2025.pdf
 *
 * Uses enacted law, not a prediction of future legislation. Income entered
 * as annual pension with a federal-government, other-government or
 * ny-government pensionType is treated as a public pension; a private or
 * unspecified pensionType is treated as a private pension, the more
 * restrictive, income-tested treatment, since this planner cannot otherwise
 * verify a private source. This planner's aggregate 401(k)/IRA/annuity
 * distribution figure is treated entirely as private-source retirement
 * income (split evenly between spouses), since this planner does not track
 * whether an account is government-sponsored. Missouri's separate, full
 * military retirement pay exemption is not modeled, since this planner
 * cannot identify military retirement income. Only single and
 * married-filing-jointly are supported. Itemized deductions and credits,
 * including the refundable Property Tax Credit, are excluded. Missouri's
 * dollar figures are not further inflation-indexed in this model beyond the
 * federal standard deduction, matching the restricted New York, Maryland,
 * Indiana, DC, Illinois, New Jersey, Pennsylvania, Colorado, New Mexico,
 * Minnesota, Utah, Connecticut, Vermont, Montana, Rhode Island, California,
 * Virginia, Arizona, Georgia, North Carolina, South Carolina, Ohio,
 * Massachusetts, Iowa and Mississippi estimates' convention.
 */

const MAX_PUBLIC_PENSION_CAP = 47633;
const PRIVATE_PENSION_CAP_PER_PERSON = 6000;
const PRIVATE_PENSION_THRESHOLD: Record<FilingStatus, number> = { single: 25000, married: 32000 };
const BRACKET_CEILINGS = [1348, 2696, 4044, 5392, 6740, 8088, 9436, Infinity];
const BRACKET_RATES = [0, .02, .025, .03, .035, .04, .045, .047];

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

function isPublicPension(pensionType: HouseholdTaxInput["income"][number]["pensionType"]) {
  return pensionType === "federal-government" || pensionType === "other-government" || pensionType === "ny-government";
}

function ownPension(input: HouseholdTaxInput, ownerId: string, want: "public" | "private") {
  return input.income.filter(item => item.ownerId === ownerId && item.kind === "pension" && isPublicPension(item.pensionType) === (want === "public"))
    .reduce((sum, item) => sum + item.amount, 0);
}

function incomeByOwner(input: HouseholdTaxInput, kind: "social-security") {
  const map = new Map(input.people.map(person => [person.id, 0]));
  for (const item of input.income) if (item.kind === kind) map.set(item.ownerId, map.get(item.ownerId)! + item.amount);
  return map;
}

export function missouriTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, standardDeduction: number, retirementOrdinary: number) {
  if (input.missouriContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Missouri planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Missouri projection year.");
  const perOwnerOrdinary = retirementOrdinary / input.people.length;
  const ssGrossByOwner = incomeByOwner(input, "social-security");
  const totalGrossSs = [...ssGrossByOwner.values()].reduce((sum, value) => sum + value, 0);
  const ssByOwner = new Map<string, number>();
  let socialSecuritySubtraction = 0;
  for (const person of input.people) {
    const ownShare = totalGrossSs > 0 ? taxableBenefits * (ssGrossByOwner.get(person.id)! / totalGrossSs) : 0;
    const claim = ageAtYearEnd(person.birthDate, input.year) >= 62 ? ownShare : 0;
    ssByOwner.set(person.id, claim);
    socialSecuritySubtraction += claim;
  }
  let publicPensionSubtraction = 0;
  let privatePensionTotal = 0;
  for (const person of input.people) {
    const capped = Math.min(ownPension(input, person.id, "public"), MAX_PUBLIC_PENSION_CAP);
    publicPensionSubtraction += Math.max(0, capped - ssByOwner.get(person.id)!);
    const ownPrivate = ownPension(input, person.id, "private") + perOwnerOrdinary;
    privatePensionTotal += Math.min(ownPrivate, PRIVATE_PENSION_CAP_PER_PERSON);
  }
  const excess = Math.max(0, federalAgi - taxableBenefits - PRIVATE_PENSION_THRESHOLD[input.filing]);
  const privatePensionSubtraction = Math.max(0, privatePensionTotal - excess);
  const moAgi = federalAgi - socialSecuritySubtraction - publicPensionSubtraction - privatePensionSubtraction;
  const taxable = Math.max(0, moAgi - standardDeduction);
  const stateTax = marginal(taxable, BRACKET_CEILINGS, BRACKET_RATES);
  return {
    stateTax, localTax: 0, socialSecuritySubtraction, publicPensionSubtraction, privatePensionSubtraction,
    warning: "Missouri pre-credit estimate: Missouri taxable income (Missouri AGI less the federal-conforming standard "
      + "deduction of $16,100 single/$32,200 married filing jointly) is taxed under the enacted graduated schedule -- 0% to "
      + "$1,348, then six 0.5-point steps to 4.5% at $8,088, then 4.7% above $9,436 -- the same brackets for every filing "
      + "status. Social Security is fully deducted for an owner 62 or older; this planner does not model the separate "
      + "disability-based deduction for a younger owner. Income entered as annual pension with a federal-government, "
      + "other-government or ny-government pensionType is a public pension, capped at $47,633 per owner (the latest "
      + "published maximum Social Security benefit, for tax year 2025, held here pending Missouri's 2026 update) and "
      + "reduced by that owner's own Social Security deduction; a private or unspecified pensionType, and this planner's "
      + "aggregate 401(k)/IRA/annuity distribution figure (split evenly between spouses), is a private pension, capped at "
      + "$6,000 per owner and then reduced, in total, dollar-for-dollar by the excess of household AGI less Social Security "
      + "over $25,000 (single) or $32,000 (married). Missouri's separate, full military retirement pay exemption is not "
      + "modeled, since this planner cannot identify military retirement income. Only single and married-filing-jointly are "
      + "supported. Itemized deductions and credits, including the refundable Property Tax Credit, are excluded. Future "
      + "legislation is not predicted. Not a tax return.",
  };
}
