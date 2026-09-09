import { estimateNetBreakdown, sumBrackets, type FilingStatus } from "../tax";
import { STATES, type StateCode } from "../states";
import { taxCharacter, type TaxCharacter } from "./accountTax";
import { taxableSocialSecurity } from "./rules";
import { verifiedRetirementLocation } from "./verifiedLocation";
import { newYorkTax } from "./newYorkTax";

/** 2026 federal values: Rev. Proc. 2025-32, published in IRB 2025-45.
 * State estimates deliberately retain the existing 2025 proxy, not new rules.
 */
export const HOUSEHOLD_TAX_YEAR = 2026;
/** A planning assumption, not a forecast of published IRS tables. No defaults. */
export type TaxProjectionPolicy = Readonly<{
  kind: "project-2026-law";
  annualBracketGrowth: number;
  annualPayrollCapGrowth: number;
  statePolicy: "freeze-2025-proxy";
}>;

export function taxProjectionFactors(year: number, policy?: TaxProjectionPolicy) {
  if (!Number.isInteger(year) || year < 2026 || year > 2126) throw new RangeError("Supported tax years are 2026 through 2126.");
  if (!policy) {
    if (year !== 2026) throw new RangeError("Future years require an explicit tax projection policy; only 2026 is verified.");
    return { bracket: 1, payroll: 1 };
  }
  if (policy.kind !== "project-2026-law" || policy.statePolicy !== "freeze-2025-proxy") throw new RangeError("Unsupported tax projection policy.");
  for (const value of [policy.annualBracketGrowth, policy.annualPayrollCapGrowth]) {
    if (!Number.isFinite(value) || value < 0 || value > 0.2) throw new RangeError("Tax projection growth must be a decimal from 0 to 0.2.");
  }
  return { bracket: (1 + policy.annualBracketGrowth) ** (year - 2026),
    payroll: (1 + policy.annualPayrollCapGrowth) ** (year - 2026) };
}
const ORDINARY_LIMITS = {
  single: [12400, 50400, 105700, 201775, 256225, 640600, Infinity],
  married: [24800, 100800, 211400, 403550, 512450, 768700, Infinity],
};
const RATES = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
/** Shared ceiling for policy evaluation; uses the same table as settlement. */
export function conversionBracketCeiling(filing: FilingStatus, year: number, rate: 12 | 22 | 24, policy: TaxProjectionPolicy) {
  if (![12,22,24].includes(rate)) throw new RangeError("Unsupported conversion bracket.");
  return ORDINARY_LIMITS[filing][RATES.indexOf(rate / 100)] * taxProjectionFactors(year, policy).bracket;
}
const CAPITAL_LIMITS = { single: [49450, 545500], married: [98900, 613700] };

export type TaxPerson = Readonly<{
  id: string;
  birthDate: string;
  blind: boolean;
  /** Eligibility flag only. Never collect an actual Social Security number. */
  eligibleForSeniorDeduction: boolean;
}>;
export type HouseholdIncome = Readonly<{
  ownerId: string;
  /** Explicit classification for state rules; does not alter federal character. */
  pensionType?: "unspecified" | "private" | "ny-government" | "federal-government" | "other-government";
  /** Portion on/after age 59½, using the timeline's daily proration assumption.
   * Subset of amount, never additional federal income. */
  pensionAfter59Half?: number;
  /** Wages: gross employment cash before tax/deferrals; pretax401k is separate.
   * Pension/other: fully taxable cash. Special exclusions need a separate path.
   */
  kind: "wages" | "pension" | "social-security" | "other" | "interest" |
    "qualified-dividends" | "nonqualified-dividends" | "tax-exempt-interest";
  amount: number;
}>;
export type CapitalLossCarryover = Readonly<{ shortTerm: number; longTerm: number }>;
/** Taxable federal amount, not gross cash; provenance for state exclusions. */
export type RetirementIncomeItem = Readonly<{
  ownerId: string;
  date: string;
  source: "traditional-ira" | "ira-conversion" | "401k" | "plan-conversion" | "roth-401k" | "roth-ira" | "annuity";
  amount: number;
}>;
export type HouseholdTaxInput = Readonly<{
  year: number;
  filing: FilingStatus;
  people: readonly TaxPerson[];
  income: readonly HouseholdIncome[];
  accountIncome: TaxCharacter;
  retirementIncome?: readonly RetirementIncomeItem[];
  lossCarryover: CapitalLossCarryover;
  state: StateCode;
  stateTreatment: "existing-2025-proxy" | "verified-resident-location";
  cityId?: string;
  newYorkContract?: "enacted-law-precredit";
  projection?: TaxProjectionPolicy;
  /** Employee traditional 401(k) deferrals: reduce income-tax wages, not FICA. */
  pretax401k?: readonly Readonly<{ ownerId: string; amount: number }>[];
  /** Verified deductible portion of ACTUALLY funded traditional IRA deposits. */
  deductibleIra?: readonly Readonly<{ ownerId: string; amount: number }>[];
}>;

