// /lib/caribbeanTax/types.ts

// ---------------------------------------------------------------------------
// INCOME SCENARIO
// The three scenarios a user can be in. These map directly to the UI dropdown.
// "local"   — tax resident earning income sourced within the destination country
// "remote"  — tax resident earning income sourced outside the destination country
// "retired" — tax resident living on pension, investment, or savings income
// ---------------------------------------------------------------------------
export type IncomeScenario = "local" | "remote" | "retired"

// ---------------------------------------------------------------------------
// SCENARIO KIND
// Describes the tax treatment category for a given scenario.
// This is classification metadata, not just an engine routing flag.
//
// "none"          — no personal income tax exists in this jurisdiction
// "flat"          — single rate applied to taxable income after any allowance
// "progressive"   — standard bracket system with allowance and bracket array
// "territorial"   — territorial or mostly territorial treatment; local-source
//                   income is taxed and foreign-source income may be exempt
//                   or treated differently depending on country-specific rules
// "custom"        — true one-off logic that does not fit any other kind;
//                   requires a compute function
// "us_mirror"     — U.S. Internal Revenue Code applies by mirror code;
//                   returns disclaimer result, no calculation performed now
// "french_system" — French metropolitan tax system applies; returns disclaimer
//                   result until full French schedule is modeled
// "pending"       — not yet researched or modeled; no tax figure is shown
// ---------------------------------------------------------------------------
export type ScenarioKind =
  | "none"
  | "flat"
  | "progressive"
  | "territorial"
  | "custom"
  | "us_mirror"
  | "french_system"
  | "pending"

// ---------------------------------------------------------------------------
// CONFIDENCE
// Per-scenario signal describing how complete and verified the tax model is.
//
// "high"       — published rates, verified, brackets confirmed
// "moderate"   — published rates but simplified
// "simplified" — planning estimate only; structural rules known but details
//                approximated or not fully confirmed
// "pending"    — not yet modeled; no confidence can be assigned
// ---------------------------------------------------------------------------
export type Confidence = "high" | "moderate" | "simplified" | "pending"

// ---------------------------------------------------------------------------
// COUNTRY MODEL STATUS
// Country-level rollout state for UI/admin use.
// ---------------------------------------------------------------------------
export type CountryModelStatus = "complete" | "partial" | "coming_soon"

// ---------------------------------------------------------------------------
// SOURCE TYPE
// Used for country-level and scenario-level source metadata.
// ---------------------------------------------------------------------------
export type SourceType =
  | "government"
  | "official_program"
  | "tax_agency"
  | "tax_firm"
  | "legal_summary"
  | "secondary_summary"
  | "internal_note"
  | "other"

// ---------------------------------------------------------------------------
// TAX SOURCE
// Source metadata for trust, QA, and future maintenance.
// ---------------------------------------------------------------------------
export type TaxSource = {
  title: string
  url?: string
  type: SourceType
  publisher?: string
  dateChecked?: string // YYYY-MM-DD
  notes?: string
}

// ---------------------------------------------------------------------------
// TAX BRACKET
// A single bracket in a progressive tax schedule.
// upTo: null means this bracket applies to all income above the lower bound.
// ---------------------------------------------------------------------------
export type Bracket = {
  upTo: number | null
  rate: number
}

// ---------------------------------------------------------------------------
// TAX COMPUTATION LINE
// A single line item in the tax breakdown shown to the user.
// ---------------------------------------------------------------------------
export type TaxComputationLine = {
  label: string
  amount: number
}

// ---------------------------------------------------------------------------
// SPECIAL COMPUTE INPUT / RESULT
// Used by scenarios with kind: "custom" that require country-specific logic.
// ---------------------------------------------------------------------------
export type SpecialComputeInput = {
  grossAnnualIncome: number
  filingStatus: FilingStatus
  answers?: Record<string, string>
}

export type SpecialComputeResult = {
  taxableIncome: number
  tax: number
  netIncome: number
  effectiveRate: number
  marginalRate: number
  lines: TaxComputationLine[]
  notes: string[]
  isDisclaimer?: boolean 
}

// ---------------------------------------------------------------------------
// FILING STATUS
// Standard filing categories. Not all countries use all statuses.
// ---------------------------------------------------------------------------
export type FilingStatus =
  | "single"
  | "married_joint"
  | "married_separate"
  | "head_of_household"

