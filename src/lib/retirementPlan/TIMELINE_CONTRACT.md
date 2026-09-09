# Deterministic multi-year retirement timeline

Internal milestone; no public route, UI, storage or network requests. The full
approved product scope is unchanged. This is not a release-ready tax planner.

## Units, calendar and projection policy

- Horizon is an explicit inclusive range within 2026–2126, at most 101 years.
  It models complete calendar years, not a silent September-to-December stub.
- Spending is a full-year start-year-dollar amount. Year Y spending is
  `spendingAnnual * (1 + inflation) ** (Y - startYear)`.
- Each income/contribution amount is likewise a full-year amount in start-year
  dollars, even if its start date lies in a later year. Each has its own explicit
  growth rate, including zero for a fixed nominal pension. This engine does not
  calculate a Social Security claiming benefit or earnings-test reduction: the
  schedule amount must be the expected payable benefit.
- Schedule start is inclusive and end is exclusive. Calendar-day fractions use
  UTC and the actual 365/366-day year. Wages and all contribution schedules stop
  at each owner's retirement date. Pension/benefit dates are independent.
- `calendar-day-proration-annual-growth` is an explicit required approximation:
  annual withdrawals use December 31 age/holding tests, then remaining balances
  and funded contributions receive a full annual return. It does NOT simulate
  monthly payroll deposits, investment prices or intra-year sales. A purchase
  date of December 31 is a tax-clock convention, not a claim that a deposit
  literally made then earned the preceding year's full return.
- All account annual returns are nominal decimals; stock/ESPP returns remain
  price-only. Real ending wealth is nominal wealth divided by that year's spending
  inflation factor, using constant price levels within each modeled year.

`taxProjection` has no implicit defaults. Its only current policy projects 2026
law with caller-selected bracket/deduction and payroll-cap growth rates. Brackets,
standard/age/blind deductions, preferential bands and basic AMT thresholds use the
bracket factor; the Social Security payroll cap uses the separate payroll factor.
These are scenario amounts, without statutory rounding, not published IRS tables
or a forecast of CPI/wages. Rates are constant under this scenario policy.

Social Security inclusion thresholds, NIIT/Additional Medicare thresholds, the
$3,000 capital-loss deduction and remaining tax basis stay nominal. The temporary
senior deduction and its fixed phaseout apply only through 2028. Age eligibility
uses each actual modeled year, including the January 1 birthday deduction rule.
State tax is explicitly frozen to the existing 2025 wage-based proxy applied to
nominal federal AGI. Verified retirement-specific state/local taxation remains a
release blocker. All inherited AMT/tax exclusions remain in the one-year contract.

## Contributions: eligibility and cash are different checks

Supported deposits: pretax employee traditional 401(k), after-tax designated Roth
401(k), nondeductible traditional IRA, Roth IRA, ordinary cash, brokerage new lots,
and supported nonqualified-annuity premiums (basis increases). New ESPP purchases,
deductible IRA contributions, spousal IRA eligibility and
special rollover transactions are not inferred or implemented by this schedule.

Employer matching is separately supported through explicit verified annual
`employerMatchesByYear` entries, not through employee contribution schedules.
See `CONTRIBUTION_PLANNING_CONTRACT.md` for its restricted one-plan-group-per-owner
contract. Matching is deposited after settlement, before annual growth, and cannot
fund same-year spending or employee deferrals.

For retirement accounts an explicit owner/year capacity is required, including
catch-up, compensation, plan restrictions and any income-based eligibility. These
must be conservatively validated outside the timeline across the scenario's income
range; the timeline does not certify Roth MAGI eligibility. Future capacities are
assumptions until verified, not automatically published limits. This internal
contract is not a substitute for the public input validation still to be built.

1. Prorate the requested full-year amounts through the owner's retirement date.
2. Cap combined traditional/Roth employee-plan deposits to the supplied plan
   capacity and owner gross wages, proportionally across those accounts.
3. Cap Roth IRA deposits to the supplied Roth capacity; cap combined IRA deposits
   to the supplied IRA capacity and own wages minus pretax employee deferrals.
4. Evaluate tax using the candidate contributions. Reduce all remaining requests
   proportionally until external income covers spending, tax and contributions.
   RMDs, conversions and old-account withdrawals cannot finance these deposits.
5. Deposit only the funded amount after withdrawals, before growth. Update the
   appropriate basis, owner Roth clock and/or dated brokerage lot.

