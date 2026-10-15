# International and regional output audit — October 15, 2026

## Scope

Audit only. No production changes. Tracked worktree was clean initially; unrelated untracked files were preserved.

Executed the actual `results` callbacks in Europe, Asia, South America and Caribbean with real imported calculation helpers and tax engines. The harness excludes UI-only PDF/visa imports, does not mount React, and supplies explicit field states. This tests arithmetic and data flow, not browser hydration, every city preset, or correctness of every country's tax law.

Compare Cities engines were also executed directly. Country tax values are **not independently certified** by arithmetic identities such as gross minus tax equals net. No new official-site comparisons were performed.

## Executed matrix

| Surface | Countries | Scenarios |
|---|---|---|
| Europe `/europe-relocation-calculator` | PT, GB, DE | Working and retired; $50k/$100k/$150k/$250k origin income |
| Asia `/asia-relocation-calculator` | SG, JP, AE | Same income/mode matrix |
| South America `/south-america-relocation-calculator` | CO, BR, CL | Same matrix, v2 USD destination contract |
| Caribbean `/caribbean-relocation-calculator` | JM, BB, KY | Same matrix, remote working or retired |
| Compare Cities `/compare-cities` | PT, GB, SG, JP, CO, BR, JM, BB, KY | Same matrix, actual international or Caribbean engine |

Regional tests additionally exercise two adults/two children, furnished/unfurnished, utilities included/excluded, car on/off, rent/buy, origin GBP conversion, display-currency independence of canonical results, and zero savings. Five additional tests reproduce questionable or incorrect behavior. Total new tests: **197**.

## Independent positive-value budget reference

Inputs: rent 1,000; groceries 300; utilities 100; transport 50; healthcare 150; no car; one adult; no children. Deposit 2,000; first rent 1,000; last rent 0; visa 100; flight 200; shipping 300; temporary stay 400; admin 50; furniture 500; buffer 1,000; savings 20,000.

| Output | Reference | Observed |
|---|---:|---|
| Housing including utilities | 1,100 | Matches |
| Living costs excluding utilities | 500 | Matches |
| Total monthly costs | 1,600 | Matches |
| Upfront cash including buffer | 5,550 | Matches |
| Coverage, Europe/Asia/South America | (20,000 − 5,550) / 1,600 = 9.03125 months | Matches for USD-equivalent scenario |
| Coverage, Caribbean | (20,000 − 4,550) / 1,600 = 9.65625 months | Matches its different buffer treatment |
| Two-adult/two-child groceries | 300 × 2.25 = 675 | Matches |
| Two-adult/two-child transport | 50 × 1.65 = 82.50 | Matches |
| Two-adult/two-child healthcare | 150 × 2.7 = 405 | Matches |
| Two-adult/two-child utilities | 100 × 1.55 = 155 | Matches |

Europe's entered costs are destination-local: divide cost references by its configured destination FX rate, while savings remain origin-currency. Other tested regional contracts use USD destination costs. Tests explicitly use that distinction; identical raw input numbers are not assumed to mean identical currency amounts.

## Confirmed findings

### 1. Medium: Asia origin city scaling is not reversible

`src/components/AsiaRelocationCalculator.tsx:548–574`.

Destination inputs are already city-adjusted. Origin estimates multiply those inputs by origin multipliers without dividing by destination multipliers. Reproduction: same SG origin/destination, both multipliers 1.2, groceries 300 → destination 300, origin **360**. The same-city result should be equal. South America uses the from/to ratio instead.

Recommendation: use origin-specific defaults or a consistent origin/destination ratio. Add same-city identity and round-trip scaling tests.

### 2. Medium: Caribbean explicit zero car cost is ignored

`src/components/CaribbeanRelocationCalculator.tsx:740–745`.

`nz(carCost) || cityDefault || fallback` treats a deliberate zero as missing. With car enabled and `carCost="0"`, it returns a positive default instead of zero. The fallback constant is $350 when no city default exists.

Recommendation: distinguish blank from zero before choosing a default. Preserve URL-restored zero too.

### 3. High: invalid negative inputs can improve affordability

- `src/components/AsiaRelocationCalculator.tsx:559`: rent `-1000` produces negative destination rent.
- `src/components/EuropeRelocationCalculator.tsx:925`: furniture `-500` reduces upfront cash; surrounding cost fields use nonnegative handling, but furniture uses `numericValue` directly.

Both were executed. Input attributes alone do not protect restored URL/state values or all manual input paths. Broader negative input handling in South America and Caribbean also needs a consistent validation policy; do not infer their safety from positive matrix tests.

Recommendation: reject invalid costs or normalize consistently at the numeric boundary with clear UI feedback. Do not silently turn invalid data into apparently improved financial readiness.

### 4. High: zero income yields a comfortable cost-ratio band

Europe, Asia and South America use `netMonthlyTo > 0 ? costs/net : 0`; Caribbean uses the equivalent expression. All four return comfort band **A** with zero income and positive costs. The engines also return `salaryReady=false`, but that is not reflected in the comfort object. Source inspection found comfort rendered/exported independently in Caribbean and South America.

