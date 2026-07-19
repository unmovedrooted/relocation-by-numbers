import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./EuropeRelocationCalculator.tsx", import.meta.url)),
  "utf8",
);

const expectedFields = [
  ["europe-visa-cost", "Visa / permit estimate", "visaCost", "setVisaCost"],
  ["europe-flight-cost", "One-way flight estimate", "flightCost", "setFlightCost"],
  ["europe-shipping-cost", "Shipping / baggage estimate", "shippingCost", "setShippingCost"],
  ["europe-temporary-stay", "Temporary housing estimate", "temporaryStay", "setTemporaryStay"],
  ["europe-admin-fees", "Setup / admin estimate", "adminFees", "setAdminFees"],
  ["europe-furniture-setup", "Furniture / setup estimate", "furnitureSetup", "setFurnitureSetup"],
  ["europe-emergency-cash-buffer", "Recommended cash buffer", "emergencyCashBuffer", "setEmergencyCashBuffer"],
] as const;

describe("EuropeRelocationCalculator moving-cost amount fields", () => {
  it("uses CalculatorImmediateNumberField with each existing raw-string handler", () => {
    for (const [id, label, value, setter] of expectedFields) {
      expect(source).toMatch(new RegExp(`<CalculatorImmediateNumberField[^>]*id="${id}"[^>]*label="${label.replace("/", "\\/")}"[^>]*value=\\{${value}\\}[^>]*onChange=\\{${setter}\\}[^>]*placeholder=" "`, "s"));
      expect(source.match(new RegExp(`id="${id}"`, "g"))).toHaveLength(1);
    }
  });

  it("uses stable unique IDs and preserves the cash-buffer grid span", () => {
    const ids = expectedFields.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(source).toMatch(/id="europe-emergency-cash-buffer"[^>]*wrapperClassName="sm:col-span-2"/);
  });

  it("does not leave migrated moving-cost fields as native inputs", () => {
    for (const [, , value] of expectedFields) {
      expect(source).not.toMatch(new RegExp(`<input[^>]*value=\\{${value}\\}`));
    }
  });

  it("preserves URL keys and upfront-cash formula consumers", () => {
    for (const key of ["visa", "flight", "shipping", "tempStay", "admin", "furniture", "emergency"]) {
      expect(source).toContain(key === "tempStay" ? "temporaryStay" : key);
    }
    for (const value of ["visaCost", "flightCost", "shippingCost", "temporaryStay", "adminFees", "furnitureSetup", "emergencyCashBuffer"]) {
      expect(source).toMatch(new RegExp(`upfrontCashNeeded[\\s\\S]*?${value}`));
    }
    expect(source).toContain('furnished === "furnished" ? 0 : destToUsd(numericValue(furnitureSetup))');
  });

  it("leaves the previously migrated non-moving fields on the shared component", () => {
    for (const id of ["europe-salary", "europe-destination-rent", "europe-groceries", "europe-car-cost-monthly"]) {
      expect(source).toMatch(new RegExp(`<CalculatorImmediateNumberField[^>]*id="${id}"`, "s"));
    }
  });
});
