import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { missouriTax } from "./missouriTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "mo", stateTreatment: "verified-resident-location",
    missouriContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number) {
  const ceilings = [1348, 2696, 4044, 5392, 6740, 8088, 9436, Infinity];
  const rates = [0, .02, .025, .03, .035, .04, .045, .047];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

describe("restricted Missouri annual settlement", () => {
  it("applies the shared graduated bracket schedule after the federal-conforming standard deduction, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const mo = estimateHouseholdTax(terms);
    expect(mo.stateTax).toBeCloseTo(bracketTax(80000 - 16100), 6);
    expect(mo.localTax).toBe(0);
  });

  it("uses the doubled married standard deduction", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const mo = estimateHouseholdTax(terms);
    expect(mo.stateTax).toBeCloseTo(bracketTax(100000 - 32200), 6);
  });

  it("fully deducts Social Security for an owner 62 or older", () => {
    const people = [{ id: "one", birthDate: "1960-01-01", blind: false, eligibleForSeniorDeduction: true }];
    const wagesOnly = input({ people, income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const withSs = input({ people, income: [{ ownerId: "one", kind: "wages", amount: 80000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("does not deduct Social Security for an owner under 62", () => {
    const terms = input({ people: [{ id: "one", birthDate: "2000-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const mo = missouriTax(terms, 20000, 20000, 16100, 0);
    expect(mo.socialSecuritySubtraction).toBe(0);
  });

  it("caps the public pension exemption at the maximum Social Security benefit per owner", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", pensionType: "other-government", amount: 60000 }] });
    const mo = missouriTax(terms, 60000, 0, 16100, 0);
    expect(mo.publicPensionSubtraction).toBe(47633);
  });

  it("reduces the public pension exemption by that owner's own Social Security deduction", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1960-01-01", blind: false, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "pension", pensionType: "other-government", amount: 30000 },
        { ownerId: "one", kind: "social-security", amount: 10000 }] });
    const mo = missouriTax(terms, 40000, 10000, 16100, 0);
    expect(mo.socialSecuritySubtraction).toBe(10000);
    expect(mo.publicPensionSubtraction).toBe(20000);
  });

  it("caps the private pension exemption at $6,000 per owner, including a share of the retirement-ordinary figure", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", pensionType: "private", amount: 3000 }] });
    const mo = missouriTax(terms, 20000, 0, 16100, 6000);
    expect(mo.privatePensionSubtraction).toBe(6000);
  });

  it("phases out the private pension exemption above the AGI-less-Social-Security threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", pensionType: "private", amount: 6000 }] });
    const mo = missouriTax(terms, 26000, 0, 16100, 0);
    expect(mo.privatePensionSubtraction).toBe(5000);
  });

  it("treats an unspecified pension as private, not public", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", pensionType: "unspecified", amount: 6000 }] });
    const mo = missouriTax(terms, 20000, 0, 16100, 0);
    expect(mo.publicPensionSubtraction).toBe(0);
    expect(mo.privatePensionSubtraction).toBe(6000);
  });

  it("requires explicit confirmation of the restricted Missouri assumptions", () => {
    expect(() => missouriTax(input({ missouriContract: undefined }), 0, 0, 16100, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => missouriTax(input({ year: 2025 }), 0, 0, 16100, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "mo", moContract: "confirmed" };
    const mo = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(mo.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(mo.years[0].result.tax.localTax).toBe(0);
    expect(mo.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(mo.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Missouri confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "mo" })).toThrow(/Confirm/);
  });
});
