// /lib/caribbeanTax/countries/bs.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const BS_TAX_CONFIG: CountryTaxConfig = {
  code: "BS",
  name: "Bahamas",
  currency: "BSD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model VAT, customs duties, business licence fees, property taxes, immigration requirements, or other non-income-tax obligations.",
  tags: ["zero_tax"],

  sources: [
    {
      title: "PwC Bahamas, The - Individual - Taxes on personal income",
      url: "https://taxsummaries.pwc.com/the-bahamas/individual/taxes-on-personal-income",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes: "Used to confirm that there is currently no personal income tax in The Bahamas.",
    },
  ],

  scenarios: {
    local: {
      kind: "none",
      confidence: "high",
      notes: [
        "The Bahamas currently does not levy personal income tax under this calculator's planning model.",
        "Local earned employment or self-employment income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model VAT, payroll-side employer costs, business taxes, or sector-specific fees.",
      ],
      sources: [
        {
          title: "PwC Bahamas, The - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/the-bahamas/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes: "Supports zero personal income tax treatment for local earned income.",
        },
      ],
    },

    remote: {
      kind: "none",
      confidence: "high",
      notes: [
        "The Bahamas currently does not levy personal income tax under this calculator's planning model.",
        "Foreign-source or remote income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model residency permits, work authorization, or other non-income-tax obligations.",
      ],
      sources: [
        {
          title: "PwC Bahamas, The - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/the-bahamas/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes: "Supports zero personal income tax treatment for remote or foreign-source income.",
        },
      ],
    },

    retired: {
      kind: "none",
      confidence: "high",
      notes: [
        "The Bahamas currently does not levy personal income tax under this calculator's planning model.",
        "Retirement, pension, or similar non-working income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model wealth planning, estate issues, property tax exposure, or other non-income-tax charges.",
      ],
      sources: [
        {
          title: "PwC Bahamas, The - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/the-bahamas/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes: "Supports zero personal income tax treatment for retirement-style income.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default BS_TAX_CONFIG;