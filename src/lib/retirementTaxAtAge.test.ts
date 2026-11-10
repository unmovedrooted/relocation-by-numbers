import { describe, expect, it } from "vitest";
import { AGE_AWARE_FROM, withdrawalIncomeTax, withdrawalIncomeTaxAtAge } from "./retirementTax";
import { STATES } from "./states";

describe("withdrawalIncomeTaxAtAge", () => {
  it("hand-calculated federal tax at 65: $25,162 withdrawal, single", () => {
    // Deductions 16,100 + 2,050 (age 65) + 6,000 (senior) = 24,150. Taxable 1,012 at 10% = 101.20.
    const t = withdrawalIncomeTaxAtAge(25_162, "tx", "single", "traditional", 65);
    expect(t.ageAware).toBe(true);
    expect(t.federal).toBeCloseTo(101.2, 2);
    expect(t.state).toBe(0);
  });

  it("is lower than the under-65 estimate at 65, because of the age deductions", () => {
    const aged = withdrawalIncomeTaxAtAge(60_000, "tx", "single", "traditional", 67);
    const simple = withdrawalIncomeTax(60_000, "tx", "single", "traditional");
    // Under 65: 60,000 - 16,100 = 43,900 taxable. At 67: 60,000 - 16,100 - 2,050 - 6,000 = 35,850 taxable. Both in the 12% bracket above 12,400.
    expect(simple.federal).toBeCloseTo(1_240 + (43_900 - 12_400) * 0.12, 2);
    expect(aged.federal).toBeCloseTo(1_240 + (35_850 - 12_400) * 0.12, 2);
  });

  it("uses the same federal tax as the simple estimate between 60 and 64 (no age deductions yet)", () => {
    const at62 = withdrawalIncomeTaxAtAge(60_000, "tx", "single", "traditional", 62);
    expect(at62.ageAware).toBe(true);
    expect(at62.federal).toBeCloseTo(withdrawalIncomeTax(60_000, "tx", "single", "traditional").federal, 2);
  });

  it("falls back to the simple estimate under the age-aware age or without an age", () => {
    for (const age of [AGE_AWARE_FROM - 1, 45, Number.NaN]) {
      const t = withdrawalIncomeTaxAtAge(60_000, "ca", "single", "traditional", age);
      expect(t.ageAware).toBe(false);
      expect(t.total).toBe(withdrawalIncomeTax(60_000, "ca", "single", "traditional").total);
    }
  });

  it("Roth withdrawals and empty amounts are untaxed", () => {
    expect(withdrawalIncomeTaxAtAge(50_000, "ca", "single", "roth", 70).total).toBe(0);
    expect(withdrawalIncomeTaxAtAge(0, "ca", "single", "traditional", 70).total).toBe(0);
  });

  it("runs age-aware in every state and never falls as the withdrawal rises", () => {
    for (const { code } of STATES) {
      for (const filing of ["single", "married"] as const) {
        let prev = -1;
        for (const gross of [20_000, 40_000, 80_000, 160_000]) {
          const t = withdrawalIncomeTaxAtAge(gross, code, filing, "traditional", 70);
          expect(t.ageAware, `${code} ${filing} ${gross}`).toBe(true);
          expect(t.total + 1, `${code} ${filing} ${gross} monotone`).toBeGreaterThanOrEqual(prev);
          prev = t.total;
        }
      }
    }
  });
});
