import { describe, expect, it } from "vitest";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";
import { nominalReturnDraw, simulateHousehold, type HouseholdSimulationRequest } from "./monteCarlo";
import { initialMedicareEditor } from "./previewMedicare";
import { initialAccountEditor, newAccountDraft } from "./previewAccounts";
import { initialContributionEditor } from "./previewContributions";

const request: HouseholdSimulationRequest = { paths: 5, seed: 42,
  volatilityByAccount: { "one-ira": .13 }, returnModel: "lognormal-shared-market-nominal", conversionPolicy: "fixed-input-schedule" };
function scenario() { return buildPreviewInput({ ...PREVIEW_DEFAULTS, endYear: "2028" }); }

describe("household Monte Carlo foundation", () => {
  it("calibrates the lognormal draw and preserves zero volatility exactly", () => {
    expect(nominalReturnDraw(.05, 0, -4)).toBe(.05);
    // M=1, S=1 gives sigma²=ln(2); z=0 gives 1/sqrt(2)-1.
    expect(nominalReturnDraw(0, 1, 0)).toBeCloseTo(1 / Math.sqrt(2) - 1, 14);
    expect(nominalReturnDraw(.05, .13, -10)).toBeGreaterThan(-1);
    expect(() => nominalReturnDraw(.05, .13, 100)).toThrow(/range/);
  });
  it.each([NaN, Infinity, -1, 11])("rejects invalid expected return %s", mean => {
    expect(() => nominalReturnDraw(mean, .13, 0)).toThrow();
  });
  it("reconciles zero-volatility paths to the full NY household engine including RMDs", () => {
    const input = buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ny", cityId: "nyc-ny", nyContract: "confirmed",
      "one-pensionType": "private", endYear: "2042" });
    const baseline = runRetirementTimeline(input);
    const result = simulateHousehold(input, { ...request, volatilityByAccount: { "one-ira": 0 } });
    expect(result.successRate).toBe(baseline.allYearsFunded && baseline.allRmdsSatisfied ? 1 : 0);
    result.byYear.forEach((row, index) => {
      expect(row.nominal).toEqual({ p10: baseline.years[index].endingPortfolio, p50: baseline.years[index].endingPortfolio, p90: baseline.years[index].endingPortfolio });
      expect(row.todayDollars.p50).toBe(baseline.years[index].endingPortfolioInStartYearDollars);
    });
  });
  it("is reproducible, changes with the seed, does not mutate inputs, and reports progress", () => {
    const input = scenario(), before = structuredClone(input), progress: number[] = [];
    const first = simulateHousehold(input, request, n => progress.push(n));
    expect(simulateHousehold(input, request)).toEqual(first);
    expect(simulateHousehold(input, { ...request, seed: 43 }).byYear).not.toEqual(first.byYear);
    expect(input).toEqual(before);
    expect(progress).toEqual([1, 2, 3, 4, 5]);
    first.byYear.forEach(row => {
      expect(row.nominal.p10).toBeGreaterThanOrEqual(0);
      expect(row.nominal.p10).toBeLessThanOrEqual(row.nominal.p50);
      expect(row.nominal.p50).toBeLessThanOrEqual(row.nominal.p90);
      expect(Number.isFinite(row.nominal.p90)).toBe(true);
    });
  });
  it("keeps cash fixed and counts shortfalls even if later income recovers", () => {
    const base = scenario();
    const input = { ...base, accounts: base.accounts.filter(a => a.kind === "cash").map(a => ({ ...a, balance: 0 })),
      withdrawalOrder: ["cash"], income: base.income.filter(i => i.kind === "wages").map(i => ({ ...i, startDate: "2027-01-01", annualAmount: 100000 })) };
    const result = simulateHousehold(input, { ...request, volatilityByAccount: {} });
    expect(result.successRate).toBe(0);
    expect(result.firstFailures).toEqual({ 2026: 5 });
    expect(result.byYear[2].nominal.p50).toBeGreaterThan(0);
  });
  it("supports both owners without independent-account diversification", () => {
    const input = buildPreviewInput({ ...PREVIEW_DEFAULTS, household: "married", endYear: "2026" });
    expect(simulateHousehold(input, { ...request, volatilityByAccount: { "one-ira": .13, "two-ira": .13 } }).paths).toBe(5);
  });
  it("reconciles contribution and match settlement at zero volatility", () => {
    const accounts = initialAccountEditor();
    accounts.accounts = [newAccountDraft("plan", "401k")];
    const saving = initialContributionEditor();
    saving.amounts.plan = "6000.1250";
    saving.owners.one = { verified: true, employeeLimit: "24500", additionsLimit: "72000", compensationCap: "360000",
      matchEnabled: true, matchRate: "50", matchThrough: "6", destination: "plan" };
    const input = buildPreviewInput({ ...PREVIEW_DEFAULTS, endYear: "2027", "one-salary": "100000" }, accounts, saving);
    const baseline = runRetirementTimeline(input);
    expect(baseline.years[0].result.employerContributions).toBeGreaterThan(0);
    const result = simulateHousehold(input, { ...request, volatilityByAccount: { plan: 0 } });
    expect(result.byYear.map(row => row.nominal.p50)).toEqual(baseline.years.map(row => row.endingPortfolio));
  });
  it("retains IRMAA enrollment and two-year history inside every timeline", () => {
    const medicare = initialMedicareEditor();
    medicare.enabled = true; medicare.confirmed = true; medicare.surchargeGrowth = "0";
    medicare.owners.one = { partB: true, partD: true, partBStart: "2026-01", partDStart: "2026-01" };
    medicare.history = { 2024: { magi: "150000", filing: "single" }, 2025: { magi: "0", filing: "single" } };
    const input = buildPreviewInput({ ...PREVIEW_DEFAULTS, endYear: "2028" }, undefined, undefined, medicare);
    const baseline = runRetirementTimeline(input);
    expect(baseline.years[0].irmaaSurcharges).toBeGreaterThan(0);
    expect(baseline.years[2].irmaa[0].magi).toBe(baseline.years[0].irmaaMagi);
    expect(simulateHousehold(input, { ...request, volatilityByAccount: { "one-ira": 0 } }).byYear.map(row => row.nominal.p50))
      .toEqual(baseline.years.map(row => row.endingPortfolio));
  });
  it("does not discard unsupported input errors or silently select missing policies", () => {
    expect(() => simulateHousehold({ ...scenario(), state: "ca" }, request)).toThrow();
    expect(() => simulateHousehold(scenario(), { ...request, seed: -1 })).toThrow();
    expect(() => simulateHousehold(scenario(), { ...request, conversionPolicy: undefined } as unknown as HouseholdSimulationRequest)).toThrow(/policies/);
  });
  it.each([0, -1, 1.5, 1001, NaN])("rejects path count %s", paths => {
    expect(() => simulateHousehold(scenario(), { ...request, paths })).toThrow();
  });
  it("rejects missing, unknown, cash and invalid volatility assumptions", () => {
    for (const volatilityByAccount of [{}, { other: .1 }, { "one-ira": .1, cash: .1 }, { "one-ira": -1 }, { "one-ira": NaN }]) {
      expect(() => simulateHousehold(scenario(), { ...request, volatilityByAccount })).toThrow();
    }
  });
  it("validates complete return paths and applies them to the correct years", () => {
    const base = scenario();
    const input = { ...base, spendingAnnual: 0, income: [], accounts: base.accounts.filter(a => a.kind === "cash").map(a => ({ ...a, balance: 100, interestTreatment: "taxable" as const })),
      withdrawalOrder: ["cash"] };
    // Surplus cash must stay zero-return; use the existing IRA for variable returns instead.
    const iraInput = { ...base, spendingAnnual: 0, income: [], accounts: base.accounts.map(a => ({ ...a, balance: a.kind === "cash" ? 0 : 100 })) };
    const annualReturnsByYear = { 2026: { cash: 0, "one-ira": .1 }, 2027: { cash: 0, "one-ira": -.5 }, 2028: { cash: 0, "one-ira": 0 } };
    expect(runRetirementTimeline({ ...iraInput, annualReturnsByYear }).years.map(y => y.endingPortfolio)).toEqual([110, 55, 55]);
    expect(() => runRetirementTimeline({ ...input, annualReturnsByYear: {} })).toThrow(/every year/);
    expect(() => runRetirementTimeline({ ...base, annualReturnsByYear: { ...annualReturnsByYear, 2027: { cash: 0 } } })).toThrow(/every account/);
    expect(() => simulateHousehold({ ...base, annualReturnsByYear }, request)).toThrow(/existing return path/);
  });
});
