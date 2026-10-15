import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The provider is mocked: this checks the whole request path (validation, prompt, streaming) without a paid call.
const calls: Array<{ model: string; system: string; messages: Array<{ role: string; content: string }>; max_tokens: number }> = [];

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      stream: (args: (typeof calls)[number]) => {
        calls.push(args);
        return (async function* () {
          yield { type: "content_block_start" };
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "## Plan\n" } };
          yield { type: "content_block_delta", delta: { type: "text_delta", text: "Use **withdrawal order**." } };
        })();
      },
    };
  },
}));

import { POST } from "./route";

const body = {
  age: 35, state: "ny", filingStatus: "single", fireAge: 52, yearsToFI: 17, expensesMonthly: 5000,
  withdrawalRatePct: 4, withdrawalTaxRatePct: 15, bal401k: 0, balIra: 0, balBrokerage: 75000,
  taxTreatment401k: "traditional", taxTreatmentIra: "traditional", netAnnual: 80000, currentPortfolio: 75000,
  savingsRatePct: 28, income: 100000,
};

function request(payload: unknown) {
  return new Request("http://localhost:3000/api/fire-report", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify(payload),
  });
}

describe("FIRE report request path with the provider mocked", () => {
  beforeEach(() => { calls.length = 0; process.env.ANTHROPIC_API_KEY = "test-key-not-real"; });
  afterEach(() => delete process.env.ANTHROPIC_API_KEY);

  it("streams the provider text and sends a mode-aware prompt for a Barista plan", async () => {
    const response = await POST(request({ ...body, mode: "barista", baristaPartTimeIncome: 24000, yearlyInvestment: 0, volatility: "moderate", inflationPct: 2.5, advanced: false }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(await response.text()).toBe("## Plan\nUse **withdrawal order**.");
    expect(calls).toHaveLength(1);
    const prompt = calls[0].messages[0].content;
    expect(prompt).toContain("Barista FIRE");
    // (5,000 x 12 - 24,000) / 4% = 900,000
    expect(prompt).toContain("FIRE number $900,000 at 4% (on the part-time-income gap)");
    expect(prompt).toContain("market-return preset: moderate; inflation 2.5%");
    expect(calls[0].system).toContain("FIRE planning specialist");
  });

  it("sends the Coast settings to the provider", async () => {
    const response = await POST(request({ ...body, mode: "coast", coastAge: 40, targetRetirementAge: 65, coastNumber: 524713, coastReady: false, yearsToCoast: 9 }));
    expect(response.status).toBe(200);
    await response.text();
    const prompt = calls[0].messages[0].content;
    expect(prompt).toContain("Coast FIRE");
    expect(prompt).toContain("stop contributing at age 40; retire at 65; needs $524,713 invested by the coast age");
    expect(prompt).toContain("Not yet coast-ready; projected 9 years to get there");
  });

  it("still works for the older request shape with no mode", async () => {
    const response = await POST(request(body));
    expect(response.status).toBe(200);
    await response.text();
    expect(calls[0].messages[0].content).toContain("Standard FIRE");
    expect(calls[0].messages[0].content).toContain("FIRE number $1,500,000 at 4%");
  });

  it("does not call the provider for an invalid request", async () => {
    expect((await POST(request({ ...body, mode: "nonsense" }))).status).toBe(400);
    expect(calls).toHaveLength(0);
  });
});