// ---------------------------------------------------------------------------
// SCENARIO CONFIG
// The tax configuration for a single income scenario within a country.
// The shape varies by kind, enforced via a discriminated union.
// Each scenario can also carry its own sources.
// ---------------------------------------------------------------------------
export type ScenarioConfig =
  | {
      kind: "none"
      confidence: Confidence
      notes: string[]
      sources?: TaxSource[]
    }
  | {
      kind: "pending"
      confidence: "pending"
      notes: string[]
      sources?: TaxSource[]
    }
  | {
      kind: "us_mirror"
      confidence: Confidence
      notes: string[]
      sources?: TaxSource[]
    }
  | {
      kind: "french_system"
      confidence: Confidence
      notes: string[]
      sources?: TaxSource[]
    }
  | {
      kind: "flat"
      confidence: Confidence
      notes: string[]
      flatRate: number
      getAllowance?: () => number
      sources?: TaxSource[]
    }
  | {
      kind: "progressive"
      confidence: Confidence
      notes: string[]
      getAllowance: () => number
      getBrackets: () => Bracket[]
      sources?: TaxSource[]
    }
  | {
      kind: "territorial"
      confidence: Confidence
      notes: string[]
      getAllowance?: () => number
      getBrackets?: () => Bracket[]
      foreignSourceRate?: number
      sources?: TaxSource[]
    }
  | {
      kind: "custom"
      confidence: Confidence
      notes: string[]
      compute: (input: SpecialComputeInput) => SpecialComputeResult
      sources?: TaxSource[]
    }

// ---------------------------------------------------------------------------
// CONDITIONAL QUESTION
// An optional question shown in the UI when certain conditions are met.
// Designed generically so any country can use it, not just DO.
// The answer is passed into the tax engine via SpecialComputeInput.answers.
// countryCode can be one country or multiple countries.
// ---------------------------------------------------------------------------
export type ConditionalQuestion = {
  id: string
  showWhen: {
    scenario: IncomeScenario
    countryCode: CaribbeanTaxCode | CaribbeanTaxCode[]
  }
  question: string
  options: {
    label: string
    value: string
  }[]
}

// ---------------------------------------------------------------------------
// COUNTRY TAX CONFIG
// The full tax configuration for a single Caribbean country or territory.
// Each country exports one object matching this type.
// ---------------------------------------------------------------------------
export type CountryTaxConfig = {
  code: CaribbeanTaxCode
  name: string
  currency: string
  taxYearLabel: string

  // Country-level UI/admin metadata
  modelStatus: CountryModelStatus
  badgeLabel?: string
  disclaimer?: string
  tags?: string[]

  // Country-level source list
  sources?: TaxSource[]

  // Per-scenario tax configuration
  scenarios: Record<IncomeScenario, ScenarioConfig>

  // Optional UI questions for this country
  conditionalQuestions?: ConditionalQuestion[]
}

// ---------------------------------------------------------------------------
// TAX ESTIMATE RESULT
// The output of the tax engine for a single scenario calculation.
// Returned by estimateScenarioTax.
// isDisclaimer: true means suppress numeric result display in the UI.
// ---------------------------------------------------------------------------
export type TaxEstimateResult = {
  countryCode: CaribbeanTaxCode
  countryName: string
  taxYearLabel: string
  currency: string
  scenario: IncomeScenario
  kind: ScenarioKind
  confidence: Confidence
  grossIncome: number
  taxableIncome: number
  tax: number
  netIncome: number
  effectiveRate: number
  marginalRate: number
  lines: TaxComputationLine[]
  notes: string[]
  isDisclaimer: boolean
}

// ---------------------------------------------------------------------------
// CARIBBEAN TAX CODE
// Union of all supported country and territory codes.
// ---------------------------------------------------------------------------
export type CaribbeanTaxCode =
  | "AG" // Antigua and Barbuda
  | "AW" // Aruba
  | "BB" // Barbados
  | "BL" // Saint Barthélemy
  | "BQ-BO" // Bonaire
  | "BQ-SA" // Saba
  | "BQ-SE" // Sint Eustatius
  | "BS" // Bahamas
  | "CU" // Cuba
  | "CW" // Curaçao
  | "DM" // Dominica
  | "DO" // Dominican Republic
  | "GD" // Grenada
  | "GP" // Guadeloupe
  | "HT" // Haiti
  | "JM" // Jamaica
  | "KN" // Saint Kitts and Nevis
  | "KY" // Cayman Islands
  | "LC" // Saint Lucia
  | "MF" // Saint Martin
  | "MQ" // Martinique
  | "MS" // Montserrat
  | "PR" // Puerto Rico
  | "SX" // Sint Maarten
  | "TC" // Turks and Caicos Islands
  | "TT" // Trinidad and Tobago
  | "VC" // Saint Vincent and the Grenadines
  | "VG" // British Virgin Islands
  | "VI" // U.S. Virgin Islands

// ---------------------------------------------------------------------------
// TAX ASSUMPTIONS LABEL
// Displayed throughout the UI to timestamp the data.
// ---------------------------------------------------------------------------
export const CARIBBEAN_TAX_ASSUMPTIONS_LABEL =
  "Tax assumptions updated: March 2026"

export const TAX_YEAR_LABEL = "2026-Q2"