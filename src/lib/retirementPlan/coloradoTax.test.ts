import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { coloradoTax } from "./coloradoTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "co", stateTreatment: "verified-resident-location",
    coloradoContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Colorado annual settlement", () => {
  it("applies the flat 4.4% rate to federal taxable income, with no local tax, when no age-based subtraction applies", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] }); // owner is 51, no subtraction eligibility.
    const co = estimateHouseholdTax(terms);
    expect(co.stateTax).toBeCloseTo(co.taxableIncome * .044, 6);
    expect(co.localTax).toBe(0);
  });

  it("fully subtracts Social Security for an owner 65 or older, regardless of income", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1955-01-01" }], // turns 71 in 2026.
      income: [{ ownerId: "one", kind: "wages", amount: 200000 }, { ownerId: "one", kind: "social-security", amount: 40000 }] });
    const co = estimateHouseholdTax(terms);
    expect(co.taxableBenefits).toBeGreaterThan(0);
    // Social Security's federally taxable portion is fully removed from Colorado's base.
    expect(co.stateTax).toBeCloseTo((co.taxableIncome - co.taxableBenefits) * .044, 6);
  });

  it("caps the pension subtraction at $24,000 for an owner 65 or older with no Social Security", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1955-01-01" }],
      income: [{ ownerId: "one", kind: "pension", amount: 30000 }] });
    const co = coloradoTax(terms, 30000, 0, 20000);
    expect(co.pensionSubtraction).toBe(24000);
    expect(co.stateTax).toBeCloseTo(Math.max(0, 20000 - 24000) * .044, 6);
  });

  it("counts an owner's IRA and 401(k) distributions toward the pension cap, but not the early-distribution portion", () => {
    const older = { ...input().people[0], birthDate: "1955-01-01" };
    const ira = (amount: number, early = 0) => ({ ownerId: "one", date: "2026-06-01", source: "traditional-ira" as const, amount, earlyDistributionTaxable: early });
    // 18000 of IRA income plus 10000 of pension: 28000 is capped at 24000.
    const withBoth = input({ people: [older], income: [{ ownerId: "one", kind: "pension", amount: 10000 }],
      retirementIncome: [ira(18000)], accountIncome: taxCharacter({ retirementOrdinary: 18000 }) });
    expect(coloradoTax(withBoth, 28000, 0, 28000, 18000, 0).pensionSubtraction).toBe(24000);
    // IRA income alone is subtracted.
    const iraOnly = input({ people: [older], retirementIncome: [ira(15000)], accountIncome: taxCharacter({ retirementOrdinary: 15000 }) });
    expect(coloradoTax(iraOnly, 15000, 0, 15000, 15000, 0).pensionSubtraction).toBe(15000);
    // A premature distribution (here 5000 of 15000 subject to the federal early-distribution tax) does not qualify.
    const early = input({ people: [older], retirementIncome: [ira(15000, 5000)], accountIncome: taxCharacter({ retirementOrdinary: 15000, additionalTaxBase: 5000 }) });
    expect(coloradoTax(early, 15000, 0, 15000, 15000, 5000).pensionSubtraction).toBe(10000);
    // Each spouse's distributions are measured against that spouse's own cap.
    const couple = input({ filing: "married", people: [{ ...older, id: "one" }, { ...older, id: "two" }],
      retirementIncome: [ira(30000), { ...ira(10000), ownerId: "two" }], accountIncome: taxCharacter({ retirementOrdinary: 40000 }) });
    expect(coloradoTax(couple, 40000, 0, 40000, 40000, 0).pensionSubtraction).toBe(24000 + 10000);
  });

  it("flows IRA income through the household engine to a lower Colorado tax", () => {
    const older = { ...input().people[0], birthDate: "1955-01-01" };
    const base = { people: [older], retirementIncome: [{ ownerId: "one", date: "2026-06-01", source: "traditional-ira" as const, amount: 60000 }],
      accountIncome: taxCharacter({ retirementOrdinary: 60000 }) };
    const withIra = estimateHouseholdTax(input(base));
    // Colorado taxes federal taxable income less the capped $24,000 pension and annuity subtraction.
    expect(withIra.taxableIncome).toBeGreaterThan(24000);
    expect(withIra.stateTax).toBeCloseTo((withIra.taxableIncome - 24000) * .044, 6);
  });

  it("grants the full $20,000 pension cap to an owner 55-64 with no Social Security", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1966-01-01" }], // turns 60 in 2026.
      income: [{ ownerId: "one", kind: "pension", amount: 30000 }] });
    const co = coloradoTax(terms, 30000, 0, 25000);
    expect(co.pensionSubtraction).toBe(20000);
    expect(co.stateTax).toBeCloseTo((25000 - 20000) * .044, 6);
  });

  it("shares the $20,000 cap between Social Security and pension for an owner 55-64 above the income threshold", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1966-01-01" }],
      income: [{ ownerId: "one", kind: "social-security", amount: 15000 }, { ownerId: "one", kind: "pension", amount: 10000 }] });
    // federalAgi 90000 > 75000 single threshold: not exempt. SS (taxableBenefits 12000) is under the 20000 cap, so
    // it is fully subtracted; only 20000-12000=8000 of pension capacity remains.
    const co = coloradoTax(terms, 90000, 12000, 70000);
    expect(co.socialSecuritySubtraction).toBe(12000);
    expect(co.pensionSubtraction).toBe(8000);
    expect(co.stateTax).toBeCloseTo((70000 - 12000 - 8000) * .044, 6);
  });

  it("still reduces the pension cap by the Social Security subtraction when a 55-64 owner qualifies for the income-tested exemption", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1966-01-01" }],
      income: [{ ownerId: "one", kind: "social-security", amount: 15000 }, { ownerId: "one", kind: "pension", amount: 25000 }] });
    // federalAgi 60000 <= 75000 single threshold: all 12000 of taxable Social Security is subtracted (DR 0104 line 3),
    // and line 4 is the 20000 cap minus line 3.
    const co = coloradoTax(terms, 60000, 12000, 50000);
    expect(co.socialSecuritySubtraction).toBe(12000);
    expect(co.pensionSubtraction).toBe(8000);
  });

  it("reduces the $24,000 pension cap of an owner 65 or older by their Social Security subtraction, to zero at the cap", () => {
    const older = { ...input().people[0], birthDate: "1955-01-01" };
    const base = { people: [older], income: [{ ownerId: "one", kind: "social-security" as const, amount: 30000 }, { ownerId: "one", kind: "pension" as const, amount: 30000 }] };
    const partial = coloradoTax(input(base), 90000, 20000, 60000);
    expect(partial.socialSecuritySubtraction).toBe(20000);
    expect(partial.pensionSubtraction).toBe(4000);
    const exhausted = coloradoTax(input(base), 90000, 25500, 60000);
    expect(exhausted.socialSecuritySubtraction).toBe(25500);
    expect(exhausted.pensionSubtraction).toBe(0);
  });

  it("gives each spouse an independent $20,000 pension cap under married filing", () => {
    const terms = input({ filing: "married", people: [{ ...input().people[0], id: "one", birthDate: "1966-01-01" },
      { ...input().people[0], id: "two", birthDate: "1966-01-01" }],
      income: [{ ownerId: "one", kind: "pension", amount: 25000 }, { ownerId: "two", kind: "pension", amount: 25000 }] });
    const co = coloradoTax(terms, 100000, 0, 90000);
    expect(co.pensionSubtraction).toBe(40000); // 20000 each, not a shared household cap.
  });

  it("rejects a household with an owner under 55 receiving Social Security", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "social-security", amount: 10000 }] }); // owner is 51.
    expect(() => coloradoTax(terms, 10000, 5000, 5000)).toThrow(/unsupported/);
  });

  it("requires explicit confirmation of the restricted Colorado assumptions", () => {
    expect(() => coloradoTax(input({ coloradoContract: undefined }), 0, 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => coloradoTax(input({ year: 2025 }), 0, 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "co", coContract: "confirmed" };
    const co = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(co.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(co.years[0].result.tax.localTax).toBe(0);
    expect(co.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(co.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Colorado confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "co" })).toThrow(/Confirm/);
  });
});
