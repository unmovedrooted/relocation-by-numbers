# Eight-country official-rule validation — October 15, 2026

## Resolution (same day)

All seven discrepancies were confirmed and corrected in the production modules; the seven expected-failure tests now pass as ordinary tests. The France CET and Portugal Article 68-A rules were re-read at the official pages (Agirc-Arrco and the Portuguese Finance Portal) before changing the code.

- Japan: new `japanPensionIncome` (NTA No. 1600 table); the deduction is the pension less that income; the retired scenario uses the income.
- France: CSG and CRDS base includes pay above four ceilings in full; CET applies only when pay exceeds the first ceiling.
- Portugal: the joint solidarity surcharge is calculated on half the taxable income and doubled.
- Spain: Madrid regional personal minimum is 5,956.65 (national minimum stays 5,550). Other communities still use 5,550 until their published minimums are added.
- Switzerland: taxable income truncated to CHF 100 and tax to CHF 0.05, as Form 58c. The flat 13% cantonal estimate is unchanged and unvalidated.
- Australia: Medicare levy low-income reduction for a single non-senior: none up to 28,011, then 10% of the excess. That figure comes from the 2026 withholding schedules instrument, not the ATO annual page (403 to our tools), so it must be confirmed there. Senior and family thresholds are not modelled.

## Verdict and scope (as found, before the fixes)

Not fully validated for production accuracy. Seven targeted checks reproduce discrepancies across Australia, Switzerland, France, Japan, Portugal and Spain. UK ordinary employee scenarios and Mexico's annual ISR tariff match the selected official rules. That does not certify all inputs, regimes, payroll deductions or final tax returns.

This is an **official-rule/source comparison**, not eight completed government calculator browser sessions. No such sessions were run in this batch. Tests execute production functions with independent reference figures. The audit itself changed no production code; the corrections listed under Resolution were made afterwards (commit aabbc8b).

Initial tracked tree was clean. Existing untracked .claude/, INDEXING-QUEUE.md, STATE-WAGE-RULES-DRAFT.md and STEP2-INVENTORY.md were left alone.

## Reproducible scope

Inputs are annual LOCAL currency, not USD converted to each country. Default profile: single, resident, no dependants, ordinary income, no special regime. Exceptions below explicitly identify taxable income instead of gross wages and married filing. US citizenship/tax overlay is disabled. These are component checks; no universal net-pay certification is implied.

| Country / year | Input amounts | Output compared | Official-reference expected values | Actual values |
|---|---|---|---|---|
| Australia 2026–27, AUD taxable income | 50k / 100k / 150k / 250k | Resident tax after LITO + ordinary 2% levy, no surcharge or other deductions | 6,270 / 22,520 / 39,570 / 83,370 | Match |
| UK 2026–27, GBP gross wages | 50k / 100k / 150k / 250k | England/Wales/NI income tax + annualized employee NI, below pension age | 10,480.40 / 31,442.60 / 58,713.60 / 105,713.60 | Match |
| Switzerland 2026, CHF taxable income | 50k / 100k / 200k / 250k | Single federal tax ONLY | 400.80 / 2,684.35 / 12,903.35 / 19,503.35 | 400.84 / 2,684.44 / 12,903.44 / 19,503.44 |
| France 2026 return on 2025 income, EUR taxable income per part | 50k / 100k / 150k / 250k | National scale before credits/other taxes, not gross-to-net | 8,103.99 / 24,800.52 / 45,300.52 / 89,023.84 | Match before final euro rounding |
| Japan NTA published employment-income table, JPY wages | 3m / 5m / 8m / 12m | Income AFTER employment-income deduction | 2.02m / 3.56m / 6.1m / 10.05m | Match; NOT full 2026 tax validation |
| Portugal 2026 mainland, EUR taxable income | 10k / 20k / 50k / 100k | Article 68 scale before solidarity/credits | 1,303.056 / 3,343.469 / 13,858.283 / 36,612.727 | Match unrounded marginal-scale calculation |
| Mexico 2026, MXN annual taxable income | 100k / 500k / 1m / 2m | SAT annual ISR tariff, no IMSS/subsidy/exempt benefits | 6,572.163344 / 85,773.863904 / 224,833.025 / 545,243.1168 | Match unrounded |
| Spain, Madrid ordinary employee, EUR gross 50k | Local, single, under65, no children | Regional personal minimum within otherwise unchanged model | 13,809.7874 combined modeled tax/contributions | 13,844.35265; +34.56525 |

