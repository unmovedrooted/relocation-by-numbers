"use client";

import { useState } from "react";

type Props = { path: string; name: string; tone?: "light" | "dark" };
type Status = "idle" | "sending" | "done" | "error";

/**
 * "Was this helpful? What's missing?" box for a calculator page. It sends only the page path, a yes/no answer and the optional
 * message to /api/feedback: no calculator inputs, and no email address is asked for.
 */
export default function FeedbackBox({ path, name, tone = "light" }: Props) {
  const [helpful, setHelpful] = useState<"yes" | "no" | null>(null);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const dark = tone === "dark";
  const box = dark
    ? "border-white/10 bg-white/5 text-slate-300"
    : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400";
  const heading = dark ? "text-white" : "text-slate-900 dark:text-slate-100";
  const field = dark
    ? "border-white/15 bg-black/30 text-white placeholder:text-slate-500"
    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
  const choice = (selected: boolean) =>
    `rounded-lg border px-4 py-2 text-sm font-medium transition ${
      selected
        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        : dark ? "border-white/15 text-slate-200 hover:bg-white/10" : "border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
    }`;

  async function submit() {
    if (!helpful) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, helpful, message, website }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
      try {
        (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.("event", "feedback_submitted", { page_path: path, helpful });
      } catch {
        /* analytics is optional */
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section aria-label={`Feedback on the ${name}`} className={`mx-auto my-6 w-full max-w-5xl rounded-2xl border p-5 text-sm ${box}`}>
      <h2 className={`text-sm font-semibold sm:text-base ${heading}`}>Was this helpful? What&apos;s missing?</h2>
      {status === "done" ? (
        <p className="mt-2" role="status">Thank you. Your feedback was sent, and it does not include anything you entered into the calculator.</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Was this helpful?">
            <button type="button" className={choice(helpful === "yes")} aria-pressed={helpful === "yes"} onClick={() => setHelpful("yes")}>Yes, helpful</button>
            <button type="button" className={choice(helpful === "no")} aria-pressed={helpful === "no"} onClick={() => setHelpful("no")}>Not really</button>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">What is missing or wrong? (optional)</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              rows={3}
              maxLength={1000}
              placeholder="What's missing, wrong or confusing? (optional)"
              className={`w-full rounded-lg border px-3 py-2 text-sm ${field}`}
            />
          </label>
          <div className="hidden" aria-hidden="true">
            <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={!helpful || status === "sending"}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send feedback"}
            </button>
            <span className="text-xs">Only your answer and message are sent, never your calculator inputs.</span>
          </div>
          {status === "error" ? <p className="mt-2 text-red-600 dark:text-red-400" role="alert">Sorry, that did not send. Please try again in a minute.</p> : null}
        </>
      )}
    </section>
  );
}
