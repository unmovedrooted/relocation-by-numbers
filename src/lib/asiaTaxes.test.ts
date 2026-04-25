// asiaTaxes.test.ts
import { describe, expect, it } from "vitest";
import { estimateAsiaTax } from "./asiaTaxes";

describe("estimateAsiaTax", () => {
  it("returns zero tax for UAE", () => {
    const result = estimateAsiaTax({
      countryCode: "AE",
      annualIncome: 300000,
      filing: "single",
      isRetired: false,
    });

    expect(result.effectiveRate).toBe(0);
    expect(result.incomeTaxRate).toBe(0);
    expect(result.socialContributionRate).toBe(0);
    expect(result.confidence).toBe("verified");
  });

  it("returns placeholder for unsupported countries", () => {
    const result = estimateAsiaTax({
      countryCode: "XX",
      annualIncome: 100000,
      filing: "single",
      isRetired: false,
    });

    expect(result.model).toBe("placeholder");
    expect(result.effectiveRate).toBe(0);
  });

  it("calculates Australia tax with Medicare separated", () => {
    const result = estimateAsiaTax({
      countryCode: "AU",
      annualIncome: 123200,
      filing: "single",
      isRetired: false,
    });

    expect(result.incomeTaxRate).toBeGreaterThan(0);
    expect(result.socialContributionRate).toBeCloseTo(0.02);
    expect(result.effectiveRate).toBeCloseTo(
      result.incomeTaxRate + result.socialContributionRate
    );
  });

  it("returns zero Singapore tax for non-resident remote foreign-source income", () => {
    const result = estimateAsiaTax({
      countryCode: "SG",
      annualIncome: 108000,
      filing: "single",
      isRetired: false,
      incomeScenario: "remote",
      answers: {
        sg_residency: "non_resident",
      },
    });

    expect(result.effectiveRate).toBe(0);
    expect(result.model).toBe("none");
  });

  it("separates New Zealand PAYE from ACC levy", () => {
  const result = estimateAsiaTax({
    countryCode: "NZ",
    annualIncome: 131200,
    filing: "single",
    isRetired: false,
  });

  expect(result.incomeTaxRate).toBeGreaterThan(0);
  expect(result.socialContributionRate).toBeGreaterThan(0);
  expect(result.effectiveRate).toBeCloseTo(
    result.incomeTaxRate + result.socialContributionRate
  );
});

it("applies Indonesia PTKP threshold", () => {
  const result = estimateAsiaTax({
    countryCode: "ID",
    annualIncome: 54000000,
    filing: "single",
    isRetired: false,
  });

  expect(result.incomeTaxRate).toBe(0);
  expect(result.effectiveRate).toBe(0);
});

it("includes Malaysia EPF contribution for local employment", () => {
  const result = estimateAsiaTax({
    countryCode: "MY",
    annualIncome: 376000,
    filing: "single",
    isRetired: false,
    incomeScenario: "local",
  });

  expect(result.incomeTaxRate).toBeGreaterThan(0);
  expect(result.socialContributionRate).toBeCloseTo(0.11);
});

it("returns zero Malaysia tax for remote income scenario", () => {
  const result = estimateAsiaTax({
    countryCode: "MY",
    annualIncome: 376000,
    filing: "single",
    isRetired: false,
    incomeScenario: "remote",
  });

  expect(result.effectiveRate).toBe(0);
  expect(result.model).toBe("none");
});

});