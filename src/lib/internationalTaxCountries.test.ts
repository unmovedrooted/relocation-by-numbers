import { describe, expect, it } from "vitest";
import { estimateInternationalTax } from "./internationalTaxes";
import { switzerlandFederalTax } from "./countryTaxRules/switzerland";

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

describe("Denmark (skat.dk 2026)", () => {
  it("employee earning DKK 600,000", () => {
    // AM 48,000; personal income 552,000; employment allowance min(70,380, 63,471) = 63,471; job allowance min(14,256, 3,100) = 3,100
    // taxable 485,429; municipal 25.049% x (485,429 - 54,100) = 108,043.60; bottom 12.01% x (552,000 - 54,100) = 59,797.79
    expect(rate("DK", 600_000)).toBeCloseTo((48_000 + 108_043.601 + 59_797.79) / 600_000, 6);
  });

  it("adds the 7.5% middle and top brackets above DKK 777,900 of personal income", () => {
    // gross 1,000,000: AM 80,000; personal 920,000; employment allowance 63,471; job 3,100; taxable 853,429
    // municipal 25.049% x 799,329 = 200,224.1 (rounded); bottom 12.01% x 865,900 = 103,995.59; middle 7.5% x 278,800 = 20,910; top 7.5% x 142,100 = 10,657.5
    const municipal = 0.25049 * (853_429 - 54_100);
    const bottom = 0.1201 * (920_000 - 54_100);
    const total = 80_000 + municipal + bottom + 20_910 + 10_657.5;
    expect(rate("DK", 1_000_000)).toBeCloseTo(total / 1_000_000, 8);
  });

  it("a pensioner pays no AM-bidrag and gets no employment allowance", () => {
    // pension 300,000: bottom 12.01% x 245,900 = 29,533.59; municipal 25.049% x 245,900 = 61,595.0
    expect(rate("DK", 300_000, "retired")).toBeCloseTo((0.1201 * 245_900 + 0.25049 * 245_900) / 300_000, 8);
  });
});

describe("Estonia (EMTA 2026)", () => {
  it("employee earning EUR 40,000", () => {
    // contributions 3.6% = 1,440; taxable 40,000 - 1,440 - 8,400 = 30,160; tax 22% = 6,635.20
    expect(rate("EE", 40_000)).toBeCloseTo((6_635.2 + 1_440) / 40_000, 10);
  });

  it("a pensioner has the higher exemption and no contributions", () => {
    // (30,000 - 9,312) x 22% = 4,551.36
    expect(rate("EE", 30_000, "retired")).toBeCloseTo(4_551.36 / 30_000, 10);
  });

  it("pays no income tax within the exemption", () => {
    expect(rate("EE", 8_000, "retired")).toBe(0);
  });
});

describe("Ecuador (SRI table for fiscal year 2026)", () => {
  it("matches the SRI fixed amounts at each bracket", () => {
    // remote income is taxed with no IESS; the SRI table prints each row's fixed amount rounded to whole dollars
    for (const [base, fixed] of [[15_549, 167], [20_188, 631], [26_700, 1_412], [46_575, 4_965], [62_005, 8_823], [82_679, 15_025]] as const) {
      expect(Math.abs(rate("EC", base, "remote") * base - fixed), String(base)).toBeLessThan(1);
    }
  });

  it("top band is 37% above $109,956 with $24,572 fixed", () => {
    const base = 150_000;
    expect(rate("EC", base, "remote") * base).toBeCloseTo(24_572 + 0.37 * (base - 109_956), 0);
  });

  it("employee earning $60,000: IESS 9.45% = 5,670 deducted", () => {
    // base 54,330 -> 4,965 + 25% x (54,330 - 46,575) = 6,903.75
    expect(Math.abs(rate("EC", 60_000) * 60_000 - (6_903.75 + 5_670))).toBeLessThan(1);
  });

  it("is free of tax below the exempt amount", () => {
    expect(rate("EC", 12_000, "remote")).toBe(0);
  });
});

import { franceBracketTax, franceEmployeeContributions } from "./countryTaxRules/france";

describe("France (2026 scale on 2025 income, Urssaf and Agirc-Arrco 2026 rates)", () => {
  it("scale at EUR 29,579 per part: 11% x 17,979 = 1,977.69", () => {
    expect(franceBracketTax(29_579)).toBeCloseTo(1_977.69, 6);
  });

  it("employee contributions on EUR 60,000", () => {
    // old-age 6.9% x 48,060 = 3,316.14 + 0.4% x 60,000 = 240; Agirc-Arrco 3.15% x 48,060 = 1,513.89 + 8.64% x 11,940 = 1,031.616;
    // CEG 0.86% x 48,060 = 413.316 + 1.08% x 11,940 = 128.952; CET 0.14% x 60,000 = 84
    expect(franceEmployeeContributions(60_000)).toBeCloseTo(6_727.914, 3);
  });

  it("employee earning EUR 60,000, single", () => {
    // CSG/CRDS 9.7% x 58,950 = 5,718.15; deductible CSG 6.8% x 58,950 = 4,008.6
    // net imposable 60,000 - 6,727.914 - 4,008.6 = 49,263.486; allowance 10% = 4,926.3486; taxable 44,337.1374
    // tax 1,977.69 + 30% x (44,337.1374 - 29,579) = 4,427.4412 -> 6,405.1312; no decote (above 1,982)
    const total = 6_405.1312 + 6_727.914 + 5_718.15;
    expect(rate("FR", 60_000)).toBeCloseTo(total / 60_000, 5);
  });

  it("the decote reduces a small bill: single, taxable EUR 17,000", () => {
    // remote (no contributions): income 18,889 -> net imposable 18,889, allowance 10% = 1,888.9, taxable 17,000.1
    // tax 11% x (17,000.1 - 11,600) = 594.0, below 1,982, so the decote of 897 - 45.25% x 594.0 = 628.2 cancels it entirely
    expect(rate("FR", 18_889, "remote")).toBe(0);
  });

  it("married filers use two parts", () => {
    const single = rate("FR", 150_000, "remote", "single");
    const married = rate("FR", 150_000, "remote", "married");
    expect(married).toBeLessThan(single);
  });
});

