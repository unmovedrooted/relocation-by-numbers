import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STATES } from "./states";
import { CALCULATOR_INFO, LOCAL_TAX_SOURCES, STATE_TAX_SOURCES } from "./calculatorSources";

const appDir = join(process.cwd(), "src", "app");
const pageFile = (path: string) => (path === "/" ? join(appDir, "page.tsx") : join(appDir, path, "page.tsx"));

describe("calculator sources registry", () => {
  it("has at least one source link for every state, with an https address", () => {
    for (const state of STATES) {
      const sources = STATE_TAX_SOURCES[state.code];
      expect(sources.length, state.name).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source.url, `${state.name}: ${source.label}`).toMatch(/^https:\/\//);
        expect(source.label.length).toBeGreaterThan(5);
      }
    }
  });

  it("uses https for local sources except the Cleveland agency, which only serves http", () => {
    for (const source of LOCAL_TAX_SOURCES) {
      if (source.url.includes("ccatax.ci.cleveland.oh.us")) continue;
      expect(source.url).toMatch(/^https:\/\//);
    }
  });

  it("describes only calculators whose pages exist, and every page shows its entry", () => {
    for (const path of Object.keys(CALCULATOR_INFO)) {
      expect(existsSync(pageFile(path)), path).toBe(true);
      expect(readFileSync(pageFile(path), "utf8"), path).toContain(`<CalculatorSources path="${path}"`);
    }
  });

  it("gives every calculator at least one stated limit", () => {
    for (const [path, info] of Object.entries(CALCULATOR_INFO)) {
      expect(info.exclusions.length, path).toBeGreaterThan(0);
      if (info.taxDriven) expect(info.sources.length, path).toBeGreaterThan(0);
    }
  });

  it("links tax-driven calculators to the federal sources they use", () => {
    const federal = CALCULATOR_INFO["/paycheck-calculator"].sources.map((s) => s.url);
    expect(federal).toContain("https://www.irs.gov/pub/irs-drop/rp-25-32.pdf");
    const hsa = CALCULATOR_INFO["/hsa-calculator"].sources.map((s) => s.url);
    expect(hsa).toContain("https://www.irs.gov/pub/irs-drop/rp-25-19.pdf");
    const k401 = CALCULATOR_INFO["/401k-calculator"].sources.map((s) => s.url);
    expect(k401).toContain("https://www.irs.gov/pub/irs-drop/n-25-67.pdf");
  });
});
