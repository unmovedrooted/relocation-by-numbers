import { describe, expect, it } from "vitest";
import { loanPayment, nonHousingPriceLevel, renovationPlan, stayVsBuy, trueMonthlyCost } from "./mortgageExtras";

describe("loanPayment", () => {
  it("matches the standard amortization formula", () => {
    // 400,000 at 6.5% for 30 years: 2,528.27 a month.
    expect(loanPayment(400_000, 6.5, 30)).toBeCloseTo(2_528.27, 2);
    expect(loanPayment(120_000, 0, 10)).toBe(1_000);
    expect(loanPayment(0, 6.5, 30)).toBe(0);
  });
});

describe("trueMonthlyCost", () => {
  it("adds maintenance and utilities to the lender payment", () => {
    // 500,000 home at 1% a year = 5,000 a year = 416.67 a month.
    const c = trueMonthlyCost({ payment: 3_400, homePrice: 500_000, maintenancePctPerYear: 1, utilitiesMonthly: 350 });
    expect(c.maintenance).toBeCloseTo(416.67, 2);
    expect(c.total).toBeCloseTo(3_400 + 416.67 + 350, 2);
  });

  it("treats blanks and negatives as zero", () => {
    expect(trueMonthlyCost({ payment: 2_000, homePrice: 0, maintenancePctPerYear: 1, utilitiesMonthly: -50 }).total).toBe(2_000);
  });
});

describe("renovationPlan", () => {
  const base = { homePrice: 400_000, renovationCost: 50_000, contingencyPct: 15, ratePct: 6.5, termYears: 30, savings: 150_000, cashToClose: 90_000, movingCosts: 5_000, reserveTarget: 18_000 };

  it("paid in cash: the budget comes out of savings", () => {
    const p = renovationPlan({ ...base, financed: false })!;
    expect(p.contingency).toBe(7_500);
    expect(p.budget).toBe(57_500);
    expect(p.allInCost).toBe(457_500);
    expect(p.cashForRenovation).toBe(57_500);
    expect(p.addedMonthlyPayment).toBe(0);
    // 150,000 - 90,000 - 5,000 - 57,500 = -2,500, which is 20,500 short of the 18,000 reserve.
    expect(p.cashAfterEverything).toBe(-2_500);
    expect(p.reserveGap).toBe(-20_500);
  });

  it("financed: no cash for the work, a higher payment instead", () => {
    const p = renovationPlan({ ...base, financed: true })!;
    expect(p.cashForRenovation).toBe(0);
    expect(p.cashAfterEverything).toBe(55_000);
    expect(p.reserveGap).toBe(37_000);
    expect(p.addedMonthlyPayment).toBeCloseTo(loanPayment(57_500, 6.5, 30), 6);
    expect(p.addedMonthlyPayment).toBeCloseTo(363.44, 2);
  });

  it("returns null without a renovation cost", () => {
    expect(renovationPlan({ ...base, renovationCost: 0, financed: false })).toBeNull();
  });
});

describe("stayVsBuy", () => {
  it("compares both sides and scales other spending by the price-level ratio", () => {
    const r = stayVsBuy({
      takeHomeStayMonthly: 6_000, takeHomeBuyMonthly: 6_400,
      housingStayMonthly: 2_500, housingBuyMonthly: 3_300,
      otherSpendingStayMonthly: 2_000, priceLevelStay: 104, priceLevelBuy: 97.5,
    });
    expect(r.stay.leftOver).toBe(1_500);
    expect(r.buy.otherSpending).toBeCloseTo(2_000 * (97.5 / 104), 6);
    expect(r.buy.leftOver).toBeCloseTo(6_400 - 3_300 - 1_875, 6);
    expect(r.change.takeHome).toBe(400);
    expect(r.change.housing).toBe(800);
    expect(r.change.leftOver).toBeCloseTo(-275, 6);
  });

  it("leaves other spending unchanged when a price level is missing", () => {
    const r = stayVsBuy({ takeHomeStayMonthly: 5_000, takeHomeBuyMonthly: 5_000, housingStayMonthly: 2_000, housingBuyMonthly: 2_000, otherSpendingStayMonthly: 1_500, priceLevelStay: 0, priceLevelBuy: 97 });
    expect(r.buy.otherSpending).toBe(1_500);
    expect(r.change.leftOver).toBe(0);
  });
});

describe("nonHousingPriceLevel", () => {
  it("averages goods and other services, and is null without data", () => {
    expect(nonHousingPriceLevel({ goods: 98.083, otherServices: 97.081 })).toBeCloseTo(97.582, 3);
    expect(nonHousingPriceLevel({ goods: null, otherServices: 97 })).toBeNull();
    expect(nonHousingPriceLevel(null)).toBeNull();
  });
});
