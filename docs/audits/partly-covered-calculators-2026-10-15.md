# Dedicated audits: rent vs buy, housing affordability, Roth conversion, one-income relocation, main relocation calculator

Date: 2026-10-15. Method: each calculator's real functions and result callbacks were executed and compared with independent
references written from closed-form formulas or published rules (IRS Publication 505 2026 rate schedule for a single filer;
amortization identities). Tests: `rentBuyAffordability.audit.test.ts`, `relocationCalculators.audit.test.ts`,
`mainCalculator.audit.test.ts`, and additions to `toolsResultContracts.audit.test.ts`. All red tests were confirmed failing on the old code first
where a defect was found.

## Rent vs buy (`src/lib/rentVsBuy.ts`)

- **Down payment above 100% (defect, fixed):** 150% down on a $400,000 home counted $600,000 of cash. The down payment is now limited to 0% to 100%.
- **Deposit timing (fixed):** whoever pays less banked the difference at the start of the month; it is now added at the end of the month, like the other calculators. Checked against closed-form annuities (a $200 monthly difference over ten years at 5%).
- Verified: first-month costs; equal-cost case (renter ends with the upfront cash grown at the investment return, buyer with price after selling costs less the loan balance); payoff before the horizon; home value, rent steps and loan balance over five years.
- Disclosed, not changed: home insurance and HOA are held flat in nominal dollars while rent grows; no mortgage-interest deduction, PMI or moving costs (the page already says so).

## Housing affordability (`src/lib/housing.ts`, `HousingAffordabilityCalculator.tsx`)

- **Displayed payment did not match the solved limit (defect, fixed):** the breakdown omitted PMI and used unscaled insurance, while the solver included both. The solver and the breakdown now share `housingCostAtPrice`, and the breakdown shows a PMI row. At the audit scenario the breakdown totals $1,981 against a $1,983 limit.
- **Rounded up past the limit (defect, fixed):** the maximum price was rounded to the nearest $1,000, which could exceed the debt-to-income limit by up to about $2.40 a month. It now rounds down.
- **Unvalidated inputs (fixed):** down payment limited to 0% to 100%; negative rates, taxes, insurance and HOA are treated as zero.
- **Zero-rate PMI paydown with appreciation (fixed):** returned null at 0%.
- Verified against an independent cost function in seven scenarios (maximal at $1,000, never over the limit) and against the closed-form price; the 28% front-end and 36% back-end rules; rent tiers (25%, 30%, 35%, and the 36% total-debt cap).
- Note: this audit found several PMI estimators; they were later consolidated into one helper (see "PMI consolidated" at the end).

## Roth conversion (`RothConversionCalculator.tsx`)

- **Taxable side account ignored federal tax (defect, fixed):** when the conversion tax is paid from outside savings, the preserved cash was assumed to lose only the state rate of its return to tax. It now also loses 15% (the federal rate on long-term gains and qualified dividends at middle incomes) and the page says so. This lowers the "keep traditional" side by roughly 15% of the side account, which moves the break-even toward converting.
- Verified: conversion tax across brackets (income $50,000 plus a $100,000 conversion: $20,914, the IRS schedule difference), the state tax and the retirement-income-exempt states, both break-even formulas (and that the paths tie at the break-even rate), and the growth factors.
- `RetirementCalculator.tsx`: its taxable-account text claimed state-only drag was "a conservative estimate"; it now says federal tax on returns is not included and that the mode is best for comparing states. The numbers are unchanged.
- Not modelled (disclosed on the page): IRMAA, ACA subsidies, the pro-rata rule, the 5-year rule.

## One-income relocation calculator (`RelocationIncomeCalculator.tsx`)

- **Cash needed ignored the purchase (defect, fixed):** when buying, the down payment and closing costs were not in "cash needed". The down payment is now cash on hand (not a cost) and closing costs, from the state defaults, are a spent cost. A leftover rental deposit no longer counts when buying.
- **0% down became 10% (defect, fixed):** `parseFloat(x) || 10` replaced an entered zero. A blank or invalid field uses the default; an entered zero stays zero.
- **PMI used a flat 0.8% (fixed):** it now uses the site's tiered estimate (0.7% to 1.5% by loan-to-value, none at 20% down).
- **Minimum second income of $500,000 when unreachable (defect, fixed):** when no second income up to $500,000 reaches the target, the card now says it is out of reach instead of showing $500,000.
- Verified: the minimum-income search returns the smallest $1,000 step that meets the target; buying cost = payment + property tax + 0.6% insurance + HOA + PMI.

## Main relocation calculator (`Calculator.tsx`)

- **Effective tax rate counted 401(k) saving as tax (defect, fixed):** the rate is now `totalTax / gross`. Verified: take-home pay and the rate against the IRS schedule plus the 7.65% payroll tax; more saving lowers the rate.
- **Down payment above 100% (fixed)** in the payment, PMI and cash needed.
- **Salary solver could fall short (fixed):** its search range now widens (up to 64 times the target) when the starting range does not reach the target; verified with a 60% 401(k) share and a $300,000 target.
- Verified: buy-mode payment parts and PMI at the entered rate; renting total and its share of take-home pay.

## Test stability

Two long-running tests (`wageTax.test.ts` wage-cliff scan and `timeline.test.ts` 40-timeline reconciliation) exceeded the default 5-second timeout when the machine was busy. They pass in about a second when idle; their timeout is now 60 seconds.

## Still not covered

Compare Cities (international modes); the Complete Retirement Plan against an outside review; no state, married-household or international official calculator was compared. (The Europe, Asia, Caribbean and South America output matrices were audited afterwards; see regional-output-matrices-2026-10-15.md. The IRS Tax Withholding Estimator was run for single filers; see release-checks-2026-10-14.md.)

## PMI consolidated (2026-10-15)

There were four PMI implementations in two modes. They are now one helper, `estimatePmiMonthly` in `lib/housing.ts`, with the mode chosen explicitly by the caller:

- **Automatic** (loan-to-value tiers: 0.7% up to 85%, 0.9% to 90%, 1.2% to 95%, 1.5% above, none at 20% down): the affordability solver and its breakdown, the mortgage calculator and the one-income relocation calculator.
- **Manual** (the annual rate the user entered, limited to 0% to 2%): the main relocation calculator and Compare Cities. An entered rate, including 0, is used as given and is never replaced by the automatic estimate.

Example, $400,000 home with 5% down: automatic $380.00 a month, manual 0.5% $158.33, manual 0% $0. Tests in `src/lib/pmi.test.ts` cover every tier boundary, the manual limits and both callers; the earlier page-level tests still pass.
