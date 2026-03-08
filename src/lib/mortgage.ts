// src/lib/mortgage.ts

export type MortgageOptions = {
  downPct?: number;   // default 20%
  rate?: number;      // default 7%
  years?: number;     // default 30
};

export function estimateMortgageMonthly(
  price: number,
  opts?: MortgageOptions
): number | null {
  const downPct = opts?.downPct ?? 0.2;
  const rate = opts?.rate ?? 0.07;
  const years = opts?.years ?? 30;

  const loan = price * (1 - downPct);
  const r = rate / 12;
  const n = years * 12;

  if (loan <= 0 || r <= 0 || n <= 0) return null;

  const pmt = (loan * r) / (1 - Math.pow(1 + r, -n));
  return Number.isFinite(pmt) ? Math.round(pmt) : null;
}