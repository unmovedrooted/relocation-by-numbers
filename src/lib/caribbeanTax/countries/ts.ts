// /lib/caribbeanTax/countries/ky.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const KY_TAX_CONFIG: CountryTaxConfig = {
  code: "KY",
  name: "Cayman Islands",
  currency: "KYD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model import duties, work permit fees, employer payroll costs, immigration requirements, or other non-income-tax obligations.",
  tags: ["zero_tax"],

  sources: [
    {
      title: "PwC Cayman Islands - Individual - Taxes on personal income",
      url: "https://taxsummaries.pwc.com/cayman-islands/individual/taxes-on-personal-income",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm that there are no income or withholding taxes imposed on individuals in the Cayman Islands.",
    },
  ],

  scenarios: {
    local: {
      kind: "none",
      confidence: "high",
      notes: [
        "The Cayman Islands does not levy personal income tax under this calculator's planning model.",
        "Local earned employment or self-employment income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model work permit fees, employer-side payroll costs, or business taxes.",
      ],
      sources: [
        {
          title: "PwC Cayman Islands - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/cayman-islands/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
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
        "The Cayman Islands does not levy personal income tax under this calculator's planning model.",
        "Foreign-source or remote income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model residency permissions, work authorization, or other non-income-tax obligations.",
      ],
      sources: [
        {
          title: "PwC Cayman Islands - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/cayman-islands/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports zero personal income tax treatment for remote or foreign-source income.",
        },
      ],
    },

    retired: {
      kind: "none",
      confidence: "high",
      notes: [
        "The Cayman Islands does not levy personal income tax under this calculator's planning model.",
        "Retirement, pension, or similar non-working income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model wealth planning, estate matters, property-related taxes, or other non-income-tax charges.",
      ],
      sources: [
        {
          title: "PwC Cayman Islands - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/cayman-islands/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports zero personal income tax treatment for retirement-style income.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default KY_TAX_CONFIG;