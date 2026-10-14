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
    "This estimate covers personal income tax only, using the Belastingdienst Curaçao's 2026 bracket table (9.75% to 46.5%). It does not model social premiums, deductions, the penshonado regime or other special regimes. Use this as a planning estimate.",
  tags: ["progressive"],

  sources: [
    {
      title: "Schijven tarief 2026",
      url: "https://belastingdienst.cw/wp-content/uploads/2026/01/Schijven-tarief-2026.pdf",
      type: "tax_agency",
      publisher: "Belastingdienst Curaçao",
      dateChecked: "2026-10-14",
      notes:
        "Official 2026 table: 9.75% to XCG 39,094; 15% to 52,127; 23% to 78,190; 30% to 110,769; 37.5% to 162,894; 46.5% above (cumulative tax amounts check against these rates).",
    },
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
        { upTo: 39094, rate: 0.0975 },
        { upTo: 52127, rate: 0.15 },
        { upTo: 78190, rate: 0.23 },
        { upTo: 110769, rate: 0.30 },
        { upTo: 162894, rate: 0.375 },
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
        { upTo: 39094, rate: 0.0975 },
        { upTo: 52127, rate: 0.15 },
        { upTo: 78190, rate: 0.23 },
        { upTo: 110769, rate: 0.30 },
        { upTo: 162894, rate: 0.375 },
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
        { upTo: 39094, rate: 0.0975 },
        { upTo: 52127, rate: 0.15 },
        { upTo: 78190, rate: 0.23 },
        { upTo: 110769, rate: 0.30 },
        { upTo: 162894, rate: 0.375 },
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