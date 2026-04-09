// /lib/caribbeanTax/countries/ag.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const AG_TAX_CONFIG: CountryTaxConfig = {
  code: "AG",
  name: "Antigua and Barbuda",
  currency: "XCD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model employer payroll costs, corporate taxes, immigration requirements, or other non-income-tax obligations.",
  tags: ["zero_tax"],

  sources: [
    {
      title: "KPMG Individual Income Tax Rates Table",
      url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
      type: "tax_firm",
      publisher: "KPMG",
      dateChecked: "2026-04-08",
      notes: "Used to confirm no personal income tax in Antigua and Barbuda.",
    },
  ],

  scenarios: {
    local: {
      kind: "none",
      confidence: "high",
      notes: [
        "Antigua and Barbuda does not levy personal income tax under this calculator's planning model.",
        "Local earned employment or self-employment income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model non-income taxes, business taxes, payroll-side employer costs, or sector-specific levies.",
      ],
      sources: [
        {
          title: "KPMG Individual Income Tax Rates Table",
          url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
          type: "tax_firm",
          publisher: "KPMG",
          dateChecked: "2026-04-08",
          notes: "Supports zero personal income tax treatment for local earned income.",
        },
      ],
    },

    remote: {
      kind: "none",
      confidence: "high",
      notes: [
        "Antigua and Barbuda does not levy personal income tax under this calculator's planning model.",
        "Foreign-source or remote income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model immigration, work-permit, or non-income-tax obligations.",
      ],
      sources: [
        {
          title: "KPMG Individual Income Tax Rates Table",
          url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
          type: "tax_firm",
          publisher: "KPMG",
          dateChecked: "2026-04-08",
          notes: "Supports zero personal income tax treatment for remote or foreign-source income.",
        },
      ],
    },

    retired: {
      kind: "none",
      confidence: "high",
      notes: [
        "Antigua and Barbuda does not levy personal income tax under this calculator's planning model.",
        "Retirement, pension, or similar non-working income is treated as not subject to personal income tax.",
        "This estimate does not attempt to model estate planning, wealth taxes, or other non-income-tax charges.",
      ],
      sources: [
        {
          title: "KPMG Individual Income Tax Rates Table",
          url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
          type: "tax_firm",
          publisher: "KPMG",
          dateChecked: "2026-04-08",
          notes: "Supports zero personal income tax treatment for retirement-style income.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default AG_TAX_CONFIG;