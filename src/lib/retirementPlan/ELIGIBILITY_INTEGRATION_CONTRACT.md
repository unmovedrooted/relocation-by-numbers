# 2026 eligibility integration — restricted internal path

`runEligibleContributions2026` now connects eligibility to the actual annual cash,
tax and account-basis engine. The public/local preview does not call it yet.
This is not a complete MAGI solver or future-year eligibility projection.

## IRA-specific MAGI

`iraSpecificMagi` accepts AGI and explicit IRA deduction, student-loan deduction,
foreign earned/housing, savings-bond and employer-adoption addbacks. Only Roth
MAGI excludes taxable Roth conversions. Traditional-deduction MAGI retains them.
Inputs must represent the relevant IRS worksheets, not interchangeable labels.

The connected automatic path currently supports wages/pensions only, no taxable
investment accounts, cash interest, conversions, Social Security, distributions
or consumption shortfalls. Those cases fail explicitly. A preliminary settlement
funds non-IRA contributions and computes AGI after actual pretax employee deferrals.
Own compensation is reduced by funded pretax deferrals, not requested amounts.
The IRA-inclusive settlement must reproduce the eligibility MAGI after adding
back the actual IRA deduction. A bounded feedback search now varies the common
non-IRA funding fraction used to determine eligibility, then runs the full funding
settlement. It brackets the signed difference between assumed and final funded
pretax deferrals and uses at most 80 bisection steps. Every candidate starts from
the original immutable requests, not the previous candidate's capped amounts.

Acceptance requires each funded pretax account and both MAGIs to agree within
$0.0000001. Actual funded traditional/Roth deposits are checked again against
final compensation and Roth eligibility. The actual deduction is independently
recomputed at final MAGI, so a tiny numerical residual cannot authorize crossing
a statutory $10 rounding boundary with the wrong deduction. Nonconvergent or
unbracketed cases fail explicitly; bisection is not a claim that statutory
phaseouts are continuous. Roth employee deferrals do not reduce MAGI. This is
not a contribution/deduction optimizer or a global maximum-savings guarantee.

## Deductible versus nondeductible

Every contributing IRA owner requires an explicit policy. The caller chooses
deduct-eligible or nondeductible, and explicitly selects traditional-first
allocation of shared IRA room. Only one contributing IRA of each kind per owner
is currently supported. Spousal compensation is not inferred.

The 2026 deduction phaseout computes the annual-limit fraction, upward $10
rounding and $200 minimum, then caps by the allowed contribution. The resulting
ceiling is passed to `runHouseholdYear` as `iraDeductionLimit`. Each cash-funding
candidate deducts only min(actual funded amount, ceiling). Only the remainder
adds nondeductible IRA basis. Payroll taxes are unchanged. Employer matching
never enters the IRA deduction. Direct annual callers remain responsible for
externally validating any deduction ceiling they supply.

The tax engine rejects positive IRA deductions with Social Security until the
special interdependent worksheets are implemented. The timeline rejects fixed
IRA deduction ceilings rather than repeating one year's eligibility forever.

## Catch-up routing

The caller supplies sponsor-specific prior-year FICA wages, plan permission,
Roth availability, source and destination, and explicit consent. One combined
employee request in a traditional 401(k) is capped by wages and the 2026 regular
plus available catch-up limits. If Roth is required, dollars above the regular
limit route to a same-owner Roth 401(k); no automatic routing without consent.
The Roth deposit is after-tax and grows Roth plan contribution basis; the
traditional portion reduces wage income tax but not FICA. The ordinary cash
solver can reduce actual funded amounts. Separate destination requests and
multiple source plans are rejected in this path. Employer-match terms, if used,
must include both sources and verified catch-up capacity; they are not rewritten
silently. No automatic routing preference is imposed when Roth is not required.

## Independent checks

| Scenario | Expected |
| --- | --- |
| Single age 46, $50,000 wages, $7,500 deductible IRA | AGI $42,500; federal $2,920; payroll $3,825; IRA basis $0 |
| Same but nondeductible election | Federal $3,820; IRA basis $7,500 |
| Covered single age 46, $86,000 deduction MAGI, $7,500 deposit | $3,750 deduction and $3,750 nondeductible basis |
| $50,000 wages and $40,000 spending | Funded/deducted IRA $2,355 / .88; no unfunded basis |
| Age 61, prior sponsor wages $150,001, request $40,000 | Cap $35,750; $24,500 pretax and $11,250 Roth with consent |
| Covered age 46, $96,000 wages, funded $10,000 pretax deferral, $7,500 IRA | MAGI $86,000; deduction $3,750; basis $3,750 |
| $170,000 wages and funded $20,000 pretax deferral | Roth MAGI $150,000; full $7,500 Roth capacity before other IRA deposits |
| $50,000 wages, $40,000 spending, requests $10,000 pretax + $7,500 deductible IRA | Total funded $2,355/.88; plan receives 4/7 and IRA 3/7 |
| Same with nondeductible IRA election | Total funded $2,355/(1-.12×4/7); only the plan portion reduces income tax |
| Covered single, $90,000 wages, $70,000 spending, same requests | Total funded $2,145/.78; final MAGI lies in the IRA deduction phaseout and actual IRA saving remains fully deductible |

Tests also cover MAGI addbacks and conversion separation, Roth phaseout and
shared limits, immutable inputs, zero-policy legacy basis behavior and explicit
unsupported-case rejection. All existing calculators and preview inputs remain
unchanged. No UI, URL, persistence or network transmission was added.

Sources reviewed for integration:
- https://www.irs.gov/publications/p590a — worksheets 1-2, 2-1 and 2-2; 2025 edition mechanics with separately verified 2026 limits.
- https://www.irs.gov/irb/2025-49_IRB — 2026 limit updates.
- https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-catch-up-contributions — sponsor wages and Roth catch-up.

Next work: broader Social Security/withdrawal feedback,
deduction eligibility for all supported cash flows, explicit future-year policy,
multi-plan aggregation, and UI controls that expose these limitations faithfully.
