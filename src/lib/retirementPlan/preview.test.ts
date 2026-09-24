import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildPreviewInput, calculatePreview, PREVIEW_DEFAULTS } from "./preview";

describe("Local retirement preview", () => {
  it("uses the actual engine and preserves nominal input precision", () => {
    const values = { ...PREVIEW_DEFAULTS, spending: "50000.123400" };
    expect(buildPreviewInput(values).spendingAnnual).toBe(50000.1234);
    const result = calculatePreview(values);
    expect(result.years).toHaveLength(35);
    expect(result.years[0].spending).toBe(50000.1234);
    expect(result.years.every(row => Math.abs(row.reconciliationResidual) < 0.00001)).toBe(true);
    expect(values.spending).toBe("50000.123400");
  });
  it("adds separate spouse dates/accounts and ignores inactive spouse inputs", () => {
    expect(buildPreviewInput({ ...PREVIEW_DEFAULTS, "two-ira": "" }).people).toHaveLength(1);
    const input = buildPreviewInput({ ...PREVIEW_DEFAULTS, household: "married" });
    expect(input.people).toHaveLength(2);
    expect(input.retirementDates).toEqual({ one: "2030-01-01", two: "2032-01-01" });
    expect(input.accounts).toHaveLength(3);
    expect(calculatePreview({ ...PREVIEW_DEFAULTS, household: "married" }).years[0].people).toHaveLength(2);
  });
  it("rejects blank, invalid, fractional-year and nonfinite values", () => {
    for (const patch of [{ spending: "" }, { cash: "-1" }, { returns: "Infinity" }, { endYear: "2028.5" }, { "one-birth": "invalid" }]) {
      expect(() => calculatePreview({ ...PREVIEW_DEFAULTS, ...patch })).toThrow();
    }
  });
  it("is live in production and listed in the explore grid, but stays out of the sitemap and search indexing", () => {
    const read = (path: string) => readFileSync(path, "utf8");
    expect(read("src/app/sitemap.ts")).not.toContain("/complete-retirement-plan");
    expect(read("src/components/ExploreCalculatorGrid.tsx")).toContain('href: "/complete-retirement-plan"');
    const page = read("src/app/complete-retirement-plan/page.tsx");
    expect(page).not.toContain("notFound()");
    expect(page).toContain("index: false");
  });
});
