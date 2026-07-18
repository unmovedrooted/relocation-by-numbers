"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CalculatorImmediateNumberField from "./calculator-form/CalculatorImmediateNumberField";
import CalculatorSelect from "./calculator-form/CalculatorSelect";
import {
  INTERNATIONAL_COUNTRIES,
  getCountryByCode,
} from "@/lib/internationalCountries";
import {
  citiesForCountry,
  getInternationalCityByCode,
} from "@/lib/internationalCities";
import { getCityDefaultsByCode } from "@/lib/internationalCityDefaults";
import { estimateInternationalTax } from "@/lib/internationalTaxes";
import { getCityCostMultipliers } from "@/lib/internationalCityCosts";
import { USD_TO_LOCAL } from "@/lib/internationalFx";
import { calculateSouthAmericaCarCost } from "@/lib/southAmericaCarCost";
import AdSlot from "./AdSlot";

// ---------------------------------------------------------------------------
// SOUTH AMERICA CONFIG
// ---------------------------------------------------------------------------

const SOUTH_AMERICA_COUNTRY_CODES = new Set([
  "CO", "BR", "AR", "CL", "PE", "EC", "UY", "PY", "BO", "GY","SR", "VE",
]);

const SOUTH_AMERICA_VISA_CONTEXT: Record<string, {
  program: string;
  notes: string;
  estimatedFee: number;
  icon: string;
  highlight?: string;
  warning?: string;
}> = {
  CO: {
    icon: "🇨🇴",
    program: "Digital Nomad Visa / Pensionado / Migrant Visa",
    highlight: "Digital Nomad Visa — $800/mo",
    notes: "Colombia's Digital Nomad Visa (V) is one of the most accessible in the world — remote workers earning just $800+/mo qualify for a 2-year renewable stay. Pensionado Visa requires $700+/mo in pension income. Migrant Visa (M) leads to permanent residency after 5 years of continuous stay. Medellín and Bogotá are the continent's top expat hubs. Cost of living is very low by North American and European standards.",
    estimatedFee: 160,
  },
  BR: {
    icon: "🇧🇷",
    program: "Digital Nomad Visa / Retirement Visa / VITEM V",
    highlight: "Digital Nomad Visa",
    notes: "Brazil's Digital Nomad Visa requires $1,500/mo income and is valid for 1 year, renewable for another year. Retirement Visa (Aposentado) needs $2,000/mo pension income. VITEM V is a temporary work visa for those with a job offer. Brazil is the continent's largest economy — São Paulo is a global city, while smaller cities like Florianópolis and Curitiba offer excellent quality of life at lower costs.",
    estimatedFee: 180,
  },
  AR: {
    icon: "🇦🇷",
    program: "Rentista Visa / Pensionado / Digital Nomad (Nómade Digital)",
    highlight: "Rentista Visa",
    warning: "Argentina's parallel exchange rate means your USD purchasing power is often significantly higher than official rates suggest. Verify current rates before planning.",
    notes: "Argentina's Rentista Visa requires proof of regular income (~$800/mo). Pensionado Visa for retirees. Argentina launched a Digital Nomad Visa (Nómade Digital) in 2022. High inflation and periodic economic instability are key considerations — many expats hold USD savings and convert as needed. Buenos Aires remains one of the most culturally rich cities in the Americas at a fraction of Western costs.",
    estimatedFee: 180,
  },
  CL: {
    icon: "🇨🇱",
    program: "Temporary Residence / Digital Nomad Visa",
    highlight: "Digital Nomad Visa",
    notes: "Chile is one of the more stable and developed economies in South America. Santiago offers a high quality of life, though at a higher cost than many other regional destinations. Remote-work and temporary residence pathways may be available depending on citizenship, income, and current immigration rules, so verify requirements directly before planning around them.",
    estimatedFee: 180,
  },
  PE: {
    icon: "🇵🇪",
    program: "Temporary Residence / Rentista Visa",
    highlight: "Rentista Visa",
    notes: "Peru's Rentista Visa is available for those with $1,000+/mo in passive income. Temporary Residence can be obtained with a job offer or business registration. No dedicated digital nomad visa yet — many remote workers use tourist visa extensions (183 days). Lima has a growing expat scene and world-class cuisine. Cusco and Arequipa are popular alternatives with lower costs and high quality of life.",
    estimatedFee: 150,
  },
  EC: {
  icon: "🇪🇨",
  program: "Temporary Residence / Pensioner Visa / Rentista",
  highlight: "Pensioner visa option",
  notes: "Ecuador is popular with retirees and remote workers because of its lower living costs and established expat communities in Quito, Cuenca, and Manta. Pensioner and rentista-style residency paths are common planning routes. Ecuador is dollarized — no currency conversion complexity. Healthcare and rent can be materially lower than in many North American cities.",
  estimatedFee: 150,
},
UY: {
  icon: "🇺🇾",
  program: "Temporary Residence / Residency by Income",
  highlight: "Stable residency path",
  notes: "Uruguay is one of the most stable and institutionally predictable countries in South America. Montevideo is the main expat hub, with Punta del Este attracting retirees and higher-budget movers. Costs are often higher than elsewhere in the region, but governance, infrastructure, and quality of life are major draws.",
  estimatedFee: 180,
},
PY: {
  icon: "🇵🇾",
  program: "Temporary Residence / Permanent Residency Path",
  highlight: "Territorial tax system — low tax burden",
  notes: "Paraguay is often considered by budget-conscious movers because housing and day-to-day costs can be relatively low. Asunción is the main relocation hub. Paraguay's territorial tax system may mean foreign-source income is treated differently from locally-earned income — but tax treatment depends on your specific situation and residency status. Verify with a local advisor before treating this as a planning assumption.",
  estimatedFee: 140,
},
BO: {
  icon: "🇧🇴",
  program: "Temporary Residence / Work or Income-Based Residency",
  highlight: "Lower-cost destination",
  notes: "Bolivia can offer some of the lowest living costs in South America, especially outside premium neighborhoods in La Paz and Santa Cruz. Administrative processes can be slower and less standardized than in neighboring countries, so budget extra time and cash buffer for setup.",
  estimatedFee: 140,
},
GY: {
  icon: "🇬🇾",
  program: "Temporary Stay / Work Permit / Residency",
  highlight: "English-speaking destination",
  notes: "Guyana stands out as the only English-speaking country in South America. Georgetown is the main destination for expats and business relocations. Costs can be less predictable than expected — especially for imported goods and expat-oriented housing — so use a conservative budget buffer.",
  estimatedFee: 170,
},
SR: {
  icon: "🇸🇷",
  program: "Temporary Residence / Work or Family-Based Residency",
  highlight: "Smaller, emerging expat market",
  notes: "Suriname is a smaller relocation market with more limited mainstream expat data than larger South American countries. Paramaribo is the key planning city. Treat all cost and tax estimates as simplified planning figures and verify locally before committing.",
  estimatedFee: 160,
},
VE: {
  icon: "🇻🇪",
  program: "Temporary Residence / Work or Family-Based Residency",
  highlight: "Use with extra caution — simplified estimates only",
  warning: "Exchange rate volatility, inflation, and policy changes can make all planning estimates stale very quickly. Verify every assumption independently before making any decisions.",
  notes: "Venezuela is included for geographic completeness. All cost, tax, and currency figures here are simplified planning estimates and should be treated as directional only. FX controls, rapid inflation, and policy changes mean assumptions can become stale quickly. Verify every figure independently before using this for any planning decision.",
  estimatedFee: 150,
},
};

