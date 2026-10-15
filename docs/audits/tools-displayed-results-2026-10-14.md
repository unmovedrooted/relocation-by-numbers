# Tools displayed-results audit — October 14, 2026

## Scope and verdict

Inventory source: `ExploreCalculatorGrid.tsx`, 30 linked tools. This is a partial deep audit, NOT certification of all 30 tools. Earlier green suites were insufficient: some tests assert only finiteness or row count. New tests execute production result callbacks directly without changing formulas. Observation tests deliberately assert current behavior to reproduce discrepancies; their passing does not mean the observed behavior is correct.

## Confirmed discrepancies

| Priority | Tool / source | Evidence | Recommended correction |
|---|---|---|---|
| High | Investment, `InvestmentCalculator.tsx:114`, `:123`, `:236` | Label says monthly deposits; engine deposits the whole annual amount at the start of the year. $0 starting, $1,000/month, 12%, one year produces $13,440. Monthly end-of-period deposits at an equivalent monthly rate produce $12,646.497908. Even beginning-of-month deposits produce less than the current result. | Decide timing explicitly, align engine, Monte Carlo and text. Do not silently change the return convention. |
| Medium | Investment, `InvestmentCalculator.tsx:126` | $10,000, no deposits, -10%, one year: balance $9,000 and total growth -$1,000, but chart growth is clamped to zero. | Represent negative growth honestly in the chart; preserve the correct final balance. |
| Medium | Compare Cities, `compareEngines/us.ts:75`, `CompareCitiesCalculator.tsx:900` | Effective tax rate uses 1 - net/gross; net is after 401(k) saving. Tested four salaries: increasing tax-deferred savings reduces federal tax but increases the labeled tax rate. | Separate actual tax from retirement contributions, or relabel total deductions accurately. |
| High | Mortgage, `MortgageCalculator.tsx:404` | Main loan payment is now correct at 0%, but `calcBreakEven` still returns invalid for $120k home, no down payment/costs/growth, $1k payment and $1k rent at 0%. | Support the valid zero-rate case throughout the comparison. |

## Additional code-review concerns needing dedicated numerical tests

- Mortgage `calcBreakEven` adds the full monthly mortgage payment for all 360 iterations even after loan balance reaches zero. Shorter loans can be overstated after payoff. It also does not invest recurring rent-versus-buy cash-flow differences, unlike the standalone rent-versus-buy model. These two tools must not be presented as equivalent comparisons without reconciling assumptions.
- International Compare Cities includes groceries, utilities, transport and healthcare in `housingMonthly`; US Compare Cities subtracts only housing. This makes remaining-income comparisons potentially inconsistent across modes. Inspect mode-specific presentation before changing labels or costs.
- HSA result calculation flags excess contributions but still projects and calculates savings using the full entered contribution. Determine whether warnings are sufficient or whether results should stop when ineligible.
- Retirement's monthly contribution is also accumulated at the start of the year; verify its displayed explanation and desired deposit-timing contract.
- Previously observed standalone retirement age-65 deduction differences remain outside the Complete Retirement Plan engine. The simpler helper does not receive age. Do not treat that as evidence the Complete Plan is wrong.

## Per-tool coverage ledger

“Existing” means the existing suite was rerun; it is not a fresh independent page-level verification.

