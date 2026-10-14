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
    "This estimate covers personal income tax only. Haiti's Ministry of Economy and Finance (MEF) states that the 2005 decree scale has a 0% band to HTG 60,000 a year; the upper limits of the other bands (HTG 240,000, 480,000 and 1,000,000) are implied by the MEF note's ratios and match secondary summaries, so they are not stated by an official page. The 10% special salary allowance is not modelled. The MEF validated a new scale in May 2026 (0% to HTG 360,000, then 12/18/25/30%) planned for 1 October 2026, which this model does not use until it is published in law.",
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
        "Earlier source for thresholds (0% to 20,000 HTG, 10% to 100,000, 15% to 250,000, 25% to 750,000); superseded because it conflicts with the MEF figure of a 0% band to 60,000 HTG.",
    },
    {
      title: "Revising Haiti's personal income tax (IRPP) schedule (2026)",
      url: "https://www.haitidocs.org/doc/mef-2026-irpp-bareme-revision",
      type: "tax_agency",
      publisher: "Ministère de l'Économie et des Finances, Haïti",
      dateChecked: "2026-10-14",
      notes:
        "States the 0% band to HTG 60,000 under the 2005 decree, the ratios implying the HTG 240,000, 480,000 and 1,000,000 limits, and the proposed 2026 scale (validated May 2026, planned for 1 October 2026).",
    },
    {
      title: "Les Traitements et Salaires",
      url: "https://dgi.gouv.ht/dgi_sev/les-traitements-et-salaires/",
      type: "tax_agency",
      publisher: "Direction Générale des Impôts, Haïti",
      dateChecked: "2026-10-14",
      notes:
        "States the 10% special allowance on gross salary before the article 149 scale is applied (not modelled).",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "Haiti local earned income is modeled as a five-band progressive personal income tax schedule.",
        "The official DGI pages confirm that salaries are taxed under a progressive five-band scale from 0% to 30%, and that individuals domiciled in Haiti are within the filing scope.",
        "The 0% band to HTG 60,000 is from the MEF; the upper band limits are implied by the MEF note and match secondary summaries. The 10% salary allowance and the proposed 2026 scale are not modelled.",
      ],
      getAllowance: () => 60000,
      getBrackets: () => [
        { upTo: 180000, rate: 0.10 },
        { upTo: 420000, rate: 0.15 },
        { upTo: 940000, rate: 0.25 },
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
            "Older secondary figures; superseded by the MEF 0% band to HTG 60,000. The upper band limits match secondary summaries.",
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
      getAllowance: () => 60000,
      getBrackets: () => [
        { upTo: 180000, rate: 0.10 },
        { upTo: 420000, rate: 0.15 },
        { upTo: 940000, rate: 0.25 },
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
            "Older secondary figures; superseded by the MEF 0% band to HTG 60,000. The upper band limits match secondary summaries.",
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
      getAllowance: () => 60000,
      getBrackets: () => [
        { upTo: 180000, rate: 0.10 },
        { upTo: 420000, rate: 0.15 },
        { upTo: 940000, rate: 0.25 },
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
            "Older secondary figures; superseded by the MEF 0% band to HTG 60,000. The upper band limits match secondary summaries.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default HT_TAX_CONFIG;