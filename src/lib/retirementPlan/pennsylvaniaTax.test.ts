import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { pennsylvaniaTax } from "./pennsylvaniaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "pa", cityId: "philadelphia-pa", stateTreatment: "verified-resident-location",
    pennsylvaniaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Pennsylvania annual settlement", () => {
  it("taxes 401(k) deferrals and disallows IRA and capital-loss deductions that federal AGI allows", () => {
    const wages = [{ ownerId: "one", kind: "wages" as const, amount: 100000 }];
    // Federal AGI is 80,000 after a 20,000 deferral, but Pennsylvania taxes the full 100,000 of compensation.
    const deferred = estimateHouseholdTax(input({ income: wages, pretax401k: [{ ownerId: "one", amount: 20000 }] }));
    expect(deferred.agi).toBeCloseTo(80000, 6);
    expect(deferred.stateTax).toBeCloseTo(100000 * .0307, 6);
    const ira = estimateHouseholdTax(input({ income: wages, deductibleIra: [{ ownerId: "one", amount: 7000 }] }));
    expect(ira.stateTax).toBeCloseTo(100000 * .0307, 6);
    // A net capital loss reduces federal AGI by up to 3,000; Pennsylvania does not allow that.
    const loss = estimateHouseholdTax(input({ income: [{ ownerId: "one", kind: "wages", amount: 50000 }], accountIncome: taxCharacter({ longTermGain: -10000 }) }));
    expect(loss.capitalDeduction).toBe(3000);
    expect(loss.stateTax).toBeCloseTo(50000 * .0307, 6);
    // Local earned income tax was already on gross wages.
    expect(deferred.localTax).toBeCloseTo(100000 * .0374, 6);
  });

  it("computes the exact flat 3.07% state tax and Philadelphia's 3.74% local wage tax, with no exemption", () => {
    // No standard deduction: taxable = 80000. State: 80000*.0307 = 2456. Local: 80000*.0374 = 2992.
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const pa = estimateHouseholdTax(terms);
    expect(pa.stateTax).toBeCloseTo(2456, 6);
    expect(pa.localTax).toBeCloseTo(2992, 6);
  });

  it("applies each supported city's own distinct local wage-tax rate", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    expect(pennsylvaniaTax(terms, 80000, 0, 0, 0, 80000).localTax).toBeCloseTo(2992, 6); // Philadelphia.
    expect(pennsylvaniaTax({ ...terms, cityId: "pittsburgh-pa" }, 80000, 0, 0, 0, 80000).localTax).toBeCloseTo(2400, 6); // Pittsburgh, 3%.
    expect(pennsylvaniaTax({ ...terms, cityId: "allentown-pa" }, 80000, 0, 0, 0, 80000).localTax).toBeCloseTo(1580, 6); // Allentown, 1.975%.
  });

  it("fully excludes Social Security from Pennsylvania AGI", () => {
    const withSS = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }, { ownerId: "one", kind: "social-security", amount: 30000 }] });
    const pa = estimateHouseholdTax(withSS);
    expect(pa.taxableBenefits).toBeGreaterThan(0);
    expect(pa.stateTax).toBeCloseTo(2456, 6); // unchanged from the no-SS case.
  });

  it("fully excludes pension income from state tax, but never from the local wage tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 50000 }, { ownerId: "one", kind: "pension", amount: 30000 }] });
    const pa = pennsylvaniaTax(terms, 80000, 0, 0, 0, 50000);
    expect(pa.paAgi).toBe(50000); // pension excluded from state AGI.
    expect(pa.stateTax).toBeCloseTo(50000 * .0307, 6);
    expect(pa.localTax).toBeCloseTo(50000 * .0374, 6); // local tax uses only wages, not pension.
  });

  it("excludes normal retirement-account distributions but taxes the early-distribution-penalty portion", () => {
    // 40000 of the 60000 retirementOrdinary is a normal distribution (excluded); 20000 triggered the federal penalty (taxed).
    const terms = input({});
    const pa = pennsylvaniaTax(terms, 60000, 0, 60000, 20000, 0);
    expect(pa.paAgi).toBe(20000);
    expect(pa.stateTax).toBeCloseTo(20000 * .0307, 6);
  });

  it("rejects an unrated Pennsylvania location, including \"Other\"", () => {
    const terms = input({ cityId: "other-pa" });
    expect(() => pennsylvaniaTax(terms, 0, 0, 0, 0, 0)).toThrow(/supported Pennsylvania location/);
    expect(() => pennsylvaniaTax({ ...terms, cityId: "" }, 0, 0, 0, 0, 0)).toThrow(/supported Pennsylvania location/);
  });

  it("requires explicit confirmation of the restricted Pennsylvania assumptions", () => {
    expect(() => pennsylvaniaTax(input({ pennsylvaniaContract: undefined }), 0, 0, 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => pennsylvaniaTax(input({ year: 2025 }), 0, 0, 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "pa", cityId: "philadelphia-pa", paContract: "confirmed" };
    const pa = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(pa.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(pa.years[0].result.tax.localTax).toBeGreaterThan(0);
    expect(pa.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(pa.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Pennsylvania confirmation, and without a rated city", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "pa", cityId: "philadelphia-pa" })).toThrow(/Confirm/);
    expect(() => runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "pa", cityId: "other-pa", paContract: "confirmed" })))
      .toThrow(/supported Pennsylvania location/);
  });
});
