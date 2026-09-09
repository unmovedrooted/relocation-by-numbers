import { describe, expect, it } from "vitest";
import { calculateEmployerMatch, planEmployeeContribution, type PlanContributionInput } from "./contributionPlanning";

// Explicit hypothetical plan, not inferred eligibility or future law.
const plan = (changes: Partial<PlanContributionInput> = {}): PlanContributionInput => ({
  eligibleCompensation: 100000, compensationCap: 360000, requestedEmployee: 6000,
  regularEmployeeCapacity: 24500, catchUpCapacity: 0, otherAnnualAdditions: 0,
  annualAdditionsLimit: 72000,
  tiers: [{ throughCompensationFraction: .06, employerPerEmployeeDollar: .5 }],
  assumptions: { eligibility: "externally-validated", matching: "annual-true-up", vesting: "fully-vested", employerTaxTreatment: "traditional-pretax" },
  ...changes,
});

describe("annual contribution and employer match planning", () => {
  it("matches 50% of funded deferrals up to 6% of compensation", () => {
    expect(calculateEmployerMatch(plan(), 6000)).toMatchObject({ employerMatch: 3000, newPlanDeposits: 9000, annualAdditions: 9000 });
  });
  it("matches actual funded contributions, never the larger request", () => {
    expect(calculateEmployerMatch(plan(), 2000).employerMatch).toBe(1000);
    expect(calculateEmployerMatch(plan(), 0).employerMatch).toBe(0);
  });
  it("uses marginal tiers, not overlapping percentages", () => {
    const p = plan({ tiers: [{ throughCompensationFraction: .03, employerPerEmployeeDollar: 1 }, { throughCompensationFraction: .05, employerPerEmployeeDollar: .5 }] });
    expect(calculateEmployerMatch(p, 6000).employerMatch).toBe(4000);
    expect(calculateEmployerMatch(p, 4000).employerMatch).toBe(3500);
  });
  it("caps eligible compensation without scaling funded deferrals twice", () => {
    expect(calculateEmployerMatch(plan({ eligibleCompensation: 500000, requestedEmployee: 24500 }), 24500).employerMatch).toBe(10800);
  });
  it("uses already-prorated compensation without another retirement proration", () => {
    expect(calculateEmployerMatch(plan({ eligibleCompensation: 50000 }), 6000).employerMatch).toBe(1500);
  });
  it("caps combined employee and employer additions", () => {
    const p = plan({ otherAnnualAdditions: 65000 });
    expect(calculateEmployerMatch(p, 6000)).toMatchObject({ formulaMatch: 3000, employerMatch: 1000, annualAdditions: 72000 });
  });
  it("excludes verified catch-up from annual additions but permits matching it", () => {
    const p = plan({ requestedEmployee: 32500, catchUpCapacity: 8000, otherAnnualAdditions: 45000, tiers: [{ throughCompensationFraction: 1, employerPerEmployeeDollar: .5 }] });
    expect(calculateEmployerMatch(p, 32500)).toMatchObject({ regularEmployee: 24500, catchUpEmployee: 8000, employerMatch: 2500, annualAdditions: 72000, newPlanDeposits: 35000 });
  });
  it("honors remaining owner capacity and limits additions by compensation", () => {
    expect(planEmployeeContribution(plan({ regularEmployeeCapacity: 1000 })).eligibleEmployee).toBe(1000);
    expect(calculateEmployerMatch(plan({ eligibleCompensation: 4000 }), 4000).employerMatch).toBe(0);
  });
  it("handles no income, no match, and exact unrounded decimals", () => {
    expect(calculateEmployerMatch(plan({ eligibleCompensation: 0 }), 0).newPlanDeposits).toBe(0);
    expect(calculateEmployerMatch(plan({ tiers: [] }), 1234.567).employerMatch).toBe(0);
    expect(calculateEmployerMatch(plan(), 1234.567).employerMatch).toBe(617.2835);
  });
  it.each([-1, NaN, Infinity, 1e13, undefined])("rejects invalid amounts %s", value => {
    expect(() => planEmployeeContribution(plan({ eligibleCompensation: value as number }))).toThrow();
  });
  it("rejects overfunding and pre-existing excess additions", () => {
    const missing: { -readonly [K in keyof PlanContributionInput]?: PlanContributionInput[K] } = { ...plan() };
    delete missing.requestedEmployee;
    expect(() => planEmployeeContribution(missing as PlanContributionInput)).toThrow(/requestedEmployee/);
    expect(() => calculateEmployerMatch(plan(), 6001)).toThrow(/exceeds/);
    expect(() => planEmployeeContribution(plan({ otherAnnualAdditions: 72001 }))).toThrow(/already exceed/);
  });
  it("rejects ambiguous tiers and unsupported plan contracts", () => {
    expect(() => planEmployeeContribution(plan({ tiers: [{ throughCompensationFraction: .05, employerPerEmployeeDollar: 1 }, { throughCompensationFraction: .03, employerPerEmployeeDollar: .5 }] }))).toThrow(/tiers/);
    expect(() => planEmployeeContribution(plan({ assumptions: { ...plan().assumptions, vesting: "graded" } as never }))).toThrow(/full vesting/);
  });
  it("preserves inputs and satisfies bounded monotone match invariants", () => {
    const p = plan(); const original = JSON.stringify(p); let previous = 0;
    for (let funded = 0; funded <= 6000; funded += 37.5) {
      const r = calculateEmployerMatch(p, funded);
      expect(r.employerMatch).toBeGreaterThanOrEqual(previous);
      expect(r.employerMatch).toBeLessThanOrEqual(r.formulaMatch);
      expect(r.annualAdditions).toBeLessThanOrEqual(r.additionsLimit);
      expect(r.regularEmployee + r.catchUpEmployee).toBe(funded);
      expect(r.newPlanDeposits).toBe(funded + r.employerMatch);
      previous = r.employerMatch;
    }
    expect(JSON.stringify(p)).toBe(original);
  });
});
