"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { STATES, type StateCode } from "../lib/states";
import { type FilingStatus } from "../lib/tax";
import { withdrawalIncomeTax } from "../lib/retirementTax";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

// ─────────────────────────────────────────────────────────────────────────
// IRS Uniform Lifetime Table (2022 update, in effect for 2025). Distribution
// period (divisor) by age. RMD = prior year-end balance / divisor. Used by
// most account owners; a different table applies only if your sole
// beneficiary is a spouse more than 10 years younger. Verified vs IRS Pub
// 590-B / the Uniform Lifetime Table.
// ─────────────────────────────────────────────────────────────────────────
const UNIFORM_LIFETIME: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2,
  81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2,
  91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4,
  101: 6.0, 102: 5.6, 103: 5.2, 104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1, 108: 3.9, 109: 3.7, 110: 3.5,
  111: 3.4, 112: 3.3, 113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8, 117: 2.7, 118: 2.5, 119: 2.3, 120: 2.0,
};
const RMD_AGE = 73;
function divisorForAge(age: number): number | null {
  if (age < 72) return null;
  const a = Math.min(120, Math.round(age));
  return UNIFORM_LIFETIME[a] ?? 2.0;
}

function money(n: number, digits = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits });
}
function getQS() { if (typeof window === "undefined") return new URLSearchParams(); return new URLSearchParams(window.location.search); }
function setQS(p: URLSearchParams) { if (typeof window === "undefined") return; const qs = p.toString(); window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname); }

const inputCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
const selectCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600 dark:text-slate-400";

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button type="button" aria-label="More info" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">i</button>
      <span className="pointer-events-none absolute top-full left-0 z-50 mt-2 hidden max-w-[calc(100vw-2rem)] w-72 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-5 text-white shadow-xl group-hover:block group-focus-within:block">{text}</span>
    </span>
  );
}
type RmdRow = { age: number; startBalance: number; divisor: number; rmd: number; tax: number };
function RmdTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: RmdRow }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="font-semibold text-slate-900 dark:text-white">Age {d.age}</div>
      <div className="text-slate-700 dark:text-slate-300">RMD: {money(d.rmd)}</div>
      <div className="text-slate-500 dark:text-slate-400">Divisor {d.divisor} · balance {money(d.startBalance)}</div>
    </div>
  );
}

