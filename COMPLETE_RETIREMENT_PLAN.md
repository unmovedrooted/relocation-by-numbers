# Complete Retirement Plan — implementation contract

## IRA and catch-up rules milestone

The restricted 2026 annual integration is now available through
`runEligibleContributions2026`: explicit MAGI handling, funded-only IRA deductions
and basis separation, and consent-based required Roth catch-up routing. See
`src/lib/retirementPlan/ELIGIBILITY_INTEGRATION_CONTRACT.md`. The exact broad MAGI
solver, future years and preview controls remain unfinished.

The internal `contributionEligibility.ts` module now evaluates verified 2026 IRA
contribution room, Roth income phaseouts, traditional deduction-phaseout status,
and ordinary 401(k) catch-up capacity/Roth requirements. It rejects unsupported
years and requires explicit compensation, IRA-specific MAGI and sponsor-wage
inputs. See `src/lib/retirementPlan/CONTRIBUTION_ELIGIBILITY_CONTRACT.md` for sources
and limitations. It is not connected to the timeline/UI yet; deduction amounts,
MAGI derivation, spousal compensation and future-year policies remain unfinished.

Approved September 4, 2026. New route: `/complete-retirement-plan`.

The existing standalone calculators remain independent. This plan starts in the
current calendar year, supports one or two people with individual retirement ages,
and uses today's-dollar household spending excluding income taxes. Healthcare is
included in spending. Contributions stop at each owner's retirement. Optional
survivor assumptions specify death ages and survivor spending.

The calculation must reconcile each year's cash: income + account distributions
+ any unfunded shortfall = spending + tax + contributions + reinvested surplus.
Conversions transfer value between accounts and never count as spending cash.
RMDs are based on prior December 31 balances and satisfied before conversions.
Excess distributions remain household wealth in a taxable cash account.

Strategy selection must compare no conversion with explainable bracket-target
policies. Funding spending takes priority, followed by estimated after-tax terminal
wealth. Simulation policies cannot inspect future market returns. Repeated seeded
market paths must be identical across policies and spending-search candidates.
Maximum spending targets 90% success by default, with a user-adjustable target.

Tax and account modeling must distinguish ordinary income, qualified dividends,
short/long capital gains, Social Security and retirement distributions. Account
labels are not tax classifications. ESPP requires purchase/offering dates, purchase
price, offering-date value, purchase-date value and offering-date option price.
Sale basis is adjusted for compensation already recognized. No guessed discount
percentage replaces these values.

All calculations run locally. Share state uses a versioned URL fragment, not query
parameters. Saving is an explicit local-browser action. Export is local. Financial
payloads are never sent to an AI or server by this planner.

Implementation sequence: independently tested financial primitives; annual cash
ledger; strategy evaluation; seeded Monte Carlo in a worker; validated inputs and
results; navigation and metadata; end-to-end verification. This sequence does not
reduce the approved scope. Do not release incomplete calculations as a finished
planner.

Reference sources:
- https://www.irs.gov/publications/p525 (ESPP, examples 10 and 11)
- https://www.irs.gov/publications/p590b (distributions and RMD tables)
- https://www.irs.gov/instructions/i8606 (IRA basis and conversions)
- https://www.irs.gov/irb/2025-45_IRB (2026 inflation adjustments)
- https://www.irs.gov/publications/p915 (Social Security taxation)

Known existing dependencies: `tax.ts` is a 2025 planning estimate, including state
approximations; `retirementTax.ts` models withdrawals in isolation; `monteCarlo.ts`
provides a reusable seeded PRNG. Reusing code does not certify tax accuracy.

## Annual cash-settlement layer

`src/lib/retirementPlan/cashFlow.ts` settles one nominal-dollar year for a candidate
withdrawal/conversion policy. It accepts required distributions from the statutory
rules layer and requires an explicit combined-household tax callback. It is not a
standalone tax calculator and is not connected to a public page.

- Required withdrawals precede conversion transfers. Transfers retain ownership
  and are not spendable cash. Invalid or oversized transfers fail explicitly.
- Optional withdrawals follow the supplied account order. Accounts omitted from
  the order are not silently liquidated, even when this leaves a shortfall.
- Tax is re-evaluated during gross-up, including the additional tax on withdrawals
  used to pay conversion taxes. The callback receives required/voluntary amounts,
  conversions, income by owner, and year-end balances for IRA basis calculations.
- Excess cash is reinvested in an explicit zero-return settlement reserve. A HYSA
  earning taxable interest must be modeled separately, not mislabeled as this
  temporary reserve. Return and distribution timing are annual planning assumptions.
- Returns apply after cash flows. Cash and portfolio reconciliation residuals are
  returned for diagnostics. Unpaid spending/taxes and unmet RMDs are separate results.
- Funding search requires continuous, nondecreasing cash after tax. Sampled
  violations throw, but sampling is not a proof of monotonicity. The household tax
  adapter must establish this contract; tax cliffs need a different candidate search.
