// /lib/caribbeanTax/countries/vi.ts

import type { CountryTaxConfig } from "../types";
import { TAX_YEAR_LABEL } from "../types";

export const VI_TAX_CONFIG: CountryTaxConfig = {
  code: "VI",
  name: "U.S. Virgin Islands",
  currency: "USD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "partial",
  badgeLabel: "Mirror-code system",
  disclaimer:
    "The U.S. Virgin Islands uses a mirror-code income tax system based on the U.S. Internal Revenue Code. This destination is included for classification and disclosure, but this calculator does not yet compute a reliable USVI personal income tax figure.",
  tags: ["us_linked", "mirror_code"],

  sources: [
    {
      title: "Tax Structure Booklet of the U.S. Virgin Islands",
      url: "https://bir.vi.gov/content/booklets/tax_structure.pdf",
      type: "tax_agency",
      publisher: "Virgin Islands Bureau of Internal Revenue",
      dateChecked: "2026-04-08",
      notes:
        "Used to confirm that the IRC applies in the Virgin Islands under the mirror system.",
    },
    {
      title: "Instructions for Form 8689",
      url: "https://www.irs.gov/pub/irs-pdf/f8689.pdf",
      type: "tax_agency",
      publisher: "Internal Revenue Service",
      dateChecked: "2026-04-08",
      notes:
        "Used to support income tax allocation between the United States and the USVI.",
    },
  ],

  scenarios: {
    local: {
      kind: "us_mirror",
      confidence: "moderate",
      notes: [
        "The U.S. Virgin Islands applies the Internal Revenue Code under a mirror-code system.",
        "This calculator does not yet model the full USVI mirror-code personal income tax computation.",
        "Use this destination as a classified placeholder until a dedicated USVI compute path is added.",
      ],
      sources: [
        {
          title: "Tax Structure Booklet of the U.S. Virgin Islands",
          url: "https://bir.vi.gov/content/booklets/tax_structure.pdf",
          type: "tax_agency",
          publisher: "Virgin Islands Bureau of Internal Revenue",
          dateChecked: "2026-04-08",
          notes:
            "Supports mirror-code treatment for local filing context.",
        },
      ],
    },

    remote: {
      kind: "us_mirror",
      confidence: "moderate",
      notes: [
        "Remote or foreign-source income in the USVI can interact with mirror-code rules, bona fide residency rules, and U.S./USVI allocation rules.",
        "This calculator does not yet model Form 8689-style allocation or USVI bona fide residency treatment.",
        "Use this destination as a classified placeholder until a dedicated USVI compute path is added.",
      ],
      sources: [
        {
          title: "Instructions for Form 8689",
          url: "https://www.irs.gov/pub/irs-pdf/f8689.pdf",
          type: "tax_agency",
          publisher: "Internal Revenue Service",
          dateChecked: "2026-04-08",
          notes:
            "Supports income allocation and bona fide residency context for USVI taxpayers.",
        },
      ],
    },

    retired: {
      kind: "us_mirror",
      confidence: "moderate",
      notes: [
        "Retirement income in the USVI can interact with mirror-code rules and filing/residency coordination between the U.S. and USVI.",
        "This calculator does not yet model the full USVI mirror-code treatment for pension, retirement, or investment income.",
        "Use this destination as a classified placeholder until a dedicated USVI compute path is added.",
      ],
      sources: [
        {
          title: "Tax Structure Booklet of the U.S. Virgin Islands",
          url: "https://bir.vi.gov/content/booklets/tax_structure.pdf",
          type: "tax_agency",
          publisher: "Virgin Islands Bureau of Internal Revenue",
          dateChecked: "2026-04-08",
          notes:
            "Supports mirror-code treatment and the need for specialized computation.",
        },
      ],
    },
  },

  conditionalQuestions: [],
};

export default VI_TAX_CONFIG;