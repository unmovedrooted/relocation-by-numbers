import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { stateSocialSecurityInclusion } from "./stateSocialSecurityCoverage";
import { ownerRetirementIncome } from "./ownerRetirementIncome";

/** Restricted, own-standard-deduction, PRE-CREDIT planning estimate. Rates and
 * thresholds reviewed 2026-09-24 against the Rhode Island Division of
 * Taxation:
 * - ADV 2025-22, "Inflation-adjusted amounts set for Tax Year 2026"
 *   (2025-11-03): the uniform (filing-status-independent) bracket schedule
 *   (3.75% to $82,050, 4.75% to $186,450, 5.99% above), the standard
 *   deduction ($11,200 single/$22,400 married), the $5,250 personal/
 *   dependency exemption, and the standard-deduction-and-exemption phase-out
 *   range ($261,000-$290,800 modified federal AGI, in a $7,450 increment).
 *   The Division's 2025 Tax Rate and Worksheets (read 2026-10-04,
 *   https://tax.ri.gov/sites/g/files/xkgbur541/files/2026-01/2025%20Tax%20Rate%20and%20Worksheets.pdf)
 *   gives the mechanic: subtract the threshold from modified federal AGI; if the
 *   result is more than four increments the amount is zero; otherwise divide by
 *   the increment, round up to 1-4 and keep 0.8000, 0.6000, 0.4000 or 0.2000 of
 *   the amount. That is 20% steps, not the 25% steps an earlier version of this
 *   module inferred; the same fraction applies to the deduction and the exemption.
 *   https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-11/ADV_2025_22_Inflation_Adjustments.pdf
 * - The 2025 RI-1040 Resident instructions (Schedule M, lines 1s/1t): the
 *   Social Security and pension/401(k)/annuity modifications, both gated on
 *   (a) reaching SSA full retirement age and (b) federal AGI under $107,000
 *   (single/MFS/HOH) or $133,750 (married-joint/QW). Rhode Island's 2026
 *   figures for these two modifications were not yet published as of this
 *   review; this planner uses the most recently published (2025) figures as
 *   the 2026 base, disclosed here rather than silently relabeled. This
 *   planner reuses the already-verified stateSocialSecurityInclusion Rhode
 *   Island branch for the Social Security side, allocating each owner's
 *   share by gross benefits and excluding only a qualifying owner's own
 *   share. The pension modification is per owner (up to $50,000 of income
 *   entered as annual pension for that owner alone), summed across owners
 *   who individually qualify. Per the Division's Retirement Income Tax Guide (PUB 2024-01, read 2026-10-04) the
 *   modification also covers 401(k), 403(b), 457(b), profit-sharing and annuity-contract income reported on Form
 *   1040 line 5b, and never IRA income (line 4b) of any kind, so the owner's own attributed 401(k), plan-conversion
 *   and annuity distributions join that owner's pension income under the same $50,000 cap.
 *   https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-12/2025%201040R%20Instructions%20122025.pdf
 *
 * 2026 session (checked 2026-10-04): Article 6 of the FY2027 budget, 2026-H 7127 Substitute A as amended
 * (signed 2026-06-12; text read from
 * https://webserver.rilegislature.gov/BillText/BillText26/HouseText26/H7127Aaa.pdf, with the Senate Fiscal Office
 * as-enacted analysis) changes two things modeled here:
 * - A high-income surtax (RIGL 44-30-2.6(c)(3)(A)(I)(2)) on Rhode Island taxable income over $1,000,000:
 *   1% for tax year 2027, 2% for 2028, 3% from 2029 on, so the top rate reaches 8.99%. From 2028 the
 *   $1,000,000 is inflation-adjusted from a 2026 base; that adjustment is not forecast, so $1,000,000 is held.
 * - From tax year 2027 the Social Security modification (44-30-12(c)(8)(ii)) no longer requires the taxpayer
 *   to have reached full retirement age; it keeps the same indexed $80,000/$100,000 (base) income limits.
 *   The pension/annuity modification (c)(9) keeps its full-retirement-age requirement.
 * The article also adds a $330-per-child refundable credit and a tax amnesty, which are not modeled.
 *
 * Uses enacted law, not a prediction of future legislation. Rhode Island has
 * no local income tax; localTax is always zero. Full retirement age is
 * computed from the SSA's birth-year schedule (65 for 1937 or earlier,
 * rising two months per year to 67 for 1960 or later) and tested at
 * calendar-year end, a close but not day-precise match for Rhode Island's
 * own worksheet cutoff (e.g. "born on or before March 1" for the 2025
 * modification). All entered tax-exempt interest is added back as Rhode
 * Island-taxable, since this planner cannot identify Rhode Island-specific
 * municipal bonds, and interest from U.S. obligations is not separately
 * tracked or subtracted. Railroad retirement and the separate military
 * service pension modification are not modeled, since this planner cannot
 * identify either income source. Only single and married-filing-jointly are
 * supported. No credits are modeled. Rhode Island's own dollar figures used
 * here are not further inflation-indexed in this model, matching the
 * restricted New York, Maryland, Indiana, DC, Illinois, New Jersey,
 * Pennsylvania, Colorado, New Mexico, Minnesota, Utah, Connecticut, Vermont
 * and Montana estimates' convention.
 */

