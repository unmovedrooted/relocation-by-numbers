import { describe, expect, it } from "vitest";
import { capitalLossCarryover, estimateHouseholdTax, type HouseholdTaxInput, type TaxPerson } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { estimateNetBreakdown, getFederalBrackets, getFederalStandardDeduction, sumBrackets } from "../tax";

const person: TaxPerson = { id: "one", birthDate: "1965-01-01", blind: false, eligibleForSeniorDeduction: true };
const older: TaxPerson = { ...person, birthDate: "1960-01-01" };
function input(overrides: Partial<HouseholdTaxInput> = {}): HouseholdTaxInput {
  return { year: 2026, filing: "single", people: [person], state: "fl", stateTreatment: "existing-2025-proxy",
    income: [], accountIncome: taxCharacter(), lossCarryover: { shortTerm: 0, longTerm: 0 }, ...overrides };
}
const pension = (amount: number) => [{ ownerId: "one", kind: "pension" as const, amount }];

describe("2026 household federal and payroll known answers", () => {
  it("calculates $50,000 salary: $3,820 income tax plus $3,825 employee payroll", () => {
    const result = estimateHouseholdTax(input({ income: [{ ownerId: "one", kind: "wages", amount: 50000 }] }));
    expect(result.taxableIncome).toBe(33900);
    expect(result.regularFederal).toBe(3820);
    expect(result.socialSecurityPayroll).toBe(3100);
    expect(result.medicarePayroll).toBe(725);
    expect(result.total).toBe(7645);
  });
  it("caps Social Security PER WORKER but computes Additional Medicare jointly", () => {
    const result = estimateHouseholdTax(input({ filing: "married", people: [person, { ...person, id: "two" }],
      income: [{ ownerId: "one", kind: "wages", amount: 200000 }, { ownerId: "two", kind: "wages", amount: 100000 }] }));
    expect(result.regularFederal).toBe(49468);
    expect(result.socialSecurityPayroll).toBe(17639);
    expect(result.medicarePayroll).toBe(4350);
    expect(result.additionalMedicare).toBeCloseTo(450, 10);
    expect(result.total).toBe(71907);
  });
  it("does not apply two payroll caps to two jobs held by the SAME worker", () => {
    const result = estimateHouseholdTax(input({ income: [
      { ownerId: "one", kind: "wages", amount: 100000 }, { ownerId: "one", kind: "wages", amount: 100000 }] }));
    expect(result.socialSecurityPayroll).toBe(11439);
    expect(result.medicarePayroll).toBe(2900);
    expect(result.additionalMedicare).toBe(0);
  });
  it("does not charge payroll tax on retirement income or conversion income", () => {
    const result = estimateHouseholdTax(input({ accountIncome: taxCharacter({ retirementOrdinary: 300000 }) }));
    expect(result.socialSecurityPayroll + result.medicarePayroll + result.additionalMedicare).toBe(0);
    expect(result.niit).toBe(0);
  });
  it("keeps ESPP disposition compensation out of FICA and NIIT income", () => {
    const result = estimateHouseholdTax(input({ accountIncome: taxCharacter({ esppCompensation: 250000, longTermGain: 10000 }) }));
    expect(result.socialSecurityPayroll + result.medicarePayroll + result.additionalMedicare).toBe(0);
    expect(result.netInvestmentIncome).toBe(10000);
    expect(result.niit).toBe(380);
  });
  it("applies NIIT to the smaller of investment income and excess MAGI", () => {
    const result = estimateHouseholdTax(input({ income: pension(190000), accountIncome: taxCharacter({ investmentOrdinary: 30000 }) }));
    expect(result.agi).toBe(220000);
    expect(result.niit).toBe(760);
  });
  it("does not add the early-distribution penalty base to ordinary income twice", () => {
    const result = estimateHouseholdTax(input({ accountIncome: taxCharacter({ retirementOrdinary: 50000, additionalTaxBase: 10000 }) }));
    expect(result.agi).toBe(50000);
    expect(result.regularFederal).toBe(3820);
    expect(result.earlyDistributionTax).toBe(1000);
    expect(result.total).toBe(4820);
  });
  it("handles zero income without NaN, negative tax or an invented refund", () => {
    const result = estimateHouseholdTax(input());
    expect(result.total).toBe(0);
    expect(result.taxableIncome).toBe(0);
    expect(result.agi).toBe(0);
  });
});

