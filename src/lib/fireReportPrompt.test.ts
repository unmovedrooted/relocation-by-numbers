import { describe, expect, it } from "vitest";
import { buildPrompt, type ReportInputs } from "./fireReportPrompt";

const base: ReportInputs = {
  age: 40, state: "nc", filingStatus: "single", fireAge: 55, yearsToFI: 15, expensesMonthly: 4000,
  withdrawalRatePct: 4, withdrawalTaxRatePct: 15, bal401k: 250000, balIra: 50000, balBrokerage: 100000,
  taxTreatment401k: "traditional", taxTreatmentIra: "roth", netAnnual: 100000, currentPortfolio: 400000,
  savingsRatePct: 30, income: 150000,
};

describe("FIRE report prompt", () => {
  it("keeps the standard prompt unchanged in substance when no mode is sent", () => {
    const prompt = buildPrompt(base);
    expect(prompt).toContain("Calculator: Standard FIRE");
    expect(prompt).toContain("FIRE number $1,200,000 at 4%");
    expect(prompt).not.toContain("part-time");
    expect(prompt).not.toContain("Coast plan");
  });
  it("computes a Barista FIRE number on the gap left by part-time income, not on full spending", () => {
    const prompt = buildPrompt({ ...base, mode: "barista", baristaPartTimeIncome: 24000 });
    // (4000 * 12 - 24000) / 4% = 600,000
    expect(prompt).toContain("FIRE number $600,000 at 4% (on the part-time-income gap)");
    expect(prompt).toContain("Expected part-time income: $24,000/yr after tax");
    expect(prompt).toContain("must cover $24,000/yr");
  });
  it("never lets part-time income push the Barista gap below zero", () => {
    expect(buildPrompt({ ...base, mode: "barista", baristaPartTimeIncome: 90000 })).toContain("FIRE number $0 at 4%");
  });
  it("describes the Coast plan, readiness and that the FIRE age is for full FIRE", () => {
    const behind = buildPrompt({ ...base, mode: "coast", coastAge: 40, targetRetirementAge: 65, coastNumber: 524713, coastReady: false, yearsToCoast: 12 });
    expect(behind).toContain("stop contributing at age 40; retire at 65; needs $524,713 invested by the coast age");
    expect(behind).toContain("Not yet coast-ready; projected 12 years to get there");
    expect(behind).toContain("full FIRE if contributions continue");
    expect(buildPrompt({ ...base, mode: "coast", coastAge: 40, targetRetirementAge: 65, coastReady: true })).toContain("Already coast-ready");
    expect(buildPrompt({ ...base, mode: "coast", coastAge: 40, targetRetirementAge: 65, coastReady: false, yearsToCoast: null }))
      .toContain("not projected to be before the retirement age");
  });
  it("includes lean and chubby/fat identity, return and inflation assumptions and how saving is configured", () => {
    expect(buildPrompt({ ...base, mode: "lean" })).toContain("Lean FIRE");
    const fat = buildPrompt({ ...base, preset: "fat", volatility: "aggressive", inflationPct: 3, yearlyInvestment: 20000 });
    expect(fat).toContain("fat FIRE spending level");
    expect(fat).toContain("market-return preset: aggressive; inflation 3%; yearly investment: $20,000");
    const adv = buildPrompt({ ...base, advanced: true, contrib401k: 23500, contribIra: 7000, contribBrokerage: 12000 });
    expect(adv).toContain("401(k) $23,500, IRA $7,000, taxable $12,000");
    expect(buildPrompt(base)).toContain("yearly investment: the leftover after spending");
  });
});
