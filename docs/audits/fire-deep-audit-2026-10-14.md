# Dedicated FIRE audit — 2026-10-14

## Verdict and scope

**Do not certify all FIRE calculators as correct.** Ordinary accumulation is consistent with independently computed monthly deposits, but Coast readiness, advanced balances, future deferrals, and decision recommendations have confirmed discrepancies.

Audited current tracked source at `54f4a70`. Tracked working tree was clean initially; four unrelated untracked items were left alone. Production code was not changed. All eight Tools routes use `src/components/FireCalculator.tsx`. Also identified reuse on `/how-much-do-i-need-to-retire` and generated salary pages; shared defects reach those consumers too.

Verification: actual production functions extracted with TypeScript AST and executed, independent month-by-month reference calculations, 100 seeded bounded invariant scenarios, route-source checks, URL helper tests, and static tracing of UI, hooks, sharing and recommendations. No browser interaction or live deployed-page validation was performed. No new authoritative tax-law validation was performed; this report distinguishes mathematical/model errors from tax assumptions.

## Route verdicts

| Route | Engine / defaults verified | Verdict |
|---|---|---|
| `/fire-calculator` | Standard; $4,000 monthly spending | Core ledger passes; shared advanced/move/deferral defects |
| `/fire-number-calculator` | Standard; $4,000 | Shares projection engine; headline target is at projected FI year, not necessarily today's spending / SWR; clarify nominal year |
| `/lean-fire-calculator` | Lean; $2,500, 3.5% SWR | Core ledger passes; shared defects and missing share route |
| `/barista-fire-calculator` | Barista; $5,000 and $24k side income | Core ledger passes under approved current after-tax side-income contract; description, inflation and savings-rate explanations need alignment; missing share route |
| `/coast-fire-calculator` | Coast; coast age 40, retirement 65 | High-risk target-date/readiness defects; missing share route |
| `/chubby-fire-calculator` | Standard; $10,000/month, $250k gross income, $250k portfolio | Presets now correct; standard shared defects apply |
| `/fat-fire-calculator` | Standard; $20,000/month, $500k gross income, $750k portfolio | Presets now correct; standard shared defects apply |
| `/savings-rate-for-fire` | Standard; shared savings sensitivity table | Table does not reliably impose advertised rates when explicit/advanced contributions are configured |

## Calculation and data-flow map

Route → mode + spending preset → defaults + optional income/move URL hydration → state inputs.

- Income/state/filing/401(k)% → `makeNetPath` → annual take-home function. Gross salary grows by salary growth; tax-engine inputs are deflated and outputs reinflated using the model's inflation indexing assumption.
- Balances/contributions/account tax treatment → `initBuckets` → `growBuckets` → `calcSpendableFromBuckets` → first annual FI threshold crossing.
- Expenses × 12 → Barista offset if applicable → annual inflation → divide by withdrawal rate → spendable target.
- Annual returns switch at `phase2StartsYear`; brokerage subtracts percentage-point drag. Monthly deposits use effective monthly growth consistent with the annual rate.
- Coast target → `portfolioShares` approximation → weighted drag/tax haircut → fixed readiness comparison. This is not an exact bucket simulation.
- Same ledger → projection chart. Separate decision-engine overrides do not all preserve the intended scenario semantics.
- Move card uses a moved net-income path; decision recommendation and city comparison sections use different scenario paths.

## Confirmed findings, ordered by impact

### High — Coast target has the wrong date basis

`FireCalculator.tsx:504–523`, `:605–626`, `:1320–1326`.

Spending is entered at current age, but the age-at-coast target inflates it only from coast age to retirement. It omits inflation between current age and coast age. It then compares that age-at-coast target against today's portfolio and against later years without moving the target's date.

Known answer: current age 30, coast 40, retirement 65, $4,000/month spending, SWR 4%, inflation 2.5%, constant 7% return, no drag.

- Correct balance **at age 40**: `48000 * 1.025^35 / .04 / 1.07^25` = **$524,713.32**.
- Actual: `48000 * 1.025^25 / .04 / 1.07^25` = **$409,905.21**.
- Understatement: **$114,808.11**.
- A different question—whether the user could stop contributing today—requires discounting from age 30, not comparing today's balance to the age-40 threshold.

Another executed case: age 30, coast 30, retirement 31, $1,000 portfolio, $100/month spending, no contributions, 7% return, zero inflation. Readiness is returned in **50 years**, after the requested retirement date. It should report that the selected retirement objective cannot be reached without changing assumptions, not a later readiness milestone for the same retirement date.

