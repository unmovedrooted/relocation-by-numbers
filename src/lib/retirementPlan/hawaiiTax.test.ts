import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { hawaiiTax } from "./hawaiiTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "hi", stateTreatment: "verified-resident-location",
    hawaiiContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

function bracketTax(taxable: number, ceilings: number[]) {
  const rates = [.014, .032, .055, .064, .068, .072, .076, .079, .0825, .09, .10, .11];
  let total = 0, floor = 0;
  for (let i = 0; i < ceilings.length; i++) {
    total += Math.max(0, Math.min(taxable, ceilings[i]) - floor) * rates[i];
    floor = ceilings[i];
  }
  return total;
}

const youngInput = (year: number) => input({ year, people: [{ id: "one", birthDate: `${year - 50}-01-01`, blind: false, eligibleForSeniorDeduction: true }] });
const SINGLE_CEILINGS = [9600, 14400, 19200, 24000, 36000, 48000, 125000, 175000, 225000, 275000, 325000, Infinity];
const MARRIED_CEILINGS = [19200, 28800, 38400, 48000, 72000, 96000, 250000, 350000, 450000, 550000, 650000, Infinity];

describe("restricted Hawaii annual settlement", () => {
  it.each([-1, NaN, Infinity, 10001])("rejects invalid account exemption %s", hawaiiAccountExclusion => {
    expect(() => hawaiiTax(input({ accountIncome: taxCharacter({ retirementOrdinary: 10000 }), hawaiiAccountExclusion }), 10000, 0))
      .toThrow(/exclusion attribution/);
  });

  it("subtracts only the confirmed exempt portion once", () => {
    const result = hawaiiTax(input({ accountIncome: taxCharacter({ retirementOrdinary: 60000 }), hawaiiAccountExclusion: 20000 }), 60000, 0);
    expect(result.hiAgi).toBe(40000);
    expect(result.accountExclusion).toBe(20000);
    // 40,000 - 8,000 standard deduction - 1,144 exemption = 30,856.
    // First four bands: 134.4 + 153.6 + 264 + 307.2; remaining 6,856 at 6.8%.
    expect(result.stateTax).toBeCloseTo(1325.408, 6);
  });
  it("gives each taxpayer 65 or older on the next January 1 one additional ,144 exemption", () => {
    const base = hawaiiTax(input({ year: 2026 }), 60000, 0).stateTax;
    const older = (birthDate: string) => hawaiiTax(input({ year: 2026, people: [{ id: "one", birthDate, blind: false, eligibleForSeniorDeduction: true }] }), 60000, 0).stateTax;
    const rate = .076;
    expect(base - older("1960-06-30")).toBeCloseTo(1144 * rate, 6);
    expect(older("1962-01-01")).toBeCloseTo(older("1960-06-30"), 6);
    expect(older("1962-01-02")).toBeCloseTo(base, 6);
  });

  it("does not infer exemption from a government pension type", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "federal-government", hawaiiPensionTreatment: "taxable" }] });
    expect(hawaiiTax(terms, 30000, 0).pensionExclusion).toBe(0);
    expect(hawaiiTax(terms, 30000, 0).hiAgi).toBe(30000);
  });

  it("blocks unclassified nonzero pensions but permits zero pensions", () => {
    expect(() => hawaiiTax(input({ income: [{ ownerId: "one", kind: "pension", amount: 30000 }] }), 30000, 0)).toThrow(/Hawaii pension treatment/);
    expect(hawaiiTax(input({ income: [{ ownerId: "one", kind: "pension", amount: 0 }] }), 0, 0).stateTax).toBe(0);
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "hi", hiContract: "confirmed" })).toThrow(/Person 1/);
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "hi", hiContract: "confirmed", "one-hawaiiPensionTreatment": "invalid" })).toThrow(/valid Hawaii/);
  });

  it("preserves separate owners' classifications through annual projection", () => {
    const plan = buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "hi", hiContract: "confirmed", household: "married", endYear: "2033",
      "one-hawaiiPensionTreatment": "exempt", "two-hawaiiPensionTreatment": "taxable", "two-pension": "15000" });
    const year = runRetirementTimeline({ ...plan, accounts: plan.accounts.map(a => ({ ...a, hawaiiSource: "taxable" as const })) }).years.find(row => row.year === 2033)!;
    expect(year.income.filter(row => row.kind === "pension").map(row => [row.ownerId, row.hawaiiPensionTreatment]))
      .toEqual([["one", "exempt"], ["two", "taxable"]]);
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "hi", hiContract: "confirmed", household: "married",
      "one-hawaiiPensionTreatment": "exempt", "two-pension": "15000" })).toThrow(/Person 2/);
  });

  it("does not change another state's pension calculation", () => {
    const original = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS, endYear: "2031" }));
    const classified = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS, endYear: "2031", "one-hawaiiPensionTreatment": "exempt" }));
    expect(classified).toEqual(original);
  });

  it.each([[2026, 8000], [2027, 8000], [2028, 9000], [2029, 9000], [2030, 10000], [2031, 12000], [2060, 12000]])(
    "uses the enacted deduction in %i", (year, deduction) => {
      expect(hawaiiTax(youngInput(year), deduction + 1144, 0).stateTax).toBe(0);
      expect(hawaiiTax(youngInput(year), deduction + 2144, 0).stateTax).toBe(14);
    });

  // Sum of complete lower bands plus the remaining taxable income:
  // 2026: 2539.2 + 2856*.076; 2027: 2145.6 + 2856*.072;
  // 2028: 2145.6 + 1856*.072; 2029: 1756.8 + 1856*.068.
  it.each([[2026, 2756.256], [2027, 2351.232], [2028, 2279.232], [2029, 1883.008]])(
    "independently checks 60,000 USD single income in %i", (year, expected) => {
      expect(hawaiiTax(input({ year }), 60000, 0).stateTax).toBeCloseTo(expected, 6);
    });

  it.each([2027, 2029, 2031])("applies the 13 percent top rate in %i", year => {
    const base = hawaiiTax(input({ year }), 700000, 0).stateTax;
    expect(hawaiiTax(input({ year }), 701000, 0).stateTax - base).toBeCloseTo(130, 6);
  });

  it.each([2026, 2027, 2028, 2029, 2030, 2031, 2060])(
    "preserves doubled married deductions and bracket widths in %i", year => {
      const terms = input({ year, filing: "married", people: [
        { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
        { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      ] });
      expect(hawaiiTax(terms, 120000, 0).stateTax)
        .toBeCloseTo(2 * hawaiiTax(input({ year }), 60000, 0).stateTax, 6);
    });

  it("applies the graduated schedule after the standard deduction and $1,144 personal exemption", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 }] });
    const hi = estimateHouseholdTax(terms);
    const taxable = 60000 - 8000 - 1144;
    expect(hi.stateTax).toBeCloseTo(bracketTax(taxable, SINGLE_CEILINGS), 6);
    expect(hi.localTax).toBe(0);
  });

  it("doubles the married bracket thresholds, standard deduction and exemption", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 90000 }] });
    const hi = estimateHouseholdTax(terms);
    const taxable = 90000 - 16000 - 2288;
    expect(hi.stateTax).toBeCloseTo(bracketTax(taxable, MARRIED_CEILINGS), 6);
  });

  it("reconciles exactly against the instructions' own Tax Table example ($23,275 taxable income)", () => {
    const single = hawaiiTax(input(), 23275 + 8000 + 1144, 0);
    expect(single.stateTax).toBeCloseTo(813, 0);
    const marriedTerms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const married = hawaiiTax(marriedTerms, 23275 + 16000 + 2288, 0);
    expect(married.stateTax).toBeCloseTo(399, 0);
  });

  it("excludes Social Security and Railroad Retirement from the Hawaii tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 60000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const withoutSs = hawaiiTax(terms, 60000, 0);
    const withSs = hawaiiTax(terms, 78000, 18000);
    expect(withSs.hiAgi).toBe(withoutSs.hiAgi);
    expect(withSs.stateTax).toBe(withoutSs.stateTax);
  });

  it("excludes only explicitly confirmed exempt pension income", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", amount: 30000, pensionType: "private", hawaiiPensionTreatment: "exempt" }] });
    const hi = hawaiiTax(terms, 30000, 0);
    expect(hi.pensionExclusion).toBe(30000);
    expect(hi.hiAgi).toBe(0);
  });

  it("does not exclude this planner's aggregate 401(k)/IRA/annuity distribution figure", () => {
    const terms = input({ income: [] });
    const hi = hawaiiTax(terms, 40000, 0);
    expect(hi.pensionExclusion).toBe(0);
    expect(hi.hiAgi).toBe(40000);
  });

  it("requires explicit confirmation of the restricted Hawaii assumptions", () => {
    expect(() => hawaiiTax(input({ hawaiiContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => hawaiiTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "hi", hiContract: "confirmed", "one-hawaiiPensionTreatment": "exempt" };
    const plan = buildPreviewInput(values);
    const hi = runRetirementTimeline({ ...plan, accounts: plan.accounts.map(a => ({ ...a, hawaiiSource: "taxable" as const })) });
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(hi.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(hi.years[0].result.tax.localTax).toBe(0);
    expect(hi.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(hi.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Hawaii confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "hi" })).toThrow(/Confirm/);
  });
});

describe("Hawaii alternative tax on net capital gains (Tax on Capital Gains Worksheet)", () => {
  // Single, 2026: Hawaii AGI = taxable income + 8,000 standard deduction + 1,144 exemption.
  const agiFor = (taxable: number) => taxable + 8000 + 1144;

  it("caps the tax on the gain at 7.25% when that is lower than the regular schedule", () => {
    // Taxable 150,000 with 100,000 of net long-term gain. Regular tax: 8,391.20 + 25,000*7.9% = 10,366.20.
    // Alternative: tax on max(50,000, 24,000) = 2,539.20 + 2,000*7.6% = 2,691.20, plus 7.25% * 100,000 = 7,250 -> 9,941.20.
    const result = hawaiiTax(input(), agiFor(150000), 0, 100000);
    expect(result.stateTax).toBeCloseTo(9941.2, 6);
    expect(result.eligibleGain).toBe(100000);
  });

  it("keeps the regular tax when the 7.25% alternative is higher (worksheet line 19 takes the smaller)", () => {
    // Taxable 30,000 with 20,000 gain. Alternative: tax(24,000)=859.20 + 6,000*7.25% = 1,294.20; regular 859.20 + 6,000*6.8% = 1,267.20.
    expect(hawaiiTax(input(), agiFor(30000), 0, 20000).stateTax).toBeCloseTo(1267.2, 6);
  });

  it("does not use the worksheet at or below $24,000 single / $48,000 married taxable income", () => {
    const withGain = hawaiiTax(input(), agiFor(24000), 0, 24000);
    expect(withGain.eligibleGain).toBe(0);
    expect(withGain.stateTax).toBeCloseTo(hawaiiTax(input(), agiFor(24000), 0).stateTax, 6);
  });

  it("uses the $48,000 threshold for married filing jointly", () => {
    const married = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    // Taxable 400,000, gain 300,000 -> base 100,000 (> 48,000). Regular tax(100,000) = 5,078.40 + 4,000*7.6% = 5,382.40; plus 21,750 = 27,132.40.
    // Regular tax(400,000) = 24,682.40 + 50,000*8.25% = 28,807.40, so the alternative is smaller.
    const result = hawaiiTax(married, 400000 + 16000 + 2288, 0, 300000);
    expect(result.stateTax).toBeCloseTo(27132.4, 6);
    expect(result.eligibleGain).toBe(300000);
  });

  it("flows the net long-term gain from the household computation", () => {
    const terms = input({ accountIncome: taxCharacter({ longTermGain: 200000 }) });
    const hi = estimateHouseholdTax(terms);
    // Taxable 200,000 - 8,000 - 1,144 = 190,856; regular 12,341 + 15,856*8.25% = 13,649.12.
    // Alternative: tax(24,000)=859.20 + 166,856*7.25% = 12,956.26 (gain exceeds the room above $24,000).
    expect(hi.stateTax).toBeCloseTo(859.2 + 166856 * .0725, 4);
    expect(hi.stateTax).toBeLessThan(12341.2 + 15856 * .0825);
  });

  it("rejects a negative or non-finite gain", () => {
    expect(() => hawaiiTax(input(), 50000, 0, -1)).toThrow(/net capital gain/);
    expect(() => hawaiiTax(input(), 50000, 0, NaN)).toThrow(/net capital gain/);
  });
});
