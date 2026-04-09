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
import {
  getCityDefaultsByCode,
} from "@/lib/internationalCityDefaults";
import {
  estimateInternationalTax,
} from "@/lib/internationalTaxes";
import { getCityCostMultipliers } from "@/lib/internationalCityCosts";
import { USD_TO_LOCAL } from "@/lib/internationalFx";
import AdSlot from "./AdSlot";

// ---------------------------------------------------------------------------
// EUROPE-SPECIFIC CONFIG
// ---------------------------------------------------------------------------

const EUROPE_COUNTRY_CODES = new Set([
  "GB", "PT", "ES", "DE", "NL", "FR", "IT", "IE", "CH",
  "AT", "BE", "DK", "SE", "NO", "FI", "PL", "CZ", "HU",
  "GR", "TR", "HR", "EE", "LV", "LT", "RO", "BG", "SI",
  "SK", "MT", "CY",
]);

const EUROPE_VISA_CONTEXT: Record<string, {
  program: string;
  notes: string;
  estimatedFee: number;
  euFreeMovement: boolean;
  highlight?: string;
}> = {
  PT: {
    program: "D7 Passive Income / Digital Nomad Visa",
    highlight: "D7 Visa",
    notes: "Popular with remote workers and retirees. Requires proof of passive income (~€760/mo minimum). Path to NHR tax regime (now IFICI). EU freedom of movement for EU citizens.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  ES: {
    program: "Non-Lucrative Visa / Digital Nomad Visa",
    highlight: "Digital Nomad Visa",
    notes: "Non-Lucrative Visa requires ~€2,400/mo income and prohibits local employment. Spain's Digital Nomad Visa allows remote work for non-EU employers. Beckham Law may apply for some.",
    estimatedFee: 300,
    euFreeMovement: true,
  },
  DE: {
    program: "Freelance Visa / Skilled Worker Visa",
    highlight: "Freelance Visa",
    notes: "Freelance (Freiberufler) visa available for recognized professions. Germany's new Opportunity Card (Chancenkarte) allows job-seeking stays. EU citizens move freely.",
    estimatedFee: 300,
    euFreeMovement: true,
  },
  NL: {
    program: "Highly Skilled Migrant / Orientation Year Visa",
    highlight: "Highly Skilled Migrant",
    notes: "Highly Skilled Migrant program for employer-sponsored moves. DAFT visa for US citizens starting a business. 30% ruling tax benefit for qualifying expats.",
    estimatedFee: 300,
    euFreeMovement: true,
  },
  FR: {
    program: "Long-Stay Visa (VLS-TS)",
    highlight: "Long-Stay Visa",
    notes: "VLS-TS visa required for stays over 90 days. Separate categories for employees, self-employed, and passive-income earners. EU freedom of movement for EU citizens.",
    estimatedFee: 300,
    euFreeMovement: true,
  },
  IT: {
    program: "Elective Residency / Digital Nomad Visa",
    highlight: "Digital Nomad Visa",
    notes: "Elective Residency Visa for self-sufficient income (~€31k/yr). Italy's Digital Nomad Visa launched 2024. Italy's Flat Tax regime (€100k/yr) attracts high earners.",
    estimatedFee: 300,
    euFreeMovement: true,
  },
  GB: {
    program: "Skilled Worker / Global Talent Visa",
    highlight: "Global Talent Visa",
    notes: "Post-Brexit, EU citizens need a visa like all others. Skilled Worker Visa requires employer sponsorship. Global Talent Visa for leaders in tech, arts, and science.",
    estimatedFee: 700,
    euFreeMovement: false,
  },
  IE: {
    program: "Critical Skills / Stamp 0 (Independent Means)",
    highlight: "Critical Skills Permit",
    notes: "Critical Skills Employment Permit for in-demand roles. Stamp 0 for financially independent retirees (€50k/yr income). EU citizens move freely.",
    estimatedFee: 350,
    euFreeMovement: true,
  },
  CH: {
    program: "EU/EFTA Permit / Non-EU Work Permit (B/L)",
    highlight: "Non-EU Work Permit",
    notes: "Switzerland is not EU — separate permit system. EU/EFTA citizens get preferential access. Non-EU: employer sponsorship typically required. Strict quotas apply.",
    estimatedFee: 350,
    euFreeMovement: false,
  },
  AT: {
    program: "Red-White-Red Card / EU Freedom of Movement",
    highlight: "Red-White-Red Card",
    notes: "Red-White-Red Card for skilled workers, self-employed, and graduates. Points-based system. EU citizens move freely.",
    estimatedFee: 300,
    euFreeMovement: true,
  },
  BE: {
    program: "Single Permit / EU Freedom of Movement",
    highlight: "Single Permit",
    notes: "Non-EU workers need a Single Permit combining work and residence. EU citizens move freely and can register as residents within 3 months.",
    estimatedFee: 300,
    euFreeMovement: true,
  },
  DK: {
    program: "Pay Limit / Positive List Scheme",
    highlight: "Pay Limit Scheme",
    notes: "Pay Limit Scheme for high earners (DKK 500k+/yr). Positive List for shortage occupations. Researchers and startup founders have dedicated paths. EU freedom of movement.",
    estimatedFee: 350,
    euFreeMovement: true,
  },
  SE: {
    program: "Work Permit / EU Freedom of Movement",
    highlight: "Work Permit",
    notes: "Sweden's work permit requires an employer offer. High salary requirements. Digital Nomad Visa not yet established. EU citizens move freely.",
    estimatedFee: 350,
    euFreeMovement: true,
  },
  NO: {
    program: "Skilled Worker Permit / EEA Citizen Registration",
    highlight: "Skilled Worker Permit",
    notes: "EEA citizens (includes EU) can register after 3 months. Non-EEA need a skilled worker permit with employer sponsorship. Norway is not EU but is in the EEA/Schengen.",
    estimatedFee: 350,
    euFreeMovement: false,
  },
  FI: {
    program: "Residence Permit / EU Freedom of Movement",
    highlight: "Residence Permit",
    notes: "EU citizens register at local office. Non-EU need a residence permit — categories include employee, self-employed, and family. Finland's startup permit available.",
    estimatedFee: 350,
    euFreeMovement: true,
  },
  PL: {
    program: "Temporary Residence Permit / EU Freedom of Movement",
    highlight: "Temporary Residence Permit",
    notes: "Non-EU nationals need a temporary or permanent residence permit. EU citizens register freely. Poland is a growing destination for remote workers due to low cost of living.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  CZ: {
    program: "Long-Term Residence Permit / EU Freedom of Movement",
    highlight: "Long-Term Residence Permit",
    notes: "Non-EU nationals apply for long-term residence. Zivno (trade) license available for freelancers. EU citizens move freely. Prague increasingly popular with expats.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  HU: {
    program: "White Card / Guest Investor / EU Freedom of Movement",
    highlight: "White Card",
    notes: "Hungary's White Card offers 2-year renewable stay for remote workers (€2k/mo income). Guest Investor Card for property investors. EU citizens move freely.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  GR: {
    program: "Digital Nomad Visa / Golden Visa",
    highlight: "Digital Nomad Visa",
    notes: "Greece's Digital Nomad Visa: €3,500/mo income, initial 1-year stay. Golden Visa via property investment (thresholds raised to €800k in prime areas). EU citizens move freely.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  TR: {
    program: "Short-Term Residence Permit",
    highlight: "Short-Term Residence Permit",
    notes: "Short-term residence permit available for property owners or those with sufficient income. Turkey is not in the EU or Schengen. Popular with cost-conscious expats.",
    estimatedFee: 200,
    euFreeMovement: false,
  },
  HR: {
    program: "Digital Nomad Temporary Stay / EU Freedom of Movement",
    highlight: "Digital Nomad Permit",
    notes: "Croatia's Digital Nomad permit (temporary stay) for non-EU workers: ~€2,300/mo income. Croatia joined Schengen in 2023. EU citizens move freely.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  EE: {
    program: "Digital Nomad Visa / EU Freedom of Movement",
    highlight: "Digital Nomad Visa",
    notes: "Estonia's Digital Nomad Visa: €3,504/mo gross income. Also offers e-Residency (business, not physical residency). EU citizens move freely.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  LV: {
    program: "Temporary Residence Permit / EU Freedom of Movement",
    highlight: "Temporary Residence Permit",
    notes: "Temporary residence permits available for passive income, employment, or self-employment. EU citizens move freely. Lower cost of living in EU.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  LT: {
    program: "Temporary Residence Permit / EU Freedom of Movement",
    highlight: "Temporary Residence Permit",
    notes: "Non-EU nationals apply for temporary residence. EU citizens move freely. Lithuania offers a startup visa for entrepreneurs.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  RO: {
    program: "Long-Stay Visa / EU Freedom of Movement",
    highlight: "Long-Stay Visa",
    notes: "Non-EU nationals need a long-stay visa followed by a residence permit. EU citizens move freely. Romania is one of Europe's most affordable destinations.",
    estimatedFee: 220,
    euFreeMovement: true,
  },
  BG: {
    program: "Long-Term Residence Permit / EU Freedom of Movement",
    highlight: "Long-Term Residence Permit",
    notes: "Non-EU nationals apply for long-term residence after 5 years. EU citizens move freely. Bulgaria has the EU's lowest income tax rate (10% flat).",
    estimatedFee: 220,
    euFreeMovement: true,
  },
  SI: {
    program: "Temporary Residence Permit / EU Freedom of Movement",
    highlight: "Temporary Residence Permit",
    notes: "Non-EU nationals need a temporary residence permit. EU citizens move freely. Slovenia offers a solid quality of life at moderate cost.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  SK: {
    program: "Temporary Residence Permit / EU Freedom of Movement",
    highlight: "Temporary Residence Permit",
    notes: "Non-EU nationals apply for temporary residence. EU citizens move freely. Slovakia's cost of living is lower than Western Europe.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  MT: {
    program: "Malta Nomad Residence Permit / EU Freedom of Movement",
    highlight: "Nomad Residence Permit",
    notes: "Malta's Nomad Residence Permit: €2,700/mo net income, 1-year renewable. Global Residence Programme for non-EU retirees. EU citizens move freely. English is official language.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
  CY: {
    program: "Digital Nomad Visa / EU Freedom of Movement",
    highlight: "Digital Nomad Visa",
    notes: "Cyprus Digital Nomad Visa: €3,500/mo net income. Non-domicile tax regime exempts foreign-source dividends and interest. EU citizens move freely.",
    estimatedFee: 250,
    euFreeMovement: true,
  },
};

// ---------------------------------------------------------------------------
// EUROPE COST DEFAULTS (fallback when no city-level data exists)
// ---------------------------------------------------------------------------
const EUROPE_COST_DEFAULTS: Record<string, {
  groceries: number; utilities: number; transport: number; healthcare: number;
}> = {
  GB: { groceries: 600, utilities: 200, transport: 150, healthcare: 200 },
  PT: { groceries: 380, utilities: 130, transport: 50,  healthcare: 100 },
  ES: { groceries: 400, utilities: 140, transport: 55,  healthcare: 110 },
  DE: { groceries: 500, utilities: 180, transport: 90,  healthcare: 160 },
  NL: { groceries: 520, utilities: 180, transport: 90,  healthcare: 160 },
  FR: { groceries: 480, utilities: 170, transport: 80,  healthcare: 150 },
  IT: { groceries: 420, utilities: 150, transport: 65,  healthcare: 130 },
  IE: { groceries: 580, utilities: 190, transport: 120, healthcare: 180 },
  CH: { groceries: 800, utilities: 250, transport: 100, healthcare: 400 },
  AT: { groceries: 480, utilities: 160, transport: 80,  healthcare: 140 },
  BE: { groceries: 490, utilities: 170, transport: 85,  healthcare: 145 },
  DK: { groceries: 600, utilities: 200, transport: 100, healthcare: 180 },
  SE: { groceries: 560, utilities: 190, transport: 95,  healthcare: 170 },
  NO: { groceries: 700, utilities: 220, transport: 110, healthcare: 200 },
  FI: { groceries: 530, utilities: 185, transport: 90,  healthcare: 160 },
  PL: { groceries: 300, utilities: 120, transport: 40,  healthcare: 80  },
  CZ: { groceries: 320, utilities: 130, transport: 45,  healthcare: 90  },
  HU: { groceries: 310, utilities: 125, transport: 42,  healthcare: 85  },
  GR: { groceries: 380, utilities: 140, transport: 55,  healthcare: 110 },
  TR: { groceries: 250, utilities: 100, transport: 35,  healthcare: 70  },
  HR: { groceries: 360, utilities: 135, transport: 50,  healthcare: 100 },
  EE: { groceries: 380, utilities: 140, transport: 55,  healthcare: 110 },
  LV: { groceries: 350, utilities: 130, transport: 48,  healthcare: 100 },
  LT: { groceries: 340, utilities: 128, transport: 46,  healthcare: 98  },
  RO: { groceries: 290, utilities: 115, transport: 38,  healthcare: 75  },
  BG: { groceries: 280, utilities: 110, transport: 35,  healthcare: 70  },
  SI: { groceries: 390, utilities: 145, transport: 58,  healthcare: 115 },
  SK: { groceries: 330, utilities: 128, transport: 46,  healthcare: 92  },
  MT: { groceries: 450, utilities: 155, transport: 65,  healthcare: 130 },
  CY: { groceries: 420, utilities: 150, transport: 60,  healthcare: 120 },
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const FX_FALLBACK: Record<string, number> = {
  AT: 0.92,
  BE: 0.92,
};

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
};

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type Mode = "working" | "retired";
type FilingStatus = "single" | "married";
type SalaryType = "local" | "remote";
type FurnishedType = "furnished" | "unfurnished";
type YesNo = "yes" | "no";
type CurrencyDisplay = "USD" | "CURRENT" | "DESTINATION";
type Confidence = "high" | "moderate" | "simplified" | "pending";

// ---------------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------------
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

function getReadinessBand(ratio: number) {
  if (ratio <= 0.25) return { band: "A", label: "Comfortable", note: "This looks healthy relative to your estimated target net income." };
  if (ratio <= 0.35) return { band: "B", label: "Manageable", note: "Doable, but keep an eye on recurring costs and setup cash." };
  if (ratio <= 0.45) return { band: "C", label: "Tight", note: "Possible, but the margin for error is thinner." };
  return { band: "D", label: "Stretched", note: "Housing is taking up a large share of the budget." };
}

function confidenceBadge(confidence: Confidence) {
  switch (confidence) {
    case "high":       return { label: "● High confidence",     cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
    case "moderate":   return { label: "● Moderate",            cls: "bg-amber-50 text-amber-700 ring-amber-200" };
    case "simplified": return { label: "● Simplified estimate", cls: "bg-orange-50 text-orange-700 ring-orange-200" };
    default:           return { label: "⚠ Pending",             cls: "bg-slate-50 text-slate-500 ring-slate-200" };
  }
}

// Derive a confidence level from the existing tax estimate model string
function taxModelToConfidence(model: string): Confidence {
  if (model === "progressive" || model === "flat") return "high";
  if (model === "simplified" || model === "estimated") return "simplified";
  return "moderate";
}

// ---------------------------------------------------------------------------
// TAX ASSUMPTIONS LABEL
// ---------------------------------------------------------------------------
const EUROPE_TAX_ASSUMPTIONS_LABEL = "Tax estimates: March 2026";

const inputCls  = "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-indigo-500/15";
const selectCls = "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-indigo-500/15";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600";

// ---------------------------------------------------------------------------
// INFO TIP
// ---------------------------------------------------------------------------
function InfoTip({ text, align = "left" }: { text: string; align?: "left" | "right" | "center" }) {
  const positionClass = align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        i
      </button>
      <span className={`pointer-events-none absolute top-full z-50 mt-2 hidden max-w-[calc(100vw-2rem)] w-72 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-5 text-white shadow-xl group-hover:block group-focus-within:block ${positionClass}`}>
        {text}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// VISA CONTEXT CARD
// ---------------------------------------------------------------------------
function VisaContextCard({ countryCode }: { countryCode: string }) {
  const ctx = EUROPE_VISA_CONTEXT[countryCode];
  if (!ctx) return null;
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 text-xl">
          {ctx.euFreeMovement ? "🇪🇺" : "🌐"}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
            Visa &amp; Permit Context
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{ctx.program}</div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{ctx.notes}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {ctx.highlight && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                {ctx.highlight}
              </span>
            )}
            {ctx.euFreeMovement && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                EU Freedom of Movement
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Est. permit fee: {money(ctx.estimatedFee, 0, "USD")}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500">
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
export default function EuropeRelocationCalculator() {
  const hasMounted = useRef(false);
  const [qsHydrated, setQsHydrated] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");

  const [mode, setMode] = useState<Mode>("working");
  const [salary, setSalary] = useState<string>("150000");
  const [retirementIncome, setRetirementIncome] = useState<string>("70000");
  const [filing, setFiling] = useState<FilingStatus>("single");

  const [fromCountry, setFromCountry] = useState<string>("US");
  const [toCountry, setToCountry] = useState<string>("PT");
  const [fromCityCode, setFromCityCode] = useState<string>("US-NYC");
  const [toCityCode, setToCityCode] = useState<string>("PT-LIS");

  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>("USD");
  const [salaryType, setSalaryType] = useState<SalaryType>("remote");
  const [adults, setAdults] = useState<string>("1");
  const [children, setChildren] = useState<string>("0");

  // Conditional answers for country-specific follow-up questions
  const [conditionalAnswers, setConditionalAnswers] = useState<Record<string, string>>({});

  const [destinationRent, setDestinationRent] = useState<string>("2200");
  const [depositRequired, setDepositRequired] = useState<string>("2200");
  const [firstMonthRent, setFirstMonthRent] = useState<string>("2200");
  const [lastMonthRent, setLastMonthRent] = useState<string>("0");
  const [furnished, setFurnished] = useState<FurnishedType>("unfurnished");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<YesNo>("no");

  const [groceries, setGroceries] = useState<string>("420");
  const [utilities, setUtilities] = useState<string>("150");
  const [transportation, setTransportation] = useState<string>("45");
  const [healthcare, setHealthcare] = useState<string>("120");

  const [visaCost, setVisaCost] = useState<string>("250");
  const [flightCost, setFlightCost] = useState<string>("650");
  const [shippingCost, setShippingCost] = useState<string>("400");
  const [temporaryStay, setTemporaryStay] = useState<string>("1800");
  const [adminFees, setAdminFees] = useState<string>("300");
  const [furnitureSetup, setFurnitureSetup] = useState<string>("1200");
  const [emergencyCashBuffer, setEmergencyCashBuffer] = useState<string>("5000");
  const [currentSavings, setCurrentSavings] = useState<string>("25000");
  const [needCar, setNeedCar] = useState<YesNo>("no");

  const nz = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

  // Derive income scenario (mirrors Caribbean pattern)
  const incomeScenario: "remote" | "local" | "retired" =
    mode === "retired" ? "retired" : salaryType === "remote" ? "remote" : "local";

  const allCountriesSorted = useMemo(() =>
    [...INTERNATIONAL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)), []
  );

  const europeCountriesSorted = useMemo(() =>
    [...INTERNATIONAL_COUNTRIES]
      .filter(c => EUROPE_COUNTRY_CODES.has(c.code))
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
  const toCityLabel   = getInternationalCityByCode(toCityCode)?.name  ?? "Target city";

  const selectedCityDefaults = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);
  const currentCityDefaults  = useMemo(() => getCityDefaultsByCode(fromCityCode), [fromCityCode]);
  const targetCityDefaults   = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);
  const fromCityMultipliers  = useMemo(() => getCityCostMultipliers(fromCityCode), [fromCityCode]);
  const toCityMultipliers    = useMemo(() => getCityCostMultipliers(toCityCode), [toCityCode]);

  // Reset conditional answers when country or scenario changes
  useEffect(() => {
    setConditionalAnswers({});
  }, [toCountry, incomeScenario]);

  // Sync city when country changes
  useEffect(() => {
    const valid = fromCities.some(c => c.code === fromCityCode);
    if (!valid) setFromCityCode(fromCities[0]?.code ?? "");
  }, [fromCountry, fromCities, fromCityCode]);

  useEffect(() => {
    const valid = toCities.some(c => c.code === toCityCode);
    if (!valid) setToCityCode(toCities[0]?.code ?? "");
  }, [toCountry, toCities, toCityCode]);

  // Auto-fill from city-level defaults
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
    setHealthcare(String(d.monthlyDefaults.healthcare));
    setVisaCost(String(d.startupCosts.visa));
    setFlightCost(String(d.startupCosts.flight));
    setShippingCost(String(d.startupCosts.shipping));
    setTemporaryStay(String(d.startupCosts.temporaryStay));
    setAdminFees(String(d.startupCosts.adminFees));
    setFurnitureSetup(String(d.housing.furnishedSetupCost));
    setEmergencyCashBuffer(String(d.startupCosts.emergencyBuffer));
  }, [selectedCityDefaults, qsHydrated]);

  // Fallback to country-level cost defaults when no city data
  useEffect(() => {
    if (selectedCityDefaults) return;
    if (!qsHydrated) return;
    const d = EUROPE_COST_DEFAULTS[toCountry];
    if (!d) return;
    setGroceries(String(d.groceries));
    setUtilities(String(d.utilities));
    setTransportation(String(d.transport));
    setHealthcare(String(d.healthcare));
  }, [toCountry, selectedCityDefaults, qsHydrated]);

  // QS hydration on mount
  useEffect(() => {
    const qs = getQS();
    const vMode = qs.get("mode"); if (vMode === "working" || vMode === "retired") setMode(vMode);
    const vFiling = qs.get("filing") as FilingStatus | null; if (vFiling === "single" || vFiling === "married") setFiling(vFiling);
    const vFromCountry = qs.get("fromCountry"); if (vFromCountry) setFromCountry(vFromCountry);
    const vToCountry = qs.get("toCountry");
    if (vToCountry && EUROPE_COUNTRY_CODES.has(vToCountry)) setToCountry(vToCountry);
    const vFromCity = qs.get("fromCityCode"); if (vFromCity) setFromCityCode(vFromCity);
    const vToCity = qs.get("toCityCode"); if (vToCity) setToCityCode(vToCity);
    const vSalary = qs.get("salary"); if (vSalary) setSalary(vSalary);
    const vRetirement = qs.get("retirement"); if (vRetirement) setRetirementIncome(vRetirement);
    const vCurrency = qs.get("currency") as CurrencyDisplay | null;
    if (vCurrency === "USD" || vCurrency === "CURRENT" || vCurrency === "DESTINATION") setCurrencyDisplay(vCurrency);
    const vSalaryType = qs.get("salaryType") as SalaryType | null;
    if (vSalaryType === "remote" || vSalaryType === "local") setSalaryType(vSalaryType);
    const vAdults = qs.get("adults"); if (vAdults) setAdults(vAdults);
    const vChildren = qs.get("children"); if (vChildren) setChildren(vChildren);
    const vRent = qs.get("rent"); if (vRent) setDestinationRent(vRent);
    const vDeposit = qs.get("deposit"); if (vDeposit) setDepositRequired(vDeposit);
    const vFirst = qs.get("firstRent"); if (vFirst) setFirstMonthRent(vFirst);
    const vLast = qs.get("lastRent"); if (vLast) setLastMonthRent(vLast);
    const vFurnished = qs.get("furnished") as FurnishedType | null;
    if (vFurnished === "furnished" || vFurnished === "unfurnished") setFurnished(vFurnished);
    const vUtilIncl = qs.get("utilIncl") as YesNo | null;
    if (vUtilIncl === "yes" || vUtilIncl === "no") setUtilitiesIncluded(vUtilIncl);
    const fields: [string, (v: string) => void][] = [
      ["groceries", setGroceries], ["utilities", setUtilities], ["transport", setTransportation],
      ["healthcare", setHealthcare], ["visa", setVisaCost], ["flight", setFlightCost],
      ["shipping", setShippingCost], ["tempStay", setTemporaryStay], ["admin", setAdminFees],
      ["furniture", setFurnitureSetup], ["emergency", setEmergencyCashBuffer], ["savings", setCurrentSavings],
    ];
    for (const [key, setter] of fields) { const val = qs.get(key); if (val) setter(val); }
    const vCar = qs.get("car") as YesNo | null; if (vCar === "yes" || vCar === "no") setNeedCar(vCar);
    setQsHydrated(true);
  }, []);

  // QS sync on state change
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
    setQS(qs);
  }, [
    mode, filing, fromCountry, toCountry, fromCityCode, toCityCode,
    salary, retirementIncome, currencyDisplay, salaryType, adults, children,
    destinationRent, depositRequired, firstMonthRent, lastMonthRent, furnished,
    utilitiesIncluded, groceries, utilities, transportation, healthcare, visaCost,
    flightCost, shippingCost, temporaryStay, adminFees, furnitureSetup,
    emergencyCashBuffer, currentSavings, needCar,
  ]);

  const targetProfile = getCountryByCode(toCountry);

  // ---------------------------------------------------------------------------
  // RESULTS MEMO
  // ---------------------------------------------------------------------------
  const results = useMemo(() => {
    const baseAnnualIncome = mode === "retired" ? nz(retirementIncome) : nz(salary);
    const salaryReady = baseAnnualIncome > 0;

    const annualIncome = convertLocalToUsd(baseAnnualIncome, fromCountry);
    const destToUsd = (v: number) => convertLocalToUsd(v, toCountry);

    const grossMonthly = annualIncome / 12;
    const annualIncomeForFromTax = convertUsdToLocal(annualIncome, fromCountry);
    const annualIncomeForToTax   = convertUsdToLocal(annualIncome, toCountry);

    const currentTaxEstimate = estimateInternationalTax({
      countryCode: fromCountry,
      annualIncome: annualIncomeForFromTax,
      filing,
      isRetired: mode === "retired",
    });

    const targetTaxEstimate = estimateInternationalTax({
      countryCode: toCountry,
      annualIncome: annualIncomeForToTax,
      filing,
      isRetired: mode === "retired",
    });

    const currentTaxRate = currentTaxEstimate.effectiveRate;
    const targetTaxRate  = targetTaxEstimate.effectiveRate;

    // Build confidence + notes from the existing tax estimate shape
    const targetConfidence: Confidence = taxModelToConfidence(targetTaxEstimate.model ?? "");
    const targetTaxNotes: string[] = [];
    if (targetTaxEstimate.note) targetTaxNotes.push(targetTaxEstimate.note);
    if (incomeScenario === "remote") {
      targetTaxNotes.push("Remote / foreign-source income treatment varies by country. Some European countries offer special regimes for new residents.");
    }
    // Portugal NHR note
    if (toCountry === "PT" && incomeScenario === "remote") {
      targetTaxNotes.push("Portugal's IFICI (formerly NHR) regime may significantly reduce taxes for qualifying new residents. Consult a tax advisor.");
    }
    // Spain Beckham note
    if (toCountry === "ES" && incomeScenario === "remote") {
      targetTaxNotes.push("Spain's Beckham Law (Régimen de Impatriados) applies a 24% flat rate on Spanish-source income for qualifying workers. Check eligibility.");
    }
    // Italy flat tax note
    if (toCountry === "IT") {
      targetTaxNotes.push("Italy offers a €100k/yr flat tax on foreign-source income for qualifying new residents (Flat Tax for New Residents).");
    }
    // Netherlands 30% ruling
    if (toCountry === "NL") {
      targetTaxNotes.push("The Netherlands' 30% ruling provides a tax-free allowance on up to 30% of gross salary for qualifying expat workers for 5 years.");
    }

    const currentAnnualNetUsd  = annualIncome * (1 - currentTaxRate);
    const currentAnnualTaxUsd  = annualIncome * currentTaxRate;
    const targetAnnualTaxUsd   = annualIncome * targetTaxRate;
    const targetAnnualNetUsd   = annualIncome - targetAnnualTaxUsd;

    const currentMonthlyTaxUsd = currentAnnualTaxUsd / 12;
    const targetMonthlyTaxUsd  = targetAnnualTaxUsd / 12;
    const netMonthlyFrom = currentAnnualNetUsd / 12;
    const netMonthlyTo   = targetAnnualNetUsd / 12;
    const monthlyIncomeDiff = netMonthlyTo - netMonthlyFrom;

    const adultCount = Math.max(1, nz(adults));
    const childCount = Math.max(0, nz(children));
    const familyGroceries      = destToUsd(nz(groceries))      * (1 + (adultCount - 1) * 0.55 + childCount * 0.35);
    const familyTransportation = destToUsd(nz(transportation)) * (1 + (adultCount - 1) * 0.35 + childCount * 0.15);
    const healthcareAdj        = destToUsd(nz(healthcare))     * (1 + (adultCount - 1) * 0.7  + childCount * 0.5);
    const familyUtilities      = destToUsd(nz(utilities))      * (1 + (adultCount - 1) * 0.25 + childCount * 0.15);

    const groceriesAdj      = familyGroceries      * toCityMultipliers.groceries;
    const transportationAdj = familyTransportation * toCityMultipliers.transit;
    const utilitiesAdj      = familyUtilities      * toCityMultipliers.utilities;
    const rentTo            = destToUsd(nz(destinationRent)) * toCityMultipliers.housing;

    const groceriesFrom      = familyGroceries      * fromCityMultipliers.groceries;
    const transportationFrom = familyTransportation * fromCityMultipliers.transit;
    const utilitiesFrom      = familyUtilities      * fromCityMultipliers.utilities;

    const carCost          = needCar === "yes" ? destToUsd(350) : 0;
    const housingUtilities = utilitiesIncluded === "yes" ? 0 : utilitiesAdj;
    const housingTotal     = rentTo + housingUtilities + carCost;
    const livingCosts      = groceriesAdj + transportationAdj + healthcareAdj;
    const monthlyFlexibility = netMonthlyTo - housingTotal - livingCosts;
    const housingPctOfNet    = netMonthlyTo > 0 ? housingTotal / netMonthlyTo : 0;
    const comfort            = getReadinessBand(housingPctOfNet);

    const furnitureAdj = furnished === "furnished" ? 0 : destToUsd(nz(furnitureSetup));
    const upfrontCashNeeded =
      destToUsd(nz(depositRequired)) + destToUsd(nz(firstMonthRent)) + destToUsd(nz(lastMonthRent)) +
      destToUsd(nz(visaCost)) + destToUsd(nz(flightCost)) + destToUsd(nz(shippingCost)) +
      destToUsd(nz(temporaryStay)) + destToUsd(nz(adminFees)) + furnitureAdj + destToUsd(nz(emergencyCashBuffer));

    const totalMonthlyOutflow = housingTotal + livingCosts;
    const monthsCovered = totalMonthlyOutflow > 0 ? destToUsd(nz(currentSavings)) / totalMonthlyOutflow : 0;

    const currentProfile = getCountryByCode(fromCountry);
    const fromIndex = currentCityDefaults?.costIndex ?? currentProfile?.monthlyCostIndexSingle ?? 1;
    const toIndex   = targetCityDefaults?.costIndex  ?? targetProfile?.monthlyCostIndexSingle  ?? 1;
    const comparableSalary   = fromIndex > 0 ? annualIncome * (toIndex / fromIndex) : annualIncome;
    const relativeDifference = fromIndex > 0 ? (toIndex - fromIndex) / fromIndex : 0;

    return {
      salaryReady,
      annualIncome,
      grossMonthly,
      currentTaxRate,
      targetTaxRate,
      currentMonthlyTaxUsd,
      targetMonthlyTaxUsd,
      targetTaxNotes,
      targetConfidence,
      netMonthlyFrom,
      netMonthlyTo,
      monthlyIncomeDiff,
      groceriesFrom,
      transportationFrom,
      utilitiesFrom,
      groceriesAdj,
      transportationAdj,
      healthcareAdj,
      utilitiesAdj,
      housingTotal,
      rentTo,
      housingUtilities,
      carCost,
      livingCosts,
      monthlyFlexibility,
      pct: housingPctOfNet * 100,
      comfort,
      upfrontCashNeeded,
      monthsCovered,
      comparableSalary,
      relativeDifference,
    };
  }, [
    mode, salary, retirementIncome, salaryType, filing, fromCountry, toCountry,
    incomeScenario,
    fromCityMultipliers, toCityMultipliers, currentCityDefaults, targetCityDefaults,
    adults, children, needCar, furnished, utilitiesIncluded, utilities, destinationRent,
    groceries, transportation, healthcare, depositRequired, firstMonthRent, lastMonthRent,
    visaCost, flightCost, shippingCost, temporaryStay, adminFees, furnitureSetup,
    emergencyCashBuffer, currentSavings, targetProfile,
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
    setConditionalAnswers({});
  }

  const badge = confidenceBadge(results.targetConfidence);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="text-slate-900">
      {/* Mode toggle + reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold" />
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70">
            <button
              type="button"
              onClick={() => setMode("working")}
              className={`rounded-lg px-3 py-1 text-sm ${mode === "working" ? "bg-slate-900 text-white" : "text-slate-700"}`}
            >
              Working
            </button>
            <button
              type="button"
              onClick={() => setMode("retired")}
              className={`rounded-lg px-3 py-1 text-sm ${mode === "retired" ? "bg-slate-900 text-white" : "text-slate-700"}`}
            >
              Retired
            </button>
          </div>
          <button
            type="button"
            onClick={resetInputsKeepContext}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            title="Clear all fields (keeps countries + scenario)"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">

        {/* ================================================================
            LEFT — INPUTS
        ================================================================ */}
        <div className="space-y-3">

          {/* Income & Location */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">Income &amp; Location</div>
            <div className="grid gap-3 sm:grid-cols-2">

              <label className="text-sm">
                <div className={labelHeadCls}>
                  {mode === "retired" ? "Gross annual retirement income" : "Gross annual salary"}{" "}
                  <span className="text-slate-400">({originCurrency})</span>
                </div>
                <input
                  className={inputCls}
                  type="number"
                  value={mode === "retired" ? retirementIncome : salary}
                  onChange={(e) => mode === "retired" ? setRetirementIncome(e.target.value) : setSalary(e.target.value)}
                  placeholder=" "
                />
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
                <div className={labelHeadCls}>
                  Target country
                  <InfoTip align="right" text="Filtered to European countries. Use the International Relocation Calculator for destinations outside Europe." />
                </div>
                <select className={selectCls} value={toCountry} onChange={(e) => { setToCountry(e.target.value); setToCityCode(""); }}>
                  {europeCountriesSorted.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
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
                <div className={labelHeadCls}>
                  Currency display
                  <InfoTip align="right" text="Choose how amounts appear in the calculator. View in USD, your current country's currency, or your European destination currency." />
                </div>
                <select className={selectCls} value={currencyDisplay} onChange={(e) => setCurrencyDisplay(e.target.value as CurrencyDisplay)}>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="CURRENT">Current currency ({COUNTRY_TO_CURRENCY[fromCountry] ?? "USD"})</option>
                  <option value="DESTINATION">Destination currency ({COUNTRY_TO_CURRENCY[toCountry] ?? "USD"})</option>
                </select>
              </label>

              <div className="text-sm">
                <div className={labelHeadCls}>
                  Income impact
                  <InfoTip align="right" text="Shows how your estimated monthly take-home pay changes between your current location and your European destination after taxes." />
                </div>
                <div className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 px-3">
                  {results.salaryReady ? (
                    <>
                      <span className={`font-semibold ${results.monthlyIncomeDiff > 0 ? "text-emerald-600" : results.monthlyIncomeDiff < 0 ? "text-rose-600" : "text-slate-900"}`}>
                        {results.monthlyIncomeDiff > 0 ? "+" : ""}
                        {displayAmount(results.monthlyIncomeDiff, 0)}
                      </span>
                      <span className="whitespace-nowrap text-xs text-slate-500">
                        {results.monthlyIncomeDiff > 0 ? "Higher" : results.monthlyIncomeDiff < 0 ? "Lower" : "Same"}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </div>

              {/* Income type — matches Caribbean pattern */}
              {mode === "working" && (
                <label className="text-sm sm:col-span-2">
                  <div className={labelHeadCls}>
                    Income type
                    <InfoTip align="right" text="Select how you earn income. This determines which tax scenario applies for the destination country." />
                  </div>
                  <select className={selectCls} value={salaryType} onChange={(e) => setSalaryType(e.target.value as SalaryType)}>
                    <option value="local">I earn locally in the destination country</option>
                    <option value="remote">I earn remotely / foreign-source income</option>
                  </select>
                </label>
              )}

              <label className="text-sm">
                <div className={labelHeadCls}>Current savings available</div>
                <input className={inputCls} type="number" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} placeholder=" " />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Number of adults</div>
                <input className={inputCls} type="number" value={adults} onChange={(e) => setAdults(e.target.value)} placeholder=" " />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Number of children</div>
                <input className={inputCls} type="number" value={children} onChange={(e) => setChildren(e.target.value)} placeholder=" " />
              </label>
            </div>
          </div>

          {/* Portugal NHR / IFICI conditional question */}
          {toCountry === "PT" && incomeScenario === "remote" && (
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
              <div className="mb-3 text-sm font-semibold">Portugal — Tax Regime</div>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Are you applying for the IFICI (formerly NHR) special tax regime?
                  <InfoTip text="Portugal's IFICI regime offers a 20% flat rate on qualifying Portuguese-source income and exemptions on many foreign-source income types for eligible new residents." />
                </div>
                <select
                  className={selectCls}
                  value={conditionalAnswers["pt_nhr"] ?? ""}
                  onChange={(e) =>
                    setConditionalAnswers((prev) => ({ ...prev, pt_nhr: e.target.value }))
                  }
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes — applying for IFICI / NHR</option>
                  <option value="no">No — standard progressive rates apply</option>
                  <option value="unsure">Not sure yet</option>
                </select>
              </label>
            </div>
          )}

          {/* Spain Beckham Law conditional question */}
          {toCountry === "ES" && incomeScenario === "remote" && (
            <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
              <div className="mb-3 text-sm font-semibold">Spain — Beckham Law</div>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  Are you eligible for the Beckham Law (Régimen de Impatriados)?
                  <InfoTip text="Spain's Beckham Law applies a 24% flat rate on Spanish-source income up to €600k for qualifying workers who move to Spain for employment." />
                </div>
                <select
                  className={selectCls}
                  value={conditionalAnswers["es_beckham"] ?? ""}
                  onChange={(e) =>
                    setConditionalAnswers((prev) => ({ ...prev, es_beckham: e.target.value }))
                  }
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes — eligible for Beckham Law</option>
                  <option value="no">No — standard progressive rates apply</option>
                  <option value="unsure">Not sure yet</option>
                </select>
              </label>
            </div>
          )}

          {/* Visa & Permit Context */}
          <VisaContextCard countryCode={toCountry} />

          {/* Housing */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">Housing</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Rent in destination (monthly)</div>
                <input className={inputCls} type="number" value={destinationRent} onChange={(e) => setDestinationRent(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Deposit required</div>
                <input className={inputCls} type="number" value={depositRequired} onChange={(e) => setDepositRequired(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>First month rent</div>
                <input className={inputCls} type="number" value={firstMonthRent} onChange={(e) => setFirstMonthRent(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Last month rent (if applicable)</div>
                <input className={inputCls} type="number" value={lastMonthRent} onChange={(e) => setLastMonthRent(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Furnished or unfurnished</div>
                <select className={selectCls} value={furnished} onChange={(e) => setFurnished(e.target.value as FurnishedType)}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="furnished">Furnished</option>
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Utilities included?</div>
                <select className={selectCls} value={utilitiesIncluded} onChange={(e) => setUtilitiesIncluded(e.target.value as YesNo)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>
            {/* Car field — now in Housing, matching Caribbean */}
            <label className="mt-3 block text-sm">
              <div className={labelHeadCls}>Will you need a car?</div>
              <select
                className={selectCls}
                value={needCar}
                onChange={(e) => setNeedCar(e.target.value as YesNo)}
              >
                <option value="no">No</option>
                <option value="yes">Yes — add ~$350/mo estimate</option>
              </select>
            </label>
          </div>

          {/* Estimated Living Costs */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">
              Estimated Living Costs
              <InfoTip text="These costs are adjusted using city-level cost multipliers for the selected destination. This is a normalized planning estimate." />
            </div>
            <div className="mt-3 space-y-3 text-[15px] text-slate-700">
              <div>Groceries: <span className="font-semibold text-slate-900">{displayAmount(results.groceriesAdj, 0)}</span></div>
              <div>Utilities: <span className="font-semibold text-slate-900">{displayAmount(results.utilitiesAdj, 0)}</span></div>
              <div>Transportation: <span className="font-semibold text-slate-900">{displayAmount(results.transportationAdj, 0)}</span></div>
              <div>Car estimate: <span className="font-semibold text-slate-900">{needCar === "yes" ? displayAmount(results.carCost, 0) : displayAmount(0, 0)}</span></div>
              <div>Healthcare: <span className="font-semibold text-slate-900">{displayAmount(results.healthcareAdj, 0)}</span></div>
            </div>
            <div className="mt-2 text-xs text-slate-500">Estimated costs adjust automatically based on the selected European city.</div>
          </div>

          {/* One-Time Moving Costs */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">One-Time Moving Costs</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><div className={labelHeadCls}>Visa / permit estimate</div><input className={inputCls} type="number" value={visaCost} onChange={(e) => setVisaCost(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>One-way flight estimate</div><input className={inputCls} type="number" value={flightCost} onChange={(e) => setFlightCost(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Shipping / baggage estimate</div><input className={inputCls} type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Temporary housing estimate</div><input className={inputCls} type="number" value={temporaryStay} onChange={(e) => setTemporaryStay(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Setup / admin estimate</div><input className={inputCls} type="number" value={adminFees} onChange={(e) => setAdminFees(e.target.value)} placeholder=" " /></label>
              <label className="text-sm"><div className={labelHeadCls}>Furniture / setup estimate</div><input className={inputCls} type="number" value={furnitureSetup} onChange={(e) => setFurnitureSetup(e.target.value)} placeholder=" " /></label>
              <label className="text-sm sm:col-span-2"><div className={labelHeadCls}>Recommended cash buffer</div><input className={inputCls} type="number" value={emergencyCashBuffer} onChange={(e) => setEmergencyCashBuffer(e.target.value)} placeholder=" " /></label>
            </div>
            <div className="mt-4 w-full text-xs text-slate-500">Planning estimates only.</div>
          </div>
        </div>

        {/* ================================================================
            RIGHT — RESULTS
        ================================================================ */}
        <div className="space-y-3">

          {/* Main results card */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-2 text-sm font-semibold">Results</div>
            <div className="mb-3 text-xs text-slate-500">
              {EUROPE_TAX_ASSUMPTIONS_LABEL} · Planning estimates only
            </div>

            <div className="mb-2 space-y-1 text-sm text-slate-600">
              <div>Current country: <span className="font-semibold">{getCountryByCode(fromCountry)?.name ?? fromCountry}</span></div>
              <div>Target country: <span className="font-semibold">{getCountryByCode(toCountry)?.name ?? toCountry}</span></div>
              <div>Income scenario: <span className="font-semibold capitalize">{incomeScenario}</span></div>
            </div>

            <div className="grid gap-2 text-sm">
              <div>Net monthly (current): <span className="font-semibold">{displayAmount(results.netMonthlyFrom)}</span></div>
              <div>Net monthly (target): <span className="font-semibold">{displayAmount(results.netMonthlyTo)}</span></div>

              {results.salaryReady && (
                <>
                  <div className="mt-2">Gross monthly: <span className="font-semibold">{displayAmount(results.grossMonthly, 2)}</span></div>
                  <div>Est. taxes (current): <span className="font-semibold">{displayAmount(results.currentMonthlyTaxUsd, 2)}</span>{" "}<span className="text-xs text-slate-500">({(results.currentTaxRate * 100).toFixed(1)}%)</span></div>
                  <div>Est. taxes (target): <span className="font-semibold">{displayAmount(results.targetMonthlyTaxUsd, 2)}</span>{" "}<span className="text-xs text-slate-500">({(results.targetTaxRate * 100).toFixed(1)}%)</span></div>

                  {/* Tax model status box — matches Caribbean confidence badge pattern */}
                  <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 px-4 py-3 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 font-semibold tracking-wide text-indigo-700 ring-1 ring-indigo-200">
                        Tax model status
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <InfoTip text="Describes how complete and verified the tax estimate is for this destination and scenario. Some countries are modeled more precisely than others." />
                    </div>
                    {results.targetTaxNotes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {results.targetTaxNotes.map((note, i) => (
                          <div key={i} className="text-sm leading-6 text-slate-700">• {note}</div>
                        ))}
                      </div>
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
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 space-y-1">
              <div>Results are estimates only. No information entered is stored or shared.</div>
              <div>Tax estimates, rent, immigration costs, and retirement treatment vary by destination and personal circumstances.</div>
            </div>
            <div className="text-xs text-slate-500">Tip: Your URL updates as you type — copy the page link to share this scenario.</div>
          </div>

          {/* Monthly Flexibility */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Monthly Flexibility</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {results.salaryReady ? displayAmount(results.monthlyFlexibility, 2) : "—"}
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                {mode === "retired" ? "After housing and essentials" : "After housing"}
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-indigo-100">
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

          {/* Comparable Salary */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="text-xs font-semibold tracking-widest text-slate-500">COMPARABLE SALARY</div>
            <div className="mt-2 text-3xl font-bold">{displayAmount(results.comparableSalary)}</div>
            <p className="mt-2 text-sm text-slate-600">
              {toCityLabel} is roughly{" "}
              <span className="font-semibold">{Math.abs(Math.round(results.relativeDifference * 100))}%</span>{" "}
              {results.relativeDifference >= 0 ? "more" : "less"} expensive than {fromCityLabel}.
            </p>
            <div className="mt-1 text-xs text-slate-500">Based on housing, transportation, healthcare, and essential cost weighting.</div>
          </div>

          {/* Comfort Score */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                  {mode === "retired" ? "Retirement Readiness Score" : "Comfort Score™"}
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {results.comfort.band} · {results.comfort.label}
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                Target housing
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-indigo-100">
              <div className={`h-full rounded-full ${
                results.comfort.band === "A" ? "w-[92%] bg-emerald-500"
                : results.comfort.band === "B" ? "w-[78%] bg-emerald-400"
                : results.comfort.band === "C" ? "w-[60%] bg-amber-400"
                : "w-[42%] bg-orange-400"
              }`} />
            </div>

            <div className="mt-3 text-sm text-slate-700">{results.comfort.note}</div>
            <div className="mt-2 text-xs text-slate-500">Based on how much of your target net monthly income goes toward housing.</div>
          </div>

          {/* Share */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Share this scenario</div>
                <div className="mt-1 text-sm text-slate-700">Copy your current comparison link and send it to a partner, friend, or future self.</div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const shareUrl = new URL(window.location.href);
                    const shareText = `My Europe relocation scenario: ${fromCityLabel} → ${toCityLabel}. Monthly flexibility ${displayAmount(results.monthlyFlexibility, 0)} after housing.`;
                    const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                    if (canNativeShare) {
                      await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({ title: "My Europe Relocation Scenario", text: shareText, url: shareUrl.toString() });
                      setShareStatus("shared");
                    } else {
                      await navigator.clipboard.writeText(shareUrl.toString());
                      setShareStatus("copied");
                    }
                    window.setTimeout(() => setShareStatus("idle"), 2500);
                  } catch {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      setShareStatus("copied");
                      window.setTimeout(() => setShareStatus("idle"), 2500);
                    } catch {
                      setShareStatus("error");
                      window.setTimeout(() => setShareStatus("idle"), 2500);
                    }
                  }
                }}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {shareStatus === "copied" ? "Link copied!" : shareStatus === "shared" ? "Shared!" : shareStatus === "error" ? "Share failed" : "Share scenario"}
              </button>
            </div>
          </div>

          <AdSlot />
        </div>
      </div>
    </div>
  );
}
