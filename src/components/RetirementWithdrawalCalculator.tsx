"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip } from "recharts";
import { STATES, type StateCode } from "../lib/states";
import { type FilingStatus } from "../lib/tax";
import { RETIREMENT_STATE_EXEMPT, withdrawalIncomeTax } from "../lib/retirementTax";
import { withdrawalPaths, RISK_PRESETS, type RiskLevel } from "../lib/monteCarlo";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

const CAP_YEARS = 60; // horizon cap; beyond this we treat the money as effectively perpetual

// ─────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────
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

type Mode = "howLong" | "safeAmount";
type AccountType = "traditional" | "roth";

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

function StatCard({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone: "emerald" | "cyan" | "amber";
  note: string;
}) {
  const toneMap = {
    emerald:
      "border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300",
    cyan: "border-cyan-200 bg-cyan-50/70 text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300",
    amber:
      "border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300",
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${toneMap[tone]}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{value}</div>
      <p className="mt-2 text-sm leading-5 opacity-90">{note}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MATH — everything runs in REAL (today's-dollar) terms. Withdrawals are
// held constant in real terms (i.e. they grow with inflation to preserve
// buying power), and the portfolio grows at the inflation-adjusted "real"
// return. Withdrawal happens at the START of each year, then the remainder
// grows for that year.
// ─────────────────────────────────────────────────────────────────────────
function realReturnRate(nominalPct: number, inflationPct: number): number {
  const n = nominalPct / 100;
  const i = inflationPct / 100;
  return (1 + n) / (1 + i) - 1;
}

function simulate(
  startBalance: number,
  annualWithdrawalReal: number,
  r: number,
): { years: number; depletes: boolean; trajectory: number[] } {
  const trajectory: number[] = [startBalance];
  let balance = startBalance;
  if (annualWithdrawalReal <= 0) {
    for (let y = 0; y < CAP_YEARS; y++) {
      balance *= 1 + r;
      trajectory.push(balance);
    }
    return { years: CAP_YEARS, depletes: false, trajectory };
  }
  for (let y = 0; y < CAP_YEARS; y++) {
    if (balance < annualWithdrawalReal) {
      // Can't fund a full withdrawal in year y (0-indexed) → y full years funded.
      trajectory.push(0);
      return { years: y, depletes: true, trajectory };
    }
    balance -= annualWithdrawalReal;
    balance *= 1 + r;
    trajectory.push(Math.max(0, balance));
  }
  return { years: CAP_YEARS, depletes: false, trajectory };
}

// Largest level real withdrawal that keeps the balance funded for `horizon`
// full years. Consistent with simulate() by construction (binary search).
function solveSafeWithdrawal(startBalance: number, horizon: number, r: number): number {
  if (startBalance <= 0 || horizon <= 0) return 0;
  let lo = 0;
  let hi = startBalance;
  for (let iter = 0; iter < 80; iter++) {
    const mid = (lo + hi) / 2;
    const { years } = simulate(startBalance, mid, r);
    if (years >= horizon) lo = mid;
    else hi = mid;
  }
  return lo;
}

type FanPoint = { year: number; p10: number; p50: number; p90: number };
function FanTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: FanPoint }> }) {
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

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function RetirementWithdrawalCalculator() {
  const hasMounted = useRef(false);

  const [mode, setMode] = useState<Mode>("howLong");
  const [currentBalance, setCurrentBalance] = useState<string>("1000000");
  const [annualWithdrawal, setAnnualWithdrawal] = useState<string>("50000");
  const [horizonYears, setHorizonYears] = useState<string>("30");
  const [currentAge, setCurrentAge] = useState<string>("65");

  const [accountType, setAccountType] = useState<AccountType>("traditional");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [state, setState] = useState<StateCode>("ca");

  const [expectedReturnPct, setExpectedReturnPct] = useState<string>("6");
  const [inflationPct, setInflationPct] = useState<string>("3");

  const [viewMode, setViewMode] = useState<"average" | "montecarlo">("average");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("balanced");
  const [customVolatilityPct, setCustomVolatilityPct] = useState<string>("13");

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const nz = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  // ── QS HYDRATION ─────────────────────────────────────────────────────
  useEffect(() => {
    const qs = getQS();
    const vMode = qs.get("mode");
    if (vMode === "howLong" || vMode === "safeAmount") setMode(vMode);
    const vBalance = qs.get("balance"); if (vBalance) setCurrentBalance(vBalance);
    const vWithdrawal = qs.get("withdrawal"); if (vWithdrawal) setAnnualWithdrawal(vWithdrawal);
    const vHorizon = qs.get("horizon"); if (vHorizon) setHorizonYears(vHorizon);
    const vAge = qs.get("age"); if (vAge) setCurrentAge(vAge);
    const vAccount = qs.get("account");
    if (vAccount === "traditional" || vAccount === "roth") setAccountType(vAccount);
    const vFiling = qs.get("filing") as FilingStatus | null;
    if (vFiling === "single" || vFiling === "married") setFiling(vFiling);
    const vState = qs.get("state"); if (vState) setState(vState as StateCode);
    const vReturn = qs.get("return"); if (vReturn) setExpectedReturnPct(vReturn);
    const vInflation = qs.get("inflation"); if (vInflation) setInflationPct(vInflation);
    const vView = qs.get("view");
    if (vView === "average" || vView === "montecarlo") setViewMode(vView);
    const vRisk = qs.get("risk");
    if (vRisk === "conservative" || vRisk === "balanced" || vRisk === "aggressive" || vRisk === "custom") setRiskLevel(vRisk);
    const vVol = qs.get("vol"); if (vVol) setCustomVolatilityPct(vVol);
  }, []);

  // ── QS SYNC ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    qs.set("mode", mode);
    if (currentBalance) qs.set("balance", currentBalance);
    if (mode === "howLong" && annualWithdrawal) qs.set("withdrawal", annualWithdrawal);
    if (mode === "safeAmount" && horizonYears) qs.set("horizon", horizonYears);
    if (currentAge) qs.set("age", currentAge);
    qs.set("account", accountType);
    qs.set("filing", filing);
    qs.set("state", state);
    if (expectedReturnPct) qs.set("return", expectedReturnPct);
    if (inflationPct) qs.set("inflation", inflationPct);
    qs.set("view", viewMode);
    if (viewMode === "montecarlo") {
      qs.set("risk", riskLevel);
      if (riskLevel === "custom" && customVolatilityPct) qs.set("vol", customVolatilityPct);
    }
    setQS(qs);
  }, [mode, currentBalance, annualWithdrawal, horizonYears, currentAge, accountType, filing, state, expectedReturnPct, inflationPct, viewMode, riskLevel, customVolatilityPct]);

  const results = useMemo(() => {
    const balance = Math.max(0, nz(currentBalance));
    const r = realReturnRate(nz(expectedReturnPct), nz(inflationPct));
    const stateExemptOrNone = RETIREMENT_STATE_EXEMPT.has(state);

    // The gross annual withdrawal — entered directly (howLong) or solved (safeAmount).
    let grossWithdrawal: number;
    let yearsLasts: number;
    let depletes: boolean;
    let trajectory: number[];

    if (mode === "howLong") {
      grossWithdrawal = Math.max(0, nz(annualWithdrawal));
      const sim = simulate(balance, grossWithdrawal, r);
      yearsLasts = sim.years;
      depletes = sim.depletes;
      trajectory = sim.trajectory;
    } else {
      const horizon = Math.max(1, Math.round(nz(horizonYears)));
      grossWithdrawal = solveSafeWithdrawal(balance, horizon, r);
      const sim = simulate(balance, grossWithdrawal, r);
      yearsLasts = sim.years;
      depletes = sim.depletes;
      trajectory = sim.trajectory;
    }

    const tax = withdrawalIncomeTax(grossWithdrawal, state, filing, accountType);
    const afterTaxAnnual = grossWithdrawal - tax.total;
    const afterTaxMonthly = afterTaxAnnual / 12;
    const effectiveTaxRate = grossWithdrawal > 0 ? tax.total / grossWithdrawal : 0;
    const withdrawalPctOfBalance = balance > 0 ? grossWithdrawal / balance : 0;

    // 4%-rule reference: 4% of the starting balance.
    const fourPctBenchmark = balance * 0.04;

    // Depletion age (if age provided and money actually runs out).
    const ageNow = nz(currentAge);
    const depletionAge = ageNow > 0 && depletes ? ageNow + yearsLasts : null;

    // Milestone remaining balances (today's dollars) for howLong; safe
    // withdrawal at alternate horizons for safeAmount.
    const milestones =
      mode === "howLong"
        ? [5, 10, 15, 20, 25, 30].map((y) => ({
            years: y,
            value: y < trajectory.length ? trajectory[y] : depletes ? 0 : trajectory[trajectory.length - 1],
            depleted: depletes && y > yearsLasts,
          }))
        : [20, 25, 30, 35].map((y) => ({
            years: y,
            value: solveSafeWithdrawal(balance, y, r),
            depleted: false,
          }));

    return {
      realReturn: r,
      grossWithdrawal,
      yearsLasts,
      depletes,
      afterTaxAnnual,
      afterTaxMonthly,
      effectiveTaxRate,
      withdrawalPctOfBalance,
      fourPctBenchmark,
      depletionAge,
      tax,
      milestones,
      stateExemptOrNone,
      startBalance: balance,
    };
  }, [mode, currentBalance, annualWithdrawal, horizonYears, currentAge, accountType, filing, state, expectedReturnPct, inflationPct]);

  const inputsReady = results.startBalance > 0;
  const stateName = STATES.find((s) => s.code === state)?.name ?? state;
  const lastsLabel = results.depletes
    ? `${results.yearsLasts} year${results.yearsLasts === 1 ? "" : "s"}`
    : `${CAP_YEARS}+ years`;

  const volatility = riskLevel === "custom" ? Math.max(0, nz(customVolatilityPct)) / 100 : RISK_PRESETS[riskLevel].volatilityPct / 100;

  // ── MONTE CARLO ─────────────────────────────────────────────────────────
  // Runs only in Monte Carlo view. Uses the same expected real return as the
  // deterministic view (so the median reconciles) plus the chosen volatility.
  const mc = useMemo(() => {
    if (viewMode !== "montecarlo" || !inputsReady || results.grossWithdrawal <= 0) return null;
    const horizon =
      mode === "safeAmount"
        ? Math.max(1, Math.round(nz(horizonYears)))
        : nz(currentAge) > 0
          ? Math.max(5, Math.min(45, 95 - Math.round(nz(currentAge))))
          : 30;
    const maxYears = mode === "safeAmount" ? Math.max(horizon, 30) : 45;
    const sim = withdrawalPaths({
      startBalance: results.startBalance,
      annualWithdrawal: results.grossWithdrawal,
      realReturn: results.realReturn,
      volatility,
      maxYears,
      nPaths: 5000,
    });
    return {
      horizon,
      maxYears,
      successRate: sim.successRateAt(horizon),
      yearsLasted: sim.yearsLasted,
      meanYears: sim.meanYears,
      fanData: sim.byYear.map((b) => ({ year: b.year, p10: b.p10, p50: b.p50, p90: b.p90, base: b.p10, band: Math.max(0, b.p90 - b.p10) })),
    };
  }, [viewMode, inputsReady, results.startBalance, results.grossWithdrawal, results.realReturn, volatility, mode, horizonYears, currentAge]);

  // ── EXPORT ROWS (shared by CSV + PDF) ───────────────────────────────────
  const exportRows = useMemo<CsvRow[]>(() => {
    const rows: CsvRow[] = [
      { Metric: "Mode", Value: mode === "howLong" ? "How long will it last" : "Safe withdrawal amount" },
      { Metric: "Starting balance", Value: money(results.startBalance) },
      { Metric: "Account type", Value: accountType === "roth" ? "Roth (tax-free)" : "Traditional (taxable)" },
      { Metric: "Expected annual return", Value: `${expectedReturnPct}%` },
      { Metric: "Inflation", Value: `${inflationPct}%` },
      { Metric: "Real (inflation-adjusted) return", Value: `${(results.realReturn * 100).toFixed(2)}%` },
      { Metric: "Gross annual withdrawal (today's $)", Value: money(results.grossWithdrawal) },
      { Metric: "Withdrawal as % of balance", Value: `${(results.withdrawalPctOfBalance * 100).toFixed(2)}%` },
      { Metric: "State", Value: stateName },
      { Metric: "Federal tax on withdrawal", Value: money(results.tax.federal) },
      { Metric: "State tax on withdrawal", Value: results.stateExemptOrNone ? "$0 (state exempts retirement income)" : money(results.tax.state) },
      { Metric: "Effective tax rate on withdrawal", Value: `${(results.effectiveTaxRate * 100).toFixed(1)}%` },
      { Metric: "After-tax spendable per year", Value: money(results.afterTaxAnnual) },
      { Metric: "After-tax spendable per month", Value: money(results.afterTaxMonthly) },
    ];
    if (mode === "howLong") {
      rows.push({ Metric: "How long the money lasts", Value: lastsLabel });
      if (results.depletionAge) rows.push({ Metric: "Approx. age when money runs out", Value: results.depletionAge });
    } else {
      rows.push({ Metric: "Target retirement length", Value: `${horizonYears} years` });
    }
    rows.push({ Metric: "4%-rule reference withdrawal", Value: money(results.fourPctBenchmark) });
    return rows;
  }, [mode, results, accountType, expectedReturnPct, inflationPct, stateName, horizonYears, lastsLabel]);

  const handleExportCsv = () => downloadCsv("retirement-withdrawal-scenario", exportRows);

  const handleExportPdf = () => {
    downloadPdfReport({
      filename: "retirement-withdrawal-scenario",
      title: "Retirement Withdrawal Plan",
      subtitle:
        mode === "howLong"
          ? `${money(results.grossWithdrawal)}/yr from ${money(results.startBalance)} lasts ${lastsLabel}`
          : `${money(results.grossWithdrawal)}/yr sustainable for ${horizonYears} years from ${money(results.startBalance)}`,
      rows: exportRows as PdfRow[],
      footerNote: "Planning estimates only, not tax or investment advice. relocationbynumbers.com",
    });
  };

  const getCurrentScenario = () => ({
    label: "Retirement withdrawal",
    url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
    subtitle:
      mode === "howLong"
        ? `${money(results.grossWithdrawal, 0)}/yr lasts ${lastsLabel}`
        : `${money(results.grossWithdrawal, 0)}/yr for ${horizonYears}y`,
    source: "Withdrawal",
  });

  return (
    <div className="text-slate-900 dark:text-slate-100">
      {/* MODE TOGGLE */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode("howLong")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === "howLong" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
          >
            How long will it last?
          </button>
          <button
            type="button"
            onClick={() => setMode("safeAmount")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === "safeAmount" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
          >
            Safe withdrawal amount
          </button>
        </div>
      </div>

      {/* VIEW + RISK CONTROLS */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex select-none rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button type="button" onClick={() => setViewMode("average")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${viewMode === "average" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>Average</button>
          <button type="button" onClick={() => setViewMode("montecarlo")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${viewMode === "montecarlo" ? "bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-500/40 dark:bg-slate-950 dark:text-cyan-300 dark:ring-cyan-400/30" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>Market ups &amp; downs</button>
        </div>
        {viewMode === "montecarlo" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Portfolio risk:</span>
            {(["conservative", "balanced", "aggressive"] as const).map((rk) => (
              <button
                key={rk}
                type="button"
                onClick={() => setRiskLevel(rk)}
                title={RISK_PRESETS[rk].blurb}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${riskLevel === rk ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
              >
                {RISK_PRESETS[rk].label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRiskLevel("custom")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${riskLevel === "custom" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
            >
              Custom
            </button>
            {riskLevel === "custom" && (
              <span className="inline-flex items-center gap-1">
                <input
                  className="h-8 w-16 rounded-lg bg-slate-50 px-2 text-sm text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
                  type="number" min="0" step="0.5" value={customVolatilityPct}
                  onChange={(e) => setCustomVolatilityPct(e.target.value)}
                  aria-label="Custom volatility percent"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">% vol</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ================================================================
            LEFT — INPUTS
        ================================================================ */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your nest egg</div>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button type="button" onClick={() => setAccountType("traditional")} className={`rounded-lg px-3 py-1 text-sm ${accountType === "traditional" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Traditional</button>
                <button type="button" onClick={() => setAccountType("roth")} className={`rounded-lg px-3 py-1 text-sm ${accountType === "roth" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Roth</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Current retirement balance</div>
                <input className={inputCls} type="number" min="0" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} placeholder=" " />
              </label>
              {mode === "howLong" ? (
                <label className="text-sm">
                  <div className={labelHeadCls}>
                    Annual withdrawal (today&apos;s $)
                    <InfoTip text="This is your gross, pre-tax withdrawal in today's dollars. It's assumed to grow with inflation each year so your buying power stays constant. After-tax spendable is shown in the results." />
                  </div>
                  <input className={inputCls} type="number" min="0" value={annualWithdrawal} onChange={(e) => setAnnualWithdrawal(e.target.value)} placeholder=" " />
                </label>
              ) : (
                <label className="text-sm">
                  <div className={labelHeadCls}>
                    Retirement length (years)
                    <InfoTip text="How many years you want the money to last. The 4% rule is built around a 30-year retirement." />
                  </div>
                  <input className={inputCls} type="number" min="1" value={horizonYears} onChange={(e) => setHorizonYears(e.target.value)} placeholder=" " />
                </label>
              )}
              <label className="text-sm">
                <div className={labelHeadCls}>Your current age</div>
                <input className={inputCls} type="number" min="0" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} placeholder=" " />
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
                <select className={selectCls} value={state} onChange={(e) => setState(e.target.value as StateCode)}>
                  {STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </label>
            </div>
            {accountType === "roth" ? (
              <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-2 text-xs leading-5 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                Roth withdrawals are tax-free, so no income tax is applied. Your gross and after-tax withdrawal are the same.
              </div>
            ) : results.stateExemptOrNone ? (
              <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-2 text-xs leading-5 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                {stateName} does not tax qualified retirement-account withdrawals, so only federal income tax applies.
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Traditional withdrawals are taxed as ordinary income (federal + state). Payroll tax (FICA) does not apply to retirement distributions.
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Return assumptions</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>Expected annual return (%)</div>
                <input className={inputCls} type="number" step="0.1" value={expectedReturnPct} onChange={(e) => setExpectedReturnPct(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Inflation (%)
                  <InfoTip text="Withdrawals grow with inflation to hold buying power constant, and the portfolio is grown at the inflation-adjusted 'real' return. All figures are in today's dollars." />
                </div>
                <input className={inputCls} type="number" step="0.1" value={inflationPct} onChange={(e) => setInflationPct(e.target.value)} placeholder=" " />
              </label>
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Real return used: {(results.realReturn * 100).toFixed(2)}%. This is a smooth, average-return projection — it does not model market volatility or sequence-of-returns risk.
            </div>
          </div>
        </div>

        {/* ================================================================
            RIGHT — RESULTS
        ================================================================ */}
        <div className="space-y-3">
          {!inputsReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Enter your current retirement balance to see results.
            </div>
          ) : (
            <>
              {viewMode === "average" ? (
                mode === "howLong" ? (
                  <StatCard
                    label="Your money lasts"
                    value={lastsLabel}
                    tone={results.depletes && results.yearsLasts < 30 ? "amber" : "emerald"}
                    note={
                      results.depletes
                        ? results.depletionAge
                          ? `Drawing ${money(results.grossWithdrawal)}/yr, the balance runs out around age ${results.depletionAge}.`
                          : `Drawing ${money(results.grossWithdrawal)}/yr, the balance eventually runs out.`
                        : `At ${money(results.grossWithdrawal)}/yr, growth keeps pace — the balance is effectively self-sustaining over ${CAP_YEARS}+ years.`
                    }
                  />
                ) : (
                  <StatCard
                    label={`Safe withdrawal for ${horizonYears} years`}
                    value={`${money(results.grossWithdrawal)}/yr`}
                    tone="emerald"
                    note={`That's ${money(results.grossWithdrawal / 12)}/mo gross, or ${(results.withdrawalPctOfBalance * 100).toFixed(1)}% of your balance — vs. the 4%-rule reference of ${money(results.fourPctBenchmark)}/yr.`}
                  />
                )
              ) : mc ? (
                mode === "safeAmount" ? (
                  <StatCard
                    label={`Chance it lasts ${mc.horizon} years`}
                    value={`${(mc.successRate * 100).toFixed(0)}%`}
                    tone={mc.successRate >= 0.9 ? "emerald" : mc.successRate >= 0.75 ? "cyan" : "amber"}
                    note={`Across 5,000 simulated markets at ${(volatility * 100).toFixed(0)}% volatility, ${money(results.grossWithdrawal)}/yr lasted the full ${mc.horizon} years in ${(mc.successRate * 100).toFixed(0)}% of them. The average view's "safe" amount isn't guaranteed once markets swing.`}
                  />
                ) : (
                  <StatCard
                    label="How long it lasts, with market swings"
                    value={`~${Math.round(mc.yearsLasted.p50)} yrs`}
                    tone={mc.yearsLasted.p10 >= 30 ? "emerald" : mc.yearsLasted.p10 >= 20 ? "cyan" : "amber"}
                    note={`In half of 5,000 simulated markets the money lasted at least ${Math.round(mc.yearsLasted.p50)} years; in the worst 10% it ran out by year ${Math.round(mc.yearsLasted.p10)}, in the best 10% it lasted ${Math.round(mc.yearsLasted.p90)}+.`}
                  />
                )
              ) : null}

              <StatCard
                label="After-tax spendable"
                value={`${money(results.afterTaxMonthly)}/mo`}
                tone="cyan"
                note={
                  accountType === "roth"
                    ? `${money(results.afterTaxAnnual)}/yr — Roth withdrawals are tax-free.`
                    : `${money(results.afterTaxAnnual)}/yr after an estimated ${money(results.tax.total)} in income tax (${(results.effectiveTaxRate * 100).toFixed(1)}% effective) on a ${money(results.grossWithdrawal)} gross withdrawal.`
                }
              />

              {viewMode === "average" ? (
                <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                  <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {mode === "howLong" ? "Balance over time (today's $)" : "Safe withdrawal at other horizons"}
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                    {results.milestones.map((m) => (
                      <div key={m.years} className="flex justify-between">
                        <span>{mode === "howLong" ? `After ${m.years} years` : `${m.years}-year retirement`}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {mode === "howLong"
                            ? m.depleted
                              ? "Depleted"
                              : money(m.value)
                            : `${money(m.value)}/yr`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : mc ? (
                <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                  <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Range of outcomes over time (today&apos;s $)</div>
                  <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Shaded band = 10th–90th percentile balance · line = median</div>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={mc.fanData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
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
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                All figures are in today&apos;s dollars. Tax estimates treat withdrawals as your only ordinary income
                using {`${accountType === "roth" ? "Roth (tax-free)" : "traditional/taxable"}`} treatment and 2025
                federal &amp; state rules with the standard deduction; they don&apos;t include Social Security, the
                extra standard deduction at 65+, capital-gains treatment, or Required Minimum Distributions (which
                begin at age 73).{" "}
                {viewMode === "montecarlo"
                  ? "The Monte Carlo view runs 5,000 seeded simulations drawing each year's return from a lognormal distribution around your expected return at the chosen volatility — a model of market risk, not a prediction."
                  : "This is a smooth average-return projection; switch to “Market ups & downs” to model volatility and sequence-of-returns risk."}{" "}
                Planning estimates only, not tax or investment advice.
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
                      const shareText =
                        mode === "howLong"
                          ? `My retirement plan: ${money(results.grossWithdrawal, 0)}/yr lasts ${lastsLabel}.`
                          : `My retirement plan: ${money(results.grossWithdrawal, 0)}/yr sustainable for ${horizonYears} years.`;
                      const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                      if (canNativeShare) {
                        await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({
                          title: "My Retirement Withdrawal Plan", text: shareText, url: shareUrl.toString(),
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
