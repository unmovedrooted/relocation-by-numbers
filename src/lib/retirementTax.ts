import { estimateNetBreakdown, type FilingStatus } from "./tax";
import type { StateCode } from "./states";

// ─────────────────────────────────────────────────────────────────────────
// TAX TREATMENT OF RETIREMENT-ACCOUNT WITHDRAWALS
//
// Withdrawals from traditional (pre-tax) 401(k)/IRA accounts are taxed as
// ordinary income — federal + state only. FICA (Social Security/Medicare
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

// Representative income used to read a state's marginal rate for the taxable
// brokerage annual tax drag (an accumulator's typical bracket). Approximate by
// design — the true drag depends on income, holdings, and turnover.
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
