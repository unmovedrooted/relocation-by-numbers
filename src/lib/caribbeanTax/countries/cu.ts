// /lib/caribbeanTax/countries/cu.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const CU_TAX_CONFIG: CountryTaxConfig = {
  code: "CU",
  name: "Cuba",
  currency: "CUP",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "partial",
  badgeLabel: "Simplified estimate",
  disclaimer:
    "This estimate covers personal income tax only. Cuba's official figures (Law 174 of 2025, article 65, via state media) are an exempt minimum of CUP 39,120, ten brackets starting at 5% on the first CUP 25,000 of taxable income and rising to 50% above CUP 1,000,000. The middle brackets were not available in text, so the bands between are a simplified planning model. Check the ONAT DJ 08 model for the exact scale.",
  tags: ["progressive"],

  sources: [
    {
      title: "Conozca sobre la nueva escala progresiva (Juventud Rebelde)",
      url: "https://www.juventudrebelde.cu/cuba/2025-01-04/conozca-sobre-la-nueva-escala-progresiva-para-la-declaracion-jurada-del-impuesto-sobre-ingresos-personales",
      type: "secondary_summary",
      publisher: "Juventud Rebelde (state newspaper), citing ONAT and Law 174 of 2025",
      dateChecked: "2026-10-14",
      notes:
        "States the exempt minimum of CUP 39,120, the maximum rate of 50% and that the scale applies to 2024 income; the bracket table itself is not in the text.",
    },
    {
      title: "Conozca los resultados de la campaña de declaración jurada",
      url: "https://www.onat.gob.cu/home/noticias/366",
      type: "tax_agency",
      publisher: "ONAT",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm that a new progressive scale for personal income tax was established.",
    },
    {
      title: "Portal Tributario - Preguntas frecuentes",
      url: "https://www.onat.gob.cu/home/preguntas?page=3",
      type: "tax_agency",
      publisher: "ONAT",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm that employees of self-employed workers are taxed under a progressive personal income tax schedule.",
    },
    {
      title: "Lo que usted debe saber de la nueva escala progresiva",
      url: "https://www.onat.gob.cu/home/noticias/320",
      type: "tax_agency",
      publisher: "ONAT",
      dateChecked: "2026-04-08",
      notes:
        "Used as additional official support that the progressive scale was updated.",
    },
  ],

  scenarios: {
    local: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "Cuba local earned income is modeled as a progressive personal income tax system.",
        "The CUP 39,120 exempt minimum, the 5% start on the first CUP 25,000 and the 50% top rate above CUP 1,000,000 come from Law 174 as reported by state media; the middle brackets are simplified.",
        "For planning purposes, this calculator uses a simplified progressive schedule and should be treated as an estimate, not a final statutory computation.",
      ],
      getAllowance: () => 39120,
      getBrackets: () => [
        { upTo: 25000, rate: 0.05 },
        { upTo: 100000, rate: 0.10 },
        { upTo: 200000, rate: 0.15 },
        { upTo: 500000, rate: 0.20 },
        { upTo: 1000000, rate: 0.30 },
        { upTo: null, rate: 0.50 },
      ],
      sources: [
        {
          title: "Conozca los resultados de la campaña de declaración jurada",
          url: "https://www.onat.gob.cu/home/noticias/366",
          type: "tax_agency",
          publisher: "ONAT",
          dateChecked: "2026-04-08",
          notes:
            "Supports existence of a new progressive personal income tax scale.",
        },
        {
          title: "Portal Tributario - Preguntas frecuentes",
          url: "https://www.onat.gob.cu/home/preguntas?page=3",
          type: "tax_agency",
          publisher: "ONAT",
          dateChecked: "2026-04-08",
          notes:
            "Supports progressive taxation of employment-related personal income.",
        },
      ],
    },

    remote: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "For planning purposes, remote or foreign-source income is modeled under the same simplified progressive personal income tax schedule.",
        "The official materials reviewed confirm a progressive personal income tax framework, but they did not cleanly confirm a separate territorial or remote-income exemption model for this calculator.",
        "This is a conservative estimate and should be re-checked if you later model Cuba's residency and foreign-source rules in more detail.",
      ],
      getAllowance: () => 39120,
      getBrackets: () => [
        { upTo: 25000, rate: 0.05 },
        { upTo: 100000, rate: 0.10 },
        { upTo: 200000, rate: 0.15 },
        { upTo: 500000, rate: 0.20 },
        { upTo: 1000000, rate: 0.30 },
        { upTo: null, rate: 0.50 },
      ],
      sources: [
        {
          title: "Lo que usted debe saber de la nueva escala progresiva",
          url: "https://www.onat.gob.cu/home/noticias/320",
          type: "tax_agency",
          publisher: "ONAT",
          dateChecked: "2026-04-08",
          notes:
            "Supports that Cuba's personal income tax operates with an updated progressive scale.",
        },
      ],
    },

    retired: {
      kind: "progressive",
      confidence: "simplified",
      notes: [
        "For planning purposes, retirement, pension, and similar non-working income is modeled using the same simplified progressive personal income tax schedule.",
        "The official materials reviewed did not provide a clear pension-specific exemption map suitable for live calculator logic.",
        "Use this as a planning estimate rather than a specialist retirement tax determination.",
      ],
      getAllowance: () => 39120,
      getBrackets: () => [
        { upTo: 25000, rate: 0.05 },
        { upTo: 100000, rate: 0.10 },
        { upTo: 200000, rate: 0.15 },
        { upTo: 500000, rate: 0.20 },
        { upTo: 1000000, rate: 0.30 },
        { upTo: null, rate: 0.50 },
      ],
      sources: [
        {
          title: "Conozca los resultados de la campaña de declaración jurada",
          url: "https://www.onat.gob.cu/home/noticias/366",
          type: "tax_agency",
          publisher: "ONAT",
          dateChecked: "2026-04-08",
          notes:
            "Used as official support for the progressive personal income tax framework.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default CU_TAX_CONFIG;