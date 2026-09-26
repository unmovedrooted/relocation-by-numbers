import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { maineTax } from "./maineTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "me", stateTreatment: "verified-resident-location",
    maineContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number, ceilings: number[]) {
  const rates = [.058, .0675, .0715];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

describe("restricted Maine annual settlement", () => {
  it.each([[125000, 40000], [175000, 20000], [225000, 0], [250000, 0]])(
    "applies the disclosed temporary pension phaseout at federal AGI %i", (agi, expected) => {
      const terms = input({ income: [], retirementIncome: [
        { ownerId: "one", date: "2026-12-31", source: "ira-conversion", amount: 40000 },
      ] });
      const result = maineTax(terms, agi, 0, 40000);
      expect(result.pensionDeduction).toBe(expected);
      expect(result.warning).toContain("NOT verified 2026");
    });

  it("excludes only the early-tax-subject portion, not all younger IRA income", () => {
    const terms = input({ retirementIncome: [
      { ownerId: "one", date: "2026-12-31", source: "traditional-ira", amount: 20000, earlyDistributionTaxable: 15000 },
    ] });
    expect(maineTax(terms, 20000, 0, 20000).pensionDeduction).toBe(5000);
  });

  it("does not exclude personally purchased annuity income", () => {
    const terms = input({ retirementIncome: [
      { ownerId: "one", date: "2026-12-31", source: "annuity", amount: 20000, earlyDistributionTaxable: 0 },
    ] });
    expect(maineTax(terms, 20000, 0, 20000).pensionDeduction).toBe(0);
  });

  it("blocks unsupported early workplace exceptions and young pension classification", () => {
    expect(() => maineTax(input({ retirementIncome: [
      { ownerId: "one", date: "2026-12-31", source: "401k", amount: 20000, earlyDistributionTaxable: 0 },
    ] }), 20000, 0, 20000)).toThrow(/periodic-payment/);
    expect(() => maineTax(input({ income: [
      { ownerId: "one", kind: "pension", amount: 20000 },
    ] }), 20000, 0, 0)).toThrow(/payment and penalty/);
  });

  it("projects indexed amounts but keeps the pension phaseout width at 100,000", () => {
    const terms = input({ year: 2027, projection: { kind: "project-2026-law", annualBracketGrowth: .1,
      annualPayrollCapGrowth: .1, statePolicy: "freeze-2025-proxy" }, retirementIncome: [
      { ownerId: "one", date: "2027-12-31", source: "ira-conversion", amount: 40000 },
    ] });
    const result = maineTax(terms, 187500, 0, 40000);
    expect(result.pensionPhaseoutStart).toBe(137500);
    expect(result.pensionDeduction).toBe(20000);
    expect(maineTax({ ...terms, retirementIncome: [] }, 0, 0, 0).standardDeduction).toBe(17250);
    expect(maineTax({ ...terms, retirementIncome: [] }, 0, 0, 0).exemption).toBe(5800);
  });

  it("requires an explicit growth assumption for future Maine years", () => {
    expect(() => maineTax(input({ year: 2027 }), 0, 0, 0)).toThrow(/explicit tax growth/);
  });

  it("does not transfer an unused spouse exclusion to the account owner", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1960-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1960-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], accountIncome: taxCharacter({ retirementOrdinary: 80000 }), retirementIncome: [
      { ownerId: "one", source: "traditional-ira", date: "2026-12-31", amount: 80000 },
    ] });
    expect(maineTax(terms, 80000, 0, 80000).pensionDeduction).toBe(49824);
    const split = { ...terms, retirementIncome: terms.people.map(person =>
      ({ ownerId: person.id, source: "traditional-ira" as const, date: "2026-12-31", amount: 40000 })) };
    expect(maineTax(split, 80000, 0, 80000).pensionDeduction).toBe(80000);
    const income = [{ ownerId: "one", kind: "wages" as const, amount: 50000 }];
    expect(estimateHouseholdTax({ ...terms, income }).stateTax)
      .toBeGreaterThan(estimateHouseholdTax({ ...split, income }).stateTax);
  });

  it("rejects missing or unknown-owner retirement attribution", () => {
    expect(() => maineTax(input(), 80000, 0, 80000)).toThrow(/owner-level/);
    expect(() => maineTax(input({ retirementIncome: [
      { ownerId: "unknown", source: "traditional-ira", date: "2026-12-31", amount: 80000 },
    ] }), 80000, 0, 80000)).toThrow(/attribution/);
  });

  it.each([[102250, 15700], [139750, 7850], [177250, 0], [200000, 0]])(
    "phases the single standard deduction at Maine AGI %i", (agi, expected) => {
      expect(maineTax(input(), agi, 0, 0).standardDeduction).toBe(expected);
    });

  it.each([[341000, 5300], [403500, 2650], [466000, 0], [500000, 0]])(
    "phases the single personal exemption at Maine AGI %i", (agi, expected) => {
      expect(maineTax(input(), agi, 0, 0).exemption).toBe(expected);
    });

  it("uses post-subtraction Maine AGI for deduction phaseouts", () => {
    expect(maineTax(input(), 122250, 20000, 0).standardDeduction).toBe(15700);
  });

  it("uses distinct married phaseout thresholds and widths", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    expect(maineTax(terms, 279550, 0, 0).standardDeduction).toBe(15700);
    expect(maineTax(terms, 471650, 0, 0).exemption).toBe(5300);
  });

  it("applies the graduated schedule after the standard deduction and $5,300 personal exemption", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const me = estimateHouseholdTax(terms);
    const taxable = 60000 - 15700 - 5300;
    expect(me.stateTax).toBeCloseTo(bracketTax(taxable, [27400, 64850, Infinity]), 6);
    expect(me.localTax).toBe(0);
  });

  it("doubles the married bracket thresholds and standard deduction, doubles the exemption", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const me = estimateHouseholdTax(terms);
    const taxable = 100000 - 31400 - 10600;
    expect(me.stateTax).toBeCloseTo(bracketTax(taxable, [54850, 129750, Infinity]), 6);
  });

  it("adds the enacted 2% surcharge above $1,000,000 taxable income single", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 1100000 }] });
    const me = maineTax(terms, 1100000, 0, 0);
    const taxable = 1100000; // Both deductions are fully phased out.
    const expected = bracketTax(taxable, [27400, 64850, Infinity]) + (taxable - 1000000) * .02;
    expect(me.stateTax).toBeCloseTo(expected, 6);
  });

  it("adds $2,050 per age-65-or-blind condition for a single filer", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: true, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const me = estimateHouseholdTax(terms);
    const taxable = 60000 - (15700 + 2 * 2050) - 5300;
    expect(me.stateTax).toBeCloseTo(bracketTax(taxable, [27400, 64850, Infinity]), 6);
  });

  it("excludes Social Security and Railroad Retirement from the Maine tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = maineTax(terms, 60000, 0, 0);
    const withSs = maineTax(terms, 78000, 18000, 0);
    expect(withSs.meAgi).toBe(withoutSs.meAgi);
  });

  it("caps the per-owner pension income deduction at $49,824, reduced by that owner's own Social Security", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1960-01-01", blind: false, eligibleForSeniorDeduction: true }], income: [{ ownerId: "one", kind: "pension", amount: 60000, pensionType: "private" },
      { ownerId: "one", kind: "social-security", amount: 10000 }] });
    const me = maineTax({ ...terms, retirementIncome: [
      { ownerId: "one", source: "traditional-ira", date: "2026-12-31", amount: 20000 },
    ] }, 60000, 0, 20000);
    expect(me.pensionDeduction).toBe(49824 - 10000);
  });

  it("does not require the owner to be 65 or older for the pension deduction", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1965-01-01", blind: false, eligibleForSeniorDeduction: false }],
      income: [{ ownerId: "one", kind: "pension", amount: 20000, pensionType: "private" }] });
    const me = maineTax(terms, 20000, 0, 0);
    expect(me.pensionDeduction).toBe(20000);
  });

  it("requires explicit confirmation of the restricted Maine assumptions", () => {
    expect(() => maineTax(input({ maineContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => maineTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "me", meContract: "confirmed" };
    const me = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(me.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(me.years[0].result.tax.localTax).toBe(0);
    expect(me.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(me.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Maine confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "me" })).toThrow(/Confirm/);
  });
});
