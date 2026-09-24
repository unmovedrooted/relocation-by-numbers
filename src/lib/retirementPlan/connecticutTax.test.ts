import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { connecticutTax } from "./connecticutTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ct", stateTreatment: "verified-resident-location",
    connecticutContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Connecticut annual settlement", () => {
  it("applies the graduated single brackets to federal AGI net of the step-down personal exemption, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 20000 }] });
    const ct = estimateHouseholdTax(terms);
    // AGI 20000 <= 30000: full $15,000 exemption. Taxable = 5000. Tax = 5000*2% = 100.
    expect(ct.stateTax).toBeCloseTo(100, 6);
    expect(ct.localTax).toBe(0);
  });

  it("steps the single personal exemption down by $1,000 per $1,000 of AGI above $30,000", () => {
    const ct = connecticutTax(input(), 35000, 0, 0, 0);
    // AGI 35000: exemption row upTo 35000 -> $10,000. Taxable = 25000.
    // Tax = 10000*2% + 15000*4.5% = 200 + 675 = 875.
    expect(ct.personalExemption).toBe(10000);
    expect(ct.stateTax).toBeCloseTo(875, 6);
  });

  it("eliminates the single personal exemption above $44,000 AGI", () => {
    const ct = connecticutTax(input(), 44000, 0, 0, 0);
    expect(ct.personalExemption).toBe(1000);
    const ctAbove = connecticutTax(input(), 44001, 0, 0, 0);
    expect(ctAbove.personalExemption).toBe(0);
  });

  it("doubles the exemption steps and bracket thresholds for married filing jointly", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const ct = connecticutTax(terms, 55000, 0, 0, 0);
    // AGI 55000: married exemption row upTo 55000 -> $17,000. Taxable = 38000.
    // Tax = 20000*2% + 18000*4.5% = 400 + 810 = 1210.
    expect(ct.personalExemption).toBe(17000);
    expect(ct.stateTax).toBeCloseTo(1210, 6);
  });

  it("fully excludes Social Security benefits when federal AGI is at or below the single threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const ct = connecticutTax(terms, 50000, 15000, 0, 0);
    expect(ct.socialSecuritySubtraction).toBe(15000);
    // AGI 50000 > 44000: exemption fully phased out. Taxable = 50000-15000 = 35000.
    expect(ct.stateTax).toBeCloseTo(1325, 6);
  });

  it("applies the worksheet's 25%-of-lesser partial exclusion once federal AGI exceeds the single threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // Line10 approx = 90000-17000+0 = 73000. Included = min(17000, .25*min(20000,73000)) = min(17000,5000) = 5000.
    const ct = connecticutTax(terms, 90000, 17000, 0, 0);
    expect(ct.socialSecuritySubtraction).toBeCloseTo(12000, 6);
    // Taxable = 90000-12000 = 78000. Tax = 10000*2%+40000*4.5%+28000*5.5% = 200+1800+1540 = 3540.
    expect(ct.stateTax).toBeCloseTo(3540, 6);
  });

  it("phases out the pension and 401(k)/IRA/annuity subtraction by federal AGI", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000 }] });
    // AGI 78000 falls in the 77500-79999 band: fraction .70. Subtraction = 30000*.70 = 21000.
    const ct = connecticutTax(terms, 78000, 0, 0, 0);
    expect(ct.pensionSubtraction).toBeCloseTo(21000, 6);
    // Taxable = 78000-21000 = 57000 (exemption fully phased out). Tax = 200+1800+7000*5.5%=385 -> 2385.
    expect(ct.stateTax).toBeCloseTo(2385, 6);
  });

  it("combines entered pension income with the modeled 401(k)/IRA/annuity distribution figure for the phase-out", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 10000 }] });
    const ct = connecticutTax(terms, 50000, 0, 0, 20000);
    // AGI 50000 < 74999: fraction 1. Subtraction = (10000+20000)*1 = 30000.
    expect(ct.pensionSubtraction).toBe(30000);
  });

  it("eliminates the pension subtraction at or above $100,000 single AGI", () => {
    const ct = connecticutTax(input({ income: [{ ownerId: "one", kind: "pension", amount: 10000 }] }), 100000, 0, 0, 0);
    expect(ct.pensionSubtraction).toBe(0);
  });

  it("uses the married pension phase-out bands, twice as wide as single", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "pension", amount: 10000 }] });
    const ct = connecticutTax(terms, 99999, 0, 0, 0);
    expect(ct.pensionSubtraction).toBe(10000);
    const ctPhased = connecticutTax(terms, 150000, 0, 0, 0);
    expect(ctPhased.pensionSubtraction).toBe(0);
  });

  it("requires explicit confirmation of the restricted Connecticut assumptions", () => {
    expect(() => connecticutTax(input({ connecticutContract: undefined }), 0, 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => connecticutTax(input({ year: 2025 }), 0, 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ct", ctContract: "confirmed" };
    const ct = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ct.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ct.years[0].result.tax.localTax).toBe(0);
    expect(ct.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ct.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Connecticut confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ct" })).toThrow(/Confirm/);
  });
});
