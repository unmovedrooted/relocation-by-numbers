# Married households, credits and state taxes against official sources

Date: 2026-10-15. Test: `src/lib/officialTaxExamples.audit.test.ts`.

## Married filing jointly (federal): compared and matched
IRS Tax Withholding Estimator, run 2026-10-15: married filing jointly, one earner with $150,000 of wages, no dependents, no adjustments, standard deduction. The IRS reported a standard deduction of $32,200 and estimated federal tax of $15,340. The site's wage engine gives taxable income $117,800 and federal tax $15,340: an exact match. (Single filers were compared earlier; see release-checks-2026-10-14.md.)

## Credits: not modelled, and disclosed
The wage engine has no dependents, child tax credit or other credits. The disclaimer and methodology pages say credits, itemized deductions and dependents are left out, so results for households with children overstate federal tax. This is a disclosed limit, not a calculation error, and no official comparison is possible for a feature that does not exist. The IRS estimator supports these credits if they are added later.

## State taxes: not compared against an official calculator
Most states publish rate schedules and forms, not an online calculator. The state functions were read against each state's own 2026 publications during the state-module work, and `wageTax.test.ts` checks them against hand calculations for single filers and for married filing jointly at $200,000. No state's official online calculator was run in this audit, so state results remain labelled as estimates.

## What stays open
- State comparisons against official state calculators or published worked examples (for example a few high-population states, married and single).
- Child tax credit and dependents, if the site chooses to model them.
