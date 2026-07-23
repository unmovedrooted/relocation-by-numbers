import type { StateCode } from "./states";

export type FilingStatus = "single" | "married";

/** Full annual tax breakdown. Use estimateNetBreakdown() to get this. */
export type TaxBreakdown = {
  gross: number;
  k401: number;
  after401k: number;
  taxableFederal: number;
  taxableState: number;
  federal: number;
  fica: number;
  state: number;
  local: number;
  totalTax: number;
  net: number;
};

type Bracket = { upTo: number; rate: number };

// ─── Updatable constants ──────────────────────────────────────────────────────
// Update each January when the IRS announces new limits.
export const TAX_YEAR = 2025;
export const EMPLOYEE_401K_LIMIT = 23_500; // 2025 IRS employee elective deferral limit

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sumBrackets(taxable: number, brackets: Bracket[]) {
  if (!Number.isFinite(taxable) || taxable <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    const upper = b.upTo;
    const amt = Math.max(0, Math.min(taxable, upper) - prev);
    tax += amt * b.rate;
    prev = upper;
    if (taxable <= upper) break;
  }
  return tax;
}

// ─── Federal ─────────────────────────────────────────────────────────────────
function federalStandardDeduction(filing: FilingStatus) {
  // 2025 amounts
  return filing === "married" ? 31_500 : 15_750;
}

