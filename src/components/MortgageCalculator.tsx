"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  solveMaxHomePrice,
  calcPMIDropOffWithAppreciation,
  US_STATE_DEFAULTS,
} from "../lib/housing";

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

// ─── FIX 1: Per-country foreign buyer rules ───────────────────────────────
// These override the default rate/downMin when residencyStatus === "non-resident"
type ForeignBuyerRule = {
  mortgageAvailable: boolean;
  nonResidentRate?: number;
  nonResidentDownMin?: number;
  warning?: string;
};

const FOREIGN_BUYER_RULES: Record<string, ForeignBuyerRule> = {
  JP: {
    mortgageAvailable: false,
    warning: "Japanese banks require legal residency (e.g. work or spouse visa) to issue mortgages. Non-residents must pay cash or arrange foreign bank financing.",
  },
  TH: {
    mortgageAvailable: false,
    warning: "Thai bank mortgages are not available to foreigners. Developer financing or cash purchase is required.",
  },
  VN: {
    mortgageAvailable: false,
    warning: "Foreign buyers cannot obtain local mortgages in Vietnam. Ownership is via 50-year renewable leases only.",
  },
  ID: {
    mortgageAvailable: false,
    warning: "Local mortgages are not available to foreigners in Indonesia. Leasehold purchases require cash.",
  },
  NZ: {
    mortgageAvailable: false,
    warning: "Most overseas buyers are banned from purchasing existing homes since 2018. Non-residents can only buy newly built homes.",
  },
  AR: {
    mortgageAvailable: false,
    warning: "Argentina's mortgage market is highly unstable. Most transactions are done in USD cash. Extreme FX and legal risk.",
  },
  CO: {
    mortgageAvailable: false,
    warning: "Local rates are very high (~12%). Most foreign buyers use home-country financing or pay cash.",
  },
  BR: {
    mortgageAvailable: false,
    warning: "Brazil's local mortgage rates are high (~10.5%). Most foreign buyers use savings or foreign financing.",
  },
  SG: {
    mortgageAvailable: true,
    nonResidentRate: 4.0,
    nonResidentDownMin: 25,
    warning: "Additional Buyer's Stamp Duty (ABSD) of 60% applies to all foreign buyers — a major upfront cost on top of the purchase price.",
  },
  AU: {
    mortgageAvailable: true,
    nonResidentRate: 6.8,
    nonResidentDownMin: 30,
    warning: "FIRB approval is required. Foreign buyers are generally limited to new builds. Stamp duty surcharges of 7–8% apply in most states.",
  },
  MX: {
    mortgageAvailable: true,
    nonResidentRate: 11.0,
    nonResidentDownMin: 40,
    warning: "Foreigners must purchase via a fideicomiso (bank trust) in restricted coastal/border zones. Rates for non-residents skew higher.",
  },
  MY: {
    mortgageAvailable: true,
    nonResidentRate: 5.0,
    nonResidentDownMin: 40,
    warning: "Minimum purchase price for foreigners is RM 1M+ in most states. MM2H visa holders may access better terms.",
  },
  AE: {
    mortgageAvailable: true,
    nonResidentRate: 5.5,
    nonResidentDownMin: 25,
    warning: "Non-resident mortgages are available in Dubai's freehold zones but at higher rates than residents receive.",
  },
};

// ─── FIX 3: FX volatility risk tiers ─────────────────────────────────────
const HIGH_FX_RISK   = new Set(["AR", "TR", "VN", "ID", "BR"]);
const MEDIUM_FX_RISK = new Set(["MX", "CO", "CR", "CL", "MY"]);

const TERMS = [10, 15, 20, 25, 30];

const US_STATES_LIST = Object.entries(US_STATE_DEFAULTS)
  .sort((a, b) => a[1].name.localeCompare(b[1].name))
  .map(([code, d]) => ({ code, name: d.name }));

// ═══════════════════════════════════════════════════════════════════════
// VERDICT LOGIC
// ═══════════════════════════════════════════════════════════════════════

type VerdictType = "buy" | "wait" | "longterm" | "rent";

type BreakEvenResult =
  | { type: "ok"; months: number }
  | { type: "never" }
  | { type: "invalid" };

type VerdictResult = {
  type:        VerdictType;
  title:       string;
  description: string;
  reasons:     string[];
  border:      string;
  bg:          string;
  tag:         string;
  labelColor:  string;
  barColor:    string;
  barWidth:    string;
};

function getBuyWaitRentVerdict({
  frontDTI, backDTI, cashAfterClose, emergencyFundTarget,
  breakEvenYears, totalMonthly, monthlyRent, downPct, salaryReady,
}: {
  frontDTI: number; backDTI: number; cashAfterClose: number;
  emergencyFundTarget: number; breakEvenYears: number | null;
  totalMonthly: number; monthlyRent: number; downPct: number;
  salaryReady: boolean;
}): VerdictResult {
  if (!salaryReady || !totalMonthly) {
    return {
      type: "buy", title: "Enter your details",
      description: "Fill in income, home price, and costs to see your personalized verdict.",
      reasons: [],
      border: "border-slate-200 dark:border-slate-800", bg: "bg-slate-50/80 dark:bg-slate-950/80",
      tag: "text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-800", labelColor: "text-slate-600 dark:text-slate-400",
      barColor: "bg-slate-300 dark:bg-slate-800", barWidth: "w-0",
    };
  }

  const housingPremium = monthlyRent > 0
    ? ((totalMonthly - monthlyRent) / monthlyRent) * 100
    : 0;

  if (
    backDTI > 50 ||
    (breakEvenYears !== null && breakEvenYears > 10 && housingPremium > 40) ||
    (breakEvenYears === null && housingPremium > 40)
  ) {
    return {
      type: "rent",
      title: "Rent is financially stronger",
      description: "At this price and income level, renting outperforms buying. Consider a lower price point or building more savings first.",
      reasons: [
        backDTI > 50 ? `Back-end DTI of ${backDTI.toFixed(0)}% is well above safe limits` : "",
        (breakEvenYears === null || breakEvenYears > 10) ? `Break-even is ${breakEvenYears ? breakEvenYears.toFixed(1) + " years" : "30+ years"} — too long to justify the upfront cost` : "",
        housingPremium > 40 ? `Buying costs ${housingPremium.toFixed(0)}% more per month than renting` : "",
      ].filter(Boolean),
      border: "border-rose-200 dark:border-rose-800", bg: "bg-rose-50/80 dark:bg-rose-950/30",
      tag: "text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-800", labelColor: "text-rose-700 dark:text-rose-300",
      barColor: "bg-rose-400 dark:bg-rose-700", barWidth: "w-[20%]",
    };
  }

  const cashDanger = cashAfterClose < 0;
  const cashTight  = cashAfterClose < emergencyFundTarget && downPct < 10;
  const dtiStretched = frontDTI > 36;

  if (cashDanger || cashTight || dtiStretched) {
    return {
      type: "wait",
      title: "Wait 12–18 months",
      description: "You're close, but improving your cash position or income first would meaningfully lower your risk.",
      reasons: [
        cashDanger ? "You'd be cash-negative after closing — can't cover emergencies" : "",
        cashTight  ? `Cash after close (${downPct.toFixed(0)}% down) falls below your emergency fund target` : "",
        dtiStretched ? `Front-end DTI of ${frontDTI.toFixed(0)}% is above the 36% caution zone` : "",
      ].filter(Boolean),
      border: "border-amber-200 dark:border-amber-800", bg: "bg-amber-50/80 dark:bg-amber-950/30",
      tag: "text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-800", labelColor: "text-amber-700 dark:text-amber-300",
      barColor: "bg-amber-400 dark:bg-amber-700", barWidth: "w-[40%]",
    };
  }

  const longBreakEven = breakEvenYears !== null && breakEvenYears > 7;
  const elevatedDTI   = frontDTI > 28;

  if (longBreakEven || (elevatedDTI && breakEvenYears !== null && breakEvenYears > 5)) {
    return {
      type: "longterm",
      title: "Buy only if staying 7+ years",
      description: `Break-even is around ${breakEvenYears?.toFixed(1)} years. This purchase makes strong financial sense only with a long-term commitment.`,
      reasons: [
        longBreakEven ? `Break-even at ${breakEvenYears?.toFixed(1)} years requires staying put` : "",
        elevatedDTI   ? `Front-end DTI of ${frontDTI.toFixed(0)}% is above the 28% guideline` : "",
        housingPremium > 20 ? `Monthly cost is ${housingPremium.toFixed(0)}% more than renting` : "",
      ].filter(Boolean),
      border: "border-sky-200 dark:border-sky-800", bg: "bg-sky-50/80 dark:bg-sky-950/30",
      tag: "text-sky-700 dark:text-sky-300 ring-sky-200 dark:ring-sky-800", labelColor: "text-sky-700 dark:text-sky-300",
      barColor: "bg-sky-400 dark:bg-sky-700", barWidth: "w-[60%]",
    };
  }

  return {
    type: "buy",
    title: "Buy looks reasonable",
    description: "Your income, cash position, and break-even timeline all support this purchase at current assumptions.",
    reasons: [
      frontDTI <= 28 ? `Front-end DTI of ${frontDTI.toFixed(0)}% is within the 28% guideline` : "",
      cashAfterClose >= emergencyFundTarget ? "Cash after closing covers your emergency fund target" : "",
      breakEvenYears ? `Break-even in ${breakEvenYears.toFixed(1)} years is manageable` : "",
    ].filter(Boolean),
    border: "border-emerald-200 dark:border-emerald-800", bg: "bg-emerald-50/80 dark:bg-emerald-950/30",
    tag: "text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800", labelColor: "text-emerald-700 dark:text-emerald-300",
    barColor: "bg-emerald-500 dark:bg-emerald-600", barWidth: "w-[90%]",
  };
}

// ═══════════════════════════════════════════════════════════════════════
// STRESS TEST CONFIG
// ═══════════════════════════════════════════════════════════════════════

type StressLevel = "none" | "low" | "moderate" | "severe";

