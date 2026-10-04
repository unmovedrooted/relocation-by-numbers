import { sumBrackets, type FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";
import { ageAtYearEnd } from "./rules";

/** Restricted, federal-taxable-income-conformed, PRE-CREDIT planning estimate.
 * Rates and thresholds reviewed 2026-09-24 against the Montana Department of
 * Revenue's 2025 Form 2 Individual Income Tax Instructions:
 * - Montana starts from FEDERAL TAXABLE INCOME, not federal AGI directly:
 *   Form 2, Line 1 is federal AGI, Line 2 is the federal standard or itemized
 *   deduction plus the Form 1040 Schedule 1-A additional deductions
 *   (including the temporary enhanced senior deduction), and Line 3 removes
 *   that deduction from AGI -- explicitly excluding the federal qualified
 *   business income deduction, which this planner never computes anyway.
 *   Montana has no separate state standard deduction or personal exemption.
 * - Line 6: an age-65 subtraction for each spouse 65 or older by year end,
 *   $5,500 in statute (MCA 15-30-2120(3)(g)) multiplied each year by the inflation
 *   factor (June CPI of the previous year over June 2023 CPI, MCA 15-30-2101(12);
 *   BLS CPI-U US city average, not seasonally adjusted) and rounded to the nearest
 *   $10 (15-30-2120(7)). That formula reproduces the published 2025 figure (,500 x
 *   314.175/305.109 = 5,663 -> $5,660, Form 2 instructions line 6). For 2026 it gives
 *   $5,500 x 322.561/305.109 = 5,814.60 -> $5,810. The Department had not published the
 *   2026 amount in any document available on 2026-10-04, so $5,810 is statute-derived;
 *   replace it with the published figure when released. Later years hold $5,810.
 * - The enacted two-bracket ordinary-income schedules (House Bill 337, per
 *   the Department of Revenue's "HB337: 2026-2027 Montana Individual Income
 *   Tax Changes", https://revenue.mt.gov/news/recent-news/HB-337): tax year
 *   2026 is 4.7% up to $47,500 (single/MFS) or $95,000 (married filing
 *   jointly) and 5.65% above; tax year 2027 and later is 4.7% up to
 *   $65,000 (single/MFS) or $130,000 (married filing jointly) and 5.4%
 *   above. MCA 15-30-2103 (effective 2027) indexes these brackets annually
 *   from tax year 2028 by a CPI-based modified inflation factor; that
 *   indexing is not forecast, so the 2027 schedule is held for later years.
 * - Net long-term capital gains (MCA 15-30-2103(2); Form 2 instructions pages
 *   11-12 and 42, "Montana Individual Income Tax Calculation"): gains are
 *   taxed apart from ordinary income. Ordinary income is Montana taxable
 *   income less the gains (qualified dividends and short-term gains stay
 *   ordinary). Gains are taxed at 3.0% up to the first-bracket threshold
 *   (the same $47,500/$95,000 for 2026, $65,000/$130,000 from 2027) minus
 *   that ordinary income, and 4.1% above it; when ordinary income already
 *   reaches the threshold every gain dollar is taxed at 4.1%. The gain used
 *   is the lesser of Schedule D line 15 and line 16, which this planner
 *   passes in as its net long-term gain limited to net capital gain.
 * - Social Security is federal-inclusion in Montana (no state-level
 *   exemption or credit), so it is already reflected in federal AGI with no
 *   Montana-specific adjustment needed.
 * https://revenue.mt.gov/files/forms/Montana-Individual-Income-Tax-Return-Form-2-Instructions/2025_Montana_Individual_Income_Tax_Return_Form_2_Instructions.pdf
 *
 * Uses enacted law, not a prediction of future legislation. Montana has no
 * local income tax; localTax is always zero. Montana source-income
 * apportionment for part-year residents and the Montana-specific capital
 * gain subtractions (Schedule I line 21 codes SE, SJ, SO, SG) are not
 * modeled. The working-military-retiree and military-survivor-benefit
 * subtraction (up to 50% of military retirement income, gated by specific
 * residency-history eligibility this planner cannot verify) is not modeled,
 * understating the benefit for such households. Montana's Schedule I
 * miscellaneous additions/subtractions (out-of-state municipal bond
 * interest, U.S. obligation interest, MSA and 529/ABLE contributions,
 * railroad retirement) are not modeled. Only single and married-filing-
 * jointly are supported. No credits are modeled. Montana parameters are not
 * inflation-indexed in this model, matching the restricted New York,
 * Maryland, Indiana, DC, Illinois, New Jersey, Pennsylvania, Colorado, New
 * Mexico, Minnesota, Utah, Connecticut and Vermont estimates' convention.
 */

// Statute-derived 2026 amount (see header); later years are held, not forecast.
const AGE_SUBTRACTION_PER_PERSON = 5810;
const CAPITAL_GAIN_LOW_RATE = .03;
const CAPITAL_GAIN_HIGH_RATE = .041;

const STATE_BRACKETS_2026: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [{ upTo: 47500, rate: .047 }, { upTo: Infinity, rate: .0565 }],
  married: [{ upTo: 95000, rate: .047 }, { upTo: Infinity, rate: .0565 }],
};
const STATE_BRACKETS_2027: Record<FilingStatus, { upTo: number; rate: number }[]> = {
  single: [{ upTo: 65000, rate: .047 }, { upTo: Infinity, rate: .054 }],
  married: [{ upTo: 130000, rate: .047 }, { upTo: Infinity, rate: .054 }],
};

