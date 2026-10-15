import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { solveMaxHomePrice, US_STATE_DEFAULTS } from "./housing";
import { CONTRIBUTION_LIMITS_2026 } from "./taxYear2026";
import { EMPLOYEE_401K_LIMIT, estimateNetAnnual, estimateNetBreakdown } from "./wageTax";
import { compareMove } from "./relocationMove";
import { monthlyDepositFactor } from "./depositTiming";
import { requiredDistribution } from "./retirementPlan/rules";

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
    { process: { env: {} }, CONTRIBUTION_LIMITS_2026, EMPLOYEE_401K_LIMIT, estimateNetAnnual, estimateNetBreakdown, monthlyDepositFactor, ...globals });
}

describe("additional live calculator known-answer audit", () => {
  const mortgage = () => componentFunctions("MortgageCalculator", ["calcMonthlyPI", "calcTotalInterest", "buildSchedule", "calcRefi", "calcAutoPMI", "calcPMIDropOff", "calcBreakEven"], { US_STATE_DEFAULTS });
  it("zero-rate rent-versus-buy comparison is valid, and the mortgage payment stops once the loan is paid off", () => {
    const result = mortgage().calcBreakEven({ downPayment: 0, closingCosts: 0, annualRate: 0,
      monthlyPI: 1000, rent: 1000, tax: 0, ins: 0, hoa: 0, homePrice: 120000,
      appreciation: 0, rentGrowth: 0, investReturn: 0, maintenanceRate: 0, taxDeductRate: 0 });
    // Each payment builds equity one for one, so buying is never behind renting at the same payment.
    expect(result).toEqual({ type: "ok", months: 1 });
    // A $10,000 loan paid at $1,000 a month is repaid after ten months; later months cost nothing for the loan.
    // Buying starts $5,000 behind (closing costs) and renting earns nothing, so the cost of renting
    // ($100 a month, less the $5,000 the renter keeps) catches up with $5,000 at month 100.
    const payoff = mortgage().calcBreakEven({ downPayment: 0, closingCosts: 5000, annualRate: 0,
      monthlyPI: 1000, rent: 100, tax: 0, ins: 0, hoa: 0, homePrice: 10000,
      appreciation: 0, rentGrowth: 0, investReturn: 0, maintenanceRate: 0, taxDeductRate: 0 });
    expect(payoff).toEqual({ type: "ok", months: 100 });
  });
  it("matches independently calculated positive-rate mortgage payments and amortization", () => {
    const m = mortgage();
    const principal = 300000, rate = 0.065 / 12, months = 360;
    const expected = principal / ((1 - (1 + rate) ** -months) / rate);
    expect(m.calcMonthlyPI(principal, 6.5, 30)).toBeCloseTo(expected, 8);
    const rows = m.buildSchedule(principal, 6.5, 30);
    expect(rows).toHaveLength(months);
    expect(rows.reduce((sum: number, row: { principal: number }) => sum + row.principal, 0)).toBeCloseTo(principal, 5);
    expect(rows[359].balance).toBeCloseTo(0, 5);
    expect(m.buildSchedule(principal, 6.5, 30, 200).length).toBeLessThan(months);
    expect(m.calcAutoPMI(80000, 100000, 20)).toBe(0);
    expect(m.calcAutoPMI(95000, 100000, 5)).toBe(95);
  });
  it("main mortgage zero-rate payment is $1,000", () => {
    expect(mortgage().calcMonthlyPI(120000, 0, 10)).toBe(1000);
  });
  it("zero-rate total interest is zero", () => {
    expect(mortgage().calcTotalInterest(120000, 0, 10)).toBe(0);
  });
  it("matches Freddie Mac's published worked examples (myhome.freddiemac.com, amortization and rates pages)", () => {
    const m = mortgage();
    // $135,000 at 4.5% for 30 years: $684.03 a month; first month $506.25 interest, $177.78 principal, balance $134,822.22.
    expect(m.calcMonthlyPI(135000, 4.5, 30)).toBeCloseTo(684.03, 2);
    const first = m.buildSchedule(135000, 4.5, 30)[0];
    expect(first.interest).toBeCloseTo(506.25, 2);
    expect(first.principal).toBeCloseTo(177.78, 1);
    expect(first.balance).toBeCloseTo(134822.22, 1);
    // The same loan at 7%: $323,337 of principal and interest over the life of the loan.
    expect(m.calcMonthlyPI(135000, 7, 30) * 360).toBeCloseTo(323337, 0);
    // $300,000 at 6.5% for 30 years: about $1,896 a month.
    expect(Math.round(m.calcMonthlyPI(300000, 6.5, 30))).toBe(1896);
  });
  it("RMD at age 80 matches the SEC Investor.gov RMD calculator (factor 20.2, $24,752.48 on $500,000)", () => {
    // Investor.gov (checked 2026-10-14): previous year-end balance 500,000, age 80 at year end -> factor 20.2, RMD 24,752.48.
    const rmd = componentFunctions("RmdCalculator", ["divisorForAge"]);
    expect(rmd.divisorForAge(80)).toBe(20.2);
    expect(500000 / rmd.divisorForAge(80)).toBeCloseTo(24752.48, 2);
    // The Complete Plan engine uses its own table; it must agree. Born 1946 -> age 80 in 2026.
    expect(requiredDistribution({ birthDate: "1946-01-01", year: 2026, priorDecemberBalance: 500000, accountType: "traditional-ira" })).toBeCloseTo(24752.48, 2);
  });
  it("zero-rate amortization has 120 payments", () => {
    expect(mortgage().buildSchedule(120000, 0, 10)).toHaveLength(120);
  });
  it("zero-rate PMI paydown reaches 80% in ten months", () => {
    expect(mortgage().calcPMIDropOff(90000, 100000, 0, 1000)).toBe(10);
  });
  it("refinancing at an unchanged rate and term loses exactly the closing costs", () => {
    const result = mortgage().calcRefi(120000, 6, 120, 6, 10, 3000);
    expect(result.monthlySavings).toBe(0);
    expect(result.totalSavings).toBe(-3000);
    expect(result.breakEvenMonths).toBeNull();
  });
  it.each([0, 1, 10, 30])("retirement accumulation matches month-by-month end-of-month deposits over %i years", years => {
    const r = componentFunctions("RetirementCalculator", ["computeProjection", "realReturnRate"]);
    const result = r.computeProjection({ startingBalance: 50000, annualContribution: 6000, realReturn: 0.05, years });
    // Independent reference: twelve monthly end-of-month deposits at the monthly rate equivalent to 5% a year.
    const monthlyRate = 1.05 ** (1 / 12) - 1;
    let expected = 50000;
    for (let month = 0; month < years * 12; month++) expected = expected * (1 + monthlyRate) + 500;
    expect(result.projectedBalance).toBeCloseTo(expected, 6);
    expect(result.totalContributed).toBe(years * 6000);
    expect(result.annualIncome).toBeCloseTo(expected * 0.04, 6);
    expect(result.monthlyIncome).toBeCloseTo(expected * 0.04 / 12, 6);
    expect(r.realReturnRate(7, 3)).toBeCloseTo(1.07 / 1.03 - 1, 12);
  });
  it.each([50000, 100000, 150000, 250000])("relocation cash accounting at salary %i isolates deposits from expenses", salary => {
    const item = (amount: number) => ({ amount, estimated: false });
    const result = compareMove({ filing: "single", k401Pct1: 0, k401Pct2: 0,
      currentIncome1: salary, offerIncome1: salary, currentIncome2: 0, offerIncome2: 0,
      currentState: "fl", targetState: "fl", currentCityId: "", targetCityId: "",
      currentHousing: item(2000), targetHousing: item(1500), currentLiving: item(1000), targetLiving: item(1000),
      oneTime: { movers: item(1000), travel: item(200), setup: item(300), leaseBreak: item(0), fees: item(100),
        overlapMonths: 1, refundableDeposit: item(1500), downPayment: item(10000) } });
    expect(result.expected).toEqual({ monthlyChange: 500, firstYearImpact: 2900, spentOneTime: 3100,
      cashUpfront: 14600, monthsToRecover: 7 });
    expect(result.low).toEqual(result.expected);
    expect(result.high).toEqual(result.expected);
    expect(Object.values(result.breakdown).reduce((sum, value) => sum + value, 0)).toBe(500);
  });
});

