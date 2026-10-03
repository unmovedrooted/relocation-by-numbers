import { describe, it, expect } from "vitest";
import { estimateHouseholdTax, type HouseholdTaxInput } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { massachusettsTax } from "./massachusettsTax";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { runRetirementTimeline } from "./timeline";

function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", state: "ma", stateTreatment: "verified-resident-location",
    massachusettsContract: "verified-law-precredit", people: [{ id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true }],
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}

describe("restricted Massachusetts annual settlement", () => {
  it("applies the flat 5% rate net of the single personal exemption, with no local tax", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ma = estimateHouseholdTax(terms);
    expect(ma.stateTax).toBeCloseTo((80000 - 4400) * 0.05, 6);
    expect(ma.localTax).toBe(0);
  });

  it("gives married filers the joint exemption, not doubled per person", () => {
    const terms = input({ filing: "married", people: [
      { id: "one", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
      { id: "two", birthDate: "1975-01-01", blind: false, eligibleForSeniorDeduction: true },
    ], income: [{ ownerId: "one", kind: "wages", amount: 100000 }] });
    const ma = estimateHouseholdTax(terms);
    expect(ma.stateTax).toBeCloseTo((100000 - 8800) * 0.05, 6);
  });

  it("adds $700 per owner 65 or older and $2,200 per legally blind owner", () => {
    const terms = input({ people: [{ id: "one", birthDate: "1955-01-01", blind: true, eligibleForSeniorDeduction: true }],
      income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const ma = massachusettsTax(terms, 80000, 0);
    expect(ma.exemptions).toBe(4400 + 700 + 2200);
  });

  it("excludes Social Security from the Massachusetts tax base", () => {
    const wagesOnly = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }] });
    const withSs = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 },
      { ownerId: "one", kind: "social-security", amount: 20000 }] });
    expect(estimateHouseholdTax(withSs).stateTax).toBe(estimateHouseholdTax(wagesOnly).stateTax);
  });

  it("applies the additional 4% Fair Share surtax above $1,107,750, not doubled for married filers", () => {
    const single = input({ income: [{ ownerId: "one", kind: "wages", amount: 1200000 }] });
    const ma = massachusettsTax(single, 1200000, 0);
    const taxable = 1200000 - 4400;
    const surtax = (taxable - 1107750) * 0.04;
    expect(ma.stateTax).toBeCloseTo(taxable * 0.05 + surtax, 6);
  });

  it("excludes a federal or other-government contributory pension from the tax base", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", pensionType: "federal-government", amount: 30000 }] });
    const ma = massachusettsTax(terms, 30000, 0);
    expect(ma.pensionExclusion).toBe(30000);
    expect(ma.stateTax).toBe(0);
  });

  it("keeps a private or unspecified pension fully taxable", () => {
    const terms = input({ income: [{ ownerId: "one", kind: "pension", pensionType: "private", amount: 30000 }] });
    const ma = massachusettsTax(terms, 30000, 0);
    expect(ma.pensionExclusion).toBe(0);
    expect(ma.stateTax).toBeCloseTo((30000 - 4400) * 0.05, 6);
  });

  it("requires explicit confirmation of the restricted Massachusetts assumptions", () => {
    expect(() => massachusettsTax(input({ massachusettsContract: undefined }), 0, 0)).toThrow(/Confirm/);
  });

  it("rejects an unsupported projection year", () => {
    expect(() => massachusettsTax(input({ year: 2025 }), 0, 0)).toThrow(/year/);
  });

  it("independently reconciles a complete household projection through the preview adapter", () => {
    const values = { ...PREVIEW_DEFAULTS, state: "ma", maContract: "confirmed" };
    const ma = runRetirementTimeline(buildPreviewInput(values));
    const florida = runRetirementTimeline(buildPreviewInput({ ...PREVIEW_DEFAULTS }));
    expect(ma.years[0].result.tax.stateTax).toBeGreaterThan(0);
    expect(ma.years[0].result.tax.localTax).toBe(0);
    expect(ma.years[0].endingPortfolio).toBeLessThan(florida.years[0].endingPortfolio);
    expect(ma.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });

  it("blocks the preview adapter without explicit Massachusetts confirmation", () => {
    expect(() => buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ma" })).toThrow(/Confirm/);
  });
});

