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
      title: "Increase in Income Tax Threshold Now in Effect",
      url: "https://jis.gov.jm/increase-in-income-tax-threshold-now-in-effect/",
      type: "government",
      publisher: "Jamaica Information Service (reporting Tax Administration Jamaica)",
      dateChecked: "2026-10-14",
      notes:
        "Threshold of JMD 1,902,360 from April 1, 2026, up from JMD 1,799,376.",
    },
    {
      title: "Jamaica - Individual - Taxes on personal income",
      url: "https://taxsummaries.pwc.com/jamaica/individual/taxes-on-personal-income",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used for resident/non-resident treatment and the 25% / 30% rates.",
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
        "This calculator uses the annual tax-free threshold of JMD 1,902,360 that Tax Administration Jamaica announced effective April 1, 2026 (up from JMD 1,799,376). Averaged over calendar 2026 the threshold works out to about JMD 1,876,614, and the Government's stated target is JMD 2,000,000.",
        "Income up to JMD 6 million is taxed at 25% after the tax-free threshold, and income above JMD 6 million is taxed at 30%; the 6 million boundary is measured on income before the threshold is deducted. This estimate does not model NIS, NHT, or education tax.",
      ],
      getAllowance: () => 1902360,
      getBrackets: () => [
        { upTo: 6000000 - 1902360, rate: 0.25 }, // the JMD 6,000,000 boundary is on income before the allowance (TAJ: 30% applies to aggregate income above 6 million)
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
      getAllowance: () => 1902360,
      getBrackets: () => [
        { upTo: 6000000 - 1902360, rate: 0.25 }, // the JMD 6,000,000 boundary is on income before the allowance (TAJ: 30% applies to aggregate income above 6 million)
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
      getAllowance: () => 1902360,
      getBrackets: () => [
        { upTo: 6000000 - 1902360, rate: 0.25 }, // the JMD 6,000,000 boundary is on income before the allowance (TAJ: 30% applies to aggregate income above 6 million)
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