import { describe, expect, it } from "vitest";
import {
  estimateInternationalTax,
  getConditionalQuestionsForCountry,
  usFederalTaxAbroad,
  US_TAX_STATUS_KEY,
} from "./internationalTaxes";
import { FOREIGN_EARNED_INCOME_EXCLUSION_2026 } from "./taxYear2026";
import { FX_SOURCE, USD_TO_LOCAL } from "./internationalFx";

// 2026 single brackets (IRS Rev. Proc. 2025-32): 10% to 12,400; 12% to 50,400; 22% to 105,700; 24% to 201,775.
// Standard deduction 16,100. Tax on a taxable amount T:
//   T(100,000) = 1,240 + 4,560 + 49,600 x .22 = 16,712
//   T(132,900) = 1,240 + 4,560 + 55,300 x .22 + 27,200 x .24 = 24,494
//   T(183,900) = 1,240 + 4,560 + 12,166 + 78,200 x .24 = 36,734

describe("U.S. estimator, tax year 2026", () => {
  it("matches a hand calculation for $100,000 of wages, single", () => {
    // taxable 83,900: 1,240 + 38,000 x .12 + 33,500 x .22 = 13,170; payroll 6,200 + 1,450 = 7,650
    const r = estimateInternationalTax({ countryCode: "US", annualIncome: 100000, filing: "single", isRetired: false });
    expect(r.effectiveRate).toBeCloseTo((13170 + 7650) / 100000, 10);
    expect(r.label).toContain("2026");
  });

  it("charges no payroll tax on retirement income", () => {
    // taxable 43,900: 1,240 + 31,500 x .12 = 5,020
    const r = estimateInternationalTax({ countryCode: "US", annualIncome: 60000, filing: "single", isRetired: true });
    expect(r.effectiveRate).toBeCloseTo(5020 / 60000, 10);
  });

  it("uses the 2026 Social Security wage base of $184,500", () => {
    const below = estimateInternationalTax({ countryCode: "US", annualIncome: 184500, filing: "single", isRetired: false });
    const above = estimateInternationalTax({ countryCode: "US", annualIncome: 200000, filing: "single", isRetired: false });
    expect(above.note).toContain("$184,500");
    expect(above.effectiveRate).toBeLessThan(0.4);
    expect(below.effectiveRate).toBeGreaterThan(0);
  });
});

describe("U.S. federal tax abroad", () => {
  it("is zero when wages are fully excluded", () => {
    const { tax, excluded } = usFederalTaxAbroad(100000, "single", true);
    expect(excluded).toBe(100000);
    expect(tax).toBeCloseTo(0, 6);
  });

  it("applies the stacking rule above the exclusion", () => {
    // income 200,000, excluded 132,900, taxable 51,000: T(183,900) - T(132,900) = 36,734 - 24,494
    const { tax, excluded } = usFederalTaxAbroad(200000, "single", true);
    expect(excluded).toBe(FOREIGN_EARNED_INCOME_EXCLUSION_2026);
    expect(FOREIGN_EARNED_INCOME_EXCLUSION_2026).toBe(132900);
    expect(tax).toBeCloseTo(12240, 6);
  });

  it("gives retirement income no exclusion", () => {
    const { tax, excluded } = usFederalTaxAbroad(60000, "single", false);
    expect(excluded).toBe(0);
    expect(tax).toBeCloseTo(5020, 6);
  });
});

describe("U.S. tax added to a foreign estimate", () => {
  const local = (usd: number, code: string) => usd * (USD_TO_LOCAL[code] ?? 1);

  it("asks the question for foreign destinations only", () => {
    const keys = (code: string) => getConditionalQuestionsForCountry(code, "local").map(q => q.key);
    expect(keys("AE")).toContain(US_TAX_STATUS_KEY);
    expect(keys("PT")).toContain(US_TAX_STATUS_KEY);
    expect(keys("US")).not.toContain(US_TAX_STATUS_KEY);
    expect(keys("PR")).not.toContain(US_TAX_STATUS_KEY);
  });

  it("changes nothing unless the person says yes", () => {
    const args = { countryCode: "AE", annualIncome: local(200000, "AE"), filing: "single" as const, isRetired: false, incomeScenario: "remote" as const };
    const none = estimateInternationalTax(args);
    expect(estimateInternationalTax({ ...args, answers: { [US_TAX_STATUS_KEY]: "no" } }).effectiveRate).toBe(none.effectiveRate);
    expect(none.effectiveRate).toBe(0);
  });

  it("adds only the U.S. tax in a zero-tax country: $200,000 of remote wages in the UAE", () => {
    const r = estimateInternationalTax({
      countryCode: "AE", annualIncome: local(200000, "AE"), filing: "single", isRetired: false, incomeScenario: "remote",
      answers: { [US_TAX_STATUS_KEY]: "yes" },
    });
    expect(r.effectiveRate).toBeCloseTo(12240 / 200000, 6);
    expect(r.label).toContain("U.S. tax");
    expect(r.note).toContain("$132,900");
  });

  it("gives no exclusion to a retiree: $60,000 in the UAE", () => {
    const r = estimateInternationalTax({
      countryCode: "AE", annualIncome: local(60000, "AE"), filing: "single", isRetired: true, incomeScenario: "retired",
      answers: { [US_TAX_STATUS_KEY]: "yes" },
    });
    expect(r.effectiveRate).toBeCloseTo(5020 / 60000, 6);
    expect(r.note).not.toContain("$132,900 foreign earned income exclusion");
  });

  it("does not exceed the larger of the two taxes when the foreign tax is higher", () => {
    const args = { countryCode: "DK", annualIncome: local(100000, "DK"), filing: "single" as const, isRetired: true, incomeScenario: "retired" as const };
    const base = estimateInternationalTax(args);
    const withUs = estimateInternationalTax({ ...args, answers: { [US_TAX_STATUS_KEY]: "yes" } });
    const usRate = usFederalTaxAbroad(100000, "single", false).tax / 100000;
    expect(base.effectiveRate).toBeGreaterThan(usRate);
    expect(withUs.effectiveRate).toBeCloseTo(base.effectiveRate, 6);
  });

  it("never lowers the total below the foreign tax alone", () => {
    for (const code of ["PT", "ES", "MX", "JP", "JM", "BB"]) {
      for (const usd of [40000, 90000, 250000]) {
        const args = { countryCode: code, annualIncome: local(usd, code), filing: "single" as const, isRetired: false, incomeScenario: "local" as const };
        const base = estimateInternationalTax(args).effectiveRate;
        const withUs = estimateInternationalTax({ ...args, answers: { [US_TAX_STATUS_KEY]: "yes" } }).effectiveRate;
        expect(withUs, `${code} ${usd}`).toBeGreaterThanOrEqual(base - 1e-12);
      }
    }
  });
});

describe("exchange rates", () => {
  it("cite the Treasury dataset and its date", () => {
    expect(FX_SOURCE.asOf).toBe("2026-09-30");
    expect(FX_SOURCE.url).toContain("fiscaldata.treasury.gov");
  });

  it("match Treasury figures for the euro, pound and yen", () => {
    expect(USD_TO_LOCAL.PT).toBe(0.881);
    expect(USD_TO_LOCAL.GB).toBe(0.752);
    expect(USD_TO_LOCAL.JP).toBe(157.09);
    expect(USD_TO_LOCAL.BG).toBeCloseTo(0.881 * 1.95583, 3);
  });

  it("use one dollar for dollarized places", () => {
    for (const code of ["US", "EC", "PA", "PR", "VI", "BQ-BO"]) expect(USD_TO_LOCAL[code]).toBe(1);
  });
});
