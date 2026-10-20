"use client";

import { useEffect, useState } from "react";

/**
 * On a phone the results sit far below a long form, so a change cannot be checked without scrolling. This bar stays at the bottom of the
 * screen while the results are out of view, shows the one-line answer, and jumps to the full results. It is hidden on wide screens, where
 * the results are beside the form, and whenever the results themselves are on screen.
 */
export default function MobileResultBar({ summary, targetId, label = "See full results" }: { summary: string | null; targetId: string; label?: string }) {
  const [resultsVisible, setResultsVisible] = useState(false);

  useEffect(() => {
    // The results count as on screen once their top edge is inside the viewport (a plain scroll check, which works the same everywhere).
    const check = () => {
      const target = document.getElementById(targetId);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setResultsVisible(rect.top < window.innerHeight * 0.85 && rect.bottom > 0);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [targetId, summary === null]);

  if (!summary || resultsVisible) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-[0_-6px_20px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <p className="min-w-0 text-sm font-semibold leading-snug text-slate-900 dark:text-white" aria-live="polite">{summary}</p>
        <button
          type="button"
          onClick={() => document.getElementById(targetId)?.scrollIntoView({ block: "start" })}
          className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          {label}
        </button>
      </div>
    </div>
  );
}
