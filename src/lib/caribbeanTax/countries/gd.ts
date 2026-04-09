// /lib/caribbeanTax/countries/gd.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const GD_TAX_CONFIG: CountryTaxConfig = {
  code: "GD",
  name: "Grenada",
  currency: "XCD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model NIS contributions, employer payroll costs, tax credits, or other non-income-tax obligations.",
  tags: ["progressive"],

  sources: [
    {
      title: "Grenada Inland Revenue Division - Income Tax",
      url: "https://ird.gd/taxes/income-tax",
      type: "tax_agency",
      publisher: "Inland Revenue Division, Grenada",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm chargeable income categories and threshold for individuals.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Grenada personal income tax is modeled as a standard progressive system.",
        "The Inland Revenue Division states that tax applies once employment income exceeds EC$36,000 annually and that assessable income includes business income, employment income, rentals, interest, annuities, and other gains or profits.",
        "This estimate does not attempt to model NIS or employer-side payroll obligations.",
      ],
      getAllowance: () => 36000,
      getBrackets: () => [
        { upTo: 24000, rate: 0.10 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Grenada Inland Revenue Division - Income Tax",
          url: "https://ird.gd/taxes/income-tax",
          type: "tax_agency",
          publisher: "Inland Revenue Division, Grenada",
          dateChecked: "2026-04-08",
          notes:
            "Supports EC$36,000 threshold and inclusion of employment, business, interest, rentals, annuities, and other gains in assessable income.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, remote or foreign-source income is modeled under the same progressive schedule as other personal income.",
        "Grenada's Inland Revenue summary lists broad categories of assessable income and does not support treating remote income as territorial zero-tax in this calculator.",
        "This is a conservative planning treatment pending more detailed source-by-source residency analysis.",
      ],
      getAllowance: () => 36000,
      getBrackets: () => [
        { upTo: 24000, rate: 0.10 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Grenada Inland Revenue Division - Income Tax",
          url: "https://ird.gd/taxes/income-tax",
          type: "tax_agency",
          publisher: "Inland Revenue Division, Grenada",
          dateChecked: "2026-04-08",
          notes:
            "Used as conservative support for treating broad personal income categories as taxable rather than exempt.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "Grenada's Inland Revenue summary specifically includes annuities and periodic receipts in assessable income.",
        "For planning purposes, retirement, pension, and similar non-working income is modeled using the same EC$36,000 threshold and progressive bands.",
        "This estimate does not attempt to model pension-specific exemptions or treaty relief.",
      ],
      getAllowance: () => 36000,
      getBrackets: () => [
        { upTo: 24000, rate: 0.10 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Grenada Inland Revenue Division - Income Tax",
          url: "https://ird.gd/taxes/income-tax",
          type: "tax_agency",
          publisher: "Inland Revenue Division, Grenada",
          dateChecked: "2026-04-08",
          notes:
            "Supports inclusion of annuities and periodic receipts in assessable income.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default GD_TAX_CONFIG;