import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ownerRetirementIncome } from "./ownerRetirementIncome";

/** Restricted, standard-deduction, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-10 against:
 * - Comptroller of Maryland, "2026 Maryland State and Local Income Tax
 *   Withholding Information" (Feb 4, 2026): state brackets, $3,400 single
 *   standard-deduction reference, and the 2026 local rate table (Attachment 1).
 *   https://www.marylandcomptroller.gov/content/dam/mdcomp/md/state-payroll/memos/2026/2026-maryland-state-and-local-withholding-information.pdf
 * - Comptroller of Maryland, "Changes to Standard and Itemized Deductions and
 *   to State and Local Income Tax Rates from the 2025 Legislative Session"
 *   (revised Dec 22, 2025): confirms the 2025 standard deduction ($3,350
 *   single / $6,700 MFJ, exactly 2x) and the new 5.75/6.25/6.5% brackets.
 *   https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/legal-publications/alerts/tax-alert-changes-to-standard-and-itemized-deductions-and-to-state-and-local-income-tax-rates-from-the-2025-legislative-session.pdf
 * - Technical Bulletin No. 51, "Senior Citizens and Maryland Income Tax"
 *   (effective April 10, 2025): pension exclusion eligibility and Worksheet
 *   13A mechanics (cap, then reduced by gross Social Security/Railroad
 *   Retirement benefits, floored at zero). Confirms Social Security and
 *   Railroad Retirement benefits are not taxed by Maryland.
 *   https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/legal-publications/technical-bulletins/tb-51.pdf
 *
 * - Comptroller of Maryland, 2025 Resident Tax Booklet (Instruction 10, Exemption Amount Chart 10A, and Worksheet 13D),
 *   read 2026-10-04: the $3,200 personal exemption per taxpayer and spouse, reduced above $100,000 federal AGI
 *   ($150,000 joint/HOH) in the chart's steps and gone above $150,000 ($200,000 joint); the additional $1,000
 *   exemption for age 65 or older or blind, which the phase-out does not reduce; and the two-income married
 *   subtraction, the lesser of $1,200 and the smaller spouse's own income less that spouse's subtractions. The
 *   $3,200 is the statutory amount and the booklet shows it unchanged; no 2026 change was found.
 *   https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/instructions/2025/resident-booklet.pdf
 *
 * The 2026 MFJ/HOH/QSS standard deduction ($6,800) is not independently
 * confirmed in a fetched source; it is inferred from the exact 2x relationship
 * the enacted 2025 figures ($3,350 single / $6,700 MFJ) establish, applied to
 * the confirmed 2026 single figure ($3,400). The 2026 pension exclusion cap
 * ($40,600, down from $41,200 for 2025 because it tracks the Social Security maximum) is stated on the
 * Comptroller's own "Maryland Pension Exclusion" guidance page (read 2026-10-04):
 * https://services.marylandcomptroller.gov/taxes?id=kb_article_view&sysparm_article=KB0010012
 * The 2026 session bills that would have changed the standard deduction (HB 411) and the exclusion (HB 707)
 * did not leave committee.
 *
 * Uses enacted law, not a prediction of future legislation. Only Baltimore
 * City, Frederick County and Montgomery County (Rockville) are rated; every
 * other Maryland jurisdiction is unsupported. The pension exclusion supports
 * only the age-65-by-year-end path for income entered as "pension" (an
 * employee retirement system pension/annuity under IRC 401(a)/403/457(b));
 * the disability-based eligibility path, and any 401(k)/IRA account
 * withdrawal claiming the exclusion, are unsupported. No itemized deductions,
 * credits, the 2% net-capital-gains surtax above $350,000 FAGI, or the
 * itemized-deduction phase-out are modeled. Maryland parameters remain
 * nominal; the household's inflation/threshold-growth assumption does not
 * index them, matching the restricted New York estimate's convention.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 3400, married: 6800 };
const PENSION_EXCLUSION_MAX = 40600;
const EXEMPTION_AMOUNT = 3200;
const AGE_OR_BLIND_EXEMPTION = 1000;
const TWO_INCOME_SUBTRACTION = 1200;
/** Exemption Amount Chart (10A): each exemption is worth the amount whose AGI ceiling is the first one not below federal AGI. */
const EXEMPTION_CHART: Record<FilingStatus, readonly (readonly [number, number])[]> = {
  single: [[100000, 3200], [125000, 1600], [150000, 800]],
  married: [[150000, 3200], [175000, 1600], [200000, 800]],
};