function federalBrackets(filing: FilingStatus): Bracket[] {
  // 2025 brackets
  if (filing === "married") {
    return [
      { upTo: 23_850,                   rate: 0.10 },
      { upTo: 96_950,                   rate: 0.12 },
      { upTo: 206_700,                  rate: 0.22 },
      { upTo: 394_600,                  rate: 0.24 },
      { upTo: 501_050,                  rate: 0.32 },
      { upTo: 751_600,                  rate: 0.35 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
    ];
  }
  return [
    { upTo: 11_925,                   rate: 0.10 },
    { upTo: 48_475,                   rate: 0.12 },
    { upTo: 103_350,                  rate: 0.22 },
    { upTo: 197_300,                  rate: 0.24 },
    { upTo: 250_525,                  rate: 0.32 },
    { upTo: 626_350,                  rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ];
}

// ─── FICA ─────────────────────────────────────────────────────────────────────
function ficaTax(grossWages: number, filing: FilingStatus): number {
  const wages = Math.max(0, grossWages);
  const ssWageBase = 176_100; // 2025 SS wage base
  const ss       = Math.min(wages, ssWageBase) * 0.062;
  const medicare = wages * 0.0145;
  // Additional Medicare surtax
  const threshold = filing === "married" ? 250_000 : 200_000;
  const addl = Math.max(0, wages - threshold) * 0.009;
  return ss + medicare + addl;
}

// ─── Per-state deduction config ───────────────────────────────────────────────
/**
 * Most states have their own standard deduction (or personal exemption) that
 * differs from the federal amount. Critically, several high-population states
 * do NOT exclude traditional 401(k) employee contributions from state taxable
 * income — meaning state tax must be calculated from gross, not after-401k wages.
 *
 * allows401k: true  → state starts from after-401k wages (same treatment as federal)
 * allows401k: false → state taxes the 401k contribution (start from gross wages)
 */
type StateDeductConfig = {
  single: number;
  married: number;
  allows401k: boolean;
};

const STATE_DEDUCT_CONFIG: Partial<Record<StateCode, StateDeductConfig>> = {
  // ── States that genuinely tax traditional 401(k) employee contributions ───
  // Verified against each state's own tax authority: CA (FTB — CA does not
  // conform to federal deferred-comp exclusion) and PA (PA DOR — 401k
  // elective deferrals are taxable PA compensation). These are the only two
  // states in this list where wages must be computed from gross, not
  // after-401k pay.
  ca: { single: 5_202,  married: 10_404, allows401k: false }, // CA does not recognize 401k exclusion
  pa: { single: 0,      married: 0,      allows401k: false }, // PA taxes 401k; no standard deduction

  // ── States with 401k exclusion and their own standard deductions ──────────
  // NY, NJ, MA, and IL all exclude standard employee elective 401(k)
  // deferrals from state wages for W-2 employees (confirmed via NY DTF, NJ
  // Division of Taxation, Mass.gov, and IL DOR guidance) — despite each
  // having other retirement-plan quirks (e.g. NJ taxes IRA/403(b)
  // contributions, MA taxes self-employed/partner 401k contributions).
  ny: { single: 8_000,  married: 16_050, allows401k: true  },
  nj: { single: 1_000,  married: 2_000,  allows401k: true  },
  ma: { single: 4_400,  married: 8_800,  allows401k: true  },
  il: { single: 2_425,  married: 4_850,  allows401k: true  },
  ct: { single: 15_000, married: 24_000, allows401k: true  }, // CT personal exemption
  va: { single: 8_000,  married: 16_000, allows401k: true  },
  ga: { single: 12_000, married: 24_000, allows401k: true  }, // GA doubled std deduction in 2022
  nc: { single: 10_750, married: 21_500, allows401k: true  },
  sc: { single: 15_750, married: 31_500, allows401k: true  }, // SC mirrors federal std deduction
  co: { single: 15_750, married: 31_500, allows401k: true  }, // CO uses federal AGI as starting point
  az: { single: 14_600, married: 29_200, allows401k: true  },

  // ── No income tax states (deduction config still needed for fallback logic) ─
  fl: { single: 0, married: 0, allows401k: true },
  tx: { single: 0, married: 0, allows401k: true },
  wa: { single: 0, married: 0, allows401k: true },
};

/**
 * Returns the state standard deduction and 401k treatment for a given state.
 * Falls back to federal standard deduction + allows401k: true for unconfigured states,
 * which is a reasonable assumption for most remaining states.
 */
function stateDeductForFiling(
  state: StateCode,
  filing: FilingStatus,
  fedStdDeduction: number
): { deduction: number; allows401k: boolean } {
  const cfg = STATE_DEDUCT_CONFIG[state];
  if (!cfg) {
    // Safe default: use federal std deduction, assume 401k is excluded
    return { deduction: fedStdDeduction, allows401k: true };
  }
  return {
    deduction: filing === "married" ? cfg.married : cfg.single,
    allows401k: cfg.allows401k,
  };
}

// ─── State brackets ───────────────────────────────────────────────────────────
type StateBracketSet = { single: Bracket[]; married: Bracket[] };

const STATE_NONE = new Set<StateCode>([
  "ak",
  "fl",
  "nh",
  "nv",
  "sd",
  "tn",
  "tx",
  "wa",
  "wy",
]);

// Flat-rate states (rate applied to state taxable income after state deduction)
const STATE_FLAT: Partial<Record<StateCode, number>> = {
  ga:  0.0519, // 2025 flat rate (down from 5.39% in 2024 under HB 1015; verified vs. GA DOR, further reduced to 4.99% for 2026 under HB 463 — update when this calculator's base tax year advances)
  nc:  0.0425,
  ma:  0.05,
  pa:  0.0307,
  il:  0.0495,
  co:  0.044,
  az:  0.025,
};

// Bracket states (marginal rates applied to state taxable income)
const STATE_BRACKETS: Partial<Record<StateCode, StateBracketSet>> = {
  ny: {
    single: [
      { upTo: 8_500,                    rate: 0.04   },
      { upTo: 11_700,                   rate: 0.045  },
      { upTo: 13_900,                   rate: 0.0525 },
      { upTo: 80_650,                   rate: 0.055  },
      { upTo: 215_400,                  rate: 0.06   },
      { upTo: 1_077_550,                rate: 0.0685 },
      { upTo: 5_000_000,                rate: 0.0965 },
      { upTo: 25_000_000,               rate: 0.103  },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.109  },
    ],
    married: [
      { upTo: 17_150,                   rate: 0.04   },
      { upTo: 23_600,                   rate: 0.045  },
      { upTo: 27_900,                   rate: 0.0525 },
      { upTo: 161_550,                  rate: 0.055  },
      { upTo: 323_200,                  rate: 0.06   },
      { upTo: 2_155_350,                rate: 0.0685 },
      { upTo: 5_000_000,                rate: 0.0965 },
      { upTo: 25_000_000,               rate: 0.103  },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.109  },
    ],
  },

  ca: {
    single: [
      { upTo: 11_079,                   rate: 0.01   },
      { upTo: 26_264,                   rate: 0.02   },
      { upTo: 41_452,                   rate: 0.04   },
      { upTo: 57_542,                   rate: 0.06   },
      { upTo: 72_724,                   rate: 0.08   },
      { upTo: 371_479,                  rate: 0.093  },
      { upTo: 445_771,                  rate: 0.103  },
      { upTo: 742_953,                  rate: 0.113  },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.123  },
    ],
    married: [
      { upTo: 22_158,                   rate: 0.01   },
      { upTo: 52_528,                   rate: 0.02   },
      { upTo: 82_904,                   rate: 0.04   },
      { upTo: 115_084,                  rate: 0.06   },
      { upTo: 145_448,                  rate: 0.08   },
      { upTo: 742_958,                  rate: 0.093  },
      { upTo: 891_542,                  rate: 0.103  },
      { upTo: 1_485_906,                rate: 0.113  },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.123  },
    ],
  },

  nj: {
    single: [
      { upTo: 20_000,                   rate: 0.014   },
      { upTo: 35_000,                   rate: 0.0175  },
      { upTo: 40_000,                   rate: 0.035   },
      { upTo: 75_000,                   rate: 0.05525 },
      { upTo: 500_000,                  rate: 0.0637  },
      { upTo: 1_000_000,                rate: 0.0897  },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.1075  },
    ],
    married: [
      { upTo: 20_000,                   rate: 0.014   },
      { upTo: 50_000,                   rate: 0.0175  },
      { upTo: 70_000,                   rate: 0.0245  },
      { upTo: 80_000,                   rate: 0.035   },
      { upTo: 150_000,                  rate: 0.05525 },
      { upTo: 500_000,                  rate: 0.0637  },
      { upTo: 1_000_000,                rate: 0.0897  },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.1075  },
    ],
  },

  ct: {
    single: [
      { upTo: 10_000,                   rate: 0.02   },
      { upTo: 50_000,                   rate: 0.045  },
      { upTo: 100_000,                  rate: 0.055  },
      { upTo: 200_000,                  rate: 0.06   },
      { upTo: 250_000,                  rate: 0.065  },
      { upTo: 500_000,                  rate: 0.069  },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.0699 },
    ],
    married: [
      { upTo: 20_000,                   rate: 0.02   },
      { upTo: 100_000,                  rate: 0.045  },
      { upTo: 200_000,                  rate: 0.055  },
      { upTo: 400_000,                  rate: 0.06   },
      { upTo: 500_000,                  rate: 0.065  },
      { upTo: 1_000_000,                rate: 0.069  },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.0699 },
    ],
  },

  va: {
    single: [
      { upTo: 3_000,                    rate: 0.02   },
      { upTo: 5_000,                    rate: 0.03   },
      { upTo: 17_000,                   rate: 0.05   },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.0575 },
    ],
    married: [
      { upTo: 3_000,                    rate: 0.02   },
      { upTo: 5_000,                    rate: 0.03   },
      { upTo: 17_000,                   rate: 0.05   },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.0575 },
    ],
  },

  // SC: simplified 2-bracket structure after 2022 reform.
  // Top rate reducing gradually: 6.4% (2024) → 6.0% (2027 target).
  sc: {
    single: [
      { upTo: 3_460,                    rate: 0.0   },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.064 },
    ],
    married: [
      { upTo: 3_460,                    rate: 0.0   },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.064 },
    ],
  },
};

