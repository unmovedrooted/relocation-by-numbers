# Calculator and FIRE review — live calculation follow-up

This extends `official-scenario-comparison-2026-10-14.md`. No production calculations changed. This is a coverage assessment of the calculator catalogue plus direct execution of selected component-local functions; it is **not a completed official-calculator or browser audit of every output**.

## Important correction to previous coverage

The public FIRE routes execute functions defined inside `src/components/FireCalculator.tsx`. The older `src/lib/fireSim.ts` is not the engine imported by that component. Passing tests of the old helper do not validate public FIRE results.

The new audit harness uses the TypeScript parser to extract and execute the actual component-local declarations, without rewriting them or modifying exports. React rendering, effects, URL hydration and input events are not executed. Existing shared tax functions are used for the state salary inputs; this is not a new independent validation of those state tax laws.

Run:

```powershell
npx.cmd vitest run src/lib/liveCalculatorMath.audit.test.ts --silent=false --reporter=verbose
```

The FIRE test prints 82 observations: 10 targeted formula observations, eight route/default inventory entries, and 64 first-year cash-flow observations (four salaries × FL/NC/NY/CA × four FIRE modes). Inventory entries are not independent correctness assertions. Known discrepancies are printed; the observational test passing means it executed, not that every answer is correct. The other two tests include explicit known-answer assertions for accumulation, withdrawal and RMD functions and observations of housing/401(k) defects.

## Reproduced findings, ordered by impact

| Priority | Component / routes | Scenario | Expected | Actual | Cause / recommended correction |
|---|---|---|---:|---:|---|
| High | All routes using `FireCalculator`, simple mode | Start $0, explicit annual investment $12k, one year before coast age | $12,000 portfolio | $0 | `initBuckets` stores the contribution, but `growBuckets` uses `autoContrib` in simple mode. `simulateYearsToFI` sets that to zero when an explicit contribution exists. Route explicit and automatic contributions through the same selected amount. Projection and Coast-readiness callers need the same correction. |
| High | Coast FIRE | $48k annual spending, 4% withdrawal, age40 to65, 7% nominal growth, 2.5% inflation, no tax drag | $409,905.21 coast target | $759,941.35 | `calcCoastFireNumber` inflates spending, then discounts by an inflation-adjusted return: inflation counted twice. Use nominal future target / nominal growth OR today's target / real growth, not a mixture. Difference $350,036.14. |
| High, contract clarification | Barista FIRE | $80k net current income, $48k expenses, $24k expected future part-time income, zero starting balance, automatic investing | $32,000 first-year saving if part-time work begins at semi-retirement | $56,000 | The reduced retirement spending gap is also used for accumulation spending. If part-time income is not additional current income, $24k is invented before the milestone. Separate accumulation cash flow from retirement funding gap, or explicitly model current additional earnings and their taxes. |
| High | `/401k-calculator` | Age40, $500k salary, requested50% contribution, 100% match up to6% of salary | $24,500 employee and $24,500 match under stated matching formula | $24,500 employee, $30,000 match | Employee contribution capped, but employer match still uses the requested percentage. Match actual eligible contribution, with plan assumptions disclosed; separately consider total annual-additions limit. |
| Medium | `/housing-affordability-calculator`, mortgage affordability helper | $10k gross/month, 28% housing ratio, 20% down, 0% interest, 10y, no other housing costs | $420,000 home price | $0 | `solveMaxHomePrice` returns zero for `annualRate <= 0`. Handle zero-rate amortization explicitly. |
| Medium, product behavior | Chubby/Fat FIRE | Open either route without overrides | Route-appropriate preset if intended | Both load standard mode and $4,000/month spending | `modeFromPathname` recognizes only lean/coast/barista. These are content landing pages around the same standard calculator, not distinct Chubby/Fat engines. Decide whether explicit presets are needed; not a claim the spending/withdrawal identity itself is wrong. |

### Source locations

