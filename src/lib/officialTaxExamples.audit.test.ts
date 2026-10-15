import { describe, expect, it } from "vitest";
import { germanyIncomeTax, germanySolidarity } from "./countryTaxRules/germany";
import { newZealandTax } from "./countryTaxRules/newZealand";
import { irelandTax } from "./countryTaxRules/ireland";
import { southAfricaTax } from "./countryTaxRules/southAfrica";
import { canadaTax } from "./countryTaxRules/canada";
import { estimateNetBreakdown, getFederalStandardDeduction } from "./wageTax";
import { estimateAsiaTax } from "./asiaTaxes";

// Figures published or computed by the tax authorities themselves, compared with the site's country modules. Each block names the
// source and the date it was read. These are official outputs, not the site's own formulas.

describe("Germany: Federal Ministry of Finance income tax calculator (bmf-steuerrechner.de, run 2026-10-15, tax year 2026)", () => {
  it.each([
    { zve: 40_000, married: false, tax: 7_209, soli: 0 },
    { zve: 300_000, married: false, tax: 115_529, soli: 6_354.09 },
    { zve: 150_000, married: true, tax: 40_728, soli: 3.33 },
  ])("taxable income $zve, married $married", ({ zve, married, tax, soli }) => {
    expect(germanyIncomeTax(zve, married)).toBe(tax);
    // The ministry rounds the surcharge down to the cent.
    expect(Math.floor(germanySolidarity(tax, married) * 100) / 100).toBeCloseTo(soli, 2);
  });
});

describe("New Zealand: Inland Revenue April 2026 PAYE deduction tables (IR341, four-weekly, including the ACC earners levy)", () => {
  // Four-weekly pay x 13 is the annual figure; the tables show tax plus ACC levy per four weeks, rounded to the cent.
  it.each([
    { pay: 1_000, table: 122.48 },
    { pay: 2_000, table: 301.0 },
    { pay: 8_000, table: 2_001.32 },
  ])("four-weekly pay $pay", ({ pay, table }) => {
    const { incomeTax, acc } = newZealandTax(pay * 13, "local");
    expect((incomeTax + acc) / 13).toBeCloseTo(table, 1);
  });
});

describe("Singapore: IRAS sample income tax calculations for year of assessment 2026 (iras.gov.sg, read 2026-10-15)", () => {
  const sg = (annualIncome: number, residency: string) =>
    estimateAsiaTax({ countryCode: "SG", annualIncome, filing: "single", isRetired: false, incomeScenario: "local", answers: { sg_residency: residency } });
  it("a resident with chargeable income of $234,100 pays $27,629 (Mr Fong)", () => {
    // The site assumes only the $1,000 earned income relief, so income of $235,100 has chargeable income of $234,100.
    expect(sg(235_100, "resident").effectiveRate * 235_100).toBeCloseTo(27_629, 0);
  });
  it("a non-resident employee on $21,000 pays 15%, $3,150 (Mr Gabriel)", () => {
    expect(sg(21_000, "non_resident").effectiveRate * 21_000).toBeCloseTo(3_150, 0);
  });
});

describe("Ireland: Revenue worked example for a single PAYE employee on EUR 50,000 (revenue.ie, 2026)", () => {
  it("income tax EUR 7,200 and USC EUR 1,032.82", () => {
    const r = irelandTax(50_000, "single", "remote");
    expect(r.incomeTax).toBe(7_200); // 44,000 x 20% + 6,000 x 40% less EUR 4,000 of credits
    expect(r.usc).toBeCloseTo(1_032.82, 2);
  });
  it("employee PRSI is 4.35% from 1 October 2026 (gov.ie Class A rates)", () => {
    expect(irelandTax(50_000, "single", "local").prsi).toBeCloseTo(50_000 * 0.0435, 6);
  });
});

describe("South Africa: SARS rates of tax for individuals, tax year ending 28 February 2027 (sars.gov.za, read 2026-10-15)", () => {
  // Tax before rebate from the published table, less the R17,820 primary rebate (under 65).
  const table = (taxable: number) => {
    const bands = [
      [1_878_600, 666_339, 0.45], [887_000, 259_783, 0.41], [695_800, 185_215, 0.39], [530_200, 125_599, 0.36],
      [383_100, 79_998, 0.31], [245_100, 44_118, 0.26], [0, 0, 0.18],
    ] as const;
    const [floor, base, rate] = bands.find(([f]) => taxable > f)!;
    return Math.max(0, base + rate * (taxable - floor) - 17_820);
  };
  it.each([150_000, 245_100, 400_000, 500_000, 800_000, 1_200_000, 2_000_000])("taxable income R%i", income => {
    expect(southAfricaTax(income, "remote").incomeTax).toBeCloseTo(table(income), 0);
  });
});

describe("Canada: CRA Payroll Deductions Online Calculator (apps.cra-arc.gc.ca PDOC, run 2026-10-15, Ontario, monthly pay of 8,333.33)", () => {
  // PDOC withholds from one pay period projected over the year (12 x the monthly figures: federal 1,111.23, Ontario tax with surtax and
  // health premium 561.66). It is a withholding projection, not the final annual tax, so a small gap is expected.
  const r = canadaTax(100_000, { province: "ON", scenario: "local", married: false });
  it("federal tax is within 0.5% of the CRA projection", () => {
    expect(Math.abs(r.federalTax - 1_111.23 * 12) / (1_111.23 * 12)).toBeLessThan(0.005);
  });
  it("Ontario tax with surtax and health premium is within 0.5% of the CRA projection", () => {
    const site = r.provincialTax + r.surtaxAndPremium;
    expect(Math.abs(site - 561.66 * 12) / (561.66 * 12)).toBeLessThan(0.005);
  });
  it("CPP and CPP2 annual maximums are the CRA figures ($4,230.45 and $416.00) plus EI at the 2026 maximum ($1,123.07)", () => {
    expect(r.payroll).toBeCloseTo(4_230.45 + 416 + 1_123.07, 2);
  });
});

describe("United States, married filing jointly: IRS Tax Withholding Estimator (apps.irs.gov, run 2026-10-15)", () => {
  // One earner, wages 150,000, no dependents, no adjustments, standard deduction, no other income. The estimator reports
  // a standard deduction of 32,200 and estimated federal tax of 15,340 (before payroll taxes, which it does not include).
  it("standard deduction is the IRS figure", () => {
    expect(getFederalStandardDeduction("married")).toBe(32_200);
  });
  it("federal income tax equals the IRS estimate exactly", () => {
    const r = estimateNetBreakdown({ grossAnnual: 150_000, state: "tx", filing: "married", k401Pct: 0 });
    expect(r.taxableFederal).toBe(117_800);
    expect(Math.round(r.federal)).toBe(15_340);
  });
});
