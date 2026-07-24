"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSavedScenarios, deleteScenario, type SavedScenario } from "../lib/savedScenarios";

export default function ExploreSavedScenarios() {
  const [mounted, setMounted] = useState(false);
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);

  useEffect(() => {
    setMounted(true);
    setScenarios(getSavedScenarios());
  }, []);

  function remove(id: string) {
    deleteScenario(id);
    setScenarios(getSavedScenarios());
  }

  // Nothing to show for first-time visitors (SSR renders nothing either).
  if (!mounted || scenarios.length === 0) return null;

  return (
    <section aria-labelledby="saved-heading" className="space-y-4">
      <div>
        <h2 id="saved-heading" className="text-2xl font-semibold tracking-tight text-white">
          Pick up where you left off
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Your saved scenarios, stored only in this browser. Click to reopen with your inputs intact.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {scenarios.slice(0, 6).map((s) => (
          <div key={s.id} className="group relative rounded-2xl border border-white/10 bg-slate-900/70 transition hover:border-emerald-300/40 hover:bg-slate-900">
            <Link href={s.url} className="block p-4 pr-10">
              <div className="flex items-center gap-2">
                {s.source && (
                  <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/30">
                    {s.source}
                  </span>
                )}
                <span className="truncate text-base font-semibold text-white transition group-hover:text-emerald-200">{s.label}</span>
              </div>
              {s.subtitle && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{s.subtitle}</p>}
            </Link>
            <button
              type="button"
              aria-label={`Remove ${s.label}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(s.id); }}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
