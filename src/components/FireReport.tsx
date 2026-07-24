// components/FireReport.tsx
"use client";

import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
// Pass whatever you have, the API accepts partial inputs gracefully.
export type FireReportInputs = {
  age: number;
  state: string;
  filingStatus: string;
  fireAge: number | null;
  yearsToFI: number | null;
  expensesMonthly: number;
  withdrawalRatePct: number;
  withdrawalTaxRatePct: number;
  bal401k: number;
  balIra: number;
  balBrokerage: number;
  taxTreatment401k: string;
  taxTreatmentIra: string;
  netAnnual: number;
  currentPortfolio: number;
  savingsRatePct: number;
  income: number;
  targetRetirementAge?: number;
};

type Status = "idle" | "loading" | "streaming" | "done" | "error";

// ── Simple markdown renderer ──────────────────────────────────────────────────
// Handles ##, **, and - bullet points without a library dependency.
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={key++} className="mt-5 mb-2 text-sm font-semibold text-white first:mt-0">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={key++} className="ml-3 text-sm leading-6 text-slate-300">
          <InlineMarkdown text={line.slice(2)} />
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="mt-2" />);
    } else {
      elements.push(
        <p key={key++} className="text-sm leading-6 text-slate-300">
          <InlineMarkdown text={line} />
        </p>
      );
    }
  }

  return elements;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FireReport({ inputs }: { inputs: FireReportInputs }) {
  const [status, setStatus] = useState<Status>("idle");
  const [report, setReport] = useState("");

  const alreadyFI = (inputs.yearsToFI ?? 1) <= 0;

  async function generate() {
    setStatus("loading");
    setReport("");

    try {
      const res = await fetch("/api/fire-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });

      if (!res.ok || !res.body) {
        setStatus("error");
        return;
      }

      setStatus("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setReport(prev => prev + decoder.decode(value, { stream: true }));
      }

      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  // ── Idle state ──────────────────────────────────────────────────────────────
  if (status === "idle") {
    return (
      <div className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
              Personalized report
            </div>
            <p className="text-base font-semibold text-white">
              {alreadyFI
                ? "Get your withdrawal strategy"
                : `Get your roadmap to FIRE at ${inputs.fireAge ?? "—"}`}
            </p>
            <p className="text-sm leading-6 text-slate-400">
              {alreadyFI
                ? "Account withdrawal order, Roth conversions, tax bracket management, and ACA strategy, built from your exact numbers."
                : "Withdrawal order, Roth conversion windows, healthcare bridge, and sequence-of-returns protection for your specific situation."}
            </p>
            <p className="text-xs leading-5 text-slate-500">
              When you continue, your age, location, income, spending, tax assumptions,
              and account balances shown here are sent to our AI provider solely to
              generate this report. Do not include information you do not want transmitted.
            </p>
          </div>

          <button
            type="button"
            onClick={generate}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-violet-300/30 bg-violet-300/10 px-4 py-2.5 text-sm font-medium text-violet-100 transition hover:bg-violet-300/20 active:scale-[0.98]"
          >
            Generate my strategy →
          </button>
        </div>
      </div>
    );
  }

  // ── Loading / streaming / done ──────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
            Personalized report
          </div>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {alreadyFI ? "Your withdrawal strategy" : `Your roadmap to FIRE at ${inputs.fireAge ?? "—"}`}
          </p>
        </div>

        {status === "done" && (
          <button
            type="button"
            onClick={generate}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            Regenerate
          </button>
        )}
      </div>

      {/* Loading pulse */}
      {status === "loading" && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-3 animate-pulse rounded-full bg-white/10" style={{ width: `${70 + i * 8}%` }} />
          ))}
        </div>
      )}

      {/* Streaming / done report */}
      {(status === "streaming" || status === "done") && report && (
        <div className="space-y-0.5">
          {renderMarkdown(report)}
          {status === "streaming" && (
            <span className="inline-block h-4 w-1.5 animate-pulse rounded-sm bg-violet-300/60" />
          )}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3">
          <p className="text-sm text-red-300">
            Failed to generate, please try again.
          </p>
          <button
            type="button"
            onClick={generate}
            className="mt-2 text-xs text-red-300 underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