| Route | Coverage / unresolved work |
|---|---|
| `/` | Existing wage/housing/relocation tests; full displayed-result and URL-flow checks still needed |
| `/compare-cities` | New US scenarios at $50k/$100k/$150k/$250k; tax-rate labeling issue; international invariants for GB/SG/PT/CO/JP/AE at zero and four salaries |
| `/compare` | Prebuilt city-pair page parity still unverified |
| `/one-income-relocation-calculator` | Existing shared helper coverage; full household output scenarios still needed |
| `/mortgage-calculator` | Positive/zero payment, schedule, PMI, refi checks; newly reproduced remaining zero-rate comparison defect |
| `/rent-vs-buy-calculator` | Existing zero-rate equity scenarios; multi-year competing cash-flow independent model still needed |
| `/housing-affordability-calculator` | Existing zero-rate solver check; displayed payment versus solver assumptions still needs verification |
| `/paycheck-calculator` | Existing wage/state/city suite and fixed-salary reference scenarios; UI frequency and deduction-flow checks remain |
| `/income-tax-calculator` | Existing federal engine coverage; direct page itemized/pre-tax result scenarios remain |
| `/fire-calculator` | Existing direct engine cases and annual indexed take-home tests |
| `/fire-number-calculator` | Shared FIRE engine; route inventory is not an independent output assertion |
| `/lean-fire-calculator` | Shared FIRE engine, contribution scenarios; full UI flow unverified |
| `/barista-fire-calculator` | Owner-approved extra current income contract; check description's semi-retirement framing against this contract |
| `/coast-fire-calculator` | Independent nominal/real target checks; full UI flow unverified |
| `/chubby-fire-calculator` | Preset/mode inventory only beyond shared engine tests |
| `/fat-fire-calculator` | Preset/mode inventory only beyond shared engine tests |
| `/savings-rate-for-fire` | Shared engine coverage; independent route-specific output check remains |
| `/complete-retirement-plan` | Extensive existing tax, cash-flow, contribution, RMD, IRMAA, Monte Carlo and strategy tests; not exhaustive financial certification |
| `/retirement-calculator` | Direct annuity-due checks 0/1/10/30 years; contribution timing concern |
| `/401k-calculator` | Existing direct accumulation and capped-match scenarios |
| `/hsa-calculator` | New actual result callbacks for FL/CA/NJ: $1k own + $500 employer, $10k balance, zero return, ten years yields $25k; federal saving $220, FICA $76.50, state saving $0 |
| `/retirement-withdrawal-calculator` | Existing zero-return inverse/simulation cases; senior and state treatment limitations remain |
| `/rmd-calculator` | Existing divisor/cohort tests; account-type and beneficiary UI edge cases remain |
| `/roth-conversion-calculator` | New actual callback: $10k conversion over $50k income, FL single, zero growth, 20% future rate; $1,200 conversion tax, $800 advantage under both funding modes; other-state and basis limitations remain |
| `/investment-calculator` | New actual callbacks, zero-return 0/1/10/30 years; timing and negative-chart discrepancies |
| `/international-relocation` | Existing country/tax/currency tests; full page output and conditional-state coverage incomplete |
| `/europe-relocation-calculator` | Existing field/state/currency contracts; full cross-country numerical matrix incomplete |
| `/asia-relocation-calculator` | Existing country tax and Singapore references; full monthly/upfront output matrix incomplete |
| `/caribbean-relocation-calculator` | Existing country engine and Jamaica reference scenarios; full page matrix incomplete |
| `/south-america-relocation-calculator` | Existing currency/car/state contracts; full country and preset output matrix incomplete |

## Limits and next audit work

No live browser or newly researched official-calculator comparison was performed in this increment. The new international cases check arithmetic invariants, NOT official tax correctness. Finish the incomplete ledger entries before declaring all tools verified. Prioritize user-visible result assembly, deposit timing, currencies and household multipliers, then saved URL/preset/tab parity. No production correction is authorized by this audit.

## Resolution of the clear defects (2026-10-14)

- **Mortgage break-even:** `calcBreakEven` accepts a 0% rate, and the mortgage payment stops once the loan is paid off (the last payment is only what is still owed). Previously it added the full payment for all 360 months. Tests: the zero-rate case returns month 1; a $10,000 loan paid off in ten months crosses at month 100.
- **Investment chart:** negative growth is shown as a loss (the green layer sits below the contributions line) instead of being clamped to zero; the tooltip says "Loss" or "Growth". The final balance and total growth were already correct.
- **Compare Cities tax rate:** the rate now counts taxes only (`totalTax / gross`), so saving more to a 401(k) lowers it instead of raising it. Net income is unchanged.
- The observation tests that recorded the old behaviour now assert the corrected behaviour.

Left for a decision: Investment and Retirement deposit timing (the label says monthly; the engine deposits the year's total on day one, which gives $13,440 instead of $12,646 in the audit case), the HSA excess-contribution handling, the break-even model not investing the rent-versus-buy cash-flow difference, and the housing/living-cost split in international Compare Cities.
