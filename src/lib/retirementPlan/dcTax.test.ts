import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { dcTax } from "./dcTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "dc", stateTreatment: "verified-resident-location",
    dcContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted DC annual settlement", () => {
  it("computes the exact 2026 bracket tax on wages, with no local tax", () => {
    // Taxable = 80000 - 16100 = 63900. Tax: 10000*.04 + 30000*.06 + 20000*.065 + 3900*.085
    // = 400 + 1800 + 1300 + 331.5 = 3831.5.
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const dc = estimateHouseholdTax(terms);
    expect(dc.stateTax).toBeCloseTo(3831.5, 6);
    expect(dc.localTax).toBe(0);
  });

  it("uses the married standard deduction and shared bracket schedule", () => {
    // Taxable = 200000 - 32200 = 167800. Tax: 10000*.04 + 30000*.06 + 20000*.065 + 107800*.085
    // = 400 + 1800 + 1300 + 9163 = 12663.
    const terms = input({ filing: "married", people: [...input().people, { ...input().people[0], id: "two" }],
      income: [{ ownerId: "one", kind: "wages", amount: 200000 }] });
    expect(dcTax(terms, 200000, 0).stateTax).toBeCloseTo(12663, 6);
  });

  it("fully excludes Social Security from DC AGI", () => {
    const withSS = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }, { ownerId: "one", kind: "social-security", amount: 30000 }] });
    const dc = estimateHouseholdTax(withSS);
    expect(dc.taxableBenefits).toBeGreaterThan(0); // federally taxable, per the shared federal engine.
    expect(dc.stateTax).toBeCloseTo(3831.5, 6); // unchanged from the no-SS case: SS never enters DC AGI.
  });

  it("grants the additional standard deduction for an owner 65 or older by year end", () => {
    // Standard deduction = 16100 + 2050 (single) = 18150. Taxable = 80000-18150 = 61850.
    // Tax: 10000*.04 + 30000*.06 + 20000*.065 + 1850*.085 = 400+1800+1300+157.25 = 3657.25.
    const terms = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }], // turns 66 in 2026.
      income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    expect(dcTax(terms, 80000, 0).stateTax).toBeCloseTo(3657.25, 6);
  });

  it("grants the additional standard deduction for a blind owner", () => {
    // Standard deduction = 16100 + 2050 (single) = 18150. Taxable = 100000-18150 = 81850.
    // Tax: 10000*.04 + 30000*.06 + 20000*.065 + 21850*.085 = 400+1800+1300+1857.25 = 5357.25.
    const terms = input({ people: [{ ...input().people[0], blind: true }], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    expect(dcTax(terms, 100000, 0).stateTax).toBeCloseTo(5357.25, 6);
  });

  it("stacks the $1,650 married aged/blind box for each spouse", () => {
    // Standard deduction = 32200 + 1650*2 = 35500. Taxable = 150000-35500 = 114500.
    // Tax: 10000*.04 + 30000*.06 + 20000*.065 + 54500*.085 = 400+1800+1300+4632.5 = 8132.5.
    const terms = input({ filing: "married", people: [{ ...input().people[0], id: "one", birthDate: "1960-01-01" },
      { ...input().people[0], id: "two", birthDate: "1958-01-01" }], income: [{ ownerId: "one", kind: "wages", amount: 150000 }] });
    expect(dcTax(terms, 150000, 0).stateTax).toBeCloseTo(8132.5, 6);
  });

  it("does not apply the expired $3,000 pension exclusion: pension income is fully taxable", () => {
    // No exclusion: dcAgi equals federal AGI. Taxable = 50000-16100 = 33900.
    // Tax: 10000*.04 + 23900*.06 = 400+1434 = 1834.
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 50000 }] });
    const dc = dcTax(terms, 50000, 0);
    expect(dc.dcAgi).toBe(50000);
    expect(dc.stateTax).toBeCloseTo(1834, 6);
  });

  it("always returns zero local tax, regardless of cityId", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    expect(dcTax({ ...terms, cityId: "washington-dc" }, 80000, 0).localTax).toBe(0);
    expect(dcTax({ ...terms, cityId: "" }, 80000, 0).localTax).toBe(0);
  });

  it("requires explicit confirmation of the restricted DC assumptions", () => {
    expect(() => dcTax(input({ dcContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => dcTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "dc", dcContract: "confirmed" };
    const dc = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(dc.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(dc.years[0].result.tax.localTax).toBe(0);
    expect(dc.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(dc.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit DC confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "dc" })).toThrow(/Confirm/);
  });
});
