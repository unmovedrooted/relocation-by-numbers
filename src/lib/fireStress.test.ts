import { describe, expect, it } from "vitest";
import { fireAgeRange, retirementStress } from "./fireStress";
import { returnPaths } from "./monteCarlo";

describe("returnPaths", () => {
  it("is deterministic and averages to the requested mean", () => {
    const a = returnPaths({ years: 30, meanForYear: () => 0.07, volatility: 0.13, nPaths: 4000 });
    const b = returnPaths({ years: 30, meanForYear: () => 0.07, volatility: 0.13, nPaths: 4000 });
    expect(Array.from(a[17])).toEqual(Array.from(b[17]));
    let sum = 0;
    for (const p of a) for (const r of p) sum += r;
    expect(sum / (4000 * 30)).toBeCloseTo(0.07, 2);
  });

  it("follows a mean that changes by year, and has no spread at zero volatility", () => {
    const flat = returnPaths({ years: 4, meanForYear: (y) => (y < 2 ? 0.07 : 0.055), volatility: 0, nPaths: 3 });
    for (const p of flat) expect(Array.from(p).map((r) => Number(r.toFixed(6)))).toEqual([0.07, 0.07, 0.055, 0.055]);
  });

  it("never returns less than a total loss", () => {
    for (const p of returnPaths({ years: 40, meanForYear: () => 0.05, volatility: 0.18, nPaths: 500 })) for (const r of p) expect(r).toBeGreaterThan(-1);
  });
});

describe("fireAgeRange", () => {
  it("reads the 10th, 50th and 90th percentile ages", () => {
    const years = Array.from({ length: 101 }, (_, i) => 10 + i / 10); // 10.0 to 20.0
    const r = fireAgeRange(30, years);
    expect(r.early).toBeCloseTo(41, 5);
    expect(r.median).toBeCloseTo(45, 5);
    expect(r.late).toBeCloseTo(49, 5);
    expect(r.reachedShare).toBe(1);
  });

  it("reports the slow tail as not reached when it is not", () => {
    const years: (number | null)[] = [...Array.from({ length: 80 }, () => 20), ...Array.from({ length: 20 }, () => null)];
    const r = fireAgeRange(35, years);
    expect(r.early).toBe(55);
    expect(r.median).toBe(55);
    expect(r.late).toBeNull();
    expect(r.reachedShare).toBeCloseTo(0.8, 5);
  });

  it("handles an empty run", () => {
    expect(fireAgeRange(40, [])).toEqual({ early: null, median: null, late: null, reachedShare: 0, paths: 0 });
  });
});

describe("retirementStress", () => {
  const base = { annualSpending: 40_000, withdrawalRatePct: 4, realReturn: 0.04, volatility: 0.13, fireAge: 50 };

  it("uses the years from the FIRE age to 95", () => {
    expect(retirementStress(base)!.horizon).toBe(45);
    expect(retirementStress({ ...base, fireAge: 65 })!.horizon).toBe(30);
  });

  it("with no volatility and a real return equal to the withdrawal rate, the money always lasts", () => {
    expect(retirementStress({ ...base, volatility: 0 })!.successRate).toBe(1);
  });

  it("spending less never lowers the success rate, and more volatility lowers it", () => {
    const r = retirementStress(base)!;
    expect(r.successRateTenPctLess).toBeGreaterThanOrEqual(r.successRate);
    expect(retirementStress({ ...base, volatility: 0.18 })!.successRate).toBeLessThan(retirementStress({ ...base, volatility: 0.08 })!.successRate);
    expect(r.successRate).toBeGreaterThan(0.3);
    expect(r.successRate).toBeLessThan(1);
  });

  it("hand-calculated bad start: 4% withdrawal, 0% real return, 30% fall in year one", () => {
    // Start 1,000,000, spend 40,000. Year 1: (1,000,000 - 40,000) x 0.7 = 672,000. Then 40,000 a year with no growth:
    // 672,000 / 40,000 = 16.8, so 16 more full years. Total 17 full years.
    expect(retirementStress({ ...base, realReturn: 0 })!.badStartYears).toBe(17);
  });

  it("a bad start that the portfolio survives returns null", () => {
    // A 2% withdrawal with a 4% real return recovers easily.
    expect(retirementStress({ ...base, withdrawalRatePct: 2 })!.badStartYears).toBeNull();
  });

  it("returns null without spending, a withdrawal rate or time to cover", () => {
    expect(retirementStress({ ...base, annualSpending: 0 })).toBeNull();
    expect(retirementStress({ ...base, withdrawalRatePct: 0 })).toBeNull();
    expect(retirementStress({ ...base, fireAge: 96 })).toBeNull();
  });
});
