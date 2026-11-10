import { describe, expect, it } from "vitest";
import { firstRmdChoice } from "./rmdFirstYear";

// Uniform Lifetime Table periods at 73 and 74.
const base = { startBalance: 500_000, firstAge: 73, divisorFirst: 26.5, divisorSecond: 25.5, returnRate: 0.05 };

describe("firstRmdChoice", () => {
  it("hand-calculated amounts with a flat 20% tax", () => {
    const c = firstRmdChoice({ ...base, taxOn: (rmd) => rmd * 0.2 });
    // First RMD 500,000 / 26.5 = 18,867.92.
    expect(c.firstRmd).toBeCloseTo(18_867.92, 2);
    // Taken in year 1: second RMD (500,000 - 18,867.92) x 1.05 / 25.5 = 19,811.32.
    expect(c.takeInFirstYear.year2Rmd).toBeCloseTo(19_811.32, 2);
    // Delayed: second RMD 500,000 x 1.05 / 25.5 = 20,588.24, so 18,867.92 + 20,588.24 = 39,456.16 comes out in year 2.
    expect(c.delayToApril.year1Rmd).toBe(0);
    expect(c.delayToApril.year2Rmd).toBeCloseTo(39_456.16, 2);
    // Flat tax: the only extra tax is on the larger second RMD (20,588.24 - 19,811.32 = 776.92 at 20% = 155.38).
    expect(c.extraTaxFromDelay).toBeCloseTo(155.38, 2);
  });

  it("delaying costs more when two RMDs in one year reach a higher bracket", () => {
    // 10% on the first 25,000 of RMD income in a year, 30% above.
    const taxOn = (rmd: number) => Math.min(rmd, 25_000) * 0.1 + Math.max(0, rmd - 25_000) * 0.3;
    const c = firstRmdChoice({ ...base, taxOn });
    expect(c.takeInFirstYear.totalTax).toBeCloseTo((18_867.92 + 19_811.32) * 0.1, 1);
    expect(c.delayToApril.totalTax).toBeCloseTo(2_500 + (39_456.16 - 25_000) * 0.3, 1);
    expect(c.extraTaxFromDelay).toBeGreaterThan(2_000);
  });

  it("passes each year's own age to the tax function", () => {
    const ages: number[] = [];
    firstRmdChoice({ ...base, taxOn: (_rmd, age) => { ages.push(age); return 0; } });
    expect(ages).toEqual([73, 74, 74]);
  });

  it("with no tax either way, delaying costs nothing extra", () => {
    expect(firstRmdChoice({ ...base, taxOn: () => 0 }).extraTaxFromDelay).toBe(0);
  });
});
