import { describe, expect, it } from "vitest";
import { monthlyHousingCost } from "./housing";
import { simulateRentVsBuy, type RentVsBuyInput } from "./rentVsBuy";
import { compareMove, type MoveInputs } from "./relocationMove";
import { findCity } from "./cities";
import { buildFireLink, parseFireLink, type FireMoveLink } from "./fireLink";

const amount = (value: number) => ({ amount: value, estimated: false });

describe("additional independent mortgage scenarios", () => {
  it.each([
    [120000, 0, 0, 10, 1000],
    [240000, 25, 0, 15, 1000],
    [375000, 20, 6, 30, 1798.65157545827],
    [650000, 10, 4.5, 15, 4475.20914115912],
    [100000, 100, 7, 30, 0],
    [0, 0, 0, 10, 0],
  ])("price %s, down %s%%, rate %s%%, term %s", (homePrice, downPct, ratePct, termYears, expected) => {
    const actual = monthlyHousingCost({
      homePrice, downPct, ratePct, termYears,
      propertyTaxPct: 1.2, homeInsMonthly: 137.25, hoaMonthly: 68.5,
    });
    expect(actual.principalInterest).toBeCloseTo(expected, 2);
    expect(actual.propertyTax).toBeCloseTo(homePrice * 0.001, 8);
    expect(actual.totalMonthly).toBeCloseTo(expected + homePrice * 0.001 + 205.75, 2);
  });

  // Independent oracle: discount each payment, rather than use the engine's annuity expression.
  it.each([0, 0.125, 3.75, 6.875, 12])("present value equals principal at %s%%", (ratePct) => {
    for (const termYears of [1, 7, 15, 30]) {
      const result = monthlyHousingCost({
        homePrice: 321987.65, downPct: 17.5, ratePct, termYears,
        propertyTaxPct: 0, homeInsMonthly: 0, hoaMonthly: 0,
      });
      let presentValue = 0;
      for (let month = 1; month <= termYears * 12; month++) {
        presentValue += result.principalInterest / (1 + ratePct / 1200) ** month;
      }
      expect(presentValue).toBeCloseTo(321987.65 * 0.825, 5);
    }
  });
});

describe("same-location and explicit moving-cost scenarios", () => {
  for (const cityId of ["nyc-ny", "la-ca", "chicago-il", "seattle-wa", "boston-ma", "raleigh-nc"]) {
    for (const filing of ["single", "married"] as const) {
      it.each([50000, 100000, 150000, 250000])(`${cityId}, ${filing}, salary %s`, (salary) => {
        const city = findCity(cityId)!;
        const input: MoveInputs = {
          filing, k401Pct1: 7.5, k401Pct2: 5,
          currentIncome1: salary, offerIncome1: salary,
          currentIncome2: filing === "married" ? 45000 : 0,
          offerIncome2: filing === "married" ? 45000 : 0,
          currentState: city.state, targetState: city.state,
          currentCityId: city.id, targetCityId: city.id,
          currentHousing: amount(2350.75), targetHousing: amount(2350.75),
          currentLiving: amount(1275.25), targetLiving: amount(1275.25),
          oneTime: {
            movers: amount(3000), travel: amount(0), setup: amount(0),
            leaseBreak: amount(0), fees: amount(0), overlapMonths: 0,
            refundableDeposit: amount(2000),
          },
        };
        const same = compareMove(input).expected;
        expect(same.monthlyChange).toBeCloseTo(0, 8);
        expect(same.firstYearImpact).toBe(-3000);
        expect(same.cashUpfront).toBe(5000);
        expect(same.monthsToRecover).toBeNull();
        const cheaper = compareMove({ ...input, targetHousing: amount(1850.75) }).expected;
        expect(cheaper.monthlyChange).toBeCloseTo(500, 8);
        expect(cheaper.firstYearImpact).toBeCloseTo(3000, 8);
        expect(cheaper.monthsToRecover).toBeCloseTo(6, 8);
      });
    }
  }
});

describe("rent versus buy: independent zero-growth ledgers", () => {
  it.each([
    [120000, 0, 10, 10, 500],
    [240000, 25, 15, 7, 1500],
    [600000, 100, 30, 10, 2000],
    [375000, 20, 15, 20, 1800],
  ])("price %s, down %s, term %s, horizon %s, rent %s", (homePrice, downPct, loanYears, years, monthlyRent) => {
    const input: RentVsBuyInput = {
      homePrice, downPct, loanYears, years, monthlyRent, mortgageRatePct: 0,
      propertyTaxPct: 0, homeInsuranceAnnual: 0, hoaMonthly: 0, maintenancePct: 0,
      buyClosingPct: 0, appreciationPct: 0, sellingCostPct: 0, rentGrowthPct: 0,
      rentersInsuranceMonthly: 0, investmentReturnPct: 0,
    };
    const loan = homePrice * (1 - downPct / 100);
    const payment = loan / (loanYears * 12);
    const payingMonths = Math.min(years, loanYears) * 12;
    const paidOffMonths = Math.max(0, years - loanYears) * 12;
    const balance = Math.max(0, loan - payment * payingMonths);
    const buyer = homePrice - balance + Math.max(0, monthlyRent - payment) * payingMonths + monthlyRent * paidOffMonths;
    const renter = homePrice - loan + Math.max(0, payment - monthlyRent) * payingMonths;
    const actual = simulateRentVsBuy(input);
    expect(actual.finalLoanBalance).toBeCloseTo(balance, 5);
    expect(actual.finalBuyer).toBeCloseTo(buyer, 4);
    expect(actual.finalRenter).toBeCloseTo(renter, 4);
  });
});

describe("FIRE handoff number sets", () => {
  it.each([50000, 100000, 150000, 250000])("preserves supported whole-dollar values at %s salary", (income) => {
    const original: FireMoveLink = {
      income, state: "ny", filing: "married", k401Pct: 7.5, expenses: 4321,
      movedIncome: income + 17500, movedState: "nc", movedCityId: "raleigh-nc",
      movedExpenses: 3210, movedCost: 7654,
    };
    expect(parseFireLink(new URL(buildFireLink(original), "https://example.com").searchParams)).toEqual(original);
  });
});
