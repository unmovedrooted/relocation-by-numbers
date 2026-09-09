import { describe, expect, it } from "vitest";
import { calculateIrmaa, irmaaMagi } from "./irmaa";
import { runRetirementTimeline, type TimelineInput } from "./timeline";

const projection = { kind: "project-2026-law", annualBracketGrowth: 0, annualPayrollCapGrowth: 0, statePolicy: "freeze-2025-proxy" } as const;
const quote = (magi: number, filing: "single" | "married" = "single") => calculateIrmaa({ premiumYear: 2026,
  income: { taxYear: 2024, filing, magi }, partBMonths: 12, partDMonths: 12, annualSurchargeGrowth: 0 });
describe("Medicare IRMAA", () => {
  it.each([[109000, 0, 0], [109000.01, 81.2, 14.5], [137000, 81.2, 14.5], [137000.01, 202.9, 37.5],
    [171000, 202.9, 37.5], [171000.01, 324.6, 60.4], [205000, 324.6, 60.4], [205000.01, 446.3, 83.3],
    [499999.99, 446.3, 83.3], [500000, 487, 91]])("single MAGI %i yields B %f and D %f", (magi, b, d) => {
      const result = quote(magi);
      expect(result.monthlyB).toBe(b); expect(result.monthlyD).toBe(d);
      expect(result.total).toBeCloseTo((b + d) * 12, 8);
    });
  it("uses joint thresholds with the distinct $750k top boundary", () => {
    expect(quote(218000, "married").total).toBe(0);
    expect(quote(250000, "married").total).toBeCloseTo(1148.4, 8);
    expect(quote(500000, "married").tier).toBe(4);
    expect(quote(750000, "married").tier).toBe(5);
  });
  it("adds only taxable AGI plus exempt interest, with no zero clamp", () => {
    expect(irmaaMagi(100000, 10000)).toBe(110000);
    expect(irmaaMagi(-5000, 1000)).toBe(-4000);
    expect(quote(-4000).total).toBe(0);
  });
  it("requires exact two-year income history and validated enrollment", () => {
    const base = { premiumYear: 2026, income: { taxYear: 2024, filing: "single" as const, magi: 120000 }, partBMonths: 12, partDMonths: 12, annualSurchargeGrowth: 0 };
    expect(() => calculateIrmaa({ ...base, income: { ...base.income, taxYear: 2025 } })).toThrow(/two years/);
    for (const months of [-1, .5, 13, NaN]) expect(() => calculateIrmaa({ ...base, partBMonths: months })).toThrow(/months/);
    expect(() => calculateIrmaa({ ...base, annualSurchargeGrowth: Infinity })).toThrow();
    expect(calculateIrmaa({ ...base, partBMonths: 6, partDMonths: 0 }).total).toBeCloseTo(487.2, 8);
  });
  it("indexes ordinary thresholds but freezes the top through 2027", () => {
    const calculate = (year: number) => calculateIrmaa({ premiumYear: year,
      income: { taxYear: year - 2, filing: "single", magi: 500000 }, projection: { ...projection, annualBracketGrowth: .03 },
      partBMonths: 12, partDMonths: 12, annualSurchargeGrowth: .05 });
    expect(calculate(2027).thresholds).toEqual([112000, 141000, 176000, 211000, 500000]);
    expect(calculate(2027).tier).toBe(5);
    expect(calculate(2028).thresholds.at(-1)).toBe(515000);
    expect(calculate(2028).tier).toBe(4);
    expect(calculate(2027).monthlyB).toBe(511.4);
    expect(calculate(2028).isProjection).toBe(true);
  });
});

