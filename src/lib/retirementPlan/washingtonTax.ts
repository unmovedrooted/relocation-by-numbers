import type { HouseholdTaxInput } from "./householdTax";

/** Restricted, capital-gains-only excise tax, PRE-CREDIT planning estimate.
 * Washington has no individual income tax. It does impose an excise tax on
 * long-term capital gains, reviewed 2026-09-25 against:
 * - RCW 82.87.040: 7% on "Washington capital gains," plus an additional
 *   2.9% on the portion exceeding $1,000,000 (effective for tax year 2025
 *   and later, enacted by ESSB 5813 of 2025).
 * - RCW 82.87.060: a standard deduction against Washington capital gains,
 *   $250,000 in the 2022 base year, adjusted annually for inflation --
 *   $278,000 for 2025 (the latest figure the Department of Revenue has
 *   published at this review; 2026's inflation-adjusted figure had not yet
 *   been released, so this planner holds the 2025 amount, understating the
 *   deduction for 2026 and later). For a married couple or domestic
 *   partnership, this single deduction is NOT doubled -- it is shared,
 *   whether they file a joint or separate federal return.
 * - Washington Department of Revenue, capital gains tax FAQ: retirement
 *   accounts (IRAs, 401(k)s, defined-benefit plans) and real estate sales
 *   are entirely excluded from "Washington capital gains"; only long-term
 *   gains count, never short-term gains.
 *   https://dor.wa.gov/taxes-rates/other-taxes/capital-gains-tax
 *   https://lawfilesext.leg.wa.gov/law/RCW/RCW%20%2082%20%20TITLE/RCW%20%2082%20.%2087%20%20CHAPTER/RCW%20%2082%20.%2087%20.040.htm
 *   https://lawfilesext.leg.wa.gov/law/RCW/RCW%20%2082%20%20TITLE/RCW%20%2082%20.%2087%20%20CHAPTER/RCW%20%2082%20.%2087%20.060.htm
 *
 * Income tax from 2028 (checked 2026-10-04): Engrossed Substitute Senate Bill 6346 (Chapter 238, Laws
 * of 2026, signed 2026-03-30, effective 2026-06-11) imposes, beginning January 1, 2028, a 9.9% tax on
 * "Washington taxable income" (sec. 201). Washington base income is federal AGI (sec. 101) less long-term
 * capital gains and plus long-term capital losses included in AGI (sec. 302(1)-(2)), plus, for a taxpayer
 * owing the capital gains tax, the Washington capital gains taxed plus the deduction used (302(3));
 * taxable income then subtracts a $1,000,000 standard deduction shared by spouses (sec. 314) and up to
 * $100,000 of charitable contributions (sec. 309). A nonrefundable credit is allowed for the capital gains
 * tax paid (sec. 205). The deduction is indexed by CPI in October of odd years from 2029 (sec. 316);
 * that is not forecast, so $1,000,000 is held. The charitable deduction, the credits for other-state and
 * business and occupation taxes, the state and federal obligation modifications and nonresident rules are
 * not modeled; Social Security, pensions and retirement distributions in federal AGI are not excluded.
 * Initiative 645, certified for the November 3, 2026 ballot, would repeal this tax; the outcome is not
 * assumed, and this module follows the enacted law until the vote changes it.
 * https://lawfilesext.leg.wa.gov/biennium/2025-26/Pdf/Bills/Session%20Laws/Senate/6346-S.SL.pdf
 *
 * Uses enacted law, not a prediction of future legislation. This planner
 * uses its own net long-term capital gain figure (already net of any
 * long-term loss carryover) as the base for "Washington capital gains,"
 * since retirement-account distributions are never capital gain income in
 * this planner and are therefore already excluded exactly as RCW 82.87.020
 * requires; the separate small-business, timber, livestock, condemnation
 * and commercial-fishing exclusions are not modeled, since this planner has
 * no such income category. The charitable-gift deduction (available above
 * the standard deduction, capped at $100,000) is not modeled, since this
 * planner does not track charitable giving. A net long-term capital loss
 * results in zero tax; no loss carryforward against a future year's
 * Washington capital gains is modeled. Future legislation is not predicted.
 * Not a tax return.
 */