Correction: define the exact date of each target, project spending from today, simulate actual account buckets to retirement, and constrain readiness to the valid horizon. Remove the fixed horizontal target as a timeless comparison.

### High — Advanced zero brokerage can restore money that is not there

`FireCalculator.tsx:344–347`, `:429–458`, `:1385–1391`.

`applyBrokerageAutofill` treats zero as missing on every calculation. Example: simple portfolio $75k, advanced 401(k) $75k, explicitly zero brokerage → actual total **$150k**, not the intended $75k in account entries. A $75k move cost that reduces $75k brokerage to zero triggers the same autofill and restores **$75k**. Both are executed reproductions.

Correction: autofill once on a deliberate mode transition; never inside arithmetic. Preserve an explicit zero. Handle moving costs exceeding liquid funds explicitly instead of dropping the remainder.

### High — Simple 401(k) credited savings diverge from tax deductions

`FireCalculator.tsx:441–445`, `:474–477`, `:400–421`.

The initial annual deferral is capped, then future saving grows that capped amount by salary growth. The tax path recalculates the raw percentage against each year's inflation-indexed cap. These are not equivalent.

Executed example: $500k salary, 10% contribution, 0% salary growth, 3% inflation, year 10. Model-consistent deferral = min($50k, $24,500 × 1.03^10) = **$32,925.95**. Credited deferral = **$24,500**. **$8,425.95** is deducted from cash but not credited to investments that year. This is verification against the tool's own indexing contract, not a prediction of future IRS limits.

Correction: share one year-specific deferral calculation between the net-income path and investment ledger. Also update moved income/state in the ledger inputs, not only the net-income function.

### High — Move recommendation is inconsistent with move result

`FireCalculator.tsx:763–786`, `:842–855`, `:1369–1393`.

Decision engine changes spending only and keeps the original net-income function. Changing moved income from $100k to $1k, state from FL to NY, and moving cost from $0 to $1m produces **identical decision-engine output** in an executed test. The dedicated move result does consider these inputs. Users can receive a recommendation that ignores costs and tax/income changes they supplied.

Correction: use one fully specified scenario evaluator for recommendations and the move card. The city comparison grid is explicitly labeled as a spending-only comparison; that disclosed sensitivity is not equivalent to a complete move forecast.

### Medium — Advanced investment boost can do nothing

`FireCalculator.tsx:449–458`, `:878–885`.

Recommendation changes `yearlyInvestment`, but advanced mode uses `contribBrokerage` when nonzero. Executed: advanced $12k brokerage contributions; changing simple annual contribution to $17k leaves end balance and FI year exactly unchanged. Similarly, the savings-rate table changes expenses but retains configured contribution amounts; its advertised saving rate is not necessarily the actual saving rate used.

Correction: define a scenario budget and apply changes to the actual active account contributions, with clear funding assumptions.

### Medium — Fractional horizons produce different chart/result lengths

`FireCalculator.tsx:570`, `:646`, `:663`, `:1791`.

Horizon is clamped but not rounded. Shared field accepts decimal strings. With horizon **1.5**, simulation executes two full years (`while years < maxYears`); chart displays only one full year (`for y <= stopAt`). Executed mismatch. Fractional ages and phase/coast boundaries also need an explicit convention and ordered-age validation.

Correction: validate integer year inputs consistently or support fractional periods consistently. Updating current/coast age must revalidate dependent ages.

### Medium — Shared “tax rate” includes retirement saving

`FireCalculator.tsx:1274–1277`, `:1896`; `wageTax.ts:349`.

The rate uses `(gross - takeHome)/gross`; take-home excludes employee deferrals. Therefore saving into a 401(k) is counted as tax. Savings rate also excludes those newly modeled deferrals and can diverge from the portfolio contributions and Barista side income.

Correction: derive tax rate from tax components; choose and label a gross/net savings-rate denominator and account for the full saving flow.

### Medium — Mode-specific share routes are absent

`FireCalculator.tsx:1499`; route inventory and `next.config.ts` inspected.

Share handler generates `/lean-fire-calculator/share`, `/coast-fire-calculator/share`, `/barista-fire-calculator/share`. Only `/fire-calculator/share` exists; no matching redirects were found. Source-confirmed missing targets, not a live HTTP test. Chubby/Fat both use standard share and lose preset identity.

Correction: use the existing common share route with explicit mode/preset, or implement the intended destinations.

## Correct calculations verified