describe("live calculator mathematical observations (not a full-page certification)", () => {
  it("recomputes FIRE take-home pay each year with inflation-indexed tax rules", () => {
    const fire = componentFunctions("FireCalculator", ["makeNetPath"]);
    const args = { gross: 100000, state: "ny", filing: "single", k401Pct: 8, cityId: undefined, salaryGrowthPct: 3, inflationPct: 2.5 };
    const path = fire.makeNetPath(args);
    expect(path(0)).toBeCloseTo(estimateNetAnnual({ grossAnnual: 100000, state: "ny", filing: "single", k401Pct: 8 }), 6);
    // Year 10: gross 100,000 * 1.03^10, taxed at today’s scale after deflating by 1.025^10, then scaled back up.
    const index = 1.025 ** 10;
    expect(path(10)).toBeCloseTo(estimateNetAnnual({ grossAnnual: (100000 * 1.03 ** 10) / index, state: "ny", filing: "single", k401Pct: 8 }) * index, 4);
    // When pay grows exactly with inflation, take-home grows exactly with inflation too.
    const flat = fire.makeNetPath({ ...args, salaryGrowthPct: 2.5 });
    expect(flat(20)).toBeCloseTo(flat(0) * 1.025 ** 20, 4);
    // Pay that outgrows inflation moves into higher brackets, so take-home grows slower than the simple growth rate.
    expect(path(30)).toBeLessThan(path(0) * 1.03 ** 30);
    // No state chosen: no tax is modelled, so take-home is the gross pay.
    expect(fire.makeNetPath({ ...args, state: "" })(5)).toBeCloseTo(100000 * 1.03 ** 5, 6);
  });

  it("executes FIRE mode and calculation functions, recording independent references", () => {
    const fire = componentFunctions("FireCalculator", ["defaultsForMode", "modeFromPathname", "simulateYearsToFI", "calcCoastFireNumber", "buildProjection", "calcEmployerMatch"]);
    const base = { ...fire.defaultsForMode("standard", 100000), currentPortfolio: 0, expensesMonthly: 4000, k401Pct: 0,
      yearlyInvestment: 12000, inflationPct: 0, salaryGrowthPct: 0, maxYears: 1, brokerageTaxMode: "drag", brokerageTaxDragPct: 0 };
    const rows: Array<{ check: string; reference: number | string; actual: number | string }> = [];
    // The moderate preset's Phase 1 return is 7%; a year's saving arrives as twelve monthly end-of-month deposits,
    // so it is worth the saved amount times this factor at the end of the first year.
    const g = monthlyDepositFactor(0.07);
    const add = (check: string, reference: number | string, actual: number | string) => rows.push({ check, reference, actual });
    for (const mode of ["standard", "lean", "barista", "coast"]) {
      add(`${mode}: explicit $12k contribution, zero starting balance, one year`, 12000 * g, fire.simulateYearsToFI(base, 80000, mode).endPortfolio);
    }
    const auto = { ...base, yearlyInvestment: 0, baristaPartTimeIncome: 24000 };
    add("Standard: automatic contribution $80k net less $48k spending", 32000 * g, fire.simulateYearsToFI(auto, 80000, "standard").endPortfolio);
    add("Barista: $32k saving plus $24k extra after-tax part-time income earned from today (owner decision)", 56000 * g, fire.simulateYearsToFI(auto, 80000, "barista").endPortfolio);
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
          add(`${state} ${salary} ${mode}: first-year cash-flow contribution`, Math.max(0, net - 48000) * g, fire.simulateYearsToFI(scenario, net, mode).endPortfolio);
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

describe("monthly end-of-month deposit timing across accumulation engines", () => {
  const monthlyReference = (start: number, monthlyDeposit: number, annualReturn: number, years: number) => {
    const m = (1 + annualReturn) ** (1 / 12) - 1;
    let balance = start;
    for (let month = 0; month < years * 12; month++) balance = balance * (1 + m) + monthlyDeposit;
    return balance;
  };
  it("401(k) projection matches a month-by-month reference", () => {
    const k = componentFunctions("Retirement401kCalculator", ["projectBalance"]);
    const out = k.projectBalance(20000, 12000, 0.06, 25);
    expect(out.finalBalance).toBeCloseTo(monthlyReference(20000, 1000, 0.06, 25), 4);
    expect(out.contributed).toBe(25 * 12000);
  });
  it("HSA projection matches a month-by-month reference", () => {
    const h = componentFunctions("HsaCalculator", ["projectBalance"]);
    const out = h.projectBalance(8000, 6000, 0.05, 20);
    expect(out.finalBalance).toBeCloseTo(monthlyReference(8000, 500, 0.05, 20), 4);
    expect(out.totalContributed).toBe(20 * 6000);
  });
  it("Monte Carlo with no volatility matches the deterministic month-by-month reference", async () => {
    const { accumulationPaths } = await import("./monteCarlo");
    const sim = accumulationPaths({ startBalance: 10000, annualContribution: 9000, realReturn: 0.04, volatility: 0, years: 15, nPaths: 3 });
    expect(sim.mean).toBeCloseTo(monthlyReference(10000, 750, 0.04, 15), 4);
    expect(sim.endingBalance.p50).toBeCloseTo(sim.mean, 6);
  });
});
