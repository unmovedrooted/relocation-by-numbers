import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, exemption-credit, PRE-CREDIT (aside from the exemption credits
 * themselves) planning estimate. Rates and thresholds reviewed 2026-09-24
 * against the California Franchise Tax Board's 2025 Form 540 Personal Income
 * Tax Booklet:
 * - The nine-bracket 2025 Schedule X (single/MFS, $0-$11,079 at 1% up to
 *   $742,953 and over at 12.3%) and Schedule Y (married/RDP filing jointly,
 *   exactly double every Schedule X threshold), plus the additional 1%
 *   Mental Health Services Act tax on CA taxable income over $1,000,000 --
 *   a single, filing-status-independent threshold.
 *   https://www.ftb.ca.gov/forms/2025/2025-540-booklet.html
 * - The 2025 standard deduction ($5,706 single/$11,412 married) and the
 *   personal/blind/senior exemption CREDITS -- $153 per credit (subtracted
 *   from computed tax, not from income), confirmed the same figure for
 *   personal, blind and senior exemptions by the AGI Limitation Worksheet's
 *   shared treatment of Form 540 lines 7-9; the exact $153 figure itself is
 *   corroborated by secondary sources, not independently read from the
 *   primary form's pre-printed dollar amount. Exemption credits phase out
 *   by $6 per credit for each $2,500 (or part) of federal AGI over $252,203
 *   (single) or $504,411 (married), reaching zero at $65,000 above that
 *   threshold.
 *   https://www.ftb.ca.gov/file/personal/deductions/index.html
 * - FTB, Social Security: full exclusion from California AGI, already
 *   reflected in the household's existing federal-AGI-based Social Security
 *   subtraction convention used across every "exempt"-classification state
 *   in this planner.
 *   https://www.ftb.ca.gov/file/personal/income-types/social-security.html
 *
 * Uses enacted law, not a prediction of future legislation. California has
 * no local income tax; localTax is always zero. California gives NO special
 * exclusion for pension, 401(k), IRA or annuity income at any owner age --
 * income entered as "pension" and this planner's aggregate retirement-
 * account distribution figure are both fully taxable, unlike most other
 * verified states in this planner. Only single and married-filing-jointly
 * are supported. Itemized deductions and all credits other than the
 * personal/blind/senior exemption credits (including the Senior Head of
 * Household Credit, the renter's credit and the child/dependent care
 * credit) are excluded. California's dollar figures are not further
 * inflation-indexed in this model, matching the restricted New York,
 * Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania, Colorado, New
 * Mexico, Minnesota, Utah, Connecticut, Vermont, Montana and Rhode Island
 * estimates' convention.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 5706, married: 11412 };
const EXEMPTION_CREDIT = 153;
const EXEMPTION_PHASE_THRESHOLD: Record<FilingStatus, number> = { single: 252203, married: 504411 };
const EXEMPTION_PHASE_STEP: Record<FilingStatus, number> = { single: 2500, married: 2500 };
const MENTAL_HEALTH_SURTAX_THRESHOLD = 1000000;

const STATE_BRACKETS: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [
    { upTo: 11079, rate: .01 }, { upTo: 26264, rate: .02 }, { upTo: 41452, rate: .04 }, { upTo: 57542, rate: .06 },
    { upTo: 72724, rate: .08 }, { upTo: 371479, rate: .093 }, { upTo: 445771, rate: .103 }, { upTo: 742953, rate: .113 }, { upTo: Infinity, rate: .123 },
  ],
  married: [
    { upTo: 22158, rate: .01 }, { upTo: 52528, rate: .02 }, { upTo: 82904, rate: .04 }, { upTo: 115084, rate: .06 },
    { upTo: 145448, rate: .08 }, { upTo: 742958, rate: .093 }, { upTo: 891542, rate: .103 }, { upTo: 1485906, rate: .113 }, { upTo: Infinity, rate: .123 },
  ],
};

function exemptionCreditTotal(input: HouseholdTaxInput, federalAgi: number) {
  let count = 0;
  for (const person of input.people) {
    count += 1;
    if (person.blind) count += 1;
    if (ageAtYearEnd(person.birthDate, input.year) >= 65) count += 1;
  }
  const excess = Math.max(0, federalAgi - EXEMPTION_PHASE_THRESHOLD[input.filing]);
  const reductionPerCredit = Math.ceil(excess / EXEMPTION_PHASE_STEP[input.filing]) * 6;
  return count * Math.max(0, EXEMPTION_CREDIT - reductionPerCredit);
}

export function californiaTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.californiaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted California planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported California projection year.");
  const caAgi = federalAgi - taxableBenefits;
  const taxable = Math.max(0, caAgi - STANDARD_DEDUCTION[input.filing]);
  const surtax = Math.max(0, taxable - MENTAL_HEALTH_SURTAX_THRESHOLD) * 0.01;
  const exemptionCredit = exemptionCreditTotal(input, federalAgi);
  const stateTax = Math.max(0, sumBrackets(taxable, STATE_BRACKETS[input.filing]) + surtax - exemptionCredit);
  return {
    stateTax, localTax: 0, exemptionCredit,
    warning: "California pre-credit estimate: the enacted 2025 nine-bracket schedule (1%-12.3%, reviewed 2026-09-24) plus the "
      + "additional 1% Mental Health Services Act tax on taxable income over $1,000,000 (a single threshold, not doubled for "
      + "married filers), California's own standard deduction ($5,706 single/$11,412 married), and the $153 personal/blind/"
      + "senior exemption credit per qualifying person, phased out above $252,203 (single) or $504,411 (married) federal AGI. "
      + "Social Security is fully excluded. California gives NO special exclusion for pension, 401(k), IRA or annuity income "
      + "at any owner age; that income is fully taxable, unlike most other verified states in this planner. California has no "
      + "local income tax. Only single and married-filing-jointly are supported. Itemized deductions and all other credits "
      + "(including the Senior Head of Household Credit and the renter's credit) are excluded. California's dollar figures "
      + "are not further inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
