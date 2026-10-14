# Fixed financial scenarios: first comparison batch

Date: 2026-10-14. Repository starting commit: `6a83193`.

## Status and limits

**This is a partial benchmark, not a completed comparison of every calculator.**

76 numerical observations were executed against repository functions. 65 matched the reference to the displayed cent; 7 had monetary differences and 4 returned null where a payment was expected. These represent three distinct findings, not eleven independent defects.

Reference values were independently calculated from official published rules or mathematical identities. **No official interactive calculator was submitted, and no website UI output was captured in this batch.** Therefore the results must not be described as official-calculator-to-website comparisons or certification of a whole route. The coverage register below explicitly identifies remaining work.

No production formulas, defaults, labels or existing tests were changed. The only additions are this report and `src/lib/officialScenarioComparison.audit.test.ts`. Existing untracked `.claude/`, `INDEXING-QUEUE.md`, `STATE-WAGE-RULES-DRAFT.md` and `STEP2-INVENTORY.md` were left alone.

## Reproduction

```powershell
npx.cmd vitest run src/lib/officialScenarioComparison.audit.test.ts --silent=false --reporter=verbose
```

The audit test prints every reference, actual and difference. It asserts that observations are finite (or explicitly null) and that the matrix was executed. **A passing observational test does not mean the comparisons all passed.** Known differences remain visible rather than being converted into passing correctness assertions. References do not import production tax constants.

## Scenario definitions

- US: calendar 2026; single, age 40, one employee, full-year resident; no dependents, other income, contributions, itemized deductions or credits; no city tax. Salaries USD 50,000 / 100,000 / 150,000 / 250,000. PA includes employee unemployment contributions, but deliberately excludes municipality-specific EIT/LST. This is annual liability, not withholding.
- UK: 2026/27; England/Wales/Northern Ireland, employment income only; no pension deductions or student loans. Salaries GBP 50,000 / 100,000 / 150,000 / 250,000. NI is annualized; actual pay-period rounding may differ.
- Singapore: YA2026 rates; resident employment-pass holder under 55; no CPF; SGD 1,000 earned-income relief; no other reliefs or rebate. Salaries SGD 50,000 / 100,000 / 150,000 / 250,000. Both international and Asia engines executed.
- Jamaica: JMD 5m / 10m / 15m / 25m statutory income before the tax-free allowance. Income-tax-only bracket test, no other deductions or payroll contributions. Uses the post-April annualized threshold, deliberately not calendar-2026 blended tax. Do not interpret as complete salary take-home.
- Retirement: base-standard-deduction withdrawal checks in FL/PA, then an eligible single 65-year-old U.S. taxpayer in FL with no other income, no basis, no credits, standard deduction and temporary senior deduction. Same four annual withdrawal amounts. No payroll tax on distributions. Complete Plan household engine tested separately.
- Mortgage/accumulation/RMD: USD 120k / 240k / 400k / 800k principal or balance. No FX conversion in this batch. Local currency salary scenarios are **not equal purchasing-power or USD-equivalent salaries**.

## US salary results

Annual net income, reference = actual in every cell; difference USD 0.00.

| State | $50k salary | $100k salary | $150k salary | $250k salary |
|---|---:|---:|---:|---:|
| Florida | 42,355.00 | 79,180.00 | 113,791.00 | 183,182.00 |
| Texas | 42,355.00 | 79,180.00 | 113,791.00 | 183,182.00 |
| North Carolina | 40,868.72 | 75,698.73 | 108,314.73 | 173,715.73 |
| Pennsylvania, no local tax | 40,785.00 | 76,040.00 | 109,081.00 | 175,332.00 |

Displayed two-decimal values follow JavaScript rounding; half-cent floating representation is not a material tax discrepancy. PA is not a claim that a specific PA municipality has zero local taxes.

## Country results

Annual tax, reference = actual unless a difference is shown.

