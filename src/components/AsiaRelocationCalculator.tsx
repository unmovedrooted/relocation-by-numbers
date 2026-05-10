"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  INTERNATIONAL_COUNTRIES,
  getCountryByCode,
} from "@/lib/internationalCountries";
import {
  citiesForCountry,
  getInternationalCityByCode,
} from "@/lib/internationalCities";
import { getCityDefaultsByCode } from "@/lib/internationalCityDefaults";
import {
  estimateAsiaTax,
  getAsiaTaxQuestionsForCountry,
  type TaxConfidence,
  type ConditionalQuestion,
} from "@/lib/asiaTaxes";
import { estimateInternationalTax } from "@/lib/internationalTaxes";
import { getCityCostMultipliers } from "@/lib/internationalCityCosts";
import { USD_TO_LOCAL } from "@/lib/internationalFx";
import AdSlot from "./AdSlot";

// ---------------------------------------------------------------------------
// ASIA-SPECIFIC CONFIG
// ---------------------------------------------------------------------------

const ASIA_COUNTRY_CODES = new Set([
  "JP", "KR", "SG", "TH", "VN", "MY", "ID", "AE", "AU", "NZ",
  "PH", "TW", "HK", "IN", "CN", "QA", "SA", "OM",
]);

const ASIA_VISA_CONTEXT: Record<string, {
  program: string;
  notes: string;
  estimatedFee: number;
  icon: string;
  highlight?: string;
}> = {
  TH: {
    icon: "🇹🇭",
    program: "LTR Visa / Thailand Elite / METV",
    highlight: "Long-Term Resident Visa",
    notes: "Thailand's Long-Term Resident (LTR) Visa offers 10-year stays for retirees ($80k+ assets), remote workers ($80k/yr income), and high-net-worth individuals. Thailand Elite is a paid membership visa (฿600k–฿2M). METV available for shorter flexible stays. No path to permanent residency for most.",
    estimatedFee: 250,
  },
  JP: {
    icon: "🇯🇵",
    program: "Highly Skilled Professional / Specified Skilled Worker",
    highlight: "Points-Based Skilled Visa",
    notes: "Japan's Highly Skilled Professional (HSP) visa uses a points system — qualifying faster for permanent residency (1–3 years vs 10). Digital Nomad Visa launched 2024 (6-month stay, ¥10M/yr income). Spouse/dependent visas widely available. Japanese bureaucracy requires patience.",
    estimatedFee: 300,
  },
  KR: {
    icon: "🇰🇷",
    program: "D-8 / F-2 / Digital Nomad Visa (Workation)",
    highlight: "Digital Nomad Visa Available",
    notes: "South Korea's Digital Nomad Visa (F-1-D): remote workers earning $84k+ USD/yr, 1-year stay. F-2 Residence Visa for those with Korean connections or long-term stays. D-8 for corporate investors. Korea's immigration system is efficient and largely digital.",
    estimatedFee: 300,
  },
  SG: {
    icon: "🇸🇬",
    program: "Employment Pass / ONE Pass / Tech.Pass",
    highlight: "Employment Pass Required",
    notes: "Singapore has no digital nomad visa. Employment Pass (EP) requires employer sponsorship and SGD 5,000+/mo salary. ONE Pass for top talent (SGD 30k+/mo). Tech.Pass for established tech professionals. EntrePass for entrepreneurs. High bar — Singapore is selective about residency.",
    estimatedFee: 350,
  },
  VN: {
    icon: "🇻🇳",
    program: "E-Visa / Business Visa / DL Visa",
    highlight: "90-Day E-Visa",
    notes: "Vietnam's e-Visa allows 90-day stays, multi-entry. Business visa (DN) available for longer stays with company sponsorship. No official digital nomad visa yet — many expats extend via agencies or border runs. Vietnam does not offer permanent residency to most foreigners.",
    estimatedFee: 200,
  },
  MY: {
    icon: "🇲🇾",
    program: "DE Rantau / MM2H / Premium Visa",
    highlight: "Digital Nomad Visa Available",
    notes: "Malaysia's DE Rantau nomad pass: remote workers earning $24k+/yr, 12-month renewable stay. MM2H (Malaysia My Second Home) is a long-term residency program for retirees and self-sufficient individuals — requirements raised significantly in 2021. Premium Visa Programme for high-net-worth individuals.",
    estimatedFee: 220,
  },
  ID: {
    icon: "🇮🇩",
    program: "Second Home Visa / B211A Visa",
    highlight: "Second Home Visa (5-10 yr)",
    notes: "Indonesia's Second Home Visa: 5 or 10-year renewable stay, requires IDR 2B (~$130k) in Indonesian bank account or property investment. B211A Social/Cultural Visa for shorter stays (60 days, extendable to 180). Bali is hugely popular with digital nomads. No permanent residency path for most.",
    estimatedFee: 220,
  },
  AE: {
    icon: "🇦🇪",
    program: "Golden Visa / Remote Work Visa / Green Visa",
    highlight: "Golden Visa (10-year)",
    notes: "UAE's Golden Visa: 10-year residency for investors, entrepreneurs, skilled professionals, and outstanding students. Remote Work Visa: 1-year renewable for remote workers ($5k/mo income). Green Visa: 5-year self-sponsored stay for skilled workers and freelancers. Zero personal income tax.",
    estimatedFee: 400,
  },
  AU: {
    icon: "🇦🇺",
    program: "Skilled Independent (189) / Global Talent / WHV",
    highlight: "Points-Based Skilled Visa",
    notes: "Australia's Skilled Independent Visa (subclass 189) is points-based — age, English, qualifications, and experience. Global Talent Visa for exceptional candidates. Working Holiday Visa (WHV) for under-35s from eligible countries. High income thresholds and competitive demand.",
    estimatedFee: 450,
  },
  NZ: {
    icon: "🇳🇿",
    program: "Skilled Migrant / Accredited Employer Work Visa",
    highlight: "Accredited Employer Work Visa",
    notes: "New Zealand's Accredited Employer Work Visa (AEWV) requires an offer from an accredited employer. Skilled Migrant Category visa for points-based permanent residency. Working Holiday Visa available for eligible nationalities under 35. Straightforward immigration system.",
    estimatedFee: 450,
  },
  PH: {
    icon: "🇵🇭",
    program: "SRRV / 13A / Special Work Permit",
    highlight: "SRRV Retirement Visa",
    notes: "Philippines Special Resident Retiree's Visa (SRRV): for retirees 35+ with a pension or deposit requirement (from $10k–$50k depending on age). 13A Quota Immigrant Visa for spouses of Filipino citizens. Special Work Permit for short-term employment. Philippines is English-speaking and expat-friendly.",
    estimatedFee: 180,
  },
  TW: {
    icon: "🇹🇼",
    program: "Gold Card / Employment Gold Card",
    highlight: "Employment Gold Card",
    notes: "Taiwan's Employment Gold Card combines a work permit, residence visa, alien resident certificate, and re-entry permit in a single document — valid 1–3 years. Aimed at professionals earning NT$160k+/month or with special expertise. Open work rights — no single employer required. No digital nomad visa yet.",
    estimatedFee: 200,
  },
  HK: {
    icon: "🇭🇰",
    program: "Quality Migrant Admission Scheme / Top Talent Pass",
    highlight: "Top Talent Pass Scheme",
    notes: "Hong Kong's Top Talent Pass Scheme (TTPS): for graduates of top 100 universities or high earners (HK$2.5M+/yr). QMAS is points-based for skilled professionals. General Employment Policy for employer-sponsored roles. Hong Kong is a separate immigration jurisdiction from mainland China.",
    estimatedFee: 300,
  },
  IN: {
    icon: "🇮🇳",
    program: "Employment Visa / Business Visa / OCI Card",
    highlight: "Employment Visa",
    notes: "India's Employment Visa requires a job offer from an Indian company (minimum $25k/yr salary threshold). Business Visa for shorter stays. Overseas Citizenship of India (OCI) card for people of Indian origin — lifetime multiple-entry visa with most rights except voting and agricultural land ownership.",
    estimatedFee: 160,
  },
  CN: {
    icon: "🇨🇳",
    program: "Work Permit / Talent Visa / Business Visa",
    highlight: "Work Permit Required",
    notes: "China requires a Work Permit (Foreigner's Work Permit) sponsored by an employer. Talent Visa (R visa) for high-level professionals. Business Visa (M) for short-term commercial activities. China's visa requirements have tightened in recent years — working without proper authorization carries significant penalties.",
    estimatedFee: 250,
  },
  QA: {
    icon: "🇶🇦",
    program: "Residence Permit / Permanent Residency Card",
    highlight: "Employer-Sponsored Residency",
    notes: "Qatar requires employer sponsorship for residence permits. Qatar Permanent Residency Card (QID) is available to long-term residents meeting certain criteria. No personal income tax. Qatar's kafala system is being reformed but employer ties remain significant for most expatriates.",
    estimatedFee: 380,
  },
  SA: {
    icon: "🇸🇦",
    program: "Iqama (Residency) / Premium Residency",
    highlight: "Employer-Sponsored Iqama",
    notes: "Saudi Arabia's residency permit (Iqama) is employer-sponsored. The Premium Residency (Green Card equivalent) is available for purchase or merit — offering permanent residency and the ability to self-sponsor. No personal income tax on employment income. Vision 2030 is expanding expat-friendly policies.",
    estimatedFee: 350,
  },
  OM: {
    icon: "🇴🇲",
    program: "Residence Visa / Long-Term Residency",
    highlight: "Employer-Sponsored Residency",
    notes: "Oman issues residence visas tied to employment contracts. Long-term residency is available for retirees with a pension income requirement. No personal income tax. Oman is considered one of the more stable and expat-friendly Gulf states, with a lower cost of living than UAE and Qatar.",
    estimatedFee: 300,
  },
};

