// /lib/caribbeanTax/countries/tc.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const TC_TAX_CONFIG: CountryTaxConfig = {
  code: "TC",
  name: "Turks and Caicos Islands",
  currency: "USD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model National Insurance, National Health Insurance Plan contributions, customs duties, immigration requirements, or other non-income-tax obligations.",
  tags: ["zero_tax"],

  sources: [
    {
      title: "Taxes in the Turks and Caicos",
      url: "https://www.visittci.com/life-and-business/investing/taxes",
      type: "other",
      publisher: "VisitTCI",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm there is no income tax in the Turks and Caicos Islands and to note NI/NHIP as separate direct charges.",
    },
    {
      title: "Turks & Caicos: Private Client – Country Comparative Guides",
      url: "https://www.legal500.com/guides/chapter/turks-caicos-private-client/",
      type: "legal_summary",
      publisher: "The Legal 500",
      dateChecked: "2026-04-08",
      notes:
        "Supporting source stating there is no income tax or capital gains tax in TCI.",
    },
  ],

  scenarios: {
    local: {
      kind: "none",
      confidence: "high",
      notes: [
        "The Turks and Caicos Islands does not levy personal income tax under this calculator's planning model.",
        "Local earned employment or self-employment income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model National Insurance, National Health Insurance Plan contributions, employer-side payroll costs, or business-related charges.",
      ],
      sources: [
        {
          title: "Taxes in the Turks and Caicos",
          url: "https://www.visittci.com/life-and-business/investing/taxes",
          type: "other",
          publisher: "VisitTCI",
          dateChecked: "2026-04-08",
          notes:
            "Supports zero personal income tax treatment for local earned income.",
        },
      ],
    },

    remote: {
      kind: "none",
      confidence: "high",
      notes: [
        "The Turks and Caicos Islands does not levy personal income tax under this calculator's planning model.",
        "Foreign-source or remote income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model immigration permissions, work authorization, or other non-income-tax obligations.",
      ],
      sources: [
        {
          title: "Turks & Caicos: Private Client – Country Comparative Guides",
          url: "https://www.legal500.com/guides/chapter/turks-caicos-private-client/",
          type: "legal_summary",
          publisher: "The Legal 500",
          dateChecked: "2026-04-08",
          notes:
            "Supports zero personal income tax treatment for individuals for remote or foreign-source income planning assumptions.",
        },
      ],
    },

    retired: {
      kind: "none",
      confidence: "high",
      notes: [
        "The Turks and Caicos Islands does not levy personal income tax under this calculator's planning model.",
        "Retirement, pension, or similar non-working income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model property-related charges, wealth planning, or other non-income-tax obligations.",
      ],
      sources: [
        {
          title: "Turks & Caicos: Private Client – Country Comparative Guides",
          url: "https://www.legal500.com/guides/chapter/turks-caicos-private-client/",
          type: "legal_summary",
          publisher: "The Legal 500",
          dateChecked: "2026-04-08",
          notes:
            "Supports zero personal income tax treatment for retirement-style income.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default TC_TAX_CONFIG;