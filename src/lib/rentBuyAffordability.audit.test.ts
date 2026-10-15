import { describe, expect, it } from "vitest";
import { simulateRentVsBuy, type RentVsBuyInput } from "./rentVsBuy";
import { solveMaxHomePrice } from "./housing";

// Independent references for the rent vs buy simulation and the housing affordability solver. The references are written from
// closed-form formulas and do not call the production functions.

const pmtFactor = (annualPct: number, years: number) => {
  const m = annualPct / 100 / 12, n = years * 12;
  return m === 0 ? 1 / n : m / (1 - (1 + m) ** -n);
};
const balanceAfter = (loan: number, annualPct: number, years: number, months: number) => {
  const m = annualPct / 100 / 12;
  const pmt = loan * pmtFactor(annualPct, years);
  return m === 0 ? loan - pmt * months : loan * (1 + m) ** months - pmt * ((1 + m) ** months - 1) / m;
};

const base: RentVsBuyInput = {
  homePrice: 400000, downPct: 20, mortgageRatePct: 6, loanYears: 30, propertyTaxPct: 1, homeInsuranceAnnual: 1800,
  hoaMonthly: 100, maintenancePct: 1, buyClosingPct: 3, appreciationPct: 0, sellingCostPct: 6,
  monthlyRent: 0, rentGrowthPct: 0, rentersInsuranceMonthly: 20, investmentReturnPct: 5, years: 10,
};
// With no appreciation, the buyer's monthly cost is the same every month, so a constant rent can match it exactly.
const buyCost = (i: RentVsBuyInput) => {
  const loan = i.homePrice * (1 - i.downPct / 100);
  return loan * pmtFactor(i.mortgageRatePct, i.loanYears) + i.homePrice * i.propertyTaxPct / 100 / 12
    + i.homeInsuranceAnnual / 12 + i.hoaMonthly + i.homePrice * i.maintenancePct / 100 / 12;
};
const annuityEnd = (deposit: number, annualPct: number, months: number) => {
  const i = (1 + annualPct / 100) ** (1 / 12) - 1; // effective monthly rate
  return deposit * ((1 + i) ** months - 1) / i; // ordinary annuity: deposits at the end of each month
};

describe("rent vs buy against closed-form references", () => {
  it("first-month costs are the payment, tax, insurance, HOA and maintenance, and rent plus renters insurance", () => {
    const i = { ...base, monthlyRent: 2500 };
    const r = simulateRentVsBuy(i);
    expect(r.firstMonthBuyCost).toBeCloseTo(buyCost(i), 6);
    expect(r.firstMonthRentCost).toBeCloseTo(2520, 8);
    expect(r.downPayment).toBe(80000);
    expect(r.closingCosts).toBe(12000);
  });

  it("when both cost the same every month, nobody banks a difference", () => {
    const i = { ...base, monthlyRent: buyCost(base) - base.rentersInsuranceMonthly };
    const r = simulateRentVsBuy(i);
    // Renter: the upfront cash grows at the annual investment return. Buyer: sale proceeds after selling costs less the loan.
    expect(r.finalRenter).toBeCloseTo(92000 * 1.05 ** 10, 4);
    expect(r.finalBuyer).toBeCloseTo(400000 * 0.94 - balanceAfter(320000, 6, 30, 120), 4);
  });

  it("a renter who pays less banks the difference at the end of each month", () => {
    const d = 200;
    const i = { ...base, monthlyRent: buyCost(base) - base.rentersInsuranceMonthly - d };
    const r = simulateRentVsBuy(i);
    expect(r.finalRenter).toBeCloseTo(92000 * 1.05 ** 10 + annuityEnd(d, 5, 120), 3);
  });

  it("a buyer who pays less banks the difference at the end of each month", () => {
    const d = 150;
    const i = { ...base, monthlyRent: buyCost(base) - base.rentersInsuranceMonthly + d };
    const r = simulateRentVsBuy(i);
    expect(r.finalBuyer).toBeCloseTo(400000 * 0.94 - balanceAfter(320000, 6, 30, 120) + annuityEnd(d, 5, 120), 3);
  });

  it("stops the mortgage payment once the loan is paid off", () => {
    const i = { ...base, loanYears: 5, years: 10, monthlyRent: 3000 };
    const r = simulateRentVsBuy(i);
    expect(r.finalLoanBalance).toBe(0);
    const pi = 320000 * pmtFactor(6, 5);
    const other = 400000 * 0.01 / 12 + 1800 / 12 + 100 + 400000 * 0.01 / 12;
    expect(r.totalBuyOutOfPocket).toBeCloseTo(92000 + 60 * (pi + other) + 60 * other, 4);
  });

  it("compounds home value, rent and equity as stated", () => {
    const i = { ...base, appreciationPct: 3, monthlyRent: 2500, rentGrowthPct: 4, years: 5 };
    const r = simulateRentVsBuy(i);
    expect(r.finalHomeValue).toBeCloseTo(400000 * 1.03 ** 5, 4);
    expect(r.finalLoanBalance).toBeCloseTo(balanceAfter(320000, 6, 30, 60), 4);
    // Rent steps up once a year: 12 months at each of 2,500, 2,600, 2,704, 2,812.16 and 2,924.65 plus renters insurance.
    let rent = 0, level = 2500;
    for (let y = 0; y < 5; y++) { rent += 12 * (level + 20); level *= 1.04; }
    expect(r.totalRentPaid).toBeCloseTo(rent, 4);
  });

  it("treats a down payment above 100% as a full cash purchase, not extra free money", () => {
    const over = simulateRentVsBuy({ ...base, downPct: 150, monthlyRent: 2500 });
    const full = simulateRentVsBuy({ ...base, downPct: 100, monthlyRent: 2500 });
    expect(over.downPayment).toBe(400000);
    expect(over.finalRenter).toBeCloseTo(full.finalRenter, 6);
    expect(simulateRentVsBuy({ ...base, downPct: -10, monthlyRent: 2500 }).downPayment).toBe(0);
  });
});

