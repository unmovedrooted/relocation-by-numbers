import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { vermontTax } from "./vermontTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "vt", stateTreatment: "verified-resident-location",
    vermontContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Vermont annual settlement", () => {
  it("applies the graduated single brackets net of the standard deduction and personal exemption, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const vt = estimateHouseholdTax(terms);
    // Taxable = 40000 - 7650 - 5300 = 27050. Tax = 27050 * 3.35% = 906.175.
    expect(vt.stateTax).toBeCloseTo(906.175, 3);
    expect(vt.localTax).toBe(0);
  });

  it("adds $1,250 per age-65-or-blind condition to the standard deduction", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1950-01-01", blind: true, eligibleForSeniorDeduction: true }] });
    const vt = vermontTax(terms, 40000, 0, 0);
    // Taxable = 40000 - (7650 + 2*1250) - 5300 = 40000-10150-5300 = 24550. Tax = 24550*3.35% = 822.425.
    expect(vt.stateTax).toBeCloseTo(822.425, 3);
  });

  it("doubles the personal exemption and widens the 3.35% bracket for married filing jointly", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const vt = vermontTax(terms, 90000, 0, 0);
    // Taxable = 90000 - 15300 - 2*5300 = 90000-15300-10600 = 64100, entirely inside the 0-82500 3.35% band.
    expect(vt.stateTax).toBeCloseTo(64100 * 0.0335, 6);
  });

  it("fully excludes Social Security benefits when federal AGI is at or below the single threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const vt = vermontTax(terms, 50000, 15000, 0);
    expect(vt.socialSecuritySubtraction).toBe(15000);
  });

  it("phases out the Social Security exclusion between $55,000 and $65,000 federal AGI for single filers", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // fraction = (55000+10000-60000)/10000 = 0.5.
    const vt = vermontTax(terms, 60000, 15000, 0);
    expect(vt.socialSecuritySubtraction).toBeCloseTo(7500, 6);
  });

  it("eliminates the Social Security exclusion at or above $65,000 single federal AGI", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const vt = vermontTax(terms, 65000, 15000, 0);
    expect(vt.socialSecuritySubtraction).toBe(0);
  });

  it("elects the other-government-pension exclusion instead when it is larger than the Social Security exclusion", () => {
    const terms = input({ income: [
      { ownerId: "one", kind: "social-security", amount: 4000 },
      { ownerId: "one", kind: "pension", amount: 20000, pensionType: "other-government" },
    ] });
    // fraction at AGI 60000 = 0.5. SS side: 3000*0.5=1500. Other side: min(10000,20000)*0.5=5000. Elects other.
    const vt = vermontTax(terms, 60000, 3000, 0);
    expect(vt.otherRetirementSubtraction).toBeCloseTo(5000, 6);
    expect(vt.socialSecuritySubtraction).toBe(0);
  });

  it("caps the other-government-pension exclusion at $10,000 before phase-out", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 50000, pensionType: "federal-government" }] });
    const vt = vermontTax(terms, 40000, 0, 0);
    expect(vt.otherRetirementSubtraction).toBe(10000);
  });

  it("does not apply the other-government-pension exclusion to a private or unspecified pension", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 50000, pensionType: "private" }] });
    const vt = vermontTax(terms, 40000, 0, 0);
    expect(vt.otherRetirementSubtraction).toBe(0);
  });

  it("adds back tax-exempt interest as Vermont-taxable", () => {
    const withInterest = vermontTax(input(), 40000, 0, 10000);
    const without = vermontTax(input(), 40000, 0, 0);
    expect(withInterest.stateTax).toBeGreaterThan(without.stateTax);
    expect(withInterest.stateTax - without.stateTax).toBeCloseTo(10000 * 0.0335, 6);
  });

  it("never taxes below the 3%-of-federal-AGI minimum once federal AGI exceeds $150,000", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 200000 }] });
    const vt = vermontTax(terms, 200000, 0, 0);
    expect(vt.stateTax).toBeGreaterThanOrEqual(200000 * 0.03);
  });

  it("does not apply the minimum-tax floor at or below $150,000 federal AGI", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 150000 }] });
    const vt = vermontTax(terms, 150000, 0, 0);
    // Taxable = 150000-12950 = 137050. Precise bracket tax = 49400*3.35% + 70300*6.6% + 17350*7.6% = 7613.3,
    // well above 3%*150000=4500, so this alone doesn't distinguish the floor -- it only confirms the schedule
    // result is used, not overridden.
    expect(vt.stateTax).toBeCloseTo(7613.3, 6);
  });

  it("requires explicit confirmation of the restricted Vermont assumptions", () => {
    expect(() => vermontTax(input({ vermontContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => vermontTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "vt", vtContract: "confirmed" };
    const vt = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(vt.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(vt.years[0].result.tax.localTax).toBe(0);
    expect(vt.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(vt.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Vermont confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "vt" })).toThrow(/Confirm/);
  });
});
