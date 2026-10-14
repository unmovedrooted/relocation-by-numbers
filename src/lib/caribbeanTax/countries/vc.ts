// /lib/caribbeanTax/countries/vc.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const VC_TAX_CONFIG: CountryTaxConfig = {
  code: "VC",
  name: "Saint Vincent and the Grenadines",
  currency: "XCD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model NIS contributions, employer payroll costs, withholding tax on non-resident services, or other non-income-tax obligations.",
  tags: ["progressive"],

  sources: [
    {
      title: "2023 PAYE tax tables announcement",
      url: "https://www.gov.vc/index.php/media-center/2986-2023-paye-tax-tables",
      type: "government",
      publisher: "Government of Saint Vincent and the Grenadines",
      dateChecked: "2026-10-14",
      notes:
        "The maximum personal income tax rate was reduced from 30% to 28% from 1 January 2023 (the earlier file used 30%). The 2026 budget raised the personal income tax threshold, but no new figure was found, so the XCD 25,000 allowance and the lower bands may be out of date.",
    },
    {
      title: "Saint Vincent and the Grenadines Inland Revenue Department - Taxes",
      url: "https://ird.gov.vc/index.php/taxes",
      type: "tax_agency",
      publisher: "Inland Revenue Department, Saint Vincent and the Grenadines",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm that PIT applies to income from sources in or out of SVG.",
    },
    {
      title: "Saint Vincent and the Grenadines Inland Revenue Department - Standard Deduction",
      url: "https://ird.gov.vc/index.php/rates/standard-deduction",
      type: "tax_agency",
      publisher: "Inland Revenue Department, Saint Vincent and the Grenadines",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm current standard deduction of XCD 25,000 for 2025 and 2024.",
    },
    {
      title: "KPMG Individual Income Tax Rates Table",
      url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
      type: "tax_firm",
      publisher: "KPMG",
      dateChecked: "2026-04-08",
      notes:
        "Used for the personal rate schedule snippet and to support top-rate treatment.",
    },
    {
      title: "Saint Vincent and the Grenadines: Various direct and indirect tax rate cuts announced",
      url: "https://kpmg.com/us/en/taxnewsflash/news/2025/12/saint-vincent-grenadines-direct-indirect-rate-cuts-announced.html",
      type: "tax_firm",
      publisher: "KPMG",
      dateChecked: "2026-04-08",
      notes:
        "Used to support that the individual threshold increased for 2026.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Saint Vincent and the Grenadines taxes personal income from sources in or out of the country, so this calculator does not treat it as a territorial zero-tax jurisdiction for remote income.",
        "For planning purposes, local earned income is modeled with a XCD 25,000 standard deduction and progressive bands of 10%, 20%, and 28%.",
        "This estimate does not attempt to model NIS, specific exempt income categories, or payroll-side employer obligations.",
      ],
      getAllowance: () => 25000,
      getBrackets: () => [
        { upTo: 5000, rate: 0.10 },
        { upTo: 10000, rate: 0.20 },
        { upTo: null, rate: 0.28 },
      ],
      sources: [
        {
          title: "Saint Vincent and the Grenadines Inland Revenue Department - Taxes",
          url: "https://ird.gov.vc/index.php/taxes",
          type: "tax_agency",
          publisher: "Inland Revenue Department, Saint Vincent and the Grenadines",
          dateChecked: "2026-04-08",
          notes:
            "Supports taxation of income from sources in or out of SVG.",
        },
        {
          title: "Saint Vincent and the Grenadines Inland Revenue Department - Standard Deduction",
          url: "https://ird.gov.vc/index.php/rates/standard-deduction",
          type: "tax_agency",
          publisher: "Inland Revenue Department, Saint Vincent and the Grenadines",
          dateChecked: "2026-04-08",
          notes:
            "Supports XCD 25,000 standard deduction.",
        },
        {
          title: "KPMG Individual Income Tax Rates Table",
          url: "https://kpmg.com/vg/en/home/services/tax1/tax-tools-and-resources/tax-rates-online/individual-income-tax-rates-table.html",
          type: "tax_firm",
          publisher: "KPMG",
          dateChecked: "2026-04-08",
          notes:
            "Supports the 10% / 20% structure; the top rate is now 28% (gov.vc 2023 announcement).",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Saint Vincent and the Grenadines is not modeled as territorial for remote income.",
        "The Inland Revenue Department states that personal income tax applies to income from sources in or out of Saint Vincent and the Grenadines, so foreign-source or remote income is run through the same progressive schedule for planning purposes.",
        "This estimate does not attempt to model treaty interactions, foreign tax credits, or non-resident withholding edge cases.",
      ],
      getAllowance: () => 25000,
      getBrackets: () => [
        { upTo: 5000, rate: 0.10 },
        { upTo: 10000, rate: 0.20 },
        { upTo: null, rate: 0.28 },
      ],
      sources: [
        {
          title: "Saint Vincent and the Grenadines Inland Revenue Department - Taxes",
          url: "https://ird.gov.vc/index.php/taxes",
          type: "tax_agency",
          publisher: "Inland Revenue Department, Saint Vincent and the Grenadines",
          dateChecked: "2026-04-08",
          notes:
            "Supports taxation of income from sources in or out of SVG.",
        },
        {
          title: "Saint Vincent and the Grenadines Inland Revenue Department - Standard Deduction",
          url: "https://ird.gov.vc/index.php/rates/standard-deduction",
          type: "tax_agency",
          publisher: "Inland Revenue Department, Saint Vincent and the Grenadines",
          dateChecked: "2026-04-08",
          notes:
            "Supports XCD 25,000 standard deduction used in the estimate.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "The Inland Revenue Department explicitly lists qualifying pensioners among persons who should pay personal income tax.",
        "For planning purposes, retirement and pension income is modeled with the same XCD 25,000 standard deduction and progressive bands used for other resident income.",
        "This estimate does not attempt to model pension-specific exemptions or special relief beyond the standard deduction.",
      ],
      getAllowance: () => 25000,
      getBrackets: () => [
        { upTo: 5000, rate: 0.10 },
        { upTo: 10000, rate: 0.20 },
        { upTo: null, rate: 0.28 },
      ],
      sources: [
        {
          title: "Saint Vincent and the Grenadines Inland Revenue Department - Taxes",
          url: "https://ird.gov.vc/index.php/taxes",
          type: "tax_agency",
          publisher: "Inland Revenue Department, Saint Vincent and the Grenadines",
          dateChecked: "2026-04-08",
          notes:
            "Supports inclusion of qualifying pensioners in the PIT base.",
        },
        {
          title: "Saint Vincent and the Grenadines Inland Revenue Department - Standard Deduction",
          url: "https://ird.gov.vc/index.php/rates/standard-deduction",
          type: "tax_agency",
          publisher: "Inland Revenue Department, Saint Vincent and the Grenadines",
          dateChecked: "2026-04-08",
          notes:
            "Supports XCD 25,000 standard deduction used in the estimate.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default VC_TAX_CONFIG;