const FX_FALLBACK: Record<string, number> = {};

function convertLocalToUsd(amountLocal: number, countryCode: string): number {
  const rate = (USD_TO_LOCAL[countryCode] ?? FX_FALLBACK[countryCode]) ?? 1;
  return rate > 0 ? amountLocal / rate : amountLocal;
}

function convertUsdToLocal(amountUsd: number, countryCode: string): number {
  const rate = (USD_TO_LOCAL[countryCode] ?? FX_FALLBACK[countryCode]) ?? 1;
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
  ZA: "ZAR", AT: "EUR", BE: "EUR",
  PH: "PHP", TW: "TWD", HK: "HKD", IN: "INR", CN: "CNY",
  QA: "QAR", SA: "SAR", OM: "OMR",
};

type Mode = "working" | "retired";
type FilingStatus = "single" | "married";
type SalaryType = "remote" | "local" | "freelance";
type FurnishedType = "furnished" | "unfurnished";
type YesNo = "yes" | "no";
type CurrencyDisplay = "USD" | "CURRENT" | "DESTINATION";

// FIX 3: floating point precision — run toFixed(10) before toLocaleString
function money(n: number, digits: number = 0, currency: string = "USD") {
  if (!Number.isFinite(n)) return "—";
  return parseFloat(n.toFixed(10)).toLocaleString(undefined, {
    style: "currency", currency,
    maximumFractionDigits: digits, minimumFractionDigits: digits,
  });
}

function getQS() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function setQS(params: URLSearchParams) {
  if (typeof window === "undefined") return;
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
}

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

