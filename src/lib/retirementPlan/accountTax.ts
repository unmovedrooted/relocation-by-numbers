/**
 * Account-specific tax character and basis, not household income-tax rates.
 * All monetary values use one common nominal currency (USD for U.S. taxes).
 * References and excluded special cases are recorded in ACCOUNT_TAX_CONTRACT.md.
 */
import { esppSale, iraBasisAllocation, type EsppLot } from "./rules";

const LIMIT = 1e12;

function money(value: number, name: string, signed = false): number {
  if (!Number.isFinite(value) || value < (signed ? -LIMIT : 0) || value > LIMIT) {
    throw new RangeError(`${name} is outside the supported finite monetary range.`);
  }
  return value;
}

function date(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError("Dates must use YYYY-MM-DD.");
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RangeError("Invalid calendar date.");
  }
  return parsed;
}

function addMonthsClamped(value: Date, months: number) {
  const shifted = new Date(value);
  const day = shifted.getUTCDate();
  shifted.setUTCDate(1);
  shifted.setUTCMonth(shifted.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0)).getUTCDate();
  shifted.setUTCDate(Math.min(day, lastDay));
  return shifted;
}

function distributionDates(birthDate: string, distributionDate: string) {
  const birth = date(birthDate);
  const distributed = date(distributionDate);
  if (birth > distributed) throw new RangeError("Birth must precede distribution.");
  return { distributed, under59Half: distributed < addMonthsClamped(birth, 59 * 12 + 6) };
}

function withdrawalAmounts(balance: number, withdrawal: number, basis = 0) {
  money(balance, "Balance");
  money(withdrawal, "Withdrawal");
  money(basis, "Basis");
  if (withdrawal > balance) throw new RangeError("Withdrawal exceeds the available balance.");
}

/** Separate categories prevent treating ESPP compensation as capital gain or
 * retirement distributions as investment income for a future NIIT calculation.
 * Nonqualified dividends exclude the qualified subset (never add it twice).
 * Additional-tax base is NOT additional ordinary income.
 */
export type TaxCharacter = Readonly<{
  retirementOrdinary: number;
  investmentOrdinary: number;
  esppCompensation: number;
  qualifiedDividends: number;
  shortTermGain: number;
  longTermGain: number;
  additionalTaxBase: number;
}>;

export function taxCharacter(values: Partial<TaxCharacter> = {}): TaxCharacter {
  const result = { retirementOrdinary: 0, investmentOrdinary: 0, esppCompensation: 0,
    qualifiedDividends: 0, shortTermGain: 0, longTermGain: 0, additionalTaxBase: 0, ...values };
  for (const [key, value] of Object.entries(result)) money(value, key, key === "shortTermGain" || key === "longTermGain");
  return Object.freeze(result);
}

export function sumTaxCharacter(items: readonly TaxCharacter[]): TaxCharacter {
  const sum = { ...taxCharacter() };
  for (const item of items) {
    for (const key of Object.keys(sum) as (keyof TaxCharacter)[]) {
      money(item[key], key, key === "shortTermGain" || key === "longTermGain");
      sum[key] = money(sum[key] + item[key], key, key === "shortTermGain" || key === "longTermGain");
    }
  }
  return taxCharacter(sum);
}

export type CapitalLot = Readonly<{
  shares: number;
  /** Total adjusted basis of the identified lot, not basis per share. */
  adjustedBasis: number;
  acquiredDate: string;
}>;

/** Ordinary purchased shares; specific-lot identification must be valid upstream.
 * No automatic wash-sale, inherited/gift holding-period, or bond/OID adjustment.
 */
export function capitalLotSale(lot: CapitalLot, shares: number, price: number, saleDate: string, fees = 0) {
  money(lot.shares, "Lot shares");
  money(lot.adjustedBasis, "Lot basis");
  money(shares, "Shares sold");
  money(price, "Sale price");
  money(fees, "Selling fees");
  if (shares > lot.shares || (lot.shares === 0 && lot.adjustedBasis !== 0)) throw new RangeError("Invalid lot quantity or basis.");
  const acquired = date(lot.acquiredDate);
  const sold = date(saleDate);
  if (sold < acquired) throw new RangeError("Sale cannot precede acquisition.");
  const grossProceeds = money(shares * price, "Gross proceeds");
  if (fees > grossProceeds) throw new RangeError("Fees exceed gross proceeds.");
  const proceeds = grossProceeds - fees;
  const basisUsed = lot.shares > 0 ? lot.adjustedBasis * (shares / lot.shares) : 0;
  const gain = money(proceeds - basisUsed, "Capital gain", true);
  const longTerm = sold > addMonthsClamped(acquired, 12);
  return Object.freeze({ grossProceeds, proceeds, basisUsed, longTerm,
    remainingLot: Object.freeze({ ...lot, shares: lot.shares - shares, adjustedBasis: Math.max(0, lot.adjustedBasis - basisUsed) }),
    character: taxCharacter(longTerm ? { longTermGain: gain } : { shortTermGain: gain }),
  });
}

