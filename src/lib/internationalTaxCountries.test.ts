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

describe("Bulgaria (NOI 2026 insurable-income caps, 10% flat tax after contributions)", () => {
  it("salary below the cap: EUR 20,000", () => {
    // contributions 11.58% = 2,316; tax 10% x 17,684 = 1,768.40
    expect(rate("BG", 20_000)).toBeCloseTo((1_768.4 + 2_316) / 20_000, 10);
  });

  it("salary above the cap: contributions stop at 7 x 2,111.64 + 5 x 2,300 = 26,281.48", () => {
    // contributions 0.1158 x 26,281.48 = 3,043.4 (3,043.3 rounded); tax 10% x (50,000 - contributions)
    const social = 0.1158 * 26_281.48;
    expect(rate("BG", 50_000)).toBeCloseTo((0.1 * (50_000 - social) + social) / 50_000, 10);
  });

  it("a pensioner pays the flat 10% with no contributions", () => {
    expect(rate("BG", 20_000, "retired")).toBeCloseTo(0.1, 10);
  });
});

import { CANADA_PROVINCES, canadaTax, ontarioHealthPremium } from "./countryTaxRules/canada";

describe("Canada (CRA 2026 federal and provincial tables, CPP, CPP2, EI)", () => {
  it("Ontario employee earning CAD 100,000", () => {
    // CPP earnings 71,100: CPP 4,230.45, base credit 3,519.45, enhanced deduction 711.00; CPP2 416.00; EI 1,123.07
    // taxable 100,000 - 711 - 416 = 98,873
    // federal: 14% x 58,523 + 20.5% x 40,350 = 16,464.97; credits (16,452 + 3,519.45 + 1,123.07 + 1,501) x 14% = 3,163.37 -> 13,301.60
    // Ontario: 5.05% x 53,891 + 9.15% x 44,982 = 6,837.35; credits (12,989 + 3,519.45 + 1,123.07) x 5.05% = 890.41 -> 5,946.94
    // surtax 20% x (5,946.94 - 5,818) = 25.79; Health Premium 750
    const r = canadaTax(100_000, { province: "ON", scenario: "local", married: false });
    expect(r.federalTax).toBeCloseTo(13_301.6, 1);
    expect(r.provincialTax).toBeCloseTo(5_946.94, 1);
    expect(r.surtaxAndPremium).toBeCloseTo(25.79 + 750, 1);
    expect(r.payroll).toBeCloseTo(4_230.45 + 416 + 1_123.07, 2);
    expect(rate("CA", 100_000)).toBeCloseTo((13_301.6 + 5_946.94 + 775.79 + 5_769.52) / 100_000, 5);
  });

  it("Alberta has a lower combined rate than Ontario at CAD 100,000", () => {
    const ab = estimateInternationalTax({ countryCode: "CA", annualIncome: 100_000, filing: "single", isRetired: false, answers: { ca_province: "AB" } });
    const on = estimateInternationalTax({ countryCode: "CA", annualIncome: 100_000, filing: "single", isRetired: false, answers: { ca_province: "ON" } });
    expect(ab.effectiveRate).toBeLessThan(on.effectiveRate);
    expect(ab.label).toContain("Alberta");
  });

  it("falls back to Ontario and says so when no province is chosen", () => {
    const r = estimateInternationalTax({ countryCode: "CA", annualIncome: 100_000, filing: "single", isRetired: false });
    expect(r.label).toContain("select province");
    expect(r.effectiveRate).toBeCloseTo(rate("CA", 100_000), 10);
  });

  it("remote income pays no CPP or EI", () => {
    expect(canadaTax(100_000, { province: "ON", scenario: "remote", married: false }).payroll).toBe(0);
  });

  it("a retiree on CAD 40,000 in British Columbia gets the age amount and pays no CPP or EI", () => {
    const r = canadaTax(40_000, { province: "BC", scenario: "retired", married: false });
    expect(r.payroll).toBe(0);
    // federal: 14% x 40,000 = 5,600 less 14% x (16,452 + age 9,208) = 3,592.40 -> 2,007.60
    expect(r.federalTax).toBeCloseTo(2_007.6, 1);
  });

  it("Quebec residents get the 16.5% federal abatement", () => {
    const qc = canadaTax(100_000, { province: "QC", scenario: "local", married: false });
    const on = canadaTax(100_000, { province: "ON", scenario: "local", married: false });
    expect(qc.federalTax).toBeCloseTo(on.federalTax * (1 - 0.165), 6);
  });

  it("the Ontario Health Premium follows the schedule", () => {
    expect(ontarioHealthPremium(20_000)).toBe(0);
    expect(ontarioHealthPremium(22_000)).toBeCloseTo(120, 6);
    expect(ontarioHealthPremium(30_000)).toBe(300);
    expect(ontarioHealthPremium(60_000)).toBe(600);
    expect(ontarioHealthPremium(100_000)).toBe(750);
    expect(ontarioHealthPremium(300_000)).toBe(900);
  });

  it("Manitoba's basic personal amount phases out between CAD 200,000 and 400,000", () => {
    const bpa = CANADA_PROVINCES.MB.bpa;
    expect(bpa(200_000)).toBe(15_780);
    expect(bpa(300_000)).toBeCloseTo(7_890, 6);
    expect(bpa(400_000)).toBe(0);
  });
});