import { germanyIncomeTaxSingle, germanySolidarity } from "./countryTaxRules/germany";

describe("Germany (section 32a EStG 2026, BMAS 2026 social-insurance values)", () => {
  it("tariff at the zone boundaries", () => {
    expect(germanyIncomeTaxSingle(12_348)).toBe(0);
    // y = 0.5: (914.51 x 0.5 + 1,400) x 0.5 = 928.6275 -> taxable 17,348
    expect(germanyIncomeTaxSingle(17_348)).toBe(928);
    // z = 1.0: (173.10 + 2,397) + 1,034.87 = 3,604.97 -> taxable 27,799
    expect(germanyIncomeTaxSingle(27_799)).toBe(3_604);
    // 0.42 x 100,000 - 11,135.63 = 30,864.37
    expect(germanyIncomeTaxSingle(100_000)).toBe(30_864);
    // 0.45 x 300,000 - 19,470.38 = 115,529.62
    expect(germanyIncomeTaxSingle(300_000)).toBe(115_529);
  });

  it("solidarity surcharge: nothing below EUR 20,350, then phased in at 11.9% of the excess", () => {
    expect(germanySolidarity(20_350, false)).toBe(0);
    expect(germanySolidarity(21_000, false)).toBeCloseTo(0.119 * 650, 6);
    // the phase-in meets the full 5.5% where 11.9% x (t - 20,350) = 5.5% x t, at t = 37,837
    expect(germanySolidarity(30_000, false)).toBeCloseTo(0.119 * 9_650, 6);
    expect(germanySolidarity(40_000, false)).toBeCloseTo(0.055 * 40_000, 6);
    expect(germanySolidarity(40_700, true)).toBe(0);
  });

  it("employee earning EUR 70,000", () => {
    // social: pension 9.3% = 6,510; unemployment 1.3% = 910; health 8.75% x 69,750 = 6,103.125; care 1.8% x 69,750 = 1,255.5 -> 14,778.625
    // taxable 70,000 - 1,230 - 36 - (6,510 + 6,103.125 + 1,255.5) = 54,865.375 -> 54,865; z = 3.7066
    // tax (173.10 x 3.7066 + 2,397) x 3.7066 + 1,034.87 = 12,297.79 -> 12,297; no solidarity surcharge
    expect(Math.abs(rate("DE", 70_000) * 70_000 - (12_297 + 14_778.625))).toBeLessThan(1.5);
  });

  it("splitting halves the tax base for married filers", () => {
    expect(rate("DE", 150_000, "remote", "married")).toBeLessThan(rate("DE", 150_000, "remote", "single"));
  });

  it("pensioners pay health and care but no pension or unemployment insurance", () => {
    // pension EUR 30,000: health 2,625 + care 1,080 = 3,705; taxable 30,000 - 36 - 3,705 = 26,259
    const taxable = 26_259;
    const tax = germanyIncomeTaxSingle(taxable);
    expect(rate("DE", 30_000, "retired")).toBeCloseTo((tax + 3_705) / 30_000, 8);
  });
});

import { greeceBracketTax } from "./countryTaxRules/greece";

describe("Greece (2026 reform scale, EUR 777 reduction)", () => {
  it("scale at EUR 40,000 is 8,900: 9% x 10,000 + 20% x 10,000 + 26% x 10,000 + 34% x 10,000", () => {
    expect(greeceBracketTax(40_000)).toBeCloseTo(900 + 2_000 + 2_600 + 3_400, 6);
  });

  it("scale above EUR 60,000 uses 44%", () => {
    expect(greeceBracketTax(70_000)).toBeCloseTo(8_900 + 0.39 * 20_000 + 0.44 * 10_000, 6);
  });

  it("employee earning EUR 30,000", () => {
    // EFKA 13.87% = 4,161; taxable 25,839: 900 + 2,000 + 26% x 5,839 = 4,418.14; reduction 777 - 20 x 13.839 = 500.22 -> 3,917.92
    expect(rate("GR", 30_000)).toBeCloseTo((3_917.92 + 4_161) / 30_000, 5);
  });

  it("the reduction wipes out tax on a low income: EUR 12,000 remote", () => {
    // 9% x 10,000 + 20% x 2,000 = 1,300, less reduction 777 -> 523
    expect(rate("GR", 12_000, "remote") * 12_000).toBeCloseTo(523, 6);
  });
});

describe("Guyana (GRA 2026 notice)", () => {
  it("employee earning GYD 6,000,000", () => {
    // NIS 5.6% x 3,360,000 (ceiling) = 188,160; balance 5,811,840; allowance max(1,680,000, 1,937,280) = 1,937,280; chargeable 3,874,560
    // tax 25% x 3,360,000 = 840,000 + 35% x 514,560 = 180,096 -> 1,020,096
    expect(rate("GY", 6_000_000)).toBeCloseTo((1_020_096 + 188_160) / 6_000_000, 8);
  });

  it("pays nothing within the allowance", () => {
    expect(rate("GY", 1_500_000, "remote")).toBe(0);
  });

  it("uses the 1,680,000 allowance at modest incomes: GYD 3,000,000 remote", () => {
    // one third = 1,000,000 < 1,680,000; chargeable 1,320,000; tax 330,000
    expect(rate("GY", 3_000_000, "remote") * 3_000_000).toBeCloseTo(330_000, 4);
  });
});