function exemptionAllowance(input: HouseholdTaxInput, year: number, federalAgi: number) {
  const step = EXEMPTION_CHART[input.filing].find(([ceiling]) => federalAgi <= ceiling);
  let total = input.people.length * (step ? Math.min(step[1], EXEMPTION_AMOUNT) : 0);
  for (const person of input.people) {
    if (person.birthDate <= `${year - 65}-12-31`) total += AGE_OR_BLIND_EXEMPTION;
    if (person.blind) total += AGE_OR_BLIND_EXEMPTION;
  }
  return total;
}

const STATE_BRACKETS: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [
    { upTo: 1000, rate: .02 }, { upTo: 2000, rate: .03 }, { upTo: 3000, rate: .04 }, { upTo: 100000, rate: .0475 },
    { upTo: 125000, rate: .05 }, { upTo: 150000, rate: .0525 }, { upTo: 250000, rate: .055 }, { upTo: 500000, rate: .0575 },
    { upTo: 1000000, rate: .0625 }, { upTo: Infinity, rate: .065 },
  ],
  married: [
    { upTo: 1000, rate: .02 }, { upTo: 2000, rate: .03 }, { upTo: 3000, rate: .04 }, { upTo: 150000, rate: .0475 },
    { upTo: 175000, rate: .05 }, { upTo: 225000, rate: .0525 }, { upTo: 300000, rate: .055 }, { upTo: 600000, rate: .0575 },
    { upTo: 1200000, rate: .0625 }, { upTo: Infinity, rate: .065 },
  ],
};

type LocalRate =
  | Readonly<{ kind: "flat"; rate: number }>
  | Readonly<{ kind: "bracket"; single: readonly { upTo: number; rate: number }[]; married: readonly { upTo: number; rate: number }[] }>;

/** Every Maryland cityId this planner rates; every other Maryland location, including "other-md", is unsupported. */
const LOCAL_RATES: Record<string, LocalRate> = {
  "baltimore-md": { kind: "flat", rate: .032 },
  "rockville-md": { kind: "flat", rate: .032 }, // Montgomery County.
  "frederick-md": { kind: "bracket",
    single: [{ upTo: 25000, rate: .0225 }, { upTo: 50000, rate: .0275 }, { upTo: 150000, rate: .0296 }, { upTo: Infinity, rate: .032 }],
    married: [{ upTo: 25000, rate: .0225 }, { upTo: 100000, rate: .0275 }, { upTo: 250000, rate: .0296 }, { upTo: Infinity, rate: .032 }] },
};

function localTaxAmount(cityId: string, filing: FilingStatus, taxable: number) {
  const local = LOCAL_RATES[cityId];
  if (!local) throw new RangeError("Choose a supported Maryland location; this planner rates only Baltimore City, Frederick County and Montgomery County.");
  return local.kind === "flat" ? taxable * local.rate : sumBrackets(taxable, [...local[filing]]);
}

/** Worksheet 13A: cap each owner's own qualifying pension at the annual maximum,
 * then reduce (not below zero) by that owner's own gross Social Security and
 * Railroad Retirement benefits. Unused capacity does not transfer between owners. */
function ownerPensionExclusions(input: HouseholdTaxInput, year: number) {
  const grossSocialSecurity = new Map(input.people.map(person => [person.id, 0]));
  const qualifyingPension = new Map(input.people.map(person => [person.id, 0]));
  for (const item of input.income) {
    if (item.kind === "social-security") grossSocialSecurity.set(item.ownerId, grossSocialSecurity.get(item.ownerId)! + item.amount);
    else if (item.kind === "pension") qualifyingPension.set(item.ownerId, qualifyingPension.get(item.ownerId)! + item.amount);
  }
  const byOwner = new Map<string, number>();
  for (const person of input.people) {
    byOwner.set(person.id, 0);
    const ageEligible = person.birthDate <= `${year - 65}-12-31`;
    if (!ageEligible) continue; // Disability-based eligibility for under-65 owners is unsupported.
    const capped = Math.min(qualifyingPension.get(person.id)!, PENSION_EXCLUSION_MAX);
    byOwner.set(person.id, Math.max(0, capped - grossSocialSecurity.get(person.id)!));
  }
  return byOwner;
}