const STRESS_CONFIG: Record<StressLevel, {
  label: string; rateDelta: number; insuranceMult: number;
  taxMult: number; incomeMult: number; description: string;
}> = {
  none:     { label: "None",     rateDelta: 0,   insuranceMult: 1.00, taxMult: 1.00, incomeMult: 1.00, description: "Current assumptions" },
  low:      { label: "Low",      rateDelta: 0.5, insuranceMult: 1.10, taxMult: 1.10, incomeMult: 1.00, description: "Rate +0.5%, insurance +10%, tax +10%" },
  moderate: { label: "Moderate", rateDelta: 1.0, insuranceMult: 1.20, taxMult: 1.15, incomeMult: 0.90, description: "Rate +1%, insurance +20%, tax +15%, income −10%" },
  severe:   { label: "Severe",   rateDelta: 2.0, insuranceMult: 1.35, taxMult: 1.20, incomeMult: 0.80, description: "Rate +2%, insurance +35%, tax +20%, income −20%" },
};

// ═══════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════

const nz = (v: string | number) => Math.max(0, parseFloat(String(v)) || 0);

const money = (v: number, d = 0) => (
  Number.isFinite(v) && !isNaN(v)
    ? v.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: d, minimumFractionDigits: d })
    : "—"
);

const fmtPct = (v: number, d = 1) => (Number.isFinite(v) ? `${v.toFixed(d)}%` : "—");

// ═══════════════════════════════════════════════════════════════════════
// MORTGAGE MATH
// ═══════════════════════════════════════════════════════════════════════