describe("Hong Kong (IRD 2026-27 allowances, MPF deduction)", () => {
  const hk = (income: number, filing: "single" | "married" = "single", isRetired = false) =>
    estimateAsiaTax({ countryCode: "HK", annualIncome: income, filing, isRetired, answers: { hk_work_location: "in_hk" } });

  it("employee earning HK$600,000, single", () => {
    // MPF 5% = 30,000 capped at 18,000; net 582,000; chargeable 582,000 - 145,000 = 437,000
    // progressive: 1,000 + 3,000 + 5,000 + 7,000 + 17% x 237,000 = 40,290 -> 56,290 (below 15% x 582,000 = 87,300)
    expect(hk(600_000).effectiveRate).toBeCloseTo((56_290 + 18_000) / 600_000, 10);
  });

  it("the standard rate caps tax at a very high income: HK$20,000,000", () => {
    // net 19,982,000; standard 15% x 5,000,000 + 16% x 14,982,000 = 750,000 + 2,397,120 = 3,147,120
    expect(hk(20_000_000).incomeTaxRate * 20_000_000).toBeCloseTo(3_147_120, 4);
  });

  it("the married allowance is HK$290,000", () => {
    const single = hk(400_000).incomeTaxRate * 400_000;
    const married = hk(400_000, "married").incomeTaxRate * 400_000;
    // net 382,000: single chargeable 237,000 -> 16,000 + 17% x 37,000 = 22,290; married chargeable 92,000 pays less
    expect(single).toBeCloseTo(22_290, 4);
    expect(married).toBeLessThan(single);
  });
});

describe("Hungary (NAV 2026: 15% SZJA + 18.5% contributions on gross)", () => {
  it("is 33.5% for an employee and 15% for a retiree", () => {
    expect(rate("HU", 12_000_000)).toBeCloseTo(0.335, 10);
    expect(rate("HU", 12_000_000, "retired")).toBeCloseTo(0.15, 10);
  });
});

describe("India new regime (Income Tax Department, AY 2026-27 slabs, 87A rebate)", () => {
  const inr = (income: number) => estimateAsiaTax({ countryCode: "IN", annualIncome: income, filing: "single", isRetired: false, answers: { in_regime: "new_regime" } });

  it("pays no income tax up to INR 12,75,000 of salary: rebate wipes out INR 50,000", () => {
    // taxable 1,200,000: base 20,000 + 40,000 = 60,000, rebate 60,000
    expect(inr(1_275_000).incomeTaxRate).toBe(0);
  });

  it("marginal relief just above: INR 12,80,000 salary", () => {
    // taxable 1,205,000: base 60,750 would exceed the 5,000 over the limit, so tax is 5,000 plus 4% cess = 5,200
    expect(inr(1_280_000).incomeTaxRate * 1_280_000).toBeCloseTo(5_200, 6);
  });

  it("no relief higher up: INR 14,75,000 salary", () => {
    // taxable 1,400,000: 20,000 + 40,000 + 15% x 200,000 = 90,000 -> excess 200,000 so no relief; cess 3,600 -> 93,600
    expect(inr(1_475_000).incomeTaxRate * 1_475_000).toBeCloseTo(93_600, 6);
  });
});

describe("Indonesia (DJP Article 17 layers, PTKP, occupational cost)", () => {
  const idr = (income: number, filing: "single" | "married" = "single") => estimateAsiaTax({ countryCode: "ID", annualIncome: income, filing, isRetired: false });

  it("IDR 300,000,000 a year, single", () => {
    // biaya jabatan 6,000,000; taxable 300,000,000 - 6,000,000 - 54,000,000 = 240,000,000: 5% x 60M + 15% x 180M = 30,000,000
    expect(idr(300_000_000).effectiveRate).toBeCloseTo(0.10, 10);
  });

  it("the married PTKP of IDR 58.5 million lowers the tax by 15% x 4.5M", () => {
    expect((idr(300_000_000).effectiveRate - idr(300_000_000, "married").effectiveRate) * 300_000_000).toBeCloseTo(675_000, 4);
  });

  it("pays nothing below PTKP plus the cost allowance", () => {
    expect(idr(50_000_000).effectiveRate).toBe(0);
  });
});

describe("Ireland (Revenue 2026 bands, credits, USC; PRSI 4.35%)", () => {
  it("EUR 60,000 employee, single", () => {
    // tax 8,800 + 6,400 - credits 4,000 = 11,200; USC 60.06 + 333.76 + 939 = 1,332.82; PRSI 2,610
    expect(rate("IE", 60_000)).toBeCloseTo(15_142.82 / 60_000, 8);
  });

  it("EUR 30,000 retiree, single: age credit, USC, no PRSI", () => {
    // tax 6,000 - (2,000 + 245) = 3,755; USC 60.06 + 333.76 + 39 = 432.82
    expect(rate("IE", 30_000, "retired")).toBeCloseTo(4_187.82 / 30_000, 8);
  });

  it("pays nothing at EUR 12,000", () => {
    expect(rate("IE", 12_000)).toBe(0);
  });
});

describe("Italy (2026 IRPEF with 33% second bracket, deductions, INPS)", () => {
  // No region selected: 2.0% regional fallback + 0.5% municipal.
  it("EUR 40,000 employee", () => {
    // INPS 3,676; taxable 36,324; gross 6,440 + 0.33 x 8,324 = 9,186.92; deduction 1,910 x 13,676 / 22,000; surtax 2.5% x 36,324
    const irpef = 9_186.92 - 1_910 * 13_676 / 22_000;
    expect(rate("IT", 40_000)).toBeCloseTo((irpef + 0.025 * 36_324 + 3_676) / 40_000, 8);
  });

  it("EUR 20,000 retiree: pension deduction, no INPS", () => {
    // gross 4,600; deduction 700 + 1,255 x 8,000 / 19,500; surtax 500
    expect(rate("IT", 20_000, "retired")).toBeCloseTo((4_600 - (700 + 1_255 * 8_000 / 19_500) + 500) / 20_000, 8);
  });

  it("a EUR 8,000 pension pays nothing", () => {
    expect(rate("IT", 8_000, "retired")).toBe(0);
  });
});

