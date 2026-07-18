import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CalculatorNumberField, { parseCalculatorNumber } from "./CalculatorNumberField";

function renderField(overrides: Partial<Parameters<typeof CalculatorNumberField>[0]> = {}) {
  return renderToStaticMarkup(createElement(CalculatorNumberField, {
    label: "Annual income",
    value: 75_000,
    onChange: () => undefined,
    ...overrides,
  }));
}

describe("CalculatorNumberField", () => {
  it("associates its visible label with a stable input ID", () => {
    const html = renderField({ id: "annual-income" });
    expect(html).toContain('<label for="annual-income">Annual income</label>');
    expect(html).toContain('id="annual-income"');
  });

  it("generates unique IDs when an explicit ID is not supplied", () => {
    const html = renderToStaticMarkup(createElement("div", null,
      createElement(CalculatorNumberField, { label: "First", value: 1, onChange: () => undefined }),
      createElement(CalculatorNumberField, { label: "Second", value: 2, onChange: () => undefined }),
    ));
    const ids = Array.from(html.matchAll(/id="(calculator-number-[^"]+)"/g), (match) => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("connects helper and error text and exposes invalid and required state", () => {
    const html = renderField({
      id: "annual-income",
      helpText: "Enter gross yearly income.",
      error: "Income must be positive.",
      required: true,
      min: 0,
      max: 2_000_000,
      step: 100,
    });
    expect(html).toContain('aria-describedby="annual-income-help annual-income-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('required=""');
    expect(html).toContain('min="0"');
    expect(html).toContain('max="2000000"');
    expect(html).toContain('step="100"');
    expect(html).toContain('id="annual-income-error" role="alert"');
  });

  it("provides an accessible name when the visible label is intentionally omitted", () => {
    const html = renderField({ label: "", ariaLabel: "Brokerage tax drag" });
    expect(html).toContain('aria-label="Brokerage tax drag"');
  });

  it.each([
    ["1250.5", 1250.5],
    ["", 0],
    ["  ", 0],
    ["not-a-number", 0],
  ])("preserves the existing blur normalization for %j", (raw, expected) => {
    expect(parseCalculatorNumber(raw)).toBe(expected);
  });
});