describe("Massachusetts capital gains (8.5% short-term, 5% long-term)", () => {
  it("retains a state loss used federally and offsets a gain in the following year", () => {
    const base = input({ income: [{ ownerId: "one", kind: "wages", amount: 50000 }],
      projection: { kind: "project-2026-law", annualBracketGrowth: 0, annualPayrollCapGrowth: 0, statePolicy: "freeze-2025-proxy" } });
    const first = estimateHouseholdTax({ ...base, accountIncome: taxCharacter({ longTermGain: -3000 }) });
    expect(first.nextLossCarryover).toEqual({ shortTerm: 0, longTerm: 0 });
    expect(first.nextMassachusettsLossCarryover).toEqual({ shortTerm: 0, longTerm: 3000 });
    const second = estimateHouseholdTax({ ...base, year: 2027, accountIncome: taxCharacter({ longTermGain: 3000 }),
      lossCarryover: first.nextLossCarryover, massachusettsLossCarryover: first.nextMassachusettsLossCarryover });
    expect(second.stateTax).toBeCloseTo(2280, 6); // (50,000 wages - 4,400 exemption) * 5%.
    expect(second.nextMassachusettsLossCarryover).toEqual({ shortTerm: 0, longTerm: 0 });
    const withoutStateLoss = estimateHouseholdTax({ ...base, year: 2027, accountIncome: taxCharacter({ longTermGain: 3000 }) });
    expect(withoutStateLoss.stateTax - second.stateTax).toBeCloseTo(150, 6);
    expect(second.regularFederal).toBe(withoutStateLoss.regularFederal);
  });

  it("uses the state loss against interest even after the federal balance is exhausted", () => {
    const result = estimateHouseholdTax(input({ income: [
      { ownerId: "one", kind: "wages", amount: 50000 }, { ownerId: "one", kind: "interest", amount: 1000 },
    ], massachusettsLossCarryover: { shortTerm: 3000, longTerm: 0 } }));
    expect(result.stateTax).toBeCloseTo(2280, 6);
    expect(result.nextMassachusettsLossCarryover).toEqual({ shortTerm: 2000, longTerm: 0 });
  });

  it("limits combined state losses to $2,000 against interest, consuming short-term first", () => {
    const result = massachusettsTax(input(), 57000, 0, -1000, -5000, 10000, 3000);
    expect(result.nextLossCarryover).toEqual({ shortTerm: 0, longTerm: 4000 });
    expect(result.capitalLossAddBack).toBe(1000);
  });

  it("requires separate valid opening state losses instead of copying federal balances", () => {
    expect(() => estimateHouseholdTax(input({ lossCarryover: { shortTerm: 3000, longTerm: 0 } }))).toThrow(/separately/);
    for (const bad of [-1, NaN, Infinity]) {
      expect(() => estimateHouseholdTax(input({ massachusettsLossCarryover: { shortTerm: bad, longTerm: 0 } }))).toThrow(/Massachusetts/);
    }
  });

  it("preserves the independent balance through the timeline and final state", () => {
    const plan = buildPreviewInput({ ...PREVIEW_DEFAULTS, state: "ma", maContract: "confirmed", endYear: "2027" });
    const result = runRetirementTimeline({ ...plan, lossCarryover: { shortTerm: 3000, longTerm: 0 },
      massachusettsLossCarryover: { shortTerm: 3000, longTerm: 0 } });
    expect(result.years[0].result.nextState.lossCarryover.shortTerm).toBe(0);
    expect(result.nextState.massachusettsLossCarryover).toEqual({ shortTerm: 3000, longTerm: 0 });
    expect(result.years.every(row => Math.abs(row.reconciliationResidual) < 1e-5)).toBe(true);
  });
  it("taxes net short-term gains at 8.5% when 5% income absorbs the exemptions", () => {
    // AGI 100,000 including 20,000 short-term gain; exemptions 4,400 -> taxable 95,600 at 5% = 4,780, plus 3.5% * 20,000 = 700.
    const ma = massachusettsTax(input(), 100000, 0, 20000, 0);
    expect(ma.stateTax).toBeCloseTo(4780 + 700, 6);
    expect(ma.shortTermTaxable).toBe(20000);
  });

  it("applies excess exemptions to short-term gains before long-term gains", () => {
    // Only income is a 10,000 short-term gain: 4,400 of exemptions reduce it to 5,600 taxed at 8.5% = 476.
    expect(massachusettsTax(input(), 10000, 0, 10000, 0).stateTax).toBeCloseTo(5600 * .085, 6);
  });

  it("leaves long-term gains and dividends at 5%", () => {
    expect(massachusettsTax(input(), 100000, 0, 0, 20000).stateTax).toBeCloseTo(95600 * .05, 6);
  });

  it("nets a long-term loss against short-term gains", () => {
    // Short-term 10,000, long-term -4,000: 6,000 of net short-term gain (net capital gain 6,000 is in AGI 66,000).
    expect(massachusettsTax(input(), 66000, 0, 10000, -4000).stateTax).toBeCloseTo(61600 * .05 + 6000 * .035, 6);
  });

  it("allows a net capital loss only up to $2,000 against interest and dividends", () => {
    // Federal AGI 47,000 already deducts a 3,000 loss; only min(3,000, 2,000, 500) = 500 is allowed in Massachusetts.
    const ma = massachusettsTax(input(), 47000, 0, -3000, 0, 500, 3000);
    expect(ma.capitalLossAddBack).toBe(2500);
    expect(ma.stateTax).toBeCloseTo((49500 - 4400) * .05, 6);
    // With 5,000 of interest and dividends the full $2,000 applies.
    expect(massachusettsTax(input(), 47000, 0, -3000, 0, 5000, 3000).capitalLossAddBack).toBe(1000);
  });

  it("flows short-term gains and the loss limit from the household computation", () => {
    const gain = input({ income: [{ ownerId: "one", kind: "wages", amount: 80000 }], accountIncome: taxCharacter({ shortTermGain: 20000 }) });
    expect(estimateHouseholdTax(gain).stateTax).toBeCloseTo(4780 + 700, 6);
    const loss = input({ income: [{ ownerId: "one", kind: "wages", amount: 50000 }], accountIncome: taxCharacter({ longTermGain: -3000 }) });
    // No interest or dividends, so Massachusetts allows none of the federal deduction: taxable 50,000 - 4,400.
    expect(estimateHouseholdTax(loss).stateTax).toBeCloseTo(45600 * .05, 6);
  });

  it("rejects invalid inputs", () => {
    expect(() => massachusettsTax(input(), 50000, 0, NaN, 0)).toThrow(/capital gain/);
    expect(() => massachusettsTax(input(), 50000, 0, 0, 0, -1, 0)).toThrow(/capital gain/);
  });
});