// ─── Fallback effective rates ─────────────────────────────────────────────────
// Only used for states not covered by STATE_NONE, STATE_FLAT, or STATE_BRACKETS.
// These are rough effective rates, not marginal brackets. Add proper brackets
// for any state that becomes high-traffic on the product.
type RateBands = Array<{ upTo: number; rate: number }>; // rate is in percent

const STATE_EFFECTIVE_FALLBACK: Partial<Record<StateCode, RateBands>> = {
  

  // Approximate effective rates for remaining states
  mn: [{ upTo: 75_000, rate: 5.5 }, { upTo: Infinity, rate: 7.8  }],
  or: [{ upTo: 125_000, rate: 7.0 }, { upTo: Infinity, rate: 9.0 }],
  md: [{ upTo: 100_000, rate: 5.0 }, { upTo: Infinity, rate: 5.75 }],
  wi: [{ upTo: 100_000, rate: 4.5 }, { upTo: Infinity, rate: 5.3  }],
  in: [{ upTo: Infinity, rate: 3.15 }],
  oh: [
    { upTo: 25_000,  rate: 0.0  },
    { upTo: 100_000, rate: 2.75 },
    { upTo: Infinity, rate: 3.5 },
  ],
  mi: [{ upTo: Infinity, rate: 4.25 }],
  mo: [{ upTo: 75_000, rate: 4.0 }, { upTo: Infinity, rate: 5.3   }],
  ks: [{ upTo: 15_000, rate: 3.1 }, { upTo: Infinity, rate: 5.7   }],
  ia: [{ upTo: Infinity, rate: 6.0  }],
  ut: [{ upTo: Infinity, rate: 4.65 }],
  id: [{ upTo: Infinity, rate: 5.8  }],
  mt: [{ upTo: Infinity, rate: 5.9  }],
  ne: [{ upTo: 35_000, rate: 3.51 }, { upTo: Infinity, rate: 5.84 }],
  ok: [{ upTo: Infinity, rate: 4.75 }],
  ar: [{ upTo: Infinity, rate: 4.4  }],
  la: [
    { upTo: 12_500, rate: 1.85 },
    { upTo: 50_000, rate: 3.5  },
    { upTo: Infinity, rate: 4.25 },
  ],
  ms: [{ upTo: Infinity, rate: 4.7  }],
  al: [
    { upTo: 500,    rate: 2.0 },
    { upTo: 3_000,  rate: 4.0 },
    { upTo: Infinity, rate: 5.0 },
  ],
  wv: [{ upTo: 60_000, rate: 4.5 }, { upTo: Infinity, rate: 5.12 }],
  ky: [{ upTo: Infinity, rate: 4.0 }],
  de: [{ upTo: 60_000, rate: 5.2 }, { upTo: Infinity, rate: 6.6  }],
  me: [{ upTo: 50_000, rate: 5.8 }, { upTo: Infinity, rate: 7.15 }],
  vt: [{ upTo: 75_000, rate: 5.35 }, { upTo: Infinity, rate: 8.75 }],
  hi: [{ upTo: 48_000, rate: 6.4 }, { upTo: Infinity, rate: 8.25 }],
  nm: [{ upTo: 50_000, rate: 3.2 }, { upTo: Infinity, rate: 5.9  }],
  nd: [{ upTo: Infinity, rate: 2.5  }],
};

