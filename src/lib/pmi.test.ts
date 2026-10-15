import { describe, expect, it } from "vitest";
import { estimatePmiMonthly, housingCostAtPrice, MAX_MANUAL_PMI_ANNUAL_PCT } from "./housing";
import { computeUsCityResult, type UsCompareInput } from "./compareEngines/us";

// One PMI helper with two explicit modes. Automatic: a rate by loan-to-value. Manual: the annual rate the caller passes.
describe("automatic PMI (loan-to-value tiers)", () => {
  const price = 400000;
  const at = (downPct: number) => estimatePmiMonthly(price * (1 - downPct / 100), price, downPct);
  it("uses 0.7%, 0.9%, 1.2% and 1.5% of the loan by loan-to-value, with the boundaries in the lower tier", () => {
    expect(at(20)).toBe(0); // no PMI at 20% down
    expect(at(19.99)).toBeCloseTo(price * 0.8001 * 0.007 / 12, 6); // just under 20% down: loan-to-value 80.01%
    expect(at(15)).toBeCloseTo(340000 * 0.007 / 12, 8); // exactly 85% loan-to-value: 0.7%
    expect(at(14.9)).toBeCloseTo(price * 0.851 * 0.009 / 12, 6); // over 85%: 0.9%
    expect(at(10)).toBeCloseTo(360000 * 0.009 / 12, 8); // exactly 90%: 0.9%
    expect(at(9.9)).toBeCloseTo(price * 0.901 * 0.012 / 12, 6); // over 90%: 1.2%
    expect(at(5)).toBeCloseTo(380000 * 0.012 / 12, 8); // exactly 95%: 1.2% = 380.00
    expect(at(4.9)).toBeCloseTo(price * 0.951 * 0.015 / 12, 6); // over 95%: 1.5%
    expect(at(0)).toBeCloseTo(400000 * 0.015 / 12, 8);
  });
  it("returns zero for no loan, no price or an invalid down payment", () => {
    expect(estimatePmiMonthly(0, price, 5)).toBe(0);
    expect(estimatePmiMonthly(300000, 0, 5)).toBe(0);
    expect(estimatePmiMonthly(Number.NaN, price, 5)).toBe(0);
    expect(estimatePmiMonthly(300000, price, Number.NaN)).toBe(0);
  });
});

describe("manual PMI (an entered annual rate)", () => {
  const loan = 380000, price = 400000;
  it("uses exactly the entered rate, and a manual zero means no PMI", () => {
    expect(estimatePmiMonthly(loan, price, 5)).toBeCloseTo(380, 8); // automatic, for comparison
    expect(estimatePmiMonthly(loan, price, 5, 0.5)).toBeCloseTo(158.3333333, 6);
    expect(estimatePmiMonthly(loan, price, 5, 0)).toBe(0);
  });
  it("does not need a price, applies only below 20% down, and limits the rate to 0% to 2%", () => {
    expect(estimatePmiMonthly(loan, 0, 5, 0.5)).toBeCloseTo(158.3333333, 6);
    expect(estimatePmiMonthly(320000, 400000, 20, 0.5)).toBe(0);
    expect(estimatePmiMonthly(loan, price, 5, 9)).toBeCloseTo(loan * (MAX_MANUAL_PMI_ANNUAL_PCT / 100) / 12, 8);
    expect(estimatePmiMonthly(loan, price, 5, -1)).toBe(0);
    expect(estimatePmiMonthly(loan, price, 5, Number.NaN)).toBe(0);
  });
});

describe("every caller uses the same helper in its own mode", () => {
  it("the affordability cost at a price is automatic mode", () => {
    const r = housingCostAtPrice({ homePrice: 400000, downPct: 5, ratePct: 6.5, termYears: 30, propertyTaxPct: 1, insuranceMonthly: 100, hoaMonthly: 0 });
    expect(r.pmi).toBeCloseTo(380, 8);
  });
  it("Compare Cities buy mode uses the entered rate, including zero", () => {
    const input = (pmiAnnualPct: number): UsCompareInput => ({
      city: { id: "audit-tx", name: "Audit", state: "tx", medianHomePrice: 400000, defaultRent: 2000 } as UsCompareInput["city"],
      grossAnnual: 150000, filing: "single", k401Pct: 0, mode: "buy",
      buy: { downPct: 5, ratePct: 6.5, termYears: 30, propertyTaxPct: 1, homeInsMonthly: 100, hoaMonthly: 0, pmiAnnualPct },
      rent: { rentersInsMonthly: 20, parkingMonthly: 0 },
    });
    const none = computeUsCityResult(input(0)).housingMonthly;
    const half = computeUsCityResult(input(0.5)).housingMonthly;
    const one = computeUsCityResult(input(1)).housingMonthly;
    expect(half - none).toBeCloseTo(380000 * 0.005 / 12, 6);
    expect(one - none).toBeCloseTo(380000 * 0.01 / 12, 6);
  });
});
