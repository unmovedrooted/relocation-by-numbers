import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { estimateNetAnnual, EMPLOYEE_401K_LIMIT } from "./wageTax";
import { monthlyDepositFactor } from "./depositTiming";
import { citiesForState, findCity } from "./cities";

const source = readFileSync(new URL("../components/FireCalculator.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("fire.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = ast.statements.filter(n => ts.isVariableStatement(n) ||
  (ts.isFunctionDeclaration(n) && !n.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)));
const names = ["defaultsForMode", "modeFromPathname", "presetFromPathname", "initBuckets", "growBuckets", "calcCoastFireNumber",
  "simulateYearsToCoast", "simulateYearsToFI", "buildProjection", "calcSpendableFromBuckets", "makeNetPath", "buildDecisionEngine",
  "coastTargetAtYear", "buildMovedScenario", "applyMoveCost", "seedAdvancedFromSimple", "savingsRateOf", "inputsForSavingsRate",
  "simpleDeferralForYear", "moveCostShortfall"];
const fire = runInNewContext(ts.transpileModule(declarations.map(n => n.getText(ast)).join("\n") + `\n({${names}})`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText,
  { process: { env: {} }, estimateNetAnnual, EMPLOYEE_401K_LIMIT, monthlyDepositFactor, citiesForState, findCity });
const base = () => ({ ...fire.defaultsForMode("standard", 100000), state: "", k401Pct: 0, currentPortfolio: 10000,
  yearlyInvestment: 12000, expensesMonthly: 4000, inflationPct: 0, salaryGrowthPct: 0, brokerageTaxMode: "drag",
  brokerageTaxDragPct: 0, phase2StartsYear: 200, maxYears: 30, moveCompareOn: false });

describe("FIRE independent reference audit", () => {
  it.each([
    ["fire-calculator", "standard", 4000], ["fire-number-calculator", "standard", 4000],
    ["lean-fire-calculator", "lean", 2500], ["barista-fire-calculator", "barista", 5000],
    ["coast-fire-calculator", "coast", 4000], ["chubby-fire-calculator", "standard", 10000],
    ["fat-fire-calculator", "standard", 20000], ["savings-rate-for-fire", "standard", 4000],
  ])("route %s uses mode %s and spending %s", (route, mode, spending) => {
    expect(fire.modeFromPathname(`/${route}`)).toBe(mode);
    expect(fire.defaultsForMode(mode, 0, fire.presetFromPathname(`/${route}`)).expensesMonthly).toBe(spending);
    const page = readFileSync(new URL(`../app/${route}/page.tsx`, import.meta.url), "utf8");
    expect(page).toContain("<FireCalculator");
  });
  for (const mode of ["standard", "lean", "barista", "coast"]) {
    for (const inflation of [0, 2.5]) {
      it(`${mode}, inflation ${inflation}: independent monthly ledger and first FI crossing`, () => {
        const i = { ...base(), inflationPct: inflation, coastAge: 40, age: 30 };
        let balance = i.currentPortfolio;
        let crossing: number | null = null;
        const spending = mode === "barista" ? 24000 : 48000;
        const mr = 1.07 ** (1 / 12) - 1;
        for (let y = 1; y <= i.maxYears; y++) {
          const contribution = mode === "coast" && 30 + y - 1 >= 40 ? 0 : 1000;
          for (let m = 0; m < 12; m++) balance = balance * (1 + mr) + contribution;
          if (balance >= spending * (1 + inflation / 100) ** y / .04) { crossing = y; break; }
        }
        const actual = fire.simulateYearsToFI(i, 80000, mode);
        expect(actual.endPortfolio).toBeCloseTo(balance, 5);
        expect(actual.yearsToFI).toBe(crossing);
        const chart = fire.buildProjection(i, 80000, actual.yearsToFI, mode);
        const end = chart[crossing ?? i.maxYears];
        expect(end.portfolio).toBeCloseTo(balance, 5);
      });
    }
  }
  it("advanced bucket growth and withdrawal haircut match a monthly ledger", () => {
    const i = { ...base(), advanced: true, currentPortfolio: 0, yearlyInvestment: 0,
      bal401k: 100000, balIra: 20000, balBrokerage: 30000, contrib401k: 6000, contribIra: 3000, contribBrokerage: 12000,
      employerMatchPct: 50, employerMatchCapPct: 6, withdrawalTaxRatePct: 20, brokerageTaxDragPct: 1 };
    const b = fire.initBuckets(i, 80000);
    expect(b.employerMatch).toBe(3000);
    const actual = fire.growBuckets(b.start, i, 0, b.annualContrib, b.employerMatch, false, 0);
    const ledger = (start: number, annual: number, rate: number) => {
      for (let m = 0; m < 12; m++) start = start * (1 + rate) ** (1 / 12) + annual / 12;
      return start;
    };
    expect(actual.b401k).toBeCloseTo(ledger(100000, 9000, .07), 6);
    expect(actual.bIra).toBeCloseTo(ledger(20000, 3000, .07), 6);
    expect(actual.bBrokerage).toBeCloseTo(ledger(30000, 12000, .06), 6);
    expect(fire.calcSpendableFromBuckets(i, actual)).toBeCloseTo(.8 * (actual.b401k + actual.bIra) + actual.bBrokerage, 8);
  });
  it("already-FI, impossible growth horizon, and zero expenses", () => {
    expect(fire.simulateYearsToFI({ ...base(), currentPortfolio: 1200000 }, 80000).yearsToFI).toBe(0);
    expect(fire.simulateYearsToFI({ ...base(), currentPortfolio: 0, yearlyInvestment: 0 }, 0).yearsToFI).toBeNull();
    expect(fire.simulateYearsToFI({ ...base(), currentPortfolio: 0, expensesMonthly: 0 }, 0).yearsToFI).toBe(0);
  });
  it.each(["conservative", "moderate", "aggressive"])("phase transition and brokerage drag: %s", volatility => {
    const presets = { conservative: [5, 4], moderate: [7, 5.5], aggressive: [9, 7] };
    const rates = presets[volatility as keyof typeof presets];
    const i = { ...base(), volatility, phase2StartsYear: 2, maxYears: 4, brokerageTaxDragPct: .5 };
    let expected = 10000;
    for (let y = 0; y < 4; y++) {
      const monthly = (1 + (rates[y < 2 ? 0 : 1] - .5) / 100) ** (1 / 12) - 1;
      for (let m = 0; m < 12; m++) expected = expected * (1 + monthly) + 1000;
    }
    expect(fire.simulateYearsToFI(i, 80000).endPortfolio).toBeCloseTo(expected, 6);
  });
  it("seeded bounded scenarios: more starting capital never delays FI", () => {
    let seed = 1729;
    const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    for (let n = 0; n < 100; n++) {
      const i = { ...base(), currentPortfolio: random() * 500000, yearlyInvestment: random() * 50000,
        expensesMonthly: 1000 + random() * 4000, inflationPct: random() * 4 };
      const a = fire.simulateYearsToFI(i, 80000);
      const b = fire.simulateYearsToFI({ ...i, currentPortfolio: i.currentPortfolio + 100000 }, 80000);
      expect(b.yearsToFI ?? Infinity).toBeLessThanOrEqual(a.yearsToFI ?? Infinity);
      expect(Number.isFinite(a.endPortfolio)).toBe(true);
    }
  });
});

describe("FIRE deep-audit findings, corrected", () => {
  it("Coast target is dated at the coast age and inflates spending from today", () => {
    const i = { ...base(), age: 30, coastAge: 40, targetRetirementAge: 65, inflationPct: 2.5 };
    // Needed at age 40: 48000 * 1.025^35 / .04 / 1.07^25 = 524,713.32 (the audit's known answer).
    expect(fire.calcCoastFireNumber(i)).toBeCloseTo(48000 * 1.025 ** 35 / 0.04 / 1.07 ** 25, 6);
    expect(fire.calcCoastFireNumber(i)).toBeCloseTo(524713.32, 1);
    // Needed today: the same retirement target discounted over all 35 years.
    expect(fire.coastTargetAtYear(i, 0)).toBeCloseTo(48000 * 1.025 ** 35 / 0.04 / 1.07 ** 35, 6);
    // The requirement is always the retirement target at the retirement age.
    expect(fire.coastTargetAtYear(i, 35)).toBeCloseTo(48000 * 1.025 ** 35 / 0.04, 6);
  });
  it("Coast readiness is null when the retirement target cannot be reached before the retirement age", () => {
    const i = { ...base(), currentPortfolio: 1000, yearlyInvestment: 0, age: 30, coastAge: 30, targetRetirementAge: 31,
      expensesMonthly: 100, maxYears: 80 };
    expect(fire.simulateYearsToCoast(i, 0)).toBeNull();
  });
  it("Coast readiness is the first year the balance meets that year's dated target", () => {
    const i = { ...base(), age: 30, coastAge: 45, targetRetirementAge: 65, currentPortfolio: 100000, yearlyInvestment: 20000,
      inflationPct: 0, expensesMonthly: 3000 };
    const years = fire.simulateYearsToCoast(i, 80000);
    expect(years).not.toBeNull();
    // Rebuild the balance month by month and confirm the crossing year independently.
    let balance = 100000;
    let first = -1;
    for (let y = 0; y <= 35; y++) {
      if (balance >= fire.coastTargetAtYear(i, y)) { first = y; break; }
      balance = balance * 1.07 + (y + 30 < 45 ? 20000 * monthlyDepositFactor(0.07) : 0);
    }
    expect(years).toBe(first);
  });
  it("simple 401(k) deferral credited to investments equals the deferral removed from take-home pay, every year", () => {
    const i = { ...base(), state: "fl", income: 500000, k401Pct: 10, salaryGrowthPct: 0, inflationPct: 3 };
    for (const y of [0, 5, 10, 20]) {
      const expected = Math.min(50000, EMPLOYEE_401K_LIMIT * 1.03 ** y);
      expect(fire.simpleDeferralForYear(i, y)).toBeCloseTo(expected, 8);
      const b = fire.initBuckets(i, 0);
      const out = fire.growBuckets({ b401k: 0, bIra: 0, bBrokerage: 0 }, i, y, b.annualContrib, 0, false, 0);
      expect(out.b401k / monthlyDepositFactor(.07)).toBeCloseTo(expected, 6);
    }
    expect(fire.simpleDeferralForYear(i, 10)).toBeCloseTo(32925.95, 1);
    // No state selected: no tax is modelled, so no deferral is saved either.
    expect(fire.simpleDeferralForYear({ ...i, state: "" }, 5)).toBe(0);
  });
  it("advanced mode keeps an explicit zero brokerage balance; switching Advanced on copies the simple values once", () => {
    const i = { ...base(), advanced: true, currentPortfolio: 75000, bal401k: 75000, balIra: 0, balBrokerage: 0 };
    const b = fire.initBuckets(i, 0);
    expect(b.start.b401k + b.start.bBrokerage).toBe(75000);
    const seeded = fire.seedAdvancedFromSimple({ ...base(), advanced: true, currentPortfolio: 75000, yearlyInvestment: 12000, balBrokerage: 0, contribBrokerage: 0 });
    expect(seeded.balBrokerage).toBe(75000);
    expect(seeded.contribBrokerage).toBe(12000);
    // Already-entered values are never overwritten.
    expect(fire.seedAdvancedFromSimple({ ...base(), advanced: true, currentPortfolio: 75000, balBrokerage: 5000 }).balBrokerage).toBe(5000);
  });
  it("a moving cost is paid from taxable savings, then the IRA, then the 401(k), and a shortfall is reported", () => {
    const i = { ...base(), advanced: true, balBrokerage: 30000, balIra: 20000, bal401k: 50000 };
    expect(fire.applyMoveCost(i, 30000)).toMatchObject({ balBrokerage: 0, balIra: 20000, bal401k: 50000 });
    expect(fire.applyMoveCost(i, 60000)).toMatchObject({ balBrokerage: 0, balIra: 0, bal401k: 40000 });
    expect(fire.moveCostShortfall({ ...i, movedCost: 100000 })).toBe(0);
    expect(fire.moveCostShortfall({ ...i, movedCost: 130000 })).toBe(30000);
    expect(fire.applyMoveCost({ ...base(), currentPortfolio: 10000 }, 25000).currentPortfolio).toBe(0);
  });
  it("the move recommendation uses the moved income, taxes and moving cost", () => {
    const i = { ...base(), moveCompareOn: true, movedExpensesMonthly: 2000, movedIncome: 100000,
      movedState: "fl", movedCost: 0, currentPortfolio: 50000, yearlyInvestment: 0 };
    const a = fire.buildDecisionEngine(i, "standard", 80000);
    const worse = fire.buildDecisionEngine({ ...i, movedIncome: 1000, movedState: "ny", movedCost: 1000000 }, "standard", 80000);
    expect(worse).not.toEqual(a);
    // The scenario evaluator is the same one the move card uses.
    const moved = fire.buildMovedScenario({ ...i, movedIncome: 1000, movedState: "ny", movedCost: 1000000 });
    expect(moved.inputs.currentPortfolio).toBe(0);
    expect(moved.inputs.income).toBe(1000);
    expect(moved.inputs.expensesMonthly).toBe(2000);
    expect(moved.net(0)).toBeLessThan(1000);
  });
  it("an extra-investment scenario changes advanced-mode results too", () => {
    const i = { ...base(), advanced: true, balBrokerage: 10000, contribBrokerage: 12000, maxYears: 1 };
    const before = fire.simulateYearsToFI(i, 80000);
    const after = fire.simulateYearsToFI({ ...i, scenarioExtraSaving: 5000 }, 80000);
    expect(after.endPortfolio).toBeGreaterThan(before.endPortfolio);
    // One year, 7%, monthly deposits: exactly the extra 5,000 times the deposit factor.
    expect(after.endPortfolio - before.endPortfolio).toBeCloseTo(5000 * monthlyDepositFactor(.07), 6);
  });
  it("the savings rate table rows impose their rate in automatic, explicit and advanced saving", () => {
    const simpleAuto = { ...base(), yearlyInvestment: 0, expensesMonthly: 3000 };
    const net = 80000;
    const info = fire.savingsRateOf(simpleAuto, net, "standard");
    expect(info.rate).toBeCloseTo((net - 36000) / net, 8);
    const explicit = { ...simpleAuto, yearlyInvestment: 10000 };
    expect(fire.savingsRateOf(explicit, net, "standard").rate).toBeCloseTo(10000 / net, 8);
    const row = fire.inputsForSavingsRate(explicit, 0.3 * net, 0);
    expect(row.yearlyInvestment).toBeCloseTo(0.3 * net, 8);
    const adv = { ...simpleAuto, advanced: true, contrib401k: 5000, contribIra: 2000, contribBrokerage: 1000 };
    expect(fire.inputsForSavingsRate(adv, 0.3 * net, 0).contribBrokerage).toBeCloseTo(0.3 * net - 7000, 8);
  });
  it("a fractional horizon runs and charts the same whole number of years", () => {
    const i = { ...base(), maxYears: 1.5 };
    const result = fire.simulateYearsToFI(i, 80000);
    const chart = fire.buildProjection(i, 80000, result.yearsToFI);
    expect(chart).toHaveLength(3);
    expect(result.endPortfolio).toBeCloseTo(chart[2].portfolio, 6);
  });
});
