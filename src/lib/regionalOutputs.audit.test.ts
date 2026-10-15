import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { USD_TO_LOCAL } from "./internationalFx";
import { computeIntlCityResult } from "./compareEngines/international";
import { computeCaribCityResult } from "./compareEngines/caribbean";

async function loadCalculator(region: string) {
  const source = readFileSync(new URL(`../components/${region}RelocationCalculator.tsx`, import.meta.url), "utf8");
  const ast = ts.createSourceFile(region, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const bindings: Record<string, unknown> = {};
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier) || node.importClause?.isTypeOnly) continue;
    const path = node.moduleSpecifier.text;
    if (!path.startsWith("@/lib/") || path.endsWith("pdfExport") || path.endsWith("visaContext")) continue;
    const imported = await import(/* @vite-ignore */ `./${path.slice(6)}.ts`);
    const imports = node.importClause?.namedBindings;
    if (imports && ts.isNamedImports(imports)) for (const item of imports.elements) {
      if (!item.isTypeOnly) bindings[item.name.text] = imported[(item.propertyName ?? item.name).text];
    }
  }
  const declarations = ast.statements.filter(n => ts.isVariableStatement(n) ||
    (ts.isFunctionDeclaration(n) && !n.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)));
  let callback = "";
  function visit(n: ts.Node) {
    if (ts.isVariableDeclaration(n) && n.name.getText(ast) === "results" && n.initializer && ts.isCallExpression(n.initializer))
      callback = n.initializer.arguments[0].getText(ast);
    ts.forEachChild(n, visit);
  }
  visit(ast);
  if (!callback) throw new Error(`No results callback in ${region}`);
  // The component's own `nz` helper (defined inside the component body) is extracted too, so its real behaviour is tested.
  let nzSource = "";
  const findNz = (n: ts.Node) => {
    if (ts.isVariableStatement(n) && n.declarationList.declarations.some(d => d.name.getText(ast) === "nz")) nzSource = n.getText(ast);
    ts.forEachChild(n, findNz);
  };
  findNz(ast);
  const code = ts.transpileModule(declarations.map(n => n.getText(ast)).join("\n") + (nzSource ? `\n${nzSource}` : "") + `\n(${callback})()`,
    { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText;
  return (overrides: Record<string, unknown> = {}) => runInNewContext(code, { process: { env: {} }, URLSearchParams, ...bindings,
    mode: "working", salary: "100000", retirementIncome: "50000", salaryType: "remote", filing: "single", incomeScenario: "remote",
    fromCountry: "US", toCountry: "PT", conditionalAnswers: {}, usTaxStatus: "no", usSelfEmployed: "no",
    adults: "1", children: "0", destinationRent: "1000", groceries: "300", utilities: "100", transportation: "50", healthcare: "150",
    needCar: "no", carCostMonthly: "350", carCost: "350", utilitiesIncluded: "no", furnished: "unfurnished",
    depositRequired: "2000", firstMonthRent: "1000", lastMonthRent: "0", visaCost: "100", flightCost: "200", shippingCost: "300",
    temporaryStay: "400", adminFees: "50", furnitureSetup: "500", emergencyCashBuffer: "1000", currentSavings: "20000",
    housingMode: "rent", buyDownPct: "20", buyRatePct: "6", buyTermYears: "30", displayCurrency: "USD",
    scenarioContract: { kind: "v2", requestedVersion: "2", destinationInputUnit: "usd" },
    fromCityMultipliers: { groceries: 1, transit: 1, utilities: 1, housing: 1 },
    toCityMultipliers: { groceries: 1, transit: 1, utilities: 1, housing: 1 },
    currentCityDefaults: undefined, targetCityDefaults: undefined, selectedCityDefaults: undefined, targetProfile: undefined, ...overrides });
}

for (const [region, countries] of Object.entries({ Europe: ["PT", "GB", "DE"], Asia: ["SG", "JP", "AE"],
  SouthAmerica: ["CO", "BR", "CL"], Caribbean: ["JM", "BB", "KY"] })) {
  const calculate = await loadCalculator(region);
  describe(`${region} actual output matrix`, () => {
    it("two adults and two children use the intended category multipliers", () => {
      const toCountry = countries[0];
      const r = calculate({ toCountry, adults: "2", children: "2" });
      const fx = region === "Europe" ? USD_TO_LOCAL[toCountry] : 1;
      expect(r.groceriesAdj).toBeCloseTo(675 / fx, 7);
      expect(r.transportationAdj).toBeCloseTo(82.5 / fx, 7);
      expect(r.healthcareAdj).toBeCloseTo(405 / fx, 7);
      expect(r.utilitiesAdj).toBeCloseTo(155 / fx, 7);
    });
    it("buy mode replaces rent prepayments with a down payment", () => {
      const toCountry = countries[0];
      const rent = calculate({ toCountry });
      const buy = calculate({ toCountry, housingMode: "buy" });
      const fx = region === "Europe" ? USD_TO_LOCAL[toCountry] : 1;
      expect(buy.downPaymentUsd).toBeCloseTo(buy.estimatedHomePrice * .2, 7);
      expect(buy.upfrontCashNeeded).toBeCloseTo(rent.upfrontCashNeeded - 3000 / fx + buy.downPaymentUsd, 7);
      expect(buy.housingTotal).toBeCloseTo(buy.buyMonthlyPI + 100 / fx, 7);
    });
    it("origin-currency salary and savings convert once", () => {
      const fx = USD_TO_LOCAL.GB;
      const usd = calculate({ toCountry: countries[0] });
      const gb = calculate({ toCountry: countries[0], fromCountry: "GB", salary: String(100000 * fx), currentSavings: String(20000 * fx) });
      expect(gb.annualIncome).toBeCloseTo(usd.annualIncome, 7);
      expect(gb.monthsCovered).toBeCloseTo(usd.monthsCovered, 7);
    });
    it("display-currency state does not change canonical outputs", () => {
      const usd = calculate({ toCountry: countries[0], displayCurrency: "USD" });
      const eur = calculate({ toCountry: countries[0], displayCurrency: "EUR" });
      expect(eur).toEqual(usd);
    });
    it("zero savings produces zero coverage, not NaN", () => {
      expect(calculate({ toCountry: countries[0], currentSavings: "0" }).monthsCovered).toBe(0);
    });
    for (const toCountry of countries) for (const mode of ["working", "retired"]) for (const salary of [50000, 100000, 150000, 250000]) {
      it(`${toCountry} ${mode} income ${salary}`, () => {
        const r = calculate({ toCountry, mode, incomeScenario: mode === "retired" ? "retired" : "remote", salary: String(salary), retirementIncome: String(salary) });
        const fx = region === "Europe" ? USD_TO_LOCAL[toCountry] : 1;
        expect(r.annualIncome).toBe(salary);
        expect(r.housingTotal).toBeCloseTo(1100 / fx, 7);
        expect(r.livingCosts).toBeCloseTo(500 / fx, 7);
        expect(r.upfrontCashNeeded).toBeCloseTo(5550 / fx, 7);
        expect(r.monthlyFlexibility).toBeCloseTo(r.netMonthlyTo - 1600 / fx, 7);
        // The emergency buffer is reserved cash, so it comes out of savings before the runway is counted (every region).
        expect(r.monthsCovered).toBeCloseTo((20000 - 5550 / fx) / (1600 / fx), 7);
        expect(Number.isFinite(r.netMonthlyTo)).toBe(true);
      });
    }
    it("conditional utilities, furniture and car deltas", () => {
      const toCountry = countries[0];
      const r = calculate({ toCountry });
      const toggled = calculate({ toCountry, utilitiesIncluded: "yes", furnished: "furnished", needCar: "yes" });
      const fx = region === "Europe" ? USD_TO_LOCAL[toCountry] : 1;
      expect(toggled.housingTotal - r.housingTotal).toBeCloseTo(250 / fx, 7);
      expect(toggled.upfrontCashNeeded - r.upfrontCashNeeded).toBeCloseTo(-500 / fx, 7);
    });
  });
}

describe("regional audit findings, corrected", () => {
  it("Asia: the same city on both sides gives the same origin and destination cost", async () => {
    const calc = await loadCalculator("Asia");
    const mult = { groceries: 1.2, transit: 1.2, utilities: 1.2, housing: 1.2 };
    const r = calc({ fromCountry: "SG", toCountry: "SG", fromCityMultipliers: mult, toCityMultipliers: mult });
    expect(r.groceriesAdj).toBe(300);
    expect(r.groceriesFrom).toBe(300);
    expect(r.transportationFrom).toBe(50);
    expect(r.utilitiesFrom).toBe(100);
  });
  it("Asia: a pricier origin city scales the destination figure by the ratio of the multipliers", async () => {
    const calc = await loadCalculator("Asia");
    const r = calc({ fromCountry: "SG", toCountry: "SG",
      fromCityMultipliers: { groceries: 1.5, transit: 1.2, utilities: 1.2, housing: 1.2 },
      toCityMultipliers: { groceries: 1.2, transit: 1.2, utilities: 1.2, housing: 1.2 } });
    expect(r.groceriesFrom).toBeCloseTo(300 * (1.5 / 1.2), 8);
  });
  it("Caribbean: an entered zero car cost stays zero; a blank one uses the default", async () => {
    const calc = await loadCalculator("Caribbean");
    expect(calc({ toCountry: "JM", needCar: "yes", carCost: "0" }).carCost).toBe(0);
    expect(calc({ toCountry: "JM", needCar: "yes", carCost: "" }).carCost).toBeGreaterThan(0);
    expect(calc({ toCountry: "JM", needCar: "yes", carCost: "425" }).carCost).toBe(425);
    expect(calc({ toCountry: "JM", needCar: "no", carCost: "425" }).carCost).toBe(0);
  });
  it("negative entries are treated as zero in every region, not as money back", async () => {
    const asia = await loadCalculator("Asia");
    expect(asia({ toCountry: "SG", destinationRent: "-1000" }).rentTo).toBe(0);
    const europe = await loadCalculator("Europe");
    expect(europe({ furnitureSetup: "-500" }).upfrontCashNeeded).toBeCloseTo(europe({ furnitureSetup: "0" }).upfrontCashNeeded, 8);
    for (const [region, toCountry] of [["Europe", "PT"], ["Asia", "SG"], ["SouthAmerica", "CO"], ["Caribbean", "JM"]] as const) {
      const calc = await loadCalculator(region);
      const clean = calc({ toCountry });
      const dirty = calc({ toCountry, groceries: "-300", utilities: "-100", transportation: "-50", healthcare: "-150",
        visaCost: "-100", flightCost: "-200", shippingCost: "-300", temporaryStay: "-400", adminFees: "-50", currentSavings: "-5000" });
      expect(dirty.livingCosts).toBeGreaterThanOrEqual(0);
      expect(dirty.upfrontCashNeeded).toBeGreaterThanOrEqual(0);
      expect(dirty.monthsCovered).toBeLessThanOrEqual(clean.monthsCovered);
      expect(dirty.monthsCovered).toBeGreaterThanOrEqual(0);
    }
  });
  it("a buy-mode down payment above 100% is a full cash purchase in every region", async () => {
    for (const [region, toCountry] of [["Europe", "PT"], ["Asia", "SG"], ["SouthAmerica", "CO"], ["Caribbean", "JM"]] as const) {
      const calc = await loadCalculator(region);
      const full = calc({ toCountry, housingMode: "buy", buyDownPct: "100" });
      const over = calc({ toCountry, housingMode: "buy", buyDownPct: "150" });
      expect(over.upfrontCashNeeded).toBeCloseTo(full.upfrontCashNeeded, 6);
      expect(over.housingTotal).toBeCloseTo(full.housingTotal, 6);
    }
  });
  it("zero income is not rated comfortable: there is no cost-to-income ratio to rate", async () => {
    for (const region of ["Europe", "Asia", "SouthAmerica", "Caribbean"]) {
      const calc = await loadCalculator(region);
      const toCountry = { Europe: "PT", Asia: "SG", SouthAmerica: "CO", Caribbean: "JM" }[region];
      const r = calc({ salary: "0", toCountry });
      expect(r.salaryReady).toBe(false);
      expect(r.comfort.band).toBe("—");
      expect(r.comfort.label).toBe("Enter your income");
      // With income the same inputs get a real band.
      expect(["A", "B", "C", "D"]).toContain(calc({ salary: "100000", toCountry }).comfort.band);
    }
  });
  it("Caribbean household counts are whole people and the origin healthcare scales with the household", async () => {
    const calc = await loadCalculator("Caribbean");
    const whole = calc({ toCountry: "JM", adults: "2", children: "2" });
    const fractional = calc({ toCountry: "JM", adults: "2.9", children: "2.9" });
    expect(fractional.healthcareAdj).toBeCloseTo(whole.healthcareAdj, 8);
    expect(fractional.groceriesAdj).toBeCloseTo(whole.groceriesAdj, 8);
    const single = calc({ toCountry: "JM", adults: "1", children: "0" });
    expect(whole.healthcareFrom).toBeGreaterThan(single.healthcareFrom);
    // The same household factor applies to the origin and destination healthcare.
    expect(whole.healthcareFrom / single.healthcareFrom).toBeCloseTo(whole.healthcareAdj / single.healthcareAdj, 6);
  });
});

describe("Compare Cities international output matrix", () => {
  for (const countryCode of ["PT", "GB", "SG", "JP", "CO", "BR", "JM", "BB", "KY"]) {
    for (const mode of ["working", "retired"] as const) for (const grossAnnualUsd of [50000, 100000, 150000, 250000]) {
      it(`${countryCode} ${mode} ${grossAnnualUsd}`, () => {
        const calc = ["JM", "BB", "KY"].includes(countryCode) ? computeCaribCityResult : computeIntlCityResult;
        const r = calc({ countryCode, mode, grossAnnualUsd, filing: "single" });
        expect(r.netMonthly).toBeCloseTo(grossAnnualUsd * (1 - r.effTaxPct / 100) / 12, 6);
        expect(r.monthlyFlexibility).toBeCloseTo(r.netMonthly - r.housingMonthly, 7);
        expect(Number.isFinite(r.housingMonthly)).toBe(true);
      });
    }
  }
});
