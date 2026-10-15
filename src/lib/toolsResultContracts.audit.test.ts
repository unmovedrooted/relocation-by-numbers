import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { CONTRIBUTION_LIMITS_2026 } from "./taxYear2026";
import { estimateNetBreakdown } from "./wageTax";
import { RETIREMENT_STATE_EXEMPT, representativeStateMarginalRate } from "./retirementTax";
import { computeUsCityResult } from "./compareEngines/us";
import { computeIntlCityResult } from "./compareEngines/international";
import { monthlyDepositFactor } from "./depositTiming";

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
    { process: { env: {} }, CONTRIBUTION_LIMITS_2026, estimateNetBreakdown, monthlyDepositFactor, RETIREMENT_STATE_EXEMPT,
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
  it("deposits the monthly contribution at the end of each month, as the label says", () => {
    const actual = investment().finalBalance;
    const monthlyRate = 1.12 ** (1 / 12) - 1;
    const monthlyEnd = 1000 * ((1 + monthlyRate) ** 12 - 1) / monthlyRate;
    expect(actual).toBeCloseTo(12646.497908, 5);
    expect(actual).toBeCloseTo(monthlyEnd, 6);
    // Ten years with a starting balance, against a month-by-month reference.
    let reference = 5000;
    for (let month = 0; month < 120; month++) reference = reference * (1 + monthlyRate) + 1000;
    expect(investment({ initialAmount: "5000", years: "10" }).finalBalance).toBeCloseTo(reference, 5);
  });
  it("matches the SEC Investor.gov compound interest calculator (7% compounded monthly, 10,000 start, 1,000 a month)", () => {
    // Investor.gov (checked 2026-10-14) treats the rate as a nominal annual rate compounded monthly with end-of-month deposits:
    // year 1 is 23,115.49 and year 10 is 193,181.42. This calculator takes an annual return, so the equivalent is (1 + 0.07/12)^12 - 1.
    const effective = String(((1 + 0.07 / 12) ** 12 - 1) * 100);
    const one = investment({ initialAmount: "10000", years: "1", annualReturnPct: effective });
    expect(one.finalBalance).toBeCloseTo(23115.49, 1);
    const ten = investment({ initialAmount: "10000", years: "10", annualReturnPct: effective });
    expect(ten.finalBalance).toBeCloseTo(193181.42, 1);
    expect(ten.contributed).toBe(120000);
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
  // IRS Publication 505, 2026 Schedule X for a single filer (standard deduction 16,100), as an independent reference.
  const fedSingle = (gross: number) => {
    const t = Math.max(0, gross - 16100);
    if (t <= 12400) return t * 0.1;
    if (t <= 50400) return 1240 + (t - 12400) * 0.12;
    if (t <= 105700) return 5800 + (t - 50400) * 0.22;
    if (t <= 201775) return 17966 + (t - 105700) * 0.24;
    return 41024 + (t - 201775) * 0.32;
  };
  const roth = (over: Record<string, string> = {}) => result("RothConversionCalculator", { amountToConvert: "100000", currentIncome: "50000",
    retirementTaxRatePct: "22", yearsToGrow: "20", expectedReturnPct: "7", inflationPct: "0", state: "fl", filing: "single", payTaxFrom: "converted", ...over });
  it("Roth conversion tax is the extra federal tax when the conversion is stacked on current income, across brackets", () => {
    const r = roth();
    expect(r.conversionTax).toBeCloseTo(fedSingle(150000) - fedSingle(50000), 6); // 24,734 - 3,820 = 20,914
    expect(r.convState).toBe(0);
    expect(r.effectiveCurrentRate).toBeCloseTo(0.20914, 6);
  });
  it("Roth paid from the converted funds: the break-even retirement rate is the effective conversion rate", () => {
    const r = roth({ expectedReturnPct: "5" });
    expect(r.breakEvenRate).toBeCloseTo(r.effectiveCurrentRate, 10);
    const growth = 1.05 ** 20;
    expect(r.rothFinal).toBeCloseTo((100000 - r.conversionTax) * growth, 4);
    expect(r.tradFinal).toBeCloseTo(100000 * growth * 0.78, 4);
    // At a retirement rate equal to the break-even rate the two paths are equal.
    const even = roth({ expectedReturnPct: "5", retirementTaxRatePct: String(r.effectiveCurrentRate * 100) });
    expect(even.difference).toBeCloseTo(0, 4);
  });
  it("Roth paid from outside savings: the preserved cash is taxed each year at 15% federal plus the state rate", () => {
    const r = roth({ amountToConvert: "10000", expectedReturnPct: "7", yearsToGrow: "10" });
    const T = r.conversionTax;
    const rr = roth({ amountToConvert: "10000", expectedReturnPct: "7", yearsToGrow: "10", payTaxFrom: "outside" });
    expect(rr.drag).toBeCloseTo(0.15, 10); // Florida has no income tax
    expect(rr.rothFinal).toBeCloseTo(10000 * 1.07 ** 10, 4);
    expect(rr.sideAccountFinal).toBeCloseTo(T * (1 + 0.07 * 0.85) ** 10, 4);
    expect(rr.tradFinal).toBeCloseTo(10000 * 1.07 ** 10 * 0.78 + T * (1 + 0.07 * 0.85) ** 10, 4);
    // The break-even rate in this mode compares the Roth growth to the taxable side account.
    expect(rr.breakEvenRate).toBeCloseTo(rr.effectiveCurrentRate * ((1 + 0.07 * 0.85) ** 10 / 1.07 ** 10), 10);
  });
  it("Roth conversion state tax: taxed in California, not taxed where retirement income is exempt, and state drag is added to the federal drag", () => {
    expect(roth({ state: "ca" }).convState).toBeGreaterThan(0);
    expect(roth({ state: "pa" }).convState).toBe(0);
    const ca = roth({ state: "ca", payTaxFrom: "outside" });
    expect(ca.drag).toBeGreaterThan(0.15);
    expect(ca.drag).toBeLessThan(0.3);
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
