"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import CalculatorNumberField from "./calculator-form/CalculatorNumberField";
import FireReport, { type FireReportInputs } from "@/components/FireReport";
import { MODE_NOTES } from "@/lib/fireModes";
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
import { estimateNetAnnual, estimateNetBreakdown, EMPLOYEE_401K_LIMIT } from "@/lib/wageTax";
import type { FilingStatus } from "@/lib/tax";
import Link from "next/link";
import ExampleResultsNotice from "./ExampleResultsNotice";
import { parseFireAbroadLink, parseFireLink } from "@/lib/fireLink";
import { monthlyDepositFactor } from "@/lib/depositTiming";

// The AI-written FIRE report is hidden until the API key is live-tested. Set NEXT_PUBLIC_AI_REPORTS=1 to show it again.
const AI_REPORTS_ENABLED = process.env.NEXT_PUBLIC_AI_REPORTS === "1";

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
  /** When true, the FIRE target uses retirementExpensesMonthly (today's dollars) while saving before FIRE still uses expensesMonthly. */
  retirementDifferent: boolean;
  retirementExpensesMonthly: number;
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
  /** Gross income after the move; 0 means unchanged. */
  movedIncome:      number;
  /** State after the move; "" means unchanged. */
  movedState:       StateChoice;
  /** City whose local taxes apply after the move; "" uses the state's largest city. */
  movedCityId:      string;
  /** One-time moving costs that are spent, taken from savings in the moved scenario. */
  movedCost:        number;
  /** The move is to a place outside the U.S.: no state income tax after it (federal tax still applies; foreign taxes are not modeled). */
  movedAbroad:      boolean;
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
  /** After-tax part-time income already earned today; it adds to saving before FIRE (unlike baristaPartTimeIncome, which only lowers the yearly gap). */
  baristaIncomeNow: number;
  /** Age at which the part-time income stops (0 = it lasts through retirement). After it, the portfolio must cover full spending. */
  baristaEndAge: number;
  // ── Withdrawal tax rate (Traditional account haircut) ──
  withdrawalTaxRatePct: number;
  // What-if scenarios only: extra dollars invested each year (in addition to the configured saving), never set by the form.
  scenarioExtraSaving?: number;
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

// ── Mode nav ──────────────────────────────────────────────────────────────────
const MODE_NAV: { mode: FireMode; label: string; href: string }[] = [
  { mode: "standard", label: "FIRE",         href: "/fire-calculator"         },
  { mode: "lean",     label: "Lean FIRE",    href: "/lean-fire-calculator"    },
  { mode: "coast",    label: "Coast FIRE",   href: "/coast-fire-calculator"   },
  { mode: "barista",  label: "Barista FIRE", href: "/barista-fire-calculator" },
];

// ── Mode-specific affiliates (swap hrefs for real affiliate links later) ──────
const MODE_AFFILIATES: Record<FireMode, Affiliate[]> = {
  standard: [
    { name: "Fidelity",    blurb: "Zero-fee index funds and commission-free trades. A solid foundation for a long-term FIRE portfolio.", href: "#", tag: "Brokerage"   },
    { name: "Vanguard",    blurb: "The original low-cost index fund platform. Built for buy-and-hold FIRE investors.",                   href: "#", tag: "Index funds" },
    { name: "M1 Finance",  blurb: "Automated investing with custom portfolios. Good for hands-off savers on the path to FI.",           href: "#", tag: "Automated"   },
  ],
  lean: [
    { name: "Fidelity",    blurb: "Zero-fee funds, essential when every basis point matters on a lean plan.",          href: "#", tag: "Brokerage"   },
    { name: "Vanguard",    blurb: "Lowest-cost funds available. Critical when a lean budget leaves no room for fees.", href: "#", tag: "Index funds" },
    { name: "Ally Bank",   blurb: "High-yield savings for your emergency fund and cash buffer.",                        href: "#", tag: "HYSA"         },
  ],
  coast: [
    { name: "Fidelity",    blurb: "Strong IRA and brokerage options, ideal once contributions stop and compounding takes over.", href: "#", tag: "Brokerage"    },
    { name: "Vanguard",    blurb: "Low-cost index funds let compounding work without friction in the coast phase.",               href: "#", tag: "Index funds"  },
    { name: "Betterment",  blurb: "Set-and-forget robo-advisor. Once you've coasted, automation does the rest.",                 href: "#", tag: "Robo-advisor" },
  ],
  barista: [
    { name: "Fidelity",       blurb: "Strong IRA and HSA options, important when employer benefits are limited.", href: "#", tag: "Brokerage"  },
    { name: "Stride Health",  blurb: "Find affordable health insurance for self-employed and part-time workers.", href: "#", tag: "Healthcare" },
    { name: "M1 Finance",     blurb: "Automate investing around a part-time schedule with custom portfolio pies.", href: "#", tag: "Automated"  },
  ],
};

// ── Internal FAQs per mode ────────────────────────────────────────────────────
const INTERNAL_FAQS: Record<FireMode, { q: string; a: string }[]> = {
  standard: [
    { q: "Why does location affect my FIRE timeline?",  a: "Location changes two of the biggest drivers: taxes and spending. A lower-cost or lower-tax city can increase how much you keep and reduce how much you need." },
    { q: "Are the tax numbers exact?",                  a: "No. They are simplified estimates based on your state and filing status, for planning comparisons, not tax filing." },
    { q: "Why does my FIRE number change between cities?", a: "Your FIRE number is based on spending. If projected spending changes in a different city, the portfolio needed changes too." },
    { q: "Does Move Impact assume the same salary?",    a: "Yes. It isolates the effect of location, same income and investing assumptions, different expenses." },
  ],
  lean: [
    { q: "What counts as Lean FIRE?",         a: "There's no official threshold. Many use $40,000/year or less as a rough benchmark. The real question is whether the target spending is sustainably low for your life." },
    { q: "Is Lean FIRE risky?",               a: "It leaves less cushion for surprises like healthcare costs. It's most sustainable when paired with flexibility, like the ability to earn a small amount if needed." },
    { q: "How does location help with Lean FIRE?", a: "Lower-cost cities reduce annual spending directly, which shrinks both your FIRE number and the years needed to reach it." },
    { q: "What withdrawal rate should I use?", a: "Many Lean FIRE planners use 3.5% or below for long retirement horizons, since the margin for error is smaller." },
  ],
  coast: [
    { q: "What is the Coast FIRE number?",           a: "The amount you need invested today so compound growth alone, with no new contributions, grows your portfolio to your full FIRE target by retirement age." },
    { q: "How is Coast FIRE different from regular FIRE?", a: "Regular FIRE means you already have enough to fund retirement. Coast FIRE is an earlier milestone, compounding can do the rest, but you still need earned income for current expenses." },
    { q: "What return should I use?",                a: "Many people use 5–7% as a planning range. Small changes matter a lot because Coast FIRE depends heavily on long compounding periods." },
    { q: "Can I stop working after reaching Coast FIRE?", a: "Not necessarily. You still need income to cover current living costs. Coast FIRE only means you can stop contributing to retirement investments." },
  ],
  barista: [
    { q: "What counts as Barista FIRE?",           a: "Working part-time, in any field, to cover some expenses, letting a smaller portfolio cover the rest. The name comes from taking a low-stress job, sometimes one with benefits." },
    { q: "How does part-time income reduce my FIRE number?", a: "It reduces the gap your portfolio must cover. Less gap ÷ withdrawal rate = smaller target." },
    { q: "What about healthcare?",                 a: "Healthcare is the biggest wildcard. Some part-time jobs offer benefits, which can meaningfully reduce financial pressure on your portfolio." },
    { q: "Is Barista FIRE a permanent state?",     a: "Not necessarily. Many use it as a bridge, working part-time while the portfolio grows, eventually transitioning to full FIRE." },
  ],
};

// ── Per-mode default inputs ───────────────────────────────────────────────────
const BASE_DEFAULTS: Inputs = {
  preset: "custom",
  age: 30, income: 90000, expensesMonthly: 4000,
  retirementDifferent: false, retirementExpensesMonthly: 0,
  state: "ny", filingStatus: "single", k401Pct: 8,
  currentPortfolio: 75000, yearlyInvestment: 0,
  advanced: false, targetFireAge: 45,
  bal401k: 0, balIra: 0, balBrokerage: 0,
  contrib401k: 0, contribIra: 0, contribBrokerage: 0,
  withdrawalRatePct: 4, maxYears: 60,
  inflationPct: 2.5, salaryGrowthPct: 3,
  phase2StartsYear: 10,
  moveCompareOn: true, movedExpensesMonthly: 2800,
  movedIncome: 0, movedState: "", movedCityId: "", movedCost: 0, movedAbroad: false,
  taxTreatment401k: "traditional", taxTreatmentIra: "traditional",
  brokerageTaxMode: "simple", brokerageTaxEfficiency: "high", brokerageTaxDragPct: 0.3,
  employerMatchPct: 0, employerMatchCapPct: 6,
  volatility: "moderate",
  coastAge: 40, targetRetirementAge: 65,
  baristaPartTimeIncome: 24000,
  baristaIncomeNow: 0,
  baristaEndAge: 0,
  withdrawalTaxRatePct: 15,
};

const MODE_OVERRIDES: Record<FireMode, Partial<Inputs>> = {
  standard: {},
  // Lean keeps current spending at the standard default and makes the lean amount the retirement budget, so a lean budget can be compared
  // with the same income and saving.
  lean:     { retirementDifferent: true, retirementExpensesMonthly: 2500, withdrawalRatePct: 3.5 },
  coast:    { coastAge: 40, targetRetirementAge: 65 },
  barista:  { expensesMonthly: 5000, baristaPartTimeIncome: 24000 },
};

// Chubby and Fat FIRE share the standard engine; their pages start from a spending level that matches the page text
// (Chubby about $100,000 to $150,000 a year, Fat $200,000 or more) with an income and portfolio that make it reachable.
type SpendingPreset = "chubby" | "fat";
const SPENDING_PRESETS: Record<SpendingPreset, Partial<Inputs>> = {
  chubby: { income: 250000, expensesMonthly: 10000, currentPortfolio: 250000 },
  fat:    { income: 500000, expensesMonthly: 20000, currentPortfolio: 750000 },
};

// Optional monthly spending categories for the Chubby and Fat pages; each set adds up to the page's default spending.
const SPENDING_CATEGORY_DEFAULTS: Record<SpendingPreset, Record<string, number>> = {
  chubby: { "Housing": 3500, "Food and dining": 1500, "Travel": 1500, "Healthcare": 800, "Transportation": 700, "Everything else": 2000 },
  fat:    { "Housing": 7000, "Food and dining": 2500, "Travel": 4000, "Healthcare": 1500, "Transportation": 1500, "Everything else": 3500 },
};

function presetFromPathname(p: string): SpendingPreset | undefined {
  if (p.includes("chubby-fire")) return "chubby";
  if (p.includes("fat-fire")) return "fat";
  return undefined;
}