| Engine / currency / measure | 50k | 100k | 150k | 250k | Difference |
|---|---:|---:|---:|---:|---|
| UK GBP, income tax + employee NI | 10,480.40 | 31,442.60 | 58,713.60 | 105,713.60 | 0.00 |
| Singapore SGD, international income tax | 1,180.00 | 5,535.00 | 12,300.00 | 30,505.00 | 0.00 |
| Singapore SGD, Asia income tax | 1,180.00 | 5,535.00 | 12,300.00 | 30,505.00 | 0.00 |

| Jamaica statutory income JMD | Official-rule reference tax | Repository tax | Repository minus reference |
|---|---:|---:|---:|
| 5,000,000 | 774,410 | 774,410 | 0 |
| 10,000,000 | 2,224,410 | 2,129,292 | -95,118 |
| 15,000,000 | 3,724,410 | 3,629,292 | -95,118 |
| 25,000,000 | 6,724,410 | 6,629,292 | -95,118 |

### Finding 1: Jamaica bracket base — high priority

`src/lib/caribbeanTax/countries/jm.ts` supplies a 6m first taxable bracket **after** deducting the 1,902,360 allowance. The government example places the 30% boundary at 6m aggregate/statutory income, not 6m plus the allowance. At sufficiently high income, the model keeps an extra 1,902,360 in the 25% band: `1,902,360 * (30% - 25%) = 95,118` understated tax.

The tax engine is `estimateScenarioTax` in `src/lib/caribbeanTax/engine.ts`. The primary consumer is `/caribbean-relocation-calculator`; compare-city consumers use the Caribbean engine too. Browser rendering and international-engine Jamaica parity remain untested.

Before correcting: re-confirm the continuing 30% boundary with current TAJ guidance; the government worked example retrieved is from 2016. The current 2026 allowance was separately verified. The 2026 calendar-year weighted allowance (1,876,614) is another contract distinction, not included in the above delta. The source explicitly says the April annualized figure changed midyear. Payroll omissions are additional, disclosed limitations and are not included in this discrepancy.

## Retirement differences

Base-deduction FL/PA helper checks matched: federal tax 3,820 / 13,170 / 24,734 / 51,304 at the four income levels. This does not validate age-specific eligibility or penalties.

For the eligible age-65 Florida case:

| Annual traditional withdrawal | Reference federal tax | Standalone helper | Difference | Complete Plan household engine |
|---|---:|---:|---:|---:|
| $50,000 | 2,854 | 3,820 | +966 | 2,854 |
| $100,000 | 11,729 | 13,170 | +1,441 | 11,729 |
| $150,000 | 23,882 | 24,734 | +852 | 23,882 |
| $250,000 | 50,648 | 51,304 | +656 | 50,648 |

### Finding 2: standalone retirement tax omits age eligibility — high priority

`withdrawalIncomeTax` in `src/lib/retirementTax.ts` has no age/year/eligibility argument and delegates to the wage engine. It cannot apply the 2026 single age-65 standard-deduction increment of 2,050 or the temporary 6,000 deduction with its income phaseout. The helper is used by `/retirement-calculator`, `/retirement-withdrawal-calculator` and `/rmd-calculator`. UI integration was inspected, not executed.

This is a missing modeling capability for those profiles, not a failure of the salary brackets. The Complete Plan's `estimateHouseholdTax` supports the profile and matches. Proposed correction: pass explicit supported age/year/eligibility or disclose the simplified tax estimate; do not assume all users qualify. State-specific retirement exclusions also need separate benchmark coverage: the standalone helper predominantly reuses wage treatment, with only IL/PA/MS explicitly exempted.

## Other mathematical checks

These use mathematical identities, not an official lender quote or official retirement simulator.

