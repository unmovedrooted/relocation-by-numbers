import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { idahoTax } from "./idahoTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "id", stateTreatment: "verified-resident-location",
    idahoContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Idaho annual settlement", () => {
  it("applies the flat 5.3% rate above the 0%-taxed threshold, net of the federal standard deduction", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const id = estimateHouseholdTax(terms);
    const taxable = 60000 - 16100;
    expect(id.stateTax).toBeCloseTo(Math.max(0, taxable - 4811) * 0.053, 6);
    expect(id.localTax).toBe(0);
  });

  it("uses the doubled married 0%-taxed threshold and federal standard deduction", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 90000 }] });
    const id = estimateHouseholdTax(terms);
    const taxable = 90000 - 32200;
    expect(id.stateTax).toBeCloseTo(Math.max(0, taxable - 9622) * 0.053, 6);
  });

  it("excludes Social Security and Railroad Retirement benefits", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = idahoTax(terms, 60000, 0, 16100);
    const withSs = idahoTax(terms, 78000, 18000, 16100);
    expect(withSs.idAgi).toBe(withoutSs.idAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("excludes federal-government pension income for an owner 65 or older, reduced by gross Social Security", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "federal-government" },
        { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const id = idahoTax(terms, 50000, 18000, 16100);
    expect(id.retirementDeduction).toBe(48216 - 20000);
  });

  it("does not extend the retirement benefits deduction to an owner under 65", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "federal-government" }] });
    const id = idahoTax(terms, 30000, 0, 16100);
    expect(id.retirementDeduction).toBe(0);
  });

  it("does not extend the retirement benefits deduction to a private or unspecified pension", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "private" }] });
    const id = idahoTax(terms, 30000, 0, 16100);
    expect(id.retirementDeduction).toBe(0);
  });

  it("requires explicit confirmation of the restricted Idaho assumptions", () => {
    expect(() => idahoTax(input({ idahoContract: undefined }), 0, 0, 16100)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => idahoTax(input({ year: 2025 }), 0, 0, 16100)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "id", idContract: "confirmed" };
    const id = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(id.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(id.years[0].result.tax.localTax).toBe(0);
    expect(id.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(id.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Idaho confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "id" })).toThrow(/Confirm/);
  });
});