- Inputs and intermediate totals have finite bounds; the current internal monetary
  bound is $1 trillion, not a tax/legal limit. Inputs and callback contexts are not
  mutated. The ledger uses no network, storage, clock, or random-number APIs.

Tests use explicitly controlled tax functions to independently verify cash
accounting. They also exercise the real RMD, Social Security inclusion and IRA-basis
helpers. Passing these tests does not validate a complete household tax return.

Still required before the complete planner can ship: completion of account-specific
tax/basis exclusions, automatic contribution eligibility and employer matching,
full tax and survivor handling,
explainable strategy comparison, seeded worker-based simulations and spending
search, UI/share/save/export integration, and full end-to-end verification. The
approved full scope remains unchanged; this internal layer is not a reduced v1.

## Account-specific tax-character layer

`src/lib/retirementPlan/accountTax.ts` adds isolated transaction-level basis and
tax-character handling. Its full contract and remaining integration boundaries
are in `src/lib/retirementPlan/ACCOUNT_TAX_CONTRACT.md`. It does not replace the
household tax engine. Integration tests exercise the existing annual ledger with
controlled tax rates; no public route or existing calculator imports this layer.

## Connected one-year household engine

`householdYear.ts` now connects account tax character, RMDs, conversions, voluntary
withdrawal gross-up, annual growth and final basis snapshots to `householdTax.ts`.
The detailed supported-input contract is in
`src/lib/retirementPlan/HOUSEHOLD_YEAR_CONTRACT.md`.

This is a tested internal milestone, not the complete planner. Federal base rules
are explicitly 2026; future years require an explicit projection policy. State
treatment remains the existing 2025 wage-based proxy, not verified state retirement
taxation. Survivor attribution, strategy search and simulations remain unfinished.
The only change to an existing calculator dependency is exporting the unchanged
`sumBrackets` function from `tax.ts`; existing formulas and datasets are untouched.

## Multi-year timeline

`src/lib/retirementPlan/timeline.ts` now expands independent retirement dates and
dated wage, pension, Social Security and contribution schedules into connected
annual settlements. It carries final balances, lots, IRA/Roth basis, conversion
years and regular-tax capital losses forward. It reports the first unfunded year
and does not erase that failure if income resumes later.

The internal caller must choose inflation and future bracket/payroll growth;
no public-facing default has been selected. Statutory fixed thresholds remain
nominal; the temporary senior deduction expires after 2028. State rules remain
the explicitly frozen proxy. Contributions require explicit per-owner/year
capacities; automatic eligibility/phaseouts and employer matching are not done.

See `src/lib/retirementPlan/TIMELINE_CONTRACT.md` for timing, contribution funding,
manual examples, exclusions and test coverage. This completes the connected
timeline milestone, not the approved full public product.

## Local preview (September 5, 2026)

`/complete-retirement-plan` now renders only in development on a loopback host.
Production requests call `notFound`; metadata is noindex/nofollow and the route
is absent from navigation and sitemap. The shared layout loads ad/analytics
scripts only in production, leaving production behavior unchanged.

The illustrative preview exposes one/two-person inputs, dates, income streams,
cash, editable accounts, growth assumptions and the real annual table.
It fixes the scenario to Florida, zero contributions/conversions, no survivor,
standard deductions and the Uniform Lifetime table. Defaults are fictional
examples, not approved product defaults. It has no API, URL-state or persistence
path. Editing invalidates prior results; Run projection recomputes; reset/reload
restores the example. Eligibility inputs, optimizer,
simulation and finished product UI remain separate unfinished work.

### Local account editor

The preview now supports adding, removing, ordering and assigning accounts to
either person: traditional IRA, traditional 401(k), Roth IRA, Roth 401(k),
brokerage lots, cash/HYSA, Section 423 ESPP lots and restricted deferred annuities.
The adapter in `previewAccounts.ts` validates drafts and calls the unchanged
account/timeline engines. IRA and Roth IRA basis/history are owner-level; plan
basis remains account-level. Switching to a single-person household retains but
excludes Person 2 drafts. Removing an owner's last account with basis/history
requires explicitly resolving that history rather than silently transferring it.

Household settlement cash remains first in the withdrawal order; editable cards
follow their displayed order. Brokerage/ESPP opening balances derive from shares
and current prices. Unsupported RMD tables, Roth in-plan rollovers and annuity
contracts/charges are rejected explicitly. This editor does not add account
linking, storage, contributions, conversion recommendations or production access.
## Contribution/match foundation

`src/lib/retirementPlan/contributionPlanning.ts` adds independently tested request
caps and actual-funded-deferral matching arithmetic. The employer ledger now
connects explicit verified annual terms to the timeline; the local editor exposes
regular traditional/Roth 401(k) contributions and a single-tier employer match.
Unconfigured projections are unchanged. See
`src/lib/retirementPlan/CONTRIBUTION_PLANNING_CONTRACT.md` for supported assumptions,
known-answer examples and required employer-inflow integration. Automatic
eligibility and the full contributions/employer-match milestone remain unfinished.
