"use client";

import { useEffect, useMemo, useState } from "react";

import { STATES, type StateCode } from "../lib/states";
import { citiesForState, findCity } from "../lib/cities";
import { estimateNetAnnual, type FilingStatus } from "../lib/tax";
import { monthlyHousingCost } from "../lib/housing";
import { comfortScore } from "../lib/comfort";
import AdSlot from "./AdSlot";
import AffiliateCard from "./AffiliateCard";
import Link from "next/dist/client/link";


type Mode = "buy" | "rent";


function money(n: number, digits: number = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Simple PMI model for MVP: annual PMI % of loan amount when down < 20%
function estimatePMIMonthly(loanAmount: number, downPct: number, pmiAnnualPct: number) {
  if (!Number.isFinite(loanAmount) || loanAmount <= 0) return 0;
  if (!Number.isFinite(downPct) || downPct >= 20) return 0;
  const rate = clamp(Number.isFinite(pmiAnnualPct) ? pmiAnnualPct : 0, 0, 2.0) / 100; // 0%–2% annual
  return (loanAmount * rate) / 12;
}

type COL = {
  housing: number;
  groceries: number;
  utilities: number;
  transport: number;
  healthcare: number;
};

function hasCOL(x: any): x is { col: COL } {
  return (
    !!x &&
    typeof x === "object" &&
    !!x.col &&
    typeof x.col.housing === "number" &&
    typeof x.col.groceries === "number" &&
    typeof x.col.utilities === "number" &&
    typeof x.col.transport === "number" &&
    typeof x.col.healthcare === "number"
  );
}

function colIndex(col: COL) {
  const w = {
    housing: 0.35,
    groceries: 0.15,
    utilities: 0.1,
    transport: 0.15,
    healthcare: 0.1,
  };
  const other = 0.15;
  return (
    col.housing * w.housing +
    col.groceries * w.groceries +
    col.utilities * w.utilities +
    col.transport * w.transport +
    col.healthcare * w.healthcare +
    1.0 * other
  );
}

// ---- URL helpers (Shareable defaults) ----
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

type CalculatorProps = {
  monetization?: "home" | "state" | "compare";

  // ✅ for compare SEO pages
  initialFromState?: StateCode;
  initialToState?: StateCode;
  initialFromCityId?: string;
  initialToCityId?: string;
};

export default function Calculator({
  monetization,
  initialFromState,
  initialToState,
  initialFromCityId,
  initialToCityId,
}: CalculatorProps) {


  // ===========
  // Inputs (blank by default except filing + states)
  // ===========
  const [mode, setMode] = useState<Mode>("rent");

  const [salary, setSalary] = useState<string>("");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [k401Pct, setK401Pct] = useState<string>("");

 const [fromState, setFromState] = useState<StateCode>(initialFromState ?? "ny");
const [toState, setToState] = useState<StateCode>(initialToState ?? "nc");

const [fromCityId, setFromCityId] = useState<string>(initialFromCityId ?? "nyc-ny");
const [toCityId, setToCityId] = useState<string>(initialToCityId ?? "raleigh-nc");

  const [fromCityOther, setFromCityOther] = useState("");
  const [toCityOther, setToCityOther] = useState("");

  // Buy inputs (blank)
  const [homePrice, setHomePrice] = useState<string>("");
  const [downPct, setDownPct] = useState<string>("");
  const [ratePct, setRatePct] = useState<string>("");
  const [termYears, setTermYears] = useState<string>("");
  const [propertyTaxPct, setPropertyTaxPct] = useState<string>("");
  const [homeInsMonthly, setHomeInsMonthly] = useState<string>("");
  const [hoaMonthly, setHoaMonthly] = useState<string>("");
  const [pmiAnnualPct, setPmiAnnualPct] = useState<string>("");

  // Rent inputs (blank)
  const [rentMonthly, setRentMonthly] = useState<string>("");
  const [rentersInsMonthly, setRentersInsMonthly] = useState<string>("");

  // ===========
  // City dropdowns
  // ===========
 const fromCities = useMemo(() => citiesForState(fromState), [fromState]);
const toCities = useMemo(() => citiesForState(toState), [toState]);
  // ✅ Safety: if current selected city isn't in the dropdown options, pick a valid default
useEffect(() => {
  if (!fromCities.length) return;

  const exists = fromCities.some((c: any) => c.id === fromCityId);
  if (!exists) {
    // Prefer first non-"other-" city if available
    const firstReal = fromCities.find((c: any) => !String(c.id).startsWith("other-"));
    setFromCityId(firstReal?.id ?? fromCities[0].id);
  }
}, [fromCities, fromCityId]);

useEffect(() => {
  if (!toCities.length) return;

  const exists = toCities.some((c: any) => c.id === toCityId);
  if (!exists) {
    const firstReal = toCities.find((c: any) => !String(c.id).startsWith("other-"));
    setToCityId(firstReal?.id ?? toCities[0].id);
  }
}, [toCities, toCityId]);

  const fromCity = useMemo(() => (fromCityId ? findCity(fromCityId) : null), [fromCityId]);
  const toCity = useMemo(() => (toCityId ? findCity(toCityId) : null), [toCityId]);

  const isFromOther = fromCityId.startsWith("other-");
  const isToOther = toCityId.startsWith("other-");

  // ===========
  // Helpers for parsing optional numeric strings
  // ===========
  const n = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : NaN;
  };
  const nz = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  // ===========
  // Shareable defaults (read once on mount)
  // ===========
  useEffect(() => {
    const qs = getQS();

    const vMode = qs.get("mode");
    if (vMode === "buy" || vMode === "rent") setMode(vMode);

    const vFrom = qs.get("from") as StateCode | null;
    const vTo = qs.get("to") as StateCode | null;
    if (vFrom && STATES.some((s) => s.code === vFrom)) setFromState(vFrom);
    if (vTo && STATES.some((s) => s.code === vTo)) setToState(vTo);

    const vFiling = qs.get("filing") as FilingStatus | null;
    if (vFiling === "single" || vFiling === "married") setFiling(vFiling);

    const vSalary = qs.get("salary");
    if (typeof vSalary === "string") setSalary(vSalary);

    const v401 = qs.get("k401");
    if (typeof v401 === "string") setK401Pct(v401);

    const vFromCity = qs.get("fromCity");
if (typeof vFromCity === "string" && findCity(vFromCity)) {
  setFromCityId(vFromCity);
}

const vToCity = qs.get("toCity");
if (typeof vToCity === "string" && findCity(vToCity)) {
  setToCityId(vToCity);
}

    const vFromOther = qs.get("fromOther");
    if (typeof vFromOther === "string") setFromCityOther(vFromOther);

    const vToOther = qs.get("toOther");
    if (typeof vToOther === "string") setToCityOther(vToOther);

    // Buy
    const hp = qs.get("homePrice");
    if (typeof hp === "string") setHomePrice(hp);

    const dp = qs.get("downPct");
    if (typeof dp === "string") setDownPct(dp);

    const rp = qs.get("ratePct");
    if (typeof rp === "string") setRatePct(rp);

    const ty = qs.get("termYears");
    if (typeof ty === "string") setTermYears(ty);

    const pt = qs.get("propertyTaxPct");
    if (typeof pt === "string") setPropertyTaxPct(pt);

    const hi = qs.get("homeInsMonthly");
    if (typeof hi === "string") setHomeInsMonthly(hi);

    const hoa = qs.get("hoaMonthly");
    if (typeof hoa === "string") setHoaMonthly(hoa);

    const pmi = qs.get("pmiAnnualPct");
    if (typeof pmi === "string") setPmiAnnualPct(pmi);

    // Rent
    const rm = qs.get("rentMonthly");
    if (typeof rm === "string") setRentMonthly(rm);

    const ri = qs.get("rentersInsMonthly");
    if (typeof ri === "string") setRentersInsMonthly(ri);
  }, []);

  // ===========
  // Shareable defaults (write as user changes)
  // ===========
  useEffect(() => {
    const qs = new URLSearchParams();

    qs.set("from", fromState);
    qs.set("to", toState);
    qs.set("filing", filing);
    qs.set("mode", mode);

    if (salary !== "") qs.set("salary", salary);
    if (k401Pct !== "") qs.set("k401", k401Pct);

    if (fromCityId !== "") qs.set("fromCity", fromCityId);
    if (toCityId !== "") qs.set("toCity", toCityId);

    if (fromCityOther !== "") qs.set("fromOther", fromCityOther);
    if (toCityOther !== "") qs.set("toOther", toCityOther);

    // Buy
    if (homePrice !== "") qs.set("homePrice", homePrice);
    if (downPct !== "") qs.set("downPct", downPct);
    if (ratePct !== "") qs.set("ratePct", ratePct);
    if (termYears !== "") qs.set("termYears", termYears);
    if (propertyTaxPct !== "") qs.set("propertyTaxPct", propertyTaxPct);
    if (homeInsMonthly !== "") qs.set("homeInsMonthly", homeInsMonthly);
    if (hoaMonthly !== "") qs.set("hoaMonthly", hoaMonthly);
    if (pmiAnnualPct !== "") qs.set("pmiAnnualPct", pmiAnnualPct);

    // Rent
    if (rentMonthly !== "") qs.set("rentMonthly", rentMonthly);
    if (rentersInsMonthly !== "") qs.set("rentersInsMonthly", rentersInsMonthly);

    setQS(qs);
  }, [
    mode,
    fromState,
    toState,
    filing,
    salary,
    k401Pct,
    fromCityId,
    toCityId,
    fromCityOther,
    toCityOther,
    homePrice,
    downPct,
    ratePct,
    termYears,
    propertyTaxPct,
    homeInsMonthly,
    hoaMonthly,
    pmiAnnualPct,
    rentMonthly,
    rentersInsMonthly,
  ]);

  // ===========
  // Comparable salary
  // ===========
  const comparable = useMemo(() => {
    if (!fromCity || !toCity) return null;
    if (isFromOther || isToOther) return null;

    const salaryN = n(salary);
    if (!Number.isFinite(salaryN) || salaryN <= 0) return null;

    if (hasCOL(fromCity) && hasCOL(toCity)) {
      const fromIdx = colIndex(fromCity.col);
      const toIdx = colIndex(toCity.col);
      if (!Number.isFinite(fromIdx) || !Number.isFinite(toIdx) || fromIdx <= 0) return null;

      const ratio = toIdx / fromIdx;
      const comparableSalary = Math.round((salaryN * ratio) / 100) * 100;
      const pctLessMore = (1 - ratio) * 100;

      return {
        comparableSalary,
        pctLessMore,
        fromCityName: fromCity.name,
        toCityName: toCity.name,
        method: "col" as const,
      };
    }

    if (typeof (fromCity as any).defaultRent !== "number") return null;
    if (typeof (toCity as any).defaultRent !== "number") return null;

    const rentFrom = Math.max(500, (fromCity as any).defaultRent);
    const rentTo = Math.max(500, (toCity as any).defaultRent);

    const ratio = 0.55 * (rentTo / rentFrom) + 0.45;
    const comparableSalary = Math.round((salaryN * ratio) / 100) * 100;
    const pctLessMore = (1 - ratio) * 100;

    return {
      comparableSalary,
      pctLessMore,
      fromCityName: fromCity.name,
      toCityName: toCity.name,
      method: "rent" as const,
    };
  }, [fromCity, toCity, salary, isFromOther, isToOther]);

  // ===========
  // Results
  // ===========
  const results = useMemo(() => {
    const salaryN = n(salary);
    const k401N = nz(k401Pct);

    const salaryReady = Number.isFinite(salaryN) && salaryN > 0;

    const netFromMonthly = salaryReady
      ? estimateNetAnnual({
          grossAnnual: salaryN,
          state: fromState,
          filing,
          k401Pct: k401N,
          cityId: fromCityId,
        }) / 12
      : 0;

    const netToMonthly = salaryReady
      ? estimateNetAnnual({
          grossAnnual: salaryN,
          state: toState,
          filing,
          k401Pct: k401N,
          cityId: toCityId,
        }) / 12
      : 0;

    const monthlyIncomeDiff = salaryReady ? netToMonthly - netFromMonthly : 0;
    const grossMonthly = salaryReady ? salaryN / 12 : 0;

    const estTaxesFromMonthly = salaryReady ? Math.max(0, grossMonthly - netFromMonthly) : 0;
    const estTaxesToMonthly = salaryReady ? Math.max(0, grossMonthly - netToMonthly) : 0;

    const effTaxFromPct = salaryReady
      ? clamp((1 - (netFromMonthly * 12) / salaryN) * 100, 0, 99.9)
      : 0;

    const effTaxToPct = salaryReady
      ? clamp((1 - (netToMonthly * 12) / salaryN) * 100, 0, 99.9)
      : 0;

    // BUY
    let buy = {
      principalInterest: 0,
      propertyTax: 0,
      homeInsurance: 0,
      hoa: 0,
      totalMonthly: 0,
      loanAmount: 0,
    };
    let pmiMonthly = 0;
    let buyTotal = 0;

    const buyReady =
      homePrice !== "" &&
      downPct !== "" &&
      ratePct !== "" &&
      termYears !== "" &&
      propertyTaxPct !== "";

    if (mode === "buy" && buyReady) {
      buy = monthlyHousingCost({
        homePrice: n(homePrice),
        downPct: n(downPct),
        ratePct: n(ratePct),
        termYears: n(termYears),
        propertyTaxPct: n(propertyTaxPct),
        homeInsMonthly: nz(homeInsMonthly),
        hoaMonthly: nz(hoaMonthly),
      });

      pmiMonthly = estimatePMIMonthly(buy.loanAmount, n(downPct), nz(pmiAnnualPct));
      buyTotal = buy.totalMonthly + pmiMonthly;
    }

    // RENT
    const rentTotal = mode === "rent" ? nz(rentMonthly) + nz(rentersInsMonthly) : 0;

    // % of net (target)
    const activeHousing = mode === "buy" ? buyTotal : rentTotal;
    const pct = netToMonthly > 0 ? (activeHousing / netToMonthly) * 100 : Infinity;
    const comfort = comfortScore(pct);

    return {
      salaryReady,
      buyReady,
      netFromMonthly,
      netToMonthly,
      grossMonthly,
      estTaxesFromMonthly,
      estTaxesToMonthly,
      effTaxFromPct,
      effTaxToPct,
      monthlyIncomeDiff,
      buy,
      pmiMonthly,
      buyTotal,
      rentTotal,
      pct,
      comfort,
    };
  }, [
    mode,
    salary,
    filing,
    k401Pct,
    fromState,
    toState,
    fromCityId, // ✅ added
    toCityId, // ✅ added
    homePrice,
    downPct,
    ratePct,
    termYears,
    propertyTaxPct,
    homeInsMonthly,
    hoaMonthly,
    pmiAnnualPct,
    rentMonthly,
    rentersInsMonthly,
  ]);

  const currentCityLabel = isFromOther ? fromCityOther || "—" : findCity(fromCityId)?.name || "—";
  const targetCityLabel = isToOther ? toCityOther || "—" : findCity(toCityId)?.name || "—";

  const monthlyFlexibility = useMemo(() => {
    const activeHousing = mode === "buy" ? results.buyTotal : results.rentTotal;
    return results.netToMonthly - activeHousing;
  }, [mode, results.netToMonthly, results.buyTotal, results.rentTotal]);

  // ===========
  // Validation / empty-state messaging
  // ===========
  const needsSalary = salary === "" || !results.salaryReady;

  const needsHousing =
    mode === "rent"
      ? rentMonthly === "" && rentersInsMonthly === ""
      : !results.buyReady && homePrice === "";

  const showEnterNumbersHint = needsSalary || needsHousing;

  // ===========
  // Reset button (keep current state, target state, filing status)
  // ===========
  function resetInputsKeepContext() {
    setSalary("");
    setK401Pct("");

    setFromCityId("");
    setToCityId("");
    setFromCityOther("");
    setToCityOther("");

    setHomePrice("");
    setDownPct("");
    setRatePct("");
    setTermYears("");
    setPropertyTaxPct("");
    setHomeInsMonthly("");
    setHoaMonthly("");
    setPmiAnnualPct("");

    setRentMonthly("");
    setRentersInsMonthly("");
  }

  const isStatePage = monetization === "state";
  const isPremiumState = isStatePage && ["tx", "fl", "ca", "nc"].includes(toState);
  const stateName = STATES.find((s) => s.code === toState)?.name;

  return (
<div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold">Scenario</div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 p-1">
            <button
              type="button"
              onClick={() => setMode("buy")}
              className={`rounded-lg px-3 py-1 text-sm ${
                mode === "buy" ? "bg-slate-900 text-white" : "text-slate-700"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setMode("rent")}
              className={`rounded-lg px-3 py-1 text-sm ${
                mode === "rent" ? "bg-slate-900 text-white" : "text-slate-700"
              }`}
            >
              Rent
            </button>
          </div>

          <button
            type="button"
            onClick={resetInputsKeepContext}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            title="Clear all fields (keeps states + filing + scenario)"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* INPUTS */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 text-sm font-semibold">Income & Location</div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className="mb-1 pl-1 text-xs text-slate-600 dark:text-slate-300">Annual salary</div>
                <input
                  className="w-full rounded-xl border border-slate-300 p-2"
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 pl-1 text-xs text-slate-600 dark:text-slate-300">Filing status</div>
                <select
                  className="w-full rounded-xl border border-slate-300 p-2"
                  value={filing}
                  onChange={(e) => setFiling(e.target.value as FilingStatus)}
                >
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
                </select>
              </label>

              <label className="text-sm">
                <div className="mb-1 pl-1 text-xs text-slate-600 dark:text-slate-300">401(k) % (est.)</div>
                <input
                  className="w-full rounded-xl border border-slate-300 p-2"
                  type="number"
                  value={k401Pct}
                  onChange={(e) => setK401Pct(e.target.value)}
                  placeholder=" "
                />
              </label>
{/* ✅ Income impact (matches input styling) */}
<div className="text-sm">
  <div className="mb-1 pl-1 text-xs text-slate-600 dark:text-slate-300">Income impact</div>

  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
    {results.salaryReady ? (
      <>
        <span
          className={`font-semibold ${
            results.monthlyIncomeDiff > 0
              ? "text-emerald-600"
              : results.monthlyIncomeDiff < 0
              ? "text-rose-600"
              : "text-slate-900"
          }`}
        >
          {results.monthlyIncomeDiff > 0 ? "+" : ""}
          {money(results.monthlyIncomeDiff, 0)}
        </span>

        <span className="text-xs text-slate-500 whitespace-nowrap">
          {results.monthlyIncomeDiff > 0
            ? "Higher"
            : results.monthlyIncomeDiff < 0
            ? "Lower"
            : "Same"}
        </span>
      </>
    ) : (
      <span className="text-slate-400">—</span>
    )}
  </div>
</div>

              {/* ORDER REQUESTED: current state, target state, current city, target city */}
              <label className="text-sm">
                <div className="mb-1 pl-1 text-xs text-slate-600">Current state</div>
                <select
                  className="w-full rounded-xl border border-slate-300 p-2"
                  value={fromState}
                  onChange={(e) => {
                    const state = e.target.value as StateCode;
                    setFromState(state);
                    setFromCityId("");
                    setFromCityOther("");
                  }}
                >
                  {STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code.toUpperCase()})
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <div className="mb-1 pl-1 text-xs text-slate-600">Target state</div>
                <select
                  className="w-full rounded-xl border border-slate-300 p-2"
                  value={toState}
                  onChange={(e) => {
                    const state = e.target.value as StateCode;
                    setToState(state);
                    setToCityId("");
                    setToCityOther("");
                  }}
                >
                  {STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code.toUpperCase()})
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <div className="mb-1 pl-1 text-xs text-slate-600">Current city (optional)</div>
                <select
                  className="w-full rounded-xl border border-slate-300 p-2"
                  value={fromCityId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFromCityId(id);

                    if (!id.startsWith("other-")) setFromCityOther("");

                    const city = findCity(id);
                    if (!city) return;

                    if ((city as any).state && (city as any).state !== fromState) {
                      setFromState((city as any).state);
                    }
                  }}
                >
                  <option value="">— Select city —</option>
                  {fromCities.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.tier ? ` — ${c.tier}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <div className="mb-1 pl-1 text-xs text-slate-600">Target city (optional)</div>
                <select
                  className="w-full rounded-xl border border-slate-300 p-2"
                  value={toCityId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setToCityId(id);

                    if (!id.startsWith("other-")) setToCityOther("");

                    const city = findCity(id);
                    if (!city) return;

                    if ((city as any).state && (city as any).state !== toState) {
                      setToState((city as any).state);
                    }
                  }}
                >
                  <option value="">— Select city —</option>
                  {toCities.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.tier ? ` — ${c.tier}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              {isFromOther && (
                <label className="text-sm sm:col-span-2">
                  <div className="mb-1 text-xs text-slate-600">Enter current city</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    value={fromCityOther}
                    onChange={(e) => setFromCityOther(e.target.value)}
                    placeholder="Type your city"
                  />
                </label>
              )}

              {isToOther && (
                <label className="text-sm sm:col-span-2">
                  <div className="mb-1 text-xs text-slate-600">Enter target city</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    value={toCityOther}
                    onChange={(e) => setToCityOther(e.target.value)}
                    placeholder="Type your city"
                  />
                </label>
              )}
            </div>
          </div>

          {mode === "buy" && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold">Buy Inputs</div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <div className="mb-1 pl-1 text-xs text-slate-600">Home price</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    type="number"
                    value={homePrice}
                    onChange={(e) => setHomePrice(e.target.value)}
                    placeholder=" "
                  />
                </label>

                <label className="block text-sm">
                  <div className="mb-1 pl-1 text-xs text-slate-600">Down payment %</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    type="number"
                    value={downPct}
                    onChange={(e) => setDownPct(e.target.value)}
                    placeholder=" "
                  />
                </label>

                <label className="text-sm">
                  <div className="mb-1 pl-1 text-xs text-slate-600">Interest rate %</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    type="number"
                    step="0.01"
                    value={ratePct}
                    onChange={(e) => setRatePct(e.target.value)}
                    placeholder=" "
                  />
                </label>

                <label className="text-sm">
                  <div className="mb-1 pl-1 text-xs text-slate-600">Term (years)</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    type="number"
                    value={termYears}
                    onChange={(e) => setTermYears(e.target.value)}
                    placeholder=" "
                  />
                </label>

                <label className="text-sm">
                  <div className="mb-1 pl-1 text-xs text-slate-600">Property tax % (annual)</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    type="number"
                    step="0.01"
                    value={propertyTaxPct}
                    onChange={(e) => setPropertyTaxPct(e.target.value)}
                    placeholder=" "
                  />
                </label>

                <label className="text-sm">
                  <div className="mb-1 pl-1 text-xs text-slate-600"
                  >Home insurance (monthly)</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    type="number"
                    value={homeInsMonthly}
                    onChange={(e) => setHomeInsMonthly(e.target.value)}
                    placeholder=" "
                  />
                </label>

                <label className="text-sm">
                  <div className="mb-1 pl-1 text-xs text-slate-600">HOA (monthly)</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    type="number"
                    value={hoaMonthly}
                    onChange={(e) => setHoaMonthly(e.target.value)}
                    placeholder=" "
                  />
                </label>

                <label className="text-sm">
                  <div className="mb-1 pl-1 text-xs text-slate-600">PMI % (annual, if down &lt; 20%)</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    type="number"
                    step="0.01"
                    value={pmiAnnualPct}
                    onChange={(e) => setPmiAnnualPct(e.target.value)}
                    placeholder=" "
                  />
                </label>
              </div>
            </div>
          )}

          {mode === "rent" && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 text-sm font-semibold">Rent Inputs</div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm sm:col-span-2">
                  <div className="mb-1 pl-1 text-xs text-slate-600">Monthly rent</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    type="number"
                    value={rentMonthly}
                    onChange={(e) => setRentMonthly(e.target.value)}
                    placeholder=" "
                  />
                </label>

                <label className="text-sm">
                  <div className="mb-1 pl-1 text-xs text-slate-600">Renter’s insurance (monthly)</div>
                  <input
                    className="w-full rounded-xl border border-slate-300 p-2"
                    type="number"
                    value={rentersInsMonthly}
                    onChange={(e) => setRentersInsMonthly(e.target.value)}
                    placeholder=" "
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* RESULTS */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-2 text-sm font-semibold">Results</div>

            <div className="mb-2 space-y-1 text-sm text-slate-600">
              <div>
                Current city: <span className="font-semibold">{currentCityLabel}</span>
              </div>
              <div>
                Target city: <span className="font-semibold">{targetCityLabel}</span>
              </div>
            </div>

            {showEnterNumbersHint && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-700">
                Enter your <span className="font-semibold">salary</span> and{" "}
                <span className="font-semibold">{mode === "buy" ? "buy inputs" : "rent inputs"}</span>{" "}
                to calculate results.
              </div>
            )}

            <div className="grid gap-2 text-sm">
              <div>
                Net monthly (current): <span className="font-semibold">{money(results.netFromMonthly)}</span>
              </div>
              <div>
                Net monthly (target): <span className="font-semibold">{money(results.netToMonthly)}</span>
              </div>

              {/* Tax Transparency */}
              {results.salaryReady && (
                <>
                  <div className="mt-2">
                    Gross monthly: <span className="font-semibold">{money(results.grossMonthly, 2)}</span>
                  </div>

                  <div>
                    Est. taxes (current):{" "}
                    <span className="font-semibold">{money(results.estTaxesFromMonthly, 2)}</span>{" "}
                    <span className="text-xs text-slate-500">({results.effTaxFromPct.toFixed(1)}%)</span>
                  </div>

                  <div>
                    Est. taxes (target):{" "}
                    <span className="font-semibold">{money(results.estTaxesToMonthly, 2)}</span>{" "}
                    <span className="text-xs text-slate-500">({results.effTaxToPct.toFixed(1)}%)</span>
                  </div>
                </>
              )}

              {mode === "buy" ? (
                <>
                  <div className="mt-2 font-semibold">Monthly housing (buy)</div>
                  <div className="grid gap-1 text-sm">
                    <div>
                      Principal + Interest:{" "}
                      <span className="font-semibold">{money(results.buy.principalInterest, 2)}</span>
                    </div>
                    <div>
                      Property tax: <span className="font-semibold">{money(results.buy.propertyTax, 2)}</span>
                    </div>
                    <div>
                      Home insurance: <span className="font-semibold">{money(results.buy.homeInsurance, 2)}</span>
                    </div>
                    <div>
                      HOA: <span className="font-semibold">{money(results.buy.hoa, 2)}</span>
                    </div>
                    <div>
                      PMI: <span className="font-semibold">{money(results.pmiMonthly, 2)}</span>
                    </div>
                    <div className="pt-2">
                      Total: <span className="font-bold">{money(results.buyTotal, 2)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-2 font-semibold">Monthly housing (rent)</div>
                  <div>
                    Total (rent + renter’s ins): <span className="font-bold">{money(results.rentTotal, 2)}</span>
                  </div>
                </>
              )}

              <div className="mt-2">
                Housing % of net (target):{" "}
                <span className="font-semibold">
                  {Number.isFinite(results.pct) ? results.pct.toFixed(1) + "%" : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Flexibility */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs font-semibold tracking-widest text-amber-700">MONTHLY FLEXIBILITY</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
              {results.netToMonthly > 0 ? money(monthlyFlexibility, 2) : "—"}
            </div>
            <div className="mt-1 text-sm text-slate-700">Left after housing expenses.</div>
          </div>

          {comparable && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-semibold tracking-widest text-slate-500">COMPARABLE SALARY</div>
              <div className="mt-2 text-3xl font-bold">{money(comparable.comparableSalary)}</div>
              <p className="mt-2 text-sm text-slate-600">
                {comparable.toCityName} is roughly{" "}
                <span className="font-semibold">{Math.abs(comparable.pctLessMore).toFixed(0)}%</span>{" "}
                {comparable.pctLessMore >= 0 ? "less" : "more"} expensive than {comparable.fromCityName}.
              </p>
              <div className="mt-1 text-xs text-slate-500">
                Based on housing, transportation, and essential cost weighting.
              </div>

              <button
                type="button"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                onClick={() =>
                  window.open(
                    "https://www.nerdwallet.com/mortgages/mortgage-rates",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                See current mortgage rates →
              </button>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 p-3">
            <div className="text-xs text-slate-600">Comfort Score™</div>
            <div className="text-lg font-bold">
              {results.comfort.band} {results.comfort.label}
            </div>
            <div className="mt-1 text-xs text-slate-600">{results.comfort.note}</div>
          </div>

          {isStatePage && (
            <>
              {isPremiumState && <AffiliateCard stateCode={toState} stateName={stateName} />}
              <AdSlot />
            </>
          )}

          
          {fromCityId && toCityId && (
  <div className="pt-4">
    <Link
      href={`/compare/${fromCityId}/${toCityId}?from=${fromState}&to=${toState}&mode=${mode}&filing=${filing}&fromCity=${fromCityId}&toCity=${toCityId}`}
      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
    >
      Compare {fromCityId} vs {toCityId}
    </Link>
  </div>
)}
          <div className="text-xs text-slate-500">
            Tip: Your URL updates as you type — copy the page link to share this scenario.
          </div>
        </div>
      </div>
    </div>
  );
}
