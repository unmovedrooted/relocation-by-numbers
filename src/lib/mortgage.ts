// src/lib/mortgage.ts

export type MortgageOptions = {
  downPct?: number;          // default 20%
  rate?: number;             // default 7%
  years?: number;            // default 30
  taxAndInsurancePct?: number; // default 0 (opt-in)
};

export function estimateMortgageMonthly(
  price: number,
  opts?: MortgageOptions
): number | null {
  const downPct = Math.min(1, Math.max(0, opts?.downPct ?? 0.2));
  const rate = opts?.rate ?? 0.07;
  const years = opts?.years ?? 30;
  const annualTaxIns = opts?.taxAndInsurancePct ?? 0;

  if (price <= 0 || annualTaxIns < 0) return null;

  const loan = price * (1 - downPct);
  const r = rate / 12;
  const n = years * 12;

  const monthlyTaxIns = (price * annualTaxIns) / 12;
  // Paid in cash: no loan payment, but the property tax and insurance remain.
  if (loan <= 0) return Number.isFinite(monthlyTaxIns) ? Math.round(monthlyTaxIns) : null;
  if (n <= 0) return null;

  const pmt = r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
  const total = pmt + monthlyTaxIns;

  return Number.isFinite(total) ? Math.round(total) : null;
}