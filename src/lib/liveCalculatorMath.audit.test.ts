import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { solveMaxHomePrice } from "./housing";
import { CONTRIBUTION_LIMITS_2026 } from "./taxYear2026";
import { EMPLOYEE_401K_LIMIT, estimateNetBreakdown } from "./wageTax";

// Audit harness: execute the actual component-local functions without moving or
// editing production code. Imports and the React component are not executed.
function componentFunctions(file: string, names: string[], globals: Record<string, unknown> = {}, memoName?: string) {
  const source = readFileSync(new URL(`../components/${file}.tsx`, import.meta.url), "utf8");
  const ast = ts.createSourceFile(`${file}.tsx`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = ast.statements.filter(node =>
    ts.isVariableStatement(node) || (ts.isFunctionDeclaration(node) && !node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)));
  let memo = "";
  if (memoName) {
    function visit(node: ts.Node) {
      if (ts.isVariableDeclaration(node) && node.name.getText(ast) === memoName && node.initializer && ts.isCallExpression(node.initializer)
        && node.initializer.expression.getText(ast) === "useMemo") {
        memo = `\nconst auditMemo = ${node.initializer.arguments[0].getText(ast)};`;
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    if (!memo) throw new Error(`Missing ${file}.${memoName}`);
  }
  const code = declarations.map(node => node.getText(ast)).join("\n") + memo + `\n({${names.join(",")}})`;
  return runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText,
    { process: { env: {} }, CONTRIBUTION_LIMITS_2026, EMPLOYEE_401K_LIMIT, estimateNetBreakdown, ...globals });
}

describe("live calculator mathematical observations (not a full-page certification)", () => {
  it("executes FIRE mode and calculation functions, recording independent references", () => {
    const fire = componentFunctions("FireCalculator", ["defaultsForMode", "modeFromPathname", "simulateYearsToFI", "calcCoastFireNumber", "buildProjection", "calcEmployerMatch"]);
    const base = { ...fire.defaultsForMode("standard", 100000), currentPortfolio: 0, expensesMonthly: 4000, k401Pct: 0,
      yearlyInvestment: 12000, inflationPct: 0, salaryGrowthPct: 0, maxYears: 1, brokerageTaxMode: "drag", brokerageTaxDragPct: 0 };
    const rows: Array<{ check: string; reference: number | string; actual: number | string }> = [];
    const add = (check: string, reference: number | string, actual: number | string) => rows.push({ check, reference, actual });
    for (const mode of ["standard", "lean", "barista", "coast"]) {
      add(`${mode}: explicit $12k contribution, zero starting balance, one year`, 12000, fire.simulateYearsToFI(base, 80000, mode).endPortfolio);
    }
    const auto = { ...base, yearlyInvestment: 0, baristaPartTimeIncome: 24000 };
    add("Standard: automatic contribution $80k net less $48k spending", 32000, fire.simulateYearsToFI(auto, 80000, "standard").endPortfolio);
    add("Barista: $32k saving plus $24k extra after-tax part-time income earned from today (owner decision)", 56000, fire.simulateYearsToFI(auto, 80000, "barista").endPortfolio);
    const coast = { ...base, age: 40, coastAge: 40, targetRetirementAge: 65, inflationPct: 2.5, volatility: "moderate", phase2StartsYear: 200 };
    add("Coast target: $48k spending, 4% SWR, 25y, 7% nominal, 2.5% inflation", 1200000 * (1.025 / 1.07) ** 25, fire.calcCoastFireNumber(coast));
    add("Coast target: same scenario, zero inflation", 1200000 / 1.07 ** 25, fire.calcCoastFireNumber({ ...coast, inflationPct: 0 }));
    add("Already FI: 1.2m spendable, 48k spending, 4%", 0, fire.simulateYearsToFI({ ...base, currentPortfolio: 1200000 }, 80000, "standard").yearsToFI);
    add("Employer match: 100k salary, 6k contribution, 50% to 6%", 3000, fire.calcEmployerMatch({ ...base, advanced: true, contrib401k: 6000, employerMatchPct: 50, employerMatchCapPct: 6 }));
    for (const route of ["fire-calculator", "fire-number-calculator", "lean-fire-calculator", "barista-fire-calculator", "coast-fire-calculator", "chubby-fire-calculator", "fat-fire-calculator", "savings-rate-for-fire"]) {
      const mode = fire.modeFromPathname(`/${route}`);
      const defaults = fire.defaultsForMode(mode, 100000);
      add(`${route}: mode / default monthly spending`, `${mode} / ${defaults.expensesMonthly}`, `${mode} / ${defaults.expensesMonthly}`);
    }
    for (const state of ["fl", "nc", "ny", "ca"] as const) {
      for (const salary of [50000, 100000, 150000, 250000]) {
        const net = estimateNetBreakdown({ grossAnnual: salary, state, filing: "single", k401Pct: 0 }).net;
        for (const mode of ["standard", "lean", "coast", "barista"]) {
          const scenario = { ...auto, income: salary, state, expensesMonthly: 4000 };
          add(`${state} ${salary} ${mode}: first-year cash-flow contribution`, Math.max(0, net - 48000), fire.simulateYearsToFI(scenario, net, mode).endPortfolio);
        }
      }
    }
    console.log(JSON.stringify(rows, null, 2));
    expect(rows).toHaveLength(82);
    for (const row of rows) if (typeof row.actual === "number") expect(Number.isFinite(row.actual)).toBe(true);
    // Regression guards for defects fixed after the first review: these must keep matching their references.
    for (const row of rows) {
      if (/explicit $12k|^Coast target|^Standard: automatic|^Employer match|^Already FI/.test(row.check) && typeof row.actual === "number") {
        expect(row.actual).toBeCloseTo(row.reference as number, 4);
      }
    }
  });

  it("checks standalone accumulation, withdrawal, RMD and housing functions", () => {
    const k = componentFunctions("Retirement401kCalculator", ["projectBalance", "employeeLimitForAge"]);
    const h = componentFunctions("HsaCalculator", ["projectBalance"]);
    const w = componentFunctions("RetirementWithdrawalCalculator", ["simulate", "solveSafeWithdrawal"]);
    const rmd = componentFunctions("RmdCalculator", ["divisorForAge"]);
    for (const balance of [120000, 240000, 400000, 800000]) {
      expect(k.projectBalance(balance, 12000, 0, 10).finalBalance).toBe(balance + 120000);
      expect(h.projectBalance(balance, 12000, 0, 10).finalBalance).toBe(balance + 120000);
      expect(w.solveSafeWithdrawal(balance, 20, 0)).toBeCloseTo(balance / 20, 5);
      expect(w.simulate(balance, balance / 20, 0).years).toBe(20);
      expect(rmd.divisorForAge(75)).toBe(24.6);
    }
    const zero = solveMaxHomePrice({ grossMonthly: 10000, downPct: 20, annualRate: 0, termYears: 10,
      propertyTaxRate: 0, insuranceMonthly: 0, hoaMonthly: 0, targetDTI: 28 });
    console.log("Housing affordability at 0%: expected $420000; actual", zero);
    expect(Number.isFinite(zero)).toBe(true);
  });

  it("executes the 401k component result calculation with a capped employee contribution", () => {
    const calculator = componentFunctions("Retirement401kCalculator", ["auditMemo"], {
      nz: (value: string) => Number(value) || 0, salary: "500000", yourContribPct: "50", employerMatchPct: "100", employerCapPct: "6",
      age: "40", retirementAge: "41", expectedReturnPct: "0", inflationPct: "0", adjustForInflation: false,
      state: "fl", filing: "single", currentBalance: "0", viewMode: "average", volatility: 0,
    }, "results");
    const result = calculator.auditMemo();
    console.log("401k capped match", { employee: result.yourContrib, referenceMatch: result.yourContrib, actualMatch: result.employerContrib });
    expect(result.yourContrib).toBe(24500);
    expect(Number.isFinite(result.employerContrib)).toBe(true);
  });
});
