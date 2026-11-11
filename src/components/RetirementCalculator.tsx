"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, ComposedChart, Area, Line, XAxis, YAxis } from "recharts";
import { STATES, type StateCode } from "../lib/states";
import { type FilingStatus } from "../lib/tax";
import { RETIREMENT_STATE_EXEMPT, withdrawalIncomeTaxAtAge, representativeStateMarginalRate } from "../lib/retirementTax";
import { accumulationPaths, RISK_PRESETS, type RiskLevel } from "../lib/monteCarlo";
import { monthlyDepositFactor } from "../lib/depositTiming";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import Link from "next/link";
import { retireeIncomeTax } from "../lib/retirementStateView";
import { retirementIncomePlan, spendingInOtherState } from "../lib/retirementIncomePlan";
import { governmentState } from "../lib/governmentData";
import { TAX_YEAR } from "../lib/taxYear2026";
import SavedScenariosPanel from "./SavedScenariosPanel";

// ─────────────────────────────────────────────────────────────────────────
// This is a DESCRIPTIVE projection: it shows what your current savings path
// grows into and what income that could support. It does NOT ask for a
// target or pass any "on track / behind" judgment. All figures are in
// today's dollars (real terms): contributions are assumed to keep pace with
// inflation, and the portfolio grows at the inflation-adjusted real return.
// The 4%-rule income translation aligns with the site's Withdrawal Calculator.
// ─────────────────────────────────────────────────────────────────────────

const SAFE_WITHDRAWAL_RATE = 0.04; // classic 4% rule reference

// state kept only for the shareable-scenario source label / cross-links
// (no tax math here, this tool is pre-tax and descriptive).

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

// "advantaged" = 401k/IRA/Roth (growth tax-sheltered; state doesn't drag the
// balance). "taxable" = a regular brokerage (growth taxed annually, so the
// state's marginal rate drags the return and thus the ending balance).
type AccountKind = "traditional" | "roth" | "taxable";

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

// ─────────────────────────────────────────────────────────────────────────
// MATH, accumulation in real (today's-dollar) terms. Each year the balance grows by
// the annual return and the year's contribution arrives as twelve monthly end-of-month deposits.
// ─────────────────────────────────────────────────────────────────────────
function realReturnRate(nominalPct: number, inflationPct: number): number {
  const n = nominalPct / 100;
  const i = inflationPct / 100;
  return (1 + n) / (1 + i) - 1;
}

type Projection = {
  years: number;
  projectedBalance: number;
  startingBalance: number;
  totalContributed: number;
  growth: number;
  monthlyIncome: number;
  annualIncome: number;
};

