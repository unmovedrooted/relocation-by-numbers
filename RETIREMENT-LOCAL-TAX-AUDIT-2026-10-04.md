# Retirement planner: local-tax coverage audit

Reviewed October 4, 2026 against commit `0c8609a`. This batch changes disclosures, not calculations. Existing unrelated untracked files were left alone.

## Live Oregon verification

Production `/complete-retirement-plan` loaded successfully. Using its fictional default scenario, selected Oregon, accepted the planning assumptions, and ran the projection. The current 2026 deduction ($2,910/$5,820), credit ($263), and January 1 age cutoff were visible. The 2026 row showed $16,639 total tax and $578,362 ending assets; 2060 showed $244,984 ending assets. No captured console warnings/errors. This is a deployment smoke check, not independent verification of every projected year or an exhaustive network audit.

For the first year, the existing federal model gives $6,570 regular federal tax plus $5,355 payroll tax. Oregon taxable income is $70,000 - $6,570 - $2,910 = $60,520. Independent bracket arithmetic is $4,550 × 4.75% + $6,850 × 6.75% + $49,120 × 8.75% - $263 = $4,713.50. Combined tax is $16,638.50, displayed as $16,639, matching production. No local-tax liability is included in this reconciliation.

## Confirmed implementation gaps

`oregonTax.ts`, `ohioTax.ts`, and `michiganTax.ts` each return `localTax: 0`. `householdTax.ts` includes those zeros in annual settlement. The UI offers city selection only for NY, MD, IN and PA. Location validation does not establish exemption from these omitted levies. Affected scenarios can understate taxes and overstate funded spending/ending wealth; this can also affect conversion comparisons.

| State | Omitted coverage | Required contract before implementation |
| --- | --- | --- |
| Oregon | Metro Supportive Housing Services, Multnomah County Preschool for All, Portland Arts Education Tax | Separate jurisdiction membership, tax year, filing status and tax-base adjustments. City name alone cannot establish Metro or county boundaries. Treat each levy separately, including taxable retirement/conversion/investment income where applicable. |
| Ohio | Municipal and school-district taxes | Separate residence/work municipality and school district; district tax-base type, rates by year, exemptions/credits and work-tax credits. Traditional-base school districts can include retirement/investment income, whereas earned-income-base districts exclude these categories. |
| Michigan | City income taxes | Specific city, resident versus nonresident status, income sourcing and credits; separate normal pension/annuity income from early distributions. Resident investment income must not be treated as universally exempt. |

Severity: **High for affected households**, not evidence every scenario owes additional tax. Zero is an omission, not a verified tax exemption.

## Official sources checked

- [Portland personal taxes](https://www.portland.gov/revenue/personal-tax): separate SHS/PFA jurisdictions and filing rules.
- [Portland Arts Education Tax](https://www.portland.gov/revenue/arts-tax): 2026 restructuring; do not reuse the older $35 per-person model. Current guidance uses filing-status amounts and Oregon taxable-income thresholds with exempt-income adjustments, and future indexing. Boundary language should be reconciled with ordinance before implementation.
- [Ohio school-district tax Q&A](https://dam.assets.ohio.gov/image/upload/tax.ohio.gov/tax_analysis/tax_data_series/school_district_data/SDIT_QA.pdf): traditional versus earned-income bases and district credits.
- [Ohio official Finder](https://thefinder.tax.ohio.gov/): jurisdiction lookup required; no personal address was submitted in this audit.
- [Michigan city-tax coverage](https://www.michigan.gov/taxes/citytax/what-cities-impose-an-income-tax).
- [Detroit return instructions](https://www.michigan.gov/documents/taxes/5313_City_Book_674757_7.pdf): resident investment-income treatment, pension/annuity and Social Security exclusions, and early-distribution distinction. This is an older instruction reference, not verification of every city's 2026 return.
- [2026 Detroit withholding guidance](https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/City-Withholding/TY2026/5469_ty2026.pdf): residence/work distinctions; withholding guidance is not a complete return model.

## Disclosure corrections in this batch

- Michigan consent and methodology: 4.25%, matching the engine, rather than 3.99%.
- North Dakota: published 2026 ND-1ES parameters, held fixed in later years, rather than 2025 brackets.
- Utah: general Taxpayer Tax Credit is implemented before the Social Security credit; separate retirement credit remains unsupported.
- Nebraska: draft 2026/2027 schedules and exemption credits; retain the disclosed unverified 2026 age/blind addition.
- Oklahoma: enacted 2026 0%/2.5%/3.5%/4.5% schedule rather than superseded rates.
- Visible OR/OH/MI location notices identify local-tax omissions and explain why zero is not exemption.
- Removed an incorrect source comment characterizing all Ohio/Michigan local taxes as earned-income-only.

This is a targeted reconciliation of confirmed stale statements, not certification of all state methodology text or historical project documents. No rates, formulas, defaults, location support, or acceptance gates changed.

## Proposed next implementation batch (approval needed)

1. Choose a narrow local jurisdiction contract rather than enabling generic city-based taxes for an entire state. Oregon SHS/PFA is a useful first candidate because conversion income can affect the result.
2. Decide whether unsupported local jurisdictions should block ranking/projection instead of remaining a disclosed omission. This changes existing behavior and is not silently applied here.
3. Verify current statutory bases, exact boundary comparisons, scheduled changes, exemptions and credits. Do not derive these from shared wage-tax helpers without checking their contracts.
4. Add explicit jurisdiction inputs without collecting/storing a street address; allow users to confirm official lookup results. Unknown membership must not silently become zero tax.
5. Add independent tests: thresholds and one-cent boundaries, wages versus pensions/SS/IRA conversions/gains, single/joint, jurisdiction overlap, annual settlement, strategy ranking, and future-year policy.
6. Integrate one jurisdiction, then validate UI, exports and disclosure consistency before expanding.

No new local-tax formulas were implemented in this audit.
