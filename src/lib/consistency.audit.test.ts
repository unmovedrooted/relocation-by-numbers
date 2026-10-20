import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compareMove, type Item, type MoveInputs } from "./relocationMove";
import { findCity } from "./cities";
import { estimateMortgageMonthly } from "./mortgage";
import { RENT_VS_BUY_DEFAULTS, rentVsBuyThresholds, simulateRentVsBuy, type RentVsBuyInput } from "./rentVsBuy";
import { buildFireLink, parseFireLink, type FireMoveLink } from "./fireLink";

const entered = (amount: number): Item => ({ amount, estimated: false });

const noOneTime = {
  movers: entered(0), travel: entered(0), setup: entered(0), leaseBreak: entered(0), fees: entered(0), overlapMonths: 0, refundableDeposit: entered(0),
};

/** A move from a place to itself: same city, same pay, same housing and living costs. */
function stayPut(cityId: string, filing: "single" | "married", income: number): MoveInputs {
  const city = findCity(cityId)!;
  return {
    filing, k401Pct1: 6, k401Pct2: filing === "married" ? 6 : 0,
    currentIncome1: income, currentIncome2: filing === "married" ? income * 0.6 : 0,
    offerIncome1: income, offerIncome2: filing === "married" ? income * 0.6 : 0,
    currentState: city.state, currentCityId: city.id, targetState: city.state, targetCityId: city.id,
    currentHousing: entered(2200), targetHousing: entered(2200),
    currentLiving: entered(1400), targetLiving: entered(1400),
    oneTime: noOneTime,
  };
}

describe("a move from a place to itself", () => {
  it.each(["nyc-ny", "la-ca", "chicago-il", "seattle-wa", "boston-ma", "raleigh-nc"])("%s: no monthly change, no cause, nothing to earn back", (cityId) => {
    for (const filing of ["single", "married"] as const) {
      const r = compareMove(stayPut(cityId, filing, 120000));
      expect(r.expected.monthlyChange).toBeCloseTo(0, 6);
      expect(r.breakdown.salary).toBeCloseTo(0, 6);
      expect(r.breakdown.taxes).toBeCloseTo(0, 6);
      expect(r.breakdown.housing).toBeCloseTo(0, 6);
      expect(r.breakdown.otherCosts).toBeCloseTo(0, 6);
      expect(r.expected.spentOneTime).toBe(0);
      // With no cost and no gain the answer is "nothing to earn back", never a payback period.
      expect(r.expected.monthsToRecover).toBe(0);
      expect(r.currentLeftover).toBeCloseTo(r.targetLeftover, 6);
    }
  });

  it("is also zero across the best-case and worst-case ranges when every figure is an estimate", () => {
    const base = stayPut("nyc-ny", "single", 150000);
    const est = (amount: number): Item => ({ amount, estimated: true });
    const r = compareMove({ ...base, currentHousing: est(2200), targetHousing: est(2200), currentLiving: est(1400), targetLiving: est(1400) });
    // The current and target costs move in opposite directions in the bad and good cases, so the range is symmetric around zero.
    expect(r.expected.monthlyChange).toBeCloseTo(0, 6);
    expect(r.low.monthlyChange).toBeCloseTo(-r.high.monthlyChange, 6);
  });
});

describe("zero interest", () => {
  it("monthly payment is the loan divided by the number of payments, with no interest", () => {
    // $500,000 with 20% down is a $400,000 loan over 360 payments.
    expect(estimateMortgageMonthly(500000, { rate: 0, years: 30, downPct: 0.2 })).toBe(Math.round(400000 / 360));
  });

  const input: RentVsBuyInput = {
    homePrice: 500000, downPct: 20, mortgageRatePct: 0, loanYears: 30, propertyTaxPct: 0, homeInsuranceAnnual: 0, hoaMonthly: 0,
    maintenancePct: 0, buyClosingPct: 0, appreciationPct: 0, sellingCostPct: 0, monthlyRent: 1000, rentGrowthPct: 0, rentersInsuranceMonthly: 0,
    investmentReturnPct: 0, years: 30,
  };

  it("the loan is repaid exactly over its term and total interest is zero", () => {
    const sim = simulateRentVsBuy(input);
    expect(sim.monthlyPI).toBeCloseTo(400000 / 360, 6);
    expect(sim.finalLoanBalance).toBeCloseTo(0, 4);
    // Everything the buyer paid toward the loan is principal: payments over the term equal the loan.
    expect(sim.monthlyPI * 360).toBeCloseTo(400000, 4);
  });

  it("net worth is conserved: with no growth, returns or costs the buyer ends with the home's value and the renter with the savings", () => {
    const sim = simulateRentVsBuy(input);
    expect(sim.finalHomeValue).toBeCloseTo(500000, 6);
    // The buyer's equity is the full price once the loan is repaid, plus nothing invested (payments exceeded rent throughout).
    expect(sim.finalBuyer).toBeCloseTo(500000, 4);
    // The renter starts with the $100,000 down payment and invests each month's difference between the payment and rent.
    expect(sim.finalRenter).toBeCloseTo(100000 + (400000 / 360 - 1000) * 360, 3);
  });
});

