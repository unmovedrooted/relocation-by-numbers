"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { STATES, type StateCode } from "@/lib/states";
import { findCity, citiesForState } from "@/lib/cities";
import { estimateNetAnnual, effectiveTaxRatePct, type FilingStatus } from "@/lib/tax";

type FireCalculatorProps = {
  initialIncome?: number;
};

type Preset = "custom" | "lean" | "fat";
type StateChoice = StateCode | "";

type Inputs = {
  preset: Preset;

  age: number;
  income: number;
  expensesMonthly: number;

  state: StateChoice;
  filingStatus: FilingStatus;
  k401Pct: number;

  currentPortfolio: number;
  yearlyInvestment: number;

  advanced: boolean;
  targetFireAge: number;

  bal401k: number;
  balIra: number;
  balBrokerage: number;

  contrib401k: number;
  contribIra: number;
  contribBrokerage: number;

  annualReturnPct: number;
  withdrawalRatePct: number;
  maxYears: number;

  inflationPct: number;
  salaryGrowthPct: number;

  phase2ReturnPct: number;
  phase2StartsYear: number;

  moveCompareOn: boolean;
  movedExpensesMonthly: number;
};

type ProjectionPoint = {
  year: number;
  age: number;
  portfolio: number;
  fireTarget: number;
};

type Affiliate = {
  name: string;
  blurb: string;
  href: string;
  tag: string;
};

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

function impactLabel(yearsSaved: number | null) {
  if (yearsSaved === null) return "—";
  if (yearsSaved >= 5) return `high impact · save ${yearsSaved} years`;
  if (yearsSaved >= 2) return `medium impact · save ${yearsSaved} years`;
  if (yearsSaved >= 1) return `helpful · save ${yearsSaved} year`;
  return "limited impact with current inputs";
}

const DEFAULT_INPUTS: Inputs = {
  preset: "custom",

  age: 30,
  income: 90000,
  expensesMonthly: 4000,

  state: "ny",
  filingStatus: "single",
  k401Pct: 8,

  currentPortfolio: 75000,
  yearlyInvestment: 0,

  advanced: false,
  targetFireAge: 45,

  bal401k: 0,
  balIra: 0,
  balBrokerage: 0,

  contrib401k: 0,
  contribIra: 0,
  contribBrokerage: 0,

  annualReturnPct: 7,
  withdrawalRatePct: 4,
  maxYears: 60,

  inflationPct: 2.5,
  salaryGrowthPct: 3,

  phase2ReturnPct: 5.5,
  phase2StartsYear: 10,

  moveCompareOn: true,
  movedExpensesMonthly: 2800,
};

const VIRAL_COMPARE_CITIES = [
  "nyc-ny",
  "austin-tx",
  "raleigh-nc",
  "charlotte-nc",
  "denver-co",
] as const;

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const ADSENSE_SLOT_RESULTS = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULTS || "";
const ADSENSE_SLOT_BOTTOM = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM || "";

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

const FAQS = [
  {
    q: "Why does location affect my FIRE timeline?",
    a: "Because location changes two of the biggest drivers of financial independence: taxes and spending. A lower-cost or lower-tax location can increase how much you keep and reduce how much you need to retire.",
  },
  {
    q: "Does Move Impact assume the same salary?",
    a: "Yes. Move Impact is designed to isolate the effect of location. It keeps your income and investing assumptions the same and shows how different expenses could change your FIRE timeline.",
  },
  {
    q: "Are the tax numbers exact?",
    a: "No. They are simplified estimates based on your selected state and filing status. They are meant for planning and comparison, not tax filing.",
  },
  {
    q: "Why does my FIRE number change between cities?",
    a: "Your FIRE number is based on spending. If your projected spending changes in a different city, the amount you need to reach financial independence changes too.",
  },
] as const;

function expenseAdjustedForCity(
  baseAnnualExpenses: number,
  targetCityId: string,
  baselineCityId: string
) {
  const targetCity = findCity(targetCityId);
  const baselineCity = findCity(baselineCityId);

  if (!targetCity?.col?.housing || !baselineCity?.col?.housing) {
    return baseAnnualExpenses;
  }

  const targetBlend = 0.4 + 0.6 * targetCity.col.housing;
  const baselineBlend = 0.4 + 0.6 * baselineCity.col.housing;

  const relativeFactor = targetBlend / baselineBlend;

  return Math.max(0, baseAnnualExpenses * relativeFactor);
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

function getBaselineCityIdForState(stateCode: StateChoice) {
  if (!stateCode) return "nyc-ny";

  const stateCities = citiesForState(stateCode as StateCode);

  const major = stateCities.find((city) => city.tier === "major" && !city.id.startsWith("other-"));
  if (major) return major.id;

  const mid = stateCities.find((city) => city.tier === "mid" && !city.id.startsWith("other-"));
  if (mid) return mid.id;

  const small = stateCities.find((city) => city.tier === "small" && !city.id.startsWith("other-"));
  if (small) return small.id;

  return "nyc-ny";
}

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

  const autoAnnualInvestment = Math.max(0, netAnnualBase - annualExpenses(i));

  const annualContribution = i.advanced
    ? i.contrib401k + i.contribIra + contribBrokerage
    : i.yearlyInvestment > 0
      ? i.yearlyInvestment
      : autoAnnualInvestment;

  return { startPortfolio, annualContribution };
}

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

  const fire0 = swr > 0 ? baseExpenses / swr : Infinity;
  if (portfolio >= fire0) {
    return { fireNumber: fire0, yearsToFI: 0 as number, endPortfolio: portfolio, startPortfolio };
  }

  while (years < i.maxYears) {
    const yearIndex = years;
    const r = returnForYear(i, yearIndex);

    const expensesThisYear = baseExpenses * Math.pow(1 + infl, yearIndex);
    const netThisYear = netAnnualBase * Math.pow(1 + salG, yearIndex);

    let contribThisYear = annualContribution;
    if (!i.advanced && (Number(i.yearlyInvestment) || 0) <= 0) {
      contribThisYear = Math.max(0, netThisYear - expensesThisYear);
    }

    const fireNumberThisYear = swr > 0 ? expensesThisYear / swr : Infinity;

    portfolio = portfolio * (1 + r) + Math.max(0, contribThisYear);
    years += 1;

    if (portfolio >= fireNumberThisYear) break;
  }

  const lastYearIndex = Math.max(0, years - 1);
  const expensesAtEnd = baseExpenses * Math.pow(
    1 + ((Number(i.inflationPct) || 0) / 100),
    lastYearIndex
  );
  const fireAtEnd = swr > 0 ? expensesAtEnd / swr : Infinity;

  return {
    fireNumber: fireAtEnd,
    yearsToFI: portfolio >= fireAtEnd ? years : (null as number | null),
    endPortfolio: portfolio,
    startPortfolio,
  };
}

