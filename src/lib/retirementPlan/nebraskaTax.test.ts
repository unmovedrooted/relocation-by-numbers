import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { nebraskaTax } from "./nebraskaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ne", stateTreatment: "verified-resident-location",
    nebraskaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

const married = (overrides: Partial<HouseholdTaxInput> = {}) => input({ filing: "married", people: [
  { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
  { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
], ...overrides });

describe("restricted Nebraska annual settlement", () => {
  it("applies the published 2026 schedule after the $8,850 standard deduction and $176 personal credit", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const ne = estimateHouseholdTax(terms);
    // Taxable = 60000 - 8850 = 51150. Tax = 4130*2.46% + (24760-4130)*3.51% + (51150-24760)*4.55%
    //   = 101.598 + 724.113 + 1200.745 = 2026.456; less the $176 credit = 1850.456.
    expect(ne.stateTax).toBeCloseTo(1850.456, 6);
    expect(ne.localTax).toBe(0);
  });

  it("reconciles to the 2026 Tax Table's printed over-$79,860 worksheet constants", () => {
    // Single: $3,333 of tax at taxable income $79,860 (taxable = AGI - 8,850; credit $176 added back).
    expect(nebraskaTax(input(), 79860 + 8850, 0).stateTax + 176).toBeCloseTo(3333, 0);
    // Married filing jointly: $3,032 at $79,860 (deduction 17,700, two $176 credits added back).
    expect(nebraskaTax(married(), 79860 + 17700, 0).stateTax + 352).toBeCloseTo(3032, 0);
    // The top rate above the endpoint is 4.55% in 2026.
    const above = nebraskaTax(input(), 89860 + 8850, 0).stateTax - nebraskaTax(input(), 79860 + 8850, 0).stateTax;
    expect(above).toBeCloseTo(10000 * .0455, 6);
  });

  it("uses the published 2027 schedule, standard deduction and $181 credit from 2027 on", () => {
    // Printed 2027 estimated-tax schedule: single 1,476.31 at taxable income 41,200; married 2,953.17 at 82,410.
    const single = nebraskaTax(input({ year: 2027 }), 41200 + 9100, 0);
    expect(single.standardDeduction).toBe(9100);
    expect(single.personalCredit).toBe(181);
    expect(single.stateTax + 181).toBeCloseTo(1476.31, 1);
    const joint = nebraskaTax(married({ year: 2028 }), 82410 + 18200, 0);
    expect(joint.standardDeduction).toBe(18200);
    expect(joint.stateTax + 362).toBeCloseTo(2953.17, 1);
    // Above $41,200 the single rate is 3.99% (third and fourth brackets both 3.99%).
    const above = nebraskaTax(input({ year: 2027 }), 51200 + 9100, 0).stateTax - single.stateTax;
    expect(above).toBeCloseTo(10000 * .0399, 6);
  });

  it("adds the additional deduction per condition -- 65 or older or blind -- to the standard deduction", () => {
    const people = [{ id: "one", birthDate: "1955-01-01", blind: true, eligibleForSeniorDeduction: true }];
    // 2026 uses the disclosed 2025 additional amount ($2,000 per condition single); 2027 uses the published $2,150.
    expect(nebraskaTax(input({ people }), 0, 0).standardDeduction).toBe(8850 + 2000 + 2000);
    expect(nebraskaTax(input({ people, year: 2027 }), 0, 0).standardDeduction).toBe(9100 + 2150 + 2150);
  });

  it("excludes Social Security from the Nebraska tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = nebraskaTax(terms, 60000, 0);
    const withSs = nebraskaTax(terms, 78000, 18000);
    expect(withSs.neAgi).toBe(withoutSs.neAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("fully taxes pension income and the retirement-ordinary aggregate", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "federal-government" }] });
    const ne = nebraskaTax(terms, 30000, 0);
    expect(ne.neAgi).toBe(30000);
  });

  it("requires explicit confirmation of the restricted Nebraska assumptions", () => {
    expect(() => nebraskaTax(input({ nebraskaContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => nebraskaTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ne", neContract: "confirmed" };
    const ne = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ne.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ne.years[0].result.tax.localTax).toBe(0);
    expect(ne.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ne.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Nebraska confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ne" })).toThrow(/Confirm/);
  });
});
