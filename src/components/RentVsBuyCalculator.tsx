"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { simulateRentVsBuy, type RentVsBuyInput } from "../lib/rentVsBuy";
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

type CrossPoint = { year: number; buy: number; rent: number };
function CrossTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CrossPoint }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="font-semibold text-slate-900 dark:text-white">Year {d.year}</div>
      <div className="text-emerald-600 dark:text-emerald-400">Buy: {money(d.buy)}</div>
      <div className="text-cyan-700 dark:text-cyan-300">Rent + invest: {money(d.rent)}</div>
    </div>
  );
}

const FIELD = (v: string) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export default function RentVsBuyCalculator() {
  const hasMounted = useRef(false);

  // Buy
  const [homePrice, setHomePrice] = useState("500000");
  const [downPct, setDownPct] = useState("20");
  const [mortgageRatePct, setMortgageRatePct] = useState("7");
  const [loanYears, setLoanYears] = useState("30");
  const [propertyTaxPct, setPropertyTaxPct] = useState("1.1");
  const [homeInsuranceAnnual, setHomeInsuranceAnnual] = useState("1800");
  const [hoaMonthly, setHoaMonthly] = useState("0");
  const [maintenancePct, setMaintenancePct] = useState("1");
  const [buyClosingPct, setBuyClosingPct] = useState("3");
  const [appreciationPct, setAppreciationPct] = useState("3");
  const [sellingCostPct, setSellingCostPct] = useState("6");
  // Rent
  const [monthlyRent, setMonthlyRent] = useState("2500");
  const [rentGrowthPct, setRentGrowthPct] = useState("3");
  const [rentersInsuranceMonthly, setRentersInsuranceMonthly] = useState("15");
  // Shared
  const [investmentReturnPct, setInvestmentReturnPct] = useState("6");
  const [years, setYears] = useState("10");

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const FIELDS: [string, string, (v: string) => void][] = useMemo(() => [
    ["price", homePrice, setHomePrice], ["down", downPct, setDownPct], ["rate", mortgageRatePct, setMortgageRatePct],
    ["term", loanYears, setLoanYears], ["ptax", propertyTaxPct, setPropertyTaxPct], ["hins", homeInsuranceAnnual, setHomeInsuranceAnnual],
    ["hoa", hoaMonthly, setHoaMonthly], ["maint", maintenancePct, setMaintenancePct], ["closing", buyClosingPct, setBuyClosingPct],
    ["appr", appreciationPct, setAppreciationPct], ["sell", sellingCostPct, setSellingCostPct], ["rent", monthlyRent, setMonthlyRent],
    ["rentgrow", rentGrowthPct, setRentGrowthPct], ["rins", rentersInsuranceMonthly, setRentersInsuranceMonthly],
    ["inv", investmentReturnPct, setInvestmentReturnPct], ["years", years, setYears],
  ], [homePrice, downPct, mortgageRatePct, loanYears, propertyTaxPct, homeInsuranceAnnual, hoaMonthly, maintenancePct, buyClosingPct, appreciationPct, sellingCostPct, monthlyRent, rentGrowthPct, rentersInsuranceMonthly, investmentReturnPct, years]);

  // ── QS HYDRATION ──
  useEffect(() => {
    const qs = getQS();
    const map: Record<string, (v: string) => void> = {
      price: setHomePrice, down: setDownPct, rate: setMortgageRatePct, term: setLoanYears, ptax: setPropertyTaxPct,
      hins: setHomeInsuranceAnnual, hoa: setHoaMonthly, maint: setMaintenancePct, closing: setBuyClosingPct, appr: setAppreciationPct,
      sell: setSellingCostPct, rent: setMonthlyRent, rentgrow: setRentGrowthPct, rins: setRentersInsuranceMonthly, inv: setInvestmentReturnPct, years: setYears,
    };
    for (const [k, setter] of Object.entries(map)) {
      const v = qs.get(k);
      if (v !== null) setter(v);
    }
  }, []);

  // ── QS SYNC ──
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    for (const [key, val] of FIELDS) if (val !== "") qs.set(key, val);
    setQS(qs);
  }, [FIELDS]);

  const results = useMemo(() => {
    const input: RentVsBuyInput = {
      homePrice: Math.max(0, FIELD(homePrice)), downPct: FIELD(downPct), mortgageRatePct: FIELD(mortgageRatePct),
      loanYears: Math.max(1, FIELD(loanYears)), propertyTaxPct: FIELD(propertyTaxPct), homeInsuranceAnnual: FIELD(homeInsuranceAnnual),
      hoaMonthly: FIELD(hoaMonthly), maintenancePct: FIELD(maintenancePct), buyClosingPct: FIELD(buyClosingPct),
      appreciationPct: FIELD(appreciationPct), sellingCostPct: FIELD(sellingCostPct), monthlyRent: Math.max(0, FIELD(monthlyRent)),
      rentGrowthPct: FIELD(rentGrowthPct), rentersInsuranceMonthly: FIELD(rentersInsuranceMonthly),
      investmentReturnPct: FIELD(investmentReturnPct), years: Math.max(1, Math.min(40, FIELD(years))),
    };
    const sim = simulateRentVsBuy(input);
    const chart: CrossPoint[] = [];
    for (let y = 1; y * 12 <= sim.months; y++) {
      const idx = y * 12 - 1;
      chart.push({ year: y, buy: Math.round(sim.buyerNetWorth[idx]), rent: Math.round(sim.renterNetWorth[idx]) });
    }
    const buyWins = sim.finalBuyer >= sim.finalRenter;
    const diff = Math.abs(sim.finalBuyer - sim.finalRenter);
    const breakEvenYear = sim.breakEvenMonth > 0 ? sim.breakEvenMonth / 12 : null;
    return { input, sim, chart, buyWins, diff, breakEvenYear };
  }, [homePrice, downPct, mortgageRatePct, loanYears, propertyTaxPct, homeInsuranceAnnual, hoaMonthly, maintenancePct, buyClosingPct, appreciationPct, sellingCostPct, monthlyRent, rentGrowthPct, rentersInsuranceMonthly, investmentReturnPct, years]);

  const inputsReady = results.input.homePrice > 0 && results.input.monthlyRent > 0;
  const yearsN = results.input.years;

  const exportRows = useMemo<CsvRow[]>(() => {
    const { sim } = results;
    return [
      { Metric: "Home price", Value: money(results.input.homePrice) },
      { Metric: "Down payment", Value: `${downPct}% (${money(sim.downPayment)})` },
      { Metric: "Mortgage rate / term", Value: `${mortgageRatePct}% / ${loanYears} yrs` },
      { Metric: "Upfront cash (down + closing)", Value: money(sim.downPayment + sim.closingCosts) },
      { Metric: "First-year monthly cost — buy", Value: money(sim.firstMonthBuyCost) },
      { Metric: "First-year monthly cost — rent", Value: money(sim.firstMonthRentCost) },
      { Metric: "Monthly rent / annual increase", Value: `${money(FIELD(monthlyRent))} / ${rentGrowthPct}%` },
      { Metric: "Home appreciation (annual)", Value: `${appreciationPct}%` },
      { Metric: "Investment return (annual)", Value: `${investmentReturnPct}%` },
      { Metric: "Time horizon", Value: `${yearsN} years` },
      { Metric: `Home value in ${yearsN} years`, Value: money(sim.finalHomeValue) },
      { Metric: `Net worth if you BUY (after ${yearsN}y)`, Value: money(sim.finalBuyer) },
      { Metric: `Net worth if you RENT & invest (after ${yearsN}y)`, Value: money(sim.finalRenter) },
      { Metric: "Break-even", Value: results.breakEvenYear ? `Year ${results.breakEvenYear.toFixed(1)}` : `Not within ${yearsN} years` },
      { Metric: results.buyWins ? "Buying comes out ahead by" : "Renting comes out ahead by", Value: money(results.diff) },
    ];
  }, [results, downPct, mortgageRatePct, loanYears, monthlyRent, rentGrowthPct, appreciationPct, investmentReturnPct, yearsN]);

  const handleExportCsv = () => downloadCsv("rent-vs-buy", exportRows);
  const handleExportPdf = () =>
    downloadPdfReport({
      filename: "rent-vs-buy",
      title: "Rent vs. Buy Comparison",
      subtitle: `${results.buyWins ? "Buying" : "Renting"} ahead by ${money(results.diff)} after ${yearsN} years`,
      rows: exportRows as PdfRow[],
      footerNote: "Net-worth comparison in future dollars. Not financial advice. relocationbynumbers.com",
    });

  const getCurrentScenario = () => ({
    label: "Rent vs. Buy",
    url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
    subtitle: `${results.buyWins ? "Buy" : "Rent"} +${money(results.diff, 0)} over ${yearsN}y`,
    source: "RentVsBuy",
  });

  const field = (label: string, value: string, setter: (v: string) => void, opts?: { step?: string; tip?: string; suffix?: string }) => (
    <label className="text-sm">
      <div className={labelHeadCls}>{label}{opts?.tip ? <InfoTip text={opts.tip} /> : null}</div>
      <input className={inputCls} type="number" step={opts?.step ?? "1"} value={value} onChange={(e) => setter(e.target.value)} placeholder=" " />
    </label>
  );

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* INPUTS */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">If you buy</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {field("Home price", homePrice, setHomePrice)}
              {field("Down payment (%)", downPct, setDownPct, { step: "1" })}
              {field("Mortgage rate (%)", mortgageRatePct, setMortgageRatePct, { step: "0.1" })}
              {field("Loan term (years)", loanYears, setLoanYears)}
              {field("Property tax (%/yr)", propertyTaxPct, setPropertyTaxPct, { step: "0.1", tip: "Annual property tax as a percent of the home's value." })}
              {field("Home insurance ($/yr)", homeInsuranceAnnual, setHomeInsuranceAnnual)}
              {field("HOA ($/mo)", hoaMonthly, setHoaMonthly)}
              {field("Maintenance (%/yr)", maintenancePct, setMaintenancePct, { step: "0.1", tip: "Annual upkeep as a percent of home value. ~1% is a common rule of thumb." })}
              {field("Closing costs (%)", buyClosingPct, setBuyClosingPct, { step: "0.1", tip: "Upfront buying costs (loan fees, title, etc.) as a percent of price. Sunk cost." })}
              {field("Home appreciation (%/yr)", appreciationPct, setAppreciationPct, { step: "0.1" })}
              {field("Selling costs (%)", sellingCostPct, setSellingCostPct, { step: "0.1", tip: "Agent commission and closing costs when you sell, as a percent of sale price (~6%)." })}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">If you rent</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {field("Monthly rent", monthlyRent, setMonthlyRent)}
              {field("Rent increase (%/yr)", rentGrowthPct, setRentGrowthPct, { step: "0.1" })}
              {field("Renters insurance ($/mo)", rentersInsuranceMonthly, setRentersInsuranceMonthly)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Assumptions</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {field("Investment return (%/yr)", investmentReturnPct, setInvestmentReturnPct, { step: "0.1", tip: "What the renter earns by investing the down payment (and any monthly savings) instead of buying. The key 'opportunity cost' lever." })}
              {field("Years you'll stay", years, setYears)}
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Compares net worth: the buyer&apos;s home equity (net of selling costs) vs. the renter investing the same upfront cash plus whatever they save each month. All in future dollars.
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="space-y-3">
          {!inputsReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Enter a home price and monthly rent to compare.
            </div>
          ) : (
            <>
              <div className={`rounded-2xl border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] ${results.buyWins ? "border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300" : "border-cyan-200 bg-cyan-50/70 text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/20 dark:text-cyan-300"}`}>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">After {yearsN} years</div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  {results.buyWins ? "Buying" : "Renting"} comes out ahead by {money(results.diff)}
                </div>
                <p className="mt-2 text-sm leading-5 opacity-90">
                  Net worth if you buy: <span className="font-semibold">{money(results.sim.finalBuyer)}</span> · if you rent &amp; invest: <span className="font-semibold">{money(results.sim.finalRenter)}</span>.{" "}
                  {results.breakEvenYear
                    ? `Buying breaks even around year ${results.breakEvenYear.toFixed(1)}.`
                    : `Renting stays ahead the whole ${yearsN} years.`}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Net worth over time</div>
                <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">Where the lines cross is your break-even point.</div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.chart} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                      <XAxis dataKey="year" tickFormatter={(v) => `${v}y`} tick={{ fontSize: 11 }} stroke="currentColor" />
                      <YAxis tickFormatter={(v) => `$${Math.round(Number(v) / 1000)}k`} tick={{ fontSize: 11 }} width={48} stroke="currentColor" />
                      <Tooltip content={<CrossTooltip />} />
                      {results.breakEvenYear ? <ReferenceLine x={Math.round(results.breakEvenYear)} stroke="#94a3b8" strokeDasharray="4 4" /> : null}
                      <Line dataKey="buy" name="Buy" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive />
                      <Line dataKey="rent" name="Rent + invest" stroke="#0e7490" strokeWidth={2} dot={false} isAnimationActive />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 flex justify-center gap-5 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#10b981" }} />Buy</span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "#0e7490" }} />Rent + invest</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <div className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between"><span>Upfront cash to buy (down + closing)</span><span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.sim.downPayment + results.sim.closingCosts)}</span></div>
                  <div className="flex justify-between"><span>Monthly cost, year 1 — buy</span><span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.sim.firstMonthBuyCost)}</span></div>
                  <div className="flex justify-between"><span>Monthly cost, year 1 — rent</span><span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.sim.firstMonthRentCost)}</span></div>
                  <div className="flex justify-between"><span>Home value in {yearsN} years</span><span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.sim.finalHomeValue)}</span></div>
                  <div className="flex justify-between"><span>Mortgage balance left</span><span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.sim.finalLoanBalance)}</span></div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                This is a net-worth comparison in future dollars: it assumes the renter invests the money a buyer ties up, and that whoever pays less each month invests the difference. It doesn&apos;t model income-tax effects (mortgage-interest or SALT deductions, investment taxes), PMI, or moving costs, and results are highly sensitive to the appreciation and investment-return assumptions. Not financial advice.
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
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current inputs and send them to a partner, agent, or future self.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const shareUrl = new URL(window.location.href);
                      const shareText = `Rent vs. buy: ${results.buyWins ? "buying" : "renting"} wins by ${money(results.diff, 0)} over ${yearsN} years.`;
                      const nav = window.navigator as unknown as { share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>; clipboard: { writeText: (t: string) => Promise<void> } };
                      if (typeof nav.share === "function") { await nav.share({ title: "Rent vs. Buy", text: shareText, url: shareUrl.toString() }); setShareStatus("shared"); }
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
