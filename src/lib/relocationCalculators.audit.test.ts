import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { estimatePmiMonthly, US_STATE_DEFAULTS } from "./housing";
import { estimateNetAnnual, estimateNetBreakdown, EMPLOYEE_401K_LIMIT } from "./wageTax";
import { householdNetAnnual, compareMove } from "./relocationMove";

// Executes the real component-level functions of the one-income relocation calculator and compares them with independent
// references written from the formulas.
function load(names: string[]) {
  const source = readFileSync(new URL("../components/RelocationIncomeCalculator.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("RelocationIncomeCalculator.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = ast.statements.filter(n => ts.isVariableStatement(n) || (ts.isFunctionDeclaration(n) && !n.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)));
  const code = declarations.map(n => n.getText(ast)).join("\n") + `\n({${names.join(",")}})`;
  return runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText,
    { estimatePmiMonthly, US_STATE_DEFAULTS, estimateNetAnnual, estimateNetBreakdown, EMPLOYEE_401K_LIMIT, householdNetAnnual, STATES: [], citiesForState: () => [], findCity: () => undefined,
      TAX_YEAR: 2026, React: {}, buildFireLink: () => "", compareMove, process: { env: {} } });
}
const fn = load(["buyHousingMonthly", "calcMortgagePI", "findMinIncome2", "numOr", "getVerdict", "buildOneTimeCosts"]);

const pmt = (loan: number, annualPct: number, years: number) => {
  const m = annualPct / 100 / 12, n = years * 12;
  return m === 0 ? loan / n : loan * m / (1 - (1 + m) ** -n);
};

describe("one-income relocation calculator: buying cost", () => {
  const homePrice = 450000;
  it("adds principal and interest, property tax, 0.6% insurance, HOA and PMI below 20% down", () => {
    const args = { homePrice, downPct: 10, ratePct: 6.75, termYears: 30, propertyTaxPct: 1.2, hoa: 150 };
    const loan = homePrice * 0.9;
    const pmiRate = loan / homePrice > 0.9 ? 0.012 : 0.009; // LTV exactly 0.90 falls in the 0.85-0.90 tier: 0.9%
    const expected = pmt(loan, 6.75, 30) + homePrice * 0.012 / 12 + homePrice * 0.006 / 12 + loan * pmiRate / 12 + 150;
    expect(fn.buyHousingMonthly(args)).toBeCloseTo(expected, 6);
  });
  it("uses the site's tiered PMI (0.7% to 1.5% of the loan by loan-to-value) and none at 20% down", () => {
    const at = (downPct: number) => fn.buyHousingMonthly({ homePrice, downPct, ratePct: 6.5, termYears: 30, propertyTaxPct: 1, hoa: 0 });
    const noPmi = (downPct: number) => at(downPct) - estimatePmiMonthly(homePrice * (1 - downPct / 100), homePrice, downPct);
    expect(at(20)).toBeCloseTo(pmt(homePrice * 0.8, 6.5, 30) + homePrice * 0.01 / 12 + homePrice * 0.006 / 12, 6);
    expect(at(3)).toBeGreaterThan(noPmi(3)); // 97% LTV: 1.5% tier
    expect(estimatePmiMonthly(homePrice * 0.97, homePrice, 3)).toBeCloseTo(homePrice * 0.97 * 0.015 / 12, 8);
  });
  it("keeps an entered 0% down payment at zero instead of replacing it with 10%", () => {
    expect(fn.numOr("0", 10)).toBe(0);
    expect(fn.numOr("", 10)).toBe(10);
    expect(fn.numOr("abc", 6.75)).toBe(6.75);
    const zero = fn.buyHousingMonthly({ homePrice, downPct: fn.numOr("0", 10), ratePct: 6.5, termYears: 30, propertyTaxPct: 1, hoa: 0 });
    const ten = fn.buyHousingMonthly({ homePrice, downPct: 10, ratePct: 6.5, termYears: 30, propertyTaxPct: 1, hoa: 0 });
    expect(zero).toBeGreaterThan(ten);
  });
});

describe("one-income relocation calculator: minimum second income", () => {
  it("returns the smallest $1,000 step at which combined take-home meets the target", () => {
    const target = 7500; // a month
    const found = fn.findMinIncome2(60000, "tx", "married", 5, 5, "dallas-tx", target);
    const net = (inc2: number) => householdNetAnnual(60000, inc2, "tx", "married", 5, 5, "dallas-tx") / 12;
    expect(found).not.toBeNull();
    expect(found % 1000).toBe(0);
    expect(net(found)).toBeGreaterThanOrEqual(target);
    expect(net(found - 1000)).toBeLessThan(target);
  });
  it("is zero when one income already covers it, and null when no realistic second income can", () => {
    expect(fn.findMinIncome2(150000, "tx", "single", 0, 0, "dallas-tx", 3000)).toBe(0);
    expect(fn.findMinIncome2(30000, "tx", "single", 0, 0, "dallas-tx", 400000)).toBeNull();
  });
});

describe("one-income relocation calculator: the one-time costs of buying or renting", () => {
  const fields = { movingTruck: "2000", miscMoving: "500", furnitureBudget: "3000", leaseBreak: "1800", moveFees: "300", securityDeposit: "2500", overlapMonths: "1" };
  const common = { homePrice: 450000, downPct: 10, targetState: "tx", touched: {}, ...fields };
  it("buying: the down payment is cash on hand, closing costs are spent, and there is no rental deposit", () => {
    const o = fn.buildOneTimeCosts({ ...common, buying: true });
    expect(o.downPayment.amount).toBe(45000);
    expect(o.downPayment.estimated).toBe(false);
    // Closing costs come from the state defaults (Texas), added to the entered 300 of fees.
    expect(o.fees.amount).toBeCloseTo(300 + 450000 * (US_STATE_DEFAULTS.tx.closingCostPct / 100), 6);
    expect(o.fees.estimated).toBe(true);
    expect(o.refundableDeposit.amount).toBe(0);
    const r = compareMove({
      filing: "single", k401Pct1: 0, k401Pct2: 0, currentIncome1: 100000, currentIncome2: 0, offerIncome1: 100000, offerIncome2: 0,
      currentState: "tx", currentCityId: "austin-tx", targetState: "tx", targetCityId: "dallas-tx",
      currentHousing: { amount: 2000, estimated: false }, targetHousing: { amount: 3000, estimated: false },
      currentLiving: { amount: 1500, estimated: false }, targetLiving: { amount: 1500, estimated: false }, oneTime: o,
    });
    const spent = 2000 + 500 + 3000 + 1800 + o.fees.amount + 1 * 3000;
    expect(r.expected.spentOneTime).toBeCloseTo(spent, 6);
    expect(r.expected.cashUpfront).toBeCloseTo(spent + 45000, 6);
  });
  it("renting: the deposit is refundable cash, there is no down payment and no closing cost", () => {
    const o = fn.buildOneTimeCosts({ ...common, buying: false });
    expect(o.downPayment).toBeUndefined();
    expect(o.refundableDeposit.amount).toBe(2500);
    expect(o.fees.amount).toBe(300);
  });
  it("a figure the user typed is not marked as an estimate, so it gets no range", () => {
    const o = fn.buildOneTimeCosts({ ...common, buying: false, touched: { movers: true } });
    expect(o.movers.estimated).toBe(false);
    expect(o.travel.estimated).toBe(true);
  });
  it("a 0% down payment on a 450,000 home needs no down payment cash", () => {
    expect(fn.buildOneTimeCosts({ ...common, buying: true, downPct: 0 }).downPayment.amount).toBe(0);
  });
});
