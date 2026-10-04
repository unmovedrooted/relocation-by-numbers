# Restricted Oregon local-tax planning contract

Implemented October 4, 2026. Supersedes the SHS/PFA omission described in the earlier local-tax audit; Portland Arts Tax remains omitted.

## Inputs and scope

Two independent choices: full-year Metro resident or outside Metro with no Metro-source income; full-year Multnomah resident or outside with no county-source income. Both choices apply to the whole household and all projected years. Unknown, mixed-spouse, part-year and nonresident sourced-income situations fail rather than silently becoming zero tax. No address is collected.

Users must confirm no special exempt income, exempt retirement rollovers, pass-through modifications or other-jurisdiction credits. When either tax applies, nonzero pension income must be explicitly private; public and unknown pensions fail. This narrow version does not implement PERS/federal/military exemptions or trace exempt rollovers. Account provenance remains a user-confirmed assumption.

## Calculation

Base: the existing modeled Oregon taxable income after its deductions and federal-tax subtraction. This is not gross salary or federal AGI. Existing Oregon estimate limitations carry into the local estimate. Standard-deduction model only; no itemized local-tax feedback.

- SHS: 1% above $128,000 single/$205,000 joint for 2026; $132,000/$211,000 for 2027. The 2027 amounts are explicitly held for 2028–2030 rather than forecast. SHS is zero after its current-law 2030 sunset; no renewal assumed.
- PFA: 1.5% above $125,000/$200,000 plus another 1.5% above $250,000/$400,000. From 2028 the first marginal component is 2.3%, giving a combined top marginal rate of 3.8%. No invented threshold indexing.
- Both taxes accumulate when both jurisdictions apply. No intermediate rounding; planning output is rounded only for display.
- Annual settlement includes the local total exactly once. The contract flows through the timeline and bracket strategies; CSV/PDF total-tax values consequently include it. Dedicated SHS/PFA export columns were not added.

## Sources

- [Portland rates and thresholds](https://www.portland.gov/revenue/personal-tax)
- [Multnomah PFA schedule](https://multco.us/info/multnomah-county-preschool-all-personal-income-tax)
- [Metro funding and sunset](https://www.oregonmetro.gov/what-metro-does/housing-and-homelessness/supportive-housing-services/funding)
- [Metro full-year return instructions](https://www.portland.gov/revenue/2025met40-instructions): base and special exemptions; 2025 instructions are not used for the superseded SHS threshold.

## Validation

Tests cover single/joint known answers, fractional-dollar threshold crossings, jurisdiction independence, invalid values, unknown choices, 2028 change, 2030/2031 sunset, private-pension restriction, cash reconciliation and conversion-strategy propagation. Existing state-tax fixtures explicitly select outside/no-source to retain their state-only purpose.

Browser check: missing choices produce an error. A fictional $300,000-salary, one-year scenario displays total tax of $117,457 inside both jurisdictions versus $112,479 outside both. The underlying independently checked local difference is $4,978.60 (display totals round independently). Editing jurisdiction disables stale CSV export until recalculation. Only the existing logo aspect-ratio development warning was captured.

## Remaining limitations

Future SHS indexing is frozen and disclosed, not a statutory forecast. Public-retirement exemptions, sourced-income allocation, different household jurisdictions, pass-through adjustments, special credits and Arts Tax require separate future batches. This is not a complete local tax return or a certification of the underlying Oregon state estimate.
