"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

import { STATES, type StateCode } from "@/lib/states";
import { findCity } from "@/lib/cities";
import { estimateNetAnnual, effectiveTaxRatePct, type FilingStatus } from "@/lib/tax";

type FireCalculatorProps = {
  initialIncome?: number;
};

type Preset = "custom" | "lean" | "fat";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function money(n: number, digits: number = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  });
}

function pct(n: number, digits: number = 1) {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

type StateChoice = StateCode | "";

type Inputs = {
  preset: Preset;

  // Core
  age: number;
  income: number; // gross annual
  expensesMonthly: number;

  // Taxes
  state: StateChoice; // no default
  filingStatus: FilingStatus;
  k401Pct: number;

  // Convenience totals (used for non-advanced, AND can auto-fill brokerage in advanced)
  currentPortfolio: number;
  yearlyInvestment: number; // annual (if 0 -> auto net - expenses)

  // Advanced toggle + fields
  advanced: boolean;
  targetFireAge: number;

  bal401k: number;
  balIra: number;
  balBrokerage: number;

  contrib401k: number; // yearly
  contribIra: number; // yearly
  contribBrokerage: number; // yearly

  // Assumptions (base)
  annualReturnPct: number; // phase 1 return
  withdrawalRatePct: number;
  maxYears: number;

  // NEW: Inflation & salary growth
  inflationPct: number; // expenses grow
  salaryGrowthPct: number; // income grows

  // NEW: Investment growth phases
  phase2ReturnPct: number; // phase 2 return after N years
  phase2StartsYear: number; // after this many years, use phase2ReturnPct

  // Move impact
  moveCompareOn: boolean;
  movedExpensesMonthly: number; // monthly expenses if moved (Raleigh)
};

const DEFAULT_INPUTS: Inputs = {
  preset: "custom",

  age: 0,
  income: 0,
  expensesMonthly: 0,

  state: "",
  filingStatus: "single",
  k401Pct: 0,

  currentPortfolio: 0,
  yearlyInvestment: 0,

  advanced: false,
  targetFireAge: 0,

  bal401k: 0,
  balIra: 0,
  balBrokerage: 0,

  contrib401k: 0,
  contribIra: 0,
  contribBrokerage: 0,

  annualReturnPct: 7,
  withdrawalRatePct: 4,
  maxYears: 60,

  // NEW defaults
  inflationPct: 2.5,
  salaryGrowthPct: 3,
  phase2ReturnPct: 5.5,
  phase2StartsYear: 10,

  moveCompareOn: false,
  movedExpensesMonthly: 0,
};

const VIRAL_COMPARE_CITIES = [
  "nyc-ny",
  "austin-tx",
  "raleigh-nc",
  "charlotte-nc",
  "denver-co",
] as const;

function expenseAdjustedForCity(baseAnnualExpenses: number, cityId: string) {
  const city = findCity(cityId);
  if (!city?.col?.housing) return baseAnnualExpenses;

  // Simple V1: use housing multiplier as the main lever
  const housingFactor = city.col.housing;

  // Blend so it doesn't overreact too hard:
  // 60% housing-sensitive, 40% unchanged baseline
  const blended = baseAnnualExpenses * (0.4 + 0.6 * housingFactor);

  return Math.max(0, blended);
}

function annualExpensesFromMonthly(monthly: number) {
  return Math.max(0, (Number(monthly) || 0) * 12);
}

function annualExpenses(i: Inputs) {
  return annualExpensesFromMonthly(i.expensesMonthly);
}

function annualMovedExpenses(i: Inputs) {
  return annualExpensesFromMonthly(i.movedExpensesMonthly);
}

// --- Convenience auto-fill into brokerage (advanced mode) ---
// Applies ONLY if brokerage fields are still 0, so we don't overwrite user-typed values.
function applyBrokerageAutofill(i: Inputs) {
  const balBrokerage =
    i.advanced && i.balBrokerage === 0 && i.currentPortfolio > 0
      ? i.currentPortfolio
      : i.balBrokerage;

  const contribBrokerage =
    i.advanced && i.contribBrokerage === 0 && i.yearlyInvestment > 0
      ? i.yearlyInvestment
      : i.contribBrokerage;

  return { balBrokerage, contribBrokerage };
}

function totals(i: Inputs, netAnnualBase: number) {
  const { balBrokerage, contribBrokerage } = applyBrokerageAutofill(i);

  const startPortfolio = i.advanced
    ? i.bal401k + i.balIra + balBrokerage
    : i.currentPortfolio;

  // If user leaves Yearly Investment blank/0 in non-advanced, auto-calc using net income - expenses
  const autoAnnualInvestment = Math.max(0, netAnnualBase - annualExpenses(i));

  const annualContribution = i.advanced
    ? i.contrib401k + i.contribIra + contribBrokerage
    : i.yearlyInvestment > 0
      ? i.yearlyInvestment
      : autoAnnualInvestment;

  return { startPortfolio, annualContribution };
}

// Return for a given year based on phases
function returnForYear(i: Inputs, yearIndex: number) {
  const y = Math.max(0, yearIndex);
  const switchAt = clamp(Number(i.phase2StartsYear) || 0, 0, 200);
  const r1 = (Number(i.annualReturnPct) || 0) / 100;
  const r2 = (Number(i.phase2ReturnPct) || 0) / 100;

  return y >= switchAt ? r2 : r1;
}

function simulateYearsToFI(
  i: Inputs,
  netAnnualBase: number,
  override?: { expensesAnnualBase?: number }
) {
  const swr = (Number(i.withdrawalRatePct) || 0) / 100;
  const infl = (Number(i.inflationPct) || 0) / 100;
  const salG = (Number(i.salaryGrowthPct) || 0) / 100;

  const baseExpenses = override?.expensesAnnualBase ?? annualExpenses(i);

  const { startPortfolio, annualContribution } = totals(i, netAnnualBase);

  let years = 0;
  let portfolio = startPortfolio;

  // Year 0 FIRE number uses base expenses
  const fire0 = swr > 0 ? baseExpenses / swr : Infinity;
  if (portfolio >= fire0) {
    return { fireNumber: fire0, yearsToFI: 0 as number, endPortfolio: portfolio, startPortfolio };
  }

  while (years < i.maxYears) {
    const yearIndex = years; // 0-based
    const r = returnForYear(i, yearIndex);

    // grow expenses with inflation each year (year 1 uses infl once, etc.)
    const expensesThisYear = baseExpenses * Math.pow(1 + infl, yearIndex);

    // net income grows with salary growth (only affects auto-invest logic in non-advanced)
    const netThisYear = netAnnualBase * Math.pow(1 + salG, yearIndex);

    // if user is using non-advanced AND left yearlyInvestment at 0, we auto-invest net - expenses (but never negative)
    let contribThisYear = annualContribution;
    if (!i.advanced && (Number(i.yearlyInvestment) || 0) <= 0) {
      contribThisYear = Math.max(0, netThisYear - expensesThisYear);
    }

    const fireNumberThisYear = swr > 0 ? expensesThisYear / swr : Infinity;

    portfolio = portfolio * (1 + r) + Math.max(0, contribThisYear);
    years += 1;

    // Check against current year's FIRE number (inflation-adjusted)
    if (portfolio >= fireNumberThisYear) break;
  }

  // For display, use the FIRE number at the year we reached FI (inflation-adjusted)
  const reached = years <= i.maxYears;
  const lastYearIndex = Math.max(0, years - 1);
  const expensesAtEnd = baseExpenses * Math.pow(1 + ((Number(i.inflationPct) || 0) / 100), lastYearIndex);
  const fireAtEnd = swr > 0 ? expensesAtEnd / swr : Infinity;

  return {
    fireNumber: fireAtEnd,
    yearsToFI: portfolio >= fireAtEnd ? years : (null as number | null),
    endPortfolio: portfolio,
    startPortfolio,
  };
}

type ProjectionPoint = { year: number; age: number; portfolio: number };

function buildProjection(i: Inputs, netAnnualBase: number, yearsToFI: number | null) {
  const infl = (Number(i.inflationPct) || 0) / 100;
  const salG = (Number(i.salaryGrowthPct) || 0) / 100;

  const { startPortfolio, annualContribution } = totals(i, netAnnualBase);

  const extraYearsAfterFI = 2;
  const cap = i.maxYears;
  const stopAt = yearsToFI === null ? cap : clamp(yearsToFI + extraYearsAfterFI, 0, cap);

  const points: ProjectionPoint[] = [];
  let portfolio = startPortfolio;

  points.push({ year: 0, age: i.age, portfolio });

  const baseExpenses = annualExpenses(i);

  for (let y = 1; y <= stopAt; y++) {
    const yearIndex = y - 1; // align with simulate loop
    const r = returnForYear(i, yearIndex);

    const expensesThisYear = baseExpenses * Math.pow(1 + infl, yearIndex);
    const netThisYear = netAnnualBase * Math.pow(1 + salG, yearIndex);

    let contribThisYear = annualContribution;
    if (!i.advanced && (Number(i.yearlyInvestment) || 0) <= 0) {
      contribThisYear = Math.max(0, netThisYear - expensesThisYear);
    }

    portfolio = portfolio * (1 + r) + Math.max(0, contribThisYear);
    points.push({ year: y, age: i.age + y, portfolio });
  }

  return points;
}

// ---------------------------
// AdSense helpers (safe)
// ---------------------------
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const ADSENSE_SLOT_RESULTS = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULTS || "";
const ADSENSE_SLOT_BOTTOM = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM || "";

function AdSenseBlock({ slot, className = "" }: { slot: string; className?: string }) {
  const enabled = Boolean(ADSENSE_CLIENT && slot);
  useEffect(() => {
    if (!enabled) return;
    try {
      // @ts-expect-error
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, [enabled, slot]);

  if (!enabled) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// ---------------------------
// Affiliate helpers
// ---------------------------
type Affiliate = {
  name: string;
  blurb: string;
  href: string;
  tag: string;
};

const AFFILIATES: Affiliate[] = [
  {
    name: "Fidelity",
    blurb: "Low-cost index funds + strong retirement tools. Great all-around choice.",
    href: "https://www.fidelity.com/",
    tag: "Brokerage / 401(k)",
  },
  {
    name: "Vanguard",
    blurb: "Classic FIRE favorite for low-fee index investing.",
    href: "https://investor.vanguard.com/",
    tag: "Index funds",
  },
  {
    name: "Betterment",
    blurb: "Hands-off robo-investing if you want automation and simplicity.",
    href: "https://www.betterment.com/",
    tag: "Robo-advisor",
  },
  {
    name: "Wealthfront",
    blurb: "Automated investing + cash management. Clean experience.",
    href: "https://www.wealthfront.com/",
    tag: "Robo + cash",
  },
];

function AffiliateCard({ a }: { a: Affiliate }) {
  return (
    <a
      href={a.href}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{a.name}</div>
        <div className="text-[11px] rounded-full border border-white/10 bg-black/20 px-2 py-1 text-slate-300">
          {a.tag}
        </div>
      </div>
      <div className="mt-2 text-sm text-slate-300">{a.blurb}</div>
      <div className="mt-3 text-sm font-semibold text-emerald-200 group-hover:text-emerald-100">
        Learn more →
      </div>
    </a>
  );
}

function downloadFireCardImage(opts: {
  siteName: string;
  fireNumberText: string;
  yearsToFIText: string;
  fiAgeText: string;
  targetText?: string;
}) {
  const { siteName, fireNumberText, yearsToFIText, fiAgeText, targetText } = opts;

  const w = 1200;
  const h = 630;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background gradient (dark)
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#071022");
  grad.addColorStop(1, "#0b1a2f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Card container
  const pad = 70;
  const cardX = pad;
  const cardY = pad;
  const cardW = w - pad * 2;
  const cardH = h - pad * 2;

  // Rounded rect
  const r = 28;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(cardX + r, cardY);
  ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, r);
  ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, r);
  ctx.arcTo(cardX, cardY + cardH, cardX, cardY, r);
  ctx.arcTo(cardX, cardY, cardX + cardW, cardY, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.fillStyle = "rgba(226,232,240,0.95)";
  ctx.font = "700 48px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("My FIRE Results", cardX + 52, cardY + 90);

  // Subhead
  ctx.fillStyle = "rgba(148,163,184,0.95)";
  ctx.font = "400 26px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("Financial Independence timeline estimate", cardX + 52, cardY + 135);

  // Divider line
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 52, cardY + 170);
  ctx.lineTo(cardX + cardW - 52, cardY + 170);
  ctx.stroke();

  // Big number
  ctx.fillStyle = "rgba(52,211,153,0.95)"; // emerald-ish
  ctx.font = "800 70px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(fireNumberText, cardX + 52, cardY + 265);

  // Labels
  ctx.fillStyle = "rgba(226,232,240,0.95)";
  ctx.font = "700 28px system-ui, -apple-system, Segoe UI, Roboto, Arial";

  // Left column
  const leftX = cardX + 52;
  const row1Y = cardY + 345;
  const row2Y = cardY + 410;
  const row3Y = cardY + 475;

  ctx.fillText("Years to FI", leftX, row1Y);
  ctx.fillText("Age at FI", leftX, row2Y);

  // Values
  ctx.fillStyle = "rgba(226,232,240,0.90)";
  ctx.font = "600 34px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(yearsToFIText, leftX + 240, row1Y);
  ctx.fillText(fiAgeText, leftX + 240, row2Y);

  // Optional target line
  if (targetText) {
    ctx.fillStyle = "rgba(226,232,240,0.85)";
    ctx.font = "600 30px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(targetText, leftX, row3Y);
  }

  // Footer
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  ctx.fillStyle = "rgba(148,163,184,0.95)";
  ctx.font = "500 22px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(`${siteName} • ${today}`, cardX + 52, cardY + cardH - 52);

  // Tiny watermark right
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(148,163,184,0.75)";
  ctx.fillText("Shareable FIRE Card", cardX + cardW - 52, cardY + cardH - 52);
  ctx.textAlign = "left";

  // Download
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "fire-result.png";
  a.click();
}

export default function FireCalculator({
  initialIncome = 0,
}: FireCalculatorProps) {
const [inputs, setInputs] = useState<Inputs>(() => ({
  ...DEFAULT_INPUTS,
  income: initialIncome,
}));

  const annualExp = useMemo(() => annualExpenses(inputs), [inputs.expensesMonthly]);

  // Net annual after taxes (if state not selected, fall back to gross so UI still works)
  const netAnnual = useMemo(() => {
    if (!inputs.state) return Math.max(0, inputs.income);
    return estimateNetAnnual({
      grossAnnual: inputs.income,
      state: inputs.state as StateCode,
      filing: inputs.filingStatus,
      k401Pct: inputs.k401Pct,
    });
  }, [inputs.income, inputs.state, inputs.filingStatus, inputs.k401Pct]);

  const estTaxRate = useMemo(() => {
    if (!inputs.state) return 0;
    return effectiveTaxRatePct(netAnnual, inputs.income);
  }, [inputs.state, netAnnual, inputs.income]);

  // Savings rate uses NET income + annual expenses
  const savingsRate = useMemo(() => {
    const s = (netAnnual - annualExp) / Math.max(1, netAnnual);
    return clamp(s, -1, 1);
  }, [netAnnual, annualExp]);

  const result = useMemo(() => simulateYearsToFI(inputs, netAnnual), [inputs, netAnnual]);

  const fiAge = useMemo(() => {
    if (result.yearsToFI === null) return null;
    return inputs.age + result.yearsToFI;
  }, [inputs.age, result.yearsToFI]);

  const fiYear = useMemo(() => {
    if (result.yearsToFI === null) return null;
    return new Date().getFullYear() + result.yearsToFI;
  }, [result.yearsToFI]);

  const projection = useMemo(
    () => buildProjection(inputs, netAnnual, result.yearsToFI),
    [inputs, netAnnual, result.yearsToFI]
  );

  const targetDelta = useMemo(() => {
    if (!inputs.advanced) return null;
    if (result.yearsToFI === null) return null;
    const targetYears = inputs.targetFireAge - inputs.age;
    return result.yearsToFI - targetYears; // + behind, - ahead
  }, [inputs.advanced, inputs.targetFireAge, inputs.age, result.yearsToFI]);

  const progress = useMemo(() => {
    const current = Number(result.startPortfolio);
    const target = Number(result.fireNumber);
    const p = target > 0 && Number.isFinite(target) ? clamp(current / target, 0, 1) : 0;
    return { current, target, pct: p };
  }, [result.startPortfolio, result.fireNumber]);

  // Move Impact (NYC vs Raleigh) — expenses override is ANNUAL base
  const movedResult = useMemo(() => {
    if (!inputs.moveCompareOn) return null;
    return simulateYearsToFI(inputs, netAnnual, { expensesAnnualBase: annualMovedExpenses(inputs) });
  }, [inputs, netAnnual]);

  const movedFiAge = useMemo(() => {
    if (!movedResult || movedResult.yearsToFI === null) return null;
    return inputs.age + movedResult.yearsToFI;
  }, [inputs.age, movedResult]);

  const moveDeltaYears = useMemo(() => {
    if (!inputs.moveCompareOn) return null;
    if (fiAge === null || movedFiAge === null) return null;
    return fiAge - movedFiAge; // positive means moving is faster
  }, [inputs.moveCompareOn, fiAge, movedFiAge]);

  function applyPreset(p: Preset) {
    if (p === "lean") {
      setInputs((s) => ({
        ...s,
        preset: "lean",
        expensesMonthly: s.expensesMonthly || 3000,
        withdrawalRatePct: 4,

      }));
      return;
    }
    if (p === "fat") {
      setInputs((s) => ({
        ...s,
        preset: "fat",
        expensesMonthly: s.expensesMonthly || 10000,
        withdrawalRatePct: 3.5,
      }));
      return;
    }
    setInputs((s) => ({ ...s, preset: "custom" }));
  }

    const viralCityResults = useMemo(() => {
    const baseAnnualExpenses = annualExpenses(inputs);

    return VIRAL_COMPARE_CITIES.map((cityId) => {
      const city = findCity(cityId);
      if (!city) return null;

      const adjustedExpenses = expenseAdjustedForCity(baseAnnualExpenses, cityId);
      const sim = simulateYearsToFI(inputs, netAnnual, {
        expensesAnnualBase: adjustedExpenses,
      });

      const ageAtFI =
        sim.yearsToFI === null ? null : inputs.age + sim.yearsToFI;

      return {
        cityId,
        cityName: city.name,
        state: city.state.toUpperCase(),
        ageAtFI,
        yearsToFI: sim.yearsToFI,
      };
    }).filter(Boolean);
  }, [inputs, netAnnual]);


  // Savings Rate → FIRE Table (uses NET income)
  const savingsTable = useMemo(() => {
    const income = netAnnual;
    const baseAge = inputs.age;

    const rates = [10, 20, 30, 40, 50, 60, 70];
    return rates.map((rPct) => {
      const r = rPct / 100;
      const impliedExpenses = Math.max(0, income * (1 - r));
      const sim = income > 0 ? simulateYearsToFI(inputs, netAnnual, { expensesAnnualBase: impliedExpenses }) : null;

      const years = sim?.yearsToFI ?? null;
      const ageAtFi = years === null || !Number.isFinite(baseAge) ? null : baseAge + years;

      return { savingsRatePct: rPct, impliedExpenses, yearsToFI: years, ageAtFI: ageAtFi };
    });
  }, [inputs, netAnnual]);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Inputs */}
     <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">Inputs</div>
            <div className="text-xs text-slate-300">
              Use after-tax income if you want the cleanest “years to FI” estimate.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">


            <button
              onClick={() => applyPreset("custom")}
              className={[
                "rounded-xl px-3 py-2 text-xs font-medium border",
                inputs.preset === "custom"
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
              ].join(" ")}
            >
              Custom
            </button>

            <button
              onClick={() => setInputs((s) => ({ ...s, advanced: !s.advanced }))}
              className={[
                "rounded-xl px-3 py-2 text-xs font-medium border",
                inputs.advanced
                  ? "border-violet-300/40 bg-violet-300/10 text-violet-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
              ].join(" ")}
            >
              {inputs.advanced ? "Advanced: ON" : "Advanced: OFF"}
            </button>

            <button
              onClick={() => setInputs(DEFAULT_INPUTS)}
              className="rounded-xl px-3 py-2 text-xs font-medium border border-red-300/40 bg-red-300/10 text-red-200 hover:bg-red-300/20"
            >
              ↺ Reset
            </button>
          </div>
        </div>
                <div className="mt-5 grid gap-y-3 gap-x-4 sm:grid-cols-2">
          <Field
            label="Current age"
            value={inputs.age}
            onChange={(v) => setInputs((s) => ({ ...s, age: clamp(v, 0, 100) }))}
          />

          <Field
            label="Annual income"
            value={inputs.income}
            onChange={(v) => setInputs((s) => ({ ...s, income: clamp(v, 0, 2_000_000) }))}
            prefix="$"
          />

          {/* State dropdown (no default) */}
          <label className="block">
            <div className="pt-[2px] mb-0.5 text-[11px] leading-tight font-medium text-slate-300">State (for taxes)</div>
            <select
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white shadow-inner outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10"
              value={inputs.state}
              onChange={(e) => setInputs((s) => ({ ...s, state: e.target.value as StateChoice }))}
            >
              <option value="" disabled className="bg-slate-900 text-white">
                Select a state…
              </option>
              {STATES.map((st) => (
                <option key={st.code} value={st.code} className="bg-slate-900 text-white">
                  {st.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="pt-[2px] mb-0.5 text-[11px] leading-tight font-medium text-slate-300">Filing status</div>
            <select
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white shadow-inner outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10"
              value={inputs.filingStatus}
              onChange={(e) => setInputs((s) => ({ ...s, filingStatus: e.target.value as FilingStatus }))}
            >
              <option value="single" className="bg-slate-900 text-white">
                Single
              </option>
              <option value="married" className="bg-slate-900 text-white">
                Married
              </option>
            </select>
          </label>

          <Field
            label="401(k) contribution % (optional)"
            value={inputs.k401Pct}
            onChange={(v) => setInputs((s) => ({ ...s, k401Pct: clamp(v, 0, 60) }))}
            suffix="%"
          />

          <Field
            label="Monthly expenses"
            value={inputs.expensesMonthly}
            onChange={(v) => setInputs((s) => ({ ...s, expensesMonthly: clamp(v, 0, 200_000) }))}
            prefix="$"
          />

          <div className="-mt-1 text-xs text-slate-400 sm:col-start-2">
            That’s about{" "}
            <span className="font-semibold text-slate-200">{money(annualExp, 0)}</span> / year
          </div>

          {/* Convenience fields (ALWAYS shown).
              In advanced mode these will auto-fill brokerage if brokerage is still 0. */}
          <Field
            label="Current savings / investments (quick fill)"
            value={inputs.currentPortfolio}
            onChange={(v) =>
              setInputs((s) => {
                const next = { ...s, currentPortfolio: clamp(v, 0, 20_000_000) };
                if (next.advanced && next.balBrokerage === 0 && next.currentPortfolio > 0) {
                  next.balBrokerage = next.currentPortfolio;
                }
                return next;
              })
            }
            prefix="$"
          />

          <Field
            label="Yearly investment (quick fill)"
            value={inputs.yearlyInvestment}
            onChange={(v) =>
              setInputs((s) => {
                const next = { ...s, yearlyInvestment: clamp(v, 0, 5_000_000) };
                if (next.advanced && next.contribBrokerage === 0 && next.yearlyInvestment > 0) {
                  next.contribBrokerage = next.yearlyInvestment;
                }
                return next;
              })
            }
            prefix="$"
          />

          {inputs.advanced ? (
            <>
              <div className="sm:col-span-2 mt-2 text-xs font-semibold tracking-widest text-slate-300/80">
                ACCOUNT BALANCES
              </div>

              <Field
                label="401(k) balance"
                value={inputs.bal401k}
                onChange={(v) => setInputs((s) => ({ ...s, bal401k: clamp(v, 0, 50_000_000) }))}
                prefix="$"
              />
              <Field
                label="IRA balance"
                value={inputs.balIra}
                onChange={(v) => setInputs((s) => ({ ...s, balIra: clamp(v, 0, 50_000_000) }))}
                prefix="$"
              />
              <Field
                label="Brokerage balance"
                value={inputs.balBrokerage}
                onChange={(v) => setInputs((s) => ({ ...s, balBrokerage: clamp(v, 0, 50_000_000) }))}
                prefix="$"
              />

              <div className="sm:col-span-2 mt-2 text-xs font-semibold tracking-widest text-slate-300/80">
                YEARLY CONTRIBUTIONS
              </div>

              <Field
                label="401(k) yearly contribution"
                value={inputs.contrib401k}
                onChange={(v) => setInputs((s) => ({ ...s, contrib401k: clamp(v, 0, 500_000) }))}
                prefix="$"
              />
              <Field
                label="IRA yearly contribution"
                value={inputs.contribIra}
                onChange={(v) => setInputs((s) => ({ ...s, contribIra: clamp(v, 0, 500_000) }))}
                prefix="$"
              />
              <Field
                label="Brokerage yearly contribution"
                value={inputs.contribBrokerage}
                onChange={(v) =>
                  setInputs((s) => ({ ...s, contribBrokerage: clamp(v, 0, 5_000_000) }))
                }
                prefix="$"
              />

              <div className="sm:col-span-2 mt-2 text-xs font-semibold tracking-widest text-slate-300/80">
                TARGETING
              </div>

              <Field
                label="Target FIRE age"
                value={inputs.targetFireAge}
                onChange={(v) => setInputs((s) => ({ ...s, targetFireAge: clamp(v, inputs.age, 100) }))}
              />
            </>
          ) : null}

          <Field
            label="Expected annual return (%) — Phase 1"
            value={inputs.annualReturnPct}
            onChange={(v) => setInputs((s) => ({ ...s, annualReturnPct: clamp(v, 0, 15) }))}
            suffix="%"
          />

          <Field
            label="Withdrawal rate (%)"
            value={inputs.withdrawalRatePct}
            onChange={(v) => setInputs((s) => ({ ...s, withdrawalRatePct: clamp(v, 2, 6) }))}
            suffix="%"
          />

          <Field
            label="Inflation (%) — expenses grow"
            value={inputs.inflationPct}
            onChange={(v) => setInputs((s) => ({ ...s, inflationPct: clamp(v, 0, 10) }))}
            suffix="%"
          />

          <Field
            label="Salary growth (%) — income grows"
            value={inputs.salaryGrowthPct}
            onChange={(v) => setInputs((s) => ({ ...s, salaryGrowthPct: clamp(v, 0, 15) }))}
            suffix="%"
          />

          <Field
            label="Phase 2 starts after (years)"
            value={inputs.phase2StartsYear}
            onChange={(v) => setInputs((s) => ({ ...s, phase2StartsYear: clamp(v, 0, 80) }))}
          />

          <Field
            label="Expected annual return (%) — Phase 2"
            value={inputs.phase2ReturnPct}
            onChange={(v) => setInputs((s) => ({ ...s, phase2ReturnPct: clamp(v, 0, 15) }))}
            suffix="%"
          />

          <Field
            label="Max years to simulate"
            value={inputs.maxYears}
            onChange={(v) => setInputs((s) => ({ ...s, maxYears: clamp(v, 1, 80) }))}
          />

          <div className="sm:col-span-2 mt-2 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-widest text-slate-300/80">
                  MOVE IMPACT
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Compare your FIRE age in NYC vs Raleigh by changing expenses.
                </div>
              </div>

              <button
                onClick={() => setInputs((s) => ({ ...s, moveCompareOn: !s.moveCompareOn }))}
                className={[
                  "rounded-xl px-3 py-2 text-xs font-medium border",
                  inputs.moveCompareOn
                    ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
                ].join(" ")}
              >
                {inputs.moveCompareOn ? "Move Compare: ON" : "Move Compare: OFF"}
              </button>
            </div>

            {inputs.moveCompareOn ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Monthly expenses in Raleigh"
                  value={inputs.movedExpensesMonthly}
                  onChange={(v) =>
                    setInputs((s) => ({ ...s, movedExpensesMonthly: clamp(v, 0, 200_000) }))
                  }
                  prefix="$"
                />
                <div className="text-xs text-slate-400 self-end">
                  Tip: set this using your relocation calculator’s “after move” estimate.
                  <div className="mt-1">
                    Annual:{" "}
                    <span className="font-semibold text-slate-200">
                      {money(annualMovedExpenses(inputs), 0)}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-slate-300">Savings rate (net income vs expenses):</div>
          <div className="mt-1 text-lg font-semibold">{pct(savingsRate, 1)}</div>
          <div className="mt-2 text-xs text-slate-400">
            Net income:{" "}
            <span className="font-semibold text-slate-200">{money(netAnnual, 0)}</span>
            {inputs.state ? (
              <>
                {" "}
                <span className="text-slate-500">•</span> Est. tax rate:{" "}
                <span className="font-semibold text-slate-200">{estTaxRate.toFixed(1)}%</span>
              </>
            ) : (
              <>
                {" "}
                <span className="text-slate-500">•</span> Select a state to estimate taxes
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="text-sm font-semibold">Results</div>

          <div className="mt-4 grid gap-3">
            <AdSenseBlock
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP || ""}
              className="rounded-xl border border-white/10 bg-black/20 p-3"
            />

            <Stat
              label="FIRE number"
              value={Number.isFinite(result.fireNumber) ? money(result.fireNumber, 0) : "—"}
              helper={`Inflation-adjusted expenses ÷ ${inputs.withdrawalRatePct}%`}
            />

            <Stat
              label="Years to FI"
              value={result.yearsToFI === null ? "Not reached" : `${result.yearsToFI} years`}
              helper={
                result.yearsToFI === null
                  ? `Not hit within ${inputs.maxYears} years`
                  : `Projected FI year: ${fiYear}`
              }
            />

            <Stat label="Age at FI" value={fiAge === null ? "—" : `${fiAge}`} helper="Approximate" />

            {inputs.advanced ? (
              <Stat
                label="Target tracking"
                value={
                  result.yearsToFI === null || targetDelta === null
                    ? "—"
                    : targetDelta <= 0
                      ? `${Math.abs(targetDelta)} yrs ahead`
                      : `${targetDelta} yrs behind`
                }
                helper={`Target FIRE age: ${inputs.targetFireAge}`}
              />
            ) : null}

            {/* Share Result */}
<button
  onClick={() => {
    const text = `
🔥 My FIRE Results

FIRE Number: ${money(result.fireNumber)}
Years to FI: ${result.yearsToFI ?? "Not reached"}
Age at FI: ${fiAge ?? "—"}

Calculated on RelocationByNumbers.com
`;
    navigator.clipboard.writeText(text);
  }}
  className="relative z-50 w-full rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/20 transition"
>
Share My FIRE Result
</button>

<AdSenseBlock
  slot={ADSENSE_SLOT_RESULTS}
  className="rounded-xl border border-white/10 bg-black/20 p-3"
/>

{inputs.moveCompareOn ? (
  <>
    <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-4">
      <div className="text-xs font-semibold tracking-widest text-emerald-100">
        MOVE IMPACT
      </div>

      <div className="mt-3 grid gap-2 text-sm text-emerald-50">
        <div className="flex items-center justify-between gap-3">
          <span className="text-emerald-100/80">Current FIRE age (NYC)</span>
          <span className="font-semibold">{fiAge === null ? "—" : fiAge}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-emerald-100/80">FIRE age in Raleigh</span>
          <span className="font-semibold">{movedFiAge === null ? "—" : movedFiAge}</span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-emerald-100/80">Moving accelerates FIRE by</span>
          <span className="font-semibold">
            {moveDeltaYears === null
              ? "—"
              : moveDeltaYears > 0
                ? `${moveDeltaYears} years`
                : moveDeltaYears === 0
                  ? "0 years"
                  : `${Math.abs(moveDeltaYears)} years slower`}
          </span>
        </div>

        <div className="mt-2 text-xs text-emerald-100/70">
          Same returns + salary growth assumptions, different expenses.
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
      <div className="text-sm font-semibold text-emerald-100">
        Thinking bigger than just moving?
      </div>
      <div className="mt-1 text-sm text-emerald-100/80">
        See how a lower cost of living could shift your FIRE timeline.
      </div>
      <div className="mt-4">
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
        >
          Compare cities →
        </a>
      </div>
    </div>
  </>
) : null}

{/* Viral feature card */}
<div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
  <div className="text-sm font-semibold text-amber-100">
    🔥 Your FIRE age if you moved
  </div>
  <div className="mt-1 text-xs text-amber-100/80">
    Same income and investing assumptions, different city cost profile.
  </div>

  <div className="mt-4 space-y-2">
    {viralCityResults.map((row) => (
      <div
        key={row!.cityId}
        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
      >
        <div className="text-slate-200">
          {row!.cityName}, {row!.state}
        </div>
        <div className="font-semibold text-white">
          {netAnnual <= 0 || annualExpenses(inputs) <= 0 || inputs.age <= 0
            ? "Enter inputs"
            : row!.ageAtFI === null
              ? "Not reached"
              : `FIRE at ${row!.ageAtFI}`}
        </div>
      </div>
    ))}
  </div>
</div>

<div className="rounded-xl border border-white/10 bg-black/20 p-4">
  <div className="flex items-center justify-between">
    <div className="text-xs font-medium text-slate-300">Progress to FIRE</div>
    <div className="text-xs text-slate-400">
      {money(progress.current, 0)} /{" "}
      {Number.isFinite(progress.target) ? money(progress.target, 0) : "—"}
    </div>
  </div>

  <div className="mt-3 h-2 w-full rounded-full bg-white/10">
    <div
      className="h-2 rounded-full bg-emerald-300"
      style={{ width: `${Math.round(progress.pct * 100)}%` }}
    />
  </div>
  <div className="mt-2 text-xs text-slate-400">{Math.round(progress.pct * 100)}% funded</div>
</div>

<div className="rounded-xl border border-white/10 bg-black/20 p-4">
  <div className="flex items-center justify-between">
    <div className="text-xs font-medium text-slate-300">Portfolio projection</div>
    <div className="text-xs text-slate-400">
      {projection.length > 0
        ? `From age ${projection[0].age} → ${projection[projection.length - 1].age}`
        : ""}
    </div>
  </div>

  <div className="mt-3 h-44 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={projection} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <XAxis dataKey="age" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={70}
          tickFormatter={(v) => {
            const n = Number(v);
            if (!Number.isFinite(n)) return "";
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
            if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
            return `${Math.round(n)}`;
          }}
        />
        <Tooltip
          formatter={(value) => money(Number(value), 0)}
          labelFormatter={(label) => `Age ${label}`}
          contentStyle={{
            background: "rgba(2,6,23,0.9)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            color: "white",
          }}
          itemStyle={{ color: "white" }}
          labelStyle={{ color: "rgba(226,232,240,0.9)" }}
        />
        <ReferenceLine
          y={Number.isFinite(result.fireNumber) ? result.fireNumber : 0}
          stroke="rgba(226,232,240,0.55)"
          strokeDasharray="4 4"
        />
        <Line
          type="monotone"
          dataKey="portfolio"
          stroke="currentColor"
          strokeWidth={2}
          dot={false}
          className="text-emerald-300"
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

  <div className="mt-2 text-xs text-slate-400">Dashed line = your FIRE number.</div>
</div>

<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <div className="text-sm font-semibold text-white">Savings Rate → FIRE Timeline</div>
      <div className="mt-1 text-xs text-slate-400">
        Based on your current investing assumptions. Net income stays the same; expenses adjust to match each savings rate.
      </div>
    </div>
  </div>

  <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
    <div className="grid grid-cols-4 bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-widest text-slate-300/80">
      <div>SAVINGS</div>
      <div>EXPENSES</div>
      <div>YEARS</div>
      <div>FIRE AGE</div>
    </div>

    <div className="divide-y divide-white/10">
      {savingsTable.map((row) => (
        <div
          key={row.savingsRatePct}
          className="grid grid-cols-4 items-center px-3 py-2 text-sm"
        >
          <div className="text-slate-200">{row.savingsRatePct}%</div>
          <div className="text-slate-200">{money(row.impliedExpenses, 0)}</div>
          <div className="text-slate-200">
            {netAnnual <= 0 ? "—" : row.yearsToFI === null ? "Not reached" : row.yearsToFI}
          </div>
          <div className="text-slate-200">
            {netAnnual <= 0 ? "—" : row.ageAtFI === null ? "—" : row.ageAtFI}
          </div>
        </div>
      ))}
    </div>
  </div>

  <div className="mt-3 text-xs text-slate-400">
    Tip: This table becomes most meaningful after you set Income, Monthly Expenses, and either Yearly Investment or the advanced contribution fields.
  </div>
</div>

<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
  <div className="text-sm font-semibold text-white">Start investing toward FIRE</div>
  <div className="mt-1 text-xs text-slate-400">
    These are common platforms people use to invest for long-term goals. (Sponsored links)
  </div>

  <div className="mt-4 grid gap-3 sm:grid-cols-2">
    {AFFILIATES.map((a) => (
      <AffiliateCard key={a.name} a={a} />
    ))}
  </div>
</div>

<AdSenseBlock
  slot={ADSENSE_SLOT_BOTTOM}
  className="rounded-xl border border-white/10 bg-black/20 p-3"
/>


          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, helper }: { label: string; value: ReactNode; helper?: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-300">{label}</div>
        <div className="text-sm font-semibold text-white">{value}</div>
      </div>
      {helper ? <div className="mt-2 text-xs text-slate-400">{helper}</div> : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  return (
    <label className="block">
     <div className="mb-1 text-[11px] leading-tight font-medium text-slate-300">{label}</div>
      <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 shadow-inner transition focus-within:border-emerald-400/50 focus-within:ring-4 focus-within:ring-emerald-400/10">
        {prefix ? <span className="mr-2 text-sm text-slate-400">{prefix}</span> : null}
        <input
          type="text"
          inputMode="numeric"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={() => {
            const n = Number(raw);
            const safe = Number.isFinite(n) ? n : 0;
            onChange(safe);
            setRaw(String(safe));
          }}
        />
        {suffix ? <span className="ml-2 text-sm text-slate-400">{suffix}</span> : null}
      </div>
    </label>
  );
}
