// /lib/caribbeanTax/countries/dm.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const DM_TAX_CONFIG: CountryTaxConfig = {
  code: "DM",
  name: "Dominica",
  currency: "XCD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "Moderate confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model social security contributions, employer payroll costs, detailed deductions beyond the resident allowance, or other non-income-tax obligations.",
  tags: ["progressive"],

  sources: [
    {
      title: "Dominica Inland Revenue Division - Personal Income Tax",
      url: "https://ird.gov.dm/tax-laws/personal-income-tax",
      type: "tax_agency",
      publisher: "Inland Revenue Division, Dominica",
      dateChecked: "2026-04-08",
      notes:
        "Used for residency test, resident allowance, and official filing guidance.",
    },
    {
      title: "KPMG Individual Income Tax Rates Table",
      url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
      type: "tax_firm",
      publisher: "KPMG",
      dateChecked: "2026-04-08",
      notes:
        "Used for current Dominica resident allowance and progressive rate schedule.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Dominica resident individuals are modeled with the standard resident allowance and progressive personal income tax rates.",
        "The official Inland Revenue page states that resident individuals must furnish returns and that income from different sources must be totalled before allowable deductions are claimed.",
        "This estimate does not attempt to model mortgage interest relief, student loan relief, donation deductions, or payroll-side obligations.",
      ],
      getAllowance: () => 30000,
      getBrackets: () => [
        { upTo: 20000, rate: 0.15 },
        { upTo: 50000, rate: 0.25 },
        { upTo: null, rate: 0.35 },
      ],
      sources: [
        {
          title: "Dominica Inland Revenue Division - Personal Income Tax",
          url: "https://ird.gov.dm/tax-laws/personal-income-tax",
          type: "tax_agency",
          publisher: "Inland Revenue Division, Dominica",
          dateChecked: "2026-04-08",
          notes:
            "Supports resident allowance and treatment of income from multiple sources.",
        },
        {
          title: "KPMG Individual Income Tax Rates Table",
          url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
          type: "tax_firm",
          publisher: "KPMG",
          dateChecked: "2026-04-08",
          notes:
            "Supports XCD 30,000 resident allowance with 15% / 25% / 35% brackets.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, remote or foreign-source income is modeled through the same resident personal income tax schedule used for local earned income.",
        "Dominica's official personal income tax page confirms resident filing obligations and aggregation of income from different sources, but it does not spell out foreign-source remote income treatment as explicitly as some jurisdictions do.",
        "This scenario is therefore modeled conservatively rather than treated as territorial or zero-tax.",
      ],
      getAllowance: () => 30000,
      getBrackets: () => [
        { upTo: 20000, rate: 0.15 },
        { upTo: 50000, rate: 0.25 },
        { upTo: null, rate: 0.35 },
      ],
      sources: [
        {
          title: "Dominica Inland Revenue Division - Personal Income Tax",
          url: "https://ird.gov.dm/tax-laws/personal-income-tax",
          type: "tax_agency",
          publisher: "Inland Revenue Division, Dominica",
          dateChecked: "2026-04-08",
          notes:
            "Used for resident filing rules and aggregation of income from different sources.",
        },
        {
          title: "KPMG Individual Income Tax Rates Table",
          url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
          type: "tax_firm",
          publisher: "KPMG",
          dateChecked: "2026-04-08",
          notes:
            "Supports the bracket schedule used for conservative planning treatment.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled under the same resident personal income tax schedule.",
        "The official Dominica page lists annuities among income types and confirms resident filing obligations, but this simplified estimate does not attempt to model pension-specific relief or special exemptions.",
        "Use this as a planning estimate rather than a pension-specialist calculation.",
      ],
      getAllowance: () => 30000,
      getBrackets: () => [
        { upTo: 20000, rate: 0.15 },
        { upTo: 50000, rate: 0.25 },
        { upTo: null, rate: 0.35 },
      ],
      sources: [
        {
          title: "Dominica Inland Revenue Division - Personal Income Tax",
          url: "https://ird.gov.dm/tax-laws/personal-income-tax",
          type: "tax_agency",
          publisher: "Inland Revenue Division, Dominica",
          dateChecked: "2026-04-08",
          notes:
            "Supports resident filing obligations and inclusion of annuities among taxable income types.",
        },
        {
          title: "KPMG Individual Income Tax Rates Table",
          url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
          type: "tax_firm",
          publisher: "KPMG",
          dateChecked: "2026-04-08",
          notes:
            "Supports the resident allowance and progressive rate schedule used in this estimate.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default DM_TAX_CONFIG;