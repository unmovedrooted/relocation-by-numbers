"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import FireEmailCapture from "@/components/FireEmailCapture";
import FireUpsellCard from "@/components/FireUpsellCard";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
} from "recharts";

import { STATES, type StateCode } from "@/lib/states";
import { findCity, citiesForState } from "@/lib/cities";
import { estimateNetAnnual, effectiveTaxRatePct, type FilingStatus } from "@/lib/tax";

// ─────────────────────────────────────────────────────────────────────────────
// FIRE MODE
// ─────────────────────────────────────────────────────────────────────────────

type FireMode = "standard" | "lean" | "coast" | "barista";

function modeFromPathname(p: string): FireMode {
  if (p.includes("lean"))    return "lean";
  if (p.includes("coast"))   return "coast";
  if (p.includes("barista")) return "barista";
  return "standard";
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type FireCalculatorProps = { initialIncome?: number; hideFAQ?: boolean };
type Preset       = "custom" | "lean" | "fat";
type StateChoice  = StateCode | "";

type Inputs = {
  preset:           Preset;
  age:              number;
  income:           number;
  expensesMonthly:  number;
  state:            StateChoice;
  filingStatus:     FilingStatus;
  k401Pct:          number;
  currentPortfolio: number;
  yearlyInvestment: number;
  advanced:         boolean;
  targetFireAge:    number;
  bal401k:          number;
  balIra:           number;
  balBrokerage:     number;
  contrib401k:      number;
  contribIra:       number;
  contribBrokerage: number;
  withdrawalRatePct:number;
  maxYears:         number;
  inflationPct:     number;
  salaryGrowthPct:  number;
  phase2StartsYear: number;
  moveCompareOn:    boolean;
  movedExpensesMonthly: number;
  // ── New: tax treatment ──────────────────────────────
  taxTreatment401k:       "traditional" | "roth";
  taxTreatmentIra:        "traditional" | "roth";
  brokerageTaxMode:       "simple" | "drag";
  brokerageTaxEfficiency: "high" | "medium" | "low";
  brokerageTaxDragPct:    number;
  // ── New: employer match ─────────────────────────────
  employerMatchPct:    number;
  employerMatchCapPct: number;
  // ── New: volatility preset ──────────────────────────
  volatility: "conservative" | "moderate" | "aggressive";
  // ── Coast-specific ──────────────────────────────────
  coastAge:            number;
  targetRetirementAge: number;
  // ── Barista-specific ────────────────────────────────
  baristaPartTimeIncome: number;
  // ── Withdrawal tax rate (Traditional account haircut) ──
  withdrawalTaxRatePct: number;
};

type ComparisonChartRow = {
  age: number;
  currentPortfolio?: number;
  currentSpendablePortfolio?: number;
  currentFireTarget?: number;
  proposedPortfolio?: number;
  proposedSpendablePortfolio?: number;
};

type ChartPoint = {
  age: number;
  portfolio: number;
  spendablePortfolio: number;
  fireTarget?: number;
  leanFireTarget?: number;
  fullFireTarget?: number;
  baristaTarget?: number;
  coastNumber?: number;
};

type Affiliate = { name: string; blurb: string; href: string; tag: string };

// ─────────────────────────────────────────────────────────────────────────────
// DECISION ENGINE TYPES
// ─────────────────────────────────────────────────────────────────────────────

type DecisionScenarioKey =
  | "baseline"
  | "lower_spending"
  | "higher_savings"
  | "move"
  | "later_coast_age"
  | "boost_contributions";

type DecisionProjectionOutput = {
  yearsToGoal: number | null;  // yearsToCoast for coast, yearsToFI for others
  goalAge: number | null;      // coastAge for coast, fiAge for others
  fullFireAge: number | null;
};

type DecisionScenarioResult = {
  key: DecisionScenarioKey;
  label: string;
  yearsToGoal: number | null;
  goalAge: number | null;
  fullFireAge: number | null;
  yearsSavedVsBaseline: number | null;
  explanation: string;
  shortCopy: string;
};

type DecisionEngineResult = {
  baseline: DecisionScenarioResult;
  ranked: DecisionScenarioResult[];
  winner: DecisionScenarioResult | null;
  mode: FireMode;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const VOLATILITY_PRESETS = {
  conservative: { phase1: 5.0, phase2: 4.0 },
  moderate:     { phase1: 7.0, phase2: 5.5 },
  aggressive:   { phase1: 9.0, phase2: 7.0 },
} as const;

const TAX_DRAG_BY_EFFICIENCY = { high: 0.2, medium: 0.5, low: 1.0 } as const;

const VIRAL_COMPARE_CITIES = [
  "nyc-ny", "austin-tx", "raleigh-nc", "charlotte-nc", "denver-co",
] as const;

const ADSENSE_CLIENT        = process.env.NEXT_PUBLIC_ADSENSE_CLIENT        || "";
const ADSENSE_SLOT_RESULTS  = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULTS  || "";
const ADSENSE_SLOT_BOTTOM   = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM   || "";

// ── Mode nav ──────────────────────────────────────────────────────────────────
const MODE_NAV: { mode: FireMode; label: string; href: string }[] = [
  { mode: "standard", label: "FIRE",         href: "/fire-calculator"         },
  { mode: "lean",     label: "Lean FIRE",    href: "/lean-fire-calculator"    },
  { mode: "coast",    label: "Coast FIRE",   href: "/coast-fire-calculator"   },
  { mode: "barista",  label: "Barista FIRE", href: "/barista-fire-calculator" },
];

// ── Mode contextual notes (inside calculator) ─────────────────────────────────
const MODE_NOTES: Record<FireMode, string> = {
  standard: "Estimates the portfolio you need to cover your full lifestyle indefinitely at your chosen withdrawal rate.",
  lean:     "Shows how a lower spending target shrinks the portfolio you need — and how much faster Lean FIRE arrives vs a higher-spending plan.",
  coast:    "Answers a different question: do you already have enough that compound growth alone can carry you to retirement without another dollar contributed?",
  barista:  "Part-time income reduces the gap your portfolio must cover. The lower the gap, the smaller the number — and the sooner you can walk away from full-time work.",
};

// ── Mode-specific affiliates (swap hrefs for real affiliate links later) ──────
const MODE_AFFILIATES: Record<FireMode, Affiliate[]> = {
  standard: [
    { name: "Fidelity",    blurb: "Zero-fee index funds and commission-free trades. A solid foundation for a long-term FIRE portfolio.", href: "#", tag: "Brokerage"   },
    { name: "Vanguard",    blurb: "The original low-cost index fund platform. Built for buy-and-hold FIRE investors.",                   href: "#", tag: "Index funds" },
    { name: "M1 Finance",  blurb: "Automated investing with custom portfolios. Good for hands-off savers on the path to FI.",           href: "#", tag: "Automated"   },
  ],
  lean: [
    { name: "Fidelity",    blurb: "Zero-fee funds — essential when every basis point matters on a lean plan.",          href: "#", tag: "Brokerage"   },
    { name: "Vanguard",    blurb: "Lowest-cost funds available. Critical when a lean budget leaves no room for fees.", href: "#", tag: "Index funds" },
    { name: "Ally Bank",   blurb: "High-yield savings for your emergency fund and cash buffer.",                        href: "#", tag: "HYSA"         },
  ],
  coast: [
    { name: "Fidelity",    blurb: "Strong IRA and brokerage options — ideal once contributions stop and compounding takes over.", href: "#", tag: "Brokerage"    },
    { name: "Vanguard",    blurb: "Low-cost index funds let compounding work without friction in the coast phase.",               href: "#", tag: "Index funds"  },
    { name: "Betterment",  blurb: "Set-and-forget robo-advisor. Once you've coasted, automation does the rest.",                 href: "#", tag: "Robo-advisor" },
  ],
  barista: [
    { name: "Fidelity",       blurb: "Strong IRA and HSA options — important when employer benefits are limited.", href: "#", tag: "Brokerage"  },
    { name: "Stride Health",  blurb: "Find affordable health insurance for self-employed and part-time workers.", href: "#", tag: "Healthcare" },
    { name: "M1 Finance",     blurb: "Automate investing around a part-time schedule with custom portfolio pies.", href: "#", tag: "Automated"  },
  ],
};

// ── Internal FAQs per mode ────────────────────────────────────────────────────
const INTERNAL_FAQS: Record<FireMode, { q: string; a: string }[]> = {
  standard: [
    { q: "Why does location affect my FIRE timeline?",  a: "Location changes two of the biggest drivers: taxes and spending. A lower-cost or lower-tax city can increase how much you keep and reduce how much you need." },
    { q: "Are the tax numbers exact?",                  a: "No. They are simplified estimates based on your state and filing status — for planning comparisons, not tax filing." },
    { q: "Why does my FIRE number change between cities?", a: "Your FIRE number is based on spending. If projected spending changes in a different city, the portfolio needed changes too." },
    { q: "Does Move Impact assume the same salary?",    a: "Yes. It isolates the effect of location — same income and investing assumptions, different expenses." },
  ],
  lean: [
    { q: "What counts as Lean FIRE?",         a: "There's no official threshold. Many use $40,000/year or less as a rough benchmark. The real question is whether the target spending is sustainably low for your life." },
    { q: "Is Lean FIRE risky?",               a: "It leaves less cushion for surprises like healthcare costs. It's most sustainable when paired with flexibility — like the ability to earn a small amount if needed." },
    { q: "How does location help with Lean FIRE?", a: "Lower-cost cities reduce annual spending directly, which shrinks both your FIRE number and the years needed to reach it." },
    { q: "What withdrawal rate should I use?", a: "Many Lean FIRE planners use 3.5% or below for long retirement horizons, since the margin for error is smaller." },
  ],
  coast: [
    { q: "What is the Coast FIRE number?",           a: "The amount you need invested today so compound growth alone — with no new contributions — grows your portfolio to your full FIRE target by retirement age." },
    { q: "How is Coast FIRE different from regular FIRE?", a: "Regular FIRE means you already have enough to fund retirement. Coast FIRE is an earlier milestone — compounding can do the rest, but you still need earned income for current expenses." },
    { q: "What return should I use?",                a: "Many people use 5–7% as a planning range. Small changes matter a lot because Coast FIRE depends heavily on long compounding periods." },
    { q: "Can I stop working after reaching Coast FIRE?", a: "Not necessarily. You still need income to cover current living costs. Coast FIRE only means you can stop contributing to retirement investments." },
  ],
  barista: [
    { q: "What counts as Barista FIRE?",           a: "Working part-time — in any field — to cover some expenses, letting a smaller portfolio cover the rest. The name comes from taking a low-stress job, sometimes one with benefits." },
    { q: "How does part-time income reduce my FIRE number?", a: "It reduces the gap your portfolio must cover. Less gap ÷ withdrawal rate = smaller target." },
    { q: "What about healthcare?",                 a: "Healthcare is the biggest wildcard. Some part-time jobs offer benefits, which can meaningfully reduce financial pressure on your portfolio." },
    { q: "Is Barista FIRE a permanent state?",     a: "Not necessarily. Many use it as a bridge — working part-time while the portfolio grows, eventually transitioning to full FIRE." },
  ],
};

// ── Per-mode default inputs ───────────────────────────────────────────────────
const BASE_DEFAULTS: Inputs = {
  preset: "custom",
  age: 30, income: 90000, expensesMonthly: 4000,
  state: "ny", filingStatus: "single", k401Pct: 8,
  currentPortfolio: 75000, yearlyInvestment: 0,
  advanced: false, targetFireAge: 45,
  bal401k: 0, balIra: 0, balBrokerage: 0,
  contrib401k: 0, contribIra: 0, contribBrokerage: 0,
  withdrawalRatePct: 4, maxYears: 60,
  inflationPct: 2.5, salaryGrowthPct: 3,
  phase2StartsYear: 10,
  moveCompareOn: true, movedExpensesMonthly: 2800,
  taxTreatment401k: "traditional", taxTreatmentIra: "traditional",
  brokerageTaxMode: "simple", brokerageTaxEfficiency: "high", brokerageTaxDragPct: 0.3,
  employerMatchPct: 0, employerMatchCapPct: 6,
  volatility: "moderate",
  coastAge: 40, targetRetirementAge: 65,
  baristaPartTimeIncome: 24000,
  withdrawalTaxRatePct: 15,
};

const MODE_OVERRIDES: Record<FireMode, Partial<Inputs>> = {
  standard: {},
  lean:     { expensesMonthly: 2500, withdrawalRatePct: 3.5, movedExpensesMonthly: 2000 },
  coast:    { coastAge: 40, targetRetirementAge: 65 },
  barista:  { expensesMonthly: 5000, baristaPartTimeIncome: 24000 },
};

function defaultsForMode(mode: FireMode, initialIncome: number): Inputs {
  return {
    ...BASE_DEFAULTS,
    ...MODE_OVERRIDES[mode],
    income: initialIncome > 0 ? initialIncome : BASE_DEFAULTS.income,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }

function money(n: number, digits = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: digits });
}

function pct(n: number, digits = 1) {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

function impactLabel(yearsSaved: number | null) {
  if (yearsSaved === null) return "—";
  if (yearsSaved >= 5)  return `high impact · save ${yearsSaved} years`;
  if (yearsSaved >= 2)  return `medium impact · save ${yearsSaved} years`;
  if (yearsSaved >= 1)  return `helpful · save ${yearsSaved} year`;
  return "limited impact with current inputs";
}

function annualExpensesFromMonthly(m: number)  { return Math.max(0, (Number(m) || 0) * 12); }
function annualExpenses(i: Inputs)             { return annualExpensesFromMonthly(i.expensesMonthly); }
function annualMovedExpenses(i: Inputs)        { return annualExpensesFromMonthly(i.movedExpensesMonthly); }

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS LOGIC
// ─────────────────────────────────────────────────────────────────────────────

function getBaselineCityIdForState(stateCode: StateChoice) {
  if (!stateCode) return "nyc-ny";
  const cities = citiesForState(stateCode as StateCode);
  return (
    cities.find(c => c.tier === "major" && !c.id.startsWith("other-"))?.id ??
    cities.find(c => c.tier === "mid"   && !c.id.startsWith("other-"))?.id ??
    cities.find(c => c.tier === "small" && !c.id.startsWith("other-"))?.id ??
    "nyc-ny"
  );
}

function expenseAdjustedForCity(base: number, targetId: string, baselineId: string) {
  const t = findCity(targetId);
  const b = findCity(baselineId);
  if (!t?.col?.housing || !b?.col?.housing) return base;
  return Math.max(0, base * ((0.4 + 0.6 * t.col.housing) / (0.4 + 0.6 * b.col.housing)));
}

function applyBrokerageAutofill(i: Inputs) {
  const balBrokerage     = i.advanced && i.balBrokerage === 0     && i.currentPortfolio > 0  ? i.currentPortfolio  : i.balBrokerage;
  const contribBrokerage = i.advanced && i.contribBrokerage === 0 && i.yearlyInvestment > 0  ? i.yearlyInvestment  : i.contribBrokerage;
  return { balBrokerage, contribBrokerage };
}

function calcEmployerMatch(i: Inputs): number {
  if (!i.advanced || i.employerMatchPct <= 0) return 0;
  const salary = Number(i.income) || 0;
  const contribPct = salary > 0 ? (i.contrib401k / salary) * 100 : 0;
  return (Math.min(contribPct, i.employerMatchCapPct) / 100) * (i.employerMatchPct / 100) * salary;
}

function getBrokerageTaxDrag(i: Inputs): number {
  if (i.brokerageTaxMode === "drag") return i.brokerageTaxDragPct / 100;
  return TAX_DRAG_BY_EFFICIENCY[i.brokerageTaxEfficiency] / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUCKET ARCHITECTURE
// Each account (401k, IRA, brokerage) is tracked separately through the
// simulation. This means:
//   - Employer match goes into the 401k bucket only
//   - Brokerage tax drag is applied to brokerage growth only
//   - Traditional haircut uses year-N balances, not year-0 inputs
// ─────────────────────────────────────────────────────────────────────────────

type Buckets = { b401k: number; bIra: number; bBrokerage: number };

function totalFromBuckets(b: Buckets): number {
  return b.b401k + b.bIra + b.bBrokerage;
}

// Spendable value using year-N bucket balances (not frozen year-0 inputs).
// Traditional accounts get a withdrawal tax haircut.
// Roth accounts and brokerage are post-tax — no haircut.
function calcSpendableFromBuckets(i: Inputs, b: Buckets): number {
  const wTax = (Number(i.withdrawalTaxRatePct) || 0) / 100;
  const sp401k = i.taxTreatment401k === "traditional" ? b.b401k * (1 - wTax) : b.b401k;
  const spIra  = i.taxTreatmentIra   === "traditional" ? b.bIra  * (1 - wTax) : b.bIra;
  return sp401k + spIra + b.bBrokerage;
}

// Starting balances and per-bucket annual contributions.
// Simple mode: everything goes into the brokerage bucket (no account distinction).
// Advanced mode: each account is seeded from user inputs.
function initBuckets(i: Inputs, netAnnualBase: number): {
  start: Buckets;
  annualContrib: Buckets;
  employerMatch: number;
} {
  const { balBrokerage, contribBrokerage } = applyBrokerageAutofill(i);
  const match = calcEmployerMatch(i);

  if (!i.advanced) {
    const autoInvest = Math.max(0, netAnnualBase - annualExpenses(i));
    const contrib    = i.yearlyInvestment > 0 ? i.yearlyInvestment : autoInvest;
    return {
      start:         { b401k: 0, bIra: 0, bBrokerage: i.currentPortfolio },
      annualContrib: { b401k: 0, bIra: 0, bBrokerage: contrib },
      employerMatch: 0,
    };
  }

  return {
    start:         { b401k: i.bal401k, bIra: i.balIra, bBrokerage: balBrokerage },
    annualContrib: { b401k: i.contrib401k, bIra: i.contribIra, bBrokerage: contribBrokerage },
    employerMatch: match,
  };
}

// Grow all three buckets by one year.
//   401k / IRA:  base return (tax-deferred — no annual drag)
//   Brokerage:   base return minus tax drag (drag applied each year on gains)
//   Employer match flows into the 401k bucket only.
//   autoContrib is only used in simple mode when yearlyInvestment is blank.
function growBuckets(
  b: Buckets,
  i: Inputs,
  yearIndex: number,
  annualContrib: Buckets,
  employerMatch: number,
  pastCoast: boolean,
  autoContrib: number,
): Buckets {
  const r    = returnForYear(i, yearIndex);
  const drag = getBrokerageTaxDrag(i);

  const c401k      = pastCoast ? 0 : annualContrib.b401k + employerMatch;
  const cIra       = pastCoast ? 0 : annualContrib.bIra;
  const cBrokerage = pastCoast ? 0 : (i.advanced ? annualContrib.bBrokerage : autoContrib);

 const brokerageReturn = Math.max(-0.99, r - drag);

return {
  b401k: b.b401k * (1 + r) + Math.max(0, c401k),
  bIra: b.bIra * (1 + r) + Math.max(0, cIra),
  bBrokerage: b.bBrokerage * (1 + brokerageReturn) + Math.max(0, cBrokerage),
};
}

// Base nominal return from volatility preset — used by growBuckets.
function returnForYear(i: Inputs, yearIndex: number): number {
  const y       = Math.max(0, yearIndex);
  const switchAt = clamp(Number(i.phase2StartsYear) || 0, 0, 200);
  const p       = VOLATILITY_PRESETS[i.volatility];
  return (y >= switchAt ? p.phase2 : p.phase1) / 100;
}

// ── Coast FIRE number (fixed real-return formula) ─────────────────────────────
function calcCoastFireNumber(i: Inputs): number {
  const swr  = (Number(i.withdrawalRatePct) || 0) / 100;
  const r    = VOLATILITY_PRESETS[i.volatility].phase1 / 100;
  const infl = (Number(i.inflationPct) || 0) / 100;
  const yrs  = Math.max(0, i.targetRetirementAge - i.coastAge);
  const currentAnnualExpenses = annualExpenses(i);
const retirementAnnualExpenses =
  currentAnnualExpenses * Math.pow(1 + infl, yrs);

const futureFireNumber =
  swr > 0 ? retirementAnnualExpenses / swr : Infinity;
  // Correct real return: ((1 + nominal) / (1 + inflation)) - 1
  const realReturn = ((1 + r) / (1 + infl)) - 1;
  return futureFireNumber / Math.pow(1 + realReturn, yrs);
}

// ── Core simulation — all 4 modes ────────────────────────────────────────────
function simulateYearsToFI(
  i: Inputs,
  netAnnualBase: number,
  mode: FireMode = "standard",
  override?: { expensesAnnualBase?: number }
) {
  const swr  = (Number(i.withdrawalRatePct) || 0) / 100;
  const infl = (Number(i.inflationPct) || 0) / 100;
  const salG = (Number(i.salaryGrowthPct) || 0) / 100;

  const rawExpenses  = override?.expensesAnnualBase ?? annualExpenses(i);
  const baseExpenses = mode === "barista"
    ? Math.max(0, rawExpenses - (Number(i.baristaPartTimeIncome) || 0))
    : rawExpenses;

  const { start, annualContrib, employerMatch } = initBuckets(i, netAnnualBase);
  let buckets = { ...start };
  let years   = 0;

  const fire0 = swr > 0 ? baseExpenses / swr : Infinity;
 if (calcSpendableFromBuckets(i, buckets) >= fire0) {
  return {
    fireNumber: fire0,
    yearsToFI: 0 as number,
    endPortfolio: totalFromBuckets(buckets),
    endSpendablePortfolio: calcSpendableFromBuckets(i, buckets),
    startPortfolio: totalFromBuckets(start),
    startSpendablePortfolio: calcSpendableFromBuckets(i, start),
  };
}

while (years < i.maxYears) {
  const netY = netAnnualBase * Math.pow(1 + salG, years);
  const ageY = i.age + years;
  const pastCoast = mode === "coast" && ageY >= i.coastAge;

  let autoContrib = 0;
  if (!i.advanced && (Number(i.yearlyInvestment) || 0) <= 0) {
    const expThisYear = baseExpenses * Math.pow(1 + infl, years);
    autoContrib = Math.max(0, netY - expThisYear);
  }

  buckets = growBuckets(buckets, i, years, annualContrib, employerMatch, pastCoast, autoContrib);
  years++;

  const expAtEndOfYear = baseExpenses * Math.pow(1 + infl, years);
  const fireTarget = swr > 0 ? expAtEndOfYear / swr : Infinity;

  if (calcSpendableFromBuckets(i, buckets) >= fireTarget) break;
}

  const expEnd = baseExpenses * Math.pow(1 + infl, years);
const fireEnd = swr > 0 ? expEnd / swr : Infinity;

return {
  fireNumber: fireEnd,
  yearsToFI: calcSpendableFromBuckets(i, buckets) >= fireEnd ? years : (null as number | null),
  endPortfolio: totalFromBuckets(buckets),
  endSpendablePortfolio: calcSpendableFromBuckets(i, buckets),
  startPortfolio: totalFromBuckets(start),
  startSpendablePortfolio: calcSpendableFromBuckets(i, start),
};
}
// ── Years until coast-ready ───────────────────────────────────────────────────
// Coast uses raw total portfolio (not spendable) because the coast number
// is an accumulation threshold, not a retirement spending threshold.
function simulateYearsToCoast(i: Inputs, netAnnualBase: number): number | null {
  const target = calcCoastFireNumber(i);
  if (!Number.isFinite(target)) return null;

  const { start, annualContrib, employerMatch } = initBuckets(i, netAnnualBase);
  let buckets = { ...start };

  if (totalFromBuckets(buckets) >= target) return 0;

  let years = 0;
  while (years < i.maxYears) {
    const netY = netAnnualBase * Math.pow(1 + (i.salaryGrowthPct / 100), years);
    let autoContrib = 0;
    if (!i.advanced && (Number(i.yearlyInvestment) || 0) <= 0) {
      autoContrib = Math.max(0, netY - annualExpenses(i));
    }
    buckets = growBuckets(buckets, i, years, annualContrib, employerMatch, false, autoContrib);
    years++;
    if (totalFromBuckets(buckets) >= target) return years;
  }
  return null;
}

// ── Projection builders ───────────────────────────────────────────────────────
function buildProjectionWithExpenses(
  i: Inputs, netAnnualBase: number, yearsToFI: number | null,
  baseExpenses: number, mode: FireMode = "standard"
): ChartPoint[] {
  const infl = (Number(i.inflationPct) || 0) / 100;
  const salG = (Number(i.salaryGrowthPct) || 0) / 100;
  const swr  = (Number(i.withdrawalRatePct) || 0) / 100;

  const { start, annualContrib, employerMatch } = initBuckets(i, netAnnualBase);
  const effBase  = mode === "barista" ? Math.max(0, baseExpenses - (Number(i.baristaPartTimeIncome) || 0)) : baseExpenses;
  const stopAt   = yearsToFI === null ? i.maxYears : clamp(yearsToFI + 2, 0, i.maxYears);
  const coastNum = mode === "coast" ? calcCoastFireNumber(i) : undefined;

  const pts: ChartPoint[] = [];
  let buckets = { ...start };

 function makePoint(age: number, b: Buckets, y: number): ChartPoint {
  const portfolio = totalFromBuckets(b);
  const spendablePortfolio = calcSpendableFromBuckets(i, b);
  const expY = baseExpenses * Math.pow(1 + infl, y);
  const effExpY = effBase * Math.pow(1 + infl, y);
  const fullTgt = swr > 0 ? expY / swr : Infinity;
  const effTgt = swr > 0 ? effExpY / swr : Infinity;

  return {
    age,
    portfolio,
    spendablePortfolio,
    ...(mode === "standard" ? { fireTarget: fullTgt } : {}),
    ...(mode === "lean" ? { leanFireTarget: effTgt, fullFireTarget: fullTgt } : {}),
    ...(mode === "coast" ? { fireTarget: fullTgt, coastNumber: coastNum } : {}),
    ...(mode === "barista" ? { baristaTarget: effTgt, fullFireTarget: fullTgt } : {}),
  };
}

  pts.push(makePoint(i.age, buckets, 0));

  for (let y = 1; y <= stopAt; y++) {
    const effExpY   = effBase * Math.pow(1 + infl, y - 1);
    const netY      = netAnnualBase * Math.pow(1 + salG, y - 1);
    const ageY      = i.age + (y - 1);
    const pastCoast = mode === "coast" && ageY >= i.coastAge;

    let autoContrib = 0;
    if (!i.advanced && (Number(i.yearlyInvestment) || 0) <= 0) {
      autoContrib = Math.max(0, netY - effExpY);
    }

    buckets = growBuckets(buckets, i, y - 1, annualContrib, employerMatch, pastCoast, autoContrib);
    pts.push(makePoint(i.age + y, buckets, y));
  }
  return pts;
}

function buildProjection(i: Inputs, netAnnualBase: number, yearsToFI: number | null, mode: FireMode = "standard") {
  return buildProjectionWithExpenses(i, netAnnualBase, yearsToFI, annualExpenses(i), mode);
}

// ─────────────────────────────────────────────────────────────────────────────
// MONETIZATION: UNDER-INVESTED NUDGE
// ─────────────────────────────────────────────────────────────────────────────

function getUnderinvestedNudge(i: Inputs, mode: FireMode): string | null {
  if (!i.advanced) return null;
  const { balBrokerage } = applyBrokerageAutofill(i);
  const salary = Number(i.income) || 0;

  if (i.bal401k === 0 && i.balIra === 0 && salary > 50000)
    return "You have no tax-advantaged accounts. A 401(k) or IRA could reduce tax drag and meaningfully accelerate your timeline.";

  if (i.employerMatchPct > 0 && i.contrib401k === 0)
    return `You may be leaving free employer match on the table — worth up to ${money(calcEmployerMatch(i), 0)}/year at your salary.`;

  if (balBrokerage > 0 && i.bal401k === 0 && i.balIra === 0)
    return "Your entire portfolio is in a taxable brokerage. Adding tax-sheltered accounts (401k or IRA) can reduce annual drag over a long compounding period.";

  if (mode === "barista" && (Number(i.baristaPartTimeIncome) || 0) > 0)
    return "Part-time work often means no employer healthcare. Budget for this separately — it's one of the biggest wildcards in Barista FIRE.";

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DECISION ENGINE LOGIC
// ─────────────────────────────────────────────────────────────────────────────

function getDecisionScenarioCopy(
  key: DecisionScenarioKey,
  mode: FireMode
): { explanation: string; shortCopy: string } {
  switch (key) {
    case "lower_spending":
      return {
        explanation:
          mode === "coast"
            ? "Reducing spending lowers your required FIRE target and can improve how much you can invest before coasting."
            : "Lower spending shrinks your FIRE number and increases what you can put away each month.",
        shortCopy: "A smaller target means compounding has less ground to cover.",
      };
    case "higher_savings":
      return {
        explanation:
          "A higher savings rate means more capital compounding every year — the most direct lever on any FIRE timeline.",
        shortCopy: "More of your income working for you sooner.",
      };
    case "move":
      return {
        explanation:
          "Moving to a lower-cost location reduces your living costs and the retirement target your portfolio needs to support.",
        shortCopy: "Lower geographic costs can shorten the path materially.",
      };
    case "later_coast_age":
      return {
        explanation:
          "Contributing for a few more years gives your portfolio more principal before compounding takes over alone.",
        shortCopy: "A few extra contribution years create a meaningful jump.",
      };
    case "boost_contributions":
      return {
        explanation:
          "Adding $5,000/year to investments accelerates portfolio growth and shortens the gap to financial independence.",
        shortCopy: "More capital compounding each year builds a meaningful head start.",
      };
    case "baseline":
    default:
      return {
        explanation: "This is your current path using the assumptions you entered.",
        shortCopy: "Your current assumptions with no changes.",
      };
  }
}


function makeDecisionRunner(
  mode: FireMode,
  netAnnual: number
): (overrideInputs: Inputs) => DecisionProjectionOutput {
  return (overrideInputs: Inputs): DecisionProjectionOutput => {
    
    if (mode === "coast") {
      const yearsToGoal = simulateYearsToCoast(overrideInputs, netAnnual);
      const goalAge =
        yearsToGoal !== null ? overrideInputs.age + yearsToGoal : null;
      const fiResult = simulateYearsToFI(overrideInputs, netAnnual, mode);
      const fullFireAge =
        fiResult.yearsToFI !== null
          ? overrideInputs.age + fiResult.yearsToFI
          : null;
      return { yearsToGoal, goalAge, fullFireAge };
    }
    const fiResult = simulateYearsToFI(overrideInputs, netAnnual, mode);
    const goalAge =
      fiResult.yearsToFI !== null
        ? overrideInputs.age + fiResult.yearsToFI
        : null;
    return { yearsToGoal: fiResult.yearsToFI, goalAge, fullFireAge: goalAge };
  };
}

function buildDecisionEngine(
  inputs: Inputs,
  mode: FireMode,
  netAnnual: number
): DecisionEngineResult {
  const runProjection = makeDecisionRunner(mode, netAnnual);
  const baselineOutput = runProjection(inputs);

  const baseline: DecisionScenarioResult = {
    key: "baseline",
    label: "Current path",
    yearsToGoal: baselineOutput.yearsToGoal,
    goalAge: baselineOutput.goalAge,
    fullFireAge: baselineOutput.fullFireAge,
    yearsSavedVsBaseline: 0,
    ...getDecisionScenarioCopy("baseline", mode),
  };

  const scenarios: Array<{
    key: DecisionScenarioKey;
    label: string;
    nextInputs: Inputs;
  }> = [];

  // ── Scenario 1: Lower spending -10% ──────────────────────────────────────
  scenarios.push({
    key: "lower_spending",
    label: "Lower spending by 10%",
    nextInputs: {
      ...inputs,
      expensesMonthly: Math.max(0, inputs.expensesMonthly * 0.9),
      movedExpensesMonthly: Math.max(0, inputs.movedExpensesMonthly * 0.9),
    },
  });

  // ── Scenario 2: Higher savings — honest 10-point rate increase ────────────
  const currentSavingsRate =
    netAnnual > 0
      ? clamp((netAnnual - annualExpensesFromMonthly(inputs.expensesMonthly)) / netAnnual, 0, 1)
      : 0;
  const targetSavingsRate = clamp(currentSavingsRate + 0.1, 0, 0.8);
  const impliedMonthly = Math.max(0, (netAnnual * (1 - targetSavingsRate)) / 12);
  scenarios.push({
    key: "higher_savings",
    label: `Raise savings rate to ${Math.round(targetSavingsRate * 100)}%`,
    nextInputs: {
      ...inputs,
      expensesMonthly: impliedMonthly,
      yearlyInvestment: 0,
    },
  });

  // ── Scenario 3: Move to lower-cost scenario (only if it's genuinely lower) ─
  if (
    inputs.moveCompareOn &&
    inputs.movedExpensesMonthly > 0 &&
    inputs.movedExpensesMonthly < inputs.expensesMonthly
  ) {
    scenarios.push({
      key: "move",
      label: "Move to the lower-cost location",
      nextInputs: {
        ...inputs,
        expensesMonthly: inputs.movedExpensesMonthly,
      },
    });
  }

  // ── Scenario 4: Mode-specific ─────────────────────────────────────────────
  const currentAutoContrib =
    inputs.yearlyInvestment > 0
      ? inputs.yearlyInvestment
      : Math.max(0, netAnnual - annualExpenses(inputs));

  if (mode === "coast") {
    scenarios.push({
      key: "later_coast_age",
      label: "Contribute 5 more years before coasting",
      nextInputs: {
        ...inputs,
        coastAge: Math.min(inputs.coastAge + 5, inputs.targetRetirementAge - 1),
      },
    });
  } else {
    scenarios.push({
      key: "boost_contributions",
      label: "Add $5,000/year to investments",
      nextInputs: {
        ...inputs,
        yearlyInvestment: Math.max(inputs.yearlyInvestment, currentAutoContrib) + 5000,
      },
    });
  }

  // ── Run & rank ────────────────────────────────────────────────────────────
  const ranked = scenarios
    .map(({ key, label, nextInputs }) => {
      const output = runProjection(nextInputs);
      const baseYears = baselineOutput.yearsToGoal;
      const nextYears = output.yearsToGoal;

      let yearsSavedVsBaseline: number | null = null;
      if (
        typeof baseYears === "number" &&
        typeof nextYears === "number" &&
        Number.isFinite(baseYears) &&
        Number.isFinite(nextYears)
      ) {
        yearsSavedVsBaseline = Math.max(0, baseYears - nextYears);
      }

      return {
        key,
        label,
        yearsToGoal: output.yearsToGoal,
        goalAge: output.goalAge,
        fullFireAge: output.fullFireAge,
        yearsSavedVsBaseline,
        ...getDecisionScenarioCopy(key, mode),
      } satisfies DecisionScenarioResult;
    })
    .filter((s) => (s.yearsSavedVsBaseline ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.yearsSavedVsBaseline ?? -Infinity) -
        (a.yearsSavedVsBaseline ?? -Infinity)
    );

  const winner = ranked.length > 0 ? ranked[0] : null;

  return { baseline, ranked, winner, mode };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function AdSenseBlock({ slot, className = "" }: { slot: string; className?: string }) {
  const enabled = Boolean(ADSENSE_CLIENT && slot);
  useEffect(() => {
    if (!enabled) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* ignore */ }
  }, [enabled, slot]);
  if (!enabled) return null;
  return (
    <div className={className}>
      <ins className="adsbygoogle" style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT} data-ad-slot={slot}
        data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

function AffiliateCard({ a }: { a: Affiliate }) {
  return (
    <a href={a.href} target="_blank" rel="noopener noreferrer nofollow sponsored"
      className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{a.name}</div>
        <div className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-300">{a.tag}</div>
      </div>
      <div className="mt-2 text-sm text-slate-300">{a.blurb}</div>
      <div className="mt-3 text-sm font-semibold text-emerald-200 group-hover:text-emerald-100">Learn more →</div>
    </a>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button type="button" tabIndex={0} aria-label={text}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-[11px] leading-5 text-slate-200 shadow-2xl group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function Stat({ label, value, helper, highlight }: {
  label: string; value: ReactNode; helper?: ReactNode; highlight?: boolean;
}) {
  return (
    <div className={[
      "rounded-2xl border px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
      highlight ? "border-emerald-300/25 bg-emerald-300/10" : "border-white/10 bg-white/[0.04]",
    ].join(" ")}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">{value}</div>
      {helper ? <div className="mt-3 text-xs leading-5 text-slate-400">{helper}</div> : null}
    </div>
  );
}

function Field({ label, value, onChange, prefix, suffix, info }: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; info?: string;
}) {
  const [raw, setRaw] = useState(value === 0 ? "" : String(value));
  useEffect(() => { setRaw(value === 0 ? "" : String(value)); }, [value]);
  return (
    <label className="block">
      <div className="mb-1 flex items-center text-[11px] font-medium leading-tight text-slate-300">
        <span>{label}</span>
        {info ? <InfoTip text={info} /> : null}
      </div>
      <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 shadow-inner transition focus-within:border-emerald-400/50 focus-within:ring-4 focus-within:ring-emerald-400/10">
        {prefix ? <span className="mr-2 text-sm text-slate-400">{prefix}</span> : null}
        <input type="text" inputMode="numeric" value={raw}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          onChange={e => setRaw(e.target.value)}
          onBlur={() => {
            const n = raw.trim() === "" ? 0 : Number(raw.trim());
            const safe = Number.isFinite(n) ? n : 0;
            onChange(safe);
            setRaw(safe === 0 ? "" : String(safe));
          }} />
        {suffix ? <span className="ml-2 text-sm text-slate-400">{suffix}</span> : null}
      </div>
    </label>
  );
}

function ModeNav({ currentMode }: { currentMode: FireMode }) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
      {MODE_NAV.map(({ mode, label, href }) => (
        <Link key={mode} href={href} className={[
          "rounded-xl border px-3 py-2 text-xs font-medium transition",
          currentMode === mode
            ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200"
            : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white",
        ].join(" ")}>
          {label}
        </Link>
      ))}
    </div>
  );
}

function ProgressBar({ pct: p, label, sublabel }: { pct: number; label: string; sublabel?: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium text-slate-300">{label}</div>
        <div className="text-[11px] text-slate-400">{Math.round(p * 100)}%</div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-emerald-300 transition-all" style={{ width: `${Math.round(p * 100)}%` }} />
      </div>
      {sublabel ? <div className="mt-2 text-[12px] leading-5 text-slate-400">{sublabel}</div> : null}
    </div>
  );
}

// ── Decision Engine Card ──────────────────────────────────────────────────────

function formatDecisionYears(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value === 0) return "Now";
  return `${Math.round(value)} yrs`;
}

const DECISION_MODE_LABELS: Record<FireMode, { goal: string; goalAge: string; intro: string }> = {
  standard: {
    goal:    "Years to FIRE",
    goalAge: "FIRE age",
    intro:   "Here are the changes that would get you to financial independence fastest.",
  },
  lean: {
    goal:    "Years to Lean FIRE",
    goalAge: "Lean FIRE age",
    intro:   "Here are the changes that would shrink your lean timeline the most.",
  },
  coast: {
    goal:    "Years to Coast FIRE",
    goalAge: "Coast age",
    intro:   "Here are the changes that would reduce your coast timeline the most.",
  },
  barista: {
    goal:    "Years to Barista FIRE",
    goalAge: "Barista FIRE age",
    intro:   "Here are the changes that would get you to your part-time life fastest.",
  },
};

function DecisionEngineCard({ result }: { result: DecisionEngineResult }) {
  const topThree = result.ranked.slice(0, 3);
  const modeLabels = DECISION_MODE_LABELS[result.mode];
  const alreadyReached = (result.baseline.yearsToGoal ?? 1) <= 0;

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
        Decision engine
      </div>
      <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
        Your fastest path to{" "}
        {result.mode === "coast"
          ? "Coast FIRE"
          : result.mode === "lean"
          ? "Lean FIRE"
          : result.mode === "barista"
          ? "Barista FIRE"
          : "financial independence"}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        {alreadyReached ? (
          <>
            You've already reached your goal under current assumptions. These
            scenarios show what would{" "}
            <strong className="text-white">strengthen your full FIRE position</strong>{" "}
            from here.
          </>
        ) : (
          <>
            You're currently projected to reach your goal in{" "}
            <strong className="text-white">
              {formatDecisionYears(result.baseline.yearsToGoal)}
            </strong>
            . {modeLabels.intro}
          </>
        )}
      </p>

      {/* ── Winner card ────────────────────────────────────────────────── */}
      <div className="mt-5">
        {result.winner ? (
          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
              Biggest lever
            </div>
            <div className="mt-2 text-base font-semibold text-white">
              {result.winner.label}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {result.winner.explanation}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-black/20 px-3 py-2">
              <span className="text-xs text-slate-400">Estimated improvement</span>
              <span className="text-sm font-bold text-emerald-200">
                {Math.round(result.winner.yearsSavedVsBaseline ?? 0)} years sooner
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-base font-semibold text-white">
              Your current path is already close to optimal
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              None of the tested changes materially improved your timeline. That
              usually means your plan is efficient, or the limiting factor is
              long-term market growth rather than a simple input change.
            </p>
          </div>
        )}
      </div>

      {/* ── Ranked list ────────────────────────────────────────────────── */}
      {topThree.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-semibold text-white">
            What would move the needle most
          </div>
          <div className="mt-3 space-y-3">
            {topThree.map((item, index) => (
              <div
                key={item.key}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm font-semibold text-white">
                    {index + 1}. {item.label}
                  </p>
                  <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    {Math.round(item.yearsSavedVsBaseline ?? 0)} yrs sooner
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {item.shortCopy}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {modeLabels.goalAge}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {item.goalAge ?? "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Full FIRE age
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {item.fullFireAge ?? "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {modeLabels.goal}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {formatDecisionYears(item.yearsToGoal)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Disclaimer ─────────────────────────────────────────────────── */}
      <p className="mt-5 text-xs leading-5 text-slate-500">
        These are planning estimates, not guarantees. Small changes in return
        assumptions, taxes, and future spending can materially change the result.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function FireCalculator({ initialIncome = 0, hideFAQ = false }: FireCalculatorProps) {
  const pathname = usePathname();
  const mode     = modeFromPathname(pathname);

  const [inputs, setInputs] = useState<Inputs>(() => defaultsForMode(mode, initialIncome));
  const [openFaq,  setOpenFaq]  = useState<number | null>(0);
  const [pinnedCompareCityId, setPinnedCompareCityId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");
  const [activeResultTab, setActiveResultTab] = useState<"milestone" | "move" | "savings">("milestone");

  // ── Core derived values ───────────────────────────────────────────────────
  const annualExp = useMemo(() => annualExpenses(inputs), [inputs]);

  const netAnnual = useMemo(() => {
    if (!inputs.state) return Math.max(0, inputs.income);
    return estimateNetAnnual({
      grossAnnual: inputs.income,
      state: inputs.state as StateCode,
      filing: inputs.filingStatus,
      k401Pct: inputs.k401Pct,
      cityId: getBaselineCityIdForState(inputs.state),
    });
  }, [inputs.income, inputs.state, inputs.filingStatus, inputs.k401Pct]);

  const estTaxRate = useMemo(() => {
    if (!inputs.state) return 0;
    return effectiveTaxRatePct(netAnnual, inputs.income);
  }, [inputs.state, netAnnual, inputs.income]);

  const savingsRate = useMemo(() => clamp((netAnnual - annualExp) / Math.max(1, netAnnual), -1, 1), [netAnnual, annualExp]);

  // ── Standard simulation ───────────────────────────────────────────────────
  const result = useMemo(() => simulateYearsToFI(inputs, netAnnual, mode), [inputs, netAnnual, mode]);

  const fiAge  = useMemo(() => result.yearsToFI === null ? null : inputs.age + result.yearsToFI, [inputs.age, result.yearsToFI]);
  const fiYear = useMemo(() => result.yearsToFI === null ? null : new Date().getFullYear() + result.yearsToFI, [result.yearsToFI]);

  const projection = useMemo(() => buildProjection(inputs, netAnnual, result.yearsToFI, mode), [inputs, netAnnual, result.yearsToFI, mode]);

 const crossoverPoint = useMemo(() => {
  return projection.find((p) =>
    (mode === "standard" && p.fireTarget && p.spendablePortfolio >= p.fireTarget) ||
    (mode === "lean" && p.leanFireTarget && p.spendablePortfolio >= p.leanFireTarget) ||
    (mode === "coast" && p.fireTarget && p.spendablePortfolio >= p.fireTarget) ||
    (mode === "barista" && p.baristaTarget && p.spendablePortfolio >= p.baristaTarget)
  ) ?? null;
}, [projection, mode]);

  const progress = useMemo(() => {
  const current = Number(inputs.advanced ? result.startSpendablePortfolio : result.startPortfolio);
  const target = Number(result.fireNumber);
  const pctValue =
    target > 0 && Number.isFinite(target) ? clamp(current / target, 0, 1) : 0;

  return {
    current,
    target,
    pct: pctValue,
  };
}, [inputs.advanced, result]);

  // ── Coast-specific ────────────────────────────────────────────────────────
  const coastFireNumber = useMemo(() => mode === "coast" ? calcCoastFireNumber(inputs) : null, [mode, inputs]);
  const yearsToCoast    = useMemo(() => mode === "coast" ? simulateYearsToCoast(inputs, netAnnual) : null, [mode, inputs, netAnnual]);
  const isCoastReady    = useMemo(() => coastFireNumber !== null && result.startPortfolio >= coastFireNumber, [coastFireNumber, result.startPortfolio]);
  const coastProgress   = useMemo(() => {
    if (!coastFireNumber || !Number.isFinite(coastFireNumber)) return 0;
    return clamp(result.startPortfolio / coastFireNumber, 0, 1);
  }, [coastFireNumber, result.startPortfolio]);

  // ── Lean-specific: full FIRE comparison at 1.5× spending ─────────────────
  const fullFireForLean = useMemo(() => {
    if (mode !== "lean") return null;
    const fullExp = annualExpensesFromMonthly(inputs.expensesMonthly * 1.5);
    return simulateYearsToFI(inputs, netAnnual, "standard", { expensesAnnualBase: fullExp });
  }, [mode, inputs, netAnnual]);
  const fullFiAgeForLean = useMemo(() => fullFireForLean?.yearsToFI == null ? null : inputs.age + fullFireForLean.yearsToFI, [fullFireForLean, inputs.age]);
  const leanYearsSaved   = useMemo(() => fiAge !== null && fullFiAgeForLean !== null ? fullFiAgeForLean - fiAge : null, [fiAge, fullFiAgeForLean]);

  // ── Barista-specific: full FIRE without income reduction ──────────────────
  const fullFireForBarista = useMemo(() => {
    if (mode !== "barista") return null;
    return simulateYearsToFI(inputs, netAnnual, "standard");
  }, [mode, inputs, netAnnual]);
  const fullFiAgeForBarista = useMemo(() => fullFireForBarista?.yearsToFI == null ? null : inputs.age + fullFireForBarista.yearsToFI, [fullFireForBarista, inputs.age]);
  const baristaYearsSaved   = useMemo(() => fullFiAgeForBarista !== null && fiAge !== null ? fullFiAgeForBarista - fiAge : null, [fiAge, fullFiAgeForBarista]);

  const baristaTable = useMemo(() => {
    if (mode !== "barista") return [];
    const swr = (Number(inputs.withdrawalRatePct) || 0) / 100;
    return [0, 12000, 24000, 36000, 48000, 60000].map(pt => {
      const effExp   = Math.max(0, annualExpenses(inputs) - pt);
      const fireNum  = swr > 0 ? effExp / swr : Infinity;
      const sim      = simulateYearsToFI({ ...inputs, baristaPartTimeIncome: pt }, netAnnual, "barista");
      const ageAtFI  = sim.yearsToFI === null ? null : inputs.age + sim.yearsToFI;
      return { pt, effExp, fireNum, yearsToFI: sim.yearsToFI, ageAtFI, isCurrent: pt === (Number(inputs.baristaPartTimeIncome) || 0) };
    });
  }, [mode, inputs, netAnnual]);

  // ── Move impact ───────────────────────────────────────────────────────────
  const movedResult = useMemo(() => {
    if (!inputs.moveCompareOn) return null;
    return simulateYearsToFI(inputs, netAnnual, mode, { expensesAnnualBase: annualMovedExpenses(inputs) });
  }, [inputs, netAnnual, mode]);
  const movedFiAge    = useMemo(() => !movedResult || movedResult.yearsToFI === null ? null : inputs.age + movedResult.yearsToFI, [inputs.age, movedResult]);
  const moveDeltaYears = useMemo(() => fiAge === null || movedFiAge === null ? null : fiAge - movedFiAge, [fiAge, movedFiAge]);

  // ── Viral city results ────────────────────────────────────────────────────
  const viralCityResults = useMemo(() => {
    const baseExp      = annualExpenses(inputs);
    const baselineCityId = getBaselineCityIdForState(inputs.state);
    const rows = VIRAL_COMPARE_CITIES.map(cityId => {
      const city = findCity(cityId);
      if (!city) return null;
      if (cityId === baselineCityId) {
        return { cityId, cityName: city.name, state: city.state.toUpperCase(), ageAtFI: fiAge, yearsToFI: result.yearsToFI, isBaseline: true, deltaYears: 0 };
      }
      const adjExp   = expenseAdjustedForCity(baseExp, cityId, baselineCityId);
      const sim      = simulateYearsToFI(inputs, netAnnual, mode, { expensesAnnualBase: adjExp });
      const ageAtFI  = sim.yearsToFI === null ? null : inputs.age + sim.yearsToFI;
      const delta    = sim.yearsToFI !== null && result.yearsToFI !== null ? result.yearsToFI - sim.yearsToFI : null;
      return { cityId, cityName: city.name, state: city.state.toUpperCase(), ageAtFI, yearsToFI: sim.yearsToFI, isBaseline: false, deltaYears: delta };
    }).filter(Boolean);
    return rows.sort((a, b) => {
      if (a!.isBaseline) return -1;
      if (b!.isBaseline) return 1;
      return (b!.deltaYears ?? -999) - (a!.deltaYears ?? -999);
    });
  }, [inputs, netAnnual, mode, fiAge, result.yearsToFI]);

  const bestMoveRow = useMemo(() => viralCityResults.find(r => !r!.isBaseline && (r!.deltaYears ?? 0) > 0) ?? null, [viralCityResults]);

  useEffect(() => {
    if (!pinnedCompareCityId) return;
    if (!viralCityResults.some(r => r?.cityId === pinnedCompareCityId)) setPinnedCompareCityId(null);
  }, [pinnedCompareCityId, viralCityResults]);

  const proposedComparison = useMemo(() => {
    if (!pinnedCompareCityId) return null;
    const baselineCityId = getBaselineCityIdForState(inputs.state);
    const adjExp  = expenseAdjustedForCity(annualExpenses(inputs), pinnedCompareCityId, baselineCityId);
    const sim     = simulateYearsToFI(inputs, netAnnual, mode, { expensesAnnualBase: adjExp });
    const ageAtFI = sim.yearsToFI === null ? null : inputs.age + sim.yearsToFI;
    const pts     = buildProjectionWithExpenses(inputs, netAnnual, sim.yearsToFI, adjExp, mode);
    return { city: findCity(pinnedCompareCityId), adjustedExpenses: adjExp, sim, yearsToFI: sim.yearsToFI, ageAtFI, projectionPoints: pts };
  }, [pinnedCompareCityId, inputs, netAnnual, mode]);

  const comparisonYearsSaved = useMemo(() => {
    if (!fiAge || !proposedComparison?.ageAtFI) return null;
    return fiAge - proposedComparison.ageAtFI;
  }, [fiAge, proposedComparison]);

  const comparisonChartData = useMemo(() => {
  const ageMap = new Map<number, ComparisonChartRow>();

  projection.forEach((p) => {
    ageMap.set(p.age, {
      ...(ageMap.get(p.age) || { age: p.age }),
      age: p.age,
      currentPortfolio: p.portfolio,
      currentSpendablePortfolio: p.spendablePortfolio,
      currentFireTarget: p.fireTarget ?? p.leanFireTarget ?? p.baristaTarget ?? 0,
    });
  });

  if (proposedComparison) {
    proposedComparison.projectionPoints.forEach((p) => {
      ageMap.set(p.age, {
        ...(ageMap.get(p.age) || { age: p.age }),
        age: p.age,
        proposedPortfolio: p.portfolio,
        proposedSpendablePortfolio: p.spendablePortfolio,
      });
    });
  }

  return Array.from(ageMap.values()).sort((a, b) => a.age - b.age);
}, [projection, proposedComparison]);

  // ── Savings rate table ────────────────────────────────────────────────────
  const savingsTable = useMemo(() => {
    return [10, 20, 30, 40, 50, 60, 70].map(rPct => {
      const r            = rPct / 100;
      const impliedExp   = Math.max(0, netAnnual * (1 - r));
      const sim          = netAnnual > 0 ? simulateYearsToFI(inputs, netAnnual, mode, { expensesAnnualBase: impliedExp }) : null;
      const ageAtFI      = sim?.yearsToFI == null ? null : inputs.age + sim.yearsToFI;
      return { savingsRatePct: rPct, impliedExpenses: impliedExp, yearsToFI: sim?.yearsToFI ?? null, ageAtFI };
    });
  }, [inputs, netAnnual, mode]);

  const currentSavingsRatePct  = useMemo(() => Math.round(savingsRate * 100), [savingsRate]);
  const nearestSavingsRateRow  = useMemo(() => [10,20,30,40,50,60,70].reduce((c, r) => Math.abs(r - currentSavingsRatePct) < Math.abs(c - currentSavingsRatePct) ? r : c, 10), [currentSavingsRatePct]);

  // ── Advanced indicators ───────────────────────────────────────────────────
  const targetDelta   = useMemo(() => {
    if (!inputs.advanced || result.yearsToFI === null) return null;
    return result.yearsToFI - (inputs.targetFireAge - inputs.age);
  }, [inputs.advanced, inputs.targetFireAge, inputs.age, result.yearsToFI]);

  const nudge         = useMemo(() => getUnderinvestedNudge(inputs, mode), [inputs, mode]);
  const baselineCity  = useMemo(() => findCity(getBaselineCityIdForState(inputs.state)), [inputs.state]);
  const hasCoreInputs = inputs.age > 0 && inputs.income > 0 && inputs.expensesMonthly > 0;


  // ── Decision engine (all modes) ───────────────────────────────────────────
const decisionEngine = useMemo(
  () => buildDecisionEngine(inputs, mode, netAnnual),
  [inputs, mode, netAnnual]
);

  // ─────────────────────────────────────────────────────────────────────────
  // SHARE HANDLER
  // ─────────────────────────────────────────────────────────────────────────

  async function handleShare() {
    try {
      const base    = window.location.origin;
      const path    = mode === "standard" ? "/fire-calculator/share" : `/${mode}-fire-calculator/share`;
      const url     = new URL(path, base);
      url.searchParams.set("mode", mode);

      if (mode === "coast" && coastFireNumber !== null) {
        url.searchParams.set("coastNumber", String(Math.round(coastFireNumber)));
        url.searchParams.set("ready",       String(isCoastReady));
      } else if (mode === "barista") {
        url.searchParams.set("baristaFireNumber", String(Math.round(result.fireNumber)));
        url.searchParams.set("partTimeIncome",    String(inputs.baristaPartTimeIncome));
        if (baristaYearsSaved !== null) url.searchParams.set("yearsSaved", String(baristaYearsSaved));
      } else if (mode === "lean") {
        url.searchParams.set("leanFireNumber", String(Math.round(result.fireNumber)));
        if (leanYearsSaved !== null) url.searchParams.set("yearsSaved", String(leanYearsSaved));
        if (fiAge)                   url.searchParams.set("fireAge",    String(fiAge));
      } else {
        if (fiAge)         url.searchParams.set("fireAge",      String(fiAge));
        if (bestMoveRow)   url.searchParams.set("to",           bestMoveRow.cityName);
        if (baselineCity)  url.searchParams.set("from",         baselineCity.name);
        url.searchParams.set("years", String(Math.max(0, bestMoveRow?.deltaYears ?? 0)));
      }

      const text = mode === "coast"
        ? `My Coast FIRE number: ${money(coastFireNumber ?? 0, 0)}. ${isCoastReady ? "I'm coast-ready!" : `${yearsToCoast ?? "?"} years to go.`}`
        : mode === "barista"
        ? `My Barista FIRE number: ${money(result.fireNumber, 0)}. ${baristaYearsSaved ? `${baristaYearsSaved} years sooner than full FIRE.` : ""}`
        : mode === "lean"
        ? `My Lean FIRE number: ${money(result.fireNumber, 0)}. FIRE at age ${fiAge ?? "—"}.`
        : `My FIRE result: age ${fiAge ?? "—"}. Calculated with Relocation by Numbers.`;

      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (nav && "share" in nav) {
        await (nav as Navigator & { share: (d: object) => Promise<void> }).share({ title: "My FIRE Result", text, url: url.toString() });
        setShareStatus("shared");
      } else if (nav?.clipboard) {
        await nav.clipboard.writeText(url.toString());
        setShareStatus("copied");
      }
    } catch {
      try {
        const nav = typeof navigator !== "undefined" ? navigator : null;
        await nav?.clipboard?.writeText(typeof window !== "undefined" ? window.location.href : "");
        setShareStatus("copied");
      } catch {
        setShareStatus("error");
      }
    }
    window.setTimeout(() => setShareStatus("idle"), 2500);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-6">

      {/* ── Mode nav strip ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModeNav currentMode={mode} />
        <p className="max-w-xl text-xs leading-5 text-slate-400">{MODE_NOTES[mode]}</p>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

        {/* ── LEFT: Inputs panel ─────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold tracking-tight text-white">Calculator inputs</div>
              <div className="text-xs leading-5 text-slate-300">Enter your income, spending, and investing assumptions.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setInputs(s => ({ ...s, advanced: !s.advanced }))}
                className={["rounded-xl border px-3 py-2 text-xs font-medium", inputs.advanced ? "border-violet-300/40 bg-violet-300/10 text-violet-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"].join(" ")}>
                {inputs.advanced ? "Advanced: ON" : "Advanced: OFF"}
              </button>
              <button onClick={() => setInputs(defaultsForMode(mode, initialIncome))}
                className="rounded-xl border border-red-300/40 bg-red-300/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-300/20">
                ↺ Reset
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-x-4 gap-y-3 sm:grid-cols-2">

            {/* ── Mode-specific inputs pinned to top ─────────────────────── */}
            {mode === "coast" && (
              <div className="rounded-xl border border-sky-300/20 bg-sky-300/10 p-4 sm:col-span-2">
                <div className="mb-3 text-xs font-semibold tracking-widest text-sky-200">COAST FIRE SETTINGS</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Stop contributing at age" info="After this age, contributions go to zero and your portfolio coasts on compound growth alone."
                    value={inputs.coastAge}
                    onChange={v => setInputs(s => ({ ...s, coastAge: clamp(v, s.age, 80) }))} />
                  <Field label="Target retirement age" info="The age you plan to fully retire. Used to calculate how long compounding has to work."
                    value={inputs.targetRetirementAge}
                    onChange={v => setInputs(s => ({ ...s, targetRetirementAge: clamp(v, s.coastAge, 100) }))} />
                </div>
              </div>
            )}

            {mode === "barista" && (
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 sm:col-span-2">
                <div className="mb-3 text-xs font-semibold tracking-widest text-amber-200">BARISTA FIRE SETTINGS</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Expected annual part-time income" info="Income from part-time or flexible work. This reduces the gap your portfolio must cover."
                    value={inputs.baristaPartTimeIncome}
                    onChange={v => setInputs(s => ({ ...s, baristaPartTimeIncome: clamp(v, 0, 500000) }))}
                    prefix="$" />
                  <div className="self-end text-xs text-slate-400">
                    Gap your portfolio covers:<br />
                    <span className="font-semibold text-slate-200">
                      {money(Math.max(0, annualExp - (Number(inputs.baristaPartTimeIncome) || 0)), 0)}/yr
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Shared core inputs ─────────────────────────────────────── */}
            <Field label="Current age" value={inputs.age} onChange={v => setInputs(s => ({ ...s, age: clamp(v, 0, 100) }))} />
            <Field label="Annual gross income" value={inputs.income} onChange={v => setInputs(s => ({ ...s, income: clamp(v, 0, 2_000_000) }))} prefix="$" />

            <label className="block">
              <div className="mb-0.5 flex items-center text-[11px] font-medium leading-tight text-slate-300">
                State for tax estimate
                <InfoTip text="Used to estimate after-tax income with a simplified state-specific tax model." />
              </div>
              <select value={inputs.state} onChange={e => setInputs(s => ({ ...s, state: e.target.value as StateChoice }))}
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white shadow-inner outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10">
                <option value="" disabled className="bg-slate-900">Select a state…</option>
                {STATES.map(st => <option key={st.code} value={st.code} className="bg-slate-900">{st.name}</option>)}
              </select>
            </label>

            <label className="block">
              <div className="mb-0.5 text-[11px] font-medium leading-tight text-slate-300">Filing status</div>
              <select value={inputs.filingStatus} onChange={e => setInputs(s => ({ ...s, filingStatus: e.target.value as FilingStatus }))}
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white shadow-inner outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10">
                <option value="single" className="bg-slate-900">Single</option>
                <option value="married" className="bg-slate-900">Married</option>
              </select>
            </label>

            <Field label="401(k) contribution %" info="Percentage of salary contributed to a 401(k). Lowers taxable income." value={inputs.k401Pct} onChange={v => setInputs(s => ({ ...s, k401Pct: clamp(v, 0, 60) }))} suffix="%" />
            <Field label="Monthly spending" info="Used to calculate your FIRE target. Higher spending = larger number." value={inputs.expensesMonthly} onChange={v => setInputs(s => ({ ...s, expensesMonthly: clamp(v, 0, 200_000) }))} prefix="$" />
            <div className="-mt-1 text-xs text-slate-400 sm:col-start-2">That's <span className="font-semibold text-slate-200">{money(annualExp, 0)}</span>/yr</div>

            <Field label="Current invested portfolio" value={inputs.currentPortfolio}
              onChange={v => setInputs(s => {
                const next = { ...s, currentPortfolio: clamp(v, 0, 20_000_000) };
                if (next.advanced && next.balBrokerage === 0 && next.currentPortfolio > 0) next.balBrokerage = next.currentPortfolio;
                return next;
              })} prefix="$" />
            <Field label="Annual contributions (optional)" info="Leave blank to auto-estimate from income minus expenses." value={inputs.yearlyInvestment}
              onChange={v => setInputs(s => {
                const next = { ...s, yearlyInvestment: clamp(v, 0, 5_000_000) };
                if (next.advanced && next.contribBrokerage === 0 && next.yearlyInvestment > 0) next.contribBrokerage = next.yearlyInvestment;
                return next;
              })} prefix="$" />
            <div className="-mt-1 text-xs text-slate-400 sm:col-start-2">Leave blank to estimate from after-tax income.</div>

            {/* ── Volatility preset (always visible) ────────────────────── */}
            <div className="sm:col-span-2">
              <div className="mb-1 text-[11px] font-medium text-slate-300">Market volatility assumption</div>
              <div className="flex flex-wrap gap-2">
                {(["conservative", "moderate", "aggressive"] as const).map(v => (
                  <button key={v} type="button" onClick={() => setInputs(s => ({ ...s, volatility: v }))}
                    className={["rounded-xl border px-3 py-2 text-xs font-medium capitalize", inputs.volatility === v
                      ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"].join(" ")}>
                    {v}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Conservative {VOLATILITY_PRESETS.conservative.phase1}% / {VOLATILITY_PRESETS.conservative.phase2}% ·
                Moderate {VOLATILITY_PRESETS.moderate.phase1}% / {VOLATILITY_PRESETS.moderate.phase2}% ·
                Aggressive {VOLATILITY_PRESETS.aggressive.phase1}% / {VOLATILITY_PRESETS.aggressive.phase2}%
              </div>
            </div>

            {/* ── Advanced inputs ────────────────────────────────────────── */}
            {inputs.advanced && (<>
              <div className="mt-2 text-xs font-semibold tracking-widest text-slate-300/80 sm:col-span-2">ACCOUNT BALANCES</div>
              <Field label="401(k) balance" value={inputs.bal401k} onChange={v => setInputs(s => ({ ...s, bal401k: clamp(v, 0, 50_000_000) }))} prefix="$" />
              <Field label="IRA balance"    value={inputs.balIra}  onChange={v => setInputs(s => ({ ...s, balIra:  clamp(v, 0, 50_000_000) }))} prefix="$" />
              <Field label="Brokerage balance" value={inputs.balBrokerage} onChange={v => setInputs(s => ({ ...s, balBrokerage: clamp(v, 0, 50_000_000) }))} prefix="$" />

              <div className="mt-2 text-xs font-semibold tracking-widest text-slate-300/80 sm:col-span-2">YEARLY CONTRIBUTIONS</div>

              {/* 401k contribution + Traditional/Roth inline */}
              <div className="space-y-2">
                <Field label="401(k) annual contribution" value={inputs.contrib401k} onChange={v => setInputs(s => ({ ...s, contrib401k: clamp(v, 0, 500_000) }))} prefix="$" />
                <div className="flex items-center gap-2 pl-1">
                  <span className="text-[11px] text-slate-400">Account type:</span>
                  {(["traditional", "roth"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setInputs(s => ({ ...s, taxTreatment401k: t }))}
                      className={["rounded-lg border px-2 py-1 text-[11px] font-medium capitalize transition", inputs.taxTreatment401k === t
                        ? "border-violet-300/40 bg-violet-300/10 text-violet-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"].join(" ")}>{t}</button>
                  ))}
                  <InfoTip text="Traditional: pre-tax contributions, taxed on withdrawal. Roth: after-tax contributions, tax-free on withdrawal." />
                </div>
              </div>

              {/* IRA contribution + Traditional/Roth inline */}
              <div className="space-y-2">
                <Field label="IRA yearly contribution" value={inputs.contribIra} onChange={v => setInputs(s => ({ ...s, contribIra: clamp(v, 0, 500_000) }))} prefix="$" />
                <div className="flex items-center gap-2 pl-1">
                  <span className="text-[11px] text-slate-400">Account type:</span>
                  {(["traditional", "roth"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setInputs(s => ({ ...s, taxTreatmentIra: t }))}
                      className={["rounded-lg border px-2 py-1 text-[11px] font-medium capitalize transition", inputs.taxTreatmentIra === t
                        ? "border-violet-300/40 bg-violet-300/10 text-violet-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"].join(" ")}>{t}</button>
                  ))}
                  <InfoTip text="Traditional IRA grows tax-deferred. Roth IRA grows tax-free. Both affect your effective spendable portfolio at retirement." />
                </div>
              </div>

              {/* Brokerage contribution + tax drag inline */}
              <div className="space-y-2 sm:col-span-2">
                <Field label="Brokerage yearly contribution" value={inputs.contribBrokerage} onChange={v => setInputs(s => ({ ...s, contribBrokerage: clamp(v, 0, 5_000_000) }))} prefix="$" />
                <div className="flex flex-wrap items-center gap-2 pl-1">
                  <span className="text-[11px] text-slate-400">Tax treatment:</span>
                  {(["simple", "drag"] as const).map(m => (
                    <button key={m} type="button" onClick={() => setInputs(s => ({ ...s, brokerageTaxMode: m }))}
                      className={["rounded-lg border px-2 py-1 text-[11px] font-medium transition", inputs.brokerageTaxMode === m
                        ? "border-violet-300/40 bg-violet-300/10 text-violet-100"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"].join(" ")}>
                      {m === "simple" ? "Simple" : "Tax drag %"}
                    </button>
                  ))}
                  {inputs.brokerageTaxMode === "simple" ? (
                    (["high", "medium", "low"] as const).map(e => (
                      <button key={e} type="button" onClick={() => setInputs(s => ({ ...s, brokerageTaxEfficiency: e }))}
                        className={["rounded-lg border px-2 py-1 text-[11px] font-medium capitalize transition", inputs.brokerageTaxEfficiency === e
                          ? "border-sky-300/40 bg-sky-300/10 text-sky-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"].join(" ")}>{e}</button>
                    ))
                  ) : (
                    <div className="w-32">
                      <Field label="" value={inputs.brokerageTaxDragPct} onChange={v => setInputs(s => ({ ...s, brokerageTaxDragPct: clamp(v, 0, 5) }))} suffix="%" />
                    </div>
                  )}
                  <InfoTip text="High efficiency = index funds / buy-and-hold (~0.2% drag). Medium = mixed. Low = frequent trading (~1% drag)." />
                </div>
              </div>

              <div className="mt-2 text-xs font-semibold tracking-widest text-slate-300/80 sm:col-span-2">EMPLOYER MATCH</div>
              <Field label="Employer match %" info="E.g. 50 = employer matches 50¢ per $1 you contribute." value={inputs.employerMatchPct} onChange={v => setInputs(s => ({ ...s, employerMatchPct: clamp(v, 0, 100) }))} suffix="%" />
              <Field label="Match cap (% of salary)" info="Employer only matches up to this % of your gross salary." value={inputs.employerMatchCapPct} onChange={v => setInputs(s => ({ ...s, employerMatchCapPct: clamp(v, 0, 25) }))} suffix="%" />
              {calcEmployerMatch(inputs) > 0 && (
                <div className="-mt-1 text-xs text-emerald-300 sm:col-span-2">
                  Estimated employer match: <span className="font-semibold">{money(calcEmployerMatch(inputs), 0)}/yr</span>
                </div>
              )}

              {/* Withdrawal tax rate — shown only when Traditional accounts are selected */}
              {(inputs.taxTreatment401k === "traditional" || inputs.taxTreatmentIra === "traditional") && (<>
                <div className="mt-2 text-xs font-semibold tracking-widest text-slate-300/80 sm:col-span-2">WITHDRAWAL TAX ESTIMATE</div>
                <Field
                  label="Est. withdrawal tax rate (%)"
                  info="Applied as a haircut to Traditional 401(k) and IRA balances to estimate your spendable portfolio. Roth and brokerage are unaffected. 15% is a reasonable default for most FIRE savers."
                  value={inputs.withdrawalTaxRatePct}
                  onChange={v => setInputs(s => ({ ...s, withdrawalTaxRatePct: clamp(v, 0, 40) }))}
                  suffix="%"
                />
                <div className="self-end text-xs text-slate-400">
                  {(() => {
                    const { balBrokerage } = applyBrokerageAutofill(inputs);
                    const b: Buckets = { b401k: inputs.bal401k, bIra: inputs.balIra, bBrokerage: balBrokerage };
                    const raw      = totalFromBuckets(b);
                    const spendable = calcSpendableFromBuckets(inputs, b);
                    if (raw <= 0) return "Enter balances above to see the impact.";
                    return <>Est. haircut on current balances: <span className="font-semibold text-slate-200">{money(raw - spendable, 0)}</span></>;
                  })()}
                </div>
              </>)}

              <div className="mt-2 text-xs font-semibold tracking-widest text-slate-300/80 sm:col-span-2">TARGETING</div>
              <Field label="Target FIRE age" value={inputs.targetFireAge} onChange={v => setInputs(s => ({ ...s, targetFireAge: clamp(v, s.age, 100) }))} />
            </>)}

            {/* ── Return / withdrawal / inflation settings ───────────────── */}
            <Field label="Withdrawal rate (%)" info="Percentage of portfolio withdrawn yearly in retirement. 4% is common." value={inputs.withdrawalRatePct} onChange={v => setInputs(s => ({ ...s, withdrawalRatePct: clamp(v, 2, 6) }))} suffix="%" />
            <Field label="Inflation (%)" value={inputs.inflationPct} onChange={v => setInputs(s => ({ ...s, inflationPct: clamp(v, 0, 10) }))} suffix="%" />
            <Field label="Salary growth (%)" value={inputs.salaryGrowthPct} onChange={v => setInputs(s => ({ ...s, salaryGrowthPct: clamp(v, 0, 15) }))} suffix="%" />
            <Field label="Phase 2 starts after (years)" info="Year the calculator switches from Phase 1 to Phase 2 return assumptions." value={inputs.phase2StartsYear} onChange={v => setInputs(s => ({ ...s, phase2StartsYear: clamp(v, 0, 80) }))} />
            <Field label="Projection length (years)" value={inputs.maxYears} onChange={v => setInputs(s => ({ ...s, maxYears: clamp(v, 1, 80) }))} />

            {/* ── Move compare ───────────────────────────────────────────── */}
            <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-200">How moving could change your timeline</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">Geography may be one of the most powerful levers in a FIRE plan. Same income, same returns, different cost of living.</div>
                </div>
                <button onClick={() => setInputs(s => ({ ...s, moveCompareOn: !s.moveCompareOn }))}
                  className={["rounded-xl border px-3 py-2 text-xs font-medium", inputs.moveCompareOn
                    ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"].join(" ")}>
                  {inputs.moveCompareOn ? "Hide comparison" : "Compare cities"}
                </button>
              </div>
              {inputs.moveCompareOn && (
                <>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Monthly expenses after moving" value={inputs.movedExpensesMonthly} onChange={v => setInputs(s => ({ ...s, movedExpensesMonthly: clamp(v, 0, 200_000) }))} prefix="$" />
                    <div className="self-end text-xs text-slate-400">Annual: <span className="font-semibold text-slate-200">{money(annualMovedExpenses(inputs), 0)}</span></div>
                  </div>
                  <div className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-4">
                    <div className="text-xs font-semibold tracking-widest text-emerald-100">MOVE IMPACT</div>
                    <div className="mt-3 grid gap-2 text-sm text-emerald-50">
                      <div className="flex justify-between gap-3"><span className="text-emerald-100/80">Current FIRE age</span><span className="font-semibold">{fiAge ?? "—"}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-emerald-100/80">FIRE age after move</span><span className="font-semibold">{movedFiAge ?? "—"}</span></div>
                      {moveDeltaYears !== null && (
                        <div className="flex justify-between gap-3">
                          <span className="text-emerald-100/80">{moveDeltaYears > 0 ? "Could bring FIRE forward by" : moveDeltaYears < 0 ? "Could delay FIRE by" : "Same timeline"}</span>
                          <span className="font-semibold">{moveDeltaYears !== 0 ? `${Math.abs(moveDeltaYears)} yrs` : ""}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Results panel ────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="mt-6">
            <div role="tablist" className="inline-flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
              {(["milestone", "move", "savings"] as const).map(tab => (
                <button key={tab} type="button" role="tab" aria-selected={activeResultTab === tab}
                  onClick={() => setActiveResultTab(tab)}
                  className={["rounded-xl border px-4 py-2 text-sm font-medium transition", activeResultTab === tab
                    ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200"
                    : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"].join(" ")}>
                  {tab === "milestone" ? "Milestone" : tab === "move" ? "Move impact" : "Savings rate"}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              MILESTONE TAB
          ═══════════════════════════════════════════════════════════════ */}
          <section className={activeResultTab === "milestone" ? "block" : "hidden"}>
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm space-y-4">

              {/* ── STANDARD ──────────────────────────────────────────────── */}
              {mode === "standard" && (<>
                <h2 className="text-2xl font-bold tracking-tight text-white">Your FIRE milestone</h2>
                <p className="text-sm leading-6 text-slate-300">
                  {result.yearsToFI === null || fiAge === null || fiYear === null
                    ? <>At your current pace, FI is not projected within <strong>{inputs.maxYears} years</strong>.</>
                    : <>At your current pace you could reach financial independence at <strong>age {fiAge}</strong>, in about <strong>{result.yearsToFI} years</strong>, around <strong>{fiYear}</strong>.</>}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="FIRE Number" value={hasCoreInputs && Number.isFinite(result.fireNumber) ? money(result.fireNumber, 0) : "—"} helper={`Based on ${inputs.withdrawalRatePct}% withdrawal rate`} />
                  <Stat label="Years Until FIRE" value={hasCoreInputs ? result.yearsToFI === null ? "Not reached" : `${result.yearsToFI} yrs` : "—"} helper={fiYear ? `Est. FIRE year: ${fiYear}` : undefined} />
                  <Stat label="Estimated FIRE Age" value={hasCoreInputs ? (fiAge ?? "—") : "—"} />
                  {inputs.advanced
                    ? <Stat label="Target Tracking" value={targetDelta === null ? "—" : targetDelta <= 0 ? `${Math.abs(targetDelta)} yrs ahead` : `${targetDelta} yrs behind`} helper={`Target age: ${inputs.targetFireAge}`} />
                    : <Stat label="Savings Rate" value={hasCoreInputs ? pct(savingsRate) : "—"} helper={`${money(netAnnual, 0)} est. net · ${estTaxRate.toFixed(1)}% tax rate`} />}
                </div>
                <ProgressBar pct={progress.pct} label="Progress to FIRE"
                  sublabel={<>{money(progress.current, 0)} {inputs.advanced ? "spendable toward FIRE" : "invested"} · {fiAge ? <>On track for FIRE at <span className="font-semibold text-slate-200">{fiAge}</span></> : "Keep building your foundation"}</>} />
                {hasCoreInputs && result.yearsToFI !== null && (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
    <p className="text-xs text-slate-400">
      {result.yearsToFI === 0
        ? "You've hit your FIRE number — share the milestone."
        : `FIRE at ${fiAge ?? "—"} · ${result.yearsToFI} years away`}
    </p>
    <button
      onClick={handleShare}
      className="shrink-0 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/20"
    >
      {shareStatus === "copied"
        ? "Copied!"
        : shareStatus === "shared"
        ? "Shared!"
        : "Share result"}
    </button>
  </div>
)}
                {/* Account breakdown (advanced) */}
                {inputs.advanced && (inputs.bal401k > 0 || inputs.balIra > 0) && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">Portfolio breakdown</div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                      {[["401(k)", inputs.bal401k], ["IRA", inputs.balIra], ["Brokerage", applyBrokerageAutofill(inputs).balBrokerage]].map(([label, val]) => (
                        <div key={String(label)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                          <div className="text-slate-400 text-[11px]">{label}</div>
                          <div className="mt-1 font-semibold text-white">{money(Number(val), 0)}</div>
                        </div>
                      ))}
                    </div>
                    {calcEmployerMatch(inputs) > 0 && (
                      <div className="mt-2 text-xs text-emerald-300">+ {money(calcEmployerMatch(inputs), 0)}/yr employer match included in projections</div>
                    )}
                  </div>
                )}
              </>)}

              {/* ── LEAN ──────────────────────────────────────────────────── */}
              {mode === "lean" && (<>
                <h2 className="text-2xl font-bold tracking-tight text-white">Your Lean FIRE milestone</h2>
                <p className="text-sm leading-6 text-slate-300">
                  {fiAge === null
                    ? <>Lean FIRE not projected within <strong>{inputs.maxYears} years</strong> at current inputs.</>
                    : <>With lean spending of <strong>{money(inputs.expensesMonthly, 0)}/mo</strong>, you could reach Lean FIRE at <strong>age {fiAge}</strong>
                      {leanYearsSaved !== null && leanYearsSaved > 0 ? <> — <strong>{leanYearsSaved} years sooner</strong> than a higher-spending plan.</> : <>.</>}</>}
                </p>
                {/* Side-by-side comparison */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300">Lean FIRE</div>
                    <div className="mt-2 text-xs text-slate-400">{money(inputs.expensesMonthly, 0)}/mo spending</div>
                    <div className="mt-3 text-2xl font-bold text-white">{Number.isFinite(result.fireNumber) ? money(result.fireNumber, 0) : "—"}</div>
                    <div className="mt-1 text-sm text-emerald-200">FIRE at age {fiAge ?? "—"}</div>
                    <div className="mt-1 text-xs text-slate-400">{result.yearsToFI !== null ? `${result.yearsToFI} years away` : "Not reached"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Full FIRE (+50% spending)</div>
                    <div className="mt-2 text-xs text-slate-400">{money(inputs.expensesMonthly * 1.5, 0)}/mo spending</div>
                    <div className="mt-3 text-2xl font-bold text-white">{fullFireForLean && Number.isFinite(fullFireForLean.fireNumber) ? money(fullFireForLean.fireNumber, 0) : "—"}</div>
                    <div className="mt-1 text-sm text-slate-300">FIRE at age {fullFiAgeForLean ?? "—"}</div>
                    <div className="mt-1 text-xs text-slate-400">{fullFireForLean?.yearsToFI !== null && fullFireForLean?.yearsToFI !== undefined ? `${fullFireForLean.yearsToFI} years away` : "Not reached"}</div>
                  </div>
                </div>
                {leanYearsSaved !== null && leanYearsSaved > 0 && (
                  <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                    Lean spending saves you <strong>{leanYearsSaved} years</strong> vs a 50% higher spending plan. That's the power of the lean approach.
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="Lean FIRE Number" value={hasCoreInputs && Number.isFinite(result.fireNumber) ? money(result.fireNumber, 0) : "—"} helper={`At ${inputs.withdrawalRatePct}% withdrawal`} highlight />
                  <Stat label="Savings Rate" value={hasCoreInputs ? pct(savingsRate) : "—"} helper={`${money(netAnnual, 0)} est. net income`} />
                </div>
                <ProgressBar pct={progress.pct} label="Progress to Lean FIRE"
                  sublabel={<>{money(progress.current, 0)} {inputs.advanced ? "spendable toward FIRE" : "invested"} · {fiAge ? <>On track for Lean FIRE at <span className="font-semibold text-slate-200">{fiAge}</span></> : "Keep building"}</>} />
              </>)}

              {/* ── COAST ─────────────────────────────────────────────────── */}
              {mode === "coast" && (<>
                <h2 className="text-2xl font-bold tracking-tight text-white">Your Coast FIRE status</h2>
                <p className="text-sm leading-6 text-slate-300">
                  {!hasCoreInputs
                    ? "Enter your inputs to calculate your Coast FIRE number."
                    : isCoastReady
                    ? <>Your portfolio has already reached your Coast FIRE number. Compound growth alone can carry you to full retirement at <strong>age {inputs.targetRetirementAge}</strong> — even with no new contributions.</>
                    : <>You need <strong>{money(coastFireNumber ?? 0, 0)}</strong> invested by age <strong>{inputs.coastAge}</strong> for your portfolio to coast to retirement without new contributions.
                      {yearsToCoast !== null ? <> At your current pace, you could reach it in <strong>{yearsToCoast} years</strong>.</> : null}</>}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="Coast FIRE Number" value={coastFireNumber !== null && Number.isFinite(coastFireNumber) ? money(coastFireNumber, 0) : "—"}
                    helper={`Needed by age ${inputs.coastAge} to coast to retirement at ${inputs.targetRetirementAge}`} highlight={isCoastReady} />
                  <Stat label="Current Portfolio" value={money(result.startPortfolio, 0)}
                    helper={isCoastReady ? "✓ You've reached Coast FIRE" : coastFireNumber ? `${money(Math.max(0, coastFireNumber - result.startPortfolio), 0)} to go` : undefined} />
                  <Stat label="Coast Status" value={isCoastReady ? "✓ Coast-ready" : yearsToCoast !== null ? `${yearsToCoast} yrs to coast` : "Not reached"}
                    helper={isCoastReady ? `Full FIRE projected at age ${fiAge ?? "—"}` : `Coasting at age ${inputs.coastAge} → retire at ${inputs.targetRetirementAge}`} highlight={isCoastReady} />
                  <Stat label="Full FIRE Projected Age" value={fiAge ?? "—"} helper="If you keep contributing past coast age" />
                </div>
                <ProgressBar pct={coastProgress} label="Progress to Coast FIRE number"
                  sublabel={<>{money(result.startPortfolio, 0)} of {coastFireNumber ? money(coastFireNumber, 0) : "—"} · {isCoastReady ? <span className="text-emerald-300 font-semibold">Coast-ready!</span> : `${Math.round(coastProgress * 100)}% there`}</>} />
              </>)}

              {/* ── BARISTA ───────────────────────────────────────────────── */}
              {mode === "barista" && (<>
                <h2 className="text-2xl font-bold tracking-tight text-white">Your Barista FIRE number</h2>
                <p className="text-sm leading-6 text-slate-300">
                  {!hasCoreInputs
                    ? "Enter your inputs to see your Barista FIRE number."
                    : fiAge === null
                    ? <>Barista FIRE not projected within <strong>{inputs.maxYears} years</strong>. Try adjusting your inputs.</>
                    : <>With <strong>{money(inputs.baristaPartTimeIncome, 0)}/yr</strong> of part-time income, your portfolio only needs to cover <strong>{money(Math.max(0, annualExp - (Number(inputs.baristaPartTimeIncome) || 0)), 0)}/yr</strong> — reaching Barista FIRE at <strong>age {fiAge}</strong>.</>}
                </p>
                {/* Side-by-side */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">Barista FIRE</div>
                    <div className="mt-2 text-xs text-slate-400">{money(inputs.baristaPartTimeIncome, 0)}/yr part-time income</div>
                    <div className="mt-3 text-2xl font-bold text-white">{Number.isFinite(result.fireNumber) ? money(result.fireNumber, 0) : "—"}</div>
                    <div className="mt-1 text-sm text-amber-200">FIRE at age {fiAge ?? "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Full FIRE (no part-time income)</div>
                    <div className="mt-2 text-xs text-slate-400">Portfolio covers all expenses</div>
                    <div className="mt-3 text-2xl font-bold text-white">{fullFireForBarista && Number.isFinite(fullFireForBarista.fireNumber) ? money(fullFireForBarista.fireNumber, 0) : "—"}</div>
                    <div className="mt-1 text-sm text-slate-300">FIRE at age {fullFiAgeForBarista ?? "—"}</div>
                  </div>
                </div>
                {baristaYearsSaved !== null && baristaYearsSaved > 0 && (
                  <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                    Part-time income saves you <strong>{baristaYearsSaved} years</strong> vs waiting for full FIRE. That's the Barista FIRE advantage.
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="Barista FIRE Number" value={hasCoreInputs && Number.isFinite(result.fireNumber) ? money(result.fireNumber, 0) : "—"} helper={`At ${inputs.withdrawalRatePct}% withdrawal on the gap`} highlight />
                  <Stat label="Portfolio Gap Covered" value={hasCoreInputs ? money(Math.max(0, annualExp - (Number(inputs.baristaPartTimeIncome) || 0)), 0) : "—"} helper="Amount your portfolio must fund per year" />
                </div>
                <ProgressBar pct={progress.pct} label="Progress to Barista FIRE"
                  sublabel={<>{money(progress.current, 0)} {inputs.advanced ? "spendable toward FIRE" : "invested"} · {fiAge ? <>On track for Barista FIRE at <span className="font-semibold text-slate-200">{fiAge}</span></> : "Keep building"}</>} />
                {/* Part-time income sensitivity table */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-semibold text-white">Part-time income sensitivity</div>
                  <div className="mt-1 text-xs text-slate-400">How different income levels change your number and timeline</div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                    <div className="grid grid-cols-4 bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-widest text-slate-300/80">
                      <div>PT INCOME</div><div>FIRE #</div><div>YEARS</div><div>AGE</div>
                    </div>
                    <div className="divide-y divide-white/10">
                      {baristaTable.map(row => (
                        <div key={row.pt} className={["grid grid-cols-4 items-center px-3 py-2 text-sm", row.isCurrent ? "bg-amber-300/10" : ""].join(" ")}>
                          <div className="text-slate-200 font-medium">
                            {money(row.pt, 0)}
                            {row.isCurrent && <span className="ml-1 text-[10px] text-amber-300">←</span>}
                          </div>
                          <div className="text-slate-200">{Number.isFinite(row.fireNum) ? money(row.fireNum, 0) : "—"}</div>
                          <div className="text-slate-200">{row.yearsToFI ?? "—"}</div>
                          <div className="text-slate-200">{row.ageAtFI ?? "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>)}

              {/* ── Shared: methodology note ───────────────────────────────── */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <div className="font-semibold text-white mb-2">How this estimate works</div>
                <div className="text-xs leading-5 text-slate-400">
                  {MODE_NOTES[mode]} Returns use your selected volatility preset. Inflation and salary growth compound annually. This is a planning estimate, not financial or tax advice.
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              MOVE TAB
          ═══════════════════════════════════════════════════════════════ */}
          <section className={activeResultTab === "move" ? "block space-y-4" : "hidden"}>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="text-sm font-semibold text-amber-100">🔥 How a move could change your timeline</div>
              <div className="mt-1 text-xs text-amber-100/80">Same income and investing assumptions, spending adjusted by each city's cost profile.</div>
              <div className="mt-4 space-y-2">
                {viralCityResults.map(row => {
                  const isBest = row!.cityId === bestMoveRow?.cityId;
                  return (
                    <div key={row!.cityId} className={["flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm", isBest ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/10 bg-black/20"].join(" ")}>
                      <div className="text-slate-200">
                        {row!.cityName}, {row!.state}
                        {row!.isBaseline && <span className="ml-2 text-[11px] text-slate-400">(current)</span>}
                        {isBest && <span className="ml-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">Most years saved</span>}
                      </div>
                      <div className="text-right">
                        {!row!.isBaseline && row!.yearsToFI !== null && result.yearsToFI !== null && (
                          <div className={["font-semibold", (row!.deltaYears ?? 0) > 0 ? "text-emerald-200" : "text-slate-300"].join(" ")}>
                            {(row!.deltaYears ?? 0) > 0 ? `${row!.deltaYears} yrs earlier` : (row!.deltaYears ?? 0) < 0 ? `${Math.abs(row!.deltaYears ?? 0)} yrs slower` : "Same"}
                          </div>
                        )}
                        <div className="text-[12px] text-slate-300">{row!.ageAtFI === null ? "Not reached" : `FIRE at ${row!.ageAtFI}`}</div>
                        {!row!.isBaseline && (
                          <button type="button" onClick={() => setPinnedCompareCityId(c => c === row!.cityId ? null : row!.cityId)}
                            className={["mt-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition", pinnedCompareCityId === row!.cityId ? "border-sky-300/40 bg-sky-300/10 text-sky-200" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"].join(" ")}>
                            {pinnedCompareCityId === row!.cityId ? "Comparing" : "Compare"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {comparisonYearsSaved !== null && comparisonYearsSaved >= 5 && (
              <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                {comparisonYearsSaved >= 10 ? "That's a decade of your life back." : `You just brought FIRE forward by ${comparisonYearsSaved} years.`}
              </div>
            )}

            {/* Chart */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-slate-300">Portfolio projection</div>
                <div className="text-xs text-slate-400">{projection.length > 0 ? `Age ${projection[0].age} → ${projection[projection.length - 1].age}` : ""}</div>
              </div>
              <div className="mt-3 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonChartData} margin={{ top: 18, right: 24, bottom: 6, left: 6 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis dataKey="age" tick={{ fontSize: 12, fill: "rgba(148,163,184,0.95)" }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={{ fontSize: 12, fill: "rgba(148,163,184,0.95)" }} axisLine={false} tickLine={false} width={74}
                      tickFormatter={v => { const n = Number(v); if (!Number.isFinite(n)) return ""; if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`; if (n >= 1_000) return `${Math.round(n / 1_000)}k`; return `${Math.round(n)}`; }} />
                    <Tooltip formatter={(value, name) => {
                      const label =
                        name === "currentPortfolio" ? "Current path (raw)" :
                        name === "currentSpendablePortfolio" ? "Current path (spendable)" :
                        name === "proposedPortfolio" ? "Proposed move (raw)" :
                        name === "proposedSpendablePortfolio" ? "Proposed move (spendable)" :
                        "FIRE target";
                      return [money(Number(value), 0), label];
                    }} labelFormatter={l => `Age ${l}`}
                      contentStyle={{ background: "rgba(2,6,23,0.96)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "white" }}
                      itemStyle={{ color: "white" }} labelStyle={{ color: "rgba(226,232,240,0.9)" }} />
                    <Line type="monotone" dataKey="currentFireTarget" stroke="rgba(226,232,240,0.55)" strokeWidth={2} strokeDasharray="6 6" dot={false} />
                    <Line type="monotone"
                      dataKey={inputs.advanced ? "currentSpendablePortfolio" : "currentPortfolio"}
                      stroke="rgb(110 231 183)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                    {crossoverPoint && (
                      <ReferenceDot
                        x={crossoverPoint.age}
                        y={inputs.advanced ? crossoverPoint.spendablePortfolio : crossoverPoint.portfolio}
                        r={7} fill="rgb(16 185 129)" stroke="white" strokeWidth={2} ifOverflow="visible"
                        label={{ value: `Age · ${crossoverPoint.age}`, position: "top", fill: "rgba(226,232,240,0.95)", fontSize: 12 }} />
                    )}
                    {proposedComparison && (
                      <Line type="monotone"
                        dataKey={inputs.advanced ? "proposedSpendablePortfolio" : "proposedPortfolio"}
                        stroke="rgb(56 189 248)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                    )}
                    {/* Coast: show coastAge vertical reference */}
                    {mode === "coast" && (
                      <ReferenceLine x={inputs.coastAge} stroke="rgba(186,230,253,0.5)" strokeDasharray="4 4"
                        label={{ value: `Coast at ${inputs.coastAge}`, position: "top", fill: "rgba(186,230,253,0.8)", fontSize: 11 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                <div className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-300" />Current path</div>
                {proposedComparison && <div className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-400" />Proposed move</div>}
                <div className="inline-flex items-center gap-2"><span className="h-[2px] w-4 bg-slate-300/60" />FIRE target</div>
              </div>
            </div>

            {ADSENSE_SLOT_RESULTS && <AdSenseBlock slot={ADSENSE_SLOT_RESULTS} className="rounded-2xl border border-white/10 bg-black/20 p-4" />}
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              SAVINGS RATE TAB
          ═══════════════════════════════════════════════════════════════ */}
          <section className={activeResultTab === "savings" ? "block" : "hidden"}>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">How savings rate changes your timeline</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">Same after-tax income, expenses adjusted to match each savings rate.
                {mode === "barista" ? " Part-time income offset is applied at each row." : ""}
                {mode === "coast"   ? " Contributions stop at coast age in all scenarios." : ""}
              </div>
              <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300">
                Current rate: {pct(savingsRate)} · nearest row highlighted
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-4 bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-widest text-slate-300/80">
                  <div>RATE</div><div>SPENDING</div><div>YEARS</div><div>AGE</div>
                </div>
                <div className="divide-y divide-white/10">
                  {savingsTable.map(row => {
                    const isCurrent = row.savingsRatePct === nearestSavingsRateRow;
                    return (
                      <div key={row.savingsRatePct} className={["grid grid-cols-4 items-center px-3 py-3 text-sm", isCurrent ? "bg-emerald-300/10" : ""].join(" ")}>
                        <div className="text-slate-200">
                          <div className="font-medium">{row.savingsRatePct}%</div>
                          {isCurrent && <span className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">Current</span>}
                        </div>
                        <div className="text-slate-200">{money(row.impliedExpenses, 0)}</div>
                        <div className="text-slate-200">{netAnnual <= 0 ? "—" : row.yearsToFI === null ? "—" : row.yearsToFI}</div>
                        <div className="text-slate-200">{netAnnual <= 0 ? "—" : row.ageAtFI === null ? "—" : row.ageAtFI}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ── Decision engine ──────────────────────────────────────────────── */}
<DecisionEngineCard result={decisionEngine} />

          {/* ── Under-invested nudge (advanced mode only) ─────────────────── */}
          {nudge && (
            <div className="rounded-2xl border border-yellow-300/25 bg-yellow-300/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-yellow-200 mb-2">💡 Insight based on your inputs</div>
              <p className="text-sm text-yellow-100/90">{nudge}</p>
              <p className="mt-2 text-xs text-yellow-100/60">See account recommendations below.</p>
            </div>
          )}

          {/* ── Affiliate cards ───────────────────────────────────────────── */}
          {MODE_AFFILIATES[mode].length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                {nudge ? "Recommended accounts for your situation" : "Accounts worth considering"}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {MODE_AFFILIATES[mode].map(a => <AffiliateCard key={a.name} a={a} />)}
              </div>
              <p className="mt-3 text-[11px] text-slate-500">Affiliate links — we may earn a commission at no cost to you. Recommendations are based on your FIRE mode, not paid placement.</p>
            </div>
          )}

          {/* ── UPSELL PLACEHOLDER ───────────────────────────────────────── */}
         <FireEmailCapture fireAge={fiAge} location={baselineCity?.name} />

<FireUpsellCard fireAge={fiAge} yearsToFI={result.yearsToFI} />

          {/* ── Share button ──────────────────────────────────────────────── */}
          <button onClick={handleShare}
            className="relative z-50 w-full rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20">
            {shareStatus === "copied" ? "Link copied!" : shareStatus === "shared" ? "Shared!" : shareStatus === "error" ? "Share failed" : "Share My FIRE Result"}
          </button>
        </div>
      </section>

      {/* ── Internal FAQ (mode-specific, hideable) ──────────────────────────── */}
      {!hideFAQ && (
        <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-lg font-semibold text-white">
            {mode === "standard" ? "Frequently asked questions" : `Frequently asked questions about ${MODE_NAV.find(n => n.mode === mode)?.label}`}
          </h3>
          <div className="mt-4 grid gap-3">
            {INTERNAL_FAQS[mode].map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={faq.q} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <button type="button" onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left">
                    <span className="text-sm font-medium text-white">{faq.q}</span>
                    <span className="text-lg leading-none text-amber-400">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && <div className="border-t border-white/10 px-4 py-4 text-sm leading-7 text-slate-300">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );

}
