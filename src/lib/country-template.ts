// /lib/caribbeanTax/country-template.ts
import {
  ScenarioConfig,
  CaribbeanTaxCode,
  CountryTaxConfig,
  TaxSource,
  TAX_YEAR_LABEL,
} from "./caribbeanTax/types";


// ---------------------------------------------------------------------------
// PENDING SCENARIO STUB
// Reusable helper for any scenario that has not been modeled yet.
// ---------------------------------------------------------------------------
export function makePendingScenario(args?: {
  notes?: string[];
  sources?: TaxSource[];
}): ScenarioConfig {
  return {
    kind: "pending",
    confidence: "pending",
    notes: args?.notes ?? ["This tax scenario has not been modeled yet."],
    sources: args?.sources ?? [],
  };
}

// ---------------------------------------------------------------------------
// COUNTRY TEMPLATE FACTORY
// Creates a blank country config with all three scenarios stubbed as pending.
// Use this as the starting point for each country file, then replace the
// scenario blocks one by one as research is completed.
// ---------------------------------------------------------------------------
export function makeCountryTemplate(args: {
  code: CaribbeanTaxCode;
  name: string;
  currency: string;
  taxYearLabel?: string;
  badgeLabel?: string;
  disclaimer?: string;
  tags?: string[];
  sources?: TaxSource[];
}): CountryTaxConfig {
  return {
    code: args.code,
    name: args.name,
    currency: args.currency,
    taxYearLabel: args.taxYearLabel ?? TAX_YEAR_LABEL,

    modelStatus: "coming_soon",
    badgeLabel: args.badgeLabel ?? "Coming soon",
    disclaimer:
      args.disclaimer ??
      "Tax modeling for this destination is still in progress. Notes may be incomplete and tax figures may not yet be available.",
    tags: args.tags ?? [],
    sources: args.sources ?? [],

    scenarios: {
      local: makePendingScenario({
        notes: [`${args.name}: local earned income has not been modeled yet.`],
      }),
      remote: makePendingScenario({
        notes: [
          `${args.name}: foreign-source / remote income has not been modeled yet.`,
        ],
      }),
      retired: makePendingScenario({
        notes: [
          `${args.name}: retirement / pension income has not been modeled yet.`,
        ],
      }),
    },

    conditionalQuestions: [],
  };
}

// ---------------------------------------------------------------------------
// OPTIONAL READY-MADE BLANK TEMPLATE
// Useful as a copy/paste reference when creating a new country file manually.
// ---------------------------------------------------------------------------
export const BLANK_COUNTRY_TEMPLATE: CountryTaxConfig = {
  code: "AG",
  name: "Example Country",
  currency: "USD",
  taxYearLabel: TAX_YEAR_LABEL,

  modelStatus: "coming_soon",
  badgeLabel: "Coming soon",
  disclaimer:
    "Tax modeling for this destination is still in progress. Notes may be incomplete and tax figures may not yet be available.",
  tags: [],
  sources: [],

  scenarios: {
    local: {
      kind: "pending",
      confidence: "pending",
      notes: ["Local earned income has not been modeled yet."],
      sources: [],
    },
    remote: {
      kind: "pending",
      confidence: "pending",
      notes: ["Foreign-source / remote income has not been modeled yet."],
      sources: [],
    },
    retired: {
      kind: "pending",
      confidence: "pending",
      notes: ["Retirement / pension income has not been modeled yet."],
      sources: [],
    },
  },

  conditionalQuestions: [],
};