export function finiteDollars(value: number, name: string, signed = false) {
  if (!Number.isFinite(value) || value < (signed ? -1e12 : 0) || value > 1e12) {
    throw new RangeError(`${name} is outside the supported finite dollar range.`);
  }
  return value;
}

export function validatedDate(value: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError("Use YYYY-MM-DD dates.");
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new RangeError("Invalid calendar date.");
  return parsed;
}

/** Schedule D netting, then its carryover worksheet using UNFLOORED taxable
 * income. A household below its deduction does not automatically consume $3k.
 */
export function capitalLossCarryover(
  shortTerm: number, longTerm: number, deductionClaimed: number, unflooredTaxableIncome: number,
): CapitalLossCarryover {
  finiteDollars(shortTerm, "Net short-term gain", true);
  finiteDollars(longTerm, "Net long-term gain", true);
  finiteDollars(deductionClaimed, "Capital deduction");
  finiteDollars(unflooredTaxableIncome, "Unfloored taxable income", true);
  const allowed = Math.min(3000, Math.max(0, -(shortTerm + longTerm)));
  if (Math.abs(deductionClaimed - allowed) > 1e-6) throw new RangeError("Capital deduction does not match net losses.");
  const used = Math.min(deductionClaimed, Math.max(0, unflooredTaxableIncome + deductionClaimed));
  const stLoss = Math.max(0, -shortTerm);
  return Object.freeze({
    shortTerm: Math.max(0, stLoss - Math.max(0, longTerm) - used),
    longTerm: Math.max(0, -longTerm - Math.max(0, shortTerm) - Math.max(0, used - stLoss)),
  });
}

function preferentialTax(ordinaryBase: number, preferred: number, filing: FilingStatus, factor: number) {
  const [zeroCeiling, fifteenCeiling] = CAPITAL_LIMITS[filing].map(value => value * factor);
  const atZero = Math.min(preferred, Math.max(0, zeroCeiling - ordinaryBase));
  const atFifteen = Math.min(preferred - atZero, Math.max(0, fifteenCeiling - ordinaryBase - atZero));
  return atFifteen * 0.15 + (preferred - atZero - atFifteen) * 0.2;
}

/** Standard-deduction U.S. resident estimate with no itemized deductions,
 * credits, foreign exclusions, AMT preferences or self-employment. It includes
 * regular federal tax, basic AMT, employee payroll, NIIT and ordinary 10% early
 * distribution tax. State/local limitations are always returned, not hidden.
 */
