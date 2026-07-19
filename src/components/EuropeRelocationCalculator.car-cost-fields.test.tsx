import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./EuropeRelocationCalculator.tsx", import.meta.url)),
  "utf8",
);

describe("EuropeRelocationCalculator car-cost amount field", () => {
  it("uses CalculatorImmediateNumberField with the existing raw-string handler and metadata", () => {
    expect(source).toMatch(/<CalculatorImmediateNumberField[\s\S]*?id="europe-car-cost-monthly"[\s\S]*?label=\{<>Estimated monthly car cost[\s\S]*?wrapperClassName="mt-3 block"[\s\S]*?min="0"[\s\S]*?value=\{carCostMonthly\}[\s\S]*?onChange=\{setCarCostMonthly\}[\s\S]*?placeholder=" "/);
    expect(source.match(/id="europe-car-cost-monthly"/g)).toHaveLength(1);
  });

  it("preserves conditional rendering and removes the migrated native input", () => {
    expect(source).toMatch(/needCar === "yes" && \([\s\S]*?<CalculatorImmediateNumberField[\s\S]*?id="europe-car-cost-monthly"/);
    expect(source).not.toMatch(/<input[^>]*value=\{carCostMonthly\}/);
  });

  it("keeps the car selector, formula dependencies, and read-only result", () => {
    expect(source).toMatch(/id="europe-need-car"[\s\S]*?value=\{needCar\}[\s\S]*?onChange=\{\(e\) => setNeedCar\(e\.target\.value as YesNo\)\}/);
    expect(source).toContain('needCar === "yes" ? destToUsd(nonNegative(carCostMonthly)) : 0');
    expect(source).toContain("Car estimate:");
  });

});
