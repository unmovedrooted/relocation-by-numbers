# Reference cases: what is checked against official figures

Date: 2026-10-18. This lists every comparison of the site's numbers with a figure an authority published or computed, where the test lives, and what is still not compared. Tests run on every change (`npx vitest run`).

## Federal tax and payroll (United States)

| Check | Source | Test |
|---|---|---|
| Single filer, wages, 2026: tax, with the $3, $6, $0 and $450 differences explained | IRS Tax Withholding Estimator, run 2026-10-14 | `docs/audits/release-checks-2026-10-14.md` |
| Married filing jointly, one earner on $150,000: standard deduction $32,200, tax $15,340 | IRS Tax Withholding Estimator, run 2026-10-15 | `officialTaxExamples.audit.test.ts` |
| 2026 brackets, standard deduction, Social Security wage base, Medicare and Additional Medicare thresholds | IRS Rev. Proc. 2025-32; Publication 15 | `wageTax.test.ts` |
| Required minimum distribution: divisors 26.5 (73) and 24.6 (75), $100,000 at 75 gives $4,065, $34,800 at 73 gives $1,313 | IRS Publication 590-B, Table III examples | `irsWorkedExamples.audit.test.ts` |

## State income tax

About 40 states at $100,000 (single) and 11 at $200,000 (married joint) against hand calculations from each state's own 2026 schedule, plus bracket-top figures the agencies print (West Virginia, Maine, South Carolina, Connecticut). Tests: `wageTax.test.ts`. No state publishes an online calculator for tax year 2026 yet, so these rest on schedules, not calculators. California conforms to the federal 401(k) exclusion (Revenue and Taxation Code section 17501); Pennsylvania taxes contributions.

## Other countries

| Country | Source | Test |
|---|---|---|
| Germany | Federal Ministry of Finance income tax calculator | `officialTaxExamples.audit.test.ts` |
| New Zealand | Inland Revenue April 2026 PAYE tables | same |
| Singapore | IRAS sample calculations, year of assessment 2026 | same |
| Ireland | Revenue worked example and employee PRSI rate | same |
| South Africa | SARS 2026/27 rates of tax | same |
| Canada (Ontario) | CRA Payroll Deductions Online Calculator (within 0.5%; it projects one pay period) | same |
| Australia, Switzerland, France, UK, Japan, Spain, Portugal, Mexico | Official rules and tables (not calculator sessions); seven defects found and fixed | `eightCountryOfficial.audit.test.ts`, `eight-country-official-validation-2026-10-15.md` |

## Housing, migration and data

| Check | Source | Test |
|---|---|---|
| Mortgage payments and amortization | Freddie Mac worked examples | `liveCalculatorMath.audit.test.ts` |
| California to Texas migration, five years (36,103 to 44,417 households) | IRS Statistics of Income state outflow files | `migration.test.ts` |
| Rent, home value, property tax | U.S. Census Bureau ACS 2020-2024 | `scripts/build-government-data.mjs` |
| Price levels | BEA Regional Price Parities | same |
| Residential electricity price | EIA Electric Power Monthly, Table 5.6.B | `scripts/build-electricity-data.mjs` |

## Closed-form checks

FIRE number, Coast FIRE number, employer match, deposit timing, and the two Barista income rules (income earned now adds to saving; income after leaving full-time work only lowers the gap) are checked against formulas in `liveCalculatorMath.audit.test.ts`.

## Not compared with an official figure yet

- State tax against each state's own online calculator (none exist for 2026).
- Child tax credit and dependents (not modelled).
- The other country modules against a calculator session (Switzerland, France, UK, Japan, Spain, Portugal, Mexico, Australia are checked against published rules only).
- Rent versus buy, the Roth conversion break-even and the Complete Retirement Plan against an outside reviewer's worked cases.