const STANDARD_DEDUCTION: Record<FilingStatus, number> = { single: 11200, married: 22400 };
const PERSONAL_EXEMPTION = 5250;
const PHASE_LOWER = 261000;
const PHASE_INCREMENT = 7450;
const MODIFICATION_THRESHOLD: Record<FilingStatus, number> = { single: 107000, married: 133750 };
const PENSION_CAP_PER_PERSON = 50000;
/** Line 5b sources: workplace plans and annuities qualify; every IRA source does not. */
const PLAN_SOURCES = ["401k", "roth-401k", "plan-conversion", "annuity"];
const SURTAX_THRESHOLD = 1000000;

/** 44-30-2.6(c)(3)(A)(I)(2): 1% for 2027, 2% for 2028, 3% from 2029; none before 2027. */
function surtaxRate(year: number) {
  if (year < 2027) return 0;
  return year === 2027 ? .01 : year === 2028 ? .02 : .03;
}

const STATE_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 82050, rate: .0375 }, { upTo: 186450, rate: .0475 }, { upTo: Infinity, rate: .0599 },
];

function fullRetirementAgeMonths(birthYear: number) {
  if (birthYear <= 1937) return 65 * 12;
  if (birthYear <= 1942) return 65 * 12 + (birthYear - 1937) * 2;
  if (birthYear <= 1954) return 66 * 12;
  if (birthYear <= 1959) return 66 * 12 + (birthYear - 1954) * 2;
  return 67 * 12;
}

function reachedFullRetirementAge(birthDate: string, year: number) {
  const [birthYear, birthMonth] = birthDate.split("-").map(Number);
  const birthMonthIndex = birthYear * 12 + (birthMonth - 1);
  return birthMonthIndex + fullRetirementAgeMonths(birthYear) <= year * 12 + 11;
}

function phaseFraction(modifiedAgi: number) {
  if (modifiedAgi <= PHASE_LOWER) return 1;
  const steps = Math.ceil((modifiedAgi - PHASE_LOWER) / PHASE_INCREMENT);
  // RI worksheet chart: 1 -> 0.8, 2 -> 0.6, 3 -> 0.4, 4 -> 0.2; more than four increments -> 0.
  return steps > 4 ? 0 : 1 - steps * 0.2;
}

