// /lib/caribbeanTax/countries/bq-se.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const BQ_SE_TAX_CONFIG: CountryTaxConfig = {
  code: "BQ-SE",
  name: "Sint Eustatius",
  currency: "USD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers BES income tax only. It does not separately model AOV, AWW, healthcare employee contributions, mortgage-interest limitations, or other non-income-tax obligations.",
  tags: ["progressive", "bes"],

  sources: [
    {
      title: "Income tax – rates and tax-free amounts",
      url: "https://english.belastingdienst-cn.nl/topics/tax-individuals/income-tax/income-tax-rates-and-tax-free-amounts",
      type: "tax_agency",
      publisher: "Belastingdienst Caribisch Nederland",
      dateChecked: "2026-04-08",
      notes:
        "Used for 2026 BES rates, threshold, and tax-free sum.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Sint Eustatius personal income tax is modeled using the official 2026 BES rate schedule.",
        "This calculator uses a USD 21,956 tax-free sum, then applies 29.4% up to USD 53,198 and 38.4% above that.",
        "This estimate does not separately model BES social-insurance contributions.",
      ],
      getAllowance: () => 21956,
      getBrackets: () => [
        { upTo: 53198, rate: 0.294 },
        { upTo: null, rate: 0.384 },
      ],
      sources: [
        {
          title: "Income tax – rates and tax-free amounts",
          url: "https://english.belastingdienst-cn.nl/topics/tax-individuals/income-tax/income-tax-rates-and-tax-free-amounts",
          type: "tax_agency",
          publisher: "Belastingdienst Caribisch Nederland",
          dateChecked: "2026-04-08",
          notes:
            "Supports 2026 BES rates and tax-free sum.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, remote or foreign-source income is modeled under the same BES progressive resident schedule.",
        "This file does not yet add a country-specific foreign-source exemption model for Sint Eustatius.",
        "Use this as a conservative resident planning estimate.",
      ],
      getAllowance: () => 21956,
      getBrackets: () => [
        { upTo: 53198, rate: 0.294 },
        { upTo: null, rate: 0.384 },
      ],
      sources: [
        {
          title: "Income tax – rates and tax-free amounts",
          url: "https://english.belastingdienst-cn.nl/topics/tax-individuals/income-tax/income-tax-rates-and-tax-free-amounts",
          type: "tax_agency",
          publisher: "Belastingdienst Caribisch Nederland",
          dateChecked: "2026-04-08",
          notes:
            "Supports the official resident BES rate structure used here for conservative planning.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled under the same BES progressive resident schedule.",
        "This file does not yet model pension-specific BES treatment or age-linked contribution differences.",
        "Use this as a conservative planning estimate.",
      ],
      getAllowance: () => 21956,
      getBrackets: () => [
        { upTo: 53198, rate: 0.294 },
        { upTo: null, rate: 0.384 },
      ],
      sources: [
        {
          title: "Income tax – rates and tax-free amounts",
          url: "https://english.belastingdienst-cn.nl/topics/tax-individuals/income-tax/income-tax-rates-and-tax-free-amounts",
          type: "tax_agency",
          publisher: "Belastingdienst Caribisch Nederland",
          dateChecked: "2026-04-08",
          notes:
            "Supports the 2026 BES PIT structure used for this estimate.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default BQ_SE_TAX_CONFIG;