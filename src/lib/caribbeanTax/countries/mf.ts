// /lib/caribbeanTax/countries/mf.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const MF_TAX_CONFIG: CountryTaxConfig = {
  code: "MF",
  name: "Saint Martin",
  currency: "EUR",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "coming_soon",
  badgeLabel: "Autonomous tax system",
  disclaimer:
    "Saint Martin has its own tax jurisdiction and a five-year fiscal-domicile rule for some arrivals from metropolitan France or the French overseas departments. This calculator does not yet model that system reliably.",
  tags: ["autonomous_tax_system", "five_year_rule"],

  sources: [
    {
      title: "Impôts des particuliers",
      url: "https://www.impots-saint-martin.fr/fr/34-impots-des-particuliers.html",
      type: "tax_agency",
      publisher: "Collectivité de Saint-Martin",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm the five-year rule for certain persons arriving from metropolitan France or DOMs.",
    },
    {
      title: "Taxes and duties",
      url: "https://www.impots-saint-martin.fr/en/38-taxes-and-duties.html",
      type: "tax_agency",
      publisher: "Collectivité de Saint-Martin",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm that Saint Martin forms its own autonomous tax jurisdiction.",
    },
  ],

  scenarios: {
    local: {
      kind: "pending",
      confidence: "pending",
      notes: [
        "Saint Martin has its own autonomous tax jurisdiction rather than a simple standard French-system clone.",
        "A five-year fiscal-domicile rule can apply for some people arriving from metropolitan France or the overseas departments.",
        "This calculator does not yet model the Saint Martin local income tax system reliably enough for a live estimate.",
      ],
      sources: [],
    },

    remote: {
      kind: "pending",
      confidence: "pending",
      notes: [
        "Saint Martin has its own autonomous tax jurisdiction and a five-year fiscal-domicile rule that can materially affect foreign-source income treatment.",
        "This calculator does not yet model Saint Martin remote or foreign-source income reliably enough for a live estimate.",
      ],
      sources: [],
    },

    retired: {
      kind: "pending",
      confidence: "pending",
      notes: [
        "Saint Martin has its own autonomous tax jurisdiction and a five-year fiscal-domicile rule that can materially affect retirement-style income treatment.",
        "This calculator does not yet model Saint Martin retirement or pension income reliably enough for a live estimate.",
      ],
      sources: [],
    },
  },

  conditionalQuestions: [],
};

export default MF_TAX_CONFIG;