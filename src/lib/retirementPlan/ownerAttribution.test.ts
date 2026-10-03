import { describe, it, expect } from "vitest";
import type { HouseholdTaxInput, RetirementIncomeItem } from "./householdTax";
import { taxCharacter } from "./accountTax";
import { ownerRetirementIncome } from "./ownerRetirementIncome";
import { arkansasTax } from "./arkansasTax";
import { delawareTax } from "./delawareTax";
import { georgiaTax } from "./georgiaTax";
import { kentuckyTax } from "./kentuckyTax";
import { louisianaTax } from "./louisianaTax";
import { missouriTax } from "./missouriTax";
import { oklahomaTax } from "./oklahomaTax";
import { southCarolinaTax } from "./southCarolinaTax";
import { westVirginiaTax } from "./westVirginiaTax";
import { wisconsinTax } from "./wisconsinTax";

const person = (id: string, birthDate: string) => ({ id, birthDate, blind: false, eligibleForSeniorDeduction: true });
const withdrawal = (ownerId: string, amount: number, earlyDistributionTaxable = 0): RetirementIncomeItem =>
  ({ ownerId, source: "traditional-ira", date: "2026-07-01", amount, earlyDistributionTaxable });

function household(state: HouseholdTaxInput["state"], contract: string, birthDates: [string, string], retirementIncome: RetirementIncomeItem[]): HouseholdTaxInput {
  return { year: 2026, filing: "married", state, stateTreatment: "verified-resident-location",
    [contract]: "verified-law-precredit", people: [person("one", birthDates[0]), person("two", birthDates[1])],
    income: [], retirementIncome, accountIncome: taxCharacter({ retirementOrdinary: Math.max(0, retirementIncome.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0)) }),
    lossCarryover: { shortTerm: 0, longTerm: 0 } } as HouseholdTaxInput;
}
const total = (items: RetirementIncomeItem[]) => items.reduce((sum, item) => sum + item.amount, 0);

describe("owner-attributed retirement income (no even spousal split)", () => {
  it("attributes only to the owner who withdrew and nets early-distribution income per owner", () => {
    const terms = household("ar", "arkansasContract", ["1975-01-01", "1975-01-01"], [withdrawal("one", 10000, 3000), withdrawal("two", 4000, 0)]);
    const byOwner = ownerRetirementIncome(terms, 14000, "Test", 3000);
    expect(byOwner.get("one")).toBe(7000);
    expect(byOwner.get("two")).toBe(4000);
    expect(ownerRetirementIncome(terms, 14000, "Test").get("one")).toBe(10000);
  });

  it.each([
    ["missing owner", [withdrawal("missing", 100)], 100, /attribution/],
    ["negative amount", [withdrawal("one", -1)], -1, /attribution/],
    ["non-finite amount", [withdrawal("one", NaN)], NaN, /attribution/],
    ["unreconciled total", [withdrawal("one", 100)], 150, /reconciled/],
    ["records missing entirely", [], 100, /reconciled/],
  ])("fails closed for %s", (_label, items, aggregate, message) => {
    const terms = household("ar", "arkansasContract", ["1975-01-01", "1975-01-01"], items as RetirementIncomeItem[]);
    expect(() => ownerRetirementIncome(terms, aggregate as number, "Test")).toThrow(message);
  });

  it("rejects an early-distribution base that does not match the records", () => {
    const terms = household("ar", "arkansasContract", ["1975-01-01", "1975-01-01"], [withdrawal("one", 10000, 3000)]);
    expect(() => ownerRetirementIncome(terms, 10000, "Test", 2000)).toThrow(/reconciled/);
  });

  it("Arkansas: one owner's $20,000 is capped once at $6,000, not spread across two caps", () => {
    const items = [withdrawal("one", 20000)];
    expect(arkansasTax(household("ar", "arkansasContract", ["1975-01-01", "1975-01-01"], items), 40000, 0, total(items), 0).retirementExclusion).toBe(6000);
  });

  it("Delaware: distributions taken by the under-60 spouse are not excluded using the 60+ spouse's cap", () => {
    const items = [withdrawal("two", 40000)];
    const de = delawareTax(household("de", "delawareContract", ["1960-01-01", "1990-01-01"], items), 60000, 0, total(items));
    expect(de.pensionExclusion).toBe(0);
  });

  it("Georgia: distributions taken by the under-62 spouse earn no exclusion", () => {
    const items = [withdrawal("two", 40000)];
    const ga = georgiaTax(household("ga", "georgiaContract", ["1955-01-01", "1990-01-01"], items), 60000, 0, total(items));
    expect(ga.retirementIncomeExclusion).toBe(0);
  });

  it("Kentucky: one owner's $60,000 uses one $31,110 cap", () => {
    const items = [withdrawal("one", 60000)];
    const ky = kentuckyTax(household("ky", "kentuckyContract", ["1975-01-01", "1975-01-01"], items), 80000, 0, total(items));
    expect(ky.pensionExclusion).toBe(31110);
  });

  it("Louisiana: distributions taken by the under-65 spouse are not exempt using the 65+ spouse's allowance", () => {
    const items = [withdrawal("two", 30000)];
    const la = louisianaTax(household("la", "louisianaContract", ["1955-01-01", "1990-01-01"], items), 50000, 0, total(items));
    expect(la.retirementExemption).toBe(0);
  });

  it("Missouri: one owner's $20,000 private income is capped once at $6,000", () => {
    const items = [withdrawal("one", 20000)];
    const mo = missouriTax(household("mo", "missouriContract", ["1975-01-01", "1975-01-01"], items), 30000, 0, 25000, total(items));
    expect(mo.privatePensionSubtraction).toBe(6000);
  });

  it("Oklahoma: one owner's $30,000 uses one $10,000 cap", () => {
    const items = [withdrawal("one", 30000)];
    const ok = oklahomaTax(household("ok", "oklahomaContract", ["1975-01-01", "1975-01-01"], items), 60000, 0, total(items));
    expect(ok.retirementExclusion).toBe(10000);
  });

  it("South Carolina: one owner's distributions are limited by that owner's own cap", () => {
    const items = [withdrawal("one", 40000)];
    const sc = southCarolinaTax(household("sc", "southCarolinaContract", ["1975-01-01", "1975-01-01"], items), 60000, 0, total(items));
    const even = southCarolinaTax(household("sc", "southCarolinaContract", ["1975-01-01", "1975-01-01"], [withdrawal("one", 20000), withdrawal("two", 20000)]), 60000, 0, 40000);
    expect(sc.generalRetirementDeduction).toBeLessThan(even.generalRetirementDeduction);
  });

  it("West Virginia: the senior deduction follows the 65+ owner's own income, not half of the household total", () => {
    const items = [withdrawal("two", 20000)];
    const wv = westVirginiaTax(household("wv", "westVirginiaContract", ["1955-01-01", "1990-01-01"], items), 40000, 0, total(items));
    expect(wv.seniorDeduction).toBe(0);
  });

  it("Wisconsin: distributions taken by the under-67 spouse earn no subtraction", () => {
    const items = [withdrawal("two", 40000)];
    const wi = wisconsinTax(household("wi", "wisconsinContract", ["1955-01-01", "1990-01-01"], items), 60000, 0, total(items));
    expect(wi.retirementSubtraction).toBe(0);
  });
});
