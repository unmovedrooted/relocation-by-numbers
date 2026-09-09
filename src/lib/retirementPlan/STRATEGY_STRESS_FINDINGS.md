# Strategy solver validation findings

Update: the numerical boundary described below is now corrected. This document retains the original findings as historical context. The failing trial converted $247,558.59; recombining its taxable/nontaxable split produced $247,558.58999999997. The annual engine now uses original transfer amounts for cash and separately checks tax-character reconciliation. The strict over-withdrawal guard remains unchanged. Regression tests now require eligibility and directly execute the failing amount; the high-basis scenario also joins the sampled-boundary matrix. No tax formula or search algorithm changed. Finite sampling still does not prove universal monotonicity.

## Original audit (before correction)

Status at original audit: not ready for UI integration. Production formulas and solver were not changed in the original testing batch.

## Confirmed limitation — high priority

2026 single owner born 1960-01-01, traditional IRA $500,000 with $200,000 owner basis, cash $0, spending $50,000, Social Security $36,000 and pension $20,000 starting January 1, zero returns. Existing empty qualified Roth, first contribution year 2020. Explicit conversion window 2026 only and terminal assumption 20%.

A $10,000 manual conversion is funded and remains below the 12% ceiling. Nevertheless, at least one bracket strategy is rejected with `Withdrawal exceeds the available balance.` An exploratory settlement exception escapes the annual bisection and reaches the whole-candidate catch. Rejected candidates are not ranked, but the resulting search can omit feasible strategies.

The characterization test intentionally asserts this current rejection plus the independently executed feasible manual scenario. It is not evidence the defect is fixed. Do not replace it with a silent catch that treats every numerical/model error as ordinary infeasibility. Next: isolate the exact throwing trial and settlement boundary, distinguish domain infeasibility from numerical defects, then add a corrected-behavior regression before changing solver behavior.

## Executed checks

Four scenario families sample 101 conversion amounts for each of three brackets and verify no sampled feasible re-entry, finite tax, cash reconciliation, and selected-cent/next-cent feasibility boundaries. They cover Social Security, senior-age deductions, RMDs, nearly depleted accounts, and above-ceiling pension income. Additional tests cover zero balances, wholly unfunded candidates, and existing Roth withdrawals. Existing tests cover two-year IRMAA linkage and basis/tax-funded withdrawals.

These finite samples do not prove monotonicity for every supported input. No UI or browser testing was required for this pure-test batch. Broader randomized testing, exact threshold sweeps and the discovered numerical boundary still require follow-up before UI integration.
