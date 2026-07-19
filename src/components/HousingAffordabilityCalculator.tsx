"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  solveMaxHomePrice,
  monthlyHousingCost,
  US_STATE_DEFAULTS,
} from "../lib/housing";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

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

type Mode = "rent" | "buy";

const STATE_OPTIONS = Object.entries(US_STATE_DEFAULTS)
  .map(([code, d]) => ({ code, name: d.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ─────────────────────────────────────────────────────────────────────────
// SMALL PRESENTATION PIECES
// ─────────────────────────────────────────────────────────────────────────
function TierCard({
  label,
  amount,
  suffix,
  tone,
  note,
}: {
  label: string;
  amount: number;
  suffix: string;
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
        <span className="ml-1 text-sm font-medium opacity-70">{suffix}</span>
      </div>
      <p className="mt-2 text-sm leading-5 opacity-90">{note}</p>
    </div>
  );
}

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
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function HousingAffordabilityCalculator() {
  const hasMounted = useRef(false);

  const [mode, setMode] = useState<Mode>("rent");

  const [annualIncome, setAnnualIncome] = useState<string>("85000");
  const [otherMonthlyDebts, setOtherMonthlyDebts] = useState<string>("300");

  const [stateCode, setStateCode] = useState<string>("");
  const [downPct, setDownPct] = useState<string>("20");
  const [ratePct, setRatePct] = useState<string>("6.5");
  const [termYears, setTermYears] = useState<string>("30");
  const [propertyTaxPct, setPropertyTaxPct] = useState<string>("1.1");
  const [insuranceMonthly, setInsuranceMonthly] = useState<string>("140");
  const [hoaMonthly, setHoaMonthly] = useState<string>("0");

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const nz = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  // ── QS HYDRATION ─────────────────────────────────────────────────────
  useEffect(() => {
    const qs = getQS();
    const vMode = qs.get("mode");
    if (vMode === "rent" || vMode === "buy") setMode(vMode);

    const vIncome = qs.get("income"); if (vIncome) setAnnualIncome(vIncome);
    const vDebts = qs.get("debts"); if (vDebts) setOtherMonthlyDebts(vDebts);
    const vState = qs.get("state"); if (vState) setStateCode(vState);
    const vDown = qs.get("down"); if (vDown) setDownPct(vDown);
    const vRate = qs.get("rate"); if (vRate) setRatePct(vRate);
    const vTerm = qs.get("term"); if (vTerm) setTermYears(vTerm);
    const vTax = qs.get("tax"); if (vTax) setPropertyTaxPct(vTax);
    const vIns = qs.get("insurance"); if (vIns) setInsuranceMonthly(vIns);
    const vHoa = qs.get("hoa"); if (vHoa) setHoaMonthly(vHoa);
  }, []);

  // ── QS SYNC ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    qs.set("mode", mode);
    if (annualIncome) qs.set("income", annualIncome);
    if (otherMonthlyDebts) qs.set("debts", otherMonthlyDebts);
    if (mode === "buy") {
      if (stateCode) qs.set("state", stateCode);
      if (downPct) qs.set("down", downPct);
      if (ratePct) qs.set("rate", ratePct);
      if (termYears) qs.set("term", termYears);
      if (propertyTaxPct) qs.set("tax", propertyTaxPct);
      if (insuranceMonthly) qs.set("insurance", insuranceMonthly);
      if (hoaMonthly) qs.set("hoa", hoaMonthly);
    }
    setQS(qs);
  }, [mode, annualIncome, otherMonthlyDebts, stateCode, downPct, ratePct, termYears, propertyTaxPct, insuranceMonthly, hoaMonthly]);

  function applyStateDefaults(code: string) {
    setStateCode(code);
    const d = US_STATE_DEFAULTS[code];
    if (d) {
      setPropertyTaxPct(String(d.propertyTax));
      setInsuranceMonthly(String(d.insuranceMonthly));
    }
  }

  const grossMonthly = useMemo(() => nz(annualIncome) / 12, [annualIncome]);

  // ── RENT TIERS ────────────────────────────────────────────────────────
  const rentResults = useMemo(() => {
    const debts = Math.max(0, nz(otherMonthlyDebts));
    const comfortable = grossMonthly * 0.25;
    const recommended = grossMonthly * 0.30;
    const stretch = grossMonthly * 0.35;
    const debtAdjusted = Math.max(0, Math.min(recommended, grossMonthly * 0.36 - debts));
    return { comfortable, recommended, stretch, debtAdjusted, debts };
  }, [grossMonthly, otherMonthlyDebts]);

  // ── BUY AFFORDABILITY ───────────────────────────────────────────────────
  const buyResults = useMemo(() => {
    const debts = Math.max(0, nz(otherMonthlyDebts));
    const solverInputs = {
      grossMonthly,
      downPct: nz(downPct),
      annualRate: nz(ratePct),
      termYears: nz(termYears),
      propertyTaxRate: nz(propertyTaxPct),
      insuranceMonthly: nz(insuranceMonthly),
      hoaMonthly: nz(hoaMonthly),
    };

    const frontEndPrice = solveMaxHomePrice({ ...solverInputs, targetDTI: 28 });

    // Lenders apply both ratios and use whichever is more restrictive, so the
    // "real" max always uses the lower of the two — debts can only tighten
    // affordability, never loosen it beyond the 28% front-end ceiling.
    const debtsPctOfIncome = grossMonthly > 0 ? (debts / grossMonthly) * 100 : 0;
    const backEndTargetDTI = Math.max(0, 36 - debtsPctOfIncome);
    const effectiveTargetDTI = Math.min(28, backEndTargetDTI);
    const backEndPrice = solveMaxHomePrice({ ...solverInputs, targetDTI: effectiveTargetDTI });

    const breakdown = backEndPrice > 0
      ? monthlyHousingCost({
          homePrice: backEndPrice,
          downPct: nz(downPct),
          ratePct: nz(ratePct),
          termYears: nz(termYears),
          propertyTaxPct: nz(propertyTaxPct),
          homeInsMonthly: nz(insuranceMonthly),
          hoaMonthly: nz(hoaMonthly),
        })
      : null;

    return { frontEndPrice, backEndPrice, backEndTargetDTI, breakdown, debts };
  }, [grossMonthly, otherMonthlyDebts, downPct, ratePct, termYears, propertyTaxPct, insuranceMonthly, hoaMonthly]);

  const salaryReady = grossMonthly > 0;

  // ── EXPORT ROWS (shared by CSV + PDF) ───────────────────────────────────
  const exportRows = useMemo<CsvRow[]>(() => {
    if (!salaryReady) return [];
    const rows: CsvRow[] = [
      { Metric: "Mode", Value: mode === "rent" ? "Renting" : "Buying" },
      { Metric: "Gross annual income", Value: money(nz(annualIncome)) },
      { Metric: "Other monthly debts", Value: money(rentResults.debts) },
    ];
    if (mode === "rent") {
      rows.push(
        { Metric: "Comfortable rent (25%)", Value: money(rentResults.comfortable) },
        { Metric: "Recommended rent (30% rule)", Value: money(rentResults.recommended) },
        { Metric: "Debt-adjusted max rent", Value: money(rentResults.debtAdjusted) },
      );
    } else {
      rows.push(
        { Metric: "Down payment", Value: `${downPct}%` },
        { Metric: "Interest rate", Value: `${ratePct}%` },
        { Metric: "Loan term", Value: `${termYears} years` },
        { Metric: "Property tax", Value: `${propertyTaxPct}%/yr` },
        { Metric: "Home insurance", Value: money(nz(insuranceMonthly)) },
        { Metric: "HOA", Value: money(nz(hoaMonthly)) },
        { Metric: "Max home price (front-end, 28%)", Value: money(buyResults.frontEndPrice) },
        { Metric: "Max home price (with your debts)", Value: money(buyResults.backEndPrice) },
      );
      if (buyResults.breakdown) {
        rows.push(
          { Metric: "Est. monthly principal & interest", Value: money(buyResults.breakdown.principalInterest) },
          { Metric: "Est. monthly property tax", Value: money(buyResults.breakdown.propertyTax) },
          { Metric: "Est. monthly home insurance", Value: money(buyResults.breakdown.homeInsurance) },
          { Metric: "Est. total monthly payment", Value: money(buyResults.breakdown.totalMonthly) },
          { Metric: "Loan amount", Value: money(buyResults.breakdown.loanAmount) },
        );
      }
    }
    return rows;
  }, [salaryReady, mode, annualIncome, rentResults, buyResults, downPct, ratePct, termYears, propertyTaxPct, insuranceMonthly, hoaMonthly]);

  const scenarioFilenameBase = mode === "rent" ? "rent-affordability" : "home-affordability";

  const handleExportCsv = () => {
    downloadCsv(scenarioFilenameBase, exportRows);
  };

  const handleExportPdf = () => {
    downloadPdfReport({
      filename: scenarioFilenameBase,
      title: mode === "rent" ? "Rent Affordability" : "Home Buying Affordability",
      subtitle: `Gross annual income: ${money(nz(annualIncome))}`,
      rows: exportRows as PdfRow[],
      footerNote: "Planning guideline only, not financial or lending advice. relocationbynumbers.com",
    });
  };

  const getCurrentScenario = () => ({
    label: mode === "rent" ? "Rent affordability" : "Home buying affordability",
    url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
    subtitle: mode === "rent"
      ? `Recommended max ${money(rentResults.recommended, 0)}/mo`
      : `Max home price ${money(buyResults.backEndPrice, 0)}`,
    source: "Affordability",
  });

  return (
    <div className="text-slate-900 dark:text-slate-100">
      {/* Mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold" />
        <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700">
          <button
            type="button"
            onClick={() => setMode("rent")}
            className={`rounded-lg px-3 py-1 text-sm ${mode === "rent" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}
          >
            Renting
          </button>
          <button
            type="button"
            onClick={() => setMode("buy")}
            className={`rounded-lg px-3 py-1 text-sm ${mode === "buy" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}
          >
            Buying
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ================================================================
            LEFT — INPUTS
        ================================================================ */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Your income</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>Gross annual income</div>
                <input
                  className={inputCls}
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder=" "
                />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Other monthly debts
                  <InfoTip text="Car loans, student loans, credit card minimums, personal loans — anything that shows up on a lender's back-end DTI calculation." />
                </div>
                <input
                  className={inputCls}
                  type="number"
                  value={otherMonthlyDebts}
                  onChange={(e) => setOtherMonthlyDebts(e.target.value)}
                  placeholder=" "
                />
              </label>
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Rules of thumb here are applied to <strong>gross</strong> (pre-tax) income, matching how rent guidance and
              lender debt-to-income ratios are conventionally quoted. Your real after-tax budget will be tighter.
            </div>
          </div>

          {mode === "buy" && (
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Loan assumptions</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm sm:col-span-2">
                  <div className={labelHeadCls}>
                    State
                    <InfoTip text="Optional — fills in typical property tax and insurance for that state. You can still edit both manually." />
                  </div>
                  <select className={selectCls} value={stateCode} onChange={(e) => applyStateDefaults(e.target.value)}>
                    <option value="">— Use manual estimates —</option>
                    {STATE_OPTIONS.map((s) => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <div className={labelHeadCls}>Down payment</div>
                  <input className={inputCls} type="number" value={downPct} onChange={(e) => setDownPct(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className={labelHeadCls}>Interest rate (%)</div>
                  <input className={inputCls} type="number" step="0.1" value={ratePct} onChange={(e) => setRatePct(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className={labelHeadCls}>Loan term (years)</div>
                  <select className={selectCls} value={termYears} onChange={(e) => setTermYears(e.target.value)}>
                    <option value="15">15 years</option>
                    <option value="20">20 years</option>
                    <option value="30">30 years</option>
                  </select>
                </label>
                <label className="text-sm">
                  <div className={labelHeadCls}>Property tax (annual %)</div>
                  <input className={inputCls} type="number" step="0.01" value={propertyTaxPct} onChange={(e) => setPropertyTaxPct(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className={labelHeadCls}>Home insurance ($/mo)</div>
                  <input className={inputCls} type="number" value={insuranceMonthly} onChange={(e) => setInsuranceMonthly(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className={labelHeadCls}>HOA ($/mo)</div>
                  <input className={inputCls} type="number" value={hoaMonthly} onChange={(e) => setHoaMonthly(e.target.value)} placeholder=" " />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================
            RIGHT — RESULTS
        ================================================================ */}
        <div className="space-y-3">
          {!salaryReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Enter your gross annual income to see affordability guidance.
            </div>
          ) : mode === "rent" ? (
            <>
              <TierCard
                label="Comfortable"
                amount={rentResults.comfortable}
                suffix="/mo"
                tone="emerald"
                note="25% of gross income — leaves the most room for savings and surprises."
              />
              <TierCard
                label="Recommended (30% rule)"
                amount={rentResults.recommended}
                suffix="/mo"
                tone="cyan"
                note="The classic budgeting guideline most landlords and lenders reference."
              />
              <TierCard
                label="With your other debts factored in"
                amount={rentResults.debtAdjusted}
                suffix="/mo"
                tone="amber"
                note={
                  rentResults.debts > 0
                    ? `Keeps rent + ${money(rentResults.debts)}/mo in other debts at or below 36% of gross income — the same back-end ratio lenders use.`
                    : "No other monthly debts entered, so this matches the 30% rule."
                }
              />
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                These are planning guidelines, not hard limits. Landlords and lenders sometimes use stricter income
                multiples (e.g. requiring rent ≤ income ÷ 40). Local market conditions and your other financial goals
                matter too.
              </div>
            </>
          ) : (
            <>
              <TierCard
                label="Comfortable (front-end only)"
                amount={buyResults.frontEndPrice}
                suffix="max home price"
                tone="emerald"
                note="Keeps housing costs (P&I, tax, insurance, HOA, PMI) at or below 28% of gross income — ignoring other debts."
              />
              <TierCard
                label="Realistic, with your other debts"
                amount={buyResults.backEndPrice}
                suffix="max home price"
                tone={buyResults.backEndTargetDTI <= 0 ? "amber" : "cyan"}
                note={
                  buyResults.backEndTargetDTI <= 0
                    ? "Your other monthly debts already meet or exceed the 36% back-end guideline, leaving little to no room for housing costs at standard lender guidelines."
                    : `Keeps housing + your other debts at or below 36% of gross income — the standard back-end DTI lenders use.`
                }
              />
              {buyResults.breakdown && buyResults.backEndPrice > 0 && (
                <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                  <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Estimated monthly payment at {money(buyResults.backEndPrice)}
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between"><span>Principal &amp; interest</span><span className="font-semibold text-slate-900 dark:text-slate-100">{money(buyResults.breakdown.principalInterest)}</span></div>
                    <div className="flex justify-between"><span>Property tax</span><span className="font-semibold text-slate-900 dark:text-slate-100">{money(buyResults.breakdown.propertyTax)}</span></div>
                    <div className="flex justify-between"><span>Home insurance</span><span className="font-semibold text-slate-900 dark:text-slate-100">{money(buyResults.breakdown.homeInsurance)}</span></div>
                    {buyResults.breakdown.hoa > 0 && (
                      <div className="flex justify-between"><span>HOA</span><span className="font-semibold text-slate-900 dark:text-slate-100">{money(buyResults.breakdown.hoa)}</span></div>
                    )}
                    <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
                      <span className="font-semibold">Total monthly</span>
                      <span className="font-bold text-slate-900 dark:text-white">{money(buyResults.breakdown.totalMonthly)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Loan amount</span><span>{money(buyResults.breakdown.loanAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                PMI is estimated automatically when your down payment is below 20%. These are planning estimates —
                actual loan approval depends on credit score, employment history, cash reserves, and individual
                lender requirements. Not financial or lending advice.
              </div>
            </>
          )}
        </div>
      </div>

      {salaryReady && (
        <div className="mt-4 space-y-3">
          {/* Share + export */}
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
                      const shareText = mode === "rent"
                        ? `My rent affordability: recommended max ${money(rentResults.recommended, 0)}/mo.`
                        : `My home buying affordability: max home price ${money(buyResults.backEndPrice, 0)}.`;
                      const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                      if (canNativeShare) {
                        await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({
                          title: "My Housing Affordability", text: shareText, url: shareUrl.toString(),
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