function buildProjectionWithExpenses(
  i: Inputs,
  netAnnualBase: number,
  yearsToFI: number | null,
  baseExpenses: number
) {
  const infl = (Number(i.inflationPct) || 0) / 100;
  const salG = (Number(i.salaryGrowthPct) || 0) / 100;
  const swr = (Number(i.withdrawalRatePct) || 0) / 100;

  const { startPortfolio, annualContribution } = totals(i, netAnnualBase);

  const extraYearsAfterFI = 2;
  const cap = i.maxYears;
  const stopAt = yearsToFI === null ? cap : clamp(yearsToFI + extraYearsAfterFI, 0, cap);

  const points: ProjectionPoint[] = [];
  let portfolio = startPortfolio;

  const fireTarget0 = swr > 0 ? baseExpenses / swr : Infinity;

  points.push({
    year: 0,
    age: i.age,
    portfolio,
    fireTarget: fireTarget0,
  });

  for (let y = 1; y <= stopAt; y++) {
    const yearIndex = y - 1;
    const r = returnForYear(i, yearIndex);

    const expensesThisYear = baseExpenses * Math.pow(1 + infl, yearIndex);
    const netThisYear = netAnnualBase * Math.pow(1 + salG, yearIndex);

    let contribThisYear = annualContribution;
    if (!i.advanced && (Number(i.yearlyInvestment) || 0) <= 0) {
      contribThisYear = Math.max(0, netThisYear - expensesThisYear);
    }

    portfolio = portfolio * (1 + r) + Math.max(0, contribThisYear);

    const nextExpenses = baseExpenses * Math.pow(1 + infl, y);
    const fireTarget = swr > 0 ? nextExpenses / swr : Infinity;

    points.push({
      year: y,
      age: i.age + y,
      portfolio,
      fireTarget,
    });
  }

  return points;
}

function buildProjection(i: Inputs, netAnnualBase: number, yearsToFI: number | null) {
  return buildProjectionWithExpenses(i, netAnnualBase, yearsToFI, annualExpenses(i));
}

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

