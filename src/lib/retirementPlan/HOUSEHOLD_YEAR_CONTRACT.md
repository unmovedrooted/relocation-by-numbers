# Connected household year: supported contract

Internal milestone, September 4, 2026. No public UI or existing calculator calls
this engine. Passing its tests is not certification of a complete tax return.

## Flow and state

`runHouseholdYear` uses nominal USD. Opening accounts and explicit owner metadata
feed RMDs, conversions, ordered withdrawals and tax gross-up. Explicit contributions
are deposited after withdrawals and before annual growth; their cash cost is
separate from consumption spending. Transactions use one supplied date for
age/holding tests. Required distributions use the prior
December balance; current growth is not used to manufacture that year's RMD.

Every tax-search candidate is evaluated from original basis. Only the chosen
settlement generates the returned state: account balances, remaining identified
lots and basis, owner IRA basis, owner Roth conversion history and household
short/long capital-loss carryovers. Inputs are not mutated. Returned cash and
portfolio reconciliation residuals expose accounting errors and shortfalls.

The returned state now feeds the deterministic `timeline.ts` loop. Years after
2026 require an explicit scenario projection policy, not a silent reuse of the
base tax year. Owner capital-loss attribution is still required before any
survivor or filing-status transition. Separate AMT carryover state is not supplied.

## Explicit input boundaries

- One adult single taxpayer or two adults filing jointly, U.S. resident estimate.
  No dependent/student tax. Senior-deduction eligibility is a boolean, never an
  actual Social Security number.
- Wages are gross cash before employee deferrals. Explicit pretax traditional
  401(k) contributions reduce income-tax wages, not payroll wages. Pension/other
  cash remains fully taxable; partially taxable pension basis is not modeled.
  Social Security is separate.
- IRA basis is aggregated per owner using annual ending balances. Roth IRA basis
  and qualification clocks are owner-wide; designated Roth plans remain distinct.
  Pre-tax 401(k) conversions are supported, mixed-basis plan conversions rejected.
- Brokerage sales follow the supplied identified-lot order. Stock/ESPP returns are
  price-only, not total return. Trading fees must be zero in the annual adapter.
  Dividend cash can be supplied separately; dividend reinvestment is not
  automatic. Explicit brokerage contributions create new dated lots at a supplied
  purchase price. Do not supply the same credited interest both as account return and
  external income.
- Savings interest is taxable even when retained. Surplus goes to an explicitly
  zero-return settlement reserve, preventing a circular interest-on-surplus loop.
- Annuities require explicit post-1982 nonqualified, pre-annuitization grouping,
  zero surrender charges and basis no greater than opening value. Other annuity
  cases reject rather than silently omitting tax. The separate surrender primitive
  reports charges/unrecovered basis but does not invent a loss deduction.
- RMD work deferral and additional-tax exception amounts are verified caller
  inputs, not eligibility recommendations. Do not allocate one exception twice.

## Tax coverage and release blockers

New 2026 rules include ordinary brackets, standard/age/blind deductions, eligible
senior deduction and phaseout, Social Security inclusion, qualified dividends and
capital-gain stacking, regular-tax loss carryovers, basic AMT, employee payroll,
Additional Medicare, NIIT and the ordinary 10% early-distribution tax.

Basic AMT follows Form 6251: senior and standard deductions are unavailable;
capital-gain bands use regular ordinary taxable income. It assumes regular/AMT
asset basis and carryovers agree. Separate AMT carryovers, preferences, credits,
itemization, self-employment, foreign exclusions and special distributions remain
unsupported. Do not feed a carryover with differing AMT treatment to this API.

State treatment **must** explicitly select `existing-2025-proxy`: the old
wage-based state estimate applied to federal AGI. It is not a retirement-specific
state tax calculation; local tax is absent. Every result includes this warning.
This must be resolved before claiming accurate nationwide retirement projections.

Account-tax exclusions remain in ACCOUNT_TAX_CONTRACT.md. Annual timing,
externally validated contribution eligibility, restricted tax coverage and unsupported exceptional transactions
are not a reduction of the approved full product scope. No optimized strategy,
Monte Carlo, maximum spending, survivor model or public-ready UI is supplied here.

## Independently calculated integration examples

All examples use 2026, single, Florida, no credits, and age 61 unless noted.

| Scenario | Independent expected answer | Tested result |
| --- | --- | --- |
| $40,000 spending, $100,000 pre-tax IRA | W - (.12W - 2,180) = 40,000; W = $42,977.272727... | Matches within $0.00001 |
| Same IRA with $20,000 aggregate basis | W - (.096W - 2,180) = 40,000; W = $41,836.283185... | Matches within $0.00001 |
| $40,000 Roth conversion funded from cash | Tax $2,620; conversion remains an asset transfer | Matches |
| $40,000 conversion, $20,000 spending, $1,500 cash | Additional IRA $24,000; combined tax $5,500 | Matches within $0.00001 |
| Age 66, pension $30,000, benefits $20,000 | Taxable benefits $9,600; tax $1,606; $48,000 spending leaves $394 | Matches |
| Age 75, prior IRA $246,000 | RMD $246,000 / 24.6 = $10,000; $6,000 spending leaves $4,000 | Matches |
| Stock $100,000, basis $60,000, $60,000 sale, 10% subsequent price growth | Gain $24,000; remaining basis $24,000; ending value $44,000 | Matches within $0.00001 |
| Roth IRA age 46, $20,000 contribution basis, $40,000 spending | W $42,987.50; regular tax $688.75; early tax $2,298.75 | Matches within $0.00001 |
| Pension $100,000 and LT gains $600,000 | Regular $110,090; AMT $12,830; NIIT $19,000; total $141,920 | Matches |

Tests also cover two-worker payroll caps, separate spouse basis/RMDs, retained
interest, Roth plan pro-rata treatment, ESPP character, annuity partial/full paths,
losses below the standard deduction, invalid contracts, immutable input behavior
and reconciliation across 60 spending/return combinations.

## Primary sources checked

- [2026 federal thresholds and deductions, Rev. Proc. 2025-32](https://www.irs.gov/irb/2025-45_IRB)
- [Form 6251, current 2025 worksheet mechanics](https://www.irs.gov/pub/irs-pdf/f6251.pdf)
- [Schedule 1-A, senior-deduction mechanics](https://www.irs.gov/pub/irs-pdf/f1040s1a.pdf)
- [Schedule D instructions and carryover worksheet](https://www.irs.gov/instructions/i1040sd)
- [2026 Social Security wage base](https://www.ssa.gov/oact/cola/cbbdet.html)
- [NIIT](https://www.irs.gov/individuals/net-investment-income-tax)
- [Additional Medicare tax](https://www.irs.gov/taxtopics/tc560)
- [IRS employment-tax manual, Section 423 disposition compensation](https://www.irs.gov/irm/part4/irm_04-023-005r)
- [Publication 575, annuity surrender](https://www.irs.gov/publications/p575)

The worksheet editions and rate year are intentionally distinguished: 2025
published form mechanics are used with independently sourced 2026 thresholds,
not by treating all 2025 dollar amounts as current.