function effectiveFallback(bands: RateBands | undefined, income: number): number {
  if (!Array.isArray(bands) || bands.length === 0) return 0;
  for (const b of bands) {
    if (income <= b.upTo) return b.rate / 100;
  }
  return bands[bands.length - 1]!.rate / 100;
}

function estimateStateTax(
  state: StateCode,
  taxableState: number,
  filing: FilingStatus
): number {
  if (taxableState <= 0) return 0;
  if (STATE_NONE.has(state)) return 0;

  const flat = STATE_FLAT[state];
  if (typeof flat === "number") return taxableState * flat;

  const bracketSet = STATE_BRACKETS[state];
  if (bracketSet) {
    const brackets = filing === "married" ? bracketSet.married : bracketSet.single;
    if (brackets.length > 0) {
      let tax = sumBrackets(taxableState, brackets);
      // CA Mental Health Services Tax (Prop 63): flat 1% surtax on CA taxable
      // income above $1,000,000. Applied as a separate add-on rather than a
      // bracket tier because the $1M threshold is identical across filing
      // statuses — it is NOT doubled for married filers the way CA's other
      // brackets are, and it has never been inflation-indexed since 2004.
      if (state === "ca") {
        tax += Math.max(0, taxableState - 1_000_000) * 0.01;
      }
      return tax;
    }
  }

  // Last resort: rough effective rate fallback
  return taxableState * effectiveFallback(STATE_EFFECTIVE_FALLBACK[state], taxableState);
}