function computeProjection(params: {
  startingBalance: number;
  annualContribution: number;
  realReturn: number;
  years: number;
}): Projection {
  const startingBalance = Math.max(0, params.startingBalance);
  const annualContribution = Math.max(0, params.annualContribution);
  const years = Math.max(0, Math.round(params.years));
  const r = params.realReturn;

  let balance = startingBalance;
  let totalContributed = 0;
  for (let y = 0; y < years; y++) {
    balance = balance * (1 + r) + annualContribution * monthlyDepositFactor(r);
    totalContributed += annualContribution;
  }
  const projectedBalance = balance;
  const growth = projectedBalance - startingBalance - totalContributed;
  const annualIncome = projectedBalance * SAFE_WITHDRAWAL_RATE;
  return {
    years,
    projectedBalance,
    startingBalance,
    totalContributed,
    growth,
    monthlyIncome: annualIncome / 12,
    annualIncome,
  };
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
export default function RetirementCalculator() {
  const hasMounted = useRef(false);

  const [currentAge, setCurrentAge] = useState<string>("30");
  const [retirementAge, setRetirementAge] = useState<string>("65");
  const [currentSavings, setCurrentSavings] = useState<string>("50000");
  const [monthlyContribution, setMonthlyContribution] = useState<string>("500");
  const [expectedReturnPct, setExpectedReturnPct] = useState<string>("7");
  const [inflationPct, setInflationPct] = useState<string>("3");
  const [state, setState] = useState<StateCode>("ca");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [accountType, setAccountType] = useState<AccountKind>("traditional");

  const [viewMode, setViewMode] = useState<"average" | "montecarlo">("average");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("balanced");
  const [customVolatilityPct, setCustomVolatilityPct] = useState<string>("13");

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");
  // Other retirement income and a spending target, in today's dollars (optional), and a second state to compare.
  const [socialSecurityMonthly, setSocialSecurityMonthly] = useState<string>("");
  const [pensionAnnual, setPensionAnnual] = useState<string>("");
  const [spendingTarget, setSpendingTarget] = useState<string>("");
  const [compareState, setCompareState] = useState<string>("");

  const nz = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  // ── QS HYDRATION ─────────────────────────────────────────────────────
  useEffect(() => {
    const qs = getQS();
    const vAge = qs.get("age"); if (vAge) setCurrentAge(vAge);
    const vRet = qs.get("retire"); if (vRet) setRetirementAge(vRet);
    const vSavings = qs.get("savings"); if (vSavings) setCurrentSavings(vSavings);
    const vContrib = qs.get("monthly"); if (vContrib) setMonthlyContribution(vContrib);
    const vReturn = qs.get("return"); if (vReturn) setExpectedReturnPct(vReturn);
    const vInflation = qs.get("inflation"); if (vInflation) setInflationPct(vInflation);
    const vState = qs.get("state"); if (vState) setState(vState as StateCode);
    const vFiling = qs.get("filing") as FilingStatus | null;
    if (vFiling === "single" || vFiling === "married") setFiling(vFiling);
    const vAccount = qs.get("account");
    if (vAccount === "advantaged" || vAccount === "traditional") setAccountType("traditional");
    else if (vAccount === "roth" || vAccount === "taxable") setAccountType(vAccount);
    const vView = qs.get("view");
    if (vView === "average" || vView === "montecarlo") setViewMode(vView);
    const vRisk = qs.get("risk");
    if (vRisk === "conservative" || vRisk === "balanced" || vRisk === "aggressive" || vRisk === "custom") setRiskLevel(vRisk);
    const vVol = qs.get("vol"); if (vVol) setCustomVolatilityPct(vVol);
    const vSs = qs.get("ss"); if (vSs) setSocialSecurityMonthly(vSs);
    const vPen = qs.get("pension"); if (vPen) setPensionAnnual(vPen);
    const vSpend = qs.get("spend"); if (vSpend) setSpendingTarget(vSpend);
    const vCmp = qs.get("compare"); if (vCmp && STATES.some((st) => st.code === vCmp)) setCompareState(vCmp);
  }, []);

  // ── QS SYNC ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    if (currentAge) qs.set("age", currentAge);
    if (retirementAge) qs.set("retire", retirementAge);
    if (currentSavings) qs.set("savings", currentSavings);
    if (monthlyContribution) qs.set("monthly", monthlyContribution);
    if (expectedReturnPct) qs.set("return", expectedReturnPct);
    if (inflationPct) qs.set("inflation", inflationPct);
    qs.set("state", state);
    qs.set("filing", filing);
    qs.set("account", accountType);
    qs.set("view", viewMode);
    if (viewMode === "montecarlo") {
      qs.set("risk", riskLevel);
      if (riskLevel === "custom" && customVolatilityPct) qs.set("vol", customVolatilityPct);
    }
    if (socialSecurityMonthly) qs.set("ss", socialSecurityMonthly);
    if (pensionAnnual) qs.set("pension", pensionAnnual);
    if (spendingTarget) qs.set("spend", spendingTarget);
    if (compareState) qs.set("compare", compareState);
    setQS(qs);
  }, [currentAge, retirementAge, currentSavings, monthlyContribution, expectedReturnPct, inflationPct, state, filing, accountType, viewMode, riskLevel, customVolatilityPct, socialSecurityMonthly, pensionAnnual, spendingTarget, compareState]);

  const results = useMemo(() => {
    const years = Math.max(0, nz(retirementAge) - nz(currentAge));
    const annualContribution = Math.max(0, nz(monthlyContribution)) * 12;
    const startingBalance = Math.max(0, nz(currentSavings));
    const isTaxable = accountType === "taxable";
    const isRoth = accountType === "roth";

    // In a taxable brokerage account, investment gains are taxed each year, so
    // the state's marginal rate drags the return (and thus the ending balance).
    // In a tax-advantaged account (401k/IRA/Roth) growth is sheltered, no drag.
    const stateReturnDrag = isTaxable ? representativeStateMarginalRate(state, filing) : 0;
    // Given a base nominal % return, apply the drag then convert to a real rate.
    const realFromNominal = (nominalPct: number) =>
      realReturnRate(nominalPct * (1 - stateReturnDrag), nz(inflationPct));

    const realReturn = realFromNominal(nz(expectedReturnPct));

    const base = computeProjection({ startingBalance, annualContribution, realReturn, years });

    // Pie slices (today's dollars). Clamp growth for geometry only, the true
    // signed value is still shown in labels/exports.
    const pie = [
      { key: "start", name: "Current savings", value: base.startingBalance, fill: "#0e7490" },
      { key: "contrib", name: "Your contributions", value: base.totalContributed, fill: "#22d3ee" },
      { key: "growth", name: "Investment growth", value: Math.max(0, base.growth), fill: "#10b981" },
    ];

    // "What if" levers, descriptive nudges, each recomputed independently.
    const leverSaveMore = computeProjection({
      startingBalance,
      annualContribution: annualContribution + 200 * 12,
      realReturn,
      years,
    });
    const leverRetireLater = computeProjection({
      startingBalance,
      annualContribution,
      realReturn,
      years: years + 3,
    });
    const leverHigherReturn = computeProjection({
      startingBalance,
      annualContribution,
      realReturn: realFromNominal(nz(expectedReturnPct) + 1),
      years,
    });

    const levers = [
      {
        key: "save",
        label: "Save $200 more / month",
        balance: leverSaveMore.projectedBalance,
        delta: leverSaveMore.projectedBalance - base.projectedBalance,
        monthlyIncome: leverSaveMore.monthlyIncome,
      },
      {
        key: "later",
        label: "Retire 3 years later",
        balance: leverRetireLater.projectedBalance,
        delta: leverRetireLater.projectedBalance - base.projectedBalance,
        monthlyIncome: leverRetireLater.monthlyIncome,
      },
      {
        key: "return",
        label: "Earn 1% more per year",
        balance: leverHigherReturn.projectedBalance,
        delta: leverHigherReturn.projectedBalance - base.projectedBalance,
        monthlyIncome: leverHigherReturn.monthlyIncome,
      },
    ];

    // After-tax supportable income. The 4%-rule figure above is gross.
    // Tax-advantaged (traditional) withdrawals are taxed as ordinary income at
    // drawdown. In a taxable brokerage the tax was already paid annually during
    // growth (that's the balance drag above), so withdrawals aren't taxed again
    // as ordinary income, the supportable income is effectively after-tax.
    const incomeTax = isTaxable || isRoth
      ? { total: 0, federal: 0, state: 0, ageAware: true }
      : withdrawalIncomeTaxAtAge(base.annualIncome, state, filing, "traditional", nz(retirementAge));
    const afterTaxAnnualIncome = base.annualIncome - incomeTax.total;
    const afterTaxMonthlyIncome = afterTaxAnnualIncome / 12;
    const incomeIsStateExempt = RETIREMENT_STATE_EXEMPT.has(state);
    const incomeEffectiveTaxRate = base.annualIncome > 0 ? incomeTax.total / base.annualIncome : 0;

    return {
      ...base,
      realReturn,
      annualContribution,
      isTaxable,
      isRoth,
      stateReturnDrag,
      pie,
      levers,
      incomeTax,
      afterTaxAnnualIncome,
      afterTaxMonthlyIncome,
      incomeIsStateExempt,
      incomeEffectiveTaxRate,
    };
  }, [currentAge, retirementAge, currentSavings, monthlyContribution, expectedReturnPct, inflationPct, state, filing, accountType]);

  const inputsReady = results.years > 0 && (results.startingBalance > 0 || results.annualContribution > 0);
  const stateName = STATES.find((s) => s.code === state)?.name ?? state;

  // The retirement income picture: portfolio withdrawals (the 4% reference) plus Social Security and a pension, taxed together as one
  // household with the age-65 deductions and the state's retirement rules, set against a spending target. Roth and taxable
  // withdrawals add no income tax here, so only Social Security and the pension are taxed for those accounts.
  const incomePicture = useMemo(() => {
    const ssAnnual = Math.max(0, nz(socialSecurityMonthly)) * 12;
    const penAnnual = Math.max(0, nz(pensionAnnual));
    const target = Math.max(0, nz(spendingTarget));
    if (ssAnnual === 0 && penAnnual === 0 && target === 0) return null;
    const portfolio = results.annualIncome;
    const taxedWithdrawals = results.isTaxable || results.isRoth ? 0 : portfolio;
    const ageForTax = Math.max(60, Math.round(nz(retirementAge)));
    const build = (st: StateCode, monthlyTarget: number) => {
      const t = retireeIncomeTax(st, { filing, age: ageForTax, socialSecurity: ssAnnual, pension: penAnnual, withdrawals: taxedWithdrawals }, 0, true);
      return retirementIncomePlan({
        portfolioIncomeAnnual: portfolio, socialSecurityAnnual: ssAnnual, pensionAnnual: penAnnual,
        spendingTargetMonthly: monthlyTarget, withdrawalRate: SAFE_WITHDRAWAL_RATE, taxAnnual: t ? t.total : null,
      });
    };
    const here = build(state, target);
    let there: { name: string; target: number; plan: ReturnType<typeof build> } | null = null;
    if (compareState && compareState !== state) {
      const level = (code: string) => governmentState(code as StateCode)?.rpp?.allItems ?? null;
      const movedTarget = spendingInOtherState(target, level(state), level(compareState));
      there = { name: STATES.find((st) => st.code === compareState)?.name ?? compareState, target: movedTarget, plan: build(compareState as StateCode, movedTarget) };
    }
    return { ssAnnual, penAnnual, target, here, there, ageForTax };
  }, [socialSecurityMonthly, pensionAnnual, spendingTarget, compareState, state, filing, retirementAge, results.annualIncome, results.isTaxable, results.isRoth]);

  // Hand the projection to the withdrawal calculator: the balance in today's dollars, starting at the retirement age, with the 4% reference
  // withdrawal as a starting point. A taxable account has no equivalent there, so the account type is only passed for traditional and Roth.
  const withdrawalHref = useMemo(() => {
    const qs = new URLSearchParams({ mode: "howLong", balance: String(Math.round(results.projectedBalance)), withdrawal: String(Math.round(results.annualIncome)) });
    if (retirementAge) qs.set("age", retirementAge);
    if (accountType !== "taxable") qs.set("account", accountType);
    qs.set("filing", filing);
    qs.set("state", state);
    if (expectedReturnPct) qs.set("return", expectedReturnPct);
    if (inflationPct) qs.set("inflation", inflationPct);
    return `/retirement-withdrawal-calculator?${qs.toString()}`;
  }, [results.projectedBalance, results.annualIncome, retirementAge, accountType, filing, state, expectedReturnPct, inflationPct]);
  const growthPct = results.projectedBalance > 0 ? (results.growth / results.projectedBalance) * 100 : 0;

  const volatility = riskLevel === "custom" ? Math.max(0, nz(customVolatilityPct)) / 100 : RISK_PRESETS[riskLevel].volatilityPct / 100;

  // ── MONTE CARLO ─────────────────────────────────────────────────────────
  // Descriptive range of outcomes, no target, no pass/fail. Same expected
  // real return as the average view (so the median reconciles) + volatility.
  const mc = useMemo(() => {
    if (viewMode !== "montecarlo" || !inputsReady) return null;
    const sim = accumulationPaths({
      startBalance: results.startingBalance,
      annualContribution: results.annualContribution,
      realReturn: results.realReturn,
      volatility,
      years: results.years,
      nPaths: 5000,
    });
    return {
      ending: sim.endingBalance,
      fanData: sim.byYear.map((b) => ({ year: b.year, p10: b.p10, p50: b.p50, p90: b.p90, base: b.p10, band: Math.max(0, b.p90 - b.p10) })),
    };
  }, [viewMode, inputsReady, results.startingBalance, results.annualContribution, results.realReturn, results.years, volatility]);

  // ── EXPORT ROWS (shared by CSV + PDF) ───────────────────────────────────
  const exportRows = useMemo<CsvRow[]>(() => {
    const rows: CsvRow[] = [
      { Metric: "Account type", Value: results.isTaxable ? "Taxable brokerage" : results.isRoth ? "Roth (401k/IRA)" : "Traditional (401k/IRA)" },
      { Metric: "Current age", Value: currentAge },
      { Metric: "Retirement age", Value: retirementAge },
      { Metric: "Years until retirement", Value: results.years },
      { Metric: "Current savings", Value: money(results.startingBalance) },
      { Metric: "Monthly contribution", Value: money(nz(monthlyContribution)) },
      { Metric: "Expected annual return", Value: `${expectedReturnPct}%` },
      { Metric: "Inflation", Value: `${inflationPct}%` },
    ];
    if (results.isTaxable) {
      rows.push({ Metric: "Annual state tax drag on return", Value: `${(results.stateReturnDrag * 100).toFixed(1)}% (${stateName})` });
    }
    rows.push(
      { Metric: "Real (inflation-adjusted) return", Value: `${(results.realReturn * 100).toFixed(2)}%` },
      { Metric: "Projected balance at retirement (today's $)", Value: money(results.projectedBalance) },
      { Metric: "from current savings", Value: money(results.startingBalance) },
      { Metric: "from your contributions", Value: money(results.totalContributed) },
      { Metric: "from investment growth", Value: money(results.growth) },
      { Metric: "Supportable income (4% rule), gross per year", Value: money(results.annualIncome) },
      { Metric: "Supportable income (4% rule), gross per month", Value: money(results.monthlyIncome) },
      { Metric: "State", Value: stateName },
      { Metric: "Filing status", Value: filing === "married" ? "Married (joint)" : "Single" },
    );
    if (results.isTaxable) {
      rows.push({ Metric: "After-tax income (already taxed during growth), per month", Value: money(results.afterTaxMonthlyIncome) });
    } else if (results.isRoth) {
      rows.push({ Metric: "After-tax income (Roth, qualified withdrawals), per month", Value: money(results.afterTaxMonthlyIncome) });
    } else {
      rows.push(
        { Metric: "Est. income tax on withdrawals", Value: results.incomeIsStateExempt ? `${money(results.incomeTax.total)} (federal only; state exempt)` : money(results.incomeTax.total) },
        { Metric: "After-tax income (traditional), per year", Value: money(results.afterTaxAnnualIncome) },
        { Metric: "After-tax income (traditional), per month", Value: money(results.afterTaxMonthlyIncome) },
      );
    }
    return rows;
  }, [currentAge, retirementAge, monthlyContribution, expectedReturnPct, inflationPct, results, stateName, filing]);

  const handleExportCsv = () => downloadCsv("retirement-projection", exportRows);

  const handleExportPdf = () => {
    downloadPdfReport({
      filename: "retirement-projection",
      title: "Retirement Savings Projection",
      subtitle: `${money(results.projectedBalance)} projected at age ${retirementAge} · ${money(results.monthlyIncome)}/mo supportable income`,
      rows: exportRows as PdfRow[],
      footerNote: "Descriptive projection in today's dollars. Not tax or investment advice. relocationbynumbers.com",
    });
  };

  const getCurrentScenario = () => ({
    label: "Retirement projection",
    url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
    subtitle: `${money(results.projectedBalance, 0)} at ${retirementAge} → ${money(results.monthlyIncome, 0)}/mo`,
    source: "Retirement",
  });

  return (
    <div className="text-slate-900 dark:text-slate-100">
      {/* VIEW + RISK CONTROLS */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex select-none rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button type="button" onClick={() => setViewMode("average")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${viewMode === "average" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>Average</button>
          <button type="button" onClick={() => setViewMode("montecarlo")} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${viewMode === "montecarlo" ? "bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-500/40 dark:bg-slate-950 dark:text-cyan-300 dark:ring-cyan-400/30" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>Range of outcomes</button>
        </div>
        {viewMode === "montecarlo" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Portfolio risk:</span>
            {(["conservative", "balanced", "aggressive"] as const).map((rk) => (
              <button key={rk} type="button" onClick={() => setRiskLevel(rk)} title={RISK_PRESETS[rk].blurb}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${riskLevel === rk ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
                {RISK_PRESETS[rk].label}
              </button>
            ))}
            <button type="button" onClick={() => setRiskLevel("custom")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${riskLevel === "custom" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}>
              Custom
            </button>
            {riskLevel === "custom" && (
              <span className="inline-flex items-center gap-1">
                <input className="h-8 w-16 rounded-lg bg-slate-50 px-2 text-sm text-slate-900 ring-1 ring-slate-200 outline-none focus:ring-4 focus:ring-cyan-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
                  type="number" min="0" step="0.5" value={customVolatilityPct} onChange={(e) => setCustomVolatilityPct(e.target.value)} aria-label="Custom volatility percent" />
                <span className="text-xs text-slate-500 dark:text-slate-400">% vol</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ================================================================
            LEFT, INPUTS
        ================================================================ */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Where you are today</div>
            <div className="mb-3">
              <div className={labelHeadCls}>
                Account type
                <InfoTip text="Traditional and Roth growth is sheltered, so the balance is the same in every state. Traditional withdrawals are taxed as income in retirement; qualified Roth withdrawals are not. In a taxable brokerage, gains are taxed each year, so your state's tax drags the return and the ending balance." />
              </div>
              <div className="inline-flex w-full select-none gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setAccountType("traditional")}
                  aria-pressed={accountType === "traditional"}
                  className={`flex-1 rounded-lg px-3 py-2 text-center leading-tight transition-all ${
                    accountType === "traditional"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="block text-sm font-semibold">Traditional</span>
                  <span className="block text-[11px] font-normal opacity-70">401k · IRA · pre-tax</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("roth")}
                  aria-pressed={accountType === "roth"}
                  className={`flex-1 rounded-lg px-3 py-2 text-center leading-tight transition-all ${
                    accountType === "roth"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="block text-sm font-semibold">Roth</span>
                  <span className="block text-[11px] font-normal opacity-70">401k · IRA · after-tax</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("taxable")}
                  aria-pressed={accountType === "taxable"}
                  className={`flex-1 rounded-lg px-3 py-2 text-center leading-tight transition-all ${
                    accountType === "taxable"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="block text-sm font-semibold">Taxable brokerage</span>
                  <span className="block text-[11px] font-normal opacity-70">Regular account</span>
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>Current age</div>
                <input className={inputCls} type="number" min="0" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Retirement age</div>
                <input className={inputCls} type="number" min="0" value={retirementAge} onChange={(e) => setRetirementAge(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Current retirement savings</div>
                <input className={inputCls} type="number" min="0" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Monthly contribution
                  <InfoTip text="How much you add each month, across all your retirement accounts. Assumed to keep pace with inflation so buying power stays constant." />
                </div>
                <input className={inputCls} type="number" min="0" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} placeholder=" " />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Retirement income and spending (optional)</div>
            <p className="mb-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Add what you expect from Social Security and a pension and what you want to spend, all in today&apos;s dollars, to see whether your income covers it.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Social Security ($/month)
                  <InfoTip text="The monthly benefit you expect at the age you start it, in today's dollars, for the whole household. Your statement at ssa.gov shows it. The calculator treats it as received from your retirement age." />
                </div>
                <input className={inputCls} type="number" value={socialSecurityMonthly} onChange={(e) => setSocialSecurityMonthly(e.target.value)} placeholder="e.g. 2400" />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Pension ($/year)</div>
                <input className={inputCls} type="number" value={pensionAnnual} onChange={(e) => setPensionAnnual(e.target.value)} placeholder="e.g. 12000" />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Spending target ($/month, after tax)
                  <InfoTip text="What you want to spend each month in retirement, in today's dollars, after income tax." />
                </div>
                <input className={inputCls} type="number" value={spendingTarget} onChange={(e) => setSpendingTarget(e.target.value)} placeholder="e.g. 5000" />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Compare retiring in another state
                  <InfoTip text="Shows the same income and spending target after moving to this state: its income tax on your retirement income, with the target scaled by its overall price level." />
                </div>
                <select className={selectCls} value={compareState} onChange={(e) => setCompareState(e.target.value)}>
                  <option value="">No comparison</option>
                  {STATES.filter((st) => st.code !== state).map((st) => (<option key={st.code} value={st.code}>{st.name}</option>))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Assumptions</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>Expected annual return (%)</div>
                <input className={inputCls} type="number" step="0.1" value={expectedReturnPct} onChange={(e) => setExpectedReturnPct(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Inflation (%)
                  <InfoTip text="The portfolio grows at the inflation-adjusted 'real' return and every figure is shown in today's dollars, so the projected balance reflects real buying power." />
                </div>
                <input className={inputCls} type="number" step="0.1" value={inflationPct} onChange={(e) => setInflationPct(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  State
                  <InfoTip text="Used to estimate income tax on retirement withdrawals for the after-tax income figure. It doesn't affect the pre-tax balance projection." />
                </div>
                <select className={selectCls} value={state} onChange={(e) => setState(e.target.value as StateCode)}>
                  {STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Filing status</div>
                <select className={selectCls} value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}>
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
                </select>
              </label>
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Real return used: {(results.realReturn * 100).toFixed(2)}%
              {results.isTaxable && results.stateReturnDrag > 0
                ? ` (after ${stateName}'s ~${(results.stateReturnDrag * 100).toFixed(1)}% annual tax drag on a taxable account)`
                : ""}.{" "}
              {viewMode === "montecarlo"
                ? `Range of outcomes simulates each year's return around this expected return at ${(volatility * 100).toFixed(0)}% volatility, to illustrate sequence-of-returns risk.`
                : "The Average view uses a fixed return, so it does not model market volatility."}{" "}
              No target or &ldquo;on track&rdquo; judgment: it simply shows where your current path lands.
              {results.isTaxable
                ? " Taxable mode applies your state's marginal income-tax rate to each year's return and does not include federal tax on investment returns, so it is best used to compare states rather than as an absolute figure; buy-and-hold investors who defer gains would see less state drag."
                : ""}
            </div>
          </div>
        </div>

        {/* ================================================================
            RIGHT, RESULTS (headline + pie)
        ================================================================ */}
        <div className="space-y-3">
          {!inputsReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Enter your age, retirement age, and savings to see your projection.
            </div>
          ) : (
            <>
              {viewMode === "average" ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 text-cyan-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Projected balance at age {retirementAge}</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{money(results.projectedBalance)}</div>
                  <p className="mt-2 text-sm leading-5 opacity-90">
                    In today&apos;s dollars, about {growthPct.toFixed(0)}% of it is investment growth. That supports roughly{" "}
                    <span className="font-semibold">{money(results.monthlyIncome)}/mo</span> ({money(results.annualIncome)}/yr) gross, using the 4% rule.
                  </p>
                  <p className="mt-2 border-t border-cyan-200/60 pt-2 text-sm leading-5 opacity-90 dark:border-cyan-900/60">
                    {results.isTaxable ? (
                      <>
                        That&apos;s effectively after-tax, a taxable brokerage is taxed as it grows (already reflected in the balance{results.stateReturnDrag > 0 ? ` via ${stateName}'s ~${(results.stateReturnDrag * 100).toFixed(1)}% annual drag` : ""}), so withdrawals aren&apos;t taxed again as income.
                      </>
                    ) : results.isRoth ? (
                      <>
                        Qualified Roth withdrawals (after age 59½ and the 5-year rule) are federal and state income-tax free, so about <span className="font-semibold">{money(results.afterTaxMonthlyIncome)}/mo</span> is yours to spend. Roth contributions are made with after-tax money, so a Roth is not directly comparable to a traditional balance of the same size.
                      </>
                    ) : results.incomeIsStateExempt ? (
                      <>
                        ≈ <span className="font-semibold">{money(results.afterTaxMonthlyIncome)}/mo</span> after federal tax, {stateName} doesn&apos;t tax qualified retirement withdrawals.
                      </>
                    ) : (
                      <>
                        ≈ <span className="font-semibold">{money(results.afterTaxMonthlyIncome)}/mo</span> after an estimated {(results.incomeEffectiveTaxRate * 100).toFixed(1)}% income tax in {stateName} (traditional). A Roth account would be tax-free. {results.incomeTax.ageAware ? `Tax is estimated for a retiree aged ${retirementAge} with this withdrawal as the only income: the standard deduction with the extra amount at 65 or older, the temporary senior deduction and ${stateName}'s rules for retirement withdrawals.` : "Tax uses the standard deduction for a filer under 65 and does not include the 10% early-withdrawal penalty that can apply before 59½."}
                      </>
                    )}
                  </p>
                </div>
              ) : mc ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-5 text-cyan-800 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Likely range at age {retirementAge}</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">{money(mc.ending.p10)} – {money(mc.ending.p90)}</div>
                  <p className="mt-2 text-sm leading-5 opacity-90">
                    Across 5,000 simulated markets at {(volatility * 100).toFixed(0)}% volatility, most outcomes land here (10th–90th percentile). The median is <span className="font-semibold">{money(mc.ending.p50)}</span>, vs. the average view&apos;s {money(results.projectedBalance)}. All in today&apos;s dollars.
                  </p>
                </div>
              ) : null}

              {incomePicture && (() => {
                const sign = (n: number) => (n < 0 ? "-" : "");
                const row = (label: string, a: string, b?: string) => (
                  <tr key={label}><td className="py-1.5 pr-3">{label}</td><td className="py-1.5 pr-3 font-semibold text-slate-900 dark:text-slate-100">{a}</td>{b !== undefined && <td className="py-1.5 font-semibold text-slate-900 dark:text-slate-100">{b}</td>}</tr>
                );
                const { here, there } = incomePicture;
                const gap = here.gapMonthly;
                return (
                  <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your retirement income at {retirementAge}</div>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[22rem] border-collapse text-sm text-slate-600 dark:text-slate-300">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            <th scope="col" className="py-1.5 pr-3 font-semibold"><span className="sr-only">Item</span></th>
                            <th scope="col" className="py-1.5 pr-3 font-semibold">{stateName}</th>
                            {there && <th scope="col" className="py-1.5 font-semibold">{there.name}</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {row("Portfolio withdrawals (4% rule)", money(results.annualIncome), there ? money(results.annualIncome) : undefined)}
                          {incomePicture.ssAnnual > 0 && row("Social Security", money(incomePicture.ssAnnual), there ? money(incomePicture.ssAnnual) : undefined)}
                          {incomePicture.penAnnual > 0 && row("Pension", money(incomePicture.penAnnual), there ? money(incomePicture.penAnnual) : undefined)}
                          {row("Income tax (federal and state)", here.taxAnnual === null ? "n/a" : money(here.taxAnnual), there ? (there.plan.taxAnnual === null ? "n/a" : money(there.plan.taxAnnual)) : undefined)}
                          {row("After-tax income a month", money(here.afterTaxMonthly), there ? money(there.plan.afterTaxMonthly) : undefined)}
                          {incomePicture.target > 0 && row("Spending target a month", money(incomePicture.target), there ? money(there.target) : undefined)}
                          {incomePicture.target > 0 && row("Left over (or short) a month", `${sign(here.gapMonthly ?? 0)}${money(Math.abs(here.gapMonthly ?? 0))}`, there ? `${sign(there.plan.gapMonthly ?? 0)}${money(Math.abs(there.plan.gapMonthly ?? 0))}` : undefined)}
                        </tbody>
                      </table>
                    </div>
                    {gap !== null && (
                      <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${gap >= 0 ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" : "bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"}`}>
                        {gap >= 0
                          ? `Your income covers your target with about ${money(gap)} a month to spare in ${stateName}.`
                          : `Your income covers about ${Math.round((here.coverage ?? 0) * 100)}% of your target in ${stateName}, ${money(Math.abs(gap))} a month short. Closing that would take about ${money(here.extraSavingsNeeded ?? 0)} more saved by ${retirementAge}.`}
                        {there && there.plan.gapMonthly !== null && ((there.plan.gapMonthly - gap) >= 1 || (there.plan.gapMonthly - gap) <= -1) &&
                          ` In ${there.name} the monthly difference changes by ${there.plan.gapMonthly - gap >= 0 ? "+" : "-"}${money(Math.abs(there.plan.gapMonthly - gap))}.`}
                      </div>
                    )}
                    <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      All amounts are in today&apos;s dollars. Income tax is for one household with these three income sources together: the {TAX_YEAR} standard deduction with the extra amount at 65 or older, the temporary senior deduction, the tax on Social Security and each state&apos;s rules for retirement income (calculated as a retiree aged {incomePicture.ageForTax}). Roth and taxable-account withdrawals are not taxed here. Social Security is treated as starting at your retirement age; it is not adjusted for when you claim. The spending target in {there ? there.name : "another state"}{" "}is scaled by that state&apos;s overall price level (Bureau of Economic Analysis). Healthcare costs, RMDs and local taxes are not included. Planning estimate, not tax advice.
                    </p>
                  </div>
                );
              })()}

              {results.projectedBalance > 0 && (
                <div data-next-step className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-sm text-slate-700 dark:border-violet-900/60 dark:bg-violet-950/20 dark:text-slate-300">
                  <p>
                    <span className="font-semibold text-slate-900 dark:text-white">Next: will it last?</span> This page projects what you save. The withdrawal calculator tests how long{" "}
                    {money(results.projectedBalance)} lasts once you start spending it, including a range of market outcomes. Your balance, retirement age, state, filing status and return
                    assumptions carry over.
                  </p>
                  <Link href={withdrawalHref} className="mt-3 inline-flex items-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
                    See how long {money(results.projectedBalance)} lasts →
                  </Link>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    For Social Security timing, RMDs, healthcare costs and taxes year by year, use the{" "}
                    <Link href="/complete-retirement-plan" className="font-semibold underline underline-offset-4 hover:no-underline">Complete Retirement Plan</Link>.
                  </p>
                </div>
              )}

              {viewMode === "average" ? (
                <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                  <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">What makes up your balance</div>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer initialDimension={{ width: 480, height: 280 }} width="100%" height="100%">
                      <PieChart>
                        <Pie data={results.pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none" isAnimationActive>
                          {results.pie.map((slice) => (
                            <Cell key={slice.key} fill={slice.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number, name: string) => [money(value), name]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#0e7490" }} />Current savings</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.startingBalance)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#22d3ee" }} />Your contributions</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.totalContributed)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#10b981" }} />Investment growth</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.growth)}</span>
                    </div>
                  </div>
                </div>
              ) : mc ? (
                <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                  <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Range of outcomes over time (today&apos;s $)</div>
                  <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Shaded band = 10th–90th percentile balance · line = median</div>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer initialDimension={{ width: 480, height: 280 }} width="100%" height="100%">
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
            </>
          )}
        </div>
      </div>

      {/* ================================================================
          WHAT-IF LEVERS (full width, average view only, deterministic)
      ================================================================ */}
      {inputsReady && viewMode === "average" && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            What if&hellip; <span className="font-normal text-slate-500 dark:text-slate-400">Small changes, big difference. Explore, no pressure.</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {results.levers.map((lever) => (
              <div key={lever.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{lever.label}</div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{money(lever.balance)}</div>
                <div className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">+{money(lever.delta)} vs. now</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">≈ {money(lever.monthlyIncome)}/mo income</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inputsReady && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Share this scenario</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current inputs and send them to a partner, advisor, or future self.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const shareUrl = new URL(window.location.href);
                      const shareText = `My retirement projection: ${money(results.projectedBalance, 0)} by age ${retirementAge}, ~${money(results.monthlyIncome, 0)}/mo.`;
                      const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                      if (canNativeShare) {
                        await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({
                          title: "My Retirement Projection", text: shareText, url: shareUrl.toString(),
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
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {shareStatus === "copied" ? "Link copied!" : shareStatus === "shared" ? "Shared!" : shareStatus === "error" ? "Share failed" : "Share scenario"}
                </button>
                <button type="button" onClick={handleExportCsv}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  Export CSV
                </button>
                <button type="button" onClick={handleExportPdf}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
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