function confidenceBadge(confidence: TaxConfidence) {
  switch (confidence) {
    case "verified":    return { label: "● Verified",            cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
    case "partial":     return { label: "● Planning estimate",   cls: "bg-blue-50 text-blue-700 ring-blue-200" };
    case "simplified":  return { label: "● Simplified estimate", cls: "bg-amber-50 text-amber-700 ring-amber-200" };
    case "placeholder": return { label: "⚠ Directional only",   cls: "bg-rose-50 text-rose-700 ring-rose-200" };
    default:            return { label: "⚠ Unknown",             cls: "bg-slate-50 text-slate-500 ring-slate-200" };
  }
}

const ASIA_TAX_LABEL =
  "Tax model updated April 2026 · figures are 2024, 2024–25, or 2025 by jurisdiction";

const inputCls  = "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-rose-500/15";
const selectCls = "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-rose-500/15";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600";

// FIX 4: aria-label now uses the actual tooltip text so screen readers read it out
function InfoTip({ text, align = "left" }: { text: string; align?: "left" | "right" | "center" }) {
  const positionClass = align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button type="button" aria-label={text} className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">i</button>
      <span className={`pointer-events-none absolute top-full z-50 mt-2 hidden max-w-[calc(100vw-2rem)] w-72 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-5 text-white shadow-xl group-hover:block group-focus-within:block ${positionClass}`}>
        {text}
      </span>
    </span>
  );
}

