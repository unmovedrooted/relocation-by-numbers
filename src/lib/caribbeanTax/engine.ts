import type {
  Bracket,
  CountryTaxConfig,
  FilingStatus,
  IncomeScenario,
  ScenarioConfig,
  SpecialComputeInput,
  TaxComputationLine,
  TaxEstimateResult,
} from "./types"

// ---------------------------------------------------------------------------
// INTERNAL MATH HELPERS
// ---------------------------------------------------------------------------

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function clampMoney(value: number): number {
  return Math.max(0, round2(value))
}

function formatWhole(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

// ---------------------------------------------------------------------------
// PROGRESSIVE TAX HELPER
// Applies a bracket schedule to a taxable income amount.
// The caller is responsible for subtracting any allowance before calling this.
// ---------------------------------------------------------------------------
export function progressiveTax(
  taxableIncome: number,
  brackets: Bracket[]
): { tax: number; marginalRate: number; lines: TaxComputationLine[] } {
  if (taxableIncome <= 0) {
    return { tax: 0, marginalRate: 0, lines: [] }
  }

  let tax = 0
  let lowerBound = 0
  const lines: TaxComputationLine[] = []

  for (const bracket of brackets) {
    const upperBound = bracket.upTo

    if (upperBound === null) {
      const slice = Math.max(0, taxableIncome - lowerBound)
      if (slice > 0) {
        const sliceTax = slice * bracket.rate
        tax += sliceTax
        lines.push({
          label: `${formatWhole(lowerBound)}+ at ${(bracket.rate * 100).toFixed(1)}%`,
          amount: round2(sliceTax),
        })
      }
      return {
        tax: clampMoney(tax),
        marginalRate: bracket.rate,
        lines,
      }
    }

    const slice = Math.max(0, Math.min(taxableIncome, upperBound) - lowerBound)
    if (slice > 0) {
      const sliceTax = slice * bracket.rate
      tax += sliceTax
      lines.push({
        label: `${formatWhole(lowerBound)} to ${formatWhole(upperBound)} at ${(bracket.rate * 100).toFixed(1)}%`,
        amount: round2(sliceTax),
      })
    }

    if (taxableIncome <= upperBound) {
      return {
        tax: clampMoney(tax),
        marginalRate: bracket.rate,
        lines,
      }
    }

    lowerBound = upperBound
  }

  return {
    tax: clampMoney(tax),
    marginalRate: brackets[brackets.length - 1]?.rate ?? 0,
    lines,
  }
}

// ---------------------------------------------------------------------------
// DISCLAIMER RESULT BUILDER
// Used by kinds that cannot produce a reliable tax figure.
// isDisclaimer: true tells the UI to suppress tax numbers and show notes only.
// ---------------------------------------------------------------------------
function disclaimerResult(
  config: CountryTaxConfig,
  scenario: ScenarioConfig,
  scenarioKey: IncomeScenario,
  grossIncome: number
): TaxEstimateResult {
  return {
    countryCode: config.code,
    countryName: config.name,
    taxYearLabel: config.taxYearLabel,
    currency: config.currency,
    scenario: scenarioKey,
    kind: scenario.kind,
    confidence: scenario.confidence,
    grossIncome,
    taxableIncome: grossIncome,
    tax: 0,
    netIncome: grossIncome,
    effectiveRate: 0,
    marginalRate: 0,
    lines: [],
    notes: scenario.notes,
    isDisclaimer: true,
  }
}

// ---------------------------------------------------------------------------
// ZERO TAX RESULT BUILDER
// Used by kind: "none" and territorial scenarios with no applicable rate.
// isDisclaimer: false, the engine is confident the tax is zero.
// ---------------------------------------------------------------------------
function zeroTaxResult(
  config: CountryTaxConfig,
  scenario: ScenarioConfig,
  scenarioKey: IncomeScenario,
  grossIncome: number
): TaxEstimateResult {
  return {
    countryCode: config.code,
    countryName: config.name,
    taxYearLabel: config.taxYearLabel,
    currency: config.currency,
    scenario: scenarioKey,
    kind: scenario.kind,
    confidence: scenario.confidence,
    grossIncome,
    taxableIncome: grossIncome,
    tax: 0,
    netIncome: grossIncome,
    effectiveRate: 0,
    marginalRate: 0,
    lines: [],
    notes: scenario.notes,
    isDisclaimer: false,
  }
}

// ---------------------------------------------------------------------------
// MAIN ENGINE FUNCTION
// Accepts a country config, a scenario key, a gross income in the country's
// local currency, and optional filing status and conditional answers.
// Returns a TaxEstimateResult.
//
// Currency conversion is the caller's responsibility. The engine works
// entirely in the currency of the country config. Pass grossIncome already
// converted to local currency before calling this function.
// ---------------------------------------------------------------------------
export function estimateScenarioTax(input: {
  config: CountryTaxConfig
  scenario: IncomeScenario
  grossIncomeLocalCurrency: number
  filingStatus?: FilingStatus
  answers?: Record<string, string>
}): TaxEstimateResult {
  const {
    config,
    scenario: scenarioKey,
    grossIncomeLocalCurrency,
    filingStatus = "single",
    answers = {},
  } = input

  const grossIncome = clampMoney(grossIncomeLocalCurrency)
  const scenario = config.scenarios[scenarioKey]

  // --- none ----------------------------------------------------------------
  if (scenario.kind === "none") {
    return zeroTaxResult(config, scenario, scenarioKey, grossIncome)
  }

  // --- pending -------------------------------------------------------------
  if (scenario.kind === "pending") {
    return disclaimerResult(config, scenario, scenarioKey, grossIncome)
  }

  // --- us_mirror -----------------------------------------------------------
  if (scenario.kind === "us_mirror") {
    return disclaimerResult(config, scenario, scenarioKey, grossIncome)
  }

  // --- french_system -------------------------------------------------------
  if (scenario.kind === "french_system") {
    return disclaimerResult(config, scenario, scenarioKey, grossIncome)
  }

  // --- flat ----------------------------------------------------------------
  if (scenario.kind === "flat") {
    const allowance = scenario.getAllowance?.() ?? 0
    const taxableIncome = Math.max(0, grossIncome - allowance)
    const tax = clampMoney(taxableIncome * scenario.flatRate)
    const lines: TaxComputationLine[] = []

    if (allowance > 0) {
      lines.push({ label: "Gross income", amount: grossIncome })
      lines.push({ label: "Allowance", amount: -round2(allowance) })
    }

    lines.push({
      label: `Flat rate ${(scenario.flatRate * 100).toFixed(1)}%`,
      amount: tax,
    })

    return {
      countryCode: config.code,
      countryName: config.name,
      taxYearLabel: config.taxYearLabel,
      currency: config.currency,
      scenario: scenarioKey,
      kind: "flat",
      confidence: scenario.confidence,
      grossIncome,
      taxableIncome: clampMoney(taxableIncome),
      tax,
      netIncome: clampMoney(grossIncome - tax),
      effectiveRate: grossIncome > 0 ? round2(tax / grossIncome) : 0,
      marginalRate: scenario.flatRate,
      lines,
      notes: scenario.notes,
      isDisclaimer: false,
    }
  }

  // --- progressive ---------------------------------------------------------
  if (scenario.kind === "progressive") {
    const allowance = scenario.getAllowance()
    const taxableIncome = Math.max(0, grossIncome - allowance)
    const brackets = scenario.getBrackets()
    const result = progressiveTax(taxableIncome, brackets)

    const lines: TaxComputationLine[] =
      allowance > 0
        ? [
            { label: "Gross income", amount: grossIncome },
            { label: "Allowance or exemption", amount: -round2(allowance) },
            ...result.lines,
          ]
        : result.lines

    return {
      countryCode: config.code,
      countryName: config.name,
      taxYearLabel: config.taxYearLabel,
      currency: config.currency,
      scenario: scenarioKey,
      kind: "progressive",
      confidence: scenario.confidence,
      grossIncome,
      taxableIncome: clampMoney(taxableIncome),
      tax: clampMoney(result.tax),
      netIncome: clampMoney(grossIncome - result.tax),
      effectiveRate: grossIncome > 0 ? round2(result.tax / grossIncome) : 0,
      marginalRate: result.marginalRate,
      lines,
      notes: scenario.notes,
      isDisclaimer: false,
    }
  }

  // --- territorial ---------------------------------------------------------
  // The country file carries all the knowledge. The engine executes whatever
  // is present in the scenario config without any territorial-specific logic.
  //
  // If getBrackets is provided, run the bracket math.
  // If foreignSourceRate is provided without brackets, apply it as a flat rate.
  // If neither is provided, the tax is zero (full foreign-source exemption).
  if (scenario.kind === "territorial") {
    const allowance = scenario.getAllowance?.() ?? 0
    const taxableIncome = Math.max(0, grossIncome - allowance)

    if (scenario.getBrackets) {
      const brackets = scenario.getBrackets()
      const result = progressiveTax(taxableIncome, brackets)

      const lines: TaxComputationLine[] =
        allowance > 0
          ? [
              { label: "Gross income", amount: grossIncome },
              { label: "Allowance or exemption", amount: -round2(allowance) },
              ...result.lines,
            ]
          : result.lines

      return {
        countryCode: config.code,
        countryName: config.name,
        taxYearLabel: config.taxYearLabel,
        currency: config.currency,
        scenario: scenarioKey,
        kind: "territorial",
        confidence: scenario.confidence,
        grossIncome,
        taxableIncome: clampMoney(taxableIncome),
        tax: clampMoney(result.tax),
        netIncome: clampMoney(grossIncome - result.tax),
        effectiveRate: grossIncome > 0 ? round2(result.tax / grossIncome) : 0,
        marginalRate: result.marginalRate,
        lines,
        notes: scenario.notes,
        isDisclaimer: false,
      }
    }

    if (scenario.foreignSourceRate != null) {
      const tax = clampMoney(taxableIncome * scenario.foreignSourceRate)

      const lines: TaxComputationLine[] = allowance > 0
        ? [
            { label: "Gross income", amount: grossIncome },
            { label: "Allowance or exemption", amount: -round2(allowance) },
            {
              label: `Foreign-source rate ${(scenario.foreignSourceRate * 100).toFixed(1)}%`,
              amount: tax,
            },
          ]
        : [
            {
              label: `Foreign-source rate ${(scenario.foreignSourceRate * 100).toFixed(1)}%`,
              amount: tax,
            },
          ]

      return {
        countryCode: config.code,
        countryName: config.name,
        taxYearLabel: config.taxYearLabel,
        currency: config.currency,
        scenario: scenarioKey,
        kind: "territorial",
        confidence: scenario.confidence,
        grossIncome,
        taxableIncome: clampMoney(taxableIncome),
        tax,
        netIncome: clampMoney(grossIncome - tax),
        effectiveRate: grossIncome > 0 ? round2(tax / grossIncome) : 0,
        marginalRate: scenario.foreignSourceRate,
        lines,
        notes: scenario.notes,
        isDisclaimer: false,
      }
    }

    // No brackets and no foreignSourceRate, full exemption on this income.
    return zeroTaxResult(config, scenario, scenarioKey, grossIncome)
  }
  // --- custom --------------------------------------------------------------
  if (scenario.kind === "custom") {
    const computeInput: SpecialComputeInput = {
      grossAnnualIncome: grossIncome,
      filingStatus,
      answers,
    }

    const result = scenario.compute(computeInput)

    return {
      countryCode: config.code,
      countryName: config.name,
      taxYearLabel: config.taxYearLabel,
      currency: config.currency,
      scenario: scenarioKey,
      kind: "custom",
      confidence: scenario.confidence,
      grossIncome,
      taxableIncome: clampMoney(result.taxableIncome),
      tax: clampMoney(result.tax),
      netIncome: clampMoney(result.netIncome),
      effectiveRate: round2(result.effectiveRate),
      marginalRate: result.marginalRate,
      lines: result.lines,
      notes: result.notes,
      isDisclaimer: result.isDisclaimer ?? false,
    }
  }

  // --- fallback ------------------------------------------------------------
  // Should never be reached if all ScenarioKind values are handled above.
  // Returned as a disclaimer to fail safely rather than crash.
  return disclaimerResult(config, scenario, scenarioKey, grossIncome)
}