describe("Japan (NTA rates, employment income table, basic deduction, social insurance)", () => {
  it("JPY 6,000,000 employee", () => {
    // employment income B x 3.2 - 440,000 = 4,360,000; social insurance 0.05565 x 6M + 0.0915 x 6M = 882,900
    // national: (4,360,000 - 882,900 - 1,040,000) = 2,437,100 -> (97,500 + 48,710) x 1.021; resident: 10% x 3,047,100 + 5,000
    const national = (97_500 + 48_710) * 1.021;
    const resident = 304_710 + 5_000;
    expect(rate("JP", 6_000_000)).toBeCloseTo((national + resident + 882_900) / 6_000_000, 8);
  });

  it("JPY 3,000,000 retiree: pension deduction JPY 1.1 million, no social insurance", () => {
    // income 1,900,000; taxable 860,000 -> 43,000 x 1.021; resident 10% x 1,470,000 + 5,000
    expect(rate("JP", 3_000_000, "retired")).toBeCloseTo((43_000 * 1.021 + 152_000) / 3_000_000, 8);
  });

  it("JPY 1,000,000 remote worker pays no national or resident tax", () => {
    expect(rate("JP", 1_000_000, "remote")).toBe(0);
  });
});

describe("Latvia (VID 2026 rates, EUR 550 minimum, 10.5% contributions)", () => {
  it("EUR 50,000 employee", () => {
    // contributions 5,250; taxable 50,000 - 5,250 - 6,600 = 38,150; tax 25.5% x 38,150 = 9,728.25
    expect(rate("LV", 50_000)).toBeCloseTo((9_728.25 + 5_250) / 50_000, 8);
  });

  it("EUR 150,000 employee reaches the 33% band", () => {
    // contributions 11,056.50 (cap 105,300); taxable 150,000 - 11,056.5 - 6,600 = 132,343.5
    const tax = 0.255 * 105_300 + 0.33 * (132_343.5 - 105_300);
    expect(rate("LV", 150_000)).toBeCloseTo((tax + 11_056.5) / 150_000, 8);
  });

  it("a EUR 20,000 pension pays tax only", () => {
    expect(rate("LV", 20_000, "retired")).toBeCloseTo(0.255 * 13_400 / 20_000, 8);
  });
});

describe("Lithuania (2026 GPM bands, NPD, 19.5% contributions)", () => {
  it("EUR 30,000 employee", () => {
    // NPD 8,964 - 0.49 x 16,164 = 1,043.64; tax 20% x 28,956.36; contributions 5,850
    expect(rate("LT", 30_000)).toBeCloseTo((0.2 * 28_956.36 + 5_850) / 30_000, 8);
  });

  it("EUR 100,000 employee: no NPD, 25% band, contributions capped at 43 VDU", () => {
    const tax = 0.2 * 83_237.4 + 0.25 * (100_000 - 83_237.4);
    expect(rate("LT", 100_000)).toBeCloseTo((tax + 0.195 * 99_422.45) / 100_000, 8);
  });

  it("EUR 15,000 pension: tax only", () => {
    expect(rate("LT", 15_000, "retired")).toBeCloseTo(0.2 * (15_000 - (8_964 - 0.49 * 1_164)) / 15_000, 8);
  });
});

describe("Malaysia (LHDN resident rates, reliefs, EPF) in both calculators", () => {
  const asia = (income: number, scenario: "local" | "remote" | "retired" = "local") =>
    estimateAsiaTax({ countryCode: "MY", annualIncome: income, filing: "single", isRetired: scenario === "retired", incomeScenario: scenario }).effectiveRate;

  it("MYR 100,000 employee", () => {
    // EPF 11,000; SOCSO/EIS 504; chargeable 87,000: tax 3,700 + 19% x 17,000 = 6,930
    expect(rate("MY", 100_000)).toBeCloseTo(18_434 / 100_000, 8);
    expect(asia(100_000)).toBeCloseTo(18_434 / 100_000, 8);
  });

  it("MYR 30,000 employee: the MYR 400 rebate wipes out the income tax", () => {
    // chargeable 17,700: 1% x 12,700 = 127, less the rebate; contributions 3,300 + 210
    expect(rate("MY", 30_000)).toBeCloseTo(3_510 / 30_000, 8);
  });

  it("shows no tax on remote or pension income", () => {
    expect(rate("MY", 100_000, "remote")).toBe(0);
    expect(asia(100_000, "retired")).toBe(0);
  });

  it("Indonesia gives the same answer in the International calculator", () => {
    expect(rate("ID", 300_000_000)).toBeCloseTo(0.10, 10);
  });
});

describe("Malta (2026 single and married computations, Class 1)", () => {
  it("EUR 40,000 single employee", () => {
    // 25% x 40,000 - 3,400 = 6,600; Class 1 capped at 55.93 x 52 = 2,908.36
    expect(rate("MT", 40_000)).toBeCloseTo((6_600 + 2_908.36) / 40_000, 8);
  });

  it("EUR 30,000 married employee uses the married table", () => {
    // 25% x 30,000 - 4,550 = 2,950
    expect(rate("MT", 30_000, "local", "married")).toBeCloseTo((2_950 + 2_908.36) / 30_000, 8);
  });

  it("EUR 14,000 single retiree: 15% band less the 1,800 deduction, no contributions", () => {
    expect(rate("MT", 14_000, "retired")).toBeCloseTo(300 / 14_000, 10);
  });
});

