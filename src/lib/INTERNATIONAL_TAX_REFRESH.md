# International tax refresh

Goal: replace each country's 2024 income-tax figures with the national tax authority's own 2026 (or latest published) tables, in alphabetical order. Each refreshed country gets a source comment in its rule module, a known-answer test worked by hand in `internationalTaxCountries.test.ts`, and an updated label.

How to read a PDF from a tax authority: `npm i pdf-parse@1.1.1` in a scratch folder (not the project), then print `require("pdf-parse/lib/pdf-parse.js")(buffer).then(d => d.text)`. The in-app browser turns PDF links into downloads, so fetch them with curl.

Rule modules live in `src/lib/countryTaxRules/`. Countries that have no module yet are still estimated by their 2024 function in `internationalTaxes.ts` (labelled 2024).

| Country | Status | Source (read 2026-10-13) |
| --- | --- | --- |
| Argentina | Refreshed: 2026 annual scale and article 30 deductions | ARCA tables (afip.gob.ar) |
| Australia | Refreshed: 2026-27 rates, LITO, Medicare levy. The old code used a wrong 19%/32.5% mix | ATO |
