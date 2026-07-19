"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SavedScenariosPanel from "./SavedScenariosPanel";
import {
  INTERNATIONAL_COUNTRIES,
  getCountryByCode,
} from "@/lib/internationalCountries";
import {
  citiesForCountry,
  getInternationalCityByCode,
} from "@/lib/internationalCities";
import { getCityDefaultsByCode } from "@/lib/internationalCityDefaults";
import { getCityCostMultipliers } from "@/lib/internationalCityCosts";
import { estimateInternationalTax } from "@/lib/internationalTaxes";
import { USD_TO_LOCAL } from "@/lib/internationalFx";
import {
  CARIBBEAN_COUNTRIES,
  isCaribbeanCountryCode,
  getCaribbeanCountryByCode,
} from "@/lib/caribbeanCountries";
import { getVisaContext } from "@/lib/visaContext";
import {
  hasTaxConfig,
  getCountryTaxConfig,
  CARIBBEAN_TAX_ASSUMPTIONS_LABEL,
} from "@/lib/caribbeanTax/index";
import { estimateScenarioTax } from "@/lib/caribbeanTax/engine";
import type { IncomeScenario, Confidence } from "@/lib/caribbeanTax/types";
import { COST_SCALING, CAR_COST_FALLBACK_USD } from "@/lib/relocationConstants";
import AdSlot from "./AdSlot";

// ---------------------------------------------------------------------------
// CARIBBEAN COST DEFAULTS (country-level fallback only)
// ---------------------------------------------------------------------------
const CARIBBEAN_COST_DEFAULTS: Record<string, {
  groceries: number; utilities: number; transport: number; healthcare: number;
}> = {
  DO: { groceries: 400, utilities: 150, transport: 100, healthcare: 150 },
  JM: { groceries: 500, utilities: 200, transport: 120, healthcare: 180 },
  BB: { groceries: 700, utilities: 250, transport: 150, healthcare: 300 },
  TT: { groceries: 500, utilities: 200, transport: 130, healthcare: 200 },
  PR: { groceries: 600, utilities: 220, transport: 160, healthcare: 250 },
  LC: { groceries: 500, utilities: 180, transport: 120, healthcare: 200 },
  GD: { groceries: 480, utilities: 170, transport: 110, healthcare: 190 },
  KY: { groceries: 900, utilities: 350, transport: 200, healthcare: 400 },
  BS: { groceries: 800, utilities: 300, transport: 180, healthcare: 350 },
  TC: { groceries: 750, utilities: 280, transport: 170, healthcare: 320 },
  AG: { groceries: 550, utilities: 200, transport: 130, healthcare: 220 },
  KN: { groceries: 480, utilities: 180, transport: 110, healthcare: 190 },
  VC: { groceries: 450, utilities: 160, transport: 100, healthcare: 180 },
  DM: { groceries: 420, utilities: 155, transport: 100, healthcare: 170 },
  MS: { groceries: 500, utilities: 190, transport: 120, healthcare: 200 },
  VG: { groceries: 700, utilities: 260, transport: 160, healthcare: 300 },
  VI: { groceries: 650, utilities: 240, transport: 150, healthcare: 280 },
  AW: { groceries: 600, utilities: 220, transport: 140, healthcare: 250 },
  CW: { groceries: 580, utilities: 210, transport: 135, healthcare: 240 },
  SX: { groceries: 620, utilities: 230, transport: 145, healthcare: 260 },
  HT: { groceries: 300, utilities: 120, transport: 80,  healthcare: 100 },
  CU: { groceries: 250, utilities: 100, transport: 70,  healthcare: 80  },
};

// ---------------------------------------------------------------------------
// CURRENCY MAP
// ---------------------------------------------------------------------------
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", PT: "EUR", ES: "EUR", MX: "MXN", CA: "CAD",
  DE: "EUR", NL: "EUR", CR: "CRC", FR: "EUR", IT: "EUR", IE: "EUR",
  AU: "AUD", NZ: "NZD", JP: "JPY", KR: "KRW", AE: "AED", SG: "SGD",
  CH: "CHF", DK: "DKK", SE: "SEK", NO: "NOK", FI: "EUR", PL: "PLN",
  CZ: "CZK", HU: "HUF", GR: "EUR", TR: "TRY", HR: "EUR", EE: "EUR",
  LV: "EUR", LT: "EUR", RO: "RON", BG: "BGN", SI: "EUR", SK: "EUR",
  MT: "EUR", CY: "EUR", PA: "USD", CO: "COP", BR: "BRL", AR: "ARS",
  CL: "CLP", PE: "PEN", TH: "THB", VN: "VND", MY: "MYR", ID: "IDR",
  ZA: "ZAR", AT: "EUR", BE: "EUR",
  AG: "XCD", AW: "AWG", BB: "BBD", BL: "EUR",
  "BQ-BO": "USD", "BQ-SA": "USD", "BQ-SE": "USD",
  BS: "BSD", CU: "CUP", CW: "XCG", DM: "XCD", DO: "DOP",
  GD: "XCD", GP: "EUR", HT: "HTG", JM: "JMD", KN: "XCD",
  KY: "KYD", LC: "XCD", MF: "EUR", MQ: "EUR", MS: "XCD",
  PR: "USD", SX: "XCG", TC: "USD", TT: "TTD", VC: "XCD",
  VG: "USD", VI: "USD",
};

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type Mode            = "working" | "retired";
type FilingStatus    = "single" | "married";
type SalaryType      = "local" | "remote";
type FurnishedType   = "furnished" | "unfurnished";
type YesNo           = "yes" | "no";
type CurrencyDisplay = "USD" | "CURRENT" | "DESTINATION";

// ---------------------------------------------------------------------------
// FX HELPERS
// NOTE: Static FX rates — for estimation only, not real-time.
// Volatile currencies (JPY, ARS, TRY, etc.) can move 10–30%+ between updates.
// ---------------------------------------------------------------------------
function convertLocalToUsd(amount: number, countryCode: string): number {
  const rate = USD_TO_LOCAL[countryCode] ?? 1;
  return rate > 0 ? amount / rate : amount;
}

function convertUsdToLocal(amount: number, countryCode: string): number {
  const rate = USD_TO_LOCAL[countryCode] ?? 1;
  return amount * rate;
}

