// /lib/caribbeanTax/countries/cw.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const CW_TAX_CONFIG: CountryTaxConfig = {
  code: "CW",
  name: "Curaçao",
  currency: "ANG",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "partial",
  badgeLabel: "Simplified estimate",
  disclaimer:
    "This estimate covers personal income tax only. Curaçao uses a progressive personal income tax system, but this file does not yet rely on a fully verified official current bracket table from a primary public source. Use this as a planning estimate only.",
  tags: ["progressive"],

  sources: [
    {
      title: "Curaçao Payroll & Benefits Guide",
      url: "https://www.papayaglobal.com/countrypedia/country/curacao/",
      type: "secondary_summary",
      publisher: "Papaya Global",
      dateChecked: "2026-04-08",
      notes:
        "Used as secondary support that Curaçao resident PIT is progressive and reaches up to 46.5% in 2025.",
    },
    {
      title: "Taxes and premiums 2025",
      url: "https://www.celerypayroll.com/en/blog/general/taxes-and-premiums-2025/",
      type: "secondary_summary",
      publisher: "Celery Payroll",
      dateChecked: "2026-04-08",
      notes:
        "Used as supporting payroll reference that Curaçao had official wage tax tables for 2025 and is not a flat-tax jurisdiction.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "Curaçao local earned income is modeled as a progressive personal income tax system.",
        "Secondary current payroll references indicate resident PIT remains progressive rather than flat.",
        "This file uses a simplified planning schedule until the current official bracket table is verified directly from a primary source.",
      ],
      getAllowance: () => 0,
      getBrackets: () => [
        { upTo: 50000, rate: 0.0975 },
        { upTo: 100000, rate: 0.20 },
        { upTo: 200000, rate: 0.30 },
        { upTo: null, rate: 0.465 },
      ],
      sources: [
        {
          title: "Curaçao Payroll & Benefits Guide",
          url: "https://www.papayaglobal.com/countrypedia/country/curacao/",
          type: "secondary_summary",
          publisher: "Papaya Global",
          dateChecked: "2026-04-08",
          notes:
            "Supports progressive PIT treatment and top-rate direction.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "For planning purposes, remote or foreign-source income is modeled under the same simplified progressive resident schedule.",
        "This calculator does not treat Curaçao as territorial or flat-tax.",
        "Remote-income source rules and treaty interactions should be verified in a later pass.",
      ],
      getAllowance: () => 0,
      getBrackets: () => [
        { upTo: 50000, rate: 0.0975 },
        { upTo: 100000, rate: 0.20 },
        { upTo: 200000, rate: 0.30 },
        { upTo: null, rate: 0.465 },
      ],
      sources: [
        {
          title: "Curaçao Payroll & Benefits Guide",
          url: "https://www.papayaglobal.com/countrypedia/country/curacao/",
          type: "secondary_summary",
          publisher: "Papaya Global",
          dateChecked: "2026-04-08",
          notes:
            "Used as secondary support for resident progressive PIT treatment.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled under the same simplified progressive resident schedule.",
        "This file does not yet model pension-specific regimes or special resident relief.",
        "Use this as a planning estimate rather than a final retirement tax determination.",
      ],
      getAllowance: () => 0,
      getBrackets: () => [
        { upTo: 50000, rate: 0.0975 },
        { upTo: 100000, rate: 0.20 },
        { upTo: 200000, rate: 0.30 },
        { upTo: null, rate: 0.465 },
      ],
      sources: [
        {
          title: "Curaçao Payroll & Benefits Guide",
          url: "https://www.papayaglobal.com/countrypedia/country/curacao/",
          type: "secondary_summary",
          publisher: "Papaya Global",
          dateChecked: "2026-04-08",
          notes:
            "Used as secondary support for progressive PIT treatment.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default CW_TAX_CONFIG;