# Future IRA eligibility and Medicare IRMAA — engine integration

Verified September 6, 2026. Local, opt-in timeline capabilities. IRA contribution
and Medicare/IRMAA controls are now exposed in the local preview.
No data persistence, API transmission, or new dependencies.

## IRA eligibility

`iraEligibility` accepts an explicit `TaxProjectionPolicy` for years after 2026.
The `iraEligibility2026` and `runEligibleContributions2026` compatibility entry
points still reject other years. Published 2026 limits are unchanged.

The annual timeline accepts `iraPoliciesByYear`, with explicit owner coverage,
account IDs, traditional-first allocation and deductible/nondeductible election.
Active policies replace manual IRA caps, but never workplace caps. Each active
IRA owner must have a policy when using automatic eligibility. Missing policies
do not imply coverage, a zero MAGI, or unlimited room. No policies means the
existing externally-validated capacity path remains available.

Projected regular IRA/catch-up limits use cumulative $500/$100 downward-rounded
increases from 2026. Roth and deduction phaseout starts use nearest-$1,000
increases; fixed phaseout widths remain $15,000 single Roth, $10,000 joint Roth,
$10,000 single deduction, $20,000 covered-joint deduction and $10,000 covered-spouse
deduction. These are scenario projections anchored to rounded 2026 published
values, not future IRS limits or a reconstruction of historical CPI bases.

Age is recomputed each year. Own taxable compensation, actual funded pretax
deferrals, distinct IRA MAGIs, shared traditional/Roth room, deduction limits,
and nondeductible basis are re-evaluated through the existing bounded feedback
solver. Final funded amounts are checked against final MAGI. Eligible and funded
amounts remain distinct in timeline outputs. Retirement still ends contributions
under the existing calendar-day schedule contract.

The restricted automatic IRA path remains wages/pensions only: no investment
income, taxable/ESPP accounts, conversions, Social Security or spending funded by
account withdrawals in a contributing year. Unsupported cases fail explicitly;
the IRS Social Security/IRA deduction worksheets need a broader solver. Spousal
compensation is not inferred. Workplace catch-up routing remains 2026-only and
is not newly connected to the timeline in this batch.

## IRMAA

`irmaa` is an opt-in timeline policy. It requires:

- `budgetTreatment: "surcharges-outside-spending"`: standard Part B and chosen
  Part D plan premiums already belong in the healthcare budget. Only the B/D
  income-related surcharges are added. IRMAA is spending, not income tax.
- Explicit `enrollmentByYear`: owner ID and 0–12 integer covered months for each
  part. Absent enrollment means no modeled coverage, not assumed age-65 coverage.
  Eligibility/enrollment dates are externally established, including disability.
- Historical income records for the first two lookback years when needed. The
  record holds tax year, filing status and IRMAA MAGI. Missing data produces an
  error rather than a guessed zero, current income, or a silent three-year fallback.
- An explicit `annualSurchargeGrowth` rate for future Medicare costs. This is
  separate from the approved household income-threshold growth rate.

IRMAA MAGI is actual modeled AGI plus tax-exempt interest. Thus taxable Roth
conversions, capital gains and RMDs enter the lookback through tax AGI; a funded
deductible IRA deposit reduces it. Nontaxable Social Security is not added back.
Premium year Y uses the Y-2 tax record and its filing status, not current-year
income. Assessments are per enrolled person; a couple can owe two surcharges.

The 2026 full-coverage B surcharge tiers are $0/$81.20/$202.90/$324.60/$446.30/$487
monthly; D surcharge tiers are $0/$14.50/$37.50/$60.40/$83.30/$91. Boundaries use
the CMS inclusive/exclusive rules, including the inclusive highest tier.

