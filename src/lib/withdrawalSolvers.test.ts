import { describe, expect, it } from "vitest";
import { withdrawalPaths } from "./monteCarlo";
import { grossForAfterTax, solveWithdrawalForSuccess } from "./withdrawalSolvers";
import { withdrawalIncomeTax } from "./retirementTax";

describe("withdrawal for a target success rate", () => {
  const base = { startBalance: 1_000_000, horizon: 30, realReturn: 0.03, volatility: 0.13 };

  it("lands on the boundary: the answer meets the target and a little more withdrawal does not", () => {
    const solved = solveWithdrawalForSuccess({ ...base, target: 0.9 });
    expect(solved.successRate).toBeGreaterThanOrEqual(0.9);
    const above = solveWithdrawalForSuccess({ ...base, target: 0.9 });
    expect(above.withdrawal).toBe(solved.withdrawal);
    const sim = withdrawalPaths({ startBalance: base.startBalance, annualWithdrawal: solved.withdrawal * 1.02, realReturn: base.realReturn, volatility: base.volatility, maxYears: 30 });
    expect(sim.successRateAt(30)).toBeLessThan(0.9);
  });

  it("agrees with the calculator's own simulation at the solved withdrawal", () => {
    const solved = solveWithdrawalForSuccess({ ...base, target: 0.8 });
    const sim = withdrawalPaths({ startBalance: base.startBalance, annualWithdrawal: solved.withdrawal, realReturn: base.realReturn, volatility: base.volatility, maxYears: 30 });
    expect(sim.successRateAt(30)).toBeCloseTo(solved.successRate, 10);
  });

  it("asks for less withdrawal at a higher confidence level", () => {
    const w80 = solveWithdrawalForSuccess({ ...base, target: 0.8 }).withdrawal;
    const w90 = solveWithdrawalForSuccess({ ...base, target: 0.9 }).withdrawal;
    const w95 = solveWithdrawalForSuccess({ ...base, target: 0.95 }).withdrawal;
    expect(w80).toBeGreaterThan(w90);
    expect(w90).toBeGreaterThan(w95);
  });

  it("with no volatility it is the closed-form level withdrawal that exhausts the balance over the horizon", () => {
    const r = 0.03;
    const n = 30;
    let annuityFactor = 0;
    for (let k = 0; k < n; k++) annuityFactor += (1 + r) ** -k;
    const closedForm = 1_000_000 / annuityFactor;
    const solved = solveWithdrawalForSuccess({ startBalance: 1_000_000, horizon: n, realReturn: r, volatility: 0, target: 0.9 });
    expect(solved.withdrawal).toBeCloseTo(closedForm, 0);
  });

  it("returns zero for an empty portfolio", () => {
    expect(solveWithdrawalForSuccess({ ...base, startBalance: 0, target: 0.9 })).toEqual({ withdrawal: 0, successRate: 1 });
  });
});

describe("gross withdrawal for an after-tax spending target", () => {
  it("returns the target itself when nothing is taxed (a Roth account)", () => {
    expect(grossForAfterTax(60000, () => 0)).toBeCloseTo(60000, 4);
  });

  it("grosses up so that the gross less the income tax equals the target", () => {
    const taxOn = (g: number) => withdrawalIncomeTax(g, "ca", "single", "traditional").total;
    const gross = grossForAfterTax(60000, taxOn);
    expect(gross - taxOn(gross)).toBeCloseTo(60000, 1);
    expect(gross).toBeGreaterThan(60000);
  });

  it("needs a larger gross in a state that taxes retirement income than in one that does not", () => {
    const ca = grossForAfterTax(80000, (g) => withdrawalIncomeTax(g, "ca", "single", "traditional").total);
    const fl = grossForAfterTax(80000, (g) => withdrawalIncomeTax(g, "fl", "single", "traditional").total);
    expect(ca).toBeGreaterThan(fl);
  });
});

import { buildPlanHandoff } from "./withdrawalHandoff";
import { decodeScenario } from "./retirementPlan/shareState";

describe("handoff to the Complete Retirement Plan", () => {
  const base = { filing: "single" as const, age: 65, balance: 1_000_000, roth: false, returnPct: 6, inflationPct: 3, afterTaxSpending: 52000, horizonYears: 30 };

  it.each([["fl"], ["tx"], ["nv"]])("fills in the scenario for %s, a state with no retirement-tax confirmation to make", (state) => {
    for (const filing of ["single", "married"] as const) {
      const link = buildPlanHandoff({ ...base, state, filing });
      expect(link.prefilled).toBe(true);
      const scenario = decodeScenario(link.href.slice(link.href.indexOf("#")))!;
      expect(scenario.values.spending).toBe("52000");
      expect(scenario.values.state).toBe(state);
      expect(scenario.values.household).toBe(filing);
      expect(JSON.stringify(scenario.accounts)).toContain("1000000");
    }
  });

  it("leaves a Roth IRA for the visitor to enter, because the planner needs its first contribution year", () => {
    expect(buildPlanHandoff({ ...base, state: "fl", roth: true })).toEqual({ href: "/complete-retirement-plan", prefilled: false });
  });

  it("never confirms a restricted-assumption state for the visitor: it opens the planner empty instead", () => {
    const link = buildPlanHandoff({ ...base, state: "ca" });
    expect(link).toEqual({ href: "/complete-retirement-plan", prefilled: false });
  });
});
