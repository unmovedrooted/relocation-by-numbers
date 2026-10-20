"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { findCity } from "@/lib/cities";
import { deleteScenario, getSavedScenarios, renameScenario, type SavedScenario } from "@/lib/savedScenarios";

/** Friendlier names for the query keys the calculators write to the address bar. Unknown keys are shown as they are. */
const KEY_LABELS: Record<string, string> = {
  from: "Current state", to: "Target state", fromCity: "Current city", toCity: "Target city", filing: "Filing status", mode: "Rent or buy",
  salary: "Salary", k401: "401(k) %", homePrice: "Home price", downPct: "Down payment %", ratePct: "Mortgage rate %", termYears: "Loan term",
  rentMonthly: "Monthly rent", price: "Home price", down: "Down payment %", rate: "Mortgage rate %", term: "Loan term", rent: "Monthly rent",
  years: "Years", appr: "Appreciation %", inv: "Investment return %", rentgrow: "Rent growth %", maint: "Maintenance %", sell: "Selling costs %",
  ptax: "Property tax %", hins: "Home insurance (yearly)", hinsm: "Home insurance (monthly)", hoa: "HOA", closing: "Closing costs %", rins: "Renter's insurance", taxben: "Interest tax benefit %",
  fromCountry: "Current country", toCountry: "Destination country", fromCityCode: "Current city", toCityCode: "Destination city",
  savings: "Savings", groceries: "Groceries", utilities: "Utilities", transport: "Transportation", healthcare: "Healthcare", visa: "Visa", flight: "Flight",
  emergency: "Emergency buffer", currency: "Display currency", adults: "Adults", children: "Children",
};
const HIDDEN_KEYS = new Set(["typed", "view", "tab"]);

function queryOf(url: string): Record<string, string> {
  try {
    const u = new URL(url, "https://example.com");
    const out: Record<string, string> = {};
    u.searchParams.forEach((v, k) => { if (!HIDDEN_KEYS.has(k)) out[k] = v; });
    return out;
  } catch {
    return {};
  }
}

const when = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function MyScenarios() {
  const [mounted, setMounted] = useState(false);
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const refresh = () => setScenarios(getSavedScenarios());
  useEffect(() => {
    setMounted(true);
    refresh();
  }, []);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));
  const chosen = useMemo(() => picked.map((id) => scenarios.find((s) => s.id === id)).filter((s): s is SavedScenario => Boolean(s)), [picked, scenarios]);

  // One row per input, with the rows that differ between the chosen scenarios first.
  const rows = useMemo(() => {
    if (chosen.length < 2) return [];
    const queries = chosen.map((s) => queryOf(s.url));
    const keys = Array.from(new Set(queries.flatMap((q) => Object.keys(q))));
    return keys
      .map((key) => {
        const values = queries.map((q) => {
          const v = q[key];
          if (v === undefined) return "—";
          return key === "fromCity" || key === "toCity" ? (findCity(v)?.name ?? v) : v;
        });
        return { key, label: KEY_LABELS[key] ?? key, values, differs: new Set(values).size > 1 };
      })
      .sort((a, b) => Number(b.differs) - Number(a.differs) || a.label.localeCompare(b.label));
  }, [chosen]);

  if (!mounted) return <div className="mt-8 text-sm text-slate-500">Loading your saved scenarios…</div>;

  return (
    <div className="mt-8 space-y-8">
      <p role="note" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        Scenarios are saved in this browser only. They will not follow you to another device or survive clearing your browser data. To keep one or send it to someone, use the Share button on its calculator to copy a link.
      </p>

      {scenarios.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Nothing saved yet</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Use <strong>Save scenario</strong> on a calculator. Start with the <Link className="underline underline-offset-4" href="/">U.S. relocation calculator</Link>, the{" "}
            <Link className="underline underline-offset-4" href="/international-relocation">international calculator</Link> or{" "}
            <Link className="underline underline-offset-4" href="/rent-vs-buy-calculator">Rent vs. Buy</Link>, and your saves will appear here.
          </p>
        </section>
      ) : (
        <section aria-labelledby="saved-list">
          <h2 id="saved-list" className="text-lg font-semibold">Saved scenarios ({scenarios.length})</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Tick two or three to compare them side by side.</p>
          <ul className="mt-3 space-y-2">
            {scenarios.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                <input
                  type="checkbox"
                  aria-label={`Compare ${s.label}`}
                  checked={picked.includes(s.id)}
                  disabled={!picked.includes(s.id) && picked.length >= 3}
                  onChange={() => toggle(s.id)}
                />
                <div className="min-w-0 flex-1">
                  {renaming === s.id ? (
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { if (draft.trim()) renameScenario(s.id, draft.trim()); setRenaming(null); refresh(); }
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      onBlur={() => { if (draft.trim()) renameScenario(s.id, draft.trim()); setRenaming(null); refresh(); }}
                      className="w-full rounded-lg bg-white px-2 py-1 text-sm ring-1 ring-slate-300 dark:bg-slate-950 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="truncate text-sm font-semibold">
                      {s.label}
                      {s.source && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">{s.source}</span>}
                    </div>
                  )}
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{s.subtitle ? `${s.subtitle} · ` : ""}Saved {when(s.createdAt)}</div>
                </div>
                <Link href={s.url} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Open</Link>
                <button type="button" aria-label="Rename" onClick={() => { setRenaming(s.id); setDraft(s.label); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">✎</button>
                <button type="button" aria-label="Delete" onClick={() => { deleteScenario(s.id); setPicked((p) => p.filter((x) => x !== s.id)); refresh(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/40">✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {chosen.length >= 2 && (
        <section aria-labelledby="compare-heading" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 id="compare-heading" className="text-lg font-semibold">Side by side</h2>
          {new Set(chosen.map((s) => s.source ?? "")).size > 1 && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">These come from different calculators, so most inputs will not line up. Compare scenarios from the same calculator for the clearest view.</p>
          )}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                  <th className="py-2 pr-3 font-medium">&nbsp;</th>
                  {chosen.map((s) => <th key={s.id} className="py-2 pr-3 font-semibold text-slate-900 dark:text-slate-100">{s.label}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Result</td>
                  {chosen.map((s) => <td key={s.id} className="py-2 pr-3 font-semibold">{s.subtitle ?? "—"}</td>)}
                </tr>
                {rows.map((r) => (
                  <tr key={r.key} className={`border-t border-slate-100 dark:border-slate-800 ${r.differs ? "bg-amber-50/60 dark:bg-amber-950/20" : ""}`}>
                    <td className="py-2 pr-3 text-slate-600 dark:text-slate-400">{r.label}{r.differs && <span className="ml-1 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300">differs</span>}</td>
                    {r.values.map((v, i) => <td key={i} className="py-2 pr-3">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