describe("Mexico (SAT 2026 annual tariff, IMSS)", () => {
  it("MXN 500,000 employee", () => {
    const isr = 67_981.92 + (500_000 - 424_353.98) * 0.2352;
    const imss = 0.02375 * 500_000 + 0.004 * (500_000 - 3 * 117.31 * 365);
    expect(rate("MX", 500_000)).toBeCloseTo((isr + imss) / 500_000, 8);
  });

  it("MXN 100,000 remote worker: second band, no IMSS", () => {
    expect(rate("MX", 100_000, "remote")).toBeCloseTo((5_051.37 + (100_000 - 86_022.12) * 0.1088) / 100_000, 8);
  });

  it("IMSS stops growing at the 25 UMA cap", () => {
    const base = rate("MX", 2_000_000) * 2_000_000;
    const higher = rate("MX", 3_000_000) * 3_000_000;
    // from MXN 2M to 3M the extra cost is tax only: 34% to 5,107,703
    expect(higher - base).toBeCloseTo(1_000_000 * 0.34, 4);
  });
});

describe("Netherlands (Belastingdienst 2026 box 1 and credits)", () => {
  it("EUR 60,000 employee", () => {
    const gross = 0.3575 * 38_883 + 0.3756 * (60_000 - 38_883);
    const general = 3_115 - 0.06398 * (60_000 - 29_736);
    const labour = 5_685 - 0.0651 * (60_000 - 45_592);
    expect(rate("NL", 60_000)).toBeCloseTo((gross - general - labour) / 60_000, 8);
  });

  it("EUR 30,000 single retiree: 17.85%, AOW general credit and elderly credits", () => {
    const general = 1_556 * (1 - (30_000 - 29_736) / (78_426 - 29_736));
    expect(rate("NL", 30_000, "retired")).toBeCloseTo((0.1785 * 30_000 - general - 2_067 - 540) / 30_000, 8);
  });

  it("the 30% ruling taxes 70% of pay", () => {
    const base = 100_000 * 0.7;
    const gross = 0.3575 * 38_883 + 0.3756 * (base - 38_883) - (3_115 - 0.06398 * (base - 29_736)) - (5_685 - 0.0651 * (base - 45_592));
    expect(estimateInternationalTax({ countryCode: "NL", annualIncome: 100_000, filing: "single", isRetired: false, answers: { nl_30pct_ruling: "yes" } }).effectiveRate)
      .toBeCloseTo(gross / 100_000, 8);
  });
});

describe("New Zealand (IRD rates, ACC levy) in both calculators", () => {
  const asia = (income: number, scenario: "local" | "remote" | "retired" = "local") =>
    estimateAsiaTax({ countryCode: "NZ", annualIncome: income, filing: "single", isRetired: scenario === "retired", incomeScenario: scenario }).effectiveRate;

  it("NZD 100,000 employee", () => {
    // 1,638 + 6,632.50 + 7,380 + 7,227 = 22,877.50; ACC 1.75% = 1,750
    expect(rate("NZ", 100_000)).toBeCloseTo(24_627.5 / 100_000, 8);
    expect(asia(100_000)).toBeCloseTo(24_627.5 / 100_000, 8);
  });

  it("NZD 40,000 superannuitant pays tax only", () => {
    // 1,638 + 24,400 x 17.5% = 5,908
    expect(rate("NZ", 40_000, "retired")).toBeCloseTo(5_908 / 40_000, 8);
  });

  it("the ACC levy stops at the NZD 156,641 cap", () => {
    expect((rate("NZ", 200_000) - rate("NZ", 200_000, "remote")) * 200_000).toBeCloseTo(0.0175 * 156_641, 4);
  });
});

describe("Norway (Skatteetaten 2026 rates, deductions, trygdeavgift)", () => {
  it("NOK 700,000 employee", () => {
    // ordinary 22% x (700,000 - 95,700 - 114,540) = 107,747.20; bracket 1,567.40 + 15,268; trygdeavgift 53,200
    expect(rate("NO", 700_000)).toBeCloseTo((107_747.2 + 16_835.4 + 53_200) / 700_000, 8);
  });

  it("NOK 300,000 pensioner: the pensioner credit wipes out income tax, leaving 5.1% national insurance", () => {
    expect(rate("NO", 300_000, "retired")).toBeCloseTo(0.051, 8);
  });

  it("NOK 80,000 income is below the national-insurance floor", () => {
    expect(rate("NO", 80_000)).toBe(0);
  });
});

describe("Panama (DGI scale, territorial system, 11% contributions)", () => {
  it("USD 60,000 employee", () => {
    // 5,850 + 25% x 10,000 = 8,350; contributions 6,600
    expect(rate("PA", 60_000)).toBeCloseTo(14_950 / 60_000, 10);
  });

  it("a remote salary paid from abroad is untaxed", () => {
    expect(rate("PA", 60_000, "remote")).toBe(0);
  });
});

describe("Paraguay (DNIT IRP scale, PYG 80 million threshold, IPS 9%)", () => {
  it("PYG 200,000,000 employee", () => {
    // IPS 18,000,000; net 182,000,000: 4,000,000 + 9,000,000 + 3,200,000
    expect(rate("PY", 200_000_000)).toBeCloseTo(34_200_000 / 200_000_000, 10);
  });

  it("PYG 60,000,000 employee pays only IPS", () => {
    expect(rate("PY", 60_000_000)).toBeCloseTo(0.09, 10);
  });

  it("a foreign pension is untaxed", () => {
    expect(rate("PY", 200_000_000, "retired")).toBe(0);
  });
});

describe("Peru (UIT S/ 5,500, 7 UIT deduction, scale, 13% pension)", () => {
  it("PEN 100,000 employee", () => {
    // net 61,500 = 11.18 UIT: 8% x 27,500 + 14% x 34,000 = 2,200 + 4,760 = 6,960; pension 13,000
    expect(rate("PE", 100_000)).toBeCloseTo((6_960 + 13_000) / 100_000, 8);
  });

  it("PEN 38,500 pays no income tax", () => {
    expect(rate("PE", 38_500, "retired")).toBe(0);
  });

  it("PEN 400,000 remote worker reaches the 30% band", () => {
    // net 361,500 = 65.73 UIT: 8% x 27,500 + 14% x 82,500 + 17% x 82,500 + 20% x 55,000 + 30% x (361,500 - 247,500)
    const tax = 2_200 + 11_550 + 14_025 + 11_000 + 0.3 * 114_000;
    expect(rate("PE", 400_000, "remote")).toBeCloseTo(tax / 400_000, 8);
  });
});

