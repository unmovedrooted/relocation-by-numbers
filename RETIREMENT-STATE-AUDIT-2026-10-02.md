# Retirement planner validation and remaining-state audit

Reviewed October 2, 2026, starting at `ba195a4`. This is an engineering risk inventory, not a certification of 51 complete tax returns. All enabled jurisdictions were inventoried; primary-source re-verification in this batch was targeted to Hawaii, Oregon, North Carolina, and selected outstanding data questions. Existing tests passing does not establish legal completeness.

## Validated batch

- Hawaii: explicit confirmed taxable/exempt traditional IRA and 401(k) sources. Unknown/mixed sources fail closed. Exempt accounts with basis, contributions, matches or conversions remain unsupported. Federal tax is retained; eligible Hawaii withdrawals are subtracted once. Missing owners now produce a controlled validation error.
- Oregon: 2026 OR-ESTIMATE planning deductions, brackets, $260 exemption credit and $8,750 maximum federal subtraction match the published estimate document. Age/blind additions remain disclosed 2025 values. The model integrates marginal rates without rounding intermediate bands; official rounded chart bases can differ by cents. Reduced subtraction bands still need reconciliation to the final 2026 worksheet; the estimate publication confirms the maximum, not every reduced band.
- North Carolina: 3.99% for years after 2025 agrees with NCDOR. Conditional later reductions are not predicted. Pension exclusions requiring service history remain outside the supported model.
- Charts: both retirement chart containers use explicit 280px height and flexible width. Other site charts still produce build warnings; this is not a site-wide warning cleanup.

Sources:

