import { describe, expect, it } from "vitest";
import { breakEvenYear } from "./moveBreakEven";

describe("breakEvenYear", () => {
  it("finds the first year the move path catches up", () => {
    // Stay saves 10,000 a year from 100,000. The move costs 15,000 upfront and saves 16,000 a year: behind by 15,000, gaining 6,000 a year.
    const stay = [100_000, 110_000, 120_000, 130_000, 140_000];
    const moved = [85_000, 101_000, 117_000, 133_000, 149_000];
    expect(breakEvenYear(stay, moved)).toBe(3);
  });

  it("is 0 when there is nothing to recover", () => {
    expect(breakEvenYear([100, 110], [100, 120])).toBe(0);
  });

  it("is null when the move path never catches up", () => {
    expect(breakEvenYear([100, 110, 120], [90, 99, 108])).toBeNull();
  });

  it("uses the shorter series and handles empty input", () => {
    expect(breakEvenYear([100, 110, 120], [90])).toBeNull();
    expect(breakEvenYear([], [])).toBeNull();
  });
});
