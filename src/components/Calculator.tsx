"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STATES, type StateCode } from "../lib/states";
import { citiesForState, findCity } from "../lib/cities";
import { isAllowedCompareRoute } from "../lib/compare";
import {
  estimateNetAnnual,
  estimateNetBreakdown,
  TAX_YEAR,
  type FilingStatus,
  type TaxBreakdown,
} from "../lib/tax";
import { monthlyHousingCost } from "../lib/housing";
import { downloadCsv, type CsvRow } from "../lib/csvExport";
import { downloadPdfReport, type PdfRow } from "../lib/pdfExport";
import SavedScenariosPanel from "./SavedScenariosPanel";

type Mode = "rent" | "buy";

// ─── Verdict ───────────────────────────────────────────────────────────────
type VerdictLevel = "Comfortable" | "Manageable" | "Tight" | "Risky";

interface Verdict {
  level: VerdictLevel;
  barColor: string;
  barWidth: string;
  description: string;
  netWorthNote?: string;
}

function getVerdict(
  housingPct: number,
  trueLeftover: number,
  netToMonthly: number,
  netWorthN: number = 0,
  homePriceN: number = 0,
): Verdict {
  if (!netToMonthly || !Number.isFinite(housingPct)) {
    return {
      level: "Risky",
      barColor: "bg-rose-400",
      barWidth: "w-[20%]",
      description: "Add your salary and housing numbers to see a full assessment.",
    };
  }

  const leftoverPct = netToMonthly > 0 ? trueLeftover / netToMonthly : -1;

  let baseLevel: VerdictLevel;
  if (housingPct <= 28 && leftoverPct >= 0.3 && trueLeftover >= 1500) {
    baseLevel = "Comfortable";
  } else if (housingPct <= 36 && leftoverPct >= 0.15 && trueLeftover >= 800) {
    baseLevel = "Manageable";
  } else if (housingPct <= 45 && leftoverPct >= 0.0 && trueLeftover >= 0) {
    baseLevel = "Tight";
  } else {
    baseLevel = "Risky";
  }

  const LEVELS: VerdictLevel[] = ["Risky", "Tight", "Manageable", "Comfortable"];
  let level = baseLevel;
  let netWorthNote = "";

  if (netWorthN > 0 && homePriceN > 0) {
    const nwRatio = netWorthN / homePriceN;
    const currentIdx = LEVELS.indexOf(baseLevel);
    // Adjusted — more realistic thresholds
  if (nwRatio >= 2.5 && baseLevel !== "Comfortable") {
    level = LEVELS[Math.min(currentIdx + 2, 3)];
    netWorthNote = "Your strong net worth significantly cushions this move.";
  } else if (nwRatio >= 1.5 && baseLevel !== "Comfortable") {
    level = LEVELS[Math.min(currentIdx + 1, 3)];
    netWorthNote = "Your net worth provides meaningful financial cushion.";
  } else if (nwRatio >= 0.75 && baseLevel === "Tight") {
      level = "Manageable";
      netWorthNote = "Your net worth adds a buffer to a tight monthly cash flow.";
    }
  }

  const BASE_DESCRIPTIONS: Record<VerdictLevel, string> = {
    Comfortable: "This move looks financially healthy based on your inputs.",
    Manageable:  "Workable budget — but watch discretionary spending.",
    Tight:       "You'll feel the financial pressure month to month.",
    Risky:       "High likelihood of financial stress — revisit housing cost or salary.",
  };

  const STYLES: Record<VerdictLevel, Pick<Verdict, "barColor" | "barWidth">> = {
    Comfortable: { barColor: "bg-emerald-500", barWidth: "w-[90%]" },
    Manageable:  { barColor: "bg-yellow-400",  barWidth: "w-[68%]" },
    Tight:       { barColor: "bg-orange-400",  barWidth: "w-[44%]" },
    Risky:       { barColor: "bg-rose-500",    barWidth: "w-[22%]" },
  };

  return {
    level,
    ...STYLES[level],
    description: BASE_DESCRIPTIONS[level],
    netWorthNote,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────
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

function estimatePMIMonthly(
  loanAmount: number,
  downPct: number,
  pmiAnnualPct: number
) {
  if (!Number.isFinite(loanAmount) || loanAmount <= 0) return 0;
  if (!Number.isFinite(downPct) || downPct >= 20) return 0;
  const rate = clamp(Number.isFinite(pmiAnnualPct) ? pmiAnnualPct : 0, 0, 2.0) / 100;
  return (loanAmount * rate) / 12;
}

function findNeededSalary(
  targetAnnualNet: number,
  state: StateCode,
  filing: FilingStatus,
  k401Pct: number,
  cityId: string
): number {
  if (!Number.isFinite(targetAnnualNet) || targetAnnualNet <= 0) return 0;
  let lo = targetAnnualNet * 0.8;
  let hi = targetAnnualNet * 3.5;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const net = estimateNetAnnual({ grossAnnual: mid, state, filing, k401Pct, cityId });
    if (net < targetAnnualNet) lo = mid;
    else hi = mid;
  }
  return Math.round((lo + hi) / 2 / 100) * 100;
}

// ─── COL types & utilities ──────────────────────────────────────────────────
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
  return (
    col.housing * w.housing +
    col.groceries * w.groceries +
    col.utilities * w.utilities +
    col.transport * w.transport +
    col.healthcare * w.healthcare +
    1.0 * 0.15
  );
}

// ─── URL helpers ─────────────────────────────────────────────────────────────
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

// ─── Props ───────────────────────────────────────────────────────────────────
type CalculatorProps = {
  monetization?: "home" | "state" | "compare";
  initialFromState?: StateCode;
  initialToState?: StateCode;
  initialFromCityId?: string;
  initialToCityId?: string;
};

