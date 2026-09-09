import { describe, expect, it } from "vitest";
import { ageAtYearEnd, esppSale, firstRmdYear, iraBasisAllocation, requiredDistribution,
  rmdStartAge, solveGrossWithdrawal, taxableSocialSecurity, type EsppLot } from "./rules";

const willow: EsppLot = { shares: 100, offeringDate: "2020-01-01", purchaseDate: "2021-07-01",
  purchasePrice: 20, offeringFairMarketValue: 22, purchaseFairMarketValue: 23, offeringOptionPrice: 20 };

describe("Section 423 ESPP independent known answers", () => {
  it("reproduces IRS Publication 525 example 10: qualifying sale", () => {
    const result = esppSale(willow, 100, 30, "2022-09-01");
    expect(result).toMatchObject({ proceeds: 3000, originalBasis: 2000, ordinaryIncome: 200,
      adjustedBasis: 2200, longTermGain: 800, shortTermGain: 0, qualifying: true, sharesRemaining: 0 });
  });
  it("reproduces IRS Publication 525 example 11: disqualifying sale", () => {
    expect(esppSale(willow, 100, 30, "2022-01-01")).toMatchObject({ ordinaryIncome: 300,
      adjustedBasis: 2300, shortTermGain: 700, longTermGain: 0, qualifying: false });
  });
  it("preserves compensation and capital loss on a disqualifying loss sale", () => {
    expect(esppSale(willow, 100, 18, "2022-01-01")).toMatchObject({ ordinaryIncome: 300, shortTermGain: -500 });
  });
  it("has no compensation on a qualifying loss sale", () => {
    expect(esppSale(willow, 100, 18, "2023-01-01")).toMatchObject({ ordinaryIncome: 0, longTermGain: -200 });
  });
  it("uses offering-date option price for lookback compensation and limits it to appreciation", () => {
    const lot = { ...willow, purchasePrice: 17, offeringOptionPrice: 18.7 };
    const result = esppSale(lot, 100, 19, "2023-01-01");
    expect(result.ordinaryIncome).toBeCloseTo(200, 10);
    expect(result.longTermGain).toBeCloseTo(0, 10);
  });
  it("distinguishes long-term capital gains from ESPP qualifying status", () => {
    const lot = { ...willow, offeringDate: "2021-01-01" };
    expect(esppSale(lot, 100, 30, "2022-07-02")).toMatchObject({ qualifying: false, ordinaryIncome: 300, longTermGain: 700 });
  });
  it("does not treat the purchase anniversary itself as more than one year", () => {
    expect(esppSale(willow, 1, 30, "2022-07-01").qualifying).toBe(false);
    expect(esppSale(willow, 1, 30, "2022-07-02").qualifying).toBe(true);
  });
  it("allocates fractional shares and fees without rounding basis prematurely", () => {
    const result = esppSale(willow, 0.125, 30.1234, "2023-01-01", 0.01);
    expect(result.originalBasis).toBe(2.5);
    expect(result.ordinaryIncome).toBe(0.25);
    expect(result.proceeds).toBeCloseTo(3.755425, 10);
    expect(result.longTermGain).toBeCloseTo(1.005425, 10);
    expect(result.sharesRemaining).toBe(99.875);
  });
  it("does not deduct selling fees from the FMV compensation measure", () => {
    const result = esppSale(willow, 100, 21, "2023-01-01", 10);
    expect(result.ordinaryIncome).toBe(100);
    expect(result.longTermGain).toBe(-10);
  });
  it("conserves economic gain across sale prices and quantities", () => {
    for (let i = 1; i <= 200; i++) {
      const result = esppSale(willow, i / 4, i / 3, i % 2 ? "2022-01-01" : "2023-01-01");
      expect(result.ordinaryIncome + result.shortTermGain + result.longTermGain)
        .toBeCloseTo(result.proceeds - result.originalBasis, 8);
    }
  });
  it.each([NaN, Infinity, -1])("rejects invalid quantities: %s", shares => {
    expect(() => esppSale(willow, shares, 30, "2023-01-01")).toThrow();
  });
  it("rejects impossible dates, quantities and prices", () => {
    expect(() => esppSale(willow, 101, 30, "2023-01-01")).toThrow();
    expect(() => esppSale(willow, 1, 30, "2023-02-30")).toThrow();
    expect(() => esppSale(willow, 1, 30, "2020-01-01")).toThrow();
    expect(() => esppSale({ ...willow, purchasePrice: 25 }, 1, 30, "2023-01-01")).toThrow();
  });
});