Switzerland's normal tests allow 10 cents explicitly: reconstructed continuous brackets are not exact Form 58c amounts. Spain's expected value isolates the personal-minimum correction; it is not an independently certified full payslip amount.

## Confirmed discrepancies, ordered by impact

### High — Japan pension income mistaken for deduction

`src/lib/countryTaxRules/japan.ts:41–46`, consumed at line 81. NTA's age65+ example for a JPY 3,500,000 public pension gives taxable pension income of 3,500,000 × 75% − 275,000 = 2,350,000. The deduction is therefore 1,150,000. The helper instead returns 2,350,000 as the deduction, leaving only 1,150,000 as income. The middle pension bands have the same inversion. This also creates discontinuities at the transitions. Recommended correction: distinguish pension income from pension deduction and test every boundary. Eligibility for this public-pension treatment must also be established; not every foreign retirement withdrawal qualifies.

### High — France CSG/CRDS stops above four ceilings

`src/lib/countryTaxRules/france.ts:54–57`. The 1.75% base reduction stops at four ceilings; the contribution itself does not stop. Above EUR 192,240, the excess must enter the base at 100%. At gross EUR 250,000, modeled contributions are 44,542.8666 versus 50,145.5866 after this isolated correction: **5,602.72 understated**. Deductible CSG also changes, so the overall net-pay difference is not simply this contribution delta. Recommended correction: include the excess in both CSG calculations and test the cap boundary. Final income tax still requires consistent year selection and omitted high-income-tax treatment.

### High — Portugal joint solidarity surcharge ignores the quotient

`src/lib/countryTaxRules/portugal.ts:42`. Article 68-A(3) applies the surcharge to half of joint taxable income and doubles the result. With EUR 150,000 gross local wages and 11% contributions, taxable income is 133,500; each half is 66,750, below 80,000. Correct surcharge: zero. Actual surcharge: **1,337.50**. Holding all other assumptions fixed, income tax is 43,995.066 instead of 42,657.566. Recommended correction: apply the joint quotient to this surcharge, not only the ordinary scale.

### Medium — Australia low-income levy overstatement

`src/lib/countryTaxRules/australia.ts:49`. At AUD 20,000 taxable income, the ordinary single low-income exemption gives no Medicare levy. Actual model: **AUD 400**. This is disclosed in the model's limitations but remains an inaccurate result for eligible low-income taxpayers. Recommended correction needs household/senior/exemption rules or a clearly bounded supported profile; do not simply apply one threshold to everyone. Other offsets, deductions and surcharge eligibility are outside the four passing component cases.

### Medium — Spain Madrid minimum

`src/lib/internationalTaxes.ts:360,546–548`. The same EUR 5,550 minimum is used for both national and Madrid regional relief. Madrid publishes EUR 5,956.65. At EUR 50,000 gross, this overstates the regional tax by (5,956.65 − 5,550) × 8.5% = **34.56525**. Recommended correction: separate national and autonomous-community minimums. The old low-income work reduction, pension-age assumption, foral approximations and solidarity contributions above the maximum base require further review; they are not validated by this test.

### Medium — France CET charged below threshold

`src/lib/countryTaxRules/france.ts:42`. CET is due only if remuneration exceeds tranche 1. At gross EUR 40,000, employee contributions excluding CSG/CRDS should be 4,524 under the selected non-cadre component assumptions; actual 4,580: **56 overcharged**. Recommended correction: condition CET on exceeding the ceiling, preserving the whole-base treatment when applicable.

### Low — Switzerland statutory rounding absent

