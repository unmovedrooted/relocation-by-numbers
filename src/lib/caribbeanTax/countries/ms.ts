// /lib/caribbeanTax/countries/ms.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const MS_TAX_CONFIG: CountryTaxConfig = {
  code: "MS",
  name: "Montserrat",
  currency: "XCD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "partial",
  badgeLabel: "Moderate confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model social security contributions, employer payroll costs, treaty relief, or other non-income-tax obligations. Montserrat's public rate summaries should be re-checked directly against the current legislation before final launch.",
  tags: ["progressive"],

  sources: [
    {
      title: "Doing Business on Montserrat",
      url: "https://www.invest.gov.ms/doing-business-on-montserrat",
      type: "official_program",
      publisher: "Invest Montserrat",
      dateChecked: "2026-04-08",
      notes:
        "Used for the public PIT summary and published progressive rates.",
    },
    {
      title: "Citizen's Guide to the Budget 2024-2025",
      url: "https://www.gov.ms/wp-content/uploads/2024/05/Citizens-Guide-to-the-Budget-2024-2025.pdf",
      type: "government",
      publisher: "Government of Montserrat",
      dateChecked: "2026-04-08",
      notes:
        "Search snippet indicates the tax-free personal threshold increased from XCD 15,000 to XCD 18,000.",
    },
    {
      title: "2025/26 Budget Speech",
      url: "https://www.gov.ms/wp-content/uploads/2025/04/2025-26-Budget-Speech-FINAL.pdf",
      type: "government",
      publisher: "Government of Montserrat",
      dateChecked: "2026-04-08",
      notes:
        "Search snippet indicates an additional income tax allowance was introduced, but not enough detail was available to model it reliably here.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "Montserrat personal income tax is modeled as a standard progressive system for planning purposes.",
        "This calculator uses a XCD 18,000 personal allowance based on the published government budget guide update.",
        "Public summaries indicate progressive rates of 10%, 20%, and 30%, but the published band wording is not clean enough to treat this file as fully final yet.",
      ],
      getAllowance: () => 18000,
      getBrackets: () => [
        { upTo: 18000, rate: 0.10 },
        { upTo: 30000, rate: 0.20 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Doing Business on Montserrat",
          url: "https://www.invest.gov.ms/doing-business-on-montserrat",
          type: "official_program",
          publisher: "Invest Montserrat",
          dateChecked: "2026-04-08",
          notes:
            "Supports progressive PIT treatment and published 10% / 20% / 30% rate summary.",
        },
        {
          title: "Citizen's Guide to the Budget 2024-2025",
          url: "https://www.gov.ms/wp-content/uploads/2024/05/Citizens-Guide-to-the-Budget-2024-2025.pdf",
          type: "government",
          publisher: "Government of Montserrat",
          dateChecked: "2026-04-08",
          notes:
            "Supports increase of the tax-free personal threshold from XCD 15,000 to XCD 18,000.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "For planning purposes, remote or foreign-source income is modeled using the same progressive resident schedule as local earned income.",
        "A public Montserrat investment page states that personal income tax applies to both residents and non-residents, but detailed source rules were not confirmed cleanly enough to treat this as a territorial or specially exempt scenario.",
        "This is a conservative estimate and should be revisited once the current legislation is directly verified line by line.",
      ],
      getAllowance: () => 18000,
      getBrackets: () => [
        { upTo: 18000, rate: 0.10 },
        { upTo: 30000, rate: 0.20 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Doing Business on Montserrat",
          url: "https://www.invest.gov.ms/doing-business-on-montserrat",
          type: "official_program",
          publisher: "Invest Montserrat",
          dateChecked: "2026-04-08",
          notes:
            "Supports PIT applying to both residents and non-residents and provides the public rate summary.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled under the same progressive schedule used for resident personal income tax.",
        "A 2025 budget speech snippet indicates an additional allowance may exist, but there was not enough verified detail to model that extra relief safely here.",
        "Use this as a planning estimate rather than a specialist retirement tax determination.",
      ],
      getAllowance: () => 18000,
      getBrackets: () => [
        { upTo: 18000, rate: 0.10 },
        { upTo: 30000, rate: 0.20 },
        { upTo: null, rate: 0.30 },
      ],
      sources: [
        {
          title: "Citizen's Guide to the Budget 2024-2025",
          url: "https://www.gov.ms/wp-content/uploads/2024/05/Citizens-Guide-to-the-Budget-2024-2025.pdf",
          type: "government",
          publisher: "Government of Montserrat",
          dateChecked: "2026-04-08",
          notes:
            "Supports the XCD 18,000 threshold used in this estimate.",
        },
        {
          title: "2025/26 Budget Speech",
          url: "https://www.gov.ms/wp-content/uploads/2025/04/2025-26-Budget-Speech-FINAL.pdf",
          type: "government",
          publisher: "Government of Montserrat",
          dateChecked: "2026-04-08",
          notes:
            "Search snippet suggests an additional allowance, but no reliable modeling detail was extracted.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default MS_TAX_CONFIG;