function calcMonthlyPI(principal: number, annualRate: number, termYears: number) {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return 0;
  const r = annualRate / 100 / 12;
  const N = termYears * 12;
  return (principal * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
}

function calcTotalInterest(principal: number, annualRate: number, termYears: number) {
  return calcMonthlyPI(principal, annualRate, termYears) * termYears * 12 - principal;
}

function calcAutoPMI(loan: number, homePrice: number, downPct: number) {
  if (downPct >= 20 || !loan || !homePrice) return 0;
  const ltv  = loan / homePrice;
  const rate = ltv > 0.95 ? 0.015 : ltv > 0.90 ? 0.012 : ltv > 0.85 ? 0.009 : 0.007;
  return (loan * rate) / 12;
}

// ─── FIX 2: Algebraic PMI drop-off — O(1) instead of O(360) loop ─────────
// Uses the closed-form loan balance formula:
//   B(m) = L·(1+r)^m − PMT·((1+r)^m − 1)/r
// Solving B(m) = 0.8·homePrice algebraically:
//   m = log((target − PMT/r) / (L − PMT/r)) / log(1+r)
function calcPMIDropOff(loan: number, homePrice: number, annualRate: number, monthlyPayment: number): number | null {
  if (!loan || !homePrice || !annualRate || !monthlyPayment) return null;
  const target = homePrice * 0.80;
  if (loan <= target) return 0; // already below 80% LTV

  const r = annualRate / 100 / 12;

  // If interest rate is zero, fall back to simple linear paydown
  if (r === 0) {
    const months = Math.ceil((loan - target) / monthlyPayment);
    return months > 0 && months <= 360 ? months : null;
  }

  // Guard: payment must exceed monthly interest (otherwise negative amortization)
  if (monthlyPayment <= loan * r) return null;

  const pmtOverR   = monthlyPayment / r;
  const numerator  = target - pmtOverR;
  const denominator = loan  - pmtOverR;

  // denominator should always be negative for a valid amortizing loan
  if (denominator >= 0) return null;

  const m = Math.log(numerator / denominator) / Math.log(1 + r);
  if (!Number.isFinite(m) || m < 0) return null;
  const rounded = Math.ceil(m);
  return rounded <= 360 ? rounded : null;
}

function buildSchedule(principal: number, annualRate: number, termYears: number, extraMonthly = 0) {
  if (principal <= 0 || annualRate <= 0 || termYears <= 0) return [];
  const r    = annualRate / 100 / 12;
  const base = calcMonthlyPI(principal, annualRate, termYears);
  const pmt  = base + extraMonthly;
  let bal    = principal;
  const rows: { month:number; payment:number; principal:number; interest:number; balance:number }[] = [];
  for (let m = 1; m <= termYears * 12; m++) {
    const int  = bal * r;
    const prin = Math.min(pmt - int, bal);
    if (prin < 0) break;
    bal = Math.max(0, bal - prin);
    rows.push({ month: m, payment: prin + int, principal: prin, interest: int, balance: bal });
    if (bal <= 0) break;
  }
  return rows;
}

function calcBiweeklySavings(principal: number, annualRate: number, termYears: number) {
  if (!principal || !annualRate || !termYears) return null;
  const base  = calcMonthlyPI(principal, annualRate, termYears);
  const extra = base / 12;
  const rows  = buildSchedule(principal, annualRate, termYears, extra);
  const stdInterest = calcTotalInterest(principal, annualRate, termYears);
  const bwInterest  = rows.reduce((s, row) => s + row.interest, 0);
  return {
    interestSaved: stdInterest - bwInterest,
    monthsSaved:   termYears * 12 - rows.length,
  };
}

function calcBreakEven({
  downPayment,
  closingCosts = 0,
  annualRate,
  monthlyPI,
  rent,
  tax,
  ins,
  hoa,
  homePrice,
  appreciation,
  rentGrowth,
  investReturn,
  maintenanceRate,
  taxDeductRate,
}: {
  downPayment: number;
  closingCosts?: number;
  annualRate: number;
  monthlyPI: number;
  rent: number;
  tax: number;
  ins: number;
  hoa: number;
  homePrice: number;
  appreciation: number;
  rentGrowth: number;
  investReturn: number;
  maintenanceRate: number;
  taxDeductRate: number;
}): BreakEvenResult {
  if (
    homePrice <= 0 ||
    rent <= 0 ||
    monthlyPI <= 0 ||
    downPayment < 0 ||
    annualRate <= 0
  ) {
    return { type: "invalid" };
  }

  const upfrontCash = downPayment + closingCosts;
  const monthlyRate = annualRate / 100 / 12;

  let buyCashFlowCost = upfrontCash;
  let rentCashFlowCost = 0;

  let homeValue = homePrice;
  let loanBalance = homePrice - downPayment;
  let monthlyRent = rent;

  let renterInvestedCash = upfrontCash;

  for (let m = 1; m <= 360; m++) {
    const interest = loanBalance * monthlyRate;
    const principal = Math.max(0, monthlyPI - interest);
    const taxSavings = interest * (taxDeductRate / 100);
    const maintenance = (homeValue * (maintenanceRate / 100)) / 12;

    buyCashFlowCost += monthlyPI + tax + ins + hoa + maintenance - taxSavings;
    rentCashFlowCost += monthlyRent;

    renterInvestedCash *= 1 + investReturn / 100 / 12;
    homeValue *= 1 + appreciation / 100 / 12;
    monthlyRent *= 1 + rentGrowth / 100 / 12;
    loanBalance = Math.max(0, loanBalance - principal);

    const homeownerNetWorth = homeValue - loanBalance;
    const renterNetWorth = renterInvestedCash;

    const buyNetCost = buyCashFlowCost - homeownerNetWorth;
    const rentNetCost = rentCashFlowCost - renterNetWorth;

    if (buyNetCost <= rentNetCost) {
      return { type: "ok", months: m };
    }
  }

  return { type: "never" };
}

function calcRefi(
  curBalance: number, curRate: number, curMonthsLeft: number,
  newRate: number, newTermYears: number, closingCosts: number
) {
  const curMonthly = calcMonthlyPI(curBalance, curRate, curMonthsLeft / 12);
  const newMonthly = calcMonthlyPI(curBalance, newRate, newTermYears);
  const savings    = curMonthly - newMonthly;
  const curRemaining = curMonthly * curMonthsLeft;
  const newTotal     = newMonthly * newTermYears * 12 + closingCosts;
  return {
    curMonthly,
    newMonthly,
    monthlySavings:  savings,
    totalSavings:    curRemaining - newTotal,
    breakEvenMonths: savings > 0 ? Math.ceil(closingCosts / savings) : null,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// URL STATE
// ═══════════════════════════════════════════════════════════════════════

function encodeState(obj: object) {
  try { return btoa(encodeURIComponent(JSON.stringify(obj))); } catch { return ""; }
}
function decodeState(str: string) {
  try { return JSON.parse(decodeURIComponent(atob(str))); } catch { return null; }
}
function readHashState() {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/[?&]?state=([^&]+)/);
  return m ? decodeState(m[1]) : null;
}
function writeHashState(state: object) {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#state=${encodeState(state)}`);
}

// ═══════════════════════════════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════

const lbl = "mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400";

function inputCls(err = "") {
  return `h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-inner outline-none ring-1 transition focus:bg-white focus:dark:bg-slate-900 focus:ring-4 ${
    err ? "ring-rose-400 dark:ring-rose-600 focus:ring-rose-300/40 focus:dark:ring-rose-700/40" : "ring-slate-200 dark:ring-slate-800 focus:ring-violet-500/20 focus:dark:ring-violet-500/20"
  }`;
}
const selectCls = "h-11 w-full cursor-pointer rounded-xl bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-inner ring-1 ring-slate-200 dark:ring-slate-800 outline-none transition focus:bg-white focus:dark:bg-slate-900 focus:ring-4 focus:ring-violet-500/20 focus:dark:ring-violet-500/20";

function Tip({ text, side = "left" }: { text: string; side?: string }) {
  const pos = side === "right" ? "right-0" : side === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <span className="group relative ml-1.5 inline-flex align-middle">
      <button type="button" aria-label={text}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[9px] font-bold text-slate-600 dark:text-slate-400 shadow-sm transition hover:bg-slate-50 hover:dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:dark:ring-violet-600">i</button>
      <span role="tooltip"
        className={`pointer-events-none absolute top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl bg-slate-900 px-3 py-2.5 text-xs leading-relaxed text-slate-100 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${pos}`}>
        {text}
      </span>
    </span>
  );
}

function F({ label, tip = "", tipSide = "left", err = "", span2 = false, children }: {
  label:string; tip?:string; tipSide?:string; err?:string; span2?:boolean; children:React.ReactNode;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <span className={lbl}>{label}{tip && <Tip text={tip} side={tipSide} />}</span>
      {children}
      {err && <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{err}</p>}
    </div>
  );
}

function RO({ value }: { value: string }) {
  return (
    <div className="flex h-11 items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
      {value}
    </div>
  );
}

function Slider({ val, set, min, max, step = 0.5 }: {
  val: string|number; set: (v:string)=>void; min:number; max:number; step?:number;
}) {
  return (
    <input type="range" min={min} max={max} step={step} value={val}
      onChange={e => set(e.target.value)}
      className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-800 accent-violet-600" />
  );
}

function Card({ children, className = "" }: { children:React.ReactNode; className?:string }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900 p-5 ring-1 ring-slate-200/60 dark:ring-slate-800/60 shadow-[0_6px_20px_rgba(15,23,42,0.07)] ${className}`}>
      {children}
    </div>
  );
}
function VCard({ children, className = "" }: { children:React.ReactNode; className?:string }) {
  return (
    <div className={`rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/30 p-5 shadow-[0_6px_20px_rgba(109,40,217,0.07)] ${className}`}>
      {children}
    </div>
  );
}
function ACard({ children, className = "" }: { children:React.ReactNode; className?:string }) {
  return (
    <div className={`rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-4 ${className}`}>
      {children}
    </div>
  );
}
function H2({ children, action = null }: { children:React.ReactNode; action?:React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{children}</span>
      {action && <span>{action}</span>}
    </div>
  );
}

function dtiColor(v: number) { return v <= 28 ? "text-emerald-600 dark:text-emerald-400" : v <= 36 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"; }
function dtiBar(v: number)   { return v <= 28 ? "bg-emerald-500 dark:bg-emerald-600"   : v <= 36 ? "bg-amber-400 dark:bg-amber-700"   : "bg-rose-500 dark:bg-rose-600"; }
function dtiLabel(v: number) { return v <= 28 ? "Within guideline" : v <= 36 ? "Elevated"        : "Above guideline"; }

function DTIRow({ label, value, guide, tip = "" }: { label:string; value:number; guide:string; tip?:string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}{tip && <Tip text={tip} side="right" />}</span>
        <span className={`font-bold ${dtiColor(value)}`}>{fmtPct(value)} — {dtiLabel(value)}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900/40">
        <div className={`h-full rounded-full transition-all ${dtiBar(value)}`}
          style={{ width: `${Math.min((value / 50) * 100, 100)}%` }} />
      </div>
      <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{guide}</div>
    </div>
  );
}

function AffordabilityVerdict({ frontDTI, backDTI }: { frontDTI:number; backDTI:number }) {
  const pass    = frontDTI <= 28 && backDTI <= 36;
  const caution = !pass && frontDTI <= 36 && backDTI <= 43;
  const verdict = pass ? "PASS" : caution ? "CAUTION" : "STRETCH";
  const cls     = pass
    ? "border-emerald-600/50 dark:border-emerald-500/50 bg-emerald-900/40 dark:bg-emerald-950/40 text-emerald-400 dark:text-emerald-500"
    : caution
    ? "border-amber-600/50 dark:border-amber-500/50 bg-amber-900/40 dark:bg-amber-950/40 text-amber-400 dark:text-amber-500"
    : "border-rose-600/50 dark:border-rose-500/50 bg-rose-900/40 dark:bg-rose-950/40 text-rose-400 dark:text-rose-500";
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

function HowThisWorks({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-violet-200 dark:border-violet-800 pt-3">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:text-violet-900 hover:dark:text-violet-100 focus:outline-none">
        <span className="text-[10px]">{open ? "▾" : "▸"}</span> How this is calculated
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 rounded-xl bg-white/70 dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400 ring-1 ring-violet-200 dark:ring-violet-800">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="flex-shrink-0 text-slate-400 dark:text-slate-500">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SHARE / RESET
// ═══════════════════════════════════════════════════════════════════════

function ShareButton({ state }: { state: object }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(() => {
    try {
      const url = `${window.location.href.split("#")[0]}#state=${encodeState(state)}`;
      navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    } catch { /* noop */ }
  }, [state]);
  return (
    <button type="button" onClick={handle}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition hover:bg-slate-50 hover:dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:dark:ring-violet-600">
      {copied ? "✓ Copied!" : "🔗 Share link"}
    </button>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button type="button" onClick={onReset}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm transition hover:border-rose-200 hover:dark:border-rose-800 hover:bg-rose-50 hover:dark:bg-rose-950/30 hover:text-rose-600 hover:dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:dark:ring-rose-700">
      ↺ Reset
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// AMORTIZATION CHART
// ═══════════════════════════════════════════════════════════════════════

function AmortizationChart({ rows }: { rows: ReturnType<typeof buildSchedule> }) {
  if (!rows.length) return null;
  const totalYears = Math.ceil(rows[rows.length - 1].month / 12);
  const data = [];
  for (let y = 1; y <= totalYears; y++) {
    const slice = rows.slice((y - 1) * 12, y * 12);
    data.push({
      year:      `Y${y}`,
      Principal: Math.round(slice.reduce((s, r) => s + r.principal, 0)),
      Interest:  Math.round(slice.reduce((s, r) => s + r.interest, 0)),
      Balance:   Math.round(slice[slice.length - 1]?.balance ?? 0),
    });
  }
  const fmt = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;
  return (
    <div style={{ height: 230 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} interval="preserveStartEnd" />
          <YAxis yAxisId="l" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} tickFormatter={fmt} width={46} />
          <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} tickFormatter={fmt} width={46} />
          <Tooltip formatter={(v: number, name: string) => [money(v), name]}
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

function AmortizationTable({ rows }: { rows: ReturnType<typeof buildSchedule> }) {
  const [expanded, setExpanded] = useState(false);
  if (!rows.length) return null;
  const totalYears = Math.ceil(rows[rows.length - 1].month / 12);
  const years = [];
  for (let y = 1; y <= totalYears; y++) {
    const slice = rows.slice((y - 1) * 12, y * 12);
    years.push({
      year:      y,
      interest:  slice.reduce((s, r) => s + r.interest, 0),
      principal: slice.reduce((s, r) => s + r.principal, 0),
      balance:   slice[slice.length - 1]?.balance ?? 0,
    });
  }
  const display = expanded ? years : years.slice(0, 5);
  return (
    <div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200 dark:ring-slate-800">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="px-4 py-2 text-left">Year</th>
              <th className="px-4 py-2 text-right">Principal</th>
              <th className="px-4 py-2 text-right">Interest</th>
              <th className="px-4 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {display.map((y, i) => (
              <tr key={y.year} className={`border-b border-slate-100 dark:border-slate-900/60 ${i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-950/50"}`}>
                <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">Year {y.year}</td>
                <td className="px-4 py-2 text-right text-slate-900 dark:text-slate-100">{money(y.principal)}</td>
                <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-400">{money(y.interest)}</td>
                <td className="px-4 py-2 text-right font-semibold text-slate-900 dark:text-slate-100">{money(y.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {years.length > 5 && (
        <button type="button" onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:underline focus:outline-none focus:underline">
          {expanded ? "Show less ↑" : `Show all ${years.length} years ↓`}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STICKY MOBILE SUMMARY
// ═══════════════════════════════════════════════════════════════════════

function MobileSummaryBar({ monthly }: { monthly: number }) {
  return (
    <div className="sticky top-0 z-40 -mx-4 mb-4 flex items-center justify-between bg-white/95 dark:bg-slate-900 px-4 py-3 backdrop-blur-sm shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 lg:hidden">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Est. monthly payment</span>
      <span className="text-lg font-bold text-violet-700 dark:text-violet-300">{money(monthly, 2)}/mo</span>
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
              <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{(nz(curMonthsLeft) / 12).toFixed(1)} years remaining</div>
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
              <div className="text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-300">Break-Even Point</div>
              <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {result.breakEvenMonths
                  ? `${result.breakEvenMonths} months`
                  : result.monthlySavings <= 0 ? "Never — higher payment" : "Immediate"}
              </div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
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
                <div className="flex justify-between text-sm border-t border-slate-100 dark:border-slate-900/60 pt-3">
                  <span className="text-slate-600 dark:text-slate-400">Current monthly payment</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{money(result.curMonthly, 2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">New monthly payment</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{money(result.newMonthly, 2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-100 dark:border-slate-900/60 pt-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Monthly savings</span>
                  <span className={`text-lg font-bold ${result.monthlySavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {result.monthlySavings >= 0 ? "+" : ""}{money(result.monthlySavings, 2)}/mo
                  </span>
                </div>
              </div>
            </Card>
            <Card>
              <H2>Total Cost Comparison</H2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Closing costs</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{money(nz(closingCosts))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total remaining on current loan</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{money(result.curMonthly * nz(curMonthsLeft))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total cost of new loan + closing</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{money(result.newMonthly * newTerm * 12 + nz(closingCosts))}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-900/60 pt-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Net savings over life of loan</span>
                  <span className={`text-lg font-bold ${result.totalSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {result.totalSavings >= 0 ? "+" : ""}{money(result.totalSavings)}
                  </span>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-800">
                Net savings accounts for the longer term if extending. A 30-yr refi on 25 years remaining reduces monthly payments but may increase total interest — consider a shorter term if net savings matter more than monthly relief.
              </div>
            </Card>
          </>
        ) : (
          <Card className="flex min-h-40 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
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
  const [propertyState,   setPropertyState]   = useState("");
  const [homePrice,       setHomePrice]        = useState("500000");
  const [downPct,         setDownPct]          = useState("20");
  const [rate,            setRate]             = useState("6.75");
  const [term,            setTerm]             = useState(30);
  const [closingCostPct,  setClosingCostPct]   = useState("2.5");
  const [propertyTaxRate, setPropertyTaxRate]  = useState("1.1");
  const [insurance,       setInsurance]        = useState("150");
  const [hoa,             setHoa]              = useState("0");
  const [maintenanceRate, setMaintenanceRate]  = useState("1.0");
  const [extraMonthly,    setExtraMonthly]     = useState("0");
  const [biweekly,        setBiweekly]         = useState(false);
  const [grossIncome,     setGrossIncome]      = useState("120000");
  const [otherDebts,      setOtherDebts]       = useState("500");
  const [monthlyRent,     setMonthlyRent]      = useState("2500");
  const [appreciation,    setAppreciation]     = useState("3.5");
  const [rentGrowth,      setRentGrowth]       = useState("3.0");
  const [investReturn,    setInvestReturn]     = useState("7.0");
  const [taxDeductRate,   setTaxDeductRate]    = useState("22");
  const [currentSavings,      setCurrentSavings]      = useState("80000");
  const [emergencyFundMonths, setEmergencyFundMonths]  = useState("6");
  const [movingBudget,        setMovingBudget]         = useState("5000");
  const [stressLevel,      setStressLevel]      = useState<StressLevel>("none");
  const [appreciationPMI,  setAppreciationPMI]  = useState(false);
  const [scenarioNames, setScenarioNames] = useState([
    "Buy Now",
    "Rent 2 Yrs, Buy",
    "Cheaper Home",
    "Higher Down",
  ]);

  useEffect(() => {
    if (!propertyState) return;
    const defaults = US_STATE_DEFAULTS[propertyState];
    if (!defaults) return;
    setPropertyTaxRate(String(defaults.propertyTax));
    setInsurance(String(defaults.insuranceMonthly));
    setClosingCostPct(String(defaults.closingCostPct));
  }, [propertyState]);

  const hp   = nz(homePrice);
  const dpPc = nz(downPct);
  const dp   = hp * (dpPc / 100);
  const loan = hp - dp;
  const r    = nz(rate);

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

  const pmiDropMonth = useMemo(
    () => calcPMIDropOff(loan, hp, r, monthlyPI),
    [loan, hp, r, monthlyPI]
  );
  const pmiDropMonthAppreciated = useMemo(
    () => appreciationPMI ? calcPMIDropOffWithAppreciation(loan, hp, r, monthlyPI, nz(appreciation)) : null,
    [appreciationPMI, loan, hp, r, monthlyPI, appreciation]
  );
  const activePMIDropMonth = appreciationPMI ? pmiDropMonthAppreciated : pmiDropMonth;

  const amortRows = useMemo(
    () => buildSchedule(loan, r, term, nz(extraMonthly)),
    [loan, rate, term, extraMonthly]
  );

  const extraInterest    = nz(extraMonthly) > 0 ? totalInterest - amortRows.reduce((s, row) => s + row.interest, 0) : 0;
  const extraMonthsSaved = nz(extraMonthly) > 0 ? term * 12 - amortRows.length : 0;

  const bwSavings = useMemo(
    () => biweekly ? calcBiweeklySavings(loan, r, term) : null,
    [biweekly, loan, rate, term]
  );

  const grossMonthly = nz(grossIncome) / 12;
  const frontDTI = grossMonthly > 0 ? (totalMonthly / grossMonthly) * 100 : 0;
  const backDTI  = grossMonthly > 0 ? ((totalMonthly + nz(otherDebts)) / grossMonthly) * 100 : 0;

  const estimatedClosing = loan * (nz(closingCostPct) / 100);
  const lenderCashToClose = dp + estimatedClosing;
  const recommendedReserve = totalMonthly * 3;
  const totalCashNeeded = lenderCashToClose + recommendedReserve + nz(movingBudget);

  const cashAfterClose = nz(currentSavings) - lenderCashToClose - nz(movingBudget);
  const emergencyFundTarget = totalMonthly * nz(emergencyFundMonths);
  const cashStatus: "healthy" | "tight" | "danger" =
    cashAfterClose >= emergencyFundTarget ? "healthy"
    : cashAfterClose >= 0                 ? "tight"
    : "danger";

  const breakEvenMonth = useMemo(() => calcBreakEven({
    downPayment: dp, closingCosts: estimatedClosing,
    annualRate: r, monthlyPI,
    rent: nz(monthlyRent), tax: monthlyTax, ins: monthlyIns, hoa: monthlyHOA, homePrice: hp,
    appreciation: nz(appreciation), rentGrowth: nz(rentGrowth), investReturn: nz(investReturn),
    maintenanceRate: nz(maintenanceRate), taxDeductRate: nz(taxDeductRate),
  }), [dp, estimatedClosing, r, monthlyPI, monthlyRent, monthlyTax, monthlyIns, monthlyHOA, hp, appreciation, rentGrowth, investReturn, maintenanceRate, taxDeductRate]);

  const beYears =
  breakEvenMonth.type === "ok"
    ? parseFloat((breakEvenMonth.months / 12).toFixed(1))
    : null;

  const firstYearCost = useMemo(() => {
    const maintenanceAnnual = hp * (nz(maintenanceRate) / 100);
    return totalMonthly * 12 + maintenanceAnnual;
  }, [totalMonthly, hp, maintenanceRate]);

  const [fiveYearOwnCost, fiveYearRentCost] = useMemo(() => {
    let ownCost = 0, rentCost = 0;
    let rent = nz(monthlyRent);
    for (let m = 0; m < 60; m++) {
      ownCost  += totalMonthly + (hp * nz(maintenanceRate) / 100) / 12;
      rentCost += rent;
      rent     *= 1 + nz(rentGrowth) / 100 / 12;
    }
    return [ownCost, rentCost];
  }, [totalMonthly, hp, maintenanceRate, monthlyRent, rentGrowth]);

  const fiveYearBalance  = amortRows[59]?.balance ?? loan;
  const fiveYearHomeVal  = hp * Math.pow(1 + nz(appreciation) / 100, 5);
  const fiveYearEquity   = fiveYearHomeVal - fiveYearBalance;
  const fiveYearNetOwn   = fiveYearOwnCost - fiveYearEquity;

  const stressCfg        = STRESS_CONFIG[stressLevel];
  const stressedRate     = r + stressCfg.rateDelta;
  const stressedPI       = calcMonthlyPI(loan, stressedRate, term);
  const stressedIns      = monthlyIns * stressCfg.insuranceMult;
  const stressedTax      = monthlyTax * stressCfg.taxMult;
  const stressedTotal    = stressedPI + stressedTax + stressedIns + monthlyHOA + monthlyPMI;
  const stressedIncome   = grossMonthly * stressCfg.incomeMult;
  const stressedFrontDTI = stressedIncome > 0 ? (stressedTotal / stressedIncome) * 100 : 0;
  const stressedBackDTI  = stressedIncome > 0 ? ((stressedTotal + nz(otherDebts)) / stressedIncome) * 100 : 0;
  const stressVerdict =
    stressedFrontDTI <= 28 ? "Handles stress well"
    : stressedFrontDTI <= 36 ? "Manageable under this scenario"
    : stressedFrontDTI <= 43 ? "Fragile — consider a lower price"
    : "High risk — budget unlikely to survive this scenario";
  const stressVerdictColor =
    stressedFrontDTI <= 28 ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
    : stressedFrontDTI <= 36 ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30"
    : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30";

  const verdict = useMemo(() => getBuyWaitRentVerdict({
    frontDTI, backDTI, cashAfterClose, emergencyFundTarget,
    breakEvenYears: beYears, totalMonthly,
    monthlyRent: nz(monthlyRent), downPct: dpPc,
    salaryReady: grossMonthly > 0 && hp > 0,
  }), [frontDTI, backDTI, cashAfterClose, emergencyFundTarget, beYears, totalMonthly, monthlyRent, dpPc, grossMonthly, hp]);

  const maxHomePriceSolved = useMemo(() => solveMaxHomePrice({
    grossMonthly,
    downPct:          dpPc,
    annualRate:       r,
    termYears:        term,
    propertyTaxRate:  nz(propertyTaxRate),
    insuranceMonthly: monthlyIns,
    hoaMonthly:       monthlyHOA,
    targetDTI:        28,
    baseHomePrice:    hp || 400_000,
  }), [grossMonthly, dpPc, r, term, propertyTaxRate, monthlyIns, monthlyHOA, hp]);

  const recommendedIncome = totalMonthly > 0 ? (totalMonthly / 0.28) * 12 : 0;

  const sensitivityRows = useMemo(() => {
    return [-1, -0.5, -0.25, 0, 0.25, 0.5, 1].map(delta => {
      const testRate    = Math.max(0.1, r + delta);
      const testPayment = calcMonthlyPI(loan, testRate, term);
      const diff        = testPayment - monthlyPI;
      const absDiff     = Math.abs(diff);
      return {
        delta, testRate, testPayment, diff, isCurrent: delta === 0,
        diffStr:   absDiff < 0.5 ? "—" : (diff > 0 ? "+" : "") + money(diff, 0),
        diffColor: absDiff < 0.5 ? "text-slate-400 dark:text-slate-500" : diff > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
      };
    });
  }, [loan, r, term, monthlyPI]);

  const scenarioData = useMemo(() => {
    const transforms = [
      { hp: hp,        dpPc: dpPc,                               r },
      { hp: hp,        dpPc: Math.min(40, dpPc + 10),            r },
      { hp: hp * 0.8,  dpPc: dpPc,                               r },
      { hp: hp,        dpPc: Math.min(40, Math.max(dpPc + 10, 30)), r },
    ];

    return transforms.map((t, i) => {
      const d    = t.hp * (t.dpPc / 100);
      const l    = t.hp - d;
      const pi   = calcMonthlyPI(l, t.r, term);
      const tax  = (t.hp * nz(propertyTaxRate) / 100) / 12;
      const ins = hp > 0
  ? monthlyIns * Math.pow(t.hp / hp, 0.6)
  : monthlyIns;
      const pmi  = calcAutoPMI(l, t.hp, t.dpPc);
      const total = pi + tax + ins + monthlyHOA + pmi;
      const closing   = l * (nz(closingCostPct) / 100);
      const cashNeeded = d + closing + total * 3;

      let fiveYrOwn = 0;
      for (let m = 0; m < 60; m++) {
        fiveYrOwn += total + (t.hp * nz(maintenanceRate) / 100) / 12;
      }

      const be = calcBreakEven({
        downPayment: d, closingCosts: closing, annualRate: t.r, monthlyPI: pi,
        rent: nz(monthlyRent), tax, ins, hoa: nz(hoa), homePrice: t.hp,
        appreciation: nz(appreciation), rentGrowth: nz(rentGrowth),
        investReturn: nz(investReturn), maintenanceRate: nz(maintenanceRate),
        taxDeductRate: nz(taxDeductRate),
      });

      const sDTI = grossMonthly > 0 ? (total / grossMonthly) * 100 : 0;

      return {
        name:           scenarioNames[i],
        homePrice:      t.hp,
        downPct:        t.dpPc,
        totalMonthly:   total,
        cashToClose:    cashNeeded,
        fiveYearOwnCost: fiveYrOwn,
        breakEvenYears: be.type === "ok" ? be.months / 12 : null,
        frontDTI:       sDTI,
        isCurrent:      i === 0,
      };
    });
  }, [hp, dpPc, r, term, propertyTaxRate, monthlyIns, monthlyHOA, closingCostPct,
      maintenanceRate, monthlyRent, appreciation, rentGrowth, investReturn,
      taxDeductRate, grossMonthly, hoa, scenarioNames]);

  const bestMonthly   = Math.min(...scenarioData.map(s => s.totalMonthly));
  const bestFiveYear  = Math.min(...scenarioData.map(s => s.fiveYearOwnCost));
  const bestBreakEven = Math.min(...scenarioData.map(s => s.breakEvenYears ?? 999));

  const shareState = {
    tab: "us", propertyState, homePrice, downPct, rate, term: String(term),
    closingCostPct, propertyTaxRate, insurance, hoa, maintenanceRate, extraMonthly,
    grossIncome, otherDebts, monthlyRent, appreciation, rentGrowth, investReturn,
    taxDeductRate, currentSavings, emergencyFundMonths, movingBudget,
    scenarioNames,
  };

  function handleReset() {
    setPropertyState("");
    setHomePrice("500000"); setDownPct("20"); setRate("6.75"); setTerm(30);
    setClosingCostPct("2.5"); setPropertyTaxRate("1.1"); setInsurance("150");
    setHoa("0"); setMaintenanceRate("1.0"); setExtraMonthly("0"); setBiweekly(false);
    setGrossIncome("120000"); setOtherDebts("500"); setMonthlyRent("2500");
    setAppreciation("3.5"); setRentGrowth("3.0"); setInvestReturn("7.0"); setTaxDeductRate("22");
    setCurrentSavings("80000"); setEmergencyFundMonths("6"); setMovingBudget("5000");
    setStressLevel("none"); setAppreciationPMI(false);
    setScenarioNames(["Buy Now", "Rent 2 Yrs, Buy", "Cheaper Home", "Higher Down"]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <Card>
          <H2 action={<ResetButton onReset={handleReset} />}>Home &amp; Loan Details</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Property state" tip="Select your state to auto-fill typical property tax, insurance, and closing cost estimates. You can override any of these." span2>
              <select className={selectCls} value={propertyState} onChange={e => setPropertyState(e.target.value)}>
                <option value="">— Select state (optional) —</option>
                {US_STATES_LIST.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </F>
            <F label="Home price" err={homePriceErr} span2>
              <input className={inputCls(homePriceErr)} type="number" value={homePrice} onChange={e => setHomePrice(e.target.value)} placeholder="500000" />
            </F>
            <F label="Down payment (%)" err={downPctErr}
               tip="Percentage of home price paid upfront. Below 20% triggers automatic PMI.">
              <input className={inputCls(downPctErr)} type="number" value={downPct} onChange={e => setDownPct(e.target.value)} />
              <Slider val={downPct} set={setDownPct} min={0} max={50} step={0.5} />
            </F>
            <F label="Down payment ($)"><RO value={money(dp)} /></F>
            <F label="Interest rate (%)" err={rateErr}>
              <input className={inputCls(rateErr)} type="number" step="0.05" value={rate} onChange={e => setRate(e.target.value)} />
            </F>
            <F label="Loan term">
              <select className={selectCls} value={term} onChange={e => setTerm(Number(e.target.value))}>
                {TERMS.map(t => <option key={t} value={t}>{t} years</option>)}
              </select>
            </F>
            <F label="Est. closing costs (%)" tipSide="right"
               tip="US closing costs typically run 2–5% of the loan. Auto-filled when you select a state.">
              <input className={inputCls()} type="number" step="0.25" value={closingCostPct} onChange={e => setClosingCostPct(e.target.value)} />
            </F>
            <F label="Closing costs ($)"><RO value={money(estimatedClosing)} /></F>
          </div>
        </Card>

        <Card>
          <H2>Monthly Costs</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Property tax (%/yr)"
               tip="US average is ~1.1%. Auto-filled when you select a state.">
              <input className={inputCls()} type="number" step="0.1" value={propertyTaxRate} onChange={e => setPropertyTaxRate(e.target.value)} />
            </F>
            <F label="Homeowners insurance ($/mo)"
               tip="Auto-filled with a state average calibrated to a ~$400k home.">
              <input className={inputCls()} type="number" value={insurance} onChange={e => setInsurance(e.target.value)} />
            </F>
            <F label="HOA fees ($/mo)">
              <input className={inputCls()} type="number" value={hoa} onChange={e => setHoa(e.target.value)} />
            </F>
            <F label="Maintenance reserve (%/yr)"
               tip="Recommended: 1–2% of home value annually.">
              <input className={inputCls()} type="number" step="0.1" value={maintenanceRate} onChange={e => setMaintenanceRate(e.target.value)} />
            </F>
            <F label="Extra monthly payment" tipSide="right"
               tip="Additional principal per month. Reduces total interest and shortens loan." span2>
              <input className={inputCls()} type="number" value={extraMonthly} onChange={e => setExtraMonthly(e.target.value)} placeholder="0" />
            </F>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="biweekly" checked={biweekly} onChange={e => setBiweekly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 accent-violet-600" />
              <label htmlFor="biweekly" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                Bi-weekly payments
                <Tip text="26 half-payments per year equals 13 full monthly payments — equivalent to one extra payment annually." />
              </label>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="appreciationPMI" checked={appreciationPMI} onChange={e => setAppreciationPMI(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 accent-violet-600" />
              <label htmlFor="appreciationPMI" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                Appreciation-adjusted PMI cancellation
                <Tip text="When checked, PMI cancellation is estimated using the appreciated home value. Requires a formal appraisal in practice." side="right" />
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
               tip="Used to estimate mortgage interest deduction value. Set to 0 if you take the standard deduction." span2>
              <input className={inputCls()} type="number" step="1" value={taxDeductRate} onChange={e => setTaxDeductRate(e.target.value)} />
            </F>
          </div>
        </Card>

        <Card>
          <H2>Cash Position</H2>
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Total savings / liquid cash" tip="All accessible cash — savings, checking, investment accounts you'd tap." span2>
              <input className={inputCls()} type="number" value={currentSavings} onChange={e => setCurrentSavings(e.target.value)} />
            </F>
            <F label="Emergency fund target (months)"
               tip="How many months of housing costs you want to hold as an emergency fund after closing.">
              <input className={inputCls()} type="number" value={emergencyFundMonths} onChange={e => setEmergencyFundMonths(e.target.value)} />
            </F>
            <F label="Moving / furnishing budget" tipSide="right"
               tip="Moving trucks, first-month furnishing, appliances. Deducted from your post-closing cash calculation.">
              <input className={inputCls()} type="number" value={movingBudget} onChange={e => setMovingBudget(e.target.value)} />
            </F>
          </div>
        </Card>

        <div className="flex justify-end">
          <ShareButton state={shareState} />
        </div>
      </div>

      <div className="space-y-3">
        <MobileSummaryBar monthly={totalMonthly} />

        <div className={`rounded-2xl border p-5 shadow-[0_6px_20px_rgba(15,23,42,0.07)] ${verdict.border} ${verdict.bg}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`text-xs font-semibold uppercase tracking-[0.14em] ${verdict.labelColor}`}>Buy · Wait · Rent</div>
              <div className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">{verdict.title}</div>
            </div>
            <div className={`rounded-full bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold ring-1 ${verdict.tag}`}>Decision</div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/70 dark:bg-slate-900 ring-1 ring-slate-200/40 dark:ring-slate-800/40">
            <div className={`h-full rounded-full transition-all ${verdict.barColor} ${verdict.barWidth}`} />
          </div>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{verdict.description}</p>
          {verdict.reasons.length > 0 && (
            <ul className="mt-2 space-y-1">
              {verdict.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className={`mt-0.5 flex-shrink-0 ${verdict.labelColor}`}>·</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-slate-900 dark:bg-white p-5 text-white dark:text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.18)]">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Your Bottom Line</div>
          <div className="mt-3 mb-4">
            <div className="text-xs text-slate-400 dark:text-slate-500">Estimated monthly payment</div>
            <div className="flex items-end gap-1.5">
              <span className="text-4xl font-bold tracking-tight">{money(totalMonthly, 0)}</span>
              <span className="mb-1 text-base text-slate-400 dark:text-slate-500">/mo</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-white/10 dark:border-slate-200 pt-4">
            <div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Cash to close</div>
              <div className="text-xl font-bold">{money(totalCashNeeded)}</div>
              <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">down + closing + 3-mo buffer</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Income for 28% DTI</div>
              <div className="text-xl font-bold">{money(recommendedIncome)}/yr</div>
              <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">not a lender requirement</div>
            </div>
          </div>
          <AffordabilityVerdict frontDTI={frontDTI} backDTI={backDTI} />
        </div>

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
                <span className="text-slate-600 dark:text-slate-400">{row.label}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{money(row.value, 2)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Total monthly</span>
              <span className="text-xl font-bold text-violet-700 dark:text-violet-300">{money(totalMonthly, 2)}</span>
            </div>
          </div>

          {monthlyPMI > 0 && activePMIDropMonth && (
            <div className="mt-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-amber-700 dark:text-amber-300">PMI auto-estimated at {money(monthlyPMI, 0)}/mo.</span>{" "}
              PMI can be cancelled around{" "}
              <strong>month {activePMIDropMonth} ({(activePMIDropMonth / 12).toFixed(1)} yrs)</strong>{" "}
              when LTV reaches 80%{appreciationPMI ? " of the appreciated value" : ""}.
              It is not removed automatically — you must request cancellation.
              {appreciationPMI && <span className="ml-1 text-violet-700 dark:text-violet-300">Appreciation-adjusted estimate requires a formal appraisal.</span>}
              <div className="mt-1 text-slate-500 dark:text-slate-400">PMI is estimated using LTV tiers; lender pricing varies.</div>
            </div>
          )}
        </Card>

        <Card>
          <H2>First Year &amp; 5-Year Cost</H2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">First year (own)</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{money(firstYearCost)}</div>
              <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">payments + maintenance</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">First year (rent)</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{money(nz(monthlyRent) * 12)}</div>
              <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">at current rent</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">5-year cost (own)</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{money(fiveYearOwnCost)}</div>
              <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">payments + maintenance</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">5-year cost (rent)</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{money(fiveYearRentCost)}</div>
              <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">with {fmtPct(nz(rentGrowth))}/yr growth</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3 text-sm">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">5-yr equity built</div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{money(fiveYearEquity)}</div>
              <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">principal + appreciation</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">5-yr net buy cost</div>
              <div className={`text-lg font-bold ${fiveYearNetOwn < fiveYearRentCost ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400"}`}>
                {money(fiveYearNetOwn)}
              </div>
              <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">after equity deducted</div>
            </div>
          </div>
          <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${
            fiveYearNetOwn < fiveYearRentCost ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200" : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200"
          }`}>
            {fiveYearNetOwn < fiveYearRentCost
              ? `Over 5 years, buying is ~${money(fiveYearRentCost - fiveYearNetOwn)} cheaper than renting (net of equity).`
              : `Over 5 years, renting is ~${money(fiveYearNetOwn - fiveYearRentCost)} cheaper than buying (net of equity).`}
          </div>
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">Break-even is sensitive to appreciation and rent growth assumptions.</div>
        </Card>

        <Card>
          <H2>Cash Needed to Close</H2>
          <div className="space-y-2 text-sm">
            {[
              { label: `Down payment (${dpPc}%)`,                     value: dp },
              { label: `Est. closing costs (${nz(closingCostPct)}%)`, value: estimatedClosing },
              { label: "3-month planning buffer",                      value: recommendedReserve },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">{row.label}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{money(row.value)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Total cash needed</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{money(totalCashNeeded)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            The 3-month buffer is a planning target, not a universal lender requirement.
          </p>
        </Card>

        <div className={`rounded-2xl border p-5 shadow-[0_6px_20px_rgba(15,23,42,0.07)] ${
          cashStatus === "healthy" ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30"
          : cashStatus === "tight" ? "border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30"
          : "border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/30"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                cashStatus === "healthy" ? "text-emerald-700 dark:text-emerald-300" : cashStatus === "tight" ? "text-amber-700 dark:text-amber-300" : "text-rose-700 dark:text-rose-300"
              }`}>Cash After Close</div>
              <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{money(cashAfterClose)}</div>
            </div>
            <div className={`rounded-full bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold ring-1 ${
              cashStatus === "healthy" ? "text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800"
              : cashStatus === "tight" ? "text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-800"
              : "text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-800"
            }`}>
              {cashStatus === "healthy" ? "Healthy" : cashStatus === "tight" ? "Tight" : "Danger"}
            </div>
          </div>
          <div className="mt-3 grid gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between"><span>Total savings</span><span className="font-semibold text-slate-900 dark:text-slate-100">{money(nz(currentSavings))}</span></div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Cash to close</span><span>− {money(totalCashNeeded)}</span></div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Moving / furnishing</span><span>− {money(nz(movingBudget))}</span></div>
            <div className="mt-1 flex justify-between border-t border-slate-200/60 dark:border-slate-800/60 pt-1.5 font-semibold text-slate-900 dark:text-slate-100">
              <span>Cash remaining</span>
              <span className={cashAfterClose < 0 ? "text-rose-600 dark:text-rose-400" : ""}>{money(cashAfterClose)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Emergency fund target ({emergencyFundMonths} mo)</span>
              <span>{money(emergencyFundTarget)}</span>
            </div>
          </div>
          <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${
            cashStatus === "healthy" ? "bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200"
            : cashStatus === "tight"  ? "bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200"
            : "bg-rose-100/80 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200"
          }`}>
            {cashStatus === "healthy"
              ? "Your cash position after closing covers your emergency fund target."
              : cashStatus === "tight"
              ? "You'll have some cash left but below your emergency fund target — consider waiting or lowering the price."
              : "You'd be cash-negative after closing. This purchase is not financially safe at current inputs."}
          </div>
        </div>

        <Card>
          <H2>Affordability Check</H2>
          <div className="space-y-3">
            <DTIRow label="Front-end DTI" value={frontDTI} guide="≤28% guideline"
              tip="Housing costs as % of gross monthly income." />
            <DTIRow label="Back-end DTI" value={backDTI} guide="≤36–43% guideline"
              tip="All monthly debts as % of gross income." />
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400">
              Max home price at 28% front-end DTI:{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {grossMonthly > 0 && maxHomePriceSolved > 0 ? money(maxHomePriceSolved) : "—"}
              </span>
              <span className="ml-1 text-slate-400 dark:text-slate-500">(solver estimate, not a lender pre-approval)</span>
            </div>
          </div>
        </Card>

        <Card>
          <H2>Stress Test</H2>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Drag the slider to see how your budget holds up if conditions worsen.</p>
          <div className="mb-4">
            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              <span>None</span><span>Low</span><span>Moderate</span><span>Severe</span>
            </div>
            <input type="range" min={0} max={3} step={1}
              value={["none","low","moderate","severe"].indexOf(stressLevel)}
              onChange={e => setStressLevel((["none","low","moderate","severe"][Number(e.target.value)] as StressLevel))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-800 accent-violet-600" />
            <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{stressCfg.description}</div>
          </div>
          {stressLevel !== "none" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Stressed monthly</div>
                  <div className={`text-xl font-bold ${stressedTotal > totalMonthly * 1.2 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
                    {money(stressedTotal, 0)}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">+{money(stressedTotal - totalMonthly, 0)} vs. base</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Stressed income</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{money(stressedIncome * 12)}/yr</div>
                  {stressCfg.incomeMult < 1 && <div className="text-xs text-slate-400 dark:text-slate-500">{((1 - stressCfg.incomeMult) * 100).toFixed(0)}% income drop modelled</div>}
                </div>
              </div>
              <div className="space-y-2">
                <DTIRow label="Stressed front-end DTI" value={stressedFrontDTI} guide="≤28% target" />
                <DTIRow label="Stressed back-end DTI"  value={stressedBackDTI}  guide="≤36–43% guideline" />
              </div>
              <div className={`rounded-xl px-3 py-2 text-xs font-semibold ${stressVerdictColor}`}>{stressVerdict}</div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 px-3 py-3 text-xs text-slate-500 dark:text-slate-400 text-center ring-1 ring-slate-200 dark:ring-slate-800">
              Move the slider above to model stress scenarios
            </div>
          )}
        </Card>

        <Card>
          <H2>Rate Sensitivity</H2>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">How monthly P&amp;I shifts if rates move from your current {fmtPct(r)}.</p>
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200 dark:ring-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-3 py-2 text-left">Rate</th>
                  <th className="px-3 py-2 text-right">Monthly P&amp;I</th>
                  <th className="px-3 py-2 text-right">vs. current</th>
                </tr>
              </thead>
              <tbody>
                {sensitivityRows.map(row => (
                  <tr key={row.delta} className={`border-b border-slate-100 dark:border-slate-900/60 ${row.isCurrent ? "bg-violet-50 dark:bg-violet-950/30" : ""}`}>
                    <td className={`px-3 py-2 ${row.isCurrent ? "font-semibold text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
                      {fmtPct(row.testRate)}
                      {row.isCurrent && <span className="ml-1.5 text-[10px] font-normal text-violet-600 dark:text-violet-400 uppercase tracking-wide">current</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-900 dark:text-slate-100">{money(row.testPayment, 0)}/mo</td>
                    <td className={`px-3 py-2 text-right font-semibold ${row.diffColor}`}>{row.diffStr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <VCard>
          <div className="text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-300">Long-Term Cost</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {[
              { label:"Loan amount",         value: money(loan) },
              { label:"Total interest",      value: money(totalInterest) },
              { label:"Total cost of loan",  value: money(loan + totalInterest) },
              { label:"Interest/price ratio",value: hp > 0 ? fmtPct((totalInterest / hp) * 100) : "—" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.value}</div>
              </div>
            ))}
          </div>
          {nz(extraMonthly) > 0 && (
            <div className="mt-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Extra {money(nz(extraMonthly), 0)}/mo:</span>{" "}
              save <span className="font-semibold text-emerald-600 dark:text-emerald-400">{money(extraInterest)}</span> in interest,
              pay off <span className="font-semibold text-emerald-600 dark:text-emerald-400">{extraMonthsSaved} months early</span>.
            </div>
          )}
          {bwSavings && (
            <div className="mt-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Bi-weekly payments:</span>{" "}
              save <span className="font-semibold text-emerald-600 dark:text-emerald-400">{money(bwSavings.interestSaved)}</span> in interest,
              pay off <span className="font-semibold text-emerald-600 dark:text-emerald-400">{bwSavings.monthsSaved} months early</span>.
            </div>
          )}
        </VCard>

        <VCard>
          <div className="text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-300">Rent vs Buy Break-Even</div>
          <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{beYears ? `${beYears} years` : "30+ years"}</div>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {beYears
              ? `Buying becomes cheaper than renting after ~${beYears} years at current assumptions.`
              : "Buying doesn't break even within 30 years. Renting may be more cost-effective."}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div>Monthly rent: <strong>{money(nz(monthlyRent))}</strong></div>
            <div>Monthly own: <strong>{money(totalMonthly)}</strong></div>
            <div>Rent growth: <strong>{fmtPct(nz(rentGrowth))}/yr</strong></div>
            <div>Appreciation: <strong>{fmtPct(nz(appreciation))}/yr</strong></div>
            <div>Maintenance: <strong>{fmtPct(nz(maintenanceRate))}/yr</strong></div>
            <div>Tax deduction: <strong>{fmtPct(nz(taxDeductRate))} bracket</strong></div>
          </div>
          <HowThisWorks items={[
            `Each month, cumulative ownership cost (P&I + tax + insurance + HOA + ${fmtPct(nz(maintenanceRate))}/yr maintenance) is compared to cumulative rent.`,
            `Rent grows at ${fmtPct(nz(rentGrowth))}/yr compounding.`,
            `Your ${money(dp)} down payment is modelled as an investment earning ${fmtPct(nz(investReturn))}/yr — this is the opportunity cost of buying.`,
            "Equity paydown (principal repaid + appreciation) is credited back to the buyer each month.",
            nz(taxDeductRate) > 0
              ? `A ${fmtPct(nz(taxDeductRate))} marginal tax deduction on mortgage interest is applied.`
              : "No mortgage interest tax deduction is applied (standard deduction assumed).",
            "Break-even is sensitive to appreciation and rent growth assumptions — small changes can shift the result by years.",
          ]} />
        </VCard>

        <Card>
          <H2>Scenario Comparison</H2>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Four pre-set scenarios based on your current inputs. Click a name to rename it.</p>
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200 dark:ring-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-3 py-2 text-left">Scenario</th>
                  <th className="px-3 py-2 text-right">Monthly</th>
                  <th className="px-3 py-2 text-right">Cash to Close</th>
                  <th className="px-3 py-2 text-right">5-yr Cost</th>
                  <th className="px-3 py-2 text-right">Break-Even</th>
                </tr>
              </thead>
              <tbody>
                {scenarioData.map((s, i) => (
                  <tr key={i} className={`border-b border-slate-100 dark:border-slate-900/60 ${s.isCurrent ? "bg-violet-50 dark:bg-violet-950/30" : ""}`}>
                    <td className="px-3 py-2">
                      <input
                        className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:underline"
                        value={s.name}
                        onChange={e => {
                          const names = [...scenarioNames];
                          names[i] = e.target.value;
                          setScenarioNames(names);
                        }}
                      />
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{money(s.homePrice, 0)} · {s.downPct.toFixed(0)}% down</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-semibold ${s.totalMonthly === bestMonthly ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-slate-100"}`}>
                        {money(s.totalMonthly, 0)}
                      </span>
                      {s.totalMonthly === bestMonthly && <div className="text-[10px] text-emerald-600 dark:text-emerald-400">lowest</div>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{money(s.cashToClose, 0)}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-semibold ${s.fiveYearOwnCost === bestFiveYear ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-slate-100"}`}>
                        {money(s.fiveYearOwnCost, 0)}
                      </span>
                      {s.fiveYearOwnCost === bestFiveYear && <div className="text-[10px] text-emerald-600 dark:text-emerald-400">lowest</div>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-semibold ${s.breakEvenYears !== null && s.breakEvenYears === bestBreakEven ? "text-emerald-700 dark:text-emerald-300" : "text-slate-900 dark:text-slate-100"}`}>
                        {s.breakEvenYears ? `${s.breakEvenYears.toFixed(1)} yr` : "30+"}
                      </span>
                      {s.breakEvenYears !== null && s.breakEvenYears === bestBreakEven && <div className="text-[10px] text-emerald-600 dark:text-emerald-400">fastest</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">Scenario names are editable. Metrics update instantly as you change inputs.</div>
        </Card>

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
  );
}

// ═══════════════════════════════════════════════════════════════════════
// INTERNATIONAL TAB — with residency fix + FX risk
// ═══════════════════════════════════════════════════════════════════════

type ResidencyStatus = "resident" | "non-resident";

function InternationalTab() {
  const [countryCode,     setCountryCode]     = useState("PT");
  const [residencyStatus, setResidencyStatus] = useState<ResidencyStatus>("non-resident");
  const [homePrice,       setHomePrice]       = useState("350000");
  const [downPct,         setDownPct]         = useState("30");
  const [useCustomRate,   setUseCustomRate]   = useState(false);
  const [customRate,      setCustomRate]      = useState("");
  const [term,            setTerm]            = useState(20);
  const [closingCostPct,  setClosingCostPct]  = useState("7");
  const [annualTaxAmt,    setAnnualTaxAmt]    = useState("1200");
  const [insurance,       setInsurance]       = useState("100");
  const [extraMonthly,    setExtraMonthly]    = useState("0");
  const [grossIncome,     setGrossIncome]     = useState("120000");
  const [otherDebts,      setOtherDebts]      = useState("500");
  const [monthlyRent,     setMonthlyRent]     = useState("1500");
  const [appreciation,    setAppreciation]    = useState("3.0");
  const [rentGrowth,      setRentGrowth]      = useState("2.5");
  const [investReturn,    setInvestReturn]    = useState("7.0");
  const [maintenanceRate, setMaintenanceRate] = useState("1.0");

  const country    = COUNTRIES.find(c => c.code === countryCode) ?? COUNTRIES[0];
  const fxRisk     = HIGH_FX_RISK.has(countryCode) ? "high" : MEDIUM_FX_RISK.has(countryCode) ? "medium" : "low";
  const buyerRules = FOREIGN_BUYER_RULES[countryCode];

  // ─── FIX 1: apply foreign buyer overrides when non-resident ──────────
  const isNonResident    = residencyStatus === "non-resident";
  const effectiveDownMin = isNonResident && buyerRules?.nonResidentDownMin
    ? buyerRules.nonResidentDownMin
    : country.downMin;
  const baseRate         = isNonResident && buyerRules?.nonResidentRate
    ? buyerRules.nonResidentRate
    : country.rate;
  const mortgageBlocked  = isNonResident && buyerRules && !buyerRules.mortgageAvailable;
  const effectiveRate    = (useCustomRate && nz(customRate) > 0) ? nz(customRate) : baseRate;

  const hp           = nz(homePrice);
  const dpPc         = nz(downPct);
  const dp           = hp * (dpPc / 100);
  const loan         = hp - dp;
  const closingCosts = hp * (nz(closingCostPct) / 100);
  const totalUpfront = dp + closingCosts;

  const monthlyPI    = mortgageBlocked ? 0 : calcMonthlyPI(loan, effectiveRate, term);
  const monthlyTax   = nz(annualTaxAmt) / 12;
  const monthlyIns   = nz(insurance);
  const totalMonthly = monthlyPI + monthlyTax + monthlyIns;
  const totalInterest = mortgageBlocked ? 0 : calcTotalInterest(loan, effectiveRate, term);

  const grossMonthly = nz(grossIncome) / 12;
  const frontDTI = grossMonthly > 0 ? (totalMonthly / grossMonthly) * 100 : 0;
  const backDTI  = grossMonthly > 0 ? ((totalMonthly + nz(otherDebts)) / grossMonthly) * 100 : 0;

  const amortRows = useMemo(
    () => mortgageBlocked ? [] : buildSchedule(loan, effectiveRate, term, nz(extraMonthly)),
    [loan, effectiveRate, term, extraMonthly, mortgageBlocked]
  );

  const breakEvenMonth = useMemo<BreakEvenResult>(() => {
  if (mortgageBlocked) return { type: "invalid" };

  return calcBreakEven({
    downPayment: dp,
    closingCosts,
    annualRate: effectiveRate,
    monthlyPI,
    rent: nz(monthlyRent),
    tax: monthlyTax,
    ins: monthlyIns,
    hoa: 0,
    homePrice: hp,
    appreciation: nz(appreciation),
    rentGrowth: nz(rentGrowth),
    investReturn: nz(investReturn),
    maintenanceRate: nz(maintenanceRate),
    taxDeductRate: 0,
  });
}, [
  dp,
  closingCosts,
  effectiveRate,
  monthlyPI,
  monthlyRent,
  monthlyTax,
  monthlyIns,
  hp,
  appreciation,
  rentGrowth,
  investReturn,
  maintenanceRate,
  mortgageBlocked,
]);

const beYears =
  breakEvenMonth.type === "ok"
    ? parseFloat((breakEvenMonth.months / 12).toFixed(1))
    : null;
  useEffect(() => {
    setDownPct(String(effectiveDownMin));
    setUseCustomRate(false);
    setCustomRate("");
  }, [countryCode, residencyStatus]);

  const shareState = {
    tab:"international", countryCode, residencyStatus, homePrice, downPct,
    useCustomRate: String(useCustomRate), customRate, term: String(term),
    closingCostPct, annualTaxAmt, insurance, extraMonthly,
    grossIncome, otherDebts, monthlyRent, appreciation, rentGrowth, investReturn, maintenanceRate,
  };

  function handleReset() {
    setCountryCode("PT"); setResidencyStatus("non-resident"); setHomePrice("350000"); setDownPct("30");
    setUseCustomRate(false); setCustomRate(""); setTerm(20);
    setClosingCostPct("7"); setAnnualTaxAmt("1200"); setInsurance("100");
    setExtraMonthly("0"); setGrossIncome("120000"); setOtherDebts("500");
    setMonthlyRent("1500"); setAppreciation("3.0"); setRentGrowth("2.5");
    setInvestReturn("7.0"); setMaintenanceRate("1.0");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-5 py-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm font-bold text-amber-800 dark:text-amber-200">⚠️ International data is for planning only — not financial or legal advice</span>
        </div>
        <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-100">
          Mortgage access for foreign buyers varies enormously by country, residency status, employment type, and individual bank policy. Rates shown are indicative benchmarks. Some countries listed may not offer mortgages to non-residents at all. Consult a local mortgage broker, tax adviser, and property lawyer.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <ACard>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">⚠️ Planning Estimates Only</div>
              <span className="flex-shrink-0 rounded-full bg-amber-200 dark:bg-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">Not a quote</span>
            </div>
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{country.notes}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-800">
                Min. down (est.): {effectiveDownMin}%
                {isNonResident && buyerRules?.nonResidentDownMin && buyerRules.nonResidentDownMin !== country.downMin && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">↑ non-resident</span>
                )}
              </span>
              <span className="inline-flex items-center rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-800">
                Indicative rate: ~{baseRate}%
                {isNonResident && buyerRules?.nonResidentRate && buyerRules.nonResidentRate !== country.rate && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">↑ non-resident</span>
                )}
              </span>
              {/* FX Risk badge */}
              {fxRisk !== "low" && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                  fxRisk === "high"
                    ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-800"
                    : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-800"
                }`}>
                  {fxRisk === "high" ? "⚠ High FX risk" : "~ Medium FX risk"}
                </span>
              )}
            </div>

            {/* FX Risk explanation */}
            {fxRisk !== "low" && (
              <div className={`mt-3 rounded-xl px-3 py-2.5 text-xs leading-5 ${
                fxRisk === "high"
                  ? "bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-100 ring-1 ring-rose-200 dark:ring-rose-800"
                  : "bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 ring-1 ring-amber-200 dark:ring-amber-800"
              }`}>
                <span className="font-semibold">
                  {fxRisk === "high" ? "High currency volatility:" : "Moderate currency risk:"}
                </span>{" "}
                {fxRisk === "high"
                  ? "This country's currency has historically shown significant volatility against USD/EUR. Property values in USD terms can swing dramatically even if local prices are stable. Consider hedging or using USD-denominated pricing where available."
                  : "This currency carries moderate volatility. Factor potential FX swings into your budget — a 10–20% move in exchange rates can meaningfully affect your purchasing power and property value in home-currency terms."}
              </div>
            )}

            {/* Non-resident mortgage block warning */}
            {mortgageBlocked && buyerRules?.warning && (
              <div className="mt-3 rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 px-3 py-2.5 text-xs leading-5 text-rose-900 dark:text-rose-100">
                <span className="font-semibold">🚫 Mortgage not available for non-residents:</span>{" "}
                {buyerRules.warning}
              </div>
            )}

            {/* Non-resident warning (mortgage available but with caveats) */}
            {!mortgageBlocked && isNonResident && buyerRules?.warning && (
              <div className="mt-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-xs leading-5 text-amber-900 dark:text-amber-100">
                <span className="font-semibold">Non-resident note:</span>{" "}
                {buyerRules.warning}
              </div>
            )}
          </ACard>

          <Card>
            <H2 action={<ResetButton onReset={handleReset} />}>Country &amp; Home Details</H2>
            <div className="grid gap-3 sm:grid-cols-2">
              <F label="Target country" span2>
                <select className={selectCls} value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </F>

              {/* FIX 1: Residency status toggle */}
              <F label="Your residency status" tipSide="right"
                 tip="Non-residents often face higher down payments, higher rates, or no mortgage access at all. Selecting 'Resident' uses standard country defaults."
                 span2>
                <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900/40 p-1">
                  {(["non-resident", "resident"] as ResidencyStatus[]).map(s => (
                    <button key={s} type="button"
                      onClick={() => setResidencyStatus(s)}
                      className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition ${
                        residencyStatus === s ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:dark:text-slate-300"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </F>

              <F label="Home price (USD equivalent)" span2>
                <input className={inputCls()} type="number" value={homePrice} onChange={e => setHomePrice(e.target.value)} />
              </F>
              <F label="Down payment (%)" tip={`Minimum for ${residencyStatus === "non-resident" ? "non-resident" : ""} buyers in ${country.name}: ${effectiveDownMin}%`}>
                <input className={inputCls()} type="number" value={downPct} onChange={e => setDownPct(e.target.value)} />
                <Slider val={downPct} set={setDownPct} min={0} max={60} step={1} />
              </F>
              <F label="Down payment ($)"><RO value={money(dp)} /></F>

              <div className="sm:col-span-2 grid grid-cols-2 gap-3 items-start">
                <F label="Interest rate (%)" tipSide="right"
                   tip={`${country.name} ${residencyStatus === "non-resident" && buyerRules?.nonResidentRate ? "non-resident" : "typical"} rate: ~${baseRate}%.`}>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <input type="checkbox" id="customRate" checked={useCustomRate} onChange={e => setUseCustomRate(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 accent-violet-600" />
                      <label htmlFor="customRate" className="cursor-pointer">Use custom rate</label>
                    </div>
                    {useCustomRate
                      ? <input className={inputCls()} type="number" step="0.1" value={customRate} onChange={e => setCustomRate(e.target.value)} placeholder={String(baseRate)} />
                      : <RO value={`${baseRate}% (${residencyStatus === "non-resident" && buyerRules?.nonResidentRate ? "non-resident" : "country"} default)`} />}
                  </div>
                </F>
                <div className="pt-5">
                  <span className={lbl}>Loan term</span>
                  <select className={selectCls} value={term} onChange={e => setTerm(Number(e.target.value))} disabled={mortgageBlocked}>
                    {TERMS.map(t => <option key={t} value={t}>{t} years</option>)}
                  </select>
                </div>
              </div>

              <F label="Closing costs (%)" tipSide="right" tip="Transfer taxes, notary, agent fees. Portugal ~7%, France ~8%, Spain ~10–12%.">
                <input className={inputCls()} type="number" step="0.5" value={closingCostPct} onChange={e => setClosingCostPct(e.target.value)} />
              </F>
              <F label="Closing costs ($)"><RO value={money(closingCosts)} /></F>
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
              <F label="Maintenance reserve (%/yr)" tip="Budget 1–2% of home value for annual repairs and upkeep.">
                <input className={inputCls()} type="number" step="0.1" value={maintenanceRate} onChange={e => setMaintenanceRate(e.target.value)} />
              </F>
              <F label="Extra monthly payment">
                <input className={inputCls()} type="number" value={extraMonthly} onChange={e => setExtraMonthly(e.target.value)} placeholder="0" disabled={mortgageBlocked} />
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
              <F label="Investment return (%/yr)" tipSide="right" tip="What the down payment + closing costs could earn if invested instead.">
                <input className={inputCls()} type="number" step="0.1" value={investReturn} onChange={e => setInvestReturn(e.target.value)} />
              </F>
            </div>
          </Card>

          <div className="flex justify-end"><ShareButton state={shareState} /></div>
        </div>

        <div className="space-y-3">
          <MobileSummaryBar monthly={totalMonthly} />

          {/* Mortgage blocked callout */}
          {mortgageBlocked && (
            <div className="rounded-2xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 p-5">
              <div className="text-sm font-bold text-rose-800 dark:text-rose-200">🚫 Mortgage figures unavailable</div>
              <p className="mt-2 text-xs text-rose-700 dark:text-rose-300 leading-5">
                Local mortgages are generally not accessible to non-residents in {country.name}.
                The monthly payment and amortization figures below reflect cash purchase or tax/insurance costs only.
                Switch to <strong>Resident</strong> to model a mortgage scenario.
              </p>
            </div>
          )}

          <VCard>
            <div className="text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-300">Total Upfront Cash Needed</div>
            <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{money(totalUpfront)}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>Down payment: <strong>{money(dp)}</strong></div>
              <div>Closing costs: <strong>{money(closingCosts)}</strong></div>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Does not include moving costs, currency conversion fees, or cash reserve requirements.
            </div>
          </VCard>

          {!mortgageBlocked && (
            <Card>
              <H2>Monthly Payment Breakdown</H2>
              <div className="space-y-2 text-sm">
                {[
                  { label:"Principal & Interest", value: monthlyPI },
                  { label:"Property Tax",         value: monthlyTax },
                  { label:"Insurance",            value: monthlyIns },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">{row.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{money(row.value, 2)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Total monthly</span>
                  <span className="text-xl font-bold text-violet-700 dark:text-violet-300">{money(totalMonthly, 2)}</span>
                </div>
              </div>
            </Card>
          )}

          {!mortgageBlocked && (
            <Card>
              <H2>Loan Summary</H2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label:"Loan amount",    value: money(loan) },
                  { label:"Total interest", value: money(totalInterest) },
                  { label:"Total cost",     value: money(loan + totalInterest) },
                  { label:"Effective rate", value: fmtPct(effectiveRate) },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <H2>Affordability Check</H2>
            <div className="space-y-3">
              <DTIRow label="Front-end DTI" value={frontDTI} guide="≤28% guideline" />
              <DTIRow label="Back-end DTI"  value={backDTI}  guide="≤36% guideline" />
            </div>
          </Card>

          <VCard>
            <div className="text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-300">Rent vs Buy Break-Even</div>
            <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
              {mortgageBlocked ? "N/A" : beYears ? `${beYears} years` : "30+ years"}
            </div>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {mortgageBlocked
                ? "Break-even analysis requires a mortgage — not available for non-residents in this country."
                : beYears
                ? `Buying in ${country.name} becomes cheaper than renting after ~${beYears} years.`
                : `Buying in ${country.name} doesn't break even within 30 years.`}
            </p>
            {!mortgageBlocked && (
              <HowThisWorks items={[
                `Upfront opportunity cost: ${money(totalUpfront)} modelled as an investment earning ${fmtPct(nz(investReturn))}/yr.`,
                `Equity credited monthly from principal repayment and ${fmtPct(nz(appreciation))}/yr appreciation.`,
                `Maintenance cost of ${fmtPct(nz(maintenanceRate))}/yr charged monthly.`,
                `Rent grows at ${fmtPct(nz(rentGrowth))}/yr. Higher rent growth = sooner break-even.`,
                "No mortgage interest deduction modelled — tax treatment varies widely internationally.",
                "All rates and country data are estimates for planning only.",
              ]} />
            )}
          </VCard>

          {!mortgageBlocked && (
            <>
              <Card>
                <H2>Principal vs Interest Over Time</H2>
                <AmortizationChart rows={amortRows} />
              </Card>
              <Card>
                <H2>Amortization Schedule</H2>
                <AmortizationTable rows={amortRows} />
              </Card>
            </>
          )}
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

  useEffect(() => {
    const s = readHashState();
    if (s?.tab && ["us", "international", "refinance"].includes(s.tab)) {
      setActiveTab(s.tab);
    }
  }, []);

  const tabs = [
    { id:"us",            label:"US Mortgage",  sub:"Home buying decision engine" },
    { id:"international", label:"Buying Abroad", sub:"Post-relocation buying" },
    { id:"refinance",     label:"Refinance",     sub:"Should I refi?" },
  ];

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/70 flex-wrap gap-1">
          {tabs.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                activeTab === tab.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
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