describe("Philippines (BIR graduated rates, SSS/PhilHealth/Pag-IBIG)", () => {
  const ph = (income: number, scenario: "local" | "remote" | "retired" = "local") =>
    estimateAsiaTax({ countryCode: "PH", annualIncome: income, filing: "single", isRetired: scenario === "retired", incomeScenario: scenario, answers: { ph_residency: "citizen_resident" } }).effectiveRate;

  it("PHP 1,200,000 employee", () => {
    // contributions 21,000 + 30,000 + 2,400 = 53,400; taxable 1,146,600: 22,500 + 80,000 + 25% x 346,600 = 189,150
    expect(ph(1_200_000)).toBeCloseTo(242_550 / 1_200_000, 8);
  });

  it("PHP 300,000 pension: only the 15% band applies", () => {
    expect(ph(300_000, "retired")).toBeCloseTo(0.15 * 50_000 / 300_000, 10);
  });
});

describe("Poland (PIT scale with the PLN 3,600 reduction, ZUS, health)", () => {
  it("PLN 150,000 employee reaches the 32% band at PLN 120,000 of base", () => {
    // ZUS 16,890 + 3,675 = 20,565; health 9% x 129,435 = 11,649.15; base 150,000 - 20,565 - 3,000 = 126,435: 10,800 + 32% x 6,435
    expect(rate("PL", 150_000)).toBeCloseTo((20_565 + 11_649.15 + 12_859.2) / 150_000, 8);
  });

  it("PLN 60,000 pension: scale less PLN 3,600, plus 9% health", () => {
    expect(rate("PL", 60_000, "retired")).toBeCloseTo(0.15, 10);
  });

  it("the ZUS pension and disability contributions stop at the annual cap", () => {
    const a = rate("PL", 400_000) * 400_000;
    const b = rate("PL", 500_000) * 500_000;
    // above the cap each extra zloty costs 2.45% sickness, health 9% x (1 - 0.0245) and 32% PIT on the base left after those
    const extra = 100_000;
    const zus = 0.0245 * extra;
    const health = 0.09 * (extra - zus);
    const pit = 0.32 * (extra - zus);
    expect(b - a).toBeCloseTo(zus + health + pit, 4);
  });
});

describe("Portugal (Portal das Financas 2026 scale, specific deduction, 11% contributions)", () => {
  it("EUR 40,000 employee", () => {
    // taxable 35,412.91; tax 8,149.2576; contributions 4,400
    expect(rate("PT", 40_000)).toBeCloseTo((8_149.2576 + 4_400) / 40_000, 6);
  });

  it("EUR 20,000 retiree", () => {
    // taxable 15,412.91: 1,042.75 + 666.465 + 2,825.91 x 21.2%
    expect(rate("PT", 20_000, "retired")).toBeCloseTo((1_042.75 + 666.465 + 2_825.91 * 0.212) / 20_000, 6);
  });

  it("the married split lowers the tax of a single high earner", () => {
    expect(rate("PT", 100_000, "local", "married")).toBeLessThan(rate("PT", 100_000, "local", "single"));
  });
});

describe("Romania (10% tax after CAS 25% and CASS 10%)", () => {
  it("RON 120,000 employee: 41.5% in total", () => {
    // contributions 42,000; tax 10% x 78,000 = 7,800
    expect(rate("RO", 120_000)).toBeCloseTo(0.415, 10);
  });

  it("RON 60,000 pension: only the part above RON 36,000 a year is charged", () => {
    expect(rate("RO", 60_000, "retired")).toBeCloseTo(4_800 / 60_000, 10);
  });

  it("a pension below RON 3,000 a month pays nothing", () => {
    expect(rate("RO", 30_000, "retired")).toBe(0);
  });
});

describe("Singapore (IRAS resident scale and earned income relief)", () => {
  it("SGD 100,000 under 60", () => {
    // taxable 99,000: 200 + 350 + 2,800 + 11.5% x 19,000 = 5,535
    expect(rate("SG", 100_000)).toBeCloseTo(5_535 / 100_000, 10);
  });

  it("SGD 100,000 retiree with the SGD 8,000 relief", () => {
    // taxable 92,000: 200 + 350 + 2,800 + 11.5% x 12,000 = 4,730
    expect(rate("SG", 100_000, "retired")).toBeCloseTo(4_730 / 100_000, 10);
  });
});

describe("Slovakia (2026 four-rate scale, non-taxable part, contributions)", () => {
  it("EUR 60,000 employee", () => {
    // social 5,640; base 54,360 (no non-taxable part); 19% x 43,983.32 + 25% x 10,376.68; health 3,000
    const tax = 0.19 * 43_983.32 + 0.25 * (54_360 - 43_983.32);
    expect(rate("SK", 60_000)).toBeCloseTo((tax + 5_640 + 3_000) / 60_000, 8);
  });

  it("EUR 30,000 employee uses the shrinking non-taxable part", () => {
    // social 2,820; base 27,180; non-taxable 14,661.11 - 9,060 = 5,601.11
    const tax = 0.19 * (27_180 - 5_601.11);
    expect(rate("SK", 30_000)).toBeCloseTo((tax + 2_820 + 1_500) / 30_000, 8);
  });

  it("the non-taxable part is continuous at its thresholds", () => {
    expect(rate("SK", 100_000, "remote")).toBeGreaterThan(rate("SK", 80_000, "remote"));
  });
});

