// Test harness: runs a regional relocation calculator's real `results` callback with explicit field values, without mounting React.
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

export async function loadCalculator(region: string) {
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
