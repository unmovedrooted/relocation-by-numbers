import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./EuropeRelocationCalculator.tsx", import.meta.url)),
  "utf8",
);

const expectedFields = [
  ["europe-destination-rent", "Rent in destination (monthly)", "destinationRent", "setDestinationRent"],
  ["europe-security-deposit", "Deposit required", "depositRequired", "setDepositRequired"],
  ["europe-first-month-rent", "First month rent", "firstMonthRent", "setFirstMonthRent"],
  ["europe-last-month-rent", "Last month rent (if applicable)", "lastMonthRent", "setLastMonthRent"],
] as const;

describe("EuropeRelocationCalculator housing amount fields", () => {
  it("uses CalculatorImmediateNumberField for all four scoped fields", () => {
    for (const [id, label, value, setter] of expectedFields) {
      // The label may carry the currency, written as a plain string or a template literal.
      const escaped = label.replace(/[()?]/g, "\\$&");
      const labelPattern = '(?:"' + escaped + '"|\\{`' + escaped + " \\([^`]*\\)`\\})";
      expect(source).toMatch(new RegExp(`<CalculatorImmediateNumberField[^>]*id="${id}"[^>]*label=${labelPattern}[^>]*min="0"[^>]*value=\\{${value}\\}[^>]*onChange=\\{${setter}\\}[^>]*placeholder=" "`, "s"));
      expect(source.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
    }
  });

  it("uses stable unique IDs and preserves the rent grid span", () => {
    const ids = expectedFields.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(source).toMatch(/id="europe-destination-rent"[^>]*wrapperClassName="sm:col-span-2"/);
  });

  it("does not leave any migrated field as a native input", () => {
    for (const [, , value] of expectedFields) {
      expect(source).not.toMatch(new RegExp(`<input[^>]*value=\\{${value}\\}`));
    }
  });

});
