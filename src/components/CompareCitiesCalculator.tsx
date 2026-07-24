"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STATES, type StateCode } from "../lib/states";
import { citiesForState, findCity } from "../lib/cities";
import type { FilingStatus } from "../lib/tax";
import { computeUsCityResult, type UsCompareResult } from "../lib/compareEngines/us";
import { computeIntlCityResult } from "../lib/compareEngines/international";
import { computeCaribCityResult } from "../lib/compareEngines/caribbean";
import { INTERNATIONAL_COUNTRIES } from "../lib/internationalCountries";
import { citiesForCountry } from "../lib/internationalCities";
import { CARIBBEAN_COUNTRIES } from "../lib/caribbeanCountries";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

// ─────────────────────────────────────────────────────────────────────────
// URL STATE HELPERS
// ─────────────────────────────────────────────────────────────────────────
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

const inputCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-fuchsia-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
const selectCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-fuchsia-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600 dark:text-slate-400";

type Mode = "rent" | "buy";
type IncomeMode = "working" | "retired";
type IntlHousingMode = "rent" | "buy";
type RegionKey = "us" | "caribbean" | "asia" | "europe" | "south-america" | "international";

type UsTargetSlot = { id: string; stateCode: StateCode; cityId: string };
type IntlTargetSlot = { id: string; countryCode: string; cityCode: string };
type CaribTargetSlot = { id: string; countryCode: string };

// Normalized row shape used for rendering/export regardless of which
// engine (US / international / Caribbean) produced the underlying result.
type CompareRow = {
  key: string;
  name: string;
  netMonthly: number;
  effTaxPct: number;
  housingMonthly: number;
  pctOfIncome: number;
  monthlyFlexibility: number;
};

const REGIONS: { key: RegionKey; label: string }[] = [
  { key: "us", label: "United States" },
  { key: "caribbean", label: "Caribbean" },
  { key: "asia", label: "Asia" },
  { key: "europe", label: "Europe" },
  { key: "south-america", label: "South America" },
  { key: "international", label: "International" },
];

function countriesForRegion(region: RegionKey) {
  if (region === "asia") return INTERNATIONAL_COUNTRIES.filter((c) => c.region === "Asia-Pacific");
  if (region === "europe") return INTERNATIONAL_COUNTRIES.filter((c) => c.region === "Europe");
  if (region === "south-america") return INTERNATIONAL_COUNTRIES.filter((c) => c.region === "Latin America");
  if (region === "international") return INTERNATIONAL_COUNTRIES;
  return [];
}

let slotCounter = 0;
function newSlotId() {
  slotCounter += 1;
  return `slot-${slotCounter}`;
}

