import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { montanaTax } from "./montanaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "mt", stateTreatment: "verified-resident-location",
    montanaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Montana annual settlement", () => {
  it("applies the two-bracket single schedule to federal taxable income (AGI less the federal standard deduction), with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 30000 }] });
    const mt = estimateHouseholdTax(terms);
    // AGI 30000, federal standard deduction (single, 2026) 16100. Taxable = 13900, entirely in the 4.7% band.
    expect(mt.stateTax).toBeCloseTo(13900 * 0.047, 6);
    expect(mt.localTax).toBe(0);
  });

  it("taxes income above $47,500 (single) at 5.65%", () => {
    const mt = montanaTax(input(), 70000, 0, 0);
    // Taxable = 70000. Tax = 47500*4.7% + 22500*5.65% = 2232.5 + 1271.25 = 3503.75.
    expect(mt.stateTax).toBeCloseTo(3503.75, 6);
  });

  it("doubles the top-bracket threshold for married filing jointly", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const mt = montanaTax(terms, 95000, 0, 0);
    // Taxable = 95000, entirely inside the married 0-95000 4.7% band.
    expect(mt.stateTax).toBeCloseTo(95000 * 0.047, 6);
  });

  it("applies the enacted HB 337 2027 schedule (4.7% to $65,000 single / $130,000 married, then 5.4%) from 2027", () => {
    // Single, taxable 100,000: 65,000*4.7% + 35,000*5.4% = 3,055 + 1,890 = 4,945.
    expect(montanaTax(input({ year: 2027 }), 100000, 0, 0).stateTax).toBeCloseTo(4945, 6);
    // The same income under the 2026 schedule: 47,500*4.7% + 52,500*5.65% = 2,232.50 + 2,966.25 = 5,198.75.
    expect(montanaTax(input({ year: 2026 }), 100000, 0, 0).stateTax).toBeCloseTo(5198.75, 6);
    const married = input({ year: 2028, filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    // Married, taxable 200,000 (2027 schedule held): 130,000*4.7% + 70,000*5.4% = 6,110 + 3,780 = 9,890.
    expect(montanaTax(married, 200000, 0, 0).stateTax).toBeCloseTo(9890, 6);
  });

  it("subtracts $5,810 for a spouse 65 or older by year end", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    const mt = montanaTax(terms, 30000, 0, 0);
    expect(mt.ageSubtraction).toBe(5810);
    // Taxable = 30000-5810 = 24190.
    expect(mt.stateTax).toBeCloseTo(24190 * 0.047, 6);
  });

  it("doubles the age-65 subtraction when both spouses qualify", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1955-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1958-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    const mt = montanaTax(terms, 30000, 0, 0);
    expect(mt.ageSubtraction).toBe(11620);
  });

  it("does not apply the age-65 subtraction to a spouse under 65", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1990-01-01", blind: false, eligibleForSeniorDeduction: true }] });
    const mt = montanaTax(terms, 30000, 0, 0);
    expect(mt.ageSubtraction).toBe(0);
  });

  it("subtracts the OBBBA senior deduction passed through from the household calculation", () => {
    const withSenior = montanaTax(input(), 40000, 10000, 6000);
    const without = montanaTax(input(), 40000, 10000, 0);
    expect(without.stateTax - withSenior.stateTax).toBeCloseTo(6000 * 0.047, 6);
  });

  it("fully taxes Social Security as ordinary income, with no Montana-specific exemption", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 }] });
    const withSocialSecurity = input({ income: [{ ownerId: "one", kind: "wages", amount: 40000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    const wagesResult = estimateHouseholdTax(wagesOnly);
    const withSsResult = estimateHouseholdTax(withSocialSecurity);
    expect(withSsResult.stateTax).toBeGreaterThan(wagesResult.stateTax);
  });

  it("requires explicit confirmation of the restricted Montana assumptions", () => {
    expect(() => montanaTax(input({ montanaContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => montanaTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "mt", mtContract: "confirmed" };
    const mt = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(mt.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(mt.years[0].result.tax.localTax).toBe(0);
    expect(mt.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(mt.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Montana confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "mt" })).toThrow(/Confirm/);
  });
});

describe("Montana net long-term capital gains tax (MCA 15-30-2103(2))", () => {
  it("taxes gains at 4.1% when ordinary income already exceeds the first-bracket threshold", () => {
    // Taxable 70,000 with 20,000 gain: ordinary 50,000 = 47,500*4.7% + 2,500*5.65% = 2,373.75; gains 20,000*4.1% = 820.
    const mt = montanaTax(input(), 70000, 0, 0, 20000);
    expect(mt.stateTax).toBeCloseTo(3193.75, 6);
    expect(mt.capitalGainsTax).toBeCloseTo(820, 6);
  });

  it("taxes the gain at 3% up to the threshold less ordinary income, then 4.1%", () => {
    // Taxable 60,000 with 40,000 gain: ordinary 20,000*4.7% = 940; 27,500 at 3% = 825; 12,500 at 4.1% = 512.5.
    expect(montanaTax(input(), 60000, 0, 0, 40000).stateTax).toBeCloseTo(940 + 825 + 512.5, 6);
  });

  it("uses the 2027 thresholds (and married doubling) from 2027", () => {
    const married = input({ year: 2027, filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ] });
    // Taxable 150,000 with 50,000 gain: ordinary 100,000*4.7% = 4,700; 30,000 at 3% = 900; 20,000 at 4.1% = 820.
    expect(montanaTax(married, 150000, 0, 0, 50000).stateTax).toBeCloseTo(4700 + 900 + 820, 6);
  });

  it("limits the gain to taxable income", () => {
    // Taxable 10,000, gain 50,000 -> gain 10,000 entirely at 3%.
    expect(montanaTax(input(), 10000, 0, 0, 50000).stateTax).toBeCloseTo(300, 6);
  });

  it("is unchanged with no gain and flows net long-term gain from the household computation", () => {
    expect(montanaTax(input(), 70000, 0, 0).stateTax).toBeCloseTo(3503.75, 6);
    const terms = input({ accountIncome: taxCharacter({ longTermGain: 100000 }) });
    const mt = estimateHouseholdTax(terms);
    // AGI 100,000, federal standard deduction 16,100 -> taxable 83,900, all gain: 47,500 at 3% + 36,400 at 4.1%.
    expect(mt.stateTax).toBeCloseTo(47500 * .03 + 36400 * .041, 6);
  });

  it("rejects an invalid gain", () => {
    expect(() => montanaTax(input(), 50000, 0, 0, -5)).toThrow(/net long-term capital gain/);
  });
});
