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
  it("applies the flat 4.45% rate directly to federal AGI, less the Taxpayer Tax Credit, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ut = estimateHouseholdTax(terms);
    // Tax 80000*4.45% = 3,560. Taxpayer Tax Credit = 6%*16,100 - 1.3%*(80,000-18,213) = 966 - 803.231 = 162.769.
    expect(ut.stateTax).toBeCloseTo(3560 - 162.769, 6);
    expect(ut.localTax).toBe(0);
  });

  it("computes the Taxpayer Tax Credit from the TC-40 worksheet: 6% of the standard deduction, phased out 1.3% above the base", () => {
    // Single: base 18,213. At AGI 18,213 the full 6%*16,100 = 966 applies but is capped at the 4.45% tax (810.52).
    expect(utahTax(input(), 18213, 0, 0, 16100).taxpayerTaxCredit).toBeCloseTo(18213 * .0445, 6);
    // At AGI 50,000: 966 - 1.3%*31,787 = 552.769.
    expect(utahTax(input(), 50000, 0, 0, 16100).taxpayerTaxCredit).toBeCloseTo(552.769, 6);
    // The credit is exhausted at 18,213 + 966/.013 = 92,521.
    expect(utahTax(input(), 92522, 0, 0, 16100).taxpayerTaxCredit).toBe(0);
    // Married: base 36,426 and 6%*32,200 = 1,932; at AGI 100,000 the phase-out is 1.3%*63,574 = 826.462.
    const married = input({ filing: "married", people: [...input().people, { ...input().people[0], id: "two" }] });
    expect(utahTax(married, 100000, 0, 0, 32200).taxpayerTaxCredit).toBeCloseTo(1932 - 826.462, 6);
  });

  it("applies the Taxpayer Tax Credit before the Social Security credit, which can only reduce the remaining tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // AGI 30,000 with 15,000 of taxable benefits: tax 1,335; taxpayer credit 966-.013*11,787 = 812.769; remaining 522.231.
    // Social Security credit calculated 667.5 is capped at the remaining 522.231, leaving zero tax.
    const ut = utahTax(terms, 30000, 15000, 0, 16100);
    expect(ut.taxpayerTaxCredit).toBeCloseTo(812.769, 6);
    expect(ut.socialSecurityCredit).toBeCloseTo(522.231, 6);
    expect(ut.stateTax).toBeCloseTo(0, 6);
  });

  it("rejects an invalid standard deduction", () => {
    expect(() => utahTax(input(), 50000, 0, 0, -1)).toThrow(/standard deduction/);
  });

  it("credits Social Security in full when modified AGI is at or below the phase-out threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // federalAgi 50000 <= 54000 single cap: no phase-out. Credit = .0445*15000 = 667.5.
    const ut = utahTax(terms, 50000, 15000, 0, 16100);
    expect(ut.socialSecurityCredit).toBeCloseTo(667.5, 6);
    // Tax 2,225 less taxpayer credit 552.769 less Social Security credit 667.5.
    expect(ut.stateTax).toBeCloseTo(2225 - 552.769 - 667.5, 6);
  });

  it("phases the Social Security credit down by 2.5 cents per dollar of modified AGI above the threshold", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    // federalAgi 80000: 26000 over the 54000 cap. Credit = .0445*15000 - .025*26000 = 667.5-650 = 17.5.
    const ut = utahTax(terms, 80000, 15000, 0, 16100);
    expect(ut.socialSecurityCredit).toBeCloseTo(17.5, 6);
  });

  it("eliminates the Social Security credit once the phase-out exceeds the calculated amount", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const ut = utahTax(terms, 200000, 15000, 0, 16100);
    expect(ut.socialSecurityCredit).toBe(0);
    expect(ut.stateTax).toBeCloseTo(200000 * .0445, 6);
  });

  it("fully offsets the tax on income that is entirely Social Security", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 20000 }] });
    const ut = utahTax(terms, 15000, 15000, 0, 16100);
    expect(ut.stateTax).toBeCloseTo(0, 6);
  });

  it("requires explicit confirmation of the restricted Utah assumptions", () => {
    expect(() => utahTax(input({ utahContract: undefined }), 0, 0, 0, 16100)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => utahTax(input({ year: 2025 }), 0, 0, 0, 16100)).toThrow(/year/);
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
