import { describe, expect, it } from "vitest";
import { PREVIEW_DEFAULTS, buildPreviewInput, calculatePreview, calculatePreviewMoveComparison } from "./preview";

const move = (overrides: Record<string, string> = {}) => ({
  ...PREVIEW_DEFAULTS, moveOn: "yes", moveYear: "2040", moveState: "ca", moveCityId: "", caContract: "confirmed", ...overrides,
});

describe("planned move in the retirement preview", () => {
  it("leaves the plan unchanged until the move year, then taxes the new state", () => {
    const both = calculatePreviewMoveComparison(move())!;
    for (const [i, row] of both.withMove.years.entries()) {
      const stay = both.stay.years[i];
      if (row.year < 2040) expect(row.result.tax.total, String(row.year)).toBe(stay.result.tax.total);
    }
    const after = both.withMove.years.find(row => row.year === 2045)!;
    expect(after.result.tax.stateTax).toBeGreaterThan(0);
    // Florida has no income tax
    expect(both.stay.years.find(row => row.year === 2045)!.result.tax.stateTax).toBe(0);
  });

  it("starts the new state in the move year itself", () => {
    const both = calculatePreviewMoveComparison(move({ moveYear: "2038" }))!;
    expect(both.withMove.years.find(row => row.year === 2037)!.result.tax.stateTax).toBe(0);
    expect(both.withMove.years.find(row => row.year === 2038)!.result.tax.stateTax).toBeGreaterThan(0);
  });

  it("returns no comparison when no move is set", () => {
    expect(calculatePreviewMoveComparison({ ...PREVIEW_DEFAULTS })).toBeNull();
    expect(calculatePreviewMoveComparison(move({ moveOn: "" }))).toBeNull();
  });

  it("matches a plan with no move when the destination also has no income tax", () => {
    const withMove = calculatePreview(move({ moveState: "tx", caContract: "" }));
    const stay = calculatePreview({ ...PREVIEW_DEFAULTS });
    expect(withMove.years.map(row => row.result.tax.total)).toEqual(stay.years.map(row => row.result.tax.total));
  });

  it("requires the destination's planning assumptions to be confirmed", () => {
    expect(() => buildPreviewInput(move({ caContract: "" }))).toThrow(/Confirm the restricted California planning assumptions for the destination/);
  });

  it("rejects a destination equal to the resident state and a move outside the projection", () => {
    expect(() => buildPreviewInput(move({ moveState: "fl" }))).toThrow(/different from the resident state/);
    expect(() => buildPreviewInput(move({ moveYear: "2020" }))).toThrow();
    expect(() => buildPreviewInput(move({ moveYear: "2070" }))).toThrow();
    expect(() => buildPreviewInput(move({ moveYear: "2040.5" }))).toThrow(/whole year/);
  });

  it("rejects a destination state that is not supported or missing", () => {
    expect(() => buildPreviewInput(move({ moveState: "" }))).toThrow();
    expect(() => buildPreviewInput(move({ moveState: "zz" }))).toThrow();
  });

  it("checks the destination city like the resident one", () => {
    expect(() => buildPreviewInput(move({ moveState: "ny", nyContract: "confirmed", moveCityId: "" }))).toThrow(/Choose NYC or explicitly outside NYC/);
  });

  it("carries both states' contract flags and the move into the timeline input", () => {
    const input = buildPreviewInput(move());
    expect(input.californiaContract).toBe("verified-law-precredit");
    expect(input.move).toMatchObject({ year: 2040, state: "ca" });
  });

  it("supports Oregon as a destination with its local-tax confirmations", () => {
    const values = move({ moveState: "or", orContract: "confirmed", orMetro: "outside-no-source", orMultnomah: "outside-no-source", orLocalAdjustments: "none-confirmed" });
    const input = buildPreviewInput(values);
    expect(input.move?.oregonLocal).toBeDefined();
    expect(calculatePreviewMoveComparison(values)!.withMove.years.find(row => row.year === 2045)!.result.tax.stateTax).toBeGreaterThan(0);
  });
});
