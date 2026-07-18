import { describe, expect, it } from "vitest";
import { monthlyHousingCost, estimateMortgageMonthly as estimatePercentMortgage } from "./housing";
import { estimateMortgageMonthly as estimateDecimalMortgage } from "./mortgage";
import { simulateFire, type FireInputs } from "./fireSim";
import { estimateNetBreakdown } from "./tax";

describe("financial logic audit: known-answer scenarios", () => {
  it("matches the standard fixed-rate mortgage payment equation", () => {
    const result = monthlyHousingCost({
      homePrice: 400_000,
      downPct: 20,
      ratePct: 6.5,
      termYears: 30,
      propertyTaxPct: 0,
      homeInsMonthly: 0,
      hoaMonthly: 0,
    });

    expect(result.loanAmount).toBe(320_000);
    expect(result.principalInterest).toBeCloseTo(2_022.62, 2);
  });

  it("calculates a zero-interest loan as principal divided by payments", () => {
    const result = monthlyHousingCost({
      homePrice: 120_000,
      downPct: 0,
      ratePct: 0,
      termYears: 10,
      propertyTaxPct: 0,
      homeInsMonthly: 0,
      hoaMonthly: 0,
    });

    expect(result.principalInterest).toBe(1_000);
  });

  it("calculates a zero-interest loan after a down payment", () => {
    const result = monthlyHousingCost({
      homePrice: 150_000,
      downPct: 20,
      ratePct: 0,
      termYears: 10,
      propertyTaxPct: 0,
      homeInsMonthly: 0,
      hoaMonthly: 0,
    });

    expect(result.loanAmount).toBe(120_000);
    expect(result.principalInterest).toBe(1_000);
  });

  it("returns zero principal and interest for a zero loan amount", () => {
    const result = monthlyHousingCost({
      homePrice: 120_000,
      downPct: 100,
      ratePct: 0,
      termYears: 10,
      propertyTaxPct: 0,
      homeInsMonthly: 0,
      hoaMonthly: 0,
    });

    expect(result.loanAmount).toBe(0);
    expect(result.principalInterest).toBe(0);
  });

  it.each([0, -10, Number.NaN])("handles an invalid loan term safely (%s)", (termYears) => {
    const result = monthlyHousingCost({
      homePrice: 120_000,
      downPct: 0,
      ratePct: 0,
      termYears,
      propertyTaxPct: 0,
      homeInsMonthly: 0,
      hoaMonthly: 0,
    });

    expect(result.principalInterest).toBe(0);
    expect(Number.isFinite(result.totalMonthly)).toBe(true);
  });

  it("keeps tax, insurance, and HOA independent from zero-rate P&I", () => {
    const result = monthlyHousingCost({
      homePrice: 120_000,
      downPct: 0,
      ratePct: 0,
      termYears: 10,
      propertyTaxPct: 1.2,
      homeInsMonthly: 125,
      hoaMonthly: 75,
    });

    expect(result.principalInterest).toBe(1_000);
    expect(result.propertyTax).toBe(120);
    expect(result.homeInsurance).toBe(125);
    expect(result.hoa).toBe(75);
    expect(result.totalMonthly).toBe(1_320);
  });

  it("documents the two mortgage helpers' different percentage units", () => {
    expect(estimatePercentMortgage(400_000, { downPct: 20, rate: 7, years: 30 })).toBe(2_129);
    expect(estimateDecimalMortgage(400_000, { downPct: 0.2, rate: 0.07, years: 30 })).toBe(2_129);
  });

  it("matches a hand-calculated 2025 federal plus FICA result in Florida", () => {
    const result = estimateNetBreakdown({
      grossAnnual: 100_000,
      state: "fl",
      filing: "single",
      k401Pct: 0,
    });

    expect(result.taxableFederal).toBe(84_250);
    expect(result.federal).toBeCloseTo(13_449, 2);
    expect(result.fica).toBeCloseTo(7_650, 2);
    expect(result.state).toBe(0);
    expect(result.net).toBeCloseTo(78_901, 2);
  });

  it("reaches a fixed FIRE target in the independently calculable zero-return case", () => {
    const inputs: FireInputs = {
      currentAge: 30,
      annualIncome: 60_000,
      monthlyExpenses: 40_000 / 12,
      currentSavingsInvestments: 0,
      yearlyInvestment: 0,
      balance401k: 0,
      balanceIra: 0,
      balanceBrokerage: 0,
      contrib401k: 0,
      contribIra: 0,
      contribBrokerage: 12_000,
      inflationPct: 0,
      salaryGrowthPct: 0,
      withdrawalRatePct: 4,
      phases: [{ name: "Zero return", years: 100, returnPct: 0 }],
      maxYears: 100,
    };

    const result = simulateFire(inputs);
    expect(result.fireNumberAtStart).toBe(1_000_000);
    expect(result.yearsToFI).toBe(84);
    expect(result.projectedFiAge).toBe(114);
  });
});
