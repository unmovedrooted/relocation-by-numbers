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