// Reference for what a home costs each month, written independently of lib/housing.ts.
function referenceMonthlyTotal(price: number, o: { down: number; rate: number; term: number; tax: number; ins: number; hoa: number; base?: number }) {
  const loan = price * (1 - o.down / 100);
  const pi = loan > 0 ? loan * pmtFactor(o.rate, o.term) : 0;
  const insurance = o.ins * (price / (o.base ?? 400000));
  let pmi = 0;
  if (o.down < 20 && loan > 0) {
    const ltv = loan / price;
    pmi = loan * (ltv > 0.95 ? 0.015 : ltv > 0.9 ? 0.012 : ltv > 0.85 ? 0.009 : 0.007) / 12;
  }
  return pi + price * o.tax / 100 / 12 + insurance + o.hoa + pmi;
}

describe("housing affordability solver against an independent cost function", () => {
  const cases = [
    { income: 60000, down: 20, rate: 6.5, term: 30, tax: 1.1, ins: 140, hoa: 0, dti: 28 },
    { income: 85000, down: 5, rate: 6.5, term: 30, tax: 1.1, ins: 140, hoa: 0, dti: 28 },
    { income: 85000, down: 5, rate: 6.5, term: 30, tax: 1.1, ins: 140, hoa: 0, dti: 31.8 },
    { income: 120000, down: 10, rate: 7, term: 15, tax: 2, ins: 220, hoa: 250, dti: 28 },
    { income: 150000, down: 3, rate: 6, term: 30, tax: 0.6, ins: 100, hoa: 0, dti: 24 },
    { income: 40000, down: 0, rate: 8, term: 20, tax: 1.5, ins: 90, hoa: 120, dti: 28 },
    { income: 250000, down: 25, rate: 5.5, term: 30, tax: 1.3, ins: 300, hoa: 0, dti: 28 },
  ];
  it.each(cases)("price for %o never exceeds the limit, and one more $1,000 would", c => {
    const price = solveMaxHomePrice({ grossMonthly: c.income / 12, downPct: c.down, annualRate: c.rate, termYears: c.term,
      propertyTaxRate: c.tax, insuranceMonthly: c.ins, hoaMonthly: c.hoa, targetDTI: c.dti });
    const o = { down: c.down, rate: c.rate, term: c.term, tax: c.tax, ins: c.ins, hoa: c.hoa };
    const limit = (c.income / 12) * c.dti / 100;
    expect(price % 1000).toBe(0);
    expect(referenceMonthlyTotal(price, o)).toBeLessThanOrEqual(limit + 1e-6);
    expect(referenceMonthlyTotal(price + 1000, o)).toBeGreaterThan(limit);
  });
  it("matches the closed-form price when there is no PMI, insurance or HOA", () => {
    // payment = price * ((1 - down) * factor + tax / 12); the affordable price makes it equal target * gross.
    const income = 96000, down = 20, rate = 6, term = 30, tax = 1.2;
    const closed = (income / 12) * 0.28 / ((1 - down / 100) * pmtFactor(rate, term) + tax / 100 / 12);
    const price = solveMaxHomePrice({ grossMonthly: income / 12, downPct: down, annualRate: rate, termYears: term,
      propertyTaxRate: tax, insuranceMonthly: 0, hoaMonthly: 0, targetDTI: 28 });
    expect(price).toBe(Math.floor(closed / 1000) * 1000);
  });
  it("returns zero when there is no room (debts at or above the back-end limit) or no income", () => {
    expect(solveMaxHomePrice({ grossMonthly: 5000, downPct: 20, annualRate: 6, termYears: 30, propertyTaxRate: 1, insuranceMonthly: 100, hoaMonthly: 0, targetDTI: 0 })).toBe(0);
    expect(solveMaxHomePrice({ grossMonthly: 0, downPct: 20, annualRate: 6, termYears: 30, propertyTaxRate: 1, insuranceMonthly: 100, hoaMonthly: 0 })).toBe(0);
  });
});

// ── The calculator's own result callback (executed, not re-implemented) ───────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { housingCostAtPrice, solveMaxHomePrice as solve } from "./housing";

