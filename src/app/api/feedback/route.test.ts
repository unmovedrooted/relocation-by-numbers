import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

let counter = 0;
function request(body: unknown, ip?: string) {
  return new Request("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip ?? `10.0.0.${++counter}` },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("feedback endpoint", () => {
  afterEach(() => {
    delete process.env.FEEDBACK_WEBHOOK_URL;
    vi.restoreAllMocks();
  });

  it("accepts a yes with no message", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    expect((await POST(request({ path: "/paycheck-calculator", helpful: "yes", message: "" }))).status).toBe(200);
  });

  it("rejects a bad page path, a missing answer and a message that is too long", async () => {
    expect((await POST(request({ path: "https://evil.example", helpful: "yes" }))).status).toBe(400);
    expect((await POST(request({ path: "/fire-calculator" }))).status).toBe(400);
    expect((await POST(request({ path: "/fire-calculator", helpful: "no", message: "x".repeat(1001) }))).status).toBe(400);
    expect((await POST(request("not json"))).status).toBe(400);
  });

  it("silently ignores the honeypot field without delivering anything", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await POST(request({ path: "/fire-calculator", helpful: "yes", website: "http://spam.example" }));
    expect(res.status).toBe(200);
    expect(log).not.toHaveBeenCalled();
  });

  it("limits one address to five submissions a minute", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const ip = "203.0.113.9";
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await POST(request({ path: "/rmd-calculator", helpful: "yes" }, ip))).status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it("forwards to the webhook when one is configured and reports a failed delivery", async () => {
    process.env.FEEDBACK_WEBHOOK_URL = "https://hooks.example/feedback";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("ok", { status: 200 }));
    expect((await POST(request({ path: "/hsa-calculator", helpful: "no", message: "Missing family limit" }))).status).toBe(200);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ path: "/hsa-calculator", helpful: "no", message: "Missing family limit" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(new Response("no", { status: 500 }));
    expect((await POST(request({ path: "/hsa-calculator", helpful: "yes" }))).status).toBe(502);
  });
});