/** Reuse the reviewed Section 423 logic; do not fold compensation into gains. */
export function esppLotSale(lot: EsppLot, shares: number, price: number, saleDate: string, fees = 0) {
  // Bound inputs and products before entering the previously reviewed primitive.
  for (const [key, value] of Object.entries({ shares: lot.shares, purchasePrice: lot.purchasePrice,
    offeringFairMarketValue: lot.offeringFairMarketValue, purchaseFairMarketValue: lot.purchaseFairMarketValue,
    offeringOptionPrice: lot.offeringOptionPrice, soldShares: shares, price, fees })) money(value, key);
  money(lot.shares * lot.purchasePrice, "ESPP lot basis");
  money(shares * price, "ESPP gross proceeds");
  const result = esppSale(lot, shares, price, saleDate, fees);
  money(result.adjustedBasis, "ESPP adjusted basis");
  return Object.freeze({ ...result,
    remainingLot: Object.freeze({ ...lot, shares: result.sharesRemaining }),
    character: taxCharacter({ esppCompensation: result.ordinaryIncome,
      shortTermGain: result.shortTermGain, longTermGain: result.longTermGain }),
  });
}

/** Taxable when credited, even if left in an ordinary savings account.
 * Principal withdrawals are not interest. The caller supplies interest actually
 * credited/available; this helper does not invent APY or monthly timing.
 */
export function savingsInterest(creditedInterest: number) {
  return taxCharacter({ investmentOrdinary: money(creditedInterest, "Credited interest") });
}

/** Qualified dividends are a subset of total ordinary dividends, not additional
 * income. Qualification/holding-period eligibility must be established upstream.
 */
export function dividendIncome(totalDividends: number, qualifiedDividends: number) {
  money(totalDividends, "Total dividends");
  money(qualifiedDividends, "Qualified dividends");
  if (qualifiedDividends > totalDividends) throw new RangeError("Qualified dividends cannot exceed total dividends.");
  return taxCharacter({ investmentOrdinary: totalDividends - qualifiedDividends, qualifiedDividends });
}

export type EarlyDistribution = Readonly<{
  birthDate: string;
  distributionDate: string;
  /** Dollars of otherwise additional-tax-subject income covered by a verified
   * exception. This is not a gross-withdrawal exemption and not a rate override.
   * Eligibility and lifetime/year limits must be checked by the tax adapter.
   */
  additionalTaxExceptionAmount: number;
}>;

export function additionalTaxBase(potential: number, terms: EarlyDistribution) {
  money(potential, "Potential additional-tax base");
  money(terms.additionalTaxExceptionAmount, "Additional-tax exception");
  return distributionDates(terms.birthDate, terms.distributionDate).under59Half
    ? Math.max(0, potential - terms.additionalTaxExceptionAmount) : 0;
}

/** One eligible qualified-plan distribution before annuitization. The balance
 * and basis must describe the SAME applicable plan/contract, including any
 * separately accounted employee-contribution subaccount. Not IRA aggregation.
 * This helper is not for a partial rollover, NUA or an in-kind distribution.
 */
export function qualifiedPlanWithdrawal(input: EarlyDistribution & {
  balance: number;
  afterTaxBasis: number;
  withdrawal: number;
}) {
  withdrawalAmounts(input.balance, input.withdrawal, input.afterTaxBasis);
  const basisUsed = input.balance > 0
    ? input.withdrawal * Math.min(1, input.afterTaxBasis / input.balance) : 0;
  const taxable = input.withdrawal - basisUsed;
  return Object.freeze({ cash: input.withdrawal, basisUsed,
    remainingBalance: input.balance - input.withdrawal,
    remainingBasis: input.afterTaxBasis - basisUsed,
    character: taxCharacter({ retirementOrdinary: taxable, additionalTaxBase: additionalTaxBase(taxable, input) }),
  });
}

/** Nonperiodic partial withdrawals from a post-August-13-1982, nonqualified,
 * not-yet-annuitized contract/tax aggregation group: earnings first.
 * Never apply this to a qualified annuity, annuity payments, a full surrender
 * with charges/losses, or separate contracts required to be aggregated.
 */
