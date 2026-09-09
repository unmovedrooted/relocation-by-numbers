# Account tax-character and basis contract

This internal layer classifies transactions. It does **not** calculate a complete
household tax return, select transactions, or certify a retirement plan. Existing
calculators and the previously reviewed financial primitives are unchanged.

## Monetary contract

- Amounts are nominal USD for a U.S. tax calculation; shares are quantities and
  sale prices are USD/share. Basis fields are **total** remaining basis, except the
  existing ESPP lot's explicitly per-share purchase/market prices.
- No intermediate display rounding. Finite inputs, sums and products are bounded
  at $1 trillion as an internal safety bound, not a tax-law limit.
- Capital losses stay signed. They are not silently turned into zero, netted
  against ordinary income, or treated as an immediate tax refund.
- The return separates ordinary retirement income, ordinary investment income,
  ESPP compensation, qualified dividends, short/long capital gains and the base
  potentially subject to additional early-distribution tax. The additional-tax
  base is not additional ordinary income.
- Caller inputs are not mutated. Repeated gross-up evaluations use the same
  opening basis; only the chosen final transaction's returned basis may become
  next year's state. Never persist basis from intermediate solver candidates.

## Implemented rules and deliberate boundaries

| Path | Implemented | Required integration contract / exclusions |
| --- | --- | --- |
| Brokerage/managed stock lots | Identified-lot adjusted basis, fractional partial sales, fees, long/short holding periods, signed gains, remaining lot | Caller must select valid lots. No automatic wash-sale, gift/inheritance holding periods, bond OID, collectibles, or synthetic claim that account-average basis is specific-lot basis. |
| Section 423 ESPP | Reuses reviewed compensation/gain split and returns the remaining original lot | Offering/purchase information must be actual data. Ordinary compensation is not merged into brokerage gain. Nonqualified plans and death dispositions need distinct rules. |
| Ordinary bank savings | Credited/available interest is ordinary investment income even when retained | Withdrawal of already-owned principal is not taxed again. Interest amount/timing comes from the annual schedule, not an invented APY formula. |
| Dividends | Qualified subset separated from other dividends | Caller must establish qualification. Reinvestment increases purchased-asset basis in the future transaction schedule; this classification helper does not create shares or cash. |
| Traditional IRA | All relevant IRAs aggregated per owner, separately from spouse and employer plans; distributions/conversions share aggregate basis | Caller supplies complete annual ending values and relevant adjustments. No QCD, disaster, outstanding-rollover, SIMPLE-specific penalty or special Form 8606 rules yet. Early-tax exceptions remain a separate step. |
| Qualified-plan cash withdrawal | Pro-rata basis recovery from the applicable plan/contract; ordinary retirement income and potential additional-tax base | Applicable separate contribution subaccounts must be identified. Not a partial rollover, NUA, in-kind distribution, or pension annuity payment. |
| Roth IRA | Owner-level contribution-first ordering; conversion years FIFO and taxable principal first within a year; earnings last; separate qualification/recapture clocks | Caller aggregates all the owner's Roth IRAs and supplies remaining basis. Living-owner age-based qualification only. Disability, death, first-home and corrective-distribution pathways are not inferred. |
| Roth 401(k)/designated Roth plan | Pro-rata basis/earnings when nonqualified; age plus plan-specific five-tax-year test | Never substitute the Roth IRA basis-first rule. Untracked in-plan rollover recapture explicitly throws. |
| Nonqualified deferred annuity | Post-1982 pre-annuitization partial withdrawals, earnings first, basis retention and potential additional-tax base; a distinct full-surrender helper reports net cash and unrecovered basis | Caller must supply the correct tax aggregation group. No pre-1982 investments, qualified annuity or annuitized payout. Surrender losses require review, not an invented deduction. The annual adapter permits only zero-charge, non-loss contracts. |

Early-distribution helpers take an explicit amount of otherwise penalty-subject
income covered by a **verified** exception. They do not decide exception eligibility,
reuse one exception allowance across accounts, or remove ordinary income because
a penalty exception applies. Ordinary tax rates, NIIT and additional-tax rates
must be applied by the household tax layer, not added to income itself.

Roth age qualification uses the distribution date, not calendar-year age. The
five-year clocks use tax years. An old Roth IRA alone does not qualify a young
owner's earnings; reaching age 59½ alone does not satisfy a newly opened Roth's
five-year requirement. Roth conversion principal is not ordinary income twice.

## Annual ledger integration

Integration tests invoke these helpers inside `settleAnnualCashFlow.calculateTax`
with controlled rates. They verify brokerage gross-up, tax on retained savings
interest, the Roth IRA contribution-to-earnings boundary, ESPP character, and
untaxed retained annuity growth. These are **not** tests of real household brackets.

`householdYear.ts` now provides an explicit account metadata adapter and final
basis snapshots using the real supported household estimate. The ledger probes
full liquidation during funding search; the adapter dispatches that annuity case
to the distinct surrender helper. Charged/underwater contracts fail explicitly,
and are never handled by catching an error and returning zero tax.

Household regular-tax capital-loss carryovers and final conversion/basis snapshots
are now connected. Before release, complete state retirement taxes, separate AMT
carryovers, account-specific income/reinvestment schedules, Roth qualification
exceptions, automatic contribution eligibility and the remaining annuity treatments.
The deterministic timeline now carries supported final basis states across years;
survivor attribution and distinct AMT basis/carryovers remain unsupported. No public
page should advertise the full planner as complete while these remain unresolved.

## Primary references checked September 4, 2026

- IRS Publication 550 (2025): purchased share basis/holding periods, interest and dividends.
  https://www.irs.gov/publications/p550
- IRS Publication 525 (2025): Section 423 employee stock purchase plan dispositions.
  https://www.irs.gov/publications/p525
- IRS Publication 590-B (2025): Roth IRA qualification, ordering and recapture; IRA basis.
  https://www.irs.gov/publications/p590b
- IRS Publication 575 (2025): qualified-plan and nonqualified-annuity withdrawals.
  https://www.irs.gov/publications/p575
- IRS designated Roth account FAQs: five-tax-year qualification and nonqualified distributions.
  https://www.irs.gov/retirement-plans/retirement-plans-faqs-on-designated-roth-accounts

These are the current publications inspected, not a claim that a 2025 household
tax-rate table is suitable for 2026. No existing tax-rate datasets were updated;
the new household adapter has its own explicitly versioned federal rules.
