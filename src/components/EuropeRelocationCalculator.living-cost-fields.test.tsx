import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./EuropeRelocationCalculator.tsx", import.meta.url)),
  "utf8",
);

const expectedFields = [
  ["europe-groceries", "Groceries monthly", "groceries", "setGroceries"],
  ["europe-utilities", "Utilities monthly", "utilities", "setUtilities"],
  ["europe-transportation", "Transportation monthly", "transportation", "setTransportation"],
  ["europe-healthcare", "Healthcare monthly", "healthcare", "setHealthcare"],
] as const;

describe("EuropeRelocationCalculator monthly living-cost fields", () => {
  it("uses CalculatorImmediateNumberField for every editable living-cost amount", () => {
    for (const [id, label, value, setter] of expectedFields) {
      expect(source).toMatch(new RegExp(`<CalculatorImmediateNumberField[\\s\\S]*?id="${id}"[\\s\\S]*?label=\\{<>${label}[\\s\\S]*?min="0"[\\s\\S]*?value=\\{${value}\\}[\\s\\S]*?onChange=\\{${setter}\\}[\\s\\S]*?placeholder=" "`));
      expect(source.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
    }
  });

  it("uses stable unique IDs and connected help text", () => {
    const ids = expectedFields.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [id] of expectedFields) {
      expect(source).toMatch(new RegExp(`id="${id}"[\\s\\S]*?helpText=\\{<>`));
    }
    expect(source.match(/Adjusted estimate:/g)).toHaveLength(4);
    expect(source.match(/Current location estimate:/g)).toHaveLength(4);
  });

  it("does not leave migrated living-cost fields as native inputs", () => {
    for (const [, , value] of expectedFields) {
      expect(source).not.toMatch(new RegExp(`<input[^>]*value=\\{${value}\\}`));
    }
  });

});
