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
    // AGI 20000 <= 30000: full $15,000 exemption. Taxable = 5000. Initial tax = 100.
    // Table E (single, CT AGI 19,800-20,300): credit .60 -> tax = 100*(1-.60) = 40.
    expect(ct.stateTax).toBeCloseTo(40, 6);
    expect(ct.localTax).toBe(0);
  });

  it("steps the single personal exemption down by $1,000 per $1,000 of AGI above $30,000", () => {
    const ct = connecticutTax(input(), 35000, 0, 0, 0);
    // AGI 35000: exemption row upTo 35000 -> $10,000. Taxable = 25000.
    // Initial tax = 10000*2% + 15000*4.5% = 200 + 675 = 875. Table E (33,300-60,000): credit .10 -> 787.50.
    expect(ct.personalExemption).toBe(10000);
    expect(ct.stateTax).toBeCloseTo(787.5, 6);
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
    // Initial tax = 20000*2% + 18000*4.5% = 400 + 810 = 1210. Table E (married 52,000-96,000): credit .10 -> 1089.
    expect(ct.personalExemption).toBe(17000);
    expect(ct.stateTax).toBeCloseTo(1089, 6);
  });

  it("fully excludes Social Security benefits when federal AGI is at or below the single threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const ct = connecticutTax(terms, 50000, 15000, 0, 0);
    expect(ct.socialSecuritySubtraction).toBe(15000);
    // Connecticut AGI = 50000-15000 = 35000 (the tables test Connecticut AGI): exemption $10,000, taxable 25000.
    // Initial tax 875; Table E (33,300-60,000) credit .10 -> 787.50.
    expect(ct.connecticutAgi).toBe(35000);
    expect(ct.stateTax).toBeCloseTo(787.5, 6);
  });

  it("applies the worksheet's 25%-of-lesser partial exclusion once federal AGI exceeds the single threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // Line10 approx = 90000-17000+0 = 73000. Included = min(17000, .25*min(20000,73000)) = min(17000,5000) = 5000.
    const ct = connecticutTax(terms, 90000, 17000, 0, 0);
    expect(ct.socialSecuritySubtraction).toBeCloseTo(12000, 6);
    // Connecticut AGI = 78000, no exemption. Initial tax = 200+1800+1540 = 3540; Table C (single 76,500-81,500) adds $125; no credit.
    expect(ct.phaseOutAddBack).toBe(125);
    expect(ct.stateTax).toBeCloseTo(3665, 6);
  });

  it("phases out the pension and 401(k)/IRA/annuity subtraction by federal AGI", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000 }] });
    // AGI 78000 falls in the 77500-79999 band: fraction .70. Subtraction = 30000*.70 = 21000.
    const ct = connecticutTax(terms, 78000, 0, 0, 0);
    expect(ct.pensionSubtraction).toBeCloseTo(21000, 6);
    // Connecticut AGI = 78000-21000 = 57000 (exemption fully phased out). Initial tax = 200+1800+385 = 2385.
    // Table C (56,500-61,500) adds $25 -> 2410; Table E (33,300-60,000) credit .10 -> 2169.
    expect(ct.stateTax).toBeCloseTo(2169, 6);
  });

  it("combines entered pension income with the modeled 401(k)/IRA/annuity distribution figure for the phase-out", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 10000 }],
      retirementIncome: [{ ownerId: "one", source: "traditional-ira", date: "2026-07-01", amount: 20000 }] });
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

  it("keeps taxable Roth IRA distributions out of the subtraction but allows IRA, conversion and annuity income at 100%", () => {
    const terms = input({ retirementIncome: [
      { ownerId: "one", source: "traditional-ira", date: "2026-07-01", amount: 10000 },
      { ownerId: "one", source: "ira-conversion", date: "2026-07-01", amount: 5000 },
      { ownerId: "one", source: "annuity", date: "2026-07-01", amount: 3000 },
      { ownerId: "one", source: "roth-ira", date: "2026-07-01", amount: 4000 }] });
    expect(connecticutTax(terms, 50000, 0, 0, 22000).pensionSubtraction).toBe(18000);
  });

  it("fails closed when owner-level retirement records do not reconcile", () => {
    expect(() => connecticutTax(input(), 50000, 0, 0, 20000)).toThrow(/reconciled/);
  });

  it("reproduces the Table C 2% add-back, Table D recapture and Table E credit from the 2025 return instructions", () => {
    const married = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const addBack = (terms: HouseholdTaxInput, agi: number) => connecticutTax(terms, agi, 0, 0, 0).phaseOutAddBack;
    const recapture = (terms: HouseholdTaxInput, agi: number) => connecticutTax(terms, agi, 0, 0, 0).recapture;
    const credit = (terms: HouseholdTaxInput, agi: number) => {
      const ct = connecticutTax(terms, agi, 0, 0, 0);
      return ct.personalCredit / (ct.stateTax + ct.personalCredit);
    };
    // Table C: single and married boundaries and plateaus.
    expect([56500, 56501, 71500, 76501, 101500, 101501, 500000].map(agi => addBack(input(), agi))).toEqual([0, 25, 75, 125, 225, 250, 250]);
    expect([100500, 100501, 125500, 145500, 145501].map(agi => addBack(married, agi))).toEqual([0, 50, 250, 450, 500]);
    // Table D: single (105,000 / 150,000-200,000 / 345,000-500,000 / 540,000+) and married (210,000 / 300,000-400,000 / 690,000-1,000,000 / 1,080,000+).
    expect([105000, 105001, 145001, 200000, 200001, 240001, 345000, 345001, 500000, 500001, 540000, 540001].map(agi => recapture(input(), agi)))
      .toEqual([0, 25, 225, 250, 340, 1060, 2860, 2950, 2950, 3000, 3350, 3400]);
    expect([210000, 210001, 300000, 400000, 400001, 690000, 690001, 1000000, 1000001, 1080000, 1080001].map(agi => recapture(married, agi)))
      .toEqual([0, 50, 450, 500, 680, 5720, 5900, 5900, 6000, 6700, 6800]);
    // Table E: single decimal amounts for the four printed regions and the zero cutoff, and a married sample.
    expect([18800, 18801, 22300, 22301, 26500, 26501, 33300, 33301, 60000, 60001, 64500, 64501].map(agi => credit(input(), agi)))
      .toEqual([.75, .70, .40, .35, .20, .15, .11, .10, .10, .09, .01, 0].map(value => expect.closeTo(value, 9)));
    expect([30000, 30001, 41500, 41501, 100500, 100501].map(agi => credit(married, agi)))
      .toEqual([.75, .70, .20, .15, .01, 0].map(value => expect.closeTo(value, 9)));
  });

  it("matches the printed worked totals for high incomes (initial tax plus Table C and Table D, no credit)", () => {
    // Single, CT AGI 525,000: initial tax 32,997.50 (the form rounds this example to $32,998) + Table C 250 + Table D 3,200
    // (the 520,000-525,000 row includes 525,000) = 36,447.50.
    expect(connecticutTax(input(), 525000, 0, 0, 0).stateTax).toBeCloseTo(36447.5, 6);
    // Married, CT AGI 1,100,000: initial tax 69,490 (form example) + Table C 500 + Table D 6,800 = 76,790.
    const married = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    expect(connecticutTax(married, 1100000, 0, 0, 0).stateTax).toBeCloseTo(76790, 6);
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
