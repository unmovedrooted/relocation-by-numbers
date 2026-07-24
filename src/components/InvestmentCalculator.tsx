"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip } from "recharts";
import { accumulationPaths, RISK_PRESETS, type RiskLevel } from "../lib/monteCarlo";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

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
function realReturnRate(nominalPct: number, inflationPct: number) {
  return (1 + nominalPct / 100) / (1 + inflationPct / 100) - 1;
}

const inputCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
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
type BalPt = { year: number; balance: number; base: number; growth: number };
function GrowthTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: BalPt }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="font-semibold text-slate-900 dark:text-white">Year {d.year}</div>
      <div className="text-slate-700 dark:text-slate-300">Balance: {money(d.balance)}</div>
    </div>
  );
}

export default function InvestmentCalculator() {
  const hasMounted = useRef(false);

  const [initialAmount, setInitialAmount] = useState("10000");
  const [monthlyContribution, setMonthlyContribution] = useState("500");
  const [annualReturnPct, setAnnualReturnPct] = useState("7");
  const [years, setYears] = useState("30");
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  const [inflationPct, setInflationPct] = useState("3");

  const [viewMode, setViewMode] = useState<"average" | "montecarlo">("average");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("balanced");
  const [customVolatilityPct, setCustomVolatilityPct] = useState("13");

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const nz = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  useEffect(() => {
    const qs = getQS();
    const g = (k: string, s: (v: string) => void) => { const v = qs.get(k); if (v !== null) s(v); };
    g("initial", setInitialAmount); g("monthly", setMonthlyContribution); g("return", setAnnualReturnPct); g("years", setYears);
    g("inflation", setInflationPct);
    const adj = qs.get("real"); if (adj === "1") setAdjustForInflation(true);
    const v = qs.get("view"); if (v === "average" || v === "montecarlo") setViewMode(v);
    const rk = qs.get("risk"); if (rk === "conservative" || rk === "balanced" || rk === "aggressive" || rk === "custom") setRiskLevel(rk);
    g("vol", setCustomVolatilityPct);
  }, []);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    if (initialAmount) qs.set("initial", initialAmount);
    if (monthlyContribution) qs.set("monthly", monthlyContribution);
    if (annualReturnPct) qs.set("return", annualReturnPct);
    if (years) qs.set("years", years);
    if (adjustForInflation) { qs.set("real", "1"); if (inflationPct) qs.set("inflation", inflationPct); }
    qs.set("view", viewMode);
    if (viewMode === "montecarlo") { qs.set("risk", riskLevel); if (riskLevel === "custom" && customVolatilityPct) qs.set("vol", customVolatilityPct); }
    setQS(qs);
  }, [initialAmount, monthlyContribution, annualReturnPct, years, adjustForInflation, inflationPct, viewMode, riskLevel, customVolatilityPct]);

  const volatility = riskLevel === "custom" ? Math.max(0, nz(customVolatilityPct)) / 100 : RISK_PRESETS[riskLevel].volatilityPct / 100;

  const results = useMemo(() => {
    const start = Math.max(0, nz(initialAmount));
    const annualContribution = Math.max(0, nz(monthlyContribution)) * 12;
    const yrs = Math.max(0, Math.min(60, Math.round(nz(years))));
    const effReturn = adjustForInflation ? realReturnRate(nz(annualReturnPct), nz(inflationPct)) : nz(annualReturnPct) / 100;

    // Deterministic year-by-year (contribute start of year, then grow).
    let balance = start;
    let contributed = 0;
    const growthSeries: BalPt[] = [{ year: 0, balance: start, base: start, growth: 0 }];
    for (let y = 1; y <= yrs; y++) {
      balance += annualContribution;
      contributed += annualContribution;
      balance += balance * effReturn;
      growthSeries.push({ year: y, balance, base: start + contributed, growth: Math.max(0, balance - start - contributed) });
    }
    const finalBalance = balance;
    const totalGrowth = finalBalance - start - contributed;

    let mc: null | { p10: number; p50: number; p90: number; mean: number; fanData: Pt[] } = null;
    if (viewMode === "montecarlo") {
      const sim = accumulationPaths({ startBalance: start, annualContribution, realReturn: effReturn, volatility, years: yrs, nPaths: 5000 });
      mc = {
        p10: sim.endingBalance.p10, p50: sim.endingBalance.p50, p90: sim.endingBalance.p90, mean: sim.mean,
        fanData: sim.byYear.map((b) => ({ year: b.year, p10: b.p10, p50: b.p50, p90: b.p90, base: b.p10, band: Math.max(0, b.p90 - b.p10) })),
      };
    }

    return { start, annualContribution, yrs, effReturn, finalBalance, contributed, totalGrowth, growthSeries, mc };
  }, [initialAmount, monthlyContribution, annualReturnPct, years, adjustForInflation, inflationPct, viewMode, volatility]);

  const inputsReady = results.yrs > 0 && (results.start > 0 || results.annualContribution > 0);
  const dollarsNote = adjustForInflation ? " (today's dollars)" : "";
  const growthPct = results.finalBalance > 0 ? (results.totalGrowth / results.finalBalance) * 100 : 0;

  const exportRows = useMemo<CsvRow[]>(() => {
    const rows: CsvRow[] = [
      { Metric: "Starting amount", Value: money(results.start) },
      { Metric: "Monthly contribution", Value: money(nz(monthlyContribution)) },
      { Metric: "Expected annual return", Value: `${annualReturnPct}%` },
      { Metric: "Years", Value: results.yrs },
      { Metric: "Inflation-adjusted", Value: adjustForInflation ? `Yes (${inflationPct}% inflation)` : "No (nominal)" },
      { Metric: `Total contributed`, Value: money(results.contributed) },
      { Metric: `Final balance${dollarsNote}`, Value: money(results.finalBalance) },
      { Metric: `Total growth${dollarsNote}`, Value: money(results.totalGrowth) },
    ];
    if (results.mc) {
      rows.push(
        { Metric: "Monte Carlo volatility", Value: `${(volatility * 100).toFixed(0)}%` },
        { Metric: `Range, worst 10%${dollarsNote}`, Value: money(results.mc.p10) },
        { Metric: `Range, median${dollarsNote}`, Value: money(results.mc.p50) },
        { Metric: `Range, best 10%${dollarsNote}`, Value: money(results.mc.p90) },
      );
    }
    return rows;
  }, [results, monthlyContribution, annualReturnPct, adjustForInflation, inflationPct, dollarsNote, volatility]);

  const handleExportCsv = () => downloadCsv("investment-projection", exportRows);
  const handleExportPdf = () =>
    downloadPdfReport({
      filename: "investment-projection",
      title: "Investment Growth Projection",
      subtitle: `${money(results.finalBalance)} in ${results.yrs} years${dollarsNote}`,
      rows: exportRows as PdfRow[],
      footerNote: "Projection only, not investment advice. relocationbynumbers.com",
    });

  const getCurrentScenario = () => ({
    label: "Investment",
    url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
    subtitle: `${money(results.finalBalance, 0)} in ${results.yrs}y`,
    source: "Investment",
  });

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
              <button key={rk} type="button" onClick={() => setRiskLevel(rk)} title={RISK_PRESETS[rk].blurb}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${riskLevel === rk ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
                {RISK_PRESETS[rk].label}
              </button>
            ))}
            <button type="button" onClick={() => setRiskLevel("custom")} className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${riskLevel === "custom" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>Custom</button>
            {riskLevel === "custom" && (
              <span className="inline-flex items-center gap-1">
                <input className="h-8 w-16 rounded-lg bg-slate-50 px-2 text-sm text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700" type="number" min="0" step="0.5" value={customVolatilityPct} onChange={(e) => setCustomVolatilityPct(e.target.value)} aria-label="Custom volatility percent" />
                <span className="text-xs text-slate-500 dark:text-slate-400">% vol</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* INPUTS */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Your plan</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><div className={labelHeadCls}>Starting amount</div><input className={inputCls} type="number" min="0" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Monthly contribution</div><input className={inputCls} type="number" min="0" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Expected annual return (%)</div><input className={inputCls} type="number" step="0.1" value={annualReturnPct} onChange={(e) => setAnnualReturnPct(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Years</div><input className={inputCls} type="number" min="1" max="60" value={years} onChange={(e) => setYears(e.target.value)} placeholder=" " /></label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input id="adjInf" type="checkbox" checked={adjustForInflation} onChange={(e) => setAdjustForInflation(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800" />
              <label htmlFor="adjInf" className="text-sm text-slate-700 dark:text-slate-300">Show results in today&apos;s dollars<InfoTip text="Adjusts for inflation so the final number reflects real buying power. The portfolio then grows at your return minus inflation." /></label>
              {adjustForInflation && (
                <span className="ml-auto inline-flex items-center gap-1">
                  <input className="h-8 w-16 rounded-lg bg-slate-50 px-2 text-sm text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700" type="number" step="0.1" value={inflationPct} onChange={(e) => setInflationPct(e.target.value)} aria-label="Inflation percent" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">% infl.</span>
                </span>
              )}
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Contributions are made monthly and compounded annually{adjustForInflation ? `, with growth adjusted for ${inflationPct}% inflation (real return ${(results.effReturn * 100).toFixed(2)}%)` : ""}.
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="space-y-3">
          {!inputsReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">Enter a starting amount or contribution to see your projection.</div>
          ) : viewMode === "average" ? (
            <>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 text-cyan-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Balance in {results.yrs} years{dollarsNote}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{money(results.finalBalance)}</div>
                <p className="mt-2 text-sm leading-5 opacity-90">
                  {money(results.start)} start + {money(results.contributed)} contributed + <span className="font-semibold">{money(results.totalGrowth)}</span> growth, about {growthPct.toFixed(0)}% of the total is compound growth.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Growth over time{dollarsNote}</div>
                <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Shaded = your contributions · full height = balance incl. growth</div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={results.growthSeries} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                      <XAxis dataKey="year" tickFormatter={(v) => `${v}y`} tick={{ fontSize: 11 }} stroke="currentColor" />
                      <YAxis tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 11 }} width={48} stroke="currentColor" />
                      <Tooltip content={<GrowthTooltip />} />
                      <Area dataKey="base" stackId="g" stroke="none" fill="#22d3ee" fillOpacity={0.25} isAnimationActive />
                      <Area dataKey="growth" stackId="g" stroke="none" fill="#10b981" fillOpacity={0.35} isAnimationActive />
                      <Line dataKey="balance" stroke="#0e7490" strokeWidth={2} dot={false} isAnimationActive />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : results.mc ? (
            <>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 text-cyan-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Likely range in {results.yrs} years{dollarsNote}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{money(results.mc.p10)} – {money(results.mc.p90)}</div>
                <p className="mt-2 text-sm leading-5 opacity-90">
                  Across 5,000 simulated markets at {(volatility * 100).toFixed(0)}% volatility, most outcomes land here (10th–90th percentile). Median <span className="font-semibold">{money(results.mc.p50)}</span>, vs. the average view&apos;s {money(results.finalBalance)}.
                </p>
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
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                The median usually lands below the average-view number, that&apos;s volatility drag, and it&apos;s why a single average line tends to look optimistic. Runs 5,000 seeded lognormal simulations; a model of market risk, not a prediction.
              </div>
            </>
          ) : null}
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
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const shareUrl = new URL(window.location.href);
                      const shareText = `My investment plan: ${money(results.finalBalance, 0)} in ${results.yrs} years.`;
                      const nav = window.navigator as unknown as { share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>; clipboard: { writeText: (t: string) => Promise<void> } };
                      if (typeof nav.share === "function") { await nav.share({ title: "My Investment Projection", text: shareText, url: shareUrl.toString() }); setShareStatus("shared"); }
                      else { await nav.clipboard.writeText(shareUrl.toString()); setShareStatus("copied"); }
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