function defaultsForMode(mode: FireMode, initialIncome: number, spending?: SpendingPreset): Inputs {
  const merged: Inputs = {
    ...BASE_DEFAULTS,
    ...MODE_OVERRIDES[mode],
    ...(spending ? SPENDING_PRESETS[spending] : {}),
    income: initialIncome > 0 ? initialIncome : (spending ? SPENDING_PRESETS[spending].income ?? BASE_DEFAULTS.income : BASE_DEFAULTS.income),
  };
  // Spending after a move starts equal to spending now, so a move shows no gain until you enter what you expect to spend there: an assumed
  // cut in spending would be credited to geography.
  return { ...merged, movedExpensesMonthly: merged.expensesMonthly };
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

function annualExpensesFromMonthly(m: number)  { return Math.max(0, (Number(m) || 0) * 12); }
function annualExpenses(i: Inputs)             { return annualExpensesFromMonthly(i.expensesMonthly); }
function annualMovedExpenses(i: Inputs)        { return annualExpensesFromMonthly(i.movedExpensesMonthly); }
/**
 * Yearly spending the portfolio must support in retirement, in today's dollars, when the spending used before FIRE is `currentUsed`
 * (the entered amount, or a scenario's: a move, a spending cut). Without a separate retirement budget it is `currentUsed`. With one,
 * the retirement budget moves in proportion to the scenario's change in current spending, so a cheaper city also lowers it.
 */
function retirementAnnualFor(i: Inputs, currentUsed: number): number {
  if (!i.retirementDifferent) return currentUsed;
  const entered = annualExpenses(i);
  const retirement = annualExpensesFromMonthly(i.retirementExpensesMonthly);
  return entered > 0 ? (retirement * currentUsed) / entered : retirement;
}

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

// Balances and contributions are used exactly as entered, so an explicit zero stays zero.
function applyBrokerageAutofill(i: Inputs) {
  return { balBrokerage: i.balBrokerage, contribBrokerage: i.contribBrokerage };
}

// When Advanced is switched on, copy the simple-mode portfolio and yearly investment into the empty brokerage fields once.
function seedAdvancedFromSimple(i: Inputs): Inputs {
  return {
    ...i,
    balBrokerage: i.balBrokerage === 0 && i.currentPortfolio > 0 ? i.currentPortfolio : i.balBrokerage,
    contribBrokerage: i.contribBrokerage === 0 && i.yearlyInvestment > 0 ? i.yearlyInvestment : i.contribBrokerage,
  };
}

// Pays a one-time cost from the taxable account first, then the IRA, then the 401(k). Taxes or penalties on retirement-account
// money are not modelled. Anything beyond total savings cannot be paid (see moveCostShortfall).
function applyMoveCost(i: Inputs, cost: number): Inputs {
  const amount = Math.max(0, Number(cost) || 0);
  if (!i.advanced) return { ...i, currentPortfolio: Math.max(0, i.currentPortfolio - amount) };
  let rest = amount;
  const take = (balance: number) => { const t = Math.min(Math.max(0, balance), rest); rest -= t; return balance - t; };
  return { ...i, balBrokerage: take(i.balBrokerage), balIra: take(i.balIra), bal401k: take(i.bal401k) };
}

function moveCostShortfall(i: Inputs): number {
  const funds = i.advanced ? Math.max(0, i.balBrokerage) + Math.max(0, i.balIra) + Math.max(0, i.bal401k) : Math.max(0, i.currentPortfolio);
  return Math.max(0, (Number(i.movedCost) || 0) - funds);
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
// Roth accounts and brokerage are post-tax, no haircut.
function calcSpendableFromBuckets(i: Inputs, b: Buckets): number {
  const wTax = (Number(i.withdrawalTaxRatePct) || 0) / 100;
  const sp401k = i.taxTreatment401k === "traditional" ? b.b401k * (1 - wTax) : b.b401k;
  const spIra  = i.taxTreatmentIra   === "traditional" ? b.bIra  * (1 - wTax) : b.bIra;
  return sp401k + spIra + b.bBrokerage;
}

// Take-home pay by year. A number is a flat starting take-home that grows at the salary-growth rate (used by tests and
// simple callers); a function returns the take-home for a given number of years from now (see makeNetPath).
type NetBasis = number | ((yearsFromNow: number) => number);

function netAt(basis: NetBasis, yearsFromNow: number, i: Inputs): number {
  if (typeof basis === "function") return basis(yearsFromNow);
  return basis * Math.pow(1 + (Number(i.salaryGrowthPct) || 0) / 100, Math.max(0, yearsFromNow));
}

// Take-home pay for each future year, recomputed through the tax engine: gross pay grows at the salary-growth rate, and the
// tax rules (brackets, deductions, payroll wage base, 401(k) limit) are assumed to be indexed to inflation, so each year’s
// pay is taxed at today’s scale in today’s dollars and scaled back up. Pay that grows faster than inflation therefore moves
// into higher brackets; pay that grows slower does not.
function makeNetPath(a: {
  gross: number; state: StateChoice; filing: FilingStatus; k401Pct: number; cityId?: string;
  salaryGrowthPct: number; inflationPct: number;
}): (yearsFromNow: number) => number {
  const salG = (Number(a.salaryGrowthPct) || 0) / 100;
  const infl = (Number(a.inflationPct) || 0) / 100;
  const cache = new Map<number, number>();
  return (yearsFromNow: number) => {
    const y = Math.max(0, Math.round(yearsFromNow));
    const hit = cache.get(y);
    if (hit !== undefined) return hit;
    const grossY = Math.max(0, a.gross) * Math.pow(1 + salG, y);
    let net: number;
    if (!a.state) net = grossY;
    else {
      const index = Math.pow(1 + infl, y);
      net = estimateNetAnnual({
        grossAnnual: y === 0 ? a.gross : grossY / index,
        state: a.state as StateCode, filing: a.filing, k401Pct: a.k401Pct, cityId: a.cityId,
      }) * (y === 0 ? 1 : index);
    }
    cache.set(y, net);
    return net;
  };
}

// The simple-mode 401(k) deferral for a given year: the percentage of that year's gross pay, capped at the 401(k) limit, with
// both pay and the limit following the same assumptions as makeNetPath (pay grows at the salary-growth rate; the limit and the
// tax rules are indexed to inflation). Take-home pay and the credited saving therefore always use the same dollars.
function simpleDeferralForYear(i: Inputs, yearsFromNow: number): number {
  if (!i.state) return 0;
  const y = Math.max(0, Math.round(yearsFromNow));
  const salG = (Number(i.salaryGrowthPct) || 0) / 100;
  const infl = (Number(i.inflationPct) || 0) / 100;
  const pct = clamp(Number(i.k401Pct) || 0, 0, 60) / 100;
  const grossY = Math.max(0, Number(i.income) || 0) * Math.pow(1 + salG, y);
  return Math.min(grossY * pct, EMPLOYEE_401K_LIMIT * Math.pow(1 + infl, y));
}

// Projection length in whole years (the field accepts decimals; the simulation and the chart both use this).
function horizonYears(i: Inputs): number {
  return Math.max(0, Math.round(Number(i.maxYears) || 0));
}

// Starting balances and per-bucket annual contributions.
// Simple mode: everything goes into the brokerage bucket (no account distinction).
// Advanced mode: each account is seeded from user inputs.
function initBuckets(i: Inputs, netBasis: NetBasis): {
  start: Buckets;
  annualContrib: Buckets;
  employerMatch: number;
} {
  const { balBrokerage, contribBrokerage } = applyBrokerageAutofill(i);
  const match = calcEmployerMatch(i);

  if (!i.advanced) {
    const autoInvest = Math.max(0, netAt(netBasis, 0, i) - annualExpenses(i));
    const contrib    = i.yearlyInvestment > 0 ? i.yearlyInvestment : autoInvest;
    // Take-home pay already excludes the 401(k) deferral, so the deferral is saved too (year by year; see growBuckets).
    const deferral = simpleDeferralForYear(i, 0);
    return {
      start:         { b401k: 0, bIra: 0, bBrokerage: i.currentPortfolio },
      annualContrib: { b401k: deferral, bIra: 0, bBrokerage: contrib },
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
//   401k / IRA:  base return (tax-deferred, no annual drag)
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

  // Simple mode: the same year-specific deferral the tax path removed from take-home pay.
  const deferral  = i.advanced ? annualContrib.b401k : simpleDeferralForYear(i, yearIndex);
  const c401k      = pastCoast ? 0 : deferral + employerMatch;
  const cIra       = pastCoast ? 0 : annualContrib.bIra;
  // Simple mode with an explicit yearly investment uses that amount; with it blank, the automatic amount is used.
  const useConfigured = i.advanced || (Number(i.yearlyInvestment) || 0) > 0;
  const extraSaving = Math.max(0, Number(i.scenarioExtraSaving) || 0);
  const cBrokerage = pastCoast ? 0 : (useConfigured ? annualContrib.bBrokerage : autoContrib) + extraSaving;

 const brokerageReturn = Math.max(-0.99, r - drag);

// Each year's contribution arrives as twelve monthly end-of-month deposits (see depositTiming.ts), so it earns part of the
// year's return; the taxable bucket uses its own return after tax drag.
return {
  b401k: b.b401k * (1 + r) + Math.max(0, c401k) * monthlyDepositFactor(r),
  bIra: b.bIra * (1 + r) + Math.max(0, cIra) * monthlyDepositFactor(r),
  bBrokerage: b.bBrokerage * (1 + brokerageReturn) + Math.max(0, cBrokerage) * monthlyDepositFactor(brokerageReturn),
};
}

// Base nominal return from volatility preset, used by growBuckets.
function returnForYear(i: Inputs, yearIndex: number): number {
  const y       = Math.max(0, yearIndex);
  const switchAt = clamp(Number(i.phase2StartsYear) || 0, 0, 200);
  const p       = VOLATILITY_PRESETS[i.volatility];
  return (y >= switchAt ? p.phase2 : p.phase1) / 100;
}

// ── Coast FIRE target ─────────────────────────────────────────────────────────
// Everything is nominal and dated. Spending is entered in today's dollars, so it is inflated from the current age to the
// retirement age; the FIRE number at retirement is that spending / withdrawal rate. The amount you need at a given future
// moment is that number discounted by the growth between that moment and retirement (Phase 1, then Phase 2 returns, less
// brokerage tax drag on the taxable share), and grossed up for the withdrawal tax on traditional accounts.
function coastTargetAtYear(i: Inputs, yearsFromNow: number): number {
  const swr  = (Number(i.withdrawalRatePct) || 0) / 100;
  const infl = (Number(i.inflationPct) || 0) / 100;
  const retireIn = Math.max(0, Math.round(i.targetRetirementAge - i.age));
  const t = clamp(Math.round(yearsFromNow), 0, retireIn);
  const retirementAnnualExpenses = retirementAnnualFor(i, annualExpenses(i)) * Math.pow(1 + infl, retireIn);
  const futureFireNumber = swr > 0 ? retirementAnnualExpenses / swr : Infinity;

  const { brokerage: brokerageShare, traditional: traditionalShare } = portfolioShares(i);
  const drag = getBrokerageTaxDrag(i) * brokerageShare;
  let growth = 1;
  for (let k = t; k < retireIn; k++) growth *= 1 + Math.max(-0.99, returnForYear(i, k) - drag);

  const wTax = (Number(i.withdrawalTaxRatePct) || 0) / 100;
  const spendableFraction = Math.max(0.01, 1 - wTax * traditionalShare);
  return futureFireNumber / spendableFraction / growth;
}

// The balance needed at the coast age (the headline Coast FIRE number).
function calcCoastFireNumber(i: Inputs): number {
  return coastTargetAtYear(i, Math.max(0, i.coastAge - i.age));
}

// ── Barista FIRE target ───────────────────────────────────────────────────────
// With no end age the part-time income lasts through retirement, so the portfolio funds only the gap (spending less that income).
// With an end age, the portfolio at year y must fund the gap until then and then be large enough to fund full spending: it is the
// full FIRE number at the end age, discounted back by the returns in between, plus the gap withdrawals taken at the start of each year.
// All amounts are nominal; spending and the part-time income grow with inflation.
function baristaTargetAt(i: Inputs, rawTarget: number, y: number): number {
  const swr  = (Number(i.withdrawalRatePct) || 0) / 100;
  const infl = (Number(i.inflationPct) || 0) / 100;
  if (swr <= 0) return Infinity;
  const grow = (n: number) => Math.pow(1 + infl, n);
  const partTime = Number(i.baristaPartTimeIncome) || 0;
  const endAge = Number(i.baristaEndAge) || 0;
  const gap = Math.max(0, rawTarget - partTime);
  if (endAge <= 0) return (gap * grow(y)) / swr;
  const yearsOfIncome = Math.round(endAge - (i.age + y));
  if (yearsOfIncome <= 0) return (rawTarget * grow(y)) / swr;
  let need = (rawTarget * grow(y + yearsOfIncome)) / swr;
  for (let j = yearsOfIncome - 1; j >= 0; j--) {
    need = gap * grow(y + j) + need / (1 + returnForYear(i, y + j));
  }
  return need;
}

// Rough split of the portfolio between taxable and traditional accounts, from balances and yearly contributions.
// Simple mode is entirely taxable.
function portfolioShares(i: Inputs): { brokerage: number; traditional: number } {
  if (!i.advanced) return { brokerage: 1, traditional: 0 };
  const { balBrokerage, contribBrokerage } = applyBrokerageAutofill(i);
  const brokerage   = Math.max(0, balBrokerage) + Math.max(0, contribBrokerage);
  const traditional =
    (i.taxTreatment401k === "traditional" ? Math.max(0, i.bal401k) + Math.max(0, i.contrib401k) : 0) +
    (i.taxTreatmentIra === "traditional" ? Math.max(0, i.balIra) + Math.max(0, i.contribIra) : 0);
  const total = brokerage + traditional + (i.taxTreatment401k === "traditional" ? 0 : Math.max(0, i.bal401k) + Math.max(0, i.contrib401k))
    + (i.taxTreatmentIra === "traditional" ? 0 : Math.max(0, i.balIra) + Math.max(0, i.contribIra));
  return total > 0 ? { brokerage: brokerage / total, traditional: traditional / total } : { brokerage: 1, traditional: 0 };
}

// ── Core simulation, all 4 modes ────────────────────────────────────────────
function simulateYearsToFI(
  i: Inputs,
  netAnnualBase: NetBasis,
  mode: FireMode = "standard",
  override?: { expensesAnnualBase?: number }
) {
  const swr  = (Number(i.withdrawalRatePct) || 0) / 100;
  const infl = (Number(i.inflationPct) || 0) / 100;

  const rawExpenses  = override?.expensesAnnualBase ?? annualExpenses(i);
  // The FIRE target is built from retirement spending (the same as current spending unless a separate budget is entered).
  const rawTarget = retirementAnnualFor(i, rawExpenses);
  const baseExpenses = mode === "barista"
    ? Math.max(0, rawTarget - (Number(i.baristaPartTimeIncome) || 0))
    : rawTarget;

  // Part-time income you already earn today adds to saving before FIRE; the income that starts after you leave full-time work only lowers the gap.
  const savingBase = mode === "barista" ? Math.max(0, rawExpenses - (Number(i.baristaIncomeNow) || 0)) : rawExpenses;

  const { start, annualContrib, employerMatch } = initBuckets(i, netAnnualBase);
  let buckets = { ...start };
  let years   = 0;

  // The portfolio needed at a given year. Barista uses its own target (which can account for the part-time income ending).
  const targetAt = (y: number) => mode === "barista"
    ? baristaTargetAt(i, rawTarget, y)
    : swr > 0 ? (baseExpenses * Math.pow(1 + infl, y)) / swr : Infinity;
  const fire0 = targetAt(0);
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

const horizon = horizonYears(i);
while (years < horizon) {
  const netY = netAt(netAnnualBase, years, i);
  const ageY = i.age + years;
  const pastCoast = mode === "coast" && ageY >= i.coastAge;

  let autoContrib = 0;
  if (!i.advanced && (Number(i.yearlyInvestment) || 0) <= 0) {
    const expThisYear = savingBase * Math.pow(1 + infl, years);
    autoContrib = Math.max(0, netY - expThisYear);
  }

  buckets = growBuckets(buckets, i, years, annualContrib, employerMatch, pastCoast, autoContrib);
  years++;

  const fireTarget = targetAt(years);

  if (calcSpendableFromBuckets(i, buckets) >= fireTarget) break;
}

const fireEnd = targetAt(years);

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
// Coast-ready in year t means the balance at that moment is at least what you would need then to stop contributing and
// still reach the retirement target (coastTargetAtYear). Contributions stop at the coast age, as in the projection. If the
// target is not met before the retirement age, there is no coast-ready date for that retirement objective: null.
// Coast uses the raw total portfolio (not spendable) because the target already grosses up for withdrawal tax.
function simulateYearsToCoast(i: Inputs, netAnnualBase: NetBasis): number | null {
  const retireIn = Math.max(0, Math.round(i.targetRetirementAge - i.age));
  const horizon = Math.min(retireIn, horizonYears(i));

  const { start, annualContrib, employerMatch } = initBuckets(i, netAnnualBase);
  let buckets = { ...start };

  const target0 = coastTargetAtYear(i, 0);
  if (!Number.isFinite(target0)) return null;
  if (totalFromBuckets(buckets) >= target0) return 0;

  let years = 0;
  while (years < horizon) {
    const netY = netAt(netAnnualBase, years, i);
    let autoContrib = 0;
    if (!i.advanced && (Number(i.yearlyInvestment) || 0) <= 0) {
      autoContrib = Math.max(0, netY - annualExpenses(i) * Math.pow(1 + (Number(i.inflationPct) || 0) / 100, years));
    }
    const pastCoastAge = i.age + years >= i.coastAge;
    buckets = growBuckets(buckets, i, years, annualContrib, employerMatch, pastCoastAge, autoContrib);
    years++;
    if (totalFromBuckets(buckets) >= coastTargetAtYear(i, years)) return years;
  }
  return null;
}

// ── Projection builders ───────────────────────────────────────────────────────
function buildProjectionWithExpenses(
  i: Inputs, netAnnualBase: NetBasis, yearsToFI: number | null,
  baseExpenses: number, mode: FireMode = "standard"
): ChartPoint[] {
  const infl = (Number(i.inflationPct) || 0) / 100;
  const swr  = (Number(i.withdrawalRatePct) || 0) / 100;

  const { start, annualContrib, employerMatch } = initBuckets(i, netAnnualBase);
  const targetBase = retirementAnnualFor(i, baseExpenses);
  const effBase  = mode === "barista" ? Math.max(0, targetBase - (Number(i.baristaPartTimeIncome) || 0)) : targetBase;
  const stopAt  = yearsToFI === null ? horizonYears(i) : clamp(yearsToFI + 2, 0, horizonYears(i));

  const pts: ChartPoint[] = [];
  let buckets = { ...start };

 function makePoint(age: number, b: Buckets, y: number): ChartPoint {
  const portfolio = totalFromBuckets(b);
  const spendablePortfolio = calcSpendableFromBuckets(i, b);
  const expY = targetBase * Math.pow(1 + infl, y);
  const effExpY = effBase * Math.pow(1 + infl, y);
  const fullTgt = swr > 0 ? expY / swr : Infinity;
  const effTgt = mode === "barista" ? baristaTargetAt(i, targetBase, y) : swr > 0 ? effExpY / swr : Infinity;

  return {
    age,
    portfolio,
    spendablePortfolio,
    ...(mode === "standard" ? { fireTarget: fullTgt } : {}),
    ...(mode === "lean" ? { leanFireTarget: effTgt, fullFireTarget: fullTgt } : {}),
    ...(mode === "coast" ? { fireTarget: fullTgt, coastNumber: coastTargetAtYear(i, y) } : {}),
    ...(mode === "barista" ? { baristaTarget: effTgt, fullFireTarget: fullTgt } : {}),
  };
}

  pts.push(makePoint(i.age, buckets, 0));

  for (let y = 1; y <= stopAt; y++) {
    const effExpY   = effBase * Math.pow(1 + infl, y - 1);
    const netY      = netAt(netAnnualBase, y - 1, i);
    const ageY      = i.age + (y - 1);
    const pastCoast = mode === "coast" && ageY >= i.coastAge;

    let autoContrib = 0;
    if (!i.advanced && (Number(i.yearlyInvestment) || 0) <= 0) {
      const savingExpY = (mode === "barista" ? Math.max(0, baseExpenses - (Number(i.baristaIncomeNow) || 0)) : baseExpenses) * Math.pow(1 + infl, y - 1);
      autoContrib = Math.max(0, netY - savingExpY);
    }

    buckets = growBuckets(buckets, i, y - 1, annualContrib, employerMatch, pastCoast, autoContrib);
    pts.push(makePoint(i.age + y, buckets, y));
  }
  return pts;
}

function buildProjection(i: Inputs, netAnnualBase: NetBasis, yearsToFI: number | null, mode: FireMode = "standard") {
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
    return `You may be leaving free employer match on the table, worth up to ${money(calcEmployerMatch(i), 0)}/year at your salary.`;

  if (balBrokerage > 0 && i.bal401k === 0 && i.balIra === 0)
    return "Your entire portfolio is in a taxable brokerage. Adding tax-sheltered accounts (401k or IRA) can reduce annual drag over a long compounding period.";

  if (mode === "barista" && (Number(i.baristaPartTimeIncome) || 0) > 0)
    return "Part-time work often means no employer healthcare. Budget for this separately, it's one of the biggest wildcards in Barista FIRE.";

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
          "A higher savings rate means more capital compounding every year, the most direct lever on any FIRE timeline.",
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


// The fully specified "move" scenario: moved income and state (taxed in the new state and city, year by year), the moved spending,
// and the one-time moving cost paid from savings before the clock starts. The move card and the recommendations both use it.
function buildMovedScenario(i: Inputs): { inputs: Inputs; net: NetBasis } {
  const stateChoice = ((i.movedAbroad ? "tx" : i.movedState || i.state) || "") as StateChoice;
  const gross = i.movedIncome > 0 ? i.movedIncome : i.income;
  const net = makeNetPath({
    gross, state: stateChoice, filing: i.filingStatus, k401Pct: i.k401Pct,
    cityId: stateChoice ? (i.movedState && i.movedCityId ? i.movedCityId : getBaselineCityIdForState(stateChoice)) : undefined,
    salaryGrowthPct: i.salaryGrowthPct, inflationPct: i.inflationPct,
  });
  const funded = applyMoveCost(i, Math.max(0, i.movedCost));
  // A separate retirement budget moves in proportion to the change in current spending.
  const movedRetirement = i.retirementDifferent && i.expensesMonthly > 0
    ? (i.retirementExpensesMonthly * i.movedExpensesMonthly) / i.expensesMonthly
    : i.retirementExpensesMonthly;
  return { inputs: { ...funded, income: gross, state: stateChoice, expensesMonthly: i.movedExpensesMonthly, retirementExpensesMonthly: movedRetirement }, net };
}

// Share of take-home-plus-retirement-saving that is saved, using the saving that actually happens in the chosen mode.
function savingsRateOf(i: Inputs, netAnnual: number, mode: FireMode): { rate: number; base: number; deferral: number } {
  const side = mode === "barista" ? Math.max(0, Number(i.baristaIncomeNow) || 0) : 0;
  if (i.advanced) {
    const rate = netAnnual > 0 ? clamp((netAnnual - annualExpenses(i)) / netAnnual, -1, 1) : 0;
    return { rate, base: netAnnual, deferral: 0 };
  }
  const deferral = simpleDeferralForYear(i, 0);
  const base = netAnnual + deferral + side;
  const explicit = Number(i.yearlyInvestment) || 0;
  const saved = explicit > 0 ? explicit + deferral : base - annualExpenses(i);
  return { rate: base > 0 ? clamp(saved / base, -1, 1) : 0, base, deferral };
}

// The inputs that make a savings table row save exactly rate x base, whatever way the user has configured saving.
function inputsForSavingsRate(i: Inputs, saved: number, deferral: number): Inputs {
  if (i.advanced) return { ...i, contribBrokerage: Math.max(0, saved - Math.max(0, i.contrib401k) - Math.max(0, i.contribIra)) };
  if ((Number(i.yearlyInvestment) || 0) > 0) return { ...i, yearlyInvestment: Math.max(0, saved - deferral) };
  return i;
}

function makeDecisionRunner(
  mode: FireMode,
  netBasisForMode: NetBasis
): (overrideInputs: Inputs, netOverride?: NetBasis) => DecisionProjectionOutput {
  return (overrideInputs: Inputs, netOverride?: NetBasis): DecisionProjectionOutput => {
    const netAnnual = netOverride ?? netBasisForMode;

    if (mode === "coast") {
      const yearsToGoal = simulateYearsToCoast(overrideInputs, netAnnual);
      const goalAge =
        yearsToGoal !== null ? overrideInputs.age + yearsToGoal : null;
      // Full FIRE if you keep contributing (the standard projection), not the Coast path that stops contributing at the coast age.
      const fiResult = simulateYearsToFI(overrideInputs, netAnnual, "standard");
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
  netBasis: NetBasis
): DecisionEngineResult {
  const netAnnual = netAt(netBasis, 0, inputs);
  const runProjection = makeDecisionRunner(mode, netBasis);
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
    net?: NetBasis;
  }> = [];

  const autoSaving = !inputs.advanced && !(Number(inputs.yearlyInvestment) > 0);
  const annualExp = annualExpenses(inputs);

  // ── Scenario 1: Lower spending -10% ──────────────────────────────────────
  // With automatic saving the freed cash is invested by itself; with configured saving it is added to what is invested.
  const spendingCut = annualExp * 0.1;
  scenarios.push({
    key: "lower_spending",
    label: "Lower spending by 10%",
    nextInputs: {
      ...inputs,
      expensesMonthly: Math.max(0, inputs.expensesMonthly * 0.9),
      movedExpensesMonthly: Math.max(0, inputs.movedExpensesMonthly * 0.9),
      scenarioExtraSaving: autoSaving ? 0 : spendingCut,
    },
  });

  // ── Scenario 2: Higher savings, honest 10-point rate increase ────────────
  const currentSavings = savingsRateOf(inputs, netAnnual, mode);
  const currentSavingsRate = clamp(currentSavings.rate, 0, 1);
  const targetSavingsRate = clamp(currentSavingsRate + 0.1, 0, 0.8);
  const cutAmount = Math.min(annualExp, Math.max(0, (targetSavingsRate - currentSavingsRate) * currentSavings.base));
  scenarios.push({
    key: "higher_savings",
    label: `Raise savings rate to ${Math.round(targetSavingsRate * 100)}%`,
    nextInputs: {
      ...inputs,
      expensesMonthly: Math.max(0, (annualExp - cutAmount) / 12),
      scenarioExtraSaving: autoSaving ? 0 : cutAmount,
    },
  });

  // ── Scenario 3: the full move (income, taxes, moving cost, spending), only if spending is genuinely lower ─
  let moveScenario: { inputs: Inputs; net: NetBasis } | null = null;
  if (
    inputs.moveCompareOn &&
    inputs.movedExpensesMonthly > 0 &&
    inputs.movedExpensesMonthly < inputs.expensesMonthly
  ) {
    moveScenario = buildMovedScenario(inputs);
    scenarios.push({
      key: "move",
      label: "Move to the lower-cost location",
      nextInputs: moveScenario.inputs,
      net: moveScenario.net,
    });
  }

  // ── Scenario 4: Mode-specific ─────────────────────────────────────────────
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
      nextInputs: { ...inputs, scenarioExtraSaving: 5000 },
    });
  }

  // ── Run & rank ────────────────────────────────────────────────────────────
  const ranked = scenarios
    .map(({ key, label, nextInputs, net }) => {
      const output = runProjection(nextInputs, net);
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
  // Ad slots are hidden everywhere for now; set NEXT_PUBLIC_ADS_ENABLED=1 to show them again.
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "1" && Boolean(ADSENSE_CLIENT && slot);
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
  return (
    <CalculatorNumberField
      label={label}
      ariaLabel={label || "Brokerage tax drag"}
      value={value}
      onChange={onChange}
      prefix={prefix}
      suffix={suffix}
      info={info ? <InfoTip text={info} /> : null}
    />
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
            You&apos;ve already reached your goal under current assumptions. These
            scenarios show what would{" "}
            <strong className="text-white">strengthen your full FIRE position</strong>{" "}
            from here.
          </>
        ) : (
          <>
            {result.baseline.yearsToGoal === null ? (
              <>You&apos;re not projected to reach your goal under these assumptions. </>
            ) : (
              <>
                You&apos;re currently projected to reach your goal in{" "}
                <strong className="text-white">{formatDecisionYears(result.baseline.yearsToGoal)}</strong>
                .{" "}
              </>
            )}
            {modeLabels.intro}
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
            {result.baseline.yearsToGoal === null ? (
              <>
                <div className="text-base font-semibold text-white">
                  Your goal is not reached under these assumptions
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  None of the tested changes got you there either. Try saving more each year, spending less, a later target age, or a higher
                  income, and check how the projection responds.
                </p>
              </>
            ) : (
              <>
                <div className="text-base font-semibold text-white">
                  Your current path is already close to optimal
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  None of the tested changes materially improved your timeline. That
                  usually means your plan is efficient, or the limiting factor is
                  long-term market growth rather than a simple input change.
                </p>
              </>
            )}
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
                <div className={`mt-3 grid gap-2 ${item.fullFireAge === item.goalAge ? "grid-cols-2" : "grid-cols-3"}`}>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {modeLabels.goalAge}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {item.goalAge ?? "—"}
                    </div>
                  </div>
                  {/* Shown only when it differs from the goal age (Coast FIRE); on the other pages the two are the same number. */}
                  {item.fullFireAge !== item.goalAge && (
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Full FIRE age
                      </div>
                      <div className="mt-1 text-sm font-semibold text-white">
                        {item.fullFireAge ?? "—"}
                      </div>
                    </div>
                  )}
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

const SHARED_FIRE_KEY = "rbn-fire-shared-v1";
const SHARED_FIRE_FIELDS = ["age", "income", "state", "filingStatus", "k401Pct", "currentPortfolio", "salaryGrowthPct", "inflationPct"] as const;

export default function FireCalculator({ initialIncome = 0, hideFAQ = false }: FireCalculatorProps) {
  const pathname = usePathname();
  const mode     = modeFromPathname(pathname);
  const spendingPreset = presetFromPathname(pathname);

  const [inputs, setInputs] = useState<Inputs>(() => defaultsForMode(mode, initialIncome, spendingPreset));
  const [openFaq,  setOpenFaq]  = useState<number | null>(0);
  const [pinnedCompareCityId, setPinnedCompareCityId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");
  const [activeResultTab, setActiveResultTab] = useState<"milestone" | "move" | "savings">("milestone");
  const [linkedMove, setLinkedMove] = useState(false);
  const [abroadLabel, setAbroadLabel] = useState("");

  // A move handed over from a relocation calculator through the URL prefills the current and moved scenarios.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const abroad = parseFireAbroadLink(query);
    if (abroad) {
      setInputs(s => ({ ...s, moveCompareOn: true, movedExpensesMonthly: abroad.movedExpenses, movedAbroad: true, movedState: "", movedIncome: 0, movedCost: 0 }));
      setAbroadLabel(abroad.label);
      return;
    }
    const link = parseFireLink(query);
    if (!link) return;
    setInputs(s => ({
      ...s,
      income: link.income,
      state: link.state,
      filingStatus: link.filing,
      k401Pct: link.k401Pct,
      expensesMonthly: link.expenses,
      moveCompareOn: true,
      movedExpensesMonthly: link.movedExpenses,
      movedIncome: link.movedIncome,
      movedState: link.movedState,
      movedCityId: link.movedCityId,
      movedCost: link.movedCost,
    }));
    setLinkedMove(true);
  }, []);

  // Details that do not depend on the FIRE style (age, income, location, portfolio) carry over between the FIRE pages for the tab's session.
  // Spending and withdrawal assumptions belong to each style, so they start from the page's own defaults.
  // First-time visitors see the core inputs (age, income, state, spending, portfolio); the rest sit behind "Show all inputs".
  // Everything shows when the page was opened with carried-over details, a move, or Advanced mode.
  const [showAllInputs, setShowAllInputs] = useState(false);
  const [budgetByCategory, setBudgetByCategory] = useState(false);
  const [spendingCats, setSpendingCats] = useState<Record<string, number>>(() => spendingPreset ? SPENDING_CATEGORY_DEFAULTS[spendingPreset] : {});
  const [hydrated, setHydrated] = useState(false);
  const [carriedOver, setCarriedOver] = useState(false);
  useEffect(() => {
    try {
      const query = new URLSearchParams(window.location.search);
      if (!parseFireAbroadLink(query) && !parseFireLink(query)) {
        const raw = window.sessionStorage.getItem(SHARED_FIRE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<Pick<Inputs, typeof SHARED_FIRE_FIELDS[number]>>;
          const patch: Partial<Inputs> = {};
          for (const f of SHARED_FIRE_FIELDS) {
            if (f === "income" && initialIncome > 0) continue;
            const v = saved[f];
            if (v !== undefined && typeof v === typeof defaultsForMode(mode, initialIncome, spendingPreset)[f]) (patch as Record<string, unknown>)[f] = v;
          }
          if (Object.keys(patch).length) {
            setInputs(s => {
              const n = { ...s, ...patch };
              return { ...n, coastAge: Math.max(n.coastAge, n.age), targetRetirementAge: Math.max(n.targetRetirementAge, n.age + 1) };
            });
            setCarriedOver(true);
          }
        }
      }
    } catch { /* storage unavailable */ }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      const shared: Record<string, unknown> = {};
      for (const f of SHARED_FIRE_FIELDS) shared[f] = inputs[f];
      window.sessionStorage.setItem(SHARED_FIRE_KEY, JSON.stringify(shared));
    } catch { /* storage unavailable */ }
  }, [hydrated, inputs]);

  const showMore = showAllInputs || inputs.advanced || carriedOver || linkedMove || !!abroadLabel;

  // ── Core derived values ───────────────────────────────────────────────────
  const annualExp =useMemo(() => annualExpenses(inputs), [inputs]);

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

  // Take-home pay in each future year, taxed year by year (see makeNetPath).
  const netPath = useMemo(() => makeNetPath({
    gross: inputs.income, state: inputs.state, filing: inputs.filingStatus, k401Pct: inputs.k401Pct,
    cityId: inputs.state ? getBaselineCityIdForState(inputs.state) : undefined,
    salaryGrowthPct: inputs.salaryGrowthPct, inflationPct: inputs.inflationPct,
  }), [inputs.income, inputs.state, inputs.filingStatus, inputs.k401Pct, inputs.salaryGrowthPct, inputs.inflationPct]);

  // Taxes only: money you save to a 401(k) is not a tax.
  const estTaxRate = useMemo(() => {
    if (!inputs.state || !(inputs.income > 0)) return 0;
    const taxes = estimateNetBreakdown({
      grossAnnual: inputs.income, state: inputs.state as StateCode, filing: inputs.filingStatus, k401Pct: inputs.k401Pct,
      cityId: getBaselineCityIdForState(inputs.state),
    }).totalTax;
    return (taxes / inputs.income) * 100;
  }, [inputs.state, inputs.income, inputs.filingStatus, inputs.k401Pct]);

  // Share of take-home pay plus 401(k) saving (plus Barista side income) that is saved, using the saving that really happens.
  const savingsInfo = useMemo(() => savingsRateOf(inputs, netAnnual, mode), [inputs, netAnnual, mode]);
  const savingsRate = savingsInfo.rate;

  // ── Standard simulation ───────────────────────────────────────────────────
  const result = useMemo(() => simulateYearsToFI(inputs, netPath, mode), [inputs, netPath, mode]);

  const fiAge  = useMemo(() => result.yearsToFI === null ? null : inputs.age + result.yearsToFI, [inputs.age, result.yearsToFI]);
  // The FIRE number is in the dollars of the year you reach it; this adds what that is worth in today's dollars.
  const [dollarView, setDollarView] = useState<"future" | "today">("today");
  const inView = (amount: number, years: number | null | undefined) =>
    dollarView === "today" && years != null ? amount / Math.pow(1 + (Number(inputs.inflationPct) || 0) / 100, years) : amount;
  const dollarBasis = dollarView === "today" ? "in today's dollars" : "in the dollars of the year you reach it";
  const fireNumberShown = Number.isFinite(result.fireNumber) ? money(inView(result.fireNumber, result.yearsToFI), 0) : "—";
  const fullFireNumberShown = (r: { fireNumber: number; yearsToFI: number | null } | null | undefined) =>
    r && Number.isFinite(r.fireNumber) ? money(inView(r.fireNumber, r.yearsToFI), 0) : "—";
  const fireNumberTodayNote = useMemo(() => {
    if (dollarView === "today" || result.yearsToFI === null || !Number.isFinite(result.fireNumber)) return "";
    const today = result.fireNumber / Math.pow(1 + (Number(inputs.inflationPct) || 0) / 100, result.yearsToFI);
    return ` That is about ${money(today, 0)} in today's dollars.`;
  }, [dollarView, result.fireNumber, result.yearsToFI, inputs.inflationPct]);
  const fiYear = useMemo(() => result.yearsToFI === null ? null : new Date().getFullYear() + result.yearsToFI, [result.yearsToFI]);

  const projection = useMemo(() => buildProjection(inputs, netPath, result.yearsToFI, mode), [inputs, netPath, result.yearsToFI, mode]);

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
  // Today's portfolio is compared with the target in today's dollars (the FIRE number is in the dollars of the year it is reached).
  const infl = Number(inputs.inflationPct) || 0;
  const target = Number(result.fireNumber) / (result.yearsToFI != null ? Math.pow(1 + infl / 100, result.yearsToFI) : 1);
  const pctValue =
    target > 0 && Number.isFinite(target) ? clamp(current / target, 0, 1) : 0;

  return {
    current,
    target,
    pct: pctValue,
  };
}, [inputs.advanced, inputs.inflationPct, result]);

  // ── Coast-specific ────────────────────────────────────────────────────────
  const coastFireNumber = useMemo(() => mode === "coast" ? calcCoastFireNumber(inputs) : null, [mode, inputs]);
  const yearsToCoast    = useMemo(() => mode === "coast" ? simulateYearsToCoast(inputs, netPath) : null, [mode, inputs, netPath]);
  // What you would need today to stop contributing now and still reach the retirement target.
  const coastNeededToday = useMemo(() => mode === "coast" ? coastTargetAtYear(inputs, 0) : null, [mode, inputs]);
  const isCoastReady    = useMemo(() => coastNeededToday !== null && result.startPortfolio >= coastNeededToday, [coastNeededToday, result.startPortfolio]);
  const coastProgress   = useMemo(() => {
    if (!coastNeededToday || !Number.isFinite(coastNeededToday)) return 0;
    return clamp(result.startPortfolio / coastNeededToday, 0, 1);
  }, [coastNeededToday, result.startPortfolio]);

  // ── Coast-specific: full FIRE if you keep contributing (the Coast projection stops contributing at the coast age) ───
  const fullFireForCoast = useMemo(() => {
    if (mode !== "coast") return null;
    return simulateYearsToFI(inputs, netPath, "standard");
  }, [mode, inputs, netPath]);
  const fullFiAgeForCoast = useMemo(() => fullFireForCoast?.yearsToFI == null ? null : inputs.age + fullFireForCoast.yearsToFI, [fullFireForCoast, inputs.age]);

  // ── Lean-specific: full FIRE comparison at 1.5× spending ─────────────────
  // With a separate retirement budget (the Lean page's default) the comparison is your current spending as the retirement budget;
  // otherwise it is 50% higher spending.
  const leanComparesToCurrent = inputs.retirementDifferent;
  const fullFireForLean = useMemo(() => {
    if (mode !== "lean") return null;
    if (inputs.retirementDifferent) return simulateYearsToFI({ ...inputs, retirementDifferent: false }, netPath, "standard");
    const fullExp = annualExpensesFromMonthly(inputs.expensesMonthly * 1.5);
    return simulateYearsToFI(inputs, netPath, "standard", { expensesAnnualBase: fullExp });
  }, [mode, inputs, netPath]);
  // The same income, saving and current spending with different retirement budgets.
  const leanBudgetRows = useMemo(() => {
    if (mode !== "lean") return [];
    const mine = inputs.retirementDifferent ? inputs.retirementExpensesMonthly : inputs.expensesMonthly;
    const budgets = Array.from(new Set([1500, 2000, 2500, 3000, 3500, 4000, 5000, Math.round(mine)])).filter(b => b > 0).sort((a, b) => a - b);
    return budgets.map(b => {
      const r = simulateYearsToFI({ ...inputs, retirementDifferent: true, retirementExpensesMonthly: b }, netPath, "lean");
      return { budget: b, mine: b === Math.round(mine), number: r.fireNumber, years: r.yearsToFI, age: r.yearsToFI === null ? null : inputs.age + r.yearsToFI };
    });
  }, [mode, inputs, netPath]);
  const fullFiAgeForLean = useMemo(() => fullFireForLean?.yearsToFI == null ? null : inputs.age + fullFireForLean.yearsToFI, [fullFireForLean, inputs.age]);
  const leanYearsSaved   = useMemo(() => fiAge !== null && fullFiAgeForLean !== null ? fullFiAgeForLean - fiAge : null, [fiAge, fullFiAgeForLean]);

  // ── Barista-specific: full FIRE without income reduction ──────────────────
  const fullFireForBarista = useMemo(() => {
    if (mode !== "barista") return null;
    return simulateYearsToFI(inputs, netPath, "standard");
  }, [mode, inputs, netPath]);
  const fullFiAgeForBarista = useMemo(() => fullFireForBarista?.yearsToFI == null ? null : inputs.age + fullFireForBarista.yearsToFI, [fullFireForBarista, inputs.age]);
  const baristaYearsSaved   = useMemo(() => fullFiAgeForBarista !== null && fiAge !== null ? fullFiAgeForBarista - fiAge : null, [fiAge, fullFiAgeForBarista]);

  const baristaTable = useMemo(() => {
    if (mode !== "barista") return [];
    const swr = (Number(inputs.withdrawalRatePct) || 0) / 100;
    return [0, 12000, 24000, 36000, 48000, 60000].map(pt => {
      const effExp   = Math.max(0, annualExpenses(inputs) - pt);
      const fireNum  = swr > 0 ? effExp / swr : Infinity;
      const sim      = simulateYearsToFI({ ...inputs, baristaPartTimeIncome: pt }, netPath, "barista");
      const ageAtFI  = sim.yearsToFI === null ? null : inputs.age + sim.yearsToFI;
      return { pt, effExp, fireNum, yearsToFI: sim.yearsToFI, ageAtFI, isCurrent: pt === (Number(inputs.baristaPartTimeIncome) || 0) };
    });
  }, [mode, inputs, netPath]);

  // ── Move impact ───────────────────────────────────────────────────────────
  // The full move scenario (new income and state taxed year by year, moving cost paid from savings, new spending). The
  // recommendations use the same builder, so they always agree with this card.
  const movedScenario = useMemo(() => buildMovedScenario(inputs), [inputs]);
  const movedShortfall = useMemo(() => moveCostShortfall(inputs), [inputs]);

  const movedResult = useMemo(() => {
    if (!inputs.moveCompareOn) return null;
    return simulateYearsToFI(movedScenario.inputs, movedScenario.net, mode);
  }, [inputs.moveCompareOn, movedScenario, mode]);
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
      const sim      = simulateYearsToFI(inputs, netPath, mode, { expensesAnnualBase: adjExp });
      const ageAtFI  = sim.yearsToFI === null ? null : inputs.age + sim.yearsToFI;
      const delta    = sim.yearsToFI !== null && result.yearsToFI !== null ? result.yearsToFI - sim.yearsToFI : null;
      return { cityId, cityName: city.name, state: city.state.toUpperCase(), ageAtFI, yearsToFI: sim.yearsToFI, isBaseline: false, deltaYears: delta };
    }).filter(Boolean);
    return rows.sort((a, b) => {
      if (a!.isBaseline) return -1;
      if (b!.isBaseline) return 1;
      return (b!.deltaYears ?? -999) - (a!.deltaYears ?? -999);
    });
  }, [inputs, netPath, mode, fiAge, result.yearsToFI]);

  const bestMoveRow = useMemo(() => viralCityResults.find(r => !r!.isBaseline && (r!.deltaYears ?? 0) > 0) ?? null, [viralCityResults]);

  useEffect(() => {
    if (!pinnedCompareCityId) return;
    if (!viralCityResults.some(r => r?.cityId === pinnedCompareCityId)) setPinnedCompareCityId(null);
  }, [pinnedCompareCityId, viralCityResults]);

  const proposedComparison = useMemo(() => {
    if (!pinnedCompareCityId) return null;
    const baselineCityId = getBaselineCityIdForState(inputs.state);
    const adjExp  = expenseAdjustedForCity(annualExpenses(inputs), pinnedCompareCityId, baselineCityId);
    const sim     = simulateYearsToFI(inputs, netPath, mode, { expensesAnnualBase: adjExp });
    const ageAtFI = sim.yearsToFI === null ? null : inputs.age + sim.yearsToFI;
    const pts     = buildProjectionWithExpenses(inputs, netPath, sim.yearsToFI, adjExp, mode);
    return { city: findCity(pinnedCompareCityId), adjustedExpenses: adjExp, sim, yearsToFI: sim.yearsToFI, ageAtFI, projectionPoints: pts };
  }, [pinnedCompareCityId, inputs, netPath, mode]);

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
      const saved        = savingsInfo.base * r;
      const impliedExp   = Math.max(0, savingsInfo.base - saved);
      const scenario     = inputsForSavingsRate(inputs, saved, savingsInfo.deferral);
      const sim          = netAnnual > 0 ? simulateYearsToFI(scenario, netPath, mode, { expensesAnnualBase: impliedExp }) : null;
      const ageAtFI      = sim?.yearsToFI == null ? null : inputs.age + sim.yearsToFI;
      return { savingsRatePct: rPct, impliedExpenses: impliedExp, yearsToFI: sim?.yearsToFI ?? null, ageAtFI };
    });
  }, [inputs, netAnnual, netPath, mode, savingsInfo]);

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
  () => buildDecisionEngine(inputs, mode, netPath),
  [inputs, mode, netPath]
);