| Calculation | Inputs / reference | Actual / difference |
|---|---|---|
| Full housing zero-interest P&I | 10 years, loans 120k/240k/400k/800k: 1,000 / 2,000 / 3,333.3333 / 6,666.6667 monthly | Matches |
| Decimal quick mortgage helper | Same, rounded whole dollars: 1,000 / 2,000 / 3,333 / 6,667 | Matches |
| Percentage quick mortgage helper | Same expected whole-dollar payments | **null in all four** |
| Full mortgage 6.5%, 30 years | P&I 758.48 / 1,516.96 / 2,528.27 / 5,056.54; reference sums discounted monthly cash flows | Matches to cent |
| Accumulation, 5%, 10y, zero volatility/contributions | 195,467.36 / 390,934.71 / 651,557.85 / 1,303,115.70 | Matches to cent |
| Complete Plan RMD age75 | Prior balance / 24.6: 4,878.05 / 9,756.10 / 16,260.16 / 32,520.33 | Matches to cent |
| Rent-v-buy, 10y zero-interest loan, 1y horizon | No down payment/costs/growth, rent = P&I; buyer equity 12k / 24k / 40k / 80k | Matches to cent |

### Finding 3: unused quick-estimate helper rejects 0% — low priority

`estimateMortgageMonthly` in `src/lib/housing.ts` returns null for `r <= 0`. The full `monthlyHousingCost` and the separate `src/lib/mortgage.ts` helper correctly support zero rates. Repository search found only tests calling the defective exported helper, not a current production page. Do not describe this as the main mortgage calculator being broken. A narrowly scoped zero-rate branch would remove the latent inconsistency.

## Complete calculator coverage register

“Shared dependency checked” does not mean the route's complete outputs, state, FX or UI were verified.

| Route(s) | This batch | Still required |
|---|---|---|
| `/`, `/paycheck-calculator`, `/income-tax-calculator` | Shared wage engine, 16 US salary cases | Browser outputs, city taxes, married/two earners, deferrals, payroll timing |
| `/compare`, `/compare-cities` | Some underlying US/UK/SG dependencies | Full destination budgets, FX, salary-needed solver, displayed comparison parity |
| `/one-income-relocation-calculator` | Shared single-earner wage dependency | Two-income household and second-salary solver |
| `/mortgage-calculator` | Full P&I functions, 8 cases | UI cash-to-close, PMI, amortization, extra payments, refinance, DTI |
| `/housing-affordability-calculator` | Not benchmarked | DTI/rent caps and inverse-price solver; lender guidelines are not approval guarantees |
| `/rent-vs-buy-calculator` | Four zero-rate equity identities | Full multi-year growth, investment timing, maintenance, selling costs, displayed results |
| `/fire-calculator` | Salary dependency only | Full FIRE timeline, inflation/returns/contributions; no official prediction equivalent established |
| `/fire-number-calculator`, `/lean-fire-calculator`, `/chubby-fire-calculator`, `/fat-fire-calculator` | Not independently benchmarked | Spending/withdrawal identities and component integration |
| `/barista-fire-calculator`, `/coast-fire-calculator`, `/savings-rate-for-fire` | Not independently benchmarked | Income offsets, discounting, savings-rate horizons |
| `/complete-retirement-plan` | Four age65 federal cases, four RMD cases | Full annual settlement, state/city taxes, SS, IRMAA, contributions, conversions, basis, strategy ranking |
| `/retirement-calculator`, `/retirement-withdrawal-calculator` | Withdrawal tax helper; accumulation primitive only | End-to-end projections and withdrawal sequencing; senior omission documented |
| `/401k-calculator` | Shared wage/accumulation dependencies | Contributions, match, caps and tax-saving calculations |
| `/hsa-calculator` | Shared wage dependency only | Contribution eligibility, FICA method, CA/NJ treatment and distributions |
| `/rmd-calculator` | Shared withdrawal-tax issue; Complete Plan RMD helper tested separately | Standalone component's separate divisor table and UI must be tested independently |
| `/roth-conversion-calculator` | Dependency inspection only | Incremental tax, basis, tax-funding source, return timing, break-even |
| `/investment-calculator` | Four zero-volatility accumulation primitive cases | Contribution timing, deterministic UI, nonzero-volatility statistical validation |
| `/international-relocation` | UK/SG engine cases | Other countries, expatriate overlays, FX, living costs and upfront totals |
| `/europe-relocation-calculator` | UK tax dependency only | Other European destinations, local/remote/retired profiles and complete budget |
| `/asia-relocation-calculator` | SG resident salary tax cases | Other countries, residence/CPF/age profiles and full budget |
| `/caribbean-relocation-calculator` | Jamaica income-tax bracket cases | Payroll, calendar-year contract, other islands and full budget |
| `/south-america-relocation-calculator` | Source inspection, no numerical benchmark | Colombia and other country taxes, contributions, FX and complete budget |
| Dynamic city/cost-of-living/salary pages | Not end-to-end benchmarked | Enumerate generated routes and verify displayed data-flow; shared-engine matches are insufficient |

