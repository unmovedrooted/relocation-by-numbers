import { describe, expect, it } from "vitest";
import { compareMove, householdNetAnnual, RANGE_SPREAD, type Item, type MoveInputs } from "./relocationMove";

const entered = (amount: number): Item => ({ amount, estimated: false });
const est = (amount: number): Item => ({ amount, estimated: true });
const zero = entered(0);

// Texas has no state income tax and no local wage tax, so a Texas-to-Texas move isolates the arithmetic.
const base: MoveInputs = {
  filing: "single",
  k401Pct1: 0,
  k401Pct2: 0,
  currentIncome1: 80000,
  currentIncome2: 0,
  offerIncome1: 80000,
  offerIncome2: 0,
  currentState: "tx",
  currentCityId: "austin-tx",
  targetState: "tx",
  targetCityId: "dallas-tx",
  currentHousing: entered(1800),
  targetHousing: entered(1500),
  currentLiving: entered(1200),
  targetLiving: entered(1100),
  oneTime: { movers: entered(2000), travel: entered(500), setup: entered(1000), leaseBreak: entered(1800), fees: entered(200), overlapMonths: 1, refundableDeposit: entered(1500) },
};

describe("compareMove", () => {
  it("with the same pay and tax location, the change is the housing and other-cost savings", () => {
    const r = compareMove(base);
    // housing 1800 -> 1500 saves 300; other costs 1200 -> 1100 saves 100
    expect(r.breakdown.salary).toBeCloseTo(0, 6);
    expect(r.breakdown.taxes).toBeCloseTo(0, 6);
    expect(r.breakdown.housing).toBe(300);
    expect(r.breakdown.otherCosts).toBe(100);
    expect(r.expected.monthlyChange).toBeCloseTo(400, 6);
  });

  it("adds up one-time costs by hand: spent excludes the refundable deposit, cash includes it", () => {
    const r = compareMove(base);
    // 2000 + 500 + 1000 + 1800 + 200 + one month overlap at the new 1500 = 7000
    expect(r.expected.spentOneTime).toBe(7000);
    expect(r.expected.cashUpfront).toBe(8500);
    // first year: 400 x 12 - 7000 = -2200
    expect(r.expected.firstYearImpact).toBeCloseTo(-2200, 6);
    // 7000 / 400 = 17.5 -> 18 months
    expect(r.expected.monthsToRecover).toBe(18);
  });

  it("counts a down payment as cash needed but not as a cost", () => {
    const r = compareMove({ ...base, oneTime: { ...base.oneTime, downPayment: entered(60000) } });
    expect(r.expected.spentOneTime).toBe(7000);
    expect(r.expected.cashUpfront).toBe(68500);
    expect(r.expected.firstYearImpact).toBeCloseTo(-2200, 6);
  });

  it("separates salary, tax and cost causes and they sum to the monthly change", () => {
    const r = compareMove({
      ...base,
      currentIncome1: 70000,
      offerIncome1: 100000,
      currentState: "ca",
      currentCityId: "la-ca",
      targetHousing: entered(2600),
    });
    const sum = r.breakdown.salary + r.breakdown.taxes + r.breakdown.housing + r.breakdown.otherCosts;
    expect(sum).toBeCloseTo(r.expected.monthlyChange, 6);
    expect(r.breakdown.salary).toBeGreaterThan(0);
    // California taxes the offered pay more than Texas does
    expect(r.breakdown.taxes).toBeGreaterThan(0);
    expect(r.breakdown.housing).toBe(-800);
  });

  it("matches the wage-tax engine for the pay and tax parts", () => {
    const r = compareMove({ ...base, currentIncome1: 70000, offerIncome1: 90000 });
    const expectedSalary = (householdNetAnnual(90000, 0, "tx", "single", 0, 0, "austin-tx") - householdNetAnnual(70000, 0, "tx", "single", 0, 0, "austin-tx")) / 12;
    expect(r.breakdown.salary).toBeCloseTo(expectedSalary, 6);
    expect(expectedSalary).toBeGreaterThan(1000);
  });

  it("reports no recovery when the monthly change is not positive", () => {
    const r = compareMove({ ...base, targetHousing: entered(2500) });
    expect(r.expected.monthlyChange).toBeLessThan(0);
    expect(r.expected.monthsToRecover).toBeNull();
  });

  it("gives no range when every figure was entered", () => {
    const r = compareMove(base);
    expect(r.low.monthlyChange).toBeCloseTo(r.high.monthlyChange, 6);
    expect(r.low.firstYearImpact).toBeCloseTo(r.high.firstYearImpact, 6);
    expect(r.estimatedItems).toEqual([]);
  });

  it("widens the range only for estimated figures, by the stated spreads, and orders low below high", () => {
    const r = compareMove({ ...base, targetHousing: est(1500), targetLiving: est(1100) });
    const housingSwing = 1500 * RANGE_SPREAD.housing;
    const livingSwing = 1100 * RANGE_SPREAD.living;
    expect(r.expected.monthlyChange).toBeCloseTo(400, 6);
    expect(r.low.monthlyChange).toBeCloseTo(400 - housingSwing - livingSwing, 6);
    expect(r.high.monthlyChange).toBeCloseTo(400 + housingSwing + livingSwing, 6);
    expect(r.low.firstYearImpact).toBeLessThan(r.expected.firstYearImpact);
    expect(r.expected.firstYearImpact).toBeLessThan(r.high.firstYearImpact);
    expect(r.estimatedItems).toEqual(["targetHousing", "targetLiving"]);
  });

  it("treats estimated current costs the opposite way in the bad case", () => {
    const r = compareMove({ ...base, currentHousing: est(1800) });
    // bad case: the current rent was really 10% lower, so moving saves less
    expect(r.low.monthlyChange).toBeCloseTo(400 - 1800 * RANGE_SPREAD.housing, 6);
    expect(r.high.monthlyChange).toBeCloseTo(400 + 1800 * RANGE_SPREAD.housing, 6);
  });

  it("reports leftover cash before and after", () => {
    const r = compareMove(base);
    expect(r.targetLeftover - r.currentLeftover).toBeCloseTo(400, 6);
    expect(r.currentLeftover).toBeCloseTo(r.currentNetMonthly - 3000, 6);
  });

  it("caps each spouse's 401(k) separately", () => {
    // 20% and 50% of $300,000 are both above the IRS limit for each spouse, so both deferrals equal the limit
    const at20 = householdNetAnnual(300000, 300000, "tx", "married", 20, 20, "austin-tx");
    const at50 = householdNetAnnual(300000, 300000, "tx", "married", 50, 50, "austin-tx");
    expect(at50).toBeCloseTo(at20, 6);
    const none = householdNetAnnual(300000, 300000, "tx", "married", 0, 0, "austin-tx");
    expect(none).toBeGreaterThan(at20);
  });
});
