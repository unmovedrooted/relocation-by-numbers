import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

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
 * The 2026 MFJ/HOH/QSS standard deduction ($6,800) is not independently
 * confirmed in a fetched source; it is inferred from the exact 2x relationship
 * the enacted 2025 figures ($3,350 single / $6,700 MFJ) establish, applied to
 * the confirmed 2026 single figure ($3,400). The 2026 pension exclusion cap
 * ($40,600) is corroborated across secondary sources citing the Comptroller's
 * published 2025/2026 figures, not read directly from a fetched primary PDF.
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
function pensionExclusion(input: HouseholdTaxInput, year: number) {
  const grossSocialSecurity = new Map(input.people.map(person => [person.id, 0]));
  const qualifyingPension = new Map(input.people.map(person => [person.id, 0]));
  for (const item of input.income) {
    if (item.kind === "social-security") grossSocialSecurity.set(item.ownerId, grossSocialSecurity.get(item.ownerId)! + item.amount);
    else if (item.kind === "pension") qualifyingPension.set(item.ownerId, qualifyingPension.get(item.ownerId)! + item.amount);
  }
  let total = 0;
  for (const person of input.people) {
    const ageEligible = person.birthDate <= `${year - 65}-12-31`;
    if (!ageEligible) continue; // Disability-based eligibility for under-65 owners is unsupported.
    const capped = Math.min(qualifyingPension.get(person.id)!, PENSION_EXCLUSION_MAX);
    total += Math.max(0, capped - grossSocialSecurity.get(person.id)!);
  }
  return total;
}

export function marylandTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.marylandContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Maryland planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Maryland projection year.");
  const exclusion = pensionExclusion(input, input.year);
  const mdAgi = federalAgi - taxableBenefits - exclusion;
  const taxable = Math.max(0, mdAgi - STANDARD_DEDUCTION[input.filing]);
  const stateTax = sumBrackets(taxable, STATE_BRACKETS[input.filing]);
  const localTax = localTaxAmount(input.cityId ?? "", input.filing, taxable);
  return {
    stateTax, localTax, mdAgi, pensionExclusion: exclusion,
    warning: "Maryland pre-credit estimate: enacted 2026 state brackets and local rates (reviewed 2026-09-10), a "
      + `$${STANDARD_DEDUCTION[input.filing].toLocaleString()} standard deduction, and Social Security fully excluded. `
      + "The pension exclusion applies only to income entered as \"pension\" for owners 65 or older by year end, capped "
      + `at $${PENSION_EXCLUSION_MAX.toLocaleString()} and reduced by that owner's own Social Security; disability-based `
      + "eligibility and 401(k)/IRA account withdrawals are not eligible here. Only Baltimore City, Frederick County and "
      + "Montgomery County are rated. The 2% net-capital-gains surtax above $350,000 FAGI, itemized deductions, credits "
      + "and the itemized-deduction phase-out are excluded. Maryland parameters are not inflation-indexed in this model. "
      + "Future legislation is not predicted. Not a tax return.",
  };
}
