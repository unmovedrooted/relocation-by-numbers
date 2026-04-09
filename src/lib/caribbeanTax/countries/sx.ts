// /lib/caribbeanTax/countries/sx.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const SX_TAX_CONFIG: CountryTaxConfig = {
  code: "SX",
  name: "Sint Maarten",
  currency: "ANG",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "partial",
  badgeLabel: "Simplified estimate",
  disclaimer:
    "This estimate covers personal income tax only. Sint Maarten clearly has a progressive personal income tax system and a penshonado regime, but this file does not yet rely on a fully extracted official current bracket table. Use this as a planning estimate only.",
  tags: ["progressive"],

  sources: [
    {
      title: "2025 Tax Return Form A",
      url: "https://www.sintmaartengov.org/Documents/Income%20Tax%20Forms/Aangifte%20IB%202025%20ModeL%201A-%20Version%202025.pdf",
      type: "government",
      publisher: "Government of Sint Maarten",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm reporting of foreign-source income, double-tax relief fields, and the penshonado special-rate fields.",
    },
    {
      title: "Minister of Finance Announces Publication of 2025 Tax Tables",
      url: "https://www.sintmaartengov.org/news/pages/Minister-of-Finance%2C-Marinka-Gumbs-Announces-Publication-of-2025-Tax-Tables.aspx",
      type: "government",
      publisher: "Government of Sint Maarten",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm 2025 tax tables are the current official reference point.",
    },
    {
      title: "Sint Maarten Payroll & Benefits Guide",
      url: "https://www.papayaglobal.com/countrypedia/country/sint-maarten/",
      type: "secondary_summary",
      publisher: "Papaya Global",
      dateChecked: "2026-04-08",
      notes:
        "Used as secondary support for progressive resident PIT and approximate top-rate range.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "Sint Maarten local earned income is modeled as a progressive personal income tax system.",
        "The government confirms current annual tax tables are published, but this file does not yet rely on a fully extracted official bracket schedule.",
        "This simplified planning model uses an approximate progressive ladder and should be replaced with the official table once parsed directly.",
      ],
      getAllowance: () => 0,
      getBrackets: () => [
        { upTo: 35000, rate: 0.10 },
        { upTo: 50000, rate: 0.16 },
        { upTo: 75000, rate: 0.21 },
        { upTo: 125000, rate: 0.27 },
        { upTo: 250000, rate: 0.32 },
        { upTo: null, rate: 0.475 },
      ],
      sources: [
        {
          title: "Sint Maarten Payroll & Benefits Guide",
          url: "https://www.papayaglobal.com/countrypedia/country/sint-maarten/",
          type: "secondary_summary",
          publisher: "Papaya Global",
          dateChecked: "2026-04-08",
          notes:
            "Supports that Sint Maarten uses a progressive PIT structure and gives an approximate top-rate range.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "For planning purposes, remote or foreign-source income is modeled under the same simplified progressive resident schedule.",
        "The official 2025 return form includes reporting of income from sources abroad and a request for prevention of double taxation, so this calculator does not treat Sint Maarten as territorial for resident taxpayers.",
        "This remains a conservative planning estimate until the full official current tax table is mapped.",
      ],
      getAllowance: () => 0,
      getBrackets: () => [
        { upTo: 35000, rate: 0.10 },
        { upTo: 50000, rate: 0.16 },
        { upTo: 75000, rate: 0.21 },
        { upTo: 125000, rate: 0.27 },
        { upTo: 250000, rate: 0.32 },
        { upTo: null, rate: 0.475 },
      ],
      sources: [
        {
          title: "2025 Tax Return Form A",
          url: "https://www.sintmaartengov.org/Documents/Income%20Tax%20Forms/Aangifte%20IB%202025%20ModeL%201A-%20Version%202025.pdf",
          type: "government",
          publisher: "Government of Sint Maarten",
          dateChecked: "2026-04-08",
          notes:
            "Supports foreign-income reporting and double-tax-relief handling on the resident return.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled under the same simplified progressive resident schedule by default.",
        "However, Sint Maarten's official return form clearly shows a penshonado regime with 5% and 10% options and fictitious-income fields, so retirement taxation can be materially different for qualifying individuals.",
        "This scenario should be shown with caution until the penshonado rules are modeled directly.",
      ],
      getAllowance: () => 0,
      getBrackets: () => [
        { upTo: 35000, rate: 0.10 },
        { upTo: 50000, rate: 0.16 },
        { upTo: 75000, rate: 0.21 },
        { upTo: 125000, rate: 0.27 },
        { upTo: 250000, rate: 0.32 },
        { upTo: null, rate: 0.475 },
      ],
      sources: [
        {
          title: "2025 Tax Return Form A",
          url: "https://www.sintmaartengov.org/Documents/Income%20Tax%20Forms/Aangifte%20IB%202025%20ModeL%201A-%20Version%202025.pdf",
          type: "government",
          publisher: "Government of Sint Maarten",
          dateChecked: "2026-04-08",
          notes:
            "Supports existence of the penshonado 5% / 10% special-rate regime fields.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default SX_TAX_CONFIG;