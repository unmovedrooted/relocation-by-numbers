import { describe, expect, it } from "vitest";
import { buildPrompt, systemPromptFor, type ReportInputs } from "./fireReportPrompt";

const base: ReportInputs = {
  age: 40, state: "nc", filingStatus: "single", fireAge: 55, yearsToFI: 15, expensesMonthly: 4000,
  withdrawalRatePct: 4, withdrawalTaxRatePct: 15, bal401k: 250000, balIra: 50000, balBrokerage: 100000,
  taxTreatment401k: "traditional", taxTreatmentIra: "roth", netAnnual: 100000, currentPortfolio: 400000,
  savingsRatePct: 30, income: 150000,
};

describe("standard and Lean reports", () => {
  it("keep the withdrawal-strategy report", () => {
    const prompt = buildPrompt(base);
    expect(prompt).toContain("withdrawal strategy report");
    expect(prompt).toContain("Calculator: Standard FIRE");
    expect(prompt).toContain("FIRE number $1,200,000 at 4%");
    expect(prompt).toContain("withdrawal order, Roth conversion opportunities");
    expect(prompt).not.toContain("Coast");
    expect(prompt).not.toContain("part-time");
    expect(systemPromptFor(undefined)).toContain("withdrawal strategy reports");
  });
  it("describe the Lean calculator and the Chubby or Fat spending level", () => {
    expect(buildPrompt({ ...base, mode: "lean" })).toContain("Lean FIRE");
    expect(buildPrompt({ ...base, preset: "fat" })).toContain("fat FIRE spending level");
  });
  it("include return, inflation and saving assumptions", () => {
    expect(buildPrompt({ ...base, volatility: "aggressive", inflationPct: 3, yearlyInvestment: 20000 }))
      .toContain("market-return preset: aggressive; inflation 3%; yearly investment: $20,000");
    expect(buildPrompt({ ...base, advanced: true, contrib401k: 23500, contribIra: 7000, contribBrokerage: 12000 }))
      .toContain("401(k) $23,500, IRA $7,000, taxable $12,000");
    expect(buildPrompt(base)).toContain("yearly investment: the leftover after spending");
  });
});

describe("Coast FIRE is a standalone plan", () => {
  const coast: ReportInputs = { ...base, mode: "coast", coastAge: 40, targetRetirementAge: 65, coastNumber: 524713, coastReady: false, yearsToCoast: 12 };
  it("has its own system prompt and its own report", () => {
    expect(systemPromptFor("coast")).toContain("Coast FIRE planning specialist");
    expect(systemPromptFor("coast")).not.toContain("withdrawal strategy reports");
    const prompt = buildPrompt(coast);
    expect(prompt).toContain("personalized Coast FIRE plan");
    expect(prompt).toContain("Stop contributing at age 40 (0 years from now); retire at 65 (25 years from now)");
    expect(prompt).toContain("Coast FIRE number: $524,713 invested by the coast age");
    expect(prompt).toContain("Not yet coast-ready; at the current pace the balance gets there in 12 years");
    expect(prompt).toContain("what to do after contributions stop");
    expect(prompt).toContain("full FIRE would be reached at age 55; that is a comparison, not the plan");
  });
  it("does not ask for the standard withdrawal-report sections or a standard FIRE number", () => {
    const prompt = buildPrompt(coast);
    expect(prompt).not.toContain("FIRE number $1,200,000");
    expect(prompt).not.toContain("withdrawal order, Roth conversion");
    expect(prompt).not.toContain("years to RMDs");
  });
  it("covers the ready and not-reachable cases", () => {
    expect(buildPrompt({ ...coast, coastReady: true })).toContain("Already coast-ready");
    expect(buildPrompt({ ...coast, coastReady: false, yearsToCoast: null })).toContain("not projected to be before the retirement age");
    expect(buildPrompt({ ...coast, coastNumber: null })).toContain("Coast FIRE number: not available");
  });
});

describe("Barista FIRE is a standalone plan", () => {
  const barista: ReportInputs = { ...base, mode: "barista", baristaPartTimeIncome: 24000 };
  it("has its own system prompt and its own report", () => {
    expect(systemPromptFor("barista")).toContain("Barista FIRE planning specialist");
    expect(systemPromptFor("barista")).not.toContain("withdrawal strategy reports");
    const prompt = buildPrompt(barista);
    expect(prompt).toContain("personalized Barista FIRE plan");
    expect(prompt).toContain("expected part-time income $24,000/yr after tax once full-time work ends");
    // (4000 * 12 - 24000) = 24,000 gap; / 4% = 600,000
    expect(prompt).toContain("The portfolio only has to fund the gap of $24,000/yr, a Barista FIRE number of $600,000 at 4%");
    expect(prompt).toContain("Projected Barista FIRE age 55; 15 years away");
    expect(prompt).toContain("healthcare and benefits gap");
  });
  it("does not use the standard FIRE number or withdrawal-report sections", () => {
    const prompt = buildPrompt(barista);
    expect(prompt).not.toContain("FIRE number $1,200,000");
    expect(prompt).not.toContain("years to RMDs");
    expect(prompt).not.toContain("first-five-year sequence risk");
  });
  it("never lets part-time income push the gap below zero", () => {
    const prompt = buildPrompt({ ...barista, baristaPartTimeIncome: 90000 });
    expect(prompt).toContain("gap of $0/yr, a Barista FIRE number of $0");
  });
  it("says so when the person is already at Barista FIRE", () => {
    expect(buildPrompt({ ...barista, yearsToFI: 0 })).toContain("Already at Barista FIRE; age 55");
  });
});
