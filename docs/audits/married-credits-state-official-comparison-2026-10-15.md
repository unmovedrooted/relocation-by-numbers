# Married households, credits and state taxes against official sources

Date: 2026-10-15. Test: `src/lib/officialTaxExamples.audit.test.ts`.

## Married filing jointly (federal): compared and matched
IRS Tax Withholding Estimator, run 2026-10-15: married filing jointly, one earner with $150,000 of wages, no dependents, no adjustments, standard deduction. The IRS reported a standard deduction of $32,200 and estimated federal tax of $15,340. The site's wage engine gives taxable income $117,800 and federal tax $15,340: an exact match. (Single filers were compared earlier; see release-checks-2026-10-14.md.)

## Credits: not modelled, and disclosed
The wage engine has no dependents, child tax credit or other credits. The disclaimer and methodology pages say credits, itemized deductions and dependents are left out, so results for households with children overstate federal tax. This is a disclosed limit, not a calculation error, and no official comparison is possible for a feature that does not exist. The IRS estimator supports these credits if they are added later.

## State taxes: not compared against an official calculator
Most states publish rate schedules and forms, not an online calculator. The state functions were read against each state's own 2026 publications during the state-module work, and `wageTax.test.ts` checks them against hand calculations for single filers and for married filing jointly at $200,000. No state's official online calculator was run in this audit, so state results remain labelled as estimates.

## State comparison attempt (2026-10-15)
A search found no state revenue department online calculator for tax year 2026; the results were third-party sites, which are not official sources. New York's tax tables page offers 2025 as its latest year (the 2026 return forms are not published until the filing season). So an official-calculator comparison for 2026 is not possible for most states until their 2026 forms appear. The state results stay labelled as estimates, and the agency-schedule checks in `wageTax.test.ts` (about 40 states, plus married at $200,000 for 11) remain the verification basis.

## What stays open
- State comparisons against each state's 2026 forms and tables once published (early 2027), starting with California, New York, Pennsylvania, Illinois, Massachusetts and Oregon.
- Child tax credit and dependents, if the site chooses to model them.
