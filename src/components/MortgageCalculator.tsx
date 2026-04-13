"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ═══════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════

const COUNTRIES = [
  { code:"PT", name:"Portugal",       rate:3.5,  downMin:30, notes:"Non-residents typically need 30%+ down. Banks require NIF and proof of income. Golden Visa property route available." },
  { code:"ES", name:"Spain",          rate:3.8,  downMin:30, notes:"Non-residents need 30–40% down. NIE number required. Mortgage terms often shorter for foreigners." },
  { code:"DE", name:"Germany",        rate:3.9,  downMin:20, notes:"Germany is relatively open to foreign buyers. 20–30% down typical. Strong rental market makes buying less urgent." },
  { code:"FR", name:"France",         rate:4.0,  downMin:25, notes:"French banks lend to non-residents but require 25–30% down. Notaire fees add ~7–8% to purchase cost." },
  { code:"IT", name:"Italy",          rate:4.2,  downMin:30, notes:"Italian banks are conservative with foreign buyers. 30–40% down common. €1 home deals exist in depopulating towns." },
  { code:"NL", name:"Netherlands",    rate:3.9,  downMin:10, notes:"EU residents can access Dutch mortgages on similar terms. Non-EU buyers face more scrutiny." },
  { code:"GR", name:"Greece",         rate:4.5,  downMin:30, notes:"Foreign buyers need 30–40% down. Golden Visa via €250k+ investment. Property taxes are relatively low." },
  { code:"HR", name:"Croatia",        rate:4.0,  downMin:30, notes:"EU citizens can buy freely. Non-EU buyers need reciprocity agreement. Growing expat market." },
  { code:"MT", name:"Malta",          rate:3.5,  downMin:10, notes:"English-speaking, EU member. Non-residents can buy in designated areas. AIP permit required for some zones." },
  { code:"CY", name:"Cyprus",         rate:4.0,  downMin:30, notes:"Non-EU buyers need permission. Non-dom tax regime popular with expats. Limassol is a major expat hub." },
  { code:"MX", name:"Mexico",         rate:9.5,  downMin:30, notes:"Foreigners buy via fideicomiso (bank trust) in restricted zones. High rates — many foreigners pay cash." },
  { code:"PA", name:"Panama",         rate:6.5,  downMin:20, notes:"Foreigners have same property rights as citizens. Pensionado discounts apply. USD economy reduces FX risk." },
  { code:"CR", name:"Costa Rica",     rate:8.0,  downMin:30, notes:"Local bank mortgages available to foreigners but complex. Many expats use developer financing or cash." },
  { code:"CO", name:"Colombia",       rate:12.0, downMin:30, notes:"High local rates — many foreign buyers pay cash or use home-country financing. No restrictions on foreign ownership." },
  { code:"TH", name:"Thailand",       rate:6.5,  downMin:30, notes:"Foreigners cannot own land — only condos (up to 49% of building). Thai bank mortgages not available to most foreigners." },
  { code:"JP", name:"Japan",          rate:1.5,  downMin:10, notes:"Some of the world's lowest mortgage rates. Foreigners can buy freely but getting a mortgage requires Japanese residency." },
  { code:"SG", name:"Singapore",      rate:3.5,  downMin:25, notes:"Foreigners pay Additional Buyer's Stamp Duty (ABSD) of 60%. Most foreigners buy condos rather than landed property." },
  { code:"AU", name:"Australia",      rate:6.2,  downMin:20, notes:"Foreign buyers need FIRB approval. Typically limited to new builds. Stamp duty surcharges apply in most states." },
  { code:"NZ", name:"New Zealand",    rate:6.5,  downMin:20, notes:"Most overseas buyers are banned from purchasing existing homes since 2018. New builds generally permitted." },
  { code:"AE", name:"UAE (Dubai)",    rate:4.5,  downMin:25, notes:"Foreigners can buy in designated freehold areas. No income tax. Mortgages available for non-residents but at higher rates." },
  { code:"VN", name:"Vietnam",        rate:8.0,  downMin:30, notes:"Foreigners limited to 50-year renewable leases — no freehold ownership. Condo ownership capped at 30% of building." },
  { code:"MY", name:"Malaysia",       rate:4.5,  downMin:30, notes:"MM2H visa holders get better buying access. Minimum purchase price for foreigners: RM 1M+ in most states." },
  { code:"ID", name:"Indonesia",      rate:9.0,  downMin:30, notes:"Foreigners cannot own freehold land. Long-term lease (Hak Pakai) available. Bali has large expat leasehold market." },
  { code:"BR", name:"Brazil",         rate:10.5, downMin:30, notes:"No restrictions on foreign ownership. High local rates — most foreigners use savings or foreign financing." },
  { code:"AR", name:"Argentina",      rate:15.0, downMin:30, notes:"Significant currency risk. Many transactions done in USD cash. Legal reforms ongoing — verify current rules." },
  { code:"CL", name:"Chile",          rate:5.5,  downMin:20, notes:"Most stable South American mortgage market. Foreigners can access local financing with RUT and proof of income." },
];

const TERMS = [10, 15, 20, 25, 30];

// ═══════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════

const nz = (v) => Math.max(0, parseFloat(v) || 0);

const money = (v, d = 0, c = "USD") => (
  Number.isFinite(v) && !isNaN(v)
    ? v.toLocaleString(undefined, { style:"currency", currency:c, maximumFractionDigits:d, minimumFractionDigits:d })
    : "—"
);

const fmtPct = (v, d = 1) => (Number.isFinite(v) ? `${v.toFixed(d)}%` : "—");

// ═══════════════════════════════════════════════════════════════════════
// MORTGAGE MATH
// ═══════════════════════════════════════════════════════════════════════

