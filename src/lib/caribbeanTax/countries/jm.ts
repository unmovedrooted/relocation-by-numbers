// /lib/caribbeanTax/countries/jm.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const JM_TAX_CONFIG: CountryTaxConfig = {
  code: "JM",
  name: "Jamaica",
  currency: "JMD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "Moderate confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model NIS, NHT, education tax, employer payroll costs, foreign tax credits, or remittance-basis edge cases for non-domiciled residents.",
  tags: ["progressive"],

  sources: [
    {
      title: "Jamaica - Individual - Taxes on personal income",
      url: "https://taxsummaries.pwc.com/jamaica/individual/taxes-on-personal-income",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used for resident/non-resident treatment, rates, and tax-free threshold schedule.",
    },
    {
      title: "Jamaica 2026/27 Budget Review",
      url: "https://www.pwc.com/jm/en/services/tax/pdf/pwc-jamaica-preliminary-2026-27-budget-review.pdf",
      type: "tax_firm",
      publisher: "PwC Jamaica",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm continuation of the April 1, 2026 PIT threshold increase.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Jamaica local earned income is modeled using the resident personal income tax schedule.",
        "For the 2026 calendar-year planning model, this calculator uses a blended annual tax-free threshold of JMD 1,978,212, reflecting the April 1, 2026 threshold increase.",
        "Chargeable income up to JMD 6 million is taxed at 25%, and chargeable income above JMD 6 million is taxed at 30%. This estimate does not model NIS, NHT, or education tax.",
      ],
      getAllowance: () => 1978212,
      getBrackets: () => [
        { upTo: 6000000, rate: 0.25 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Jamaica - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/jamaica/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports 25% / 30% PIT rates and the 2026 calendar-year threshold schedule.",
        },
        {
          title: "Jamaica 2026/27 Budget Review",
          url: "https://www.pwc.com/jm/en/services/tax/pdf/pwc-jamaica-preliminary-2026-27-budget-review.pdf",
          type: "tax_firm",
          publisher: "PwC Jamaica",
          dateChecked: "2026-04-08",
          notes:
            "Supports continuation of the April 1, 2026 increase to the annual threshold.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "Jamaica does not fit a simple territorial model in this calculator.",
        "PwC states that resident and domiciled individuals are generally taxed on worldwide income, while non-domiciled individuals are generally not taxable on foreign-source income unless it is remitted to Jamaica.",
        "For planning purposes, remote or foreign-source income is modeled under the same resident progressive schedule, and the UI should present this as a conservative estimate rather than a domicile-specific ruling.",
      ],
      getAllowance: () => 1978212,
      getBrackets: () => [
        { upTo: 6000000, rate: 0.25 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Jamaica - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/jamaica/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports resident worldwide-income treatment and remittance-basis caveat for non-domiciled individuals.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled under Jamaica's resident progressive personal income tax system.",
        "Jamaica's residency and domicile rules can change the treatment of foreign-source income, so this scenario is modeled conservatively rather than as an exemption case.",
        "This estimate does not model pension-specific carve-outs, foreign tax credits, NIS, NHT, or education tax.",
      ],
      getAllowance: () => 1978212,
      getBrackets: () => [
        { upTo: 6000000, rate: 0.25 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Jamaica - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/jamaica/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the rate structure and general resident/non-resident treatment used for retirement-style planning.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default JM_TAX_CONFIG;