import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { marylandTax } from "./marylandTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "md", cityId: "baltimore-md", stateTreatment: "verified-resident-location",
    marylandContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1960-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Maryland annual settlement", () => {
  it("computes the exact 2026 flat-local-rate state+local tax on wages", () => {
    // Taxable = 80000 - 3400 = 76600. State: 1000*.02+1000*.03+1000*.04+73600*.0475 = 90+3496 = 3586.
    // Local (Baltimore City, flat 3.20%): 76600*.032 = 2451.2.
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const md = estimateHouseholdTax(terms);
    expect(md.stateTax).toBeCloseTo(3586, 6);
    expect(md.localTax).toBeCloseTo(2451.2, 6);
  });

  it("matches Montgomery County (Rockville) to the same flat 3.20% rate as Baltimore City", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const baltimore = estimateHouseholdTax(terms);
    const rockville = estimateHouseholdTax({ ...terms, cityId: "rockville-md" });
    expect(rockville.localTax).toBe(baltimore.localTax);
  });

  it("applies Frederick County's graduated local brackets, not a flat rate", () => {
    // Taxable = 76600. Frederick single: .0225*25000 + .0275*25000 + .0296*26600 = 562.5+687.5+787.36 = 2037.36.
    const terms = input({ cityId: "frederick-md", income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    expect(marylandTax(terms, 80000, 0).localTax).toBeCloseTo(2037.36, 6);
  });

  it("uses the married bracket schedule and married standard deduction", () => {
    // Taxable = 200000 - 6800 = 193200. 90 (first three brackets) + 147000*.0475 + 25000*.05 + 18200*.0525
    // = 90 + 6982.5 + 1250 + 955.5 = 9278.
    const terms = input({ filing: "married", people: [...input().people, { ...input().people[0], id: "two" }],
      income: [{ ownerId: "one", kind: "wages", amount: 200000 }] });
    expect(marylandTax(terms, 200000, 0).stateTax).toBeCloseTo(9278, 6);
  });

  it("fully excludes Social Security from Maryland AGI", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }, { ownerId: "one", kind: "social-security", amount: 30000 }] });
    const md = estimateHouseholdTax(terms);
    expect(md.taxableBenefits).toBeGreaterThan(0); // federally taxable, per the shared federal engine.
    expect(md.stateTax).toBeCloseTo(3586, 6); // unchanged from the no-SS case: SS never enters Maryland AGI.
  });

  it("grants the pension exclusion only to an owner 65 or older by year end, capped and reduced by that owner's own Social Security", () => {
    const eligible = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }], // turns 66 in 2026.
      income: [{ ownerId: "one", kind: "pension", amount: 50000 }, { ownerId: "one", kind: "social-security", amount: 10000 }] });
    // Capped at 40600, minus 10000 SS = 30600.
    expect(marylandTax(eligible, 50000, 0).pensionExclusion).toBe(30600);

    const notYet65 = input({ people: [{ ...input().people[0], birthDate: "1962-01-01" }], // turns 64 in 2026.
      income: [{ ownerId: "one", kind: "pension", amount: 50000 }] });
    expect(marylandTax(notYet65, 50000, 0).pensionExclusion).toBe(0);

    const turns65OnDec31 = input({ people: [{ ...input().people[0], birthDate: "1961-12-31" }],
      income: [{ ownerId: "one", kind: "pension", amount: 10000 }] });
    expect(marylandTax(turns65OnDec31, 10000, 0).pensionExclusion).toBe(10000);
  });

  it("floors the pension exclusion at zero when Social Security exceeds the capped pension", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000 }, { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(marylandTax(terms, 5000, 0).pensionExclusion).toBe(0);
  });

  it("does not transfer unused pension exclusion between spouses", () => {
    const terms = input({ filing: "married", people: [{ ...input().people[0], id: "one" }, { ...input().people[0], id: "two" }],
      income: [{ ownerId: "one", kind: "pension", amount: 50000 }, { ownerId: "two", kind: "pension", amount: 10000 }] });
    // Owner one: min(50000,40600) = 40600. Owner two: min(10000,40600) = 10000. Total 50600.
    expect(marylandTax(terms, 60000, 0).pensionExclusion).toBe(50600);
  });

  it("does not extend the pension exclusion to 401(k)/IRA account withdrawals", () => {
    const terms = input({ accountIncome: taxCharacter({ retirementOrdinary: 40000 }) });
    expect(marylandTax(terms, 40000, 0).pensionExclusion).toBe(0);
    expect(marylandTax(terms, 40000, 0).mdAgi).toBe(40000); // No exclusion, no Social Security: mdAgi equals federal AGI.
  });

  it("rejects an unrated Maryland location, including \"Other\"", () => {
    const terms = input({ cityId: "other-md" });
    expect(() => marylandTax(terms, 0, 0)).toThrow(/supported Maryland location/);
    expect(() => marylandTax({ ...terms, cityId: "" }, 0, 0)).toThrow(/supported Maryland location/);
  });

  it("requires explicit confirmation of the restricted Maryland assumptions", () => {
    expect(() => marylandTax(input({ marylandContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => marylandTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "md", cityId: "baltimore-md", mdContract: "confirmed" };
    const md = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(md.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(md.years[0].result.tax.localTax).toBeGreaterThan(0);
    expect(md.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(md.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Maryland confirmation, and without a rated county", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "md", cityId: "baltimore-md" })).toThrow(/Confirm/);
    expect(() => runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "md", cityId: "other-md", mdContract: "confirmed" })))
      .toThrow(/supported Maryland location/);
  });
});
