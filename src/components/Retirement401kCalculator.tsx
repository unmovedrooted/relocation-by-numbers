"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, ComposedChart, Area, Line, XAxis, YAxis } from "recharts";
import { STATES, type StateCode } from "../lib/states";
import { estimateNetBreakdown, EMPLOYEE_401K_LIMIT, type FilingStatus } from "../lib/tax";
import { accumulationPaths, RISK_PRESETS, type RiskLevel } from "../lib/monteCarlo";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

// 2025 employee elective deferral limits (base + catch-up). Verified vs IRS.
const CATCHUP_50 = 7_500;
const CATCHUP_60_63 = 11_250;
function employeeLimitForAge(age: number): number {
  if (age >= 60 && age <= 63) return EMPLOYEE_401K_LIMIT + CATCHUP_60_63;
  if (age >= 50) return EMPLOYEE_401K_LIMIT + CATCHUP_50;
  return EMPLOYEE_401K_LIMIT;
}

function money(n: number, digits = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits });
}
function getQS() { if (typeof window === "undefined") return new URLSearchParams(); return new URLSearchParams(window.location.search); }
function setQS(params: URLSearchParams) { if (typeof window === "undefined") return; const qs = params.toString(); window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname); }
function realReturnRate(nominalPct: number, inflationPct: number) { return (1 + nominalPct / 100) / (1 + inflationPct / 100) - 1; }
function projectBalance(start: number, annual: number, r: number, years: number) {
  let b = Math.max(0, start); let contributed = 0;
  const byYear: { year: number; balance: number }[] = [{ year: 0, balance: b }];
  for (let y = 1; y <= years; y++) { b += annual; contributed += annual; b += b * r; byYear.push({ year: y, balance: b }); }
  return { finalBalance: b, contributed, byYear };
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
type Pt = { year: number; p10: number; p50: number; p90: number; base: number; band: number };
function FanTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Pt }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="font-semibold text-slate-900 dark:text-white">Year {d.year}</div>
      <div className="text-emerald-600 dark:text-emerald-400">Best 10%: {money(d.p90)}</div>
      <div className="text-slate-700 dark:text-slate-300">Median: {money(d.p50)}</div>
      <div className="text-amber-600 dark:text-amber-400">Worst 10%: {money(d.p10)}</div>
    </div>
  );
}

