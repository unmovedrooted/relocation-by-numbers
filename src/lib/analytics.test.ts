import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CALCULATOR_PATHS, isCalculatorPath, trackUsage } from "./analytics";

afterEach(() => vi.unstubAllGlobals());

describe("anonymous usage events", () => {
  it("send only the event name and a path, with the query string and fragment removed", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    trackUsage("next_tool_click", "/fire-calculator?income=150000&state=ny#top");
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "next_tool_click", { page_path: "/fire-calculator" });
  });

  it("send nothing when analytics is not loaded", () => {
    vi.stubGlobal("window", {});
    expect(() => trackUsage("calculator_start", "/")).not.toThrow();
  });

  it("send nothing when the browser asks not to be tracked", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    vi.stubGlobal("navigator", { doNotTrack: "1" });
    trackUsage("calculator_start", "/");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("recognises calculator pages and nothing else", () => {
    expect(isCalculatorPath("/rent-vs-buy-calculator")).toBe(true);
    expect(isCalculatorPath("/blog/some-post")).toBe(false);
    expect(CALCULATOR_PATHS.length).toBeGreaterThan(20);
  });

  it("the tracker never reads what a visitor typed or the address query", () => {
    const source = readFileSync(new URL("../components/UsageEvents.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/\.value\b/);
    expect(source).not.toMatch(/location\.search|searchParams/);
  });
});