const STANDARD_DEDUCTION = 278000;
const SURTAX_THRESHOLD = 1000000;
const BASE_RATE = .07;
const SURTAX_RATE = .029;
/** ESSB 6346 (2026): 9.9% of Washington taxable income above a $1,000,000 shared deduction, from tax year 2028. */
const INCOME_TAX_FIRST_YEAR = 2028;
const INCOME_TAX_RATE = .099;
const INCOME_TAX_STANDARD_DEDUCTION = 1000000;

/** `federalAgi`, `netShortTermGain` and `capitalLossDeduction` are only used for the income tax from 2028. */
export function washingtonTax(input: HouseholdTaxInput, netLongTermGain: number, federalAgi = 0, netShortTermGain = 0, capitalLossDeduction = 0) {
  if (input.washingtonContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Washington planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Washington projection year.");
  const taxableGain = Math.max(0, Math.max(0, netLongTermGain) - STANDARD_DEDUCTION);
  const capitalGainsTax = taxableGain * BASE_RATE + Math.max(0, taxableGain - SURTAX_THRESHOLD) * SURTAX_RATE;
  const incomeTaxApplies = input.year >= INCOME_TAX_FIRST_YEAR;
  let incomeTax = 0, netIncomeTax = 0, baseIncome = 0;
  if (incomeTaxApplies) {
    if (![federalAgi, netShortTermGain, capitalLossDeduction].every(Number.isFinite) || capitalLossDeduction < 0) throw new RangeError("Invalid Washington income tax input.");
    const gain = Math.max(0, netLongTermGain);
    const lossInAgi = netLongTermGain < 0 ? Math.min(-netLongTermGain, Math.max(0, netShortTermGain) + capitalLossDeduction) : 0;
    baseIncome = federalAgi - gain + lossInAgi + (taxableGain > 0 ? gain : 0);
    incomeTax = Math.max(0, baseIncome - INCOME_TAX_STANDARD_DEDUCTION) * INCOME_TAX_RATE;
    netIncomeTax = Math.max(0, incomeTax - capitalGainsTax);
  }
  const stateTax = capitalGainsTax + netIncomeTax;
  return {
    stateTax, localTax: 0, taxableGain, capitalGainsTax, incomeTax, netIncomeTax, baseIncome,
    warning: "Washington pre-credit estimate: Washington has no individual income tax before 2028, but imposes a 7% excise tax on "
      + "long-term capital gains above a $278,000 standard deduction (the latest published figure, for 2025, held here "
      + "pending Washington's 2026 inflation adjustment), plus an additional 2.9% on the portion of taxable gain exceeding "
      + "$1,000,000 (enacted for 2025 and later). The deduction is shared by a married couple, not doubled. Retirement "
      + "account distributions and real estate sales are never capital gains in this planner and are excluded exactly as "
      + "Washington law requires; this planner's own net long-term capital gain figure is used directly, with no separate "
      + "small-business, timber, livestock, condemnation, commercial-fishing or charitable-gift adjustment modeled. Before "
      + "2028, wages, pensions, Social Security, interest, dividends and short-term capital gains are not taxed at all. "
      + (incomeTaxApplies ? "From 2028, Senate Bill 6346 of 2026 taxes federal adjusted gross income (including retirement distributions, "
        + "Roth conversions and taxable Social Security) above a $1,000,000 shared deduction at 9.9%, with long-term capital gains "
        + "taxed under the capital gains tax instead and a credit for that tax; the deduction is held at $1,000,000 although it "
        + "is CPI-indexed from 2029, and its charitable deduction, other credits and modifications are not modeled. Voters decide "
        + "Initiative 645, which would repeal it, on November 3, 2026, and this estimate follows the enacted law. " : "")
      + "Future legislation is not predicted. Not a tax return.",
  };
}
