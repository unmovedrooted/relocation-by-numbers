# Compare Cities international modes: audit, 2026-10-15

Method: Compare Cities (`compareEngines/international.ts`, `compareEngines/caribbean.ts`) was run against the real regional
calculators' `results` callbacks on identical inputs (new shared harness `src/lib/regionalHarness.ts`), and its cost and mortgage
arithmetic against independent references. Tests: `src/lib/compareCitiesInternational.audit.test.ts` (52 tests).
Exploratory differences were first measured at $100,000 gross, single, per month.

## Differences found (all fixed)

| Finding | Size | Fix |
|---|---|---|
| **Compare "working" was taxed as a local employee** (the shared estimator's default) while the full calculators default to a remote worker. Europe: PT -$693, ES -$211, DE -$905, FR -$1,308, IT -$417 a month; the Caribbean mode in the same tool already assumed remote. | up to $1,308 a month | Compare passes the "remote" scenario for working income (and "retired" for retired). The page note says so. |
| **Asia used a different tax model than the Asia calculator** (shared international estimator instead of `estimateAsiaTax`). JP +$893, MY -$2,625 (remote income exempt in the Asia model), TH -$18. | up to $2,625 a month | Compare uses `estimateAsiaTax` for the Asia region. |
| **Caribbean effective rate rounded to a whole percent.** The engine's `effectiveRate` is rounded to 2 decimals as a fraction (25.12% became 25%); Compare used it while the full calculator uses the exact tax. JM -$10, BB -$12, BB retired -$27 a month. | up to $27 a month | Compare uses tax divided by income. |
| **South America calculator did not pass the income scenario to the tax engine**, so a "remote" salary type was taxed as a local employee (Europe, Asia and the international calculator do pass it). | $134 to $450 a month | Fixed in the calculator; Compare and the calculator now agree. |
| **Buying with a down payment of 100% or more showed $0** (the shared mortgage helper returned nothing when there was no loan, so the property tax and insurance disappeared). | the whole monthly cost | `mortgage.ts` returns tax and insurance for a purchase with no loan, and caps the down payment at 100%. This helper is also used by the Asia, Europe, South America and Caribbean calculators. |

## Verified

- Take-home pay agrees with the full regional calculator to the cent for 15 Europe, Asia and South America countries in working and retired modes (PT, ES, DE, GB, FR, IT, SG, JP, TH, MY, AE, CO, BR, CL, MX) and six Caribbean countries; the U.S. tax overlay agrees too.
- Costs: rent, groceries, utilities, transport and healthcare for a city with data, and the country-level fallback shares of rent (18%, 8%, 7%) for a country without; flexibility and the share of take-home pay; effective tax rate.
- Buying: price of 16 years of rent, the loan payment plus the 1.5% tax-and-insurance allowance, a 0% rate, and a cash purchase.
- No income gives no take-home pay and "Tax estimate unavailable".

## Not changed (documented)

- The living-cost rows are labelled "living costs" (not "housing") for non-U.S. regions, so the scope difference from the U.S. mode is disclosed.
- The 16x-rent buy price and the 1.5% tax and insurance allowance are planning assumptions with no market data behind them.
- Costs for a country without city data use shares of rent (18%, 8%, 7%) rather than measured figures.
- Compare Cities cannot ask the follow-up tax questions the full calculators ask, so those countries' conditional rules use their defaults.
- The Caribbean engine's `effectiveRate` is still rounded to a whole percent for any other consumer of it.
