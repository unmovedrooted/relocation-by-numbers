import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MethodologyPage, { metadata } from "./page";
import { CALCULATOR_INFO, LOCAL_TAX_SOURCES, STATE_TAX_SOURCES } from "../../lib/calculatorSources";
import { STATE_PAYROLL_PROGRAMS } from "../../lib/statePayrollPrograms";
import { GOVERNMENT_DATA_META } from "../../lib/governmentData";
import { FX_SOURCE } from "../../lib/internationalFx";

const html = renderToStaticMarkup(createElement(MethodologyPage));
const escapeText = (text: string) => renderToStaticMarkup(createElement("span", null, text)).slice(6, -7);

describe("relocation-first methodology documentation", () => {
  it("places uncertainty, housing, living and moving costs before tax references", () => {
    const sections = ["overview", "understanding-estimates", "housing", "cost-of-living", "moving-costs", "international", "data-sources", "tax-estimates", "tax-year-and-sources", "state-sources"];
    const positions = sections.map(id => html.indexOf(`id="${id}"`));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html.match(/<h1\b/g)).toHaveLength(1);
  });

  it("preserves existing deep links and resolves every in-page link to a unique ID", () => {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["state-payroll", "state-sources", "tax-year-and-sources", "exclusions-by-tool"]) expect(ids).toContain(id);
    for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) expect(ids).toContain(id);
  });

  it("retains every calculator link and full exclusion list inside native disclosures", () => {
    const disclosures = [...html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)].map(match => match[1]);
    expect(disclosures).toHaveLength(Object.keys(CALCULATOR_INFO).length);
    for (const [path, info] of Object.entries(CALCULATOR_INFO)) {
      const disclosure = disclosures.find(markup => markup.includes(`href="${path}"`));
      expect(disclosure).toBeDefined();
      expect(disclosure).toContain(`<summary`);
      expect(disclosure).toContain(escapeText(info.name));
      for (const exclusion of info.exclusions) expect(disclosure).toContain(escapeText(exclusion));
    }
  });

  it("keeps state, local and payroll source links and reads data dates from existing metadata", () => {
    const sources = [...Object.values(STATE_TAX_SOURCES).flat(), ...LOCAL_TAX_SOURCES, ...STATE_PAYROLL_PROGRAMS.map(p => p.source)];
    for (const source of sources) expect(html).toContain(`href="${escapeText(source.url)}"`);
    expect(html).toContain(GOVERNMENT_DATA_META.generatedOn);
    expect(html).toContain(escapeText(GOVERNMENT_DATA_META.census.vintage));
    expect(html).toContain(escapeText(GOVERNMENT_DATA_META.bea.vintage));
    expect(html).toContain(FX_SOURCE.asOf);
    expect(html).toContain("not a claim that every source was independently reverified");
    expect(metadata.alternates?.canonical).toBe("https://www.relocationbynumbers.com/methodology");
  });

  it("explains default limitations, spent-versus-cash costs and locally scrollable source table", () => {
    for (const text of ["$1,500", "$500", "$2,000", "do not", "shipment weight", "not confidence", "refundable deposit + down payment", "below three months"]) expect(html).toContain(text);
    expect(html).toMatch(/<div[^>]*overflow-x-auto[^>]*role="region"[^>]*tabindex="0"/);
    expect(html).toContain('scope="col"');
    expect(html).toContain('scope="row"');
  });
});
