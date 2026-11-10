import { describe, expect, it } from "vitest";
import { STATES } from "./states";
import { DEFAULT_PROFILE, MATERIAL, retirementTaxByState, stateRetirementTax, treatment } from "./retirementStateView";

// States whose rules can tax Social Security (Connecticut research service 2026-R-0106, recorded in
// src/lib/retirementPlan/STATE_SOCIAL_SECURITY_COVERAGE.md).
const SS_CAN_BE_TAXED = new Set(["co", "ct", "mn", "mt", "nm", "ri", "ut", "vt"]);
// These states exempt Social Security itself, but it still changes the tax through another rule, read from each module:
// Maine and Maryland cut their pension exclusion by the Social Security received (maineTax.ts, marylandTax.ts),
// South Carolina's income-adjusted deduction phases out on federal AGI, which includes taxable benefits, West Virginia's
// exclusion is tied to AGI, and Arizona's senior deduction follows the federal one, which depends on AGI.
const SS_REDUCES_OTHER_DEDUCTION = new Set(["me", "md", "sc", "wv", "az"]);
const NO_INCOME_TAX = ["ak", "fl", "nv", "nh", "sd", "tn", "tx", "wy"];

describe("retirement state view", () => {
  const rows = retirementTaxByState(DEFAULT_PROFILE);

  it("calculates every state without error", () => {
    expect(rows).toHaveLength(STATES.length);
    expect(rows.filter((r) => r.error).map((r) => `${r.state}: ${r.error}`)).toEqual([]);
  });

  it("charges nothing in states with no income tax", () => {
    for (const code of NO_INCOME_TAX) {
      const r = stateRetirementTax(code as never);
      expect(r.stateTax, code).toBe(0);
    }
  });

  it("adds Social Security tax only in states whose rules can tax it or that tie another deduction to it", () => {
    for (const r of rows) {
      if (!SS_CAN_BE_TAXED.has(r.state) && !SS_REDUCES_OTHER_DEDUCTION.has(r.state)) expect(r.added.socialSecurity, r.state).toBeLessThan(MATERIAL);
    }
  });

  it("shows Maine's Social Security interaction", () => {
    expect(stateRetirementTax("me").added.socialSecurity).toBeGreaterThan(MATERIAL);
  });

  it("exempts retirement income in Pennsylvania and Illinois at 59 and a half or older", () => {
    for (const code of ["pa", "il"] as const) {
      const r = stateRetirementTax(code);
      expect(r.stateTax, code).toBe(0);
    }
  });

  it("taxes 401(k) withdrawals in California and North Carolina but not Social Security", () => {
    for (const code of ["ca", "nc"] as const) {
      const r = stateRetirementTax(code);
      expect(treatment(r, DEFAULT_PROFILE, "withdrawals"), code).toBe("adds-tax");
      expect(treatment(r, DEFAULT_PROFILE, "socialSecurity"), code).toBe("adds-none");
    }
  });

  it("reports a source with no income as none", () => {
    const p = { ...DEFAULT_PROFILE, pension: 0 };
    expect(treatment(stateRetirementTax("ca", p), p, "pension")).toBe("none");
  });

  it("sorts lowest tax first", () => {
    for (let i = 1; i < rows.length; i++) expect(rows[i].stateTax).toBeGreaterThanOrEqual(rows[i - 1].stateTax);
  });

  it("works for a married couple", () => {
    const p = { ...DEFAULT_PROFILE, filing: "married" as const };
    const r = stateRetirementTax("ca", p);
    expect(r.error).toBeUndefined();
    expect(r.stateTax).toBeLessThan(stateRetirementTax("ca", DEFAULT_PROFILE).stateTax * 2);
  });
});

describe("retireeIncomeTax (age-aware federal and state tax for the RMD calculator)", () => {
  const rmd = { filing: "single" as const, age: 73, socialSecurity: 0, pension: 0, withdrawals: 18_868 };

  it("an $18,868 RMD as the only income owes no federal tax at 73: standard deduction, age-65 amount and senior deduction exceed it", async () => {
    const { retireeIncomeTax } = await import("./retirementStateView");
    // 16,100 + 2,050 + 6,000 = 24,150 of deductions against 18,868 of income.
    expect(retireeIncomeTax("tx", rmd, 0, true)).toEqual({ federal: 0, state: 0, total: 0 });
  });

  it("hand-calculated: the same RMD on top of $60,000 of other taxable income, Texas", async () => {
    const { retireeIncomeTax } = await import("./retirementStateView");
    // With the RMD: 78,868 - 16,100 - 2,050 - (6,000 - 6% of 3,868 = 5,767.92) = 54,950.08 taxable.
    // Without it: 60,000 - 16,100 - 2,050 - 6,000 = 35,850 taxable.
    // Added tax: 12% of (50,400 - 35,850) + 22% of (54,950.08 - 50,400) = 1,746 + 1,001.02 = 2,747.02.
    const withRmd = retireeIncomeTax("tx", rmd, 60_000, true)!;
    const without = retireeIncomeTax("tx", { ...rmd, withdrawals: 0 }, 60_000, true)!;
    expect(withRmd.federal - without.federal).toBeCloseTo(2_747.02, 2);
    expect(withRmd.state).toBe(0);
  });

  it("runs in every state, single and married, with and without other income", async () => {
    const { retireeIncomeTax } = await import("./retirementStateView");
    const { STATES } = await import("./states");
    for (const { code } of STATES) {
      for (const other of [0, 30_000]) {
        expect(retireeIncomeTax(code, rmd, other, true), `${code} single other=${other}`).not.toBeNull();
        expect(retireeIncomeTax(code, { filing: "married", age: 80, socialSecurity: 0, pension: 0, withdrawals: 45_000 }, other, true), `${code} married other=${other}`).not.toBeNull();
      }
    }
  });

  it("states that exempt IRA withdrawals at this age add no state tax, and Oregon does tax them", async () => {
    const { retireeIncomeTax } = await import("./retirementStateView");
    for (const s of ["il", "pa", "ms", "tx", "fl"] as const) expect(retireeIncomeTax(s, rmd, 0, true)!.state, s).toBe(0);
    expect(retireeIncomeTax("or", rmd, 0, true)!.state).toBeGreaterThan(0);
  });
});
