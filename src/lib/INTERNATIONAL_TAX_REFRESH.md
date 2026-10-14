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