Results separately expose requested, eligible and funded amounts per account.
Reduced savings is not reported as failed consumption spending. No unfunded
contribution becomes an asset. Pretax deferrals reduce income tax, not payroll
tax. The settlement's wealth identity is:

`opening wealth + external income + employer deposits + unfunded shortfall - spending - tax + growth = ending wealth`

Contributions, RMDs, other withdrawals, conversions and retained surplus are
internal transfers and cancel out of household wealth. Cash and account ledgers
also expose their individual reconciliation residuals.

## Continuity and failures

- Each year's actual closing account state becomes the next opening state.
  Prior December balances therefore include preceding funded deposits and growth.
- RMD work deferral ends in the retirement calendar year. A joint-life divisor
  must be supplied separately for every year; one age-dependent divisor is never
  blindly reused. Validity of the supplied beneficiary arrangement is external.
- IRA basis stays owner-wide; Roth contribution/conversion bases and clocks are
  preserved; brokerage shares/basis and nominal capital-loss carryovers continue.
- Nonzero one-year exception allowances are rejected rather than automatically
  repeating them through retirement. Dated exception support remains future work.
- An unfunded year makes `allYearsFunded` false permanently. Subsequent income may
  rebuild assets, but does not erase failure. Shortfalls are not invented debt.
  RMD compliance is reported separately from spending/tax funding.
- Fixed conversion schedules are internal candidate inputs, not a public manual
  strategy or an optimizer. Survivor transitions, policy comparison and Monte
  Carlo are not part of this batch. No future-path information selects a strategy.

## Known-answer checks

| Scenario | Independent result |
| --- | --- |
| $50,000 salary through July 1, 2027 | $50,000 × 181 / 365 = $24,794.520547945... |
| Same cutoff in leap year 2028 | $50,000 × 182 / 366 = $24,863.387978142... |
| 2026 single FL, age 61, wages $50,000, pretax saving $10,000, spending $30,000 | Federal $2,620; payroll $3,825; retained reserve $3,555; total saving $13,555 |
| Same income, saving request $10,000, spending $40,000 | Funded saving solves C = $2,355 / .88 = $2,676.136363636...; old assets untouched |
| Same income, spending $60,000, no assets | Contributions $0; shortfall $17,645; no fabricated balance |
| Age 75, prior IRA $246,000, 10% return | First RMD $10,000; closing IRA $259,600; next RMD $259,600 / 23.7 |
| $1,000 stock deposits in 2026/2027 with 10% annual price growth, no 2028 deposit | End 2028 $1,000 × 1.1³ + $1,000 × 1.1² = $2,541; original basis $2,000 |
| $10,000 loss carryover, no 2026 income, then pension $30,000/year | Remaining regular-tax ST loss $10,000, $7,000, $4,000; no inflation of basis |
| 2027 pension $55,000, 10% bracket growth, single under 65 | Standard deduction $17,710; federal $4,202 = 2026 $3,820 × 1.1 |
| Age 69 in 2029, pension $50,000, zero bracket growth | Senior deduction $0; age-adjusted standard deduction $18,150; federal $3,574 |

Tests also cover independent spouse dates, delayed benefits, Roth five-tax-year
clocks, plan/IRA capacity aggregation, cash-interest character, whole-horizon
depletion, zero-value plans, immutable inputs and 40 combinations of retirement,
spending, returns and inflation. Comparison tolerances are sub-cent; production
amounts are not rounded to force tests to pass.

## References and limits

- [IRS employee deferrals: income tax versus FICA](https://www.irs.gov/retirement-plans/retirement-plan-faqs-regarding-contributions-are-retirement-plan-contributions-subject-to-withholding-for-fica-medicare-or-federal-income-tax)
- [IRS senior deduction, effective 2025–2028](https://www.irs.gov/newsroom/check-your-eligibility-for-the-new-enhanced-deduction-for-seniors)
- [IRS NIIT](https://www.irs.gov/individuals/net-investment-income-tax)
- [2026 base thresholds](https://www.irs.gov/irb/2025-45_IRB)

These sources support base-law mechanics, not the chosen hypothetical growth
rates. State accuracy, full eligibility validation, broader employer-plan support, separate
AMT carryovers, survivor rules and remaining account exclusions still prevent
advertising this as a complete production retirement planner.
