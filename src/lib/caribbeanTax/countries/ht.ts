// /lib/caribbeanTax/countries/ht.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const HT_TAX_CONFIG: CountryTaxConfig = {
  code: "HT",
  name: "Haiti",
  currency: "HTG",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "partial",
  badgeLabel: "Simplified estimate",
  disclaimer:
    "This estimate covers personal income tax only. Haiti's official tax pages confirm a five-band progressive salary scale from 0% to 30%, but the exact bracket thresholds were not clearly published on the official pages reviewed here. This file uses a secondary threshold summary and should be re-checked against the current statutory barème before final launch.",
  tags: ["progressive"],

  sources: [
    {
      title: "Déclaration Définitive d'Impôt sur le Revenu",
      url: "https://dgi.gouv.ht/dgi_sev/declaration-definitive-impot-revenu/",
      type: "tax_agency",
      publisher: "Direction Générale des Impôts, Haïti",
      dateChecked: "2026-04-08",
      notes:
        "Used to support resident and Haitian-source filing scope for individuals.",
    },
    {
      title: "Les Retenus à la source",
      url: "https://dgi.gouv.ht/dgi_sev/les-retenus-a-la-source/",
      type: "tax_agency",
      publisher: "Direction Générale des Impôts, Haïti",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm that salaries are taxed under a five-bracket progressive scale from 0% to 30%.",
    },
    {
      title: "Haiti - Global Employer Guide",
      url: "https://www.globalexpansion.com/hubfs/Countrypedia%20PDFs/In%20use/Haiti%20-%20Global%20Employer%20Guide.pdf",
      type: "secondary_summary",
      publisher: "Global Expansion",
      dateChecked: "2026-04-08",
      notes:
        "Used as a secondary source for the practical annual threshold summary: 0% to 20,000 HTG, 10% to 100,000, 15% to 250,000, 25% to 750,000, and 30% above.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "Haiti local earned income is modeled as a five-band progressive personal income tax schedule.",
        "The official DGI pages confirm that salaries are taxed under a progressive five-band scale from 0% to 30%, and that individuals domiciled in Haiti are within the filing scope.",
        "Because the exact official thresholds were not clearly published on the DGI pages reviewed here, this estimate uses secondary threshold cutoffs and should be treated as a planning model.",
      ],
      getAllowance: () => 20000,
      getBrackets: () => [
        { upTo: 80000, rate: 0.10 },
        { upTo: 230000, rate: 0.15 },
        { upTo: 730000, rate: 0.25 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Les Retenus à la source",
          url: "https://dgi.gouv.ht/dgi_sev/les-retenus-a-la-source/",
          type: "tax_agency",
          publisher: "Direction Générale des Impôts, Haïti",
          dateChecked: "2026-04-08",
          notes:
            "Supports the official existence of the five-band progressive salary scale from 0% to 30%.",
        },
        {
          title: "Haiti - Global Employer Guide",
          url: "https://www.globalexpansion.com/hubfs/Countrypedia%20PDFs/In%20use/Haiti%20-%20Global%20Employer%20Guide.pdf",
          type: "secondary_summary",
          publisher: "Global Expansion",
          dateChecked: "2026-04-08",
          notes:
            "Provides the threshold breakdown used for this planning estimate.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "For planning purposes, remote or foreign-source income is modeled under the same progressive resident schedule.",
        "The DGI confirms that individuals domiciled in Haiti are in scope for income tax, but the specific foreign-source treatment was not cleanly detailed on the official pages reviewed here.",
        "This is a conservative estimate and should not be read as a confirmed territorial or remittance-basis rule.",
      ],
      getAllowance: () => 20000,
      getBrackets: () => [
        { upTo: 80000, rate: 0.10 },
        { upTo: 230000, rate: 0.15 },
        { upTo: 730000, rate: 0.25 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Déclaration Définitive d'Impôt sur le Revenu",
          url: "https://dgi.gouv.ht/dgi_sev/declaration-definitive-impot-revenu/",
          type: "tax_agency",
          publisher: "Direction Générale des Impôts, Haïti",
          dateChecked: "2026-04-08",
          notes:
            "Supports domiciled individuals being within Haiti's income tax filing scope.",
        },
        {
          title: "Haiti - Global Employer Guide",
          url: "https://www.globalexpansion.com/hubfs/Countrypedia%20PDFs/In%20use/Haiti%20-%20Global%20Employer%20Guide.pdf",
          type: "secondary_summary",
          publisher: "Global Expansion",
          dateChecked: "2026-04-08",
          notes:
            "Provides the threshold breakdown used for this conservative planning estimate.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled using the same progressive resident schedule.",
        "The official materials reviewed did not provide a clear pension-specific exemption map, so this file does not assume retirement income is exempt.",
        "Use this as a planning estimate rather than a pension-specialist determination.",
      ],
      getAllowance: () => 20000,
      getBrackets: () => [
        { upTo: 80000, rate: 0.10 },
        { upTo: 230000, rate: 0.15 },
        { upTo: 730000, rate: 0.25 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Déclaration Définitive d'Impôt sur le Revenu",
          url: "https://dgi.gouv.ht/dgi_sev/declaration-definitive-impot-revenu/",
          type: "tax_agency",
          publisher: "Direction Générale des Impôts, Haïti",
          dateChecked: "2026-04-08",
          notes:
            "Supports the general scope of personal income tax for domiciled individuals.",
        },
        {
          title: "Haiti - Global Employer Guide",
          url: "https://www.globalexpansion.com/hubfs/Countrypedia%20PDFs/In%20use/Haiti%20-%20Global%20Employer%20Guide.pdf",
          type: "secondary_summary",
          publisher: "Global Expansion",
          dateChecked: "2026-04-08",
          notes:
            "Provides the bracket thresholds used in this simplified planning model.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default HT_TAX_CONFIG;