describe("RMD birth cohorts and prior-year balances", () => {
  it.each([["1949-06-30", 70.5], ["1949-07-01", 72], ["1950-12-31", 72],
    ["1951-01-01", 73], ["1959-12-31", 73], ["1960-01-01", 75]] as const)
  ("uses birthdate %s -> age %s", (birth, age) => expect(rmdStartAge(birth)).toBe(age));
  it("uses calendar-year age and the birth cohort", () => {
    expect(ageAtYearEnd("1960-12-31", 2035)).toBe(75);
    expect(firstRmdYear("1960-12-31")).toBe(2035);
    expect(firstRmdYear("1948-08-01")).toBe(2019);
  });
  it("calculates $246,000 / 24.6 = $10,000 at 75", () => {
    expect(requiredDistribution({ birthDate: "1960-01-01", year: 2035,
      priorDecemberBalance: 246000, accountType: "traditional-ira" })).toBe(10000);
  });
  it("does not start the 1960 cohort at 73", () => {
    expect(requiredDistribution({ birthDate: "1960-01-01", year: 2033,
      priorDecemberBalance: 246000, accountType: "401k" })).toBe(0);
  });
  it.each(["roth-ira", "roth-401k"] as const)("has no owner lifetime RMD for %s", accountType => {
    expect(requiredDistribution({ birthDate: "1940-01-01", year: 2026,
      priorDecemberBalance: 246000, accountType })).toBe(0);
  });
  it("fails explicitly rather than applying the wrong table for a much younger spouse", () => {
    expect(() => requiredDistribution({ birthDate: "1950-01-01", year: 2026,
      priorDecemberBalance: 246000, accountType: "traditional-ira", youngerSpouseSoleBeneficiary: true })).toThrow(/Joint Life/);
  });
  it("accepts zero balances and rejects invalid ones", () => {
    const base = { birthDate: "1950-01-01", year: 2026, accountType: "traditional-ira" as const };
    expect(requiredDistribution({ ...base, priorDecemberBalance: 0 })).toBe(0);
    expect(() => requiredDistribution({ ...base, priorDecemberBalance: Infinity })).toThrow();
    expect(() => requiredDistribution({ ...base, priorDecemberBalance: -1 })).toThrow();
  });
});

describe("Household tax and cash primitives", () => {
  it("taxes Social Security at the appropriate inclusion tiers, not a flat 85%", () => {
    expect(taxableSocialSecurity(20000, 15000, 0, false)).toBe(0);
    expect(taxableSocialSecurity(20000, 20000, 0, false)).toBe(2500);
    expect(taxableSocialSecurity(20000, 30000, 0, false)).toBe(9600);
    expect(taxableSocialSecurity(20000, 100000, 0, false)).toBe(17000);
    expect(taxableSocialSecurity(40000, 18000, 0, true)).toBe(3000);
    expect(taxableSocialSecurity(40000, 18000, 10000, true)).toBe(9400);
  });
  it("preserves aggregated IRA basis across distributions and conversions", () => {
    // $20k basis / ($80k ending + $10k distributed + $10k converted) = 20%.
    expect(iraBasisAllocation(20000, 80000, 10000, 10000)).toEqual({
      nontaxableDistributions: 2000, nontaxableConversions: 2000,
      taxableDistributions: 8000, taxableConversions: 8000, remainingBasis: 16000,
    });
  });
  it("retains unused basis when no distributions occur and handles total losses", () => {
    expect(iraBasisAllocation(100, 0, 0, 0).remainingBasis).toBe(100);
    expect(iraBasisAllocation(100, 0, 50, 0).remainingBasis).toBe(50);
    expect(iraBasisAllocation(100, 0, 50, 0).taxableDistributions).toBe(0);
  });
  it("grosses up $60,000 spending at 20% tax to $75,000", () => {
    const result = solveGrossWithdrawal(60000, 100000, gross => gross * 0.8);
    expect(result.gross).toBeCloseTo(75000, 5);
    expect(result.shortfall).toBe(0);
  });
  it("finds the root across marginal brackets", () => {
    const result = solveGrossWithdrawal(60000, 100000, gross => gross - Math.max(0, gross - 20000) * 0.25);
    expect(result.gross).toBeCloseTo(73333.333333, 5);
    expect(result.net).toBeCloseTo(60000, 5);
  });
  it("reports an actual shortfall and handles no assets", () => {
    expect(solveGrossWithdrawal(60000, 50000, g => g * 0.8)).toEqual({ gross: 50000, net: 40000, shortfall: 20000 });
    expect(solveGrossWithdrawal(1, 0, g => g)).toEqual({ gross: 0, net: 0, shortfall: 1 });
    expect(solveGrossWithdrawal(0, 0, g => g)).toEqual({ gross: 0, net: 0, shortfall: 0 });
  });
  it("rejects nonfinite tax outputs and does not mutate inputs", () => {
    expect(() => solveGrossWithdrawal(1, 100, () => NaN)).toThrow();
    expect(() => taxableSocialSecurity(NaN, 0, 0, false)).toThrow();
    expect(() => iraBasisAllocation(-1, 0, 0, 0)).toThrow();
    const frozen = Object.freeze({ ...willow });
    expect(() => esppSale(frozen, 10, 30, "2023-01-01")).not.toThrow();
    expect(frozen.shares).toBe(100);
  });
});