Recommendation: return an explicit unavailable/no-income state rather than a zero ratio and suppress favorable recommendations until income is valid. Browser rendering should be regression-tested.

## Contract inconsistencies and model limitations—not automatic formula corrections

### Emergency buffer and runway

Europe/Asia/South America subtract the buffer as part of upfront cash before dividing savings by monthly expenses. Caribbean subtracts only startup costs and retains the buffer in spendable runway. Difference in the reference scenario: **0.625 months**. Neither contract should be silently imposed on all tools: decide whether the buffer is reserved or available for expenses, then label both liquidity and runway consistently. Refundable deposits and prepaid rent also merit an explicit liquidity/time-horizon explanation.

### Caribbean household consistency

Caribbean permits fractional adults/children; the other regional engines floor these values. Caribbean origin healthcare is not multiplied by household size, while destination healthcare is. Origin utilities are included regardless of the destination utilities-included setting. Some of these differences may represent intentional origin/destination assumptions, but they are not equivalent household budgets.

### Country/city estimates

- International Compare Cities deliberately uses the common tax engine rather than every specialized regional question path. Caribbean uses its specialized engine with unanswered defaults. Differences versus full calculators can therefore be expected, but must be disclosed.
- Compare Cities `housingMonthly` includes groceries, utilities, transport and healthcare internationally, while US housing cost excludes those categories. Do not assume displayed flexibility has identical scope across region modes.
- Caribbean fallback costs use percentages of country rent in Compare Cities, while the full calculator has separate country cost defaults. Defaults need not match; comparisons require identical assumptions before treating differences as bugs.
- Unknown or disclaimer tax scenarios may return gross as net. Confidence flags are essential; this audit does not endorse those as zero-tax countries.
- International buy prices are estimated as 16 × annual rent; annual property tax/insurance is a generic 1.5% of value. These are planning assumptions, not verified market values. Buy-mode tests checked integration, not local acquisition costs or lending eligibility.
- South America legacy URL units are covered by existing currency-contract tests, but this new numerical matrix uses v2 only. It does not certify every legacy shared URL.

## What the harness verifies and what remains

Verified: specified positive numeric inputs reach real result callbacks, local-to-USD direction, household arithmetic, rent/buy replacement, conditional costs, canonical display-currency independence, savings arithmetic under each current contract, and Compare Cities net/cost identities.

Not verified here: browser interactions, raw decimal URL round-trip for all regions, all presets/cities, every conditional tax-answer combination, live FX freshness, each country's current legislation, visas, or display formatting. Europe uses local-city defaults in its origin branch, so the earlier possibility of blindly double-converting USD city defaults was not confirmed: the actual getter is `getCityDefaultsLocal`.

## Recommended sequence

1. Prevent favorable readiness scores on missing/zero income and validate negative monetary values.
2. Correct Asia reverse city scaling and Caribbean zero car handling.
3. Approve unified or explicitly differentiated buffer/runway and household conventions.
4. Add preset/URL/browser round-trip matrices and compare regional pages with Compare Cities using identical costs and answers.
5. Independently verify country taxes by data year against official calculators/rules. Keep that result separate from arithmetic pass counts.

Files added: `src/lib/regionalOutputs.audit.test.ts` and this report. No production files edited; no commit or push.

## Corrections applied (2026-10-15)

The five reproductions are now correctness tests, and the audit harness extracts each component's real `nz` helper (it used a stand-in before, which hid the negative-input fix). 199 tests in `regionalOutputs.audit.test.ts` pass.

- **Negative entries (high, fixed):** every region now treats a negative cost, income, saving or count as zero (`nz` and Europe's `numericValue` clamp at zero), so a negative rent or furniture figure can no longer improve affordability. Down payments are also capped at 100% in all four regions. There is no on-page warning for a negative entry; the number inputs already have a minimum of zero, so this covers restored links and pasted values.
- **Zero income (high, fixed):** the comfort score is "— · Enter your income" with a neutral (empty) bar instead of band A. Checked in the browser on Europe at salary 0.
- **Asia origin scaling (medium, fixed):** the origin city's cost is the destination figure times the origin-to-destination multiplier ratio, as in South America, so the same city on both sides gives the same figure (360 became 300 in the audit case).
- **Caribbean zero car cost (medium, fixed):** an entered zero stays zero; a blank field uses the city default.
- **Emergency buffer and runway (decision, applied):** all four regions now reserve the emergency buffer before counting months of runway. Caribbean previously kept it in the runway, which also contradicted its own summary text ("upfront costs" included the buffer). The earlier difference was 0.625 months in the reference scenario. Reverse this in `CaribbeanRelocationCalculator.tsx` (`remainingSavingsAfterMove`) if the buffer should count as spendable.
- **Caribbean household (fixed):** whole-person counts, and the origin healthcare scales with the household like the destination.

Left as documented, not changed: Compare Cities scope differences between regions; the 16x-rent buy price and 1.5% tax and insurance planning assumptions; unanswered-question defaults; legacy South America URLs; the origin utilities line ignoring the destination's utilities-included setting (an intentional origin assumption).
