import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./EuropeRelocationCalculator.tsx", import.meta.url)),
  "utf8",
);

const expectedIds = [
  "europe-salary",
  "europe-retirement-income",
  "europe-current-savings",
  "europe-adults",
  "europe-children",
] as const;

describe("EuropeRelocationCalculator immediate numeric fields", () => {
  it("uses CalculatorImmediateNumberField for all five scoped fields", () => {
    for (const id of expectedIds) {
      expect(source).toMatch(new RegExp(`<CalculatorImmediateNumberField[^>]*id="${id}"`, "s"));
      expect(source.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
    }
    expect(new Set(expectedIds).size).toBe(expectedIds.length);
  });

  it("preserves separate working and retired raw-string state handlers", () => {
    expect(source).toMatch(/id="europe-salary"[\s\S]*?value=\{salary\}[\s\S]*?onChange=\{setSalary\}/);
    expect(source).toMatch(/id="europe-retirement-income"[\s\S]*?value=\{retirementIncome\}[\s\S]*?onChange=\{setRetirementIncome\}/);
    expect(source).toContain('mode === "retired" ? (');
  });

  it("preserves savings and household field handlers and metadata", () => {
    expect(source).toMatch(/id="europe-current-savings"[^>]*label="Current savings available"[^>]*value=\{currentSavings\}[^>]*onChange=\{setCurrentSavings\}/);
    expect(source).toMatch(/id="europe-adults"[^>]*label="Number of adults"[^>]*min="1"[^>]*step="1"[^>]*value=\{adults\}[^>]*onChange=\{setAdults\}/);
    expect(source).toMatch(/id="europe-children"[^>]*label="Number of children"[^>]*min="0"[^>]*step="1"[^>]*value=\{children\}[^>]*onChange=\{setChildren\}/);
  });

});