| Check | Independent reference | Result |
|---|---|---|
| All 8 route modes and spending presets | Explicit route expectations, not self-comparison | Pass |
| All four modes, 0% and 2.5% inflation | Independent 12-step-per-year deposit ledger, annual threshold crossing | Pass under configured contracts |
| Projection/result agreement | Compare chart at FI or horizon with independent ledger | Pass for integer horizons |
| Advanced 401(k)/IRA/brokerage, 1-point brokerage drag | Three separate monthly ledgers | Pass |
| Employer match | $100k pay, $6k contribution, 50% match to 6% → $3k | Pass |
| Traditional withdrawal haircut | 20% of traditional balances only; brokerage unchanged | Pass as a simplified assumption |
| Phase transition | All three return presets; switch after two years; four-year monthly ledger | Pass |
| Already FI | $1.2m, $48k spending, 4% → zero years | Pass |
| No income/capital/contributions | Cannot reach a positive spending target | Pass |
| Zero spending | Zero target / immediate FI mathematically | Pass; UI readiness gate may suppress display |
| 100 seeded bounded cases | More initial capital must never delay FI; finite end balances | Pass |
| Move URL helpers | Existing parse/build and validation tests rerun | Pass within their contract |

## Assumptions requiring explicit decisions, not silent formula changes

- Barista's approved contract is extra after-tax income earned from today. It reduces target expenses AND increases automatic saving now. It also effectively grows with spending inflation. Do not reclassify the current-income treatment as a bug; clarify the UI, which otherwise suggests income only after semi-retirement. Specify what happens when side income exceeds spending.
- “Volatility” presets choose deterministic return levels; this component has no random sequence or success-probability simulation. A higher preset is not a quantified risk calculation.
- Advanced contributions are entered as absolute amounts, not affordability-constrained or eligibility-validated. Traditional/Roth choices affect final valuation but do not recalculate take-home from advanced contribution amounts. Roth qualification, early access penalties, basis and statutory limits are not comprehensively modeled here. Do not imply Complete Retirement Plan-level tax treatment.
- Coast mixes accounts via weighted return/haircut approximations. Account weights change during growth; a weighted-rate product is not the exact sum of separate account growth. Simple Coast assumes all money taxable even though simple accumulation now adds 401(k) contributions.
- `makeNetPath` scales the entire wage tax engine with one inflation factor, not category-specific rules. Future legal fidelity remains unverified. State selection also chooses a baseline city automatically; users cannot select their own current city on this form.
- Default headline FIRE target is nominal at the projected FI year, so changing returns/income can change the displayed target through the year of crossing. Today's spending / SWR and future nominal target should be distinguished.
- A deficit is clamped to zero saving; living shortfalls do not draw down investments. Explicit saving can exceed available income. These are accumulation assumptions, not full household cash-flow sustainability checks.

## URL, reset, input and AI handoff review

- Ordinary changes are held in React state, not serialized into a complete scenario URL. Reload restores defaults plus supported `income` and relocation-link values, not all edits.
- Relocation link builder intentionally rounds dollars and 401(k)% to one decimal; parser validates bounds, states, filing and destination-city membership. Original current city is not retained.
- Share is a result summary, not a reproducible scenario. Age, balances, contributions, return settings and most assumptions are absent.
- Reset restores mode/preset defaults and original `initialIncome`. It does not reset all auxiliary flags such as `linkedMove`, `abroadLabel`, pinned comparison or share status; descriptions can remain stale.
- Numeric fields commit on blur, not every keystroke. Blank/nonfinite values parse to zero; per-field clamp then applies. Full keyboard/browser behavior was not executed.
- AI handoff includes headline outputs and account values but not mode, Barista income, Coast age, phase-return settings or contribution schedules. Mode-aware report interpretation needs explicit validation; this audit did not invoke a paid AI provider.

## Test results and exact files

- Added `src/lib/fireDeep.audit.test.ts`: 30 tests, including 100 deterministic invariant scenarios inside one test. Eight observation tests intentionally reproduce wrong current behavior; they are clearly separated from correctness tests.
- Focused FIRE + existing link tests: **54 passed**.
- Full repository suite: **125 files, 2,058 tests passed**.
- TypeScript and lint on the new audit file: passed.
- No production build or browser matrix run in this audit. Runtime UI, hosted share URLs and tax-law completeness are not certified.
- Added this report. No production formulas, defaults, labels or UI changed. No commit or push.

## Proposed correction order

1. Separate one-time initialization from arithmetic; stop restoring zero balances and lost move costs.
2. Define Coast date semantics, replace readiness approximation with retirement-horizon bucket simulation, validate ordered ages.
3. Unify year-specific employee deferrals and moved-scenario income across tax and savings ledgers.
4. Make recommendations and sensitivity tables use the same scenario inputs and active contribution model as displayed results.
5. Correct tax/savings-rate labels and integer horizon handling.
6. Repair share targets; decide whether full scenario restore is a product requirement.
7. Add UI/browser regression scenarios and mode-aware report tests before certifying these paths.

