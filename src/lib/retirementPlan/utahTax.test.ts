import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { utahTax } from "./utahTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ut", stateTreatment: "verified-resident-location",
    utahContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Utah annual settlement", () => {
  it("applies the flat 4.45% rate directly to federal AGI, with no standard deduction and no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ut = estimateHouseholdTax(terms);
    expect(ut.stateTax).toBeCloseTo(80000 * .0445, 6);
    expect(ut.localTax).toBe(0);
  });

  it("credits Social Security in full when modified AGI is at or below the phase-out threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // federalAgi 50000 <= 54000 single cap: no phase-out. Credit = .0445*15000 = 667.5.
    const ut = utahTax(terms, 50000, 15000, 0);
    expect(ut.socialSecurityCredit).toBeCloseTo(667.5, 6);
    expect(ut.stateTax).toBeCloseTo(50000 * .0445 - 667.5, 6);
  });

  it("phases the Social Security credit down by 2.5 cents per dollar of modified AGI above the threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // federalAgi 80000: 26000 over the 54000 cap. Credit = .0445*15000 - .025*26000 = 667.5-650 = 17.5.
    const ut = utahTax(terms, 80000, 15000, 0);
    expect(ut.socialSecurityCredit).toBeCloseTo(17.5, 6);
  });

  it("eliminates the Social Security credit once the phase-out exceeds the calculated amount", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const ut = utahTax(terms, 200000, 15000, 0);
    expect(ut.socialSecurityCredit).toBe(0);
    expect(ut.stateTax).toBeCloseTo(200000 * .0445, 6);
  });

  it("fully offsets the tax on income that is entirely Social Security", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const ut = utahTax(terms, 15000, 15000, 0);
    expect(ut.stateTax).toBeCloseTo(0, 6);
  });

  it("requires explicit confirmation of the restricted Utah assumptions", () => {
    expect(() => utahTax(input({ utahContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => utahTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ut", utContract: "confirmed" };
    const ut = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ut.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ut.years[0].result.tax.localTax).toBe(0);
    expect(ut.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ut.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Utah confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ut" })).toThrow(/Confirm/);
  });
});
