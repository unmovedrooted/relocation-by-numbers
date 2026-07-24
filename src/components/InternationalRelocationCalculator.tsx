"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SavedScenariosPanel from "./SavedScenariosPanel";
import { downloadPdfReport, type PdfRow } from "@/lib/pdfExport";
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
import AdSlot from "./AdSlot";
import { estimateMortgageMonthly } from "@/lib/mortgage";
import { estimateHomePriceFromRent, DEFAULT_TAX_INSURANCE_PCT } from "@/lib/compareEngines/homePrice";

// FX_FALLBACK is intentionally empty, all supported country codes should be
// in USD_TO_LOCAL in internationalFx.ts. If a code is missing there, add it
// at the source rather than patching it here.
const FX_FALLBACK: Record<string, number> = {};

function getFxRate(countryCode: string): number {
  const rate = USD_TO_LOCAL[countryCode] ?? FX_FALLBACK[countryCode];
  if (!rate || rate <= 0) {
    console.warn(`Missing FX rate for ${countryCode}. Falling back to 1.`);
    return 1;
  }
  return rate;
}

function convertLocalToUsd(amountLocal: number, countryCode: string): number {
  const rate = getFxRate(countryCode);
  return amountLocal / rate;
}

function convertUsdToLocal(amountUsd: number, countryCode: string): number {
  const rate = getFxRate(countryCode);
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
  ZA: "ZAR", AT: "EUR", BE: "EUR", PH: "PHP", TW: "TWD",
};

type Mode = "working" | "retired";
type FilingStatus = "single" | "married";
type SalaryType = "remote" | "local" | "freelance";
type FurnishedType = "furnished" | "unfurnished";
type YesNo = "yes" | "no";
type CurrencyDisplay = "USD" | "CURRENT" | "DESTINATION";
type HousingMode = "rent" | "buy";

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

// Fix #5: Non-negative helper and integer clamp helpers
const nz = (v: string) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const nonNegative = (v: string) => Math.max(0, nz(v));

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
    case "verified":    return { label: "● Verified",            cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800" };
    case "partial":     return { label: "● Planning estimate",   cls: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800" };
    case "simplified":  return { label: "● Simplified estimate", cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800" };
    case "placeholder": return { label: "⚠ Directional only",   cls: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-800" };
    default:            return { label: "⚠ Unknown",             cls: "bg-slate-50 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700" };
  }
}

const INT_TAX_LABEL = "Tax model updated March 2026 · figures are 2024, 2024–25, or 2025 by jurisdiction";

const inputCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
const selectCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600 dark:text-slate-400";

function InfoTip({ text, align = "left" }: { text: string; align?: "left" | "right" | "center" }) {
  const positionClass =
    align === "right" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        i
      </button>
      <span
        className={`pointer-events-none absolute top-full z-50 mt-2 hidden max-w-[calc(100vw-2rem)] w-72 rounded-xl bg-slate-900 px-3 py-2 text-xs leading-5 text-white shadow-xl group-hover:block group-focus-within:block ${positionClass}`}
      >
        {text}
      </span>
    </span>
  );
}

// Fix #7: Cost data confidence badge (separate from tax confidence)
function CostConfidenceBadge({ hasCityDefaults }: { hasCityDefaults: boolean }) {
  if (hasCityDefaults) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-800">
        ● City-level estimate
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800">
      ● Country-level estimate
    </span>
  );
}

