"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type PickerCity = { id: string; name: string; state: string };
export type PickerPair = { from: string; to: string };

const selectCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";

/**
 * Pick any two cities. A published pair opens its comparison page; any other pair opens the calculator prefilled for that route
 * (the same link the city-pair pages use), so every pair leads somewhere useful without creating a thin page for it.
 */
export default function ComparePicker({
  cities, livePairs, salary, defaultFrom, defaultTo,
}: {
  cities: PickerCity[];
  livePairs: PickerPair[];
  salary: number;
  defaultFrom: string;
  defaultTo: string;
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const target = useMemo(() => {
    const a = cities.find((c) => c.id === from);
    const b = cities.find((c) => c.id === to);
    if (!a || !b || a.id === b.id) return null;
    if (livePairs.some((p) => p.from === a.id && p.to === b.id)) {
      return { href: `/compare/${a.id}/${b.id}`, note: "Opens the full comparison page for this move." };
    }
    const qs = new URLSearchParams({ from: a.state, to: b.state, filing: "single", mode: "rent", salary: String(salary), fromCity: a.id, toCity: b.id });
    return { href: `/?${qs.toString()}`, note: "Opens the calculator with both cities filled in. Change the salary and housing there." };
  }, [cities, livePairs, from, to, salary]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-sm">
          <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Moving from</div>
          <select className={selectCls} value={from} onChange={(e) => setFrom(e.target.value)}>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.state.toUpperCase()}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Moving to</div>
          <select className={selectCls} value={to} onChange={(e) => setTo(e.target.value)}>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.state.toUpperCase()}</option>)}
          </select>
        </label>
        {target ? (
          <Link
            href={target.href}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Compare these cities
          </Link>
        ) : (
          <span className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-200 px-5 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-500">
            Compare these cities
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
        {target ? target.note : "Choose two different cities."}
      </p>
    </div>
  );
}
