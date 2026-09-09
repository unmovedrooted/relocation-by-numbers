import { describe, expect, it } from "vitest";
import { projectedContributionLimits, projectThreshold } from "./thresholdProjection";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";

describe("Planning threshold growth", () => {
  it("preserves published base values and category-specific increments", () => {
    expect(projectedContributionLimits(2026, .03)).toMatchObject({ iraRegular: 7500, iraCatchUp: 1100,
      planRegular: 24500, planCatchUp: 8000, planCatchUpAge60To63: 11250 });
    expect(projectedContributionLimits(2027, .03)).toMatchObject({ iraRegular: 7500, iraCatchUp: 1100, planRegular: 25000 });
    expect(projectedContributionLimits(2027, .1).iraCatchUp).toBe(1200);
  });
  it("compounds from the base without discarding annual fractional increases", () => {
    expect(projectThreshold(7500, 2036, 2026, .01, 500)).toBe(8000);
    expect(projectThreshold(20000, 2027, 2026, .025, 500)).toBe(20500);
    expect(projectThreshold(11250, 2060, 2026, 0, 500)).toBe(11250);
  });
  it("rejects invalid projections", () => {
    for (const rate of [NaN, Infinity, -.01, .21]) expect(() => projectedContributionLimits(2030, rate)).toThrow();
    for (const year of [2025, 2027.5, 2127]) expect(() => projectedContributionLimits(year, .02)).toThrow();
  });
  it("links the default threshold rate to spending inflation", () => {
    const input = buildPreviewInput({ ...PREVIEW_DEFAULTS, inflation: "3.125", taxGrowth: "invalid" });
    expect(input.taxProjection.annualBracketGrowth).toBe(.03125);
    expect(input.taxProjection.annualPayrollCapGrowth).toBe(.03125);
  });
  it("supports an explicit independent rate without changing spending inflation", () => {
    const input = buildPreviewInput({ ...PREVIEW_DEFAULTS, thresholdGrowthMode: "separate", inflation: "3", taxGrowth: "1.25" });
    expect(input.taxProjection.annualBracketGrowth).toBe(.0125);
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, thresholdGrowthMode: "separate", taxGrowth: "" })).toThrow();
  });
});
