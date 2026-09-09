# Contribution/match arithmetic — internal foundation

The pure arithmetic layer is now connected through `employerMatchLedger.ts` to
the annual engine and explicit timeline year schedules, and now to restricted
preview controls. Unconfigured projections remain unchanged. It does not certify
contribution eligibility or calculate IRA phaseouts.

## Supported contract

- One externally validated employer-plan group for one owner/year. Aggregate
  traditional/Roth employee deferrals before calling; never match each separately.
- All money is nominal annual USD and all rates are decimals. Compensation must
  already reflect employment/retirement timing and plan eligibility.
- Tiers use cumulative compensation fractions: 100% through 3%, then 50% through
  5% means a maximum 4% match, not two overlapping full-compensation tiers.
- Annual true-up, fully vested traditional pretax employer money only. Payroll-
  period matching without true-up, vesting/forfeiture, Roth employer treatment,
  student-loan matches and special plan types are not supported.
- The caller supplies remaining employee regular/catch-up capacities after other
  plans and compensation/annual-additions caps. Catch-up eligibility and tax
  treatment (including applicable Roth requirements) must be verified externally.
- Other annual additions include other non-catch-up employee, employer and
  forfeiture amounts in the relevant plan group. Reject existing excess instead
  of concealing it. Matching can be constrained after employee contributions;
  this function does not optimize employee savings to maximize match.

## Two stages

1. `planEmployeeContribution` caps the employee request by compensation and
   supplied remaining regular/catch-up capacity. It does not decide affordability.
2. After the cash engine determines actual funded deferrals,
   `calculateEmployerMatch` applies marginal tiers to those funded dollars. It
   caps match to remaining annual-additions room, excluding verified catch-up.

No intermediate monetary rounding. Returned tier amounts are formula amounts
before the final combined-additions cap; `employerMatch` is the capped total.

## Independent examples

| Inputs | Result |
| --- | --- |
| $100,000 eligible pay, $6,000 funded, 50% through 6% | $3,000 employer match |
| Same request but only $2,000 funded | $1,000 match |
| $100,000 pay, $6,000 funded, 100% through 3%, 50% through 5% | $4,000 match |
| $65,000 other additions, $6,000 regular employee, $72,000 cap | $1,000 match room |
| $32,500 funded including $8,000 verified catch-up, $45,000 other additions, $72,000 cap | $2,500 match room |

## Connected employer ledger

Employer money is a separate external wealth inflow, not employee spending,
wage income, an employee tax deduction or an after-tax basis increase. It cannot
fund that same year's spending or employee savings. Deposits use actual funded
deferrals, go to the same owner's traditional 401(k), and receive the destination
account's full annual return under the existing annual timing convention. Closing
balances including match/growth become next-year RMD balances. Final tax is
re-evaluated and checked against the selected settlement.

`employerContributions` and `employerMatches` report the employer inflow separately
from `cash.contributions`. Configured cash account rows include `employerDeposit`.
Portfolio reconciliation includes employer deposits; household spending cash
reconciliation does not. Timeline wealth identity adds employer inflows once:

`opening + income + employer deposits + shortfall - spending - tax + growth = ending`

Only one verified employer-plan group per owner/year is currently supported;
all that owner's contributing traditional/Roth plan accounts must be grouped.
Multiple employers, partial vesting and unsupported destinations fail explicitly.
Current-year match compensation cannot exceed that owner's wages. Requests that
exceed verified match-plan capacity must be capped before settlement, not silently
accepted. Future terms require explicit `employerMatchesByYear` entries; omitted
years have no match. Retirement-prorated compensation must be supplied explicitly.

Tests cover funded-only matching, tight-cash reduction, no same-year funding,
zero-match equivalence, Roth-source/pretax-destination separation, ownership and
capacity validation, growth, next-year RMD continuity, and input immutability.
## Local preview controls

`RetirementContributionEditor` exposes annual nominal saving per traditional/Roth
401(k), plus owner-wide verified regular employee, annual-additions and compensation
limits. Saving requests stay fixed nominal across the horizon. Verified first-year
limits grow using the household threshold-growth assumption, rounding cumulative
increases in $500 employee, $1,000 annual-additions and $5,000 compensation increments.
These are scenario projections, not future published limits. Wages follow
the preview salary-growth assumption. Retirement uses the same calendar-day
proration as the timeline, including match-eligible wages. No catch-up or outside
additions are inferred. The user must affirm the supported assumptions.

Threshold growth defaults to spending inflation, with an optional independent
advanced rate. Social Security taxability thresholds and other nonindexed federal
thresholds remain fixed. Federal brackets retain continuous scenario scaling.
Payroll-cap growth uses the same scenario rate, not a forecast of the wage index.
The pure 2026-based contribution projection helper distinguishes $100 IRA catch-up
increments from $500 regular IRA increments. Future-year IRA eligibility, Roth
MAGI phase-outs and IRMAA now have opt-in engine/timeline integration described in
FUTURE_ELIGIBILITY_IRMAA_CONTRACT.md. IRA and opt-in Medicare preview controls
are available under the documented restricted contracts.
Anchoring to rounded published limits is an approximation,
not a reproduction of statutory historical CPI calculations.

An optional single-tier percentage match has an explicit same-owner traditional
401(k) destination. A Roth employee account does not receive pretax employer money.
The default match is disabled; employee amounts default to zero and limits are
blank. The 50%/6% draft match example is not a claim about the user's plan.

Raw strings remain in tab memory, including trailing decimals. Changing controls
invalidates results; Run projection recomputes. Blank active amounts fail validation
(enter 0 to disable). Reset clears saving/verification/match settings. Reload starts
the fictional example. No URL, storage or network path is added.

Deleted/non-plan/inactive-owner accounts are excluded. Draft amounts remain tied
to account IDs; reassigning an account uses the new owner's terms and requires
their verification. A deleted or incompatible active match destination fails
explicitly. Hidden disabled match terms are retained but not interpreted.

Annual results separately show requested, eligible and funded employee saving
and employer match. No changes to underlying financial formulas in this UI batch.

## References

Reviewed September 5, 2026. The tests use 2026 example limits ($24,500 regular
deferral, $72,000 annual additions, $360,000 compensation); production has no
hardcoded statutory defaults or automatic future-year extrapolation.

- https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500
- https://www.irs.gov/retirement-plans/cola-increases-for-dollar-limitations-on-benefits-and-contributions
- https://www.irs.gov/retirement-plans/401k-plans-deferrals-and-matching-when-compensation-exceeds-the-annual-limit

Plan documents determine match terms. General IRS limits alone are insufficient
to infer an individual's eligibility, catch-up tax character or plan benefits.