export default function Retirement401kCalculator() {
  const hasMounted = useRef(false);

  const [salary, setSalary] = useState("100000");
  const [yourContribPct, setYourContribPct] = useState("10");
  const [employerMatchPct, setEmployerMatchPct] = useState("50");
  const [employerCapPct, setEmployerCapPct] = useState("6");
  const [currentBalance, setCurrentBalance] = useState("25000");
  const [age, setAge] = useState("35");
  const [retirementAge, setRetirementAge] = useState("65");
  const [expectedReturnPct, setExpectedReturnPct] = useState("7");
  const [inflationPct, setInflationPct] = useState("3");
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [state, setState] = useState<StateCode>("ca");

  const [viewMode, setViewMode] = useState<"average" | "montecarlo">("average");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("balanced");
  const [customVolatilityPct, setCustomVolatilityPct] = useState("13");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const nz = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

  useEffect(() => {
    const qs = getQS();
    const g = (k: string, s: (v: string) => void) => { const v = qs.get(k); if (v !== null) s(v); };
    g("salary", setSalary); g("your", setYourContribPct); g("match", setEmployerMatchPct); g("cap", setEmployerCapPct);
    g("balance", setCurrentBalance); g("age", setAge); g("retire", setRetirementAge); g("return", setExpectedReturnPct); g("inflation", setInflationPct);
    if (qs.get("real") === "1") setAdjustForInflation(true);
    const f = qs.get("filing") as FilingStatus | null; if (f === "single" || f === "married") setFiling(f);
    const st = qs.get("state"); if (st) setState(st as StateCode);
    const v = qs.get("view"); if (v === "average" || v === "montecarlo") setViewMode(v);
    const rk = qs.get("risk"); if (rk === "conservative" || rk === "balanced" || rk === "aggressive" || rk === "custom") setRiskLevel(rk);
    g("vol", setCustomVolatilityPct);
  }, []);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    const set = (k: string, v: string) => { if (v) qs.set(k, v); };
    set("salary", salary); set("your", yourContribPct); set("match", employerMatchPct); set("cap", employerCapPct);
    set("balance", currentBalance); set("age", age); set("retire", retirementAge); set("return", expectedReturnPct);
    if (adjustForInflation) { qs.set("real", "1"); set("inflation", inflationPct); }
    qs.set("filing", filing); qs.set("state", state); qs.set("view", viewMode);
    if (viewMode === "montecarlo") { qs.set("risk", riskLevel); if (riskLevel === "custom") set("vol", customVolatilityPct); }
    setQS(qs);
  }, [salary, yourContribPct, employerMatchPct, employerCapPct, currentBalance, age, retirementAge, expectedReturnPct, inflationPct, adjustForInflation, filing, state, viewMode, riskLevel, customVolatilityPct]);

  const volatility = riskLevel === "custom" ? Math.max(0, nz(customVolatilityPct)) / 100 : RISK_PRESETS[riskLevel].volatilityPct / 100;

  const results = useMemo(() => {
    const sal = Math.max(0, nz(salary));
    const yourPct = Math.max(0, nz(yourContribPct));
    const matchRate = Math.max(0, nz(employerMatchPct));
    const capPct = Math.max(0, nz(employerCapPct));
    const ageN = nz(age);
    const years = Math.max(0, Math.round(nz(retirementAge) - ageN));
    const effReturn = adjustForInflation ? realReturnRate(nz(expectedReturnPct), nz(inflationPct)) : nz(expectedReturnPct) / 100;

    const limit = employeeLimitForAge(ageN);
    const yourContribUncapped = sal * (yourPct / 100);
    const yourContrib = Math.min(yourContribUncapped, limit);
    const overLimit = Math.max(0, yourContribUncapped - limit);

    // Employer match: matchRate% of your contribution, on the first capPct% of salary.
    const matchedPct = Math.min(yourPct, capPct);
    const employerContrib = sal * (matchedPct / 100) * (matchRate / 100);
    const missedMatchPct = Math.max(0, capPct - yourPct);
    const missedMatchAnnual = sal * (missedMatchPct / 100) * (matchRate / 100);

    const totalAnnual = yourContrib + employerContrib;

    // Tax savings this year (pre-tax 401k reduces federal + state, not FICA).
    const bWithout = estimateNetBreakdown({ grossAnnual: sal, state, filing, k401Pct: 0 });
    const bWith = estimateNetBreakdown({ grossAnnual: sal, state, filing, k401Pct: 0, k401Dollar: yourContrib });
    const federalSaved = bWithout.federal - bWith.federal;
    const stateSaved = bWithout.state - bWith.state;
    const taxSaved = federalSaved + stateSaved;
    const netPaycheckCost = yourContrib - taxSaved; // out-of-pocket after tax savings

    // Growth.
    const proj = projectBalance(nz(currentBalance), totalAnnual, effReturn, years);
    const totalYourContributed = yourContrib * years;
    const totalEmployerContributed = employerContrib * years;
    const growth = proj.finalBalance - nz(currentBalance) - totalYourContributed - totalEmployerContributed;

    const donut = [
      { key: "start", name: "Current balance", value: Math.max(0, nz(currentBalance)), fill: "#0e7490" },
      { key: "you", name: "Your contributions", value: totalYourContributed, fill: "#22d3ee" },
      { key: "emp", name: "Employer match", value: totalEmployerContributed, fill: "#8b5cf6" },
      { key: "growth", name: "Investment growth", value: Math.max(0, growth), fill: "#10b981" },
    ].filter((s) => s.value > 0.5);

    let mc: null | { p10: number; p50: number; p90: number; fanData: Pt[] } = null;
    if (viewMode === "montecarlo") {
      const sim = accumulationPaths({ startBalance: nz(currentBalance), annualContribution: totalAnnual, realReturn: effReturn, volatility, years, nPaths: 5000 });
      mc = { p10: sim.endingBalance.p10, p50: sim.endingBalance.p50, p90: sim.endingBalance.p90, fanData: sim.byYear.map((b) => ({ year: b.year, p10: b.p10, p50: b.p50, p90: b.p90, base: b.p10, band: Math.max(0, b.p90 - b.p10) })) };
    }

    return { sal, years, limit, yourContrib, overLimit, employerContrib, missedMatchAnnual, totalAnnual, taxSaved, federalSaved, stateSaved, netPaycheckCost, proj, totalYourContributed, totalEmployerContributed, growth, donut, mc, effReturn };
  }, [salary, yourContribPct, employerMatchPct, employerCapPct, currentBalance, age, retirementAge, expectedReturnPct, inflationPct, adjustForInflation, filing, state, viewMode, volatility]);

  const inputsReady = results.sal > 0 && results.years > 0;
  const stateName = STATES.find((s) => s.code === state)?.name ?? state;
  const dollarsNote = adjustForInflation ? " (today's dollars)" : "";

  const exportRows = useMemo<CsvRow[]>(() => {
    const r = results;
    const rows: CsvRow[] = [
      { Metric: "Annual salary", Value: money(r.sal) },
      { Metric: "Your contribution", Value: `${yourContribPct}% (${money(r.yourContrib)}/yr)` },
      { Metric: "2025 employee limit (your age)", Value: money(r.limit) },
      { Metric: "Employer match", Value: `${employerMatchPct}% up to ${employerCapPct}% of salary (${money(r.employerContrib)}/yr)` },
      { Metric: "Total annual contribution", Value: money(r.totalAnnual) },
      { Metric: "Federal tax saved this year", Value: money(r.federalSaved) },
      { Metric: "State tax saved this year", Value: money(r.stateSaved) },
      { Metric: "Total tax saved this year", Value: money(r.taxSaved) },
      { Metric: "Net cost to your paycheck", Value: money(r.netPaycheckCost) },
      { Metric: "Years to retirement", Value: r.years },
      { Metric: `Projected balance${dollarsNote}`, Value: money(r.proj.finalBalance) },
      { Metric: "your contributions", Value: money(r.totalYourContributed) },
      { Metric: "employer match", Value: money(r.totalEmployerContributed) },
      { Metric: "investment growth", Value: money(r.growth) },
    ];
    if (r.mc) rows.push(
      { Metric: `MC range worst 10%${dollarsNote}`, Value: money(r.mc.p10) },
      { Metric: `MC median${dollarsNote}`, Value: money(r.mc.p50) },
      { Metric: `MC best 10%${dollarsNote}`, Value: money(r.mc.p90) },
    );
    return rows;
  }, [results, yourContribPct, employerMatchPct, employerCapPct, dollarsNote]);

  const handleExportCsv = () => downloadCsv("401k-projection", exportRows);
  const handleExportPdf = () => downloadPdfReport({ filename: "401k-projection", title: "401(k) Projection", subtitle: `${money(results.proj.finalBalance)} at retirement${dollarsNote}`, rows: exportRows as PdfRow[], footerNote: "Estimates, not tax or investment advice. relocationbynumbers.com" });
  const getCurrentScenario = () => ({ label: "401(k)", url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/", subtitle: `${money(results.proj.finalBalance, 0)} at retirement`, source: "401k" });

  return (
    <div className="text-slate-900 dark:text-slate-100">
      {/* VIEW + RISK CONTROLS */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex select-none rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button type="button" onClick={() => setViewMode("average")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${viewMode === "average" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>Average</button>
          <button type="button" onClick={() => setViewMode("montecarlo")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${viewMode === "montecarlo" ? "bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-500/40 dark:bg-slate-950 dark:text-cyan-300 dark:ring-cyan-400/30" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>Market ups &amp; downs</button>
        </div>
        {viewMode === "montecarlo" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Volatility:</span>
            {(["conservative", "balanced", "aggressive"] as const).map((rk) => (
              <button key={rk} type="button" onClick={() => setRiskLevel(rk)} title={RISK_PRESETS[rk].blurb} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${riskLevel === rk ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>{RISK_PRESETS[rk].label}</button>
            ))}
            <button type="button" onClick={() => setRiskLevel("custom")} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${riskLevel === "custom" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>Custom</button>
            {riskLevel === "custom" && (<span className="inline-flex items-center gap-1"><input className="h-8 w-16 rounded-lg bg-slate-50 px-2 text-sm text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700" type="number" min="0" step="0.5" value={customVolatilityPct} onChange={(e) => setCustomVolatilityPct(e.target.value)} aria-label="Custom volatility" /><span className="text-xs text-slate-500 dark:text-slate-400">% vol</span></span>)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* INPUTS */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Contributions</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><div className={labelHeadCls}>Annual salary</div><input className={inputCls} type="number" min="0" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Your contribution (%)<InfoTip text={`Percent of salary you defer. 2025 employee limit is ${money(results.limit)} at your age.`} /></div><input className={inputCls} type="number" min="0" step="0.5" value={yourContribPct} onChange={(e) => setYourContribPct(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Employer match (%)<InfoTip text="How much of your contribution the employer matches, e.g. 50% means 50¢ per $1 you contribute." /></div><input className={inputCls} type="number" min="0" step="1" value={employerMatchPct} onChange={(e) => setEmployerMatchPct(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>…up to (% of salary)<InfoTip text="The match applies only to the first X% of salary you contribute. A common plan is '50% up to 6%.'" /></div><input className={inputCls} type="number" min="0" step="0.5" value={employerCapPct} onChange={(e) => setEmployerCapPct(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Current 401(k) balance</div><input className={inputCls} type="number" min="0" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Your age</div><input className={inputCls} type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Retirement age</div><input className={inputCls} type="number" min="0" value={retirementAge} onChange={(e) => setRetirementAge(e.target.value)} placeholder=" " /></label>
            </div>
            {results.overLimit > 0 && (
              <div className="mt-3 rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                ⚠ Your {yourContribPct}% works out to more than the {money(results.limit)} employee limit. The projection caps your contribution at the limit; the extra {money(results.overLimit)} can&apos;t go into a 401(k).
              </div>
            )}
            {results.missedMatchAnnual > 0.5 && (
              <div className="mt-3 rounded-xl border border-rose-300 bg-rose-100 px-3 py-2 text-xs leading-5 text-rose-800 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                You&apos;re leaving about {money(results.missedMatchAnnual)}/yr of free employer match on the table, contributing at least {employerCapPct}% would capture the full match.
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Assumptions</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><div className={labelHeadCls}>Expected annual return (%)</div><input className={inputCls} type="number" step="0.1" value={expectedReturnPct} onChange={(e) => setExpectedReturnPct(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Filing status</div><select className={selectCls} value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}><option value="single">Single</option><option value="married">Married (joint)</option></select></label>
              <label className="text-sm sm:col-span-2"><div className={labelHeadCls}>State</div><select className={selectCls} value={state} onChange={(e) => setState(e.target.value as StateCode)}>{STATES.map((s) => (<option key={s.code} value={s.code}>{s.name}</option>))}</select></label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input id="adj401" type="checkbox" checked={adjustForInflation} onChange={(e) => setAdjustForInflation(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800" />
              <label htmlFor="adj401" className="text-sm text-slate-700 dark:text-slate-300">Show projection in today&apos;s dollars</label>
              {adjustForInflation && (<span className="ml-auto inline-flex items-center gap-1"><input className="h-8 w-16 rounded-lg bg-slate-50 px-2 text-sm text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700" type="number" step="0.1" value={inflationPct} onChange={(e) => setInflationPct(e.target.value)} aria-label="Inflation" /><span className="text-xs text-slate-500 dark:text-slate-400">% infl.</span></span>)}
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="space-y-3">
          {!inputsReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">Enter your salary and ages to see your 401(k) projection.</div>
          ) : viewMode === "average" ? (
            <>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 text-cyan-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Projected balance at retirement{dollarsNote}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{money(results.proj.finalBalance)}</div>
                <p className="mt-2 text-sm leading-5 opacity-90">
                  {money(results.totalAnnual)}/yr in ({money(results.yourContrib)} you + <span className="font-semibold">{money(results.employerContrib)} employer match</span>), growing for {results.years} years.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">Tax saved this year</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{money(results.taxSaved)}</div>
                  <p className="mt-1 text-xs opacity-90">Contributing {money(results.yourContrib)} only lowers your take-home by {money(results.netPaycheckCost)}.</p>
                </div>
                <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/20 dark:text-violet-300">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">Employer match / yr</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{money(results.employerContrib)}</div>
                  <p className="mt-1 text-xs opacity-90">Free money, {money(results.totalEmployerContributed)} over {results.years} years before growth.</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">What makes up your balance{dollarsNote}</div>
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
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{money(s.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : results.mc ? (
            <>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 text-cyan-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Likely range at retirement{dollarsNote}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{money(results.mc.p10)} – {money(results.mc.p90)}</div>
                <p className="mt-2 text-sm leading-5 opacity-90">Across 5,000 simulated markets at {(volatility * 100).toFixed(0)}% volatility, most outcomes land here (10th–90th percentile). Median <span className="font-semibold">{money(results.mc.p50)}</span>, vs. the average view&apos;s {money(results.proj.finalBalance)}.</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Range of outcomes over time{dollarsNote}</div>
                <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Shaded band = 10th–90th percentile · line = median</div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={results.mc.fanData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                      <XAxis dataKey="year" tickFormatter={(v) => `${v}y`} tick={{ fontSize: 11 }} stroke="currentColor" />
                      <YAxis tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 11 }} width={48} stroke="currentColor" />
                      <Tooltip content={<FanTooltip />} />
                      <Area dataKey="base" stackId="band" stroke="none" fill="none" isAnimationActive={false} />
                      <Area dataKey="band" stackId="band" stroke="none" fill="#22d3ee" fillOpacity={0.22} isAnimationActive />
                      <Line dataKey="p50" stroke="#0e7490" strokeWidth={2} dot={false} isAnimationActive />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : null}

          {inputsReady && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Pre-tax 401(k) contributions lower your federal (and, in most states, state) income tax now, but not Social Security/Medicare; withdrawals in retirement are taxed as ordinary income. CA and PA tax contributions at the state level. Estimates only, not tax or investment advice.
            </div>
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
                    const shareText = `My 401(k): projected ${money(results.proj.finalBalance, 0)} at retirement.`;
                    const nav = window.navigator as unknown as { share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>; clipboard: { writeText: (t: string) => Promise<void> } };
                    if (typeof nav.share === "function") { await nav.share({ title: "My 401(k) Projection", text: shareText, url: shareUrl.toString() }); setShareStatus("shared"); }
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