function CityPicker({
  label,
  stateCode,
  cityId,
  onChange,
}: {
  label: string;
  stateCode: StateCode;
  cityId: string;
  onChange: (stateCode: StateCode, cityId: string) => void;
}) {
  const cities = useMemo(() => citiesForState(stateCode), [stateCode]);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        <div className={labelHeadCls}>{label} state</div>
        <select
          className={selectCls}
          value={stateCode}
          onChange={(e) => {
            const nextState = e.target.value as StateCode;
            const nextCities = citiesForState(nextState);
            onChange(nextState, nextCities[0]?.id ?? "");
          }}
        >
          {STATES.map((s) => (
            <option key={s.code} value={s.code}>{s.name} ({s.code.toUpperCase()})</option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <div className={labelHeadCls}>{label} city</div>
        <select className={selectCls} value={cityId} onChange={(e) => onChange(stateCode, e.target.value)}>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function IntlCityPicker({
  label,
  countries,
  countryCode,
  cityCode,
  onChange,
}: {
  label: string;
  countries: { code: string; name: string }[];
  countryCode: string;
  cityCode: string;
  onChange: (countryCode: string, cityCode: string) => void;
}) {
  const cities = useMemo(
    () => [...citiesForCountry(countryCode)].sort((a, b) => a.name.localeCompare(b.name)),
    [countryCode]
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        <div className={labelHeadCls}>{label} country</div>
        <select
          className={selectCls}
          value={countryCode}
          onChange={(e) => {
            const nextCountry = e.target.value;
            const nextCities = citiesForCountry(nextCountry);
            onChange(nextCountry, nextCities[0]?.code ?? "");
          }}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <div className={labelHeadCls}>{label} city</div>
        <select className={selectCls} value={cityCode} onChange={(e) => onChange(countryCode, e.target.value)}>
          {cities.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function CaribCountryPicker({
  label,
  countryCode,
  onChange,
}: {
  label: string;
  countryCode: string;
  onChange: (countryCode: string) => void;
}) {
  const sorted = useMemo(() => [...CARIBBEAN_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)), []);
  return (
    <label className="block text-sm">
      <div className={labelHeadCls}>{label} country/territory</div>
      <select className={selectCls} value={countryCode} onChange={(e) => onChange(e.target.value)}>
        {sorted.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </select>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────
export default function CompareCitiesCalculator() {
  const hasMounted = useRef(false);

  const [region, setRegion] = useState<RegionKey>("us");

  const [originState, setOriginState] = useState<StateCode>("ny");
  const [originCityId, setOriginCityId] = useState<string>(citiesForState("ny")[0]?.id ?? "");

  const [grossAnnual, setGrossAnnual] = useState<string>("120000");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [k401Pct, setK401Pct] = useState<string>("10");
  const [mode, setMode] = useState<Mode>("rent");
  const [incomeMode, setIncomeMode] = useState<IncomeMode>("working");
  const [intlHousingMode, setIntlHousingMode] = useState<IntlHousingMode>("rent");

  const [downPct, setDownPct] = useState<string>("20");
  const [ratePct, setRatePct] = useState<string>("6.5");
  const [termYears, setTermYears] = useState<string>("30");
  const [propertyTaxPct, setPropertyTaxPct] = useState<string>("1.0");
  const [homeInsMonthly, setHomeInsMonthly] = useState<string>("150");
  const [hoaMonthly, setHoaMonthly] = useState<string>("0");
  const [pmiAnnualPct, setPmiAnnualPct] = useState<string>("0.6");

  const [rentersInsMonthly, setRentersInsMonthly] = useState<string>("20");
  const [parkingMonthly, setParkingMonthly] = useState<string>("100");

  const [intlDownPct, setIntlDownPct] = useState<string>("20");
  const [intlRatePct, setIntlRatePct] = useState<string>("7");
  const [intlTermYears, setIntlTermYears] = useState<string>("30");

  const [targets, setTargets] = useState<UsTargetSlot[]>(() => [
    { id: newSlotId(), stateCode: "tx" as StateCode, cityId: citiesForState("tx" as StateCode)[0]?.id ?? "" },
    { id: newSlotId(), stateCode: "nc" as StateCode, cityId: citiesForState("nc" as StateCode)[0]?.id ?? "" },
  ]);

  const [intlTargets, setIntlTargets] = useState<IntlTargetSlot[]>(() => {
    const list = countriesForRegion("asia").slice().sort((a, b) => a.name.localeCompare(b.name));
    const mk = (c: (typeof list)[number] | undefined): IntlTargetSlot | null => {
      if (!c) return null;
      const cities = citiesForCountry(c.code);
      return { id: newSlotId(), countryCode: c.code, cityCode: cities[0]?.code ?? "" };
    };
    return [mk(list[0]), mk(list[1])].filter((t): t is IntlTargetSlot => !!t);
  });

  const [caribTargets, setCaribTargets] = useState<CaribTargetSlot[]>(() => {
    const preferred = ["DO", "JM"];
    return preferred
      .filter((code) => CARIBBEAN_COUNTRIES.some((c) => c.code === code))
      .map((code) => ({ id: newSlotId(), countryCode: code }));
  });

  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const nz = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  // ── QS HYDRATION ─────────────────────────────────────────────────────
  useEffect(() => {
    const qs = getQS();

    const vFromState = qs.get("from") as StateCode | null;
    const vFromCity = qs.get("fromCity");
    if (vFromState && STATES.some((s) => s.code === vFromState)) {
      setOriginState(vFromState);
      if (vFromCity && findCity(vFromCity)) setOriginCityId(vFromCity);
    }

    const vGross = qs.get("income"); if (vGross) setGrossAnnual(vGross);
    const vFiling = qs.get("filing") as FilingStatus | null;
    if (vFiling === "single" || vFiling === "married") setFiling(vFiling);
    const vK401 = qs.get("k401"); if (vK401) setK401Pct(vK401);
    const vMode = qs.get("mode");
    if (vMode === "rent" || vMode === "buy") setMode(vMode);

    const vRegion = qs.get("region") as RegionKey | null;
    if (vRegion && REGIONS.some((r) => r.key === vRegion)) setRegion(vRegion);
    const vIncomeMode = qs.get("incomeMode");
    if (vIncomeMode === "working" || vIncomeMode === "retired") setIncomeMode(vIncomeMode);
    const vIntlHousingMode = qs.get("intlHousingMode");
    if (vIntlHousingMode === "rent" || vIntlHousingMode === "buy") setIntlHousingMode(vIntlHousingMode);
    const vIntlDown = qs.get("intlDown"); if (vIntlDown) setIntlDownPct(vIntlDown);
    const vIntlRate = qs.get("intlRate"); if (vIntlRate) setIntlRatePct(vIntlRate);
    const vIntlTerm = qs.get("intlTerm"); if (vIntlTerm) setIntlTermYears(vIntlTerm);

    const vDown = qs.get("down"); if (vDown) setDownPct(vDown);
    const vRate = qs.get("rate"); if (vRate) setRatePct(vRate);
    const vTerm = qs.get("term"); if (vTerm) setTermYears(vTerm);
    const vTax = qs.get("tax"); if (vTax) setPropertyTaxPct(vTax);
    const vIns = qs.get("homeIns"); if (vIns) setHomeInsMonthly(vIns);
    const vHoa = qs.get("hoa"); if (vHoa) setHoaMonthly(vHoa);
    const vPmi = qs.get("pmi"); if (vPmi) setPmiAnnualPct(vPmi);

    const vRentersIns = qs.get("rentersIns"); if (vRentersIns) setRentersInsMonthly(vRentersIns);
    const vParking = qs.get("parking"); if (vParking) setParkingMonthly(vParking);

    const vTargets = qs.get("targets");
    if (vTargets) {
      const parsed = vTargets.split(",")
        .map((pair) => {
          const [stateCode, cityId] = pair.split(":");
          if (!stateCode || !cityId || !findCity(cityId)) return null;
          return { id: newSlotId(), stateCode: stateCode as StateCode, cityId };
        })
        .filter((t): t is UsTargetSlot => !!t)
        .slice(0, 3);
      if (parsed.length > 0) setTargets(parsed);
    }

    const vIntlTargets = qs.get("intlTargets");
    if (vIntlTargets) {
      const parsed = vIntlTargets.split(",")
        .map((pair) => {
          const [countryCode, cityCode] = pair.split(":");
          if (!countryCode) return null;
          return { id: newSlotId(), countryCode, cityCode: cityCode ?? "" };
        })
        .filter((t): t is IntlTargetSlot => !!t)
        .slice(0, 3);
      if (parsed.length > 0) setIntlTargets(parsed);
    }

    const vCaribTargets = qs.get("caribTargets");
    if (vCaribTargets) {
      const parsed = vCaribTargets.split(",")
        .filter(Boolean)
        .map((countryCode) => ({ id: newSlotId(), countryCode }))
        .slice(0, 3);
      if (parsed.length > 0) setCaribTargets(parsed);
    }
  }, []);

  // ── QS SYNC ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    qs.set("region", region);
    qs.set("from", originState);
    if (originCityId) qs.set("fromCity", originCityId);
    if (grossAnnual) qs.set("income", grossAnnual);
    qs.set("filing", filing);
    if (k401Pct) qs.set("k401", k401Pct);

    if (region === "us") {
      qs.set("mode", mode);
      if (mode === "buy") {
        if (downPct) qs.set("down", downPct);
        if (ratePct) qs.set("rate", ratePct);
        if (termYears) qs.set("term", termYears);
        if (propertyTaxPct) qs.set("tax", propertyTaxPct);
        if (homeInsMonthly) qs.set("homeIns", homeInsMonthly);
        if (hoaMonthly) qs.set("hoa", hoaMonthly);
        if (pmiAnnualPct) qs.set("pmi", pmiAnnualPct);
      } else {
        if (rentersInsMonthly) qs.set("rentersIns", rentersInsMonthly);
        if (parkingMonthly) qs.set("parking", parkingMonthly);
      }
      if (targets.length > 0) {
        qs.set("targets", targets.map((t) => `${t.stateCode}:${t.cityId}`).join(","));
      }
    } else {
      qs.set("incomeMode", incomeMode);
      qs.set("intlHousingMode", intlHousingMode);
      if (intlHousingMode === "buy") {
        if (intlDownPct) qs.set("intlDown", intlDownPct);
        if (intlRatePct) qs.set("intlRate", intlRatePct);
        if (intlTermYears) qs.set("intlTerm", intlTermYears);
      }
      if (region === "caribbean") {
        if (caribTargets.length > 0) {
          qs.set("caribTargets", caribTargets.map((t) => t.countryCode).join(","));
        }
      } else if (intlTargets.length > 0) {
        qs.set("intlTargets", intlTargets.map((t) => `${t.countryCode}:${t.cityCode}`).join(","));
      }
    }
    setQS(qs);
  }, [
    region, originState, originCityId, grossAnnual, filing, k401Pct, mode, incomeMode,
    downPct, ratePct, termYears, propertyTaxPct, homeInsMonthly, hoaMonthly, pmiAnnualPct,
    rentersInsMonthly, parkingMonthly, targets, intlTargets, caribTargets,
    intlHousingMode, intlDownPct, intlRatePct, intlTermYears,
  ]);

  // Reset any intl targets that don't belong to the newly selected region's
  // country list (e.g. Thailand selected, then user switches from Asia to Europe).
  useEffect(() => {
    if (region === "us" || region === "caribbean") return;
    const list = countriesForRegion(region);
    if (list.length === 0) return;
    setIntlTargets((prev) =>
      prev.map((t) => {
        if (list.some((c) => c.code === t.countryCode)) return t;
        const fallback = list[0];
        const cities = citiesForCountry(fallback.code);
        return { ...t, countryCode: fallback.code, cityCode: cities[0]?.code ?? "" };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  function addTarget() {
    if (targets.length >= 3) return;
    setTargets((prev) => [...prev, { id: newSlotId(), stateCode: "fl" as StateCode, cityId: citiesForState("fl" as StateCode)[0]?.id ?? "" }]);
  }
  function removeTarget(id: string) {
    setTargets((prev) => prev.filter((t) => t.id !== id));
  }
  function updateTarget(id: string, stateCode: StateCode, cityId: string) {
    setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, stateCode, cityId } : t)));
  }

  function addIntlTarget() {
    if (intlTargets.length >= 3) return;
    const list = countriesForRegion(region);
    const used = new Set(intlTargets.map((t) => t.countryCode));
    const next = list.find((c) => !used.has(c.code)) ?? list[0];
    if (!next) return;
    const cities = citiesForCountry(next.code);
    setIntlTargets((prev) => [...prev, { id: newSlotId(), countryCode: next.code, cityCode: cities[0]?.code ?? "" }]);
  }
  function removeIntlTarget(id: string) {
    setIntlTargets((prev) => prev.filter((t) => t.id !== id));
  }
  function updateIntlTarget(id: string, countryCode: string, cityCode: string) {
    setIntlTargets((prev) => prev.map((t) => (t.id === id ? { ...t, countryCode, cityCode } : t)));
  }

  function addCaribTarget() {
    if (caribTargets.length >= 3) return;
    const used = new Set(caribTargets.map((t) => t.countryCode));
    const next = CARIBBEAN_COUNTRIES.find((c) => !used.has(c.code)) ?? CARIBBEAN_COUNTRIES[0];
    if (!next) return;
    setCaribTargets((prev) => [...prev, { id: newSlotId(), countryCode: next.code }]);
  }
  function removeCaribTarget(id: string) {
    setCaribTargets((prev) => prev.filter((t) => t.id !== id));
  }
  function updateCaribTarget(id: string, countryCode: string) {
    setCaribTargets((prev) => prev.map((t) => (t.id === id ? { ...t, countryCode } : t)));
  }

  const grossN = nz(grossAnnual);
  const salaryReady = grossN > 0;

  const originResult = useMemo<UsCompareResult | null>(() => {
    const city = findCity(originCityId);
    if (!city) return null;
    return computeUsCityResult({
      city,
      grossAnnual: grossN,
      filing,
      k401Pct: nz(k401Pct),
      mode,
      buy: { downPct: nz(downPct), ratePct: nz(ratePct), termYears: nz(termYears), propertyTaxPct: nz(propertyTaxPct), homeInsMonthly: nz(homeInsMonthly), hoaMonthly: nz(hoaMonthly), pmiAnnualPct: nz(pmiAnnualPct) },
      rent: { rentersInsMonthly: nz(rentersInsMonthly), parkingMonthly: nz(parkingMonthly) },
    });
  }, [originCityId, grossN, filing, k401Pct, mode, downPct, ratePct, termYears, propertyTaxPct, homeInsMonthly, hoaMonthly, pmiAnnualPct, rentersInsMonthly, parkingMonthly]);

  const targetResults = useMemo<UsCompareResult[]>(() => {
    return targets
      .map((t) => findCity(t.cityId))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((city) =>
        computeUsCityResult({
          city,
          grossAnnual: grossN,
          filing,
          k401Pct: nz(k401Pct),
          mode,
          buy: { downPct: nz(downPct), ratePct: nz(ratePct), termYears: nz(termYears), propertyTaxPct: nz(propertyTaxPct), homeInsMonthly: nz(homeInsMonthly), hoaMonthly: nz(hoaMonthly), pmiAnnualPct: nz(pmiAnnualPct) },
          rent: { rentersInsMonthly: nz(rentersInsMonthly), parkingMonthly: nz(parkingMonthly) },
        })
      );
  }, [targets, grossN, filing, k401Pct, mode, downPct, ratePct, termYears, propertyTaxPct, homeInsMonthly, hoaMonthly, pmiAnnualPct, rentersInsMonthly, parkingMonthly]);

  const intlBuyAssumptions = useMemo(
    () => ({ downPct: nz(intlDownPct), ratePct: nz(intlRatePct), termYears: nz(intlTermYears) }),
    [intlDownPct, intlRatePct, intlTermYears]
  );

  const intlResults = useMemo(() => {
    if (region === "us" || region === "caribbean") return [];
    return intlTargets.map((t) =>
      computeIntlCityResult({
        countryCode: t.countryCode,
        cityCode: t.cityCode || undefined,
        grossAnnualUsd: grossN,
        filing,
        mode: incomeMode,
        housingMode: intlHousingMode,
        buy: intlBuyAssumptions,
      })
    );
  }, [region, intlTargets, grossN, filing, incomeMode, intlHousingMode, intlBuyAssumptions]);

  const caribResults = useMemo(() => {
    if (region !== "caribbean") return [];
    return caribTargets.map((t) =>
      computeCaribCityResult({
        countryCode: t.countryCode,
        grossAnnualUsd: grossN,
        filing,
        mode: incomeMode,
        housingMode: intlHousingMode,
        buy: intlBuyAssumptions,
      })
    );
  }, [region, caribTargets, grossN, filing, incomeMode, intlHousingMode, intlBuyAssumptions]);

  const activeResults = useMemo<CompareRow[]>(() => {
    if (region === "us") {
      return targetResults.map((r) => ({
        key: r.cityId, name: r.cityName, netMonthly: r.netMonthly, effTaxPct: r.effTaxPct,
        housingMonthly: r.housingMonthly, pctOfIncome: r.pctOfIncome, monthlyFlexibility: r.monthlyFlexibility,
      }));
    }
    if (region === "caribbean") {
      return caribResults.map((r) => ({
        key: r.countryCode, name: `${r.cityName}, ${r.countryName}`, netMonthly: r.netMonthly, effTaxPct: r.effTaxPct,
        housingMonthly: r.housingMonthly, pctOfIncome: r.pctOfIncome, monthlyFlexibility: r.monthlyFlexibility,
      }));
    }
    return intlResults.map((r) => ({
      key: r.cityCode, name: `${r.cityName}, ${r.countryName}`, netMonthly: r.netMonthly, effTaxPct: r.effTaxPct,
      housingMonthly: r.housingMonthly, pctOfIncome: r.pctOfIncome, monthlyFlexibility: r.monthlyFlexibility,
    }));
  }, [region, targetResults, caribResults, intlResults]);

  const bestFlexibilityKey = useMemo(() => {
    if (activeResults.length === 0) return null;
    return activeResults.reduce((best, r) => (r.monthlyFlexibility > best.monthlyFlexibility ? r : best), activeResults[0]).key;
  }, [activeResults]);

  const isUs = region === "us";
  const housingRowLabel = isUs
    ? (mode === "buy" ? "Est. monthly payment + extras" : "Est. rent + extras")
    : (intlHousingMode === "buy" ? "Est. monthly costs (buying)" : "Est. monthly living costs (renting)");
  const pctRowLabel = isUs ? "Housing as % of net income" : "Living costs as % of net income";

  // ── EXPORT ROWS (shared by CSV + PDF) ───────────────────────────────────
  const exportRows = useMemo<CsvRow[]>(() => {
    if (!salaryReady || activeResults.length === 0) return [];
    const rows: CsvRow[] = [
      { Metric: "Gross annual salary", Value: money(grossN) },
      { Metric: "Filing status", Value: filing === "married" ? "Married (joint)" : "Single" },
      { Metric: "Housing mode", Value: isUs ? (mode === "buy" ? "Buying" : "Renting") : (intlHousingMode === "buy" ? "Buying" : "Renting") },
    ];
    if (!isUs) {
      rows.push({ Metric: "Income mode", Value: incomeMode === "retired" ? "Retired" : "Working" });
    }
    if (originResult) {
      rows.push(
        { Metric: "Current city", Value: originResult.cityName },
        { Metric: "Current net monthly", Value: money(originResult.netMonthly) },
      );
    }
    for (const r of activeResults) {
      rows.push(
        { Metric: `${r.name}, net monthly`, Value: money(r.netMonthly) },
        { Metric: `${r.name}, effective tax rate`, Value: `${r.effTaxPct.toFixed(1)}%` },
        { Metric: `${r.name}, ${housingRowLabel.toLowerCase()}`, Value: money(r.housingMonthly) },
        { Metric: `${r.name}, ${pctRowLabel.toLowerCase()}`, Value: `${r.pctOfIncome.toFixed(1)}%` },
        { Metric: `${r.name}, monthly flexibility`, Value: money(r.monthlyFlexibility) },
      );
    }
    return rows;
  }, [salaryReady, activeResults, grossN, filing, mode, incomeMode, intlHousingMode, isUs, housingRowLabel, pctRowLabel, originResult]);

  const handleExportCsv = () => {
    downloadCsv("compare-cities", exportRows);
  };

  const handleExportPdf = () => {
    const names = activeResults.map((r) => r.name).join(" vs ");
    downloadPdfReport({
      filename: "compare-cities",
      title: `Compare Cities: ${names || "—"}`,
      subtitle: `Gross annual income: ${money(grossN)}`,
      rows: exportRows as PdfRow[],
      footerNote: "Rent, housing, and living costs use each destination's typical values as a starting point. Planning estimates only, not financial or tax advice. relocationbynumbers.com",
    });
  };

  const getCurrentScenario = () => {
    const names = activeResults.map((r) => r.name).join(" vs ");
    const bestResult = activeResults.find((r) => r.key === bestFlexibilityKey);
    return {
      label: names ? `Compare: ${names}` : "City comparison",
      url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
      subtitle: bestResult ? `Best: ${bestResult.name} · ${money(bestResult.monthlyFlexibility, 0)}/mo flexibility` : undefined,
      source: "Compare",
    };
  };

  return (
    <div className="text-slate-900 dark:text-slate-100">
      {/* Region selector */}
      <div className="flex flex-wrap items-center gap-2">
        {REGIONS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRegion(r.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              region === r.key
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ================================================================
            LEFT, INPUTS
        ================================================================ */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">You, today</div>
            <CityPicker
              label="Current"
              stateCode={originState}
              cityId={originCityId}
              onChange={(s, c) => { setOriginState(s); setOriginCityId(c); }}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>Gross annual salary</div>
                <input className={inputCls} type="number" value={grossAnnual} onChange={(e) => setGrossAnnual(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Filing status</div>
                <select className={selectCls} value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}>
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>401(k) contribution (%)</div>
                <input className={inputCls} type="number" value={k401Pct} onChange={(e) => setK401Pct(e.target.value)} placeholder=" " />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{isUs ? "Housing mode" : "Income & housing"}</div>
              {isUs && (
                <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button type="button" onClick={() => setMode("rent")} className={`rounded-lg px-3 py-1 text-sm ${mode === "rent" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Rent</button>
                  <button type="button" onClick={() => setMode("buy")} className={`rounded-lg px-3 py-1 text-sm ${mode === "buy" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Buy</button>
                </div>
              )}
            </div>

            {!isUs && (
              <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Income</span>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    <button type="button" onClick={() => setIncomeMode("working")} className={`rounded-lg px-3 py-1 text-sm ${incomeMode === "working" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Working</button>
                    <button type="button" onClick={() => setIncomeMode("retired")} className={`rounded-lg px-3 py-1 text-sm ${incomeMode === "retired" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Retired</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Housing</span>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                    <button type="button" onClick={() => setIntlHousingMode("rent")} className={`rounded-lg px-3 py-1 text-sm ${intlHousingMode === "rent" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Rent</button>
                    <button type="button" onClick={() => setIntlHousingMode("buy")} className={`rounded-lg px-3 py-1 text-sm ${intlHousingMode === "buy" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Buy</button>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUs
                ? "Rent and home price default to each city's typical values, no need to look them up yourself. Adjust the shared assumptions below if you want."
                : intlHousingMode === "buy"
                ? "No destination here has a verified home-price dataset, so Buy mode estimates a home price from each destination's typical rent (16x annual rent, a standard rule of thumb) and runs it through the mortgage math below. Treat this as a rough planning figure, not a real listing price."
                : "Housing and living costs default to each destination's typical values. Tax assumes remote/foreign-sourced income where applicable, for a country-specific breakdown with follow-up questions, use the matching regional calculator."}
            </p>

            {isUs && (mode === "rent" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <div className={labelHeadCls}>Renters insurance ($/mo)</div>
                  <input className={inputCls} type="number" value={rentersInsMonthly} onChange={(e) => setRentersInsMonthly(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className={labelHeadCls}>Parking ($/mo)</div>
                  <input className={inputCls} type="number" value={parkingMonthly} onChange={(e) => setParkingMonthly(e.target.value)} placeholder=" " />
                </label>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <div className={labelHeadCls}>Down payment (%)</div>
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
                  <input className={inputCls} type="number" value={homeInsMonthly} onChange={(e) => setHomeInsMonthly(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className={labelHeadCls}>HOA ($/mo)</div>
                  <input className={inputCls} type="number" value={hoaMonthly} onChange={(e) => setHoaMonthly(e.target.value)} placeholder=" " />
                </label>
              </div>
            ))}

            {!isUs && intlHousingMode === "buy" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="text-sm">
                  <div className={labelHeadCls}>Down payment (%)</div>
                  <input className={inputCls} type="number" value={intlDownPct} onChange={(e) => setIntlDownPct(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className={labelHeadCls}>Interest rate (%)</div>
                  <input className={inputCls} type="number" step="0.1" value={intlRatePct} onChange={(e) => setIntlRatePct(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className={labelHeadCls}>Loan term (years)</div>
                  <select className={selectCls} value={intlTermYears} onChange={(e) => setIntlTermYears(e.target.value)}>
                    <option value="15">15 years</option>
                    <option value="20">20 years</option>
                    <option value="30">30 years</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Compare up to 3 {isUs ? "cities" : "destinations"}
              </div>
              {((isUs && targets.length < 3) || (region === "caribbean" && caribTargets.length < 3) || (!isUs && region !== "caribbean" && intlTargets.length < 3)) && (
                <button
                  type="button"
                  onClick={() => (isUs ? addTarget() : region === "caribbean" ? addCaribTarget() : addIntlTarget())}
                  className="rounded-lg bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-950/30 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/50"
                >
                  + Add {isUs ? "city" : "destination"}
                </button>
              )}
            </div>
            <div className="space-y-4">
              {isUs && targets.map((t, i) => (
                <div key={t.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Target {i + 1}</div>
                    {targets.length > 1 && (
                      <button type="button" onClick={() => removeTarget(t.id)} aria-label="Remove city" className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400">✕ Remove</button>
                    )}
                  </div>
                  <CityPicker
                    label="Target"
                    stateCode={t.stateCode}
                    cityId={t.cityId}
                    onChange={(s, c) => updateTarget(t.id, s, c)}
                  />
                </div>
              ))}

              {region === "caribbean" && caribTargets.map((t, i) => (
                <div key={t.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Target {i + 1}</div>
                    {caribTargets.length > 1 && (
                      <button type="button" onClick={() => removeCaribTarget(t.id)} aria-label="Remove destination" className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400">✕ Remove</button>
                    )}
                  </div>
                  <CaribCountryPicker
                    label="Target"
                    countryCode={t.countryCode}
                    onChange={(c) => updateCaribTarget(t.id, c)}
                  />
                </div>
              ))}

              {!isUs && region !== "caribbean" && intlTargets.map((t, i) => (
                <div key={t.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Target {i + 1}</div>
                    {intlTargets.length > 1 && (
                      <button type="button" onClick={() => removeIntlTarget(t.id)} aria-label="Remove destination" className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400">✕ Remove</button>
                    )}
                  </div>
                  <IntlCityPicker
                    label="Target"
                    countries={countriesForRegion(region).slice().sort((a, b) => a.name.localeCompare(b.name))}
                    countryCode={t.countryCode}
                    cityCode={t.cityCode}
                    onChange={(cc, city) => updateIntlTarget(t.id, cc, city)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================
            RIGHT, RESULTS
        ================================================================ */}
        <div className="space-y-3">
          {!salaryReady ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Enter your gross annual salary to compare cities.
            </div>
          ) : activeResults.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Add at least one destination to compare.
            </div>
          ) : (
            <>
              {originResult && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Currently in {originResult.cityName}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-slate-700 dark:text-slate-300">
                    <span>Net {money(originResult.netMonthly)}/mo</span>
                    <span>Housing {money(originResult.housingMonthly)}/mo</span>
                    <span>Flexibility {money(originResult.monthlyFlexibility)}/mo</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3 text-left font-semibold text-slate-500 dark:text-slate-400">Metric</th>
                      {activeResults.map((r) => (
                        <th key={r.key} className="p-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {r.name}
                          {r.key === bestFlexibilityKey && (
                            <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">BEST</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-3 text-slate-500 dark:text-slate-400">Net monthly income</td>
                      {activeResults.map((r) => <td key={r.key} className="p-3 text-right font-semibold text-slate-900 dark:text-slate-100">{money(r.netMonthly)}</td>)}
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-500 dark:text-slate-400">Effective tax rate</td>
                      {activeResults.map((r) => <td key={r.key} className="p-3 text-right text-slate-700 dark:text-slate-300">{r.effTaxPct.toFixed(1)}%</td>)}
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{housingRowLabel}</td>
                      {activeResults.map((r) => <td key={r.key} className="p-3 text-right text-slate-700 dark:text-slate-300">{money(r.housingMonthly)}</td>)}
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-500 dark:text-slate-400">{pctRowLabel}</td>
                      {activeResults.map((r) => <td key={r.key} className="p-3 text-right text-slate-700 dark:text-slate-300">{r.pctOfIncome.toFixed(1)}%</td>)}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">Monthly flexibility</td>
                      {activeResults.map((r) => (
                        <td key={r.key} className={`p-3 text-right font-bold ${r.monthlyFlexibility >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {money(r.monthlyFlexibility)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                {isUs
                  ? "Rent and home price use each city's typical values as a starting point, for an exact scenario with your own numbers, use the full relocation calculator for a single destination."
                  : "Housing and living costs use each destination's typical values, and tax uses a simplified estimate, for an exact scenario with a country-specific tax breakdown, use the matching full regional calculator."}{" "}
                Planning estimates only, not financial or tax advice.
              </div>
            </>
          )}
        </div>
      </div>

      {salaryReady && activeResults.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-fuchsia-900/60 dark:bg-fuchsia-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-700 dark:text-fuchsia-400">Share this comparison</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current inputs and send them to a partner, friend, or future self.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const shareUrl = new URL(window.location.href);
                      const names = activeResults.map((r) => r.name).join(" vs ");
                      const shareText = `My city comparison: ${names}.`;
                      const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                      if (canNativeShare) {
                        await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({
                          title: "My City Comparison", text: shareText, url: shareUrl.toString(),
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
                  className="inline-flex items-center justify-center rounded-xl border border-fuchsia-300 bg-white px-4 py-2.5 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50 dark:border-fuchsia-800 dark:bg-slate-900 dark:text-fuchsia-300 dark:hover:bg-slate-950">
                  Export CSV
                </button>
                <button type="button" onClick={handleExportPdf}
                  className="inline-flex items-center justify-center rounded-xl border border-fuchsia-300 bg-white px-4 py-2.5 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50 dark:border-fuchsia-800 dark:bg-slate-900 dark:text-fuchsia-300 dark:hover:bg-slate-950">
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
