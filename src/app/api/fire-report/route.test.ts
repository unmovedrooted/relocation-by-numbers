import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

const validBody = {
  age: 40, state: "nc", filingStatus: "single", fireAge: 55, yearsToFI: 15,
  expensesMonthly: 5000, withdrawalRatePct: 4, withdrawalTaxRatePct: 15,
  bal401k: 250000, balIra: 50000, balBrokerage: 100000,
  taxTreatment401k: "traditional", taxTreatmentIra: "roth",
  netAnnual: 100000, currentPortfolio: 400000, savingsRatePct: 30, income: 150000,
};

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/fire-report", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000", ...headers },
    body: JSON.stringify(body),
  });
}

describe("FIRE report request validation", () => {
  afterEach(() => delete process.env.ANTHROPIC_API_KEY);

  it("rejects cross-origin requests", async () => {
    expect((await POST(request(validBody, { Origin: "https://attacker.example" }))).status).toBe(403);
  });

  it("rejects unknown fields", async () => {
    expect((await POST(request({ ...validBody, unexpected: true }))).status).toBe(400);
  });

  it("rejects out-of-range financial values", async () => {
    expect((await POST(request({ ...validBody, withdrawalRatePct: 0 }))).status).toBe(400);
  });

  it("rejects oversized declared request bodies", async () => {
    expect((await POST(request(validBody, { "Content-Length": "20000" }))).status).toBe(413);
  });

  it("returns a safe response when provider configuration is absent", async () => {
    const response = await POST(request(validBody));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Report service unavailable" });
  });
});
