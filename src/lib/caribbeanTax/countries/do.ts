// /lib/caribbeanTax/countries/do.ts

import type { CountryTaxConfig, SpecialComputeInput, SpecialComputeResult } from "../types";
import { TAX_YEAR_LABEL } from "../types";

function computeDoRemote(input: SpecialComputeInput): SpecialComputeResult {
  const gross = Math.max(0, input.grossAnnualIncome || 0)
  const residencyYears = input.answers?.do_residency_years ?? ""

  if (residencyYears === "under_3") {
    return {
      taxableIncome: gross,
      tax: 0,
      netIncome: gross,
      effectiveRate: 0,
      marginalRate: 0,
      lines: [
        {
          label: "Foreign-source income planning treatment",
          amount: 0,
        },
      ],
      notes: [
        "Dominican Republic remote income is being treated as exempt for planning purposes because you selected less than 3 years of tax residence.",
        "This is a simplified planning treatment for foreign-source remote income only.",
        "Foreign investments, financial gains, and source-characterization edge cases are not modeled here.",
      ],
      isDisclaimer: false,
    }
  }

  if (residencyYears === "3_or_more") {
    return {
      taxableIncome: gross,
      tax: 0,
      netIncome: gross,
      effectiveRate: 0,
      marginalRate: 0,
      lines: [],
      notes: [
        "You selected 3 years or more of tax residence in the Dominican Republic.",
        "This calculator does not yet compute a reliable Dominican Republic tax figure for long-term residents with foreign-source remote income.",
        "Foreign investments, financial gains, and source-characterization rules can change the outcome materially.",
      ],
      isDisclaimer: true,
    }
  }


  return {
    taxableIncome: gross,
    tax: 0,
    netIncome: gross,
    effectiveRate: 0,
    marginalRate: 0,
    lines: [],
    notes: [
      "Select your Dominican Republic tax residency length to improve this estimate.",
      "Until then, this remote-income result should be treated as informational only.",
    ],
  };
}

export const DO_TAX_CONFIG: CountryTaxConfig = {
  code: "DO",
  name: "Dominican Republic",
  currency: "DOP",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "partial",
  badgeLabel: "Territorial split",
  disclaimer:
    "This estimate covers personal income tax only. The Dominican Republic follows a territorial concept, but foreign investments, financial gains, and residency duration can materially change the result. This calculator simplifies those rules.",
  tags: ["territorial"],

  sources: [
    {
      title: "PwC Dominican Republic - Individual - Taxes on personal income",
      url: "https://taxsummaries.pwc.com/dominican-republic/individual/taxes-on-personal-income",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used for territorial treatment summary and annual personal income tax brackets.",
    },
    {
      title: "PwC Dominican Republic - Individual - Tax administration",
      url: "https://taxsummaries.pwc.com/dominican-republic/individual/tax-administration",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used to support filing treatment when salaries are paid outside local payroll.",
    },
  ],

  scenarios: {
    local: {
      kind: "territorial",
      confidence: "high",
      notes: [
        "The Dominican Republic follows a territorial concept, and Dominican-source income is subject to tax.",
        "For this calculator, local earned income is modeled using the published progressive annual brackets.",
        "This estimate does not model Christmas bonus exemptions or employer withholding specifics.",
      ],
      getAllowance: () => 416220,
      getBrackets: () => [
        { upTo: 624329, rate: 0.15 },
        { upTo: 867123, rate: 0.20 },
        { upTo: null, rate: 0.25 },
      ],
      sources: [
        {
          title: "PwC Dominican Republic - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/dominican-republic/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports DOP 416,220 threshold and 15% / 20% / 25% structure above it.",
        },
      ],
    },

    remote: {
      kind: "custom",
      confidence: "simplified",
      notes: [
        "Remote or foreign-source income in the Dominican Republic depends on residency duration and source characterization.",
        "This scenario uses a custom planning rule instead of the generic territorial branch.",
      ],
      compute: computeDoRemote,
      sources: [
        {
          title: "PwC Dominican Republic - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/dominican-republic/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports the 3-year residency distinction and the territorial-style treatment caveats.",
        },
      ],
    },

    retired: {
      kind: "territorial",
      confidence: "simplified",
      notes: [
        "Retirement and foreign passive-income planning in the Dominican Republic is simplified here under the territorial concept.",
        "Foreign-source retirement income is generally treated as not taxed for planning purposes, but foreign investments and financial gains can still be taxable and the exact treatment may depend on residency duration and source characterization.",
        "This scenario should be shown with caution in the UI.",
      ],
      sources: [
        {
          title: "PwC Dominican Republic - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/dominican-republic/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Used as high-level support for territorial treatment, with important caveats preserved in notes.",
        },
      ],
    },
  },

  conditionalQuestions: [
    {
      id: "do_residency_years",
      showWhen: {
        scenario: "remote",
        countryCode: "DO",
      },
      question: "How long have you been a tax resident in the Dominican Republic?",
      options: [
        { label: "Less than 3 years", value: "under_3" },
        { label: "3 years or more", value: "3_or_more" },
      ],
    },
  ],
};

export default DO_TAX_CONFIG;