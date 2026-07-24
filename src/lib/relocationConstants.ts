// ---------------------------------------------------------------------------
// FAMILY COST SCALING
// ---------------------------------------------------------------------------
// Represents the marginal cost increase per additional adult or child
// relative to a single-adult baseline. Tunable without touching calc logic.
// e.g. groceries for 2 adults = base * (1 + 1 * 0.55) = base * 1.55
export const COST_SCALING = {
  groceries:      { adult: 0.55, child: 0.35 },
  transportation: { adult: 0.35, child: 0.15 },
  healthcare:     { adult: 0.70, child: 0.50 },
  utilities:      { adult: 0.25, child: 0.15 },
} as const;

// ---------------------------------------------------------------------------
// CAR COST FALLBACK
// ---------------------------------------------------------------------------
// Used when no city-specific car default exists.
// Prefer selectedCityDefaults?.monthlyDefaults.car over this.
export const CAR_COST_FALLBACK_USD = 350;

// ---------------------------------------------------------------------------
// FEE NOTE LABELS
// ---------------------------------------------------------------------------
// Canonical strings for VisaContext.feeNote, avoids typo drift across entries.
export const FEE_NOTE = {
  processing:          "Est. government processing fee",
  minimumInvestment:   "Minimum investment required",
  minimumContribution: "Minimum fund contribution",
  annualIncome:        "Minimum annual income required",
  none:                "No standard fee",
} as const;

export type FeeNote = typeof FEE_NOTE[keyof typeof FEE_NOTE];