- `src/components/FireCalculator.tsx:34`: route-to-mode selection.
- `src/components/FireCalculator.tsx:364`: spendable bucket values.
- `src/components/FireCalculator.tsx:374`: initial bucket contributions.
- `src/components/FireCalculator.tsx:402`: bucket growth; simple-mode contribution selection.
- `src/components/FireCalculator.tsx:438`: Coast target.
- `src/components/FireCalculator.tsx:457`: main FI simulation.
- `src/components/FireCalculator.tsx:523`: Coast-readiness simulation.
- `src/components/FireCalculator.tsx:547`: chart projection.
- `src/components/Retirement401kCalculator.tsx:116`: result calculation; requested-versus-capped match.
- `src/lib/housing.ts:180`: inverse affordability solver.

Line numbers reflect the audited state; use function names if later edits shift them.

## Additional issues needing targeted scenarios

These are source-level concerns, not quantified official-calculator mismatches in this batch.

1. Coast target uses Phase 1 return only, while full projections can switch to Phase 2. Brokerage drag and traditional-account withdrawal haircut also differ between the Coast threshold and spendable FI simulation. Test one consistent age, dollar basis and account-treatment contract before changing it.
2. Coast readiness compares against a fixed target and projects contributions beyond the configured coast date; automatic contributions there subtract uninflated spending. The target says “needed by coast age,” while readiness compares current nominal balances. These timing differences deserve explicit date-based tests.
3. Simple FIRE take-home subtracts `k401Pct` through the tax engine, but simple-mode buckets contain only brokerage investment. Determine whether deferred 401(k) contributions should also build the portfolio. In advanced mode, actual contribution inputs and the tax-engine percentage are separate inputs.
4. FIRE grows the initial net income by salary growth rather than recomputing tax from each year's gross income. This is an approximation, not full bracket-aware future take-home.
5. HSA computes payroll tax savings by reducing wages. That describes eligible payroll contributions, not a direct personal contribution. Confirm the UI makes the funding-method assumption clear. Its CA/NJ return-drag estimate becomes zero when the user's own contribution is zero, even if employer contributions or existing balances generate taxable earnings.
6. Investment/401(k)/HSA tools generally put a full year's contributions in at the beginning of the year. A field described as “monthly contribution” will not match a monthly-deposit official calculator without aligning timing. Treat this as a model-assumption difference before calling it a formula bug.
7. Europe salary-needed calculation divides desired net income by `1 - current effective tax rate`. With progressive tax it generally does not solve the gross income that actually produces the desired net. It needs a re-evaluated tax inverse if presented as more than an approximation.
8. South America multiplies entered destination costs by city factors, whereas Europe/Asia explicitly avoid reapplying factors to city-specific values. Trace presets and intended units before deciding whether this double-scales a specific cost.
9. Asia/South America household multipliers permit fractional counts in the calculation; Europe's counts are floored. Decide a consistent household-input contract.
10. Regional savings coverage is not uniform: several pages use savings before upfront spending, whereas Caribbean uses remaining savings after moving. Labels must distinguish these meanings.

## All listed calculator routes: coverage register

“Reviewed” below is not a release approval. Prior official-rule checks remain limited to the profiles in the first report.

