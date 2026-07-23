"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STATES, type StateCode } from "../lib/states";
import { estimateNetBreakdown, type FilingStatus } from "../lib/tax";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

// ─────────────────────────────────────────────────────────────────────────
// 2025 IRS / HHS FIGURES — this calculator's base tax year, matching
// src/lib/tax.ts's TAX_YEAR constant. Update both together each January.
// ─────────────────────────────────────────────────────────────────────────
const HSA_LIMITS = {
  self: 4_300,
  family: 8_550,
  catchUp55: 1_000,
} as const;

const HDHP_MIN_DEDUCTIBLE = { self: 1_650, family: 3_300 };
const HDHP_MAX_OOP = { self: 8_300, family: 16_600 };

// California and New Jersey are the only two states that do not conform to
// the federal HSA tax exemption: contributions are after-tax for state
// purposes, and investment earnings inside the HSA are taxed annually as
// ordinary income (not tax-deferred/tax-free the way they are federally).
// Source: verified against CA FTB / NJ Division of Taxation guidance.
const HSA_NONCONFORMING_STATES = new Set<StateCode>(["ca", "nj"]);

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

type CoverageType = "self" | "family";

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
  amount,
  suffix,
  tone,
  note,
}: {
  label: string;
  amount: number;
  suffix?: string;
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
      <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        {money(amount)}
        {suffix ? <span className="ml-1 text-sm font-medium opacity-70">{suffix}</span> : null}
      </div>
      <p className="mt-2 text-sm leading-5 opacity-90">{note}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// GROWTH PROJECTION — contribute at the start of each year, then apply one
// year of growth. effectiveReturn already has any CA/NJ annual state tax
// drag baked in by the caller.
// ─────────────────────────────────────────────────────────────────────────
function projectBalance(startBalance: number, annualContribution: number, effectiveReturn: number, years: number) {
  let balance = Math.max(0, startBalance);
  let totalContributed = 0;
  const safeYears = Math.max(0, Math.round(years));
  for (let y = 0; y < safeYears; y++) {
    balance += annualContribution;
    totalContributed += annualContribution;
    balance += balance * effectiveReturn;
  }
  return { finalBalance: balance, totalContributed };
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function HsaCalculator() {
  const hasMounted = useRef(false);

  const [age, setAge] = useState<string>("35");
  const [coverageType, setCoverageType] = useState<CoverageType>("family");
  const [yourContribution, setYourContribution] = useState<string>(String(HSA_LIMITS.family));
  const [employerContribution, setEmployerContribution] = useState<string>("0");
  const [currentBalance, setCurrentBalance] = useState<string>("5000");

  const [grossAnnualIncome, setGrossAnnualIncome] = useState<string>("95000");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [state, setState] = useState<StateCode>("ca");

  const [expectedReturnPct, setExpectedReturnPct] = useState<string>("7");
  const [yearsToGrow, setYearsToGrow] = useState<string>("20");

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const nz = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  // ── QS HYDRATION ─────────────────────────────────────────────────────
  useEffect(() => {
    const qs = getQS();
    const vAge = qs.get("age"); if (vAge) setAge(vAge);
    const vCoverage = qs.get("coverage");
    if (vCoverage === "self" || vCoverage === "family") setCoverageType(vCoverage);
    const vYourContrib = qs.get("yourContrib"); if (vYourContrib) setYourContribution(vYourContrib);
    const vEmployerContrib = qs.get("employerContrib"); if (vEmployerContrib) setEmployerContribution(vEmployerContrib);
    const vBalance = qs.get("balance"); if (vBalance) setCurrentBalance(vBalance);
    const vIncome = qs.get("income"); if (vIncome) setGrossAnnualIncome(vIncome);
    const vFiling = qs.get("filing") as FilingStatus | null;
    if (vFiling === "single" || vFiling === "married") setFiling(vFiling);
    const vState = qs.get("state"); if (vState) setState(vState as StateCode);
    const vReturn = qs.get("return"); if (vReturn) setExpectedReturnPct(vReturn);
    const vYears = qs.get("years"); if (vYears) setYearsToGrow(vYears);
  }, []);

  // ── QS SYNC ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    if (age) qs.set("age", age);
    qs.set("coverage", coverageType);
    if (yourContribution) qs.set("yourContrib", yourContribution);
    if (employerContribution) qs.set("employerContrib", employerContribution);
    if (currentBalance) qs.set("balance", currentBalance);
    if (grossAnnualIncome) qs.set("income", grossAnnualIncome);
    qs.set("filing", filing);
    qs.set("state", state);
    if (expectedReturnPct) qs.set("return", expectedReturnPct);
    if (yearsToGrow) qs.set("years", yearsToGrow);
    setQS(qs);
  }, [age, coverageType, yourContribution, employerContribution, currentBalance, grossAnnualIncome, filing, state, expectedReturnPct, yearsToGrow]);

  function changeCoverage(next: CoverageType) {
    setCoverageType(next);
    // Re-fill "your contribution" to the new max only if it was previously
    // sitting at the old max — respects a user who already customized it.
    const oldLimit = (coverageType === "family" ? HSA_LIMITS.family : HSA_LIMITS.self) + (nz(age) >= 55 ? HSA_LIMITS.catchUp55 : 0);
    if (nz(yourContribution) === oldLimit) {
      const newLimit = (next === "family" ? HSA_LIMITS.family : HSA_LIMITS.self) + (nz(age) >= 55 ? HSA_LIMITS.catchUp55 : 0);
      setYourContribution(String(newLimit));
    }
  }

  const results = useMemo(() => {
    const catchUpEligible = nz(age) >= 55;
    const contributionLimit =
      (coverageType === "family" ? HSA_LIMITS.family : HSA_LIMITS.self) + (catchUpEligible ? HSA_LIMITS.catchUp55 : 0);

    const yourContributionAmount = Math.max(0, nz(yourContribution));
    const employerContributionAmount = Math.max(0, nz(employerContribution));
    const totalAnnualContribution = yourContributionAmount + employerContributionAmount;
    const overLimitAmount = Math.max(0, totalAnnualContribution - contributionLimit);
    const remainingRoom = Math.max(0, contributionLimit - totalAnnualContribution);

    // Tax savings: diff a full tax computation against one with gross income
    // reduced by your contribution. This correctly reflects marginal bracket
    // effects, the Social Security wage base cap, and the additional
    // Medicare surtax threshold — the same verified engine used across the
    // rest of the site's calculators.
    const grossFull = Math.max(0, nz(grossAnnualIncome));
    const grossReduced = Math.max(0, grossFull - yourContributionAmount);
    const breakdownFull = estimateNetBreakdown({ grossAnnual: grossFull, state, filing, k401Pct: 0 });
    const breakdownReduced = estimateNetBreakdown({ grossAnnual: grossReduced, state, filing, k401Pct: 0 });

    const federalSaved = breakdownFull.federal - breakdownReduced.federal;
    const ficaSaved = breakdownFull.fica - breakdownReduced.fica;
    const rawStateSaved = breakdownFull.state - breakdownReduced.state;
    const stateMarginalRateApprox = yourContributionAmount > 0 ? rawStateSaved / yourContributionAmount : 0;

    const isNonConforming = HSA_NONCONFORMING_STATES.has(state);
    const stateSaved = isNonConforming ? 0 : rawStateSaved;
    const totalTaxSavingsThisYear = federalSaved + ficaSaved + stateSaved;

    // Growth projection. In CA/NJ, HSA investment earnings are taxed annually
    // as ordinary income at the state level (not tax-deferred), so the
    // effective compounding rate is reduced by that state's marginal rate.
    const nominalReturn = nz(expectedReturnPct) / 100;
    const effectiveReturn = isNonConforming ? nominalReturn * (1 - stateMarginalRateApprox) : nominalReturn;

    const years = Math.max(0, Math.round(nz(yearsToGrow)));
    const { finalBalance, totalContributed } = projectBalance(
      nz(currentBalance),
      totalAnnualContribution,
      effectiveReturn,
      years
    );
    const totalGrowth = finalBalance - Math.max(0, nz(currentBalance)) - totalContributed;

    const horizons = [5, 10, 20, 30].map((h) => ({
      years: h,
      ...projectBalance(nz(currentBalance), totalAnnualContribution, effectiveReturn, h),
    }));

    return {
      catchUpEligible,
      contributionLimit,
      yourContributionAmount,
      employerContributionAmount,
      totalAnnualContribution,
      overLimitAmount,
      remainingRoom,
      federalSaved,
      ficaSaved,
      stateSaved,
      isNonConforming,
      totalTaxSavingsThisYear,
      effectiveReturn,
      nominalReturn,
      finalBalance,
      totalContributed,
      totalGrowth,
      years,
      horizons,
    };
  }, [age, coverageType, yourContribution, employerContribution, currentBalance, grossAnnualIncome, filing, state, expectedReturnPct, yearsToGrow]);

  const salaryReady = nz(grossAnnualIncome) > 0;
  const hdhpMinDeductible = coverageType === "family" ? HDHP_MIN_DEDUCTIBLE.family : HDHP_MIN_DEDUCTIBLE.self;
  const hdhpMaxOOP = coverageType === "family" ? HDHP_MAX_OOP.family : HDHP_MAX_OOP.self;

  // ── EXPORT ROWS (shared by CSV + PDF) ───────────────────────────────────
  const exportRows = useMemo<CsvRow[]>(() => {
    const rows: CsvRow[] = [
      { Metric: "Coverage type", Value: coverageType === "family" ? "Family" : "Self-only" },
      { Metric: "Age", Value: age },
      { Metric: "55+ catch-up eligible", Value: results.catchUpEligible ? "Yes" : "No" },
      { Metric: "2025 contribution limit", Value: money(results.contributionLimit) },
      { Metric: "Your contribution", Value: money(results.yourContributionAmount) },
      { Metric: "Employer contribution", Value: money(results.employerContributionAmount) },
      { Metric: "Total annual contribution", Value: money(results.totalAnnualContribution) },
      { Metric: results.overLimitAmount > 0 ? "Over the limit by" : "Remaining room under limit", Value: money(results.overLimitAmount > 0 ? results.overLimitAmount : results.remainingRoom) },
      { Metric: "State", Value: STATES.find((s) => s.code === state)?.name ?? state },
      { Metric: "Federal tax saved this year", Value: money(results.federalSaved) },
      { Metric: "FICA (payroll tax) saved this year", Value: money(results.ficaSaved) },
      { Metric: "State tax saved this year", Value: results.isNonConforming ? "$0 (CA/NJ don't conform to federal HSA treatment)" : money(results.stateSaved) },
      { Metric: "Total tax savings this year", Value: money(results.totalTaxSavingsThisYear) },
      { Metric: "Expected annual return", Value: `${expectedReturnPct}%` },
      { Metric: `Projected balance in ${results.years} years`, Value: money(results.finalBalance) },
      { Metric: "Total contributed over that period", Value: money(results.totalContributed) },
      { Metric: "Total investment growth over that period", Value: money(results.totalGrowth) },
    ];
    return rows;
  }, [coverageType, age, results, state, expectedReturnPct]);

  const handleExportCsv = () => downloadCsv("hsa-scenario", exportRows);

  const handleExportPdf = () => {
    downloadPdfReport({
      filename: "hsa-scenario",
      title: "HSA Contribution & Growth Plan",
      subtitle: `${money(results.totalAnnualContribution)}/yr · projected ${money(results.finalBalance)} in ${results.years} years`,
      rows: exportRows as PdfRow[],
      footerNote: "Planning estimates only, not tax or investment advice. relocationbynumbers.com",
    });
  };

  const getCurrentScenario = () => ({
    label: "HSA plan",
    url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
    subtitle: `${money(results.totalAnnualContribution, 0)}/yr → ${money(results.finalBalance, 0)} in ${results.years}y`,
    source: "HSA",
  });

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ================================================================
            LEFT — INPUTS
        ================================================================ */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your HSA</div>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button type="button" onClick={() => changeCoverage("self")} className={`rounded-lg px-3 py-1 text-sm ${coverageType === "self" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Self-only</button>
                <button type="button" onClick={() => changeCoverage("family")} className={`rounded-lg px-3 py-1 text-sm ${coverageType === "family" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Family</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>Your age</div>
                <input className={inputCls} type="number" min="18" value={age} onChange={(e) => setAge(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Current HSA balance</div>
                <input className={inputCls} type="number" min="0" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Your annual contribution
                  <InfoTip text={`2025 limit: ${money(coverageType === "family" ? HSA_LIMITS.family : HSA_LIMITS.self)}${nz(age) >= 55 ? ` + ${money(HSA_LIMITS.catchUp55)} catch-up (55+) = ${money(results.contributionLimit)}` : ""}.`} />
                </div>
                <input className={inputCls} type="number" min="0" value={yourContribution} onChange={(e) => setYourContribution(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Employer contribution</div>
                <input className={inputCls} type="number" min="0" value={employerContribution} onChange={(e) => setEmployerContribution(e.target.value)} placeholder=" " />
              </label>
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {coverageType === "family" ? "Family" : "Self-only"} HDHP minimum deductible: {money(hdhpMinDeductible)} · max out-of-pocket: {money(hdhpMaxOOP)} (2025 IRS figures).
            </div>
            {results.overLimitAmount > 0 && (
              <div className="mt-3 rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                ⚠ Your combined contribution is {money(results.overLimitAmount)} over the {money(results.contributionLimit)} limit. Excess HSA contributions are subject to a 6% excise tax each year they remain in the account unless withdrawn before the tax deadline.
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Income &amp; taxes</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Gross annual income</div>
                <input className={inputCls} type="number" min="0" value={grossAnnualIncome} onChange={(e) => setGrossAnnualIncome(e.target.value)} placeholder=" " />
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
            {results.isNonConforming && (
              <div className="mt-3 rounded-xl border border-amber-300 bg-amber-100 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                {STATES.find((s) => s.code === state)?.name} does not conform to the federal HSA tax exemption: your contribution is still taxed at the state level, and investment growth inside the account is taxed annually as ordinary income (not tax-deferred). Both are accounted for below.
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Growth assumptions</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>Expected annual return (%)</div>
                <input className={inputCls} type="number" step="0.1" value={expectedReturnPct} onChange={(e) => setExpectedReturnPct(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Years to grow</div>
                <input className={inputCls} type="number" min="0" value={yearsToGrow} onChange={(e) => setYearsToGrow(e.target.value)} placeholder=" " />
              </label>
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Assumes contributions are invested (not spent on current medical expenses) and made at the start of each
              year. This calculator does not model ongoing withdrawals for medical spending.
            </div>
          </div>
        </div>

        {/* ================================================================
            RIGHT — RESULTS
        ================================================================ */}
        <div className="space-y-3">
          {!salaryReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Enter your gross annual income to see your tax savings and projected growth.
            </div>
          ) : (
            <>
              <StatCard
                label="Total tax savings this year"
                amount={results.totalTaxSavingsThisYear}
                tone="emerald"
                note={`Federal ${money(results.federalSaved)} + FICA ${money(results.ficaSaved)} + state ${results.isNonConforming ? "$0" : money(results.stateSaved)}, from contributing ${money(results.yourContributionAmount)}.`}
              />
              <StatCard
                label={`Projected balance in ${results.years} years`}
                amount={results.finalBalance}
                tone="cyan"
                note={`${money(results.totalContributed)} contributed + ${money(results.totalGrowth)} tax-advantaged growth, on top of your ${money(nz(currentBalance))} starting balance.`}
              />
              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Balance at other horizons</div>
                <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  {results.horizons.map((h) => (
                    <div key={h.years} className="flex justify-between">
                      <span>In {h.years} years</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{money(h.finalBalance)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                An HSA has three tax advantages: contributions are pre-tax (or deductible), growth is tax-free, and
                withdrawals for qualified medical expenses are tax-free. After age 65, non-medical withdrawals are
                taxed as ordinary income (like a traditional IRA) with no penalty — before 65, non-medical withdrawals
                carry a 20% penalty plus ordinary income tax. This tool does not model neighborhood-level HDHP plan
                selection, HSA custodian fees, or investment sequencing. Planning estimates only, not tax or
                investment advice.
              </div>
            </>
          )}
        </div>
      </div>

      {salaryReady && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-cyan-900/60 dark:bg-cyan-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-400">Share this scenario</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current inputs and send them to a partner, friend, or future self.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const shareUrl = new URL(window.location.href);
                      const shareText = `My HSA plan: ${money(results.totalAnnualContribution, 0)}/yr, projected ${money(results.finalBalance, 0)} in ${results.years} years.`;
                      const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                      if (canNativeShare) {
                        await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({
                          title: "My HSA Plan", text: shareText, url: shareUrl.toString(),
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
