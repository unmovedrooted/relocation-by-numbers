import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Worked examples printed by the IRS, compared with the calculator's own functions (the real component code is extracted and run).
function componentFunction(file: string, name: string) {
  const source = readFileSync(new URL(`../components/${file}.tsx`, import.meta.url), "utf8");
  const ast = ts.createSourceFile(`${file}.tsx`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = ast.statements.filter(n => ts.isVariableStatement(n) || (ts.isFunctionDeclaration(n) && !n.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)));
  const code = declarations.map(n => n.getText(ast)).join("\n") + `\n(${name})`;
  return runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText, { process: { env: {} } }) as (age: number) => number | null;
}

describe("IRS Publication 590-B, Table III (Uniform Lifetime Table) worked examples, read 2026-10-18", () => {
  const divisorForAge = componentFunction("RmdCalculator", "divisorForAge");
  it("age 73 uses a distribution period of 26.5 and age 75 uses 24.6", () => {
    expect(divisorForAge(73)).toBe(26.5);
    expect(divisorForAge(75)).toBe(24.6);
  });
  it("a $100,000 balance at age 75 gives an RMD of $4,065", () => {
    expect(Math.round(100_000 / divisorForAge(75)!)).toBe(4_065);
  });
  it("a $34,800 balance at age 73 gives an RMD of $1,313", () => {
    expect(Math.round(34_800 / divisorForAge(73)!)).toBe(1_313);
  });
});