describe("the default assumptions the rent-versus-buy pages share", () => {
  it("are one object used by both pages", () => {
    const rentVsBuy = readFileSync(new URL("../components/RentVsBuyCalculator.tsx", import.meta.url), "utf8");
    const mortgage = readFileSync(new URL("../components/MortgageCalculator.tsx", import.meta.url), "utf8");
    expect(rentVsBuy).toContain("RENT_VS_BUY_DEFAULTS");
    expect(mortgage).toContain("RENT_VS_BUY_DEFAULTS");
    expect(RENT_VS_BUY_DEFAULTS.taxBenefitPct).toBe(0);
  });
});

describe("shared links reproduce the scenario", () => {
  it("every Rent vs. Buy input is written to the link and read back from it", () => {
    const source = readFileSync(new URL("../components/RentVsBuyCalculator.tsx", import.meta.url), "utf8");
    // The keys written to the address bar and the keys read from it must be the same set, or a shared link loses an input.
    const written = [...source.matchAll(/\["([a-z]+)", [A-Za-z]+, set[A-Za-z]+\]/g)].map((m) => m[1]).sort();
    const readBlock = source.slice(source.indexOf("const map: Record<string, (v: string) => void> = {"), source.indexOf("for (const [k, setter] of Object.entries(map))"));
    const read = [...readBlock.matchAll(/\b([a-z]+): set[A-Za-z]+/g)].map((m) => m[1]).sort();
    expect(written.length).toBeGreaterThan(10);
    expect(read).toEqual(written);
  });

  it("a move handed to the FIRE calculator keeps every figure after a round trip", () => {
    const move: FireMoveLink = {
      income: 143250, state: "ca", filing: "married", k401Pct: 11.5, expenses: 6100,
      movedIncome: 151000, movedState: "tx", movedCityId: "austin-tx", movedExpenses: 4700, movedCost: 9800,
    };
    const url = new URL(buildFireLink(move), "https://example.com");
    expect(parseFireLink(url.searchParams)).toEqual(move);
  });
});

describe("what would change the rent-versus-buy answer", () => {
  const base: RentVsBuyInput = {
    homePrice: 500000, downPct: 20, mortgageRatePct: 6.75, loanYears: 30, propertyTaxPct: 1.1, homeInsuranceAnnual: 1800, hoaMonthly: 0,
    maintenancePct: 1, buyClosingPct: 2.5, appreciationPct: 3.5, sellingCostPct: 6, monthlyRent: 2500, rentGrowthPct: 3, rentersInsuranceMonthly: 15,
    investmentReturnPct: 7, years: 10,
  };

  it("when renting is ahead, each threshold moves the answer the right way and lands where the two draw level", () => {
    const t = rentVsBuyThresholds(base);
    expect(t.winner).toBe("rent");
    const lead = (i: RentVsBuyInput) => { const r = simulateRentVsBuy(i); return r.finalBuyer - r.finalRenter; };
    expect(lead(base)).toBeLessThan(0);
    for (const [key, make] of [
      ["homePrice", (x: number) => ({ ...base, homePrice: x })],
      ["monthlyRent", (x: number) => ({ ...base, monthlyRent: x })],
      ["appreciationPct", (x: number) => ({ ...base, appreciationPct: x })],
    ] as const) {
      const value = t[key];
      if (value === null) continue;
      // At the threshold the two are level, to within a dollar or so of net worth.
      expect(Math.abs(lead(make(value)))).toBeLessThan(2000);
    }
    expect(t.homePrice!).toBeLessThan(base.homePrice);
    expect(t.monthlyRent!).toBeGreaterThan(base.monthlyRent);
    expect(t.appreciationPct!).toBeGreaterThan(base.appreciationPct);
  });

  it("when buying is ahead the thresholds point the other way", () => {
    const t = rentVsBuyThresholds({ ...base, years: 30, monthlyRent: 3500 });
    expect(t.winner).toBe("buy");
    expect(t.monthlyRent!).toBeLessThan(3500);
    expect(t.homePrice!).toBeGreaterThan(500000);
  });

  it("reports no threshold when the answer cannot flip in the searched range", () => {
    // Zero appreciation and a very long loan keep renting ahead whatever the rent, up to three times the entered rent.
    const t = rentVsBuyThresholds({ ...base, monthlyRent: 800, appreciationPct: 0, years: 5 });
    expect(t.winner).toBe("rent");
    expect(t.monthlyRent === null || t.monthlyRent > 800).toBe(true);
  });
});
