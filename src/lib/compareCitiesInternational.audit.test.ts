import { describe, expect, it } from "vitest";
import { loadCalculator } from "./regionalHarness";
import { computeIntlCityResult } from "./compareEngines/international";
import { computeCaribCityResult } from "./compareEngines/caribbean";
import { getCityDefaultsUsd } from "./internationalCityDefaults";
import { getCountryByCode } from "./internationalCountries";
import { getCaribbeanCountryByCode } from "./caribbeanCountries";

// Compare Cities (international and Caribbean modes) against the real regional calculators on identical inputs, and against
// independent references for the cost, mortgage and ratio arithmetic.

const REGIONS = {
  Europe: { key: "europe", countries: ["PT", "ES", "DE", "GB", "FR", "IT"] },
  Asia: { key: "asia", countries: ["SG", "JP", "TH", "MY", "AE"] },
  SouthAmerica: { key: "south-america", countries: ["CO", "BR", "CL", "MX"] },
} as const;

describe("Compare Cities takes the same take-home pay as the full regional calculator", () => {
  for (const [region, { key, countries }] of Object.entries(REGIONS)) {
    describe(region, () => {
      for (const countryCode of countries) for (const mode of ["working", "retired"] as const) {
        it(`${countryCode} ${mode}, $100,000`, async () => {
          const calc = await loadCalculator(region);
          const regional = calc({ toCountry: countryCode, mode, incomeScenario: mode === "retired" ? "retired" : "remote",
            salaryType: "remote", salary: "100000", retirementIncome: "100000" });
          const compare = computeIntlCityResult({ region: key, countryCode, grossAnnualUsd: 100000, filing: "single", mode });
          expect(compare.netMonthly).toBeCloseTo(regional.netMonthlyTo, 6);
        });
      }
    });
  }
  it("the U.S. tax overlay agrees as well", async () => {
    const calc = await loadCalculator("Europe");
    const regional = calc({ toCountry: "DE", mode: "working", incomeScenario: "remote", salaryType: "remote", salary: "100000",
      usTaxStatus: "yes", usSelfEmployed: "no", conditionalAnswers: {} });
    const compare = computeIntlCityResult({ region: "europe", countryCode: "DE", grossAnnualUsd: 100000, filing: "single", mode: "working", usTaxHolder: true });
    const without = computeIntlCityResult({ region: "europe", countryCode: "DE", grossAnnualUsd: 100000, filing: "single", mode: "working" });
    expect(compare.netMonthly).toBeLessThanOrEqual(without.netMonthly);
    expect(compare.netMonthly).toBeCloseTo(regional.netMonthlyTo, 6);
  });
  it("working income is a remote worker's income, not a local employee's (the calculators' default)", () => {
    const remote = computeIntlCityResult({ region: "europe", countryCode: "FR", grossAnnualUsd: 100000, filing: "single", mode: "working" });
    // Taxed as a local employee, France takes about $1,300 a month more in contributions; the default must not do that.
    expect(remote.netMonthly).toBeGreaterThan(6500);
  });
});

describe("Caribbean Compare Cities takes the same take-home pay as the full Caribbean calculator", () => {
  for (const countryCode of ["JM", "BB", "KY", "DO", "BS", "TT"]) for (const mode of ["working", "retired"] as const) {
    it(`${countryCode} ${mode}, $100,000`, async () => {
      const calc = await loadCalculator("Caribbean");
      const regional = calc({ toCountry: countryCode, mode, incomeScenario: mode === "retired" ? "retired" : "remote", salaryType: "remote",
        salary: "100000", retirementIncome: "100000", conditionalAnswers: { us_tax_status: "no" } });
      // The regional calculator starts the U.S. tax question on Yes for someone leaving the U.S.; Compare has no U.S. taxpayer here, so the question is answered No.
      const compare = computeCaribCityResult({ countryCode, grossAnnualUsd: 100000, filing: "single", mode });
      // The full calculator uses the exact tax; Compare used a rate rounded to a whole percent.
      expect(compare.netMonthly).toBeCloseTo(regional.netMonthlyTo, 6);
    });
  }
});

// A mortgage on the estimated price, with the shared tax-and-insurance allowance, written independently.
const paymentWithTaxIns = (price: number, downPct: number, ratePct: number, years: number) => {
  const loan = price * (1 - Math.min(100, downPct) / 100);
  const m = ratePct / 100 / 12, n = years * 12;
  const pi = loan <= 0 ? 0 : m === 0 ? loan / n : loan * m / (1 - (1 + m) ** -n);
  return Math.round(pi + price * 0.015 / 12);
};