function calcMonthlyPI(principal, annualRate, termYears) {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return 0;
  const r = annualRate / 100 / 12;
  const N = termYears * 12;
  return (principal * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
}

function calcTotalInterest(principal, annualRate, termYears) {
  return calcMonthlyPI(principal, annualRate, termYears) * termYears * 12 - principal;
}

/** Auto-calculates PMI based on LTV — no manual entry needed */
function calcAutoPMI(loan, homePrice, downPct) {
  if (downPct >= 20 || !loan || !homePrice) return 0;
  const ltv = loan / homePrice;
  const rate = ltv > 0.95 ? 0.015 : ltv > 0.90 ? 0.012 : ltv > 0.85 ? 0.009 : 0.007;
  return (loan * rate) / 12;
}

/** Month when LTV drops to 80% and PMI can be cancelled */
function calcPMIDropOff(loan, homePrice, annualRate, monthlyPayment) {
  if (!loan || !homePrice || !annualRate || !monthlyPayment) return null;
  const target = homePrice * 0.80;
  const r = annualRate / 100 / 12;
  let bal = loan;
  for (let m = 1; m <= 360; m++) {
    const int = bal * r;
    const prin = monthlyPayment - int;
    if (prin <= 0) return null;
    bal = Math.max(0, bal - prin);
    if (bal <= target) return m;
  }
  return null;
}

function buildSchedule(principal, annualRate, termYears, extraMonthly = 0) {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return [];
  const r = annualRate / 100 / 12;
  const base = calcMonthlyPI(principal, annualRate, termYears);
  const pmt = base + extraMonthly;
  let bal = principal;
  const rows = [];
  for (let m = 1; m <= termYears * 12; m++) {
    const int = bal * r;
    const prin = Math.min(pmt - int, bal);
    if (prin < 0) break;
    bal = Math.max(0, bal - prin);
    rows.push({ month: m, payment: prin + int, principal: prin, interest: int, balance: bal });
    if (bal <= 0) break;
  }
  return rows;
}

/**
 * Bi-weekly payments = 26 half-payments/year = 13 full monthly payments.
 * Modelled as paying 1/12 extra per month (equivalent effect on interest).
 */
function calcBiweeklySavings(principal, annualRate, termYears) {
  if (!principal || !annualRate || !termYears) return null;
  const base = calcMonthlyPI(principal, annualRate, termYears);
  const extra = base / 12;
  const rows = buildSchedule(principal, annualRate, termYears, extra);
  const stdInterest = calcTotalInterest(principal, annualRate, termYears);
  const bwInterest = rows.reduce((s, row) => s + row.interest, 0);
  return {
    interestSaved: stdInterest - bwInterest,
    monthsSaved: termYears * 12 - rows.length,
  };
}

/**
 * Improved break-even: accounts for maintenance costs, mortgage interest
 * tax deduction, and full equity paydown (not just appreciation).
 */
function calcBreakEven({
  downPayment, closingCosts = 0,
  annualRate, monthlyPI,
  rent, tax, ins, hoa, homePrice,
  appreciation, rentGrowth, investReturn,
  maintenanceRate, taxDeductRate,
}) {
  if (!homePrice || !rent || !monthlyPI) return -1;
  const upfront = downPayment + closingCosts;
  const r = annualRate / 100 / 12;
  let buyCum = 0, rentCum = 0;
  let homeVal = homePrice, invested = upfront;
  let balance = homePrice - downPayment, monthlyRent = rent;

  for (let m = 1; m <= 360; m++) {
    const int = balance * r;
    const prin = Math.max(0, monthlyPI - int);
    const taxSave = int * (taxDeductRate / 100);
    const maint = (homeVal * (maintenanceRate / 100)) / 12;

    buyCum += monthlyPI + tax + ins + hoa + maint - taxSave;
    rentCum += monthlyRent;
    invested *= 1 + investReturn / 100 / 12;
    homeVal *= 1 + appreciation / 100 / 12;
    monthlyRent *= 1 + rentGrowth / 100 / 12;
    balance = Math.max(0, balance - prin);

    const equityGain = (homeVal - homePrice) + ((homePrice - downPayment) - balance);
    const opCost = invested - upfront;
    if (buyCum - equityGain + closingCosts + opCost <= rentCum) return m;
  }
  return -1;
}

/** Refinance break-even and savings */
function calcRefi(curBalance, curRate, curMonthsLeft, newRate, newTermYears, closingCosts) {
  const curMonthly = calcMonthlyPI(curBalance, curRate, curMonthsLeft / 12);
  const newMonthly = calcMonthlyPI(curBalance, newRate, newTermYears);
  const savings = curMonthly - newMonthly;
  const curRemaining = curMonthly * curMonthsLeft;
  const newTotal = newMonthly * newTermYears * 12 + closingCosts;
  return {
    curMonthly,
    newMonthly,
    monthlySavings: savings,
    totalSavings: curRemaining - newTotal,
    breakEvenMonths: savings > 0 ? Math.ceil(closingCosts / savings) : null,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// URL STATE (encode all inputs in hash for sharing)
// ═══════════════════════════════════════════════════════════════════════

function encodeState(obj) {
  try { return btoa(encodeURIComponent(JSON.stringify(obj))); } catch { return ""; }
}
function decodeState(str) {
  try { return JSON.parse(decodeURIComponent(atob(str))); } catch { return null; }
}
function readHashState() {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/[?&]?state=([^&]+)/);
  return m ? decodeState(m[1]) : null;
}
function writeHashState(state) {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#state=${encodeState(state)}`);
}

// ═══════════════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════

const lbl = "mb-1 block text-xs font-medium text-slate-500";

function inputCls(err = "") {
  return `h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner outline-none ring-1 transition focus:bg-white focus:ring-4 ${
    err ? "ring-rose-400 focus:ring-rose-300/40" : "ring-slate-200 focus:ring-violet-500/20"
  }`;
}
const selectCls = "h-11 w-full cursor-pointer rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-violet-500/20";

function Tip({ text, side = "left" }) {
  const pos = side === "right" ? "right-0" : side === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <span className="group relative ml-1.5 inline-flex align-middle">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[9px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400"
      >i</button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl bg-slate-900 px-3 py-2.5 text-xs leading-relaxed text-slate-100 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${pos}`}
      >{text}</span>
    </span>
  );
}

function F({ label, tip = "", tipSide = "left", err = "", span2 = false, children }) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <span className={lbl}>{label}{tip && <Tip text={tip} side={tipSide} />}</span>
      {children}
      {err && <p className="mt-1 text-xs text-rose-500">{err}</p>}
    </div>
  );
}

function RO({ value }) {
  return (
    <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
      {value}
    </div>
  );
}

function Slider({ val, set, min, max, step = 0.5 }) {
  return (
    <input type="range" min={min} max={max} step={step} value={val}
      onChange={e => set(e.target.value)}
      className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-violet-600" />
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white p-5 ring-1 ring-slate-200/60 shadow-[0_6px_20px_rgba(15,23,42,0.07)] ${className}`}>
      {children}
    </div>
  );
}
function VCard({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-[0_6px_20px_rgba(109,40,217,0.07)] ${className}`}>
      {children}
    </div>
  );
}
function ACard({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-amber-200 bg-amber-50/80 p-4 ${className}`}>
      {children}
    </div>
  );
}
function H2({ children, action = null }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="text-sm font-semibold text-slate-800">{children}</span>
      {action && <span>{action}</span>}
    </div>
  );
}

function dtiColor(v) { return v <= 28 ? "text-emerald-600" : v <= 36 ? "text-amber-600" : "text-rose-600"; }
function dtiBar(v)   { return v <= 28 ? "bg-emerald-500" : v <= 36 ? "bg-amber-400" : "bg-rose-500"; }
function dtiLabel(v) { return v <= 28 ? "Within guideline" : v <= 36 ? "Elevated" : "Above guideline"; }

function DTIRow({ label, value, guide, tip = "" }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}{tip && <Tip text={tip} side="right" />}</span>
        <span className={`font-bold ${dtiColor(value)}`}>{fmtPct(value)} — {dtiLabel(value)}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${dtiBar(value)}`}
          style={{ width: `${Math.min((value / 50) * 100, 100)}%` }} />
      </div>
      <div className="mt-0.5 text-xs text-slate-400">{guide}</div>
    </div>
  );
}

/** Pass / Caution / Stretch badge shown in the hero card */
function AffordabilityVerdict({ frontDTI, backDTI }) {
  const pass    = frontDTI <= 28 && backDTI <= 36;
  const caution = !pass && frontDTI <= 36 && backDTI <= 43;
  const verdict = pass ? "PASS" : caution ? "CAUTION" : "STRETCH";
  const cls     = pass
    ? "border-emerald-600/50 bg-emerald-900/40 text-emerald-400"
    : caution
    ? "border-amber-600/50 bg-amber-900/40 text-amber-400"
    : "border-rose-600/50 bg-rose-900/40 text-rose-400";
  const note = pass
    ? "Your income comfortably supports this loan at standard guidelines."
    : caution
    ? "This loan stretches lender guidelines — workable but watch your cash flow."
    : "Above standard guidelines. Consider a lower price or larger down payment.";
  return (
    <div className={`mt-4 rounded-xl border px-3 py-2.5 text-xs ${cls}`}>
      <span className="font-bold">{verdict}</span> — {note}
    </div>
  );
}

/** Collapsible "How this is calculated" section */
function HowThisWorks({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-violet-200 pt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900 focus:outline-none"
      >
        <span className="text-[10px]">{open ? "▾" : "▸"}</span> How this is calculated
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 rounded-xl bg-white/70 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-violet-200">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="flex-shrink-0 text-slate-400">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SHARE BUTTON
// ═══════════════════════════════════════════════════════════════════════

function ShareButton({ state }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(() => {
    try {
      const url = `${window.location.href.split("#")[0]}#state=${encodeState(state)}`;
      navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    } catch { /* noop */ }
  }, [state]);
  return (
    <button type="button" onClick={handle}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-400">
      {copied ? "✓ Copied!" : "🔗 Share link"}
    </button>
  );
}