// ─── Local tax ────────────────────────────────────────────────────────────────
type LocalTaxRule =
  | { type: "flat"; rate: number }
  | { type: "brackets"; single: Bracket[]; married: Bracket[] }
  | { type: "pctOfStateTax"; rate: number }; // e.g. Yonkers surcharge on NY state tax

const LOCAL_TAX_RULES: Record<string, LocalTaxRule> = {
  "nyc-ny": {
    type: "brackets",
    single: [
      { upTo: 12_000,                   rate: 0.03078 },
      { upTo: 25_000,                   rate: 0.03762 },
      { upTo: 50_000,                   rate: 0.03819 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.03876 },
    ],
    married: [
      { upTo: 21_600,                   rate: 0.03078 },
      { upTo: 45_000,                   rate: 0.03762 },
      { upTo: 90_000,                   rate: 0.03819 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.03876 },
    ],
  },
  "philadelphia-pa": { type: "flat", rate: 0.0375 },
  "pittsburgh-pa":   { type: "flat", rate: 0.03   }, // 1% city + 2% school district resident EIT (excludes ~$52/yr LST). Verified 2025.
  "kansas-city-mo":  { type: "flat", rate: 0.01   },
  "st-louis-mo":     { type: "flat", rate: 0.01   }, // St. Louis earnings tax, resident. Verified 2025.
  "columbus-oh":     { type: "flat", rate: 0.025  },
  "cleveland-oh":    { type: "flat", rate: 0.025  },
  "cincinnati-oh":   { type: "flat", rate: 0.018  },
  "detroit-mi":      { type: "flat", rate: 0.024  }, // Detroit resident income tax. Verified 2025.
  // Yonkers residents pay a surcharge equal to 16.75% of their NY state tax. Verified 2025.
  "yonkers-ny":      { type: "pctOfStateTax", rate: 0.1675 },
  // Maryland county income tax (residence-based, on MD taxable income). Verified 2025.
  "baltimore-md":    { type: "flat", rate: 0.032  }, // Baltimore City 3.20%
  "rockville-md":    { type: "flat", rate: 0.032  }, // Montgomery County 3.20%
  "frederick-md": {
    type: "brackets", // Frederick County graduated resident rates, 2025
    single: [
      { upTo: 25_000,                   rate: 0.0225 },
      { upTo: 50_000,                   rate: 0.0275 },
      { upTo: 150_000,                  rate: 0.0296 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.032  },
    ],
    married: [
      { upTo: 50_000,                   rate: 0.0225 },
      { upTo: 100_000,                  rate: 0.0275 },
      { upTo: 150_000,                  rate: 0.0296 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.032  },
    ],
  },
};

function estimateLocalIncomeTax(
  cityId: string | undefined,
  taxableIncome: number,
  filing: FilingStatus,
  stateTax: number
): number {
  if (!cityId) return 0;
  const rule = LOCAL_TAX_RULES[cityId.toLowerCase()];
  if (!rule) return 0;
  if (rule.type === "pctOfStateTax") return Math.max(0, stateTax) * rule.rate;
  if (taxableIncome <= 0) return 0;
  if (rule.type === "flat") return taxableIncome * rule.rate;
  const brackets = filing === "married" ? rule.married : rule.single;
  return sumBrackets(taxableIncome, brackets);
}

