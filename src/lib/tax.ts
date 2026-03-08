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
  return filing === "married" ? 31500 : 15750;
}

function federalBrackets(filing: FilingStatus): Bracket[] {
  // MVP: 2025 brackets
  if (filing === "married") {
    return [
      { upTo: 23850, rate: 0.10 },
      { upTo: 96950, rate: 0.12 },
      { upTo: 206700, rate: 0.22 },
      { upTo: 394600, rate: 0.24 },
      { upTo: 501050, rate: 0.32 },
      { upTo: 751600, rate: 0.35 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
    ];
  }
  return [
    { upTo: 11925, rate: 0.10 },
    { upTo: 48475, rate: 0.12 },
    { upTo: 103350, rate: 0.22 },
    { upTo: 197300, rate: 0.24 },
    { upTo: 250525, rate: 0.32 },
    { upTo: 626350, rate: 0.35 },
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

// --- Your existing state effective bands (keep for now; upgrade later) ---
type RateBands = Array<{ upTo: number; rate: number }>; // effective %

const STATE_EFFECTIVE: Record<StateCode, RateBands> = {
  ny: [
    { upTo: 100_000, rate: 5.5 },
    { upTo: 200_000, rate: 6.3 },
    { upTo: Infinity, rate: 6.8 },
  ],
  nj: [
    { upTo: 100_000, rate: 4.8 },
    { upTo: 200_000, rate: 6.1 },
    { upTo: Infinity, rate: 7.2 },
  ],
  ct: [
    { upTo: 100_000, rate: 4.8 },
    { upTo: 200_000, rate: 5.6 },
    { upTo: Infinity, rate: 6.2 },
  ],
  ma: [{ upTo: Infinity, rate: 5.0 }],
  pa: [{ upTo: Infinity, rate: 3.1 }],
  nc: [{ upTo: Infinity, rate: 4.5 }],
  sc: [
    { upTo: 100_000, rate: 5.0 },
    { upTo: Infinity, rate: 5.8 },
  ],
  va: [
    { upTo: 100_000, rate: 4.8 },
    { upTo: Infinity, rate: 5.3 },
  ],
  ga: [
    { upTo: 100_000, rate: 4.8 },
    { upTo: Infinity, rate: 5.4 },
  ],
  fl: [{ upTo: Infinity, rate: 0.0 }],
  tx: [{ upTo: Infinity, rate: 0.0 }],
  wa: [{ upTo: Infinity, rate: 0.0 }],
  ca: [
    { upTo: 100_000, rate: 5.2 },
    { upTo: 200_000, rate: 7.2 },
    { upTo: Infinity, rate: 8.8 },
  ],
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
      { upTo: 21600, rate: 0.03078 },
      { upTo: 45000, rate: 0.03762 },
      { upTo: 90000, rate: 0.03819 },
      { upTo: Number.POSITIVE_INFINITY, rate: 0.03876 },
    ];
  }
  return [
    { upTo: 12000, rate: 0.03078 },
    { upTo: 25000, rate: 0.03762 },
    { upTo: 50000, rate: 0.03819 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.03876 },
  ];
}

export function estimateNetAnnual(opts: {
  grossAnnual: number;
  state: StateCode;
  filing: FilingStatus;
  k401Pct: number;
  cityId?: string; // 👈 add this
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
  const stateTax = taxableState * effectiveRate(STATE_EFFECTIVE[opts.state], taxableState);

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
