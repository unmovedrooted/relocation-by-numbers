import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/**
 * Restricted, verified Hawaii resident annual settlement.
 *
 * Uses the 2026 schedule and Act 24 (2026) brackets effective 2027/2029,
 * plus Act 46 (2024) standard deductions effective 2026/2028/2030/2031.
 * Personal exemption remains $1,144 per person. Marginal tax is calculated
 * without intermediate whole-dollar rounding (small tax-table differences).
 *
 * Social Security and Railroad Retirement Act (Tier 1) benefits included in
 * federal income are fully subtracted (Form N-11, line 14), per Tax
 * Information Release No. 96-5.
 *
 * Hawaii excludes qualifying distributions from an employer-funded pension
 * plan or public retirement system (Form N-11, line 13), but taxes deferred
 * compensation plans (401(k), 403(b), SARSEP, 457(b)) and self-funded IRA or
 * annuity distributions, subject to funding-source exceptions. Entered
 * pensions require explicit fully-exempt or fully-taxable classification;
 * mixed or unknown treatment is blocked. Account distributions still use
 * the restricted fully-taxable assumption; employer-funded account portions
 * and rollover-source tracing are not modeled.
 * https://files.hawaii.gov/tax/legal/tir/1990_09/tir96-5.pdf
 */

// Act 46 (2024) deductions; Act 24 (2026) revised the future brackets,
// not these deduction increases. These are enacted amounts, not CPI forecasts.
// https://data.capitol.hawaii.gov/sessions/session2024/bills/HB2404_CD1_.HTM
// https://data.capitol.hawaii.gov/sessions/session2026/bills/SB3125_CD2_.HTM
function standardDeduction(year: number, filing: FilingStatus) {
  const single = year >= 2031 ? 12000 : year >= 2030 ? 10000 : year >= 2028 ? 9000 : 8000;
  return single * (filing === "married" ? 2 : 1);
}
const PERSONAL_EXEMPTION_PER_PERSON = 1144;
const BRACKET_CEILINGS: Record<FilingStatus, number[]> = {
  single: [9600, 14400, 19200, 24000, 36000, 48000, 125000, 175000, 225000, 275000, 325000, Infinity],
  married: [19200, 28800, 38400, 48000, 72000, 96000, 250000, 350000, 450000, 550000, 650000, Infinity],
};
const BRACKET_RATES = [.014, .032, .055, .064, .068, .072, .076, .079, .0825, .09, .10, .11];

function marginal(amount: number, ceilings: number[], rates: number[]) {
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(amount, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

export function hawaiiTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number) {
  if (input.hawaiiContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Hawaii planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Hawaii projection year.");
  const pensionExclusion = input.income.filter(item => item.kind === "pension").reduce((sum, item) => {
    if (item.amount === 0) return sum;
    if (item.hawaiiPensionTreatment !== "exempt" && item.hawaiiPensionTreatment !== "taxable") {
      throw new RangeError("Confirm Hawaii pension treatment. Mixed or unknown pensions require an exclusion-ratio calculation not supported by this preview.");
    }
    return sum + (item.hawaiiPensionTreatment === "exempt" ? item.amount : 0);
  }, 0);
  const hiAgi = Math.max(0, federalAgi - taxableBenefits - pensionExclusion);
  const exemption = PERSONAL_EXEMPTION_PER_PERSON * input.people.length;
  const taxable = Math.max(0, hiAgi - standardDeduction(input.year, input.filing) - exemption);
  const futureCeilings = input.year >= 2029
    ? [19200, 24000, 36000, 48000, 125000, 175000, 225000, 275000, 325000, 500000, Infinity]
    : [14400, 19200, 24000, 36000, 48000, 125000, 175000, 225000, 275000, 325000, 500000, Infinity];
  const futureRates = input.year >= 2029
    ? [.014, .025, .05, .064, .068, .072, .0825, .09, .10, .11, .13]
    : [.014, .025, .05, .064, .068, .072, .076, .0825, .09, .10, .11, .13];
  const stateTax = input.year === 2026
    ? marginal(taxable, BRACKET_CEILINGS[input.filing], BRACKET_RATES)
    : marginal(taxable, futureCeilings.map(value => value * (input.filing === "married" ? 2 : 1)), futureRates);
  return {
    stateTax, localTax: 0, hiAgi, pensionExclusion,
    warning: "Hawaii pre-credit estimate using year-specific enacted brackets: 1.40% to 11% in 2026, "
      + "and Act 24 (2026) schedules for 2027 and 2029 onward, topping out at 13%. "
      + "Act 46 standard deductions are $8,000 single in 2026, $9,000 in 2028, $10,000 in 2030, "
      + "and $12,000 from 2031, doubled for married filing jointly, without additional inflation indexing, "
      + "and a $1,144 personal exemption per person. Social Security and Railroad Retirement Tier 1 benefits are fully "
      + "exempt. Entered pensions require explicit fully-exempt or fully-taxable Hawaii treatment; mixed or unknown "
      + "treatment is blocked, not inferred from pension type. Account distributions remain fully taxable under the "
      + "restricted assumption: employer-funded account portions and rollover-source exemptions are not modeled, "
      + "which can overstate tax. Only single and married-filing-jointly are supported. Itemized deductions and credits are "
      + "excluded.",
  };
}
