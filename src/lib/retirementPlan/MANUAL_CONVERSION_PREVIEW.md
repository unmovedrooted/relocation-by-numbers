# Manual conversion preview contract

Local development only. One opt-in schedule selects an active owner, their traditional IRA, their Roth IRA, inclusive calendar years inside the projection, and a positive fixed nominal annual USD amount. Raw input strings stay in tab memory; disabling ignores drafts; reset clears them. No saving, URL persistence or optimization is added.

The adapter delegates all basis, RMD, tax, withdrawal, growth and subsequent IRMAA calculations to the existing engines. RMDs precede conversions; amounts exceeding the remaining source balance are rejected. A candidate must fully fund spending, taxes and RMDs through the horizon. Same-year withdrawals from the conversion destination are conservatively rejected. Requests are never silently reduced. Existing withdrawal order determines funding, potentially including additional traditional IRA withdrawals. This is not a cash-only tax-payment policy.

Existing IRA eligibility restrictions remain: a contributing year with conversions is unsupported and rejected by the eligibility engine. Deleted accounts, inactive owners, ownership mismatches and unsupported source types are rejected. No employer-plan conversions in this UI batch.

Comparison runs the identical input with and without the proposed schedule. It reports taxes, RMDs, enabled IRMAA, and ending assets before liquidation taxes. These are nominal undiscounted horizon totals, not after-tax wealth or a recommended strategy. Later Medicare effects beyond the horizon are excluded. Existing CSV/PDF exports describe the selected projection, not the comparison table.

Rules reference: https://www.irs.gov/publications/p590a (RMD amounts cannot be converted; basis is excluded from taxable conversion income). No tax formulas or tables changed in this batch.

Validation includes input boundaries, decimal preservation, inactive drafts, exact schedule mapping, unchanged baseline, basis effects, RMD capacity, funding rejection and two-year IRMAA linkage. Browser checks cover the explicit scenario and responsive containment; not a real-device certification.
