// /lib/caribbeanTax/countries/bb.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const BB_TAX_CONFIG: CountryTaxConfig = {
  code: "BB",
  name: "Barbados",
  currency: "BBD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "complete",
  badgeLabel: "High confidence",
  disclaimer:
    "This estimate covers personal income tax only. It does not model NIS contributions, employer payroll costs, tax credits such as the Compensatory Income Credit or Reverse Tax Credit, or other non-income-tax obligations.",
  tags: ["progressive"],

  sources: [
    {
      title: "PwC Barbados 2026/2027 Budget Insights",
      url: "https://www.pwc.com/bb/en/publications/assets/barbados-2026-2027-budget.pdf",
      type: "tax_firm",
      publisher: "PwC Barbados",
      dateChecked: "2026-04-08",
      notes:
        "Used for 2026 personal income tax rate reductions and pensioner allowance changes.",
    },
    {
      title: "PwC Barbados - Individual - Taxes on personal income",
      url: "https://taxsummaries.pwc.com/barbados/individual/taxes-on-personal-income",
      type: "tax_firm",
      publisher: "PwC",
      dateChecked: "2026-04-08",
      notes:
        "Used for residency and worldwide-income treatment summary.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "high",
      notes: [
        "Barbados taxes resident individuals on worldwide income in the standard case.",
        "For this calculator, local earned income uses the 2026 reduced personal income tax rates announced in the 2026/2027 budget.",
        "This estimate does not model NIS, tax credits, or employer-side payroll costs.",
      ],
      getAllowance: () => 25000,
      getBrackets: () => [
        { upTo: 50000, rate: 0.115 },
        { upTo: null, rate: 0.275 },
      ],
      sources: [
        {
          title: "PwC Barbados 2026/2027 Budget Insights",
          url: "https://www.pwc.com/bb/en/publications/assets/barbados-2026-2027-budget.pdf",
          type: "tax_firm",
          publisher: "PwC Barbados",
          dateChecked: "2026-04-08",
          notes:
            "Supports BBD 25,000 allowance and 11.5% / 27.5% 2026 rates.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "Barbados is not modeled as territorial in this calculator.",
        "Resident and domiciled individuals are generally taxed on worldwide income; resident but not domiciled individuals can still be taxed on foreign-source income to the extent a benefit is obtained in Barbados.",
        "For planning purposes, foreign-source or remote income is run through the same progressive schedule as local earned income unless a more specific residency profile is modeled later.",
      ],
      getAllowance: () => 25000,
      getBrackets: () => [
        { upTo: 50000, rate: 0.115 },
        { upTo: null, rate: 0.275 },
      ],
      sources: [
        {
          title: "PwC Barbados - Individual - Taxes on personal income",
          url: "https://taxsummaries.pwc.com/barbados/individual/taxes-on-personal-income",
          type: "tax_firm",
          publisher: "PwC",
          dateChecked: "2026-04-08",
          notes:
            "Supports non-territorial treatment and worldwide-income summary.",
        },
        {
          title: "PwC Barbados 2026/2027 Budget Insights",
          url: "https://www.pwc.com/bb/en/publications/assets/barbados-2026-2027-budget.pdf",
          type: "tax_firm",
          publisher: "PwC Barbados",
          dateChecked: "2026-04-08",
          notes:
            "Supports 2026 reduced rates used for planning.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "moderate",
      notes: [
        "Barbados applies income tax to pension income under the general system, but the 2026/2027 budget increased the taxable allowance for pensioners.",
        "For this calculator, retirement and pension income is modeled with a BBD 75,000 allowance and the 2026 reduced personal rates above that threshold.",
        "This estimate does not model special credits, trust exemptions, or other individual-specific reliefs.",
      ],
      getAllowance: () => 75000,
      getBrackets: () => [
        { upTo: 50000, rate: 0.115 },
        { upTo: null, rate: 0.275 },
      ],
      sources: [
        {
          title: "PwC Barbados 2026/2027 Budget Insights",
          url: "https://www.pwc.com/bb/en/publications/assets/barbados-2026-2027-budget.pdf",
          type: "tax_firm",
          publisher: "PwC Barbados",
          dateChecked: "2026-04-08",
          notes:
            "Supports increase of pensioner taxable allowance to BBD 75,000 and continued use of reduced personal rates.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default BB_TAX_CONFIG;