import { chileMonthlyTax, CHILE_CONTRIBUTION_CEILING } from "./countryTaxRules/chile";

describe("Chile (SII 2026 monthly table, 90 UF ceiling)", () => {
  it("matches the SII table row for a monthly base of CLP 1,660,000", () => {
    // 4% x 1,660,000 less the table's amount to subtract, 38,961 = 27,439 (the table rounds to whole pesos)
    expect(Math.abs(chileMonthlyTax(1_660_000) - 27_439)).toBeLessThan(1);
  });

  it("matches the SII table row for CLP 4,000,000: 13.5% less 323,958", () => {
    expect(Math.abs(chileMonthlyTax(4_000_000) - (0.135 * 4_000_000 - 323_958))).toBeLessThan(1);
  });

  it("is exempt up to 13.5 UTM", () => {
    expect(chileMonthlyTax(974_000)).toBe(0);
  });

  it("employee earning CLP 2,000,000 a month", () => {
    // contributions 17% = 340,000; base 1,660,000; tax 27,438.46; total 367,438.46
    expect(rate("CL", 24_000_000)).toBeCloseTo(367_438.46 / 2_000_000, 5);
  });

  it("stops contributions at the 90 UF ceiling", () => {
    const monthly = 10_000_000;
    const contributions = 0.17 * CHILE_CONTRIBUTION_CEILING;
    const tax = chileMonthlyTax(monthly - contributions);
    expect(rate("CL", monthly * 12)).toBeCloseTo((tax + contributions) / monthly, 6);
  });

  it("charges remote income no contributions", () => {
    expect(rate("CL", 24_000_000, "remote")).toBeCloseTo(chileMonthlyTax(2_000_000) / 2_000_000, 6);
  });
});

describe("China (State Taxation Administration comprehensive-income table)", () => {
  const cn = (income: number, answers: Record<string, string> = {}) =>
    estimateAsiaTax({ countryCode: "CN", annualIncome: income, filing: "single", isRetired: false, answers });

  it("employee earning CNY 300,000", () => {
    // social 10.5% = 31,500; taxable 300,000 - 60,000 - 31,500 = 208,500; tax 20% x 208,500 - 16,920 = 24,780
    expect(cn(300_000).effectiveRate).toBeCloseTo((24_780 + 31_500) / 300_000, 10);
  });

  it("charges nothing on income within the basic deduction and social insurance", () => {
    // 60,000 + 10.5% x 60,000 exceeds... income 60,000: taxable 0
    expect(cn(60_000).incomeTaxRate).toBe(0);
  });

  it("a non-resident remote worker owes nothing", () => {
    expect(estimateAsiaTax({ countryCode: "CN", annualIncome: 300_000, filing: "single", isRetired: false, incomeScenario: "remote", answers: { cn_residency: "non_resident" } }).effectiveRate).toBe(0);
  });
});

import { colombiaTaxOnUvt } from "./countryTaxRules/colombia";

