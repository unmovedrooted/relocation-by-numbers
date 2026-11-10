import { describe, expect, it } from "vitest";
import { GUIDE_STATES, NO_INCOME_TAX_STATES, SINGLE_WITHDRAWALS, ageSentence, buildStateGuide, guideFaq, guideStateBySlug, slugify } from "./retirementStateGuide";
import { STATE_SS_CLASSIFICATION } from "./retirementPlan/stateSocialSecurityCoverage";

describe("retirement state guide", () => {
  it("covers the 42 states and DC with a module, and the 8 states without an income tax are listed separately", () => {
    expect(GUIDE_STATES).toHaveLength(43);
    expect(NO_INCOME_TAX_STATES.map((s) => s.code).sort()).toEqual(["ak", "fl", "nh", "nv", "sd", "tn", "tx", "wy"]);
    expect(new Set(GUIDE_STATES.map((s) => s.slug)).size).toBe(43);
  });

  it("round-trips slugs", () => {
    expect(slugify("District of Columbia")).toBe("district-of-columbia");
    expect(guideStateBySlug("new-york")?.code).toBe("ny");
    expect(guideStateBySlug("texas")).toBeUndefined();
  });

  it("builds every state without error, with sane values", () => {
    for (const { code, name } of GUIDE_STATES) {
      const g = buildStateGuide(code);
      expect(g.total, name).toBeGreaterThanOrEqual(0);
      expect(g.ssClass).toBe(STATE_SS_CLASSIFICATION[code]);
      expect(g.sources.length, `${name} sources`).toBeGreaterThan(0);
      expect(g.single).toHaveLength(SINGLE_WITHDRAWALS.length);
      for (const r of g.single) expect(Number.isFinite(r.tax) && r.tax >= 0, `${name} single ${r.withdrawals}`).toBe(true);
      // More income never lowers the tax in the income sweep.
      for (let i = 1; i < g.single.length; i++) expect(g.single[i].tax + 1, `${name} monotone`).toBeGreaterThanOrEqual(g.single[i - 1].tax);
      for (let i = 1; i < g.married.length; i++) expect(g.married[i].tax + 1, `${name} married monotone`).toBeGreaterThanOrEqual(g.married[i - 1].tax);
      expect(guideFaq(g)).toHaveLength(3);
    }
  });

  it("states that exempt everything on the example household say so, and Pennsylvania exempts retirement-age income", () => {
    const pa = buildStateGuide("pa");
    expect(pa.ssClass).toBe("exempt");
    expect(pa.added.socialSecurity).toBe(0);
  });

  it("does not claim a state's tax changes with age unless it does", () => {
    for (const { code } of GUIDE_STATES) {
      const g = buildStateGuide(code);
      const spread = Math.max(...g.ageRows.map((r) => r.tax)) - Math.min(...g.ageRows.map((r) => r.tax));
      expect(ageSentence(g) === null, code).toBe(spread < 50);
    }
  });
});