describe("Social Security and 2026 deductions", () => {
  it("calculates $30k pension + $20k benefits: $9,600 taxable benefits, $1,606 tax", () => {
    const result = estimateHouseholdTax(input({ people: [older], income: [...pension(30000),
      { ownerId: "one", kind: "social-security", amount: 20000 }] }));
    expect(result.taxableBenefits).toBe(9600);
    expect(result.agi).toBe(39600);
    expect(result.standardDeduction).toBe(18150);
    expect(result.seniorDeduction).toBe(6000);
    expect(result.total).toBe(1606);
  });
  it("includes tax-exempt interest in provisional income but not federal AGI or NIIT", () => {
    const result = estimateHouseholdTax(input({ people: [older], income: [...pension(20000),
      { ownerId: "one", kind: "social-security", amount: 20000 }, { ownerId: "one", kind: "tax-exempt-interest", amount: 20000 }] }));
    expect(result.taxableBenefits).toBe(17000);
    expect(result.agi).toBe(37000);
    expect(result.netInvestmentIncome).toBe(0);
  });
  it("taxes no benefits when Social Security is the only income", () => {
    const result = estimateHouseholdTax(input({ people: [older], income: [{ ownerId: "one", kind: "social-security", amount: 30000 }] }));
    expect(result.taxableBenefits).toBe(0);
    expect(result.total).toBe(0);
  });
  it("calculates $50k senior pension with both age and senior deductions", () => {
    const result = estimateHouseholdTax(input({ people: [older], income: pension(50000) }));
    expect(result.taxableIncome).toBe(25850);
    expect(result.total).toBe(2854);
  });
  it("applies the 6% senior phaseout to EACH eligible spouse", () => {
    const result = estimateHouseholdTax(input({ filing: "married", people: [older, { ...older, id: "two" }], income: pension(180000) }));
    expect(result.standardDeduction).toBe(35500);
    expect(result.seniorDeduction).toBe(8400);
    expect(result.taxableIncome).toBe(136100);
    expect(result.total).toBe(19366);
  });
  it("keeps the age-based deduction when the senior-SSN eligibility flag is false", () => {
    const result = estimateHouseholdTax(input({ people: [{ ...older, eligibleForSeniorDeduction: false }], income: pension(50000) }));
    expect(result.standardDeduction).toBe(18150);
    expect(result.seniorDeduction).toBe(0);
  });
  it("honors the January 1 age-65 boundary used by deduction rules", () => {
    const first = estimateHouseholdTax(input({ people: [{ ...person, birthDate: "1962-01-01" }] }));
    const second = estimateHouseholdTax(input({ people: [{ ...person, birthDate: "1962-01-02" }] }));
    expect(first.standardDeduction).toBe(18150);
    expect(first.seniorDeduction).toBe(6000);
    expect(second.standardDeduction).toBe(16100);
    expect(second.seniorDeduction).toBe(0);
  });
});