function timeline(): TimelineInput {
  return { startYear: 2026, endYear: 2028, spendingAnnual: 20000, inflation: 0, taxProjection: projection,
    filing: "single", state: "fl", stateTreatment: "existing-2025-proxy", people: [{ id: "one", birthDate: "1960-01-01", blind: false,
      eligibleForSeniorDeduction: true, iraBasis: 0, iraAdditionalTaxExceptionAmount: 0, rothAdditionalTaxExceptionAmount: 0,
      roth: { firstContributionYear: null, regularContributionBasis: 0, conversions: [] } }],
    accounts: [{ id: "cash", ownerId: "one", kind: "cash", balance: 500000, annualReturn: 0, interestTreatment: "none" }],
    retirementDates: { one: "2020-01-01" }, income: [
      { id: "pension", ownerId: "one", kind: "pension", annualAmount: 140000, annualGrowth: 0, startDate: "2026-01-01", endDate: null },
      { id: "exempt", ownerId: "one", kind: "tax-exempt-interest", annualAmount: 10000, annualGrowth: 0, startDate: "2026-01-01", endDate: null }],
    contributions: [], contributionCapacities: [], withdrawalOrder: ["cash"], surplusAccountId: "cash",
    lossCarryover: { shortTerm: 0, longTerm: 0 }, timing: "calendar-day-proration-annual-growth",
    irmaa: { budgetTreatment: "surcharges-outside-spending", annualSurchargeGrowth: 0,
      historicalIncome: [{ taxYear: 2024, filing: "single", magi: 110000 }, { taxYear: 2025, filing: "single", magi: 0 }],
      enrollmentByYear: Object.fromEntries([2026, 2027, 2028].map(year => [year, [{ ownerId: "one", partBMonths: 12, partDMonths: 12 }]])) } };
}
describe("IRMAA timeline cash flow", () => {
  it("uses historical income then actual modeled MAGI after two years and reconciles cash", () => {
    const input = timeline(); const before = JSON.stringify(input);
    const result = runRetirementTimeline(input);
    expect(result.years.map(row => row.irmaaMagi)).toEqual([150000, 150000, 150000]);
    expect(result.years.map(row => row.irmaa[0].incomeYear)).toEqual([2024, 2025, 2026]);
    expect(result.years[0].irmaaSurcharges).toBeCloseTo(1148.4, 8);
    expect(result.years[1].irmaaSurcharges).toBe(0);
    expect(result.years[2].irmaaSurcharges).toBeCloseTo(2884.8, 8);
    for (const row of result.years) {
      expect(row.spending).toBe(row.baseSpending + row.irmaaSurcharges);
      expect(row.reconciliationResidual).toBeCloseTo(0, 6);
    }
    expect(JSON.stringify(input)).toBe(before);
  });
  it("charges each enrolled spouse rather than one household premium", () => {
    const input = timeline();
    const result = runRetirementTimeline({ ...input, endYear: 2026, filing: "married", people: [...input.people, { ...input.people[0], id: "two" }],
      retirementDates: { one: "2020-01-01", two: "2020-01-01" }, irmaa: { ...input.irmaa!,
        historicalIncome: [{ taxYear: 2024, filing: "married", magi: 250000 }],
        enrollmentByYear: { 2026: [{ ownerId: "one", partBMonths: 12, partDMonths: 12 }, { ownerId: "two", partBMonths: 12, partDMonths: 12 }] } } });
    expect(result.years[0].irmaaSurcharges).toBeCloseTo(2296.8, 8);
  });
  it("does not guess missing income or infer Medicare enrollment from age", () => {
    const input = timeline();
    expect(() => runRetirementTimeline({ ...input, irmaa: { ...input.irmaa!, historicalIncome: [] } })).toThrow(/Missing 2024 MAGI/);
    expect(runRetirementTimeline({ ...input, irmaa: undefined }).years.every(row => row.irmaaSurcharges === 0)).toBe(true);
    expect(runRetirementTimeline({ ...input, irmaa: { ...input.irmaa!, historicalIncome: [], enrollmentByYear: {} } }).years.every(row => row.irmaaSurcharges === 0)).toBe(true);
  });
  it("includes Roth conversion income in the IRMAA lookback, not the conversion year bill", () => {
    const input = timeline();
    const result = runRetirementTimeline({ ...input, income: [], accounts: [...input.accounts,
      { id: "ira", ownerId: "one", kind: "traditional-ira", balance: 200000, annualReturn: 0, rmd: { table: "uniform", priorDecemberBalance: 200000 } },
      { id: "roth", ownerId: "one", kind: "roth-ira", balance: 0, annualReturn: 0 }],
      conversionsByYear: { 2026: [{ sourceId: "ira", destinationId: "roth", amount: 150000 }] } });
    expect(result.years[0].irmaaMagi).toBe(150000);
    expect(result.years[0].irmaaSurcharges).toBeCloseTo(1148.4, 8);
    expect(result.years[2].irmaaSurcharges).toBeCloseTo(2884.8, 8);
  });
  it("rejects duplicate enrollment and unknown historical filing types", () => {
    const input = timeline();
    expect(() => runRetirementTimeline({ ...input, irmaa: { ...input.irmaa!, enrollmentByYear: { 2026: [
      { ownerId: "one", partBMonths: 12, partDMonths: 12 }, { ownerId: "one", partBMonths: 12, partDMonths: 12 }] } } })).toThrow(/duplicate owner/);
    expect(() => runRetirementTimeline({ ...input, irmaa: { ...input.irmaa!, historicalIncome: [
      ...input.irmaa!.historicalIncome, input.irmaa!.historicalIncome[0]] } })).toThrow(/unique/);
  });
  it("uses the actual IRA deduction in the later IRMAA assessment", () => {
    const input = timeline();
    const common: TimelineInput = { ...input, income: [{ id: "wages", ownerId: "one", kind: "wages", annualAmount: 115000,
      annualGrowth: 0, startDate: "2026-01-01", endDate: null }], retirementDates: { one: "2027-01-01" },
      accounts: [...input.accounts, { id: "ira", ownerId: "one", kind: "traditional-ira", balance: 0, annualReturn: 0,
        rmd: { table: "uniform", priorDecemberBalance: 0 } }],
      contributions: [{ id: "saving", accountId: "ira", annualAmount: 8600, annualGrowth: 0, startDate: "2026-01-01", endDate: null,
        taxTreatment: "after-tax", eligibility: "externally-validated" }],
      iraPoliciesByYear: { 2026: [{ ownerId: "one", traditionalAccountId: "ira", coveredByWorkplacePlan: false,
        spouseCoveredByWorkplacePlan: false, deductionChoice: "deduct-eligible", allocation: "traditional-first" }] } };
    const deductible = runRetirementTimeline(common);
    const nondeductible = runRetirementTimeline({ ...common, iraPoliciesByYear: { 2026: [
      { ...common.iraPoliciesByYear![2026][0], deductionChoice: "nondeductible" }] } });
    expect(deductible.years[0].irmaaMagi).toBe(106400);
    expect(nondeductible.years[0].irmaaMagi).toBe(115000);
    expect(deductible.years[2].irmaaSurcharges).toBe(0);
    expect(nondeductible.years[2].irmaaSurcharges).toBeCloseTo(1148.4, 8);
    for (const result of [deductible, nondeductible]) expect(result.years.every(row => Math.abs(row.reconciliationResidual) < 1e-6)).toBe(true);
  });
  it("uses lookback filing status and charges only the selected parts/months", () => {
    const input = timeline();
    const result = runRetirementTimeline({ ...input, endYear: 2026, irmaa: { ...input.irmaa!,
      historicalIncome: [{ taxYear: 2024, filing: "married", magi: 150000 }],
      enrollmentByYear: { 2026: [{ ownerId: "one", partBMonths: 6, partDMonths: 0 }] } } });
    expect(result.years[0].irmaaSurcharges).toBe(0);
    expect(result.years[0].irmaa[0].filing).toBe("married");
  });
});