// ─── Core computation ─────────────────────────────────────────────────────────
export type TaxOpts = {
  grossAnnual: number;
  state: StateCode;
  filing: FilingStatus;
  k401Pct: number;
  cityId?: string;
  /**
   * Optional pre-computed 401(k) dollar amount, used instead of deriving it
   * from k401Pct. Needed for married dual-income households: the IRS elective
   * deferral limit (EMPLOYEE_401K_LIMIT) applies PER PERSON, not per return,
   * so a couple who each max out their own 401(k) can jointly exclude up to
   * 2x the single-filer limit. Callers combining two incomes into one
   * grossAnnual figure should compute each spouse's capped 401(k) dollar
   * amount separately, sum them, and pass the sum here — otherwise the
   * k401Pct path below re-applies the single-person cap to the household
   * total and understates the exclusion.
   */
  k401Dollar?: number;
};

/**
 * Internal: runs the full tax computation and returns every component.
 * Both public exports delegate here so the math only lives in one place.
 */
function compute(opts: TaxOpts): {
  gross: number;
  k401: number;
  after401k: number;
  taxableFederal: number;
  taxableState: number;
  federal: number;
  fica: number;
  state: number;
  local: number;
  totalTax: number;
  net: number;
} {

  const gross    = Math.max(0, Number(opts.grossAnnual) || 0);
  const k401Pct  = clamp(Number(opts.k401Pct) || 0, 0, 60);
  const hasDollarOverride = typeof opts.k401Dollar === "number" && Number.isFinite(opts.k401Dollar);
  const k401     = hasDollarOverride
    ? clamp(opts.k401Dollar as number, 0, gross)
    : Math.min(gross * (k401Pct / 100), EMPLOYEE_401K_LIMIT);
  const after401k = Math.max(0, gross - k401);

  // Federal taxable income
  const fedStdDeduction  = federalStandardDeduction(opts.filing);
  const taxableFederal   = Math.max(0, after401k - fedStdDeduction);
  const federal          = sumBrackets(taxableFederal, federalBrackets(opts.filing));
  const fica             = ficaTax(gross, opts.filing);

  // State taxable income: uses state-specific deduction AND 401k treatment.
  // Some states (NY, CA, NJ, MA, PA, IL) do not exclude 401k from state taxable income.
  const { deduction: stateDeduction, allows401k } = stateDeductForFiling(
    opts.state,
    opts.filing,
    fedStdDeduction
  );
  const stateGross     = allows401k ? after401k : gross;
  const taxableState   = Math.max(0, stateGross - stateDeduction);
  const state          = estimateStateTax(opts.state, taxableState, opts.filing);
  const local          = estimateLocalIncomeTax(opts.cityId, taxableState, opts.filing, state);

const totalTax = federal + fica + state + local;
const net = Math.max(0, after401k - totalTax);

return {
  gross,
  k401,
  after401k,
  taxableFederal,
  taxableState,
  federal,
  fica,
  state,
  local,
  totalTax,
  net,
};
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns annual net take-home only.
 * Unchanged signature — all existing callers (including binary-search in Calculator) work without modification.
 */
export function estimateNetAnnual(opts: TaxOpts): number {
  return compute(opts).net;
}

/**
 * Returns full annual tax breakdown.
 * Use this when displaying individual tax components in the UI.
 */
export function estimateNetBreakdown(opts: TaxOpts): TaxBreakdown {
  const {
    gross,
    k401,
    after401k,
    taxableFederal,
    taxableState,
    federal,
    fica,
    state,
    local,
    totalTax,
    net,
  } = compute(opts);

  return {
    gross,
    k401,
    after401k,
    taxableFederal,
    taxableState,
    federal,
    fica,
    state,
    local,
    totalTax,
    net,
  };
}

export function effectiveTaxRatePct(netAnnual: number, grossAnnual: number) {
  const g = Math.max(0, Number(grossAnnual) || 0);
  const n = Math.max(0, Number(netAnnual) || 0);
  if (g <= 0) return 0;
  return clamp((1 - n / g) * 100, 0, 99.9);
}