Ordinary income thresholds are projected at the household threshold rate,
nearest $1,000 for single thresholds, doubled for joint thresholds. The highest
single threshold is frozen at $500,000 through 2027 and grows starting in 2028
(one year's growth then); the joint highest threshold is 150% of that amount.
Future surcharge dollars use the separate cost scenario and monthly dime rounding.
Neither is a prediction of future CMS actuarial premiums.

Timeline rows expose base spending, IRMAA surcharge spending, per-person assessed
tiers/months, income year and current IRMAA MAGI. Surcharges feed the normal spending
and withdrawal solver exactly once and the existing wealth reconciliation.

Not modeled: SSA life-changing-event appeals, amended returns, three-year
fallback, MFS or surviving-spouse special statuses, survivor household transitions,
late-enrollment penalties, Medicare Advantage reductions, hold-harmless rules,
immunosuppressive-only coverage, low-income assistance or medical itemized deductions.
Do not treat this output as an SSA determination or enrollment recommendation.

## IRA preview controls

The separate IRA section collects per-account raw annual amount strings and
per-owner workplace coverage, deduction treatment and supported-scenario
confirmation. Values default to zero/unselected/unconfirmed. Drafts remain only
in tab memory and reset with the example. Workplace and IRA request maps are
separate; changing an account kind does not transfer one type of request to another.
Inactive/deleted account drafts are ignored; blank visible amounts are invalid,
not silently zeroed. One active account of each IRA kind per owner is supported.

Coverage choices are scenario assumptions for every year before retirement,
including a partial retirement year; later years are uncovered. Joint filing
requires both owners' choices even if only one contributes. Coverage changes,
post-retirement employer additions and outside IRA deposits are not represented
by these controls. Explicit "not covered" choices conflicting with modeled
workplace contributions are rejected. Traditional deduction elections are
constant across the scenario. Roth-only requests need no deduction election.

The adapter supplies annual IRA policies to the existing engine without new tax
formulas. Results show requested/eligible IRA saving, actual traditional/Roth
funding, the household deduction and contribution basis added. Eligible request
is not a maximum contribution limit. Basis additions are not ending basis. The
table scrolls within a focusable region; stale results are marked after edits.
Existing projection charts, exports and run/reset interaction remain in place.

Known-answer tests cover projected IRA phaseouts/deductions, age 50, retirement
stops, basis and funding, all single IRMAA tier boundaries, joint tiers, months,
two-year history, conversions, IRA deductions, household multiplicity and cash
reconciliation. Existing 2026 tests remain unchanged.

## Medicare preview controls

The separate Medicare section defaults off, with no guessed enrollment, historical
MAGI, filing status or premium-growth value. When enabled it requires an explicit
budget/coverage acknowledgment. Standard premiums stay in household spending;
only IRMAA surcharges are added by the existing engine.

Each active person can select Part B and/or D and enter the first covered month.
That month is inclusive and coverage is continuous through the horizon; gaps,
termination dates and enrollment eligibility are not inferred. A start before the
birth month is rejected. Historical MAGI and tax-return status are requested only
for the first two projection years with enrollment. Later lookback data comes
from actual simulated AGI plus exempt interest. Changing the horizon re-keys the
required historical years; no prior year's raw value is silently reused.

The UI intentionally restricts joint scenarios to a shared joint historical return
for the two people. Different prior individual returns require an owner-specific
history model and are blocked. A single-person scenario can use its own earlier
single or joint return. Missing amounts are rejected rather than converted to zero;
actual negative MAGI is supported. Hidden/inactive drafts are ignored and retained
only in tab memory, with reset/reload clearing them. No URL or API storage is added.

The results detail shows premium year, person, income year, MAGI, return status,
covered months, each surcharge and total. It labels future years as projected and
explicitly states the surcharges are already in Spending. Its accessible table
scrolls locally. Existing CSV Spending totals include the surcharge; no separate
Medicare columns or PDF-detail expansion is added in this batch.

## Primary sources

- IRS Notice 2025-67 (2026 bases): https://www.irs.gov/irb/2025-49_IRB
- IRS Publication 590-A (worksheet mechanics): https://www.irs.gov/publications/p590a
- IRC 219(g)(8): https://uscode.house.gov/view.xhtml?req=%28title%3A26+section%3A219%28c%29+edition%3Aprelim%29
- IRC 408A(c)(3): https://uscode.house.gov/view.xhtml?edition=prelim&num=0&req=granuleid%3AUSC-prelim-title26-section408A
- CMS 2026 surcharges: https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-deductibles
- SSA income-year/filing tables: https://secure.ssa.gov/poms.nsf/lnx/0601101020
- Social Security Act 1839(i)(3),(5) (indexing/top-tier freeze): https://www.ssa.gov/OP_Home/ssact/title18/1839.htm
