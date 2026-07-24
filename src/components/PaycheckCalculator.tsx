"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { STATES, type StateCode } from "../lib/states";
import { estimateNetBreakdown, type FilingStatus } from "../lib/tax";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

// ─────────────────────────────────────────────────────────────────────────
// Take-home paycheck calculator. Reuses the site's verified federal + FICA +
// state tax engine (src/lib/tax.ts, 2025 assumptions). All figures shown are
// pre-tax gross broken into 401(k), federal, FICA, state/local, and net pay.
// ─────────────────────────────────────────────────────────────────────────

type PayType = "salary" | "hourly";
type Frequency = "weekly" | "biweekly" | "semimonthly" | "monthly";

const FREQUENCIES: Record<Frequency, { label: string; periods: number; each: string }> = {
  weekly: { label: "Weekly", periods: 52, each: "week" },
  biweekly: { label: "Every 2 weeks", periods: 26, each: "paycheck" },
  semimonthly: { label: "Twice a month", periods: 24, each: "paycheck" },
  monthly: { label: "Monthly", periods: 12, each: "month" },
};

// Cities with a local income tax the engine models (src/lib/tax.ts). Shown as
// an optional dropdown when the selected state has any. Resident rates.
const LOCAL_TAX_CITIES: Partial<Record<StateCode, { id: string; label: string }[]>> = {
  ny: [{ id: "nyc-ny", label: "New York City" }, { id: "yonkers-ny", label: "Yonkers" }],
  pa: [{ id: "philadelphia-pa", label: "Philadelphia" }, { id: "pittsburgh-pa", label: "Pittsburgh" }],
  oh: [{ id: "columbus-oh", label: "Columbus" }, { id: "cleveland-oh", label: "Cleveland" }, { id: "cincinnati-oh", label: "Cincinnati" }],
  mo: [{ id: "kansas-city-mo", label: "Kansas City" }, { id: "st-louis-mo", label: "St. Louis" }],
  mi: [{ id: "detroit-mi", label: "Detroit" }],
  md: [{ id: "baltimore-md", label: "Baltimore City" }, { id: "rockville-md", label: "Montgomery County (Rockville)" }, { id: "frederick-md", label: "Frederick County" }],
};

