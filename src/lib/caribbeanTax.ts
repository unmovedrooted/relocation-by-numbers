// lib/caribbeanTax.ts

export type FilingStatus =
  | "single"
  | "married_joint"
  | "married_separate"
  | "head_of_household"

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

export type TaxComputationLine = {
  label: string
  amount: number
}

export type TaxEstimateResult = {
  countryCode: CaribbeanTaxCode
  countryName: string
  taxYearLabel: string
  currency: string
  grossIncome: number
  taxableIncome: number
  tax: number
  netIncome: number
  effectiveRate: number
  marginalRate: number
  lines: TaxComputationLine[]
  notes: string[]
}

type Bracket = {
  upTo: number | null
  rate: number
}

type TaxConfig = {
  code: CaribbeanTaxCode
  name: string
  currency: string
  taxYearLabel: string
  kind: "none" | "flat" | "progressive" | "special"
  notes: string[]
  flatRate?: number
  getAllowance?: (filingStatus: FilingStatus) => number
  getBrackets?: (filingStatus: FilingStatus) => Bracket[]
  computeSpecial?: (input: {
    grossAnnualIncome: number
    filingStatus: FilingStatus
  }) => Omit<
    TaxEstimateResult,
    "countryCode" | "countryName" | "taxYearLabel" | "currency" | "grossIncome"
  >
}

export const CARIBBEAN_TAX_ASSUMPTIONS_LABEL =
  "Tax assumptions updated: March 2026"

export const CARIBBEAN_TAX_CODES: CaribbeanTaxCode[] = [
  "AG",
  "AW",
  "BB",
  "BL",
  "BQ-BO",
  "BQ-SA",
  "BQ-SE",
  "BS",
  "CU",
  "CW",
  "DM",
  "DO",
  "GD",
  "GP",
  "HT",
  "JM",
  "KN",
  "KY",
  "LC",
  "MF",
  "MQ",
  "MS",
  "PR",
  "SX",
  "TC",
  "TT",
  "VC",
  "VG",
  "VI",
]

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function clampMoney(value: number) {
  return Math.max(0, round2(value))
}

