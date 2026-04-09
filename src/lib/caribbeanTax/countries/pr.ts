// /lib/caribbeanTax/countries/pr.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const PR_TAX_CONFIG: CountryTaxConfig = {
  code: "PR",
  name: "Puerto Rico",
  currency: "USD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "partial",
  badgeLabel: "Complex system",
  disclaimer:
    "Puerto Rico has a complex resident and non-resident individual income tax system with progressive rates, special investment rules, and additional adjustment tax. This calculator does not yet compute a reliable Puerto Rico personal income tax figure.",
  tags: ["us_linked", "custom_pending"],

  sources: [
    {
      title: "Puerto Rico - Individual - Taxes on personal income",
      url: "https://taxsummaries.pwc.com/puerto-rico/individual/taxes-on-personal-income",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm the progressive PIT system and gradual adjustment tax.",
    },
    {
      title: "Puerto Rico - Individual - Income determination",
      url: "https://taxsummaries.pwc.com/puerto-rico/individual/income-determination",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used to support the complexity of resident/non-resident and investment-income treatment.",
    },
  ],

  scenarios: {
    local: {
      kind: "pending",
      confidence: "pending",
      notes: [
        "Puerto Rico has a progressive personal income tax system with multiple layers, including gradual adjustment tax.",
        "This calculator does not yet model Puerto Rico's local earned income accurately enough for a live numeric estimate.",
        "A future version should use a dedicated compute path rather than a generic progressive shortcut.",
      ],
      sources: [
        {
          title: "Puerto Rico - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/puerto-rico/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the complexity of the Puerto Rico local PIT regime.",
        },
      ],
    },

    remote: {
      kind: "pending",
      confidence: "pending",
      notes: [
        "Remote or foreign-source income in Puerto Rico depends heavily on residency, source, and special rule interactions.",
        "This calculator does not yet model Puerto Rico's remote or foreign-source income accurately enough for a live numeric estimate.",
        "A future version should use a dedicated compute path rather than a generic progressive shortcut.",
      ],
      sources: [
        {
          title: "Puerto Rico - Individual - Income determination",
          url: "https://taxsummaries.pwc.com/puerto-rico/individual/income-determination",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the complexity of source and investment-income treatment in Puerto Rico.",
        },
      ],
    },

    retired: {
      kind: "pending",
      confidence: "pending",
      notes: [
        "Retirement and investment income in Puerto Rico can interact with residency, source rules, and special tax provisions.",
        "This calculator does not yet model Puerto Rico retirement-style income accurately enough for a live numeric estimate.",
        "A future version should use a dedicated compute path rather than a generic progressive shortcut.",
      ],
      sources: [
        {
          title: "Puerto Rico - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/puerto-rico/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the need for a dedicated Puerto Rico model.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default PR_TAX_CONFIG;