describe("Colombia (DIAN 2026 UVT of COP 52,374)", () => {
  it("table at 4,100 UVT: 19% x 610 + 28% x 2,400 = 787.9 UVT", () => {
    expect(colombiaTaxOnUvt(4_100)).toBeCloseTo(0.19 * 610 + 0.28 * 2_400, 9);
  });

  it("employee earning COP 120,000,000", () => {
    // contributions 8% = 9,600,000; net 110,400,000; exempt 25% = 27,600,000 (below 790 UVT = 41,375,460 and 40% of net)
    // taxable 82,800,000 = 1,580.9 UVT: tax 19% x (1,580.9 - 1,090) UVT
    const taxableUvt = 82_800_000 / 52_374;
    const tax = 0.19 * (taxableUvt - 1_090) * 52_374;
    expect(rate("CO", 120_000_000)).toBeCloseTo((tax + 9_600_000) / 120_000_000, 9);
  });

  it("caps the 25% exemption at 790 UVT: COP 400,000,000 salary", () => {
    const net = 400_000_000 * 0.92;
    const taxable = net - 790 * 52_374;
    const tax = colombiaTaxOnUvt(taxable / 52_374) * 52_374;
    expect(rate("CO", 400_000_000)).toBeCloseTo((tax + 400_000_000 * 0.08) / 400_000_000, 9);
  });

  it("charges nothing on remote income below the first bracket", () => {
    expect(rate("CO", 40_000_000, "remote")).toBe(0);
  });
});

import { costaRicaMonthlyTax } from "./countryTaxRules/costaRica";

describe("Costa Rica (Hacienda 2026 monthly brackets, CCSS 2026)", () => {
  it("salary of CRC 2,000,000 a month", () => {
    // 10% x (1,347,000 - 918,000) = 42,900 + 15% x (2,000,000 - 1,347,000) = 97,950 -> 140,850
    expect(costaRicaMonthlyTax(2_000_000)).toBeCloseTo(140_850, 6);
    // worker charges 10.83% = 216,600
    expect(rate("CR", 24_000_000)).toBeCloseTo((140_850 + 216_600) / 2_000_000, 8);
  });

  it("top bracket: 25% above CRC 4,727,000 a month", () => {
    // 42,900 + 15% x 1,017,000 + 20% x 2,363,000 + 25% x 273,000 = 42,900 + 152,550 + 472,600 + 68,250
    expect(costaRicaMonthlyTax(5_000_000)).toBeCloseTo(736_300, 6);
  });

  it("pays nothing below the exempt amount", () => {
    expect(rate("CR", 9_000_000, "remote")).toBe(0);
  });

  it("gives a married filer the CRC 2,590 monthly spouse credit", () => {
    const single = rate("CR", 24_000_000, "remote", "single") * 24_000_000;
    const married = rate("CR", 24_000_000, "remote", "married") * 24_000_000;
    expect(single - married).toBeCloseTo(2_590 * 12, 6);
  });
});

describe("Croatia (Porezna uprava 2026: 20% to EUR 60,000, 30% above, 20% pension, EUR 7,200 allowance)", () => {
  it("employee earning EUR 50,000", () => {
    // MIO 10,000; base 50,000 - 10,000 - 7,200 = 32,800; tax 20% = 6,560
    expect(rate("HR", 50_000)).toBeCloseTo((6_560 + 10_000) / 50_000, 10);
  });

  it("employee earning EUR 100,000 reaches the 30% rate", () => {
    // MIO 20,000; base 72,800; tax 20% x 60,000 + 30% x 12,800 = 12,000 + 3,840 = 15,840
    expect(rate("HR", 100_000)).toBeCloseTo((15_840 + 20_000) / 100_000, 10);
  });

  it("a pensioner pays no contribution and keeps the allowance", () => {
    // base 30,000 - 7,200 = 22,800; tax 4,560
    expect(rate("HR", 30_000, "retired")).toBeCloseTo(4_560 / 30_000, 10);
  });

  it("pays nothing within the allowance", () => {
    expect(rate("HR", 7_000, "retired")).toBe(0);
  });
});

describe("Czech Republic (Financial Administration 2026)", () => {
  it("employee earning CZK 1,200,000", () => {
    // tax 15% x 1,200,000 = 180,000 less credit 30,840 = 149,160; social 7.1% = 85,200; health 4.5% = 54,000
    expect(rate("CZ", 1_200_000)).toBeCloseTo((149_160 + 85_200 + 54_000) / 1_200_000, 10);
  });

  it("applies 23% above 36 times the average wage (CZK 1,762,812)", () => {
    // CZK 2,000,000: 15% x 1,762,812 + 23% x 237,188 = 264,421.8 + 54,553.24 = 318,975.04, less credit 30,840 = 288,135.04
    // social 7.1% x 2,000,000 = 142,000; health 90,000
    expect(rate("CZ", 2_000_000)).toBeCloseTo((288_135.04 + 142_000 + 90_000) / 2_000_000, 8);
  });

  it("a pensioner pays only income tax, after the basic credit", () => {
    expect(rate("CZ", 400_000, "retired")).toBeCloseTo((60_000 - 30_840) / 400_000, 10);
  });
});
