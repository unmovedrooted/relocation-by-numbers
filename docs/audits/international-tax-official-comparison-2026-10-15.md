# International tax models against official calculators and published examples

Date: 2026-10-15. Tests: `src/lib/officialTaxExamples.audit.test.ts`. Each comparison uses a figure the tax authority published or computed, not the site's own formulas.

| Country | Official source | Result |
|---|---|---|
| Germany | Federal Ministry of Finance income tax calculator (tax year 2026): single 40,000 = 7,209; single 300,000 = 115,529 with surcharge 6,354.09; married 150,000 = 40,728 with surcharge 3.33 | Exact match |
| New Zealand | Inland Revenue April 2026 PAYE tables, four-weekly pay 1,000 / 2,000 / 8,000 including the ACC levy | Match to the cent |
| Singapore | IRAS sample calculations (resident chargeable income 234,100 = 27,629; non-resident employee on 21,000 = 3,150) | Match |
| Ireland | Revenue worked example, single PAYE employee on 50,000: income tax 7,200, USC 1,032.82; employee PRSI 4.35% from 1 October 2026 | Match |
| South Africa | SARS 2026/27 rates table less the 17,820 primary rebate, seven incomes from 150,000 to 2,000,000 | Match |
| Canada (Ontario) | CRA Payroll Deductions Online Calculator, $100,000 paid monthly: federal 1,111.23, Ontario 561.66, CPP 478.48, EI 135.83 a month | Within 0.5% on federal and Ontario tax; CPP, CPP2 and EI maximums match |

## Notes
- The CRA calculator projects one pay period over the year for withholding, so it will not equal an annual return. The site computes annual tax; the gap is under 0.5% here and is disclosed as an estimate.
- Not compared to an official calculator: the other country modules (for example Australia, whose ATO calculator was unreachable, Switzerland, France, the UK, Japan, Spain, Portugal, Mexico). They are built from the official tables cited in each module and remain labelled as estimates.
