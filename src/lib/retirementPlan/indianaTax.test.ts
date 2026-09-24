import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { indianaTax } from "./indianaTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "in", cityId: "indianapolis-in", stateTreatment: "verified-resident-location",
    indianaContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Indiana annual settlement", () => {
  it("computes the exact 2026 flat state+local tax on wages in Marion County", () => {
    // Taxable = 80000 - 1000 (base exemption) = 79000. State: 79000*.0295 = 2330.5. Local (Marion): 79000*.0202 = 1595.8.
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const inTax = estimateHouseholdTax(terms);
    expect(inTax.stateTax).toBeCloseTo(2330.5, 6);
    expect(inTax.localTax).toBeCloseTo(1595.8, 6);
  });

  it("applies each supported county's own distinct flat local rate", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    expect(indianaTax(terms, 80000, 0).localTax).toBeCloseTo(1595.8, 6); // Marion (Indianapolis), .0202.
    expect(indianaTax({ ...terms, cityId: "fort-wayne-in" }, 80000, 0).localTax).toBeCloseTo(1256.1, 6); // Allen, .0159.
    expect(indianaTax({ ...terms, cityId: "evansville-in" }, 80000, 0).localTax).toBeCloseTo(987.5, 6); // Vanderburgh, .0125.
  });

  it("stacks the $1,000 base exemption for each spouse under the married filing status", () => {
    // Taxable = 100000 - 2000 = 98000. State: 98000*.0295 = 2891.
    const terms = input({ filing: "married", people: [...input().people, { ...input().people[0], id: "two" }],
      income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    expect(indianaTax(terms, 100000, 0).stateTax).toBeCloseTo(2891, 6);
  });

  it("fully excludes Social Security from Indiana AGI", () => {
    const withSS = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }, { ownerId: "one", kind: "social-security", amount: 30000 }] });
    const inTax = estimateHouseholdTax(withSS);
    expect(inTax.taxableBenefits).toBeGreaterThan(0); // federally taxable, per the shared federal engine.
    expect(inTax.stateTax).toBeCloseTo(2330.5, 6); // unchanged from the no-SS case: SS never enters Indiana AGI.
  });

  it("grants the $1,000 age-65 exemption and the $500 low-income-senior exemption only when federal AGI is under $40,000", () => {
    const agedLowIncome = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }], // turns 66 in 2026.
      income: [{ ownerId: "one", kind: "wages", amount: 20000 }] });
    // Exemptions = 1000 base + 1000 age + 500 low-income = 2500. Taxable = 20000-2500 = 17500. State: 17500*.0295 = 516.25.
    expect(indianaTax(agedLowIncome, 20000, 0).stateTax).toBeCloseTo(516.25, 6);

    const agedHigherIncome = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }],
      income: [{ ownerId: "one", kind: "wages", amount: 50000 }] });
    // Exemptions = 1000 base + 1000 age (AGI too high for the $500). Taxable = 50000-2000 = 48000. State: 48000*.0295 = 1416.
    expect(indianaTax(agedHigherIncome, 50000, 0).stateTax).toBeCloseTo(1416, 6);
  });

  it("grants an additional $1,000 exemption for a blind owner", () => {
    // Exemptions = 1000 base + 1000 blind = 2000. Taxable = 80000-2000 = 78000. State: 78000*.0295 = 2301.
    const terms = input({ people: [{ ...input().people[0], blind: true }], income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    expect(indianaTax(terms, 80000, 0).stateTax).toBeCloseTo(2301, 6);
  });

  it("grants the civil service annuity deduction only to an owner 62 or older, capped and reduced by that owner's own Social Security", () => {
    const eligible = input({ people: [{ ...input().people[0], birthDate: "1963-01-01" }], // turns 63 in 2026.
      income: [{ ownerId: "one", kind: "pension", amount: 50000 }, { ownerId: "one", kind: "social-security", amount: 10000 }] });
    // Capped at 16000, minus 10000 SS = 6000.
    expect(indianaTax(eligible, 50000, 0).civilServiceAnnuityDeduction).toBe(6000);

    const notYet62 = input({ people: [{ ...input().people[0], birthDate: "1965-01-01" }], // turns 61 in 2026.
      income: [{ ownerId: "one", kind: "pension", amount: 50000 }] });
    expect(indianaTax(notYet62, 50000, 0).civilServiceAnnuityDeduction).toBe(0);

    const turns62OnDec31 = input({ people: [{ ...input().people[0], birthDate: "1964-12-31" }],
      income: [{ ownerId: "one", kind: "pension", amount: 10000 }] });
    expect(indianaTax(turns62OnDec31, 10000, 0).civilServiceAnnuityDeduction).toBe(10000);
  });

  it("floors the civil service annuity deduction at zero when Social Security exceeds the capped pension", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }],
      income: [{ ownerId: "one", kind: "pension", amount: 5000 }, { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(indianaTax(terms, 5000, 0).civilServiceAnnuityDeduction).toBe(0);
  });

  it("does not transfer unused civil service annuity capacity between spouses", () => {
    const terms = input({ filing: "married", people: [{ ...input().people[0], id: "one", birthDate: "1960-01-01" },
      { ...input().people[0], id: "two", birthDate: "1960-01-01" }],
      income: [{ ownerId: "one", kind: "pension", amount: 20000 }, { ownerId: "two", kind: "pension", amount: 10000 }] });
    // Owner one: min(20000,16000) = 16000. Owner two: min(10000,16000) = 10000. Total 26000.
    expect(indianaTax(terms, 30000, 0).civilServiceAnnuityDeduction).toBe(26000);
  });

  it("does not extend the civil service annuity deduction to 401(k)/IRA account withdrawals", () => {
    const terms = input({ people: [{ ...input().people[0], birthDate: "1960-01-01" }], accountIncome: taxCharacter({ retirementOrdinary: 40000 }) });
    expect(indianaTax(terms, 40000, 0).civilServiceAnnuityDeduction).toBe(0);
    expect(indianaTax(terms, 40000, 0).inAgi).toBe(40000); // No deduction, no Social Security: inAgi equals federal AGI.
  });

  it("rejects an unrated Indiana location, including \"Other\"", () => {
    const terms = input({ cityId: "other-in" });
    expect(() => indianaTax(terms, 0, 0)).toThrow(/supported Indiana location/);
    expect(() => indianaTax({ ...terms, cityId: "" }, 0, 0)).toThrow(/supported Indiana location/);
  });

  it("requires explicit confirmation of the restricted Indiana assumptions", () => {
    expect(() => indianaTax(input({ indianaContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => indianaTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "in", cityId: "indianapolis-in", inContract: "confirmed" };
    const indiana = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(indiana.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(indiana.years[0].result.tax.localTax).toBeGreaterThan(0);
    expect(indiana.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(indiana.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Indiana confirmation, and without a rated county", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "in", cityId: "indianapolis-in" })).toThrow(/Confirm/);
    expect(() => runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "in", cityId: "other-in", inContract: "confirmed" })))
      .toThrow(/supported Indiana location/);
  });
});
