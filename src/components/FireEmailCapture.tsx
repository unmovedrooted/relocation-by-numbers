// components/FireEmailCapture.tsx
"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

type Props = {
  fireAge?: number | null;
  location?: string;
};

export default function FireEmailCapture({ fireAge, location }: Props) {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/fire-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, fireAge, location }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/20 text-sm text-emerald-200">
            ✓
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-100">Plan saved</p>
            <p className="text-xs text-emerald-200/70">
              We'll send a check-in in 6 months with updated projections.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
      <p className="text-sm font-semibold text-white">Save your FIRE plan</p>
      <p className="mt-0.5 text-xs text-slate-400">
        Get a check-in in 6 months with updated projections.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          disabled={status === "loading"}
          className="h-9 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={status === "loading" || !email.includes("@")}
          className="h-9 shrink-0 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading" ? "Saving…" : "Save plan"}
        </button>
      </div>

      {status === "error" && (
        <p className="mt-2 text-xs text-red-400">
          Something went wrong — try again.
        </p>
      )}
    </div>
  );
}