Likely production files: `src/components/FireCalculator.tsx`, `src/lib/fireLink.ts`, `src/lib/incomeParam.ts`, `src/components/FireReport.tsx`, common share page/handler, and mode-page descriptions where assumptions differ. Shared wage-tax changes should be avoided unless separately justified; the deferral mismatch can be resolved at the FIRE integration boundary.

## Corrections applied (2026-10-14)

All findings except the AI-report handoff were corrected in `FireCalculator.tsx`, with the eight observation tests rewritten as correctness tests and new ones added (32 tests in `fireDeep.audit.test.ts`).

- **Coast dating (high):** `coastTargetAtYear` dates every target. Spending is inflated from today to the retirement age; the number needed at any future moment is the retirement target discounted by the growth between that moment and retirement (phase-aware, less brokerage drag, grossed up for withdrawal tax). The headline number at age 40 in the audit case is now $524,713.32. Readiness is the first year the balance meets that year's dated target and is `null` when the retirement target cannot be reached before the retirement age (the age-30/31 case no longer reports 50 years). "Coast-ready today" compares today's balance with the amount needed today, and the chart's Coast line is the per-year requirement, not a flat line.
- **Advanced zero brokerage (high):** arithmetic uses the balances as entered; turning Advanced on copies the simple portfolio and yearly investment into empty brokerage fields once. A moving cost is paid from taxable savings, then the IRA, then the 401(k) (no tax or penalty modelled), and the move card warns when the cost exceeds all savings.
- **Simple 401(k) deferral (high):** one function, `simpleDeferralForYear`, gives each year's deferral (percentage of that year's pay, capped at the inflation-indexed limit) and the ledger credits exactly that. Year 10 in the audit case is $32,925.95 credited, matching the tax path. The moved scenario now also uses the moved income and state in the ledger.
- **Move recommendation (high):** the recommendation and the move card use one `buildMovedScenario` (moved income, state taxes year by year, moving cost, spending).
- **Investment boost and savings table (medium):** what-if scenarios add money through `scenarioExtraSaving`, which works in automatic, explicit and advanced saving. The savings table sets the saving each row advertises (automatic: spending; explicit: the yearly investment; advanced: brokerage contribution). The "lower spending" and "raise savings rate" scenarios invest the freed cash when saving is configured. The savings rate shown is the saving that actually happens, as a share of take-home pay plus 401(k) saving plus Barista side income.
- **Fractional horizons (medium):** the simulation and the chart use the same whole number of years (`horizonYears`); ages and phase years are whole numbers and keep current <= coast <= retirement.
- **Tax rate (medium):** computed from tax components, so 401(k) saving is no longer counted as tax.
- **Share routes (medium):** every mode shares through the existing `/fire-calculator/share` page, with the FIRE age added to the query.
- **Smaller items:** Reset clears the move/share/pinned flags; the Barista panel explains that the side income is extra after-tax income from today, grows with inflation and is capped by spending; the FIRE-number card says it is in the dollars of the year it is reached.

**Not changed (needs a decision):** the AI report handoff still sends only the current fields (age, state, balances, headline outputs). Adding the mode and its settings means changing the request shape, the server prompt and the privacy page's list of what is sent, and it was not tested against the paid provider. Also unchanged and documented in the audit: volatility presets are deterministic returns, advanced contributions are not checked against statutory limits, simple Coast treats all money as taxable, and scenarios are not restored from the URL.

## AI report handoff (2026-10-14)

The report request now carries the calculator mode (and the Chubby or Fat preset), the Coast settings (coast age, retirement age, the Coast number, whether coast-ready, years to coast), the Barista part-time income, the return preset, inflation, and how saving is configured (yearly investment, or the three advanced contributions). The server validates each new field (allowed values and bounds; unknown fields are still rejected). The prompt is built in `src/lib/fireReportPrompt.ts` and is mode-aware: a Barista FIRE number is computed on the gap left by part-time income, a Coast plan states its dates and readiness and says the FIRE age is for full FIRE, and the model is told not to treat a Coast or Barista plan as a standard one. The privacy page and the notice above the "Generate" button list the extra fields.

Tested: prompt content for every mode, request validation for each new field, and the full request path with the provider mocked (streaming, prompt sent, older request shape still works). The real Coast and Barista pages send bodies the server accepts. **Not tested against the live provider**: no `ANTHROPIC_API_KEY` is configured in this environment, so the final call returned 503 as designed. The route still names the model `claude-sonnet-4-6`.