// ─── Sub-component: Estimated Living Costs ──────────────────────────────────
function EstimatedLivingCosts({
  hasCOLData,
  estGroceries,
  estUtilities,
  estTransport,
  colGroceries, setColGroceries,
  colUtilities, setColUtilities,
  colTransport, setColTransport,
  colDining,    setColDining,
  colMisc,      setColMisc,
}: {
  hasCOLData: boolean;
  estGroceries: number | null;
  estUtilities: number | null;
  estTransport: number | null;
  colGroceries: string; setColGroceries: (v: string) => void;
  colUtilities: string; setColUtilities: (v: string) => void;
  colTransport: string; setColTransport: (v: string) => void;
  colDining:    string; setColDining:    (v: string) => void;
  colMisc:      string; setColMisc:      (v: string) => void;
}) {
  const fields: Array<{
    label: string;
    value: string;
    setter: (v: string) => void;
    est: number | null;
    defaultEst: number;
  }> = [
    { label: "Groceries",            value: colGroceries, setter: setColGroceries, est: estGroceries, defaultEst: 500 },
    { label: "Utilities",            value: colUtilities, setter: setColUtilities, est: estUtilities, defaultEst: 200 },
    { label: "Transportation",       value: colTransport, setter: setColTransport, est: estTransport, defaultEst: 300 },
    { label: "Dining out",           value: colDining,    setter: setColDining,    est: null,         defaultEst: 300 },
    { label: "Subscriptions & misc", value: colMisc,      setter: setColMisc,      est: null,         defaultEst: 200 },
  ];

  return (
    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Estimated Living Costs (Target City)</div>
        {hasCOLData && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800">
            · City-level estimate
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ label, value, setter, est, defaultEst }) => {
          const placeholder = est != null ? `~${Math.round(est)} est.` : `e.g. ${defaultEst}`;
          const showEstBadge = value === "" && est != null;
          return (
            <label key={label} className="text-sm">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                {label}
                {showEstBadge && (
                  <span className="rounded bg-amber-50 px-1 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800">
                    est.
                  </span>
                )}
              </div>
              <input
                className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800 dark:placeholder:text-slate-500"
                type="number"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
              />
            </label>
          );
        })}
      </div>

      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {hasCOLData
          ? "City estimates pre-filled where available. Edit any field to override."
          : "Enter your expected monthly costs in the target city."}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Calculator({
  monetization,
  initialFromState,
  initialToState,
  initialFromCityId,
  initialToCityId,
}: CalculatorProps) {
  // ── Core state ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("rent");
  const hasMounted = useRef(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const [salary, setSalary] = useState<string>("150000");
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [k401Pct, setK401Pct] = useState<string>("10");

  const [fromState, setFromState] = useState<StateCode>(initialFromState ?? "ny");
  const [toState, setToState] = useState<StateCode>(initialToState ?? "nc");

  const [fromCityId, setFromCityId] = useState<string>(initialFromCityId ?? "nyc-ny");
  const [toCityId, setToCityId] = useState<string>(initialToCityId ?? "raleigh-nc");

  const [fromCityOther, setFromCityOther] = useState("");
  const [toCityOther, setToCityOther] = useState("");

  const [currentHousingMonthly, setCurrentHousingMonthly] = useState<string>("");

  // ── Buy inputs ──────────────────────────────────────────────────────────
  const [homePrice, setHomePrice] = useState<string>("450000");
  const [downPct, setDownPct] = useState<string>("20");
  const [ratePct, setRatePct] = useState<string>("6.5");
  const [termYears, setTermYears] = useState<string>("30");
  const [propertyTaxPct, setPropertyTaxPct] = useState<string>("1.0");
  const [homeInsMonthly, setHomeInsMonthly] = useState<string>("150");
  const [hoaMonthly, setHoaMonthly] = useState<string>("0");
  const [pmiAnnualPct, setPmiAnnualPct] = useState<string>("0");

  // ── Rent inputs ─────────────────────────────────────────────────────────
  const [rentMonthly, setRentMonthly] = useState<string>("2200");
  const [rentersInsMonthly, setRentersInsMonthly] = useState<string>("20");
  const [parkingMonthly, setParkingMonthly] = useState<string>("150");

  // ── Net worth & COL overrides ────────────────────────────────────────────
  const [netWorth, setNetWorth] = useState<string>("");
  const [colGroceries, setColGroceries] = useState<string>("");
  const [colUtilities, setColUtilities] = useState<string>("");
  const [colTransport, setColTransport] = useState<string>("");
  const [colDining,    setColDining]    = useState<string>("");
  const [colMisc,      setColMisc]      = useState<string>("");

  // ── City dropdowns ───────────────────────────────────────────────────────
  const fromCities = useMemo(() => citiesForState(fromState), [fromState]);
  const toCities = useMemo(() => citiesForState(toState), [toState]);

  useEffect(() => {
    if (!fromCities.length) return;
    const exists = fromCities.some((c: any) => c.id === fromCityId);
    if (!exists) {
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

  const compareRouteAllowed = useMemo(
    () => isAllowedCompareRoute(fromCityId, toCityId),
    [fromCityId, toCityId]
  );

  const isFromOther = fromCityId.startsWith("other-");
  const isToOther = toCityId.startsWith("other-");

  const hasCOLData = useMemo(
    () => !!(fromCity && toCity && hasCOL(fromCity) && hasCOL(toCity) && !isFromOther && !isToOther),
    [fromCity, toCity, isFromOther, isToOther]
  );

  // ── Numeric helpers ──────────────────────────────────────────────────────
  const n = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : NaN; };
  const nz = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

  // ── Read QS on mount ─────────────────────────────────────────────────────
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
    if (typeof vFromCity === "string" && findCity(vFromCity)) setFromCityId(vFromCity);

    const vToCity = qs.get("toCity");
    if (typeof vToCity === "string" && findCity(vToCity)) setToCityId(vToCity);

    const vFromOther = qs.get("fromOther");
    if (typeof vFromOther === "string") setFromCityOther(vFromOther);

    const vToOther = qs.get("toOther");
    if (typeof vToOther === "string") setToCityOther(vToOther);

    const vCurHousing = qs.get("currentHousing");
    if (typeof vCurHousing === "string") setCurrentHousingMonthly(vCurHousing);

    // Buy
    const hp = qs.get("homePrice"); if (typeof hp === "string") setHomePrice(hp);
    const dp = qs.get("downPct");   if (typeof dp === "string") setDownPct(dp);
    const rp = qs.get("ratePct");   if (typeof rp === "string") setRatePct(rp);
    const ty = qs.get("termYears"); if (typeof ty === "string") setTermYears(ty);
    const pt = qs.get("propertyTaxPct"); if (typeof pt === "string") setPropertyTaxPct(pt);
    const hi = qs.get("homeInsMonthly"); if (typeof hi === "string") setHomeInsMonthly(hi);
    const hoa = qs.get("hoaMonthly");   if (typeof hoa === "string") setHoaMonthly(hoa);
    const pmi = qs.get("pmiAnnualPct"); if (typeof pmi === "string") setPmiAnnualPct(pmi);

    // Rent
    const rm = qs.get("rentMonthly");       if (typeof rm === "string") setRentMonthly(rm);
    const ri = qs.get("rentersInsMonthly"); if (typeof ri === "string") setRentersInsMonthly(ri);
    const park = qs.get("parkingMonthly");  if (typeof park === "string") setParkingMonthly(park);

    // Net worth & COL
    const vNetWorth = qs.get("netWorth");         if (typeof vNetWorth === "string") setNetWorth(vNetWorth);
    const vColGroceries = qs.get("colGroceries"); if (typeof vColGroceries === "string") setColGroceries(vColGroceries);
    const vColUtilities = qs.get("colUtilities"); if (typeof vColUtilities === "string") setColUtilities(vColUtilities);
    const vColTransport = qs.get("colTransport"); if (typeof vColTransport === "string") setColTransport(vColTransport);
    const vColDining = qs.get("colDining");       if (typeof vColDining === "string") setColDining(vColDining);
    const vColMisc = qs.get("colMisc");           if (typeof vColMisc === "string") setColMisc(vColMisc);
  }, []);

  // ── Write QS on change ───────────────────────────────────────────────────
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }

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
    if (currentHousingMonthly !== "") qs.set("currentHousing", currentHousingMonthly);

    if (homePrice !== "") qs.set("homePrice", homePrice);
    if (downPct !== "") qs.set("downPct", downPct);
    if (ratePct !== "") qs.set("ratePct", ratePct);
    if (termYears !== "") qs.set("termYears", termYears);
    if (propertyTaxPct !== "") qs.set("propertyTaxPct", propertyTaxPct);
    if (homeInsMonthly !== "") qs.set("homeInsMonthly", homeInsMonthly);
    if (hoaMonthly !== "") qs.set("hoaMonthly", hoaMonthly);
    if (pmiAnnualPct !== "") qs.set("pmiAnnualPct", pmiAnnualPct);

    if (rentMonthly !== "") qs.set("rentMonthly", rentMonthly);
    if (rentersInsMonthly !== "") qs.set("rentersInsMonthly", rentersInsMonthly);
    if (parkingMonthly !== "") qs.set("parkingMonthly", parkingMonthly);

    if (netWorth !== "")     qs.set("netWorth",     netWorth);
    if (colGroceries !== "") qs.set("colGroceries", colGroceries);
    if (colUtilities !== "") qs.set("colUtilities", colUtilities);
    if (colTransport !== "") qs.set("colTransport", colTransport);
    if (colDining !== "")    qs.set("colDining",    colDining);
    if (colMisc !== "")      qs.set("colMisc",      colMisc);

    setQS(qs);
  }, [
    mode, fromState, toState, filing, salary, k401Pct,
    fromCityId, toCityId, fromCityOther, toCityOther, currentHousingMonthly,
    homePrice, downPct, ratePct, termYears, propertyTaxPct,
    homeInsMonthly, hoaMonthly, pmiAnnualPct,
    rentMonthly, rentersInsMonthly, parkingMonthly,
    netWorth, colGroceries, colUtilities, colTransport, colDining, colMisc,
  ]);

  // ── Comparable salary ────────────────────────────────────────────────────
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
      return {
        comparableSalary: Math.round((salaryN * ratio) / 100) * 100,
        pctLessMore: (1 - ratio) * 100,
        fromCityName: (fromCity as any).name,
        toCityName: (toCity as any).name,
        method: "col" as const,
      };
    }

    if (typeof (fromCity as any).defaultRent !== "number") return null;
    if (typeof (toCity as any).defaultRent !== "number") return null;

    const rentFrom = Math.max(500, (fromCity as any).defaultRent);
    const rentTo = Math.max(500, (toCity as any).defaultRent);
    const ratio = 0.55 * (rentTo / rentFrom) + 0.45;
    return {
      comparableSalary: Math.round((salaryN * ratio) / 100) * 100,
      pctLessMore: (1 - ratio) * 100,
      fromCityName: (fromCity as any).name,
      toCityName: (toCity as any).name,
      method: "rent" as const,
    };
  }, [fromCity, toCity, salary, isFromOther, isToOther]);

  // ── Estimated Living Costs — TARGET city ─────────────────────────────────
  const estGroceries = useMemo<number | null>(() => {
    if (!hasCOLData) return null;
    return 600 * ((toCity as any).col.groceries / (fromCity as any).col.groceries);
  }, [hasCOLData, fromCity, toCity]);

  const estUtilities = useMemo<number | null>(() => {
    if (!hasCOLData) return null;
    return 250 * ((toCity as any).col.utilities / (fromCity as any).col.utilities);
  }, [hasCOLData, fromCity, toCity]);

  const estTransport = useMemo<number | null>(() => {
    if (!hasCOLData) return null;
    return 300 * ((toCity as any).col.transport / (fromCity as any).col.transport);
  }, [hasCOLData, fromCity, toCity]);

  const estHealthcare = useMemo<number | null>(() => {
    if (!hasCOLData) return null;
    return 200 * ((toCity as any).col.healthcare / (fromCity as any).col.healthcare);
  }, [hasCOLData, fromCity, toCity]);

  // ── Effective COL values — user override → city estimate → national default ──
  const effectiveGroceries = useMemo(
    () => colGroceries !== "" ? nz(colGroceries) : (estGroceries ?? 500),
    [colGroceries, estGroceries]
  );
  const effectiveUtilities = useMemo(
    () => colUtilities !== "" ? nz(colUtilities) : (estUtilities ?? 200),
    [colUtilities, estUtilities]
  );
  const effectiveTransport = useMemo(
    () => colTransport !== "" ? nz(colTransport) : (estTransport ?? 300),
    [colTransport, estTransport]
  );
  const effectiveDining = useMemo(() => nz(colDining) || 300, [colDining]);
  const effectiveMisc   = useMemo(() => nz(colMisc)   || 200, [colMisc]);

  // Base (FROM-city) living cost estimates
  const curEstGroceries: number | null = hasCOLData ? 600 : null;
  const curEstUtilities: number | null = hasCOLData ? 250 : null;
  const curEstTransport: number | null = hasCOLData ? 300 : null;

  // ── Core results ─────────────────────────────────────────────────────────
  const results = useMemo(() => {
    const salaryN = n(salary);
    const k401N = nz(k401Pct);
    const salaryReady = Number.isFinite(salaryN) && salaryN > 0;

    const netFromMonthly = salaryReady
      ? estimateNetAnnual({ grossAnnual: salaryN, state: fromState, filing, k401Pct: k401N, cityId: fromCityId }) / 12
      : 0;

    const netToMonthly = salaryReady
      ? estimateNetAnnual({ grossAnnual: salaryN, state: toState, filing, k401Pct: k401N, cityId: toCityId }) / 12
      : 0;

    const monthlyIncomeDiff = salaryReady ? netToMonthly - netFromMonthly : 0;
    const grossMonthly = salaryReady ? salaryN / 12 : 0;

    const effTaxFromPct = salaryReady ? clamp((1 - (netFromMonthly * 12) / salaryN) * 100, 0, 99.9) : 0;
    const effTaxToPct   = salaryReady ? clamp((1 - (netToMonthly * 12) / salaryN) * 100, 0, 99.9) : 0;

    let buy = { principalInterest: 0, propertyTax: 0, homeInsurance: 0, hoa: 0, totalMonthly: 0, loanAmount: 0 };
    let pmiMonthly = 0;
    let buyTotal = 0;

    const buyReady = homePrice !== "" && downPct !== "" && ratePct !== "" && termYears !== "" && propertyTaxPct !== "";

    if (mode === "buy" && buyReady) {
      buy = monthlyHousingCost({
        homePrice: n(homePrice), downPct: n(downPct), ratePct: n(ratePct),
        termYears: n(termYears), propertyTaxPct: n(propertyTaxPct),
        homeInsMonthly: nz(homeInsMonthly), hoaMonthly: nz(hoaMonthly),
      });
      pmiMonthly = estimatePMIMonthly(buy.loanAmount, n(downPct), nz(pmiAnnualPct));
      buyTotal = buy.totalMonthly + pmiMonthly;
    }

    const rentTotal = mode === "rent"
      ? nz(rentMonthly) + nz(rentersInsMonthly) + nz(parkingMonthly)
      : 0;

    const activeHousing = mode === "buy" ? buyTotal : rentTotal;
    const pct = netToMonthly > 0 ? (activeHousing / netToMonthly) * 100 : Infinity;

    return {
      salaryReady, buyReady, netFromMonthly, netToMonthly, grossMonthly,
      effTaxFromPct, effTaxToPct, monthlyIncomeDiff,
      buy, pmiMonthly, buyTotal, rentTotal, activeHousing, pct,
    };
  }, [
    mode, salary, filing, k401Pct, fromState, toState, fromCityId, toCityId,
    homePrice, downPct, ratePct, termYears, propertyTaxPct,
    homeInsMonthly, hoaMonthly, pmiAnnualPct,
    rentMonthly, rentersInsMonthly, parkingMonthly,
  ]);

  // ── Derived financials ───────────────────────────────────────────────────
  const targetBreakdown = useMemo<TaxBreakdown | null>(() => {
    const salaryN = n(salary);
    if (!Number.isFinite(salaryN) || salaryN <= 0) return null;
    return estimateNetBreakdown({ grossAnnual: salaryN, state: toState, filing, k401Pct: nz(k401Pct), cityId: toCityId });
  }, [salary, toState, filing, k401Pct, toCityId]);

  const monthlyFlexibility = useMemo(
    () => results.netToMonthly - results.activeHousing,
    [results.netToMonthly, results.activeHousing]
  );

  const targetEssentialNonHousing = useMemo(
    () => effectiveGroceries + effectiveUtilities + effectiveTransport + effectiveDining + effectiveMisc,
    [effectiveGroceries, effectiveUtilities, effectiveTransport, effectiveDining, effectiveMisc]
  );

  const currentEssentialNonHousing =
    (curEstGroceries ?? 500) +
    (curEstUtilities ?? 200) +
    (curEstTransport ?? 300) +
    300 + // dining baseline
    200;  // subscriptions & misc baseline

  const trueMonthlyLeftover = useMemo(() => {
    if (!results.netToMonthly) return 0;
    return results.netToMonthly - results.activeHousing - targetEssentialNonHousing;
  }, [results.netToMonthly, results.activeHousing, targetEssentialNonHousing]);

  const maxSafeHousing = useMemo(
    () => (results.netToMonthly > 0 ? results.netToMonthly * 0.3 : 0),
    [results.netToMonthly]
  );

  const currentHousingEst = useMemo<number | null>(() => {
    if (!hasCOLData || !results.activeHousing) return null;
    return results.activeHousing * ((fromCity as any).col.housing / (toCity as any).col.housing);
  }, [hasCOLData, results.activeHousing, fromCity, toCity]);

  const currentHousingActual = useMemo<number | null>(() => {
    if (currentHousingMonthly !== "") return nz(currentHousingMonthly);
    return currentHousingEst;
  }, [currentHousingMonthly, currentHousingEst]);

  const isCurrentHousingEstimated = currentHousingMonthly === "";

  const currentTrueLeftover = useMemo<number | null>(() => {
    if (!results.netFromMonthly || currentHousingActual === null) return null;
    return results.netFromMonthly - currentHousingActual - currentEssentialNonHousing;
  }, [results.netFromMonthly, currentHousingActual, currentEssentialNonHousing]);

  const flexibilityDelta = useMemo<number | null>(() => {
    if (currentTrueLeftover === null) return null;
    return trueMonthlyLeftover - currentTrueLeftover;
  }, [trueMonthlyLeftover, currentTrueLeftover]);

  const neededSalary = useMemo<number | null>(() => {
    if (!results.salaryReady || currentTrueLeftover === null) return null;
    const k401N = nz(k401Pct);
    const targetAnnualNet =
      (results.activeHousing + targetEssentialNonHousing + Math.max(0, currentTrueLeftover)) * 12;
    if (targetAnnualNet <= 0) return null;
    return findNeededSalary(targetAnnualNet, toState, filing, k401N, toCityId);
  }, [results.salaryReady, results.activeHousing, targetEssentialNonHousing, currentTrueLeftover, toState, filing, k401Pct, toCityId]);

  const verdict = useMemo(
    () => getVerdict(results.pct, trueMonthlyLeftover, results.netToMonthly, nz(netWorth), n(homePrice)),
    [results.pct, trueMonthlyLeftover, results.netToMonthly, netWorth, homePrice]
  );

  const VS_MAP: Record<VerdictLevel, { border: string; bg: string; tag: string; label: string }> = {
    Comfortable: {
      border: "border-emerald-200 dark:border-emerald-900/60",
      bg: "bg-emerald-50/80 dark:bg-emerald-950/30",
      tag: "text-emerald-700 ring-emerald-200 dark:text-emerald-300 dark:ring-emerald-800",
      label: "text-emerald-700 dark:text-emerald-400",
    },
    Manageable: {
      border: "border-yellow-200 dark:border-yellow-900/60",
      bg: "bg-yellow-50/80 dark:bg-yellow-950/20",
      tag: "text-yellow-700 ring-yellow-200 dark:text-yellow-300 dark:ring-yellow-800",
      label: "text-yellow-700 dark:text-yellow-400",
    },
    Tight: {
      border: "border-orange-200 dark:border-orange-900/60",
      bg: "bg-orange-50/80 dark:bg-orange-950/20",
      tag: "text-orange-700 ring-orange-200 dark:text-orange-300 dark:ring-orange-800",
      label: "text-orange-700 dark:text-orange-400",
    },
    Risky: {
      border: "border-rose-200 dark:border-rose-900/60",
      bg: "bg-rose-50/80 dark:bg-rose-950/20",
      tag: "text-rose-700 ring-rose-200 dark:text-rose-300 dark:ring-rose-800",
      label: "text-rose-700 dark:text-rose-400",
    },
  };
  const vs = VS_MAP[verdict.level];

  // ── Reset ────────────────────────────────────────────────────────────────
  function resetInputsKeepContext() {
    setSalary("150000");
    setK401Pct("10");

    const firstFrom = fromCities.find((c: any) => !String(c.id).startsWith("other-"));
    setFromCityId(firstFrom?.id ?? "");
    setFromCityOther("");

    const firstTo = toCities.find((c: any) => !String(c.id).startsWith("other-"));
    setToCityId(firstTo?.id ?? "");
    setToCityOther("");

    setCurrentHousingMonthly("");
    setHomePrice("450000");
    setDownPct("20");
    setRatePct("6.5");
    setTermYears("30");
    setPropertyTaxPct("1.0");
    setHomeInsMonthly("150");
    setHoaMonthly("0");
    setPmiAnnualPct("0");
    setRentMonthly("2200");
    setParkingMonthly("150");
    setRentersInsMonthly("20");
    setNetWorth("");
    setColGroceries("");
    setColUtilities("");
    setColTransport("");
    setColDining("");
    setColMisc("");
  }

  // ── Labels ───────────────────────────────────────────────────────────────
  const stateName = useMemo(() => STATES.find((s) => s.code === toState)?.name ?? "", [toState]);

  const currentCityLabel = useMemo(
    () => isFromOther ? fromCityOther || "—" : findCity(fromCityId)?.name || "—",
    [isFromOther, fromCityOther, fromCityId]
  );

  const targetCityLabel = useMemo(
    () => isToOther ? toCityOther || "—" : findCity(toCityId)?.name || stateName || "your target city",
    [isToOther, toCityOther, toCityId, stateName]
  );

  // ── Negotiation range ────────────────────────────────────────────────────
  const negotiationEstimate = useMemo(() => {
    if (!comparable) return null;
    const currentOffer = n(salary);
    if (!Number.isFinite(currentOffer) || currentOffer <= 0) return null;

    const candidates = [comparable.comparableSalary];
    if (neededSalary !== null && Number.isFinite(neededSalary)) candidates.push(neededSalary);
    const target = Math.max(...candidates);
    const suggestedAsk = Math.ceil(target / 1000) * 1000;
    const gapPct = currentOffer > 0 ? ((suggestedAsk - currentOffer) / currentOffer) * 100 : 0;

    return {
      currentOffer,
      suggestedAsk,
      gapPct,
      aheadOfTarget: suggestedAsk <= currentOffer,
      toCityName: comparable.toCityName,
      fromCityName: comparable.fromCityName,
      costDeltaPct: Math.abs(comparable.pctLessMore),
      costDeltaDirection: comparable.pctLessMore >= 0 ? "less" : "more",
    };
  }, [comparable, salary, neededSalary]);

  // ── CSV export ───────────────────────────────────────────────────────────
  const csvExportRows = useMemo<CsvRow[]>(() => {
    const rows: CsvRow[] = [
      { Metric: "From city", Value: currentCityLabel },
      { Metric: "To city", Value: targetCityLabel },
      { Metric: "Housing mode", Value: mode === "buy" ? "Buying" : "Renting" },
      { Metric: "Gross annual salary", Value: money(results.grossMonthly * 12) },
      { Metric: "Net monthly pay (from city)", Value: money(results.netFromMonthly) },
      { Metric: "Net monthly pay (to city)", Value: money(results.netToMonthly) },
      { Metric: "Monthly take-home difference", Value: money(results.monthlyIncomeDiff) },
      { Metric: "Effective tax rate (from city)", Value: `${results.effTaxFromPct.toFixed(1)}%` },
      { Metric: "Effective tax rate (to city)", Value: `${results.effTaxToPct.toFixed(1)}%` },
      { Metric: "Monthly housing cost (to city)", Value: money(results.activeHousing) },
      { Metric: "Housing as % of net income", Value: Number.isFinite(results.pct) ? `${results.pct.toFixed(1)}%` : "—" },
      { Metric: "Monthly flexibility after housing", Value: money(monthlyFlexibility) },
      { Metric: "True monthly leftover (after essentials)", Value: money(trueMonthlyLeftover) },
      { Metric: "Max safe housing budget (30% rule)", Value: money(maxSafeHousing) },
      { Metric: "Verdict", Value: verdict.level },
      { Metric: "Verdict summary", Value: verdict.description },
    ];

    if (neededSalary !== null) {
      rows.push({ Metric: "Salary needed to match current lifestyle", Value: money(neededSalary) });
    }
    if (comparable) {
      rows.push({
        Metric: `Cost-of-living-adjusted comparable salary (${comparable.toCityName})`,
        Value: money(comparable.comparableSalary),
      });
      rows.push({
        Metric: `${comparable.toCityName} vs ${comparable.fromCityName} cost difference`,
        Value: `${Math.abs(comparable.pctLessMore).toFixed(1)}% ${comparable.pctLessMore >= 0 ? "less" : "more"} expensive`,
      });
    }
    if (targetBreakdown) {
      rows.push({ Metric: "Federal tax withheld (to city, annual)", Value: money(targetBreakdown.federal) });
      rows.push({ Metric: "State tax withheld (to city, annual)", Value: money(targetBreakdown.state) });
      rows.push({ Metric: "FICA withheld (to city, annual)", Value: money(targetBreakdown.fica) });
      if (targetBreakdown.local > 0) {
        rows.push({ Metric: "Local tax withheld (to city, annual)", Value: money(targetBreakdown.local) });
      }
    }
    if (negotiationEstimate && !negotiationEstimate.aheadOfTarget) {
      rows.push({ Metric: "Suggested negotiation ask", Value: money(negotiationEstimate.suggestedAsk) });
      rows.push({ Metric: "Ask vs. current offer", Value: `${negotiationEstimate.gapPct.toFixed(1)}% higher` });
    }

    return rows;
  }, [
    currentCityLabel, targetCityLabel, mode, results, monthlyFlexibility,
    trueMonthlyLeftover, maxSafeHousing, verdict, neededSalary, comparable, targetBreakdown,
    negotiationEstimate,
  ]);

  const handleExportCsv = () => {
    const filenameCity = (targetCityLabel || "scenario").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCsv(`relocation-scenario-${filenameCity}`, csvExportRows);
  };

  const handleExportPdf = () => {
    const filenameCity = (targetCityLabel || "scenario").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadPdfReport({
      filename: `relocation-scenario-${filenameCity}`,
      title: `${currentCityLabel} → ${targetCityLabel}`,
      subtitle: `${verdict.level}${results.salaryReady ? ` · ${money(monthlyFlexibility, 0)}/mo flexibility` : ""}`,
      rows: csvExportRows as PdfRow[],
      footerNote: "Estimates only, based on public cost-of-living and tax data. Not financial or tax advice. relocationbynumbers.com",
    });
  };

  const getCurrentScenario = () => ({
    label: `${currentCityLabel} → ${targetCityLabel}`,
    url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
    subtitle: `${verdict.level}${results.salaryReady ? ` · ${money(monthlyFlexibility, 0)}/mo flexibility` : ""}`,
    source: "US",
  });

  const isStatePage = monetization === "state";
  const isPremiumState = ["tx", "fl", "ca", "nc", "ny", "ma", "wa"].includes(toState);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="text-slate-900 dark:text-slate-100">
      {/* Mode toggle + Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold" />
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700">
            <button
              type="button"
              onClick={() => setMode("rent")}
              className={`rounded-lg px-3 py-1 text-sm ${mode === "rent" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}
            >
              Rent
            </button>
            <button
              type="button"
              onClick={() => setMode("buy")}
              className={`rounded-lg px-3 py-1 text-sm ${mode === "buy" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}
            >
              Buy
            </button>
          </div>
          <button
            type="button"
            onClick={resetInputsKeepContext}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Reset to defaults (keeps states)"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ══════════════════════════ INPUTS ══════════════════════════ */}
        <div className="space-y-3">
          {/* Income & Location */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Income & Location</div>
            <div className="grid gap-3 sm:grid-cols-2">

              <label className="text-sm">
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Salary</div>
                <input
                  className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                  type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Filing status</div>
                <select
                  className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                  value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}
                >
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
                </select>
              </label>

              <label className="text-sm">
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">401(k) % (est.)</div>
                <input
                  className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                  type="number" value={k401Pct} onChange={(e) => setK401Pct(e.target.value)} placeholder=" "
                />
              </label>

              <div className="text-sm">
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Income impact</div>
                <div className="flex w-full items-center justify-between rounded-xl border border-slate-300 p-2 dark:border-slate-700">
                  {results.salaryReady ? (
                    <>
                      <span className={`font-semibold ${results.monthlyIncomeDiff > 0 ? "text-emerald-600 dark:text-emerald-400" : results.monthlyIncomeDiff < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
                        {results.monthlyIncomeDiff > 0 ? "+" : ""}{money(results.monthlyIncomeDiff, 0)}
                      </span>
                      <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {results.monthlyIncomeDiff > 0 ? "Higher" : results.monthlyIncomeDiff < 0 ? "Lower" : "Same"}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  )}
                </div>
              </div>

              <label className="text-sm">
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Current state</div>
                <select
                  className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                  value={fromState}
                  onChange={(e) => { const state = e.target.value as StateCode; setFromState(state); setFromCityId(""); setFromCityOther(""); }}
                >
                  {STATES.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code.toUpperCase()})</option>)}
                </select>
              </label>

              <label className="text-sm">
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Target state</div>
                <select
                  className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                  value={toState}
                  onChange={(e) => { const state = e.target.value as StateCode; setToState(state); setToCityId(""); setToCityOther(""); }}
                >
                  {STATES.map((s) => <option key={s.code} value={s.code}>{s.name} ({s.code.toUpperCase()})</option>)}
                </select>
              </label>

              <label className="text-sm">
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Current city (optional)</div>
                <select
                  className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                  value={fromCityId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setFromCityId(id);
                    if (!id.startsWith("other-")) setFromCityOther("");
                    const city = findCity(id);
                    if (!city) return;
                    if ((city as any).state && (city as any).state !== fromState) setFromState((city as any).state);
                  }}
                >
                  <option value="">— Select city —</option>
                  {fromCities.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}{c.tier ? ` — ${c.tier}` : ""}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Target city (optional)</div>
                <select
                  className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                  value={toCityId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setToCityId(id);
                    if (!id.startsWith("other-")) setToCityOther("");
                    const city = findCity(id);
                    if (!city) return;
                    if ((city as any).state && (city as any).state !== toState) setToState((city as any).state);
                  }}
                >
                  <option value="">— Select city —</option>
                  {toCities.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}{c.tier ? ` — ${c.tier}` : ""}</option>
                  ))}
                </select>
              </label>

              {isFromOther && (
                <label className="text-sm sm:col-span-2">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Enter current city</div>
                  <input
                    className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    value={fromCityOther} onChange={(e) => setFromCityOther(e.target.value)} placeholder="Type your city"
                  />
                </label>
              )}

              {isToOther && (
                <label className="text-sm sm:col-span-2">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Enter target city</div>
                  <input
                    className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    value={toCityOther} onChange={(e) => setToCityOther(e.target.value)} placeholder="Type your city"
                  />
                </label>
              )}

              <label className="text-sm sm:col-span-2">
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  Current housing cost/mo{" "}
                  <span className="font-normal text-slate-400 dark:text-slate-500">(optional — improves side-by-side comparison)</span>
                </div>
                <input
                  className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                  type="number" value={currentHousingMonthly} onChange={(e) => setCurrentHousingMonthly(e.target.value)}
                  placeholder={currentHousingEst != null ? `~${Math.round(currentHousingEst)} estimated` : "e.g. 2500"}
                />
              </label>

              <label className="text-sm sm:col-span-2">
                <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  Net worth{" "}
                  <span className="font-normal text-slate-400 dark:text-slate-500">(optional — adjusts financial verdict)</span>
                </div>
                <input
                  className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                  type="number" value={netWorth} onChange={(e) => setNetWorth(e.target.value)} placeholder="e.g. 500000"
                />
              </label>

              {fromCityId && toCityId && !compareRouteAllowed ? (
                <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                  Compare pages are currently available only when at least one selected city is a major city.
                </div>
              ) : null}
            </div>
          </div>

          {/* Buy Inputs */}
          {mode === "buy" && (
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Buy Inputs</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Home price</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" value={homePrice} onChange={(e) => setHomePrice(e.target.value)} placeholder=" " />
                </label>
                <label className="block text-sm">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Down payment %</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" value={downPct} onChange={(e) => setDownPct(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Interest rate %</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" step="0.01" value={ratePct} onChange={(e) => setRatePct(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Term (years)</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" value={termYears} onChange={(e) => setTermYears(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Property tax % (annual)</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" step="0.01" value={propertyTaxPct} onChange={(e) => setPropertyTaxPct(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Home insurance (monthly)</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" value={homeInsMonthly} onChange={(e) => setHomeInsMonthly(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">HOA (monthly)</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" value={hoaMonthly} onChange={(e) => setHoaMonthly(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">PMI % (annual, if down &lt; 20%)</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" step="0.01" value={pmiAnnualPct} onChange={(e) => setPmiAnnualPct(e.target.value)} placeholder=" " />
                </label>
              </div>
              <EstimatedLivingCosts
                hasCOLData={hasCOLData}
                estGroceries={estGroceries} estUtilities={estUtilities} estTransport={estTransport}
                colGroceries={colGroceries} setColGroceries={setColGroceries}
                colUtilities={colUtilities} setColUtilities={setColUtilities}
                colTransport={colTransport} setColTransport={setColTransport}
                colDining={colDining}       setColDining={setColDining}
                colMisc={colMisc}           setColMisc={setColMisc}
              />
            </div>
          )}

          {/* Rent Inputs */}
          {mode === "rent" && (
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Rent Inputs</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm sm:col-span-2">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Monthly rent</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" value={rentMonthly} onChange={(e) => setRentMonthly(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Renter's insurance (monthly)</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" value={rentersInsMonthly} onChange={(e) => setRentersInsMonthly(e.target.value)} placeholder=" " />
                </label>
                <label className="text-sm">
                  <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Parking (monthly)</div>
                  <input className="h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800"
                    type="number" value={parkingMonthly} onChange={(e) => setParkingMonthly(e.target.value)} placeholder=" " />
                </label>
              </div>
              <EstimatedLivingCosts
                hasCOLData={hasCOLData}
                estGroceries={estGroceries} estUtilities={estUtilities} estTransport={estTransport}
                colGroceries={colGroceries} setColGroceries={setColGroceries}
                colUtilities={colUtilities} setColUtilities={setColUtilities}
                colTransport={colTransport} setColTransport={setColTransport}
                colDining={colDining}       setColDining={setColDining}
                colMisc={colMisc}           setColMisc={setColMisc}
              />
            </div>
          )}
        </div>

        {/* ══════════════════════════ RESULTS ══════════════════════════ */}
        <div className="space-y-3">

          {/* ── 1. BOTTOM LINE VERDICT ── */}
          <div className={`rounded-2xl border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${vs.border} ${vs.bg}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={`text-xs font-semibold uppercase tracking-[0.14em] ${vs.label}`}>Bottom Line</div>
                <div className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{verdict.level}</div>
              </div>
              <div className={`rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 dark:bg-slate-800 ${vs.tag}`}>
                Move assessment
              </div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-slate-200/50 dark:bg-slate-800/70 dark:ring-slate-700/50">
              <div className={`h-full rounded-full transition-all ${verdict.barColor} ${verdict.barWidth}`} />
            </div>

            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{verdict.description}</p>

            {verdict.netWorthNote && (
              <div className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-slate-800/60 dark:text-emerald-300 dark:ring-emerald-800">
                💼 {verdict.netWorthNote}
              </div>
            )}

            {results.salaryReady && (
              <div className="mt-4 grid gap-2 rounded-xl bg-white/60 p-3 text-sm dark:bg-slate-800/60">
                {Number.isFinite(trueMonthlyLeftover) && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Est. leftover after essentials</span>
                    <span className={`font-semibold ${trueMonthlyLeftover >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {money(trueMonthlyLeftover)}
                    </span>
                  </div>
                )}
                {maxSafeHousing > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Aim for housing under</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{money(maxSafeHousing)}/mo</span>
                  </div>
                )}
                {neededSalary != null && neededSalary > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Salary to match current lifestyle</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{money(neededSalary)}</span>
                  </div>
                )}
                {comparable && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">COL-equivalent salary</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{money(comparable.comparableSalary)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 2. RESULTS DETAIL ── */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Results</div>
            <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {TAX_YEAR} federal &amp; state tax assumptions · Planning estimates only
            </div>
            <div className="mb-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div>Current city: <span className="font-semibold text-slate-900 dark:text-slate-100">{currentCityLabel}</span></div>
              <div>Target city: <span className="font-semibold text-slate-900 dark:text-slate-100">{targetCityLabel}</span></div>
            </div>
            <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
              <div>Net monthly (current): <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.netFromMonthly)}</span></div>
              <div>Net monthly (target): <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.netToMonthly)}</span></div>

              {results.salaryReady && targetBreakdown && (
                <>
                  <div className="mt-2">Gross monthly: <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.grossMonthly, 2)}</span></div>
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Target city — est. annual taxes
                    </div>
                    <div className="grid gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Federal income tax</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{money(targetBreakdown.federal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FICA (SS + Medicare)</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{money(targetBreakdown.fica)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>State income tax</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{money(targetBreakdown.state)}</span>
                      </div>
                      {targetBreakdown.local > 0 && (
                        <div className="flex justify-between">
                          <span>Local income tax</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{money(targetBreakdown.local)}</span>
                        </div>
                      )}
                      <div className="mt-1 flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                        <span>Total taxes</span>
                        <span>{money(targetBreakdown.federal + targetBreakdown.fica + targetBreakdown.state + targetBreakdown.local)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Effective rate</span>
                        <span>{results.effTaxToPct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Current city effective rate: <span className="font-semibold text-slate-900 dark:text-slate-100">{results.effTaxFromPct.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Includes local city income tax where applicable. CA and PA tax traditional 401(k) contributions at the state level (most other states exclude them, matching federal treatment) — accounted for above.
                  </div>
                </>
              )}

              {mode === "buy" ? (
                <>
                  <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">Monthly housing (buy)</div>
                  <div className="grid gap-1 text-sm">
                    <div>Principal + Interest: <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.buy.principalInterest, 2)}</span></div>
                    <div>Property tax: <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.buy.propertyTax, 2)}</span></div>
                    <div>Home insurance: <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.buy.homeInsurance, 2)}</span></div>
                    <div>HOA: <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.buy.hoa, 2)}</span></div>
                    <div>PMI: <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.pmiMonthly, 2)}</span></div>
                    <div className="pt-2">Total: <span className="font-bold text-slate-900 dark:text-slate-100">{money(results.buyTotal, 2)}</span></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">Monthly housing (rent)</div>
                  <div>Total (rent + renter's ins + parking): <span className="font-bold text-slate-900 dark:text-slate-100">{money(results.rentTotal, 2)}</span></div>
                </>
              )}

              <div className="mt-2">
                Housing % of net (target):{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{Number.isFinite(results.pct) ? results.pct.toFixed(1) + "%" : "—"}</span>
              </div>

              <div className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <div>Results are estimates only. No information entered is stored or shared.</div>
                <div>Tax estimates include federal income tax, FICA, state income tax, and supported local city income taxes where applicable.</div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tip: Your URL updates as you type — copy the page link to share this scenario.
              </div>
            </div>
          </div>

          {/* ── 3. MONTHLY FLEXIBILITY ── */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">Monthly Flexibility</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {results.netToMonthly > 0 ? money(monthlyFlexibility, 2) : "—"}
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:ring-amber-800">
                After housing
              </div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-amber-100 dark:bg-slate-800/80 dark:ring-amber-900/40">
              <div className={`h-full rounded-full ${
                !results.netToMonthly ? "w-[0%] bg-slate-300"
                : monthlyFlexibility >= 3000 ? "w-[92%] bg-emerald-500"
                : monthlyFlexibility >= 2000 ? "w-[76%] bg-emerald-400"
                : monthlyFlexibility >= 1000 ? "w-[58%] bg-amber-400"
                : monthlyFlexibility >= 500  ? "w-[40%] bg-orange-400"
                : "w-[24%] bg-rose-400"
              }`} />
            </div>
            <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              {!results.netToMonthly
                ? "Add salary and housing inputs to estimate how much room you have left each month."
                : `What's left each month in ${targetCityLabel} after housing — before groceries, utilities, and other essentials.`}
            </div>
          </div>

          {/* ── 4. TRUE MONTHLY LEFTOVER ── */}
          {hasCOLData && results.salaryReady && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-violet-900/60 dark:bg-violet-950/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-400">True Monthly Leftover</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{money(trueMonthlyLeftover, 2)}</div>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 dark:bg-slate-800 dark:text-violet-300 dark:ring-violet-800">
                  After essentials
                </div>
              </div>
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-violet-100 dark:bg-slate-800/80 dark:ring-violet-900/40">
                <div className={`h-full rounded-full ${
                  trueMonthlyLeftover <= 0  ? "w-[4%] bg-rose-400"
                  : trueMonthlyLeftover >= 2000 ? "w-[90%] bg-emerald-500"
                  : trueMonthlyLeftover >= 1000 ? "w-[68%] bg-emerald-400"
                  : trueMonthlyLeftover >= 400  ? "w-[48%] bg-amber-400"
                  : "w-[28%] bg-orange-400"
                }`} />
              </div>
              <div className="mt-3 grid gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Net monthly (target)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{money(results.netToMonthly, 2)}</span>
                </div>
                {(
                  [
                    ["Housing",                  results.activeHousing],
                    ["Est. groceries",            effectiveGroceries],
                    ["Est. utilities",            effectiveUtilities],
                    ["Est. transportation",       effectiveTransport],
                    ["Est. dining out",           effectiveDining],
                    ["Est. subscriptions & misc", effectiveMisc],
                  ] as [string, number][]
                ).map(([label, val]) => (
                  <div key={label} className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{label}</span>
                    <span>− {money(val, 2)}</span>
                  </div>
                ))}
                <div className="mt-1 flex justify-between border-t border-violet-200 pt-1.5 font-semibold text-slate-900 dark:border-violet-800 dark:text-slate-100">
                  <span>Leftover</span>
                  <span className={trueMonthlyLeftover >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                    {money(trueMonthlyLeftover, 2)}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Essential cost estimates are based on city cost-of-living index data.
              </div>
            </div>
          )}

          {/* ── 5. CURRENT VS TARGET COMPARISON ── */}
          {hasCOLData && results.salaryReady && currentHousingActual != null && (
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Current vs. Target</div>
              {isCurrentHousingEstimated && (
                <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  Current housing is{" "}
                  <span className="font-semibold text-amber-700 dark:text-amber-400">estimated</span>{" "}
                  from your selected target housing cost and the city housing index — not your actual number. Enter your real amount above for a precise comparison.
                </div>
              )}
              <div className="overflow-x-auto overscroll-x-contain" role="region" aria-label="Current and target cost comparison" tabIndex={0}>
              <table className="w-full min-w-[30rem] text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="pb-2 text-left">Metric</th>
                    <th className="pb-2 text-right">{currentCityLabel}</th>
                    <th className="pb-2 text-right">{targetCityLabel}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-2 text-slate-600 dark:text-slate-400">Net monthly</td>
                    <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-100">{money(results.netFromMonthly)}</td>
                    <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-100">{money(results.netToMonthly)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600 dark:text-slate-400">Housing</td>
                    <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {money(currentHousingActual)}
                      {isCurrentHousingEstimated && <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">est.</span>}
                    </td>
                    <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-100">{money(results.activeHousing)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-600 dark:text-slate-400">Essentials</td>
                    <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-100">{money(currentEssentialNonHousing)}</td>
                    <td className="py-2 text-right font-semibold text-slate-900 dark:text-slate-100">{money(targetEssentialNonHousing)}</td>
                  </tr>
                  <tr className="font-semibold">
                    <td className="py-2 text-slate-900 dark:text-slate-100">Left after essentials</td>
                    <td className="py-2 text-right">
                      <span className={currentTrueLeftover != null && currentTrueLeftover >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {currentTrueLeftover != null ? money(currentTrueLeftover) : "—"}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <span className={trueMonthlyLeftover >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                        {money(trueMonthlyLeftover)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
              {flexibilityDelta != null && (
                <div className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${flexibilityDelta >= 0 ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300" : "bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300"}`}>
                  {flexibilityDelta >= 0
                    ? `Your move adds about ${money(Math.abs(flexibilityDelta))}/mo in room.`
                    : `You'd likely lose about ${money(Math.abs(flexibilityDelta))}/mo in flexibility.`}
                </div>
              )}
            </div>
          )}

          {/* ── 6. COMPARABLE SALARY ── */}
          {comparable && (
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
              <div className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">COMPARABLE SALARY</div>
              <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{money(comparable.comparableSalary)}</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {comparable.toCityName} is roughly{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.abs(comparable.pctLessMore).toFixed(0)}%</span>{" "}
                {comparable.pctLessMore >= 0 ? "less" : "more"} expensive than {comparable.fromCityName}.
              </p>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Based on housing, transportation, and essential cost weighting.</div>
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={() => window.open("http://relocationbynumbers.com/mortgage-calculator", "_blank", "noopener,noreferrer")}
              >
                See if you can afford a mortgage →
              </button>
              <button
                type="button"
                className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                onClick={() => {
                  const salaryN = Math.round(n(salary));
                  const url = salaryN > 0
                    ? `https://www.relocationbynumbers.com/fire-calculator?income=${salaryN}`
                    : "https://www.relocationbynumbers.com/fire-calculator";
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
              >
                See your FIRE number after this move →
              </button>
            </div>
          )}

          {/* ── 6.5 NEGOTIATION RANGE ── */}
          {negotiationEstimate && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-violet-900/60 dark:bg-violet-950/20">
              <div className="text-xs font-semibold tracking-widest text-violet-700 dark:text-violet-400">NEGOTIATION RANGE</div>

              {negotiationEstimate.aheadOfTarget ? (
                <>
                  <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Your offer already covers the move
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {money(negotiationEstimate.currentOffer)}{" "}
                    is at or above what&apos;s typically needed to match your
                    current budget in {negotiationEstimate.toCityName}, which is{" "}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{negotiationEstimate.costDeltaPct.toFixed(0)}%</span>{" "}
                    {negotiationEstimate.costDeltaDirection} expensive than {negotiationEstimate.fromCityName}. You may have
                    room to negotiate for equity, remote flexibility, or other terms instead of base salary.
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{money(negotiationEstimate.suggestedAsk)}</div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Suggested starting ask for a role in {negotiationEstimate.toCityName} — about{" "}
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{negotiationEstimate.gapPct.toFixed(0)}% higher</span>{" "}
                    than your current offer of {money(negotiationEstimate.currentOffer)}, based on the cost-of-living
                    difference and what it takes to keep your monthly budget where it is today.
                  </p>
                </>
              )}

              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                This is a planning estimate, not a guarantee, use it as a starting point for your own research and negotiation.
              </div>
            </div>
          )}

          {/* ── 7. SHARE ── */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-sky-900/60 dark:bg-sky-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-400">Share this scenario</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  Copy your current comparison link and send it to a partner, friend, or future self.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const shareUrl = new URL(window.location.href);
                    const shareText = mode === "rent"
                      ? `My relocation scenario: ${currentCityLabel} → ${targetCityLabel}. Monthly flexibility ${money(monthlyFlexibility, 0)} after housing.`
                      : `My relocation scenario: ${currentCityLabel} → ${targetCityLabel}. Comparing take-home pay, housing costs, and affordability with Relocation by Numbers.`;
                    const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                    if (canNativeShare) {
                      await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({
                        title: "My Relocation Scenario", text: shareText, url: shareUrl.toString(),
                      });
                      setShareStatus("shared");
                    } else {
                      await navigator.clipboard.writeText(shareUrl.toString());
                      setShareStatus("copied");
                    }
                    window.setTimeout(() => setShareStatus("idle"), 2500);
                  } catch (err) {
                    console.error("Share failed", err);
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      setShareStatus("copied");
                      window.setTimeout(() => setShareStatus("idle"), 2500);
                    } catch (clipboardErr) {
                      console.error("Clipboard failed", clipboardErr);
                      setShareStatus("error");
                      window.setTimeout(() => setShareStatus("idle"), 2500);
                    }
                  }
                }}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {shareStatus === "copied" ? "Link copied!" : shareStatus === "shared" ? "Shared!" : shareStatus === "error" ? "Share failed" : "Share scenario"}
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center justify-center rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-950"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center justify-center rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-950"
              >
                Export PDF
              </button>
              </div>
            </div>
          </div>

          {/* ── 8. SAVED SCENARIOS ── */}
          <SavedScenariosPanel getCurrentScenario={getCurrentScenario} />

        </div>
      </div>
    </div>
  );
}
