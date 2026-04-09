// /lib/caribbeanTax/countries/aw.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const AW_TAX_CONFIG: CountryTaxConfig = {
  code: "AW",
  name: "Aruba",
  currency: "AWG",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "Moderate confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model Aruba social security contributions, expat-status exemptions, double-tax relief, employer payroll costs, or other non-income-tax obligations.",
  tags: ["progressive"],

  sources: [
    {
      title: "The income tax and payroll tax rate will change from January 1, 2025",
      url: "https://www.gobierno.aw/en/the-income-tax-and-payroll-tax-rate-will-change-from-january-1-2025",
      type: "government",
      publisher: "Government of Aruba",
      dateChecked: "2026-04-08",
      notes:
        "Used for the 2025 tax-free amount and progressive income/payroll tax table.",
    },
    {
      title: "Aruba Tax Facts for International Assignees",
      url: "https://www.bdo.global/getmedia/8a5a93ac-4c57-47e4-b2f8-5fa8f5706f0a/Aruba-Tax-Facts-Inpatriates-2022.pdf",
      type: "tax_firm",
      publisher: "BDO",
      dateChecked: "2026-04-08",
      notes:
        "Used for resident worldwide-income and non-resident Aruba-source treatment summary.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Aruba local earned income is modeled with the 2025 government-announced progressive income tax table.",
        "This calculator uses a tax-free amount of Afl. 30,000, then applies 0%, 21%, 42%, and 52% bands to the remaining table income.",
        "This estimate does not model Aruba social security contributions, expat-status exemptions, or employer-side payroll obligations.",
      ],
      getAllowance: () => 30000,
      getBrackets: () => [
        { upTo: 34930, rate: 0.0 },
        { upTo: 63904, rate: 0.21 },
        { upTo: 135527, rate: 0.42 },
        { upTo: null, rate: 0.52 },
      ],
      sources: [
        {
          title: "The income tax and payroll tax rate will change from January 1, 2025",
          url: "https://www.gobierno.aw/en/the-income-tax-and-payroll-tax-rate-will-change-from-january-1-2025",
          type: "government",
          publisher: "Government of Aruba",
          dateChecked: "2026-04-08",
          notes:
            "Supports Afl. 30,000 tax-free amount and 2025 progressive bands.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, remote or foreign-source income is modeled under the same resident progressive system.",
        "A BDO Aruba guide states that resident taxpayers are subject to Aruba personal income tax on worldwide income, while non-residents are taxed on Aruba-source income.",
        "This estimate does not model double-tax relief, expat-status benefits, or source-of-income edge cases.",
      ],
      getAllowance: () => 30000,
      getBrackets: () => [
        { upTo: 34930, rate: 0.0 },
        { upTo: 63904, rate: 0.21 },
        { upTo: 135527, rate: 0.42 },
        { upTo: null, rate: 0.52 },
      ],
      sources: [
        {
          title: "Aruba Tax Facts for International Assignees",
          url: "https://www.bdo.global/getmedia/8a5a93ac-4c57-47e4-b2f8-5fa8f5706f0a/Aruba-Tax-Facts-Inpatriates-2022.pdf",
          type: "tax_firm",
          publisher: "BDO",
          dateChecked: "2026-04-08",
          notes:
            "Supports resident worldwide-income treatment used for conservative planning.",
        },
        {
          title: "The income tax and payroll tax rate will change from January 1, 2025",
          url: "https://www.gobierno.aw/en/the-income-tax-and-payroll-tax-rate-will-change-from-january-1-2025",
          type: "government",
          publisher: "Government of Aruba",
          dateChecked: "2026-04-08",
          notes:
            "Supports the rate table used in the estimate.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled under Aruba's resident progressive personal income tax system.",
        "Resident taxpayers are generally described as taxable on worldwide income, so this calculator does not treat retirement income as exempt by default.",
        "This estimate does not model expat-status benefits, pension-specific relief, or foreign tax credit interactions.",
      ],
      getAllowance: () => 30000,
      getBrackets: () => [
        { upTo: 34930, rate: 0.0 },
        { upTo: 63904, rate: 0.21 },
        { upTo: 135527, rate: 0.42 },
        { upTo: null, rate: 0.52 },
      ],
      sources: [
        {
          title: "Aruba Tax Facts for International Assignees",
          url: "https://www.bdo.global/getmedia/8a5a93ac-4c57-47e4-b2f8-5fa8f5706f0a/Aruba-Tax-Facts-Inpatriates-2022.pdf",
          type: "tax_firm",
          publisher: "BDO",
          dateChecked: "2026-04-08",
          notes:
            "Supports resident worldwide-income treatment used for conservative planning of retirement-style income.",
        },
        {
          title: "The income tax and payroll tax rate will change from January 1, 2025",
          url: "https://www.gobierno.aw/en/the-income-tax-and-payroll-tax-rate-will-change-from-january-1-2025",
          type: "government",
          publisher: "Government of Aruba",
          dateChecked: "2026-04-08",
          notes:
            "Supports the current tax-free amount and progressive rate table.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default AW_TAX_CONFIG;