// ---------------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------------
function money(n: number, digits = 0, currency = "USD") {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function getQS() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function setQS(params: URLSearchParams) {
  if (typeof window === "undefined") return;
  const qs  = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

function getReadinessBand(ratio: number) {
  if (ratio <= 0.25) return { band: "A", label: "Comfortable", note: "This looks healthy relative to your estimated target net income." };
  if (ratio <= 0.35) return { band: "B", label: "Manageable",  note: "Doable, but keep an eye on recurring costs and setup cash." };
  if (ratio <= 0.45) return { band: "C", label: "Tight",       note: "Possible, but the margin for error is thinner." };
  return               { band: "D", label: "Stretched",        note: "Housing is taking up a large share of the budget." };
}

function confidenceBadge(confidence: Confidence) {
  switch (confidence) {
    case "high":       return { label: "● High confidence",     cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800" };
    case "moderate":   return { label: "● Moderate",            cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800" };
    case "simplified": return { label: "● Simplified estimate", cls: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:ring-orange-800" };
    default:           return { label: "⚠ Pending",             cls: "bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700" };
  }
}

const inputCls     = "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
const selectCls    = "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600 dark:text-slate-400";

// ---------------------------------------------------------------------------
// INFO TIP
// ---------------------------------------------------------------------------
function InfoTip({ text, align = "left" }: { text: string; align?: "left" | "right" | "center" }) {
  const positionClass =
    align === "right"  ? "right-0" :
    align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button type="button" aria-label="More info"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
        i
      </button>
      <span className={`pointer-events-none absolute top-full z-50 mt-2 hidden max-w-[calc(100vw-2rem)] w-72 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-5 text-white shadow-xl group-hover:block group-focus-within:block ${positionClass}`}>
        {text}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// VISA CONTEXT CARD — three variants
// ---------------------------------------------------------------------------
function VisaContextCard({ countryCode }: { countryCode: string }) {
  const ctx = getVisaContext(countryCode);
  if (!ctx) return null;

  if (ctx.restricted) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-amber-900/60 dark:bg-amber-950/20">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
          <span>{ctx.icon}</span>
          <span>⚠ Travel Advisory</span>
        </div>
        <div className="mb-1 text-xs font-medium text-amber-700 dark:text-amber-400">{ctx.program}</div>
        <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">{ctx.summary}</p>
      </div>
    );
  }

  const headerLabel = ctx.territoryOf ? `${ctx.territoryOf} Territory` : "Visa / Residency Context";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <span>{ctx.icon}</span>
        <span>{headerLabel}</span>
      </div>
      <div className="mb-1 text-xs font-medium text-teal-700 dark:text-teal-400">{ctx.program}</div>
      <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{ctx.summary}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {ctx.feeNote}:{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">${ctx.estimatedFeeUsd.toLocaleString()}</span>
        </span>
        {ctx.highlight && (
          <span className="rounded-full bg-teal-50 px-2.5 py-1 font-medium text-teal-700 ring-1 ring-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:ring-teal-800">
            {ctx.highlight}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RELOCATION VERDICT
// ---------------------------------------------------------------------------
interface VerdictResults {
  comfort:            { band: string; label: string; note: string };
  monthlyFlexibility: number;
  upfrontCashNeeded:  number;
  monthsCovered:      number;
  pct:                number;
  salaryReady:        boolean;
  targetIsDisclaimer: boolean;
  targetTaxRate:      number;
  currentTaxRate:     number;
}

function RelocationVerdict({ results, toCityLabel, displayAmount }: {
  results: VerdictResults;
  toCityLabel: string;
  displayAmount: (n: number, d?: number) => string;
}) {
  const { comfort, monthlyFlexibility, upfrontCashNeeded, monthsCovered,
          pct, salaryReady, targetIsDisclaimer, targetTaxRate, currentTaxRate } = results;

  if (!salaryReady) return null;

  const savingsReadiness =
    monthsCovered >= 6 ? "strong" : monthsCovered >= 3 ? "adequate" : "thin";

  const taxSentence = targetIsDisclaimer
    ? "Tax impact for this scenario is not yet modeled — consult a local advisor."
    : targetTaxRate < currentTaxRate
      ? `Your estimated tax rate drops from ${(currentTaxRate * 100).toFixed(0)}% to ${(targetTaxRate * 100).toFixed(0)}%, improving monthly take-home.`
      : targetTaxRate > currentTaxRate
        ? `Your estimated tax rate increases from ${(currentTaxRate * 100).toFixed(0)}% to ${(targetTaxRate * 100).toFixed(0)}% in this scenario.`
        : "Your estimated tax rate is similar in both locations.";

  const verdictColor =
    comfort.band === "A" && savingsReadiness !== "thin" ? "emerald"
    : comfort.band === "D" || savingsReadiness === "thin" ? "rose"
    : "amber";

  const colorMap = {
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300",
    rose:    "border-rose-200 bg-rose-50/70 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300",
    amber:   "border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${colorMap[verdictColor]}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] mb-2">Decision Summary</div>
      <p className="text-sm leading-6">
        Moving to <strong>{toCityLabel}</strong>, housing takes up{" "}
        <strong>{pct.toFixed(0)}%</strong> of estimated net income — rated{" "}
        <strong>{comfort.label}</strong>. {taxSentence} You have{" "}
        <strong>{displayAmount(monthlyFlexibility, 0)}</strong>/mo left after core expenses.
        Your savings cover roughly <strong>{monthsCovered.toFixed(1)} months</strong> of
        expenses (upfront costs: <strong>{displayAmount(upfrontCashNeeded, 0)}</strong>) —
        savings runway is <strong>{savingsReadiness}</strong>.
      </p>
      {savingsReadiness === "thin" && (
        <p className="mt-2 text-sm font-semibold">⚠ Consider building more savings before committing to this move.</p>
      )}
      {comfort.band === "D" && (
        <p className="mt-2 text-sm font-semibold">⚠ Housing is consuming a high share of estimated income. Try a lower rent or higher income scenario.</p>
      )}
      <p className="mt-3 text-xs opacity-70">Planning estimates only. Not financial or tax advice.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function CaribbeanRelocationCalculator() {
  const hasMounted = useRef(false);
  const [qsHydrated, setQsHydrated] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const [mode,             setMode]             = useState<Mode>("working");
  const [salary,           setSalary]           = useState<string>("150000");
  const [retirementIncome, setRetirementIncome] = useState<string>("70000");
  const [filing,           setFiling]           = useState<FilingStatus>("single");

  const [fromCountry,  setFromCountry]  = useState<string>("US");
  const [toCountry,    setToCountry]    = useState<string>("DO");
  const [fromCityCode, setFromCityCode] = useState<string>("US-NYC");
  const [toCityCode,   setToCityCode]   = useState<string>("");

  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>("USD");
  const [salaryType,      setSalaryType]      = useState<SalaryType>("remote");
  const [adults,          setAdults]          = useState<string>("1");
  const [children,        setChildren]        = useState<string>("0");

  const [conditionalAnswers, setConditionalAnswers] = useState<Record<string, string>>({});

  const [destinationRent,   setDestinationRent]   = useState<string>("1300");
  const [depositRequired,   setDepositRequired]   = useState<string>("1300");
  const [firstMonthRent,    setFirstMonthRent]    = useState<string>("1300");
  const [lastMonthRent,     setLastMonthRent]     = useState<string>("0");
  const [furnished,         setFurnished]         = useState<FurnishedType>("unfurnished");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<YesNo>("no");
  // FIX 5: renamed from "car" to "needCar" for URL key clarity
  const [needCar,           setNeedCar]           = useState<YesNo>("no");

  const [groceries,      setGroceries]      = useState<string>("550");
  const [utilities,      setUtilities]      = useState<string>("180");
  const [transportation, setTransportation] = useState<string>("150");
  const [healthcare,     setHealthcare]     = useState<string>("200");
  const [carCost,        setCarCost]        = useState<string>(String(CAR_COST_FALLBACK_USD));

  const [visaCost,            setVisaCost]            = useState<string>("180");
  const [flightCost,          setFlightCost]          = useState<string>("450");
  const [shippingCost,        setShippingCost]        = useState<string>("400");
  const [temporaryStay,       setTemporaryStay]       = useState<string>("1300");
  const [adminFees,           setAdminFees]           = useState<string>("220");
  const [furnitureSetup,      setFurnitureSetup]      = useState<string>("1000");
  const [emergencyCashBuffer, setEmergencyCashBuffer] = useState<string>("4000");
  const [currentSavings,      setCurrentSavings]      = useState<string>("25000");

  const nz = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

  const incomeScenario: IncomeScenario =
    mode === "retired" ? "retired" : salaryType === "remote" ? "remote" : "local";

  const allCountriesSorted = useMemo(
    () => [...INTERNATIONAL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)), []
  );
  const caribbeanCountriesSorted = useMemo(
    () => [...CARIBBEAN_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)), []
  );
  const fromCities = useMemo(
    () => [...citiesForCountry(fromCountry)].sort((a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" })),
    [fromCountry]
  );
  const toCities = useMemo(
    () => [...citiesForCountry(toCountry)].sort((a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" })),
    [toCountry]
  );

  const originCurrency = COUNTRY_TO_CURRENCY[fromCountry] ?? "USD";

  const displayAmount = (amountUsd: number, digits = 0) => {
    if (currencyDisplay === "CURRENT")
      return money(convertUsdToLocal(amountUsd, fromCountry), digits, COUNTRY_TO_CURRENCY[fromCountry] ?? "USD");
    if (currencyDisplay === "DESTINATION")
      return money(convertUsdToLocal(amountUsd, toCountry), digits, COUNTRY_TO_CURRENCY[toCountry] ?? "USD");
    return money(amountUsd, digits, "USD");
  };

  const fromCityLabel = getInternationalCityByCode(fromCityCode)?.name ?? "Current city";
  const toCityLabel   = getInternationalCityByCode(toCityCode)?.name  ?? "Target city";

  const selectedCityDefaults = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);
  const currentCityDefaults  = useMemo(() => getCityDefaultsByCode(fromCityCode), [fromCityCode]);
  const targetCityDefaults   = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);

  // Only apply city multipliers when falling back from country-level defaults.
  // City-specific defaults are already calibrated — multiplying again inflates costs.
  const hasCityDefaults   = !!selectedCityDefaults;
  const toCityMultipliers = useMemo(
    () => hasCityDefaults ? null : getCityCostMultipliers(toCityCode),
    [toCityCode, hasCityDefaults]
  );
  const fromCityMultipliers = useMemo(
    () => currentCityDefaults ? null : getCityCostMultipliers(fromCityCode),
    [fromCityCode, currentCityDefaults]
  );

  useEffect(() => { setConditionalAnswers({}); }, [toCountry, incomeScenario]);

  useEffect(() => {
    const valid = fromCities.some(c => c.code === fromCityCode);
    if (!valid) setFromCityCode(fromCities[0]?.code ?? "");
  }, [fromCountry, fromCities, fromCityCode]);

  useEffect(() => {
    const valid = toCities.some(c => c.code === toCityCode);
    if (!valid) setToCityCode(toCities[0]?.code ?? "");
  }, [toCountry, toCities, toCityCode]);

  useEffect(() => {
    if (!selectedCityDefaults || !qsHydrated) return;
    const d = selectedCityDefaults;
    setDestinationRent(String(d.monthlyDefaults.rent));
    setDepositRequired(String(d.monthlyDefaults.rent * d.housing.depositMonths));
    setFirstMonthRent(String(d.monthlyDefaults.rent));
    setLastMonthRent(String(d.housing.lastMonthRentDefault));
    setUtilitiesIncluded(d.housing.utilitiesIncludedDefault);
    setGroceries(String(d.monthlyDefaults.groceries));
    setUtilities(String(d.monthlyDefaults.utilities));
    setTransportation(String(d.monthlyDefaults.transport));
    setCarCost(String(d.monthlyDefaults.car ?? CAR_COST_FALLBACK_USD));
    setHealthcare(String(d.monthlyDefaults.healthcare));
    setVisaCost(String(d.startupCosts.visa));
    setFlightCost(String(d.startupCosts.flight));
    setShippingCost(String(d.startupCosts.shipping));
    setTemporaryStay(String(d.startupCosts.temporaryStay));
    setAdminFees(String(d.startupCosts.adminFees));
    setFurnitureSetup(String(d.housing.furnishedSetupCost));
    setEmergencyCashBuffer(String(d.startupCosts.emergencyBuffer));
  }, [selectedCityDefaults, qsHydrated]);

  useEffect(() => {
    if (selectedCityDefaults || !qsHydrated) return;
    const d = CARIBBEAN_COST_DEFAULTS[toCountry];
    if (!d) return;
    setGroceries(String(d.groceries));
    setUtilities(String(d.utilities));
    setTransportation(String(d.transport));
    setHealthcare(String(d.healthcare));
  }, [toCountry, selectedCityDefaults, qsHydrated]);

  // ---------------------------------------------------------------------------
  // QS HYDRATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const qs = getQS();

    const vMode = qs.get("mode");
    if (vMode === "working" || vMode === "retired") setMode(vMode);

    const vFromCountry = qs.get("fromCountry");
    if (vFromCountry && getCountryByCode(vFromCountry)) setFromCountry(vFromCountry);

    const vToCountry = qs.get("toCountry");
    if (vToCountry && isCaribbeanCountryCode(vToCountry)) setToCountry(vToCountry);

    const vFromCity   = qs.get("fromCityCode"); if (vFromCity)   setFromCityCode(vFromCity);
    const vToCity     = qs.get("toCityCode");   if (vToCity)     setToCityCode(vToCity);
    const vSalary     = qs.get("salary");        if (vSalary)     setSalary(vSalary);
    const vRetirement = qs.get("retirement");    if (vRetirement) setRetirementIncome(vRetirement);

    const vCurrency = qs.get("currency") as CurrencyDisplay | null;
    if (vCurrency === "USD" || vCurrency === "CURRENT" || vCurrency === "DESTINATION") setCurrencyDisplay(vCurrency);

    const vSalaryType = qs.get("salaryType") as SalaryType | null;
    if (vSalaryType === "remote" || vSalaryType === "local") setSalaryType(vSalaryType);

    const vFiling = qs.get("filing") as FilingStatus | null;
    if (vFiling === "single" || vFiling === "married") setFiling(vFiling);

    const vAdults   = qs.get("adults");   if (vAdults)   setAdults(vAdults);
    const vChildren = qs.get("children"); if (vChildren) setChildren(vChildren);
    const vRent     = qs.get("rent");     if (vRent)     setDestinationRent(vRent);
    const vDeposit  = qs.get("deposit");  if (vDeposit)  setDepositRequired(vDeposit);
    const vFirst    = qs.get("firstRent"); if (vFirst)   setFirstMonthRent(vFirst);
    const vLast     = qs.get("lastRent");  if (vLast)    setLastMonthRent(vLast);

    const vFurnished = qs.get("furnished") as FurnishedType | null;
    if (vFurnished === "furnished" || vFurnished === "unfurnished") setFurnished(vFurnished);

    const vUtilIncl = qs.get("utilIncl") as YesNo | null;
    if (vUtilIncl === "yes" || vUtilIncl === "no") setUtilitiesIncluded(vUtilIncl);

    // FIX 5: read from "needCar" key (was "car")
    const vNeedCar = qs.get("needCar") as YesNo | null;
    if (vNeedCar === "yes" || vNeedCar === "no") setNeedCar(vNeedCar);

    const fields: [string, (v: string) => void][] = [
      ["groceries", setGroceries], ["utilities", setUtilities],
      ["transport", setTransportation], ["healthcare", setHealthcare],
      ["visa", setVisaCost], ["flight", setFlightCost], ["carCost", setCarCost],
      ["shipping", setShippingCost], ["tempStay", setTemporaryStay],
      ["admin", setAdminFees], ["furniture", setFurnitureSetup],
      ["emergency", setEmergencyCashBuffer], ["savings", setCurrentSavings],
    ];
    for (const [key, setter] of fields) { const val = qs.get(key); if (val) setter(val); }

    const vAnswers = qs.get("answers");
    if (vAnswers) { try { setConditionalAnswers(JSON.parse(vAnswers)); } catch {} }

    setQsHydrated(true);
  }, []);

  // ---------------------------------------------------------------------------
  // QS SYNC
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    qs.set("mode", mode); qs.set("filing", filing);
    qs.set("fromCountry", fromCountry); qs.set("toCountry", toCountry);
    if (fromCityCode) qs.set("fromCityCode", fromCityCode);
    if (toCityCode)   qs.set("toCityCode",   toCityCode);
    if (salary)           qs.set("salary",     salary);
    if (retirementIncome) qs.set("retirement", retirementIncome);
    qs.set("currency", currencyDisplay); qs.set("salaryType", salaryType);
    if (adults)   qs.set("adults",   adults);
    if (children) qs.set("children", children);
    if (carCost)  qs.set("carCost",  carCost);
    if (destinationRent)  qs.set("rent",      destinationRent);
    if (depositRequired)  qs.set("deposit",   depositRequired);
    if (firstMonthRent)   qs.set("firstRent", firstMonthRent);
    if (lastMonthRent)    qs.set("lastRent",  lastMonthRent);
    qs.set("furnished", furnished); qs.set("utilIncl", utilitiesIncluded);
    // FIX 5: use "needCar" key (was "car")
    qs.set("needCar", needCar);
    if (groceries)      qs.set("groceries", groceries);
    if (utilities)      qs.set("utilities", utilities);
    if (transportation) qs.set("transport", transportation);
    if (healthcare)     qs.set("healthcare", healthcare);
    if (visaCost)       qs.set("visa",      visaCost);
    if (flightCost)     qs.set("flight",    flightCost);
    if (shippingCost)   qs.set("shipping",  shippingCost);
    if (temporaryStay)  qs.set("tempStay",  temporaryStay);
    if (adminFees)      qs.set("admin",     adminFees);
    if (furnitureSetup) qs.set("furniture", furnitureSetup);
    if (emergencyCashBuffer) qs.set("emergency", emergencyCashBuffer);
    if (currentSavings)      qs.set("savings",   currentSavings);
    if (Object.keys(conditionalAnswers).length > 0) {
      qs.set("answers", JSON.stringify(conditionalAnswers));
    }
    setQS(qs);
  }, [
    mode, filing, fromCountry, toCountry, fromCityCode, toCityCode,
    salary, retirementIncome, currencyDisplay, salaryType, adults, children,
    destinationRent, depositRequired, firstMonthRent, lastMonthRent, furnished,
    // FIX 1: carCost added to dependency array
    utilitiesIncluded, groceries, utilities, transportation, carCost, healthcare, visaCost,
    flightCost, shippingCost, temporaryStay, adminFees, furnitureSetup,
    emergencyCashBuffer, currentSavings, conditionalAnswers, needCar,
  ]);

  const fallbackCosts = selectedCityDefaults?.monthlyDefaults ?? CARIBBEAN_COST_DEFAULTS[toCountry];

  // ---------------------------------------------------------------------------
  // RESULTS
  // ---------------------------------------------------------------------------
  const results = useMemo(() => {
    const baseAnnualIncome = mode === "retired" ? nz(retirementIncome) : nz(salary);
    const salaryReady      = baseAnnualIncome > 0;

    const annualIncome           = convertLocalToUsd(baseAnnualIncome, fromCountry);

    const grossMonthly           = annualIncome / 12;
    const annualIncomeForFromTax = convertUsdToLocal(annualIncome, fromCountry);

    // Tax: origin
    const currentTaxEstimate = estimateInternationalTax({
      countryCode: fromCountry,
      annualIncome: annualIncomeForFromTax,
      filing,
      isRetired: mode === "retired",
    });
    const currentTaxRate = currentTaxEstimate.effectiveRate;

    // Tax: destination
    let targetTaxEstimate: ReturnType<typeof estimateScenarioTax> | null = null;
    if (hasTaxConfig(toCountry)) {
      const config = getCountryTaxConfig(toCountry);
      if (config) {
        targetTaxEstimate = estimateScenarioTax({
          config,
          scenario: incomeScenario,
          grossIncomeLocalCurrency: convertUsdToLocal(annualIncome, toCountry),
          filingStatus: filing === "married" ? "married_joint" : "single",
          answers: conditionalAnswers,
        });
      }
    }

    const targetIsDisclaimer = targetTaxEstimate?.isDisclaimer ?? true;
    const targetConfidence   = targetTaxEstimate?.confidence   ?? ("pending" as Confidence);
    const targetTaxNotes     = targetTaxEstimate?.notes        ?? [];

    const targetAnnualTaxUsd =
      targetTaxEstimate && !targetIsDisclaimer
        ? convertLocalToUsd(targetTaxEstimate.tax, toCountry)
        : 0;

    const targetTaxRate       = annualIncome > 0 ? targetAnnualTaxUsd / annualIncome : 0;
    const currentAnnualTaxUsd = annualIncome * currentTaxRate;
    const currentAnnualNetUsd = annualIncome * (1 - currentTaxRate);
    const targetAnnualNetUsd  = annualIncome - targetAnnualTaxUsd;

    const currentMonthlyTaxUsd = currentAnnualTaxUsd / 12;
    const targetMonthlyTaxUsd  = targetAnnualTaxUsd  / 12;
    const netMonthlyFrom       = currentAnnualNetUsd  / 12;
    const netMonthlyTo         = targetAnnualNetUsd   / 12;
    const monthlyIncomeDiff    = netMonthlyTo - netMonthlyFrom;

    // Family scaling
    const adultCount  = Math.max(1, nz(adults));
    const childCount  = Math.max(0, nz(children));
    const extraAdults = adultCount - 1;

    function scaleFamily(baseUsd: number, category: keyof typeof COST_SCALING): number {
      const { adult, child } = COST_SCALING[category];
      return baseUsd * (1 + extraAdults * adult + childCount * child);
    }

    const fallbackCosts = selectedCityDefaults?.monthlyDefaults ?? CARIBBEAN_COST_DEFAULTS[toCountry];

const effectiveGroceries =
  groceries.trim() === "" ? fallbackCosts?.groceries ?? 0 : nz(groceries);


const effectiveUtilities =
  utilities.trim() === "" ? fallbackCosts?.utilities ?? 0 : nz(utilities);

const effectiveTransportation =
  transportation.trim() === "" ? fallbackCosts?.transport ?? 0 : nz(transportation);

const effectiveHealthcare =
  healthcare.trim() === "" ? fallbackCosts?.healthcare ?? 0 : nz(healthcare);

const familyGroceries      = scaleFamily(effectiveGroceries,      "groceries");
const familyTransportation = scaleFamily(effectiveTransportation, "transportation");
const familyHealthcare     = scaleFamily(effectiveHealthcare,     "healthcare");
const familyUtilities      = scaleFamily(effectiveUtilities,      "utilities");
    // Apply multipliers only when no city-specific defaults exist
    const applyMult = (val: number, mult: number | undefined) => mult != null ? val * mult : val;

const groceriesAdj = applyMult(
  familyGroceries,
  toCityMultipliers?.groceries
);

const transportationAdj = applyMult(
  familyTransportation,
  toCityMultipliers?.transit
);

const healthcareAdj = familyHealthcare;

const utilitiesAdj = applyMult(
  familyUtilities,
  toCityMultipliers?.utilities
);

const rentTo = applyMult(
  nz(destinationRent),
  toCityMultipliers?.housing
);

// Origin comparators
// Best case: use current-city defaults.
// Fallback: reverse-scale destination-entered values using cost indexes.
// This avoids assuming "$300 groceries in DR" also means "$300 groceries in NYC/Ohio/etc."

const currentProfile = getCountryByCode(fromCountry);
const targetProfile = getCountryByCode(toCountry);

const fromIndex =
  currentCityDefaults?.costIndex ??
  currentProfile?.monthlyCostIndexSingle ??
  1;

const toIndex =
  targetCityDefaults?.costIndex ??
  targetProfile?.monthlyCostIndexSingle ??
  1;

const reverseScaleToOrigin = (destinationValue: number) => {
  if (toIndex <= 0) return destinationValue;
  return destinationValue * (fromIndex / toIndex);
};

const originGroceriesBase =
  currentCityDefaults?.monthlyDefaults.groceries ??
  reverseScaleToOrigin(effectiveGroceries);

const originTransportationBase =
  currentCityDefaults?.monthlyDefaults.transport ??
  reverseScaleToOrigin(effectiveTransportation);

const originUtilitiesBase =
  currentCityDefaults?.monthlyDefaults.utilities ??
  reverseScaleToOrigin(effectiveUtilities);

const groceriesFrom = applyMult(
  scaleFamily(originGroceriesBase, "groceries"),
  fromCityMultipliers?.groceries
);

const transportationFrom = applyMult(
  scaleFamily(originTransportationBase, "transportation"),
  fromCityMultipliers?.transit
);

const utilitiesFrom = applyMult(
  scaleFamily(originUtilitiesBase, "utilities"),
  fromCityMultipliers?.utilities
);

    // FIX 2: clean car cost logic — user-entered carCost state takes priority,
    // falls back to city default, then global fallback constant.
    const monthlyCarCost =
  needCar === "yes"
    ? nz(carCost) || targetCityDefaults?.monthlyDefaults.car || CAR_COST_FALLBACK_USD
    : 0;

const housingUtilities = utilitiesIncluded === "yes" ? 0 : utilitiesAdj;

const housingTotal =
  rentTo + housingUtilities + monthlyCarCost;

const livingCosts =
  groceriesAdj + transportationAdj + healthcareAdj;

const totalMonthlyExpensesTo =
  housingTotal + livingCosts;

const monthlyFlexibility =
  netMonthlyTo - totalMonthlyExpensesTo;

const totalPctOfNet =
  netMonthlyTo > 0 ? totalMonthlyExpensesTo / netMonthlyTo : 0;

const housingPctOfNet =
  netMonthlyTo > 0 ? housingTotal / netMonthlyTo : 0;

const comfort =
  getReadinessBand(totalPctOfNet);

// Origin monthly comparison
const rentFrom =
  currentCityDefaults?.monthlyDefaults.rent ??
  reverseScaleToOrigin(nz(destinationRent));

const healthcareFrom =
  currentCityDefaults?.monthlyDefaults.healthcare ??
  reverseScaleToOrigin(effectiveHealthcare);

const totalMonthlyExpensesFrom =
  rentFrom +
  groceriesFrom +
  transportationFrom +
  utilitiesFrom +
  healthcareFrom;

const currentFlexibility =
  netMonthlyFrom - totalMonthlyExpensesFrom;

// One-time startup costs
const furnitureAdj =
  furnished === "furnished" ? 0 : nz(furnitureSetup);

const startupCosts =
  nz(depositRequired) +
  nz(firstMonthRent) +
  nz(lastMonthRent) +
  nz(visaCost) +
  nz(flightCost) +
  nz(shippingCost) +
  nz(temporaryStay) +
  nz(adminFees) +
  furnitureAdj;

const safetyNet =
  nz(emergencyCashBuffer);

const upfrontCashNeeded =
  startupCosts + safetyNet;

// Current savings are entered in origin currency, so convert to USD
const savingsUsd =
  convertLocalToUsd(nz(currentSavings), fromCountry);

const remainingSavingsAfterMove =
  savingsUsd - startupCosts;

const monthsCovered =
  totalMonthlyExpensesTo > 0 && remainingSavingsAfterMove > 0
    ? remainingSavingsAfterMove / totalMonthlyExpensesTo
    : 0;

// Comparable salary
const comparableSalary =
  fromIndex > 0 ? annualIncome * (toIndex / fromIndex) : annualIncome;

const relativeDifference =
  fromIndex > 0 ? (toIndex - fromIndex) / fromIndex : 0;

   return {
  salaryReady,
  annualIncome,
  grossMonthly,

  currentTaxRate,
  targetTaxRate,
  currentMonthlyTaxUsd,
  targetMonthlyTaxUsd,
  currentAnnualTaxUsd,
  targetAnnualTaxUsd,
  targetTaxNotes,
  targetIsDisclaimer,
  targetConfidence,

  netMonthlyFrom,
  netMonthlyTo,
  monthlyIncomeDiff,

  groceriesFrom,
  transportationFrom,
  utilitiesFrom,
  rentFrom,
  healthcareFrom,
  totalMonthlyExpensesFrom,
  currentFlexibility,

  groceriesAdj,
  transportationAdj,
  healthcareAdj,
  utilitiesAdj,
  housingTotal,
  rentTo,
  housingUtilities,
  carCost: monthlyCarCost,

  livingCosts,
  totalMonthlyExpensesTo,
  monthlyFlexibility,

  pct: housingPctOfNet * 100,
  totalPctOfNet: totalPctOfNet * 100,

  comfort,
  upfrontCashNeeded,
  startupCosts,
  safetyNet,
  monthsCovered,

  comparableSalary,
  relativeDifference,
};
  }, [
    mode, salary, retirementIncome, filing, incomeScenario,
    fromCountry, toCountry, conditionalAnswers,
    toCityMultipliers, fromCityMultipliers, currentCityDefaults, targetCityDefaults,
    adults, children, needCar, furnished, utilitiesIncluded,
    utilities, destinationRent, groceries, transportation, carCost, healthcare,
    depositRequired, firstMonthRent, lastMonthRent,
    visaCost, flightCost, shippingCost, temporaryStay, adminFees,
    furnitureSetup, emergencyCashBuffer, currentSavings,
  ]);

  const adultsNum   = Math.max(1, Number(adults)   || 1);
  const childrenNum = Math.max(0, Number(children) || 0);

  function resetInputsKeepContext() {
    const cityDefaults    = getCityDefaultsByCode(toCityCode);
    const countryDefaults = getCountryByCode(toCountry);
    setSalary(""); setRetirementIncome("");
    if (cityDefaults) {
      const d = cityDefaults;
      setDestinationRent(String(d.monthlyDefaults.rent));
      setDepositRequired(String(d.monthlyDefaults.rent * d.housing.depositMonths));
      setFirstMonthRent(String(d.monthlyDefaults.rent));
      setLastMonthRent(String(d.housing.lastMonthRentDefault));
      setUtilitiesIncluded(d.housing.utilitiesIncludedDefault);
      setGroceries(String(d.monthlyDefaults.groceries));
      setUtilities(String(d.monthlyDefaults.utilities));
      setTransportation(String(d.monthlyDefaults.transport));
      setCarCost(String(d.monthlyDefaults.car ?? CAR_COST_FALLBACK_USD));
      setHealthcare(String(d.monthlyDefaults.healthcare));
      setVisaCost(String(d.startupCosts.visa));
      setFlightCost(String(d.startupCosts.flight));
      setShippingCost(String(d.startupCosts.shipping));
      setTemporaryStay(String(d.startupCosts.temporaryStay));
      setAdminFees(String(d.startupCosts.adminFees));
      setFurnitureSetup(String(d.housing.furnishedSetupCost));
      setEmergencyCashBuffer(String(d.startupCosts.emergencyBuffer));
    } else if (countryDefaults) {
      const fallbackRent = adultsNum >= 2 || childrenNum > 0
        ? countryDefaults.defaultRentFamily
        : countryDefaults.defaultRentSingle;
      setDestinationRent(String(fallbackRent));
      setDepositRequired(String(fallbackRent * (countryDefaults.startupCosts.depositMonths ?? 1)));
      setFirstMonthRent(String(fallbackRent));
      setLastMonthRent("0"); setUtilitiesIncluded("no");
      setGroceries(""); setUtilities(""); setTransportation("");
      setHealthcare(String(adultsNum >= 2 || childrenNum > 0
        ? countryDefaults.healthcareMonthlyFamily
        : countryDefaults.healthcareMonthlySingle));
      setVisaCost(String(countryDefaults.startupCosts.visa));
      setFlightCost(String(countryDefaults.startupCosts.flight));
      setShippingCost(""); setTemporaryStay(String(countryDefaults.startupCosts.temporaryHousing));
      setAdminFees(""); setFurnitureSetup(String(countryDefaults.startupCosts.setup));
      setEmergencyCashBuffer("");
      // FIX 4: set carCost in country fallback reset
      setCarCost(String(CAR_COST_FALLBACK_USD));
    } else {
      setDestinationRent(""); setDepositRequired(""); setFirstMonthRent(""); setLastMonthRent("");
      setGroceries(""); setUtilities(""); setTransportation(""); setHealthcare("");
      setVisaCost(""); setFlightCost(""); setShippingCost(""); setTemporaryStay("");
      setAdminFees(""); setFurnitureSetup(""); setEmergencyCashBuffer("");
      // FIX 4: clear carCost in empty reset
      setCarCost("");
    }
    setCurrentSavings(""); setConditionalAnswers({});
  }

  const badge = confidenceBadge(results.targetConfidence);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold" />
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-700">
            <button type="button" onClick={() => setMode("working")}
              className={`rounded-lg px-3 py-1 text-sm ${mode === "working" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}>
              Working
            </button>
            <button type="button" onClick={() => setMode("retired")}
              className={`rounded-lg px-3 py-1 text-sm ${mode === "retired" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}>
              Retired
            </button>
          </div>
          <button type="button" onClick={resetInputsKeepContext}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Clear all fields">
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ================================================================
            LEFT — INPUTS
        ================================================================ */}
        <div className="space-y-3">

          {/* Income & Location */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Income &amp; Location</div>
            <div className="grid gap-3 sm:grid-cols-2">

              <label className="text-sm">
                <div className={labelHeadCls}>
                  {mode === "retired" ? "Gross annual retirement income" : "Gross annual salary"}{" "}
                  <span className="text-slate-400 dark:text-slate-500">({originCurrency})</span>
                </div>
                <input className={inputCls} type="number"
                  value={mode === "retired" ? retirementIncome : salary}
                  onChange={e => mode === "retired" ? setRetirementIncome(e.target.value) : setSalary(e.target.value)}
                  placeholder=" " />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Filing status</div>
                <select className={selectCls} value={filing} onChange={e => setFiling(e.target.value as FilingStatus)}>
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
                </select>
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Current country</div>
                <select className={selectCls} value={fromCountry} onChange={e => { setFromCountry(e.target.value); setFromCityCode(""); }}>
                  {allCountriesSorted.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>
                  Target country
                  <InfoTip align="right" text="Filtered to Caribbean destinations. Use the International or South America calculator for other regions." />
                </div>
                <select className={selectCls} value={toCountry} onChange={e => { setToCountry(e.target.value); setToCityCode(""); }}>
                  {caribbeanCountriesSorted.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>
                  Currency display
                  <InfoTip align="right" text="Choose how amounts appear. View in USD, your current country's currency, or your destination currency." />
                </div>
                <select className={selectCls} value={currencyDisplay} onChange={e => setCurrencyDisplay(e.target.value as CurrencyDisplay)}>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="CURRENT">Current currency ({COUNTRY_TO_CURRENCY[fromCountry] ?? "USD"})</option>
                  <option value="DESTINATION">Destination currency ({COUNTRY_TO_CURRENCY[toCountry] ?? "USD"})</option>
                </select>
              </label>

              <div className="text-sm">
                <div className={labelHeadCls}>
                  Income impact
                  <InfoTip align="right" text="Shows how your estimated monthly take-home pay changes between your current location and your Caribbean destination after taxes." />
                </div>
                <div className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 px-3 dark:border-slate-700">
                  {results.salaryReady ? (
                    <>
                      <span className={`font-semibold ${results.monthlyIncomeDiff > 0 ? "text-emerald-600 dark:text-emerald-400" : results.monthlyIncomeDiff < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
                        {results.monthlyIncomeDiff > 0 ? "+" : ""}{displayAmount(results.monthlyIncomeDiff, 0)}
                      </span>
                      <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {results.monthlyIncomeDiff > 0 ? "Higher" : results.monthlyIncomeDiff < 0 ? "Lower" : "Same"}
                      </span>
                    </>
                  ) : <span className="text-slate-400 dark:text-slate-500">—</span>}
                </div>
              </div>

              {mode === "working" && (
                <label className="text-sm sm:col-span-2">
                  <div className={labelHeadCls}>
                    Income type
                    <InfoTip align="right" text="Select how you earn income. This determines which tax scenario is used for the destination country." />
                  </div>
                  <select className={selectCls} value={salaryType} onChange={e => setSalaryType(e.target.value as SalaryType)}>
                    <option value="local">I earn locally in the destination country</option>
                    <option value="remote">I earn remotely / foreign-source income</option>
                  </select>
                </label>
              )}

              <label className="text-sm">
                <div className={labelHeadCls}>Current savings available ({originCurrency})</div>
                <input className={inputCls} type="number" value={currentSavings}
                  onChange={e => setCurrentSavings(e.target.value)} placeholder=" " />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Number of adults</div>
                <input className={inputCls} type="number" value={adults}
                  onChange={e => setAdults(e.target.value)} placeholder=" " />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Number of children</div>
                <input className={inputCls} type="number" value={children}
                  onChange={e => setChildren(e.target.value)} placeholder=" " />
              </label>

            </div>
          </div>

          {/* Dominican Republic residency question */}
          {toCountry === "DO" && incomeScenario === "remote" && (
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Dominican Republic — Residency</div>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  How long have you been a tax resident in the Dominican Republic?
                  <InfoTip text="The Dominican Republic generally exempts foreign-source income for new residents during the first three years of residency." />
                </div>
                <select className={selectCls}
                  value={conditionalAnswers["do_residency_years"] ?? ""}
                  onChange={e => setConditionalAnswers(prev => ({ ...prev, do_residency_years: e.target.value }))}>
                  <option value="">Select...</option>
                  <option value="under_3">Less than 3 years (foreign-source income generally exempt)</option>
                  <option value="3_or_more">3 years or more (foreign-source income may become taxable)</option>
                </select>
              </label>
            </div>
          )}

          {/* Housing */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Housing</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Rent in destination (monthly)</div>
                <input className={inputCls} type="number" value={destinationRent}
                  onChange={e => setDestinationRent(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Deposit required</div>
                <input className={inputCls} type="number" value={depositRequired}
                  onChange={e => setDepositRequired(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>First month rent</div>
                <input className={inputCls} type="number" value={firstMonthRent}
                  onChange={e => setFirstMonthRent(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Last month rent (if applicable)</div>
                <input className={inputCls} type="number" value={lastMonthRent}
                  onChange={e => setLastMonthRent(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Furnished or unfurnished</div>
                <select className={selectCls} value={furnished} onChange={e => setFurnished(e.target.value as FurnishedType)}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="furnished">Furnished</option>
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Utilities included?</div>
                <select className={selectCls} value={utilitiesIncluded} onChange={e => setUtilitiesIncluded(e.target.value as YesNo)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>
            <div className="mt-3 space-y-3">
              <label className="block text-sm">
                <div className={labelHeadCls}>Will you need a car?</div>
                <select className={selectCls} value={needCar} onChange={e => setNeedCar(e.target.value as YesNo)}>
                  <option value="no">No</option>
                  <option value="yes">Yes — add monthly car estimate</option>
                </select>
              </label>
              {/* FIX 3: visible editable input for car cost */}
              {needCar === "yes" && (
                <label className="block text-sm">
                  <div className={labelHeadCls}>Monthly car estimate</div>
                  <input className={inputCls} type="number" value={carCost}
                    onChange={e => setCarCost(e.target.value)} placeholder=" " />
                </label>
              )}
            </div>
          </div>

          {/* Estimated Living Costs */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Estimated Living Costs
              <InfoTip text="Adjusted for family size. City multipliers are only applied when no city-specific data exists." />
            </div>
            <div className="mt-3 space-y-3 text-[15px] text-slate-700 dark:text-slate-300">
              <label className="block text-sm">
  <div className={labelHeadCls}>Groceries</div>
  <input
    className={inputCls}
    type="number"
    value={groceries}
    onChange={e => setGroceries(e.target.value)}
    placeholder={`Average: ${displayAmount(fallbackCosts?.groceries ?? 0, 0)}`}
  />
</label>

<label className="block text-sm">
  <div className={labelHeadCls}>Utilities</div>
  <input
    className={inputCls}
    type="number"
    value={utilities}
    onChange={e => setUtilities(e.target.value)}
    placeholder={`Average: ${displayAmount(fallbackCosts?.utilities ?? 0, 0)}`}
  />
</label>

<label className="block text-sm">
  <div className={labelHeadCls}>Transportation</div>
  <input
    className={inputCls}
    type="number"
    value={transportation}
    onChange={e => setTransportation(e.target.value)}
    placeholder={`Average: ${displayAmount(fallbackCosts?.transport ?? 0, 0)}`}
  />
</label>

<label className="block text-sm">
  <div className={labelHeadCls}>Healthcare</div>
  <input
    className={inputCls}
    type="number"
    value={healthcare}
    onChange={e => setHealthcare(e.target.value)}
    placeholder={`Average: ${displayAmount(fallbackCosts?.healthcare ?? 0, 0)}`}
  />
</label>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Estimated costs adjust automatically based on the selected city.</div>
          </div>

          {/* One-Time Moving Costs */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">One-Time Moving Costs</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><div className={labelHeadCls}>Visa / permit estimate</div><input className={inputCls} type="number" value={visaCost} onChange={e => setVisaCost(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>One-way flight estimate</div><input className={inputCls} type="number" value={flightCost} onChange={e => setFlightCost(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Shipping / baggage estimate</div><input className={inputCls} type="number" value={shippingCost} onChange={e => setShippingCost(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Temporary housing estimate</div><input className={inputCls} type="number" value={temporaryStay} onChange={e => setTemporaryStay(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Setup / admin estimate</div><input className={inputCls} type="number" value={adminFees} onChange={e => setAdminFees(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Furniture / setup estimate</div><input className={inputCls} type="number" value={furnitureSetup} onChange={e => setFurnitureSetup(e.target.value)} placeholder=" " /></label>
              <label className="text-sm sm:col-span-2"><div className={labelHeadCls}>Recommended cash buffer</div><input className={inputCls} type="number" value={emergencyCashBuffer} onChange={e => setEmergencyCashBuffer(e.target.value)} placeholder=" " /></label>
            </div>
            <div className="mt-4 w-full text-xs text-slate-500 dark:text-slate-400">Planning estimates only.</div>
          </div>
        </div>

        {/* ================================================================
            RIGHT — RESULTS
        ================================================================ */}
        <div className="space-y-3">

          <RelocationVerdict results={results} toCityLabel={toCityLabel} displayAmount={displayAmount} />
          <VisaContextCard countryCode={toCountry} />

          {/* Main results */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Results</div>
            <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {CARIBBEAN_TAX_ASSUMPTIONS_LABEL} · Planning estimates only
            </div>
            <div className="mb-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div>Current country: <span className="font-semibold text-slate-900 dark:text-slate-100">{getCountryByCode(fromCountry)?.name ?? fromCountry}</span></div>
              <div>Target country:  <span className="font-semibold text-slate-900 dark:text-slate-100">{getCaribbeanCountryByCode(toCountry)?.name ?? toCountry}</span></div>
              <div>Income scenario: <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">{incomeScenario}</span></div>
            </div>

            <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
              <div>Net monthly (current): <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.netMonthlyFrom)}</span></div>
              <div>Net monthly (target):  <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.netMonthlyTo)}</span></div>

              {results.salaryReady && (
                <>
                  <div className="mt-2">Gross monthly: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.grossMonthly, 2)}</span></div>
                  <div>Est. taxes (current): <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.currentMonthlyTaxUsd, 2)}</span>{" "}
                    <span className="text-xs text-slate-500 dark:text-slate-400">({(results.currentTaxRate * 100).toFixed(1)}%)</span>
                  </div>
                  {results.targetIsDisclaimer ? (
                    <div className="text-slate-500 dark:text-slate-400 text-sm">Est. taxes (target): <span className="italic">See notes below</span></div>
                  ) : (
                    <div>Est. taxes (target): <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.targetMonthlyTaxUsd, 2)}</span>{" "}
                      <span className="text-xs text-slate-500 dark:text-slate-400">({(results.targetTaxRate * 100).toFixed(1)}%)</span>
                    </div>
                  )}

                  <div className="mt-3 rounded-2xl border border-teal-200 bg-teal-50/80 px-4 py-3 shadow-sm dark:border-teal-900/60 dark:bg-teal-950/20">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 font-semibold tracking-wide text-teal-700 ring-1 ring-teal-200 dark:bg-slate-800 dark:text-teal-300 dark:ring-teal-800">Tax model status</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badge.cls}`}>{badge.label}</span>
                      <InfoTip text="Describes how complete and verified the tax estimate is for this destination and scenario." />
                    </div>
                    {results.targetIsDisclaimer && (
                      <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">A tax estimate is not available for this scenario. See notes below.</div>
                    )}
                    {results.targetTaxNotes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {results.targetTaxNotes.map((note, i) => (
                          <div key={i} className="text-sm leading-6 text-slate-700 dark:text-slate-300">• {note}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">Monthly housing</div>
              <div className="grid gap-1 text-sm">
                <div>Rent: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.rentTo, 2)}</span></div>
                {results.housingUtilities > 0 && <div>Utilities gap: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.housingUtilities, 2)}</span></div>}
                {results.carCost > 0 && <div>Car: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.carCost, 2)}</span></div>}
                <div className="pt-1">Total housing: <span className="font-bold text-slate-900 dark:text-slate-100">{displayAmount(results.housingTotal, 2)}</span></div>
              </div>
              <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">Monthly living costs</div>
              <div>Total: <span className="font-bold text-slate-900 dark:text-slate-100">{displayAmount(results.livingCosts, 2)}</span></div>
              <div className="mt-2">Upfront cash needed: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.upfrontCashNeeded)}</span></div>
              <div>Months covered by savings: <span className="font-semibold text-slate-900 dark:text-slate-100">{Number.isFinite(results.monthsCovered) ? results.monthsCovered.toFixed(1) : "—"}</span></div>
              <div className="mt-2">Housing % of net (target): <span className="font-semibold text-slate-900 dark:text-slate-100">{Number.isFinite(results.pct) ? `${results.pct.toFixed(1)}%` : "—"}</span></div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 space-y-1">
              <div>Results are estimates only. No information entered is stored or shared.</div>
              <div>Tax estimates, rent, immigration costs, and retirement treatment vary by destination and personal circumstances.</div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Tip: Your URL updates as you type — copy the page link to share this scenario.</div>
          </div>

          {/* Monthly Flexibility */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-teal-900/60 dark:bg-teal-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">Monthly Flexibility</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {results.salaryReady ? displayAmount(results.monthlyFlexibility, 2) : "—"}
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200 dark:bg-slate-800 dark:text-teal-300 dark:ring-teal-800">
                After housing and essentials
              </div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-teal-100 dark:bg-slate-800/80 dark:ring-teal-900/40">
              <div className={`h-full rounded-full ${
                !results.salaryReady                         ? "w-[0%]  bg-slate-300"
                : results.monthlyFlexibility >= 3000        ? "w-[92%] bg-emerald-500"
                : results.monthlyFlexibility >= 2000        ? "w-[76%] bg-emerald-400"
                : results.monthlyFlexibility >= 1000        ? "w-[58%] bg-amber-400"
                : results.monthlyFlexibility >= 500         ? "w-[40%] bg-orange-400"
                :                                             "w-[24%] bg-rose-400"
              }`} />
            </div>
            <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              {!results.salaryReady
                ? "Add salary and housing inputs to estimate how much room you have left each month."
                : `This is what you may have left each month in ${toCityLabel} after housing costs and core living expenses.`}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Higher flexibility gives you more room for saving, investing, travel, and unexpected expenses.</div>
          </div>

          {/* Comparable Salary */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">COMPARABLE SALARY</div>
            <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{displayAmount(results.comparableSalary)}</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {toCityLabel} is roughly{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{Math.abs(Math.round(results.relativeDifference * 100))}%</span>{" "}
              {results.relativeDifference >= 0 ? "more" : "less"} expensive than {fromCityLabel}.
            </p>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Based on housing, transportation, healthcare, and essential cost weighting.</div>
          </div>

          {/* Comfort Score */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-teal-900/60 dark:bg-teal-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">
                  {mode === "retired" ? "Retirement Readiness Score" : "Comfort Score™"}
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {results.comfort.band} · {results.comfort.label}
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200 dark:bg-slate-800 dark:text-teal-300 dark:ring-teal-800">
                Housing &amp; living costs
              </div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-teal-100 dark:bg-slate-800/80 dark:ring-teal-900/40">
              <div className={`h-full rounded-full ${
                results.comfort.band === "A" ? "w-[92%] bg-emerald-500"
                : results.comfort.band === "B" ? "w-[78%] bg-emerald-400"
                : results.comfort.band === "C" ? "w-[60%] bg-amber-400"
                :                               "w-[42%] bg-orange-400"
              }`} />
            </div>
            <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">{results.comfort.note}</div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Based on how much of your target net monthly income goes toward housing and core living costs.
            </div>
          </div>

          {/* Share */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-teal-900/60 dark:bg-teal-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">Share this scenario</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current comparison link and send it to a partner, friend, or future self.</div>
              </div>
              <button type="button"
                onClick={async () => {
                  try {
                    const shareUrl  = new URL(window.location.href);
                    const shareText = `My Caribbean relocation scenario: ${fromCityLabel} → ${toCityLabel}. Monthly flexibility ${displayAmount(results.monthlyFlexibility, 0)} after housing.`;
                    const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                    if (canNativeShare) {
                      await (navigator as any).share({ title: "My Caribbean Relocation Scenario", text: shareText, url: shareUrl.toString() });
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
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                {shareStatus === "copied" ? "Link copied!" : shareStatus === "shared" ? "Shared!" : shareStatus === "error" ? "Share failed" : "Share scenario"}
              </button>
            </div>
          </div>

          <SavedScenariosPanel getCurrentScenario={() => ({
            label: `${fromCityLabel} → ${toCityLabel}`,
            url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
            subtitle: `${results.comfort.label} · ${displayAmount(results.monthlyFlexibility, 0)}/mo flexibility`,
            source: "Caribbean",
          })} />

          {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
  <AdSlot
    slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP}
    className="my-8"
  />
) : null}
        </div>
      </div>
    </div>
  );
}
