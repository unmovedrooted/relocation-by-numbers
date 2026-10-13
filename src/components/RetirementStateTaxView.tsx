"use client";

import { useEffect, useMemo, useState } from "react";
import { STATES, type StateCode } from "../lib/states";
import type { FilingStatus } from "../lib/tax";
import {
  DEFAULT_PROFILE,
  retirementTaxByState,
  stateRetirementTax,
  treatment,
  type RetireeProfile,
  type SourceKey,
  type StateRetirementTax,
} from "../lib/retirementStateView";

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const SOURCES: { key: SourceKey; label: string }[] = [
  { key: "socialSecurity", label: "Social Security" },
  { key: "pension", label: "Pension" },
  { key: "withdrawals", label: "401(k) or IRA withdrawals" },
];

const inputCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700";

const stateName = (code: StateCode) => STATES.find((s) => s.code === code)?.name ?? code.toUpperCase();

function SourceLine({ row, profile, source }: { row: StateRetirementTax; profile: RetireeProfile; source: { key: SourceKey; label: string } }) {
  const t = treatment(row, profile, source.key);
  if (t === "none") return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-600 dark:text-slate-400">{source.label}</span>
      <span className={t === "adds-tax" ? "font-semibold text-slate-900 dark:text-slate-100" : "font-semibold text-emerald-600 dark:text-emerald-400"}>
        {t === "adds-tax" ? `adds ${money(row.added[source.key])}` : "adds no tax"}
      </span>
    </div>
  );
}

function StateCard({ title, row, profile }: { title: string; row: StateRetirementTax; profile: RetireeProfile }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{stateName(row.state)}</div>
      {row.error ? (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">{row.error}</p>
      ) : (
        <>
          <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{money(row.stateTax)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">state income tax per year</div>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            {SOURCES.map((s) => <SourceLine key={s.key} row={row} profile={profile} source={s} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default function RetirementStateTaxView() {
  const [profile, setProfile] = useState<RetireeProfile>(DEFAULT_PROFILE);
  const [from, setFrom] = useState<StateCode>("ny");
  const [to, setTo] = useState<StateCode>("fl");

  // A link from the move comparison names the two states.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const codes = new Set<string>(STATES.map((s) => s.code));
    const f = p.get("from");
    const t = p.get("to");
    if (f && codes.has(f)) setFrom(f as StateCode);
    if (t && codes.has(t)) setTo(t as StateCode);
  }, []);

  const rows = useMemo(() => retirementTaxByState(profile), [profile]);
  const fromRow = useMemo(() => stateRetirementTax(from, profile), [from, profile]);
  const toRow = useMemo(() => stateRetirementTax(to, profile), [to, profile]);
  const saving = fromRow.error || toRow.error ? null : fromRow.stateTax - toRow.stateTax;

  const num = (key: "age" | SourceKey, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setProfile((p) => ({ ...p, [key]: Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : 0 }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Retirement income, per year</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm">
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Filing status</div>
            <select className={inputCls} value={profile.filing} onChange={(e) => setProfile((p) => ({ ...p, filing: e.target.value as FilingStatus }))}>
              <option value="single">Single</option>
              <option value="married">Married filing jointly</option>
            </select>
          </label>
          <label className="text-sm">
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Age (each person)</div>
            <input className={inputCls} type="number" min={60} max={100} value={profile.age} onChange={num("age", 100)} />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Social Security</div>
            <input className={inputCls} type="number" min={0} value={profile.socialSecurity} onChange={num("socialSecurity", 1_000_000)} />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Pension</div>
            <input className={inputCls} type="number" min={0} value={profile.pension} onChange={num("pension", 1_000_000)} />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">401(k) or IRA withdrawals</div>
            <input className={inputCls} type="number" min={0} value={profile.withdrawals} onChange={num("withdrawals", 1_000_000)} />
          </label>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <select aria-label="State you retire from" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value as StateCode)}>
            {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
          <StateCard title="Now" row={fromRow} profile={profile} />
        </div>
        <div className="space-y-2">
          <select aria-label="State you retire to" className={inputCls} value={to} onChange={(e) => setTo(e.target.value as StateCode)}>
            {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
          <StateCard title="After the move" row={toRow} profile={profile} />
        </div>
      </section>

      {saving !== null && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          {saving > 0.5
            ? <>Retiring in {stateName(to)} instead of {stateName(from)} lowers state income tax by <strong>{money(saving)} a year</strong> on this income.</>
            : saving < -0.5
              ? <>Retiring in {stateName(to)} instead of {stateName(from)} raises state income tax by <strong>{money(-saving)} a year</strong> on this income.</>
              : <>State income tax is the same in both states on this income.</>}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">All states, lowest state income tax first</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                <th className="py-2 font-medium">State</th>
                <th className="py-2 text-right font-medium">State tax</th>
                {SOURCES.map((s) => <th key={s.key} className="py-2 text-right font-medium">{s.label} adds</th>)}
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              {rows.map((r) => (
                <tr key={r.state} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-2">
                    <button type="button" className="underline-offset-2 hover:underline" onClick={() => setTo(r.state)}>{stateName(r.state)}</button>
                  </td>
                  {r.error ? (
                    <td className="py-2 text-right text-amber-700 dark:text-amber-300" colSpan={4}>not available</td>
                  ) : (
                    <>
                      <td className="py-2 text-right font-semibold">{money(r.stateTax)}</td>
                      {SOURCES.map((s) => (
                        <td key={s.key} className="py-2 text-right">
                          {{ none: "", "adds-none": "$0", "adds-tax": money(r.added[s.key]) }[treatment(r, profile, s.key)]}
                        </td>
                      ))}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
          &quot;Adds&quot; is the state tax the household would not owe if that income were removed, so it includes indirect effects: some states
          shrink a pension deduction by the Social Security received, or phase a deduction out as income rises. The three amounts do not add up
          to the total, because deductions are shared. Click a state to compare it.
        </p>
      </section>
    </div>
  );
}
