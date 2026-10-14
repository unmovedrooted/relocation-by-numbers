// app/api/feedback/route.ts
// Receives the "Was this helpful? What's missing?" box. Only the page path, a yes/no answer and the optional message are sent.
// Calculator inputs are never included. If FEEDBACK_WEBHOOK_URL is set (a Slack, Formspree or similar endpoint) the feedback is
// forwarded there; otherwise it is written to the server log.
import { NextResponse } from "next/server";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_MESSAGE = 1000;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

type Body = { path?: unknown; helpful?: unknown; message?: unknown; website?: unknown };

function allowed(ip: string, now: number): boolean {
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    recent.set(ip, hits);
    return false;
  }
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return true;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: NO_STORE });
  }

  // Honeypot: real visitors never fill the hidden "website" field.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }

  const path = typeof body.path === "string" ? body.path : "";
  const helpful = body.helpful;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!/^\/[A-Za-z0-9\-/_]{0,120}$/.test(path)) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400, headers: NO_STORE });
  }
  if (helpful !== "yes" && helpful !== "no") {
    return NextResponse.json({ error: "Choose yes or no" }, { status: 400, headers: NO_STORE });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Message too long" }, { status: 400, headers: NO_STORE });
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (!allowed(ip, Date.now())) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { ...NO_STORE, "Retry-After": "60" } });
  }

  const entry = { path, helpful, message, at: new Date().toISOString() };
  const webhook = process.env.FEEDBACK_WEBHOOK_URL;
  try {
    if (webhook) {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `Feedback on ${path}: ${helpful === "yes" ? "helpful" : "not helpful"}${message ? `, "${message}"` : ""}`, ...entry }),
      });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
    } else {
      console.log("[feedback]", entry);
    }
  } catch (err) {
    console.error("[feedback] delivery failed:", err);
    return NextResponse.json({ error: "Could not send feedback" }, { status: 502, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
