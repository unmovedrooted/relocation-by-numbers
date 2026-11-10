import { estimateNetBreakdown } from "./wageTax";
import type { FilingStatus } from "./tax";
import type { StateCode } from "./states";
import { retireeIncomeTax } from "./retirementStateView";

// ─────────────────────────────────────────────────────────────────────────
// TAX TREATMENT OF RETIREMENT-ACCOUNT WITHDRAWALS
//
// Withdrawals from traditional (pre-tax) 401(k)/IRA accounts are taxed as
// ordinary income, federal + state only. FICA (Social Security/Medicare
// payroll tax) does NOT apply to retirement-account distributions, and local
// wage taxes generally don't either. Roth withdrawals are entirely tax-free.
//
// Beyond the 9 no-income-tax states (which the tax engine already returns $0
// for), Illinois, Pennsylvania, and Mississippi fully exempt qualified
// retirement-plan / IRA / 401(k) distributions from state income tax.
// Source: verified against state DOR guidance.
// ─────────────────────────────────────────────────────────────────────────
export const RETIREMENT_STATE_EXEMPT = new Set<StateCode>(["il", "pa", "ms"]);

export type WithdrawalAccountType = "traditional" | "roth";

export type WithdrawalTax = { total: number; federal: number; state: number };

/**
 * Income tax on a gross retirement-account withdrawal, treated as the filer's
 * only ordinary income. Excludes FICA and local wage tax. Roth = $0, and
 * states that exempt retirement income return $0 state tax.
 */
export function withdrawalIncomeTax(
  gross: number,
  state: StateCode,
  filing: FilingStatus,
  accountType: WithdrawalAccountType,
): WithdrawalTax {
  if (accountType === "roth" || !Number.isFinite(gross) || gross <= 0) {
    return { total: 0, federal: 0, state: 0 };
  }
  const b = estimateNetBreakdown({ grossAnnual: gross, state, filing, k401Pct: 0 });
  const st = RETIREMENT_STATE_EXEMPT.has(state) ? 0 : b.state;
  return { total: b.federal + st, federal: b.federal, state: st }; // exclude FICA + local
}

/** From this age the age-aware estimate is used; younger withdrawals can be early distributions, which the state modules do not accept without more detail. */
export const AGE_AWARE_FROM = 60;

export type AgedWithdrawalTax = WithdrawalTax & {
  /** True when the planner's household engine produced the figure; false when the simple wage-style estimate was used. */
  ageAware: boolean;
};

/**
 * Income tax on a gross traditional withdrawal for a retiree of the given age, treated as the only income.
 *
 * From AGE_AWARE_FROM it uses the planner's household engine: the federal standard deduction with the extra amount at 65 or older,
 * the temporary senior deduction, and the state's own rules for retirement withdrawals at that age. The whole withdrawal belongs to
 * one account owner, and a joint return assumes both spouses are the same age. Below that age, or when a state module cannot run,
 * it falls back to withdrawalIncomeTax (standard deduction for a filer under 65, no early-withdrawal penalty).
 */
export function withdrawalIncomeTaxAtAge(
  gross: number,
  state: StateCode,
  filing: FilingStatus,
  accountType: WithdrawalAccountType,
  age: number,
): AgedWithdrawalTax {
  if (accountType === "roth" || !Number.isFinite(gross) || gross <= 0) return { total: 0, federal: 0, state: 0, ageAware: Number.isFinite(age) && age >= AGE_AWARE_FROM };
  if (Number.isFinite(age) && age >= AGE_AWARE_FROM) {
    const r = retireeIncomeTax(state, { filing, age: Math.min(110, Math.round(age)), socialSecurity: 0, pension: 0, withdrawals: gross }, 0, true);
    if (r) return { total: r.total, federal: r.federal, state: r.state, ageAware: true };
  }
  return { ...withdrawalIncomeTax(gross, state, filing, accountType), ageAware: false };
}

// Representative income used to read a state's marginal rate for the taxable
// brokerage annual tax drag (an accumulator's typical bracket). Approximate by
// design, the true drag depends on income, holdings, and turnover.
const REPRESENTATIVE_INCOME: Record<FilingStatus, number> = {
  single: 120_000,
  married: 180_000,
};

/**
 * A state's approximate marginal income-tax rate at a representative
 * accumulation-phase income, used as the annual tax drag on a taxable
 * brokerage account's return. Returns 0 for no-income-tax states.
 */
export function representativeStateMarginalRate(state: StateCode, filing: FilingStatus): number {
  const base = REPRESENTATIVE_INCOME[filing];
  const lower = estimateNetBreakdown({ grossAnnual: base, state, filing, k401Pct: 0 }).state;
  const upper = estimateNetBreakdown({ grossAnnual: base + 1_000, state, filing, k401Pct: 0 }).state;
  const marginal = (upper - lower) / 1_000;
  return Number.isFinite(marginal) && marginal > 0 ? marginal : 0;
}
