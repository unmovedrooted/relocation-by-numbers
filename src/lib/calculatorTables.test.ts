import { describe, expect, it } from "vitest";
import { federalBracketRows, federalTax, paycheckStateRows, rmdRows, rmdStartAgeRows, rothRows, yearsMoneyLasts, WITHDRAWAL_RATES, REAL_RETURNS } from "./calculatorTables";

describe("RMD table", () => {
  it("matches IRS Uniform Lifetime Table values and the RMD arithmetic", () => {
    const rows = rmdRows();
    const at = (age: number) => rows.find((r) => r.age === age)!;
    expect(at(73).divisor).toBe(26.5);
    expect(at(80).divisor).toBe(20.2);
    expect(at(90).divisor).toBe(12.2);
    expect(at(100).divisor).toBe(6.4);
    expect(at(73).amounts[1]).toBeCloseTo(500_000 / 26.5, 6);
    expect(at(73).pctOfBalance).toBeCloseTo(3.7736, 3);
    // Divisors fall every year, so the share of the balance rises.
    for (let i = 1; i < rows.length; i++) expect(rows[i].divisor).toBeLessThan(rows[i - 1].divisor);
  });

  it("states the SECURE 2.0 start ages", () => {
    expect(rmdStartAgeRows()).toEqual([
      { group: "July 1949 to 1950", age: 72 },
      { group: "1951 to 1959", age: 73 },
      { group: "1960 or later", age: 75 },
    ]);
  });
});

describe("paycheck table", () => {
  const rows = paycheckStateRows();
  const get = (code: string) => rows.find((r) => r.code === code)!;

  it("covers all 51 jurisdictions", () => {
    expect(rows).toHaveLength(51);
  });

  it("Texas $100,000 single: 2026 federal tax plus FICA, hand-calculated", () => {
    // Taxable 100,000 - 16,100 = 83,900. Tax 1,240 + 4,560 + 7,370 = 13,170. FICA 6,200 + 1,450 = 7,650.
    expect(get("tx").net[1]).toBe(100_000 - 13_170 - 7_650);
    expect(get("tx").stateTaxAt100k).toBe(0);
  });

  it("take-home rises with salary everywhere and states with an income tax pay less than Texas", () => {
    for (const r of rows) {
      expect(r.net[1], r.name).toBeGreaterThan(r.net[0]);
      expect(r.net[2], r.name).toBeGreaterThan(r.net[1]);
      expect(r.net[1], r.name).toBeLessThanOrEqual(get("tx").net[1]);
    }
    expect(get("ca").net[1]).toBeLessThan(get("tx").net[1]);
  });
});

describe("Roth conversion table", () => {
  it("brackets and tax arithmetic", () => {
    expect(federalTax("single", 50_400)).toBeCloseTo(1_240 + 4_560, 6);
    const rows = rothRows("single");
    const row = (base: number, conv: number) => rows.find((r) => r.baseIncome === base && r.conversion === conv)!;
    expect(row(80_000, 25_000).tax).toBeCloseTo(5_500, 6); // all in the 22% bracket (to 105,700)
    expect(row(40_000, 10_000).tax).toBeCloseTo(1_200, 6); // all in the 12% bracket
    expect(row(40_000, 25_000).tax).toBeCloseTo(10_400 * 0.12 + 14_600 * 0.22, 6);
    expect(row(40_000, 25_000).topRatePct).toBe(22);
  });

  it("bracket rows are contiguous", () => {
    const rows = federalBracketRows("married");
    expect(rows[0].from).toBe(0);
    for (let i = 1; i < rows.length; i++) expect(rows[i].from).toBe(rows[i - 1].upTo);
    expect(rows[rows.length - 1].upTo).toBe(Infinity);
  });
});

describe("withdrawal table", () => {
  it("known cases", () => {
    expect(yearsMoneyLasts(4, 0)).toBe(25);
    expect(yearsMoneyLasts(5, 0)).toBe(20);
    expect(yearsMoneyLasts(4, 2)).toBe(35); // ln(0.04/0.02) / ln(1.02) = 35.003
    expect(yearsMoneyLasts(4, 4)).toBeNull(); // return equals withdrawal: balance never falls
    expect(yearsMoneyLasts(3, 5)).toBeNull();
  });

  it("lasts longer with higher return and shorter with a higher withdrawal rate", () => {
    const years = (rate: number, ret: number) => yearsMoneyLasts(rate, ret) ?? Infinity;
    for (const rate of WITHDRAWAL_RATES) for (let i = 1; i < REAL_RETURNS.length; i++) expect(years(rate, REAL_RETURNS[i])).toBeGreaterThanOrEqual(years(rate, REAL_RETURNS[i - 1]));
    for (const ret of REAL_RETURNS) for (let i = 1; i < WITHDRAWAL_RATES.length; i++) expect(years(WITHDRAWAL_RATES[i], ret)).toBeLessThanOrEqual(years(WITHDRAWAL_RATES[i - 1], ret));
  });
});