export function montanaTax(input: HouseholdTaxInput, agi: number, standardDeduction: number, seniorDeduction: number, netLongTermGain = 0) {
  if (input.montanaContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Montana planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Montana projection year.");
  const ageSubtraction = input.people.filter(person => ageAtYearEnd(person.birthDate, input.year) >= 65).length * AGE_SUBTRACTION_PER_PERSON;
  const taxable = Math.max(0, agi - standardDeduction - seniorDeduction - ageSubtraction);
  if (!Number.isFinite(netLongTermGain) || netLongTermGain < 0) throw new RangeError("Invalid Montana net long-term capital gain.");
  const brackets = (input.year >= 2027 ? STATE_BRACKETS_2027 : STATE_BRACKETS_2026)[input.filing];
  const gain = Math.min(netLongTermGain, taxable);
  const ordinaryIncome = taxable - gain;
  const threshold = brackets[0].upTo;
  const gainAtLowRate = Math.min(gain, Math.max(0, threshold - ordinaryIncome));
  const capitalGainsTax = gainAtLowRate * CAPITAL_GAIN_LOW_RATE + (gain - gainAtLowRate) * CAPITAL_GAIN_HIGH_RATE;
  const stateTax = sumBrackets(ordinaryIncome, brackets) + capitalGainsTax;
  return {
    stateTax, localTax: 0, ageSubtraction, capitalGainsTax,
    warning: "Montana pre-credit estimate: starts from federal taxable income (federal AGI less the federal standard/"
      + "itemized deduction and Schedule 1-A additional deductions, excluding the QBI deduction), since Montana has no "
      + "separate state standard deduction or personal exemption. A $5,810 subtraction applies for each spouse 65 or "
      + "older by year end (computed from the statutory inflation formula because the Department had not yet published "
      + "the 2026 amount; the published 2025 amount was $5,660, and later years hold $5,810). The enacted two-"
      + "bracket schedule applies (4.7%/5.65% for 2026; the already-enacted 4.7%/5.4% schedule with wider brackets from "
      + "2027, held for later years without the annual inflation indexing that starts in 2028). Net long-term capital "
      + "gains are taxed separately at 3% up to the first-bracket threshold less ordinary income and 4.1% above it; "
      + "qualified dividends and short-term gains stay in ordinary income. Social "
      + "Security is fully taxable in Montana with no state-level exemption or credit. The working-"
      + "military-retiree and survivor-benefit subtraction is not modeled, since this planner cannot verify the specific "
      + "residency-history eligibility it requires. Montana has no local income tax. Only single and married-filing-"
      + "jointly are supported. No credits are modeled. Montana parameters are not inflation-indexed in this model. "
      + "Future legislation is not predicted. Not a tax return.",
  };
}
