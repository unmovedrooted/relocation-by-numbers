// /lib/caribbeanTax/countries/mq.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const MQ_TAX_CONFIG: CountryTaxConfig = {
  code: "MQ",
  name: "Martinique",
  currency: "EUR",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "coming_soon",
  badgeLabel: "French system",
  disclaimer:
    "Martinique is part of the French income tax system for these purposes. This calculator does not yet model the full French schedule, household quotient system, or overseas-specific reductions.",
  tags: ["french_system"],

  sources: [
    {
      title: "French tax law brochure",
      url: "https://www.impots.gouv.fr/brochure-la-fiscalite-francaise-version-anglaise-french-tax-law-brochure",
      type: "government",
      publisher: "impots.gouv.fr",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm that Martinique is included in France for income tax purposes.",
    },
    {
      title: "Fact sheet: French tax resident",
      url: "https://www.welcometofrance.com/en/fiche/fact-sheet-french-tax-resident",
      type: "official_program",
      publisher: "Welcome to France",
      dateChecked: "2026-04-08",
      notes:
        "Used to support general French tax-resident treatment.",
    },
  ],

  scenarios: {
    local: {
      kind: "french_system",
      confidence: "pending",
      notes: [
        "Martinique follows the French income tax system for this calculator's classification purposes.",
        "This calculator does not yet model the French household quotient, current rate bands, or overseas-specific reductions.",
      ],
      sources: [],
    },

    remote: {
      kind: "french_system",
      confidence: "pending",
      notes: [
        "Martinique follows the French income tax system for this calculator's classification purposes.",
        "This calculator does not yet model the French treatment of foreign-source or remote income in enough detail for a live estimate.",
      ],
      sources: [],
    },

    retired: {
      kind: "french_system",
      confidence: "pending",
      notes: [
        "Martinique follows the French income tax system for this calculator's classification purposes.",
        "This calculator does not yet model pension and retirement income under the French system in enough detail for a live estimate.",
      ],
      sources: [],
    },
  },

  conditionalQuestions: [],
};

export default MQ_TAX_CONFIG;