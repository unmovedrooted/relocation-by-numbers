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

export function washingtonTax(input: HouseholdTaxInput, netLongTermGain: number) {
  if (input.washingtonContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Washington planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Washington projection year.");
  const taxableGain = Math.max(0, Math.max(0, netLongTermGain) - STANDARD_DEDUCTION);
  const stateTax = taxableGain * BASE_RATE + Math.max(0, taxableGain - SURTAX_THRESHOLD) * SURTAX_RATE;
  return {
    stateTax, localTax: 0, taxableGain,
    warning: "Washington pre-credit estimate: Washington has no individual income tax, but imposes a 7% excise tax on "
      + "long-term capital gains above a $278,000 standard deduction (the latest published figure, for 2025, held here "
      + "pending Washington's 2026 inflation adjustment), plus an additional 2.9% on the portion of taxable gain exceeding "
      + "$1,000,000 (enacted for 2025 and later). The deduction is shared by a married couple, not doubled. Retirement "
      + "account distributions and real estate sales are never capital gains in this planner and are excluded exactly as "
      + "Washington law requires; this planner's own net long-term capital gain figure is used directly, with no separate "
      + "small-business, timber, livestock, condemnation, commercial-fishing or charitable-gift adjustment modeled. Wages, "
      + "pensions, Social Security, interest, dividends and short-term capital gains are not taxed at all. Future "
      + "legislation is not predicted. Not a tax return.",
  };
}
