import type { HouseholdTaxInput } from "./householdTax";
import { retirementIncomeFromSources } from "./ownerRetirementIncome";

/** Restricted, exemption-allowance, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-23 against:
 * - Illinois Department of Revenue, 2025 Form IL-1040 Instructions (R-02/25):
 *   the flat 4.95% (.0495) income tax rate; the $2,850 single / $5,700 MFJ
 *   2025 exemption allowance (Step 4, Line 10a); the additional $1,000 per
 *   box for age 65+ and for legal blindness (Line 10b/10c); and the hard
 *   income-based elimination of the entire exemption allowance (not a
 *   gradual phase-out) above $250,000 federal AGI (single/HOH/MFS/widowed)
 *   or $500,000 (MFJ).
 *   https://tax.illinois.gov/content/dam/soi/en/web/tax/forms/incometax/documents/currentyear/individual/il-1040-instr.pdf
 * - Illinois Department of Revenue, Informational Bulletin FY 2026-15: the
 *   2026 personal exemption amount of $2,925. The exemption allowance is a
 *   per-person amount (35 ILCS 5/204: the exemption is multiplied by the number
 *   of exemptions), so a married couple filing jointly gets two, $5,850 -- the
 *   same 2x relationship the confirmed 2025 figures show ($2,850 per person,
 *   $5,700 for a couple).
 *   https://tax.illinois.gov/research/publications/bulletins/fy-2026-15.html
 * - Illinois Department of Revenue, Publication 120, Retirement Income, and
 *   the IL-1040 instructions' Line 5: comprehensively subtracts federally
 *   taxed Social Security, qualified employee benefit plan (401(k), SEP,
 *   government/military pension, railroad retirement, IRC 457 deferred
 *   compensation) and traditional/Roth IRA income, with NO age requirement.
 *   https://tax.illinois.gov/research/publications/pubs/retirement-income.html
 *
 * Uses enacted law, not a prediction of future legislation. Illinois has no
 * local income tax; localTax is always zero. The pension subtraction applies
 * to any income entered as "pension," at any owner age (Illinois imposes no
 * age test, unlike Maryland or Indiana), and to this planner's aggregate
 * owner-attributed 401(k)/IRA distributions (including taxable conversions).
 * Nonqualified annuity withdrawals, which Illinois's subtraction does not
 * reach, are kept taxable. Government/military pension income reported as
 * federal wages, state/local deferred-compensation plans, and the lump-sum
 * employer-securities capital-gain subtraction are not modeled: this
 * planner's "wages" and "other" income kinds are always fully taxed. No
 * itemized deductions or credits are modeled. Illinois parameters remain
 * nominal; the household's inflation/threshold-growth assumption does not
 * index them, matching the restricted New York, Maryland, Indiana and DC
 * estimates' convention.
 */

const STATE_RATE = .0495;
// Illinois subtracts qualified-plan and IRA income; nonqualified annuity withdrawals are not eligible.
const QUALIFYING_SOURCES = ["traditional-ira", "ira-conversion", "401k", "plan-conversion", "roth-401k", "roth-ira"] as const;
const BASE_EXEMPTION: Record<"single" | "married", number> = { single: 2925, married: 5850 };
const AGE_OR_BLIND_EXEMPTION = 1000;
const ELIMINATION_AGI: Record<"single" | "married", number> = { single: 250000, married: 500000 };

function isAged(birthDate: string, year: number) {
  return birthDate <= `${year - 65}-12-31`;
}

function pensionSubtraction(input: HouseholdTaxInput) {
  return input.income.filter(item => item.kind === "pension").reduce((sum, item) => sum + item.amount, 0);
}

function exemptionAllowance(input: HouseholdTaxInput, year: number, federalAgi: number) {
  if (federalAgi > ELIMINATION_AGI[input.filing]) return 0;
  let total = BASE_EXEMPTION[input.filing];
  for (const person of input.people) {
    if (isAged(person.birthDate, year)) total += AGE_OR_BLIND_EXEMPTION;
    if (person.blind) total += AGE_OR_BLIND_EXEMPTION;
  }
  return total;
}

export function illinoisTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, retirementOrdinary: number) {
  if (input.illinoisContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Illinois planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Illinois projection year.");
  const subtraction = pensionSubtraction(input) + retirementIncomeFromSources(input, retirementOrdinary, "Illinois", QUALIFYING_SOURCES);
  const ilAgi = federalAgi - taxableBenefits - subtraction;
  const taxable = Math.max(0, ilAgi - exemptionAllowance(input, input.year, federalAgi));
  const stateTax = taxable * STATE_RATE;
  return {
    stateTax, localTax: 0, ilAgi, pensionSubtraction: subtraction,
    warning: "Illinois pre-credit estimate: enacted flat 4.95% rate, a 2026 exemption allowance ($2,925 single/$5,850 married, "
      + "plus $1,000 per age-65-or-blind box, entirely eliminated above $250,000/$500,000 federal AGI), and Social Security "
      + "fully excluded. Income entered as \"pension,\" at any owner age, and this planner's aggregate 401(k)/IRA/annuity "
      + "distribution figure are both fully subtracted; nonqualified annuity withdrawals are not eligible and stay taxable. Government pension income "
      + "reported as wages and deferred-compensation plans are not modeled. Illinois has no local income tax. Itemized "
      + "deductions and credits are excluded. Illinois parameters are not inflation-indexed in this model. Future legislation "
      + "is not predicted. Not a tax return.",
  };
}
