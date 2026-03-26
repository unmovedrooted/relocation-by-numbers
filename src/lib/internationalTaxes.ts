export type FilingStatus = "single" | "married";

export type TaxModelKind =
  | "none"
  | "progressive-country"
  | "country-plus-province"
  | "country-plus-local"
  | "placeholder";

export type TaxConfidence = "verified" | "partial" | "placeholder";

export type TaxEstimateResult = {
  effectiveRate: number;
  model: TaxModelKind;
  confidence: TaxConfidence;
  label: string;
  note: string;
};

type TaxEstimator = (args: {
  annualIncome: number;
  filing: FilingStatus;
  isRetired: boolean;
}) => TaxEstimateResult;

function clampRate(rate: number) {
  if (!Number.isFinite(rate)) return 0;
  return Math.max(0, Math.min(rate, 0.6));
}

function progressiveTax(
  income: number,
  brackets: Array<{ upTo: number; rate: number }>
) {
  let remaining = Math.max(0, income);
  let taxed = 0;
  let prev = 0;

  for (const bracket of brackets) {
    const upper = bracket.upTo;
    const slice = Math.max(0, Math.min(remaining, upper - prev));
    taxed += slice * bracket.rate;
    remaining -= slice;
    prev = upper;
    if (remaining <= 0) break;
  }

  if (remaining > 0) {
    const topRate = brackets[brackets.length - 1]?.rate ?? 0;
    taxed += remaining * topRate;
  }

  return income > 0 ? taxed / income : 0;
}

const PLACEHOLDER_BASE_RATES: Record<string, number> = {
  US: 0.3,
  PT: 0.28,
  ES: 0.3,
  MX: 0.24,
  GB: 0.27,
  CA: 0.29,
  DE: 0.33,
  NL: 0.31,
  CR: 0.22,
};

const placeholderEstimator: TaxEstimator = ({
  annualIncome,
  filing,
  isRetired,
}) => {
  if (isRetired) {
    return {
      effectiveRate: 0.12,
      model: "placeholder",
      confidence: "placeholder",
      label: "Simplified retirement estimate",
      note: "Retirement tax treatment varies widely by country and income type.",
    };
  }

  const base = PLACEHOLDER_BASE_RATES;
  const fallback = 0.26;

  return {
    effectiveRate: clampRate(
      (base["__country__"] ?? fallback) - (filing === "married" ? 0.02 : 0)
    ),
    model: "placeholder",
    confidence: "placeholder",
    label: "Simplified tax estimate",
    note: "This country is still using a placeholder effective tax rate.",
  };
};