export default function RmdCalculator() {
  const hasMounted = useRef(false);

  const [age, setAge] = useState("73");
  const [balance, setBalance] = useState("500000");
  const [expectedReturnPct, setExpectedReturnPct] = useState("5");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [state, setState] = useState<StateCode>("fl");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const nz = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

  useEffect(() => {
    const qs = getQS();
    const vAge = qs.get("age"); if (vAge) setAge(vAge);
    const vBal = qs.get("balance"); if (vBal) setBalance(vBal);
    const vR = qs.get("return"); if (vR) setExpectedReturnPct(vR);
    const vF = qs.get("filing") as FilingStatus | null; if (vF === "single" || vF === "married") setFiling(vF);
    const vS = qs.get("state"); if (vS) setState(vS as StateCode);
  }, []);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    if (age) qs.set("age", age);
    if (balance) qs.set("balance", balance);
    if (expectedReturnPct) qs.set("return", expectedReturnPct);
    qs.set("filing", filing);
    qs.set("state", state);
    setQS(qs);
  }, [age, balance, expectedReturnPct, filing, state]);

  const results = useMemo(() => {
    const ageN = Math.round(nz(age));
    const bal0 = Math.max(0, nz(balance));
    const r = nz(expectedReturnPct) / 100;
    const required = ageN >= RMD_AGE;

    // This-year RMD (if required now).
    let thisYearRmd = 0;
    let thisYearDivisor: number | null = null;
    let thisYearTax = 0;
    if (required) {
      thisYearDivisor = divisorForAge(ageN);
      if (thisYearDivisor) {
        thisYearRmd = bal0 / thisYearDivisor;
        thisYearTax = withdrawalIncomeTax(thisYearRmd, state, filing, "traditional").total;
      }
    }

    // Projection from the later of current age or RMD age, forward to 95.
    const startAge = Math.max(ageN, RMD_AGE);
    let bal = bal0;
    // If not yet 73, grow the balance up to the RMD age first (no withdrawals).
    if (ageN < RMD_AGE) {
      for (let a = ageN; a < RMD_AGE; a++) bal *= 1 + r;
    }
    const schedule: RmdRow[] = [];
    for (let a = startAge; a <= 95 && bal > 1; a++) {
      const div = divisorForAge(a) ?? 2.0;
      const rmd = bal / div;
      const tax = withdrawalIncomeTax(rmd, state, filing, "traditional").total;
      schedule.push({ age: a, startBalance: bal, divisor: div, rmd, tax });
      bal = (bal - rmd) * (1 + r);
    }

    const firstRmd = ageN < RMD_AGE ? schedule[0] : null;
    return { ageN, bal0, required, thisYearRmd, thisYearDivisor, thisYearTax, schedule, firstRmd, startAge };
  }, [age, balance, expectedReturnPct, filing, state]);

  const inputsReady = results.bal0 > 0 && results.ageN > 0;
  const stateName = STATES.find((s) => s.code === state)?.name ?? state;
  const rmdPct = results.thisYearDivisor ? (100 / results.thisYearDivisor) : 0;

  const exportRows = useMemo<CsvRow[]>(() => {
    const rows: CsvRow[] = [
      { Metric: "Your age", Value: results.ageN },
      { Metric: "Prior year-end balance", Value: money(results.bal0) },
      { Metric: "State", Value: stateName },
    ];
    if (results.required && results.thisYearDivisor) {
      rows.push(
        { Metric: "Uniform Lifetime divisor", Value: results.thisYearDivisor },
        { Metric: "This year's RMD", Value: money(results.thisYearRmd) },
        { Metric: "RMD as % of balance", Value: `${rmdPct.toFixed(2)}%` },
        { Metric: "Est. income tax on the RMD", Value: money(results.thisYearTax) },
        { Metric: "After-tax RMD", Value: money(results.thisYearRmd - results.thisYearTax) },
      );
    } else if (results.firstRmd) {
      rows.push(
        { Metric: "RMDs begin at age", Value: RMD_AGE },
        { Metric: "Est. first RMD (at 73)", Value: money(results.firstRmd.rmd) },
      );
    }
    for (const row of results.schedule.slice(0, 12)) {
      rows.push({ Metric: `RMD at age ${row.age}`, Value: `${money(row.rmd)} (÷${row.divisor})` });
    }
    return rows;
  }, [results, stateName, rmdPct]);

  const handleExportCsv = () => downloadCsv("rmd-schedule", exportRows);
  const handleExportPdf = () => downloadPdfReport({ filename: "rmd-schedule", title: "Required Minimum Distribution Schedule", subtitle: results.required ? `This year's RMD: ${money(results.thisYearRmd)}` : `RMDs begin at age ${RMD_AGE}`, rows: exportRows as PdfRow[], footerNote: "Uniform Lifetime Table estimates. Not tax advice. relocationbynumbers.com" });
  const getCurrentScenario = () => ({ label: "RMD", url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/", subtitle: results.required ? `${money(results.thisYearRmd, 0)} this year` : `starts at ${RMD_AGE}`, source: "RMD" });

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* INPUTS */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Your account</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><div className={labelHeadCls}>Your age</div><input className={inputCls} type="number" min="1" value={age} onChange={(e) => setAge(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Prior year-end balance<InfoTip text="Your traditional (pre-tax) IRA / 401(k) balance as of December 31 last year. Roth IRAs — and, from 2024, Roth 401(k)s — have no RMDs." /></div><input className={inputCls} type="number" min="0" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Expected annual return (%)<InfoTip text="Used to project future balances and RMDs. RMDs are recalculated each year from that year's balance and divisor." /></div><input className={inputCls} type="number" step="0.1" value={expectedReturnPct} onChange={(e) => setExpectedReturnPct(e.target.value)} placeholder=" " /></label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Tax estimate</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><div className={labelHeadCls}>Filing status</div><select className={selectCls} value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}><option value="single">Single</option><option value="married">Married (joint)</option></select></label>
              <label className="text-sm"><div className={labelHeadCls}>State</div><select className={selectCls} value={state} onChange={(e) => setState(e.target.value as StateCode)}>{STATES.map((s) => (<option key={s.code} value={s.code}>{s.name}</option>))}</select></label>
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              RMDs are taxed as ordinary income (federal + state, no FICA). This estimate treats the RMD as your only income; if you have other income, your rate may be higher.
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="space-y-3">
          {!inputsReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">Enter your age and account balance to see your RMD.</div>
          ) : (
            <>
              {results.required && results.thisYearDivisor ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 text-cyan-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">This year&apos;s required minimum distribution</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{money(results.thisYearRmd)}</div>
                  <p className="mt-2 text-sm leading-5 opacity-90">
                    {money(results.bal0)} ÷ {results.thisYearDivisor} (age {results.ageN} divisor) = {rmdPct.toFixed(2)}% of your balance. After an estimated {money(results.thisYearTax)} in income tax, you keep about <span className="font-semibold">{money(results.thisYearRmd - results.thisYearTax)}</span>.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">No RMD required yet</div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">RMDs begin at age {RMD_AGE}</div>
                  <p className="mt-2 text-sm leading-5 opacity-90">
                    In {RMD_AGE - results.ageN} year{RMD_AGE - results.ageN === 1 ? "" : "s"}. At {(nz(expectedReturnPct)).toFixed(1)}% growth, your first RMD is projected at about <span className="font-semibold">{money(results.firstRmd?.rmd ?? 0)}</span>.
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Projected RMDs by age</div>
                <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Each year&apos;s RMD from the balance and Uniform Lifetime divisor.</div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.schedule} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                      <XAxis dataKey="age" tick={{ fontSize: 11 }} stroke="currentColor" />
                      <YAxis tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 11 }} width={48} stroke="currentColor" />
                      <Tooltip content={<RmdTooltip />} />
                      <Bar dataKey="rmd" radius={[4, 4, 0, 0]} isAnimationActive>
                        {results.schedule.map((d) => (<Cell key={d.age} fill="#0e7490" />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-2 grid grid-cols-[2rem_1fr_1.4fr_1.2fr] gap-2 pr-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Age</span>
                  <span className="text-right">Divisor</span>
                  <span className="text-right">RMD</span>
                  <span className="text-right">Est. tax</span>
                </div>
                <div className="max-h-56 space-y-1 overflow-y-auto pr-2 text-sm">
                  {results.schedule.slice(0, 20).map((row) => (
                    <div key={row.age} className="grid grid-cols-[2rem_1fr_1.4fr_1.2fr] gap-2 tabular-nums">
                      <span className="text-slate-700 dark:text-slate-300">{row.age}</span>
                      <span className="text-right text-slate-500 dark:text-slate-400">{row.divisor}</span>
                      <span className="text-right font-semibold text-slate-900 dark:text-slate-100">{money(row.rmd)}</span>
                      <span className="text-right text-slate-500 dark:text-slate-400">{money(row.tax)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                RMDs from traditional IRAs and 401(k)s must begin by April 1 of the year after you turn {RMD_AGE} (then by December 31 each year after). Missing one triggers a 25% penalty (10% if corrected promptly). This uses the Uniform Lifetime Table; a spouse more than 10 years younger as sole beneficiary uses a different table. Roth IRAs have no lifetime RMDs. Estimates only, not tax advice.
              </div>
            </>
          )}
        </div>
      </div>

      {inputsReady && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-cyan-900/60 dark:bg-cyan-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-400">Share this scenario</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current inputs and send them to a partner, advisor, or future self.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={async () => {
                  try {
                    const shareUrl = new URL(window.location.href);
                    const shareText = results.required ? `My RMD this year: ${money(results.thisYearRmd, 0)}.` : `My RMDs begin at age ${RMD_AGE}.`;
                    const nav = window.navigator as unknown as { share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>; clipboard: { writeText: (t: string) => Promise<void> } };
                    if (typeof nav.share === "function") { await nav.share({ title: "My RMD", text: shareText, url: shareUrl.toString() }); setShareStatus("shared"); }
                    else { await nav.clipboard.writeText(shareUrl.toString()); setShareStatus("copied"); }
                    window.setTimeout(() => setShareStatus("idle"), 2500);
                  } catch { try { await window.navigator.clipboard.writeText(window.location.href); setShareStatus("copied"); } catch { setShareStatus("error"); } window.setTimeout(() => setShareStatus("idle"), 2500); }
                }} className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  {shareStatus === "copied" ? "Link copied!" : shareStatus === "shared" ? "Shared!" : shareStatus === "error" ? "Share failed" : "Share scenario"}
                </button>
                <button type="button" onClick={handleExportCsv} className="inline-flex items-center justify-center rounded-xl border border-cyan-300 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-800 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-slate-950">Export CSV</button>
                <button type="button" onClick={handleExportPdf} className="inline-flex items-center justify-center rounded-xl border border-cyan-300 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-800 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-slate-950">Export PDF</button>
              </div>
            </div>
          </div>
          <SavedScenariosPanel getCurrentScenario={getCurrentScenario} />
        </div>
      )}
    </div>
  );
}