function ResetButton({ onReset }) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300"
    >
      ↺ Reset
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AMORTIZATION CHART
// ═══════════════════════════════════════════════════════════════════════

function AmortizationChart({ rows }) {
  if (!rows.length) return null;
  const totalMonths = rows[rows.length - 1].month;
  const totalYears = Math.ceil(totalMonths / 12);
  const data = [];
  for (let y = 1; y <= totalYears; y++) {
    const slice = rows.slice((y - 1) * 12, y * 12);
    data.push({
      year: `Y${y}`,
      Principal: Math.round(slice.reduce((s, r) => s + r.principal, 0)),
      Interest:  Math.round(slice.reduce((s, r) => s + r.interest,  0)),
      Balance:   Math.round(slice[slice.length - 1]?.balance ?? 0),
    });
  }
  const fmt = (v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;
  return (
    <div style={{ height: 230 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} interval="preserveStartEnd" />
          <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} tickFormatter={fmt} width={46} />
          <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} tickFormatter={fmt} width={46} />
          <Tooltip formatter={(v, name) => [money(v), name]}
            contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="l" dataKey="Principal" stackId="a" fill="#818cf8" />
          <Bar yAxisId="l" dataKey="Interest"  stackId="a" fill="#fca5a5" radius={[3, 3, 0, 0]} />
          <Line yAxisId="r" type="monotone" dataKey="Balance" stroke="#7c3aed" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AMORTIZATION TABLE
// ═══════════════════════════════════════════════════════════════════════

function AmortizationTable({ rows }) {
  const [expanded, setExpanded] = useState(false);
  if (!rows.length) return null;
  const totalYears = Math.ceil(rows[rows.length - 1].month / 12);
  const years = [];
  for (let y = 1; y <= totalYears; y++) {
    const slice = rows.slice((y - 1) * 12, y * 12);
    years.push({
      year: y,
      interest:  slice.reduce((s, r) => s + r.interest, 0),
      principal: slice.reduce((s, r) => s + r.principal, 0),
      balance:   slice[slice.length - 1]?.balance ?? 0,
    });
  }
  const display = expanded ? years : years.slice(0, 5);
  return (
    <div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
              <th className="px-4 py-2 text-left">Year</th>
              <th className="px-4 py-2 text-right">Principal</th>
              <th className="px-4 py-2 text-right">Interest</th>
              <th className="px-4 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {display.map((y, i) => (
              <tr key={y.year} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <td className="px-4 py-2 font-medium text-slate-700">Year {y.year}</td>
                <td className="px-4 py-2 text-right text-slate-900">{money(y.principal)}</td>
                <td className="px-4 py-2 text-right text-slate-600">{money(y.interest)}</td>
                <td className="px-4 py-2 text-right font-semibold text-slate-900">{money(y.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {years.length > 5 && (
        <button type="button" onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-semibold text-violet-700 hover:underline focus:outline-none focus:underline">
          {expanded ? "Show less ↑" : `Show all ${years.length} years ↓`}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STICKY MOBILE SUMMARY
// ═══════════════════════════════════════════════════════════════════════

function MobileSummaryBar({ monthly }) {
  return (
    <div className="sticky top-0 z-40 -mx-4 mb-4 flex items-center justify-between bg-white/95 px-4 py-3 backdrop-blur-sm shadow-sm ring-1 ring-slate-200 lg:hidden">
      <span className="text-xs font-medium text-slate-500">Est. monthly payment</span>
      <span className="text-lg font-bold text-violet-700">{money(monthly, 2)}/mo</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// REFINANCE TAB
// ═══════════════════════════════════════════════════════════════════════

function RefinanceTab() {
  const [curBalance,    setCurBalance]    = useState("380000");
  const [curRate,       setCurRate]       = useState("7.25");
  const [curMonthsLeft, setCurMonthsLeft] = useState("300");
  const [newRate,       setNewRate]       = useState("6.25");
  const [newTerm,       setNewTerm]       = useState(30);
  const [closingCosts,  setClosingCosts]  = useState("5000");

  // Validation — individual strings avoid TS "property does not exist on {}" errors
  const curRateErr = nz(curRate) <= 0 || nz(curRate) > 30 ? "Enter a rate between 0.1–30%" : "";
  const newRateErr = nz(newRate) <= 0 || nz(newRate) > 30 ? "Enter a rate between 0.1–30%" : "";
  const monthsErr  = nz(curMonthsLeft) < 1                ? "Enter remaining months (1–360)" : "";

  const result = useMemo(() => {
    if (nz(curRate) <= 0 || nz(curRate) > 30) return null;
    if (nz(newRate) <= 0 || nz(newRate) > 30) return null;
    if (nz(curMonthsLeft) < 1) return null;
    return calcRefi(nz(curBalance), nz(curRate), nz(curMonthsLeft), nz(newRate), newTerm, nz(closingCosts));
  }, [curBalance, curRate, curMonthsLeft, newRate, newTerm, closingCosts]);

  const shareState = { tab:"refinance", curBalance, curRate, curMonthsLeft, newRate, newTerm: String(newTerm), closingCosts };

  function handleReset() {
    setCurBalance("380000"); setCurRate("7.25"); setCurMonthsLeft("300");
    setNewRate("6.25"); setNewTerm(30); setClosingCosts("5000");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <Card>
          <H2 action={<ResetButton onReset={handleReset} />}>Current Loan</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Remaining balance" span2>
              <input className={inputCls()} type="number" value={curBalance} onChange={e => setCurBalance(e.target.value)} />
            </F>
            <F label="Current interest rate (%)" err={curRateErr}>
              <input className={inputCls(curRateErr)} type="number" step="0.05" value={curRate} onChange={e => setCurRate(e.target.value)} />
            </F>
            <F label="Remaining months" err={monthsErr}
               tip="How many monthly payments you have left on your current loan.">
              <input className={inputCls(monthsErr)} type="number" value={curMonthsLeft} onChange={e => setCurMonthsLeft(e.target.value)} />
              <div className="mt-0.5 text-xs text-slate-400">{(nz(curMonthsLeft) / 12).toFixed(1)} years remaining</div>
            </F>
          </div>
        </Card>

        <Card>
          <H2>New Loan</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="New interest rate (%)" err={newRateErr}>
              <input className={inputCls(newRateErr)} type="number" step="0.05" value={newRate} onChange={e => setNewRate(e.target.value)} />
            </F>
            <F label="New loan term">
              <select className={selectCls} value={newTerm} onChange={e => setNewTerm(Number(e.target.value))}>
                {TERMS.map(t => <option key={t} value={t}>{t} years</option>)}
              </select>
            </F>
            <F label="Closing costs ($)"
               tip="Typical refinance closing costs are 2–5% of loan balance ($2k–$10k for most loans).">
              <input className={inputCls()} type="number" value={closingCosts} onChange={e => setClosingCosts(e.target.value)} />
            </F>
          </div>
        </Card>

        <div className="flex justify-end">
          <ShareButton state={shareState} />
        </div>
      </div>

      <div className="space-y-3">
        {result ? (
          <>
            <VCard>
              <div className="text-xs font-semibold uppercase tracking-widest text-violet-700">Break-Even Point</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">
                {result.breakEvenMonths
                  ? `${result.breakEvenMonths} months`
                  : result.monthlySavings <= 0
                    ? "Never — higher payment"
                    : "Immediate"}
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {result.breakEvenMonths
                  ? `Refinancing pays for itself after ${result.breakEvenMonths} months (${(result.breakEvenMonths / 12).toFixed(1)} years).`
                  : result.monthlySavings <= 0
                    ? "Your new monthly payment is higher — refinancing increases your costs."
                    : "Refinancing saves money immediately with no closing costs to recoup."}
              </p>
            </VCard>

            <Card>
              <H2>Payment Comparison</H2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm border-t border-slate-100 pt-3">
                  <span className="text-slate-600">Current monthly payment</span>
                  <span className="font-bold text-slate-900">{money(result.curMonthly, 2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">New monthly payment</span>
                  <span className="font-bold text-slate-900">{money(result.newMonthly, 2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-100 pt-3">
                  <span className="font-semibold text-slate-800">Monthly savings</span>
                  <span className={`text-lg font-bold ${result.monthlySavings >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {result.monthlySavings >= 0 ? "+" : ""}{money(result.monthlySavings, 2)}/mo
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <H2>Total Cost Comparison</H2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Closing costs</span>
                  <span className="font-semibold text-slate-900">{money(nz(closingCosts))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total remaining on current loan</span>
                  <span className="font-semibold text-slate-900">{money(result.curMonthly * nz(curMonthsLeft))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total cost of new loan + closing</span>
                  <span className="font-semibold text-slate-900">{money(result.newMonthly * newTerm * 12 + nz(closingCosts))}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3">
                  <span className="font-semibold text-slate-800">Net savings over life of loan</span>
                  <span className={`text-lg font-bold ${result.totalSavings >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {result.totalSavings >= 0 ? "+" : ""}{money(result.totalSavings)}
                  </span>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200">
              Net savings accounts for the longer term if extending. A 30-yr refi on a 25-yr remaining loan reduces monthly payments but increases total interest — consider a 20–25 yr term if you want true savings.
              </div>
            </Card>
          </>
        ) : (
          <Card className="flex min-h-40 items-center justify-center text-sm text-slate-400">
            Fix the errors above to see refinance analysis.
          </Card>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// US TAB
// ═══════════════════════════════════════════════════════════════════════

function USTab() {
  // ── state ──────────────────────────────────────────────────────────
  const [homePrice,        setHomePrice]        = useState("500000");
  const [downPct,          setDownPct]          = useState("20");
  const [rate,             setRate]             = useState("6.75");
  const [term,             setTerm]             = useState(30);
  const [closingCostPct,   setClosingCostPct]   = useState("2.5");
  const [propertyTaxRate,  setPropertyTaxRate]  = useState("1.1");
  const [insurance,        setInsurance]        = useState("150");
  const [hoa,              setHoa]              = useState("0");
  const [maintenanceRate,  setMaintenanceRate]  = useState("1.0");
  const [extraMonthly,     setExtraMonthly]     = useState("0");
  const [biweekly,         setBiweekly]         = useState(false);
  const [grossIncome,      setGrossIncome]      = useState("120000");
  const [otherDebts,       setOtherDebts]       = useState("500");
  const [monthlyRent,      setMonthlyRent]      = useState("2500");
  const [appreciation,     setAppreciation]     = useState("3.5");
  const [rentGrowth,       setRentGrowth]       = useState("3.0");
  const [investReturn,     setInvestReturn]     = useState("7.0");
  const [taxDeductRate,    setTaxDeductRate]    = useState("22");

  // ── derived ────────────────────────────────────────────────────────
  const hp   = nz(homePrice);
  const dpPc = nz(downPct);
  const dp   = hp * (dpPc / 100);
  const loan = hp - dp;
  const r    = nz(rate);

  // Validation — individual strings avoid TS "property does not exist on {}" errors
  const homePriceErr = hp <= 0                ? "Enter a valid home price" : "";
  const downPctErr   = dpPc < 0 || dpPc > 100 ? "Enter 0–100%" : "";
  const rateErr      = r <= 0 || r > 30       ? "Enter a rate between 0.1–30%" : "";

  const monthlyPI  = calcMonthlyPI(loan, r, term);
  const monthlyTax = (hp * nz(propertyTaxRate) / 100) / 12;
  const monthlyIns = nz(insurance);
  const monthlyHOA = nz(hoa);
  const monthlyPMI = calcAutoPMI(loan, hp, dpPc);
  const totalMonthly = monthlyPI + monthlyTax + monthlyIns + monthlyHOA + monthlyPMI;
  const totalInterest = calcTotalInterest(loan, r, term);

  // PMI drop-off
  const pmiDropMonth = useMemo(
    () => calcPMIDropOff(loan, hp, r, monthlyPI),
    [loan, hp, r, monthlyPI]
  );

  // Amortization
  const amortRows = useMemo(
    () => buildSchedule(loan, r, term, nz(extraMonthly)),
    [loan, rate, term, extraMonthly]
  );

  // Extra payment savings
  const extraInterest    = nz(extraMonthly) > 0 ? totalInterest - amortRows.reduce((s, row) => s + row.interest, 0) : 0;
  const extraMonthsSaved = nz(extraMonthly) > 0 ? term * 12 - amortRows.length : 0;

  // Bi-weekly
  const bwSavings = useMemo(
    () => biweekly ? calcBiweeklySavings(loan, r, term) : null,
    [biweekly, loan, rate, term]
  );

  // Affordability
  const grossMonthly = nz(grossIncome) / 12;
  const frontDTI = grossMonthly > 0 ? (totalMonthly / grossMonthly) * 100 : 0;
  const backDTI  = grossMonthly > 0 ? ((totalMonthly + nz(otherDebts)) / grossMonthly) * 100 : 0;

  // Cash to close — declared before break-even so it can be passed in
  const estimatedClosing = loan * (nz(closingCostPct) / 100);
  const reserveAmount    = totalMonthly * 3;
  const totalCashToClose = dp + estimatedClosing + reserveAmount;

  // Break-even
  const breakEvenMonth = useMemo(() => calcBreakEven({
    downPayment: dp, closingCosts: estimatedClosing,
    annualRate: r, monthlyPI,
    rent: nz(monthlyRent), tax: monthlyTax, ins: monthlyIns, hoa: monthlyHOA, homePrice: hp,
    appreciation: nz(appreciation), rentGrowth: nz(rentGrowth), investReturn: nz(investReturn),
    maintenanceRate: nz(maintenanceRate), taxDeductRate: nz(taxDeductRate),
  }), [dp, estimatedClosing, r, monthlyPI, monthlyRent, monthlyTax, monthlyIns, monthlyHOA, hp, appreciation, rentGrowth, investReturn, maintenanceRate, taxDeductRate]);

  const beYears = breakEvenMonth > 0 ? (breakEvenMonth / 12).toFixed(1) : null;

  // Recommended income (to stay at 28% front-end DTI)
  const recommendedIncome = totalMonthly > 0 ? (totalMonthly / 0.28) * 12 : 0;

  // Rate sensitivity — pre-computed outside JSX to avoid parser issues with block-body lambdas
  const sensitivityRows = useMemo(() => {
    return [-1, -0.5, -0.25, 0, 0.25, 0.5, 1].map(delta => {
      const testRate    = Math.max(0.1, r + delta);
      const testPayment = calcMonthlyPI(loan, testRate, term);
      const diff        = testPayment - monthlyPI;
      const absDiff     = Math.abs(diff);
      return {
        delta,
        testRate,
        testPayment,
        diff,
        isCurrent: delta === 0,
        diffStr:   absDiff < 0.5 ? "—" : (diff > 0 ? "+" : "") + money(diff, 0),
        diffColor: absDiff < 0.5 ? "text-slate-400" : diff > 0 ? "text-rose-600" : "text-emerald-600",
      };
    });
  }, [loan, r, term, monthlyPI]);

  // Max home price at 28% DTI
  const maxMonthlyPI = grossMonthly * 0.28 - monthlyTax - monthlyIns - monthlyHOA - monthlyPMI;
  const rr = r / 100 / 12;
  const termN = term * 12;
  const maxLoan = maxMonthlyPI > 0 && rr > 0
    ? maxMonthlyPI * (Math.pow(1 + rr, termN) - 1) / (rr * Math.pow(1 + rr, termN))
    : 0;
  const maxHomePrice = dpPc < 100 ? maxLoan / (1 - dpPc / 100) : 0;

  // URL state for sharing
  const shareState = {
    tab:"us", homePrice, downPct, rate, term: String(term), closingCostPct,
    propertyTaxRate, insurance, hoa, maintenanceRate, extraMonthly,
    grossIncome, otherDebts, monthlyRent, appreciation, rentGrowth, investReturn, taxDeductRate,
  };

  function handleReset() {
    setHomePrice("500000"); setDownPct("20"); setRate("6.75"); setTerm(30);
    setClosingCostPct("2.5"); setPropertyTaxRate("1.1"); setInsurance("150");
    setHoa("0"); setMaintenanceRate("1.0"); setExtraMonthly("0"); setBiweekly(false);
    setGrossIncome("120000"); setOtherDebts("500"); setMonthlyRent("2500");
    setAppreciation("3.5"); setRentGrowth("3.0"); setInvestReturn("7.0"); setTaxDeductRate("22");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ── INPUTS ── */}
      <div className="space-y-3">

        <Card>
          <H2 action={<ResetButton onReset={handleReset} />}>Home &amp; Loan Details</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Home price" err={homePriceErr} span2>
              <input className={inputCls(homePriceErr)} type="number" value={homePrice} onChange={e => setHomePrice(e.target.value)} placeholder="500000" />
            </F>

            <F label="Down payment (%)" err={downPctErr}
               tip="Percentage of home price paid upfront. Below 20% triggers automatic PMI.">
              <input className={inputCls(downPctErr)} type="number" value={downPct} onChange={e => setDownPct(e.target.value)} />
              <Slider val={downPct} set={setDownPct} min={0} max={50} step={0.5} />
            </F>

            <F label="Down payment ($)">
              <RO value={money(dp)} />
            </F>

            <F label="Interest rate (%)" err={rateErr}>
              <input className={inputCls(rateErr)} type="number" step="0.05" value={rate} onChange={e => setRate(e.target.value)} />
            </F>

            <F label="Loan term">
              <select className={selectCls} value={term} onChange={e => setTerm(Number(e.target.value))}>
                {TERMS.map(t => <option key={t} value={t}>{t} years</option>)}
              </select>
            </F>

            <F label="Est. closing costs (%)" tipSide="right"
               tip="US closing costs typically run 2–5% of the loan. Used in the cash-to-close estimate on the right.">
              <input className={inputCls()} type="number" step="0.25" value={closingCostPct} onChange={e => setClosingCostPct(e.target.value)} />
            </F>

            <F label="Closing costs ($)">
              <RO value={money(estimatedClosing)} />
            </F>
          </div>
        </Card>

        <Card>
          <H2>Monthly Costs</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Property tax (%/yr)"
               tip="US average is ~1.1%. Check your county assessor's website for the exact rate.">
              <input className={inputCls()} type="number" step="0.1" value={propertyTaxRate} onChange={e => setPropertyTaxRate(e.target.value)} />
            </F>

            <F label="Homeowners insurance ($/mo)">
              <input className={inputCls()} type="number" value={insurance} onChange={e => setInsurance(e.target.value)} />
            </F>

            <F label="HOA fees ($/mo)">
              <input className={inputCls()} type="number" value={hoa} onChange={e => setHoa(e.target.value)} />
            </F>

            <F label="Maintenance reserve (%/yr)"
               tip="Recommended: budget 1–2% of home value annually for repairs & upkeep. Affects break-even calculation.">
              <input className={inputCls()} type="number" step="0.1" value={maintenanceRate} onChange={e => setMaintenanceRate(e.target.value)} />
            </F>

            <F label="Extra monthly payment" tipSide="right"
               tip="Additional principal per month. Reduces total interest and shortens loan." span2>
              <input className={inputCls()} type="number" value={extraMonthly} onChange={e => setExtraMonthly(e.target.value)} placeholder="0" />
            </F>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="biweekly" checked={biweekly} onChange={e => setBiweekly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-violet-600" />
              <label htmlFor="biweekly" className="text-sm text-slate-700 cursor-pointer">
                Bi-weekly payments
                <Tip text="26 half-payments per year equals 13 full monthly payments — equivalent to one extra payment annually, saving significant interest." />
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <H2>Affordability &amp; Rent vs Buy</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Gross annual income">
              <input className={inputCls()} type="number" value={grossIncome} onChange={e => setGrossIncome(e.target.value)} />
            </F>
            <F label="Other monthly debts" tipSide="right"
               tip="Car loans, student loans, credit cards — used to calculate back-end DTI.">
              <input className={inputCls()} type="number" value={otherDebts} onChange={e => setOtherDebts(e.target.value)} />
            </F>
            <F label="Current monthly rent">
              <input className={inputCls()} type="number" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} />
            </F>
            <F label="Home appreciation (%/yr)">
              <input className={inputCls()} type="number" step="0.1" value={appreciation} onChange={e => setAppreciation(e.target.value)} />
            </F>
            <F label="Rent growth (%/yr)">
              <input className={inputCls()} type="number" step="0.1" value={rentGrowth} onChange={e => setRentGrowth(e.target.value)} />
            </F>
            <F label="Investment return (%/yr)" tipSide="right"
               tip="What the down payment could earn if invested instead. Used in opportunity-cost calculation.">
              <input className={inputCls()} type="number" step="0.1" value={investReturn} onChange={e => setInvestReturn(e.target.value)} />
            </F>
            <F label="Marginal tax rate (%)" tipSide="right"
               tip="Used to estimate mortgage interest deduction value. Set to 0 if you take the standard deduction."
               span2>
              <input className={inputCls()} type="number" step="1" value={taxDeductRate} onChange={e => setTaxDeductRate(e.target.value)} />
            </F>
          </div>
        </Card>

        <div className="flex justify-end">
          <ShareButton state={shareState} />
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="space-y-3">
        <MobileSummaryBar monthly={totalMonthly} />

        {/* 1. HERO — monthly payment, cash to close, affordability verdict */}
        <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)]">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Your Bottom Line</div>
          <div className="mt-3 mb-4">
            <div className="text-xs text-slate-400">Estimated monthly payment</div>
            <div className="flex items-end gap-1.5">
              <span className="text-4xl font-bold tracking-tight">{money(totalMonthly, 0)}</span>
              <span className="mb-1 text-base text-slate-400">/mo</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
            <div>
              <div className="text-xs text-slate-400">Cash to close</div>
              <div className="text-xl font-bold">{money(totalCashToClose)}</div>
              <div className="mt-0.5 text-[10px] text-slate-500">down + closing + 3-mo buffer</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Income for 28% DTI</div>
              <div className="text-xl font-bold">{money(recommendedIncome)}/yr</div>
              <div className="mt-0.5 text-[10px] text-slate-500">not a lender requirement</div>
            </div>
          </div>
          <AffordabilityVerdict frontDTI={frontDTI} backDTI={backDTI} />
        </div>

        {/* 2. CASH TO CLOSE — full breakdown */}
        <Card>
          <H2>Cash Needed to Close</H2>
          <div className="space-y-2 text-sm">
            {[
              { label: `Down payment (${dpPc}%)`,                     value: dp },
              { label: `Est. closing costs (${nz(closingCostPct)}%)`, value: estimatedClosing },
              { label: "3-month planning buffer",                      value: reserveAmount },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-slate-600">{row.label}</span>
                <span className="font-semibold text-slate-900">{money(row.value)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-900">Total cash needed</span>
              <span className="text-xl font-bold text-slate-900">{money(totalCashToClose)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            The 3-month buffer is a common planning target, not a universal lender requirement — actual reserve requirements vary by loan type. Closing costs are an estimate; your official Loan Estimate will show the exact figure.
          </p>
        </Card>

        {/* 3. MONTHLY PAYMENT BREAKDOWN */}
        <Card>
          <H2>Monthly Payment Breakdown</H2>
          <div className="space-y-2 text-sm">
            {[
              { label: "Principal & Interest", value: monthlyPI },
              { label: "Property Tax",         value: monthlyTax },
              { label: "Insurance",            value: monthlyIns },
              { label: "HOA",                  value: monthlyHOA },
              ...(monthlyPMI > 0 ? [{ label: "PMI (auto-estimated)", value: monthlyPMI }] : []),
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-slate-600">{row.label}</span>
                <span className="font-semibold text-slate-900">{money(row.value, 2)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-900">Total monthly</span>
              <span className="text-xl font-bold text-violet-700">{money(totalMonthly, 2)}</span>
            </div>
          </div>
          {monthlyPMI > 0 && pmiDropMonth && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-slate-700">
              <span className="font-semibold text-amber-700">PMI auto-estimated at {money(monthlyPMI, 0)}/mo.</span>{" "}
              At current payments, PMI can be cancelled around{" "}
              <strong>month {pmiDropMonth}</strong> ({(pmiDropMonth / 12).toFixed(1)} yrs) when LTV reaches 80%. It's not removed automatically — you must request it.
            </div>
          )}
        </Card>

        {/* 4. AFFORDABILITY VERDICT */}
        <Card>
          <H2>Affordability Check</H2>
          <div className="space-y-3">
            <DTIRow label="Front-end DTI" value={frontDTI} guide="≤28% guideline"
              tip="Housing costs as % of gross monthly income. Most lenders want ≤28%." />
            <DTIRow label="Back-end DTI" value={backDTI} guide="≤36–43% guideline"
              tip="All monthly debts as % of gross income. Conventional lenders want ≤36–43%." />
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              Max home price at 28% front-end DTI:{" "}
              <span className="font-semibold text-slate-900">
                {grossMonthly > 0 && maxHomePrice > 0 ? money(maxHomePrice) : "—"}
              </span>
            </div>
          </div>
        </Card>

        {/* 5. RATE SENSITIVITY */}
        <Card>
          <H2>Rate Sensitivity</H2>
          <p className="mb-3 text-xs text-slate-500">
            How monthly P&amp;I shifts if rates move from your current {fmtPct(r)}.
          </p>
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                  <th className="px-3 py-2 text-left">Rate</th>
                  <th className="px-3 py-2 text-right">Monthly P&amp;I</th>
                  <th className="px-3 py-2 text-right">vs. current</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityRows.map(row => (
                  <tr key={row.delta} className={`border-b border-slate-100 ${row.isCurrent ? "bg-violet-50" : ""}`}>
                    <td className={`px-3 py-2 ${row.isCurrent ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                      {fmtPct(row.testRate)}
                      {row.isCurrent && (
                        <span className="ml-1.5 text-[10px] font-normal text-violet-600 uppercase tracking-wide">current</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900">{money(row.testPayment, 0)}/mo</td>
                    <td className={`px-3 py-2 text-right font-semibold ${row.diffColor}`}>{row.diffStr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 6. LONG-TERM COST */}
        <VCard>
          <div className="text-xs font-semibold uppercase tracking-widest text-violet-700">Long-Term Cost</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {[
              { label:"Loan amount",           value: money(loan) },
              { label:"Total interest",         value: money(totalInterest) },
              { label:"Total cost of loan",     value: money(loan + totalInterest) },
              { label:"Interest/price ratio",   value: hp > 0 ? fmtPct((totalInterest / hp) * 100) : "—" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className="text-lg font-bold text-slate-900">{s.value}</div>
              </div>
            ))}
          </div>
          {nz(extraMonthly) > 0 && (
            <div className="mt-3 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs text-slate-700">
              <span className="font-semibold">Extra {money(nz(extraMonthly), 0)}/mo:</span>{" "}
              save <span className="font-semibold text-emerald-600">{money(extraInterest)}</span> in interest,
              pay off <span className="font-semibold text-emerald-600">{extraMonthsSaved} months early</span>.
            </div>
          )}
          {bwSavings && (
            <div className="mt-2 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs text-slate-700">
              <span className="font-semibold">Bi-weekly payments:</span>{" "}
              save <span className="font-semibold text-emerald-600">{money(bwSavings.interestSaved)}</span> in interest,
              pay off <span className="font-semibold text-emerald-600">{bwSavings.monthsSaved} months early</span>.
            </div>
          )}
        </VCard>

        {/* 7. RENT VS BUY */}
        <VCard>
          <div className="text-xs font-semibold uppercase tracking-widest text-violet-700">Rent vs Buy Break-Even</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {beYears ? `${beYears} years` : "30+ years"}
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {beYears
              ? `Buying becomes cheaper than renting after ~${beYears} years at current assumptions.`
              : "Buying doesn't break even within 30 years at current assumptions. Renting may be more cost-effective."}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>Monthly rent: <strong>{money(nz(monthlyRent))}</strong></div>
            <div>Monthly own: <strong>{money(totalMonthly)}</strong></div>
            <div>Rent growth: <strong>{fmtPct(nz(rentGrowth))}/yr</strong></div>
            <div>Appreciation: <strong>{fmtPct(nz(appreciation))}/yr</strong></div>
            <div>Maintenance: <strong>{fmtPct(nz(maintenanceRate))}/yr</strong></div>
            <div>Tax deduction: <strong>{fmtPct(nz(taxDeductRate))} bracket</strong></div>
          </div>
          <HowThisWorks items={[
            `Each month, cumulative ownership cost (P&I + tax + insurance + HOA + ${fmtPct(nz(maintenanceRate))}/yr maintenance) is compared to cumulative rent.`,
            `Rent grows at ${fmtPct(nz(rentGrowth))}/yr compounding. Even a small rent-growth rate significantly shifts the break-even.`,
            `Your ${money(dp)} down payment is modelled as an investment earning ${fmtPct(nz(investReturn))}/yr — this is the opportunity cost of buying.`,
            `Equity paydown (principal repaid + appreciation) is credited back to the buyer each month, reducing the net cost of owning.`,
            nz(taxDeductRate) > 0
              ? `A ${fmtPct(nz(taxDeductRate))} marginal tax deduction on mortgage interest is applied. Remove this if you take the standard deduction.`
              : "No mortgage interest tax deduction is applied (standard deduction assumed).",
            "All projections are estimates. Actual results depend on market conditions, tax rules, and your personal situation.",
          ]} />
        </VCard>

        {/* 8. CHART */}
        <Card>
          <H2>Principal vs Interest Over Time</H2>
          <AmortizationChart rows={amortRows} />
        </Card>

        {/* 9. TABLE */}
        <Card>
          <H2>Amortization Schedule</H2>
          <AmortizationTable rows={amortRows} />
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INTERNATIONAL TAB
// ═══════════════════════════════════════════════════════════════════════

function InternationalTab() {
  const [countryCode,    setCountryCode]    = useState("PT");
  const [homePrice,      setHomePrice]      = useState("350000");
  const [downPct,        setDownPct]        = useState("30");
  const [useCustomRate,  setUseCustomRate]  = useState(false);
  const [customRate,     setCustomRate]     = useState("");
  const [term,           setTerm]           = useState(20);
  const [closingCostPct, setClosingCostPct] = useState("7");
  const [annualTaxAmt,   setAnnualTaxAmt]   = useState("1200");
  const [insurance,      setInsurance]      = useState("100");
  const [extraMonthly,   setExtraMonthly]   = useState("0");
  const [grossIncome,    setGrossIncome]    = useState("120000");
  const [otherDebts,     setOtherDebts]     = useState("500");
  const [monthlyRent,    setMonthlyRent]    = useState("1500");
  const [appreciation,   setAppreciation]   = useState("3.0");
  const [rentGrowth,     setRentGrowth]     = useState("2.5");
  const [investReturn,   setInvestReturn]   = useState("7.0");
  const [maintenanceRate,setMaintenanceRate]= useState("1.0");

  const country = COUNTRIES.find(c => c.code === countryCode) ?? COUNTRIES[0];
  const effectiveRate = (useCustomRate && nz(customRate) > 0) ? nz(customRate) : country.rate;

  const hp   = nz(homePrice);
  const dpPc = nz(downPct);
  const dp   = hp * (dpPc / 100);
  const loan = hp - dp;
  const closingCosts = hp * (nz(closingCostPct) / 100);
  const totalUpfront = dp + closingCosts;

  const monthlyPI  = calcMonthlyPI(loan, effectiveRate, term);
  const monthlyTax = nz(annualTaxAmt) / 12;
  const monthlyIns = nz(insurance);
  const totalMonthly = monthlyPI + monthlyTax + monthlyIns;
  const totalInterest = calcTotalInterest(loan, effectiveRate, term);

  const grossMonthly = nz(grossIncome) / 12;
  const frontDTI = grossMonthly > 0 ? (totalMonthly / grossMonthly) * 100 : 0;
  const backDTI  = grossMonthly > 0 ? ((totalMonthly + nz(otherDebts)) / grossMonthly) * 100 : 0;

  const amortRows = useMemo(
    () => buildSchedule(loan, effectiveRate, term, nz(extraMonthly)),
    [loan, effectiveRate, term, extraMonthly]
  );

  const breakEvenMonth = useMemo(() => calcBreakEven({
    downPayment: dp, closingCosts,
    annualRate: effectiveRate, monthlyPI,
    rent: nz(monthlyRent), tax: monthlyTax, ins: monthlyIns, hoa: 0, homePrice: hp,
    appreciation: nz(appreciation), rentGrowth: nz(rentGrowth), investReturn: nz(investReturn),
    maintenanceRate: nz(maintenanceRate), taxDeductRate: 0,
  }), [dp, closingCosts, effectiveRate, monthlyPI, monthlyRent, monthlyTax, monthlyIns, hp, appreciation, rentGrowth, investReturn, maintenanceRate]);

  const beYears = breakEvenMonth > 0 ? (breakEvenMonth / 12).toFixed(1) : null;

  // Reset rate and down pct when country changes
  useEffect(() => {
    setDownPct(String(country.downMin));
    setUseCustomRate(false);
    setCustomRate("");
  }, [countryCode]);

  const shareState = {
    tab:"international", countryCode, homePrice, downPct, useCustomRate: String(useCustomRate),
    customRate, term: String(term), closingCostPct, annualTaxAmt, insurance, extraMonthly,
    grossIncome, otherDebts, monthlyRent, appreciation, rentGrowth, investReturn, maintenanceRate,
  };

  function handleReset() {
    setCountryCode("PT"); setHomePrice("350000"); setDownPct("30");
    setUseCustomRate(false); setCustomRate(""); setTerm(20);
    setClosingCostPct("7"); setAnnualTaxAmt("1200"); setInsurance("100");
    setExtraMonthly("0"); setGrossIncome("120000"); setOtherDebts("500");
    setMonthlyRent("1500"); setAppreciation("3.0"); setRentGrowth("2.5");
    setInvestReturn("7.0"); setMaintenanceRate("1.0");
  }

  return (
    <div className="space-y-4">
      {/* Global disclaimer — full width above the two-column layout */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-amber-800">⚠️ International data is for planning only — not financial or legal advice</span>
        </div>
        <p className="text-xs leading-relaxed text-amber-900">
          Mortgage access for foreign buyers varies enormously by country, residency status, employment type, and individual bank policy. Rates shown are indicative benchmarks — your actual rate could be materially higher or lower. Some countries listed may not offer mortgages to non-residents at all. Before making any decisions, consult a local mortgage broker, tax adviser, and property lawyer in your target country.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
      {/* ── INPUTS ── */}
      <div className="space-y-3">

        <ACard>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="text-xs font-semibold uppercase tracking-widest text-amber-700">⚠️ Planning Estimates Only</div>
            <span className="flex-shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">Not a quote</span>
          </div>
          <p className="text-sm leading-6 text-slate-700">{country.notes}</p>
          <p className="mt-2 text-xs text-amber-800 font-medium">
            Rates shown are rough benchmarks sourced from public data — actual rates for foreign buyers vary significantly based on residency status, income documentation, lender, and loan-to-value ratio. Always get quotes from local banks before making decisions.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Min. down (est.): {country.downMin}%
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Indicative rate: ~{country.rate}%
            </span>
          </div>
        </ACard>

        <Card>
          <H2 action={<ResetButton onReset={handleReset} />}>Country &amp; Home Details</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Target country" span2>
              <select className={selectCls} value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </F>

            <F label="Home price (USD equivalent)" span2>
              <input className={inputCls()} type="number" value={homePrice} onChange={e => setHomePrice(e.target.value)} />
            </F>

            <F label="Down payment (%)"
               tip={`Minimum for foreign buyers in ${country.name}: ${country.downMin}%`}>
              <input className={inputCls()} type="number" value={downPct} onChange={e => setDownPct(e.target.value)} />
              <Slider val={downPct} set={setDownPct} min={0} max={60} step={1} />
            </F>

            <F label="Down payment ($)">
              <RO value={money(dp)} />
            </F>

            <div className="sm:col-span-2 grid grid-cols-2 gap-3 items-start">
              <F label="Interest rate (%)" tipSide="right"
                 tip={`${country.name} typical rate: ~${country.rate}%. Toggle to enter a custom quote.`}>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <input type="checkbox" id="customRate" checked={useCustomRate} onChange={e => setUseCustomRate(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-violet-600" />
                    <label htmlFor="customRate" className="cursor-pointer">Use custom rate</label>
                  </div>
                  {useCustomRate ? (
                    <input className={inputCls()} type="number" step="0.1" value={customRate}
                      onChange={e => setCustomRate(e.target.value)} placeholder={String(country.rate)} />
                  ) : (
                    <RO value={`${country.rate}% (country default)`} />
                  )}
                </div>
              </F>

              {/* pt-5 offsets past the "Interest rate" label so the select aligns with "Use custom rate" */}
              <div className="pt-5">
                <span className={lbl}>Loan term</span>
                <select className={selectCls} value={term} onChange={e => setTerm(Number(e.target.value))}>
                  {TERMS.map(t => <option key={t} value={t}>{t} years</option>)}
                </select>
              </div>
            </div>

            <F label="Closing costs (%)" tipSide="right"
               tip="Transfer taxes, notary, agent fees. Portugal ~7%, France ~8%, Spain ~10–12%.">
              <input className={inputCls()} type="number" step="0.5" value={closingCostPct} onChange={e => setClosingCostPct(e.target.value)} />
            </F>

            <F label="Closing costs ($)">
              <RO value={money(closingCosts)} />
            </F>
          </div>
        </Card>

        <Card>
          <H2>Monthly Costs</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Annual property tax ($)">
              <input className={inputCls()} type="number" value={annualTaxAmt} onChange={e => setAnnualTaxAmt(e.target.value)} />
            </F>
            <F label="Monthly insurance ($)">
              <input className={inputCls()} type="number" value={insurance} onChange={e => setInsurance(e.target.value)} />
            </F>
            <F label="Maintenance reserve (%/yr)"
               tip="Budget 1–2% of home value for annual repairs and upkeep.">
              <input className={inputCls()} type="number" step="0.1" value={maintenanceRate} onChange={e => setMaintenanceRate(e.target.value)} />
            </F>
            <F label="Extra monthly payment">
              <input className={inputCls()} type="number" value={extraMonthly} onChange={e => setExtraMonthly(e.target.value)} placeholder="0" />
            </F>
          </div>
        </Card>

        <Card>
          <H2>Affordability &amp; Rent vs Buy</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Gross annual income (USD)">
              <input className={inputCls()} type="number" value={grossIncome} onChange={e => setGrossIncome(e.target.value)} />
            </F>
            <F label="Other monthly debts ($)">
              <input className={inputCls()} type="number" value={otherDebts} onChange={e => setOtherDebts(e.target.value)} />
            </F>
            <F label="Local monthly rent ($)">
              <input className={inputCls()} type="number" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} />
            </F>
            <F label="Home appreciation (%/yr)">
              <input className={inputCls()} type="number" step="0.1" value={appreciation} onChange={e => setAppreciation(e.target.value)} />
            </F>
            <F label="Rent growth (%/yr)">
              <input className={inputCls()} type="number" step="0.1" value={rentGrowth} onChange={e => setRentGrowth(e.target.value)} />
            </F>
            <F label="Investment return (%/yr)" tipSide="right"
               tip="What the down payment + closing costs could earn if invested instead.">
              <input className={inputCls()} type="number" step="0.1" value={investReturn} onChange={e => setInvestReturn(e.target.value)} />
            </F>
          </div>
        </Card>

        <div className="flex justify-end">
          <ShareButton state={shareState} />
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="space-y-3">
        <MobileSummaryBar monthly={totalMonthly} />

        <VCard>
          <div className="text-xs font-semibold uppercase tracking-widest text-violet-700">Total Upfront Cash Needed</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{money(totalUpfront)}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>Down payment: <strong>{money(dp)}</strong></div>
            <div>Closing costs: <strong>{money(closingCosts)}</strong></div>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Does not include moving costs, currency conversion fees, or cash reserve requirements.
          </div>
        </VCard>

        <Card>
          <H2>Monthly Payment Breakdown</H2>
          <div className="space-y-2 text-sm">
            {[
              { label:"Principal & Interest", value: monthlyPI },
              { label:"Property Tax",         value: monthlyTax },
              { label:"Insurance",            value: monthlyIns },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-slate-600">{row.label}</span>
                <span className="font-semibold text-slate-900">{money(row.value, 2)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
              <span className="font-semibold text-slate-900">Total monthly</span>
              <span className="text-xl font-bold text-violet-700">{money(totalMonthly, 2)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <H2>Loan Summary</H2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label:"Loan amount",     value: money(loan) },
              { label:"Total interest",  value: money(totalInterest) },
              { label:"Total cost",      value: money(loan + totalInterest) },
              { label:"Effective rate",  value: fmtPct(effectiveRate) },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xs text-slate-500">{s.label}</div>
                <div className="text-lg font-bold text-slate-900">{s.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <H2>Affordability Check</H2>
          <div className="space-y-3">
            <DTIRow label="Front-end DTI" value={frontDTI} guide="≤28% guideline" />
            <DTIRow label="Back-end DTI"  value={backDTI}  guide="≤36% guideline" />
          </div>
        </Card>

        <VCard>
          <div className="text-xs font-semibold uppercase tracking-widest text-violet-700">Rent vs Buy Break-Even</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {beYears ? `${beYears} years` : "30+ years"}
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {beYears
              ? `Buying in ${country.name} becomes cheaper than renting after ~${beYears} years.`
              : `Buying in ${country.name} doesn't break even within 30 years. Renting may be more cost-effective.`}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            Accounts for full equity paydown, appreciation, maintenance ({fmtPct(nz(maintenanceRate))}/yr), and opportunity cost of {money(totalUpfront)} invested at {fmtPct(nz(investReturn))}/yr.
          </div>
          <HowThisWorks items={[
            `Upfront opportunity cost: ${money(totalUpfront)} (down payment + closing costs) modelled as an investment earning ${fmtPct(nz(investReturn))}/yr.`,
            `Equity credited monthly from both principal repayment and home appreciation (${fmtPct(nz(appreciation))}/yr).`,
            `Maintenance cost of ${fmtPct(nz(maintenanceRate))}/yr of home value is charged to the buyer each month.`,
            `Rent grows at ${fmtPct(nz(rentGrowth))}/yr. Higher rent growth means the break-even comes sooner.`,
            "No tax deduction is modelled for international buyers — tax treatment varies widely by country and residency status.",
            "All rates, costs, and country data are estimates for planning only. Get local legal and financial advice before purchasing.",
          ]} />
        </VCard>

        <ACard>
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">Can I Afford to Buy Abroad?</div>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Total upfront needed</span>
              <span className="font-semibold text-slate-900">{money(totalUpfront)}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly housing cost</span>
              <span className="font-semibold text-slate-900">{money(totalMonthly, 0)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span>vs. renting locally</span>
              <span className={`font-semibold ${totalMonthly > nz(monthlyRent) ? "text-rose-600" : "text-emerald-600"}`}>
                {totalMonthly > nz(monthlyRent) ? "+" : ""}{money(totalMonthly - nz(monthlyRent), 0)}/mo vs rent
              </span>
            </div>
            <div className="flex justify-between">
              <span>Front-end DTI</span>
              <span className={`font-semibold ${dtiColor(frontDTI)}`}>{fmtPct(frontDTI)}</span>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-white px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200">
            💡 Many expats rent for 1–2 years after relocating before buying — this lets you understand the local market, build banking relationships, and avoid rushed decisions.
          </div>
        </ACard>

        <Card>
          <H2>Principal vs Interest Over Time</H2>
          <AmortizationChart rows={amortRows} />
        </Card>

        <Card>
          <H2>Amortization Schedule</H2>
          <AmortizationTable rows={amortRows} />
        </Card>
      </div>
    </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════

export default function MortgageCalculator() {
  const [activeTab, setActiveTab] = useState("us");

  // Read tab from URL hash on mount
  useEffect(() => {
    const s = readHashState();
    if (s?.tab && ["us", "international", "refinance"].includes(s.tab)) {
      setActiveTab(s.tab);
    }
  }, []);

  const tabs = [
    { id:"us",            label:"US Mortgage",    sub:"US home purchase planning" },
    { id:"international", label:"Buying Abroad",   sub:"Post-relocation buying" },
    { id:"refinance",     label:"Refinance",       sub:"Should I refi?" },
  ];

  return (
    <div className="text-slate-900">
      {/* Tab switcher */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70 flex-wrap gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                activeTab === tab.id ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500">
          {tabs.find(t => t.id === activeTab)?.sub}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "us"            && <USTab />}
        {activeTab === "international" && <InternationalTab />}
        {activeTab === "refinance"     && <RefinanceTab />}
      </div>
    </div>
  );
}