describe("Compare Cities international cost arithmetic", () => {
  const income = 90000;
  it("a city with data: rent, groceries, utilities, transport and healthcare, flexibility and share of take-home pay", () => {
    const d = getCityDefaultsUsd("PT-LIS")!.monthlyDefaults;
    const r = computeIntlCityResult({ region: "europe", countryCode: "PT", cityCode: "PT-LIS", grossAnnualUsd: income, filing: "single", mode: "working" });
    const costs = d.rent + d.groceries + d.utilities + d.transport + d.healthcare;
    expect(r.housingMonthly).toBeCloseTo(costs, 8);
    expect(r.monthlyFlexibility).toBeCloseTo(r.netMonthly - costs, 8);
    expect(r.pctOfIncome).toBeCloseTo((costs / r.netMonthly) * 100, 8);
    expect(r.effTaxPct).toBeCloseTo((1 - r.netMonthly * 12 / income) * 100, 8);
  });
  it("a country with no city data: country rent plus the shared fallback shares of rent for the other costs", () => {
    const country = getCountryByCode("PT")!;
    const r = computeIntlCityResult({ region: "europe", countryCode: "PT", grossAnnualUsd: income, filing: "single", mode: "working" });
    const rent = country.defaultRentSingle;
    expect(r.housingMonthly).toBeCloseTo(rent + rent * 0.18 + rent * 0.08 + rent * 0.07 + country.healthcareMonthlySingle, 8);
  });
  it("buying: the price is 16 years of rent, the payment is the loan payment plus 1.5% a year for tax and insurance", () => {
    const d = getCityDefaultsUsd("PT-LIS")!.monthlyDefaults;
    const r = computeIntlCityResult({ region: "europe", countryCode: "PT", cityCode: "PT-LIS", grossAnnualUsd: income, filing: "single", mode: "working",
      housingMode: "buy", buy: { downPct: 20, ratePct: 6, termYears: 30 } });
    expect(r.estimatedHomePrice).toBe(d.rent * 12 * 16);
    expect(r.housingMonthly).toBeCloseTo(paymentWithTaxIns(d.rent * 12 * 16, 20, 6, 30) + d.groceries + d.utilities + d.transport + d.healthcare, 8);
  });
  it("buying with a down payment of 100% or more has no loan payment but still has tax and insurance", () => {
    const d = getCityDefaultsUsd("PT-LIS")!.monthlyDefaults;
    const price = d.rent * 12 * 16;
    for (const downPct of [100, 150]) {
      const r = computeIntlCityResult({ region: "europe", countryCode: "PT", cityCode: "PT-LIS", grossAnnualUsd: income, filing: "single", mode: "working",
        housingMode: "buy", buy: { downPct, ratePct: 6, termYears: 30 } });
      expect(r.housingMonthly).toBeCloseTo(Math.round(price * 0.015 / 12) + d.groceries + d.utilities + d.transport + d.healthcare, 8);
    }
  });
  it("buying with a 0% rate is straight-line principal", () => {
    const d = getCityDefaultsUsd("PT-LIS")!.monthlyDefaults;
    const r = computeIntlCityResult({ region: "europe", countryCode: "PT", cityCode: "PT-LIS", grossAnnualUsd: income, filing: "single", mode: "working",
      housingMode: "buy", buy: { downPct: 20, ratePct: 0, termYears: 30 } });
    expect(r.housingMonthly).toBeCloseTo(paymentWithTaxIns(d.rent * 12 * 16, 20, 0, 30) + d.groceries + d.utilities + d.transport + d.healthcare, 8);
  });
  it("no income gives no take-home pay and says the tax estimate is unavailable", () => {
    const r = computeIntlCityResult({ region: "europe", countryCode: "PT", cityCode: "PT-LIS", grossAnnualUsd: 0, filing: "single", mode: "working" });
    expect(r.netMonthly).toBe(0);
    expect(r.taxLabel).toBe("Tax estimate unavailable");
    expect(r.monthlyFlexibility).toBeLessThan(0);
  });
});

describe("Caribbean Compare Cities cost arithmetic", () => {
  it("country rent plus the fallback shares of rent, and the country healthcare figure", () => {
    const country = getCaribbeanCountryByCode("JM")!;
    const r = computeCaribCityResult({ countryCode: "JM", grossAnnualUsd: 100000, filing: "single", mode: "working" });
    const rent = country.defaultRentSingle;
    expect(r.housingMonthly).toBeCloseTo(rent + rent * 0.18 + rent * 0.08 + rent * 0.07 + country.healthcareMonthlySingle, 8);
    expect(r.monthlyFlexibility).toBeCloseTo(r.netMonthly - r.housingMonthly, 8);
  });
  it("buying outright has tax and insurance only", () => {
    const country = getCaribbeanCountryByCode("JM")!;
    const r = computeCaribCityResult({ countryCode: "JM", grossAnnualUsd: 100000, filing: "single", mode: "working", housingMode: "buy", buy: { downPct: 100, ratePct: 7, termYears: 30 } });
    const rent = country.defaultRentSingle;
    expect(r.housingMonthly).toBeCloseTo(Math.round(rent * 12 * 16 * 0.015 / 12) + rent * 0.33 + country.healthcareMonthlySingle, 6);
  });
});

describe("the Caribbean calculator assumes a U.S. taxpayer when leaving the U.S.", () => {
  it("retired income abroad owes more with the U.S. tax question on its default (Yes) than answered No", async () => {
    const calc = await loadCalculator("Caribbean");
    const base = { toCountry: "KY", mode: "retired", incomeScenario: "retired", retirementIncome: "100000" };
    const byDefault = calc({ ...base, conditionalAnswers: {} }).netMonthlyTo as number;
    const answeredNo = calc({ ...base, conditionalAnswers: { us_tax_status: "no" } }).netMonthlyTo as number;
    expect(byDefault).toBeLessThan(answeredNo);
  });
});
