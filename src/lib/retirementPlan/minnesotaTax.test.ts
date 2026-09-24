import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { minnesotaTax } from "./minnesotaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "mn", stateTreatment: "verified-resident-location",
    minnesotaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Minnesota annual settlement", () => {
  it("computes the exact single bracket tax on wages, with no local tax", () => {
    // Taxable = 80000 - 15300 = 64700. Tax: 33310*.0535 + 31390*.068 = 1782.085+2134.52 = 3916.605.
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const mn = estimateHouseholdTax(terms);
    expect(mn.stateTax).toBeCloseTo(3916.605, 6);
    expect(mn.localTax).toBe(0);
  });

  it("grants the additional standard deduction for age 65 and blindness, stacking both", () => {
    // Standard deduction = 15300 + 1850 (age) + 1850 (blind) = 19000. Taxable = 60000-19000 = 41000.
    // Tax: 33310*.0535 + 7690*.068 = 1782.085+522.92 = 2305.005.
    const terms = input({ people: [{ ...input().people[0], birthDate: "1955-01-01", blind: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    expect(minnesotaTax(terms, 60000, 0, 0).stateTax).toBeCloseTo(2305.005, 6);
  });

  it("fully subtracts Social Security under the simplified method below the income threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // federalAgi 80000 < 86,410 single simplified-method threshold: fully subtracted regardless of the alternate method.
    const mn = minnesotaTax(terms, 80000, 15000, 0);
    expect(mn.socialSecuritySubtraction).toBe(15000);
  });

  it("taxes Social Security in full once both methods phase out at high income", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const mn = minnesotaTax(terms, 200000, 15000, 0);
    expect(mn.socialSecuritySubtraction).toBe(0);
  });

  it("requires explicit confirmation of the restricted Minnesota assumptions", () => {
    expect(() => minnesotaTax(input({ minnesotaContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => minnesotaTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "mn", mnContract: "confirmed" };
    const mn = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(mn.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(mn.years[0].result.tax.localTax).toBe(0);
    expect(mn.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(mn.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Minnesota confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "mn" })).toThrow(/Confirm/);
  });
});
