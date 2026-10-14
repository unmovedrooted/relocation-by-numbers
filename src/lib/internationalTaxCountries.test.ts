import { describe, expect, it } from "vitest";
import { estimateInternationalTax } from "./internationalTaxes";

// Known-answer tests for countries refreshed against the national tax authority's own tables.
// Each expected value is worked by hand from the published table named beside it.
const rate = (countryCode: string, annualIncome: number, scenario: "local" | "remote" | "retired" = "local", filing: "single" | "married" = "single") =>
  estimateInternationalTax({ countryCode, annualIncome, filing, isRetired: scenario === "retired", incomeScenario: scenario }).effectiveRate;

describe("Argentina (ARCA 2026 annual scale and article 30 deductions)", () => {
  it("employee earning ARS 100,000,000, single", () => {
    // taxable = 100,000,000 - 17% contributions 17,000,000 - non-taxable 6,019,671.36 - special (apartado 2) 28,894,422.56 = 48,085,906.08
    // table row: over 47,323,312.16 pay 9,809,363.10 + 31% of the excess (762,593.92 -> 236,404.12) = 10,045,767.22
    expect(rate("AR", 100_000_000) * 100_000_000).toBeCloseTo(10_045_767.22, 1);
  });

  it("self-employed takes the smaller special deduction and no employee contributions", () => {
    // taxable = 100,000,000 - 6,019,671.36 - 21,068,849.78 = 72,911,478.86
    // row: over 70,984,968.25 pay 17,144,476.49 + 35% of 1,926,510.61 = 674,278.71 -> 17,818,755.20
    expect(rate("AR", 100_000_000, "remote") * 100_000_000).toBeCloseTo(17_818_755.2, 1);
  });

  it("pays nothing below the combined deductions", () => {
    expect(rate("AR", 30_000_000, "retired")).toBe(0);
  });

  it("gives a married filer the spouse deduction", () => {
    expect(rate("AR", 100_000_000, "local", "married")).toBeLessThan(rate("AR", 100_000_000, "local", "single"));
  });
});

import { estimateAsiaTax } from "./asiaTaxes";

describe("Australia (ATO 2026-27 resident rates, LITO and 2% Medicare levy)", () => {
  it("A$100,000: tax 4,020 + 30% of 55,000 = 20,520; levy 2,000", () => {
    expect(rate("AU", 100_000)).toBeCloseTo(22_520 / 100_000, 10);
  });

  it("A$40,000: tax 15% of 21,800 = 3,270 less LITO (700 - 5% of 2,500 = 575) = 2,695; levy 800", () => {
    expect(rate("AU", 40_000)).toBeCloseTo(3_495 / 40_000, 10);
  });

  it("A$200,000: 51,370 + 45% of 10,000 = 55,870; levy 4,000", () => {
    expect(rate("AU", 200_000)).toBeCloseTo(59_870 / 200_000, 10);
  });

  it("charges retirees the same Medicare levy", () => {
    expect(rate("AU", 100_000, "retired")).toBeCloseTo(rate("AU", 100_000), 10);
  });

  it("the Asia calculator gives the same answer", () => {
    const a = estimateAsiaTax({ countryCode: "AU", annualIncome: 100_000, filing: "single", isRetired: false });
    expect(a.effectiveRate).toBeCloseTo(22_520 / 100_000, 10);
  });
});
