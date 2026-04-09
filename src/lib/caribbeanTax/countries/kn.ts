// /lib/caribbeanTax/countries/kn.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const KN_TAX_CONFIG: CountryTaxConfig = {
  code: "KN",
  name: "Saint Kitts and Nevis",
  currency: "XCD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model social security contributions, employer payroll costs, corporate taxes, immigration requirements, or other non-income-tax obligations.",
  tags: ["zero_tax"],

  sources: [
    {
      title: "Saint Kitts and Nevis: No new taxes in 2026 budget",
      url: "https://kpmg.com/us/en/taxnewsflash/news/2026/01/saint-kitts-nevis-no-new-taxes-2026-budget.html",
      type: "tax_firm",
      publisher: "KPMG",
      dateChecked: "2026-04-08",
      notes:
        "Used as recent confirmation that 2026 budget measures did not introduce personal income tax.",
    },
    {
      title: "St. Kitts and Nevis Tax Guide",
      url: "https://www.dawgen.com/wp-content/uploads/2023/07/St.-Kitts-and-Nevis-Tax-Guide.pdf",
      type: "secondary_summary",
      publisher: "Dawgen Global",
      dateChecked: "2026-04-08",
      notes:
        "Used as supporting reference stating there is no personal income tax for individuals.",
    },
  ],

  scenarios: {
    local: {
      kind: "none",
      confidence: "high",
      notes: [
        "Saint Kitts and Nevis does not levy personal income tax under this calculator's planning model.",
        "Local earned employment or self-employment income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model social security contributions, payroll-side employer costs, or business taxes.",
      ],
      sources: [
        {
          title: "Saint Kitts and Nevis: No new taxes in 2026 budget",
          url: "https://kpmg.com/us/en/taxnewsflash/news/2026/01/saint-kitts-nevis-no-new-taxes-2026-budget.html",
          type: "tax_firm",
          publisher: "KPMG",
          dateChecked: "2026-04-08",
          notes:
            "Supports no personal income tax treatment for local earned income.",
        },
      ],
    },

    remote: {
      kind: "none",
      confidence: "high",
      notes: [
        "Saint Kitts and Nevis does not levy personal income tax under this calculator's planning model.",
        "Foreign-source or remote income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model immigration, work authorization, or other non-income-tax obligations.",
      ],
      sources: [
        {
          title: "St. Kitts and Nevis Tax Guide",
          url: "https://www.dawgen.com/wp-content/uploads/2023/07/St.-Kitts-and-Nevis-Tax-Guide.pdf",
          type: "secondary_summary",
          publisher: "Dawgen Global",
          dateChecked: "2026-04-08",
          notes:
            "Supports no personal income tax treatment for individuals, including foreign-source income planning assumptions.",
        },
      ],
    },

    retired: {
      kind: "none",
      confidence: "high",
      notes: [
        "Saint Kitts and Nevis does not levy personal income tax under this calculator's planning model.",
        "Retirement, pension, or similar non-working income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model estate planning, inheritance issues, or other non-income-tax charges.",
      ],
      sources: [
        {
          title: "St. Kitts and Nevis Tax Guide",
          url: "https://www.dawgen.com/wp-content/uploads/2023/07/St.-Kitts-and-Nevis-Tax-Guide.pdf",
          type: "secondary_summary",
          publisher: "Dawgen Global",
          dateChecked: "2026-04-08",
          notes:
            "Supports no personal income tax treatment for retirement-style income.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default KN_TAX_CONFIG;