- [Hawaii TIR 96-5](https://files.hawaii.gov/tax/legal/tir/1990_09/tir96-5.pdf): funding-source and rollover continuity; rollover status alone is not exemption.
- [Oregon 2026 OR-ESTIMATE](https://www.oregon.gov/dor/forms/FormsPubs/publication-or-estimate_101-026_2026.pdf): estimated planning figures, not a complete return.
- [NCDOR rates](https://www.ncdor.gov/taxes-forms/individual-income-tax/tax-rate-schedules): 3.99% after 2025; future triggers possible.
- [Michigan ORS March 2026, page 3](https://www.michigan.gov/ors/-/media/Project/Websites/ors/ORS-Publications/All-Systems-Connections-March-2026-v2.pdf): confirms $67,610/$135,220 retirement limits. Existing code's claim that these particular caps lack primary confirmation is now stale. This does not verify the $5,600 personal exemption or every distribution's eligibility.

## Priority findings (not silently corrected in this audit)

| Priority | Finding | Evidence / next action |
|---|---|---|
| High | Owner attribution is lost in eleven modules | Arkansas, Delaware, Georgia, Iowa, Kentucky, Louisiana, Missouri, Oklahoma, South Carolina, West Virginia, Wisconsin split aggregate distributions equally. Actual owner-attributed `retirementIncome` is available. Replace only after determining eligible sources, age tests and conversions separately for each state. |
| High | Source aggregation grants exclusions to ineligible income | Illinois explicitly excludes aggregate income including nonqualified annuity earnings. Connecticut applies one pension/IRA percentage despite a disclosed different IRA limit. Pennsylvania uses federal early-penalty status as a state eligibility proxy. Add source-specific known-answer tests before correction. |
| High | Some schedules are stale or provisional | Oklahoma code uses 2025 4.75% schedule; reconcile 2026 law and bracket consolidation. ND holds 2025 brackets; Maine pension phaseout retains approved provisional 2025 thresholds. Do not substitute withholding tables for annual return rules. |
| High | Local-tax omissions can materially understate household cost | Ohio municipal/school, Michigan city, Alabama occupational and Oregon local cases require separate coverage review; a state-only result is not a verified local zero. |
| Medium | General credits omitted | Utah's general Taxpayer Tax Credit is excluded, explicitly overstating many estimates. Treat this differently from rare special-purpose credits. |
| Medium | Investment character not always preserved | Montana uses ordinary rates for gains; Massachusetts uses a general income base; Vermont/New Mexico omit gain deductions. Verify each income source before expanding claims. |
| Medium | `stateDataYear` overstates uniform freshness | `householdTax.ts` assigns 2026 to every verified location despite mixed 2025/2026 parameters. Replace with per-parameter provenance or a clearly mixed-data label; update CSV/consumer contracts deliberately. |
| Medium | Enacted future law versus frozen assumptions | Montana explicitly omits an enacted 2027 schedule. Review other scheduled changes separately from speculative inflation; retain fixed statutory SS thresholds. |
| Medium | Incorrect explanatory claim about tracking | Several warnings say income is not tracked per owner, although the annual engine now supplies owner-level records. Updating prose alone would not fix consumers still splitting it. |

Concrete owner-attribution counterexample: married Iowa household, one owner age 60 and one age 50, $40,000 distributed entirely from the older owner's IRA. Current `perOwnerShare` grants $20,000 of retirement exclusion, rather than the $40,000 indicated by its own age-based contract. Reversing ownership leaves the same $20,000 exclusion although the qualifying-owner amount becomes zero. At 3.8%, a $20,000 taxable-base difference can change tax by $760 before floors/credits. This is a code-derived example, not a newly executed legal-regression test.

## All-jurisdiction inventory

Paths below are relative to `src/lib/retirementPlan/`. “Review” identifies outstanding work, not a newly proven legal defect. Every state remains subject to the UI's restricted assumptions and exclusions.

| Jurisdiction | Module / coverage | Main remaining review |
|---|---|---|
| Alabama | alabamaTax.ts | 2025 parameters; occupational/local taxes; pension-source eligibility |
| Alaska | verifiedLocation.ts | No individual income tax branch; full-year/no cross-border scope |
| Arizona | arizonaTax.ts | 2025 standard deduction; military exclusion omitted |
| Arkansas | arkansasTax.ts | Equal owner split after aggregate early-distribution adjustment |
| California | californiaTax.ts | 2025 brackets, deduction and credit phaseout held forward |
| Colorado | coloradoTax.ts | Owner/age/source attribution and SS interaction |
| Connecticut | connecticutTax.ts | IRA versus pension percentage; approximated SS worksheet |
| Delaware | delawareTax.ts | Equal owner split; differing under/over-60 rules |
| DC | dcTax.ts | Restricted government/survivor exclusions and credits |
| Florida | verifiedLocation.ts | No individual income tax branch; full-year/no cross-border scope |
| Georgia | georgiaTax.ts | Equal owner split; omitted owner investment income; refresh 2026 rate |
| Hawaii | hawaiiTax.ts, householdYear.ts | Single-source subset tested; mixed accounts intentionally blocked |
| Idaho | idahoTax.ts | 2025 indexed threshold/cap; restricted public pension eligibility |
| Illinois | illinoisTax.ts | Nonqualified annuity incorrectly included in aggregate subtraction |
| Indiana | indianaTax.ts | Limited county coverage; public/military eligibility |
| Iowa | iowaTax.ts | Equal owner split can reverse age-55 eligibility |
| Kansas | kansasTax.ts | 2025 amounts held pending annual source verification |
| Kentucky | kentuckyTax.ts | Equal owner split; older government-service exclusion omitted |
| Louisiana | louisianaTax.ts | Equal owner split; 2025 standard deduction |
| Maine | maineTax.ts | Provisional pension phaseout; projected cap is not published future SSA data |
| Maryland | marylandTax.ts | Primary confirmation of deduction/cap; county coverage and owner attribution |
| Massachusetts | massachusettsTax.ts | Government reciprocity; gain character; IRA state basis |
| Michigan | michiganTax.ts | Caps now primary-confirmed; exemption/eligible distribution rules and local taxes remain |
| Minnesota | minnesotaTax.ts | Qualified public pension subtraction omitted |
| Mississippi | mississippiTax.ts | Eligibility/source classification and scheduled rates |
| Missouri | missouriTax.ts | Equal owner split; 2025 public pension cap |
| Montana | montanaTax.ts | Preferential gain rates, 2027 schedule, 2025 age subtraction |
| Nebraska | nebraskaTax.ts | 2026 top rate with 2025 breakpoints/deductions/credit |
| Nevada | verifiedLocation.ts | No individual income tax branch; full-year/no cross-border scope |
| New Hampshire | verifiedLocation.ts | Repealed interest/dividend tax branch; no cross-border income |
| New Jersey | newJerseyTax.ts | Owner-age eligibility, state basis and aggregate annuity treatment |
| New Mexico | newMexicoTax.ts | Primary rate table confirmation; omitted gains deduction |
| New York | newYorkTax.ts | Restricted owner-level exclusions; NYC only, Yonkers unsupported |
| North Carolina | northCarolinaTax.ts | Corrected 3.99%; Bailey/military service-history exclusions omitted |
| North Dakota | northDakotaTax.ts | 2025 brackets; source-based investment exclusion tested previously |
| Ohio | ohioTax.ts | Municipal/school taxes absent; joint filing/lump-sum credits omitted |
| Oklahoma | oklahomaTax.ts | 2026 schedule review; equal owner split |
| Oregon | oregonTax.ts | Planning values; final phaseout table/age additions/local taxes outstanding |
| Pennsylvania | pennsylvaniaTax.ts | Federal penalty proxy differs from state eligibility; limited local cities |
| Rhode Island | rhodeIslandTax.ts | 2025 eligibility thresholds; phaseout reconstruction; account versus pension sources |
| South Carolina | southCarolinaTax.ts | Equal owner split; military treatment and deduction interactions |
| South Dakota | verifiedLocation.ts | No individual income tax branch; full-year/no cross-border scope |
| Tennessee | verifiedLocation.ts | Hall tax repealed branch; no cross-border income |
| Texas | verifiedLocation.ts | No individual income tax branch; full-year/no cross-border scope |
| Utah | utahTax.ts | General Taxpayer Tax Credit and competing retirement credit omitted |
| Vermont | vermontTax.ts | 2025 amounts; pension election eligibility and gains/interest adjustments |
| Virginia | virginiaTax.ts | Personal exemption coverage and scheduled deduction law review |
| Washington | washingtonTax.ts | 2025 capital-gains deduction; source exemptions, not general income tax |
| West Virginia | westVirginiaTax.ts | Equal owner split; verify SS phase-in and rate effective dates |
| Wisconsin | wisconsinTax.ts | Equal owner split; approximate standard deduction and alternative exclusions |
| Wyoming | verifiedLocation.ts | No individual income tax branch; full-year/no cross-border scope |

## Correction sequence

1. Owner/source-specific eligibility regression cases, then narrow state corrections; do not replace all formulas generically.
2. Oklahoma and other enacted 2026/2027 rates; primary-source confirmation of pending Maine/ND figures.
3. Illinois/Connecticut/Pennsylvania income-character corrections and clear unsupported-case guards.
4. Local-tax coverage, general credits and per-state data provenance.
5. Re-run timeline, strategy and cash-settlement tests after each small batch. Preserve beta/noindex until release criteria are met.

This report does not authorize a release or claim all states are production-certified. No tax rates were silently updated as part of this inventory.

## Executed validation

- Focused Hawaii/household-year/Oregon/North Carolina tests: 92 passed.
- Full Vitest suite: 1,334 tests across 97 files passed (five added test cases plus expanded existing guard assertions).
- TypeScript `--noEmit`: passed.
- ESLint: all 13 files from the starting tax/chart commit, including files edited in this batch, passed.
- Production build: Next.js 16.2.10 passed, 137 pages generated.
- `git diff --check`: passed; Git reports normal LF-to-CRLF conversion notices.
- Production browser at localhost:3001: Hawaii unknown source blocked with an actionable error and stale exports disabled; confirmed taxable and exempt-rollover scenarios both completed. Oregon and North Carolina projections completed with their expected disclosures. These are smoke tests with fictional defaults, not independent proofs of complete tax returns.
- Observed viewport: 603px client and scroll width, no horizontal document overflow or duplicate IDs; fixed-return chart measured 531 x 280px. No warning/error console entries observed in these scenarios. This was not a full viewport or network-response matrix.
- Simulation: after restarting the preview server on the final build, the default Florida example completed 200 paths at seed 42 and 13% entered volatility (111/200 funded). Simulation chart measured 538 x 280px, without document overflow or console warnings/errors. An earlier run against a server spanning two builds failed to load/complete its worker; clean restart and reload resolved it. This illustrates why build/release assets must remain consistent; it was not silently counted as a pass.
- Build warnings remain: unrelated chart negative initial dimensions, Tailwind config module-type warning, and edge-runtime static-generation notice. No package/config cleanup was included.
- Initial source state: clean tracked tree, untracked `.claude/` preserved. This batch has not been committed, pushed or deployed.
