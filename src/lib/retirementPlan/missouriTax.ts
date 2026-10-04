import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ownerRetirementIncome } from "./ownerRetirementIncome";
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
 *   at the maximum Social Security benefit per taxpayer ($48,967 for tax
 *   year 2026, per the Department of Revenue's maximum-benefit table at
 *   https://dor.mo.gov/faq/taxation/individual/pension.html, checked
 *   2026-10-04; $47,633 for 2025). Later years hold the 2026 amount until
 *   Missouri publishes them), reduced by that same taxpayer's own Social
 *   Security/disability deduction.
 * - Private pension (annuities, pensions, IRAs and 401(k) plans funded by a
 *   private source): capped at $6,000 per taxpayer, then the household's
 *   combined capped amount is reduced dollar-for-dollar by the excess of
 *   (Missouri AGI less taxable Social Security) over $25,000 (single/head
 *   of household) or $32,000 (married filing jointly).
 *   https://dor.mo.gov/forms/MO-A_2025.pdf
 *
 * - Capital gains: HB 798 (2025) added a 100% subtraction of capital gains reported for federal tax, for
 *   individuals from tax years beginning on or after January 1, 2025 (RSMo 143.121; Form MO-A line 18, 2025 MO-A;
 *   Department of Revenue "2025 Individual Income Tax Year Changes" and "Capital Gains Subtraction" FAQ, read
 *   2026-10-04). Capital losses are not subtracted. MO-1040 line 5 subtracts MO-A line 19 (which includes it) before
 *   the pension and Social Security exemption on line 8, so Part 3's private pension income test starts from AGI
 *   net of the gain. The committee substitute of HB 798 also described a flat 4.7% rate and a standard deduction of
 *   the federal amount plus $4,000, but the Department of Revenue's 2026 withholding formula still uses the
 *   graduated schedule below and the federal standard deduction, so neither is modeled.
 *
 * Uses enacted law, not a prediction of future legislation. Income entered
 * as annual pension with a federal-government, other-government or
 * ny-government pensionType is treated as a public pension; a private or
 * unspecified pensionType is treated as a private pension, the more
 * restrictive, income-tested treatment, since this planner cannot otherwise
 * verify a private source. Each owner's own attributed 401(k)/IRA/annuity
 * distributions are treated entirely as private-source retirement
 * income for that owner, since this planner does not track
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

const NOTE = "Net capital gains included in federal AGI are fully subtracted (Section 143.121, effective for tax years beginning January 1, 2025; Form MO-A line 18, Department of Revenue year-changes page and FAQ), while a net capital loss is not; the subtraction also lowers the Missouri AGI used in the private pension income test.";
const MAX_PUBLIC_PENSION_CAP = 48967;
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

export function missouriTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, standardDeduction: number, retirementOrdinary: number, capitalIncome: number) {
  if (input.missouriContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Missouri planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Missouri projection year.");
  const ownerRetirement = ownerRetirementIncome(input, retirementOrdinary, "Missouri");
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
    const ownPrivate = ownPension(input, person.id, "private") + ownerRetirement.get(person.id)!;
    privatePensionTotal += Math.min(ownPrivate, PRIVATE_PENSION_CAP_PER_PERSON);
  }
  if (!Number.isFinite(capitalIncome) || capitalIncome < 0) throw new RangeError("Invalid Missouri capital gain.");
  const excess = Math.max(0, federalAgi - capitalIncome - taxableBenefits - PRIVATE_PENSION_THRESHOLD[input.filing]);
  const privatePensionSubtraction = Math.max(0, privatePensionTotal - excess);
  const moAgi = federalAgi - capitalIncome - socialSecuritySubtraction - publicPensionSubtraction - privatePensionSubtraction;
  const taxable = Math.max(0, moAgi - standardDeduction);
  const stateTax = marginal(taxable, BRACKET_CEILINGS, BRACKET_RATES);
  return {
    stateTax, localTax: 0, capitalGainSubtraction: capitalIncome, socialSecuritySubtraction, publicPensionSubtraction, privatePensionSubtraction,
    warning: "Missouri pre-credit estimate: Missouri taxable income (Missouri AGI less the federal-conforming standard "
      + "deduction of $16,100 single/$32,200 married filing jointly) is taxed under the enacted graduated schedule -- 0% to "
      + "$1,348, then six 0.5-point steps to 4.5% at $8,088, then 4.7% above $9,436 -- the same brackets for every filing "
      + "status. " + NOTE + " Social Security is fully deducted for an owner 62 or older; this planner does not model the separate "
      + "disability-based deduction for a younger owner. Income entered as annual pension with a federal-government, "
      + "other-government or ny-government pensionType is a public pension, capped at $48,967 per owner (the "
      + "published 2026 maximum Social Security benefit, held for later years until Missouri publishes them) and "
      + "reduced by that owner's own Social Security deduction; a private or unspecified pensionType, and that owner's "
      + "own attributed 401(k)/IRA/annuity distributions, is a private pension, capped at "
      + "$6,000 per owner and then reduced, in total, dollar-for-dollar by the excess of household AGI less Social Security "
      + "over $25,000 (single) or $32,000 (married). Missouri's separate, full military retirement pay exemption is not "
      + "modeled, since this planner cannot identify military retirement income. Only single and married-filing-jointly are "
      + "supported. Itemized deductions and credits, including the refundable Property Tax Credit, are excluded. Future "
      + "legislation is not predicted. Not a tax return.",
  };
}
