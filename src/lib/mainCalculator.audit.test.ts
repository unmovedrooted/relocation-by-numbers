import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { estimateNetAnnual, estimateNetBreakdown } from "./wageTax";
import { monthlyHousingCost } from "./housing";

// Executes the main relocation calculator's real result callback and its salary solver, and checks them against independent
// references (IRS Publication 505 2026 rate schedule for a single filer, and a closed-form payment).
function load(names: string[], memoName?: string) {
  const source = readFileSync(new URL("../components/Calculator.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("Calculator.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = ast.statements.filter(n => ts.isVariableStatement(n) || (ts.isFunctionDeclaration(n) && !n.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)));
  let memo = "";
  if (memoName) {
    const visit = (n: ts.Node) => {
      if (ts.isVariableDeclaration(n) && n.name.getText(ast) === memoName && n.initializer && ts.isCallExpression(n.initializer)) memo = `\nconst auditMemo = ${n.initializer.arguments[0].getText(ast)};`;
      ts.forEachChild(n, visit);
    };
    visit(ast);
    if (!memo) throw new Error("missing memo " + memoName);
  }
  const code = declarations.map(n => n.getText(ast)).join("\n") + memo + `\n({${names.join(",")}})`;
  return code;
}
const run = (code: string, scope: Record<string, unknown>) =>
  runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText,
    { process: { env: {} }, estimateNetAnnual, estimateNetBreakdown, monthlyHousingCost, STATES: [], citiesForState: () => [], findCity: () => undefined,
      isAllowedCompareRoute: () => false, compareMove: () => null, ...scope });

const nzFn = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const nFn = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : NaN; };

const fedSingle = (gross: number) => {
  const t = Math.max(0, gross - 16100);
  if (t <= 12400) return t * 0.1;
  if (t <= 50400) return 1240 + (t - 12400) * 0.12;
  if (t <= 105700) return 5800 + (t - 50400) * 0.22;
  if (t <= 201775) return 17966 + (t - 105700) * 0.24;
  return 41024 + (t - 201775) * 0.32;
};

const baseState = {
  mode: "rent", salary: "100000", filing: "single", k401Pct: "10", fromState: "fl", toState: "tx", fromCityId: "miami-fl", toCityId: "dallas-tx",
  homePrice: "400000", downPct: "20", ratePct: "6.5", termYears: "30", propertyTaxPct: "1.2", homeInsMonthly: "150", hoaMonthly: "0", pmiAnnualPct: "0.8",
  rentMonthly: "2000", rentersInsMonthly: "20", parkingMonthly: "0", n: nFn, nz: nzFn,
};
const results = (over: Record<string, unknown> = {}) =>
  run(load(["auditMemo"], "results"), { ...baseState, ...over }).auditMemo();

describe("main relocation calculator results", () => {
  it("take-home pay and the effective tax rate follow the IRS schedule, with 401(k) saving not counted as tax", () => {
    const r = results();
    const deferral = 10000;
    const tax = fedSingle(100000 - deferral) + 100000 * 0.0765; // no state income tax in FL or TX
    expect(r.netToMonthly).toBeCloseTo((100000 - deferral - tax) / 12, 4);
    expect(r.effTaxToPct).toBeCloseTo((tax / 100000) * 100, 4);
    expect(r.effTaxFromPct).toBeCloseTo((tax / 100000) * 100, 4);
    // More saving lowers the tax rate; it used to raise it because the saving was counted as tax.
    expect(results({ k401Pct: "20" }).effTaxToPct).toBeLessThan(r.effTaxToPct);
    expect(results({ k401Pct: "0" }).effTaxToPct).toBeGreaterThan(r.effTaxToPct);
  });
  it("renting: housing is rent plus renters insurance plus parking, and its share of take-home pay", () => {
    const r = results({ rentMonthly: "2000", rentersInsMonthly: "20", parkingMonthly: "150" });
    expect(r.rentTotal).toBe(2170);
    expect(r.pct).toBeCloseTo((2170 / r.netToMonthly) * 100, 8);
  });
  it("buying: principal and interest, tax, insurance, HOA and the entered PMI rate below 20% down", () => {
    const r = results({ mode: "buy", downPct: "10", hoaMonthly: "75" });
    const loan = 400000 * 0.9;
    const m = 0.065 / 12;
    const pi = loan * m / (1 - (1 + m) ** -360);
    expect(r.buy.principalInterest).toBeCloseTo(pi, 6);
    expect(r.buy.propertyTax).toBeCloseTo(400000 * 0.012 / 12, 6);
    expect(r.pmiMonthly).toBeCloseTo(loan * 0.008 / 12, 6);
    expect(r.buyTotal).toBeCloseTo(pi + 400000 * 0.012 / 12 + 150 + 75 + loan * 0.008 / 12, 6);
    expect(results({ mode: "buy", downPct: "20" }).pmiMonthly).toBe(0);
  });
  it("a down payment above 100% is treated as a full cash purchase", () => {
    const r = results({ mode: "buy", downPct: "150" });
    expect(r.buy.loanAmount).toBe(0);
    expect(r.buy.principalInterest).toBe(0);
    expect(r.pmiMonthly).toBe(0);
  });
});

describe("main relocation calculator salary solver", () => {
  const find = (target: number, state = "tx", k401 = 10, filing = "single") =>
    run(load(["findNeededSalary"]), {}).findNeededSalary(target, state, filing, k401, state === "tx" ? "dallas-tx" : "other-ny");
  it("returns the salary, to the nearest $100, whose take-home pay equals the target", () => {
    for (const target of [40000, 75000, 120000, 250000]) {
      const salary = find(target);
      const net = estimateNetAnnual({ grossAnnual: salary, state: "tx", filing: "single", k401Pct: 10, cityId: "dallas-tx" });
      expect(Math.abs(net - target)).toBeLessThan(100);
    }
  });
  it("keeps searching when the starting range is too small (large 401(k) share, very high targets)", () => {
    const salary = find(300000, "tx", 60);
    const net = estimateNetAnnual({ grossAnnual: salary, state: "tx", filing: "single", k401Pct: 60, cityId: "dallas-tx" });
    expect(net).toBeGreaterThanOrEqual(300000 - 100);
  });
});
