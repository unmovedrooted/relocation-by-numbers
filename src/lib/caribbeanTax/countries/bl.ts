// /lib/caribbeanTax/countries/bl.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const BL_TAX_CONFIG: CountryTaxConfig = {
  code: "BL",
  name: "Saint Barthélemy",
  currency: "EUR",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "coming_soon",
  badgeLabel: "Special residence rule",
  disclaimer:
    "Saint Barthélemy has special tax-residence treatment, including a five-year rule in French tax guidance. This calculator does not yet model Saint Barthélemy income tax treatment reliably enough for a live estimate.",
  tags: ["special_tax_system", "five_year_rule"],

  sources: [
    {
      title: "Individuals outside France",
      url: "https://www.impots.gouv.fr/1metier5internationalevpart0transversehowtocompleteyourincomtaxreturnpdf",
      type: "government",
      publisher: "impots.gouv.fr",
      dateChecked: "2026-04-08",
      notes:
        "Used to support the five-year Saint Barthélemy tax residence rule in French guidance.",
    },
    {
      title: "France: St. Barthélemy companies may belong to French tax group",
      url: "https://kpmg.com/us/en/taxnewsflash/news/2024/12/tnf-france-st-barthelemy-companies-may-belong-to-french-tax-group.html",
      type: "tax_firm",
      publisher: "KPMG",
      dateChecked: "2026-04-08",
      notes:
        "Used as supporting context for the five-year residence condition in Saint Barthélemy tax status.",
    },
  ],

  scenarios: {
    local: {
      kind: "pending",
      confidence: "pending",
      notes: [
        "Saint Barthélemy has special tax-residence treatment and should not be flattened into a generic French-system row.",
        "French guidance references a five-year residence rule for Saint Barthélemy tax residence in relevant cases.",
        "This calculator does not yet model the Saint Barthélemy local income tax system reliably enough for a live estimate.",
      ],
      sources: [],
    },

    remote: {
      kind: "pending",
      confidence: "pending",
      notes: [
        "Saint Barthélemy has special tax-residence treatment and should not be flattened into a generic French-system row.",
        "This calculator does not yet model Saint Barthélemy remote or foreign-source income reliably enough for a live estimate.",
      ],
      sources: [],
    },

    retired: {
      kind: "pending",
      confidence: "pending",
      notes: [
        "Saint Barthélemy has special tax-residence treatment and should not be flattened into a generic French-system row.",
        "This calculator does not yet model Saint Barthélemy retirement or pension income reliably enough for a live estimate.",
      ],
      sources: [],
    },
  },

  conditionalQuestions: [],
};

export default BL_TAX_CONFIG;