import { describe, expect, it } from "vitest";
import { estimatedBirthYear, rmdStartAge } from "./rmdRules";

describe("RMD start age by birth year (IRB 2024-33)", () => {
  it("is 73 for people born 1951 through 1959", () => {
    for (const year of [1951, 1955, 1959]) expect(rmdStartAge(year)).toBe(73);
  });
  it("is 75 for people born in 1960 or later", () => {
    for (const year of [1960, 1975, 2000]) expect(rmdStartAge(year)).toBe(75);
  });
  it("is 72 for people already past the older rules", () => {
    for (const year of [1950, 1949, 1930]) expect(rmdStartAge(year)).toBe(72);
  });
  it("falls back to 73 when the year is not a number", () => {
    expect(rmdStartAge(Number.NaN)).toBe(73);
  });
  it("estimates birth year from age", () => {
    expect(estimatedBirthYear(66, 2026)).toBe(1960);
    expect(estimatedBirthYear(67, 2026)).toBe(1959);
    expect(estimatedBirthYear(40.4, 2026)).toBe(1986);
  });
});
