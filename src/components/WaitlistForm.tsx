// components/WaitlistForm.tsx
"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function WaitlistForm() {
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
        body: JSON.stringify({ email: trimmed, source: "waitlist" }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/20 text-sm text-emerald-200">
          ✓
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-100">You're on the list</p>
          <p className="text-xs text-emerald-200/70">
            We'll email you when it launches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          disabled={status === "loading"}
          className="h-10 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={status === "loading" || !email.includes("@")}
          className="h-10 shrink-0 rounded-xl border border-violet-400/40 bg-violet-400/10 px-5 text-sm font-medium text-violet-100 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading" ? "Joining…" : "Join waitlist"}
        </button>
      </div>

      {status === "error" && (
        <p className="text-xs text-red-400">Something went wrong — please try again.</p>
      )}
    </div>
  );
}