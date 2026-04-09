// /lib/caribbeanTax/countries/tt.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const TT_TAX_CONFIG: CountryTaxConfig = {
  code: "TT",
  name: "Trinidad and Tobago",
  currency: "TTD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model NIS, health surcharge, employer payroll costs, foreign tax credits, or detailed deduction planning beyond the personal allowance.",
  tags: ["progressive"],

  sources: [
    {
      title: "Trinidad and Tobago - Individual - Taxes on personal income",
      url: "https://taxsummaries.pwc.com/trinidad-and-tobago/individual/taxes-on-personal-income",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used for the PIT rates of 25% up to TTD 1 million and 30% above, plus general resident treatment.",
    },
    {
      title: "Trinidad and Tobago - Individual - Income determination",
      url: "https://taxsummaries.pwc.com/trinidad-and-tobago/individual/income-determination",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm that resident individuals are assessable on worldwide income.",
    },
    {
      title: "Individual Income Tax Deductions & Allowances by Income Year",
      url: "https://www.ird.gov.tt/individual/deductions-and-required-supporting-documents",
      type: "tax_agency",
      publisher: "Inland Revenue Division, Trinidad and Tobago",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm the personal allowance figure shown on the IRD site.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Trinidad and Tobago local earned income is modeled using the resident personal income tax schedule.",
        "This calculator uses a TTD 90,000 personal allowance, then applies 25% on chargeable income up to TTD 1 million and 30% above TTD 1 million.",
        "This estimate does not model NIS, health surcharge, or employer-side payroll costs.",
      ],
      getAllowance: () => 90000,
      getBrackets: () => [
        { upTo: 1000000, rate: 0.25 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Trinidad and Tobago - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/trinidad-and-tobago/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the 25% / 30% PIT structure.",
        },
        {
          title: "Individual Income Tax Deductions & Allowances by Income Year",
          url: "https://www.ird.gov.tt/individual/deductions-and-required-supporting-documents",
          type: "tax_agency",
          publisher: "Inland Revenue Division, Trinidad and Tobago",
          dateChecked: "2026-04-08",
          notes:
            "Supports the TTD 90,000 personal allowance shown on the IRD site.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Trinidad and Tobago is not modeled as territorial for remote income.",
        "PwC states that a resident individual engaged in employment is assessable to tax on worldwide income, so foreign-source or remote income is modeled under the same resident progressive schedule.",
        "This estimate does not model foreign tax credits, treaty relief, or edge cases around temporary residence.",
      ],
      getAllowance: () => 90000,
      getBrackets: () => [
        { upTo: 1000000, rate: 0.25 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Trinidad and Tobago - Individual - Income determination",
          url: "https://taxsummaries.pwc.com/trinidad-and-tobago/individual/income-determination",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports resident worldwide-income treatment used for remote income planning.",
        },
        {
          title: "Individual Income Tax Deductions & Allowances by Income Year",
          url: "https://www.ird.gov.tt/individual/deductions-and-required-supporting-documents",
          type: "tax_agency",
          publisher: "Inland Revenue Division, Trinidad and Tobago",
          dateChecked: "2026-04-08",
          notes:
            "Supports the personal allowance applied in the estimate.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled using the resident personal income tax schedule.",
        "The IRD states that the TTD 90,000 personal allowance is also available to non-residents receiving pension income accruing or derived from Trinidad and Tobago.",
        "This estimate does not model pension-specific exemptions, NIS, or health surcharge.",
      ],
      getAllowance: () => 90000,
      getBrackets: () => [
        { upTo: 1000000, rate: 0.25 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Trinidad and Tobago - Individual - Deductions",
          url: "https://taxsummaries.pwc.com/trinidad-and-tobago/individual/deductions",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the availability of the personal allowance to residents and certain non-resident pension recipients.",
        },
        {
          title: "Trinidad and Tobago - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/trinidad-and-tobago/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the PIT rate structure used in this estimate.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default TT_TAX_CONFIG;