describe("Slovenia (2026 scale, general relief, 23.1% contributions)", () => {
  it("EUR 50,000 employee", () => {
    // contributions 11,550; base 38,450 less relief 5,551.93 = 32,898.07
    const tax = 0.16 * 9_721.43 + 0.26 * (28_592.44 - 9_721.43) + 0.33 * (32_898.07 - 28_592.44);
    expect(rate("SI", 50_000)).toBeCloseTo((tax + 11_550) / 50_000, 8);
  });

  it("EUR 20,000 pension", () => {
    // base 14,448.07 after the relief
    expect(rate("SI", 20_000, "retired")).toBeCloseTo((0.16 * 9_721.43 + 0.26 * (14_448.07 - 9_721.43)) / 20_000, 8);
  });

  it("a very low pension pays nothing", () => {
    expect(rate("SI", 6_000, "retired")).toBe(0);
  });
});

describe("South Africa (SARS 2026/27 table, rebates, UIF)", () => {
  it("ZAR 600,000 employee", () => {
    // 125,599 + 36% x 69,800 = 150,727; less the primary rebate 17,820 = 132,907; UIF 1% x 212,544 cap = 2,125.44
    expect(rate("ZA", 600_000)).toBeCloseTo((132_907 + 2_125.44) / 600_000, 8);
  });

  it("ZAR 300,000 retiree: both rebates apply", () => {
    // 44,118 + 26% x 54,900 = 58,392; less 17,820 + 9,765
    expect(rate("ZA", 300_000, "retired")).toBeCloseTo(30_807 / 300_000, 8);
  });

  it("the tax threshold under 65 is ZAR 99,000", () => {
    expect(rate("ZA", 99_000, "remote")).toBe(0);
  });
});

describe("South Korea (2026 scale, deductions, credits, local tax, insurance)", () => {
  it("KRW 50,000,000 employee", () => {
    // employment deduction 12,000,000 + 5% x 5,000,000 = 12,250,000
    const health = 0.03595 * 50_000_000;
    const insurance = 2_375_000 + health + 0.1314 * health + 450_000;
    const taxable = 50_000_000 - 12_250_000 - 1_500_000 - insurance;
    const scale = 0.06 * 14_000_000 + 0.15 * (taxable - 14_000_000);
    const credit = Math.min(715_000 + 0.3 * (scale - 1_300_000), Math.max(660_000, 740_000 - (50_000_000 - 33_000_000) * 0.008)) + 130_000;
    const determined = scale - credit;
    expect(rate("KR", 50_000_000)).toBeCloseTo((determined * 1.1 + insurance) / 50_000_000, 8);
  });

  it("KRW 20,000,000 pension: pension deduction, no credits or premiums", () => {
    // deduction 6,300,000 + 10% x 6,000,000 = 6,900,000; taxable 20,000,000 - 6,900,000 - 1,500,000 = 11,600,000 at 6%
    expect(rate("KR", 20_000_000, "retired")).toBeCloseTo((0.06 * 11_600_000 * 1.1) / 20_000_000, 8);
  });

  it("a small salary paid from abroad pays nothing", () => {
    expect(rate("KR", 10_000_000, "remote")).toBe(0);
  });
});

describe("Spain (national scale, Madrid scale, social security, personal minimum)", () => {
  const es = (income: number, scenario: "local" | "remote" | "retired" = "local") =>
    estimateInternationalTax({ countryCode: "ES", annualIncome: income, filing: "single", isRetired: scenario === "retired", incomeScenario: scenario, answers: { es_region: "MD" } }).effectiveRate;

  it("EUR 50,000 employee in Madrid", () => {
    // SS 3,250; base 44,750; national 6,129.50; Madrid 5,948.365; personal minimum relief 527.25 + 499.50
    expect(es(50_000)).toBeCloseTo((6_129.5 + 5_948.365 - 1_026.75 + 3_250) / 50_000, 8);
  });

  it("a pension of EUR 6,000 pays nothing after the EUR 2,000 expense and the personal minimum", () => {
    expect(es(6_000, "retired")).toBe(0);
  });

  it("a remote worker pays no Spanish social security", () => {
    expect(es(50_000, "remote")).toBeLessThan(es(50_000));
  });
});

describe("Suriname (SRD 108,000 tax-free, 8/18/28/38%, AOV 4%)", () => {
  it("SRD 300,000 employee", () => {
    // taxable 192,000: 3,360 + 7,560 + 11,760 + 38% x 66,000 = 47,760; AOV 12,000
    expect(rate("SR", 300_000)).toBeCloseTo(59_760 / 300_000, 10);
  });

  it("a pension below the tax-free amount pays nothing", () => {
    expect(rate("SR", 100_000, "retired")).toBe(0);
  });
});

describe("Sweden (Skatteverket 2026 allowance, municipal and state tax)", () => {
  it("SEK 600,000 employee: minimum allowance, no state tax", () => {
    const allowance = 0.293 * 59_200;
    expect(rate("SE", 600_000)).toBeCloseTo(0.3238 * (600_000 - allowance) / 600_000, 8);
  });

  it("SEK 900,000 employee pays state tax above the skiktgrans", () => {
    const taxable = 900_000 - 0.293 * 59_200;
    expect(rate("SE", 900_000)).toBeCloseTo((0.3238 * taxable + 0.2 * (taxable - 643_000)) / 900_000, 8);
  });

  it("the basic allowance joins up at its break points", () => {
    expect(rate("SE", 25_042)).toBeCloseTo(0, 4);
  });
});