function money(n: number, digits = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function getQS() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}
function setQS(params: URLSearchParams) {
  if (typeof window === "undefined") return;
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

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

export default function PaycheckCalculator() {
  const hasMounted = useRef(false);

  const [payType, setPayType] = useState<PayType>("salary");
  const [annualSalary, setAnnualSalary] = useState<string>("75000");
  const [hourlyRate, setHourlyRate] = useState<string>("30");
  const [hoursPerWeek, setHoursPerWeek] = useState<string>("40");
  const [frequency, setFrequency] = useState<Frequency>("biweekly");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [state, setState] = useState<StateCode>("ca");
  const [cityId, setCityId] = useState<string>("");
  const [k401Pct, setK401Pct] = useState<string>("0");

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const nz = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  useEffect(() => {
    const qs = getQS();
    const vType = qs.get("type"); if (vType === "salary" || vType === "hourly") setPayType(vType);
    const vSalary = qs.get("salary"); if (vSalary) setAnnualSalary(vSalary);
    const vRate = qs.get("rate"); if (vRate) setHourlyRate(vRate);
    const vHours = qs.get("hours"); if (vHours) setHoursPerWeek(vHours);
    const vFreq = qs.get("freq"); if (vFreq && vFreq in FREQUENCIES) setFrequency(vFreq as Frequency);
    const vFiling = qs.get("filing") as FilingStatus | null; if (vFiling === "single" || vFiling === "married") setFiling(vFiling);
    const vState = qs.get("state"); if (vState) setState(vState as StateCode);
    const vCity = qs.get("city"); if (vCity) setCityId(vCity);
    const vK = qs.get("k401"); if (vK) setK401Pct(vK);
  }, []);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    qs.set("type", payType);
    if (payType === "salary") { if (annualSalary) qs.set("salary", annualSalary); }
    else { if (hourlyRate) qs.set("rate", hourlyRate); if (hoursPerWeek) qs.set("hours", hoursPerWeek); }
    qs.set("freq", frequency);
    qs.set("filing", filing);
    qs.set("state", state);
    if (cityId) qs.set("city", cityId);
    if (k401Pct) qs.set("k401", k401Pct);
    setQS(qs);
  }, [payType, annualSalary, hourlyRate, hoursPerWeek, frequency, filing, state, cityId, k401Pct]);

  const results = useMemo(() => {
    const grossAnnual = payType === "hourly" ? Math.max(0, nz(hourlyRate)) * Math.max(0, nz(hoursPerWeek)) * 52 : Math.max(0, nz(annualSalary));
    const cityValid = LOCAL_TAX_CITIES[state]?.some((c) => c.id === cityId) ? cityId : undefined;
    const b = estimateNetBreakdown({ grossAnnual, state, filing, k401Pct: Math.max(0, nz(k401Pct)), cityId: cityValid });
    const periods = FREQUENCIES[frequency].periods;
    const stateLocal = b.state + b.local;
    const effectiveTaxRate = b.gross > 0 ? b.totalTax / b.gross : 0;
    const takeHomePct = b.gross > 0 ? b.net / b.gross : 0;

    const per = (annual: number) => annual / periods;

    const donut = [
      { key: "net", name: "Take-home", value: b.net, fill: "#10b981" },
      { key: "fed", name: "Federal tax", value: b.federal, fill: "#f59e0b" },
      { key: "fica", name: "Social Security + Medicare", value: b.fica, fill: "#fb7185" },
      { key: "state", name: "State & local tax", value: stateLocal, fill: "#8b5cf6" },
      { key: "k401", name: "401(k)", value: b.k401, fill: "#0e7490" },
    ].filter((s) => s.value > 0.5);

    const rows = [
      { label: "Gross pay", annual: b.gross, tone: "text-slate-900 dark:text-slate-100" },
      { label: "401(k) contribution", annual: -b.k401, tone: "text-cyan-700 dark:text-cyan-300" },
      { label: "Federal income tax", annual: -b.federal, tone: "text-amber-600 dark:text-amber-400" },
      { label: "Social Security + Medicare", annual: -b.fica, tone: "text-rose-500 dark:text-rose-400" },
      { label: "State income tax", annual: -b.state, tone: "text-violet-600 dark:text-violet-400" },
      ...(b.local > 0.5 ? [{ label: "Local income tax", annual: -b.local, tone: "text-violet-600 dark:text-violet-400" }] : []),
    ];

    return { grossAnnual, b, periods, stateLocal, effectiveTaxRate, takeHomePct, per, donut, rows };
  }, [payType, annualSalary, hourlyRate, hoursPerWeek, frequency, filing, state, cityId, k401Pct]);

  const inputsReady = results.grossAnnual > 0;
  const stateName = STATES.find((s) => s.code === state)?.name ?? state;
  const eachLabel = FREQUENCIES[frequency].each;

  const exportRows = useMemo<CsvRow[]>(() => {
    const { b, per } = results;
    return [
      { Metric: "Gross pay (annual)", Value: money(b.gross) },
      { Metric: `Gross pay (per ${eachLabel})`, Value: money(per(b.gross)) },
      { Metric: "Pay frequency", Value: FREQUENCIES[frequency].label },
      { Metric: "Filing status", Value: filing === "married" ? "Married (joint)" : "Single" },
      { Metric: "State", Value: stateName },
      ...(b.local > 0.5 ? [{ Metric: "City (local tax)", Value: LOCAL_TAX_CITIES[state]?.find((c) => c.id === cityId)?.label ?? "—" }] : []),
      { Metric: "401(k) contribution", Value: `${k401Pct}% (${money(b.k401)}/yr)` },
      { Metric: "Federal income tax (annual)", Value: money(b.federal) },
      { Metric: "Social Security + Medicare (annual)", Value: money(b.fica) },
      { Metric: "State income tax (annual)", Value: money(b.state) },
      { Metric: "Local income tax (annual)", Value: money(b.local) },
      { Metric: "Total tax (annual)", Value: money(b.totalTax) },
      { Metric: "Effective tax rate", Value: `${(results.effectiveTaxRate * 100).toFixed(1)}%` },
      { Metric: "Take-home pay (annual)", Value: money(b.net) },
      { Metric: `Take-home pay (per ${eachLabel})`, Value: money(per(b.net)) },
    ];
  }, [results, frequency, filing, stateName, k401Pct, eachLabel]);

  const handleExportCsv = () => downloadCsv("paycheck-breakdown", exportRows);
  const handleExportPdf = () =>
    downloadPdfReport({
      filename: "paycheck-breakdown",
      title: "Take-Home Paycheck Breakdown",
      subtitle: `${money(results.per(results.b.net))} per ${eachLabel} · ${money(results.b.net)}/yr net in ${stateName}`,
      rows: exportRows as PdfRow[],
      footerNote: "2025 federal, FICA, and state estimates. Not tax advice. relocationbynumbers.com",
    });

  const getCurrentScenario = () => ({
    label: "Paycheck",
    url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
    subtitle: `${money(results.per(results.b.net), 0)}/${eachLabel} net · ${stateName}`,
    source: "Paycheck",
  });

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* INPUTS */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your pay</div>
              <div className="inline-flex select-none rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button type="button" onClick={() => setPayType("salary")} className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${payType === "salary" ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-950 dark:text-cyan-300" : "text-slate-500 dark:text-slate-400"}`}>Salary</button>
                <button type="button" onClick={() => setPayType("hourly")} className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${payType === "hourly" ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-950 dark:text-cyan-300" : "text-slate-500 dark:text-slate-400"}`}>Hourly</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {payType === "salary" ? (
                <label className="text-sm sm:col-span-2">
                  <div className={labelHeadCls}>Annual salary (gross)</div>
                  <input className={inputCls} type="number" min="0" value={annualSalary} onChange={(e) => setAnnualSalary(e.target.value)} placeholder=" " />
                </label>
              ) : (
                <>
                  <label className="text-sm">
                    <div className={labelHeadCls}>Hourly rate</div>
                    <input className={inputCls} type="number" min="0" step="0.5" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder=" " />
                  </label>
                  <label className="text-sm">
                    <div className={labelHeadCls}>Hours per week</div>
                    <input className={inputCls} type="number" min="0" step="1" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} placeholder=" " />
                  </label>
                </>
              )}
              <label className="text-sm">
                <div className={labelHeadCls}>Pay frequency</div>
                <select className={selectCls} value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
                  {(Object.keys(FREQUENCIES) as Frequency[]).map((f) => (
                    <option key={f} value={f}>{FREQUENCIES[f].label}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  401(k) contribution (%)
                  <InfoTip text="Pre-tax 401(k) reduces federal and (in most states) state income tax, but not Social Security or Medicare. CA and PA still tax it at the state level." />
                </div>
                <input className={inputCls} type="number" min="0" max="100" step="1" value={k401Pct} onChange={(e) => setK401Pct(e.target.value)} placeholder=" " />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Taxes</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>Filing status</div>
                <select className={selectCls} value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}>
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>State</div>
                <select
                  className={selectCls}
                  value={state}
                  onChange={(e) => { setState(e.target.value as StateCode); setCityId(""); }}
                >
                  {STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </label>
              {LOCAL_TAX_CITIES[state] && (
                <label className="text-sm sm:col-span-2">
                  <div className={labelHeadCls}>
                    City (local income tax)
                    <InfoTip text="Some cities levy their own income tax on top of state tax, e.g. New York City (~3.1–3.9%), Philadelphia (3.75%), Detroit (2.4%). Select yours if it applies." />
                  </div>
                  <select className={selectCls} value={cityId} onChange={(e) => setCityId(e.target.value)}>
                    <option value="">None / elsewhere in state</option>
                    {LOCAL_TAX_CITIES[state]!.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Uses 2025 federal brackets, Social Security &amp; Medicare (FICA), state income tax with the standard deduction, and local city income tax where selected. Doesn&apos;t include health-premium or HSA pre-tax deductions.
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="space-y-3">
          {!inputsReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Enter your pay to see your take-home.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-emerald-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Take-home pay</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                  {money(results.per(results.b.net))}<span className="ml-1 text-base font-medium opacity-70">/{eachLabel}</span>
                </div>
                <p className="mt-2 text-sm leading-5 opacity-90">
                  {money(results.b.net)}/yr net, you keep {(results.takeHomePct * 100).toFixed(0)}% of gross, at a {(results.effectiveTaxRate * 100).toFixed(1)}% effective tax rate in {stateName}.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Where your paycheck goes</div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={results.donut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={85} paddingAngle={2} stroke="none" isAnimationActive>
                        {results.donut.map((s) => (<Cell key={s.key} fill={s.fill} />))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [money(value), name]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1.5 text-sm">
                  {results.donut.map((s) => (
                    <div key={s.key} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: s.fill }} />{s.name}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{money(s.value)}/yr</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>Breakdown</span>
                  <span className="flex gap-6"><span>Per {eachLabel}</span><span>Annual</span></span>
                </div>
                <div className="space-y-1.5 text-sm">
                  {results.rows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span className={r.tone}>{r.label}</span>
                      <span className="flex gap-6 tabular-nums">
                        <span className="w-24 text-right text-slate-600 dark:text-slate-400">{r.annual < 0 ? "−" : ""}{money(Math.abs(results.per(r.annual)))}</span>
                        <span className="w-24 text-right font-semibold text-slate-900 dark:text-slate-100">{r.annual < 0 ? "−" : ""}{money(Math.abs(r.annual))}</span>
                      </span>
                    </div>
                  ))}
                  <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Take-home pay</span>
                    <span className="flex gap-6 tabular-nums">
                      <span className="w-24 text-right font-semibold text-emerald-600 dark:text-emerald-400">{money(results.per(results.b.net))}</span>
                      <span className="w-24 text-right font-semibold text-emerald-600 dark:text-emerald-400">{money(results.b.net)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Estimates use 2025 federal brackets, the standard deduction, Social Security (up to the wage base) and Medicare, and state income tax. They don&apos;t model pre-tax health or HSA deductions, additional withholdings, credits, or non-standard local taxes. Not tax advice.
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
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current inputs and send them to a partner, recruiter, or future self.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const shareUrl = new URL(window.location.href);
                      const shareText = `My take-home pay: ${money(results.per(results.b.net), 0)}/${eachLabel} (${money(results.b.net, 0)}/yr net) in ${stateName}.`;
                      const nav = window.navigator as unknown as {
                        share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>;
                        clipboard: { writeText: (t: string) => Promise<void> };
                      };
                      if (typeof nav.share === "function") {
                        await nav.share({ title: "My Take-Home Pay", text: shareText, url: shareUrl.toString() });
                        setShareStatus("shared");
                      } else {
                        await nav.clipboard.writeText(shareUrl.toString());
                        setShareStatus("copied");
                      }
                      window.setTimeout(() => setShareStatus("idle"), 2500);
                    } catch {
                      try { await window.navigator.clipboard.writeText(window.location.href); setShareStatus("copied"); } catch { setShareStatus("error"); }
                      window.setTimeout(() => setShareStatus("idle"), 2500);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
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
