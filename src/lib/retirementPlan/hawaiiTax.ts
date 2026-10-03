import type { FilingStatus } from "../tax";
import type { HouseholdTaxInput } from "./householdTax";

/**
 * Restricted, verified Hawaii resident annual settlement.
 *
 * Uses the 2026 schedule and Act 24 (2026) brackets effective 2027/2029,
 * plus Act 46 (2024) standard deductions effective 2026/2028/2030/2031.
 * Personal exemption remains $1,144 per person, plus one more for each taxpayer 65 or older. Marginal tax is calculated
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
 * mixed or unknown treatment is blocked. Traditional IRA/401(k) sources
 * must be confirmed taxable or single-source exempt employer/rollover.
 * Exempt accounts with federal basis, contributions or conversions are blocked.
 * Other account types retain their existing taxable-income treatment.
 * https://files.hawaii.gov/tax/legal/tir/1990_09/tir96-5.pdf
 *
 * Alternative tax on capital gains (2025 Form N-11 instructions, "Tax on
 * Capital Gains Worksheet", page 33, https://tax.hawaii.gov/forms/): when
 * taxable income exceeds $24,000 single or $48,000 married filing jointly,
 * the tax is the smaller of the regular tax or the regular tax on the
 * greater of (taxable income less net capital gain) and that threshold,
 * plus 7.25% of the taxable income above it. The net capital gain is the
 * smaller of the net long-term capital gain (assets held more than one
 * year) and the net capital gain, which this planner passes in from its
 * federal computation. The thresholds are statutory and Act 24 (2026) does
 * not amend them. Hawaii gain adjustments (Hawaii additions line e and
 * other lines, Form N-152 lump-sum gains) and Form N-158 are not modeled.
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
// Form N-11 lines 6a/6b: each taxpayer who is 65 or older on January 1 after the tax year claims one additional
// exemption (Form N-11 instructions, Exemptions and Line 25). The disability exemption is not modeled.
function isAge65OnNextJanuary1(birthDate: string, year: number) {
  const [y, m, d] = birthDate.split("-").map(Number);
  const turned65 = y + 65;
  return turned65 < year + 1 || (turned65 === year + 1 && m === 1 && d === 1);
}
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

// Statutory Tax on Capital Gains Worksheet (line 12) thresholds and rate; not indexed.
const CAPITAL_GAIN_THRESHOLD: Record<FilingStatus, number> = { single: 24000, married: 48000 };
const CAPITAL_GAIN_RATE = .0725;

export function hawaiiTax(input: HouseholdTaxInput, federalAgi: number, taxableBenefits: number, netLongTermGain = 0) {
  if (input.hawaiiContract !== "verified-law-precredit") throw new RangeError("Confirm the restricted Hawaii planning assumptions.");
  if (!Number.isInteger(input.year) || input.year < 2026 || input.year > 2126) throw new RangeError("Unsupported Hawaii projection year.");
  const pensionExclusion = input.income.filter(item => item.kind === "pension").reduce((sum, item) => {
    if (item.amount === 0) return sum;
    if (item.hawaiiPensionTreatment !== "exempt" && item.hawaiiPensionTreatment !== "taxable") {
      throw new RangeError("Confirm Hawaii pension treatment. Mixed or unknown pensions require an exclusion-ratio calculation not supported by this preview.");
    }
    return sum + (item.hawaiiPensionTreatment === "exempt" ? item.amount : 0);
  }, 0);
  const accountExclusion = input.hawaiiAccountExclusion ?? 0;
  if (!Number.isFinite(accountExclusion) || accountExclusion < 0 || accountExclusion > input.accountIncome.retirementOrdinary + 1e-5) {
    throw new RangeError("Invalid Hawaii account exclusion attribution.");
  }
  const hiAgi = Math.max(0, federalAgi - taxableBenefits - pensionExclusion - accountExclusion);
  const exemptions = input.people.length + input.people.filter(person => isAge65OnNextJanuary1(person.birthDate, input.year)).length;
  const exemption = PERSONAL_EXEMPTION_PER_PERSON * exemptions;
  const taxable = Math.max(0, hiAgi - standardDeduction(input.year, input.filing) - exemption);
  const futureCeilings = input.year >= 2029
    ? [19200, 24000, 36000, 48000, 125000, 175000, 225000, 275000, 325000, 500000, Infinity]
    : [14400, 19200, 24000, 36000, 48000, 125000, 175000, 225000, 275000, 325000, 500000, Infinity];
  const futureRates = input.year >= 2029
    ? [.014, .025, .05, .064, .068, .072, .0825, .09, .10, .11, .13]
    : [.014, .025, .05, .064, .068, .072, .076, .0825, .09, .10, .11, .13];
  if (!Number.isFinite(netLongTermGain) || netLongTermGain < 0) throw new RangeError("Invalid Hawaii net capital gain.");
  const regularTax = (amount: number) => input.year === 2026
    ? marginal(amount, BRACKET_CEILINGS[input.filing], BRACKET_RATES)
    : marginal(amount, futureCeilings.map(value => value * (input.filing === "married" ? 2 : 1)), futureRates);
  const fullRegularTax = regularTax(taxable);
  const threshold = CAPITAL_GAIN_THRESHOLD[input.filing];
  const gainBase = Math.max(taxable - netLongTermGain, threshold);
  const eligibleGain = taxable > threshold ? Math.max(0, taxable - gainBase) : 0;
  const alternativeTax = eligibleGain > 0 ? regularTax(gainBase) + eligibleGain * CAPITAL_GAIN_RATE : fullRegularTax;
  const stateTax = Math.min(fullRegularTax, alternativeTax);
  return {
    stateTax, localTax: 0, hiAgi, pensionExclusion, accountExclusion, eligibleGain,
    warning: "Hawaii pre-credit estimate using year-specific enacted brackets: 1.40% to 11% in 2026, "
      + "and Act 24 (2026) schedules for 2027 and 2029 onward, topping out at 13%. "
      + "Act 46 standard deductions are $8,000 single in 2026, $9,000 in 2028, $10,000 in 2030, "
      + "and $12,000 from 2031, doubled for married filing jointly, without additional inflation indexing, "
      + "and a $1,144 personal exemption per person plus one additional $1,144 exemption for each taxpayer 65 or older on January 1 after the tax year (the separate disability exemption is not modeled). Hawaii's alternative tax on net capital gains is applied when taxable income exceeds $24,000 single or $48,000 married filing jointly: the tax is the smaller of the regular tax or the regular tax on income below the gain plus 7.25% of the gain, using net long-term gains from assets held more than one year; Hawaii-specific gain adjustments are not modeled. Social Security and Railroad Retirement Tier 1 benefits are fully "
      + "exempt. Entered pensions require explicit fully-exempt or fully-taxable Hawaii treatment; mixed or unknown "
      + "treatment is blocked, not inferred from pension type. Traditional IRA/401(k) accounts require confirmed taxable "
      + "or single-source exempt employer/rollover treatment. Exempt accounts with federal basis, contributions, matches "
      + "or conversions are unsupported; mixed/unknown funding is blocked. Other account types retain existing taxable-income "
      + "treatment. Only single and married-filing-jointly are supported. Itemized deductions and credits are "
      + "excluded.",
  };
}
