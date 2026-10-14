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

import { austriaBracketTax } from "./countryTaxRules/austria";

describe("Austria (BMF 2026 tariff, credits and Dachverband 2026 social-insurance values)", () => {
  it("reproduces the finance ministry's example: EUR 40,000 of taxable income is EUR 7,447.20 of tax", () => {
    expect(austriaBracketTax(40_000)).toBeCloseTo(7447.2, 6);
  });

  it("employee earning EUR 60,000", () => {
    // social 18.12% = 10,872; taxable 60,000 - 10,872 - 132 = 48,996
    // tax 20% x 8,453 + 30% x 14,466 + 40% x 12,538 = 1,690.60 + 4,339.80 + 5,015.20 = 11,045.60, less credit 496 = 10,549.60
    expect(rate("AT", 60_000)).toBeCloseTo((10_549.6 + 10_872) / 60_000, 10);
  });

  it("caps social insurance at the 2026 maximum base of EUR 97,020", () => {
    // 12 x 6,930 + 13,860 = 97,020; social = 0.1812 x 97,020 = 17,579.98
    const income = 200_000;
    const social = 0.1812 * 97_020;
    const base = income - social - 132;
    const tax = austriaBracketTax(base) - 496;
    expect(rate("AT", income)).toBeCloseTo((tax + social) / income, 10);
  });

  it("pensioner on EUR 30,000: no social insurance, credit phased to 1,020 x 1,494 / 9,880", () => {
    // brackets 1,690.60 + 30% x 8,008 = 4,093.00; credit 154.2308
    expect(rate("AT", 30_000, "retired")).toBeCloseTo((4_093 - (1_020 * 1_494) / 9_880) / 30_000, 10);
  });

  it("a pensioner below the first bracket pays nothing", () => {
    expect(rate("AT", 13_000, "retired")).toBe(0);
  });
});

describe("Belgium (FPS Finance income year 2026)", () => {
  it("employee earning EUR 60,000", () => {
    // social 13.07% = 7,842; net 52,158; forfait min(30% x 52,158, 6,070) = 6,070; taxable 46,088
    // brackets 25% x 16,720 + 40% x 12,790 + 45% x 16,578 = 4,180 + 5,116 + 7,460.10 = 16,756.10; less 25% x 11,180 = 2,795 -> 13,961.10
    // communal 7% = 977.277
    expect(rate("BE", 60_000)).toBeCloseTo((13_961.1 + 977.277 + 7_842) / 60_000, 10);
  });

  it("charges nothing on the tax-free allowance for a pensioner", () => {
    expect(rate("BE", 11_000, "retired")).toBe(0);
  });

  it("applies the top rate only above EUR 51,070 of taxable income", () => {
    // pensioner (no social contributions or forfait) on EUR 80,000, taxable 80,000:
    // 4,180 + 5,116 + 9,702 + 14,465 = 33,463; less 2,795 = 30,668; communal 2,146.76
    expect(rate("BE", 80_000, "retired")).toBeCloseTo((30_668 + 2_146.76) / 80_000, 10);
  });
});

describe("Brazil (Receita Federal 2026 table, Law 15.270 reducer, INSS 2026)", () => {
  it("reproduces the Receita's own example: R$ 6,000 a month, simplified discount, tax R$ 394.54", () => {
    // base 6,000 - 607.20 = 5,392.80; table 27.5% x 5,392.80 - 908.73 = 574.29; reducer 978.62 - 0.133145 x 6,000 = 179.75
    expect(rate("BR", 72_000, "remote") * 72_000).toBeCloseTo(394.54 * 12, 1);
  });

  it("employee at R$ 6,000 a month adds INSS and uses it instead of the simplified discount", () => {
    // INSS 121.575 + 115.3656 + 174.1716 + 230.4022 = 641.5144; base 5,358.4856; table 1,473.58354 - 908.73 = 564.85354; reducer 179.75 -> 385.10354
    expect(rate("BR", 72_000)).toBeCloseTo((385.10354 + 641.5144) / 6_000, 6);
  });

  it("charges no income tax up to R$ 5,000 a month", () => {
    expect(rate("BR", 60_000, "remote")).toBe(0);
  });

  it("caps INSS at the R$ 8,475.55 ceiling", () => {
    // ceiling INSS = 121.575 + 115.3656 + 174.1716 + 14% x (8,475.55 - 4,354.27) = 577.0 ... 121.575+115.3656+174.1716+576.9792 = 988.0914
    const high = rate("BR", 240_000) * 240_000; // R$ 20,000 a month, above the ceiling
    const inss = 988.0914 * 12;
    const base = 20_000 - 988.0914;
    const table = 0.275 * base - 908.73;
    expect(high).toBeCloseTo(table * 12 + inss, 1);
  });
});