| Route / family | Evidence now available | Outstanding validation |
|---|---|---|
| `/` US relocation | Shared wage matrix from first report; cash-flow/result wiring inspected | Full UI scenarios, estimate overrides and all state/city combinations |
| `/compare-cities`, `/compare` | Shared compare-engine dependencies mapped | Full origin/destination/FX and generated-pair scenarios |
| `/one-income-relocation-calculator` | `householdNetAnnual` and relocation cash-flow implementation inspected | Salary-needed inversion, joint/two-earner and moving-cost UI cases |
| `/paycheck-calculator`, `/income-tax-calculator` | Prior 16 salary net-income comparisons | Pay frequency/withholding distinctions, cities, joint returns and limits |
| `/mortgage-calculator` | Prior positive/zero-rate P&I cases; affordability defect reproduced | PMI, cash to close, refinance, extra payments and all tabs |
| `/housing-affordability-calculator` | DTI wiring inspected; zero-rate defect reproduced | PMI/insurance agreement between solver and displayed breakdown; rounded maximum should not exceed ratio |
| `/rent-vs-buy-calculator` | Prior four zero-rate equity identities | Full growth/tax/cash timing and break-even cases |
| `/fire-calculator` | Actual live functions executed; contribution bug | Full-horizon independent model and UI updates |
| `/fire-number-calculator` | Same live standard engine; zero-year $1.2m target test | Target year/dollar-basis presentation |
| `/lean-fire-calculator` | Lean route/default identified; live mode exercised | Relative comparisons and all assumptions |
| `/barista-fire-calculator` | Live mode exercised; premature income offset identified | Define part-time start, taxes and growth |
| `/coast-fire-calculator` | Live target executed; double inflation confirmed | Phase/account/age consistency and no-contribution trajectory |
| `/chubby-fire-calculator`, `/fat-fire-calculator` | Both identified as standard engine/defaults | Product preset decision; same contribution defect applies |
| `/savings-rate-for-fire` | Standard engine identified; four-state salary matrix | Savings-rate table against independent full-horizon model |
| `/how-much-do-i-need-to-retire`, dynamic salary pages | Additional shared FireCalculator consumers identified | Page-specific inputs and generated content |
| `/complete-retirement-plan` | Prior four federal senior cases and four RMD cases; existing suite | Whole-horizon external benchmarks; state/city/IRMAA/strategy interactions |
| `/retirement-calculator` | Shared accumulation/withdrawal dependencies and timing inspected | Full result callback and future taxes |
| `/401k-calculator` | Actual result callback executed; match bug; four growth checks | Total limits, catch-up routing and future contribution assumptions |
| `/hsa-calculator` | Actual growth function, four zero-return cases; tax-saving code inspected | Eligibility, funding method, CA/NJ drag and excess contributions |
| `/retirement-withdrawal-calculator` | Actual depletion and safe-withdrawal functions, four balance cases | Tax gross-up and nonzero-return/Monté Carlo scenarios |
| `/rmd-calculator` | Actual standalone age75 divisor executed (not just Complete Plan's table) | Full table, cohort transitions, beneficiary exceptions and displayed tax |
| `/roth-conversion-calculator` | Incremental-tax and growth code inspected in prior batch | Basis, opportunity cost, early penalties, state retirement treatment |
| `/investment-calculator` | Shared growth checks; component's beginning-year deposit timing inspected | Monthly deposits, real/nominal and nonzero-volatility distributions |
| `/international-relocation` | Prior UK/SG comparisons; income and budget dependencies | Other countries, residence assumptions and complete budgets |
| `/europe-relocation-calculator` | UK tax dependency; household, cost and income-needed code inspected | Country-specific rules and progressive inverse salary |
| `/asia-relocation-calculator` | Prior Singapore cases; family/expense/FX code inspected | Other countries and origin-cost assumptions |
| `/caribbean-relocation-calculator` | Prior Jamaica bracket discrepancy; savings/cost flow inspected | Current TAJ confirmation, payroll, other islands |
| `/south-america-relocation-calculator` | Unit-contract/cost flow inspected | Independently verified country cases and preset scaling |

## Confirmed passing narrow checks

- Standard automatic first-year investment: $80k net minus $48k spending = $32k.
- Already financially independent: $1.2m spendable and $48k spending at 4% returns zero years.
- FIRE employer match: $100k income, $6k employee contribution, 50% match to6% = $3k.
- Coast with zero inflation: $1.2m / 1.07^25 = $221,099.01; the inflation-specific defect disappears at zero inflation.
- Actual standalone 401(k) and HSA accumulation functions at zero return: balance plus ten annual $12k contributions.
- Actual withdrawal function funds 20 years with balance/20 at zero return; inverse withdrawal solver agrees.
- Actual standalone RMD divisor at75 is24.6.

These checks do not establish that 4% withdrawals are guaranteed safe or that deterministic return assumptions predict real outcomes. No new official interactive calculator comparisons were performed.

## Recommended correction sequence

1. Fix and regression-test the shared FIRE explicit-contribution path.
2. Correct Coast inflation once and reconcile its target age, phase returns and tax treatment.
3. Approve Barista's income-start contract, then separate accumulation from semi-retirement cash flow.
4. Correct capped 401(k) matching and zero-rate affordability.
5. Address prior standalone senior-tax and Jamaica findings after confirming relevant contracts/current rules.
6. Complete the outstanding route scenarios before claiming site-wide mathematical validation.

Only this audit report and `src/lib/liveCalculatorMath.audit.test.ts` were added. No production corrections, commit or push.

## Corrections applied (2026-10-14, after this review)

Re-running `liveCalculatorMath.audit.test.ts` now shows all four reproduced defects matching their references:

1. **Explicit yearly investment (simple mode):** `growBuckets` now uses the configured amount whenever the user entered one; the automatic amount applies only when it is blank. Explicit $12k now gives $12,000 after one year in all four modes.
2. **Coast number:** discounted at the nominal return, with spending inflated to the retirement date. The reference scenario gives $409,905.21 (was $759,941.35).
3. **401(k) match:** based on the contribution actually made after the IRS limit. The capped $500k / 50% case gives a $24,500 match (was $30,000). The missed-match figure uses the same effective percentage.
4. **Zero-rate affordability:** `solveMaxHomePrice` handles a 0% rate as straight-line principal. The $10k/month, 28%, 20% down, 10-year case gives $420,000 (was $0).

Not changed, awaiting a product decision: Barista FIRE's part-time income before the semi-retirement date; the Chubby and Fat FIRE pages loading the standard preset; and the source-level concerns in the "Additional issues" list. The audit test remains observational and records values, so it does not fail if a defect returns.

## Second round of corrections (2026-10-14, owner decisions applied)

Decisions: Barista part-time income is extra earnings from today; Chubby and Fat FIRE get preset spending; the ten smaller issues are fixed.

- **Barista FIRE:** kept as extra income from today. The field is now labelled "after tax" with an explanation, so no untaxed gross figure is added. The audit row now records $56,000 ($32,000 plus the $24,000 extra earnings) as the intended result.
- **Chubby and Fat FIRE:** their pages start at $10,000 and $20,000 a month with an income and portfolio that make the target reachable (Chubby $250,000 income, $250,000 portfolio; Fat $500,000 income, $750,000 portfolio). The inputs remain editable and "Reset" restores them.
- **Issue 1 (Coast target):** growth now uses the return for each year between the coast age and retirement (Phase 1 then Phase 2), less brokerage tax drag on the taxable share, and the target is grossed up for the withdrawal tax on traditional accounts.
- **Issue 2 (Coast readiness):** spending is inflated each year and contributions stop at the coast age.
- **Issue 3 (simple-mode 401(k)):** the deferral is now saved in a 401(k) bucket (grown with salary) because take-home pay already excludes it.
- **Issue 4 (net income growth):** left as an approximation (take-home grows at the salary-growth rate) and disclosed in "How this estimate works".
- **Issue 5 (HSA):** the CA/NJ drag uses a fixed $1,000 marginal-rate probe so it does not vanish at zero own contribution; the contribution tooltip states the payroll-funding assumption.
- **Issue 6 (contribution timing):** kept (start of year) and disclosed in the FIRE methodology note; the HSA tool already states it.
- **Issue 7 (salary needed):** Europe and International now solve for the gross that produces the needed net with `src/lib/grossForNet.ts` (bisection against the destination's tax scale), with unit tests.
- **Issue 8 (South America scaling):** destination inputs are no longer multiplied by city multipliers; the origin estimate uses the origin/destination multiplier ratio, as Europe does.
- **Issue 9 (household counts):** Asia and South America floor adult and child counts like Europe and International.
- **Issue 10 (savings coverage):** all five regional calculators now compute months covered as savings after upfront costs divided by monthly outflow, and say so in the label.

Validation: type check, lint (0 errors) and 1,984 tests pass; FIRE, Europe, South America and HSA pages load without console errors. The live-calculator audit now carries regression assertions for the fixed FIRE cases.
