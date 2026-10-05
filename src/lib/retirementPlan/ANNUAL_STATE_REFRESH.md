# Annual state tax refresh

How to refresh the restricted state modules (`<state>Tax.ts`) each year. Written 2026-10-04 after the first full
verification pass; the 2026 passes are the worked example. Nothing here is automated: every figure is checked by
reading a primary source.

## When to run it

| Pass | Timing | Why |
| --- | --- | --- |
| 1 | Mid-November, after the November election | Ballot measures resolve, and most "next year" agency notices are out (Rhode Island advisory, Washington deduction, Kansas rate notice, Arkansas December tables). |
| 2 | Mid-January | Booklets and withholding formulas for the new year (California, Vermont, Maine, Nebraska, Utah, Idaho, Montana). |
| 3 | After each state's session ends (roughly April to June) | Session laws take effect for the current or next tax year. This is where Georgia HB 463, Arkansas Act 1, North Carolina S.B. 257, Washington ESSB 6346 and Rhode Island Article 6 were found. |

## Method rules (learned the hard way)

1. **Primary sources only.** Enacted bill text or session law, the agency's own notice, advisory, booklet or
   withholding formula, or the state code. Law-firm summaries and aggregators are leads, not evidence. Wrong
   leads in 2026: an Alabama "standard deduction bill" that was a 2022 act and a 2026 property-financing bill
   with the same number; Connecticut HB 5444 "enacted" (it was tabled); Maryland HB 411 and HB 707 "signed"
   (they never left committee); an Iowa "3.5% for 2027" with no statute behind it; an Indiana rate table that
   was off by a year.
2. **Check enactment, not the bill.** Open the bill's action history. A fiscal note or committee analysis is not
   a signature.
3. **Reproduce last year first.** Before trusting an indexing formula or a table's structure, show it reproduces
   the already-published prior-year figure (Idaho's CPI formula, Vermont's withholding table). Only then apply
   it to the new year, and label the result "statute-derived, replace when the agency publishes."
4. **Do not inflate by guess.** If the agency has not published and no statute formula reproduces the prior year,
   hold the old figure, say so in the module, and list it in `stateDataVintage.ts`.
