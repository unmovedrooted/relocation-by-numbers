# Additional calculator checks — October 14, 2026

Scope: direct execution of component-local arithmetic, not browser or official-calculator UI certification. Production formulas were not modified. Existing audit and regional/state test suites are separate coverage; passing them does not establish every page or country's legal accuracy.

## New known-answer cases

| Calculation | Independent expectation | Actual | Result |
|---|---|---|---|
| Mortgage, $300,000, 6.5%, 30 years | P / ((1 - (1+r)^-360) / r), r=.065/12 | Matches within 1e-8 | Pass |
| Same mortgage amortization | 360 rows, $300,000 total principal, final balance zero within tolerance | Matches | Pass |
| Same mortgage plus $200/month | Paid off before month 360 | Matches | Pass |
| PMI, 20% down | $0 | $0 | Pass |
| PMI, $95,000 loan, $100,000 home, 5% down | $95/month under configured 1.2% assumption | $95 | Arithmetic pass; not a lender quote |
| $120,000, zero interest, ten years | $1,000/month | $0 | Fail |
| Same zero-rate loan total interest | $0 | -$120,000 | Fail |
| Same zero-rate amortization | 120 rows | Empty array | Fail |
| Zero-rate PMI: $90,000 loan, $100,000 home, $1,000/month | Reach configured 80% threshold in ten months | null | Fail |
| Refinance $120,000, 6%, 120 months to same terms; $3,000 fees | $0 monthly saving, -$3,000 lifetime saving, no break-even | Matches | Pass |
| Retirement: $50,000 initial, $6,000 start-year contribution, 5% real return; 0/1/10/30 years | 50000*1.05^n + 6000*1.05*(1.05^n-1)/.05 | Matches within 1e-6 | Pass |
| Retirement annual/monthly income | Final balance * .04; annual / 12 | Matches | Pass |
| Real return, 7% nominal, 3% inflation | 1.07/1.03 - 1 | Matches | Pass |
| FL same-salary relocation: $50k/$100k/$150k/$250k | $500/month housing saving, $3,100 spent moving, $14,600 cash including deposit/down payment, $2,900 first-year benefit, seven-month recovery | Matches for each salary | Pass |

## Confirmed issue

The main `MortgageCalculator.tsx` has its own functions, independent of the previously corrected shared housing helper. `calcMonthlyPI` and `buildSchedule` reject rates <= 0. `calcTotalInterest` consequently subtracts principal from zero payments. `calcPMIDropOff` rejects a zero annual rate before reaching its intended zero-rate branch. These are four manifestations of the same zero-interest handling problem. Fixing them requires production approval; tests currently use explicit `it.fails` declarations so the defects remain documented, not silently treated as correct outputs.

## Coverage limits

This increment does not finish the requested independent comparison of every calculator. Dedicated new known-answer runs are still needed for the complete page-level flows of Roth conversion, HSA/investment result assembly, compare-cities, and each regional relocation calculator. The full existing suite exercises many associated helpers and contracts but is not a substitute for those runs. No new official-site comparison, browser interaction, deployed-page check, or build was performed in this increment.

## Resolution (2026-10-14)

The zero-interest defects in `MortgageCalculator.tsx` are fixed: `calcMonthlyPI` returns straight-line principal at 0%, `buildSchedule` produces the full 120-row schedule, `calcTotalInterest` therefore returns 0, and `calcPMIDropOff` reaches its linear paydown branch (ten months in the audit case). The four `it.fails` declarations became ordinary passing tests. The full suite passes (1,999 tests).

One product decision remains: the mortgage page itself still asks for a rate between 0.1% and 30% and blocks results below that, so a user cannot reach the 0% case through the form. The helper functions are now correct if the form is ever opened to 0%.
