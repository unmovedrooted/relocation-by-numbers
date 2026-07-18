import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CalculatorImmediateNumberField, { getImmediateNumberValue } from "./CalculatorImmediateNumberField";

function renderField(props: Partial<Parameters<typeof CalculatorImmediateNumberField>[0]> = {}) {
  return renderToStaticMarkup(createElement(CalculatorImmediateNumberField, {
    label: "Monthly rent",
    value: "1250.5",
    onChange: () => undefined,
    ...props,
  }));
}

describe("CalculatorImmediateNumberField", () => {
  it("associates its visible label with an explicit ID", () => {
    const html = renderField({ id: "monthly-rent" });
    expect(html).toContain('<label for="monthly-rent">Monthly rent</label>');
    expect(html).toContain('id="monthly-rent"');
  });

  it("generates unique IDs", () => {
    const html = renderToStaticMarkup(createElement("div", null,
      createElement(CalculatorImmediateNumberField, { label: "First", value: "", onChange: () => undefined }),
      createElement(CalculatorImmediateNumberField, { label: "Second", value: "", onChange: () => undefined }),
    ));
    const ids = [...html.matchAll(/<input[^>]*id="([^"]+)"/g)].map(match => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it.each(["", ".", "12.", "12.50", "-7.25"])("preserves the controlled raw value %j", value => {
    expect(renderField({ value })).toContain(`value="${value}"`);
  });

  it("emits the raw string immediately without blur normalization", () => {
    expect(getImmediateNumberValue({ target: { value: "" } } as never)).toBe("");
    expect(getImmediateNumberValue({ target: { value: "12." } } as never)).toBe("12.");
    expect(getImmediateNumberValue({ target: { value: "-7.25" } } as never)).toBe("-7.25");
  });

  it("connects helper and error messages", () => {
    const html = renderField({ id: "amount", helpText: "Enter a monthly amount.", error: "Invalid amount" });
    expect(html).toContain('aria-describedby="amount-help amount-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('id="amount-error" role="alert"');
  });

  it("passes required, disabled, min, max, and step metadata through", () => {
    const html = renderField({ required: true, disabled: true, min: 0, max: 1000, step: 0.01 });
    expect(html).toContain('required=""');
    expect(html).toContain('disabled=""');
    expect(html).toContain('min="0"');
    expect(html).toContain('max="1000"');
    expect(html).toContain('step="0.01"');
  });

  it("hides decorative prefixes and suffixes from assistive technology", () => {
    const html = renderField({ prefix: "$", suffix: "USD" });
    expect(html).toContain('aria-hidden="true">$</span>');
    expect(html).toContain('aria-hidden="true">USD</span>');
  });

  it("renders externally controlled value updates exactly", () => {
    expect(renderField({ value: "700" })).toContain('value="700"');
    expect(renderField({ value: "950.25" })).toContain('value="950.25"');
  });
});