function convertLocalToUsd(amountLocal: number, countryCode: string): number {
  const rate = USD_TO_LOCAL[countryCode] ?? 1;
  return rate > 0 ? amountLocal / rate : amountLocal;
}

function convertUsdToLocal(amountUsd: number, countryCode: string): number {
  const rate = USD_TO_LOCAL[countryCode] ?? 1;
  return amountUsd * rate;
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", PT: "EUR", ES: "EUR", MX: "MXN", CA: "CAD",
  DE: "EUR", NL: "EUR", CR: "CRC", FR: "EUR", IT: "EUR", IE: "EUR",
  AU: "AUD", NZ: "NZD", JP: "JPY", KR: "KRW", AE: "AED", SG: "SGD",
  CH: "CHF", DK: "DKK", SE: "SEK", NO: "NOK", FI: "EUR", PL: "PLN",
  CZ: "CZK", HU: "HUF", GR: "EUR", TR: "TRY", HR: "EUR", EE: "EUR",
  LV: "EUR", LT: "EUR", RO: "RON", BG: "BGN", SI: "EUR", SK: "EUR",
  MT: "EUR", CY: "EUR", PA: "USD", CO: "COP", BR: "BRL", AR: "ARS",
  CL: "CLP", PE: "PEN", TH: "THB", VN: "VND", MY: "MYR", ID: "IDR",
  ZA: "ZAR", AT: "EUR", BE: "EUR", EC: "USD", UY: "UYU", PY: "PYG", 
  BO: "BOB", GY: "GYD", SR: "SRD", VE: "VES",
};

type Mode = "working" | "retired";
type FilingStatus = "single" | "married";
type SalaryType = "remote" | "local" | "freelance";
type FurnishedType = "furnished" | "unfurnished";
type YesNo = "yes" | "no";
type CurrencyDisplay = "USD" | "CURRENT" | "DESTINATION";

