import { describe, expect, it } from "vitest";
import { retirementIncomePlan, spendingInOtherState } from "./retirementIncomePlan";
import { retireeIncomeTax } from "./retirementStateView";

const base = { portfolioIncomeAnnual: 25_162, socialSecurityAnnual: 24_000, pensionAnnual: 12_000, withdrawalRate: 0.04 };

describe("retirementIncomePlan", () => {
  it("adds the income sources and takes off the tax", () => {
    const p = retirementIncomePlan({ ...base, spendingTargetMonthly: 0, taxAnnual: 3_162 });
    expect(p.grossAnnual).toBe(61_162);
    expect(p.afterTaxAnnual).toBe(58_000);
    expect(p.afterTaxMonthly).toBeCloseTo(4_833.33, 2);
    expect(p.gapMonthly).toBeNull();
    expect(p.coverage).toBeNull();
    expect(p.extraSavingsNeeded).toBeNull();
  });

  it("a shortfall against the spending target, and the savings that would close it", () => {
    // 58,000 a year after tax is 4,833.33 a month against a 5,500 target: 666.67 short, 8,000 a year, 200,000 at 4%.
    const p = retirementIncomePlan({ ...base, spendingTargetMonthly: 5_500, taxAnnual: 3_162 });
    expect(p.gapMonthly).toBeCloseTo(-666.67, 2);
    expect(p.coverage).toBeCloseTo(0.8788, 4);
    expect(p.extraSavingsNeeded).toBeCloseTo(200_000, 2);
  });

  it("a surplus needs no extra savings", () => {
    const p = retirementIncomePlan({ ...base, spendingTargetMonthly: 4_000, taxAnnual: 3_162 });
    expect(p.gapMonthly).toBeCloseTo(833.33, 2);
    expect(p.extraSavingsNeeded).toBe(0);
  });

  it("without a tax estimate the income is shown before tax and says so with a null", () => {
    const p = retirementIncomePlan({ ...base, spendingTargetMonthly: 0, taxAnnual: null });
    expect(p.taxAnnual).toBeNull();
    expect(p.afterTaxAnnual).toBe(61_162);
  });
});

describe("spendingInOtherState", () => {
  it("scales by the price-level ratio", () => {
    // California 110.72 to Texas 97.057.
    expect(spendingInOtherState(5_000, 110.72, 97.057)).toBeCloseTo(4_382.99, 2);
  });

  it("is unchanged without price levels and zero without a target", () => {
    expect(spendingInOtherState(5_000, null, 97)).toBe(5_000);
    expect(spendingInOtherState(0, 110, 97)).toBe(0);
  });
});

describe("tax on a retirement income with Social Security and a pension (the engine the calculator calls)", () => {
  const profile = { filing: "single" as const, age: 67, socialSecurity: 24_000, pension: 12_000, withdrawals: 25_162 };

  it("hand-calculated federal tax in a state with no income tax", () => {
    // Other income 37,162. Provisional income 37,162 + 12,000 = 49,162.
    // Taxable Social Security: lesser of 85% of benefits (20,400) and 0.85 x (49,162 - 34,000) + lesser of 4,500 and half the benefits = 12,887.70 + 4,500 = 17,387.70.
    // AGI 54,549.70. Deductions 16,100 + 2,050 + 6,000 = 24,150. Taxable 30,399.70.
    // Tax 1,240 + 12% of (30,399.70 - 12,400) = 1,240 + 2,159.96 = 3,399.96.
    const t = retireeIncomeTax("tx", profile, 0, true)!;
    expect(t.state).toBe(0);
    expect(t.federal).toBeCloseTo(3_399.96, 1);
  });

  it("runs in every state for a single retiree and a couple", () => {
    for (const s of ["al", "ca", "co", "ct", "ga", "il", "mn", "mt", "nj", "ny", "or", "pa", "ut", "vt", "wv"] as const) {
      expect(retireeIncomeTax(s, profile, 0, true), s).not.toBeNull();
      expect(retireeIncomeTax(s, { ...profile, filing: "married", socialSecurity: 40_000 }, 0, true), `${s} married`).not.toBeNull();
    }
  });
});
