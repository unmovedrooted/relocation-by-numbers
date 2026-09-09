# State Social Security coverage

Reviewed 2026-09-08. Base tax year 2026. This is an isolated benefits-inclusion
layer, NOT a complete state return, tax amount, or live planner integration.
Existing locationSocialSecurityBase behavior is unchanged.

## Classification

All 50 state codes are explicitly enumerated in stateSocialSecurityCoverage.ts.
The [official nationwide review](https://www.cga.ct.gov/2026/rpt/pdf/2026-R-0106.pdf)
identifies eight states that do not unconditionally exempt benefits: CO, CT, MN,
MT, NM, RI, UT, VT. The other 42 are classified exempt for benefits only.
This does not assert that other retirement income is exempt, nor that every
state starts its tax return with federal AGI. City treatment remains separate.

## Executable rules and integration limits

| Coverage | Calculation | Limits |
| --- | --- | --- |
| 42 exempt states | Included benefits = 0 | No general state-tax calculation |
| Montana | Included benefits = federal taxable benefits | Other deductions/credits not modeled |
| Connecticut | Below filing-specific AGI threshold: 0. Otherwise lesser of federal inclusion and 25% of the lesser of gross benefits and federal worksheet line 10 | Caller must supply actual worksheet line 10, not guess it from AGI |
| Colorado | Allocate federal inclusion by each owner's gross benefits; apply each age/AGI exemption or $20,000 cap | Single/joint only; under-55 positive benefits explicitly unsupported; pension subtraction must be reduced by SS subtraction when integrated |
| Minnesota | Greater of simplified and alternative subtraction | Requires actual alternative-method provisional income; 2026 simplified thresholds, statutory step phaseout; alternate parameters are not indexed |
| New Mexico | Full exemption at or below filing-specific AGI cap; none above | Equality follows enacted HB163, not abbreviated agency prose |
| Rhode Island | Unsupported numeric result | 2026 SS limits not verified; the 2026 inflation advisory explicitly labels its SS table tax year 2025. Owner full-retirement-age handling also remains to implement |
| Utah | Separate nonrefundable credit; benefits remain included | Explicit eligible state benefits, statutory MAGI adjustments, remaining liability and competing-credit election required. No carryover. 2026 rate 4.45% |
| Vermont | Linear $10,000 phaseout, starting at $70,000 joint/$55,000 others | Explicit election required; does not optimize against other retirement exclusions |

Sources for executable conditional rules:

- [CT 2026 withholding worksheet, page 12](https://portal.ct.gov/-/media/drs/publications/pubsip/2026/ip-2026-7.pdf)
- [CO revenue guidance, January 2025](https://tax.colorado.gov/sites/tax/files/documents/ITT_Social_Security_Pensions_and_Annuities_Jan_2025.pdf)
- [CO 2026 proposed expansion, lost; not implemented](https://leg.colorado.gov/bills/HB26-1062)
- [Minnesota 2026 amounts](https://www.revenue.state.mn.us/sites/default/files/2025-12/inflation-adjusted-amounts-2026.pdf) and [statutory methods](https://www.revisor.mn.gov/statutes/cite/290.0132#stat.290.0132.26)
- [New Mexico enacted HB163, section 7](https://www.nmlegis.gov/Sessions/22%20Regular/final/HB0163.pdf)
- [Vermont section 5830e](https://legislature.vermont.gov/statutes/section/32/151/05830e)
- [Utah credit statute effective 2026](https://le.utah.gov/xcode/Title59/Chapter10/C59-10-S1042_2026010120250507.pdf) and [2026 rate](https://le.utah.gov/xcode/title59/chapter10/C59-10-S104_2026050620260506.pdf)
- [Rhode Island advisory: distinguish table years](https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-11/ADV_2025_22_Inflation_Adjustments.pdf)

Utah's 2026 statutory MAGI is AGI plus excluded interest and required additions;
the 2025 webinar's state-income worksheet must not be reused indiscriminately.
The Utah result has status `supported-credit`; consumers must apply allowedCredit
separately, never reinterpret it as an income subtraction. Callers supply remaining
liability after applicable other credits and explicitly identify a competing
retirement credit. Vermont's other-retirement election returns no SS exclusion;
the other exclusion belongs in the separate complete state return calculation.

Future use requires explicit hold-2026-law. This is a frozen-law scenario,
not an assertion that every state threshold is legally unindexed. Automatic
state threshold escalation is not implemented. No federal threshold changed.

## Before live integration

1. Verify published Rhode Island 2026 SS limits and implement its owner-age rule.
   Do not enable Rhode Island based on the stale 2025 limits.
2. Derive CT's federal worksheet value from the federal engine with parity tests.
3. Supply owner-level CO benefits and retirement-income interactions.
4. Model the full state base, deductions and credits separately from benefit
   inclusion. Do not pass benefit inclusion off as total taxable income.
5. Audit local tax rules separately before adding state/city dropdowns.
6. Test year-by-year retirement settlement, conversions, SS, and state taxes
   together. A classified state is not automatically a supported state return.