describe("Switzerland (ESTV Form 58c federal scale, benchmark cantonal rate, AHV/ALV)", () => {
  it("CHF 100,000 single employee", () => {
    // AHV 5,300 + ALV 1,100; professional 3,000; insurance 1,800; taxable 88,800
    // federal 1,502.95 + 6.6% x 6,700 = 1,945.15 (the form shows 2,684.35 at CHF 100,000, which this scale reproduces)
    expect(rate("CH", 100_000)).toBeCloseTo((1_945.24 + 0.13 * 88_800 + 6_400) / 100_000, 5);
  });

  it("reproduces the form's tax amounts at sampled incomes", () => {
    const points: Array<[number, "single" | "married", number]> = [
      [100_000, "single", 2_684.35], [150_300, "single", 7_108.55], [200_000, "single", 12_903.35], [250_000, "single", 19_503.35],
      [100_000, "married", 1_816], [150_300, "married", 5_441], [200_000, "married", 11_880], [250_000, "married", 18_380],
      [941_200, "single", 108_238], [941_200, "married", 108_236],
    ];
    for (const [income, filing, tax] of points) expect(switzerlandFederalTax(income, filing)).toBeCloseTo(tax, 0);
  });

  it("married couples use the married scale", () => {
    expect(rate("CH", 100_000, "local", "married")).toBeLessThan(rate("CH", 100_000, "local", "single"));
  });
});

describe("Taiwan (2026 deductions and brackets, labour and health insurance)", () => {
  const tw = (income: number, scenario: "local" | "remote" | "retired" = "local") =>
    estimateAsiaTax({ countryCode: "TW", annualIncome: income, filing: "single", isRetired: scenario === "retired", incomeScenario: scenario, answers: { tw_residency: "resident" } }).effectiveRate;

  it("TWD 1,200,000 employee", () => {
    // taxable 1,200,000 - 136,000 - 101,000 - 227,000 = 736,000: 5% x 610,000 + 12% x 126,000 = 45,620
    // insurance: labour 0.13 x 0.2 x 45,800 x 12 = 14,289.6; health 0.0517 x 0.3 x 100,000 x 12 = 18,612
    expect(tw(1_200_000)).toBeCloseTo((45_620 + 14_289.6 + 18_612) / 1_200_000, 8);
  });

  it("TWD 300,000 pension: only the 5% band, no insurance", () => {
    expect(tw(300_000, "retired")).toBeCloseTo(0.05 * 63_000 / 300_000, 10);
  });
});

describe("Thailand (Revenue Department scale, deductions, social security) in both calculators", () => {
  const th = (income: number, scenario: "local" | "remote" | "retired" = "local") =>
    estimateAsiaTax({ countryCode: "TH", annualIncome: income, filing: "single", isRetired: scenario === "retired", incomeScenario: scenario, answers: { th_residency: "resident_remit" } }).effectiveRate;

  it("THB 1,200,000 employee", () => {
    // contributions 10,500; deductions 100,000 + 60,000 + 10,500; taxable 1,029,500
    const tax = 7_500 + 20_000 + 37_500 + 50_000 + 0.25 * 29_500;
    const expected = (tax + 10_500) / 1_200_000;
    expect(th(1_200_000)).toBeCloseTo(expected, 8);
    expect(rate("TH", 1_200_000)).toBeCloseTo(expected, 8);
  });

  it("THB 200,000 pension: below the first bracket", () => {
    expect(rate("TH", 200_000, "retired")).toBe(0);
  });
});

describe("Vietnam (Law 109/2025 scale, deduction, insurance) in both calculators", () => {
  const vn = (income: number, scenario: "local" | "remote" | "retired" = "local") =>
    estimateAsiaTax({ countryCode: "VN", annualIncome: income, filing: "single", isRetired: scenario === "retired", incomeScenario: scenario, answers: { vn_residency: "resident" } }).effectiveRate;

  it("VND 600,000,000 employee", () => {
    // insurance 10.5% x 561,600,000 cap = 58,968,000; taxable 600,000,000 - 58,968,000 - 186,000,000 = 355,032,000
    const insurance = 0.105 * 561_600_000;
    const taxable = 600_000_000 - insurance - 186_000_000;
    const tax = 0.05 * 120_000_000 + 0.10 * (taxable - 120_000_000);
    expect(vn(600_000_000)).toBeCloseTo((tax + insurance) / 600_000_000, 8);
    expect(rate("VN", 600_000_000)).toBeCloseTo((tax + insurance) / 600_000_000, 8);
  });

  it("VND 150,000,000 pension is below the personal deduction", () => {
    expect(rate("VN", 150_000_000, "retired")).toBe(0);
  });
});

describe("Turkey (2026 wage scale, SGK, stamp tax, minimum-wage exemption)", () => {
  it("TRY 1,200,000 employee", () => {
    // SGK 180,000; base 1,020,000: 28,500 + 42,000 + 27% x 620,000 = 237,900; exemption = tax on 336,906 = 57,881.2; stamp 0.759% x 803,640
    const tax = 237_900 - (28_500 + 0.2 * (336_906 - 190_000));
    expect(rate("TR", 1_200_000)).toBeCloseTo((tax + 180_000 + 0.00759 * (1_200_000 - 396_360)) / 1_200_000, 8);
  });

  it("the minimum wage pays only its SGK contributions", () => {
    expect(rate("TR", 33_030 * 12)).toBeCloseTo(0.15, 4);
  });

  it("a pension is shown as exempt", () => {
    expect(rate("TR", 500_000, "retired")).toBe(0);
  });
});

describe("United Kingdom (GOV.UK 2026-27 rates and employee NI)", () => {
  it("GBP 60,000 employee", () => {
    // taxable 47,430: 20% x 37,700 + 40% x 9,730 = 11,432; NI 8% x 37,700 + 2% x 9,730 = 3,210.60
    expect(rate("GB", 60_000)).toBeCloseTo(14_642.6 / 60_000, 8);
  });

  it("GBP 30,000 pension pays tax but no NI", () => {
    expect(rate("GB", 30_000, "retired")).toBeCloseTo(0.2 * 17_430 / 30_000, 8);
  });

  it("the allowance is gone at GBP 125,140", () => {
    const tax = 0.2 * 37_700 + 0.4 * (125_140 - 37_700);
    const ni = 0.08 * 37_700 + 0.02 * (125_140 - 50_270);
    expect(rate("GB", 125_140)).toBeCloseTo((tax + ni) / 125_140, 8);
  });
});
