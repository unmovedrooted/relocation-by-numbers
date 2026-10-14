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