function formatWhole(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

function progressiveTax(
  taxableIncome: number,
  brackets: Bracket[]
): { tax: number; marginalRate: number; lines: TaxComputationLine[] } {
  if (taxableIncome <= 0) {
    return {
      tax: 0,
      marginalRate: 0,
      lines: [],
    }
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

const TAX_YEAR_LABEL = "2026-Q2"

const TAX_CONFIG: Record<CaribbeanTaxCode, TaxConfig> = {
  AG: {
    code: "AG",
    name: "Antigua and Barbuda",
    currency: "XCD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "none",
    notes: [
      "Planning model: no personal income tax.",
      "Does not include payroll or social contributions.",
    ],
  },

  AW: {
    code: "AW",
    name: "Aruba",
    currency: "AWG",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 30000,
    getBrackets: () => [
      { upTo: 50000, rate: 0.10 },
      { upTo: 100000, rate: 0.18 },
      { upTo: null, rate: 0.25 },
    ],
    notes: [
      "Planning model for Aruba resident income tax.",
      "Actual top rates can reach ~52% for high earners; this model is simplified for planning use.",
    ],
  },

  BB: {
    code: "BB",
    name: "Barbados",
    currency: "BBD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 25000,
    getBrackets: () => [
      { upTo: 50000, rate: 0.125 },
      { upTo: null, rate: 0.285 },
    ],
    notes: [
      "Includes BBD 25,000 personal allowance.",
      "Does not include all deductions or credits.",
    ],
  },

  BL: {
    code: "BL",
    name: "Saint Barthélemy",
    currency: "EUR",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "flat",
    flatRate: 0.20,
    notes: [
      "French Caribbean planning model.",
      "Territory-specific resident tax rules are simplified.",
    ],
  },

  "BQ-BO": {
    code: "BQ-BO",
    name: "Bonaire",
    currency: "USD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "flat",
    flatRate: 0.18,
    notes: [
      "Dutch Caribbean planning model.",
      "Local payroll/residency details are simplified.",
    ],
  },

  "BQ-SA": {
    code: "BQ-SA",
    name: "Saba",
    currency: "USD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "flat",
    flatRate: 0.18,
    notes: [
      "Dutch Caribbean planning model.",
      "Local payroll/residency details are simplified.",
    ],
  },

  "BQ-SE": {
    code: "BQ-SE",
    name: "Sint Eustatius",
    currency: "USD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "flat",
    flatRate: 0.18,
    notes: [
      "Dutch Caribbean planning model.",
      "Local payroll/residency details are simplified.",
    ],
  },

  BS: {
    code: "BS",
    name: "Bahamas",
    currency: "BSD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "none",
    notes: [
      "No personal income tax currently modeled.",
      "National insurance is separate and not included here.",
    ],
  },

  CU: {
    code: "CU",
    name: "Cuba",
    currency: "CUP",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 0,
    getBrackets: () => [
      { upTo: 50000, rate: 0.12 },
      { upTo: 100000, rate: 0.20 },
      { upTo: null, rate: 0.30 },
    ],
    notes: [
      "Cuba planning model.",
      "Resident tax treatment is simplified for comparison use.",
    ],
  },

  CW: {
    code: "CW",
    name: "Curaçao",
    currency: "XCG",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "flat",
    flatRate: 0.22,
    notes: [
      "Curaçao planning model.",
      "Territory-specific resident tax rules are simplified.",
    ],
  },

  DM: {
    code: "DM",
    name: "Dominica",
    currency: "XCD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 30000,
    getBrackets: () => [
      { upTo: 50000, rate: 0.15 },
      { upTo: null, rate: 0.25 },
    ],
    notes: [
      "Dominica planning model.",
      "Exact deductions and payroll contributions are not included.",
    ],
  },

  DO: {
    code: "DO",
    name: "Dominican Republic",
    currency: "DOP",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 0,
    getBrackets: () => [
      { upTo: 416220, rate: 0.00 },
      { upTo: 624329, rate: 0.15 },
      { upTo: 867123, rate: 0.20 },
      { upTo: null,   rate: 0.25 },
    ],
    notes: [
      "Simplified resident planning model for Dominican-source earned income.",
      "The Dominican Republic generally follows a territorial tax system.",
      "Foreign-source income may be treated differently, and for new residents some foreign-source income is generally taxed only after the third year.",
      "Social security, payroll contributions, deductions, and special residency cases are not fully modeled.",
    ],
  },

  GD: {
    code: "GD",
    name: "Grenada",
    currency: "XCD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 36000,
    getBrackets: () => [
      { upTo: 60000, rate: 0.10 },
      { upTo: null, rate: 0.28 },
    ],
    notes: [
      "Grenada planning model.",
      "Personal income tax is modeled; VAT is separate and not included in income tax.",
    ],
  },

  GP: {
    code: "GP",
    name: "Guadeloupe",
    currency: "EUR",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "flat",
    flatRate: 0.20,
    notes: [
      "French Caribbean planning model.",
      "Territory-specific resident tax rules are simplified.",
    ],
  },

  HT: {
    code: "HT",
    name: "Haiti",
    currency: "HTG",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 120000,
    getBrackets: () => [
      { upTo: 240000, rate: 0.10 },
      { upTo: 480000, rate: 0.20 },
      { upTo: null, rate: 0.30 },
    ],
    notes: [
      "Haiti planning model.",
      "Resident tax treatment is simplified.",
    ],
  },

  JM: {
    code: "JM",
    name: "Jamaica",
    currency: "JMD",
    taxYearLabel: "2026 calendar basis",
    kind: "progressive",
    getAllowance: () => 1978212,
    getBrackets: () => [
      { upTo: 6000000, rate: 0.25 },
      { upTo: null, rate: 0.30 },
    ],
    notes: [
      "Uses the published 2026 annual tax-free threshold.",
      "NIS, NHT, and education tax are not included here.",
    ],
  },

  KN: {
    code: "KN",
    name: "Saint Kitts and Nevis",
    currency: "XCD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "none",
    notes: [
      "Planning model: no personal income tax.",
      "Does not include payroll or other mandatory contributions.",
    ],
  },

  KY: {
    code: "KY",
    name: "Cayman Islands",
    currency: "KYD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "none",
    notes: [
      "No personal income tax currently modeled.",
      "Pension and other mandatory contributions are not included here.",
    ],
  },

  // CORRECTED: Saint Lucia has an XCD 18,000 tax-free allowance,
  // then 10% up to XCD 30,000, then 15% above that.
  // The previous model incorrectly started at 15% from dollar one.
  LC: {
    code: "LC",
    name: "Saint Lucia",
    currency: "XCD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 18000,
    getBrackets: () => [
      { upTo: 30000, rate: 0.10 },
      { upTo: null, rate: 0.15 },
    ],
    notes: [
      "Includes XCD 18,000 personal allowance.",
      "Saint Lucia resident planning model. Does not include NIC or other payroll contributions.",
    ],
  },

  MF: {
    code: "MF",
    name: "Saint Martin",
    currency: "EUR",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "flat",
    flatRate: 0.20,
    notes: [
      "French Caribbean planning model.",
      "Territory-specific resident tax rules are simplified.",
    ],
  },

  MQ: {
    code: "MQ",
    name: "Martinique",
    currency: "EUR",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "flat",
    flatRate: 0.20,
    notes: [
      "French Caribbean planning model.",
      "Territory-specific resident tax rules are simplified.",
    ],
  },

  MS: {
    code: "MS",
    name: "Montserrat",
    currency: "XCD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 30000,
    getBrackets: () => [
      { upTo: 50000, rate: 0.15 },
      { upTo: null, rate: 0.25 },
    ],
    notes: [
      "Montserrat planning model.",
      "Exact reliefs and payroll contributions are not included.",
    ],
  },

  PR: {
    code: "PR",
    name: "Puerto Rico",
    currency: "USD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "special",
    computeSpecial: ({ grossAnnualIncome, filingStatus }) => {
      const personalExemption = filingStatus === "married_joint" ? 7000 : 3500
      const taxableIncome = Math.max(0, grossAnnualIncome - personalExemption)

      let regularTax = 0
      let marginalRate = 0
      const lines: TaxComputationLine[] = [
        { label: "Gross income", amount: round2(grossAnnualIncome) },
        { label: "Personal exemption", amount: -round2(personalExemption) },
      ]

      if (taxableIncome <= 9000) {
        regularTax = 0
        marginalRate = 0
      } else if (taxableIncome <= 25000) {
        marginalRate = 0.07
        regularTax = (taxableIncome - 9000) * 0.07
        lines.push({
          label: "Regular tax: over 9,000 at 7%",
          amount: round2(regularTax),
        })
      } else if (taxableIncome <= 41500) {
        marginalRate = 0.14
        const baseTax = 1120
        const extraTax = (taxableIncome - 25000) * 0.14
        regularTax = baseTax + extraTax
        lines.push({ label: "Regular tax base", amount: baseTax })
        lines.push({
          label: "Regular tax: over 25,000 at 14%",
          amount: round2(extraTax),
        })
      } else if (taxableIncome <= 61500) {
        marginalRate = 0.25
        const baseTax = 3430
        const extraTax = (taxableIncome - 41500) * 0.25
        regularTax = baseTax + extraTax
        lines.push({ label: "Regular tax base", amount: baseTax })
        lines.push({
          label: "Regular tax: over 41,500 at 25%",
          amount: round2(extraTax),
        })
      } else {
        marginalRate = 0.33
        const baseTax = 8430
        const extraTax = (taxableIncome - 61500) * 0.33
        regularTax = baseTax + extraTax
        lines.push({ label: "Regular tax base", amount: baseTax })
        lines.push({
          label: "Regular tax: over 61,500 at 33%",
          amount: round2(extraTax),
        })
      }

      let gradualAdjustmentTax = 0
      if (taxableIncome > 500000) {
        const cap = 0.33 * personalExemption + 8895
        gradualAdjustmentTax = Math.min((taxableIncome - 500000) * 0.05, cap)
        lines.push({
          label: "Gradual adjustment tax",
          amount: round2(gradualAdjustmentTax),
        })
      }

      const tax = regularTax + gradualAdjustmentTax

      return {
        taxableIncome: clampMoney(taxableIncome),
        tax: clampMoney(tax),
        netIncome: clampMoney(grossAnnualIncome - tax),
        effectiveRate: grossAnnualIncome > 0 ? round2(tax / grossAnnualIncome) : 0,
        marginalRate,
        lines,
        notes: [
          "Regular resident planning model.",
          "Residency, sourcing, Act 60 incentives, and U.S. filing overlap are not fully modeled here.",
        ],
      }
    },
    notes: [],
  },

  SX: {
    code: "SX",
    name: "Sint Maarten",
    currency: "XCG",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "flat",
    flatRate: 0.20,
    notes: [
      "Sint Maarten planning model.",
      "Territory-specific resident tax rules are simplified.",
    ],
  },

  TC: {
    code: "TC",
    name: "Turks and Caicos Islands",
    currency: "USD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "none",
    notes: [
      "No personal income tax currently modeled.",
      "NI and NHIP contributions are separate and not included here.",
    ],
  },

  TT: {
    code: "TT",
    name: "Trinidad and Tobago",
    currency: "TTD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 90000,
    getBrackets: () => [
      { upTo: 1000000, rate: 0.25 },
      { upTo: null, rate: 0.30 },
    ],
    notes: [
      "Includes TTD 90,000 personal allowance.",
      "National insurance and health surcharge are not included here.",
    ],
  },

  VC: {
    code: "VC",
    name: "Saint Vincent and the Grenadines",
    currency: "XCD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "progressive",
    getAllowance: () => 25000,
    getBrackets: () => [
      { upTo: 50000, rate: 0.10 },
      { upTo: null, rate: 0.28 },
    ],
    notes: [
      "Saint Vincent and the Grenadines planning model.",
      "Exact deductions and payroll contributions are not included.",
    ],
  },

  VG: {
    code: "VG",
    name: "British Virgin Islands",
    currency: "USD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "none",
    notes: [
      "Planning model: no personal income tax.",
      "Payroll tax and other employment deductions are not included here.",
    ],
  },

  VI: {
    code: "VI",
    name: "U.S. Virgin Islands",
    currency: "USD",
    taxYearLabel: TAX_YEAR_LABEL,
    kind: "flat",
    flatRate: 0.22,
    notes: [
      "U.S. Virgin Islands planning model.",
      "Mirror-code and territory-specific rules are simplified.",
    ],
  },
}

export function hasCaribbeanTaxEstimate(code?: string): code is CaribbeanTaxCode {
  return !!code && CARIBBEAN_TAX_CODES.includes(code as CaribbeanTaxCode)
}

export function estimateCaribbeanIncomeTax(input: {
  countryCode: CaribbeanTaxCode
  grossAnnualIncome: number
  filingStatus?: FilingStatus
  convertAnnualIncomeToTaxCurrency?: (
    grossAnnualIncome: number,
    countryCode: CaribbeanTaxCode
  ) => number
}): TaxEstimateResult {
  const filingStatus = input.filingStatus ?? "single"
  const config = TAX_CONFIG[input.countryCode]

  const grossIncome = clampMoney(
    input.convertAnnualIncomeToTaxCurrency
      ? input.convertAnnualIncomeToTaxCurrency(
          input.grossAnnualIncome,
          input.countryCode
        )
      : input.grossAnnualIncome
  )

  if (config.kind === "none") {
    return {
      countryCode: config.code,
      countryName: config.name,
      taxYearLabel: config.taxYearLabel,
      currency: config.currency,
      grossIncome,
      taxableIncome: grossIncome,
      tax: 0,
      netIncome: grossIncome,
      effectiveRate: 0,
      marginalRate: 0,
      lines: [],
      notes: config.notes,
    }
  }

  if (config.kind === "flat" && config.flatRate != null) {
    const tax = grossIncome * config.flatRate
    return {
      countryCode: config.code,
      countryName: config.name,
      taxYearLabel: config.taxYearLabel,
      currency: config.currency,
      grossIncome,
      taxableIncome: grossIncome,
      tax: clampMoney(tax),
      netIncome: clampMoney(grossIncome - tax),
      effectiveRate: grossIncome > 0 ? round2(tax / grossIncome) : 0,
      marginalRate: config.flatRate,
      lines: [
        {
          label: `Planning flat rate ${(config.flatRate * 100).toFixed(1)}%`,
          amount: clampMoney(tax),
        },
      ],
      notes: config.notes,
    }
  }

  if (config.kind === "special" && config.computeSpecial) {
    return {
      countryCode: config.code,
      countryName: config.name,
      taxYearLabel: config.taxYearLabel,
      currency: config.currency,
      grossIncome,
      ...config.computeSpecial({
        grossAnnualIncome: grossIncome,
        filingStatus,
      }),
    }
  }

  const allowance = config.getAllowance?.(filingStatus) ?? 0
  const taxableIncome = Math.max(0, grossIncome - allowance)
  const brackets = config.getBrackets?.(filingStatus) ?? []
  const result = progressiveTax(taxableIncome, brackets)

  return {
    countryCode: config.code,
    countryName: config.name,
    taxYearLabel: config.taxYearLabel,
    currency: config.currency,
    grossIncome,
    taxableIncome: clampMoney(taxableIncome),
    tax: clampMoney(result.tax),
    netIncome: clampMoney(grossIncome - result.tax),
    effectiveRate: grossIncome > 0 ? round2(result.tax / grossIncome) : 0,
    marginalRate: result.marginalRate,
    lines: allowance
      ? [
          { label: "Gross income", amount: grossIncome },
          { label: "Allowance or exemption", amount: -round2(allowance) },
          ...result.lines,
        ]
      : result.lines,
    notes: config.notes,
  }
}