`src/lib/countryTaxRules/switzerland.ts:35–45`. Form 58c discards taxable-income fractions below CHF100 and rounds tax down to CHF0.05. At taxable CHF50,099, official table treatment is CHF400.80; actual CHF403.4536. The reconstructed band intercepts also leave 0.04–0.09 differences at sampled round amounts. Recommended correction: implement the actual table and rounding; test transitions, including the high-income proportional-rate transition. The much larger limitation remains the assumed flat 13% cantonal/municipal tax, which cannot be officially validated for Switzerland as a whole.

## Remaining validation limits

- France explicitly combines the 2026 return's 2025-income scale with 2026 payroll ceilings. Choose one coherent year contract before claiming annual gross-to-net accuracy. Pension contribution rates, household parts and high-income levies need separate scenarios.
- Switzerland requires canton, municipality and relevant deductions for a genuine official total-tax comparison. A 13% benchmark is not a statutory canton model.
- Japan's 2026 basic-deduction reforms, minimum employment deduction, national rounding, local tax timing and actual social-insurance contribution bands remain unverified here. Its published English employment table matching does not resolve newer reform applicability. The pension finding above does not depend on those unresolved parameters.
- UK tests exclude Scotland, student loans, marriage allowance and pensions. Annualized NI can differ from per-pay-period payroll rounding. No HMRC calculator UI session was executed.
- Mexico's annual ISR table matches; IMSS salary integration/UMA dates, employment subsidy, pension-source exemptions and treaty effects have not been certified.
- Portugal minimum-existence relief, specific deduction eligibility, credits, IFICI and foreign-employer contribution coverage remain separate work.
- Spain's full regional scales, special regimes, low-income relief and payroll totals need dedicated official comparisons. The Madrid test isolates one confirmed discrepancy only.
- “Remote employer abroad” does not by itself prove exemption from local social insurance in any country. This shared assumption needs coverage/treaty inputs or narrower supported scenarios.
- No official FX-rate comparison, live UI output audit or full country-by-country final-return simulation was performed.

## Sources checked

1. Australia enacted 2026–27 scale: https://www.ato.gov.au/law/view/pdf/acts/20250028.pdf ; low-income levy context: https://www.legislation.gov.au/F2026L00716/asmade/2026-06-12/text/original/epub/OEBPS/document_1/document_1.html . The ATO resident landing page returned HTTP403; this is not a successful ATO calculator run.
2. UK income tax and NI: https://www.gov.uk/income-tax-rates ; https://www.gov.uk/national-insurance-rates-letters .
3. Switzerland Form58c 2026: https://www.ur.ch/_docn/439286/Berechnung_dBSt_der_nat%C3%BCrlichen_Personen_2026.pdf .
4. France scale: https://www.legifrance.gouv.fr/eli/loi/2026/2/19/2026-103/jo/article_4 ; CSG: https://www.urssaf.fr/accueil/employeur/cotisations/liste-cotisations/csg-crds.html ; CET: https://reglementation.agirc-arrco.fr/home/baremes/listes-area/baremes-1/cotisations-au-regime-agirc-arrco-en-2026.html .
5. Japan employment table: https://www.nta.go.jp/english/taxes/individual/12012.htm ; public pension worked example: https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1600.htm .
6. Portugal Articles68 and68-A: https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx ; https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68a.aspx .
7. Mexico annual 2026 tariff, section C.II, PDF pages18–19: https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo-8-RMF-2026_DOF-28122025.pdf .
8. Madrid regional minimum: https://www.comunidad.madrid/atencion-contribuyente/beneficios-fiscales .

## Test interpretation

`src/lib/eightCountryOfficial.audit.test.ts`: 28 matching component cases plus the seven discrepancy cases, which were written as expected failures (`it.fails`) and became ordinary assertions when the corrections landed. All 35 now pass.

Final validation after the corrections: full suite 135 files, 2,443 tests passing; TypeScript and ESLint clean. The existing Madrid test in `internationalTaxCountries.test.ts` was updated to the published Madrid minimum (5,956.65). No production build or browser matrix was run.

## Still open
The remaining limits listed above, in particular: the Australian Medicare levy threshold needs confirming on the ATO page; other Spanish communities need their published personal minimums; the Swiss cantonal tax is a flat 13% estimate; and Japan, Mexico, Portugal and Spain have unvalidated payroll, deduction and regime details.