function affordabilityResults(state: Record<string, unknown>, memoName: "buyResults" | "rentResults") {
  const source = readFileSync(new URL("../components/HousingAffordabilityCalculator.tsx", import.meta.url), "utf8");
  const ast = ts.createSourceFile("HousingAffordabilityCalculator.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = ast.statements.filter(n => ts.isVariableStatement(n) || (ts.isFunctionDeclaration(n) && !n.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)));
  let callback = "";
  const visit = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && n.name.getText(ast) === memoName && n.initializer && ts.isCallExpression(n.initializer)) callback = n.initializer.arguments[0].getText(ast);
    ts.forEachChild(n, visit);
  };
  visit(ast);
  if (!callback) throw new Error("missing " + memoName);
  const code = declarations.map(n => n.getText(ast)).join("\n") + `\n(${callback})()`;
  return runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText,
    { nz: (v: string) => (Number.isFinite(Number(v)) ? Number(v) : 0), solveMaxHomePrice: solve, housingCostAtPrice, US_STATE_DEFAULTS: {}, ...state });
}

describe("housing affordability page results", () => {
  const buyState = (over: Record<string, unknown> = {}) => ({
    grossMonthly: 85000 / 12, otherMonthlyDebts: "300", downPct: "5", ratePct: "6.5", termYears: "30", propertyTaxPct: "1.1",
    insuranceMonthly: "140", hoaMonthly: "0", ...over,
  });
  it("shows a payment breakdown that includes PMI and adds up to the debt-to-income limit it was solved for", () => {
    const r = affordabilityResults(buyState(), "buyResults");
    expect(r.backEndPrice).toBeGreaterThan(0);
    expect(r.breakdown.pmi).toBeGreaterThan(0);
    const reference = referenceMonthlyTotal(r.backEndPrice, { down: 5, rate: 6.5, term: 30, tax: 1.1, ins: 140, hoa: 0 });
    expect(r.breakdown.totalMonthly).toBeCloseTo(reference, 6);
    expect(r.breakdown.totalMonthly).toBeLessThanOrEqual((85000 / 12) * 0.28 + 1e-6);
    // The parts add up to the total that is shown.
    const b = r.breakdown;
    expect(b.principalInterest + b.propertyTax + b.homeInsurance + b.hoa + b.pmi).toBeCloseTo(b.totalMonthly, 8);
    // Insurance is scaled from the $400,000 reference price to this price.
    expect(b.homeInsurance).toBeCloseTo(140 * (r.backEndPrice / 400000), 8);
  });
  it("uses the lower of the front-end (28%) and back-end (36% less debts) limits", () => {
    const light = affordabilityResults(buyState({ otherMonthlyDebts: "300" }), "buyResults");
    const heavy = affordabilityResults(buyState({ otherMonthlyDebts: "1800" }), "buyResults");
    expect(light.frontEndPrice).toBeGreaterThanOrEqual(light.backEndPrice);
    expect(heavy.backEndPrice).toBeLessThan(light.backEndPrice);
    // Debts of 1,800 on 7,083 gross are 25.4%, leaving a 10.6% back-end limit.
    const limit = (85000 / 12) * (36 - (1800 / (85000 / 12)) * 100) / 100;
    expect(referenceMonthlyTotal(heavy.backEndPrice, { down: 5, rate: 6.5, term: 30, tax: 1.1, ins: 140, hoa: 0 })).toBeLessThanOrEqual(limit + 1e-6);
    expect(affordabilityResults(buyState({ otherMonthlyDebts: "2600" }), "buyResults").backEndPrice).toBe(0);
  });
  it("clamps an impossible down payment, a negative rate and negative costs", () => {
    const r = affordabilityResults(buyState({ downPct: "150", ratePct: "-3", hoaMonthly: "-500", insuranceMonthly: "-50" }), "buyResults");
    expect(Number.isFinite(r.backEndPrice)).toBe(true);
    expect(r.breakdown.pmi).toBe(0);
    expect(r.breakdown.hoa).toBe(0);
    expect(r.breakdown.homeInsurance).toBe(0);
  });
  it("rent tiers are 25%, 30% and 35% of gross, with the debt-adjusted figure capped by the 36% total-debt rule", () => {
    const gross = 6000;
    const a = affordabilityResults({ grossMonthly: gross, otherMonthlyDebts: "500" }, "rentResults");
    expect(a.comfortable).toBeCloseTo(1500, 8);
    expect(a.recommended).toBeCloseTo(1800, 8);
    expect(a.stretch).toBeCloseTo(2100, 8);
    // 36% of 6,000 is 2,160; less 500 of debts is 1,660, below the 1,800 recommendation.
    expect(a.debtAdjusted).toBeCloseTo(1660, 8);
    expect(affordabilityResults({ grossMonthly: gross, otherMonthlyDebts: "0" }, "rentResults").debtAdjusted).toBeCloseTo(1800, 8);
    expect(affordabilityResults({ grossMonthly: gross, otherMonthlyDebts: "2500" }, "rentResults").debtAdjusted).toBe(0);
  });
});
