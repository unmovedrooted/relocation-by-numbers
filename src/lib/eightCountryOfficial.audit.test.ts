import { describe, expect, it } from "vitest";
import { australiaTax } from "./countryTaxRules/australia";
import { switzerlandFederalTax } from "./countryTaxRules/switzerland";
import { franceBracketTax, franceEmployeeContributions, franceTax } from "./countryTaxRules/france";
import { japanEmploymentIncome, japanPensionDeduction } from "./countryTaxRules/japan";
import { portugalScaleTax, portugalTax } from "./countryTaxRules/portugal";
import { mexicoIsr } from "./countryTaxRules/mexico";
import { estimateInternationalTax } from "./internationalTaxes";

// Official-rule comparisons, NOT captured government calculator sessions.
// Sources, scope and exclusions: docs/audits/eight-country-official-validation-2026-10-15.md.
// The second block was written as expected failures before the production fixes and now passes.
const incomes = [50_000, 100_000, 150_000, 250_000];
const output = (countryCode: string, annualIncome: number, answers = {}) => estimateInternationalTax({
  countryCode, annualIncome, filing: "single", isRetired: false, incomeScenario: "local", answers,
}).effectiveRate * annualIncome;

describe("eight-country official reference components", () => {
  it.each(incomes.map((g, i) => [g, [6270, 22520, 39570, 83370][i]]))("AU resident taxable income %s", (g, expected) => {
    const r = australiaTax(g);
    expect(r.incomeTax + r.medicareLevy).toBeCloseTo(expected, 2);
    expect(output("AU", g)).toBeCloseTo(expected, 2);
  });
  it.each(incomes.map((g, i) => [g, [10480.4, 31442.6, 58713.6, 105713.6][i]]))("GB ordinary wages %s", (g, expected) => {
    expect(output("GB", g)).toBeCloseTo(expected, 2);
  });
  it.each([[50000, 400.80], [100000, 2684.35], [200000, 12903.35], [250000, 19503.35]])("CH federal single taxable %s (10-cent tolerance)", (g, expected) => {
    expect(Math.abs(switzerlandFederalTax(g, "single") - expected)).toBeLessThanOrEqual(0.1);
  });
  it.each(incomes)("FR national scale on taxable income %s (not gross salary)", (g) => {
    const expected = g <= 84577 ? 1977.69 + (g - 29579) * 0.30
      : g <= 181917 ? 18477.09 + (g - 84577) * 0.41
        : 58386.49 + (g - 181917) * 0.45;
    expect(franceBracketTax(g)).toBeCloseTo(expected, 2);
  });
  it.each([[3_000_000, 2_020_000], [5_000_000, 3_560_000], [8_000_000, 6_100_000], [12_000_000, 10_050_000]])("JP published employment-income table %s (not full 2026 liability)", (g, expected) => {
    expect(japanEmploymentIncome(g)).toBe(expected);
  });
  it.each([10000, 20000, 50000, 100000])("PT mainland scale on taxable income %s", (g) => {
    // Independent segment sums from Article 68, no shared production tables.
    const widths = [8342,4245,5251,5251,6308,13693,3476,40068];
    const rates = [.125,.157,.212,.241,.311,.349,.431,.446,.48];
    let remaining = g, expected = 0;
    for (let i = 0; i < rates.length; i++) { const part = Math.min(remaining, widths[i] ?? Infinity); expected += part * rates[i]; remaining -= part; }
    expect(portugalScaleTax(g)).toBeCloseTo(expected, 5);
  });
  it.each([[100000, 5051.37 + (100000 - 86022.12) * .1088], [500000, 67981.92 + (500000 - 424353.98) * .2352], [1000000, 125485.07 + (1000000 - 668840.15) * .30], [2000000, 444116.23 + (2000000 - 1702567.98) * .34]])("MX SAT annual ISR tariff %s", (g, expected) => {
    expect(mexicoIsr(g)).toBeCloseTo(expected, 6);
  });
});

describe("official-rule discrepancies found by the reviewer, now corrected", () => {
  it("AU low-income Medicare exemption: AUD 20,000 has no levy", () => {
    expect(australiaTax(20000).medicareLevy).toBe(0);
  });
  it("JP age65+ pension: NTA 3.5m example has 2.35m income, hence 1.15m deduction", () => {
    expect(japanPensionDeduction(3500000)).toBe(1150000);
  });
  it("FR CET is not charged below the social-security ceiling", () => {
    expect(franceEmployeeContributions(40000)).toBeCloseTo(40000 * (.069 + .004 + .0315 + .0086), 6);
  });
  it("FR CSG/CRDS continues on 100% of salary above four ceilings", () => {
    const g = 250000;
    const employee = .069 * 48060 + .004 * g + .0315 * 48060 + .0864 * (g - 48060) + .0086 * 48060 + .0108 * (g - 48060) + .0014 * g;
    const expected = employee + .097 * (.9825 * 192240 + g - 192240);
    expect(franceTax(g, { scenario: "local", married: false }).contributions).toBeCloseTo(expected, 6);
  });
  it("PT Article68A joint solidarity tax must use half taxable income", () => {
    const r = portugalTax(150000, "married", "local");
    const taxable = 150000 * .89;
    expect(r.incomeTax - 2 * portugalScaleTax(taxable / 2)).toBeCloseTo(0, 6);
  });
  it("CH Form58c discards taxable-income fractions below CHF100", () => {
    expect(switzerlandFederalTax(50099, "single")).toBeCloseTo(400.80, 2);
  });
  it("ES Madrid regional personal minimum is 5956.65, not 5550", () => {
    const g = 50000, taxable = g - g * .065 - 2000;
    const national = 12450 * .095 + (20200 - 12450) * .12 + (35200 - 20200) * .15 + (taxable - 35200) * .185;
    const regional = 13362.22 * .085 + (19004.63 - 13362.22) * .107 + (35425.68 - 19004.63) * .128 + (taxable - 35425.68) * .174;
    const expected = national + regional - 5550 * .095 - 5956.65 * .085 + g * .065;
    expect(output("ES", g, { es_region: "MD" })).toBeCloseTo(expected, 5);
  });
});
