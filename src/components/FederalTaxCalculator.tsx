"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STATES, type StateCode } from "../lib/states";
import { getFederalStandardDeduction, getFederalBrackets, estimateNetBreakdown, type FilingStatus } from "../lib/tax";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

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

const BRACKET_COLORS = ["#22d3ee", "#0ea5e9", "#0e7490", "#8b5cf6", "#f59e0b", "#fb7185", "#ef4444"];

export default function FederalTaxCalculator() {
  const hasMounted = useRef(false);

  const [income, setIncome] = useState("100000");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [preTax, setPreTax] = useState("0");
  const [itemized, setItemized] = useState("0");
  const [includeState, setIncludeState] = useState(false);
  const [state, setState] = useState<StateCode>("ca");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const nz = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

  useEffect(() => {
    const qs = getQS();
    const gi = qs.get("income"); if (gi) setIncome(gi);
    const f = qs.get("filing") as FilingStatus | null; if (f === "single" || f === "married") setFiling(f);
    const pt = qs.get("pretax"); if (pt) setPreTax(pt);
    const it = qs.get("itemized"); if (it) setItemized(it);
    if (qs.get("state") === "1") setIncludeState(true);
    const st = qs.get("st"); if (st) setState(st as StateCode);
  }, []);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    if (income) qs.set("income", income);
    qs.set("filing", filing);
    if (nz(preTax) > 0) qs.set("pretax", preTax);
    if (nz(itemized) > 0) qs.set("itemized", itemized);
    if (includeState) { qs.set("state", "1"); qs.set("st", state); }
    setQS(qs);
  }, [income, filing, preTax, itemized, includeState, state]);

  const results = useMemo(() => {
    const gross = Math.max(0, nz(income));
    const preTaxN = Math.max(0, nz(preTax));
    const stdDed = getFederalStandardDeduction(filing);
    const itemizedN = Math.max(0, nz(itemized));
    const deductionUsed = Math.max(stdDed, itemizedN);
    const usingItemized = itemizedN > stdDed;
    const agi = Math.max(0, gross - preTaxN);
    const taxable = Math.max(0, agi - deductionUsed);

    const brackets = getFederalBrackets(filing);
    let prev = 0;
    let tax = 0;
    let marginalRate = 0;
    const perBracket: { rate: number; lower: number; upper: number; amount: number; taxInBracket: number; color: string }[] = [];
    brackets.forEach((b, i) => {
      const upper = b.upTo;
      const amount = Math.max(0, Math.min(taxable, upper) - prev);
      if (amount > 0) {
        const taxInBracket = amount * b.rate;
        tax += taxInBracket;
        marginalRate = b.rate;
        perBracket.push({ rate: b.rate, lower: prev, upper, amount, taxInBracket, color: BRACKET_COLORS[i] ?? "#0e7490" });
      }
      prev = upper;
    });

    const effectiveOfGross = gross > 0 ? tax / gross : 0;
    const effectiveOfTaxable = taxable > 0 ? tax / taxable : 0;

    // Optional state tax + combined.
    let stateTax = 0;
    if (includeState) {
      const b = estimateNetBreakdown({ grossAnnual: gross, state, filing, k401Pct: 0, k401Dollar: preTaxN });
      stateTax = b.state;
    }
    const combinedTax = tax + stateTax;
    const combinedEffective = gross > 0 ? combinedTax / gross : 0;

    return { gross, agi, stdDed, deductionUsed, usingItemized, taxable, tax, marginalRate, perBracket, effectiveOfGross, effectiveOfTaxable, stateTax, combinedTax, combinedEffective, afterTax: gross - combinedTax };
  }, [income, filing, preTax, itemized, includeState, state]);

  const inputsReady = results.gross > 0;
  const stateName = STATES.find((s) => s.code === state)?.name ?? state;

  const exportRows = useMemo<CsvRow[]>(() => {
    const r = results;
    const rows: CsvRow[] = [
      { Metric: "Gross income", Value: money(r.gross) },
      { Metric: "Filing status", Value: filing === "married" ? "Married (joint)" : "Single" },
      { Metric: "Pre-tax deductions (401k/HSA)", Value: money(nz(preTax)) },
      { Metric: r.usingItemized ? "Itemized deductions" : "Standard deduction", Value: money(r.deductionUsed) },
      { Metric: "Taxable income", Value: money(r.taxable) },
      { Metric: "Federal income tax", Value: money(r.tax) },
      { Metric: "Marginal tax rate", Value: `${(r.marginalRate * 100).toFixed(0)}%` },
      { Metric: "Effective rate (of gross income)", Value: `${(r.effectiveOfGross * 100).toFixed(2)}%` },
      { Metric: "Effective rate (of taxable income)", Value: `${(r.effectiveOfTaxable * 100).toFixed(2)}%` },
    ];
    if (includeState) rows.push(
      { Metric: `State income tax (${stateName})`, Value: money(r.stateTax) },
      { Metric: "Federal + state tax", Value: money(r.combinedTax) },
      { Metric: "Combined effective rate", Value: `${(r.combinedEffective * 100).toFixed(2)}%` },
    );
    for (const b of r.perBracket) rows.push({ Metric: `${(b.rate * 100).toFixed(0)}% bracket`, Value: `${money(b.amount)} taxed → ${money(b.taxInBracket)}` });
    return rows;
  }, [results, filing, preTax, includeState, stateName]);

  const handleExportCsv = () => downloadCsv("federal-tax", exportRows);
  const handleExportPdf = () => downloadPdfReport({ filename: "federal-tax", title: "Federal Income Tax Breakdown", subtitle: `${money(results.tax)} federal tax · ${(results.effectiveOfGross * 100).toFixed(1)}% effective, ${(results.marginalRate * 100).toFixed(0)}% marginal`, rows: exportRows as PdfRow[], footerNote: "2025 federal brackets, standard deduction. Not tax advice. relocationbynumbers.com" });
  const getCurrentScenario = () => ({ label: "Federal tax", url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/", subtitle: `${money(results.tax, 0)} · ${(results.effectiveOfGross * 100).toFixed(1)}% eff`, source: "FederalTax" });

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* INPUTS */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Your income</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2"><div className={labelHeadCls}>Gross annual income</div><input className={inputCls} type="number" min="0" value={income} onChange={(e) => setIncome(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Filing status</div><select className={selectCls} value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}><option value="single">Single</option><option value="married">Married (joint)</option></select></label>
              <label className="text-sm"><div className={labelHeadCls}>Pre-tax deductions<InfoTip text="Traditional 401(k), HSA, and similar contributions that reduce taxable income before deductions." /></div><input className={inputCls} type="number" min="0" value={preTax} onChange={(e) => setPreTax(e.target.value)} placeholder=" " /></label>
              <label className="text-sm sm:col-span-2"><div className={labelHeadCls}>Itemized deductions (optional)<InfoTip text={`Leave at 0 to use the ${filing === "married" ? "$31,500" : "$15,750"} standard deduction. Enter a higher itemized total to use it instead.`} /></div><input className={inputCls} type="number" min="0" value={itemized} onChange={(e) => setItemized(e.target.value)} placeholder=" " /></label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input id="incState" type="checkbox" checked={includeState} onChange={(e) => setIncludeState(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800" />
              <label htmlFor="incState" className="text-sm text-slate-700 dark:text-slate-300">Add state income tax</label>
              {includeState && (<select className={`${selectCls} ml-auto h-8 w-40`} value={state} onChange={(e) => setState(e.target.value as StateCode)}>{STATES.map((s) => (<option key={s.code} value={s.code}>{s.name}</option>))}</select>)}
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">Uses 2025 federal brackets and the standard deduction. This is income tax only — it doesn&apos;t include Social Security/Medicare (FICA); for full take-home, use the paycheck calculator.</div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="space-y-3">
          {!inputsReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">Enter your income to see your federal tax.</div>
          ) : (
            <>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 text-cyan-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">{includeState ? "Federal + state income tax" : "Federal income tax"}</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{money(includeState ? results.combinedTax : results.tax)}</div>
                <p className="mt-2 text-sm leading-5 opacity-90">
                  On {money(results.taxable)} taxable income ({money(results.gross)} − {money(results.deductionUsed)} {results.usingItemized ? "itemized" : "standard"} deduction{nz(preTax) > 0 ? ` − ${money(nz(preTax))} pre-tax` : ""}). Effective rate <span className="font-semibold">{((includeState ? results.combinedEffective : results.effectiveOfGross) * 100).toFixed(1)}%</span>, top marginal rate {(results.marginalRate * 100).toFixed(0)}%{includeState ? ` (federal)` : ""}.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Marginal</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{(results.marginalRate * 100).toFixed(0)}%</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Effective</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{(results.effectiveOfGross * 100).toFixed(1)}%</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">After tax</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{money(results.afterTax)}</div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">How your income fills the brackets</div>
                {results.perBracket.length > 0 ? (
                  <>
                    <div className="mb-3 flex h-4 w-full overflow-hidden rounded-full">
                      {results.perBracket.map((b) => (
                        <div key={b.rate} style={{ width: `${(b.amount / results.taxable) * 100}%`, background: b.color }} title={`${(b.rate * 100).toFixed(0)}%`} />
                      ))}
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {results.perBracket.map((b) => (
                        <div key={b.rate} className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: b.color }} />{(b.rate * 100).toFixed(0)}% on {money(b.amount)}</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{money(b.taxInBracket)}</span>
                        </div>
                      ))}
                      {includeState && (
                        <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 dark:border-slate-700">
                          <span className="text-slate-700 dark:text-slate-300">State income tax ({stateName})</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.stateTax)}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your deductions exceed your income — no federal income tax owed.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Your marginal rate is the rate on your last dollar; your effective rate is total tax divided by income — always lower, because the first dollars are taxed at lower rates. Estimates use 2025 federal brackets and the standard deduction and don&apos;t include credits, the QBI deduction, AMT, capital-gains rates, or FICA. Not tax advice.
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
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current inputs and send them to a partner, accountant, or future self.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={async () => {
                  try {
                    const shareUrl = new URL(window.location.href);
                    const shareText = `My federal tax: ${money(results.tax, 0)} (${(results.effectiveOfGross * 100).toFixed(1)}% effective).`;
                    const nav = window.navigator as unknown as { share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>; clipboard: { writeText: (t: string) => Promise<void> } };
                    if (typeof nav.share === "function") { await nav.share({ title: "My Federal Tax", text: shareText, url: shareUrl.toString() }); setShareStatus("shared"); }
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