function VisaContextCard({ countryCode }: { countryCode: string }) {
  const ctx = ASIA_VISA_CONTEXT[countryCode];
  if (!ctx) return null;
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 text-xl">{ctx.icon}</div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Visa &amp; Permit Context</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{ctx.program}</div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{ctx.notes}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {ctx.highlight && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">{ctx.highlight}</span>
            )}
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Est. permit fee: {money(ctx.estimatedFee, 0, "USD")}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500">Visa requirements vary by citizenship. Always verify with official government sources and an immigration attorney.</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function AsiaRelocationCalculator() {
  const hasMounted = useRef(false);
  const lastDefaultedCityCode = useRef<string | null>(null);
  const [qsHydrated, setQsHydrated] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");
  const [taxNotesExpanded, setTaxNotesExpanded] = useState(false);
  const [conditionalAnswers, setConditionalAnswers] = useState<Record<string, string>>({});

  const [mode, setMode] = useState<Mode>("working");
  const [salary, setSalary] = useState<string>("150000");
  const [retirementIncome, setRetirementIncome] = useState<string>("70000");
  const [filing, setFiling] = useState<FilingStatus>("single");

  const [fromCountry, setFromCountry] = useState<string>("US");
  const [toCountry, setToCountry] = useState<string>("TH");
  const [fromCityCode, setFromCityCode] = useState<string>("US-NYC");
  const [toCityCode, setToCityCode] = useState<string>("TH-BKK");

  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>("USD");
  const [salaryType, setSalaryType] = useState<SalaryType>("remote");
  const [adults, setAdults] = useState<string>("1");
  const [children, setChildren] = useState<string>("0");

  const [destinationRent, setDestinationRent] = useState<string>("1100");
  const [depositRequired, setDepositRequired] = useState<string>("2200");
  const [firstMonthRent, setFirstMonthRent] = useState<string>("1100");
  const [lastMonthRent, setLastMonthRent] = useState<string>("0");
  const [furnished, setFurnished] = useState<FurnishedType>("unfurnished");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<YesNo>("no");

  const [groceries, setGroceries] = useState<string>("280");
  const [utilities, setUtilities] = useState<string>("100");
  const [transportation, setTransportation] = useState<string>("55");
  const [healthcare, setHealthcare] = useState<string>("85");

  const [visaCost, setVisaCost] = useState<string>("250");
  const [flightCost, setFlightCost] = useState<string>("950");
  const [shippingCost, setShippingCost] = useState<string>("450");
  const [temporaryStay, setTemporaryStay] = useState<string>("1200");
  const [adminFees, setAdminFees] = useState<string>("220");
  const [furnitureSetup, setFurnitureSetup] = useState<string>("850");
  const [emergencyCashBuffer, setEmergencyCashBuffer] = useState<string>("2800");
  const [currentSavings, setCurrentSavings] = useState<string>("25000");
  const [needCar, setNeedCar] = useState<YesNo>("no");

  const nz = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

  // FIX 2: strip non-numeric characters from all number inputs
  const sanitizeNumeric = (val: string) => val.replace(/[^0-9.]/g, "");

  const incomeScenario = mode === "retired" ? "retired" : salaryType === "remote" ? "remote" : "local";

  const allCountriesSorted = useMemo(() =>
    [...INTERNATIONAL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)), []);

  const asiaCountriesSorted = useMemo(() =>
    [...INTERNATIONAL_COUNTRIES]
      .filter(c => ASIA_COUNTRY_CODES.has(c.code))
      .sort((a, b) => a.name.localeCompare(b.name)), []);

  const fromCities = useMemo(() =>
    [...citiesForCountry(fromCountry)].sort((a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" })), [fromCountry]);

  const toCities = useMemo(() =>
    [...citiesForCountry(toCountry)].sort((a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" })), [toCountry]);

  const originCurrency = COUNTRY_TO_CURRENCY[fromCountry] ?? "USD";

  const displayAmount = (amountUsd: number, digits: number = 0) => {
    if (currencyDisplay === "CURRENT") return money(convertUsdToLocal(amountUsd, fromCountry), digits, COUNTRY_TO_CURRENCY[fromCountry] ?? "USD");
    if (currencyDisplay === "DESTINATION") return money(convertUsdToLocal(amountUsd, toCountry), digits, COUNTRY_TO_CURRENCY[toCountry] ?? "USD");
    return money(amountUsd, digits, "USD");
  };

  const fromCityLabel = getInternationalCityByCode(fromCityCode)?.name ?? "Current city";
  const toCityLabel   = getInternationalCityByCode(toCityCode)?.name ?? "Target city";

  const selectedCityDefaults = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);
  const currentCityDefaults  = useMemo(() => getCityDefaultsByCode(fromCityCode), [fromCityCode]);
  const targetCityDefaults   = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);
  const fromCityMultipliers  = useMemo(() => getCityCostMultipliers(fromCityCode), [fromCityCode]);
  const toCityMultipliers    = useMemo(() => getCityCostMultipliers(toCityCode), [toCityCode]);

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
    if (lastDefaultedCityCode.current === toCityCode) return;
    lastDefaultedCityCode.current = toCityCode;

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
    const vMode = qs.get("mode"); if (vMode === "working" || vMode === "retired") setMode(vMode);
    const vFiling = qs.get("filing") as FilingStatus | null; if (vFiling === "single" || vFiling === "married") setFiling(vFiling);
    const vFromCountry = qs.get("fromCountry"); if (vFromCountry) setFromCountry(vFromCountry);
    const vToCountry = qs.get("toCountry"); if (vToCountry && ASIA_COUNTRY_CODES.has(vToCountry)) setToCountry(vToCountry);
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
    ];
    for (const [key, setter] of fields) { const val = qs.get(key); if (val) setter(val); }
    const vCar = qs.get("car") as YesNo | null; if (vCar === "yes" || vCar === "no") setNeedCar(vCar);
    const vTaxAnswers = qs.get("taxAnswers");
    if (vTaxAnswers) { try { const parsed = JSON.parse(vTaxAnswers); if (typeof parsed === "object" && parsed !== null) setConditionalAnswers(parsed); } catch {} }
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
    const answersJson = JSON.stringify(conditionalAnswers);
    if (answersJson !== "{}") qs.set("taxAnswers", answersJson);
    setQS(qs);
  }, [
    mode, filing, fromCountry, toCountry, fromCityCode, toCityCode,
    salary, retirementIncome, currencyDisplay, salaryType, adults, children,
    destinationRent, depositRequired, firstMonthRent, lastMonthRent, furnished,
    utilitiesIncluded, groceries, utilities, transportation, healthcare, visaCost,
    flightCost, shippingCost, temporaryStay, adminFees, furnitureSetup,
    emergencyCashBuffer, currentSavings, needCar, conditionalAnswers,
  ]);

  const targetProfile = getCountryByCode(toCountry);

  const results = useMemo(() => {
    const baseAnnualIncome = mode === "retired" ? nz(retirementIncome) : nz(salary);
    const salaryReady = baseAnnualIncome > 0;
    const salaryTypeMultiplier = mode === "retired" ? 1 : getSalaryTypeMultiplier(salaryType);
    const annualIncome = convertLocalToUsd(baseAnnualIncome * salaryTypeMultiplier, fromCountry);
    const grossMonthly = annualIncome / 12;

    const annualIncomeForFromTax = convertUsdToLocal(annualIncome, fromCountry);
    const annualIncomeForToTax   = convertUsdToLocal(annualIncome, toCountry);

    const currentTaxEstimate = ASIA_COUNTRY_CODES.has(fromCountry)
      ? estimateAsiaTax({
          countryCode: fromCountry, annualIncome: annualIncomeForFromTax,
          filing, isRetired: mode === "retired", incomeScenario,
          answers: {},
        })
      : estimateInternationalTax({
          countryCode: fromCountry, annualIncome: annualIncomeForFromTax,
          filing, isRetired: mode === "retired", incomeScenario,
          answers: {},
        });
    const targetTaxEstimate = estimateAsiaTax({
      countryCode: toCountry, annualIncome: annualIncomeForToTax,
      filing, isRetired: mode === "retired", incomeScenario,
      answers: conditionalAnswers,
    });

    const currentTaxRate = currentTaxEstimate.effectiveRate;
    const targetTaxRate  = targetTaxEstimate.effectiveRate;

    const targetConfidence: TaxConfidence = targetTaxEstimate.confidence;
    const targetMissingFactor: string = targetTaxEstimate.missingFactor ?? "";
    const targetTaxLabel: string = targetTaxEstimate.label;
    const targetTaxNotes: string[] = [];
    if (targetTaxEstimate.note) targetTaxNotes.push(targetTaxEstimate.note);

    const unansweredQuestions = getAsiaTaxQuestionsForCountry(toCountry, incomeScenario)
      .filter(q => !conditionalAnswers[q.key]);
    if (unansweredQuestions.length > 0) {
      targetTaxNotes.push(`Answer the tax question${unansweredQuestions.length > 1 ? "s" : ""} above to refine this estimate.`);
    }

    const netMonthlyFrom = grossMonthly * (1 - currentTaxRate);
    const netMonthlyTo   = grossMonthly * (1 - targetTaxRate);
    const monthlyIncomeDiff = netMonthlyTo - netMonthlyFrom;

    const adultCount = Math.max(1, nz(adults));
    const childCount = Math.max(0, nz(children));

    const familyGroceries      = nz(groceries)      * (1 + (adultCount - 1) * 0.55 + childCount * 0.35);
    const familyTransportation = nz(transportation) * (1 + (adultCount - 1) * 0.35 + childCount * 0.15);
    const familyHealthcare     = nz(healthcare)     * (1 + (adultCount - 1) * 0.7  + childCount * 0.5);
    const familyUtilities      = nz(utilities)      * (1 + (adultCount - 1) * 0.25 + childCount * 0.15);

    // FIX 1: state values are already city-specific defaults — do NOT re-multiply
    // by toCityMultipliers (that would double-apply the city cost-of-living).
    // fromCityMultipliers below are still correct — they scale the same lifestyle
    // to what it costs in the origin city for comparison purposes.
    const groceriesAdj      = familyGroceries;
    const transportationAdj = familyTransportation;
    const healthcareAdj     = familyHealthcare;
    const utilitiesAdj      = familyUtilities;
    const rentTo            = nz(destinationRent);

    const groceriesFrom      = familyGroceries      * fromCityMultipliers.groceries;
    const transportationFrom = familyTransportation * fromCityMultipliers.transit;
    const utilitiesFrom      = familyUtilities       * fromCityMultipliers.utilities;

    const carCost          = needCar === "yes" ? 350 : 0;
    const housingUtilities = utilitiesIncluded === "yes" ? 0 : utilitiesAdj;
    const housingTotal     = rentTo + housingUtilities + carCost;
    const livingCosts      = groceriesAdj + transportationAdj + healthcareAdj;
    const monthlyFlexibility = netMonthlyTo - housingTotal - livingCosts;

    const totalPctOfNet   = netMonthlyTo > 0 ? (housingTotal + livingCosts) / netMonthlyTo : 0;
    const housingPctOfNet = netMonthlyTo > 0 ? housingTotal / netMonthlyTo : 0;
    const comfort         = getReadinessBand(totalPctOfNet);

    const furnitureAdj = furnished === "furnished" ? 0 : nz(furnitureSetup);
    const upfrontCashNeeded =
      nz(depositRequired) + nz(firstMonthRent) + nz(lastMonthRent) +
      nz(visaCost) + nz(flightCost) + nz(shippingCost) +
      nz(temporaryStay) + nz(adminFees) + furnitureAdj + nz(emergencyCashBuffer);

    const totalMonthlyOutflow = housingTotal + livingCosts;
    const monthsCovered = totalMonthlyOutflow > 0
      ? convertLocalToUsd(nz(currentSavings), fromCountry) / totalMonthlyOutflow
      : 0;

    const currentProfile = getCountryByCode(fromCountry);
    const fromIndex = currentCityDefaults?.costIndex ?? currentProfile?.monthlyCostIndexSingle ?? 1;
    const toIndex   = targetCityDefaults?.costIndex  ?? targetProfile?.monthlyCostIndexSingle  ?? 1;
    const comparableSalary   = fromIndex > 0 ? annualIncome * (toIndex / fromIndex) : annualIncome;
    const relativeDifference = fromIndex > 0 ? (toIndex - fromIndex) / fromIndex : 0;

    return {
      salaryReady, annualIncome, grossMonthly, currentTaxRate, targetTaxRate,
      targetConfidence, targetMissingFactor, targetTaxLabel, targetTaxNotes,
      netMonthlyFrom, netMonthlyTo, monthlyIncomeDiff,
      groceriesFrom, transportationFrom, utilitiesFrom,
      groceriesAdj, transportationAdj, healthcareAdj, utilitiesAdj,
      housingTotal, rentTo, housingUtilities, carCost, livingCosts,
      monthlyFlexibility,
      pct: housingPctOfNet * 100,
      totalPctOfNet: totalPctOfNet * 100,
      comfort,
      upfrontCashNeeded, monthsCovered, comparableSalary, relativeDifference,
    };
  }, [
    mode, salary, retirementIncome, salaryType, filing, fromCountry, toCountry,
    incomeScenario, conditionalAnswers,
    fromCityMultipliers, toCityMultipliers, currentCityDefaults, targetCityDefaults,
    adults, children, needCar, furnished, utilitiesIncluded, utilities, destinationRent,
    groceries, transportation, healthcare, depositRequired, firstMonthRent, lastMonthRent,
    visaCost, flightCost, shippingCost, temporaryStay, adminFees, furnitureSetup,
    emergencyCashBuffer, currentSavings, targetProfile,
  ]);

  const adultsNum   = Math.max(1, Number(adults)   || 1);
  const childrenNum = Math.max(0, Number(children) || 0);
  const badge = confidenceBadge(results.targetConfidence);

  function resetInputsKeepContext() {
    const cityDefaults    = getCityDefaultsByCode(toCityCode);
    const countryDefaults = getCountryByCode(toCountry);
    setSalary(""); setRetirementIncome("");
    setConditionalAnswers({});
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
      setFirstMonthRent(String(fallbackRent)); setLastMonthRent("0");
      setUtilitiesIncluded("no"); setGroceries(""); setUtilities(""); setTransportation("");
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
    <div className="text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold" />
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70">
            <button type="button" onClick={() => setMode("working")} className={`rounded-lg px-3 py-1 text-sm ${mode === "working" ? "bg-slate-900 text-white" : "text-slate-700"}`}>Working</button>
            <button type="button" onClick={() => setMode("retired")} className={`rounded-lg px-3 py-1 text-sm ${mode === "retired" ? "bg-slate-900 text-white" : "text-slate-700"}`}>Retired</button>
          </div>
          <button type="button" onClick={resetInputsKeepContext} className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100" title="Clear all fields">Reset</button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ── LEFT — INPUTS ── */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">Income &amp; Location</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>{mode === "retired" ? "Gross annual retirement income" : "Gross annual salary"} <span className="text-slate-400">({originCurrency})</span></div>
                <input className={inputCls} type="number" value={mode === "retired" ? retirementIncome : salary} onChange={(e) => mode === "retired" ? setRetirementIncome(sanitizeNumeric(e.target.value)) : setSalary(sanitizeNumeric(e.target.value))} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Filing status</div>
                <select className={selectCls} value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}>
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Current country</div>
                <select className={selectCls} value={fromCountry} onChange={(e) => { setFromCountry(e.target.value); setFromCityCode(""); }}>
                  {allCountriesSorted.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Target country <InfoTip align="right" text="Filtered to Asian, Pacific, and Middle Eastern destinations. Use the International Calculator for other regions." /></div>
                <select className={selectCls} value={toCountry} onChange={(e) => { setToCountry(e.target.value); setToCityCode(""); setConditionalAnswers({}); }}>
                  {asiaCountriesSorted.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Current city</div>
                <select className={selectCls} value={fromCityCode} onChange={(e) => setFromCityCode(e.target.value)}>
                  {fromCities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Target city</div>
                <select className={selectCls} value={toCityCode} onChange={(e) => setToCityCode(e.target.value)}>
                  {toCities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Currency display <InfoTip align="right" text="Choose how amounts appear. View in USD, your current country's currency, or your destination currency." /></div>
                <select className={selectCls} value={currencyDisplay} onChange={(e) => setCurrencyDisplay(e.target.value as CurrencyDisplay)}>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="CURRENT">Current currency ({COUNTRY_TO_CURRENCY[fromCountry] ?? "USD"})</option>
                  <option value="DESTINATION">Destination currency ({COUNTRY_TO_CURRENCY[toCountry] ?? "USD"})</option>
                </select>
              </label>
              <div className="text-sm">
                <div className={labelHeadCls}>Tax impact only <InfoTip align="right" text="Shows how your estimated monthly take-home pay changes between your current location and destination after taxes." /></div>
                <div className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 px-3">
                  {results.salaryReady ? (
                    <>
                      <span className={`font-semibold ${results.monthlyIncomeDiff > 0 ? "text-emerald-600" : results.monthlyIncomeDiff < 0 ? "text-rose-600" : "text-slate-900"}`}>
                        {results.monthlyIncomeDiff > 0 ? "+" : ""}{displayAmount(results.monthlyIncomeDiff, 0)}
                      </span>
                      <span className="whitespace-nowrap text-xs text-slate-500">{results.monthlyIncomeDiff > 0 ? "Higher" : results.monthlyIncomeDiff < 0 ? "Lower" : "Same"}</span>
                    </>
                  ) : <span className="text-slate-400">—</span>}
                </div>
              </div>
              {mode === "working" && (
                <label className="text-sm">
                  <div className={labelHeadCls}>
                    Income type{" "}
                    <InfoTip
                      align="right"
                      text="Remote keeps 100% of your entered income. Local salary estimates 90%. Freelance estimates 82% to reflect income instability, unpaid gaps, and self-employment friction."
                    />
                  </div>
                  <select className={selectCls} value={salaryType} onChange={(e) => setSalaryType(e.target.value as SalaryType)}>
                    <option value="remote">Keeping current remote salary</option>
                    <option value="local">Local salary in destination</option>
                    <option value="freelance">Freelance / self-employed</option>
                  </select>
                </label>
              )}
              <label className="text-sm">
                <div className={labelHeadCls}>Current savings available</div>
                <input className={inputCls} type="number" value={currentSavings} onChange={(e) => setCurrentSavings(sanitizeNumeric(e.target.value))} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Number of adults</div>
                <input className={inputCls} type="number" value={adults} onChange={(e) => setAdults(sanitizeNumeric(e.target.value))} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Number of children</div>
                <input className={inputCls} type="number" value={children} onChange={(e) => setChildren(sanitizeNumeric(e.target.value))} placeholder=" " />
              </label>
            </div>
          </div>

          {/* Dynamic conditional tax questions */}
          {getAsiaTaxQuestionsForCountry(toCountry, incomeScenario).map((q: ConditionalQuestion) => (
            <div key={q.key} className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
              <div className="mb-3 text-sm font-semibold">{getCountryByCode(toCountry)?.name ?? toCountry} — Tax Question</div>
              <label className="text-sm">
                <div className={labelHeadCls}>{q.label}{q.helpText && <InfoTip text={q.helpText} />}</div>
                <select className={selectCls} value={conditionalAnswers[q.key] ?? ""}
                  onChange={(e) => setConditionalAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}>
                  <option value="">Select…</option>
                  {q.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </label>
            </div>
          ))}

          {/* Visa Context */}
          <VisaContextCard countryCode={toCountry} />

          {/* Housing */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">Housing</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2"><div className={labelHeadCls}>Rent in destination (monthly)</div><input className={inputCls} type="number" value={destinationRent} onChange={(e) => setDestinationRent(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Deposit required</div><input className={inputCls} type="number" value={depositRequired} onChange={(e) => setDepositRequired(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>First month rent</div><input className={inputCls} type="number" value={firstMonthRent} onChange={(e) => setFirstMonthRent(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Last month rent (if applicable)</div><input className={inputCls} type="number" value={lastMonthRent} onChange={(e) => setLastMonthRent(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Furnished or unfurnished</div>
                <select className={selectCls} value={furnished} onChange={(e) => setFurnished(e.target.value as FurnishedType)}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="furnished">Furnished</option>
                </select>
              </label>
              <label className="text-sm sm:col-span-2"><div className={labelHeadCls}>Utilities included?</div>
                <select className={selectCls} value={utilitiesIncluded} onChange={(e) => setUtilitiesIncluded(e.target.value as YesNo)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>
          </div>

          {/* Living Costs */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">
              Living Costs{" "}
              <InfoTip text="These start with city averages, but you can edit them. The calculator then adjusts them using destination city multipliers and household size." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>Groceries <span className="text-slate-400">(average, editable)</span></div>
                <input className={inputCls} type="number" value={groceries} onChange={(e) => setGroceries(sanitizeNumeric(e.target.value))} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Utilities <span className="text-slate-400">(average, editable)</span></div>
                <input className={inputCls} type="number" value={utilities} onChange={(e) => setUtilities(sanitizeNumeric(e.target.value))} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Transportation <span className="text-slate-400">(average, editable)</span></div>
                <input className={inputCls} type="number" value={transportation} onChange={(e) => setTransportation(sanitizeNumeric(e.target.value))} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Healthcare <span className="text-slate-400">(average, editable)</span></div>
                <input className={inputCls} type="number" value={healthcare} onChange={(e) => setHealthcare(sanitizeNumeric(e.target.value))} placeholder=" " />
              </label>
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Need a car?{" "}<InfoTip text="Adds a simple $350/month USD estimate for car-related costs. Useful for places where transit may not cover your lifestyle." /></div>
                <select className={selectCls} value={needCar} onChange={(e) => setNeedCar(e.target.value as YesNo)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>
            <div className="mt-2 text-xs text-slate-500">Inputs start with city averages and stay editable so you can model your actual lifestyle.</div>
          </div>

          {/* One-Time Moving Costs */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">One-Time Moving Costs</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><div className={labelHeadCls}>Visa / permit estimate</div><input className={inputCls} type="number" value={visaCost} onChange={(e) => setVisaCost(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>One-way flight estimate</div><input className={inputCls} type="number" value={flightCost} onChange={(e) => setFlightCost(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Shipping / baggage estimate</div><input className={inputCls} type="number" value={shippingCost} onChange={(e) => setShippingCost(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Temporary housing estimate</div><input className={inputCls} type="number" value={temporaryStay} onChange={(e) => setTemporaryStay(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Setup / admin estimate</div><input className={inputCls} type="number" value={adminFees} onChange={(e) => setAdminFees(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Furniture / setup estimate</div><input className={inputCls} type="number" value={furnitureSetup} onChange={(e) => setFurnitureSetup(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
              <label className="text-sm sm:col-span-2"><div className={labelHeadCls}>Recommended cash buffer</div><input className={inputCls} type="number" value={emergencyCashBuffer} onChange={(e) => setEmergencyCashBuffer(sanitizeNumeric(e.target.value))} placeholder=" " /></label>
            </div>
            <div className="mt-4 w-full text-xs text-slate-500">Planning estimates only.</div>
          </div>
        </div>

        {/* ── RIGHT — RESULTS ── */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-2 text-sm font-semibold">Results</div>
            <div className="mb-3 text-xs text-slate-500">{ASIA_TAX_LABEL} · Planning estimates only</div>
            <div className="mb-2 space-y-1 text-sm text-slate-600">
              <div>Current: <span className="font-semibold">{fromCityLabel}</span>
                {getCountryByCode(fromCountry)?.name && fromCityLabel !== getCountryByCode(fromCountry)!.name && (
                  <span className="text-slate-400">, {getCountryByCode(fromCountry)!.name}</span>
                )}
              </div>
              <div>Target: <span className="font-semibold">{toCityLabel}</span>
                {getCountryByCode(toCountry)?.name && toCityLabel !== getCountryByCode(toCountry)!.name && (
                  <span className="text-slate-400">, {getCountryByCode(toCountry)!.name}</span>
                )}
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <div>Net monthly (current): <span className="font-semibold">{displayAmount(results.netMonthlyFrom)}</span></div>
              <div>Net monthly (target): <span className="font-semibold">{displayAmount(results.netMonthlyTo)}</span></div>

              {results.salaryReady && (
                <>
                  <div className="mt-2">Gross monthly: <span className="font-semibold">{displayAmount(results.grossMonthly, 2)}</span></div>
                  <div>
                    Est. tax + contributions (current):{" "}
                    <span className="font-semibold">{displayAmount(results.grossMonthly * results.currentTaxRate, 2)}</span>{" "}
                    <span className="text-xs text-slate-500">({(results.currentTaxRate * 100).toFixed(1)}%)</span>
                  </div>
                  <div>
                    Est. tax + contributions (target):{" "}
                    <span className="font-semibold">{displayAmount(results.grossMonthly * results.targetTaxRate, 2)}</span>{" "}
                    <span className="text-xs text-slate-500">({(results.targetTaxRate * 100).toFixed(1)}%)</span>
                  </div>

                  {/* Confidence banner */}
                  <div className={`mt-3 rounded-xl ring-1 overflow-hidden ${
                    results.targetConfidence === "verified"     ? "bg-emerald-50 ring-emerald-200"
                    : results.targetConfidence === "partial"   ? "bg-blue-50 ring-blue-200"
                    : results.targetConfidence === "placeholder" ? "bg-rose-50 ring-rose-200"
                    : "bg-amber-50 ring-amber-200"
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {results.targetConfidence === "verified"    && "Exact or near-exact for most incomes"}
                        {results.targetConfidence === "partial"     && "Sound structure · named gap ≤ ~4 pp"}
                        {results.targetConfidence === "simplified"  && "Reasonable ballpark · gap may be 5–10 pp"}
                        {results.targetConfidence === "placeholder" && "Directional only · verify before planning"}
                      </span>
                    </div>
                    {results.targetMissingFactor && (
                      <div className="px-4 pb-2 text-xs text-slate-600">
                        <span className="font-medium">Key gap: </span>{results.targetMissingFactor}
                      </div>
                    )}
                    {results.targetTaxNotes.length > 0 && (
                      <>
                        <button type="button" onClick={() => setTaxNotesExpanded(v => !v)}
                          className="flex w-full items-center justify-between border-t border-black/5 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-black/[0.03] transition-colors">
                          <span>{taxNotesExpanded ? "Hide detail" : "Show full detail"}</span>
                          <span className="opacity-50">{taxNotesExpanded ? "▲" : "▼"}</span>
                        </button>
                        {taxNotesExpanded && (
                          <div className="space-y-1.5 border-t border-black/5 px-4 py-3">
                            {results.targetTaxNotes.map((note, i) => (
                              <div key={i} className="flex gap-2 text-xs leading-5 text-slate-700">
                                <span className="mt-px shrink-0 opacity-40">•</span>
                                <span>{note}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
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
              <div className="mt-2">Housing % of net (target): <span className="font-semibold">{Number.isFinite(results.pct) ? `${results.pct.toFixed(1)}%` : "—"}</span></div>
              <div>Essential costs % of net:{" "}<span className="font-semibold">{Number.isFinite(results.totalPctOfNet) ? `${results.totalPctOfNet.toFixed(1)}%` : "—"}</span></div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 space-y-1">
              <div>Results are estimates only. No information entered is stored or shared.</div>
              <div>Tax estimates, rent, immigration costs, and retirement treatment vary by destination and personal circumstances.</div>
            </div>
            <div className="text-xs text-slate-500">Tip: Your URL updates as you type — copy the page link to share this scenario.</div>
          </div>

          {/* Monthly Flexibility */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Monthly Flexibility</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{results.salaryReady ? displayAmount(results.monthlyFlexibility, 2) : "—"}</div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">After housing and essentials</div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-rose-100">
              <div className={`h-full rounded-full ${
                !results.salaryReady ? "w-[0%] bg-slate-300"
                : results.monthlyFlexibility >= 3000 ? "w-[92%] bg-emerald-500"
                : results.monthlyFlexibility >= 2000 ? "w-[76%] bg-emerald-400"
                : results.monthlyFlexibility >= 1000 ? "w-[58%] bg-amber-400"
                : results.monthlyFlexibility >= 500  ? "w-[40%] bg-orange-400"
                : "w-[24%] bg-rose-400"
              }`} />
            </div>
            <div className="mt-3 text-sm text-slate-700">
              {!results.salaryReady
                ? "Add salary and housing inputs to estimate how much room you have left each month."
                : `This is what you may have left each month in ${toCityLabel} after housing costs and core living expenses.`}
            </div>
            <div className="mt-2 text-xs text-slate-500">Higher flexibility gives you more room for saving, investing, travel, and unexpected expenses.</div>
          </div>

          {/* Readiness Summary */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Move Readiness</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {results.salaryReady ? `${results.comfort.band} · ${results.comfort.label}` : "—"}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {!results.salaryReady
                ? "Add your income to see whether this move looks comfortable, manageable, tight, or stretched."
                : results.comfort.note}
            </p>
            {results.salaryReady && (
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <div className="flex justify-between gap-3">
                  <span>Monthly flexibility</span>
                  <span className="font-semibold text-slate-900">{displayAmount(results.monthlyFlexibility, 0)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Upfront cash needed</span>
                  <span className="font-semibold text-slate-900">{displayAmount(results.upfrontCashNeeded, 0)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Months covered by savings</span>
                  <span className="font-semibold text-slate-900">{Number.isFinite(results.monthsCovered) ? results.monthsCovered.toFixed(1) : "—"}</span>
                </div>
              </div>
            )}
            {results.salaryReady && (
              <div className="mt-2 text-xs text-slate-500">
                {results.monthlyFlexibility < 0
                  ? "Your monthly budget breaks — expenses exceed income."
                  : results.totalPctOfNet > 80
                  ? "Your risk is tight cash flow — small changes could break your budget."
                  : results.upfrontCashNeeded > convertLocalToUsd(nz(currentSavings), fromCountry)
                  ? "Your risk is upfront cash — you don't have enough saved for the move."
                  : "You have breathing room — this move looks financially stable based on your inputs."}
              </div>
            )}
            <div className="mt-3 text-xs text-slate-500">This combines income, taxes, housing, living costs, savings, and one-time move costs.</div>
          </div>

          {/* Comparable Salary */}
          {results.salaryReady && (
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
              <div className="text-xs font-semibold tracking-widest text-slate-500">COMPARABLE SALARY</div>
              <div className="mt-2 text-3xl font-bold">{displayAmount(results.comparableSalary)}</div>
              <p className="mt-2 text-sm text-slate-600">
                {toCityLabel} is roughly <span className="font-semibold">{Math.abs(Math.round(results.relativeDifference * 100))}%</span>{" "}
                {results.relativeDifference >= 0 ? "more" : "less"} expensive than {fromCityLabel}.
              </p>
              <div className="mt-1 text-xs text-slate-500">Based on housing, transportation, healthcare, and essential cost weighting.</div>
            </div>
          )}

          {/* Comfort Score */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                  {mode === "retired" ? "Retirement Readiness Score" : "Comfort Score™"}
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{results.comfort.band} · {results.comfort.label}</div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">Essential costs</div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-rose-100">
              <div className={`h-full rounded-full ${
                results.comfort.band === "A" ? "w-[92%] bg-emerald-500"
                : results.comfort.band === "B" ? "w-[78%] bg-emerald-400"
                : results.comfort.band === "C" ? "w-[60%] bg-amber-400"
                : "w-[42%] bg-orange-400"
              }`} />
            </div>
            <div className="mt-3 text-sm text-slate-700">{results.comfort.note}</div>
            <div className="mt-2 text-xs text-slate-500">Based on how much of your net monthly income goes toward housing and essential living costs.</div>
          </div>

          {/* Share */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Share this scenario</div>
                <div className="mt-1 text-sm text-slate-700">Copy your current comparison link and send it to a partner, friend, or future self.</div>
              </div>
              <button type="button"
                onClick={async () => {
                  try {
                    const shareUrl = new URL(window.location.href);
                    const shareText = `My Asia relocation scenario: ${fromCityLabel} → ${toCityLabel}. Monthly flexibility ${displayAmount(results.monthlyFlexibility, 0)} after housing.`;
                    const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                    if (canNativeShare) {
                      await (navigator as Navigator & { share: (d: { title?: string; text?: string; url?: string }) => Promise<void> }).share({ title: "My Asia Relocation Scenario", text: shareText, url: shareUrl.toString() });
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
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                {shareStatus === "copied" ? "Link copied!" : shareStatus === "shared" ? "Shared!" : shareStatus === "error" ? "Share failed" : "Share scenario"}
              </button>
            </div>
          </div>

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