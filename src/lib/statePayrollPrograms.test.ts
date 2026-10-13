import { describe, expect, it } from "vitest";
import { STATES } from "./states";
import { STATE_PAYROLL_PROGRAMS, STATES_WITH_PAYROLL_PROGRAMS, statePayrollLines } from "./statePayrollPrograms";

describe("state payroll program data", () => {
  it("has unique ids, real states, https sources and sensible rates", () => {
    const ids = new Set<string>();
    for (const p of STATE_PAYROLL_PROGRAMS) {
      expect(ids.has(p.id), p.id).toBe(false);
      ids.add(p.id);
      expect(STATES.some((s) => s.code === p.state), p.id).toBe(true);
      expect(p.source.url, p.id).toMatch(/^https:\/\//);
      expect(p.rate, p.id).toBeGreaterThan(0);
      expect(p.rate, p.id).toBeLessThan(0.02);
    }
  });

  it("lists exactly the states with a 2026 employee-paid program", () => {
    expect([...STATES_WITH_PAYROLL_PROGRAMS].sort()).toEqual(
      ["ak", "ca", "co", "ct", "de", "hi", "ma", "me", "mn", "nj", "ny", "or", "pa", "ri", "wa"],
    );
  });

  it("returns lines only for the requested state and ignores non-finite or negative wages", () => {
    expect(statePayrollLines("tx", 100_000)).toEqual([]);
    expect(statePayrollLines("ca", -5)).toEqual([]);
    expect(statePayrollLines("ca", Number.NaN)).toEqual([]);
    expect(statePayrollLines("nj", 100_000).map((l) => l.id)).toEqual(["nj-ui", "nj-wf", "nj-tdi", "nj-fli"]);
  });

  it("flags Delaware as not independently confirmed", () => {
    const de = STATE_PAYROLL_PROGRAMS.find((p) => p.state === "de")!;
    expect(de.status).toBe("not-independently-confirmed");
  });
});
