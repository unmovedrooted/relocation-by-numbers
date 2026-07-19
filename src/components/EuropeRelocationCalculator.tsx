"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
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
  getConditionalQuestionsForCountry,
  type TaxConfidence,
  type ConditionalQuestion,
} from "@/lib/internationalTaxes";
import { getCityCostMultipliers } from "@/lib/internationalCityCosts";
import { USD_TO_LOCAL } from "@/lib/internationalFx";
import { buildEuropeSearchParams, createEuropeCityPresetPatch, createEuropeInitialState } from "@/lib/europeCalculatorState";
import AdSlot from "./AdSlot";
import CalculatorImmediateNumberField from "./calculator-form/CalculatorImmediateNumberField";
import CalculatorSelect from "./calculator-form/CalculatorSelect";

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

function setQS(params: URLSearchParams) {
  if (typeof window === "undefined") return;
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

function numericValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nonNegative(value: string) {
  return Math.max(0, numericValue(value));
}

// Thresholds are for total essential outflow (housing + living costs) as a share of net income.
function getReadinessBand(ratio: number) {
  if (ratio <= 0.60) return { band: "A", label: "Comfortable", note: "Total essential costs look healthy relative to your estimated net income." };
  if (ratio <= 0.75) return { band: "B", label: "Manageable", note: "Doable, but keep an eye on recurring costs and setup cash." };
  if (ratio <= 0.90) return { band: "C", label: "Tight", note: "Possible, but the margin for error is thinner." };
  return { band: "D", label: "Stretched", note: "Essential costs are taking up a very large share of the budget." };
}

// Maps the TaxConfidence values from internationalTaxes.ts to UI badge styles.
// "verified"    → green  (exact or trivially exact)
// "partial"     → blue   (sound structure, named small gap)
// "simplified"  → amber  (structurally believable, 5-10 pp gap possible)
// "placeholder" → red    (directional only, thresholds unstable)
function confidenceBadge(confidence: TaxConfidence) {
  switch (confidence) {
    case "verified":    return { label: "● Verified",           cls: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800" };
    case "partial":     return { label: "● Planning estimate",  cls: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-blue-200 dark:ring-blue-800" };
    case "simplified":  return { label: "● Simplified estimate",cls: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-800" };
    case "placeholder": return { label: "⚠ Directional only",  cls: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-800" };
    default:            return { label: "⚠ Unknown",            cls: "bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 ring-slate-200 dark:ring-slate-800" };
  }
}

// ---------------------------------------------------------------------------
// TAX ASSUMPTIONS LABEL
// ---------------------------------------------------------------------------
const EUROPE_TAX_ASSUMPTIONS_LABEL = "Tax model updated March 2026 · figures are 2024, 2024–25, or 2025 by jurisdiction";

const inputCls  = "h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 ring-1 ring-slate-200 dark:ring-slate-800 shadow-inner outline-none transition focus:bg-white focus:dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/15 focus:dark:ring-indigo-500/15";
const selectCls = "h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 shadow-inner ring-1 ring-slate-200 dark:ring-slate-800 outline-none transition focus:bg-white focus:dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/15 focus:dark:ring-indigo-500/15";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600 dark:text-slate-400";

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
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 shadow-sm transition hover:bg-slate-50 hover:dark:bg-slate-950"
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
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 text-xl">
          {ctx.euFreeMovement ? "🇪🇺" : "🌐"}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">
            Visa &amp; Permit Context
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{ctx.program}</div>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{ctx.notes}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {ctx.highlight && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800">
                {ctx.highlight}
              </span>
            )}
            {ctx.euFreeMovement && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800">
                EU Freedom of Movement
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
function subscribeToClientReady() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return `client:${window.location.search}`;
}

function getServerHydrationSnapshot() {
  return "server";
}

function EuropeRelocationCalculatorContent({ initialSearch, urlReady }: { initialSearch: string; urlReady: boolean }) {
  const initial = useMemo(() => createEuropeInitialState(
    new URLSearchParams(initialSearch),
    (countryCode) => INTERNATIONAL_COUNTRIES.some((country) => country.code === countryCode),
    (countryCode) => EUROPE_COUNTRY_CODES.has(countryCode),
    (countryCode) => [...citiesForCountry(countryCode)].sort((a, b) => a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" }))[0]?.code ?? "",
    (cityCode, countryCode) => citiesForCountry(countryCode).some((city) => city.code === cityCode),
  ), [initialSearch]);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");
  const [taxNotesExpanded, setTaxNotesExpanded] = useState(false);

  const [mode, setMode] = useState<Mode>(initial.mode);
  const [salary, setSalary] = useState<string>(initial.salary);
  const [retirementIncome, setRetirementIncome] = useState<string>(initial.retirementIncome);
  const [filing, setFiling] = useState<FilingStatus>(initial.filing);

  const [fromCountry, setFromCountry] = useState<string>(initial.fromCountry);
  const [toCountry, setToCountry] = useState<string>(initial.toCountry);
  const [fromCityCode, setFromCityCode] = useState<string>(initial.fromCityCode);
  const [toCityCode, setToCityCode] = useState<string>(initial.toCityCode);

  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>(initial.currencyDisplay);
  const [salaryType, setSalaryType] = useState<SalaryType>(initial.salaryType);
  const [adults, setAdults] = useState<string>(initial.adults);
  const [children, setChildren] = useState<string>(initial.children);

  // Conditional answers for country-specific follow-up questions
  const [conditionalAnswers, setConditionalAnswers] = useState<Record<string, string>>(initial.conditionalAnswers);

  const [destinationRent, setDestinationRent] = useState<string>(initial.destinationRent);
  const [depositRequired, setDepositRequired] = useState<string>(initial.depositRequired);
  const [firstMonthRent, setFirstMonthRent] = useState<string>(initial.firstMonthRent);
  const [lastMonthRent, setLastMonthRent] = useState<string>(initial.lastMonthRent);
  const [furnished, setFurnished] = useState<FurnishedType>(initial.furnished);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<YesNo>(initial.utilitiesIncluded);

  const [groceries, setGroceries] = useState<string>(initial.groceries);
  const [utilities, setUtilities] = useState<string>(initial.utilities);
  const [transportation, setTransportation] = useState<string>(initial.transportation);
  const [healthcare, setHealthcare] = useState<string>(initial.healthcare);

  const [visaCost, setVisaCost] = useState<string>(initial.visaCost);
  const [flightCost, setFlightCost] = useState<string>(initial.flightCost);
  const [shippingCost, setShippingCost] = useState<string>(initial.shippingCost);
  const [temporaryStay, setTemporaryStay] = useState<string>(initial.temporaryStay);
  const [adminFees, setAdminFees] = useState<string>(initial.adminFees);
  const [furnitureSetup, setFurnitureSetup] = useState<string>(initial.furnitureSetup);
  const [emergencyCashBuffer, setEmergencyCashBuffer] = useState<string>(initial.emergencyCashBuffer);
  const [currentSavings, setCurrentSavings] = useState<string>(initial.currentSavings);
const [needCar, setNeedCar] = useState<YesNo>(initial.needCar);
const [carCostMonthly, setCarCostMonthly] = useState<string>(initial.carCostMonthly);

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

  const currentCityDefaults  = useMemo(() => getCityDefaultsByCode(fromCityCode), [fromCityCode]);
  const targetCityDefaults   = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);
  const fromCityMultipliers  = useMemo(() => getCityCostMultipliers(fromCityCode), [fromCityCode]);
  const toCityMultipliers    = useMemo(() => getCityCostMultipliers(toCityCode), [toCityCode]);

  function applyCityDefaults(cityCode: string) {
    const d = getCityDefaultsByCode(cityCode);
    if (!d) return false;
    const patch = createEuropeCityPresetPatch(d);
    setDestinationRent(patch.destinationRent);
    setDepositRequired(patch.depositRequired);
    setFirstMonthRent(patch.firstMonthRent);
    setLastMonthRent(patch.lastMonthRent);
    setUtilitiesIncluded(patch.utilitiesIncluded);
    setGroceries(patch.groceries);
    setUtilities(patch.utilities);
    setTransportation(patch.transportation);
    setHealthcare(patch.healthcare);
    setVisaCost(patch.visaCost);
    setFlightCost(patch.flightCost);
    setShippingCost(patch.shippingCost);
    setTemporaryStay(patch.temporaryStay);
    setAdminFees(patch.adminFees);
    setFurnitureSetup(patch.furnitureSetup);
    setEmergencyCashBuffer(patch.emergencyCashBuffer);
    return true;
  }

  function applyCountryFallback(countryCode: string) {
    const d = EUROPE_COST_DEFAULTS[countryCode];
    if (!d) return;
    setGroceries(String(d.groceries));
    setUtilities(String(d.utilities));
    setTransportation(String(d.transport));
    setHealthcare(String(d.healthcare));
  }

  function changeFromCountry(countryCode: string) {
    const cities = [...citiesForCountry(countryCode)].sort((a, b) => a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" }));
    setFromCountry(countryCode);
    setFromCityCode(cities[0]?.code ?? "");
  }

  function changeToCountry(countryCode: string) {
    const cities = [...citiesForCountry(countryCode)].sort((a, b) => a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" }));
    const cityCode = cities[0]?.code ?? "";
    setToCountry(countryCode);
    setToCityCode(cityCode);
    setConditionalAnswers({});
    if (!applyCityDefaults(cityCode)) applyCountryFallback(countryCode);
  }

  function changeToCity(cityCode: string) {
    setToCityCode(cityCode);
    if (!applyCityDefaults(cityCode)) applyCountryFallback(toCountry);
  }

  function changeMode(nextMode: Mode) {
    if (nextMode !== mode) setConditionalAnswers({});
    setMode(nextMode);
  }

  function changeSalaryType(nextType: SalaryType) {
    if (nextType !== salaryType) setConditionalAnswers({});
    setSalaryType(nextType);
  }

  // QS sync on state change
  useEffect(() => {
    if (!urlReady) return;
    setQS(buildEuropeSearchParams({
      mode, salary, retirementIncome, filing, fromCountry, toCountry, fromCityCode, toCityCode,
      currencyDisplay, salaryType, adults, children, conditionalAnswers, destinationRent,
      depositRequired, firstMonthRent, lastMonthRent, furnished, utilitiesIncluded, groceries,
      utilities, transportation, healthcare, visaCost, flightCost, shippingCost, temporaryStay,
      adminFees, furnitureSetup, emergencyCashBuffer, currentSavings, needCar, carCostMonthly,
    }));
  }, [
  mode, filing, fromCountry, toCountry, fromCityCode, toCityCode,
  salary, retirementIncome, currencyDisplay, salaryType, adults, children,
  destinationRent, depositRequired, firstMonthRent, lastMonthRent, furnished,
  utilitiesIncluded, groceries, utilities, transportation, healthcare, visaCost,
  flightCost, shippingCost, temporaryStay, adminFees, furnitureSetup,
  emergencyCashBuffer, currentSavings, needCar, carCostMonthly,
  conditionalAnswers, urlReady,
]);

  const targetProfile = getCountryByCode(toCountry);

  // ---------------------------------------------------------------------------
  // RESULTS MEMO
  // ---------------------------------------------------------------------------
  const results = useMemo(() => {
    const baseAnnualIncome = mode === "retired" ? numericValue(retirementIncome) : numericValue(salary);
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
      incomeScenario,
    });

    const targetTaxEstimate = estimateInternationalTax({
      countryCode: toCountry,
      annualIncome: annualIncomeForToTax,
      filing,
      isRetired: mode === "retired",
      incomeScenario,
      answers: conditionalAnswers,
    });

    const currentTaxRate = currentTaxEstimate.effectiveRate;
    const targetTaxRate  = targetTaxEstimate.effectiveRate;

    // Pull confidence, note, missingFactor, and label directly from the tax engine.
    const targetConfidence: TaxConfidence = targetTaxEstimate.confidence;
    const targetMissingFactor: string = targetTaxEstimate.missingFactor ?? "";
    const targetTaxLabel: string = targetTaxEstimate.label;
    const targetTaxNotes: string[] = [];
    if (targetTaxEstimate.note) targetTaxNotes.push(targetTaxEstimate.note);

    // Prompt user to answer unanswered conditional questions that would improve the estimate.
    const unansweredQuestions = getConditionalQuestionsForCountry(toCountry, incomeScenario)
      .filter(q => !conditionalAnswers[q.key]);
    if (unansweredQuestions.length > 0) {
      targetTaxNotes.push(
        `Answer the tax question${unansweredQuestions.length > 1 ? "s" : ""} above to refine this estimate.`
      );
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

   const adultCount = Math.max(1, Math.floor(numericValue(adults)));
const childCount = Math.max(0, Math.floor(numericValue(children)));

const familySizeMultGroceries  = 1 + (adultCount - 1) * 0.55 + childCount * 0.35;
const familySizeMultTransport  = 1 + (adultCount - 1) * 0.35 + childCount * 0.15;
const familySizeMultHealthcare = 1 + (adultCount - 1) * 0.7  + childCount * 0.5;
const familySizeMultUtilities  = 1 + (adultCount - 1) * 0.25 + childCount * 0.15;

// Destination inputs are already destination-city estimates.
// Do NOT multiply these by destination city multipliers again.
const groceriesAdj =
  destToUsd(nonNegative(groceries)) * familySizeMultGroceries;

const transportationAdj =
  destToUsd(nonNegative(transportation)) * familySizeMultTransport;

const healthcareAdj =
  destToUsd(nonNegative(healthcare)) * familySizeMultHealthcare;

const utilitiesAdj =
  destToUsd(nonNegative(utilities)) * familySizeMultUtilities;

const rentTo =
  destToUsd(nonNegative(destinationRent));

const carCost =
  needCar === "yes" ? destToUsd(nonNegative(carCostMonthly)) : 0;

// Origin side
let groceriesFrom: number;
let transportationFrom: number;
let utilitiesFrom: number;
let rentFrom: number;
let healthcareFrom: number;

if (currentCityDefaults) {
  const fromToUsd = (v: number) => convertLocalToUsd(v, fromCountry);

  groceriesFrom =
    fromToUsd(currentCityDefaults.monthlyDefaults.groceries) * familySizeMultGroceries;

  transportationFrom =
    fromToUsd(currentCityDefaults.monthlyDefaults.transport) * familySizeMultTransport;

  utilitiesFrom =
    fromToUsd(currentCityDefaults.monthlyDefaults.utilities) * familySizeMultUtilities;

  rentFrom =
    fromToUsd(currentCityDefaults.monthlyDefaults.rent);

  healthcareFrom =
    fromToUsd(currentCityDefaults.monthlyDefaults.healthcare) * familySizeMultHealthcare;
} else {
  const groceryRatio =
    toCityMultipliers.groceries > 0
      ? fromCityMultipliers.groceries / toCityMultipliers.groceries
      : 1;

  const transitRatio =
    toCityMultipliers.transit > 0
      ? fromCityMultipliers.transit / toCityMultipliers.transit
      : 1;

  const utilitiesRatio =
    toCityMultipliers.utilities > 0
      ? fromCityMultipliers.utilities / toCityMultipliers.utilities
      : 1;

  const housingRatio =
    toCityMultipliers.housing > 0
      ? fromCityMultipliers.housing / toCityMultipliers.housing
      : 1;

  groceriesFrom =
    destToUsd(nonNegative(groceries)) * familySizeMultGroceries * groceryRatio;

  transportationFrom =
    destToUsd(nonNegative(transportation)) * familySizeMultTransport * transitRatio;

  utilitiesFrom =
    destToUsd(nonNegative(utilities)) * familySizeMultUtilities * utilitiesRatio;

  rentFrom =
    destToUsd(nonNegative(destinationRent)) * housingRatio;

  healthcareFrom =
    destToUsd(nonNegative(healthcare)) * familySizeMultHealthcare;
}
   const housingUtilities = utilitiesIncluded === "yes" ? 0 : utilitiesAdj;
const housingTotal = rentTo + housingUtilities + carCost;
const livingCosts = groceriesAdj + transportationAdj + healthcareAdj;

const housingUtilitiesFrom = utilitiesIncluded === "yes" ? 0 : utilitiesFrom;
const housingTotalFrom = rentFrom + housingUtilitiesFrom;
const livingCostsFrom = groceriesFrom + transportationFrom + healthcareFrom;
    const monthlyFlexibility = netMonthlyTo - housingTotal - livingCosts;
    const targetComfortRatio = 0.70;

const requiredNetMonthly =
  housingTotal + livingCosts > 0
    ? (housingTotal + livingCosts) / targetComfortRatio
    : 0;

const requiredGrossMonthly =
  targetTaxRate < 1
    ? requiredNetMonthly / (1 - targetTaxRate)
    : 0;

const requiredAnnualIncome = requiredGrossMonthly * 12;

const incomeGap = requiredAnnualIncome - annualIncome;

const currentMonthlyFlexibility =
  netMonthlyFrom - housingTotalFrom - livingCostsFrom;

const marginChangePct =
  netMonthlyFrom > 0
    ? ((monthlyFlexibility - currentMonthlyFlexibility) / netMonthlyFrom) * 100
    : 0;

const flexibilityRatio =
  netMonthlyTo > 0 ? monthlyFlexibility / netMonthlyTo : 0;

const readinessRecommendation =
  !salaryReady
    ? {
        label: "Add income",
        tone: "neutral" as const,
        note: "Enter your income to see whether this move looks financially realistic.",
      }
    : flexibilityRatio >= 0.25 && incomeGap <= 0
      ? {
          label: "Financially ready",
          tone: "good" as const,
          note: "Your estimated income appears strong enough for this move with healthy monthly room left over.",
        }
      : flexibilityRatio >= 0.10
        ? {
            label: "Possible, but watch the margin",
            tone: "caution" as const,
            note: "This move may work, but your cushion is thinner. Lower rent or setup costs would make it safer.",
          }
        : {
            label: "Not ready yet",
            tone: "risk" as const,
            note: "Based on these inputs, the move leaves too little monthly room. Improve income, reduce rent, or build more cash first.",
          };
    const totalPctOfNet      = netMonthlyTo > 0 ? (housingTotal + livingCosts) / netMonthlyTo : 0;
    const housingPctOfNet    = netMonthlyTo > 0 ? housingTotal / netMonthlyTo : 0;
    const comfort            = getReadinessBand(totalPctOfNet);

    const furnitureAdj = furnished === "furnished" ? 0 : destToUsd(numericValue(furnitureSetup));
    const upfrontCashNeeded =
  destToUsd(nonNegative(depositRequired)) +
  destToUsd(nonNegative(firstMonthRent)) +
  destToUsd(nonNegative(lastMonthRent)) +
  destToUsd(nonNegative(visaCost)) +
  destToUsd(nonNegative(flightCost)) +
  destToUsd(nonNegative(shippingCost)) +
  destToUsd(nonNegative(temporaryStay)) +
  destToUsd(nonNegative(adminFees)) +
  furnitureAdj +
  destToUsd(nonNegative(emergencyCashBuffer));

    const totalMonthlyOutflow = housingTotal + livingCosts;
    const monthsCovered =
  totalMonthlyOutflow > 0
    ? convertLocalToUsd(nonNegative(currentSavings), fromCountry) / totalMonthlyOutflow
    : 0;

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
      targetMissingFactor,
      targetTaxLabel,
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
      rentFrom,
healthcareFrom,
housingUtilitiesFrom,
housingTotalFrom,
livingCostsFrom,
requiredNetMonthly,
requiredGrossMonthly,
requiredAnnualIncome,
incomeGap,
marginChangePct,
flexibilityRatio,
readinessRecommendation,
    };
  }, [
    mode, salary, retirementIncome, filing, fromCountry, toCountry,
    incomeScenario, conditionalAnswers,
    fromCityMultipliers, toCityMultipliers, currentCityDefaults, targetCityDefaults,
    adults, children, needCar, furnished, carCostMonthly, utilitiesIncluded, utilities, destinationRent,
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
    <div className="text-slate-900 dark:text-slate-100">
      {/* Mode toggle + reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold" />
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/70">
            <button
              type="button"
              onClick={() => changeMode("working")}
              className={`rounded-lg px-3 py-1 text-sm ${mode === "working" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}
            >
              Working
            </button>
            <button
              type="button"
              onClick={() => changeMode("retired")}
              className={`rounded-lg px-3 py-1 text-sm ${mode === "retired" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-700 dark:text-slate-300"}`}
            >
              Retired
            </button>
          </div>
          <button
            type="button"
            onClick={resetInputsKeepContext}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:dark:bg-slate-900/40"
            title="Clear all fields (keeps countries + scenario)"
          >
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
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="mb-3 text-sm font-semibold">Income &amp; Location</div>
            <div className="grid gap-3 sm:grid-cols-2">

              {mode === "retired" ? (
                <CalculatorImmediateNumberField
                  id="europe-retirement-income"
                  label={<>Gross annual retirement income <span className="text-slate-400 dark:text-slate-500">({originCurrency})</span></>}
                  className={inputCls}
                  value={retirementIncome}
                  onChange={setRetirementIncome}
                  placeholder=" "
                />
              ) : (
                <CalculatorImmediateNumberField
                  id="europe-salary"
                  label={<>Gross annual salary <span className="text-slate-400 dark:text-slate-500">({originCurrency})</span></>}
                  className={inputCls}
                  value={salary}
                  onChange={setSalary}
                  placeholder=" "
                />
              )}

              <CalculatorSelect id="europe-filing-status" label="Filing status" className={selectCls} value={filing} onChange={(e) => setFiling(e.target.value as FilingStatus)}>
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
              </CalculatorSelect>

              <CalculatorSelect id="europe-current-country" label="Current country" className={selectCls} value={fromCountry} onChange={(e) => changeFromCountry(e.target.value)}>
                  {allCountriesSorted.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </CalculatorSelect>

              <CalculatorSelect id="europe-destination-country" label="Target country" info={<InfoTip align="right" text="Filtered to European countries. Use the International Relocation Calculator for destinations outside Europe." />} className={selectCls} value={toCountry} onChange={(e) => changeToCountry(e.target.value)}>
                  {europeCountriesSorted.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </CalculatorSelect>

              <CalculatorSelect id="europe-current-city" label="Current city" className={selectCls} value={fromCityCode} onChange={(e) => setFromCityCode(e.target.value)}>
                  {fromCities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
              </CalculatorSelect>

              <CalculatorSelect id="europe-destination-city" label="Target city" className={selectCls} value={toCityCode} onChange={(e) => changeToCity(e.target.value)}>
                  {toCities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
              </CalculatorSelect>

              <CalculatorSelect id="europe-display-currency" label="Currency display" info={<InfoTip align="right" text="Choose how amounts appear in the calculator. View in USD, your current country's currency, or your European destination currency." />} className={selectCls} value={currencyDisplay} onChange={(e) => setCurrencyDisplay(e.target.value as CurrencyDisplay)}>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="CURRENT">Current currency ({COUNTRY_TO_CURRENCY[fromCountry] ?? "USD"})</option>
                  <option value="DESTINATION">Destination currency ({COUNTRY_TO_CURRENCY[toCountry] ?? "USD"})</option>
              </CalculatorSelect>

              <div className="text-sm">
                <div className={labelHeadCls}>
                  Income impact
                  <InfoTip align="right" text="Shows how your estimated monthly take-home pay changes between your current location and your European destination after taxes." />
                </div>
                <div className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 dark:border-slate-700 px-3">
                  {results.salaryReady ? (
                    <>
                      <span className={`font-semibold ${results.monthlyIncomeDiff > 0 ? "text-emerald-600 dark:text-emerald-400" : results.monthlyIncomeDiff < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
                        {results.monthlyIncomeDiff > 0 ? "+" : ""}
                        {displayAmount(results.monthlyIncomeDiff, 0)}
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

              {/* Income type — matches Caribbean pattern */}
              {mode === "working" && (
                <CalculatorSelect id="europe-income-type" label="Income type" info={<InfoTip align="right" text="Select how you earn income. This determines which tax scenario applies for the destination country." />} wrapperClassName="sm:col-span-2" className={selectCls} value={salaryType} onChange={(e) => changeSalaryType(e.target.value as SalaryType)}>
                    <option value="local">I earn locally in the destination country</option>
                    <option value="remote">I earn remotely / foreign-source income</option>
                </CalculatorSelect>
              )}

              <CalculatorImmediateNumberField id="europe-current-savings" label="Current savings available" className={inputCls} value={currentSavings} onChange={setCurrentSavings} placeholder=" " />

              <CalculatorImmediateNumberField id="europe-adults" label="Number of adults" className={inputCls} min="1" step="1" value={adults} onChange={setAdults} placeholder=" " />

              <CalculatorImmediateNumberField id="europe-children" label="Number of children" className={inputCls} min="0" step="1" value={children} onChange={setChildren} placeholder=" " />
            </div>
          </div>

          {/* Dynamic conditional tax questions — driven by getConditionalQuestionsForCountry */}
          {getConditionalQuestionsForCountry(toCountry, incomeScenario).map((q: ConditionalQuestion) => (
            <div key={q.key} className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
              <div className="mb-3 text-sm font-semibold">{getCountryByCode(toCountry)?.name ?? toCountry} — Tax Question</div>
              <CalculatorSelect
                id={`europe-tax-question-${q.key}`}
                label={q.label}
                info={q.helpText ? <InfoTip text={q.helpText} /> : undefined}
                className={selectCls}
                value={conditionalAnswers[q.key] ?? ""}
                onChange={(e) => setConditionalAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              >
                <option value="">Select…</option>
                {q.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </CalculatorSelect>
            </div>
          ))}

          {/* Visa & Permit Context */}
          <VisaContextCard countryCode={toCountry} />

          {/* Housing */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="mb-3 text-sm font-semibold">Housing</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <CalculatorImmediateNumberField id="europe-destination-rent" label="Rent in destination (monthly)" wrapperClassName="sm:col-span-2" className={inputCls} min="0" value={destinationRent} onChange={setDestinationRent} placeholder=" " />
              <CalculatorImmediateNumberField id="europe-security-deposit" label="Deposit required" className={inputCls} min="0" value={depositRequired} onChange={setDepositRequired} placeholder=" " />
              <CalculatorImmediateNumberField id="europe-first-month-rent" label="First month rent" className={inputCls} min="0" value={firstMonthRent} onChange={setFirstMonthRent} placeholder=" " />
              <CalculatorImmediateNumberField id="europe-last-month-rent" label="Last month rent (if applicable)" className={inputCls} min="0" value={lastMonthRent} onChange={setLastMonthRent} placeholder=" " />
              <CalculatorSelect id="europe-furnishing" label="Furnished or unfurnished" className={selectCls} value={furnished} onChange={(e) => setFurnished(e.target.value as FurnishedType)}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="furnished">Furnished</option>
              </CalculatorSelect>
              <CalculatorSelect id="europe-utilities-included" label="Utilities included?" wrapperClassName="sm:col-span-2" className={selectCls} value={utilitiesIncluded} onChange={(e) => setUtilitiesIncluded(e.target.value as YesNo)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
              </CalculatorSelect>
            </div>
            {/* Car field — now in Housing, matching Caribbean */}
            <CalculatorSelect
    id="europe-need-car"
    label="Will you need a car?"
    wrapperClassName="mt-3 block"
    className={selectCls}
    value={needCar}
    onChange={(e) => setNeedCar(e.target.value as YesNo)}
  >
    <option value="no">No</option>
    <option value="yes">Yes</option>
  </CalculatorSelect>

{needCar === "yes" && (
  <CalculatorImmediateNumberField
    id="europe-car-cost-monthly"
    label={<>Estimated monthly car cost ({COUNTRY_TO_CURRENCY[toCountry] ?? "EUR"})</>}
    wrapperClassName="mt-3 block"
    className={inputCls}
    min="0"
    value={carCostMonthly}
    onChange={setCarCostMonthly}
    placeholder=" "
  />
)}
</div>


          {/* Estimated Living Costs */}
<div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
  <div className="mb-1 text-sm font-semibold">
    Estimated Living Costs
    <InfoTip text="These are average monthly estimates for the selected destination. You can edit them to match your lifestyle." />
  </div>

  <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
    Pre-filled with average estimates. Editable. Enter amounts in destination currency ({COUNTRY_TO_CURRENCY[toCountry] ?? "EUR"}).
  </div>

  <div className="grid gap-3 sm:grid-cols-2">
    <CalculatorImmediateNumberField
      id="europe-groceries"
      label={<>Groceries monthly ({COUNTRY_TO_CURRENCY[toCountry] ?? "EUR"})</>}
      className={inputCls}
      min="0"
      value={groceries}
      onChange={setGroceries}
      placeholder=" "
      helpText={<>Adjusted estimate: {displayAmount(results.groceriesAdj, 0)}<div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Current location estimate: {displayAmount(results.groceriesFrom, 0)}</div></>}
    />

    <CalculatorImmediateNumberField
      id="europe-utilities"
      label={<>Utilities monthly ({COUNTRY_TO_CURRENCY[toCountry] ?? "EUR"})</>}
      className={inputCls}
      min="0"
      value={utilities}
      onChange={setUtilities}
      placeholder=" "
      helpText={<>Adjusted estimate: {displayAmount(results.utilitiesAdj, 0)}<div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Current location estimate: {displayAmount(results.utilitiesFrom, 0)}</div></>}
    />

    <CalculatorImmediateNumberField
      id="europe-transportation"
      label={<>Transportation monthly ({COUNTRY_TO_CURRENCY[toCountry] ?? "EUR"})</>}
      className={inputCls}
      min="0"
      value={transportation}
      onChange={setTransportation}
      placeholder=" "
      helpText={<>Adjusted estimate: {displayAmount(results.transportationAdj, 0)}<div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Current location estimate: {displayAmount(results.transportationFrom, 0)}</div></>}
    />

    <CalculatorImmediateNumberField
      id="europe-healthcare"
      label={<>Healthcare monthly ({COUNTRY_TO_CURRENCY[toCountry] ?? "EUR"})</>}
      className={inputCls}
      min="0"
      value={healthcare}
      onChange={setHealthcare}
      placeholder=" "
      helpText={<>Adjusted estimate: {displayAmount(results.healthcareAdj, 0)}<div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Current location estimate: {displayAmount(results.healthcareFrom, 0)}</div></>}
    />
   
  </div>

  {needCar === "yes" && (
    <div className="mt-3 rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-800">
      Car estimate: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.carCost, 0)}</span>
    </div>
  )}

  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
  Family-size adjustments are applied automatically. Estimates are based on city averages and may vary by neighborhood, lifestyle, and exchange rates.
</div>
</div>

          {/* One-Time Moving Costs */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="mb-3 text-sm font-semibold">One-Time Moving Costs</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <CalculatorImmediateNumberField id="europe-visa-cost" label="Visa / permit estimate" className={inputCls} value={visaCost} onChange={setVisaCost} placeholder=" " />
              <CalculatorImmediateNumberField id="europe-flight-cost" label="One-way flight estimate" className={inputCls} value={flightCost} onChange={setFlightCost} placeholder=" " />
              <CalculatorImmediateNumberField id="europe-shipping-cost" label="Shipping / baggage estimate" className={inputCls} value={shippingCost} onChange={setShippingCost} placeholder=" " />
              <CalculatorImmediateNumberField id="europe-temporary-stay" label="Temporary housing estimate" className={inputCls} value={temporaryStay} onChange={setTemporaryStay} placeholder=" " />
              <CalculatorImmediateNumberField id="europe-admin-fees" label="Setup / admin estimate" className={inputCls} value={adminFees} onChange={setAdminFees} placeholder=" " />
              <CalculatorImmediateNumberField id="europe-furniture-setup" label="Furniture / setup estimate" className={inputCls} value={furnitureSetup} onChange={setFurnitureSetup} placeholder=" " />
              <CalculatorImmediateNumberField id="europe-emergency-cash-buffer" label="Recommended cash buffer" wrapperClassName="sm:col-span-2" className={inputCls} value={emergencyCashBuffer} onChange={setEmergencyCashBuffer} placeholder=" " />
            </div>
            <div className="mt-4 w-full text-xs text-slate-500 dark:text-slate-400">Planning estimates only.</div>
          </div>
        </div>

        {/* ================================================================
            RIGHT — RESULTS
        ================================================================ */}
        <div className="space-y-3">

          {/* Main results card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="mb-2 text-sm font-semibold">Results</div>
            <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {EUROPE_TAX_ASSUMPTIONS_LABEL} · Planning estimates only
            </div>

            <div className="mb-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
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
                  <div>Est. taxes (current): <span className="font-semibold">{displayAmount(results.currentMonthlyTaxUsd, 2)}</span>{" "}<span className="text-xs text-slate-500 dark:text-slate-400">({(results.currentTaxRate * 100).toFixed(1)}%)</span></div>
                  <div>Est. taxes (target): <span className="font-semibold">{displayAmount(results.targetMonthlyTaxUsd, 2)}</span>{" "}<span className="text-xs text-slate-500 dark:text-slate-400">({(results.targetTaxRate * 100).toFixed(1)}%)</span></div>

                  {/* ── Confidence banner with inline missingFactor and expandable detail ── */}
                  <div className={`mt-3 rounded-xl ring-1 overflow-hidden ${
                    results.targetConfidence === "verified"    ? "bg-emerald-50 dark:bg-emerald-950/30 ring-emerald-200 dark:ring-emerald-800"
                    : results.targetConfidence === "partial"  ? "bg-blue-50 dark:bg-blue-950/30 ring-blue-200 dark:ring-blue-800"
                    : results.targetConfidence === "placeholder" ? "bg-rose-50 dark:bg-rose-950/30 ring-rose-200 dark:ring-rose-800"
                    : "bg-amber-50 dark:bg-amber-950/30 ring-amber-200 dark:ring-amber-800"
                  }`}>
                    {/* Top row: badge + plain-English meaning */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {results.targetConfidence === "verified"    && "Exact or near-exact for most incomes"}
                        {results.targetConfidence === "partial"     && "Sound structure · named gap ≤ ~4 pp"}
                        {results.targetConfidence === "simplified"  && "Reasonable ballpark · gap may be 5–10 pp"}
                        {results.targetConfidence === "placeholder" && "Directional only · verify before planning"}
                      </span>
                    </div>
                    {/* Largest missing factor — always visible */}
                    {results.targetMissingFactor && (
                      <div className="px-4 pb-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Key gap: </span>{results.targetMissingFactor}
                      </div>
                    )}
                    {/* Expandable full detail */}
                    {results.targetTaxNotes.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setTaxNotesExpanded(v => !v)}
                          className="flex w-full items-center justify-between border-t border-black/5 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-black/[0.03] transition-colors"
                        >
                          <span>{taxNotesExpanded ? "Hide detail" : "Show full detail"}</span>
                          <span className="opacity-50">{taxNotesExpanded ? "▲" : "▼"}</span>
                        </button>
                        {taxNotesExpanded && (
                          <div className="space-y-1.5 border-t border-black/5 dark:border-white/5 px-4 py-3">
                            {results.targetTaxNotes.map((note, i) => (
                              <div key={i} className="flex gap-2 text-xs leading-5 text-slate-700 dark:text-slate-300">
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
            </div>

            <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div>Results are estimates only. No information entered is stored or shared.</div>
              <div>Tax estimates, rent, immigration costs, and retirement treatment vary by destination and personal circumstances.</div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Tip: Your URL updates as you type — copy the page link to share this scenario.</div>
          </div>

          {/* Monthly Flexibility */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/30 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">Monthly Flexibility</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {results.salaryReady ? displayAmount(results.monthlyFlexibility, 2) : "—"}
                </div>
              </div>
              <div className="rounded-full bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800">
                {mode === "retired" ? "After housing and essentials" : "After housing"}
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 dark:bg-slate-900 ring-1 ring-indigo-100 dark:ring-indigo-800">
              <div className={`h-full rounded-full ${
                !results.salaryReady ? "w-[0%] bg-slate-300 dark:bg-slate-800"
                : results.monthlyFlexibility >= 3000 ? "w-[92%] bg-emerald-500 dark:bg-emerald-600"
                : results.monthlyFlexibility >= 2000 ? "w-[76%] bg-emerald-400 dark:bg-emerald-700"
                : results.monthlyFlexibility >= 1000 ? "w-[58%] bg-amber-400 dark:bg-amber-700"
                : results.monthlyFlexibility >= 500  ? "w-[40%] bg-orange-400 dark:bg-orange-700"
                : "w-[24%] bg-rose-400 dark:bg-rose-700"
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
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:ring-slate-800/60">
            <div className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">COMPARABLE SALARY</div>
            <div className="mt-2 text-3xl font-bold">{displayAmount(results.comparableSalary)}</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {toCityLabel} is roughly{" "}
              <span className="font-semibold">{Math.abs(Math.round(results.relativeDifference * 100))}%</span>{" "}
              {results.relativeDifference >= 0 ? "more" : "less"} expensive than {fromCityLabel}.
            </p>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Based on housing, transportation, healthcare, and essential cost weighting.</div>
          </div>

          {/* Comfort Score */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">
                  {mode === "retired" ? "Retirement Readiness Score" : "Comfort Score™"}
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {results.comfort.band} · {results.comfort.label}
                </div>
              </div>
              <div className="rounded-full bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800">
                Essential costs
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 dark:bg-slate-900 ring-1 ring-indigo-100 dark:ring-indigo-800">
              <div className={`h-full rounded-full ${
                results.comfort.band === "A" ? "w-[92%] bg-emerald-500 dark:bg-emerald-600"
                : results.comfort.band === "B" ? "w-[78%] bg-emerald-400 dark:bg-emerald-700"
                : results.comfort.band === "C" ? "w-[60%] bg-amber-400 dark:bg-amber-700"
                : "w-[42%] bg-orange-400 dark:bg-orange-700"
              }`} />
            </div>

            <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">{results.comfort.note}</div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Based on how much of your net monthly income goes toward housing and essential living costs.</div>
          </div>

          {/* Share */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">Share this scenario</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current comparison link and send it to a partner, friend, or future self.</div>
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

export default function EuropeRelocationCalculator() {
  const hydrationSnapshot = useSyncExternalStore(
    subscribeToClientReady,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const urlReady = hydrationSnapshot !== "server";
  const initialSearch = urlReady ? hydrationSnapshot.slice("client:".length) : "";

  return (
    <EuropeRelocationCalculatorContent
      key={urlReady ? "url-ready" : "server"}
      initialSearch={urlReady ? initialSearch : ""}
      urlReady={urlReady}
    />
  );
}
