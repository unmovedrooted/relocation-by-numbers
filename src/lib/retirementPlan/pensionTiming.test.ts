import { describe, expect, it } from "vitest";
import { pensionEligibilityDate } from "./pensionEligibilityDate";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";
import { newYorkTax } from "./newYorkTax";
import { taxCharacter } from "./accountTax";
import type { HouseholdTaxInput } from "./householdTax";

function terms(allocation: number): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ny", cityId: "nyc-ny",
    stateTreatment: "verified-resident-location", newYorkContract: "enacted-law-precredit",
    people: [{ id: "one", birthDate: "1967-01-01", blind: false, eligibleForSeniorDeduction: false }],
    income: [{ ownerId: "one", kind: "pension", pensionType: "private", amount: 36500, pensionAfter59Half: allocation }],
    accountIncome: taxCharacter(), retirementIncome: [], lossCarryover: { shortTerm: 0, longTerm: 0 } };
}

describe("New York pension birthday-year allocation", () => {
  it.each([["1966-07-01", "2026-01-01"], ["1966-07-02", "2026-01-02"],
    ["1967-01-01", "2026-07-01"], ["1966-08-31", "2026-02-28"]])("dates %s at %s", (birth, expected) => {
    expect(pensionEligibilityDate(birth)).toBe(expected);
  });
  it("rejects invalid birth dates", () => {
    expect(() => pensionEligibilityDate("1967-02-30")).toThrow();
  });
  it.each([NaN, Infinity, -1, 36501])("rejects invalid allocation %s", allocation => {
    expect(() => newYorkTax(terms(allocation), 36500, 0)).toThrow(/allocation/);
  });
  it("excludes only eligible pension and shares the cap with conversions", () => {
    expect(newYorkTax(terms(18400), 36500, 0).pensionExclusion).toBe(18400);
    expect(newYorkTax({ ...terms(18400), accountIncome: taxCharacter({ retirementOrdinary: 10000 }),
      retirementIncome: [{ ownerId: "one", source: "ira-conversion", date: "2026-12-31", amount: 10000 }] }, 46500, 0).pensionExclusion).toBe(20000);
  });
  it.each([
    [2026, "1967-01-01", "2026-01-01", null, 36500, 18400],
    [2026, "1967-01-01", "2026-10-01", null, 9200, 9200],
    [2026, "1967-01-01", "2026-01-01", "2026-07-01", 18100, 0],
    [2028, "1968-09-01", "2028-01-01", null, 36600, 30600],
  ] as const)("prorates %s pension starting %s/%s through %s", (year, birth, start, end, total, eligible) => {
    const base = buildPreviewInput({ ...PREVIEW_DEFAULTS, startYear: String(year), endYear: String(year),
      state: "ny", cityId: "nyc-ny", nyContract: "confirmed", spending: "0", cash: "100000",
      "one-birth": birth, "one-salary": "0", "one-ira": "0", "one-pensionType": "private",
      "one-pension": year === 2028 ? "36600" : "36500", "one-pensionStart": start });
    const input = { ...base, income: base.income.map(item => item.kind === "pension" ? { ...item, endDate: end } : item) };
    const ny = runRetirementTimeline(input).years[0];
    const fl = runRetirementTimeline({ ...input, state: "fl", cityId: "" }).years[0];
    const pension = ny.income.find(item => item.kind === "pension")!;
    expect(pension.amount).toBeCloseTo(total, 8);
    expect(pension.pensionAfter59Half).toBeCloseTo(eligible, 8);
    expect(ny.result.tax.regularFederal).toBe(fl.result.tax.regularFederal);
    expect(Math.abs(ny.reconciliationResidual)).toBeLessThan(1e-5);
  });
});