5. **Scheduled law is modeled, contingent law is not.** Unconditional schedules and sunsets are applied as
   enacted (Mississippi, North Carolina, Virginia's 2030 sunset). Revenue-triggered cuts, ballot measures and
   proposals are disclosed, never assumed.
6. **Disclose what is not modeled** in the module header, the `warning` string, and the consent text in
   `RetirementPlanPreview.tsx`. All three must agree.
7. **Read the whole table when a state has two.** Arkansas's upper table above $94,700 sat unnoticed beside a
   correct graduated schedule.

## Why the second look matters: errors found on 2026-10-04

Modules that were already marked "verified" had real errors, each found only by reading the enacted text or the
agency's own worksheet instead of a summary:

| State | Error | Found in |
| --- | --- | --- |
| Ohio | Omitted the $332 base in the 2026 rate (tax is $332 plus 2.75% over $26,050); kept the 2025 exemption cutoff of $749,999 instead of $500,000 | R.C. 5747.02; LSC final analysis of HB 96 |
| Rhode Island | Phase-out modeled as 25% steps; the Division's worksheet uses 20% steps (0.8 / 0.6 / 0.4 / 0.2) | 2025 Tax Rate and Worksheets |
| Colorado | Treated the pension subtraction as independent of Social Security; Colorado reduces it by the owner's Social Security subtraction | Income Tax Topics guide; DR 0104 line 4 |
| Michigan | 2026 personal exemption $5,600 instead of $5,900 | Treasury's 2026 withholding guide |
| Arkansas | Taxed income above $94,700 on the graduated schedule instead of the upper table | Act 1 of 2026S1 |
| Wisconsin | Held stale 2025 deduction and bracket amounts | Department of Revenue 2026 published schedule |
| Pennsylvania | Started from federal AGI: missed that PA taxes 401(k)/403(b)/457(b) deferrals and disallows the IRA deduction and the federal net capital loss deduction | PA Personal Income Tax Guide, "Gross Compensation" and "Net Gains" |
| New Jersey | Started from federal AGI: missed that NJ disallows the IRA contribution deduction and the net capital loss deduction (401(k) deferrals are properly excluded) | 2025 NJ-1040 instructions, Worksheet C and the loss-category rule |
| Minnesota | Used the statute's 2023 age-65/blind additional deduction ($1,850/$1,450) instead of 2026's $2,000/$1,600, and omitted the standard deduction limitation (reduced above $244,400 federal AGI, 80% above $1,107,750) | Tax Year 2026 Inflation-Adjusted Amounts; Minn. Stat. 290.0123 subd. 2, 5, 6 |
| Maryland | No personal exemptions at all: missed the $3,200 per taxpayer and spouse (stepped down above $100,000 single / $150,000 joint federal AGI), the $1,000 age/blind exemption, and the $1,200 two-income married subtraction | 2025 Resident Tax Booklet, Instruction 10 chart 10A and Worksheet 13D |
| Virginia | No personal exemptions ($930 each, $800 more for age 65/blind); married age deduction reduced each spouse separately instead of sharing one limit; treated anyone born in 1939 as grandfathered; used year-end age instead of the January 1 cutoff | 2025 Form 760 instructions, line 12 and the Age 65 and Older Deduction Worksheet |
| Indiana | Applied the $16,000 civil service annuity deduction to every pension; Indiana allows it only for a nonmilitary federal civil service annuity, so it now needs the federal-government pension type | Department of Revenue, Deductions |
| South Carolina | Omitted the 44% net capital gain deduction (S.C. Code 12-6-1150, unchanged by Act 110) | 2025 SC1040 instructions |
| Mississippi | Omitted the additional $1,500 exemption for each taxpayer or spouse 65 or older and each who is blind | 2025 Resident Return instructions, lines 8-12 |
| Kansas, Louisiana | Treated New York government pensions as exempt state systems; both states exempt only federal plans and their own named systems | Kansas 2025 booklet Schedule S line A14; Louisiana R-1306 and IT-540 instructions (codes 02E-06E) |
| Wisconsin | Omitted the 30% exclusion of net capital gain from assets held over one year | 2025 Schedule WD instructions |
| Missouri | Omitted the 100% capital gains subtraction (RSMo 143.121, effective for tax years from 2025), which also lowers the AGI that tests the private pension deduction | MO-A line 18; Department of Revenue year-changes page and FAQ |

Lesson: a module header that says "corroborated by secondary sources" or "inferred" is a to-do, not a finding. Search the
modules for those phrases (`widely`, `secondary`, `not independently`, `inferred`, `assumed`) at the start of every refresh and
resolve each against a primary document. All such caveats present on 2026-10-04 were resolved except Maryland's 2026
joint standard deduction ($6,800, exactly twice the confirmed single figure).

Federal-AGI starting points deserve a check in every state: a state that does not follow a federal adjustment (401(k) deferrals, IRA deduction, capital loss deduction) needs an add-back, as Pennsylvania and New Jersey do. Not yet checked for the remaining states.

Capital-gain preferences: most modules ignored them. Modeled now: Massachusetts, Vermont, Montana, New Mexico, North Dakota, Hawaii, Missouri (100% subtraction), South Carolina (44%) and Wisconsin (30%). Disclosed but not modeled: Arizona (25% of long-term gains on assets acquired after 2011, needs acquisition dates) and Arkansas (50% of net capital gain, and 100% above $10 million; Ark. Code 26-51-815 as summarized by a 2018 legislative task force, so confirm the 2026 text on the AR1000D before modeling). A planner with per-lot acquisition dates could add Arizona.

Likewise check every module for personal exemptions and for each age rule's exact cutoff date: Maryland and Virginia had no exemptions at all. A keyword scan of the modules on 2026-10-04 plus spot checks (Arkansas, Delaware, Kentucky, Montana, New York, South Carolina) found no other module missing an exemption it should model, but amounts in the other modules were not re-derived.

Modules with no caveat were not re-derived line by line on 2026-10-04. A line-by-line re-read of the highest-population
states (California, New York, Pennsylvania, Illinois, Georgia, North Carolina,
Michigan) is the best use of spare time in the next refresh.

## City income taxes

Ohio (Columbus, Cleveland, Cincinnati), Michigan (Detroit, Grand Rapids) and Alabama (Birmingham) are modeled in
`cityIncomeTax.ts` when the optional city is selected; rates are held for later years. At each refresh check each city's own
page for a rate change, and Michigan Treasury's Form 5123 for Detroit. Not modeled: other cities, Ohio school district
income taxes, and credits for tax paid to a work city.

## Per-state steps

For every state, in this order:

1. Agency "legislative changes" or "tax law changes" page for the year (and the session law if there is no page).
2. Rates and brackets, including any phase-out or recapture table above the top bracket.
3. Standard deduction, exemptions, additional age or blind amounts.
4. Retirement rules: Social Security, pensions, IRA and 401(k), military, age tests, caps, phase-outs.
5. Federal-linked items now set by state law: senior deduction, tips, overtime, conformity date, SALT cap.
6. Anything indexed by statute: confirm whether the agency has published the new amount.
7. Update the module header with the source and the date checked, the tests, the warning, and the consent copy.

## Known 2027 changes (already encoded, confirm still law)

Indiana 2.90%; Mississippi 3.75%; North Carolina 3.49% (2027-2029); Montana and Nebraska 2027 schedules;
Georgia retirement exclusion $70,000 for 65 and older; Virginia standard deduction $9,200/$18,400 (then
$9,300/$18,600 for 2028-2029, then $3,000/$6,000 from 2030); Rhode Island surtax 1% (2% in 2028, 3% from 2029)
and the Social Security age requirement removed; Washington income tax from 2028; Oregon SHS ends after 2030.

## Indexed amounts to replace when published

| State | Amount | Publisher and usual timing |
| --- | --- | --- |
| California | brackets, standard deduction, credits, phase-out | Franchise Tax Board, with the 2026 booklet (about December) |
| Rhode Island | Social Security and pension income limits (published a year behind), surtax threshold from 2028 | Division of Taxation advisory (early November) |
| Vermont | age 65 or blind additional deduction; confirm the derived standard deduction, exemption and brackets | Department of Taxes, IN-111 booklet (December) |
| Washington | capital gains standard deduction ($278,000 held from 2025) | Department of Revenue, announced by October 31 |
| Maine | pension phaseout start (derived), other indexed amounts | Maine Revenue Services (1040ES-ME and the pension worksheet) |
| Idaho, Montana, Utah | statute-derived 2026 values | State Tax Commission, DOR, Tax Commission booklets |
| Arkansas | tables indexed by a capped CPI factor | DFA director, by December 15 |
| Arizona | standard deduction (see below) | Department of Revenue, 2026 booklet |

## Watch list

- **November 3, 2026 ballot:** Washington Initiative 645 (repeals the 9.9% tax; revert that module if it passes),
  Colorado Initiatives 195 and 232, Missouri HJR 173/174, Iowa SJR 11.
- **Contingent cuts:** Kansas SB 269 (look for the notice about the following tax year each autumn), Indiana from
  2030, North Carolina's revenue triggers, Oklahoma HB 2764 triggers, Georgia HB 463 step-downs, Mississippi from
  2031.
- **Proposed, not enacted:** Delaware HS 1/HS 2 for HB 13 (new 6.75%/6.85%/6.95% brackets above $125,000, slightly lower middle rates, taxable years after 2025); the Division of Revenue still prints the old schedule for 2026.
- **Unresolved, disclosed:**
  - DC conformity: whether the standard deduction is the federal figure or the decoupled TCJA figure, and
    whether the $6,000 senior deduction applies. Status after the Congress disapproval, the expired temporary
    act and the FY2027 Budget Support Act.
  - Arizona's 2026 standard deduction: $16,100 or $15,750 (under $10 of tax).
  - Minnesota's 1% tax on net investment income over $1,000,000 (not modeled).
  - Arizona HB 4168 chaptered text (two summaries and the House-engrossed text agree).

## Verification pipeline (run before every commit)

```
npx tsc --noEmit
npx vitest run
npx eslint src/lib/retirementPlan src/components/RetirementPlanPreview.tsx
```

Then start the dev server, open `/complete-retirement-plan`, select each changed state and confirm its consent
text renders the new wording, check the console for app errors, and confirm `/blog` returns 404. When the CSV
export changes, click the real CSV button and reconcile the file with the on-screen table.

## Modules and last review

The "last reviewed" column is parsed from each module header; `see header` means the date is written another way.

| State | Module | Last reviewed |
| --- | --- | --- |
| alabama | `alabamaTax.ts` | 2026-10-04 |
| arizona | `arizonaTax.ts` | 2026-10-04 |
| arkansas | `arkansasTax.ts` | 2026-10-04 |
| california | `californiaTax.ts` | 2026-09-24 |
| colorado | `coloradoTax.ts` | 2026-09-23 |
| connecticut | `connecticutTax.ts` | 2026-10-04 |
| dc | `dcTax.ts` | 2026-10-04 |
| delaware | `delawareTax.ts` | 2026-09-25 |
| georgia | `georgiaTax.ts` | see header |
| hawaii | `hawaiiTax.ts` | see header |
| idaho | `idahoTax.ts` | 2026-10-04 |
| illinois | `illinoisTax.ts` | 2026-09-23 |
| indiana | `indianaTax.ts` | 2026-10-04 |
| iowa | `iowaTax.ts` | 2026-09-25 |
| kansas | `kansasTax.ts` | 2026-10-04 |
| kentucky | `kentuckyTax.ts` | see header |
| louisiana | `louisianaTax.ts` | see header |
| maine | `maineTax.ts` | see header |
| maryland | `marylandTax.ts` | 2026-09-10 |
| massachusetts | `massachusettsTax.ts` | 2026-09-24 |
| michigan | `michiganTax.ts` | see header |
| minnesota | `minnesotaTax.ts` | 2026-10-04 |
| mississippi | `mississippiTax.ts` | 2026-09-25 |
| missouri | `missouriTax.ts` | 2026-09-25 |
| montana | `montanaTax.ts` | 2026-09-24 |
| nebraska | `nebraskaTax.ts` | see header |
| newJersey | `newJerseyTax.ts` | 2026-09-23 |
| newMexico | `newMexicoTax.ts` | 2026-09-23 |
| newYork | `newYorkTax.ts` | 2026-09-09 |
| northCarolina | `northCarolinaTax.ts` | 2026-10-04 |
| northDakota | `northDakotaTax.ts` | see header |
| ohio | `ohioTax.ts` | 2026-09-24 |
| oklahoma | `oklahomaTax.ts` | see header |
| oregon | `oregonTax.ts` | see header |
| pennsylvania | `pennsylvaniaTax.ts` | 2026-09-23 |
| rhodeIsland | `rhodeIslandTax.ts` | 2026-10-04 |
| southCarolina | `southCarolinaTax.ts` | 2026-09-24 |
| utah | `utahTax.ts` | 2026-09-23 |
| vermont | `vermontTax.ts` | 2026-10-04 |
| virginia | `virginiaTax.ts` | 2026-10-04 |
| washington | `washingtonTax.ts` | 2026-10-04 |
| westVirginia | `westVirginiaTax.ts` | see header |
| wisconsin | `wisconsinTax.ts` | see header |
