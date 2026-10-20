"use client";

import { useEffect, useState } from "react";

/**
 * On a phone the results sit far below a long form, so a change cannot be checked without scrolling. This bar stays at the bottom of the
 * screen while the results are out of view, shows the one-line answer, and jumps to the full results. On wide screens it is a small card in
 * the corner (the results column itself does not follow the page). It is hidden whenever the results are on screen.
 */
export default function MobileResultBar({ summary, targetId, label = "See full results" }: { summary: string | null; targetId: string; label?: string }) {
  const [resultsVisible, setResultsVisible] = useState(false);
  // Hidden while a field is being edited, so the bar never covers the field or sits on top of the on-screen keyboard.
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const isField = (el: EventTarget | null) => el instanceof HTMLElement && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && (el as HTMLInputElement).type !== "checkbox" && (el as HTMLInputElement).type !== "radio";
    // Only on narrow screens, where the keyboard and the bar compete for space; on a desktop the summary stays visible while typing.
    const onIn = (e: FocusEvent) => { if (isField(e.target) && window.matchMedia("(max-width: 1023px)").matches) setTyping(true); };
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => { document.removeEventListener("focusin", onIn); document.removeEventListener("focusout", onOut); };
  }, []);

  useEffect(() => {
    // The results count as on screen once their top edge is inside the viewport (a plain scroll check, which works the same everywhere).
    const check = () => {
      const target = document.getElementById(targetId);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      // On a wide screen the results column is as tall as the form, so what matters is whether the headline at its top is still in view.
      // On a phone any part of the results on screen is enough.
      const wide = window.innerWidth >= 1024;
      setResultsVisible(wide ? rect.top >= -80 && rect.top < window.innerHeight * 0.85 : rect.top < window.innerHeight * 0.85 && rect.bottom > 0);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [targetId, summary === null]);

  if (!summary || resultsVisible || typing) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-[0_-6px_20px_rgba(15,23,42,0.12)] backdrop-blur lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[22rem] lg:rounded-xl lg:border lg:shadow-lg dark:border-slate-700 dark:bg-slate-900/95">
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
