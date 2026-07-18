import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CalculatorSelect from "./CalculatorSelect";

function renderSelect(props: Partial<Parameters<typeof CalculatorSelect>[0]> = {}) {
  return renderToStaticMarkup(createElement(CalculatorSelect, {
    label: "Target country",
    value: "CO",
    onChange: () => undefined,
    ...props,
  }, createElement("option", { value: "CO" }, "Colombia")));
}

describe("CalculatorSelect", () => {
  it("associates its visible label with an explicit stable ID", () => {
    const html = renderSelect({ id: "target-country" });
    expect(html).toContain('<label for="target-country">Target country</label>');
    expect(html).toContain('<select id="target-country"');
  });

  it("generates unique IDs when an ID is omitted", () => {
    const html = renderToStaticMarkup(createElement("div", null,
      createElement(CalculatorSelect, { label: "First", defaultValue: "a" }, createElement("option", { value: "a" }, "A")),
      createElement(CalculatorSelect, { label: "Second", defaultValue: "b" }, createElement("option", { value: "b" }, "B")),
    ));
    const ids = [...html.matchAll(/<select id="([^"]+)"/g)].map(match => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("connects helper and error messages and exposes invalid state", () => {
    const html = renderSelect({ id: "filing", helpText: "Choose a filing status.", error: "Required" });
    expect(html).toContain('aria-describedby="filing-help filing-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('id="filing-help"');
    expect(html).toContain('id="filing-error" role="alert"');
  });

  it("preserves native required and disabled attributes", () => {
    const html = renderSelect({ required: true, disabled: true });
    expect(html).toContain(" required=\"\"");
    expect(html).toContain(" disabled=\"\"");
  });

  it("preserves controlled values and native options", () => {
    const html = renderSelect();
    expect(html).toContain('<option value="CO" selected="">Colombia</option>');
  });
});