function money(n: number, digits: number = 0, currency: string = "USD") {
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
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

// FIX 3: Updated thresholds for housing + living costs combined
function getReadinessBand(ratio: number) {
  if (ratio <= 0.60) return { band: "A", label: "Comfortable", note: "Total essential costs look healthy relative to your estimated net income." };
  if (ratio <= 0.75) return { band: "B", label: "Manageable", note: "Doable, but keep an eye on recurring costs and setup cash." };
  if (ratio <= 0.90) return { band: "C", label: "Tight", note: "Possible, but the margin for error is thinner." };
  return { band: "D", label: "Stretched", note: "Essential costs are taking up a very large share of the budget." };
}

function getSalaryTypeMultiplier(salaryType: SalaryType) {
  if (salaryType === "local") return 0.9;
  if (salaryType === "freelance") return 0.82;
  return 1;
}

const inputCls = "h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 ring-1 ring-slate-200 dark:ring-slate-800 shadow-inner outline-none transition focus:bg-white focus:dark:bg-slate-900 focus:ring-4 focus:ring-amber-500/15 focus:dark:ring-amber-500/15";
const selectCls = "h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-inner ring-1 ring-slate-200 dark:ring-slate-800 outline-none transition focus:bg-white focus:dark:bg-slate-900 focus:ring-4 focus:ring-amber-500/15 focus:dark:ring-amber-500/15";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600 dark:text-slate-400";

function InfoTip({ text, align = "left" }: { text: string; align?: "left" | "right" | "center" }) {
  const positionClass = align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button type="button" aria-label="More info" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow-sm transition hover:bg-slate-50 hover:dark:bg-slate-950">
        i
      </button>
      <span className={`pointer-events-none absolute top-full z-50 mt-2 hidden max-w-[calc(100vw-2rem)] w-72 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-5 text-white shadow-xl group-hover:block group-focus-within:block ${positionClass}`}>
        {text}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// VISA CONTEXT CARD — South America-specific
// ---------------------------------------------------------------------------
function VisaContextCard({ countryCode }: { countryCode: string }) {
  const ctx = SOUTH_AMERICA_VISA_CONTEXT[countryCode];
  if (!ctx) return null;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 text-xl">{ctx.icon}</div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
            Visa &amp; Permit Context
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{ctx.program}</div>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{ctx.notes}</p>

          {ctx.warning && (
            <div className="mt-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/40 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-200">
              ⚠️ {ctx.warning}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3">
            {ctx.highlight && (
              <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800">
                {ctx.highlight}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-800">
              Est. permit fee: {money(ctx.estimatedFee, 0, "USD")}
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Visa requirements vary by citizenship and change frequently. Always verify with official government sources and an immigration attorney.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function SouthAmericaRelocationCalculator() {
  const hasMounted = useRef(false);
  // FIX 4: Prevent city defaults from overwriting QS-restored custom values
  const restoredFromUrl = useRef(false);
const lastDefaultsCityCode = useRef<string | null>(null);
  const [qsHydrated, setQsHydrated] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const [mode, setMode] = useState<Mode>("working");
  const [salary, setSalary] = useState<string>("150000");
  const [retirementIncome, setRetirementIncome] = useState<string>("70000");
  const [filing, setFiling] = useState<FilingStatus>("single");

  // Default: from US NYC, to Medellín
  const [fromCountry, setFromCountry] = useState<string>("US");
  const [toCountry, setToCountry] = useState<string>("CO");
  const [fromCityCode, setFromCityCode] = useState<string>("US-NYC");
  const [toCityCode, setToCityCode] = useState<string>("CO-MDE");

  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>("USD");
  const [salaryType, setSalaryType] = useState<SalaryType>("remote");
  const [adults, setAdults] = useState<string>("1");
  const [children, setChildren] = useState<string>("0");

  const [destinationRent, setDestinationRent] = useState<string>("550");
  const [depositRequired, setDepositRequired] = useState<string>("550");
  const [firstMonthRent, setFirstMonthRent] = useState<string>("550");
  const [lastMonthRent, setLastMonthRent] = useState<string>("0");
  const [furnished, setFurnished] = useState<FurnishedType>("unfurnished");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<YesNo>("no");

  const [groceries, setGroceries] = useState<string>("250");
  const [utilities, setUtilities] = useState<string>("80");
  const [transportation, setTransportation] = useState<string>("60");
  const [healthcare, setHealthcare] = useState<string>("90");

  const [visaCost, setVisaCost] = useState<string>("160");
  const [flightCost, setFlightCost] = useState<string>("450");
  const [shippingCost, setShippingCost] = useState<string>("400");
  const [temporaryStay, setTemporaryStay] = useState<string>("1200");
  const [adminFees, setAdminFees] = useState<string>("200");
  const [furnitureSetup, setFurnitureSetup] = useState<string>("900");
  const [emergencyCashBuffer, setEmergencyCashBuffer] = useState<string>("3500");
  const [currentSavings, setCurrentSavings] = useState<string>("25000");
  const [needCar, setNeedCar] = useState<YesNo>("no");
  const [carCostMonthly, setCarCostMonthly] = useState<string>("350");

  const nz = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

  const allCountriesSorted = useMemo(() =>
    [...INTERNATIONAL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)), []
  );

  const southAmericaCountriesSorted = useMemo(() =>
    [...INTERNATIONAL_COUNTRIES]
      .filter(c => SOUTH_AMERICA_COUNTRY_CODES.has(c.code))
      .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const fromCities = useMemo(() =>
    [...citiesForCountry(fromCountry)].sort((a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" })
    ), [fromCountry]
  );

  const toCities = useMemo(() =>
    [...citiesForCountry(toCountry)].sort((a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" })
    ), [toCountry]
  );

  const originCurrency = COUNTRY_TO_CURRENCY[fromCountry] ?? "USD";

  const displayAmount = (amountUsd: number, digits: number = 0) => {
    if (currencyDisplay === "CURRENT") return money(convertUsdToLocal(amountUsd, fromCountry), digits, COUNTRY_TO_CURRENCY[fromCountry] ?? "USD");
    if (currencyDisplay === "DESTINATION") return money(convertUsdToLocal(amountUsd, toCountry), digits, COUNTRY_TO_CURRENCY[toCountry] ?? "USD");
    return money(amountUsd, digits, "USD");
  };

  const fromCityLabel = getInternationalCityByCode(fromCityCode)?.name ?? "Current city";
  const toCityLabel = getInternationalCityByCode(toCityCode)?.name ?? "Target city";

  const selectedCityDefaults = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);
  const currentCityDefaults = useMemo(() => getCityDefaultsByCode(fromCityCode), [fromCityCode]);
  const targetCityDefaults = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);
  const fromCityMultipliers = useMemo(() => getCityCostMultipliers(fromCityCode), [fromCityCode]);
  const toCityMultipliers = useMemo(() => getCityCostMultipliers(toCityCode), [toCityCode]);

  useEffect(() => {
    const valid = fromCities.some(c => c.code === fromCityCode);
    if (!valid) setFromCityCode(fromCities[0]?.code ?? "");
  }, [fromCountry, fromCities, fromCityCode]);

  useEffect(() => {
    const valid = toCities.some(c => c.code === toCityCode);
    if (!valid) setToCityCode(toCities[0]?.code ?? "");
  }, [toCountry, toCities, toCityCode]);

  // FIX 4: Only apply city defaults on first load, not on every city change
  useEffect(() => {
  if (!selectedCityDefaults || !qsHydrated) return;

  const cityChanged = lastDefaultsCityCode.current !== toCityCode;
  if (!cityChanged) return;

  lastDefaultsCityCode.current = toCityCode;

  // If user loaded a shared URL, do not overwrite restored values on first hydration.
  if (restoredFromUrl.current) {
    restoredFromUrl.current = false;
    return;
  }

  const d = selectedCityDefaults;

  setDestinationRent(String(d.monthlyDefaults.rent));
  setDepositRequired(String(d.monthlyDefaults.rent * d.housing.depositMonths));
  setFirstMonthRent(String(d.monthlyDefaults.rent));
  setLastMonthRent(String(d.housing.lastMonthRentDefault));
  setUtilitiesIncluded(d.housing.utilitiesIncludedDefault);
  setGroceries(String(d.monthlyDefaults.groceries));
  setUtilities(String(d.monthlyDefaults.utilities));
  setTransportation(String(d.monthlyDefaults.transport));
  setHealthcare(String(d.monthlyDefaults.healthcare));
  setVisaCost(String(d.startupCosts.visa));
  setFlightCost(String(d.startupCosts.flight));
  setShippingCost(String(d.startupCosts.shipping));
  setTemporaryStay(String(d.startupCosts.temporaryStay));
  setAdminFees(String(d.startupCosts.adminFees));
  setFurnitureSetup(String(d.housing.furnishedSetupCost));
  setEmergencyCashBuffer(String(d.startupCosts.emergencyBuffer));
}, [selectedCityDefaults, qsHydrated, toCityCode]);

  useEffect(() => {
  const qs = getQS();
  restoredFromUrl.current = qs.toString().length > 0;

  const vMode = qs.get("mode");
  if (vMode === "working" || vMode === "retired") setMode(vMode);

    const vFiling = qs.get("filing") as FilingStatus | null; if (vFiling === "single" || vFiling === "married") setFiling(vFiling);
    const vFromCountry = qs.get("fromCountry"); if (vFromCountry) setFromCountry(vFromCountry);
    const vToCountry = qs.get("toCountry"); if (vToCountry && SOUTH_AMERICA_COUNTRY_CODES.has(vToCountry)) setToCountry(vToCountry);
    const vFromCity = qs.get("fromCityCode"); if (vFromCity) setFromCityCode(vFromCity);
    const vToCity = qs.get("toCityCode"); if (vToCity) setToCityCode(vToCity);
    const vSalary = qs.get("salary"); if (vSalary) setSalary(vSalary);
    const vRetirement = qs.get("retirement"); if (vRetirement) setRetirementIncome(vRetirement);
    const vCurrency = qs.get("currency") as CurrencyDisplay | null; if (vCurrency === "USD" || vCurrency === "CURRENT" || vCurrency === "DESTINATION") setCurrencyDisplay(vCurrency);
    const vSalaryType = qs.get("salaryType") as SalaryType | null; if (vSalaryType === "remote" || vSalaryType === "local" || vSalaryType === "freelance") setSalaryType(vSalaryType);
    const vAdults = qs.get("adults"); if (vAdults) setAdults(vAdults);
    const vChildren = qs.get("children"); if (vChildren) setChildren(vChildren);
    const vRent = qs.get("rent"); if (vRent) setDestinationRent(vRent);
    const vDeposit = qs.get("deposit"); if (vDeposit) setDepositRequired(vDeposit);
    const vFirst = qs.get("firstRent"); if (vFirst) setFirstMonthRent(vFirst);
    const vLast = qs.get("lastRent"); if (vLast) setLastMonthRent(vLast);
    const vFurnished = qs.get("furnished") as FurnishedType | null; if (vFurnished === "furnished" || vFurnished === "unfurnished") setFurnished(vFurnished);
    const vUtilIncl = qs.get("utilIncl") as YesNo | null; if (vUtilIncl === "yes" || vUtilIncl === "no") setUtilitiesIncluded(vUtilIncl);
    const fields: [string, (v: string) => void][] = [
      ["groceries", setGroceries], ["utilities", setUtilities], ["transport", setTransportation],
      ["healthcare", setHealthcare], ["visa", setVisaCost], ["flight", setFlightCost],
      ["shipping", setShippingCost], ["tempStay", setTemporaryStay], ["admin", setAdminFees],
      ["furniture", setFurnitureSetup], ["emergency", setEmergencyCashBuffer], ["savings", setCurrentSavings],
      ["carCost", setCarCostMonthly],
    ];
    for (const [key, setter] of fields) { const val = qs.get(key); if (val) setter(val); }
    const vCar = qs.get("car") as YesNo | null; if (vCar === "yes" || vCar === "no") setNeedCar(vCar);
    setQsHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const qs = new URLSearchParams();
    qs.set("mode", mode); qs.set("filing", filing);
    qs.set("fromCountry", fromCountry); qs.set("toCountry", toCountry);
    if (fromCityCode) qs.set("fromCityCode", fromCityCode);
    if (toCityCode) qs.set("toCityCode", toCityCode);
    if (salary) qs.set("salary", salary);
    if (retirementIncome) qs.set("retirement", retirementIncome);
    qs.set("currency", currencyDisplay); qs.set("salaryType", salaryType);
    if (adults) qs.set("adults", adults); if (children) qs.set("children", children);
    if (destinationRent) qs.set("rent", destinationRent);
    if (depositRequired) qs.set("deposit", depositRequired);
    if (firstMonthRent) qs.set("firstRent", firstMonthRent);
    if (lastMonthRent) qs.set("lastRent", lastMonthRent);
    qs.set("furnished", furnished); qs.set("utilIncl", utilitiesIncluded);
    if (groceries) qs.set("groceries", groceries); if (utilities) qs.set("utilities", utilities);
    if (transportation) qs.set("transport", transportation); if (healthcare) qs.set("healthcare", healthcare);
    if (visaCost) qs.set("visa", visaCost); if (flightCost) qs.set("flight", flightCost);
    if (shippingCost) qs.set("shipping", shippingCost); if (temporaryStay) qs.set("tempStay", temporaryStay);
    if (adminFees) qs.set("admin", adminFees); if (furnitureSetup) qs.set("furniture", furnitureSetup);
    if (emergencyCashBuffer) qs.set("emergency", emergencyCashBuffer);
    if (currentSavings) qs.set("savings", currentSavings);
    qs.set("car", needCar);
    if (carCostMonthly) qs.set("carCost", carCostMonthly);
    setQS(qs);
  }, [
    mode, filing, fromCountry, toCountry, fromCityCode, toCityCode,
    salary, retirementIncome, currencyDisplay, salaryType, adults, children,
    destinationRent, depositRequired, firstMonthRent, lastMonthRent, furnished,
    utilitiesIncluded, groceries, utilities, transportation, healthcare, visaCost,
    flightCost, shippingCost, temporaryStay, adminFees, furnitureSetup,
    emergencyCashBuffer, currentSavings, needCar, carCostMonthly,
  ]);

  const targetProfile = getCountryByCode(toCountry);

  const results = useMemo(() => {
    const baseAnnualIncome = mode === "retired" ? nz(retirementIncome) : nz(salary);
    const salaryReady = baseAnnualIncome > 0;
    const salaryTypeMultiplier = mode === "retired" ? 1 : getSalaryTypeMultiplier(salaryType);
    const annualIncomeLocalOrigin = baseAnnualIncome * salaryTypeMultiplier;
   const annualIncome = convertLocalToUsd(annualIncomeLocalOrigin, fromCountry);

const destToUsd = (v: number) => convertLocalToUsd(v, toCountry);
const originToUsd = (v: number) => convertLocalToUsd(v, fromCountry);

const grossMonthly = annualIncome / 12;

    const annualIncomeForFromTax = convertUsdToLocal(annualIncome, fromCountry);
    const annualIncomeForToTax = convertUsdToLocal(annualIncome, toCountry);

    const currentTaxEstimate = estimateInternationalTax({ countryCode: fromCountry, annualIncome: annualIncomeForFromTax, filing, isRetired: mode === "retired" });
    const targetTaxEstimate = estimateInternationalTax({ countryCode: toCountry, annualIncome: annualIncomeForToTax, filing, isRetired: mode === "retired" });

    const currentTaxRate = currentTaxEstimate.effectiveRate;
    const targetTaxRate = targetTaxEstimate.effectiveRate;
    const netMonthlyFrom = grossMonthly * (1 - currentTaxRate);
    const netMonthlyTo = grossMonthly * (1 - targetTaxRate);
    const monthlyIncomeDiff = netMonthlyTo - netMonthlyFrom;

    const adultCount = Math.max(1, nz(adults));
    const childCount = Math.max(0, nz(children));
  const familyGroceries =
  destToUsd(nz(groceries)) *
  (1 + (adultCount - 1) * 0.55 + childCount * 0.35);

const familyTransportation =
  destToUsd(nz(transportation)) *
  (1 + (adultCount - 1) * 0.35 + childCount * 0.15);

const healthcareAdj =
  destToUsd(nz(healthcare)) *
  (1 + (adultCount - 1) * 0.7 + childCount * 0.5);

const familyUtilities =
  destToUsd(nz(utilities)) *
  (1 + (adultCount - 1) * 0.25 + childCount * 0.15);

const groceriesAdj = familyGroceries * toCityMultipliers.groceries;
const transportationAdj = familyTransportation * toCityMultipliers.transit;
const utilitiesAdj = familyUtilities * toCityMultipliers.utilities;
const rentTo = destToUsd(nz(destinationRent)) * toCityMultipliers.housing;

const groceriesFrom = familyGroceries * fromCityMultipliers.groceries;
const transportationFrom = familyTransportation * fromCityMultipliers.transit;
const utilitiesFrom = familyUtilities * fromCityMultipliers.utilities;

    const carCost = calculateSouthAmericaCarCost(needCar, carCostMonthly, destToUsd);
    const housingUtilities = utilitiesIncluded === "yes" ? 0 : utilitiesAdj;
    const housingTotal = rentTo + housingUtilities + carCost;
    const livingCosts = groceriesAdj + transportationAdj + healthcareAdj;
    const monthlyFlexibility = netMonthlyTo - housingTotal - livingCosts;

    // FIX 2: Use housing + living costs combined for readiness score
    const totalPctOfNet = netMonthlyTo > 0
      ? (housingTotal + livingCosts) / netMonthlyTo
      : 0;
    // FIX 3: getReadinessBand now uses the updated combined-cost thresholds
    const comfort = getReadinessBand(totalPctOfNet);

    const furnitureAdj = furnished === "furnished" ? 0 : nz(furnitureSetup);
    const upfrontCashNeeded =
  destToUsd(nz(depositRequired)) +
  destToUsd(nz(firstMonthRent)) +
  destToUsd(nz(lastMonthRent)) +
  destToUsd(nz(visaCost)) +
  nz(flightCost) +
  destToUsd(nz(shippingCost)) +
  destToUsd(nz(temporaryStay)) +
  destToUsd(nz(adminFees)) +
  destToUsd(furnitureAdj) +
  destToUsd(nz(emergencyCashBuffer));

    const totalMonthlyOutflow = housingTotal + livingCosts;
    // FIX 5: Convert savings from origin currency to USD before dividing
    const monthsCovered = totalMonthlyOutflow > 0
  ? originToUsd(nz(currentSavings)) / totalMonthlyOutflow
  : 0;

    const currentProfile = getCountryByCode(fromCountry);
    const fromIndex = currentCityDefaults?.costIndex ?? currentProfile?.monthlyCostIndexSingle ?? 1;
    const toIndex = targetCityDefaults?.costIndex ?? targetProfile?.monthlyCostIndexSingle ?? 1;
    const comparableSalary = fromIndex > 0 ? annualIncome * (toIndex / fromIndex) : annualIncome;
    const relativeDifference = fromIndex > 0 ? (toIndex - fromIndex) / fromIndex : 0;

    const recommendation =
  !salaryReady
    ? "Add income to see your move recommendation."
    : monthlyFlexibility >= 1500
      ? "Financially strong move based on your current inputs."
      : monthlyFlexibility >= 500
        ? "Viable move, but keep a close eye on recurring costs."
        : monthlyFlexibility >= 0
          ? "Tight move — small surprises could create pressure."
          : "High-risk move — estimated expenses exceed income.";

    return {
      salaryReady, annualIncome, grossMonthly, currentTaxRate, targetTaxRate,
      currentTaxLabel: currentTaxEstimate.label, currentTaxNote: currentTaxEstimate.note,
      targetTaxLabel: targetTaxEstimate.label, targetTaxNote: targetTaxEstimate.note,
      netMonthlyFrom, netMonthlyTo, monthlyIncomeDiff,
      groceriesFrom, transportationFrom, utilitiesFrom,
      groceriesAdj, transportationAdj, healthcareAdj, utilitiesAdj,
      housingTotal, rentTo, housingUtilities, carCost, livingCosts,
      monthlyFlexibility,
      // FIX 2: Return totalPctOfNet instead of housing-only pct
      pct: totalPctOfNet * 100,
      comfort,
      upfrontCashNeeded,
monthsCovered,
comparableSalary,
relativeDifference,
recommendation,
    };
  }, [
    mode, salary, retirementIncome, salaryType, filing, fromCountry, toCountry,
    fromCityMultipliers, toCityMultipliers, currentCityDefaults, targetCityDefaults,
    adults, children, needCar, carCostMonthly, furnished, utilitiesIncluded, utilities, destinationRent,
    groceries, transportation, healthcare, depositRequired, firstMonthRent, lastMonthRent,
    visaCost, flightCost, shippingCost, temporaryStay, adminFees, furnitureSetup,
    emergencyCashBuffer, currentSavings, targetProfile,
  ]);

  const adultsNum = Math.max(1, Number(adults) || 1);
  const childrenNum = Math.max(0, Number(children) || 0);

  function resetInputsKeepContext() {
    const cityDefaults = getCityDefaultsByCode(toCityCode);
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
      setHealthcare(String(d.monthlyDefaults.healthcare));
      setVisaCost(String(d.startupCosts.visa));
      setFlightCost(String(d.startupCosts.flight));
      setShippingCost(String(d.startupCosts.shipping));
      setTemporaryStay(String(d.startupCosts.temporaryStay));
      setAdminFees(String(d.startupCosts.adminFees));
      setFurnitureSetup(String(d.housing.furnishedSetupCost));
      setEmergencyCashBuffer(String(d.startupCosts.emergencyBuffer));
    } else if (countryDefaults) {
      const fallbackRent = adultsNum >= 2 || childrenNum > 0 ? countryDefaults.defaultRentFamily : countryDefaults.defaultRentSingle;
      setDestinationRent(String(fallbackRent));
      setDepositRequired(String(fallbackRent * (countryDefaults.startupCosts.depositMonths ?? 1)));
      setFirstMonthRent(String(fallbackRent));
      setLastMonthRent("0"); setUtilitiesIncluded("no");
      setGroceries(""); setUtilities(""); setTransportation("");
      setHealthcare(String(adultsNum >= 2 || childrenNum > 0 ? countryDefaults.healthcareMonthlyFamily : countryDefaults.healthcareMonthlySingle));
      setVisaCost(String(countryDefaults.startupCosts.visa));
      setFlightCost(String(countryDefaults.startupCosts.flight));
      setShippingCost(""); setTemporaryStay(String(countryDefaults.startupCosts.temporaryHousing));
      setAdminFees(""); setFurnitureSetup(String(countryDefaults.startupCosts.setup));
      setEmergencyCashBuffer("");
    } else {
      setDestinationRent(""); setDepositRequired(""); setFirstMonthRent(""); setLastMonthRent("");
      setGroceries(""); setUtilities(""); setTransportation(""); setHealthcare("");
      setVisaCost(""); setFlightCost(""); setShippingCost(""); setTemporaryStay("");
      setAdminFees(""); setFurnitureSetup(""); setEmergencyCashBuffer("");
    }
    setCurrentSavings("");
  }

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold" />
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/70">
            <button type="button" onClick={() => setMode("working")} className={`rounded-lg px-3 py-1 text-sm ${mode === "working" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}>Working</button>
            <button type="button" onClick={() => setMode("retired")} className={`rounded-lg px-3 py-1 text-sm ${mode === "retired" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}>Retired</button>
          </div>
          <button type="button" onClick={resetInputsKeepContext} className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:dark:bg-slate-900/40" title="Clear all fields">Reset</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LEFT — INPUTS */}
        <div className="space-y-3">

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="mb-3 text-sm font-semibold">Income &amp; Location</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <CalculatorImmediateNumberField id="south-america-income" label={<>{mode === "retired" ? "Gross annual retirement income" : "Gross annual salary"} <span className="text-slate-400 dark:text-slate-500">({originCurrency})</span></>} className={inputCls} value={mode === "retired" ? retirementIncome : salary} onChange={(value) => mode === "retired" ? setRetirementIncome(value) : setSalary(value)} placeholder=" " />

              <CalculatorSelect id="south-america-filing" label="Filing status" className={selectCls} value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}>
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
              </CalculatorSelect>

              <CalculatorSelect id="south-america-from-country" label="Current country" className={selectCls} value={fromCountry} onChange={(e) => { setFromCountry(e.target.value); setFromCityCode(""); }}>
                  {allCountriesSorted.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </CalculatorSelect>

              <CalculatorSelect id="south-america-to-country" label="Target country" info={<InfoTip align="right" text="Filtered to South American destinations. Use the Caribbean or International calculator for other regions." />} className={selectCls} value={toCountry} onChange={(e) => { setToCountry(e.target.value); setToCityCode(""); }}>
                  {southAmericaCountriesSorted.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </CalculatorSelect>

              <CalculatorSelect id="south-america-from-city" label="Current city" className={selectCls} value={fromCityCode} onChange={(e) => setFromCityCode(e.target.value)}>
                  {fromCities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
              </CalculatorSelect>

              <CalculatorSelect id="south-america-to-city" label="Target city" className={selectCls} value={toCityCode} onChange={(e) => setToCityCode(e.target.value)}>
                  {toCities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
              </CalculatorSelect>

              <CalculatorSelect id="south-america-currency" label="Currency display" info={<InfoTip align="right" text="Choose how amounts appear. View in USD, your current country's currency, or your South American destination currency." />} className={selectCls} value={currencyDisplay} onChange={(e) => setCurrencyDisplay(e.target.value as CurrencyDisplay)}>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="CURRENT">Current currency ({COUNTRY_TO_CURRENCY[fromCountry] ?? "USD"})</option>
                  <option value="DESTINATION">Destination currency ({COUNTRY_TO_CURRENCY[toCountry] ?? "USD"})</option>
              </CalculatorSelect>

              <div className="text-sm">
                <div className={labelHeadCls}>
                  Income impact
                  <InfoTip align="right" text="Shows how your estimated monthly take-home pay changes between your current location and your South American destination after taxes." />
                </div>
                <div className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 dark:border-slate-700 px-3">
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

              <CalculatorSelect id="south-america-salary-type" label="Salary type" className={selectCls} value={salaryType} onChange={(e) => setSalaryType(e.target.value as SalaryType)}>
                  <option value="remote">Keeping current remote salary</option>
                  <option value="local">Local salary in destination</option>
                  <option value="freelance">Freelance / self-employed</option>
              </CalculatorSelect>

              <CalculatorImmediateNumberField id="south-america-savings" label="Current savings available" className={inputCls} value={currentSavings} onChange={setCurrentSavings} placeholder=" " />

              <CalculatorImmediateNumberField id="south-america-adults" label="Number of adults" className={inputCls} value={adults} onChange={setAdults} placeholder=" " />

              <CalculatorImmediateNumberField id="south-america-children" label="Number of children" className={inputCls} value={children} onChange={setChildren} placeholder=" " />
            </div>
          </div>

          <VisaContextCard countryCode={toCountry} />

          {/* Housing */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="mb-3 text-sm font-semibold">Housing</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <CalculatorImmediateNumberField id="south-america-rent" label="Rent in destination (monthly)" wrapperClassName="sm:col-span-2" className={inputCls} value={destinationRent} onChange={setDestinationRent} placeholder=" " />
              <CalculatorImmediateNumberField id="south-america-deposit" label="Deposit required" className={inputCls} value={depositRequired} onChange={setDepositRequired} placeholder=" " />
              <CalculatorImmediateNumberField id="south-america-first-rent" label="First month rent" className={inputCls} value={firstMonthRent} onChange={setFirstMonthRent} placeholder=" " />
              <CalculatorImmediateNumberField id="south-america-last-rent" label="Last month rent (if applicable)" className={inputCls} value={lastMonthRent} onChange={setLastMonthRent} placeholder=" " />
              <CalculatorSelect id="south-america-furnished" label="Furnished or unfurnished" className={selectCls} value={furnished} onChange={(e) => setFurnished(e.target.value as FurnishedType)}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="furnished">Furnished</option>
              </CalculatorSelect>
              <CalculatorSelect id="south-america-utilities-included" label="Utilities included?" wrapperClassName="sm:col-span-2" className={selectCls} value={utilitiesIncluded} onChange={(e) => setUtilitiesIncluded(e.target.value as YesNo)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
              </CalculatorSelect>
            </div>
          </div>

          {/* FIX 1: Living costs are now editable inputs */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="mb-3 text-sm font-semibold">
              Estimated Living Costs
              <InfoTip text="Base estimates for a single adult in the destination city. Adjusted automatically for family size and city-level cost multipliers. Edit to match your actual expectations." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <CalculatorImmediateNumberField id="south-america-groceries" label="Groceries (base, single adult)" info={<InfoTip text="Adjusted for family size and destination city cost index." />} className={inputCls} value={groceries} onChange={setGroceries} placeholder=" " helpText={<>Adjusted: {displayAmount(results.groceriesAdj, 0)}</>} />
              <CalculatorImmediateNumberField id="south-america-utilities" label="Utilities (base, single adult)" info={<InfoTip text="Only counted if utilities are not included in your rent." />} className={inputCls} value={utilities} onChange={setUtilities} placeholder=" " helpText={<>Adjusted: {displayAmount(results.utilitiesAdj, 0)}</>} />
              <CalculatorImmediateNumberField id="south-america-transportation" label="Transportation (base, single adult)" info={<InfoTip text="Adjusted for family size and destination city transit costs." />} className={inputCls} value={transportation} onChange={setTransportation} placeholder=" " helpText={<>Adjusted: {displayAmount(results.transportationAdj, 0)}</>} />
              <CalculatorImmediateNumberField id="south-america-healthcare" label="Healthcare (base, single adult)" info={<InfoTip text="Adjusted for family size. Covers insurance and out-of-pocket estimates." />} className={inputCls} value={healthcare} onChange={setHealthcare} placeholder=" " helpText={<>Adjusted: {displayAmount(results.healthcareAdj, 0)}</>} />
            </div>
            <div className="mt-3">
              <CalculatorSelect id="south-america-need-car" label="Need a car?" className={selectCls} value={needCar} onChange={(e) => setNeedCar(e.target.value as YesNo)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
              </CalculatorSelect>
              {needCar === "yes" ? (
                <CalculatorImmediateNumberField id="south-america-car-cost-monthly" label="Monthly car estimate" wrapperClassName="mt-3" className={inputCls} min={0} value={carCostMonthly} onChange={setCarCostMonthly} placeholder=" " />
              ) : null}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Base values auto-populate from city defaults. Adjusted totals reflect family size and city cost multipliers.</div>
          </div>

          {/* One-Time Moving Costs */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="mb-3 text-sm font-semibold">One-Time Moving Costs</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <CalculatorImmediateNumberField id="south-america-visa" label="Visa / permit estimate" className={inputCls} value={visaCost} onChange={setVisaCost} placeholder=" " />
              <CalculatorImmediateNumberField id="south-america-flight" label="One-way flight estimate" className={inputCls} value={flightCost} onChange={setFlightCost} placeholder=" " />
              <CalculatorImmediateNumberField id="south-america-shipping" label="Shipping / baggage estimate" className={inputCls} value={shippingCost} onChange={setShippingCost} placeholder=" " />
              <CalculatorImmediateNumberField id="south-america-temporary-stay" label="Temporary housing estimate" className={inputCls} value={temporaryStay} onChange={setTemporaryStay} placeholder=" " />
              <CalculatorImmediateNumberField id="south-america-admin" label="Setup / admin estimate" className={inputCls} value={adminFees} onChange={setAdminFees} placeholder=" " />
              <CalculatorImmediateNumberField id="south-america-furniture" label="Furniture / setup estimate" className={inputCls} value={furnitureSetup} onChange={setFurnitureSetup} placeholder=" " />
              <CalculatorImmediateNumberField id="south-america-emergency" label="Recommended cash buffer" wrapperClassName="sm:col-span-2" className={inputCls} value={emergencyCashBuffer} onChange={setEmergencyCashBuffer} placeholder=" " />
            </div>
            <div className="mt-4 w-full text-xs text-slate-500 dark:text-slate-400">Planning estimates only.</div>
          </div>
        </div>

        {/* RIGHT — RESULTS */}
        <div className="space-y-3">

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="mb-2 text-sm font-semibold">Results</div>
            <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">Assumptions updated: March 2026 · Planning estimates only</div>
            <div className="mb-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div>Current city: <span className="font-semibold">{fromCityLabel}</span></div>
              <div>Target city: <span className="font-semibold">{toCityLabel}</span></div>
            </div>
            <div className="grid min-w-0 gap-2 text-sm [overflow-wrap:anywhere]">
              <div>Net monthly (current): <span className="font-semibold">{displayAmount(results.netMonthlyFrom)}</span></div>
              <div>Net monthly (target): <span className="font-semibold">{displayAmount(results.netMonthlyTo)}</span></div>

              {results.salaryReady && (
                <>
                  <div className="mt-2">Gross monthly: <span className="font-semibold">{displayAmount(results.grossMonthly, 2)}</span></div>
                  <div>Est. taxes (current): <span className="font-semibold">{displayAmount(results.grossMonthly * results.currentTaxRate, 2)}</span> <span className="text-xs text-slate-500 dark:text-slate-400">({(results.currentTaxRate * 100).toFixed(1)}%)</span></div>
                  <div>Est. taxes (target): <span className="font-semibold">{displayAmount(results.grossMonthly * results.targetTaxRate, 2)}</span> <span className="text-xs text-slate-500 dark:text-slate-400">({(results.targetTaxRate * 100).toFixed(1)}%)</span></div>

                  <div className="mt-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 font-semibold tracking-wide text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800">Tax model status</span>
                      <InfoTip text="Describes how complete the tax estimate is for this South American destination." />
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{results.targetTaxLabel}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{results.targetTaxNote}</div>
                  </div>
                </>
              )}

              <div className="mt-2 font-semibold">Monthly housing</div>
              <div className="grid gap-1 text-sm">
                <div>Rent: <span className="font-semibold">{displayAmount(results.rentTo, 2)}</span></div>
                {results.housingUtilities > 0 && <div>Utilities gap: <span className="font-semibold">{displayAmount(results.housingUtilities, 2)}</span></div>}
                {results.carCost > 0 && <div>Car: <span className="font-semibold">{displayAmount(results.carCost, 2)}</span></div>}
                <div className="pt-1">Total housing: <span className="font-bold">{displayAmount(results.housingTotal, 2)}</span></div>
              </div>
              <div className="mt-2 font-semibold">Monthly living costs</div>
              <div>Total: <span className="font-bold">{displayAmount(results.livingCosts, 2)}</span></div>
              <div className="mt-2">Upfront cash needed: <span className="font-semibold">{displayAmount(results.upfrontCashNeeded)}</span></div>
              <div>Months covered by savings: <span className="font-semibold">{Number.isFinite(results.monthsCovered) ? results.monthsCovered.toFixed(1) : "—"}</span></div>
              <div className="mt-2">Essential costs % of net (target): <span className="font-semibold">{Number.isFinite(results.pct) ? `${results.pct.toFixed(1)}%` : "—"}</span></div>
            </div>
            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div>Results are estimates only. No information entered is stored or shared.</div>
              <div>Tax estimates, rent, immigration costs, and retirement treatment vary by destination and personal circumstances.</div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Tip: Your URL updates as you type — copy the page link to share this scenario.</div>
          </div>

          {/* Monthly Flexibility — amber accent */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">Monthly Flexibility</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100 [overflow-wrap:anywhere]">{results.salaryReady ? displayAmount(results.monthlyFlexibility, 2) : "—"}</div>
              </div>
              <div className="rounded-full bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800">
                After housing + core living costs
              </div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 dark:bg-slate-900 ring-1 ring-amber-100 dark:ring-amber-800">
              <div className={`h-full rounded-full ${
                !results.salaryReady ? "w-[0%] bg-slate-300 dark:bg-slate-800"
                : results.monthlyFlexibility >= 3000 ? "w-[92%] bg-emerald-500 dark:bg-emerald-600"
                : results.monthlyFlexibility >= 2000 ? "w-[76%] bg-emerald-400 dark:bg-emerald-700"
                : results.monthlyFlexibility >= 1000 ? "w-[58%] bg-amber-400 dark:bg-amber-700"
                : results.monthlyFlexibility >= 500 ? "w-[40%] bg-orange-400 dark:bg-orange-700"
                : "w-[24%] bg-rose-400 dark:bg-rose-700"
              }`} />
            </div>
       <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">
  {!results.salaryReady ? "Add salary and housing inputs to estimate how much room you have left each month." : `This is what you may have left each month in ${toCityLabel} after housing costs and core living expenses.`}
</div>

{results.salaryReady && (
  <div className="mt-3 rounded-xl bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 ring-1 ring-amber-200 dark:ring-amber-800">
    {results.recommendation}
  </div>
)}

<div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
  Higher flexibility gives you more room for saving, investing, travel, and unexpected expenses.
</div>
</div>
          {/* Comparable Salary */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">COMPARABLE SALARY</div>
            <div className="mt-2 text-3xl font-bold [overflow-wrap:anywhere]">{displayAmount(results.comparableSalary)}</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {toCityLabel} is roughly <span className="font-semibold">{Math.abs(Math.round(results.relativeDifference * 100))}%</span>{" "}
              {results.relativeDifference >= 0 ? "more" : "less"} expensive than {fromCityLabel}.
            </p>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Based on housing, transportation, healthcare, and essential cost weighting.</div>
          </div>

          {/* Comfort Score — amber accent */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                  {mode === "retired" ? "Retirement Readiness Score" : "Comfort Score™"}
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{results.comfort.band} · {results.comfort.label}</div>
              </div>
              <div className="rounded-full bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800">Housing + essentials</div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 dark:bg-slate-900 ring-1 ring-amber-100 dark:ring-amber-800">
              <div className={`h-full rounded-full ${
                results.comfort.band === "A" ? "w-[92%] bg-emerald-500 dark:bg-emerald-600"
                : results.comfort.band === "B" ? "w-[78%] bg-emerald-400 dark:bg-emerald-700"
                : results.comfort.band === "C" ? "w-[60%] bg-amber-400 dark:bg-amber-700"
                : "w-[42%] bg-orange-400 dark:bg-orange-700"
              }`} />
            </div>
            <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">{results.comfort.note}</div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Based on housing + essential living costs as a share of your estimated net monthly income.</div>
          </div>

          {/* Share */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">Share this scenario</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current comparison link and send it to a partner, friend, or future self.</div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const shareUrl = new URL(window.location.href);
                    const shareText = `My South America relocation scenario: ${fromCityLabel} → ${toCityLabel}. Monthly flexibility ${displayAmount(results.monthlyFlexibility, 0)} after housing and core living costs.`;
                    const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                    if (canNativeShare) {
                      await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({ title: "My South America Relocation Scenario", text: shareText, url: shareUrl.toString() });
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
            </div>
          </div>

          {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
  <AdSlot
    slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP}
    className="my-8 min-w-0 max-w-full overflow-x-clip"
  />
) : null}
      </div>
      </div>
    </div>
  );
}
