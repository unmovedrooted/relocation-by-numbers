import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./EuropeRelocationCalculator.tsx", import.meta.url)),
  "utf8",
);

const expectedSelects = [
  ["europe-filing-status", "Filing status"],
  ["europe-current-country", "Current country"],
  ["europe-destination-country", "Target country"],
  ["europe-current-city", "Current city"],
  ["europe-destination-city", "Target city"],
  ["europe-display-currency", "Currency display"],
  ["europe-income-type", "Income type"],
  ["europe-furnishing", "Furnished or unfurnished"],
  ["europe-utilities-included", "Utilities included?"],
  ["europe-need-car", "Will you need a car?"],
] as const;

describe("EuropeRelocationCalculator shared selects", () => {
  it("uses CalculatorSelect for every expected static select", () => {
    for (const [id, label] of expectedSelects) {
      expect(source).toMatch(new RegExp(`<CalculatorSelect[^>]*id="${id}"[^>]*label="${label.replace("?", "\\?")}"`, "s"));
    }
  });

  it("uses the stable question key for dynamic tax select IDs", () => {
    expect(source).toContain('id={`europe-tax-question-${q.key}`}');
    expect(source).toContain("value={conditionalAnswers[q.key] ?? \"\"}");
  });

  it("contains no native select markup and no duplicate static IDs", () => {
    expect(source).not.toMatch(/<select(?:\s|>)/);
    const ids = expectedSelects.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(source.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
    }
  });

  it("preserves representative options and explicit event handlers", () => {
    expect(source).toContain('<option value="married">Married (joint)</option>');
    expect(source).toContain('<option value="remote">I earn remotely / foreign-source income</option>');
    expect(source).toContain("onChange={(e) => changeFromCountry(e.target.value)}");
    expect(source).toContain("onChange={(e) => changeToCountry(e.target.value)}");
    expect(source).toContain("onChange={(e) => changeToCity(e.target.value)}");
    expect(source).toContain("onChange={(e) => changeSalaryType(e.target.value as SalaryType)}");
  });
});
