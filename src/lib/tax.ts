import type { StateCode } from "./states";

export type FilingStatus = "single" | "married";

type Bracket = { upTo: number; rate: number }; // marginal bracket

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

// --- Federal (use a single tax year for MVP; we can upgrade later) ---
function standardDeduction(filing: FilingStatus) {
  // MVP: 2025 standard deduction (good enough for directional planning)
  return filing === "married" ? 31_500 : 15_750;
}

function federalBrackets(filing: FilingStatus): Bracket[] {
  // MVP: 2025 brackets
  if (filing === "married") {
    return [
      { upTo: 23_850, rate: 0.10 },
      { upTo: 96_950, rate: 0.12 },
      { upTo: 206_700, rate: 0.22 },
      { upTo: 394_600, rate: 0.24 },
      { upTo: 501_050, rate: 0.32 },
      { upTo: 751_600, rate: 0.35 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
    ];
  }

  return [
    { upTo: 11_925, rate: 0.10 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
  ];
}

// --- FICA ---
function ficaTax(wagesAfter401k: number, filing: FilingStatus) {
  const wages = Math.max(0, wagesAfter401k);

  // MVP wage base (update later if you want)
  const ssWageBase = 176_100;

  const ss = Math.min(wages, ssWageBase) * 0.062;
  const medicare = wages * 0.0145;

  // Additional Medicare 0.9% above threshold
  const threshold = filing === "married" ? 250_000 : 200_000;
  const addl = Math.max(0, wages - threshold) * 0.009;

  return ss + medicare + addl;
}

// --- New state tax structure ---
type StateBracketSet = {
  single: Bracket[];
  married: Bracket[];
};

const STATE_NONE = new Set<StateCode>(["fl", "tx", "wa"]);

const STATE_FLAT: Partial<Record<StateCode, number>> = {
  ga: 0.0519,
  nc: 0.0425,
  ma: 0.05,
  pa: 0.0307,
  il: 0.0495,
  co: 0.044,
  az: 0.025,
};

const STATE_BRACKETS: Partial<Record<StateCode, StateBracketSet>> = {
  ny: {
    single: [
      { upTo: 8_500, rate: 0.04 },
      { upTo: 11_700, rate: 0.045 },
      { upTo: 13_900, rate: 0.0525 },
      { upTo: 80_650, rate: 0.055 },
      { upTo: 215_400, rate: 0.06 },
      { upTo: 1_077_550, rate: 0.0685 },
      { upTo: 5_000_000, rate: 0.0965 },
      { upTo: 25_000_000, rate: 0.103 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.109 },
    ],
    married: [
      { upTo: 17_150, rate: 0.04 },
      { upTo: 23_600, rate: 0.045 },
      { upTo: 27_900, rate: 0.0525 },
      { upTo: 161_550, rate: 0.055 },
      { upTo: 323_200, rate: 0.06 },
      { upTo: 2_155_350, rate: 0.0685 },
      { upTo: 5_000_000, rate: 0.0965 },
      { upTo: 25_000_000, rate: 0.103 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.109 },
    ],
  },

  ca: {
    single: [
      { upTo: 11_079, rate: 0.01 },
      { upTo: 26_264, rate: 0.02 },
      { upTo: 41_452, rate: 0.04 },
      { upTo: 57_542, rate: 0.06 },
      { upTo: 72_724, rate: 0.08 },
      { upTo: 371_479, rate: 0.093 },
      { upTo: 445_771, rate: 0.103 },
      { upTo: 742_953, rate: 0.113 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.123 },
    ],
    married: [
      { upTo: 22_158, rate: 0.01 },
      { upTo: 52_528, rate: 0.02 },
      { upTo: 82_904, rate: 0.04 },
      { upTo: 115_084, rate: 0.06 },
      { upTo: 145_448, rate: 0.08 },
      { upTo: 742_958, rate: 0.093 },
      { upTo: 891_542, rate: 0.103 },
      { upTo: 1_485_906, rate: 0.113 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.123 },
    ],
  },

  nj: {
    single: [
      { upTo: 20_000, rate: 0.014 },
      { upTo: 35_000, rate: 0.0175 },
      { upTo: 40_000, rate: 0.035 },
      { upTo: 75_000, rate: 0.05525 },
      { upTo: 500_000, rate: 0.0637 },
      { upTo: 1_000_000, rate: 0.0897 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.1075 },
    ],
    married: [
      { upTo: 20_000, rate: 0.014 },
      { upTo: 50_000, rate: 0.0175 },
      { upTo: 70_000, rate: 0.0245 },
      { upTo: 80_000, rate: 0.035 },
      { upTo: 150_000, rate: 0.05525 },
      { upTo: 500_000, rate: 0.0637 },
      { upTo: 1_000_000, rate: 0.0897 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.1075 },
    ],
  },

  ct: {
    single: [
      { upTo: 10_000, rate: 0.02 },
      { upTo: 50_000, rate: 0.045 },
      { upTo: 100_000, rate: 0.055 },
      { upTo: 200_000, rate: 0.06 },
      { upTo: 250_000, rate: 0.065 },
      { upTo: 500_000, rate: 0.069 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.0699 },
    ],
    married: [
      { upTo: 20_000, rate: 0.02 },
      { upTo: 100_000, rate: 0.045 },
      { upTo: 200_000, rate: 0.055 },
      { upTo: 400_000, rate: 0.06 },
      { upTo: 500_000, rate: 0.065 },
      { upTo: 1_000_000, rate: 0.069 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.0699 },
    ],
  },
  va: {
  single: [
    { upTo: 3_000, rate: 0.02 },
    { upTo: 5_000, rate: 0.03 },
    { upTo: 17_000, rate: 0.05 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.0575 },
  ],
  married: [
    { upTo: 3_000, rate: 0.02 },
    { upTo: 5_000, rate: 0.03 },
    { upTo: 17_000, rate: 0.05 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.0575 },
  ],
},
};
// --- Existing state effective bands (fallback until you upgrade more states) ---
type RateBands = Array<{ upTo: number; rate: number }>; // effective %

const STATE_EFFECTIVE: Partial<Record<StateCode, RateBands>> = {
 
  
  ma: [{ upTo: Infinity, rate: 5.0 }],
  pa: [{ upTo: Infinity, rate: 3.1 }],
  nc: [{ upTo: Infinity, rate: 4.5 }],
  sc: [
    { upTo: 100_000, rate: 5.0 },
    { upTo: Infinity, rate: 5.8 },
  ],
  fl: [{ upTo: Infinity, rate: 0.0 }],
  tx: [{ upTo: Infinity, rate: 0.0 }],
  wa: [{ upTo: Infinity, rate: 0.0 }],
 
  il: [{ upTo: Infinity, rate: 4.6 }],
  co: [{ upTo: Infinity, rate: 4.5 }],
  az: [{ upTo: Infinity, rate: 3.0 }],
};

function effectiveRate(bands: RateBands | undefined, income: number): number {
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

  if (state === "sc") {
    if (taxableState >= 100_000) {
      return Math.max(0, taxableState * 0.06 - 642);
    }

    return taxableState * effectiveRate(STATE_EFFECTIVE[state], taxableState);
  }

  const flat = STATE_FLAT[state];
  if (typeof flat === "number") {
    return taxableState * flat;
  }

  const bracketSet = STATE_BRACKETS[state];
  if (bracketSet) {
    const brackets =
      filing === "married" ? bracketSet.married : bracketSet.single;

    if (brackets.length > 0) {
      return sumBrackets(taxableState, brackets);
    }
  }

  return taxableState * effectiveRate(STATE_EFFECTIVE[state], taxableState);
}

// --- NYC local tax (only if cityId is NYC) ---
function isNYC(cityId?: string) {
  if (!cityId) return false;
  const id = cityId.toLowerCase();
  // NOTE: adjust these once you confirm your NYC id from cities.ts
  return id === "nyc" || id.includes("new-york") || id.includes("newyork");
}

function nycBrackets(filing: FilingStatus): Bracket[] {
  // NYC resident PIT rates (MVP)
  if (filing === "married") {
    return [
      { upTo: 21_600, rate: 0.03078 },
      { upTo: 45_000, rate: 0.03762 },
      { upTo: 90_000, rate: 0.03819 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.03876 },
    ];
  }
  return [
    { upTo: 12_000, rate: 0.03078 },
    { upTo: 25_000, rate: 0.03762 },
    { upTo: 50_000, rate: 0.03819 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.03876 },
  ];
}

export function estimateNetAnnual(opts: {
  grossAnnual: number;
  state: StateCode;
  filing: FilingStatus;
  k401Pct: number;
  cityId?: string;
}): number {
  const gross = Math.max(0, Number(opts.grossAnnual) || 0);

  const k401Pct = clamp(Number(opts.k401Pct) || 0, 0, 60);
  // Keep your simple cap (optional)
  const k401 = Math.min(gross * (k401Pct / 100), 23_000);

  const after401k = Math.max(0, gross - k401);

  // Federal taxable income (MVP: standard deduction only)
  const taxableFederal = Math.max(0, after401k - standardDeduction(opts.filing));

  const fed = sumBrackets(taxableFederal, federalBrackets(opts.filing));
  const fica = ficaTax(after401k, opts.filing);

  // State tax base (MVP: use same taxable as federal)
  const taxableState = taxableFederal;
  const stateTax = estimateStateTax(opts.state, taxableState, opts.filing);

  const nycTax =
    opts.state === "ny" && isNYC(opts.cityId)
      ? sumBrackets(taxableState, nycBrackets(opts.filing))
      : 0;

  return Math.max(0, after401k - fed - fica - stateTax - nycTax);
}

export function effectiveTaxRatePct(netAnnual: number, grossAnnual: number) {
  const g = Math.max(0, Number(grossAnnual) || 0);
  const n = Math.max(0, Number(netAnnual) || 0);
  if (g <= 0) return 0;
  return clamp((1 - n / g) * 100, 0, 99.9);
}