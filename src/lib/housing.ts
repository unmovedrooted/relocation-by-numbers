/**
 * lib/housing.ts
 *
 * Core mortgage math, US state defaults, and affordability solver.
 * All rate / percent inputs are in percentage points (e.g. 7 = 7%, 20 = 20%),
 * never decimals. The old estimateMortgageMonthly bug (0.2 / 0.07 defaults)
 * is fixed here.
 */

// ─── Quick monthly P&I helper ─────────────────────────────────────────────────

export type MortgageOptions = {
  downPct?: number; // percentage  — 20 means 20%
  rate?: number;    // percentage  — 7 means 7%
  years?: number;   // default 30
};

/**
 * Quick monthly P&I estimate used by external pages / cards.
 *
 * BUG FIX: old defaults were 0.2 and 0.07 (decimals), which produced
 * nonsense results.  New defaults are 20 (%) and 7 (%), divided internally.
 */
export function estimateMortgageMonthly(
  price: number,
  opts?: MortgageOptions
): number | null {
  const downPct = (opts?.downPct ?? 20) / 100; // FIX: was 0.2
  const rate    = (opts?.rate    ?? 7)  / 100; // FIX: was 0.07
  const years   = opts?.years ?? 30;

  const loan = price * (1 - downPct);
  const r    = rate / 12;
  const n    = years * 12;

  if (loan <= 0 || r <= 0 || n <= 0) return null;
  const pmt = (loan * r) / (1 - Math.pow(1 + r, -n));
  return Number.isFinite(pmt) ? Math.round(pmt) : null;
}

// ─── Full monthly cost breakdown ──────────────────────────────────────────────

export type HousingCostInputs = {
  homePrice:      number;
  downPct:        number; // %
  ratePct:        number; // %
  termYears:      number;
  propertyTaxPct: number; // annual %
  homeInsMonthly: number;
  hoaMonthly:     number;
};

export type HousingCostResult = {
  principalInterest: number;
  propertyTax:       number;
  homeInsurance:     number;
  hoa:               number;
  totalMonthly:      number;
  loanAmount:        number;
};