No government benchmark was established for rent/groceries defaults, FIRE success probability, Monte Carlo percentiles or an optimal Roth strategy. Those require documented assumption comparisons and independent math/statistical checks, not invented “official” outputs.

## Official sources retrieved

1. [IRS Publication 505, 2026 rate schedules and deduction worksheets](https://www.irs.gov/publications/p505).
2. [IRS Social Security and Medicare rates](https://www.irs.gov/taxtopics/tc751).
3. [NC tax rate schedules](https://www.ncdor.gov/taxes-forms/individual-income-tax/tax-rate-schedules) and [standard deductions](https://www.ncdor.gov/taxes-forms/individual-income-tax/filing-topics/north-carolina-standard-deduction-or-north-carolina-itemized-deductions).
4. [PA personal income tax](https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/personal-income-tax) and [employee unemployment contribution](https://www.pa.gov/agencies/dli/resources/for-employers-and-educators/how-to-file/uc-tax/yearly-tax-highlights).
5. [HMRC 2026/27 thresholds](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027).
6. [IRAS income tax rates](https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-residency-and-tax-rates/individual-income-tax-rates) and [earned-income relief](https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-reliefs-rebates-and-deductions/tax-reliefs/earned-income-relief). IRAS links a YA2026 spreadsheet calculator; it was not executed.
7. [Jamaica 2026 threshold announcement](https://jis.gov.jm/increase-in-income-tax-threshold-now-in-effect/) and [TAJ aggregate-income worked example](https://jis.gov.jm/media/Final-30_-on-Aggregate-Income-PRESS-RELEASE.pdf). The latter is historical and its ongoing application must be re-confirmed before a production correction.
8. [IRS enhanced senior deduction](https://www.irs.gov/newsroom/check-your-eligibility-for-the-new-enhanced-deduction-for-seniors) and [26 USC 151 phaseout](https://uscode.house.gov/view.xhtml?req=%28title%3A26+section%3A151+edition%3Aprelim%29).
9. [IRS Publication 590-B, Uniform Lifetime Table](https://www.irs.gov/publications/p590b).

ATO resident-rate page retrieval failed in the browsing tool. No Australian result is claimed. Colombia UVT was verified from DIAN but complete rules were not independently verified, so it is not counted as a tested country.

## Validation and next sequence

- Full suite, rerun with final 76-row matrix: 120 files, 1,976 tests passed.
- Expanded 76-row observation test: passed execution/finite-value checks, with the differences above.
- TypeScript after expansion: passed.
- Changed-file ESLint: passed on the final version. `git diff --check` also returned no errors (new report/test are untracked).
- Production build and browser checks: not run; production code was not changed.

Next: (1) capture current official calculator/workbook outputs for matching profiles; (2) finish the route register's pending independent scenario tests, prioritizing retirement and Jamaica; (3) add Colombia/Portugal/Japan and representative complex US states/cities; (4) run the same fixtures through page UI and FX flows; (5) correct only approved findings with regression assertions. Do not infer completion from the green existing test suite.

No commit or push performed.

## Decision on Finding 2 (2026-10-14)

The owner chose to keep the standard deduction and disclose it. The retirement, RMD and withdrawal calculators now say the age-65 extra deduction and the temporary senior deduction are not applied, so tax may be overstated. The Complete Plan engine still applies them.
