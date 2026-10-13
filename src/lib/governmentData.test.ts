import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { GOVERNMENT_DATA_META, governmentCity, governmentState, ratio } from "./governmentData";

describe("government data", () => {
  it("converts BEA indexes to ratios", () => {
    expect(ratio(103.476)).toBe(1.035);
    expect(ratio(96.621)).toBe(0.966);
    expect(ratio(null)).toBeUndefined();
    expect(ratio(0)).toBeUndefined();
  });

  it("matches known source figures", () => {
    expect(governmentCity("nyc-ny")?.census?.rentUsed).toBe(2354);
    expect(governmentCity("sf-ca")?.census?.homeValueUsed).toBe(1588100);
    const raleigh = governmentCity("raleigh-nc")?.rpp;
    expect(ratio(raleigh?.housing)).toBe(1.035);
    expect(ratio(raleigh?.goods)).toBe(0.966);
  });

  it("states vintages", () => {
    expect(GOVERNMENT_DATA_META.census.vintage).toContain("2020");
    expect(GOVERNMENT_DATA_META.bea.vintage).toContain("2024");
  });

  it("gives every city rent, home price, property tax and price levels from the data", () => {
    for (const c of CITIES) {
      expect(c.defaultRent, c.id).toBeGreaterThan(300);
      expect(c.medianHomePrice, c.id).toBeGreaterThan(50000);
      expect(c.propertyTaxPct, c.id).toBeGreaterThan(0.05);
      expect(c.propertyTaxPct, c.id).toBeLessThan(4);
      expect(c.col?.housing, c.id).toBeGreaterThan(0.5);
      expect(c.dataSource?.rent, c.id).not.toBeNull();
    }
  });

  it("has state rates for all 51 states", () => {
    const states = new Set(CITIES.map((c) => c.state));
    for (const st of states) expect(governmentState(st)?.census?.propertyTaxRatePct, st).toBeGreaterThan(0);
  });
});
