import { describe, expect, it } from "vitest";
import { CITIES } from "../cities";
import { CITY_TAX_CHOICES, cityIncomeTax, isRatedCity } from "./cityIncomeTax";

const base = (qualifyingWages: number, residentIncome = 0) => ({ qualifyingWages, residentIncome });

describe("resident-city income taxes", () => {
  it("taxes Ohio qualifying wages at the city rate with no exemption", () => {
    expect(cityIncomeTax("oh", "columbus-oh", base(100000, 500000), 2)).toBeCloseTo(2500, 6);
    expect(cityIncomeTax("oh", "cleveland-oh", base(100000), 1)).toBeCloseTo(2500, 6);
    expect(cityIncomeTax("oh", "cincinnati-oh", base(100000), 1)).toBeCloseTo(1800, 6);
  });
  it("taxes Michigan residents on AGI-like income net of $600 exemptions", () => {
    expect(cityIncomeTax("mi", "detroit-mi", base(0, 80000), 1)).toBeCloseTo((80000 - 600) * .024, 6);
    expect(cityIncomeTax("mi", "detroit-mi", base(0, 80000), 2)).toBeCloseTo((80000 - 1200) * .024, 6);
    expect(cityIncomeTax("mi", "grand-rapids-mi", base(0, 80000), 1)).toBeCloseTo((80000 - 600) * .015, 6);
    expect(cityIncomeTax("mi", "detroit-mi", base(0, 300), 1)).toBe(0);
  });
  it("applies Birmingham's 1% occupational tax to wages and none to Montgomery or Huntsville", () => {
    expect(cityIncomeTax("al", "birmingham-al", base(60000), 1)).toBeCloseTo(600, 6);
    expect(cityIncomeTax("al", "montgomery-al", base(60000), 1)).toBe(0);
    expect(cityIncomeTax("al", "huntsville-al", base(60000), 1)).toBe(0);
    expect(cityIncomeTax("mi", "ann-arbor-mi", base(60000, 60000), 1)).toBe(0);
  });
  it("returns zero for no selection, an unrated city, or a city in another state", () => {
    expect(cityIncomeTax("oh", "", base(100000), 1)).toBe(0);
    expect(cityIncomeTax("oh", "other-oh", base(100000), 1)).toBe(0);
    expect(cityIncomeTax("oh", "detroit-mi", base(100000, 100000), 1)).toBe(0);
    expect(isRatedCity("columbus-oh")).toBe(true);
    expect(isRatedCity("other-oh")).toBe(false);
  });
  it("rejects invalid inputs", () => {
    expect(() => cityIncomeTax("oh", "columbus-oh", base(-1), 1)).toThrow(/Invalid city income tax input/);
    expect(() => cityIncomeTax("oh", "columbus-oh", base(NaN), 1)).toThrow();
  });
  it("only offers cities that exist in the planner's city list, in the right state", () => {
    for (const [state, ids] of Object.entries(CITY_TAX_CHOICES)) {
      for (const id of ids) expect(CITIES.find(city => city.id === id)?.state).toBe(state);
    }
  });
});
