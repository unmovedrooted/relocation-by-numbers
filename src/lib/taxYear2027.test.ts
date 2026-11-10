import { describe, expect, it } from "vitest";
import { CONTRIBUTION_LIMITS_2026, FEDERAL_2026, FOREIGN_EARNED_INCOME_EXCLUSION_2026, PAYROLL_2026 } from "./taxYear2026";
import { CONTRIBUTION_LIMITS_2027, FEDERAL_2027, FOREIGN_EARNED_INCOME_EXCLUSION_2027, PAYROLL_2027, federalIncomeTax2027 } from "./taxYear2027";

const FILINGS = ["single", "married"] as const;

describe("2027 federal figures (IRS Rev. Proc. 2026-35)", () => {
  it("the brackets reproduce the tax the IRS prints at the start of each bracket", () => {
    for (const filing of FILINGS) {
      const brackets = FEDERAL_2027.brackets[filing];
      const base = FEDERAL_2027.baseTax[filing];
      expect(base).toHaveLength(brackets.length);
      let floor = 0;
      brackets.forEach((b, i) => {
        expect(federalIncomeTax2027(filing, floor), `${filing} bracket ${i} starting at ${floor}`).toBeCloseTo(base[i], 2);
        floor = b.upTo;
      });
    }
  });

  it("has the seven statutory rates in order", () => {
    for (const filing of FILINGS) expect(FEDERAL_2027.brackets[filing].map((b) => b.rate)).toEqual([0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37]);
  });

  it("standard deductions, additional amounts and capital gains thresholds as published", () => {
    expect(FEDERAL_2027.standardDeduction).toEqual({ single: 16_600, married: 33_200 });
    expect(FEDERAL_2027.additionalStandardDeduction).toEqual({ single: 2_100, married: 1_700 });
    expect(FEDERAL_2027.capitalGains.single).toEqual({ zeroRateUpTo: 51_050, fifteenRateUpTo: 563_200 });
    expect(FEDERAL_2027.capitalGains.married).toEqual({ zeroRateUpTo: 102_100, fifteenRateUpTo: 633_600 });
    expect(FOREIGN_EARNED_INCOME_EXCLUSION_2027).toBe(137_300);
  });

  it("every indexed amount is higher than its 2026 amount", () => {
    for (const filing of FILINGS) {
      expect(FEDERAL_2027.standardDeduction[filing]).toBeGreaterThan(FEDERAL_2026.standardDeduction[filing]);
      FEDERAL_2027.brackets[filing].slice(0, -1).forEach((b, i) => {
        expect(b.upTo, `${filing} bracket ${i}`).toBeGreaterThan(FEDERAL_2026.brackets[filing][i].upTo);
      });
    }
    expect(FOREIGN_EARNED_INCOME_EXCLUSION_2027).toBeGreaterThan(FOREIGN_EARNED_INCOME_EXCLUSION_2026);
  });

  it("hand-calculated: single, $100,000 of wages, standard deduction", () => {
    // Taxable 100,000 - 16,600 = 83,400. Tax 5,987 at 52,025, plus 22% of 31,375 = 6,902.50. Total 12,889.50.
    const taxable = 100_000 - FEDERAL_2027.standardDeduction.single;
    expect(taxable).toBe(83_400);
    expect(federalIncomeTax2027("single", taxable)).toBeCloseTo(12_889.5, 2);
  });

  it("hand-calculated: married filing jointly, $200,000 of wages, standard deduction", () => {
    // Taxable 200,000 - 33,200 = 166,800. Tax 11,974 at 104,050, plus 22% of 62,750 = 13,805. Total 25,779.
    expect(federalIncomeTax2027("married", 200_000 - FEDERAL_2027.standardDeduction.married)).toBeCloseTo(25_779, 2);
  });
});

describe("2027 payroll figures (Social Security Administration)", () => {
  it("wage base and the maximum employee contribution SSA states", () => {
    expect(PAYROLL_2027.socialSecurityWageBase).toBe(192_300);
    // SSA: "an individual with wages equal to or larger than $192,300 would contribute $11,922.60".
    expect(PAYROLL_2027.socialSecurityWageBase * PAYROLL_2027.socialSecurityRate).toBeCloseTo(11_922.6, 2);
    expect(PAYROLL_2027.socialSecurityWageBase).toBeGreaterThan(PAYROLL_2026.socialSecurityWageBase);
  });

  it("statutory rates and thresholds are unchanged", () => {
    expect(PAYROLL_2027.socialSecurityRate).toBe(PAYROLL_2026.socialSecurityRate);
    expect(PAYROLL_2027.medicareRate).toBe(PAYROLL_2026.medicareRate);
    expect(PAYROLL_2027.additionalMedicareRate).toBe(PAYROLL_2026.additionalMedicareRate);
    expect(PAYROLL_2027.additionalMedicareThreshold).toEqual(PAYROLL_2026.additionalMedicareThreshold);
  });
});

describe("2027 contribution limits", () => {
  it("HSA and high-deductible plan amounts (IRS Rev. Proc. 2026-24)", () => {
    expect(CONTRIBUTION_LIMITS_2027.hsa).toEqual({ self: 4_500, family: 9_000, catchUp55: 1_000 });
    expect(CONTRIBUTION_LIMITS_2027.hdhpMinDeductible).toEqual({ self: 1_750, family: 3_500 });
    expect(CONTRIBUTION_LIMITS_2027.hdhpMaxOutOfPocket).toEqual({ self: 8_700, family: 17_400 });
    expect(CONTRIBUTION_LIMITS_2027.hsa.self).toBeGreaterThan(CONTRIBUTION_LIMITS_2026.hsa.self);
    expect(CONTRIBUTION_LIMITS_2027.hsa.family).toBeGreaterThan(CONTRIBUTION_LIMITS_2026.hsa.family);
  });

  it("401(k) and IRA limits are left empty until the IRS publishes its 2027 notice", () => {
    // When the notice is out, enter the figures from the notice itself in taxYear2027.ts and replace this test with the published values.
    expect(CONTRIBUTION_LIMITS_2027.retirementPlans).toBeNull();
  });
});
