// /lib/caribbeanTax/countries/lc.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const LC_TAX_CONFIG: CountryTaxConfig = {
  code: "LC",
  name: "Saint Lucia",
  currency: "XCD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model NIC contributions, employer payroll costs, remittance-basis edge cases for residents who are not ordinarily resident, or other non-income-tax obligations.",
  tags: ["progressive"],

  sources: [
    {
      title: "Saint Lucia - Individual - Taxes on personal income",
      url: "https://taxsummaries.pwc.com/saint-lucia/individual/taxes-on-personal-income",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used for the PIT rates and core resident taxation summary.",
    },
    {
      title: "Saint Lucia - Individual - Residence",
      url: "https://taxsummaries.pwc.com/saint-lucia/individual/residence",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used for residence tests and resident/ordinarily resident distinctions.",
    },
    {
      title: "Saint Lucia - Individual - Tax administration",
      url: "https://taxsummaries.pwc.com/saint-lucia/individual/tax-administration",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm filing threshold of XCD 18,000.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Saint Lucia local earned income is modeled using the published personal income tax table.",
        "This calculator applies 15% on the first XCD 15,000 of chargeable income, 20% on the next XCD 15,000, and 30% above XCD 30,000.",
        "This estimate does not attempt to model NIC contributions, payroll-side employer costs, or itemized deduction planning.",
      ],
      getAllowance: () => 0,
      getBrackets: () => [
        { upTo: 15000, rate: 0.15 },
        { upTo: 30000, rate: 0.20 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Saint Lucia - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/saint-lucia/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the PIT rate schedule used in this estimate.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "Saint Lucia is not modeled as territorial for remote income.",
        "PwC states that a resident or ordinarily resident individual is taxable on income from all sources whether in or outside Saint Lucia. A resident but not ordinarily resident individual is taxable on foreign income only to the extent it is remitted to Saint Lucia.",
        "For planning purposes, remote or foreign-source income is modeled under the same progressive resident schedule, and the UI should present this as a conservative estimate rather than a remittance-basis ruling.",
      ],
      getAllowance: () => 0,
      getBrackets: () => [
        { upTo: 15000, rate: 0.15 },
        { upTo: 30000, rate: 0.20 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Saint Lucia - Individual - Residence",
          url: "https://taxsummaries.pwc.com/saint-lucia/individual/residence",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports worldwide-income treatment for residents/ordinarily residents and remittance treatment for residents not ordinarily resident.",
        },
        {
          title: "Saint Lucia - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/saint-lucia/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the PIT rate schedule used for conservative planning.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled under Saint Lucia's resident personal income tax schedule.",
        "Because resident individuals can be taxable on worldwide income and some foreign income rules depend on ordinary residence and remittance, this calculator does not assume retirement income is exempt by default.",
        "This estimate does not model pension-specific relief, remittance-basis edge cases, or treaty interactions.",
      ],
      getAllowance: () => 0,
      getBrackets: () => [
        { upTo: 15000, rate: 0.15 },
        { upTo: 30000, rate: 0.20 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Saint Lucia - Individual - Residence",
          url: "https://taxsummaries.pwc.com/saint-lucia/individual/residence",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports resident and ordinarily resident taxation treatment used for conservative retirement-income planning.",
        },
        {
          title: "Saint Lucia - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/saint-lucia/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the PIT rate schedule used in this estimate.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default LC_TAX_CONFIG;