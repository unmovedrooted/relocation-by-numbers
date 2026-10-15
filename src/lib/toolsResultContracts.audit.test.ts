import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { CONTRIBUTION_LIMITS_2026 } from "./taxYear2026";
import { estimateNetBreakdown } from "./wageTax";
import { RETIREMENT_STATE_EXEMPT, representativeStateMarginalRate } from "./retirementTax";
import { computeUsCityResult } from "./compareEngines/us";
import { computeIntlCityResult } from "./compareEngines/international";

// Execute the production result callback, not a duplicate of its formulas.
function result(file: string, globals: Record<string, unknown>) {
  const source = readFileSync(new URL(`../components/${file}.tsx`, import.meta.url), "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = ast.statements.filter(n => ts.isVariableStatement(n) ||
    (ts.isFunctionDeclaration(n) && !n.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)));
  let callback = "";
  function visit(n: ts.Node) {
    if (ts.isVariableDeclaration(n) && n.name.getText(ast) === "results" && n.initializer &&
      ts.isCallExpression(n.initializer) && n.initializer.expression.getText(ast) === "useMemo")
      callback = n.initializer.arguments[0].getText(ast);
    ts.forEachChild(n, visit);
  }
  visit(ast);
  if (!callback) throw new Error(`Missing result callback: ${file}`);
  const code = declarations.map(n => n.getText(ast)).join("\n") + `\n(${callback})()`;
  return runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText,
    { process: { env: {} }, CONTRIBUTION_LIMITS_2026, estimateNetBreakdown, RETIREMENT_STATE_EXEMPT,
      representativeStateMarginalRate, nz: (v: string) => Number(v) || 0, ...globals });
}

describe("Tools displayed-result contracts", () => {
  it.each([50000, 100000, 150000, 250000])("compare-cities: salary %i arithmetic and retirement deduction labeling", grossAnnual => {
    const input = { city: { id: "audit-fl", name: "Audit", state: "fl" as const, defaultRent: 1500 }, grossAnnual,
      filing: "single" as const, k401Pct: 10, mode: "rent" as const,
      buy: { downPct: 20, ratePct: 6, termYears: 30, propertyTaxPct: 1, homeInsMonthly: 100, hoaMonthly: 0, pmiAnnualPct: 0 },
      rent: { rentersInsMonthly: 20, parkingMonthly: 100 } };
    const r = computeUsCityResult(input);
    const without = computeUsCityResult({ ...input, k401Pct: 0 });
    expect(r.housingMonthly).toBe(1620);
    expect(r.monthlyFlexibility).toBeCloseTo(r.netMonthly - 1620, 8);
    // The labeled tax rate counts taxes only, so tax-deferred saving lowers it (it used to count the saving as tax).
    expect(r.effTaxPct).toBeLessThan(without.effTaxPct);
    const taxes = estimateNetBreakdown({ grossAnnual, state: "fl", filing: "single", k401Pct: 10 }).totalTax;
    expect(r.effTaxPct).toBeCloseTo((taxes / grossAnnual) * 100, 8);
    expect(estimateNetBreakdown({ grossAnnual, state: "fl", filing: "single", k401Pct: 10 }).federal)
      .toBeLessThan(estimateNetBreakdown({ grossAnnual, state: "fl", filing: "single", k401Pct: 0 }).federal);
  });
  it.each(["GB", "SG", "PT", "CO", "JP", "AE"])("international compare invariants in %s (not official tax verification)", countryCode => {
    let previous = 0;
    for (const grossAnnualUsd of [0, 50000, 100000, 150000, 250000]) {
      const r = computeIntlCityResult({ countryCode, grossAnnualUsd, filing: "single", mode: "working" });
      expect(Number.isFinite(r.netMonthly)).toBe(true);
      expect(r.netMonthly).toBeGreaterThanOrEqual(previous);
      expect(r.netMonthly).toBeLessThanOrEqual(grossAnnualUsd / 12);
      expect(r.monthlyFlexibility).toBeCloseTo(r.netMonthly - r.housingMonthly, 8);
      previous = r.netMonthly;
    }
  });
  const investment = (overrides = {}) => result("InvestmentCalculator", { initialAmount: "0", monthlyContribution: "1000",
    years: "1", annualReturnPct: "12", inflationPct: "0", adjustForInflation: false, viewMode: "average", volatility: 0, ...overrides });
  it("records the contribution timing discrepancy without certifying the displayed label", () => {
    const actual = investment().finalBalance;
    const monthlyRate = 1.12 ** (1 / 12) - 1;
    const monthlyEnd = 1000 * ((1 + monthlyRate) ** 12 - 1) / monthlyRate;
    console.log("Investment contribution timing", { actual, monthlyEnd, difference: actual - monthlyEnd });
    expect(actual).toBeCloseTo(13440, 8);
    expect(actual).toBeGreaterThan(monthlyEnd);
    expect(actual).toBeGreaterThan(monthlyEnd * (1 + monthlyRate));
  });
  it("charts negative growth as a loss instead of clamping it to zero", () => {
    const r = investment({ initialAmount: "10000", monthlyContribution: "0", annualReturnPct: "-10" });
    expect(r.finalBalance).toBe(9000);
    expect(r.totalGrowth).toBe(-1000);
    expect(r.growthSeries[1].growth).toBe(-1000);
  });
  it.each([0, 1, 10, 30])("zero-return investment accumulation over %i years", years => {
    expect(investment({ years: String(years), annualReturnPct: "0" }).finalBalance).toBe(years * 12000);
  });
  it.each(["converted", "outside"])("Roth result cash accounting, tax paid %s", payTaxFrom => {
    const r = result("RothConversionCalculator", { amountToConvert: "10000", currentIncome: "50000", retirementTaxRatePct: "20",
      yearsToGrow: "10", expectedReturnPct: "0", inflationPct: "0", state: "fl", filing: "single", payTaxFrom });
    expect(r.conversionTax).toBe(1200);
    expect(r.rothFinal).toBe(payTaxFrom === "outside" ? 10000 : 8800);
    expect(r.tradFinal).toBe(payTaxFrom === "outside" ? 9200 : 8000);
    expect(r.difference).toBe(800);
  });
  it.each(["fl", "ca", "nj"])("HSA result consistency in %s", state => {
    const r = result("HsaCalculator", { age: "40", coverageType: "self", yourContribution: "1000", employerContribution: "500",
      currentBalance: "10000", grossAnnualIncome: "100000", state, filing: "single", expectedReturnPct: "0", yearsToGrow: "10" });
    expect(r.finalBalance).toBe(25000);
    expect(r.totalContributed).toBe(15000);
    expect(r.federalSaved).toBeCloseTo(220, 6);
    expect(r.ficaSaved).toBeCloseTo(76.5, 6);
    expect(r.stateSaved).toBe(0);
  });
});