const reportInputs = useMemo<FireReportInputs>(() => ({
  age:                  inputs.age,
  state:                inputs.state,
  filingStatus:         inputs.filingStatus,
  fireAge:              fiAge,
  yearsToFI:            result.yearsToFI,
  expensesMonthly:      inputs.expensesMonthly,
  ...(inputs.retirementDifferent ? { retirementExpensesMonthly: inputs.retirementExpensesMonthly } : {}),
  withdrawalRatePct:    inputs.withdrawalRatePct,
  withdrawalTaxRatePct: inputs.withdrawalTaxRatePct,
  bal401k:              inputs.advanced ? inputs.bal401k       : 0,
  balIra:               inputs.advanced ? inputs.balIra        : 0,
  balBrokerage:         inputs.advanced ? applyBrokerageAutofill(inputs).balBrokerage : inputs.currentPortfolio,
  taxTreatment401k:     inputs.taxTreatment401k,
  taxTreatmentIra:      inputs.taxTreatmentIra,
  netAnnual,
  currentPortfolio:     inputs.currentPortfolio,
  savingsRatePct:       Math.round(savingsRate * 100),
  income:               inputs.income,
  targetRetirementAge:  inputs.targetRetirementAge,
  mode,
  ...(spendingPreset ? { preset: spendingPreset } : {}),
  ...(mode === "coast" ? {
    coastAge: inputs.coastAge,
    coastNumber: coastFireNumber !== null && Number.isFinite(coastFireNumber) ? Math.round(coastFireNumber) : null,
    coastReady: isCoastReady,
    yearsToCoast,
  } : {}),
  ...(mode === "barista" ? { baristaPartTimeIncome: inputs.baristaPartTimeIncome, baristaIncomeNow: inputs.baristaIncomeNow } : {}),
  volatility:           inputs.volatility,
  inflationPct:         inputs.inflationPct,
  advanced:             inputs.advanced,
  ...(inputs.advanced
    ? { contrib401k: inputs.contrib401k, contribIra: inputs.contribIra, contribBrokerage: inputs.contribBrokerage }
    : { yearlyInvestment: inputs.yearlyInvestment }),
}), [inputs, fiAge, result.yearsToFI, netAnnual, savingsRate, mode, spendingPreset, coastFireNumber, isCoastReady, yearsToCoast]);

  // ─────────────────────────────────────────────────────────────────────────
  // SHARE HANDLER
  // ─────────────────────────────────────────────────────────────────────────

  async function handleShare() {
    try {
      const base    = window.location.origin;
      // Only the common share page exists; every mode shares through it with its own details in the query.
      const url     = new URL("/fire-calculator/share", base);
      url.searchParams.set("mode", mode);
      if (fiAge) url.searchParams.set("fireAge", String(fiAge));

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

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">

        {/* ── LEFT: Inputs panel ─────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold tracking-tight text-white">Calculator inputs</div>
              <div className="text-xs leading-5 text-slate-300">Enter your income, spending, and investing assumptions.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {showMore && (
                <button onClick={() => setInputs(s => s.advanced ? { ...s, advanced: false } : seedAdvancedFromSimple({ ...s, advanced: true }))}
                  className={["rounded-xl border px-3 py-2 text-xs font-medium", inputs.advanced ? "border-violet-300/40 bg-violet-300/10 text-violet-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"].join(" ")}>
                  {inputs.advanced ? "Advanced: ON" : "Advanced: OFF"}
                </button>
              )}
              <button onClick={() => { setInputs(defaultsForMode(mode, initialIncome, spendingPreset)); setLinkedMove(false); setAbroadLabel(""); setPinnedCompareCityId(null); setShareStatus("idle"); }}
                className="rounded-xl border border-red-300/40 bg-red-300/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-300/20">
                ↺ Reset
              </button>
            </div>
          </div>

          {(linkedMove || abroadLabel) && (
            <div className="mt-3 rounded-lg border border-violet-300/30 bg-violet-300/10 px-3 py-2 text-xs leading-5 text-violet-100" role="note">
              <div className="font-semibold">Carried over from your move comparison. Check these before you rely on the result:</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {linkedMove && (
                  <>
                    <li>Income {money(inputs.income, 0)} a year in {inputs.state ? inputs.state.toUpperCase() : "your state"}, filing {inputs.filingStatus}, 401(k) {inputs.k401Pct}%</li>
                    <li>Spending {money(inputs.expensesMonthly, 0)}/mo now, {money(inputs.movedExpensesMonthly, 0)}/mo after the move</li>
                    {inputs.movedState && <li>After the move: {inputs.movedIncome > 0 ? `income ${money(inputs.movedIncome, 0)} a year in ` : ""}{inputs.movedState.toUpperCase()}</li>}
                    {inputs.movedCost > 0 && <li>One-time moving cost {money(inputs.movedCost, 0)}, paid from savings</li>}
                  </>
                )}
                {abroadLabel && <li>Spending after moving to {abroadLabel}: {money(inputs.movedExpensesMonthly, 0)}/mo. Your income, location and portfolio are not carried over; enter them below.</li>}
                <li>Not carried over: your investments and savings. Enter your portfolio below.</li>
              </ul>
            </div>
          )}
          {carriedOver && (
            <p className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs leading-5 text-emerald-100">
              Your age, income, location and portfolio carried over from your last FIRE page. This style uses its own spending ({money(inputs.expensesMonthly, 0)}/mo{inputs.retirementDifferent ? `, ${money(inputs.retirementExpensesMonthly, 0)}/mo in retirement` : ""}) and a {inputs.withdrawalRatePct}% withdrawal rate; change them below if you want.
            </p>
          )}

          <div className="mt-5 grid gap-x-4 gap-y-3 sm:grid-cols-2">

            {/* ── Mode-specific inputs pinned to top ─────────────────────── */}
            {mode === "coast" && (
              <div className="rounded-xl border border-sky-300/20 bg-sky-300/10 p-4 sm:col-span-2">
                <div className="mb-3 text-xs font-semibold tracking-widest text-sky-200">COAST FIRE SETTINGS</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Stop contributing at age" info="After this age, contributions go to zero and your portfolio coasts on compound growth alone."
                    value={inputs.coastAge}
                    onChange={v => setInputs(s => { const coastAge = Math.round(clamp(v, s.age, 80)); return { ...s, coastAge, targetRetirementAge: Math.max(s.targetRetirementAge, coastAge) }; })} />
                  <Field label="Target retirement age" info="The age you plan to fully retire. Used to calculate how long compounding has to work."
                    value={inputs.targetRetirementAge}
                    onChange={v => setInputs(s => ({ ...s, targetRetirementAge: Math.round(clamp(v, s.coastAge, 100)) }))} />
                </div>
              </div>
            )}

            {mode === "barista" && (
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 sm:col-span-2">
                <div className="mb-3 text-xs font-semibold tracking-widest text-amber-200">BARISTA FIRE SETTINGS</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Part-time income after you leave full-time work (after tax, per year)" info="Your take-home (after-tax) income from part-time or flexible work once you stop full-time work. It lowers the yearly gap your portfolio must cover, so the FIRE number is smaller. It does not add to your saving before then."
                    value={inputs.baristaPartTimeIncome}
                    onChange={v => setInputs(s => ({ ...s, baristaPartTimeIncome: clamp(v, 0, 500000) }))}
                    prefix="$" />
                  <Field label="Part-time income you already earn now (after tax, per year)" info="Extra after-tax income you earn today on top of your job. It adds to your saving each year until you reach your Barista FIRE number. Leave it at zero if the part-time work only starts after you leave full-time work."
                    value={inputs.baristaIncomeNow}
                    onChange={v => setInputs(s => ({ ...s, baristaIncomeNow: clamp(v, 0, 500000) }))}
                    prefix="$" />
                  <Field label="Part-time income ends at age (optional)" info="Leave at 0 if the part-time income lasts through retirement. If it stops at an age you enter, the portfolio must cover the gap until then and your full spending afterward, so the Barista FIRE number rises."
                    value={inputs.baristaEndAge}
                    onChange={v => setInputs(s => ({ ...s, baristaEndAge: v <= 0 ? 0 : Math.round(clamp(v, s.age + 1, 100)) }))} />
                  {inputs.baristaEndAge > 0 && (
                    <div className="self-end text-xs leading-5 text-slate-400">
                      After age {inputs.baristaEndAge} the portfolio funds full spending, so the number includes that.
                    </div>
                  )}
                  <div className="text-xs leading-5 text-slate-400 sm:col-span-2">
                    The first amount only lowers the yearly gap your portfolio must cover; it is assumed to grow with inflation. The second amount is extra income you earn today, so it adds to your saving until you reach FIRE. Not earning part-time income yet? Leave the second amount at $0.
                  </div>
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
            <div className="text-xs font-semibold tracking-widest text-slate-300/80 sm:col-span-2">ABOUT YOU</div>
            <Field label="Current age" value={inputs.age} onChange={v => setInputs(s => { const age = Math.round(clamp(v, 0, 100)); const coastAge = Math.max(s.coastAge, age); return { ...s, age, coastAge, targetRetirementAge: Math.max(s.targetRetirementAge, coastAge) }; })} />
            <Field label="Annual gross income" value={inputs.income} onChange={v => setInputs(s => ({ ...s, income: clamp(v, 0, 2_000_000) }))} prefix="$" />

            <div className="block">
              <div className="mb-0.5 flex items-center text-[11px] font-medium leading-tight text-slate-300">
                <label htmlFor="fire-state">State for tax estimate</label>
                <InfoTip text="Used to estimate after-tax income with a simplified state-specific tax model." />
              </div>
              <select id="fire-state" value={inputs.state} onChange={e => setInputs(s => ({ ...s, state: e.target.value as StateChoice }))}
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white shadow-inner outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10">
                <option value="" disabled className="bg-slate-900">Select a state…</option>
                {STATES.map(st => <option key={st.code} value={st.code} className="bg-slate-900">{st.name}</option>)}
              </select>
            </div>

            {showMore && (<div className="block">
              <label htmlFor="fire-filing-status" className="mb-0.5 block text-[11px] font-medium leading-tight text-slate-300">Filing status</label>
              <select id="fire-filing-status" value={inputs.filingStatus} onChange={e => setInputs(s => ({ ...s, filingStatus: e.target.value as FilingStatus }))}
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white shadow-inner outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10">
                <option value="single" className="bg-slate-900">Single</option>
                <option value="married" className="bg-slate-900">Married</option>
              </select>
            </div>)}

            {showMore && <Field label="401(k) contribution %" info="Percentage of salary contributed to a 401(k). Lowers taxable income." value={inputs.k401Pct} onChange={v => setInputs(s => ({ ...s, k401Pct: clamp(v, 0, 60) }))} suffix="%" />}
            <Field label="Monthly spending" info="Used to calculate your FIRE target. Higher spending = larger number." value={inputs.expensesMonthly} onChange={v => { setBudgetByCategory(false); setInputs(s => ({ ...s, expensesMonthly: clamp(v, 0, 200_000) })); }} prefix="$" />
            {(showMore || inputs.retirementDifferent) && <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={inputs.retirementDifferent}
                  onChange={e => setInputs(s => ({
                    ...s,
                    retirementDifferent: e.target.checked,
                    retirementExpensesMonthly: e.target.checked && s.retirementExpensesMonthly <= 0 ? s.expensesMonthly : s.retirementExpensesMonthly,
                  }))}
                />
                My retirement spending will be different
              </label>
              {inputs.retirementDifferent && (
                <div className="mt-2">
                  <Field label="Monthly spending in retirement" info="In today's dollars. Your FIRE target is built from this amount, while the spending above still sets how much you can invest now. Useful when costs such as childcare or a mortgage will end before you retire." value={inputs.retirementExpensesMonthly} onChange={v => setInputs(s => ({ ...s, retirementExpensesMonthly: clamp(v, 0, 200_000) }))} prefix="$" />
                  <p className="mt-1 text-[11px] leading-4 text-slate-400">
                    Investing now is based on {money(inputs.expensesMonthly, 0)}/mo of spending. The FIRE number is based on {money(inputs.retirementExpensesMonthly, 0)}/mo. In a move comparison, this budget changes in proportion to the change in your current spending.
                  </p>
                </div>
              )}
            </div>}

            {spendingPreset && (
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={budgetByCategory}
                    onChange={e => {
                      setBudgetByCategory(e.target.checked);
                      if (e.target.checked) setInputs(s => ({ ...s, expensesMonthly: Object.values(spendingCats).reduce((a, b) => a + b, 0) }));
                    }}
                  />
                  Build my monthly spending from categories
                </label>
                {budgetByCategory && (
                  <div className="mt-2 grid gap-x-4 gap-y-3 sm:grid-cols-2">
                    {Object.entries(spendingCats).map(([name, amount]) => (
                      <Field key={name} label={name} value={amount} prefix="$"
                        onChange={v => {
                          const next = { ...spendingCats, [name]: clamp(v, 0, 200_000) };
                          setSpendingCats(next);
                          setInputs(s => ({ ...s, expensesMonthly: Object.values(next).reduce((a, b) => a + b, 0) }));
                        }} />
                    ))}
                    <p className="text-xs leading-5 text-slate-400 sm:col-span-2">
                      These add up to your monthly spending of {money(Object.values(spendingCats).reduce((a, b) => a + b, 0), 0)}, which sets your FIRE number. Adjust a category to see what a lifestyle choice costs in years.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-2 text-xs font-semibold tracking-widest text-slate-300/80 sm:col-span-2">SAVINGS AND INVESTING</div>
            <Field label="Current invested portfolio" value={inputs.currentPortfolio}
              onChange={v => setInputs(s => ({ ...s, currentPortfolio: clamp(v, 0, 20_000_000) }))} prefix="$" />
            {showMore && <Field label="Annual contributions (optional)" info="Leave blank to auto-estimate from income minus expenses." value={inputs.yearlyInvestment}
              onChange={v => setInputs(s => ({ ...s, yearlyInvestment: clamp(v, 0, 5_000_000) }))} prefix="$" />}
            {showMore && <div className="-mt-1 text-xs text-slate-400 sm:col-start-2">Leave blank to estimate from after-tax income.</div>}

            {!showMore && (
              <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-xs leading-5 text-slate-400 sm:col-span-2">
                Using defaults: filing {inputs.filingStatus}, 401(k) {inputs.k401Pct}%, {inputs.volatility} returns, {inputs.withdrawalRatePct}% withdrawal, {inputs.inflationPct}% inflation. Saving is estimated from your after-tax income less spending.{" "}
                <button type="button" onClick={() => setShowAllInputs(true)} className="font-semibold text-emerald-200 underline underline-offset-4 hover:text-emerald-100">
                  Show all inputs
                </button>
              </div>
            )}

            {/* ── Volatility preset ─────────────────────────────────────── */}
            {showMore && <div className="sm:col-span-2">
              <div className="mb-1 text-[11px] font-medium text-slate-300">Investment return assumptions</div>
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
                Yearly return, first {inputs.phase2StartsYear} years / after that:{" "}
                Conservative {VOLATILITY_PRESETS.conservative.phase1}% / {VOLATILITY_PRESETS.conservative.phase2}% ·
                Moderate {VOLATILITY_PRESETS.moderate.phase1}% / {VOLATILITY_PRESETS.moderate.phase2}% ·
                Aggressive {VOLATILITY_PRESETS.aggressive.phase1}% / {VOLATILITY_PRESETS.aggressive.phase2}%
              </div>
            </div>}

            {(spendingPreset === "chubby" || spendingPreset === "fat") && (
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100 sm:col-span-2">
                <div className="font-semibold">Larger budgets make account mix and withdrawal tax matter more</div>
                {inputs.advanced ? (
                  <p className="mt-1">
                    Withdrawals from traditional 401(k) and IRA balances are taxed at {inputs.withdrawalTaxRatePct}%; Roth and brokerage balances are not reduced by that rate. Set your balances and account types below, because they change the spendable portfolio.
                  </p>
                ) : (
                  <p className="mt-1">
                    In simple mode the whole portfolio is treated as one taxable account, so no tax on withdrawals from traditional accounts is applied.{" "}
                    <button type="button" className="font-semibold underline underline-offset-4" onClick={() => setInputs(s => seedAdvancedFromSimple({ ...s, advanced: true }))}>
                      Turn on Advanced to set your account mix and withdrawal tax
                    </button>.
                  </p>
                )}
              </div>
            )}

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

              {/* Withdrawal tax rate, shown only when Traditional accounts are selected */}
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
            {showMore && <details className="group rounded-xl border border-white/10 bg-black/10 p-3 sm:col-span-2">
              <summary className="cursor-pointer list-none text-xs font-medium text-slate-200">
                <span className="mr-1 inline-block transition group-open:rotate-90">▸</span>
                Withdrawal, inflation and projection settings
                <span className="ml-2 font-normal text-slate-400">{inputs.withdrawalRatePct}% withdrawal · {inputs.inflationPct}% inflation · {inputs.salaryGrowthPct}% salary growth</span>
              </summary>
              <div className="mt-3 grid gap-x-4 gap-y-3 sm:grid-cols-2">
                <Field label="Withdrawal rate (%)" info="Percentage of portfolio withdrawn yearly in retirement. 4% is common." value={inputs.withdrawalRatePct} onChange={v => setInputs(s => ({ ...s, withdrawalRatePct: clamp(v, 2, 6) }))} suffix="%" />
                <Field label="Inflation (%)" value={inputs.inflationPct} onChange={v => setInputs(s => ({ ...s, inflationPct: clamp(v, 0, 10) }))} suffix="%" />
                <Field label="Salary growth (%)" value={inputs.salaryGrowthPct} onChange={v => setInputs(s => ({ ...s, salaryGrowthPct: clamp(v, 0, 15) }))} suffix="%" />
                <Field label="Phase 2 starts after (years)" info="Year the calculator switches from Phase 1 to Phase 2 return assumptions." value={inputs.phase2StartsYear} onChange={v => setInputs(s => ({ ...s, phase2StartsYear: Math.round(clamp(v, 0, 80)) }))} />
                <Field label="Projection length (years)" value={inputs.maxYears} onChange={v => setInputs(s => ({ ...s, maxYears: Math.round(clamp(v, 1, 80)) }))} />
              </div>
            </details>}

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
                  {abroadLabel && (
                    <div className="mt-4 rounded-xl border border-sky-300/25 bg-sky-300/10 p-3 text-xs leading-5 text-sky-100">
                      Prefilled from your {abroadLabel} estimate: monthly spending there, in US dollars. Set your income, state, current spending and savings above.
                      Taxes after the move are U.S. federal only; taxes owed to another country are not included.
                    </div>
                  )}
                  {linkedMove && (
                    <div className="mt-4 rounded-xl border border-sky-300/25 bg-sky-300/10 p-3 text-xs leading-5 text-sky-100">
                      Prefilled from your move: income, state, spending, and one-time costs. Set your age and savings above for your own timeline.
                    </div>
                  )}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Monthly expenses after moving" value={inputs.movedExpensesMonthly} onChange={v => setInputs(s => ({ ...s, movedExpensesMonthly: clamp(v, 0, 200_000) }))} prefix="$" />
                    <div className="self-end text-xs text-slate-400">Annual: <span className="font-semibold text-slate-200">{money(annualMovedExpenses(inputs), 0)}</span></div>
                    <div className="text-xs leading-5 text-slate-400 sm:col-span-2">Starts equal to your spending now, so a move shows no gain until you enter what you expect to spend in the new place. Pick a state or enter your own figure.</div>
                    <Field label="Income after moving (0 = same)" value={inputs.movedIncome} onChange={v => setInputs(s => ({ ...s, movedIncome: clamp(v, 0, 10_000_000) }))} prefix="$" />
                    {movedShortfall > 0 && (
                      <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100 sm:col-span-2">
                        The moving cost is {money(movedShortfall, 0)} more than your savings, so the move result assumes you can cover it. Retirement-account money used for moving costs is taken without tax or penalty.
                      </div>
                    )}
                    <Field label="One-time moving costs (spent)" info="Taken out of savings before your timeline starts. Refundable deposits and a down payment are not costs." value={inputs.movedCost} onChange={v => setInputs(s => ({ ...s, movedCost: clamp(v, 0, 10_000_000) }))} prefix="$" />
                    <label className="flex items-start gap-2 text-sm sm:col-span-2">
                      <input type="checkbox" checked={inputs.movedAbroad} onChange={e => setInputs(s => ({ ...s, movedAbroad: e.target.checked }))} />
                      <span className="text-xs text-slate-300">The move is outside the U.S. (federal tax only after the move; foreign taxes are not included)</span>
                    </label>
                    {!inputs.movedAbroad && <label className="block text-sm sm:col-span-2">
                      <div className="mb-1 text-xs font-medium text-slate-300">State after moving</div>
                      <select value={inputs.movedState} onChange={e => setInputs(s => ({ ...s, movedState: e.target.value as StateChoice, movedCityId: "" }))}
                        className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100">
                        <option value="" className="bg-slate-900">Same state</option>
                        {STATES.map(st => <option key={st.code} value={st.code} className="bg-slate-900">{st.name}</option>)}
                      </select>
                    </label>}
                  </div>
                  <div className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-4">
                    <div className="text-xs font-semibold tracking-widest text-emerald-100">MOVE IMPACT</div>
                    <div className="mt-3 grid gap-2 text-sm text-emerald-50">
                      <div className="flex justify-between gap-3"><span className="text-emerald-100/80">{mode === "coast" ? "Current FIRE age (if you stop contributing at the coast age)" : "Current FIRE age"}</span><span className="font-semibold">{fiAge ?? "—"}</span></div>
                      {mode === "coast" && (
                        <div className="flex justify-between gap-3"><span className="text-emerald-100/80">Current FIRE age (if you keep contributing)</span><span className="font-semibold">{fullFiAgeForCoast ?? "—"}</span></div>
                      )}
                      {movedResult && Number.isFinite(movedResult.fireNumber) && (
                        <div className="flex justify-between gap-3"><span className="text-emerald-100/80">FIRE number after move (at that age, future dollars)</span><span className="font-semibold">{money(movedResult.fireNumber, 0)}</span></div>
                      )}
                      <div className="flex justify-between gap-3"><span className="text-emerald-100/80">{mode === "coast" ? "FIRE age after move (same stop-contributing assumption)" : "FIRE age after move"}</span><span className="font-semibold">{movedFiAge ?? "—"}</span></div>
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>Show dollar amounts in:</span>
              <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5" role="group" aria-label="Dollar basis">
                {([["today", "Today's dollars"], ["future", "Year reached"]] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={dollarView === v}
                    onClick={() => setDollarView(v)}
                    className={`rounded-md px-3 py-1.5 font-medium transition ${dollarView === v ? "bg-emerald-400/20 text-emerald-100" : "text-slate-300 hover:bg-white/10"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm space-y-4">

              <ExampleResultsNotice />

              {/* ── STANDARD ──────────────────────────────────────────────── */}
              {mode === "standard" && (<>
                <h2 className="text-2xl font-bold tracking-tight text-white">Your FIRE milestone</h2>
                <p className="text-sm leading-6 text-slate-300">
                  {result.yearsToFI === null || fiAge === null || fiYear === null
                    ? <>At your current pace, FI is not projected within <strong>{inputs.maxYears} years</strong>.</>
                    : <>At your current pace you could reach financial independence at <strong>age {fiAge}</strong>, in about <strong>{result.yearsToFI} years</strong>, around <strong>{fiYear}</strong>.</>}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="FIRE Number" value={hasCoreInputs ? fireNumberShown : "—"} helper={`Based on ${inputs.withdrawalRatePct}% withdrawal rate, ${dollarBasis} (spending grows with inflation).${fireNumberTodayNote}`} />
                  <Stat label="Years Until FIRE" value={hasCoreInputs ? result.yearsToFI === null ? "Not reached" : `${result.yearsToFI} yrs` : "—"} helper={fiYear ? `Est. FIRE year: ${fiYear}` : undefined} />
                  <Stat label="Estimated FIRE Age" value={hasCoreInputs ? (fiAge ?? "—") : "—"} />
                  {inputs.advanced
                    ? <Stat label="Target Tracking" value={targetDelta === null ? "—" : targetDelta <= 0 ? `${Math.abs(targetDelta)} yrs ahead` : `${targetDelta} yrs behind`} helper={`Target age: ${inputs.targetFireAge}`} />
                    : <Stat label="Savings Rate" value={hasCoreInputs ? pct(savingsRate) : "—"} helper={`${money(netAnnual, 0)} est. net · ${estTaxRate.toFixed(1)}% tax rate`} />}
                </div>
                <ProgressBar pct={progress.pct} label="Progress to FIRE"
                  sublabel={<>{money(progress.current, 0)} {inputs.advanced ? "spendable toward FIRE" : "invested"} · {fiAge ? <>Projected under these assumptions: FIRE at <span className="font-semibold text-slate-200">{fiAge}</span></> : "Keep building your foundation"}</>} />
                {hasCoreInputs && result.yearsToFI !== null && (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
    <p className="text-xs text-slate-400">
      {result.yearsToFI === 0
        ? "You've hit your FIRE number, share the milestone."
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
                    : <>With a lean retirement budget of <strong>{money(inputs.retirementDifferent ? inputs.retirementExpensesMonthly : inputs.expensesMonthly, 0)}/mo</strong>, you could reach Lean FIRE at <strong>age {fiAge}</strong>
                      {leanYearsSaved !== null && leanYearsSaved > 0 ? <>, <strong>{leanYearsSaved} years sooner</strong> than {leanComparesToCurrent ? "retiring on your current spending" : "a higher-spending plan"}.</> : <>.</>}</>}
                </p>
                {/* Side-by-side comparison */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300">Lean FIRE</div>
                    <div className="mt-2 text-xs text-slate-400">{money(inputs.retirementDifferent ? inputs.retirementExpensesMonthly : inputs.expensesMonthly, 0)}/mo in retirement</div>
                    <div className="mt-3 text-2xl font-bold text-white">{fireNumberShown}</div>
                    <div className="mt-1 text-sm text-emerald-200">FIRE at age {fiAge ?? "—"}</div>
                    <div className="mt-1 text-xs text-slate-400">{result.yearsToFI !== null ? `${result.yearsToFI} years away` : "Not reached"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{leanComparesToCurrent ? "Retiring on your current spending" : "Full FIRE (+50% spending)"}</div>
                    <div className="mt-2 text-xs text-slate-400">{money(leanComparesToCurrent ? inputs.expensesMonthly : inputs.expensesMonthly * 1.5, 0)}/mo in retirement</div>
                    <div className="mt-3 text-2xl font-bold text-white">{fullFireNumberShown(fullFireForLean)}</div>
                    <div className="mt-1 text-sm text-slate-300">FIRE at age {fullFiAgeForLean ?? "—"}</div>
                    <div className="mt-1 text-xs text-slate-400">{fullFireForLean?.yearsToFI !== null && fullFireForLean?.yearsToFI !== undefined ? `${fullFireForLean.yearsToFI} years away` : "Not reached"}</div>
                  </div>
                </div>
                {leanYearsSaved !== null && leanYearsSaved > 0 && (
                  <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                    A lean retirement budget gets you there <strong>{leanYearsSaved} years</strong> sooner than {leanComparesToCurrent ? "retiring on your current spending" : "a plan with 50% higher spending"}.
                  </div>
                )}
                {hasCoreInputs && leanBudgetRows.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm font-semibold text-white">Compare retirement budgets</div>
                    <p className="mb-2 text-xs leading-5 text-slate-400">Your income, saving and current spending stay the same; only the monthly budget your portfolio must support in retirement changes.</p>
                    <div className="overflow-x-auto rounded-xl border border-white/10" role="region" aria-label="Retirement budget comparison" tabIndex={0}>
                      <table className="w-full min-w-[26rem] text-left text-xs">
                        <thead className="bg-white/5 text-slate-300">
                          <tr><th className="px-3 py-2">Monthly retirement budget</th><th className="px-3 py-2">FIRE number</th><th className="px-3 py-2">FIRE age</th></tr>
                        </thead>
                        <tbody className="text-slate-200">
                          {leanBudgetRows.map(r => (
                            <tr key={r.budget} className={["border-t border-white/10", r.mine ? "bg-emerald-300/10 font-semibold" : ""].join(" ")}>
                              <td className="px-3 py-2">{money(r.budget, 0)}{r.mine ? " (yours)" : ""}</td>
                              <td className="px-3 py-2">{money(inView(r.number, r.years), 0)}</td>
                              <td className="px-3 py-2">{r.age ?? "Not reached"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="Lean FIRE Number" value={hasCoreInputs ? fireNumberShown : "—"} helper={`At ${inputs.withdrawalRatePct}% withdrawal, ${dollarBasis}.${fireNumberTodayNote}`} highlight />
                  <Stat label="Savings Rate" value={hasCoreInputs ? pct(savingsRate) : "—"} helper={`${money(netAnnual, 0)} est. net income`} />
                </div>
                <ProgressBar pct={progress.pct} label="Progress to Lean FIRE"
                  sublabel={<>{money(progress.current, 0)} {inputs.advanced ? "spendable toward FIRE" : "invested"} · {fiAge ? <>Projected under these assumptions: Lean FIRE at <span className="font-semibold text-slate-200">{fiAge}</span></> : "Keep building"}</>} />
              </>)}

              {/* ── COAST ─────────────────────────────────────────────────── */}
              {mode === "coast" && (<>
                <h2 className="text-2xl font-bold tracking-tight text-white">Your Coast FIRE status</h2>
                <p className="text-sm leading-6 text-slate-300">
                  {!hasCoreInputs
                    ? "Enter your inputs to calculate your Coast FIRE number."
                    : isCoastReady
                    ? <>Your portfolio has already reached your Coast FIRE number. Compound growth alone can carry you to full retirement at <strong>age {inputs.targetRetirementAge}</strong>, even with no new contributions.</>
                    : <>You need <strong>{money(coastFireNumber ?? 0, 0)}</strong> invested by age <strong>{inputs.coastAge}</strong> for your portfolio to coast to retirement without new contributions (about <strong>{money(coastNeededToday ?? 0, 0)}</strong> if you stopped today).
                      {yearsToCoast !== null ? <> At your current pace, you could reach that in <strong>{yearsToCoast} years</strong>.</> : <> At your current pace you do not reach it before age {inputs.targetRetirementAge}; try saving more, a later retirement age or lower spending.</>}</>}
                </p>
                {hasCoreInputs && (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Three paths to retiring at {inputs.targetRetirementAge}</div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Stop contributing today</div>
                        <div className="mt-2 text-lg font-bold text-white">
                          {isCoastReady ? "Enough already" : coastNeededToday ? `${money(Math.max(0, coastNeededToday - result.startPortfolio), 0)} short` : "—"}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-slate-400">Needs {coastNeededToday ? money(coastNeededToday, 0) : "—"} invested today to coast to {inputs.targetRetirementAge}.</div>
                      </div>
                      <div className="rounded-2xl border border-sky-300/30 bg-sky-300/10 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-sky-200">Stop at age {inputs.coastAge}</div>
                        <div className="mt-2 text-lg font-bold text-white">
                          {isCoastReady ? "Already coast-ready" : yearsToCoast !== null ? `Coast-ready at ${inputs.age + yearsToCoast}` : "Not reached in time"}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-slate-400">Needs {coastFireNumber !== null && Number.isFinite(coastFireNumber) ? money(coastFireNumber, 0) : "—"} by age {inputs.coastAge}, then growth alone carries you to {inputs.targetRetirementAge}.</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Keep contributing</div>
                        <div className="mt-2 text-lg font-bold text-white">Full FIRE at {fullFiAgeForCoast ?? "—"}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-400">Contributions continue until your portfolio covers your spending. This is a different goal from the retirement age above.</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="Coast FIRE Number" value={coastFireNumber !== null && Number.isFinite(coastFireNumber) ? money(coastFireNumber, 0) : "—"}
                    helper={`Needed by age ${inputs.coastAge} to coast to retirement at ${inputs.targetRetirementAge}`} highlight={isCoastReady} />
                  <Stat label="Current Portfolio" value={money(result.startPortfolio, 0)}
                    helper={isCoastReady ? "✓ You've reached Coast FIRE" : coastNeededToday ? `${money(Math.max(0, coastNeededToday - result.startPortfolio), 0)} to go to coast from today` : undefined} />
                  <Stat label="Coast Status" value={isCoastReady ? "✓ Coast-ready" : yearsToCoast !== null ? `${yearsToCoast} yrs to coast` : "Not reached"}
                    helper={isCoastReady ? `Full FIRE projected at age ${fullFiAgeForCoast ?? "—"} if you keep contributing` : `Coasting at age ${inputs.coastAge} → retire at ${inputs.targetRetirementAge}`} highlight={isCoastReady} />
                  <Stat label="Full FIRE Projected Age" value={fullFiAgeForCoast ?? "—"} helper="If you keep contributing past coast age" />
                </div>
                <ProgressBar pct={coastProgress} label="Progress to Coast FIRE number"
                  sublabel={<>{money(result.startPortfolio, 0)} of {coastNeededToday ? money(coastNeededToday, 0) : "—"} needed today · {isCoastReady ? <span className="text-emerald-300 font-semibold">Coast-ready!</span> : `${Math.round(coastProgress * 100)}% there`}</>} />
              </>)}

              {/* ── BARISTA ───────────────────────────────────────────────── */}
              {mode === "barista" && (<>
                <h2 className="text-2xl font-bold tracking-tight text-white">Your Barista FIRE number</h2>
                <p className="text-sm leading-6 text-slate-300">
                  {!hasCoreInputs
                    ? "Enter your inputs to see your Barista FIRE number."
                    : fiAge === null
                    ? <>Barista FIRE not projected within <strong>{inputs.maxYears} years</strong>. Try adjusting your inputs.</>
                    : <>With <strong>{money(inputs.baristaPartTimeIncome, 0)}/yr</strong> of part-time income, your portfolio only needs to cover <strong>{money(Math.max(0, retirementAnnualFor(inputs, annualExp) - (Number(inputs.baristaPartTimeIncome) || 0)), 0)}/yr</strong>, reaching Barista FIRE at <strong>age {fiAge}</strong>.</>}
                </p>
                {/* Side-by-side */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">Barista FIRE</div>
                    <div className="mt-2 text-xs text-slate-400">{money(inputs.baristaPartTimeIncome, 0)}/yr part-time income</div>
                    <div className="mt-3 text-2xl font-bold text-white">{fireNumberShown}</div>
                    <div className="mt-1 text-sm text-amber-200">FIRE at age {fiAge ?? "—"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Full FIRE (no part-time income)</div>
                    <div className="mt-2 text-xs text-slate-400">Portfolio covers all expenses, {dollarBasis}</div>
                    <div className="mt-3 text-2xl font-bold text-white">{fullFireNumberShown(fullFireForBarista)}</div>
                    <div className="mt-1 text-sm text-slate-300">FIRE at age {fullFiAgeForBarista ?? "—"}</div>
                  </div>
                </div>
                {baristaYearsSaved !== null && baristaYearsSaved > 0 && (
                  <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                    Part-time income saves you <strong>{baristaYearsSaved} years</strong> vs waiting for full FIRE. That&apos;s the Barista FIRE advantage.
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="Barista FIRE Number" value={hasCoreInputs ? fireNumberShown : "—"} helper={`At ${inputs.withdrawalRatePct}% withdrawal on the gap, ${dollarBasis}.${fireNumberTodayNote}`} highlight />
                  <Stat label="Portfolio Gap Covered" value={hasCoreInputs ? money(Math.max(0, annualExp - (Number(inputs.baristaPartTimeIncome) || 0)), 0) : "—"} helper="Amount your portfolio must fund per year" />
                </div>
                <ProgressBar pct={progress.pct} label="Progress to Barista FIRE"
                  sublabel={<>{money(progress.current, 0)} {inputs.advanced ? "spendable toward FIRE" : "invested"} · {fiAge ? <>Projected under these assumptions: Barista FIRE at <span className="font-semibold text-slate-200">{fiAge}</span></> : "Keep building"}</>} />
                {/* Part-time income sensitivity table */}
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm font-semibold text-white">Part-time income sensitivity</div>
                  <div className="mt-1 text-xs text-slate-400">How different income levels change your number (in today&apos;s dollars) and timeline</div>
                <div className="mt-3 overflow-x-auto overscroll-x-contain rounded-xl border border-white/10" role="region" aria-label="Part-time income sensitivity" tabIndex={0}>
                  <div className="min-w-[26rem]">
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
                </div>
              </>)}

              {/* ── Shared: methodology note ───────────────────────────────── */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <div className="font-semibold text-white mb-2">How this estimate works</div>
                <div className="text-xs leading-5 text-slate-400">
                  {MODE_NOTES[mode]} Returns use your selected volatility preset. Inflation and salary growth compound annually, and take-home pay is recalculated each year through the tax engine, with pay growing at the salary-growth rate and the tax brackets, deductions and 401(k) limit indexed to inflation. Each year&apos;s saving is added as twelve monthly end-of-month deposits. This is a planning estimate, not financial or tax advice.
                </div>
              </div>

              {/* ── Next steps: compare a move, see the FIRE impact, then plan in detail ── */}
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                <div className="text-sm font-semibold text-white">Where to go next</div>
                <ol className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    { n: 1, title: "Compare a move", body: "See what a city or state change does to rent, taxes and take-home pay.", href: "/compare", cta: "Compare cities" },
                    { n: 2, title: "See the FIRE impact", body: "Rank cities by how much sooner they could get you to FIRE.", href: "/best-cities-for-fire", cta: "Best cities for FIRE" },
                    { n: 3, title: "Plan it in detail", body: "Model withdrawals, taxes and Social Security year by year (Beta).", href: "/complete-retirement-plan", cta: "Complete Retirement Plan" },
                  ].map((s) => (
                    <li key={s.n} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300">Step {s.n}</div>
                      <div className="mt-1 text-sm font-semibold text-white">{s.title}</div>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{s.body}</p>
                      <Link href={s.href} className="mt-2 inline-block text-xs font-semibold text-emerald-200 underline decoration-emerald-300/40 underline-offset-4 hover:text-emerald-100">{s.cta} →</Link>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════
              MOVE TAB
          ═══════════════════════════════════════════════════════════════ */}
          <section className={activeResultTab === "move" ? "block space-y-4" : "hidden"}>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="text-sm font-semibold text-amber-100">🔥 How a move could change your timeline</div>
              <div className="mt-1 text-xs text-amber-100/80">Same income and investing assumptions, spending adjusted by each city&apos;s cost profile.</div>
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
                <ResponsiveContainer initialDimension={{ width: 480, height: 280 }} width="100%" height="100%" minWidth={0}>
                  <LineChart data={comparisonChartData} margin={{ top: 18, right: 8, bottom: 6, left: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis dataKey="age" tick={{ fontSize: 12, fill: "rgba(148,163,184,0.95)" }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={{ fontSize: 11, fill: "rgba(148,163,184,0.95)" }} axisLine={false} tickLine={false} width={52}
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
              <div className="mt-4 overflow-x-auto overscroll-x-contain rounded-xl border border-white/10" role="region" aria-label="Savings rate sensitivity" tabIndex={0}>
                <div className="min-w-[26rem]">
                <div className="grid grid-cols-4 bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-widest text-slate-300/80">
                  <div>RATE</div><div>SPENDING</div><div>YEARS</div><div>AGE</div>
                </div>
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
          {/* Placeholder links (href "#") are hidden until real affiliate links are added. */}
          {MODE_AFFILIATES[mode].some(a => a.href !== "#") && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                {nudge ? "Recommended accounts for your situation" : "Accounts worth considering"}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {MODE_AFFILIATES[mode].filter(a => a.href !== "#").map(a => <AffiliateCard key={a.name} a={a} />)}
              </div>
              <p className="mt-3 text-[11px] text-slate-500">Affiliate links, we may earn a commission at no cost to you. Recommendations are based on your FIRE mode, not paid placement.</p>
            </div>
          )}

          {/* ── UPSELL PLACEHOLDER ───────────────────────────────────────── */}
         {AI_REPORTS_ENABLED && <FireReport inputs={reportInputs} />}


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
