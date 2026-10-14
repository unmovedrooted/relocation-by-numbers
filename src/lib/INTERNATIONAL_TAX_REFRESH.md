# International tax refresh

Goal: replace each country's 2024 income-tax figures with the national tax authority's own 2026 (or latest published) tables, in alphabetical order. Each refreshed country gets a source comment in its rule module, a known-answer test worked by hand in `internationalTaxCountries.test.ts`, and an updated label.

How to read a PDF from a tax authority: `npm i pdf-parse@1.1.1` in a scratch folder (not the project), then print `require("pdf-parse/lib/pdf-parse.js")(buffer).then(d => d.text)`. The in-app browser turns PDF links into downloads, so fetch them with curl.

Rule modules live in `src/lib/countryTaxRules/`. Countries that have no module yet are still estimated by their 2024 function in `internationalTaxes.ts` (labelled 2024).

| Country | Status | Source (read 2026-10-13) |
| --- | --- | --- |
| Argentina | Refreshed: 2026 annual scale and article 30 deductions | ARCA tables (afip.gob.ar) |
| Australia | Refreshed: 2026-27 rates, LITO, Medicare levy. The old code used a wrong 19%/32.5% mix | ATO |
| Austria | Refreshed: BMF 2026 tariff (matches its EUR 40,000 example), credits, 2026 social-insurance values; 13th/14th salary not modelled | BMF, Dachverband |
| Belgium | Refreshed: income year 2026 brackets, EUR 11,180 allowance (the old code omitted it), expense forfait cap 6,070. Marital quotient not modelled | FPS Finance |
| Bolivia | Skipped for now: the tax authority's sources conflict on the current RC-IVA deduction (one vs two minimum wages) | SIN |
| Brazil | Refreshed: Receita Federal 2026 table and Law 15.270 reducer (matches its R$ 6,000 example), INSS 2026 | Receita Federal, INSS |
| Bulgaria | Refreshed: flat 10% after contributions, NOI 2026 insurable-income caps in euros. 2026 contribution rates assumed equal to the 2025 table | NOI |
| Canada | Refreshed: CRA 2026 federal and all provincial/territorial brackets, credits, CPP/CPP2/EI, Ontario surtax and Health Premium, Quebec abatement. Provincial age/spouse credits not modelled; Quebec QPP/QPIP approximated; Alberta credit rate unverified | CRA, Revenu Quebec |
| Chile | Refreshed: SII 2026 monthly table (the old code applied monthly thresholds to annual income), 90 UF contribution ceiling. AFP commission and unemployment insurance not modelled | SII, Superintendencia de Pensiones |
| China | Refreshed: STA comprehensive-income table (unchanged for 2026), social insurance deducted; removed an invented CNY 20,000 deduction. Housing fund and city bases not modelled | State Taxation Administration |
| Colombia | UVT 2026 (COP 52,374) verified from DIAN; table, 25% exemption caps and 4%+4% contributions are the Law 2277 rules, statute text not reachable to re-read | DIAN |
| Costa Rica | Refreshed: Hacienda 2026 monthly brackets (read from the PDF; the old code applied monthly thresholds to annual income), CCSS 2026 worker rates (IVM 4.33%) | Hacienda, CCSS |
| Croatia | Refreshed: Porezna uprava 2026 threshold EUR 60,000 (was 50,400), 20% pension contribution and EUR 600 monthly allowance added; local rates (up to 23%/33% in Zagreb) not modelled | Porezna uprava |
| Cyprus | Not refreshed: the 2026 reform raised the tax-free amount to EUR 22,000 (Law 244(I)/2025, confirmed from a search summary) but the official scale could not be read (the Tax Department site moved and blocks downloads). Still shows 2024 figures | Tax Department |
| Czech Republic | Refreshed: Financial Administration 2026 (15%/23% at CZK 1,762,812, credit 30,840); insurance rates and the 48x cap are statutory/derived, not re-read | Financni sprava |
| Denmark | Refreshed: skat.dk 2026 (new 7.5% middle and top brackets, personal allowance DKK 54,100), Skatteministeriet average municipal rate 25.049%, employment allowance. Church tax and your municipality's rate not included | skat.dk, Skatteministeriet |
| Ecuador | Refreshed: SRI table for fiscal year 2026 read from the PDF (exempt $12,208, new 37% band above $109,956), IESS 9.45% deducted. Personal-expense rebate not modelled | SRI |
| Estonia | Refreshed: EMTA 2026 (22%, basic exemption EUR 8,400 that no longer shrinks), 1.6% + 2% contributions deducted | EMTA, Riigi Teataja |
| Finland | Not refreshed: the 2026 state scale was read from vero.fi (12.64% to EUR 22,000, 19% to 32,600, 30.25% to 40,100, 33.25% to 52,100, 37.5% above) and the average municipal rate is 7.6%, not the 21.5% in the code (municipal rates fell after the 2023 health-care reform), but the old estimate also omits the earned-income and basic deductions and the work income credit, which cut the tax a lot (the Tax Administration's examples: 8.5% at EUR 30,000). A correct model needs those formulas, so it is deferred rather than half-fixed. The current figure overstates tax | vero.fi |
| France | Refreshed: 2026 scale on 2025 income (law 2026-103), decote, 10% allowance, Urssaf/Agirc-Arrco 2026 employee rates, CSG/CRDS. The old code applied the scale to gross pay and omitted about 13 points of contributions. Child parts and pensioner rates not modelled | impots.gouv.fr, Urssaf, Agirc-Arrco |
| Germany | Refreshed: section 32a EStG 2026 tariff read from the statute, solidarity surcharge with phase-in, 2026 social-insurance ceilings and rates (BMAS). The old model omitted employee social insurance (about 20 points) and used 2024 figures. Child allowances, taxable pension share not modelled | gesetze-im-internet.de, BMAS |