export function monthlyHousingCost(i: HousingCostInputs): HousingCostResult {
  const down = i.homePrice * (i.downPct / 100);
  const loan = Math.max(0, i.homePrice - down);
  const r    = i.ratePct / 100 / 12;
  const n    = i.termYears * 12;
  let pi = 0;
  if (loan > 0 && Number.isFinite(n) && n > 0) {
    pi = r === 0
      ? loan / n
      : r > 0 && Number.isFinite(r)
        ? (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        : 0;
  }
  const tax = (i.homePrice * (i.propertyTaxPct / 100)) / 12;
  return {
    principalInterest: pi,
    propertyTax:       tax,
    homeInsurance:     i.homeInsMonthly,
    hoa:               i.hoaMonthly,
    totalMonthly:      pi + tax + i.homeInsMonthly + i.hoaMonthly,
    loanAmount:        loan,
  };
}

// ─── US state defaults ────────────────────────────────────────────────────────

export type StateDefaults = {
  name:             string;
  propertyTax:      number; // annual % of assessed value
  insuranceMonthly: number; // $/month at ~$400k home (scales with price)
  closingCostPct:   number; // % of purchase price
};

/**
 * State-level planning defaults sourced from ATTOM / III / CoreLogic public
 * averages (2023-2024). Insurance is calibrated to a ~$400k home; the
 * component scales it proportionally for different home prices.
 */
export const US_STATE_DEFAULTS: Record<string, StateDefaults> = {
  al: { name: "Alabama",        propertyTax: 0.41, insuranceMonthly: 200, closingCostPct: 2.2 },
  ak: { name: "Alaska",         propertyTax: 1.04, insuranceMonthly: 110, closingCostPct: 2.0 },
  az: { name: "Arizona",        propertyTax: 0.63, insuranceMonthly: 120, closingCostPct: 2.3 },
  ar: { name: "Arkansas",       propertyTax: 0.61, insuranceMonthly: 210, closingCostPct: 2.1 },
  ca: { name: "California",     propertyTax: 0.76, insuranceMonthly: 135, closingCostPct: 2.6 },
  co: { name: "Colorado",       propertyTax: 0.51, insuranceMonthly: 145, closingCostPct: 2.2 },
  ct: { name: "Connecticut",    propertyTax: 2.14, insuranceMonthly: 125, closingCostPct: 2.8 },
  de: { name: "Delaware",       propertyTax: 0.57, insuranceMonthly: 100, closingCostPct: 3.2 },
  fl: { name: "Florida",        propertyTax: 0.89, insuranceMonthly: 280, closingCostPct: 2.4 },
  ga: { name: "Georgia",        propertyTax: 0.92, insuranceMonthly: 145, closingCostPct: 2.3 },
  hi: { name: "Hawaii",         propertyTax: 0.28, insuranceMonthly: 115, closingCostPct: 2.5 },
  id: { name: "Idaho",          propertyTax: 0.69, insuranceMonthly: 105, closingCostPct: 2.0 },
  il: { name: "Illinois",       propertyTax: 2.27, insuranceMonthly: 145, closingCostPct: 2.5 },
  in: { name: "Indiana",        propertyTax: 0.85, insuranceMonthly: 135, closingCostPct: 2.1 },
  ia: { name: "Iowa",           propertyTax: 1.57, insuranceMonthly: 140, closingCostPct: 2.0 },
  ks: { name: "Kansas",         propertyTax: 1.41, insuranceMonthly: 215, closingCostPct: 2.1 },
  ky: { name: "Kentucky",       propertyTax: 0.86, insuranceMonthly: 155, closingCostPct: 2.2 },
  la: { name: "Louisiana",      propertyTax: 0.55, insuranceMonthly: 290, closingCostPct: 2.3 },
  me: { name: "Maine",          propertyTax: 1.36, insuranceMonthly: 100, closingCostPct: 2.3 },
  md: { name: "Maryland",       propertyTax: 1.09, insuranceMonthly: 115, closingCostPct: 3.5 },
  ma: { name: "Massachusetts",  propertyTax: 1.23, insuranceMonthly: 115, closingCostPct: 3.0 },
  mi: { name: "Michigan",       propertyTax: 1.54, insuranceMonthly: 120, closingCostPct: 2.3 },
  mn: { name: "Minnesota",      propertyTax: 1.12, insuranceMonthly: 140, closingCostPct: 2.2 },
  ms: { name: "Mississippi",    propertyTax: 0.65, insuranceMonthly: 220, closingCostPct: 2.1 },
  mo: { name: "Missouri",       propertyTax: 1.01, insuranceMonthly: 175, closingCostPct: 2.2 },
  mt: { name: "Montana",        propertyTax: 0.84, insuranceMonthly: 105, closingCostPct: 2.0 },
  ne: { name: "Nebraska",       propertyTax: 1.73, insuranceMonthly: 185, closingCostPct: 2.1 },
  nv: { name: "Nevada",         propertyTax: 0.60, insuranceMonthly: 110, closingCostPct: 2.3 },
  nh: { name: "New Hampshire",  propertyTax: 2.18, insuranceMonthly: 100, closingCostPct: 2.4 },
  nj: { name: "New Jersey",     propertyTax: 2.49, insuranceMonthly: 130, closingCostPct: 3.0 },
  nm: { name: "New Mexico",     propertyTax: 0.80, insuranceMonthly: 120, closingCostPct: 2.2 },
  ny: { name: "New York",       propertyTax: 1.72, insuranceMonthly: 130, closingCostPct: 3.5 },
  nc: { name: "North Carolina", propertyTax: 0.84, insuranceMonthly: 145, closingCostPct: 2.3 },
  nd: { name: "North Dakota",   propertyTax: 0.98, insuranceMonthly: 135, closingCostPct: 2.0 },
  oh: { name: "Ohio",           propertyTax: 1.59, insuranceMonthly: 130, closingCostPct: 2.2 },
  ok: { name: "Oklahoma",       propertyTax: 0.90, insuranceMonthly: 235, closingCostPct: 2.2 },
  or: { name: "Oregon",         propertyTax: 0.97, insuranceMonthly: 105, closingCostPct: 2.2 },
  pa: { name: "Pennsylvania",   propertyTax: 1.58, insuranceMonthly: 115, closingCostPct: 3.5 },
  ri: { name: "Rhode Island",   propertyTax: 1.63, insuranceMonthly: 115, closingCostPct: 2.5 },
  sc: { name: "South Carolina", propertyTax: 0.57, insuranceMonthly: 175, closingCostPct: 2.2 },
  sd: { name: "South Dakota",   propertyTax: 1.31, insuranceMonthly: 135, closingCostPct: 2.0 },
  tn: { name: "Tennessee",      propertyTax: 0.71, insuranceMonthly: 175, closingCostPct: 2.2 },
  tx: { name: "Texas",          propertyTax: 1.80, insuranceMonthly: 220, closingCostPct: 2.3 },
  ut: { name: "Utah",           propertyTax: 0.63, insuranceMonthly: 105, closingCostPct: 2.1 },
  vt: { name: "Vermont",        propertyTax: 1.90, insuranceMonthly: 100, closingCostPct: 2.4 },
  va: { name: "Virginia",       propertyTax: 0.82, insuranceMonthly: 115, closingCostPct: 2.8 },
  wa: { name: "Washington",     propertyTax: 0.98, insuranceMonthly: 110, closingCostPct: 2.4 },
  wv: { name: "West Virginia",  propertyTax: 0.59, insuranceMonthly: 115, closingCostPct: 2.1 },
  wi: { name: "Wisconsin",      propertyTax: 1.85, insuranceMonthly: 125, closingCostPct: 2.2 },
  wy: { name: "Wyoming",        propertyTax: 0.61, insuranceMonthly: 115, closingCostPct: 2.0 },
  dc: { name: "Washington DC",  propertyTax: 0.56, insuranceMonthly: 115, closingCostPct: 3.5 },
};

// ─── Iterative affordability solver ──────────────────────────────────────────

type SolveMaxHomePriceOpts = {
  grossMonthly:     number;
  downPct:          number; // %
  annualRate:       number; // %
  termYears:        number;
  propertyTaxRate:  number; // annual %
  insuranceMonthly: number; // $/mo at baseHomePrice
  hoaMonthly:       number;
  targetDTI?:       number; // default 28
  baseHomePrice?:   number; // reference for insurance scaling, default 400_000
};

/**
 * Binary-search solver: finds the maximum home price where the full PITI
 * (principal, interest, tax, insurance, PMI) stays within targetDTI % of
 * grossMonthly.  Insurance and PMI are re-estimated at each candidate price,
 * making this more accurate than the closed-form approximation.
 */
export function solveMaxHomePrice({
  grossMonthly,
  downPct,
  annualRate,
  termYears,
  propertyTaxRate,
  insuranceMonthly,
  hoaMonthly,
  targetDTI = 28,
  baseHomePrice = 400_000,
}: SolveMaxHomePriceOpts): number {
  if (grossMonthly <= 0 || annualRate <= 0 || termYears <= 0) return 0;

  const dpFrac = downPct / 100;
  const r      = annualRate / 100 / 12;
  const n      = termYears * 12;
  let lo = 0;
  let hi = grossMonthly * 12 * 15; // ceiling = 15× annual gross income

  for (let i = 0; i < 60; i++) {
    const mid  = (lo + hi) / 2;
    const down = mid * dpFrac;
    const loan = mid - down;

    const pi  =
      loan > 0 && r > 0
        ? (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        : 0;
    const tax = (mid * (propertyTaxRate / 100)) / 12;
    const ins = baseHomePrice > 0 ? insuranceMonthly * (mid / baseHomePrice) : insuranceMonthly;

    // Auto PMI — same tiers as the main calculator
    let pmi = 0;
    if (dpFrac < 0.20 && loan > 0) {
      const ltv  = loan / mid;
      const pmiR = ltv > 0.95 ? 0.015 : ltv > 0.90 ? 0.012 : ltv > 0.85 ? 0.009 : 0.007;
      pmi = (loan * pmiR) / 12;
    }

    const total = pi + tax + ins + hoaMonthly + pmi;
    const dti   = (total / grossMonthly) * 100;

    if (dti <= targetDTI) lo = mid;
    else hi = mid;
  }

  return Math.round(lo / 1_000) * 1_000; // round to nearest $1k
}

// ─── PMI cancellation with optional appreciation ──────────────────────────────

/**
 * Month when LTV first drops to 80% — with optional home appreciation.
 * Without appreciation this matches the existing calcPMIDropOff.
 * With appreciation the home value grows monthly, so cancellation arrives
 * sooner: a lower balance against a higher value crosses 80% LTV earlier.
 */
export function calcPMIDropOffWithAppreciation(
  loan: number,
  homePrice: number,
  annualRate: number,
  monthlyPayment: number,
  appreciationRatePct: number = 0
): number | null {
  if (!loan || !homePrice || !annualRate || !monthlyPayment) return null;
  const r    = annualRate / 100 / 12;
  const appR = appreciationRatePct / 100 / 12;
  let bal  = loan;
  let val  = homePrice;

  for (let m = 1; m <= 360; m++) {
    const int  = bal * r;
    const prin = monthlyPayment - int;
    if (prin <= 0) return null;
    bal  = Math.max(0, bal - prin);
    val *= 1 + appR;
    // Cancel at 80% of *current* (appreciated) value
    if (bal <= val * 0.80) return m;
  }
  return null;
}