export function deferredAnnuityWithdrawal(input: EarlyDistribution & {
  balance: number;
  investmentInContract: number;
  withdrawal: number;
  treatment: "post-1982-nonqualified-pre-annuity";
}) {
  if (input.treatment !== "post-1982-nonqualified-pre-annuity") throw new RangeError("Unsupported annuity treatment.");
  withdrawalAmounts(input.balance, input.withdrawal, input.investmentInContract);
  if (input.withdrawal > 0 && input.withdrawal === input.balance) {
    throw new RangeError("Full annuity surrender requires explicit charge and unrecovered-basis handling.");
  }
  const taxable = Math.min(input.withdrawal, Math.max(0, input.balance - input.investmentInContract));
  const basisUsed = input.withdrawal - taxable;
  return Object.freeze({ cash: input.withdrawal, basisUsed,
    remainingBalance: input.balance - input.withdrawal,
    remainingBasis: input.investmentInContract - basisUsed,
    // Nonqualified-annuity income remains identifiable for potential NIIT.
    character: taxCharacter({ investmentOrdinary: taxable, additionalTaxBase: additionalTaxBase(taxable, input) }),
  });
}

/** Full surrender: taxable gain uses actual net cash after surrender charges.
 * A loss is returned for review, NOT silently deducted or carried as live basis.
 * An annual tax adapter must reject requiresLossReview until that tax treatment
 * is implemented. This is distinct from a pre-annuity partial withdrawal.
 */
export function deferredAnnuitySurrender(input: EarlyDistribution & {
  balance: number;
  investmentInContract: number;
  surrenderCharge: number;
}) {
  withdrawalAmounts(input.balance, input.balance, input.investmentInContract);
  money(input.surrenderCharge, "Surrender charge");
  if (input.surrenderCharge > input.balance) throw new RangeError("Surrender charge exceeds contract value.");
  const cash = input.balance - input.surrenderCharge;
  const taxable = Math.max(0, cash - input.investmentInContract);
  const unrecoveredBasis = Math.max(0, input.investmentInContract - cash);
  return Object.freeze({ cash, surrenderCharge: input.surrenderCharge,
    basisUsed: Math.min(cash, input.investmentInContract), remainingBalance: 0, remainingBasis: 0,
    unrecoveredBasis, requiresLossReview: unrecoveredBasis > 0,
    character: taxCharacter({ investmentOrdinary: taxable, additionalTaxBase: additionalTaxBase(taxable, input) }),
  });
}

export type IraOwnerYear = Readonly<{
  ownerId: string;
  basis: number;
  accounts: readonly Readonly<{ accountId: string; endingValue: number; distributions: number; conversions: number }>[];
}>;

/** Aggregate traditional IRAs per OWNER, never per account or across spouses.
 * All relevant traditional/SEP/SIMPLE IRA values must be supplied by the caller.
 * Early-distribution exceptions, SIMPLE penalties, Form 8606 special adjustments
 * and rounding are outside this allocation helper.
 */
export function traditionalIraOwnerYear(input: IraOwnerYear) {
  if (!input.ownerId.trim()) throw new RangeError("IRA owner is required.");
  money(input.basis, "IRA basis");
  const ids = new Set<string>();
  let ending = 0;
  let distributed = 0;
  let converted = 0;
  for (const item of input.accounts) {
    if (!item.accountId.trim() || ids.has(item.accountId)) throw new RangeError("IRA account IDs must be present and unique.");
    ids.add(item.accountId);
    ending = money(ending + money(item.endingValue, "IRA ending value"), "Aggregate IRA value");
    distributed = money(distributed + money(item.distributions, "IRA distributions"), "Aggregate distributions");
    converted = money(converted + money(item.conversions, "IRA conversions"), "Aggregate conversions");
  }
  money(ending + distributed + converted, "IRA allocation denominator");
  const result = iraBasisAllocation(input.basis, ending, distributed, converted);
  return Object.freeze({ ownerId: input.ownerId, ...result,
    character: taxCharacter({ retirementOrdinary: result.taxableDistributions + result.taxableConversions }),
  });
}

export type RothConversionBasis = Readonly<{
  year: number;
  /** Remaining principal previously included in income on conversion. */
  taxablePrincipal: number;
  /** Remaining principal not included in income on conversion. */
  nontaxablePrincipal: number;
}>;

/** Living-owner, ordinary Roth IRA withdrawal, aggregated across that owner's
 * Roth IRAs. Regular contributions -> conversions FIFO (taxable portion first
 * within each year) -> earnings. Conversion recapture is an additional-tax base,
 * NOT ordinary income for a second time. Disability/death/first-home qualified
 * distribution pathways are not inferred by this living-owner helper.
 */