export function estimateHouseholdTax(input: HouseholdTaxInput) {
  const factors = taxProjectionFactors(input.year, input.projection);
  if (input.filing !== "single" && input.filing !== "married") throw new RangeError("Unsupported filing status.");
  if (input.people.length !== (input.filing === "married" ? 2 : 1)) throw new RangeError("Taxpayer count must match filing status.");
  if (!["existing-2025-proxy", "verified-resident-location"].includes(input.stateTreatment) || !STATES.some(state => state.code === input.state)) {
    throw new RangeError("An explicit supported state-proxy selection is required.");
  }
  const location = input.stateTreatment === "verified-resident-location" ? verifiedRetirementLocation(input.state, input.cityId) : null;
  const ids = new Set<string>();
  let seniorCount = 0;
  let additionalDeductionCount = 0;
  for (const person of input.people) {
    if (!person.id?.trim() || ids.has(person.id)) throw new RangeError("Taxpayer IDs must be unique and present.");
    ids.add(person.id);
    validatedDate(person.birthDate);
    if (person.birthDate > `${input.year - 24}-12-31`) throw new RangeError("Dependent/student tax rules are not supported by this adult retirement model.");
    if (typeof person.blind !== "boolean" || typeof person.eligibleForSeniorDeduction !== "boolean") throw new RangeError("Explicit deduction eligibility flags are required.");
    // For these deductions a Jan 1 birthday is treated as reached on Dec 31.
    const aged = person.birthDate <= `${input.year - 64}-01-01`;
    if (aged) additionalDeductionCount++;
    if (person.blind) additionalDeductionCount++;
    if (aged && person.eligibleForSeniorDeduction) seniorCount++;
  }
  const wageByOwner = new Map(input.people.map(person => [person.id, 0]));
  let otherOrdinary = 0;
  let socialSecurity = 0;
  let taxExemptInterest = 0;
  let cashInvestmentOrdinary = 0;
  let cashQualifiedDividends = 0;
  for (const item of input.income) {
    if (!ids.has(item.ownerId)) throw new RangeError("Unknown income owner.");
    finiteDollars(item.amount, "Income");
    switch (item.kind) {
      case "wages": wageByOwner.set(item.ownerId, finiteDollars(wageByOwner.get(item.ownerId)! + item.amount, "Owner wages")); break;
      case "pension": case "other": otherOrdinary += item.amount; break;
      case "social-security": socialSecurity += item.amount; break;
      case "interest": case "nonqualified-dividends": cashInvestmentOrdinary += item.amount; break;
      case "qualified-dividends": cashQualifiedDividends += item.amount; break;
      case "tax-exempt-interest": taxExemptInterest += item.amount; break;
      default: throw new RangeError("Unknown income character.");
    }
  }
  const account = taxCharacter(input.accountIncome);
  const wages = [...wageByOwner.values()].reduce((sum, value) => sum + value, 0);
  const deferredByOwner = new Map<string, number>();
  for (const item of input.pretax401k ?? []) {
    if (!ids.has(item.ownerId)) throw new RangeError("Unknown deferral owner.");
    const deferred = finiteDollars((deferredByOwner.get(item.ownerId) ?? 0) + finiteDollars(item.amount, "Pretax deferral"), "Owner deferrals");
    if (deferred > wageByOwner.get(item.ownerId)!) throw new RangeError("Pretax deferrals cannot exceed the owner's wages.");
    deferredByOwner.set(item.ownerId, deferred);
  }
  const pretaxDeferrals = [...deferredByOwner.values()].reduce((sum, value) => sum + value, 0);
  const iraByOwner = new Map<string, number>();
  for (const item of input.deductibleIra ?? []) {
    if (!ids.has(item.ownerId)) throw new RangeError("Unknown IRA deduction owner.");
    const deduction = finiteDollars((iraByOwner.get(item.ownerId) ?? 0) + finiteDollars(item.amount, "IRA deduction"), "Owner IRA deduction");
    if (deduction > wageByOwner.get(item.ownerId)! - (deferredByOwner.get(item.ownerId) ?? 0)) throw new RangeError("IRA deduction exceeds supported own taxable compensation.");
    iraByOwner.set(item.ownerId, deduction);
  }
  const iraDeduction = [...iraByOwner.values()].reduce((sum, value) => sum + value, 0);
  if (iraDeduction > 0 && socialSecurity > 0) throw new RangeError("Social Security with deductible IRA contributions requires the special worksheet integration.");
  const investmentOrdinary = cashInvestmentOrdinary + account.investmentOrdinary;
  const qualifiedDividends = cashQualifiedDividends + account.qualifiedDividends;
  const nonSocialIncome = finiteDollars(wages - pretaxDeferrals + otherOrdinary + investmentOrdinary + qualifiedDividends
    + account.retirementOrdinary + account.esppCompensation, "Combined non-Social-Security income");
  finiteDollars(socialSecurity, "Social Security");
  finiteDollars(taxExemptInterest, "Tax-exempt interest");
  finiteDollars(input.lossCarryover.shortTerm, "Short-term carryover");
  finiteDollars(input.lossCarryover.longTerm, "Long-term carryover");
  const st = finiteDollars(account.shortTermGain - input.lossCarryover.shortTerm, "Net short-term capital amount", true);
  const lt = finiteDollars(account.longTermGain - input.lossCarryover.longTerm, "Net long-term capital amount", true);
  const netCapital = finiteDollars(st + lt, "Net capital amount", true);
  const capitalDeduction = Math.min(3000, Math.max(0, -netCapital));
  const capitalIncome = Math.max(0, netCapital);
  const preferredCapital = Math.max(0, Math.min(lt, netCapital));
  const taxableBenefits = taxableSocialSecurity(socialSecurity,
    nonSocialIncome + capitalIncome - capitalDeduction, taxExemptInterest, input.filing === "married");
  const agi = finiteDollars(nonSocialIncome + capitalIncome - capitalDeduction + taxableBenefits - iraDeduction, "AGI", true);
  const standardDeduction = ((input.filing === "married" ? 32200 : 16100)
    + additionalDeductionCount * (input.filing === "married" ? 1650 : 2050)) * factors.bracket;
  const seniorDeduction = input.year <= 2028
    ? seniorCount * Math.max(0, 6000 - 0.06 * Math.max(0, agi - (input.filing === "married" ? 150000 : 75000))) : 0;
  const unflooredTaxable = agi - standardDeduction - seniorDeduction;
  const taxableIncome = Math.max(0, unflooredTaxable);
  const preferentialIncome = Math.min(taxableIncome, qualifiedDividends + preferredCapital);
  const ordinaryTaxable = taxableIncome - preferentialIncome;
  const brackets = ORDINARY_LIMITS[input.filing].map((upTo, i) => ({ upTo: upTo * factors.bracket, rate: RATES[i] }));
  const ordinaryTax = sumBrackets(ordinaryTaxable, brackets);
  const capitalAndDividendTax = preferentialTax(ordinaryTaxable, preferentialIncome, input.filing, factors.bracket);
  const regularFederal = Math.min(sumBrackets(taxableIncome, brackets), ordinaryTax + capitalAndDividendTax);

  // Form 6251 lines 1a/1b and 2a: both the senior deduction and standard
  // deduction are unavailable for AMT. No other Schedule 1-A items are modeled.
  // No ISO, tax-exempt private-activity interest, foreign credit or preference inputs.
  const amti = Math.max(0, agi);
  const amtExemption = Math.max(0, (input.filing === "married" ? 140200 : 90100) * factors.bracket
    - 0.5 * Math.max(0, amti - (input.filing === "married" ? 1000000 : 500000) * factors.bracket));
  const amtBase = Math.max(0, amti - amtExemption);
  const amtPreferred = Math.min(amtBase, qualifiedDividends + preferredCapital);
  const amtBrackets = [{ upTo: 244500 * factors.bracket, rate: 0.26 }, { upTo: Infinity, rate: 0.28 }];
  // Part III lines 20/27 use REGULAR-tax ordinary taxable income to locate
  // the capital-gain rate bands, not the AMT ordinary-income amount.
  const tentativeMinimum = Math.min(sumBrackets(amtBase, amtBrackets),
    sumBrackets(amtBase - amtPreferred, amtBrackets) + preferentialTax(ordinaryTaxable, amtPreferred, input.filing, factors.bracket));
  const alternativeMinimumTax = Math.max(0, tentativeMinimum - regularFederal);

  // Caps apply per worker; Additional Medicare applies to combined wages.
  // Section 423 disposition compensation is deliberately excluded from FICA.
  const socialSecurityPayroll = [...wageByOwner.values()].reduce((sum, value) => sum + Math.min(value, 184500 * factors.payroll) * 0.062, 0);
  const medicarePayroll = wages * 0.0145;
  const surtaxThreshold = input.filing === "married" ? 250000 : 200000;
  const additionalMedicare = Math.max(0, wages - surtaxThreshold) * 0.009;
  const netInvestmentIncome = Math.max(0, investmentOrdinary + qualifiedDividends + capitalIncome - capitalDeduction);
  const niit = Math.min(netInvestmentIncome, Math.max(0, agi - surtaxThreshold)) * 0.038;
  const earlyDistributionTax = account.additionalTaxBase * 0.1;
  // Not asserted to be a retirement-specific state return: existing wage-based
  // state deductions/rates applied to federal AGI as an explicitly named proxy.
  const ny = location && input.state === "ny" ? newYorkTax(input, agi, taxableBenefits) : null;
  const localTax = ny ? ny.localTax : location ? 0 : null;
  const stateTax = ny ? ny.stateTax : location ? location.stateTax : estimateNetBreakdown({ grossAnnual: Math.max(0, agi), state: input.state,
    filing: input.filing, k401Pct: 0 }).state;
  const total = finiteDollars(regularFederal + alternativeMinimumTax + socialSecurityPayroll + medicarePayroll
    + additionalMedicare + niit + earlyDistributionTax + stateTax + (localTax ?? 0), "Total annual tax");
  return Object.freeze({ taxYear: input.year, federalBaseYear: HOUSEHOLD_TAX_YEAR, isProjection: input.year !== 2026,
    bracketFactor: factors.bracket, payrollCapFactor: factors.payroll, pretaxDeferrals, iraDeduction, stateDataYear: location ? 2026 : 2025, localTax, agi, taxableBenefits,
    netShortTerm: st, netLongTerm: lt, capitalDeduction, standardDeduction, seniorDeduction,
    taxableIncome, ordinaryTaxable, preferentialIncome, ordinaryTax, capitalAndDividendTax,
    regularFederal, alternativeMinimumTax, socialSecurityPayroll, medicarePayroll, additionalMedicare,
    netInvestmentIncome, niit, earlyDistributionTax, stateTax, total,
    nextLossCarryover: capitalLossCarryover(st, lt, capitalDeduction, unflooredTaxable),
    warnings: Object.freeze([
      ny ? ny.warning : location ? location.warning : "State tax uses the existing 2025 wage-based proxy on federal AGI, not verified retirement-specific state rules; local taxes are excluded.",
      "Standard-deduction U.S. resident estimate: IRA deductions require verified funded amounts; no IRA/Social Security worksheet interaction, itemization, credits, self-employment, foreign exclusions or AMT preference adjustments.",
      ...(input.year > 2026 ? ["Future tax values project 2026 law using explicit bracket/payroll growth, not published future tables. Statutory fixed thresholds remain nominal; the senior deduction expires after 2028."] : []),
      "Capital carryovers are household totals; survivor/filing-status changes require owner attribution before using this state.",
      "AMT assumes regular and AMT asset basis and loss carryovers are identical; separate AMT carryovers and credits are not modeled.",
    ]),
  });
}