/** Worksheet 13D: for a joint return of two owners, the lesser of $1,200 and the smaller spouse's own income less
 * that spouse's pension exclusion, floored at zero. Income this planner cannot attribute to an owner is left out. */
function twoIncomeSubtraction(input: HouseholdTaxInput, exclusions: Map<string, number>, retirementOrdinary: number) {
  if (input.filing !== "married" || input.people.length !== 2) return 0;
  const retirement = ownerRetirementIncome(input, retirementOrdinary, "Maryland");
  const attributed = new Set(["wages", "pension", "other", "interest", "qualified-dividends", "nonqualified-dividends"]);
  const shares = input.people.map(person => {
    const ordinary = input.income.filter(item => item.ownerId === person.id && attributed.has(item.kind)).reduce((sum, item) => sum + item.amount, 0);
    const deferrals = (input.pretax401k ?? []).filter(item => item.ownerId === person.id).reduce((sum, item) => sum + item.amount, 0);
    const iraDeduction = (input.deductibleIra ?? []).filter(item => item.ownerId === person.id).reduce((sum, item) => sum + item.amount, 0);
    return ordinary - deferrals - iraDeduction + retirement.get(person.id)! - exclusions.get(person.id)!;
  });
  return Math.min(TWO_INCOME_SUBTRACTION, Math.max(0, Math.min(...shares)));
}

export function marylandTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.marylandContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Maryland planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Maryland projection year.");
  const exclusions = ownerPensionExclusions(input, input.year);
  const exclusion = [...exclusions.values()].reduce((sum, value) => sum + value, 0);
  const mdAgi = federalAgi - taxableBenefits - exclusion - twoIncomeSubtraction(input, exclusions, retirementOrdinary);
  const exemptions = exemptionAllowance(input, input.year, federalAgi);
  const taxable = Math.max(0, mdAgi - STANDARD_DEDUCTION[input.filing] - exemptions);
  const stateTax = sumBrackets(taxable, STATE_BRACKETS[input.filing]);
  const localTax = localTaxAmount(input.cityId ?? "", input.filing, taxable);
  return {
    stateTax, localTax, mdAgi, pensionExclusion: exclusion, exemptions,
    warning: "Maryland pre-credit estimate: enacted 2026 state brackets and local rates (reviewed 2026-09-10), a "
      + `$${STANDARD_DEDUCTION[input.filing].toLocaleString()} standard deduction, and Social Security fully excluded. `
      + "The pension exclusion applies only to income entered as \"pension\" for owners 65 or older by year end, capped "
      + `at $${PENSION_EXCLUSION_MAX.toLocaleString()} and reduced by that owner's own Social Security; disability-based `
      + "eligibility and 401(k)/IRA account withdrawals are not eligible here. Only Baltimore City, Frederick County and "
      + "Montgomery County are rated. Personal exemptions of $3,200 per taxpayer and spouse (reduced above $100,000 federal AGI for single filers and $150,000 for joint filers, and eliminated above $150,000 and $200,000), plus $1,000 for each owner who is 65 or older or blind, which the phase-out does not reduce, are subtracted; the $1,200 two-income married subtraction is based on each spouse's own wages, pension, other income, interest, dividends and retirement-account distributions, so income from taxable-account gains, which this planner does not attribute to an owner, can understate it. The 2% net-capital-gains surtax above $350,000 FAGI, itemized deductions, credits "
      + "and the itemized-deduction phase-out are excluded. Maryland parameters are not inflation-indexed in this model. "
      + "Future legislation is not predicted. Not a tax return.",
  };
}
