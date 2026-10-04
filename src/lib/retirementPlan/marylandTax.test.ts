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
    // Taxable = 80000 - 3400 - 4200 (3200 exemption + 1000 for age 65+) = 72400. State: 1000*.02+1000*.03+1000*.04+69400*.0475 = 90+3296.5 = 3386.5.
    // Local (Baltimore City, flat 3.20%): 72400*.032 = 2316.8.
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const md = estimateHouseholdTax(terms);
    expect(md.stateTax).toBeCloseTo(3386.5, 6);
    expect(md.localTax).toBeCloseTo(2316.8, 6);
  });

  it("matches Montgomery County (Rockville) to the same flat 3.20% rate as Baltimore City", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const baltimore = estimateHouseholdTax(terms);
    const rockville = estimateHouseholdTax({ ...terms, cityId: "rockville-md" });
    expect(rockville.localTax).toBe(baltimore.localTax);
  });

  it("applies Frederick County's graduated local brackets, not a flat rate", () => {
    // Taxable = 72400. Frederick single: .0225*25000 + .0275*25000 + .0296*22400 = 562.5+687.5+663.04 = 1913.04.
    const terms = input({ cityId: "frederick-md", income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    expect(marylandTax(terms, 80000, 0, 0).localTax).toBeCloseTo(1913.04, 6);
  });

  it("uses the married bracket schedule and married standard deduction", () => {
    // AGI 210000 is above the $200,000 joint exemption ceiling, so no exemption except 2 x $1000 for age 65+ (both born 1960).
    // Taxable = 210000 - 6800 - 2000 = 201200. 90 (first three brackets) + 147000*.0475 + 25000*.05 + 26200*.0525
    // = 90 + 6982.5 + 1250 + 1375.5 = 9698.
    const terms = input({ filing: "married", people: [...input().people, { ...input().people[0], id: "two" }],
      income: [{ ownerId: "one", kind: "wages", amount: 210000 }] });
    expect(marylandTax(terms, 210000, 0, 0).stateTax).toBeCloseTo(9698, 6);
  });

  it("fully excludes Social Security from Maryland AGI", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }, { ownerId: "one", kind: "social-security", amount: 30000 }] });
    const md = estimateHouseholdTax(terms);
    expect(md.taxableBenefits).toBeGreaterThan(0); // federally taxable, per the shared federal engine.
    // Taxable benefits still raise federal AGI, which sets the exemption phase-out, but never enter Maryland AGI.
    expect(marylandTax(terms, 80000 + md.taxableBenefits, md.taxableBenefits, 0).mdAgi).toBe(80000);
    expect(marylandTax(terms, 80000 + md.taxableBenefits, md.taxableBenefits, 0).exemptions).toBe(80000 + md.taxableBenefits > 100000 ? 1600 + 1000 : 3200 + 1000);
  });

  it("grants the pension exclusion only to an owner 65 or older by year end, capped and reduced by that owner's own Social Security", () => {
    const eligible = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }], // turns 66 in 2026.
      income: [{ ownerId: "one", kind: "pension", amount: 50000 }, { ownerId: "one", kind: "social-security", amount: 10000 }] });
    // Capped at 40600, minus 10000 SS = 30600.
    expect(marylandTax(eligible, 50000, 0, 0).pensionExclusion).toBe(30600);

    const notYet65 = input({ people: [{ ...input().people[0], birthDate: "1962-01-01" }], // turns 64 in 2026.
      income: [{ ownerId: "one", kind: "pension", amount: 50000 }] });
    expect(marylandTax(notYet65, 50000, 0, 0).pensionExclusion).toBe(0);

    const turns65OnDec31 = input({ people: [{ ...input().people[0], birthDate: "1961-12-31" }],
      income: [{ ownerId: "one", kind: "pension", amount: 10000 }] });
    expect(marylandTax(turns65OnDec31, 10000, 0, 0).pensionExclusion).toBe(10000);
  });

  it("floors the pension exclusion at zero when Social Security exceeds the capped pension", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 5000 }, { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(marylandTax(terms, 5000, 0, 0).pensionExclusion).toBe(0);
  });

  it("does not transfer unused pension exclusion between spouses", () => {
    const terms = input({ filing: "married", people: [{ ...input().people[0], id: "one" }, { ...input().people[0], id: "two" }],
      income: [{ ownerId: "one", kind: "pension", amount: 50000 }, { ownerId: "two", kind: "pension", amount: 10000 }] });
    // Owner one: min(50000,40600) = 40600. Owner two: min(10000,40600) = 10000. Total 50600.
    expect(marylandTax(terms, 60000, 0, 0).pensionExclusion).toBe(50600);
  });

  it("does not extend the pension exclusion to 401(k)/IRA account withdrawals", () => {
    const terms = input({ accountIncome: taxCharacter({ retirementOrdinary: 40000 }) });
    expect(marylandTax(terms, 40000, 0, 40000).pensionExclusion).toBe(0);
    expect(marylandTax(terms, 40000, 0, 40000).mdAgi).toBe(40000); // No exclusion, no Social Security: mdAgi equals federal AGI.
  });

  it("steps the $3,200 exemption down with federal AGI by filing status (Exemption Amount Chart 10A)", () => {
    const young = { ...input().people[0], birthDate: "1990-01-01" };
    const single = input({ people: [young] });
    const allowance = (terms: HouseholdTaxInput, agi: number) => marylandTax(terms, agi, 0, 0).exemptions;
    expect(allowance(single, 100000)).toBe(3200);
    expect(allowance(single, 100001)).toBe(1600);
    expect(allowance(single, 125000)).toBe(1600);
    expect(allowance(single, 125001)).toBe(800);
    expect(allowance(single, 150000)).toBe(800);
    expect(allowance(single, 150001)).toBe(0);
    const married = input({ filing: "married", people: [{ ...young, id: "one" }, { ...young, id: "two" }] });
    expect(allowance(married, 150000)).toBe(6400);
    expect(allowance(married, 150001)).toBe(3200);
    expect(allowance(married, 175001)).toBe(1600);
    expect(allowance(married, 200000)).toBe(1600);
    expect(allowance(married, 200001)).toBe(0);
  });

  it("adds $1,000 for each owner 65 or older or blind, and the AGI phase-out does not reduce it", () => {
    const owner = (id: string, extra: object) => ({ id, birthDate: "1990-01-01", blind: false, eligibleForSeniorDeduction: true, ...extra });
    const terms = input({ filing: "married", people: [owner("one", { birthDate: "1950-06-01", blind: true }), owner("two", {})] });
    // Owner one is 65+ and blind (+2000); at AGI 300000 the base exemptions are gone but the additions stay.
    expect(marylandTax(terms, 300000, 0, 0).exemptions).toBe(2000);
    expect(marylandTax(terms, 100000, 0, 0).exemptions).toBe(6400 + 2000);
  });

  it("subtracts up to $1,200 when both spouses have their own income, never more than the smaller spouse's", () => {
    const young = { ...input().people[0], birthDate: "1990-01-01" };
    const married = (one: number, two: number) => input({ filing: "married", people: [{ ...young, id: "one" }, { ...young, id: "two" }],
      income: [{ ownerId: "one", kind: "wages", amount: one }, { ownerId: "two", kind: "wages", amount: two }] });
    const agi = (one: number, two: number) => marylandTax(married(one, two), one + two, 0, 0).mdAgi;
    expect(agi(60000, 50000)).toBe(110000 - 1200);
    expect(agi(60000, 800)).toBe(60800 - 800);
    expect(agi(60000, 0)).toBe(60000);
    // A single filer never gets it.
    expect(marylandTax(input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] }), 60000, 0, 0).mdAgi).toBe(60000);
  });

  it("measures each spouse's income net of that spouse's 401(k) deferrals, pension exclusion and retirement-account income", () => {
    const old = { ...input().people[0], birthDate: "1950-01-01" };
    const terms = input({ filing: "married", people: [{ ...old, id: "one" }, { ...old, id: "two" }],
      income: [{ ownerId: "one", kind: "pension", amount: 30000 }, { ownerId: "two", kind: "pension", amount: 5000 }],
      retirementIncome: [{ ownerId: "two", date: "2026-03-01", source: "traditional-ira", amount: 3000 }],
      accountIncome: taxCharacter({ retirementOrdinary: 3000 }) });
    // Owner two: pension 5000 fully excluded (cap 40600), so only the 3000 IRA income remains; owner one: 30000 pension excluded, 0 left.
    expect(marylandTax(terms, 38000, 0, 3000).mdAgi).toBe(38000 - 35000);
  });

  it("rejects an unrated Maryland location, including \"Other\"", () => {
    const terms = input({ cityId: "other-md" });
    expect(() => marylandTax(terms, 0, 0, 0)).toThrow(/supported Maryland location/);
    expect(() => marylandTax({ ...terms, cityId: "" }, 0, 0, 0)).toThrow(/supported Maryland location/);
  });

  it("requires explicit confirmation of the restricted Maryland assumptions", () => {
    expect(() => marylandTax(input({ marylandContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => marylandTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
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
