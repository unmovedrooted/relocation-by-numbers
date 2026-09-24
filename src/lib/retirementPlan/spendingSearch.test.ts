import { describe, expect, it } from "vitest";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";
import { searchMaxSustainableSpending, type SpendingSearchRequest } from "./spendingSearch";

const simulation: SpendingSearchRequest["simulation"] = {
  paths: 5, seed: 42, volatilityByAccount: {}, returnModel: "lognormal-shared-market-nominal", conversionPolicy: "fixed-input-schedule",
};

/** Single-year, income-free, cash-only household: success is exactly spending <= cashBalance. */
function cashOnlyScenario(cashBalance: number) {
  const base = buildPreviewInput({ ...PREVIEW_DEFAULTS, endYear: "2026" });
  return { ...base, accounts: base.accounts.filter(a => a.kind === "cash").map(a => ({ ...a, balance: cashBalance })),
    withdrawalOrder: ["cash"], income: [] };
}

describe("maximum sustainable spending search", () => {
  it("converges on the exact cash threshold at the requested resolution", () => {
    const input = cashOnlyScenario(50_000);
    const before = structuredClone(input);
    const result = searchMaxSustainableSpending(input, {
      minSpending: 0, maxSpending: 100_000, resolution: 1_000, successTarget: 0.9, simulation,
    });
    expect(input).toEqual(before);
    expect(result.found).not.toBeNull();
    expect(result.found!.spending).toBe(50_000);
    expect(result.found!.successRate).toBe(1);
    // The next resolution step up must actually fail, proving the boundary is real.
    const overBudget = runRetirementTimeline({ ...input, spendingAnnual: 51_000 });
    expect(overBudget.allYearsFunded).toBe(false);
    const withinBudget = runRetirementTimeline({ ...input, spendingAnnual: 50_000 });
    expect(withinBudget.allYearsFunded).toBe(true);
  });

  it("is reproducible and reports progress once per simulated candidate", () => {
    const input = cashOnlyScenario(50_000);
    const request: SpendingSearchRequest = { minSpending: 0, maxSpending: 100_000, resolution: 1_000, successTarget: 0.9, simulation };
    const progress: [number, number][] = [];
    const first = searchMaxSustainableSpending(input, request, (completed, total) => progress.push([completed, total]));
    const second = searchMaxSustainableSpending(input, request);
    expect(second).toEqual(first);
    expect(progress.length).toBe(first.tested.length);
    progress.forEach(([completed, total], index) => { expect(completed).toBe(index + 1); expect(total).toBeGreaterThanOrEqual(progress.length); });
  });

  it("returns null immediately when even the minimum fails, without testing anything above it", () => {
    const input = cashOnlyScenario(10_000);
    const result = searchMaxSustainableSpending(input, {
      minSpending: 50_000, maxSpending: 60_000, resolution: 1_000, successTarget: 0.9, simulation,
    });
    expect(result.found).toBeNull();
    expect(result.tested).toHaveLength(1);
    expect(result.tested[0]).toEqual({ spending: 50_000, successRate: 0 });
    expect(result.warnings.some(w => w.includes("even the minimum failed"))).toBe(true);
  });

  it("returns the maximum immediately when the whole range already meets the target", () => {
    const input = cashOnlyScenario(1_000_000);
    const result = searchMaxSustainableSpending(input, {
      minSpending: 0, maxSpending: 10_000, resolution: 500, successTarget: 0.9, simulation,
    });
    expect(result.tested).toHaveLength(2);
    expect(result.found!.spending).toBe(10_000);
  });

  it("always frames the result as a bounded search, not a guaranteed maximum", () => {
    const input = cashOnlyScenario(50_000);
    const result = searchMaxSustainableSpending(input, {
      minSpending: 0, maxSpending: 100_000, resolution: 1_000, successTarget: 0.9, simulation,
    });
    expect(result.warnings[0]).toMatch(/highest spending level found.*not a proven maximum/i);
  });

  it("carries the full simulation result for the winning spending level", () => {
    const input = cashOnlyScenario(50_000);
    const result = searchMaxSustainableSpending(input, {
      minSpending: 0, maxSpending: 100_000, resolution: 1_000, successTarget: 0.9, simulation,
    });
    expect(result.found!.simulation.successRate).toBe(1);
    expect(result.found!.simulation.byYear).toHaveLength(1);
  });

  it("rejects an invalid range, resolution or success target", () => {
    const input = cashOnlyScenario(50_000);
    const base: SpendingSearchRequest = { minSpending: 0, maxSpending: 100_000, resolution: 1_000, successTarget: 0.9, simulation };
    for (const patch of [
      { minSpending: -1 },
      { maxSpending: 0 },
      { minSpending: 50_000, maxSpending: 40_000 },
      { resolution: 0 },
      { resolution: 1.5 },
      { resolution: 200_000 },
      { successTarget: 0 },
      { successTarget: 1.5 },
      { successTarget: NaN },
    ]) expect(() => searchMaxSustainableSpending(input, { ...base, ...patch })).toThrow();
  });

  it("rejects a range/resolution combination needing too many candidates", () => {
    const input = cashOnlyScenario(50_000);
    expect(() => searchMaxSustainableSpending(input, {
      minSpending: 0, maxSpending: 10_000_000_000, resolution: 1, successTarget: 0.9, simulation,
    })).toThrow(/too many simulated candidates/);
  });

  it("refuses to run against an existing fixed return path", () => {
    const input = { ...cashOnlyScenario(50_000), annualReturnsByYear: { 2026: {} } };
    expect(() => searchMaxSustainableSpending(input, {
      minSpending: 0, maxSpending: 100_000, resolution: 1_000, successTarget: 0.9, simulation,
    })).toThrow(/fixed return path/);
  });
});