export default function InternationalRelocationCalculator() {
  const hasMounted = useRef(false);
  const [qsHydrated, setQsHydrated] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");
  const [taxNotesExpanded, setTaxNotesExpanded] = useState(false);
  const [howCalcExpanded, setHowCalcExpanded] = useState(false);

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

  const [conditionalAnswers, setConditionalAnswers] = useState<Record<string, string>>({});

  const [destinationRent, setDestinationRent] = useState<string>("2200");
  const [depositRequired, setDepositRequired] = useState<string>("2200");
  const [firstMonthRent, setFirstMonthRent] = useState<string>("2200");
  const [lastMonthRent, setLastMonthRent] = useState<string>("0");
  const [furnished, setFurnished] = useState<FurnishedType>("unfurnished");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<YesNo>("no");

  // Fix #2: These are now editable inputs shown in the living costs section
  const [groceries, setGroceries] = useState<string>("556");
  const [utilities, setUtilities] = useState<string>("238");
  const [transportation, setTransportation] = useState<string>("260");
  const [healthcare, setHealthcare] = useState<string>("190");

  const [visaCost, setVisaCost] = useState<string>("250");
  const [flightCost, setFlightCost] = useState<string>("650");
  const [shippingCost, setShippingCost] = useState<string>("400");
  const [temporaryStay, setTemporaryStay] = useState<string>("1800");
  const [adminFees, setAdminFees] = useState<string>("300");
  const [furnitureSetup, setFurnitureSetup] = useState<string>("1200");
  const [emergencyCashBuffer, setEmergencyCashBuffer] = useState<string>("5000");
  const [currentSavings, setCurrentSavings] = useState<string>("25000");
  const [needCar, setNeedCar] = useState<YesNo>("no");
  // Fix #6: Editable car cost
  const [carCostMonthly, setCarCostMonthly] = useState<string>("350");

  const [housingMode, setHousingMode] = useState<HousingMode>("rent");
  const [buyDownPct, setBuyDownPct] = useState<string>("20");
  const [buyRatePct, setBuyRatePct] = useState<string>("7");
  const [buyTermYears, setBuyTermYears] = useState<string>("30");

  const originCurrency = COUNTRY_TO_CURRENCY[fromCountry] ?? "USD";
  const destCurrency   = COUNTRY_TO_CURRENCY[toCountry]   ?? "USD";

  const displayAmount = (amountUsd: number, digits: number = 0) => {
    if (currencyDisplay === "CURRENT") return money(convertUsdToLocal(amountUsd, fromCountry), digits, COUNTRY_TO_CURRENCY[fromCountry] ?? "USD");
    if (currencyDisplay === "DESTINATION") return money(convertUsdToLocal(amountUsd, toCountry), digits, COUNTRY_TO_CURRENCY[toCountry] ?? "USD");
    return money(amountUsd, digits, "USD");
  };

  const sortedCountries = useMemo(() =>
    [...INTERNATIONAL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)), []);

  const fromCities = useMemo(() =>
    [...citiesForCountry(fromCountry)].sort((a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" })), [fromCountry]);

  const toCities = useMemo(() =>
    [...citiesForCountry(toCountry)].sort((a, b) =>
      a.name.trim().localeCompare(b.name.trim(), undefined, { sensitivity: "base" })), [toCountry]);

  const fromCityLabel = getInternationalCityByCode(fromCityCode)?.name ?? "Current city";
  const toCityLabel   = getInternationalCityByCode(toCityCode)?.name ?? "Target city";
  const isUSDomesticRoute = fromCountry === "US" && toCountry === "US";

  const selectedCityDefaults = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);
  const currentCityDefaults  = useMemo(() => getCityDefaultsByCode(fromCityCode), [fromCityCode]);
  const targetCityDefaults   = useMemo(() => getCityDefaultsByCode(toCityCode), [toCityCode]);
  const fromCityMultipliers  = useMemo(() => getCityCostMultipliers(fromCityCode), [fromCityCode]);
  const toCityMultipliers    = useMemo(() => getCityCostMultipliers(toCityCode), [toCityCode]);

  const incomeScenario = mode === "retired" ? "retired" : salaryType === "remote" ? "remote" : "local";

  // Fix #5: Integer-clamped adult/child counts used consistently
  const adultCount  = Math.max(1, Math.floor(nz(adults)));
  const childCount  = Math.max(0, Math.floor(nz(children)));

  useEffect(() => {
    const validFrom = fromCities.some((city) => city.code === fromCityCode);
    if (!validFrom) setFromCityCode(fromCities[0]?.code ?? "");
  }, [fromCountry, fromCities, fromCityCode]);

  useEffect(() => {
    const validTo = toCities.some((city) => city.code === toCityCode);
    if (!validTo) setToCityCode(toCities[0]?.code ?? "");
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
    const qs = getQS();
    const vMode = qs.get("mode"); if (vMode === "working" || vMode === "retired") setMode(vMode);
    const vFiling = qs.get("filing") as FilingStatus | null; if (vFiling === "single" || vFiling === "married") setFiling(vFiling);
    const vFromCountry = qs.get("fromCountry"); if (vFromCountry) setFromCountry(vFromCountry);
    const vToCountry = qs.get("toCountry"); if (vToCountry) setToCountry(vToCountry);
    const vFromCityCode = qs.get("fromCityCode"); if (vFromCityCode) setFromCityCode(vFromCityCode);
    const vToCityCode = qs.get("toCityCode"); if (vToCityCode) setToCityCode(vToCityCode);
    const vSalary = qs.get("salary"); if (vSalary) setSalary(vSalary);
    const vRetirement = qs.get("retirement"); if (vRetirement) setRetirementIncome(vRetirement);
    const vCurrency = qs.get("currency") as CurrencyDisplay | null;
    if (vCurrency === "USD" || vCurrency === "CURRENT" || vCurrency === "DESTINATION") setCurrencyDisplay(vCurrency);
    const vSalaryType = qs.get("salaryType") as SalaryType | null;
    if (vSalaryType === "remote" || vSalaryType === "local" || vSalaryType === "freelance") setSalaryType(vSalaryType);
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
      ["carCost", setCarCostMonthly],
    ];
    for (const [key, setter] of fields) { const val = qs.get(key); if (val) setter(val); }
    const vCar = qs.get("car") as YesNo | null; if (vCar === "yes" || vCar === "no") setNeedCar(vCar);
    const vHousingMode = qs.get("housingMode") as HousingMode | null;
    if (vHousingMode === "rent" || vHousingMode === "buy") setHousingMode(vHousingMode);
    const vBuyDown = qs.get("buyDown"); if (vBuyDown) setBuyDownPct(vBuyDown);
    const vBuyRate = qs.get("buyRate"); if (vBuyRate) setBuyRatePct(vBuyRate);
    const vBuyTerm = qs.get("buyTerm"); if (vBuyTerm) setBuyTermYears(vBuyTerm);
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
    if (carCostMonthly) qs.set("carCost", carCostMonthly);
    qs.set("car", needCar);
    const answersJson = JSON.stringify(conditionalAnswers);
    if (answersJson !== "{}") qs.set("taxAnswers", answersJson);
    qs.set("housingMode", housingMode);
    if (housingMode === "buy") {
      qs.set("buyDown", buyDownPct);
      qs.set("buyRate", buyRatePct);
      qs.set("buyTerm", buyTermYears);
    }
    setQS(qs);
  }, [
    mode, filing, fromCountry, toCountry, fromCityCode, toCityCode,
    salary, retirementIncome, currencyDisplay, salaryType, adults, children,
    destinationRent, depositRequired, firstMonthRent, lastMonthRent,
    furnished, utilitiesIncluded, groceries, utilities, transportation, healthcare,
    visaCost, flightCost, shippingCost, temporaryStay, adminFees, furnitureSetup,
    emergencyCashBuffer, currentSavings, needCar, carCostMonthly, conditionalAnswers,
    housingMode, buyDownPct, buyRatePct, buyTermYears,
  ]);

  const targetProfile = getCountryByCode(toCountry);

  const results = useMemo(() => {
    const baseAnnualIncome = mode === "retired" ? nz(retirementIncome) : nz(salary);
    const salaryReady = baseAnnualIncome > 0;
    const salaryTypeMultiplier = mode === "retired" ? 1 : getSalaryTypeMultiplier(salaryType);
    const annualIncomeLocalOrigin = baseAnnualIncome * salaryTypeMultiplier;
    const annualIncome = convertLocalToUsd(annualIncomeLocalOrigin, fromCountry);
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
      answers: {},
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

    const targetConfidence: TaxConfidence = targetTaxEstimate.confidence;
    const targetMissingFactor: string = targetTaxEstimate.missingFactor ?? "";
    const targetTaxLabel: string = targetTaxEstimate.label;
    const targetTaxNotes: string[] = [];
    if (targetTaxEstimate.note) targetTaxNotes.push(targetTaxEstimate.note);

    const unansweredQuestions = getConditionalQuestionsForCountry(toCountry, incomeScenario)
      .filter(q => !conditionalAnswers[q.key]);
    if (unansweredQuestions.length > 0) {
      targetTaxNotes.push(
        `Answer the tax question${unansweredQuestions.length > 1 ? "s" : ""} above to refine this estimate.`
      );
    }

    const netMonthlyFrom = grossMonthly * (1 - currentTaxRate);
    const netMonthlyTo   = grossMonthly * (1 - targetTaxRate);
    const monthlyIncomeDiff = netMonthlyTo - netMonthlyFrom;

    // Fix #3: Use actual currentCityDefaults for from-city baseline costs
    // Destination inputs (groceries, utilities, etc.) are in destination local currency
    // From-city costs are derived from currentCityDefaults when available,
    // falling back to destination inputs scaled by city multipliers.

    const familySizeMultGroceries     = 1 + (adultCount - 1) * 0.55 + childCount * 0.35;
    const familySizeMultTransport     = 1 + (adultCount - 1) * 0.35 + childCount * 0.15;
    const familySizeMultHealthcare    = 1 + (adultCount - 1) * 0.7  + childCount * 0.5;
    const familySizeMultUtilities     = 1 + (adultCount - 1) * 0.25 + childCount * 0.15;

    // ── Destination (to) side ──
    // Inputs are already entered as destination-city estimates, so city multipliers
    // are NOT applied here, that would double-adjust values that are already city-specific.
    // Family-size scaling is the only adjustment applied on top of the raw input.
    const groceriesAdj       = destToUsd(nonNegative(groceries))      * familySizeMultGroceries;
    const transportationAdj  = destToUsd(nonNegative(transportation)) * familySizeMultTransport;
    const healthcareAdj      = destToUsd(nonNegative(healthcare))     * familySizeMultHealthcare;
    const utilitiesTo        = destToUsd(nonNegative(utilities))      * familySizeMultUtilities;
    const rentTo             = destToUsd(nonNegative(destinationRent));

    const estimatedHomePrice = estimateHomePriceFromRent(rentTo);
    const buyMonthlyPI = housingMode === "buy"
      ? estimateMortgageMonthly(estimatedHomePrice, {
          downPct: nonNegative(buyDownPct) / 100,
          rate: nonNegative(buyRatePct) / 100,
          years: nonNegative(buyTermYears),
          taxAndInsurancePct: DEFAULT_TAX_INSURANCE_PCT,
        }) ?? 0
      : 0;
    const housingLine = housingMode === "buy" ? buyMonthlyPI : rentTo;
    const downPaymentUsd = housingMode === "buy" ? estimatedHomePrice * (nonNegative(buyDownPct) / 100) : 0;

    // Car cost applies only to the destination side, we don't know (or assume) the
    // user has the same car expense in their current city, so we zero it on the from side.
    const carCostTo   = needCar === "yes" ? destToUsd(nonNegative(carCostMonthly)) : 0;
    const carCostFrom = 0;

    // ── Origin (from) side, use currentCityDefaults when available ──
    let groceriesFrom: number;
    let transportationFrom: number;
    let utilitiesFrom: number;
    let rentFrom: number;
    let healthcareFrom: number;

    if (currentCityDefaults) {
      // Use actual city defaults for origin, converted from origin currency to USD
      const fromToUsd = (v: number) => convertLocalToUsd(v, fromCountry);
      groceriesFrom     = fromToUsd(currentCityDefaults.monthlyDefaults.groceries)   * familySizeMultGroceries;
      transportationFrom = fromToUsd(currentCityDefaults.monthlyDefaults.transport)  * familySizeMultTransport;
      utilitiesFrom     = fromToUsd(currentCityDefaults.monthlyDefaults.utilities)   * familySizeMultUtilities;
      rentFrom          = fromToUsd(currentCityDefaults.monthlyDefaults.rent);
      healthcareFrom    = fromToUsd(currentCityDefaults.monthlyDefaults.healthcare)  * familySizeMultHealthcare;
    } else {
      // Fallback: scale destination inputs by ratio of city multipliers
      // Scale by the ratio of from/to multipliers, destination inputs already embed
      // the to-city cost level, so applying from-city multipliers directly would double-count.
      const groceryRatio   = toCityMultipliers.groceries > 0 ? fromCityMultipliers.groceries / toCityMultipliers.groceries : 1;
      const transitRatio   = toCityMultipliers.transit   > 0 ? fromCityMultipliers.transit   / toCityMultipliers.transit   : 1;
      const utilitiesRatio = toCityMultipliers.utilities > 0 ? fromCityMultipliers.utilities / toCityMultipliers.utilities : 1;
      const housingRatio   = toCityMultipliers.housing   > 0 ? fromCityMultipliers.housing   / toCityMultipliers.housing   : 1;
      groceriesFrom      = destToUsd(nonNegative(groceries))       * familySizeMultGroceries * groceryRatio;
      transportationFrom = destToUsd(nonNegative(transportation))  * familySizeMultTransport * transitRatio;
      utilitiesFrom      = destToUsd(nonNegative(utilities))       * familySizeMultUtilities * utilitiesRatio;
      rentFrom           = destToUsd(nonNegative(destinationRent)) * housingRatio;
      healthcareFrom     = destToUsd(nonNegative(healthcare))      * familySizeMultHealthcare;
    }

    const housingUtilitiesFrom = utilitiesIncluded === "yes" ? 0 : utilitiesFrom;
    const housingUtilities     = utilitiesIncluded === "yes" ? 0 : utilitiesTo;
    const housingTotalFrom     = rentFrom + housingUtilitiesFrom + carCostFrom;
    const housingTotal         = housingLine + housingUtilities  + carCostTo;
    const livingCostsFrom      = groceriesFrom + transportationFrom + healthcareFrom;
    const livingCosts          = groceriesAdj  + transportationAdj  + healthcareAdj;

    const monthlyFlexibility = netMonthlyTo - housingTotal - livingCosts;

    // "What income do I need to live here comfortably?", targets 70% essential cost ratio (Band B)
    const targetComfortRatio = 0.70;
    const requiredNetMonthly = housingTotal + livingCosts > 0
      ? (housingTotal + livingCosts) / targetComfortRatio
      : 0;
    const requiredGrossMonthly = targetTaxRate < 1
      ? requiredNetMonthly / (1 - targetTaxRate)
      : 0;
    const requiredAnnualIncome = requiredGrossMonthly * 12;

    // Decision layer, income gap and move readiness verdict
    const incomeGap = requiredAnnualIncome - annualIncome;

    const currentMonthlyFlexibility = netMonthlyFrom - housingTotalFrom - livingCostsFrom;
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
    const totalPctOfNet   = netMonthlyTo > 0 ? (housingTotal + livingCosts) / netMonthlyTo : 0;
    const housingPctOfNet = netMonthlyTo > 0 ? housingTotal / netMonthlyTo : 0;
    const pct             = housingPctOfNet * 100;
    const comfort         = getReadinessBand(totalPctOfNet);
    const furnitureAdj    = furnished === "furnished" ? 0 : destToUsd(nonNegative(furnitureSetup));

    // Fix #5: nonNegative applied to all upfront cost inputs
    const rentUpfront =
      destToUsd(nonNegative(depositRequired)) + destToUsd(nonNegative(firstMonthRent)) +
      destToUsd(nonNegative(lastMonthRent));
    const housingUpfront = housingMode === "buy" ? downPaymentUsd : rentUpfront;
    const upfrontCashNeeded =
      housingUpfront                            + destToUsd(nonNegative(visaCost))       +
      destToUsd(nonNegative(flightCost))        + destToUsd(nonNegative(shippingCost))   +
      destToUsd(nonNegative(temporaryStay))     + destToUsd(nonNegative(adminFees))      +
      furnitureAdj + destToUsd(nonNegative(emergencyCashBuffer));

    const totalMonthlyOutflow = housingTotal + livingCosts;
    const monthsCovered = totalMonthlyOutflow > 0 ? convertLocalToUsd(nonNegative(currentSavings), fromCountry) / totalMonthlyOutflow : 0;

    const currentProfile = getCountryByCode(fromCountry);
    const fromIndex = currentCityDefaults?.costIndex ?? currentProfile?.monthlyCostIndexSingle ?? 1;
    const toIndex   = targetCityDefaults?.costIndex  ?? targetProfile?.monthlyCostIndexSingle  ?? 1;
    const comparableSalary   = fromIndex > 0 ? annualIncome * (toIndex / fromIndex) : annualIncome;
    const relativeDifference = fromIndex > 0 ? (toIndex - fromIndex) / fromIndex : 0;

    return {
      salaryReady, annualIncome, grossMonthly,
      currentTaxRate, targetTaxRate,
      targetConfidence, targetMissingFactor, targetTaxLabel, targetTaxNotes,
      netMonthlyFrom, netMonthlyTo, monthlyIncomeDiff,
      groceriesFrom, transportationFrom, utilitiesFrom, rentFrom, healthcareFrom, housingTotalFrom, livingCostsFrom,
      groceriesAdj, transportationAdj, healthcareAdj, utilitiesTo,
      housingTotal, rentTo, housingMode, estimatedHomePrice, buyMonthlyPI, downPaymentUsd, housingUtilities, carCostTo, carCostFrom, livingCosts,
      monthlyFlexibility,
      requiredNetMonthly, requiredGrossMonthly, requiredAnnualIncome,
      incomeGap, marginChangePct, flexibilityRatio, readinessRecommendation,
      pct, comfort,
      upfrontCashNeeded, monthsCovered, comparableSalary, relativeDifference,
    };
  }, [
    mode, salary, retirementIncome, salaryType, filing, fromCountry, toCountry,
    incomeScenario, conditionalAnswers,
    fromCityMultipliers, toCityMultipliers, currentCityDefaults, targetCityDefaults,
    adultCount, childCount, needCar, carCostMonthly, furnished, utilitiesIncluded,
    utilities, destinationRent, groceries, transportation, healthcare,
    depositRequired, firstMonthRent, lastMonthRent,
    visaCost, flightCost, shippingCost, temporaryStay, adminFees, furnitureSetup,
    emergencyCashBuffer, currentSavings, targetProfile,
    housingMode, buyDownPct, buyRatePct, buyTermYears,
  ]);

  const badge = confidenceBadge(results.targetConfidence);

  // ---------------------------------------------------------------------------
  // PDF EXPORT
  // ---------------------------------------------------------------------------
  const pdfRows = useMemo<PdfRow[]>(() => {
    const totalPctOfNet = results.netMonthlyTo > 0
      ? ((results.housingTotal + results.livingCosts) / results.netMonthlyTo) * 100
      : 0;
    const rows: PdfRow[] = [
      { Metric: "From", Value: `${fromCityLabel}, ${getCountryByCode(fromCountry)?.name ?? fromCountry}` },
      { Metric: "To", Value: `${toCityLabel}, ${getCountryByCode(toCountry)?.name ?? toCountry}` },
      { Metric: "Mode", Value: mode === "retired" ? "Retired" : "Working" },
      { Metric: mode === "retired" ? "Gross annual retirement income" : "Gross annual salary", Value: displayAmount(results.annualIncome) },
      { Metric: "Net monthly income (current)", Value: displayAmount(results.netMonthlyFrom) },
      { Metric: "Net monthly income (target)", Value: displayAmount(results.netMonthlyTo) },
      { Metric: "Effective tax rate (current)", Value: `${(results.currentTaxRate * 100).toFixed(1)}%` },
      { Metric: "Effective tax rate (target)", Value: `${(results.targetTaxRate * 100).toFixed(1)}% (${results.targetTaxLabel})` },
      { Metric: "Housing mode", Value: results.housingMode === "buy" ? "Buying" : "Renting" },
      ...(results.housingMode === "buy" ? [{ Metric: "Estimated home price", Value: displayAmount(results.estimatedHomePrice) }] : []),
      { Metric: "Monthly housing cost (target)", Value: displayAmount(results.housingTotal) },
      { Metric: "Housing as % of net income", Value: `${results.pct.toFixed(1)}%` },
      { Metric: "Total monthly expenses as % of net income", Value: `${totalPctOfNet.toFixed(1)}%` },
      { Metric: "Monthly flexibility after expenses", Value: displayAmount(results.monthlyFlexibility) },
      { Metric: "Comfort score", Value: `${results.comfort.band} · ${results.comfort.label}` },
      { Metric: "Upfront cash needed", Value: displayAmount(results.upfrontCashNeeded) },
      { Metric: "Savings runway", Value: `${results.monthsCovered.toFixed(1)} months` },
      { Metric: "Cost-of-living-adjusted comparable income", Value: displayAmount(results.comparableSalary) },
      { Metric: `${toCityLabel} vs ${fromCityLabel} cost difference`, Value: `${Math.abs(results.relativeDifference * 100).toFixed(1)}% ${results.relativeDifference >= 0 ? "more" : "less"} expensive` },
    ];
    return rows;
  }, [fromCityLabel, toCityLabel, fromCountry, toCountry, mode, results, displayAmount]);

  const handleExportPdf = () => {
    const filenameCity = (toCityLabel || "scenario").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadPdfReport({
      filename: `international-relocation-scenario-${filenameCity}`,
      title: `${fromCityLabel} → ${toCityLabel}`,
      subtitle: `${results.comfort.label}${results.salaryReady ? ` · ${displayAmount(results.monthlyFlexibility, 0)}/mo flexibility` : ""}`,
      rows: pdfRows,
      footerNote: "Estimates only, based on public cost-of-living and tax data. Not financial or tax advice. relocationbynumbers.com",
    });
  };

  function resetInputsKeepContext() {
    const cityDefaults    = getCityDefaultsByCode(toCityCode);
    const countryDefaults = getCountryByCode(toCountry);
    setSalary(""); setRetirementIncome("");
    setConditionalAnswers({});
    if (cityDefaults) {
      setDestinationRent(String(cityDefaults.monthlyDefaults.rent));
      setDepositRequired(String(cityDefaults.monthlyDefaults.rent * cityDefaults.housing.depositMonths));
      setFirstMonthRent(String(cityDefaults.monthlyDefaults.rent));
      setLastMonthRent(String(cityDefaults.housing.lastMonthRentDefault));
      setUtilitiesIncluded(cityDefaults.housing.utilitiesIncludedDefault);
      setGroceries(String(cityDefaults.monthlyDefaults.groceries));
      setUtilities(String(cityDefaults.monthlyDefaults.utilities));
      setTransportation(String(cityDefaults.monthlyDefaults.transport));
      setHealthcare(String(cityDefaults.monthlyDefaults.healthcare));
      setVisaCost(String(cityDefaults.startupCosts.visa));
      setFlightCost(String(cityDefaults.startupCosts.flight));
      setShippingCost(String(cityDefaults.startupCosts.shipping));
      setTemporaryStay(String(cityDefaults.startupCosts.temporaryStay));
      setAdminFees(String(cityDefaults.startupCosts.adminFees));
      setFurnitureSetup(String(cityDefaults.housing.furnishedSetupCost));
      setEmergencyCashBuffer(String(cityDefaults.startupCosts.emergencyBuffer));
    } else if (countryDefaults) {
      const fallbackRent = adultCount >= 2 || childCount > 0 ? countryDefaults.defaultRentFamily : countryDefaults.defaultRentSingle;
      const fallbackHealthcare = adultCount >= 2 || childCount > 0 ? countryDefaults.healthcareMonthlyFamily : countryDefaults.healthcareMonthlySingle;
      setDestinationRent(String(fallbackRent));
      setDepositRequired(String(fallbackRent * (countryDefaults.startupCosts.depositMonths ?? 1)));
      setFirstMonthRent(String(fallbackRent)); setLastMonthRent("0");
      setUtilitiesIncluded("no"); setGroceries(""); setUtilities(""); setTransportation("");
      setHealthcare(String(fallbackHealthcare));
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

  // Fix #1: Helper to build a label suffix with destination currency
  const destCurrLabel = `(${destCurrency})`;
  const originCurrLabel = `(${originCurrency})`;

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
            title="Clear all fields (keeps countries + scenario)">
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Income &amp; Location</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Fix #1: salary label shows origin currency */}
              <label className="text-sm">
                <div className={labelHeadCls}>
                  {mode === "retired" ? "Gross annual retirement income" : "Gross annual salary"}{" "}
                  <span className="text-slate-400 dark:text-slate-500">{originCurrLabel}</span>
                </div>
                <input className={inputCls} type="number" min="0"
                  value={mode === "retired" ? retirementIncome : salary}
                  onChange={(e) => mode === "retired" ? setRetirementIncome(e.target.value) : setSalary(e.target.value)}
                  placeholder=" " />
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
                <select className={selectCls} value={fromCountry}
                  onChange={(e) => { setFromCountry(e.target.value); setFromCityCode(""); }}>
                  {sortedCountries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Target country</div>
                <select className={selectCls} value={toCountry}
                  onChange={(e) => { setToCountry(e.target.value); setToCityCode(""); setConditionalAnswers({}); }}>
                  {sortedCountries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Current city</div>
                <select className={selectCls} value={fromCityCode} onChange={(e) => setFromCityCode(e.target.value)}>
                  {fromCities.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Target city</div>
                <select className={selectCls} value={toCityCode} onChange={(e) => setToCityCode(e.target.value)}>
                  {toCities.map((city) => <option key={city.code} value={city.code}>{city.name}</option>)}
                </select>
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Currency display
                  <InfoTip align="right" text="Choose how amounts appear. View in USD, your current country's currency, or your destination currency." />
                </div>
                <select className={selectCls} value={currencyDisplay} onChange={(e) => setCurrencyDisplay(e.target.value as CurrencyDisplay)}>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="CURRENT">Current currency ({COUNTRY_TO_CURRENCY[fromCountry] ?? "USD"})</option>
                  <option value="DESTINATION">Destination currency ({COUNTRY_TO_CURRENCY[toCountry] ?? "USD"})</option>
                </select>
              </label>
              <div className="text-sm">
                <div className={labelHeadCls}>Income impact
                  <InfoTip align="right" text="Shows how your estimated monthly take-home pay changes between your current location and destination after taxes." />
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
                <label className="text-sm">
                  <div className={labelHeadCls}>Income type</div>
                  <select className={selectCls} value={salaryType} onChange={(e) => setSalaryType(e.target.value as SalaryType)}>
                    <option value="remote">Keeping current remote salary</option>
                    <option value="local">Local salary abroad</option>
                    <option value="freelance">Freelance / self-employed</option>
                  </select>
                </label>
              )}
              <label className="text-sm">
                <div className={labelHeadCls}>Current savings available <span className="text-slate-400 dark:text-slate-500">{originCurrLabel}</span></div>
                <input className={inputCls} type="number" min="0" value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Number of adults</div>
                {/* Fix #5: min=1 enforced via state clamp, but also as attribute hint */}
                <input className={inputCls} type="number" min="1" step="1" value={adults}
                  onChange={(e) => setAdults(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Number of children</div>
                <input className={inputCls} type="number" min="0" step="1" value={children}
                  onChange={(e) => setChildren(e.target.value)} placeholder=" " />
              </label>
            </div>
          </div>

          {/* Dynamic conditional tax questions */}
          {getConditionalQuestionsForCountry(toCountry, incomeScenario).map((q: ConditionalQuestion) => (
            <div key={q.key} className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{getCountryByCode(toCountry)?.name ?? toCountry}, Tax Question</div>
              <label className="text-sm">
                <div className={labelHeadCls}>
                  {q.label}
                  {q.helpText && <InfoTip text={q.helpText} />}
                </div>
                <select
                  className={selectCls}
                  value={conditionalAnswers[q.key] ?? ""}
                  onChange={(e) => setConditionalAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {q.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            </div>
          ))}

          {/* Housing */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Housing</div>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button type="button" onClick={() => setHousingMode("rent")} className={`rounded-lg px-3 py-1 text-sm ${housingMode === "rent" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Rent</button>
                <button type="button" onClick={() => setHousingMode("buy")} className={`rounded-lg px-3 py-1 text-sm ${housingMode === "buy" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>Buy</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Fix #1: All housing inputs now show destination currency */}
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>
                  Rent in destination (monthly) <span className="text-slate-400 dark:text-slate-500">{destCurrLabel}</span>
                </div>
                <input className={inputCls} type="number" min="0" value={destinationRent}
                  onChange={(e) => setDestinationRent(e.target.value)} placeholder=" " />
              </label>
              {housingMode === "buy" ? (
                <>
                  <label className="text-sm sm:col-span-2">
                    <div className={labelHeadCls}>Estimated home price</div>
                    <input className={`${inputCls} opacity-70`} type="text" readOnly
                      value={displayAmount(results.estimatedHomePrice ?? 0)} />
                  </label>
                  <label className="text-sm">
                    <div className={labelHeadCls}>Down payment (%)</div>
                    <input className={inputCls} type="number" value={buyDownPct}
                      onChange={(e) => setBuyDownPct(e.target.value)} placeholder=" " />
                  </label>
                  <label className="text-sm">
                    <div className={labelHeadCls}>Interest rate (%)</div>
                    <input className={inputCls} type="number" step="0.1" value={buyRatePct}
                      onChange={(e) => setBuyRatePct(e.target.value)} placeholder=" " />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <div className={labelHeadCls}>Loan term (years)</div>
                    <select className={selectCls} value={buyTermYears} onChange={(e) => setBuyTermYears(e.target.value)}>
                      <option value="15">15 years</option>
                      <option value="20">20 years</option>
                      <option value="30">30 years</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="text-sm">
                    <div className={labelHeadCls}>Deposit required <span className="text-slate-400 dark:text-slate-500">{destCurrLabel}</span></div>
                    <input className={inputCls} type="number" min="0" value={depositRequired}
                      onChange={(e) => setDepositRequired(e.target.value)} placeholder=" " />
                  </label>
                  <label className="text-sm">
                    <div className={labelHeadCls}>First month rent <span className="text-slate-400 dark:text-slate-500">{destCurrLabel}</span></div>
                    <input className={inputCls} type="number" min="0" value={firstMonthRent}
                      onChange={(e) => setFirstMonthRent(e.target.value)} placeholder=" " />
                  </label>
                  <label className="text-sm">
                    <div className={labelHeadCls}>Last month rent <span className="text-slate-400 dark:text-slate-500">{destCurrLabel}</span></div>
                    <input className={inputCls} type="number" min="0" value={lastMonthRent}
                      onChange={(e) => setLastMonthRent(e.target.value)} placeholder=" " />
                  </label>
                </>
              )}
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
            {housingMode === "buy" && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                No destination here has a verified home-price dataset, so the price above is estimated from the rent
                figure (16x annual rent, a standard rule of thumb), treat it as a rough planning figure, not a real
                listing price.
              </p>
            )}
          </div>

          {/* Fix #2: Estimated Living Costs, now fully editable inputs */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Estimated Living Costs
                <InfoTip text="Enter your estimated monthly costs in your destination currency. Family-size adjustments are applied automatically." />
              </div>
              {/* Fix #7: Cost data confidence badge */}
              <CostConfidenceBadge hasCityDefaults={!!selectedCityDefaults} />
            </div>
            <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              All amounts are entered in destination currency <span className="font-medium">{destCurrLabel}</span>. Family-size adjustments are applied automatically.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Fix #1 + #2: Editable inputs with destination currency label */}
              <label className="text-sm">
                <div className={labelHeadCls}>Groceries (monthly) <span className="text-slate-400 dark:text-slate-500">{destCurrLabel}</span></div>
                <input className={inputCls} type="number" min="0" value={groceries}
                  onChange={(e) => setGroceries(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Utilities (monthly) <span className="text-slate-400 dark:text-slate-500">{destCurrLabel}</span></div>
                <input className={inputCls} type="number" min="0" value={utilities}
                  onChange={(e) => setUtilities(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Transportation (monthly) <span className="text-slate-400 dark:text-slate-500">{destCurrLabel}</span></div>
                <input className={inputCls} type="number" min="0" value={transportation}
                  onChange={(e) => setTransportation(e.target.value)} placeholder=" " />
              </label>
              <label className="text-sm">
                <div className={labelHeadCls}>Healthcare (monthly) <span className="text-slate-400 dark:text-slate-500">{destCurrLabel}</span></div>
                <input className={inputCls} type="number" min="0" value={healthcare}
                  onChange={(e) => setHealthcare(e.target.value)} placeholder=" " />
              </label>
              {/* Fix #6: Do you need a car + editable cost */}
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Will you need a car?</div>
                <select className={selectCls} value={needCar} onChange={(e) => setNeedCar(e.target.value as YesNo)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
              {needCar === "yes" && (
                <label className="text-sm sm:col-span-2">
                  <div className={labelHeadCls}>
                    Est. monthly car cost <span className="text-slate-400 dark:text-slate-500">{destCurrLabel}</span>
                    <InfoTip text="Include loan/lease, insurance, fuel, and parking. Vary this by country, $350 may be too high or too low depending on the market." />
                  </div>
                  <input className={inputCls} type="number" min="0" value={carCostMonthly}
                    onChange={(e) => setCarCostMonthly(e.target.value)} placeholder=" " />
                </label>
              )}
            </div>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {!!selectedCityDefaults
                ? "Pre-filled from city-level data. Adjust freely, these are starting points."
                : "Pre-filled from country-level data. City-level data not available for this city, your own research may be more accurate."}
            </div>
          </div>

          {/* One-Time Moving Costs */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">One-Time Moving Costs</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Fix #1: All moving cost inputs now show destination currency */}
              {([
                ["Visa / permit estimate", visaCost, setVisaCost, true],
                ["One-way flight estimate", flightCost, setFlightCost, false],
                ["Shipping / baggage estimate", shippingCost, setShippingCost, true],
                ["Temporary housing estimate", temporaryStay, setTemporaryStay, true],
                ["Setup / admin estimate", adminFees, setAdminFees, true],
                ["Furniture / setup estimate", furnitureSetup, setFurnitureSetup, true],
              ] as [string, string, (v: string) => void, boolean][]).map(([label, value, setter, isDestCurr]) => (
                <label key={label} className="text-sm">
                  <div className={labelHeadCls}>
                    {label} <span className="text-slate-400 dark:text-slate-500">{isDestCurr ? destCurrLabel : "(USD)"}</span>
                  </div>
                  <input className={inputCls} type="number" min="0" value={value}
                    onChange={(e) => setter(e.target.value)} placeholder=" " />
                </label>
              ))}
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>
                  Recommended cash buffer <span className="text-slate-400 dark:text-slate-500">{destCurrLabel}</span>
                </div>
                <input className={inputCls} type="number" min="0" value={emergencyCashBuffer}
                  onChange={(e) => setEmergencyCashBuffer(e.target.value)} placeholder=" " />
              </label>
            </div>
            <div className="mt-4 w-full text-xs text-slate-500 dark:text-slate-400">Planning estimates only.</div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        {isUSDomesticRoute ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">Domestic U.S. move detected</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Use your U.S. relocation calculator for state-to-state comparisons.</div>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              This calculator is designed for international moves. For{" "}
              <span className="font-medium">United States → United States</span>,
              your domestic calculator will give a more trustworthy result.
            </p>
            <a href="https://www.relocationbynumbers.com/" target="_blank" rel="noreferrer"
              className="mt-4 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
              Go to Relocation by Numbers
            </a>
          </div>
        ) : null}

        <div className="space-y-3">
          {/* Main results card */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Results</div>
            <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">{INT_TAX_LABEL} · Planning estimates only</div>

            <div className="mb-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div>Current: <span className="font-semibold text-slate-900 dark:text-slate-100">{fromCityLabel}</span>
                {getCountryByCode(fromCountry)?.name && fromCityLabel !== getCountryByCode(fromCountry)!.name && (
                  <span className="text-slate-400 dark:text-slate-500">, {getCountryByCode(fromCountry)!.name}</span>
                )}
              </div>
              <div>Target: <span className="font-semibold text-slate-900 dark:text-slate-100">{toCityLabel}</span>
                {getCountryByCode(toCountry)?.name && toCityLabel !== getCountryByCode(toCountry)!.name && (
                  <span className="text-slate-400 dark:text-slate-500">, {getCountryByCode(toCountry)!.name}</span>
                )}
              </div>
            </div>

            <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300">
              <div>Net monthly (current): <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.netMonthlyFrom)}</span></div>
              <div>Net monthly (target): <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.netMonthlyTo)}</span></div>

              {results.salaryReady && (
                <>
                  <div className="mt-2">Gross monthly: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.grossMonthly, 2)}</span></div>
                  <div>Est. taxes (current): <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.grossMonthly * results.currentTaxRate, 2)}</span>{" "}
                    <span className="text-xs text-slate-500 dark:text-slate-400">({(results.currentTaxRate * 100).toFixed(1)}%)</span>
                  </div>
                  <div>Est. taxes (target): <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.grossMonthly * results.targetTaxRate, 2)}</span>{" "}
                    <span className="text-xs text-slate-500 dark:text-slate-400">({(results.targetTaxRate * 100).toFixed(1)}%)</span>
                  </div>

                  {/* Confidence banner */}
                  <div className={`mt-3 rounded-xl ring-1 overflow-hidden ${
                    results.targetConfidence === "verified"     ? "bg-emerald-50 ring-emerald-200 dark:bg-emerald-950/20 dark:ring-emerald-800"
                    : results.targetConfidence === "partial"   ? "bg-blue-50 ring-blue-200 dark:bg-blue-950/20 dark:ring-blue-800"
                    : results.targetConfidence === "placeholder" ? "bg-rose-50 ring-rose-200 dark:bg-rose-950/20 dark:ring-rose-800"
                    : "bg-amber-50 ring-amber-200 dark:bg-amber-950/20 dark:ring-amber-800"
                  }`}>
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
                    {results.targetMissingFactor && (
                      <div className="px-4 pb-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Key gap: </span>{results.targetMissingFactor}
                      </div>
                    )}
                    {results.targetTaxNotes.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setTaxNotesExpanded(v => !v)}
                          className="flex w-full items-center justify-between border-t border-black/5 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-black/[0.03] transition-colors dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
                        >
                          <span>{taxNotesExpanded ? "Hide detail" : "Show full detail"}</span>
                          <span className="opacity-50">{taxNotesExpanded ? "▲" : "▼"}</span>
                        </button>
                        {taxNotesExpanded && (
                          <div className="space-y-1.5 border-t border-black/5 px-4 py-3 dark:border-white/10">
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

              <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">Monthly housing</div>
              <div className="grid gap-1 text-sm">
                <div>Rent: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.rentTo, 2)}</span></div>
                {results.housingUtilities > 0 && <div>Utilities: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.housingUtilities, 2)}</span></div>}
                {results.carCostTo > 0 && <div>Car: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.carCostTo, 2)}</span></div>}
                <div className="pt-1">Total housing: <span className="font-bold text-slate-900 dark:text-slate-100">{displayAmount(results.housingTotal, 2)}</span></div>
              </div>
              <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">Monthly living costs</div>
              <div className="grid gap-1 text-sm">
                <div>Groceries: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.groceriesAdj, 2)}</span></div>
                <div>Transportation: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.transportationAdj, 2)}</span></div>
                <div>Healthcare: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.healthcareAdj, 2)}</span></div>
                <div className="pt-1">Total: <span className="font-bold text-slate-900 dark:text-slate-100">{displayAmount(results.livingCosts, 2)}</span></div>
              </div>
              <div className="mt-2">Upfront cash needed: <span className="font-semibold text-slate-900 dark:text-slate-100">{displayAmount(results.upfrontCashNeeded)}</span></div>
              <div>Months covered by savings: <span className="font-semibold text-slate-900 dark:text-slate-100">{Number.isFinite(results.monthsCovered) ? results.monthsCovered.toFixed(1) : "—"}</span></div>
              <div className="mt-2">Housing % of net (target): <span className="font-semibold text-slate-900 dark:text-slate-100">{Number.isFinite(results.pct) ? `${results.pct.toFixed(1)}%` : "—"}</span></div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 space-y-1">
              <div>Results are estimates only. No information entered is stored or shared.</div>
              <div>Tax estimates, rent, immigration costs, and retirement treatment vary by destination and personal circumstances.</div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Tip: Your URL updates as you type, copy the page link to share this scenario.</div>
          </div>

          {/* Move Readiness, top-level decision verdict */}
          {results.salaryReady && (
            <div className={`rounded-2xl p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ${
              results.readinessRecommendation.tone === "good"
                ? "bg-emerald-50/80 ring-emerald-200 dark:bg-emerald-950/20 dark:ring-emerald-800"
                : results.readinessRecommendation.tone === "caution"
                  ? "bg-amber-50/80 ring-amber-200 dark:bg-amber-950/20 dark:ring-amber-800"
                  : "bg-rose-50/80 ring-rose-200 dark:bg-rose-950/20 dark:ring-rose-800"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                    results.readinessRecommendation.tone === "good"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : results.readinessRecommendation.tone === "caution"
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-rose-700 dark:text-rose-400"
                  }`}>
                    Move Readiness
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {results.readinessRecommendation.label}
                  </div>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-black/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10">
                  Decision check
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {results.readinessRecommendation.note}
              </p>
              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-xl bg-white/75 p-3 ring-1 ring-black/5 dark:bg-slate-800/60 dark:ring-white/10">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Income target gap</div>
                  <div className={`mt-1 font-semibold ${
                    results.incomeGap > 0 ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {results.incomeGap > 0
                      ? `${displayAmount(results.incomeGap, 0)} below target`
                      : `${displayAmount(Math.abs(results.incomeGap), 0)} above target`}
                  </div>
                </div>
                <div className="rounded-xl bg-white/75 p-3 ring-1 ring-black/5 dark:bg-slate-800/60 dark:ring-white/10">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Monthly room</div>
                  <div className={`mt-1 font-semibold ${
                    results.monthlyFlexibility >= 500 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                  }`}>
                    {displayAmount(results.monthlyFlexibility, 0)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
  Your monthly margin {results.marginChangePct >= 0 ? "improves" : "drops"} by{" "}
  <span className="font-semibold">
    {Math.abs(results.marginChangePct).toFixed(1)}%
  </span>{" "}
  compared to your current location.
</div>
            </div>
          )}

          {/* Monthly Flexibility */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">Monthly Flexibility</div>
                <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {results.salaryReady ? displayAmount(results.monthlyFlexibility, 2) : "—"}
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 dark:bg-slate-800 dark:text-amber-300 dark:ring-amber-800">
                After housing and essentials
              </div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-amber-100 dark:bg-slate-800/80 dark:ring-amber-900/40">
              <div className={`h-full rounded-full ${
                !results.salaryReady ? "w-[0%] bg-slate-300"
                : results.monthlyFlexibility >= 3000 ? "w-[92%] bg-emerald-500"
                : results.monthlyFlexibility >= 2000 ? "w-[76%] bg-emerald-400"
                : results.monthlyFlexibility >= 1000 ? "w-[58%] bg-amber-400"
                : results.monthlyFlexibility >= 500  ? "w-[40%] bg-orange-400"
                : "w-[24%] bg-rose-400"
              }`} />
            </div>
            <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              {!results.salaryReady
                ? "Add salary and housing inputs to estimate how much room you have left each month."
                : `This is what you may have left each month in ${toCityLabel} after housing costs and core living expenses.`}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Higher flexibility gives you more room for saving, investing, travel, and unexpected expenses.</div>
          </div>

          {/* Comfortable Income Target, the "decision layer" card */}
          {results.salaryReady && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-blue-900/60 dark:bg-blue-950/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400">
                    Comfortable Income Target
                  </div>
                  <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {displayAmount(results.requiredAnnualIncome, 0)}
                  </div>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 dark:bg-slate-800 dark:text-blue-300 dark:ring-blue-800">
                  Annual gross
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                Based on your inputs, this is the estimated gross annual income needed to keep housing
                and essential living costs around 70% of take-home pay in {toCityLabel}.
              </p>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-400 sm:grid-cols-2">
                <div className="rounded-xl bg-white/70 p-3 ring-1 ring-blue-100 dark:bg-slate-800/60 dark:ring-blue-900/40">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Required net monthly</div>
                  <div className="mt-1">{displayAmount(results.requiredNetMonthly, 0)}</div>
                </div>
                <div className="rounded-xl bg-white/70 p-3 ring-1 ring-blue-100 dark:bg-slate-800/60 dark:ring-blue-900/40">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Current target net monthly</div>
                  <div className="mt-1">{displayAmount(results.netMonthlyTo, 0)}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                This is a planning target, not a guarantee. Lower housing, lower taxes, or lower monthly costs reduce the income needed.
              </div>
              {results.incomeGap > 0 ? (
                <div className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">
                  You're about {displayAmount(results.incomeGap, 0)} below this target.
                </div>
              ) : (
                <div className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  You exceed this target by {displayAmount(Math.abs(results.incomeGap), 0)}.
                </div>
              )}
            </div>
          )}

          {/* Comparable Salary */}
          {results.salaryReady && (
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
          )}

          {/* Comfort Score */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                  {mode === "retired" ? "Retirement Readiness Score" : "Comfort Score™"}
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {results.comfort.band} · {results.comfort.label}
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-slate-800 dark:text-emerald-300 dark:ring-emerald-800">Essential costs</div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-emerald-100 dark:bg-slate-800/80 dark:ring-emerald-900/40">
              <div className={`h-full rounded-full ${
                results.comfort.band === "A" ? "w-[92%] bg-emerald-500"
                : results.comfort.band === "B" ? "w-[78%] bg-emerald-400"
                : results.comfort.band === "C" ? "w-[60%] bg-amber-400"
                : "w-[42%] bg-orange-400"
              }`} />
            </div>
            <div className="mt-3 text-sm text-slate-700 dark:text-slate-300">{results.comfort.note}</div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Based on how much of your net monthly income goes toward housing and essential living costs.</div>
          </div>

          {/* Fix #4: How we calculate this, transparent methodology block */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
            <button
              type="button"
              onClick={() => setHowCalcExpanded(v => !v)}
              className="flex w-full items-center justify-between text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-white"
            >
              <span>How we calculate this</span>
              <span className="text-slate-400 dark:text-slate-500">{howCalcExpanded ? "▲" : "▼"}</span>
            </button>
            {howCalcExpanded && (
              <div className="mt-4 space-y-4 text-xs leading-5 text-slate-600 dark:text-slate-400">
                <p>
                  This calculator estimates monthly take-home pay, housing and essential living costs, upfront moving cash,
                  and savings runway. Tax estimates come from country-specific models and may be verified, partial,
                  simplified, or directional depending on jurisdiction.
                </p>
                <div className="space-y-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Key formulas</div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 space-y-1.5 font-mono text-[11px] text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    <div>Net monthly = gross monthly × (1 − effective tax rate)</div>
                    <div>Monthly flexibility = net monthly − housing − essential living costs</div>
                    <div className="pt-1">Upfront cash = deposit + first month + last month</div>
                    <div className="pl-4">+ visa + flight + shipping + temporary housing</div>
                    <div className="pl-4">+ admin fees + furniture + emergency buffer</div>
                    <div className="pt-1">Months covered = savings ÷ (housing + living costs)</div>
                    <div className="pt-1">Comfortable income target = (housing + living costs) ÷ 70% ÷ (1 − target tax rate) × 12</div>
                    <div className="pt-1">Comparable salary = your salary × (destination cost index ÷ origin cost index)</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Cost data</div>
                  <p>
                    Living costs (groceries, transport, utilities, healthcare) are pre-filled from city-level data where
                    available, or country-level data as a fallback. A <span className="font-medium">City-level estimate</span> badge
                    means the defaults are city-specific; <span className="font-medium">Country-level estimate</span> means
                    the data is broader and less precise. You can edit all values freely.
                  </p>
                  <p className="mt-1">
                    Current-city baseline costs are drawn directly from city defaults (not back-calculated from destination
                    inputs), so the comparison reflects actual local data rather than scaled estimates.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Tax estimates</div>
                  <p>
                    Tax confidence levels range from <span className="font-medium text-emerald-700 dark:text-emerald-400">Verified</span> (exact
                    or near-exact) to <span className="font-medium text-rose-700 dark:text-rose-400">Directional only</span> (high-level
                    estimate; verify before planning). US citizens abroad may owe US taxes regardless of residency,
                    consult a cross-border tax adviser.
                  </p>
                </div>
                <p className="text-slate-400 dark:text-slate-500">All figures are planning estimates. No data is stored or shared.</p>
              </div>
            )}
          </div>

          {/* Share */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-sky-900/60 dark:bg-sky-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-400">Share this scenario</div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">Copy your current comparison link and send it to a partner, friend, or future self.</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    const shareUrl = new URL(window.location.href);
                    const shareText = `My international relocation scenario: ${fromCityLabel} → ${toCityLabel}. Monthly flexibility ${displayAmount(results.monthlyFlexibility, 0)} after housing.`;
                    const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
                    if (canNativeShare) {
                      await (navigator as Navigator & { share: (data: { title?: string; text?: string; url?: string }) => Promise<void> }).share({
                        title: "My International Relocation Scenario", text: shareText, url: shareUrl.toString(),
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
              <button type="button" onClick={handleExportPdf}
                className="inline-flex items-center justify-center rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-950">
                Export PDF
              </button>
              </div>
            </div>
          </div>

          <SavedScenariosPanel getCurrentScenario={() => ({
            label: `${fromCityLabel} → ${toCityLabel}`,
            url: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
            subtitle: `${results.comfort.label} · ${displayAmount(results.monthlyFlexibility, 0)}/mo flexibility`,
            source: "International",
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