export function rothIraWithdrawal(input: EarlyDistribution & {
  balance: number;
  regularContributionBasis: number;
  conversions: readonly RothConversionBasis[];
  firstContributionYear: number;
  withdrawal: number;
}) {
  withdrawalAmounts(input.balance, input.withdrawal, input.regularContributionBasis);
  const { distributed, under59Half } = distributionDates(input.birthDate, input.distributionDate);
  const year = distributed.getUTCFullYear();
  validateRothYear(input.firstContributionYear, year);
  money(input.additionalTaxExceptionAmount, "Additional-tax exception");
  const groups = new Map<number, { year: number; taxablePrincipal: number; nontaxablePrincipal: number }>();
  let trackedBasis = input.regularContributionBasis;
  for (const conversion of input.conversions) {
    validateRothYear(conversion.year, year);
    if (conversion.year < input.firstContributionYear) throw new RangeError("Conversion cannot precede the first Roth contribution year.");
    money(conversion.taxablePrincipal, "Taxable conversion basis");
    money(conversion.nontaxablePrincipal, "Nontaxable conversion basis");
    const group = groups.get(conversion.year) ?? { year: conversion.year, taxablePrincipal: 0, nontaxablePrincipal: 0 };
    group.taxablePrincipal = money(group.taxablePrincipal + conversion.taxablePrincipal, "Yearly taxable conversion basis");
    group.nontaxablePrincipal = money(group.nontaxablePrincipal + conversion.nontaxablePrincipal, "Yearly nontaxable conversion basis");
    groups.set(conversion.year, group);
    trackedBasis = money(trackedBasis + conversion.taxablePrincipal + conversion.nontaxablePrincipal, "Total Roth basis");
  }
  const qualified = !under59Half && year >= input.firstContributionYear + 5;
  const contributionUsed = Math.min(input.withdrawal, input.regularContributionBasis);
  let remaining = input.withdrawal - contributionUsed;
  let conversionUsed = 0;
  let recaptureBase = 0;
  const remainingConversions = [...groups.values()].sort((a, b) => a.year - b.year).map(group => {
    const taxableUsed = Math.min(remaining, group.taxablePrincipal);
    remaining -= taxableUsed;
    const nontaxableUsed = Math.min(remaining, group.nontaxablePrincipal);
    remaining -= nontaxableUsed;
    conversionUsed += taxableUsed + nontaxableUsed;
    if (under59Half && year < group.year + 5) recaptureBase += taxableUsed;
    return Object.freeze({ year: group.year, taxablePrincipal: group.taxablePrincipal - taxableUsed,
      nontaxablePrincipal: group.nontaxablePrincipal - nontaxableUsed });
  });
  const earningsUsed = remaining;
  const taxableEarnings = qualified ? 0 : earningsUsed;
  const potentialAdditionalTax = under59Half ? recaptureBase + taxableEarnings : 0;
  return Object.freeze({ cash: input.withdrawal, qualified, contributionUsed, conversionUsed, earningsUsed,
    remainingBalance: input.balance - input.withdrawal,
    remainingContributionBasis: input.regularContributionBasis - contributionUsed,
    remainingConversions: Object.freeze(remainingConversions),
    character: taxCharacter({ retirementOrdinary: taxableEarnings,
      additionalTaxBase: Math.max(0, potentialAdditionalTax - input.additionalTaxExceptionAmount) }),
  });
}

function validateRothYear(firstYear: number, year: number) {
  if (!Number.isInteger(firstYear) || firstYear < 1998 || firstYear > year) {
    throw new RangeError("Roth contribution/conversion year is invalid.");
  }
}

/** Ordinary designated Roth-plan distribution (no in-plan rollover recapture).
 * Nonqualified withdrawals are pro rata basis/earnings, NOT IRA basis-first.
 * The first contribution year is the plan's applicable five-tax-year clock.
 */
export function rothPlanWithdrawal(input: EarlyDistribution & {
  balance: number;
  contributionBasis: number;
  firstContributionYear: number;
  withdrawal: number;
  hasInPlanRollover: boolean;
}) {
  if (input.hasInPlanRollover !== false) throw new RangeError("In-plan Roth rollovers require separate recapture tracking.");
  withdrawalAmounts(input.balance, input.withdrawal, input.contributionBasis);
  const { distributed, under59Half } = distributionDates(input.birthDate, input.distributionDate);
  const year = distributed.getUTCFullYear();
  validateRothYear(input.firstContributionYear, year);
  if (input.firstContributionYear < 2006) throw new RangeError("Designated Roth contributions cannot precede 2006.");
  const qualified = !under59Half && year >= input.firstContributionYear + 5;
  const basisUsed = input.balance > 0
    ? input.withdrawal * Math.min(1, input.contributionBasis / input.balance) : 0;
  const taxableEarnings = qualified ? 0 : input.withdrawal - basisUsed;
  return Object.freeze({ cash: input.withdrawal, qualified, basisUsed,
    remainingBalance: input.balance - input.withdrawal,
    remainingBasis: input.contributionBasis - basisUsed,
    character: taxCharacter({ retirementOrdinary: taxableEarnings,
      additionalTaxBase: additionalTaxBase(taxableEarnings, input) }),
  });
}
