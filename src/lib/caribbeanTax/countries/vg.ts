// /lib/caribbeanTax/countries/vg.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const VG_TAX_CONFIG: CountryTaxConfig = {
  code: "VG",
  name: "British Virgin Islands",
  currency: "USD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model payroll deductions, social security contributions, employer payroll costs, immigration requirements, or other non-income-tax obligations.",
  tags: ["zero_tax"],

  sources: [
    {
      title: "British Virgin Islands: Private Client",
      url: "https://www.legal500.com/guides/chapter/british-virgin-islands-private-client/",
      type: "legal_summary",
      publisher: "The Legal 500",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm there is no personal income tax or capital gains tax for individuals in the British Virgin Islands.",
    },
    {
      title: "KPMG Individual Income Tax Rates Table",
      url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
      type: "tax_firm",
      publisher: "KPMG",
      dateChecked: "2026-04-08",
      notes:
        "Used as supporting reference for individual income tax treatment in the British Virgin Islands.",
    },
  ],

  scenarios: {
    local: {
      kind: "none",
      confidence: "high",
      notes: [
        "The British Virgin Islands does not levy personal income tax under this calculator's planning model.",
        "Local earned employment or self-employment income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model payroll deductions, social security contributions, employer-side costs, or business taxes.",
      ],
      sources: [
        {
          title: "British Virgin Islands: Private Client",
          url: "https://www.legal500.com/guides/chapter/british-virgin-islands-private-client/",
          type: "legal_summary",
          publisher: "The Legal 500",
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
        "The British Virgin Islands does not levy personal income tax under this calculator's planning model.",
        "Foreign-source or remote income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model immigration permissions, work authorization, or other non-income-tax obligations.",
      ],
      sources: [
        {
          title: "British Virgin Islands: Private Client",
          url: "https://www.legal500.com/guides/chapter/british-virgin-islands-private-client/",
          type: "legal_summary",
          publisher: "The Legal 500",
          dateChecked: "2026-04-08",
          notes:
            "Supports zero personal income tax treatment for remote or foreign-source income planning assumptions.",
        },
      ],
    },

    retired: {
      kind: "none",
      confidence: "high",
      notes: [
        "The British Virgin Islands does not levy personal income tax under this calculator's planning model.",
        "Retirement, pension, or similar non-working income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model estate issues, wealth planning, property-related charges, or other non-income-tax obligations.",
      ],
      sources: [
        {
          title: "British Virgin Islands: Private Client",
          url: "https://www.legal500.com/guides/chapter/british-virgin-islands-private-client/",
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

export default VG_TAX_CONFIG;