function AffiliateCard({ a }: { a: Affiliate }) {
  return (
    <a
      href={a.href}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{a.name}</div>
        <div className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-slate-300">
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

export default function FireCalculator({
  initialIncome = 0,
}: FireCalculatorProps) {
  const [inputs, setInputs] = useState<Inputs>(() => ({
    ...DEFAULT_INPUTS,
    income: initialIncome > 0 ? initialIncome : DEFAULT_INPUTS.income,
  }));

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [pinnedCompareCityId, setPinnedCompareCityId] = useState<string | null>(null);

  const annualExp = useMemo(() => annualExpenses(inputs), [inputs]);

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

  const viralCityResults = useMemo(() => {
    const baseAnnualExpenses = annualExpenses(inputs);
    const baselineCityId = getBaselineCityIdForState(inputs.state);

    const rows = VIRAL_COMPARE_CITIES.map((cityId) => {
      const city = findCity(cityId);
      if (!city) return null;

      if (cityId === baselineCityId) {
        return {
          cityId,
          cityName: city.name,
          state: city.state.toUpperCase(),
          ageAtFI: fiAge,
          yearsToFI: result.yearsToFI,
          isBaseline: true,
          deltaYears: 0,
        };
      }

      const adjustedExpenses = expenseAdjustedForCity(
        baseAnnualExpenses,
        cityId,
        baselineCityId
      );

      const sim = simulateYearsToFI(inputs, netAnnual, {
        expensesAnnualBase: adjustedExpenses,
      });

      const ageAtFI = sim.yearsToFI === null ? null : inputs.age + sim.yearsToFI;

      const deltaYears =
        sim.yearsToFI !== null && result.yearsToFI !== null
          ? result.yearsToFI - sim.yearsToFI
          : null;

      return {
        cityId,
        cityName: city.name,
        state: city.state.toUpperCase(),
        ageAtFI,
        yearsToFI: sim.yearsToFI,
        isBaseline: false,
        deltaYears,
      };
    }).filter(Boolean);

    return rows.sort((a, b) => {
      if (a!.isBaseline) return -1;
      if (b!.isBaseline) return 1;

      const aDelta = a!.deltaYears ?? -999;
      const bDelta = b!.deltaYears ?? -999;

      return bDelta - aDelta;
    });
  }, [inputs, netAnnual, fiAge, result.yearsToFI]);

  useEffect(() => {
    if (!pinnedCompareCityId) return;

    const stillVisible = viralCityResults.some((row) => row?.cityId === pinnedCompareCityId);

    if (!stillVisible) {
      setPinnedCompareCityId(null);
    }
  }, [pinnedCompareCityId, viralCityResults]);

  const proposedComparison = useMemo(() => {
    if (!pinnedCompareCityId) return null;

    const baselineCityId = getBaselineCityIdForState(inputs.state);
    const baseAnnualExpenses = annualExpenses(inputs);

    const adjustedExpenses = expenseAdjustedForCity(
      baseAnnualExpenses,
      pinnedCompareCityId,
      baselineCityId
    );

    const sim = simulateYearsToFI(inputs, netAnnual, {
      expensesAnnualBase: adjustedExpenses,
    });

    const yearsToFI = sim.yearsToFI;
    const ageAtFI = yearsToFI === null ? null : inputs.age + yearsToFI;

    const projectionPoints = buildProjectionWithExpenses(
      inputs,
      netAnnual,
      yearsToFI,
      adjustedExpenses
    );

    const city = findCity(pinnedCompareCityId);

    return {
      city,
      adjustedExpenses,
      sim,
      yearsToFI,
      ageAtFI,
      projectionPoints,
    };
  }, [pinnedCompareCityId, inputs, netAnnual]);

  const comparisonChartData = useMemo(() => {
    if (!proposedComparison) {
      return projection.map((p) => ({
        age: p.age,
        currentPortfolio: p.portfolio,
        currentFireTarget: p.fireTarget,
      }));
    }

    const ageMap = new Map<
      number,
      {
        age: number;
        currentPortfolio?: number;
        currentFireTarget?: number;
        proposedPortfolio?: number;
      }
    >();

    projection.forEach((p) => {
      ageMap.set(p.age, {
        ...(ageMap.get(p.age) || { age: p.age }),
        age: p.age,
        currentPortfolio: p.portfolio,
        currentFireTarget: p.fireTarget,
      });
    });

    proposedComparison.projectionPoints.forEach((p) => {
      ageMap.set(p.age, {
        ...(ageMap.get(p.age) || { age: p.age }),
        age: p.age,
        proposedPortfolio: p.portfolio,
      });
    });

    return Array.from(ageMap.values()).sort((a, b) => a.age - b.age);
  }, [projection, proposedComparison]);

  const crossoverPoint = useMemo(() => {
    return projection.find((p) => p.portfolio >= p.fireTarget) ?? null;
  }, [projection]);

  const targetDelta = useMemo(() => {
    if (!inputs.advanced) return null;
    if (result.yearsToFI === null) return null;
    const targetYears = inputs.targetFireAge - inputs.age;
    return result.yearsToFI - targetYears;
  }, [inputs.advanced, inputs.targetFireAge, inputs.age, result.yearsToFI]);

  const progress = useMemo(() => {
    const current = Number(result.startPortfolio);
    const target = Number(result.fireNumber);
    const p = target > 0 && Number.isFinite(target) ? clamp(current / target, 0, 1) : 0;
    return { current, target, pct: p };
  }, [result.startPortfolio, result.fireNumber]);

  const hasCoreInputs = inputs.age > 0 && inputs.income > 0 && inputs.expensesMonthly > 0;

  const progressHeadline = useMemo(() => {
    if (!hasCoreInputs) return "—";
    return `${Math.round(progress.pct * 100)}% of FIRE number`;
  }, [hasCoreInputs, progress.pct]);

  const progressSubline = useMemo(() => {
    if (!hasCoreInputs) return "Tracks progress toward your target portfolio.";
    if (fiAge !== null) {
      return `${money(progress.current, 0)} invested · On track for FIRE at ${fiAge}`;
    }
    return `${money(progress.current, 0)} invested · Keep adjusting your inputs to improve your path`;
  }, [hasCoreInputs, fiAge, progress.current]);

  const movedResult = useMemo(() => {
    if (!inputs.moveCompareOn) return null;
    return simulateYearsToFI(inputs, netAnnual, {
      expensesAnnualBase: annualMovedExpenses(inputs),
    });
  }, [inputs, netAnnual]);

  const movedFiAge = useMemo(() => {
    if (!movedResult || movedResult.yearsToFI === null) return null;
    return inputs.age + movedResult.yearsToFI;
  }, [inputs.age, movedResult]);

  const moveDeltaYears = useMemo(() => {
    if (!inputs.moveCompareOn) return null;
    if (fiAge === null || movedFiAge === null) return null;
    return fiAge - movedFiAge;
  }, [inputs.moveCompareOn, fiAge, movedFiAge]);

 const comparisonYearsSaved = useMemo(() => {
  if (fiAge === null) return null;
  if (!proposedComparison) return null;
  if (proposedComparison.ageAtFI === null) return null;

  return fiAge - proposedComparison.ageAtFI;
}, [fiAge, proposedComparison]);

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

  const bestMoveCityId = useMemo(() => {
    const candidates = viralCityResults.filter(
      (row) => !row!.isBaseline && (row!.deltaYears ?? 0) > 0
    );

    if (candidates.length === 0) return null;

    return candidates[0]!.cityId;
  }, [viralCityResults]);

  const savingsTable = useMemo(() => {
    const income = netAnnual;
    const baseAge = inputs.age;

    const rates = [10, 20, 30, 40, 50, 60, 70];
    return rates.map((rPct) => {
      const r = rPct / 100;
      const impliedExpenses = Math.max(0, income * (1 - r));
      const sim =
        income > 0
          ? simulateYearsToFI(inputs, netAnnual, { expensesAnnualBase: impliedExpenses })
          : null;

      const years = sim?.yearsToFI ?? null;
      const ageAtFi = years === null || !Number.isFinite(baseAge) ? null : baseAge + years;

      return { savingsRatePct: rPct, impliedExpenses, yearsToFI: years, ageAtFI: ageAtFi };
    });
  }, [inputs, netAnnual]);

  const currentSavingsRatePct = useMemo(() => {
    return Math.round(savingsRate * 100);
  }, [savingsRate]);

  const nearestSavingsRateRow = useMemo(() => {
    const rates = [10, 20, 30, 40, 50, 60, 70];
    return rates.reduce((closest, rate) => {
      return Math.abs(rate - currentSavingsRatePct) < Math.abs(closest - currentSavingsRatePct)
        ? rate
        : closest;
    }, rates[0]);
  }, [currentSavingsRatePct]);

  const biggestDrivers = useMemo(() => {
    const currentAnnualExpenses = annualExpenses(inputs);
    const moveSavingsYears =
      inputs.moveCompareOn && moveDeltaYears !== null ? Math.max(0, moveDeltaYears) : 0;

    const spendingImpact =
      currentAnnualExpenses >= 70000
        ? "Very high"
        : currentAnnualExpenses >= 40000
          ? "High"
          : currentAnnualExpenses >= 20000
            ? "Medium"
            : "Lower";

    const taxImpact =
      estTaxRate >= 25 ? "High" : estTaxRate >= 15 ? "Medium" : "Lower";

    const savingsImpact =
      savingsRate >= 0.4
        ? "Very high"
        : savingsRate >= 0.2
          ? "High"
          : savingsRate >= 0.1
            ? "Medium"
            : "Lower";

    const moveImpact =
      moveSavingsYears >= 7
        ? "Very high"
        : moveSavingsYears >= 3
          ? "High"
          : moveSavingsYears > 0
            ? "Medium"
            : "Low";

    return {
      spendingImpact,
      taxImpact,
      savingsImpact,
      moveImpact,
    };
  }, [inputs, moveDeltaYears, estTaxRate, savingsRate]);

  const fastestPath = useMemo(() => {
    const currentMonthly = inputs.expensesMonthly;

    const lowerSpendingMonthly = Math.max(0, currentMonthly - 500);
    const lowerSpendingSim = simulateYearsToFI(inputs, netAnnual, {
      expensesAnnualBase: annualExpensesFromMonthly(lowerSpendingMonthly),
    });

    const lowerSpendingYearsSaved =
      result.yearsToFI !== null && lowerSpendingSim.yearsToFI !== null
        ? Math.max(0, result.yearsToFI - lowerSpendingSim.yearsToFI)
        : null;

    const autoContributionBase =
      inputs.yearlyInvestment > 0
        ? inputs.yearlyInvestment
        : Math.max(0, netAnnual - annualExpenses(inputs));

    const higherContributionAnnual = autoContributionBase + 5000;

    const higherContributionInputs = {
      ...inputs,
      yearlyInvestment: higherContributionAnnual,
    };

    const higherContributionSim = simulateYearsToFI(higherContributionInputs, netAnnual);

    const higherContributionYearsSaved =
      result.yearsToFI !== null && higherContributionSim.yearsToFI !== null
        ? Math.max(0, result.yearsToFI - higherContributionSim.yearsToFI)
        : null;

    const bestMoveRow =
      viralCityResults.find((row) => !row!.isBaseline && (row!.deltaYears ?? 0) > 0) ?? null;

    return {
      lowerSpendingMonthly,
      lowerSpendingYearsSaved,
      higherContributionAnnual,
      higherContributionYearsSaved,
      bestMoveCity: bestMoveRow ? `${bestMoveRow.cityName}, ${bestMoveRow.state}` : null,
      bestMoveYearsSaved: bestMoveRow?.deltaYears ?? null,
    };
  }, [inputs, netAnnual, result.yearsToFI, viralCityResults]);

  return (
    <section className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold tracking-tight text-white">Calculator inputs</div>
              <div className="text-xs leading-5 text-slate-300">
                Enter your income, spending, and investing assumptions to estimate your path to
                financial independence.
              </div>
              <div className="mt-1 text-[11px] leading-5 text-slate-400">
                Showing example values so you can see how the calculator works. Update them anytime
                with your own numbers.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyPreset("custom")}
                className={[
                  "rounded-xl border px-3 py-2 text-xs font-medium",
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
                  "rounded-xl border px-3 py-2 text-xs font-medium",
                  inputs.advanced
                    ? "border-violet-300/40 bg-violet-300/10 text-violet-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
                ].join(" ")}
              >
                {inputs.advanced ? "Advanced: ON" : "Advanced: OFF"}
              </button>

              <button
                onClick={() =>
                  setInputs({
                    ...DEFAULT_INPUTS,
                    income: initialIncome > 0 ? initialIncome : DEFAULT_INPUTS.income,
                  })
                }
                className="rounded-xl border border-red-300/40 bg-red-300/10 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-300/20"
              >
                ↺ Reset
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-x-4 gap-y-3 sm:grid-cols-2">
            <Field
              label="Current age"
              value={inputs.age}
              onChange={(v) => setInputs((s) => ({ ...s, age: clamp(v, 0, 100) }))}
            />

            <Field
              label="Annual gross income"
              value={inputs.income}
              onChange={(v) => setInputs((s) => ({ ...s, income: clamp(v, 0, 2_000_000) }))}
              prefix="$"
            />

            <label className="block">
              <div className="mb-0.5 pt-[2px] text-[11px] font-medium leading-tight text-slate-300">
                State for tax estimate
              </div>
              <select
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white shadow-inner outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10"
                value={inputs.state}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, state: e.target.value as StateChoice }))
                }
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
              <div className="mb-0.5 pt-[2px] text-[11px] font-medium leading-tight text-slate-300">
                Filing status
              </div>
              <select
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 text-sm text-white shadow-inner outline-none transition focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10"
                value={inputs.filingStatus}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, filingStatus: e.target.value as FilingStatus }))
                }
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
              label="Monthly spending"
              value={inputs.expensesMonthly}
              onChange={(v) =>
                setInputs((s) => ({ ...s, expensesMonthly: clamp(v, 0, 200_000) }))
              }
              prefix="$"
            />

            <div className="-mt-1 text-xs text-slate-400 sm:col-start-2">
              That’s about <span className="font-semibold text-slate-200">{money(annualExp, 0)}</span>{" "}
              / year
            </div>

            <Field
              label="Current invested portfolio"
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
              label="Annual contributions (optional)"
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

            <div className="-mt-1 text-xs text-slate-400 sm:col-start-2">
              Leave blank to estimate savings from after-tax income.
            </div>

            {inputs.advanced ? (
              <>
                <div className="mt-2 text-xs font-semibold tracking-widest text-slate-300/80 sm:col-span-2">
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
                  onChange={(v) =>
                    setInputs((s) => ({ ...s, balBrokerage: clamp(v, 0, 50_000_000) }))
                  }
                  prefix="$"
                />

                <div className="mt-2 text-xs font-semibold tracking-widest text-slate-300/80 sm:col-span-2">
                  YEARLY CONTRIBUTIONS
                </div>

                <Field
                  label="401(k) annual contribution"
                  value={inputs.contrib401k}
                  onChange={(v) =>
                    setInputs((s) => ({ ...s, contrib401k: clamp(v, 0, 500_000) }))
                  }
                  prefix="$"
                />

                <Field
                  label="IRA yearly contribution"
                  value={inputs.contribIra}
                  onChange={(v) =>
                    setInputs((s) => ({ ...s, contribIra: clamp(v, 0, 500_000) }))
                  }
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

                <div className="mt-2 text-xs font-semibold tracking-widest text-slate-300/80 sm:col-span-2">
                  TARGETING
                </div>

                <Field
                  label="Target FIRE age"
                  value={inputs.targetFireAge}
                  onChange={(v) =>
                    setInputs((s) => ({ ...s, targetFireAge: clamp(v, inputs.age, 100) }))
                  }
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
              onChange={(v) =>
                setInputs((s) => ({ ...s, withdrawalRatePct: clamp(v, 2, 6) }))
              }
              suffix="%"
            />

            <Field
              label="Inflation (%)"
              value={inputs.inflationPct}
              onChange={(v) => setInputs((s) => ({ ...s, inflationPct: clamp(v, 0, 10) }))}
              suffix="%"
            />

            <Field
              label="Salary growth (%) — income grows"
              value={inputs.salaryGrowthPct}
              onChange={(v) =>
                setInputs((s) => ({ ...s, salaryGrowthPct: clamp(v, 0, 15) }))
              }
              suffix="%"
            />

            <Field
              label="Phase 2 starts after (years)"
              value={inputs.phase2StartsYear}
              onChange={(v) =>
                setInputs((s) => ({ ...s, phase2StartsYear: clamp(v, 0, 80) }))
              }
            />

            <Field
              label="Expected annual return (%) — Phase 2"
              value={inputs.phase2ReturnPct}
              onChange={(v) => setInputs((s) => ({ ...s, phase2ReturnPct: clamp(v, 0, 15) }))}
              suffix="%"
            />

            <Field
              label="Projection length (years)"
              value={inputs.maxYears}
              onChange={(v) => setInputs((s) => ({ ...s, maxYears: clamp(v, 1, 80) }))}
            />

            <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-200">
                    How moving could change your FIRE timeline
                  </div>
                  <div className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
                    Most people pursuing FIRE focus on saving more. But geography may be one of the
                    most powerful levers you can pull. See how your projected FIRE age changes when
                    you move from a higher-cost city to a lower-cost one—using the same income, the
                    same investing habits, and a different cost of living.
                  </div>
                </div>

                <button
                  onClick={() => setInputs((s) => ({ ...s, moveCompareOn: !s.moveCompareOn }))}
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-medium",
                    inputs.moveCompareOn
                      ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
                  ].join(" ")}
                >
                  {inputs.moveCompareOn ? "Hide city comparison" : "Compare cities"}
                </button>
              </div>

             {inputs.moveCompareOn ? (
  <>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Field
        label="Projected monthly expenses after moving"
        value={inputs.movedExpensesMonthly}
        onChange={(v) =>
          setInputs((s) => ({ ...s, movedExpensesMonthly: clamp(v, 0, 200_000) }))
        }
        prefix="$"
      />

      <div className="self-end text-xs text-slate-400">
        Tip: Use your relocation calculator’s estimated monthly spending after the move.
        <div className="mt-1">
          Annual:{" "}
          <span className="font-semibold text-slate-200">
            {money(annualMovedExpenses(inputs), 0)}
          </span>
        </div>
      </div>
    </div>

    <div className="mt-4 grid gap-4">
      <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-4">
        <div className="text-xs font-semibold tracking-widest text-emerald-100">
          MOVE IMPACT
        </div>

        <div className="mt-3 grid gap-2 text-sm text-emerald-50">
          <div className="flex items-center justify-between gap-3">
            <span className="text-emerald-100/80">Current FIRE age</span>
            <span className="font-semibold">{fiAge === null ? "—" : fiAge}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-emerald-100/80">FIRE age after move</span>
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

      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
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
    </div>
  </>
) : null}
            </div>
          </div>

           <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <div className="text-sm font-semibold text-white">
        How your savings rate changes your FIRE timeline
      </div>
      <div className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
        See how spending less and saving more could change the number of years until
        financial independence. This table keeps your estimated after-tax income the same
        and adjusts expenses to match each savings rate.
      </div>
    </div>
  </div>

  <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300">
    Current savings rate: {pct(savingsRate, 1)} · nearest scenario highlighted below
  </div>

  <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
    <div className="grid grid-cols-[1.35fr_1.15fr_1fr_1fr] bg-white/5 px-3 py-2 text-[11px] font-semibold tracking-widest text-slate-300/80">
      <div>SAVINGS RATE</div>
      <div>ANNUAL SPENDING</div>
      <div>YEARS TO FI</div>
      <div>FIRE AGE</div>
    </div>

    <div className="divide-y divide-white/10">
      {savingsTable.map((row) => {
        const isCurrentRow = row.savingsRatePct === nearestSavingsRateRow;

        return (
          <div
            key={row.savingsRatePct}
            className={[
              "grid grid-cols-[1.35fr_1.15fr_1fr_1fr] items-center px-3 py-3 text-sm",
              isCurrentRow ? "bg-emerald-300/10" : "",
            ].join(" ")}
          >
            <div className="text-slate-200">
              <div className="font-medium">{row.savingsRatePct}%</div>
              {isCurrentRow ? (
                <div className="mt-1">
                  <span className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                    Current
                  </span>
                </div>
              ) : null}
            </div>

            <div className="text-slate-200">{money(row.impliedExpenses, 0)}</div>

            <div className="text-slate-200">
              {netAnnual <= 0 ? "—" : row.yearsToFI === null ? "Not reached" : row.yearsToFI}
            </div>

            <div className="text-slate-200">
              {netAnnual <= 0 ? "—" : row.ageAtFI === null ? "—" : row.ageAtFI}
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {!hasCoreInputs ? (
    <div className="mt-3 text-xs leading-5 text-slate-400">
      Tip: This table becomes more useful after you set your income, monthly expenses, and
      yearly contributions.
    </div>
  ) : null}
</div>
        
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <h2 className="text-2xl font-bold tracking-tight text-white">Your FIRE milestone</h2>

            <div className="mt-3 space-y-2">
              <p className="text-sm leading-6 text-slate-300 sm:text-base">
                {result.yearsToFI === null || fiAge === null || fiYear === null ? (
                  <>
                    At your current pace, financial independence is not projected within{" "}
                    <strong>{inputs.maxYears} years</strong>.
                  </>
                ) : (
                  <>
                    At your current pace, you could reach financial independence at age{" "}
                    <strong>{fiAge}</strong> — around <strong>{fiYear}</strong>.
                  </>
                )}
              </p>

              <p className="text-sm leading-6 text-emerald-200/90">
                {inputs.moveCompareOn && moveDeltaYears !== null && movedFiAge !== null ? (
                  moveDeltaYears > 0 ? (
                    <>
                      If your monthly spending dropped to{" "}
                      <strong>{money(inputs.movedExpensesMonthly, 0)}</strong> after a move, you
                      could reach FIRE about <strong>{moveDeltaYears} years earlier</strong>.
                    </>
                  ) : moveDeltaYears < 0 ? (
                    <>
                      With post-move spending of{" "}
                      <strong>{money(inputs.movedExpensesMonthly, 0)}</strong>, FIRE would be about{" "}
                      <strong>{Math.abs(moveDeltaYears)} years slower</strong>.
                    </>
                  ) : (
                    <>
                      With post-move spending of{" "}
                      <strong>{money(inputs.movedExpensesMonthly, 0)}</strong>, your FIRE timeline
                      stays about the same.
                    </>
                  )
                ) : (
                  <>
                    Compare another cost-of-living scenario to see how moving could bring your FIRE
                    date closer.
                  </>
                )}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Stat
                label="Target FIRE Number"
                value={
                  hasCoreInputs && Number.isFinite(result.fireNumber)
                    ? money(result.fireNumber, 0)
                    : "—"
                }
                helper={
                  hasCoreInputs
                    ? `Inflation-adjusted expenses ÷ ${inputs.withdrawalRatePct}%`
                    : "Enter your core inputs to calculate"
                }
              />

              <Stat
                label="Years Until FIRE"
                value={
                  hasCoreInputs
                    ? result.yearsToFI === null
                      ? "Not reached"
                      : `${result.yearsToFI} years`
                    : "—"
                }
                helper={
                  !hasCoreInputs
                    ? "Add age, income, and spending"
                    : result.yearsToFI === null
                      ? `Not hit within ${inputs.maxYears} years`
                      : `Projected FI year: ${fiYear}`
                }
              />

              <Stat
                label="Estimated FIRE Age"
                value={hasCoreInputs ? (fiAge === null ? "—" : `${fiAge}`) : "—"}
                helper={hasCoreInputs ? "Approximate" : "Calculated after inputs are entered"}
              />

              {inputs.advanced ? (
                <Stat
                  label="Target Tracking"
                  value={
                    !hasCoreInputs || result.yearsToFI === null || targetDelta === null
                      ? "—"
                      : targetDelta <= 0
                        ? `${Math.abs(targetDelta)} yrs ahead`
                        : `${targetDelta} yrs behind`
                  }
                  helper={
                    hasCoreInputs
                      ? `Target FIRE age: ${inputs.targetFireAge}`
                      : "Available with inputs"
                  }
                />
              ) : (
               <Stat
  label="Savings Rate"
  value={hasCoreInputs ? pct(savingsRate, 1) : "—"}
  helper={
    hasCoreInputs
      ? `${money(netAnnual, 0)} net income · ${estTaxRate.toFixed(1)}% est. tax rate`
      : "Based on net income and annual spending"
  }
/>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
  <div className="flex items-center justify-between">
    <div className="text-[11px] font-medium text-slate-300">Progress to FIRE</div>
    <div className="text-[11px] text-slate-400">
      {money(progress.current, 0)} /{" "}
      {Number.isFinite(progress.target) ? money(progress.target, 0) : "—"}
    </div>
  </div>

  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
    <div
      className="h-2 rounded-full bg-emerald-300 transition-all"
      style={{ width: `${Math.round(progress.pct * 100)}%` }}
    />
  </div>

  <div className="mt-2 text-sm font-medium text-slate-200">
    {Math.round(progress.pct * 100)}% of FIRE number
  </div>

  <div className="mt-1 text-[12px] leading-5 text-slate-400">
    {fiAge !== null ? (
      <>
        {money(progress.current, 0)} invested so far · On track for FIRE at{" "}
        <span className="font-semibold text-slate-200">{fiAge}</span>
      </>
    ) : (
      <>
        {money(progress.current, 0)} invested so far · This is your foundation, even if
        the target still looks far away
      </>
    )}
  </div>
</div>


            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="text-sm font-semibold text-white">What this estimate includes</div>

              <div className="mt-3 space-y-2">
                <div>• FIRE number based on annual spending and withdrawal rate</div>
                <div>• Estimated after-tax income by state and filing status</div>
                <div>
                  • Portfolio growth using savings, contributions, returns, inflation, and salary
                  growth
                </div>
                <div>
                  • Move Impact using the same assumptions with different location-based spending
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400">
                Planning estimate only. Not financial or tax advice.
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Biggest FIRE drivers</div>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-slate-400">Spending</div>
                  <div className="mt-1 font-semibold text-white">
                    {biggestDrivers.spendingImpact} impact
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-slate-400">State tax drag</div>
                  <div className="mt-1 font-semibold text-white">
                    {biggestDrivers.taxImpact} impact
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-slate-400">Current savings rate</div>
                  <div className="mt-1 font-semibold text-white">
                    {biggestDrivers.savingsImpact} impact
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <div className="text-slate-400">Move potential</div>
                  <div className="mt-1 font-semibold text-white">
                    {biggestDrivers.moveImpact} impact
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs leading-5 text-slate-400">
                These labels are directional and based on your current inputs.
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
              <div className="text-sm font-semibold text-emerald-100">
                Fastest path based on your inputs
              </div>

              <div className="mt-3 space-y-2 text-sm text-emerald-50">
                <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-300/15 bg-black/20 px-3 py-3">
                  <span className="text-emerald-100/80">
                    Lower monthly spending to{" "}
                    <strong>{money(fastestPath.lowerSpendingMonthly, 0)}</strong>
                  </span>
                  <span className="font-semibold text-emerald-200">
                    {impactLabel(fastestPath.lowerSpendingYearsSaved)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-300/15 bg-black/20 px-3 py-3">
                  <span className="text-emerald-100/80">
                    Increase annual contributions to{" "}
                    <strong>{money(fastestPath.higherContributionAnnual, 0)}</strong>
                  </span>
                  <span className="font-semibold text-emerald-200">
                    {impactLabel(fastestPath.higherContributionYearsSaved)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-300/15 bg-black/20 px-3 py-3">
                  <span className="text-emerald-100/80">
                    {fastestPath.bestMoveCity ? (
                      <>
                        Move to <strong>{fastestPath.bestMoveCity}</strong>
                      </>
                    ) : (
                      "Test a lower-cost move"
                    )}
                  </span>
                  <span className="font-semibold text-emerald-200">
                    {impactLabel(fastestPath.bestMoveYearsSaved)}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs leading-5 text-emerald-100/70">
                These examples use your current assumptions and isolate one change at a time.
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              const bestMoveRow =
                viralCityResults.find((row) => !row!.isBaseline && (row!.deltaYears ?? 0) > 0) ??
                null;

              const text = `🔥 My FIRE timeline by city

Current path: ${fiAge === null ? "Not reached" : `FIRE at ${fiAge}`}
Target FIRE number: ${money(result.fireNumber)}
Years to FIRE: ${result.yearsToFI ?? "Not reached"}

Best city tested: ${
                bestMoveRow ? `${bestMoveRow.cityName}, ${bestMoveRow.state}` : "No better move found"
              }
Time saved: ${
                bestMoveRow?.deltaYears ? `${bestMoveRow.deltaYears} years` : "—"
              }

Calculated on https://www.relocationbynumbers.com/fire-calculator`;

              try {
                await navigator.clipboard.writeText(text);
                alert("Result copied! Paste it anywhere.");
              } catch (err) {
                console.error("Clipboard failed", err);
                alert("Copy failed. Your browser may block clipboard access.");
              }
            }}
            className="relative z-50 w-full rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            Share My FIRE Result
          </button>

          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
            <div className="text-sm font-semibold text-amber-100">
              🔥 How much a move could accelerate your FIRE timeline
            </div>
            <div className="mt-1 text-xs text-amber-100/80">
              Same income and investing assumptions, with spending adjusted by each city’s cost
              profile.
            </div>

            <div className="mt-2 text-[11px] leading-5 text-amber-100/70">
              These comparisons use your selected state’s major city as the baseline and adjust
              spending by each city’s cost profile.
            </div>

            <div className="mt-4 space-y-2">
              {viralCityResults.map((row) => {
                const isBest = row!.cityId === bestMoveCityId;

                return (
                  <div
                    key={row!.cityId}
                    className={[
                      "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm",
                      isBest
                        ? "border-emerald-300/40 bg-emerald-300/10"
                        : "border-white/10 bg-black/20",
                    ].join(" ")}
                  >
                    <div className="text-slate-200">
                      {row!.cityName}, {row!.state}
                      {row!.isBaseline ? (
                        <span className="ml-2 text-[11px] text-slate-400">(current)</span>
                      ) : null}
                      {isBest ? (
                        <span className="ml-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                          Most years saved
                        </span>
                      ) : null}
                    </div>

                    <div className="text-right">
                      {row!.yearsToFI !== null && result.yearsToFI !== null && !row!.isBaseline ? (
                        <div
                          className={[
                            "font-semibold",
                            (row!.deltaYears ?? 0) > 0
                              ? "text-emerald-200"
                              : (row!.deltaYears ?? 0) < 0
                                ? "text-slate-300"
                                : "text-slate-200",
                          ].join(" ")}
                        >
                          {(row!.deltaYears ?? 0) > 0
                            ? `${row!.deltaYears} yrs earlier`
                            : (row!.deltaYears ?? 0) < 0
                              ? `${Math.abs(row!.deltaYears ?? 0)} yrs slower`
                              : "Same timeline"}
                        </div>
                      ) : null}

                      <div className="mt-0.5 text-[12px] text-slate-300">
                        {netAnnual <= 0 || annualExpenses(inputs) <= 0 || inputs.age <= 0
                          ? "Enter inputs"
                          : row!.ageAtFI === null
                            ? "Not reached"
                            : `FIRE at ${row!.ageAtFI}`}
                      </div>

                      {!row!.isBaseline ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPinnedCompareCityId((current) =>
                              current === row!.cityId ? null : row!.cityId
                            )
                          }
                          className={[
                            "mt-2 rounded-lg border px-2 py-1 text-[11px] font-medium transition",
                            pinnedCompareCityId === row!.cityId
                              ? "border-sky-300/40 bg-sky-300/10 text-sky-200"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                          ].join(" ")}
                        >
                          {pinnedCompareCityId === row!.cityId ? "Comparing" : "Compare"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

      
          {comparisonYearsSaved !== null && comparisonYearsSaved >= 5 ? (
            <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
              {comparisonYearsSaved >= 10
                ? "That’s a decade of your life back."
                : `You just brought FIRE forward by ${comparisonYearsSaved} years.`}
            </div>
          ) : null}

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300">Portfolio projection</div>
              <div className="text-xs text-slate-400">
                {projection.length > 0
                  ? `From age ${projection[0].age} → ${projection[projection.length - 1].age}`
                  : ""}
              </div>
            </div>


            <div className="mt-3 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={comparisonChartData}
                  margin={{ top: 18, right: 24, bottom: 6, left: 6 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis
                    dataKey="age"
                    tick={{ fontSize: 12, fill: "rgba(148,163,184,0.95)" }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "rgba(148,163,184,0.95)" }}
                    axisLine={false}
                    tickLine={false}
                    width={74}
                    tickFormatter={(v) => {
                      const n = Number(v);
                      if (!Number.isFinite(n)) return "";
                      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
                      if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
                      return `${Math.round(n)}`;
                    }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const label =
                        name === "currentPortfolio"
                          ? "Current path"
                          : name === "proposedPortfolio"
                            ? "Proposed move"
                            : "FIRE target";

                      return [money(Number(value), 0), label];
                    }}
                    labelFormatter={(label) => `Age ${label}`}
                    contentStyle={{
                      background: "rgba(2,6,23,0.96)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      color: "white",
                    }}
                    itemStyle={{ color: "white" }}
                    labelStyle={{ color: "rgba(226,232,240,0.9)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="currentFireTarget"
                    stroke="rgba(226,232,240,0.55)"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="currentPortfolio"
                    stroke="rgb(110 231 183)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  {proposedComparison ? (
                    <Line
                      type="monotone"
                      dataKey="proposedPortfolio"
                      stroke="rgb(56 189 248)"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  ) : null}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Current path
              </div>

              {proposedComparison ? (
                <div className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  Proposed move
                </div>
              ) : null}

              <div className="inline-flex items-center gap-2">
                <span className="h-[2px] w-4 bg-slate-300/60" />
                FIRE target
              </div>
            </div>

            <div className="mt-3 text-xs leading-5 text-slate-400">
              The green line shows your projected portfolio. The dashed line shows the FIRE target
              needed over time as spending rises with inflation.
              {crossoverPoint ? (
                <>
                  {" "}
                  Your crossover point is marked at{" "}
                  <span className="font-semibold text-slate-200">age {crossoverPoint.age}</span>.
                </>
              ) : null}
            </div>
          </div>

          {ADSENSE_SLOT_RESULTS ? (
            <AdSenseBlock
              slot={ADSENSE_SLOT_RESULTS}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            />
          ) : null}

          {ADSENSE_SLOT_BOTTOM ? (
            <AdSenseBlock
              slot={ADSENSE_SLOT_BOTTOM}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {AFFILIATES.map((a) => (
              <AffiliateCard key={a.name} a={a} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <h3 className="text-lg font-semibold text-white">Frequently asked questions</h3>

        <div className="mt-4 grid gap-3">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i;

            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  <span className="text-lg leading-none text-amber-400">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen ? (
                  <div className="border-t border-white/10 px-4 py-4 text-sm leading-7 text-slate-300">
                    {faq.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function Stat({ label, value, helper }: { label: string; value: ReactNode; helper?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>

      <div className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {value}
      </div>

      {helper ? <div className="mt-3 text-xs leading-5 text-slate-400">{helper}</div> : null}
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
  const [raw, setRaw] = useState(value === 0 ? "" : String(value));

  useEffect(() => {
    setRaw(value === 0 ? "" : String(value));
  }, [value]);

  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-medium leading-tight text-slate-300">{label}</div>
      <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 shadow-inner transition focus-within:border-emerald-400/50 focus-within:ring-4 focus-within:ring-emerald-400/10">
        {prefix ? <span className="mr-2 text-sm text-slate-400">{prefix}</span> : null}
        <input
          type="text"
          inputMode="numeric"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={() => {
            const trimmed = raw.trim();
            const n = trimmed === "" ? 0 : Number(trimmed);
            const safe = Number.isFinite(n) ? n : 0;
            onChange(safe);
            setRaw(safe === 0 ? "" : String(safe));
          }}
        />
        {suffix ? <span className="ml-2 text-sm text-slate-400">{suffix}</span> : null}
      </div>
    </label>
  );
}