# Release checks, 2026-10-14 (Option 1: stay live with honest labels)

## Official-source spot checks

| Check | Official source | Result |
|---|---|---|
| Mortgage payment, schedule and lifetime interest | Freddie Mac My Home worked examples ($135,000, 4.5%, 30 years: $684.03, first month $506.25 interest and $177.78 principal; at 7%: $323,337 total; $300,000 at 6.5%: about $1,896) | Matches (test in `liveCalculatorMath.audit.test.ts`) |
| Compound growth with monthly deposits | SEC Investor.gov Compound Interest Calculator, run on the live page: $10,000 start, $1,000 a month, 7% compounded monthly: year 1 $23,115.49, year 10 $193,181.42 | Matches to the cent. The SEC uses end-of-month deposits at the monthly rate, which confirms the deposit-timing change (test in `toolsResultContracts.audit.test.ts`) |
| Required minimum distribution | SEC Investor.gov RMD Calculator, run on the live page: $500,000 at age 80: factor 20.2, $24,752.48 | Both the standalone RMD calculator and the Complete Plan engine match |
| Federal income tax | IRS Publication 505 2026 rate schedule (16 salary cases, compared in an earlier audit) | Matches |
| RMD divisors | IRS Publication 590-B Uniform Lifetime Table (earlier audit) | Matches |

Not run: the IRS Tax Withholding Estimator wizard (multi-screen, asks for withholding details). Federal tax was checked against the published rate schedule instead. No state or international official calculator was run.

## Page checks (production build served locally)

All 30 calculator pages in the Explore grid carry a planning-estimate or not-advice statement; the Complete Retirement Plan also carries the Beta label. The production build completes with all 143 pages and no warnings.

## Still to do by the owner

- Add `ANTHROPIC_API_KEY` to `.env.local` and generate a Coast report and a Barista report to see them against the live model (the route names `claude-sonnet-4-6`).
- Watch the feedback box after release.
- Keep the Beta label on the retirement planner until its outside review is done.
