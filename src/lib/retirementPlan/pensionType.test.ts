import { describe, expect, it } from "vitest";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

describe("pension classification prerequisite", () => {
  it("keeps each spouse's classification separate", () => {
    const input = buildPreviewInput({ ...PREVIEW_DEFAULTS, household: "married",
      "one-pensionType": "ny-government", "two-pensionType": "private" });
    expect(input.income.filter(item => item.kind === "pension").map(item => [item.ownerId, item.pensionType]))
      .toEqual([["one", "ny-government"], ["two", "private"]]);
  });
  it("does not infer the type of an existing pension", () => {
    const values = { ...PREVIEW_DEFAULTS };
    delete values["one-pensionType"];
    expect(buildPreviewInput(values).income.find(item => item.kind === "pension")?.pensionType).toBe("unspecified");
  });
  it("rejects unknown classifications", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, "one-pensionType": "invalid" })).toThrow(/pension type/);
  });
  it.each(["fl", "tx"])("leaves %s projection totals unchanged for every classification", state => {
    const values = { ...PREVIEW_DEFAULTS, state, endYear: "2026", "one-pensionStart": "2026-01-01" };
    const baseline = runRetirementTimeline(buildPreviewInput(values));
    for (const pensionType of ["private", "ny-government", "federal-government", "other-government"]) {
      const actual = runRetirementTimeline(buildPreviewInput({ ...values, "one-pensionType": pensionType }));
      expect(actual.years[0].income.find(item => item.kind === "pension")?.pensionType).toBe(pensionType);
      expect(actual.years.map(row => row.result)).toEqual(baseline.years.map(row => row.result));
      expect(actual.nextState).toEqual(baseline.nextState);
    }
  });
  it("requires New York location and explicit assumptions", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ny", "one-pensionType": "private" })).toThrow(/Choose NYC/);
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ny", cityId: "nyc-ny" })).toThrow(/Confirm/);
  });
});
