"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";
import { STATES, type StateCode } from "../lib/states";
import { estimateNetBreakdown, type FilingStatus } from "../lib/tax";
import { RETIREMENT_STATE_EXEMPT, representativeStateMarginalRate } from "../lib/retirementTax";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

// ─────────────────────────────────────────────────────────────────────────
// A Roth conversion moves money from a traditional (pre-tax) 401k/IRA into a
// Roth: you pay ordinary income tax now, in exchange for tax-free growth and
// withdrawals later. This calculator compares the after-tax value of two
// paths at withdrawal, convert now vs. keep it traditional, and the
// break-even future tax rate. All figures are in today's dollars.
//
// Rules reflected: conversions have no income limit, are taxed as ordinary
// income (federal + state; no FICA) in the conversion year, and can't be
// undone. Assumes the converted amount is fully pre-tax (the pro-rata rule
// for after-tax basis isn't modeled).
// ─────────────────────────────────────────────────────────────────────────

type PayTaxFrom = "converted" | "outside";

function money(n: number, digits: number = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function getQS() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function setQS(params: URLSearchParams) {
  if (typeof window === "undefined") return;
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

const inputCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
const selectCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600 dark:text-slate-400";

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        i
      </button>
      <span className="pointer-events-none absolute top-full left-0 z-50 mt-2 hidden max-w-[calc(100vw-2rem)] w-72 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-5 text-white shadow-xl group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function realReturnRate(nominalPct: number, inflationPct: number): number {
  return (1 + nominalPct / 100) / (1 + inflationPct / 100) - 1;
}

// Federal + state ordinary income tax (no FICA), with retirement-income-exempt
// states zeroed on the state portion (a conversion is a distribution).
function ordinaryTax(income: number, state: StateCode, filing: FilingStatus): { federal: number; state: number } {
  if (income <= 0) return { federal: 0, state: 0 };
  const b = estimateNetBreakdown({ grossAnnual: income, state, filing, k401Pct: 0 });
  return { federal: b.federal, state: RETIREMENT_STATE_EXEMPT.has(state) ? 0 : b.state };
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function RothConversionCalculator() {
  const hasMounted = useRef(false);

  const [amountToConvert, setAmountToConvert] = useState<string>("100000");
  const [payTaxFrom, setPayTaxFrom] = useState<PayTaxFrom>("converted");
  const [currentIncome, setCurrentIncome] = useState<string>("80000");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [state, setState] = useState<StateCode>("ca");
  const [retirementTaxRatePct, setRetirementTaxRatePct] = useState<string>("22");
  const [yearsToGrow, setYearsToGrow] = useState<string>("20");
  const [expectedReturnPct, setExpectedReturnPct] = useState<string>("7");
  const [inflationPct, setInflationPct] = useState<string>("3");

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const nz = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  // ── QS HYDRATION ─────────────────────────────────────────────────────
  useEffect(() => {
    const qs = getQS();
    const vAmt = qs.get("amount"); if (vAmt) setAmountToConvert(vAmt);
    const vPay = qs.get("payFrom");
    if (vPay === "converted" || vPay === "outside") setPayTaxFrom(vPay);
    const vIncome = qs.get("income"); if (vIncome) setCurrentIncome(vIncome);
    const vFiling = qs.get("filing") as FilingStatus | null;
    if (vFiling === "single" || vFiling === "married") setFiling(vFiling);
    const vState = qs.get("state"); if (vState) setState(vState as StateCode);
    const vRet = qs.get("retRate"); if (vRet) setRetirementTaxRatePct(vRet);
    const vYears = qs.get("years"); if (vYears) setYearsToGrow(vYears);
    const vReturn = qs.get("return"); if (vReturn) setExpectedReturnPct(vReturn);
    const vInflation = qs.get("inflation"); if (vInflation) setInflationPct(vInflation);
  }, []);

  // ── QS SYNC ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    if (amountToConvert) qs.set("amount", amountToConvert);
    qs.set("payFrom", payTaxFrom);
    if (currentIncome) qs.set("income", currentIncome);
    qs.set("filing", filing);
    qs.set("state", state);
    if (retirementTaxRatePct) qs.set("retRate", retirementTaxRatePct);
    if (yearsToGrow) qs.set("years", yearsToGrow);
    if (expectedReturnPct) qs.set("return", expectedReturnPct);
    if (inflationPct) qs.set("inflation", inflationPct);
    setQS(qs);
  }, [amountToConvert, payTaxFrom, currentIncome, filing, state, retirementTaxRatePct, yearsToGrow, expectedReturnPct, inflationPct]);

  const results = useMemo(() => {
    const C = Math.max(0, nz(amountToConvert));
    const income = Math.max(0, nz(currentIncome));
    const tRet = Math.min(1, Math.max(0, nz(retirementTaxRatePct) / 100));
    const years = Math.max(0, Math.round(nz(yearsToGrow)));

    // Conversion tax = marginal federal + state on the converted amount stacked
    // on top of current income (spans brackets automatically).
    const taxWithout = ordinaryTax(income, state, filing);
    const taxWith = ordinaryTax(income + C, state, filing);
    const convFederal = Math.max(0, taxWith.federal - taxWithout.federal);
    const convState = Math.max(0, taxWith.state - taxWithout.state);
    const conversionTax = convFederal + convState;
    const effectiveCurrentRate = C > 0 ? conversionTax / C : 0;

    // Growth factors (real / today's dollars).
    const g = Math.pow(1 + realReturnRate(nz(expectedReturnPct), nz(inflationPct)), years);
    const drag = representativeStateMarginalRate(state, filing);
    const gTaxable = Math.pow(1 + realReturnRate(nz(expectedReturnPct) * (1 - drag), nz(inflationPct)), years);

    let rothFinal: number;
    let tradFinal: number;
    let sideAccountFinal = 0;
    let breakEvenRate: number;

    if (payTaxFrom === "converted") {
      // Tax withheld from the conversion: only the remainder lands in the Roth.
      rothFinal = (C - conversionTax) * g;
      tradFinal = C * g * (1 - tRet);
      breakEvenRate = effectiveCurrentRate; // convert if you expect a higher rate later
    } else {
      // Tax paid from outside savings: full C converts and grows tax-free. The
      // traditional path keeps that outside money invested in a taxable account.
      rothFinal = C * g;
      sideAccountFinal = conversionTax * gTaxable;
      tradFinal = C * g * (1 - tRet) + sideAccountFinal;
      breakEvenRate = g > 0 ? effectiveCurrentRate * (gTaxable / g) : effectiveCurrentRate;
    }

    const difference = rothFinal - tradFinal;
    const rothWins = difference > 0;

    const chartData = [
      { name: "Convert to Roth", value: rothFinal, fill: "#10b981" },
      { name: "Keep Traditional", value: tradFinal, fill: "#0e7490" },
    ];

    return {
      C,
      conversionTax,
      convFederal,
      convState,
      effectiveCurrentRate,
      tRet,
      years,
      g,
      drag,
      rothFinal,
      tradFinal,
      sideAccountFinal,
      breakEvenRate,
      difference,
      rothWins,
      chartData,
      stateExempt: RETIREMENT_STATE_EXEMPT.has(state),
    };
  }, [amountToConvert, payTaxFrom, currentIncome, filing, state, retirementTaxRatePct, yearsToGrow, expectedReturnPct, inflationPct]);

  const inputsReady = results.C > 0;
  const stateName = STATES.find((s) => s.code === state)?.name ?? state;

  // ── EXPORT ROWS ─────────────────────────────────────────────────────────
  const exportRows = useMemo<CsvRow[]>(() => {
    return [
      { Metric: "Amount to convert", Value: money(results.C) },
      { Metric: "Pay conversion tax from", Value: payTaxFrom === "converted" ? "The converted funds" : "Outside savings" },
      { Metric: "Current income", Value: money(nz(currentIncome)) },
      { Metric: "Filing status", Value: filing === "married" ? "Married (joint)" : "Single" },
      { Metric: "State", Value: stateName },
      { Metric: "Conversion tax now (federal)", Value: money(results.convFederal) },
      { Metric: "Conversion tax now (state)", Value: results.stateExempt ? "$0 (state exempts retirement income)" : money(results.convState) },
      { Metric: "Conversion tax now (total)", Value: money(results.conversionTax) },
      { Metric: "Effective tax rate on conversion", Value: `${(results.effectiveCurrentRate * 100).toFixed(1)}%` },
      { Metric: "Assumed retirement tax rate", Value: `${retirementTaxRatePct}%` },
      { Metric: "Break-even retirement tax rate", Value: `${(results.breakEvenRate * 100).toFixed(1)}%` },
      { Metric: "Years until withdrawal", Value: results.years },
      { Metric: "Expected annual return", Value: `${expectedReturnPct}%` },
      { Metric: "Inflation", Value: `${inflationPct}%` },
      { Metric: "Convert to Roth, after-tax value (today's $)", Value: money(results.rothFinal) },
      { Metric: "Keep Traditional, after-tax value (today's $)", Value: money(results.tradFinal) },
      { Metric: results.rothWins ? "Converting comes out ahead by" : "Keeping traditional comes out ahead by", Value: money(Math.abs(results.difference)) },
    ];
  }, [results, payTaxFrom, currentIncome, filing, stateName, retirementTaxRatePct, expectedReturnPct, inflationPct]);

  const handleExportCsv = () => downloadCsv("roth-conversion-scenario", exportRows);

  const handleExportPdf = () => {
    downloadPdfReport({
      filename: "roth-conversion-scenario",
      title: "Roth Conversion Comparison",
      subtitle: `Convert ${money(results.C)} · ${results.rothWins ? "Roth" : "Traditional"} ahead by ${money(Math.abs(results.difference))} in ${results.years} years`,
      rows: exportRows as PdfRow[],
      footerNote: "Comparison in today's dollars. Not tax or investment advice. relocationbynumbers.com",
    });
  };

  const getCurrentScenario = () => ({
    label: "Roth conversion",
    url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
    subtitle: `Convert ${money(results.C, 0)} → ${results.rothWins ? "Roth" : "Traditional"} +${money(Math.abs(results.difference), 0)}`,
    source: "Roth",
  });

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ================================================================
            LEFT, INPUTS
        ================================================================ */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">The conversion</div>
            <label className="text-sm">
              <div className={labelHeadCls}>
                Amount to convert
                <InfoTip text="How much you'd move from a traditional 401k/IRA into a Roth. This whole amount is taxed as ordinary income in the conversion year." />
              </div>
              <input className={inputCls} type="number" min="0" value={amountToConvert} onChange={(e) => setAmountToConvert(e.target.value)} placeholder=" " />
            </label>
            <div className="mt-3">
              <div className={labelHeadCls}>
                Pay the conversion tax from
                <InfoTip text="Paying from outside savings lets the full amount grow tax-free and generally works out better. Paying from the converted funds is simpler but shrinks the Roth (and can trigger a 10% penalty on the withheld amount if you're under 59½)." />
              </div>
              <div className="inline-flex w-full select-none gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setPayTaxFrom("converted")}
                  aria-pressed={payTaxFrom === "converted"}
                  className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold leading-tight transition-all ${payTaxFrom === "converted" ? "bg-white text-cyan-700 shadow-md ring-1 ring-cyan-500/40 dark:bg-slate-950 dark:text-cyan-300 dark:ring-cyan-400/30" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                >
                  The converted funds
                </button>
                <button
                  type="button"
                  onClick={() => setPayTaxFrom("outside")}
                  aria-pressed={payTaxFrom === "outside"}
                  className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold leading-tight transition-all ${payTaxFrom === "outside" ? "bg-white text-cyan-700 shadow-md ring-1 ring-cyan-500/40 dark:bg-slate-950 dark:text-cyan-300 dark:ring-cyan-400/30" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
                >
                  Outside savings
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Your taxes this year</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>
                  Other taxable income this year
                  <InfoTip text="Your income before the conversion. The conversion stacks on top, so this determines which brackets the converted amount falls into." />
                </div>
                <input className={inputCls} type="number" min="0" value={currentIncome} onChange={(e) => setCurrentIncome(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Filing status</div>
                <select className={selectCls} value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}>
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>State</div>
                <select className={selectCls} value={state} onChange={(e) => setState(e.target.value as StateCode)}>
                  {STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Later</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Expected retirement tax rate (%)
                  <InfoTip text="The tax rate you expect on withdrawals in retirement. If you'll be in a lower bracket later, converting is less attractive; if higher, it's more attractive." />
                </div>
                <input className={inputCls} type="number" step="0.1" value={retirementTaxRatePct} onChange={(e) => setRetirementTaxRatePct(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Years until withdrawal</div>
                <input className={inputCls} type="number" min="0" value={yearsToGrow} onChange={(e) => setYearsToGrow(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Expected annual return (%)</div>
                <input className={inputCls} type="number" step="0.1" value={expectedReturnPct} onChange={(e) => setExpectedReturnPct(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Inflation (%)</div>
                <input className={inputCls} type="number" step="0.1" value={inflationPct} onChange={(e) => setInflationPct(e.target.value)} placeholder=" " />
              </label>
            </div>
          </div>
        </div>

        {/* ================================================================
            RIGHT, RESULTS
        ================================================================ */}
        <div className="space-y-3">
          {!inputsReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Enter an amount to convert to see the comparison.
            </div>
          ) : (
            <>
              <div className={`rounded-2xl border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${results.rothWins ? "border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300" : "border-cyan-200 bg-cyan-50/70 text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300"}`}>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Under these assumptions</div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  {results.rothWins ? "Converting" : "Keeping it traditional"} comes out ahead
                </div>
                <p className="mt-2 text-sm leading-5 opacity-90">
                  by <span className="font-semibold">{money(Math.abs(results.difference))}</span> in after-tax value after {results.years} years (today&apos;s dollars). Break-even retirement tax rate: <span className="font-semibold">{(results.breakEvenRate * 100).toFixed(1)}%</span>, convert if you expect to be above it, keep traditional if below.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">After-tax value at withdrawal</div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.chartData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="currentColor" />
                      <YAxis tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} width={48} stroke="currentColor" />
                      <Tooltip
                        formatter={(value: number) => [money(value), "After-tax value"]}
                        contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive>
                        {results.chartData.map((d) => (
                          <Cell key={d.name} fill={d.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Tax due now on the conversion</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.conversionTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective rate on the conversion</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{(results.effectiveCurrentRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Convert to Roth, after-tax value</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{money(results.rothFinal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Keep traditional, after-tax value</span>
                    <span className="font-semibold text-cyan-700 dark:text-cyan-300">{money(results.tradFinal)}</span>
                  </div>
                  {payTaxFrom === "outside" && (
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>&nbsp;&nbsp;↳ incl. preserved outside savings, invested</span>
                      <span>{money(results.sideAccountFinal)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                A Roth conversion can&apos;t be undone, and the converted amount is taxed as ordinary income this year, a
                large conversion can push you into higher brackets, raise Medicare (IRMAA) premiums, or affect ACA
                subsidies. The 5-year rule applies to converted amounts before 59½. This assumes the converted balance is
                fully pre-tax (no after-tax basis / pro-rata blending) and uses a single assumed retirement tax rate.
                Comparison only, not tax or investment advice.
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
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const shareUrl = new URL(window.location.href);
                      const shareText = `Roth conversion of ${money(results.C, 0)}: ${results.rothWins ? "converting" : "keeping traditional"} wins by ${money(Math.abs(results.difference), 0)}.`;
                      const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                      if (canNativeShare) {
                        await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({
                          title: "My Roth Conversion Comparison", text: shareText, url: shareUrl.toString(),
                        });
                        setShareStatus("shared");
                      } else {
                        await navigator.clipboard.writeText(shareUrl.toString());
                        setShareStatus("copied");
                      }
                      window.setTimeout(() => setShareStatus("idle"), 2500);
                    } catch {
                      try { await navigator.clipboard.writeText(window.location.href); setShareStatus("copied"); }
                      catch { setShareStatus("error"); }
                      window.setTimeout(() => setShareStatus("idle"), 2500);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {shareStatus === "copied" ? "Link copied!" : shareStatus === "shared" ? "Shared!" : shareStatus === "error" ? "Share failed" : "Share scenario"}
                </button>
                <button type="button" onClick={handleExportCsv}
                  className="inline-flex items-center justify-center rounded-xl border border-cyan-300 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-800 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-slate-950">
                  Export CSV
                </button>
                <button type="button" onClick={handleExportPdf}
                  className="inline-flex items-center justify-center rounded-xl border border-cyan-300 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-800 dark:bg-slate-900 dark:text-cyan-300 dark:hover:bg-slate-950">
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          <SavedScenariosPanel getCurrentScenario={getCurrentScenario} />
        </div>
      )}
    </div>
  );
}
