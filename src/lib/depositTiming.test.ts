import { describe, expect, it } from "vitest";
import { monthlyDepositFactor } from "./depositTiming";

describe("monthlyDepositFactor", () => {
  it("is 1 with no return", () => {
    expect(monthlyDepositFactor(0)).toBe(1);
  });
  it("matches twelve end-of-month deposits at the equivalent monthly rate", () => {
    for (const r of [0.07, 0.12, -0.1, 0.03]) {
      const m = (1 + r) ** (1 / 12) - 1;
      let balance = 0;
      for (let month = 0; month < 12; month++) balance = balance * (1 + m) + 1000;
      expect(12000 * monthlyDepositFactor(r)).toBeCloseTo(balance, 6);
    }
  });
  it("reproduces the audit case: $1,000 a month at 12% for one year is $12,646.50", () => {
    expect(12000 * monthlyDepositFactor(0.12)).toBeCloseTo(12646.497908, 5);
  });
  it("is a little above 1 for a positive return and below 1 for a negative one", () => {
    expect(monthlyDepositFactor(0.07)).toBeGreaterThan(1);
    expect(monthlyDepositFactor(0.07)).toBeLessThan(1.07);
    expect(monthlyDepositFactor(-0.1)).toBeLessThan(1);
  });
});