export function rhodeIslandTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, taxExemptInterest: number, retirementOrdinary = 0) {
  if (input.rhodeIslandContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Rhode Island planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Rhode Island projection year.");
  const grossBenefits = input.income.filter(item => item.kind === "social-security").reduce((sum, item) => sum + item.amount, 0);
  const owners = input.people.map(person => ({
    // From 2027 the Social Security modification has no full-retirement-age requirement (the pension one still does).
    reachedFullRetirementAge: input.year >= 2027 || reachedFullRetirementAge(person.birthDate, input.year),
    grossBenefits: input.income.filter(item => item.kind === "social-security" && item.ownerId === person.id).reduce((sum, item) => sum + item.amount, 0),
  }));
  const ssResult = stateSocialSecurityInclusion({
    state: "ri", year: input.year, futurePolicy: input.year > 2026 ? "hold-2026-law" : undefined,
    filing: input.filing === "married" ? "married-joint" : "single", federalAgi, grossBenefits,
    federallyTaxableBenefits: taxableBenefits, ri: { owners },
  });
  const socialSecuritySubtraction = taxableBenefits - ssResult.taxableBenefits!;
  ownerRetirementIncome(input, retirementOrdinary, "Rhode Island"); // fails closed unless the owner-level records reconcile
  const planIncome = (ownerId: string) => (input.retirementIncome ?? [])
    .filter(item => item.ownerId === ownerId && PLAN_SOURCES.includes(item.source)).reduce((sum, item) => sum + item.amount, 0);
  const threshold = MODIFICATION_THRESHOLD[input.filing];
  const pensionSubtraction = federalAgi < threshold
    ? input.people.reduce((sum, person) => {
        if (!reachedFullRetirementAge(person.birthDate, input.year)) return sum;
        const pension = input.income.filter(item => item.kind === "pension" && item.ownerId === person.id).reduce((s, item) => s + item.amount, 0);
        return sum + Math.min(pension + planIncome(person.id), PENSION_CAP_PER_PERSON);
      }, 0)
    : 0;
  const modifiedAgi = federalAgi + taxExemptInterest - socialSecuritySubtraction - pensionSubtraction;
  const deduction = (STANDARD_DEDUCTION[input.filing] + PERSONAL_EXEMPTION * (input.filing === "married" ? 2 : 1)) * phaseFraction(modifiedAgi);
  const taxable = Math.max(0, modifiedAgi - deduction);
  const highIncomeSurtax = Math.max(0, taxable - SURTAX_THRESHOLD) * surtaxRate(input.year);
  const stateTax = sumBrackets(taxable, STATE_BRACKETS) + highIncomeSurtax;
  return {
    stateTax, localTax: 0, socialSecuritySubtraction, pensionSubtraction, deductionUsed: deduction, highIncomeSurtax,
    warning: "Rhode Island pre-credit estimate: the uniform 2026 bracket schedule (3.75%/4.75%/5.99%, reviewed 2026-09-24), "
      + "Rhode Island's own standard deduction ($11,200 single/$22,400 married) and $5,250-per-person exemption, phased out "
      + "by 20% for each $7,450 (or part) of modified federal AGI over $261,000, and to zero above $290,800, as the Division's "
      + "phase-out worksheet specifies). Pension/401(k)/annuity income (entered as annual "
      + "pension, capped at $50,000 per owner) is excluded only for an owner who has reached SSA full retirement age "
      + "(computed from birth year, not day-precise). " + "It also counts each owner's own attributed 401(k), 403(b), workplace-plan conversion and nonqualified annuity distributions, which the Division lists as qualifying pension and annuity income, but not IRA income of any kind (traditional, Roth, SEP or SIMPLE), which it says never qualifies." + " Social Security is excluded likewise through 2026 and without the age "
      + "requirement from 2027 (2026 budget), in each case while household federal AGI stays under $107,000 (single/MFS/HOH) or "
      + "$133,750 (married-joint); these dollar thresholds are Rhode Island's most recently published (2025) figures, since "
      + "2026 figures were not yet published as of this review. All entered tax-exempt interest is added back as Rhode "
      + "Island-taxable, since this planner cannot identify Rhode Island-specific municipal bonds. Railroad retirement and "
      + "the separate military service pension modification are not modeled. A high-income surtax of 1% (2027), 2% (2028) and 3% (2029 on) applies to taxable income over $1,000,000, held at "
      + "$1,000,000 although it is inflation-adjusted from 2028. Rhode Island has no local income tax. Only "
      + "single and married-filing-jointly are supported. No credits are modeled, including the new child tax credit. Rhode Island's dollar figures are not "
      + "further inflation-indexed in this model. Future legislation is not predicted. Not a tax return.",
  };
}