const TAX_ESTIMATORS: Record<string, TaxEstimator> = {
  AE: ({ isRetired }) => ({
    effectiveRate: 0,
    model: "none",
    confidence: "verified",
    label: "Verified: no personal income tax",
    note: isRetired
      ? "UAE does not levy personal income tax on individuals."
      : "UAE salary income is modeled with no personal income tax.",
  }),

  SG: ({ annualIncome, isRetired }) => {
    if (isRetired) {
      return {
        effectiveRate: 0.08,
        model: "progressive-country",
        confidence: "partial",
        label: "Partial: retirement estimate",
        note: "Singapore retirement income treatment depends on income type and tax residency.",
      };
    }

    // Simple resident-style progressive approximation for now.
    const rate = progressiveTax(annualIncome, [
      { upTo: 20000, rate: 0.0 },
      { upTo: 30000, rate: 0.02 },
      { upTo: 40000, rate: 0.035 },
      { upTo: 80000, rate: 0.07 },
      { upTo: 120000, rate: 0.115 },
      { upTo: 160000, rate: 0.15 },
      { upTo: 200000, rate: 0.18 },
      { upTo: 240000, rate: 0.19 },
      { upTo: 280000, rate: 0.195 },
      { upTo: 320000, rate: 0.20 },
      { upTo: 500000, rate: 0.22 },
      { upTo: 1000000, rate: 0.23 },
      { upTo: Infinity, rate: 0.24 },
    ]);

    return {
      effectiveRate: clampRate(rate),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: resident-style progressive estimate",
      note: "Singapore tax depends heavily on tax residency and income type.",
    };
  },

  CA: ({ annualIncome, filing, isRetired }) => {
    // Deliberately broad and labeled partial until province is modeled.
    const federalLike = progressiveTax(annualIncome, [
      { upTo: 57375, rate: 0.15 },
      { upTo: 114750, rate: 0.205 },
      { upTo: 177882, rate: 0.26 },
      { upTo: 253414, rate: 0.29 },
      { upTo: Infinity, rate: 0.33 },
    ]);

    const provincialOverlay = 0.08;
    const marriedAdjustment = filing === "married" ? -0.01 : 0;
    const retiredAdjustment = isRetired ? -0.02 : 0;

    return {
      effectiveRate: clampRate(
        federalLike + provincialOverlay + marriedAdjustment + retiredAdjustment
      ),
      model: "country-plus-province",
      confidence: "partial",
      label: "Partial: federal + broad provincial estimate",
      note: "Canada needs province-specific tax logic for a fully trustworthy net-pay estimate.",
    };
  },

  PT: ({ annualIncome, filing, isRetired }) => {
    const rate = progressiveTax(annualIncome, [
      { upTo: 8000, rate: 0.13 },
      { upTo: 12000, rate: 0.165 },
      { upTo: 17000, rate: 0.22 },
      { upTo: 22000, rate: 0.25 },
      { upTo: 28000, rate: 0.32 },
      { upTo: 41000, rate: 0.355 },
      { upTo: 44000, rate: 0.43 },
      { upTo: 80000, rate: 0.45 },
      { upTo: Infinity, rate: 0.48 },
    ]);

    return {
      effectiveRate: clampRate(
        rate + (filing === "married" ? -0.015 : 0) + (isRetired ? -0.03 : 0)
      ),
      model: "progressive-country",
      confidence: "partial",
      label: "Partial: progressive Portugal estimate",
      note: "Portugal is progressive, but household split, residency status, and deductions still matter.",
    };
  },
};

const TAX_MODEL_META: Record<
  string,
  { model: TaxModelKind; confidence: TaxConfidence; label: string; note: string }
> = {
  AE: {
    model: "none",
    confidence: "verified",
    label: "Verified",
    note: "No personal income tax modeled for individuals.",
  },
  SG: {
    model: "progressive-country",
    confidence: "partial",
    label: "Partial",
    note: "Resident-style progressive estimate; residency still matters.",
  },
  CA: {
    model: "country-plus-province",
    confidence: "partial",
    label: "Partial",
    note: "Province-specific tax still needs to be added.",
  },
  PT: {
    model: "progressive-country",
    confidence: "partial",
    label: "Partial",
    note: "Progressive estimate; deductions and residency still matter.",
  },
};

export function getTaxModelStatus(countryCode: string) {
  return (
    TAX_MODEL_META[countryCode] ?? {
      model: "placeholder" as TaxModelKind,
      confidence: "placeholder" as TaxConfidence,
      label: "Simplified",
      note: "This country still uses a placeholder tax estimate.",
    }
  );
}

export function estimateInternationalTax(args: {
  countryCode: string;
  annualIncome: number;
  filing: FilingStatus;
  isRetired: boolean;
}): TaxEstimateResult {
  const { countryCode, annualIncome, filing, isRetired } = args;

  const estimator = TAX_ESTIMATORS[countryCode];

  if (estimator) {
    return estimator({ annualIncome, filing, isRetired });
  }

  const baseRate = PLACEHOLDER_BASE_RATES[countryCode] ?? 0.26;
  const effectiveRate = clampRate(
    isRetired ? 0.12 : baseRate - (filing === "married" ? 0.02 : 0)
  );

  return {
    effectiveRate,
    model: "placeholder",
    confidence: "placeholder",
    label: "Simplified tax estimate",
    note: "This country still uses a placeholder effective tax rate.",
  };
}