describe("Capital-gain stacking, carryovers and basic AMT", () => {
  it("stacks $20k long-term gain above ordinary income with part at 0% and part at 15%", () => {
    const result = estimateHouseholdTax(input({ income: pension(60000), accountIncome: taxCharacter({ longTermGain: 20000 }) }));
    expect(result.ordinaryTaxable).toBe(43900);
    expect(result.preferentialIncome).toBe(20000);
    expect(result.ordinaryTax).toBe(5020);
    expect(result.capitalAndDividendTax).toBe(2167.5);
    expect(result.total).toBe(7187.5);
  });
  it("uses unused deductions against preferential income without taxing all gains", () => {
    const result = estimateHouseholdTax(input({ accountIncome: taxCharacter({ longTermGain: 20000 }) }));
    expect(result.preferentialIncome).toBe(3900);
    expect(result.total).toBe(0);
  });
  it("treats qualified dividends as a preferential subset, not extra income", () => {
    const result = estimateHouseholdTax(input({ income: pension(60000), accountIncome: taxCharacter({ qualifiedDividends: 20000 }) }));
    expect(result.agi).toBe(80000);
    expect(result.total).toBe(7187.5);
  });
  it("nets opposite-term losses before determining preferential gain", () => {
    const result = estimateHouseholdTax(input({ income: pension(60000), accountIncome: taxCharacter({ shortTermGain: -10000, longTermGain: 30000 }) }));
    expect(result.preferentialIncome).toBe(20000);
    expect(result.total).toBe(7187.5);
    expect(result.nextLossCarryover).toEqual({ shortTerm: 0, longTerm: 0 });
  });
  it("deducts $3k after netting $10k ST loss and $4k LT gain; carries $3k ST", () => {
    const result = estimateHouseholdTax(input({ income: pension(30000), accountIncome: taxCharacter({ shortTermGain: -10000, longTermGain: 4000 }) }));
    expect(result.capitalDeduction).toBe(3000);
    expect(result.total).toBe(1090);
    expect(result.nextLossCarryover).toEqual({ shortTerm: 3000, longTerm: 0 });
  });
  it("does not consume a $3k carryover deduction below the standard deduction", () => {
    const result = estimateHouseholdTax(input({ income: pension(10000), accountIncome: taxCharacter({ shortTermGain: -10000 }) }));
    expect(result.capitalDeduction).toBe(3000);
    expect(result.total).toBe(0);
    expect(result.nextLossCarryover.shortTerm).toBe(10000);
  });
  it("consumes only $1,500 when that is all the taxable income available", () => {
    const result = estimateHouseholdTax(input({ income: pension(17600), accountIncome: taxCharacter({ shortTermGain: -10000 }) }));
    expect(result.nextLossCarryover.shortTerm).toBe(8500);
  });
  it("uses short-term losses first for the ordinary-income deduction", () => {
    const result = estimateHouseholdTax(input({ income: pension(30000), accountIncome: taxCharacter({ shortTermGain: -2000, longTermGain: -5000 }) }));
    expect(result.nextLossCarryover).toEqual({ shortTerm: 0, longTerm: 4000 });
  });
  it("combines prior losses with current gains without using the carryover twice", () => {
    const result = estimateHouseholdTax(input({ income: pension(30000), accountIncome: taxCharacter({ shortTermGain: 2000 }),
      lossCarryover: { shortTerm: 5000, longTerm: 0 } }));
    expect(result.netShortTerm).toBe(-3000);
    expect(result.nextLossCarryover.shortTerm).toBe(0);
  });
  it("includes basic AMT after the exemption disappears on $700k pure capital gain", () => {
    const result = estimateHouseholdTax(input({ accountIncome: taxCharacter({ longTermGain: 700000 }) }));
    expect(result.regularFederal).toBe(102087.5);
    expect(result.alternativeMinimumTax).toBe(3220);
    expect(result.niit).toBe(19000);
    expect(result.total).toBe(124307.5);
  });
  it("validates the claimed capital-loss deduction against the actual net loss", () => {
    expect(() => capitalLossCarryover(-10000, 0, 1000, 20000)).toThrow();
  });
  it("uses regular ordinary taxable income for Form 6251 capital-gain bands", () => {
    const result = estimateHouseholdTax(input({ income: pension(100000), accountIncome: taxCharacter({ longTermGain: 600000 }) }));
    // Regular ordinary tax: 1240 + 4560 + 7370 = 13170.
    // Gain tax: (545500-83900)*15% + 138400*20% = 96920.
    // AMT: 100000*26% + 96920 = 122920; less regular 110090.
    expect(result.regularFederal).toBe(110090);
    expect(result.alternativeMinimumTax).toBe(12830);
    expect(result.total).toBe(141920);
  });
});

describe("Version boundaries and existing tax engine preservation", () => {
  it("leaves the existing 2025 federal calculator unchanged", () => {
    expect(getFederalStandardDeduction("single")).toBe(15750);
    expect(sumBrackets(34250, getFederalBrackets("single"))).toBe(3871.5);
    expect(estimateNetBreakdown({ grossAnnual: 50000, state: "fl", filing: "single", k401Pct: 0 }).net).toBe(42303.5);
  });
  it("uses the named existing state proxy and returns its limitations", () => {
    const result = estimateHouseholdTax(input({ state: "ca", income: pension(60000) }));
    expect(result.stateTax).toBe(estimateNetBreakdown({ grossAnnual: 60000, state: "ca", filing: "single", k401Pct: 0 }).state);
    expect(result.stateDataYear).toBe(2025);
    expect(result.warnings.join(" ")).toMatch(/not verified retirement-specific/);
  });
  it("rejects unsupported years, filing/owner mismatches, missing proxy choice and bad dates", () => {
    expect(() => estimateHouseholdTax(input({ year: 2027 }))).toThrow(/2026/);
    expect(() => estimateHouseholdTax(input({ filing: "married" }))).toThrow(/count/);
    expect(() => estimateHouseholdTax(input({ stateTreatment: undefined }))).toThrow(/explicit/);
    expect(() => estimateHouseholdTax(input({ people: [{ ...person, birthDate: "1965-02-30" }] }))).toThrow(/date/);
    expect(() => estimateHouseholdTax(input({ income: [{ ownerId: "missing", kind: "wages", amount: 1 }] }))).toThrow(/owner/);
  });
  it.each([NaN, Infinity, -1, 1e13])("rejects invalid income and carryover values: %s", amount => {
    expect(() => estimateHouseholdTax(input({ income: pension(amount) }))).toThrow();
    expect(() => estimateHouseholdTax(input({ lossCarryover: { shortTerm: amount, longTerm: 0 } }))).toThrow();
  });
  it("is deterministic and leaves income and carryover inputs untouched", () => {
    const terms = input({ income: pension(60000), lossCarryover: { shortTerm: 3000, longTerm: 1000 } });
    const original = JSON.stringify(terms);
    expect(estimateHouseholdTax(terms)).toEqual(estimateHouseholdTax(terms));
    expect(JSON.stringify(terms)).toBe(original);
  });
});
