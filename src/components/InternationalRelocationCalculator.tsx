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
import AffiliateCard from "./AffiliateCard";

// Fallback FX rates for countries not in USD_TO_LOCAL
const FX_FALLBACK: Record<string, number> = {
  AT: 0.92, // EUR
  BE: 0.92, // EUR
  RM: 0.92, // EUR (likely bad code in data)
};

// Convert a local-currency amount to USD for internal calculations
function convertLocalToUsd(amountLocal: number, countryCode: string): number {
  const rate = (USD_TO_LOCAL[countryCode] ?? FX_FALLBACK[countryCode]) ?? 1;
  return rate > 0 ? amountLocal / rate : amountLocal;
}

// Convert USD to any country's local currency for display
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
  ZA: "ZAR",
  // Additional eurozone / European countries
  AT: "EUR", BE: "EUR", RM: "EUR",
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
  const url = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  window.history.replaceState(null, "", url);
}

function getReadinessBand(ratio: number) {
  if (ratio <= 0.25) {
    return {
      band: "A",
      label: "Comfortable",
      note: "This looks healthy relative to your estimated target net income.",
    };
  }
  if (ratio <= 0.35) {
    return {
      band: "B",
      label: "Manageable",
      note: "Doable, but keep an eye on recurring costs and setup cash.",
    };
  }
  if (ratio <= 0.45) {
    return {
      band: "C",
      label: "Tight",
      note: "Possible, but the margin for error is thinner.",
    };
  }
  return {
    band: "D",
    label: "Stretched",
    note: "Housing is taking up a large share of the budget.",
  };
}

function getSalaryTypeMultiplier(salaryType: SalaryType) {
  if (salaryType === "local") return 0.9;
  if (salaryType === "freelance") return 0.82;
  return 1;
}

const inputCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 ring-1 ring-slate-200 shadow-inner outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15";
const selectCls =
  "h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 shadow-inner ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-4 focus:ring-blue-500/15";
const labelHeadCls = "mb-1 text-xs font-medium leading-4 text-slate-600";

function InfoTip({
  text,
  align = "left",
}: {
  text: string;
  align?: "left" | "right" | "center";
}) {
  const positionClass =
    align === "right"
      ? "right-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "left-0";

  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
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

export default function InternationalRelocationCalculator() {
  const hasMounted = useRef(false);
  const [qsHydrated, setQsHydrated] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "copied" | "shared" | "error"
  >("idle");

  const [mode, setMode] = useState<Mode>("working");

 const [salary, setSalary] = useState<string>("150000");
const [retirementIncome, setRetirementIncome] = useState<string>("70000");
const [filing, setFiling] = useState<FilingStatus>("single");

const [fromCountry, setFromCountry] = useState<string>("US");
const [toCountry, setToCountry] = useState<string>("PT");
const [fromCityCode, setFromCityCode] = useState<string>("US-NYC");
const [toCityCode, setToCityCode] = useState<string>("PT-LIS");

const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>("USD");

  // The currency code used for all displayed amounts
  const displayCurrency = useMemo(() => {
    if (currencyDisplay === "CURRENT") return COUNTRY_TO_CURRENCY[fromCountry] ?? "USD";
    if (currencyDisplay === "DESTINATION") return COUNTRY_TO_CURRENCY[toCountry] ?? "USD";
    return "USD";
  }, [currencyDisplay, fromCountry, toCountry]);

  // The currency code of the origin country (for salary input labeling)
  const originCurrency = COUNTRY_TO_CURRENCY[fromCountry] ?? "USD";

  // Display a USD-denominated internal value in the selected display currency
  const displayAmount = (amountUsd: number, digits: number = 0) => {
    if (currencyDisplay === "CURRENT") {
      return money(convertUsdToLocal(amountUsd, fromCountry), digits, COUNTRY_TO_CURRENCY[fromCountry] ?? "USD");
    }
    if (currencyDisplay === "DESTINATION") {
      return money(convertUsdToLocal(amountUsd, toCountry), digits, COUNTRY_TO_CURRENCY[toCountry] ?? "USD");
    }
    return money(amountUsd, digits, "USD");
  };
  const [salaryType, setSalaryType] = useState<SalaryType>("remote");
  const [adults, setAdults] = useState<string>("1");
  const [children, setChildren] = useState<string>("0");

  const [destinationRent, setDestinationRent] = useState<string>("2200");
  const [depositRequired, setDepositRequired] = useState<string>("2200");
  const [firstMonthRent, setFirstMonthRent] = useState<string>("2200");
  const [lastMonthRent, setLastMonthRent] = useState<string>("0");
  const [furnished, setFurnished] = useState<FurnishedType>("unfurnished");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState<YesNo>("no");

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

  const nz = (v: string) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };

  const sortedCountries = useMemo(() => {
  return [...INTERNATIONAL_COUNTRIES].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}, []);

const fromCities = useMemo(() => {
  return [...citiesForCountry(fromCountry)].sort((a, b) =>
    a.name.trim().localeCompare(b.name.trim(), undefined, {
      sensitivity: "base",
    })
  );
}, [fromCountry]);

const toCities = useMemo(() => {
  return [...citiesForCountry(toCountry)].sort((a, b) =>
    a.name.trim().localeCompare(b.name.trim(), undefined, {
      sensitivity: "base",
    })
  );
}, [toCountry]);

  const fromCityLabel =
  getInternationalCityByCode(fromCityCode)?.name ?? "Current city";
const toCityLabel =
  getInternationalCityByCode(toCityCode)?.name ?? "Target city";

const isUSDomesticRoute = fromCountry === "US" && toCountry === "US";

const selectedCityDefaults = useMemo(() => {
  return getCityDefaultsByCode(toCityCode);
}, [toCityCode]);

const currentCityDefaults = useMemo(() => {
  return getCityDefaultsByCode(fromCityCode);
}, [fromCityCode]);

const targetCityDefaults = useMemo(() => {
  return getCityDefaultsByCode(toCityCode);
}, [toCityCode]);

const fromCityMultipliers = useMemo(() => {
  return getCityCostMultipliers(fromCityCode);
}, [fromCityCode]);

const toCityMultipliers = useMemo(() => {
  return getCityCostMultipliers(toCityCode);
}, [toCityCode]);

  useEffect(() => {
    const validFrom = fromCities.some((city) => city.code === fromCityCode);
    if (!validFrom) {
      setFromCityCode(fromCities[0]?.code ?? "");
    }
  }, [fromCountry, fromCities, fromCityCode]);

  useEffect(() => {
    const validTo = toCities.some((city) => city.code === toCityCode);
    if (!validTo) {
      setToCityCode(toCities[0]?.code ?? "");
    }
  }, [toCountry, toCities, toCityCode]);

useEffect(() => {
  if (!selectedCityDefaults) return;
  if (!qsHydrated) return;

  const d = selectedCityDefaults;

  setDestinationRent(String(d.monthlyDefaults.rent));

  const depositAmount = d.monthlyDefaults.rent * d.housing.depositMonths;
  setDepositRequired(String(depositAmount));

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

  const fromCity = getInternationalCityByCode(fromCityCode)?.name ?? "";
  const toCity = getInternationalCityByCode(toCityCode)?.name ?? "";

  useEffect(() => {
    const qs = getQS();

    const vMode = qs.get("mode");
    if (vMode === "working" || vMode === "retired") setMode(vMode);

    const vFiling = qs.get("filing") as FilingStatus | null;
    if (vFiling === "single" || vFiling === "married") setFiling(vFiling);

    const vFromCountry = qs.get("fromCountry");
    if (vFromCountry) setFromCountry(vFromCountry);

    const vToCountry = qs.get("toCountry");
    if (vToCountry) setToCountry(vToCountry);

   const vFromCityCode = qs.get("fromCityCode");
if (vFromCityCode) setFromCityCode(vFromCityCode);

const vToCityCode = qs.get("toCityCode");
if (vToCityCode) setToCityCode(vToCityCode);

    const vSalary = qs.get("salary");
    if (vSalary) setSalary(vSalary);

    const vRetirement = qs.get("retirement");
    if (vRetirement) setRetirementIncome(vRetirement);

    const vCurrency = qs.get("currency") as CurrencyDisplay | null;
    if (vCurrency === "USD" || vCurrency === "CURRENT" || vCurrency === "DESTINATION") setCurrencyDisplay(vCurrency);

    const vSalaryType = qs.get("salaryType") as SalaryType | null;
    if (vSalaryType === "remote" || vSalaryType === "local" || vSalaryType === "freelance") {
      setSalaryType(vSalaryType);
    }

    const vAdults = qs.get("adults");
    if (vAdults) setAdults(vAdults);

    const vChildren = qs.get("children");
    if (vChildren) setChildren(vChildren);

    const vRent = qs.get("rent");
    if (vRent) setDestinationRent(vRent);

    const vDeposit = qs.get("deposit");
    if (vDeposit) setDepositRequired(vDeposit);

    const vFirst = qs.get("firstRent");
    if (vFirst) setFirstMonthRent(vFirst);

    const vLast = qs.get("lastRent");
    if (vLast) setLastMonthRent(vLast);

    const vFurnished = qs.get("furnished") as FurnishedType | null;
    if (vFurnished === "furnished" || vFurnished === "unfurnished") {
      setFurnished(vFurnished);
    }

    const vUtilIncl = qs.get("utilIncl") as YesNo | null;
    if (vUtilIncl === "yes" || vUtilIncl === "no") {
      setUtilitiesIncluded(vUtilIncl);
    }

    const fields: [string, (v: string) => void][] = [
      ["groceries", setGroceries],
      ["utilities", setUtilities],
      ["transport", setTransportation],
      ["healthcare", setHealthcare],
      ["visa", setVisaCost],
      ["flight", setFlightCost],
      ["shipping", setShippingCost],
      ["tempStay", setTemporaryStay],
      ["admin", setAdminFees],
      ["furniture", setFurnitureSetup],
      ["emergency", setEmergencyCashBuffer],
      ["savings", setCurrentSavings],
    ];

    for (const [key, setter] of fields) {
      const val = qs.get(key);
      if (val) setter(val);
    }

    const vCar = qs.get("car") as YesNo | null;
if (vCar === "yes" || vCar === "no") setNeedCar(vCar);

setQsHydrated(true);
}, []);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const qs = new URLSearchParams();
    qs.set("mode", mode);
    qs.set("filing", filing);
    qs.set("fromCountry", fromCountry);
    qs.set("toCountry", toCountry);
    if (fromCityCode) qs.set("fromCityCode", fromCityCode);
    if (toCityCode) qs.set("toCityCode", toCityCode);
    if (salary) qs.set("salary", salary);
    if (retirementIncome) qs.set("retirement", retirementIncome);
    qs.set("currency", currencyDisplay);
    qs.set("salaryType", salaryType);
    if (adults) qs.set("adults", adults);
    if (children) qs.set("children", children);
    if (destinationRent) qs.set("rent", destinationRent);
    if (depositRequired) qs.set("deposit", depositRequired);
    if (firstMonthRent) qs.set("firstRent", firstMonthRent);
    if (lastMonthRent) qs.set("lastRent", lastMonthRent);
    qs.set("furnished", furnished);
    qs.set("utilIncl", utilitiesIncluded);
    if (groceries) qs.set("groceries", groceries);
    if (utilities) qs.set("utilities", utilities);
    if (transportation) qs.set("transport", transportation);
    if (healthcare) qs.set("healthcare", healthcare);
    if (visaCost) qs.set("visa", visaCost);
    if (flightCost) qs.set("flight", flightCost);
    if (shippingCost) qs.set("shipping", shippingCost);
    if (temporaryStay) qs.set("tempStay", temporaryStay);
    if (adminFees) qs.set("admin", adminFees);
    if (furnitureSetup) qs.set("furniture", furnitureSetup);
    if (emergencyCashBuffer) qs.set("emergency", emergencyCashBuffer);
    if (currentSavings) qs.set("savings", currentSavings);
    qs.set("car", needCar);

    setQS(qs);
  }, [
    mode,
    filing,
    fromCountry,
    toCountry,
    fromCityCode,
    toCityCode,
    salary,
    retirementIncome,
    currencyDisplay,
    salaryType,
    adults,
    children,
    destinationRent,
    depositRequired,
    firstMonthRent,
    lastMonthRent,
    furnished,
    utilitiesIncluded,
    groceries,
    utilities,
    transportation,
    healthcare,
    visaCost,
    flightCost,
    shippingCost,
    temporaryStay,
    adminFees,
    furnitureSetup,
    emergencyCashBuffer,
    currentSavings,
    needCar,
  ]);

  const targetProfile = getCountryByCode(toCountry);

const results = useMemo(() => {
  const baseAnnualIncome = mode === "retired" ? nz(retirementIncome) : nz(salary);
  const salaryReady = baseAnnualIncome > 0;

  const salaryTypeMultiplier = mode === "retired" ? 1 : getSalaryTypeMultiplier(salaryType);

  // salary is entered in origin country currency — convert to USD as internal base
  const annualIncomeLocalOrigin = baseAnnualIncome * salaryTypeMultiplier;
  const annualIncome = convertLocalToUsd(annualIncomeLocalOrigin, fromCountry); // USD base

  // All cost inputs are entered in destination currency — convert to USD for internal math
  const destToUsd = (v: number) => convertLocalToUsd(v, toCountry);

  const grossMonthly = annualIncome / 12; // USD

  // Convert USD income to each country's local currency for tax estimation
  const annualIncomeForFromTax = convertUsdToLocal(annualIncome, fromCountry);
  const annualIncomeForToTax = convertUsdToLocal(annualIncome, toCountry);

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
const targetTaxRate = targetTaxEstimate.effectiveRate;

const netMonthlyFrom = grossMonthly * (1 - currentTaxRate);
const netMonthlyTo = grossMonthly * (1 - targetTaxRate);
  const monthlyIncomeDiff = netMonthlyTo - netMonthlyFrom;

const adultCount = Math.max(1, nz(adults));
const childCount = Math.max(0, nz(children));

const familyGroceries =
  destToUsd(nz(groceries)) * (1 + (adultCount - 1) * 0.55 + childCount * 0.35);

const familyTransportation =
  destToUsd(nz(transportation)) * (1 + (adultCount - 1) * 0.35 + childCount * 0.15);

const healthcareAdj =
  destToUsd(nz(healthcare)) * (1 + (adultCount - 1) * 0.7 + childCount * 0.5);

const familyUtilities =
  destToUsd(nz(utilities)) * (1 + (adultCount - 1) * 0.25 + childCount * 0.15);

// current city view
const groceriesFrom = familyGroceries * fromCityMultipliers.groceries;
const transportationFrom = familyTransportation * fromCityMultipliers.transit;
const utilitiesFrom = familyUtilities * fromCityMultipliers.utilities;
const rentFrom = destToUsd(nz(destinationRent)) * fromCityMultipliers.housing;

// target city view
const groceriesAdj = familyGroceries * toCityMultipliers.groceries;
const transportationAdj = familyTransportation * toCityMultipliers.transit;
const utilitiesAdj = familyUtilities * toCityMultipliers.utilities;
const rentTo = destToUsd(nz(destinationRent)) * toCityMultipliers.housing;

const carCost = needCar === "yes" ? destToUsd(350) : 0;

const housingUtilitiesFrom = utilitiesIncluded === "yes" ? 0 : utilitiesFrom;
const housingUtilities = utilitiesIncluded === "yes" ? 0 : utilitiesAdj;

const housingTotalFrom = rentFrom + housingUtilitiesFrom + carCost;
const housingTotal = rentTo + housingUtilities + carCost;

const livingCostsFrom = groceriesFrom + transportationFrom + healthcareAdj;
const livingCosts = groceriesAdj + transportationAdj + healthcareAdj;

  const monthlyFlexibility = netMonthlyTo - housingTotal - livingCosts;
  const housingPctOfNet = netMonthlyTo > 0 ? housingTotal / netMonthlyTo : 0;
  const pct = housingPctOfNet * 100;
  const comfort = getReadinessBand(housingPctOfNet);

  const furnitureAdj = furnished === "furnished" ? 0 : destToUsd(nz(furnitureSetup));

  const upfrontCashNeeded =
    destToUsd(nz(depositRequired)) +
    destToUsd(nz(firstMonthRent)) +
    destToUsd(nz(lastMonthRent)) +
    destToUsd(nz(visaCost)) +
    destToUsd(nz(flightCost)) +
    destToUsd(nz(shippingCost)) +
    destToUsd(nz(temporaryStay)) +
    destToUsd(nz(adminFees)) +
    furnitureAdj +
    destToUsd(nz(emergencyCashBuffer));

  const totalMonthlyOutflow = housingTotal + livingCosts;

  const monthsCovered =
    totalMonthlyOutflow > 0 ? destToUsd(nz(currentSavings)) / totalMonthlyOutflow : 0;

  const currentProfile = getCountryByCode(fromCountry);

const fromIndex =
  currentCityDefaults?.costIndex ??
  currentProfile?.monthlyCostIndexSingle ??
  1;

const toIndex =
  targetCityDefaults?.costIndex ??
  targetProfile?.monthlyCostIndexSingle ??
  1;

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

  currentTaxModel: currentTaxEstimate.model,
  currentTaxConfidence: currentTaxEstimate.confidence,
  currentTaxLabel: currentTaxEstimate.label,
  currentTaxNote: currentTaxEstimate.note,

  targetTaxModel: targetTaxEstimate.model,
  targetTaxConfidence: targetTaxEstimate.confidence,
  targetTaxLabel: targetTaxEstimate.label,
  targetTaxNote: targetTaxEstimate.note,

  netMonthlyFrom,
  netMonthlyTo,
  monthlyIncomeDiff,

  groceriesFrom,
  transportationFrom,
  utilitiesFrom,
  housingTotalFrom,
  livingCostsFrom,

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
  pct,
  comfort,
  upfrontCashNeeded,
  monthsCovered,
  comparableSalary,
  relativeDifference,
  };
}, [
  mode,
  salary,
  retirementIncome,
  salaryType,
  filing,
  fromCountry,
  toCountry,
  fromCityMultipliers,
  toCityMultipliers,
  currentCityDefaults,
  targetCityDefaults,
  adults,
  children,
  needCar,
  furnished,
  utilitiesIncluded,
  utilities,
  destinationRent,
  groceries,
  transportation,
  healthcare,
  depositRequired,
  firstMonthRent,
  lastMonthRent,
  visaCost,
  flightCost,
  shippingCost,
  temporaryStay,
  adminFees,
  furnitureSetup,
  emergencyCashBuffer,
  currentSavings,
  targetProfile,
]);

const adultsNum = Math.max(1, Number(adults) || 1);
const childrenNum = Math.max(0, Number(children) || 0);

  function resetInputsKeepContext() {
  const cityDefaults = getCityDefaultsByCode(toCityCode);
  const countryDefaults = getCountryByCode(toCountry);

  setSalary("");
  setRetirementIncome("");

  if (cityDefaults) {
    setDestinationRent(String(cityDefaults.monthlyDefaults.rent));

    const depositAmount =
      cityDefaults.monthlyDefaults.rent * cityDefaults.housing.depositMonths;
    setDepositRequired(String(depositAmount));

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
    const fallbackRent =
      adultsNum >= 2 || childrenNum > 0
        ? countryDefaults.defaultRentFamily
        : countryDefaults.defaultRentSingle;

    const fallbackHealthcare =
      adultsNum >= 2 || childrenNum > 0
        ? countryDefaults.healthcareMonthlyFamily
        : countryDefaults.healthcareMonthlySingle;

    setDestinationRent(String(fallbackRent));
    setDepositRequired(
      String(fallbackRent * (countryDefaults.startupCosts.depositMonths ?? 1))
    );
    setFirstMonthRent(String(fallbackRent));
    setLastMonthRent("0");

    setUtilitiesIncluded("no");

    setGroceries("");
    setUtilities("");
    setTransportation("");
    setHealthcare(String(fallbackHealthcare));

    setVisaCost(String(countryDefaults.startupCosts.visa));
    setFlightCost(String(countryDefaults.startupCosts.flight));
    setShippingCost("");
    setTemporaryStay(String(countryDefaults.startupCosts.temporaryHousing));
    setAdminFees("");
    setFurnitureSetup(String(countryDefaults.startupCosts.setup));
    setEmergencyCashBuffer("");
  } else {
    setDestinationRent("");
    setDepositRequired("");
    setFirstMonthRent("");
    setLastMonthRent("");
    setGroceries("");
    setUtilities("");
    setTransportation("");
    setHealthcare("");
    setVisaCost("");
    setFlightCost("");
    setShippingCost("");
    setTemporaryStay("");
    setAdminFees("");
    setFurnitureSetup("");
    setEmergencyCashBuffer("");
  }

  setCurrentSavings("");
}

  

  return (
    <div className="text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold" />
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70">
            <button
              type="button"
              onClick={() => setMode("working")}
              className={`rounded-lg px-3 py-1 text-sm ${
                mode === "working" ? "bg-slate-900 text-white" : "text-slate-700"
              }`}
            >
              Working
            </button>

            <button
              type="button"
              onClick={() => setMode("retired")}
              className={`rounded-lg px-3 py-1 text-sm ${
                mode === "retired" ? "bg-slate-900 text-white" : "text-slate-700"
              }`}
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
        <div className="space-y-3">
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
                  onChange={(e) =>
                    mode === "retired"
                      ? setRetirementIncome(e.target.value)
                      : setSalary(e.target.value)
                  }
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Filing status</div>
                <select
                  className={selectCls}
                  value={filing}
                  onChange={(e) => setFiling(e.target.value as FilingStatus)}
                >
                  <option value="single">Single</option>
                  <option value="married">Married (joint)</option>
                </select>
              </label>

             <label className="text-sm">
  <div className={labelHeadCls}>Current country</div>
  <select
    className={selectCls}
    value={fromCountry}
    onChange={(e) => {
      const nextCountry = e.target.value;
      setFromCountry(nextCountry);
      setFromCityCode("");
    }}
  >
                  {sortedCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

<label className="text-sm">
  <div className={labelHeadCls}>Target country</div>
  <select
    className={selectCls}
    value={toCountry}
    onChange={(e) => {
      const nextCountry = e.target.value;
      setToCountry(nextCountry);
      setToCityCode("");
    }}
  >
                  {sortedCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Current city</div>
                <select
                  className={selectCls}
                  value={fromCityCode}
                  onChange={(e) => setFromCityCode(e.target.value)}
                >
                  {fromCities.map((city) => (
                    <option key={city.code} value={city.code}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Target city</div>
                <select
                  className={selectCls}
                  value={toCityCode}
                  onChange={(e) => setToCityCode(e.target.value)}
                >
                  {toCities.map((city) => (
                    <option key={city.code} value={city.code}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>

             <label className="text-sm">
  <div className={labelHeadCls}>
    Currency display
    <InfoTip
  align="right"
  text="Choose how amounts appear in the calculator. You can view results in U.S. dollars, your current country's currency, or your destination country's currency."
/>
  </div>
  <select
    className={selectCls}
    value={currencyDisplay}
    onChange={(e) => setCurrencyDisplay(e.target.value as CurrencyDisplay)}
  >
                  <option value="USD">US Dollar (USD)</option>
                  <option value="CURRENT">Current currency ({COUNTRY_TO_CURRENCY[fromCountry] ?? "USD"})</option>
                  <option value="DESTINATION">Destination currency ({COUNTRY_TO_CURRENCY[toCountry] ?? "USD"})</option>
                </select>
              </label>

              <div className="text-sm">
                <div className={labelHeadCls}>
  Income impact
  <InfoTip
  align="right"
  text="Shows how your estimated monthly take-home pay changes between your current location and your destination after taxes."
/>
</div>
                <div className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 px-3">
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
                        {displayAmount(results.monthlyIncomeDiff, 0)}
                      </span>
                      <span className="whitespace-nowrap text-xs text-slate-500">
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

              <label className="text-sm">
                <div className={labelHeadCls}>Salary type</div>
                <select
                  className={selectCls}
                  value={salaryType}
                  onChange={(e) => setSalaryType(e.target.value as SalaryType)}
                >
                  <option value="remote">Keeping current remote salary</option>
                  <option value="local">Local salary abroad</option>
                  <option value="freelance">Freelance / self-employed</option>
                </select>
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Current savings available</div>
                <input
                  className={inputCls}
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Number of adults</div>
                <input
                  className={inputCls}
                  type="number"
                  value={adults}
                  onChange={(e) => setAdults(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Number of children</div>
                <input
                  className={inputCls}
                  type="number"
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  placeholder=" "
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">Housing</div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Rent in destination (monthly)</div>
                <input
                  className={inputCls}
                  type="number"
                  value={destinationRent}
                  onChange={(e) => setDestinationRent(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Deposit required</div>
                <input
                  className={inputCls}
                  type="number"
                  value={depositRequired}
                  onChange={(e) => setDepositRequired(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>First month rent</div>
                <input
                  className={inputCls}
                  type="number"
                  value={firstMonthRent}
                  onChange={(e) => setFirstMonthRent(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Last month rent (if applicable)</div>
                <input
                  className={inputCls}
                  type="number"
                  value={lastMonthRent}
                  onChange={(e) => setLastMonthRent(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Furnished or unfurnished</div>
                <select
                  className={selectCls}
                  value={furnished}
                  onChange={(e) => setFurnished(e.target.value as FurnishedType)}
                >
                  <option value="unfurnished">Unfurnished</option>
                  <option value="furnished">Furnished</option>
                </select>
              </label>

              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Utilities included?</div>
                <select
                  className={selectCls}
                  value={utilitiesIncluded}
                  onChange={(e) => setUtilitiesIncluded(e.target.value as YesNo)}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">
  Estimated Living Costs
  <InfoTip text="These costs are treated as your destination-budget scenario and adjusted across cities using local cost multipliers. This is a normalized comparison, not a reconstruction of your exact current spending." />
</div>

            <div className="mt-3 space-y-1 text-sm text-slate-500">


            <div className="space-y-3 text-[15px] text-slate-700">
              <div>
                Groceries:{" "}
                <span className="font-semibold text-slate-900">{displayAmount(results.groceriesAdj, 0)}</span>
              </div>
              <div>
                Utilities:{" "}
                <span className="font-semibold text-slate-900">{displayAmount(results.utilitiesAdj, 0)}</span>
              </div>
              <div>
                Transportation:{" "}
                <span className="font-semibold text-slate-900">
                  {displayAmount(results.transportationAdj, 0)}
                </span>
              </div>
              <div>
                Car estimate:{" "}
                <span className="font-semibold text-slate-900">
                  {needCar === "yes" ? displayAmount(results.carCost, 0) : displayAmount(0, 0)}
                </span>
              </div>
              <div>
                Healthcare:{" "}
                <span className="font-semibold text-slate-900">{displayAmount(results.healthcareAdj, 0)}</span>
              </div>
            </div>

     <div className="mt-2 text-xs text-slate-500">
        Estimated costs adjust automatically based on the selected city.
      </div>
  </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-3 text-sm font-semibold">One-Time Moving Costs</div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className={labelHeadCls}>Visa / permit estimate</div>
                <input
                  className={inputCls}
                  type="number"
                  value={visaCost}
                  onChange={(e) => setVisaCost(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>One-way flight estimate</div>
                <input
                  className={inputCls}
                  type="number"
                  value={flightCost}
                  onChange={(e) => setFlightCost(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Shipping / baggage estimate</div>
                <input
                  className={inputCls}
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Temporary housing estimate</div>
                <input
                  className={inputCls}
                  type="number"
                  value={temporaryStay}
                  onChange={(e) => setTemporaryStay(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Setup / admin estimate</div>
                <input
                  className={inputCls}
                  type="number"
                  value={adminFees}
                  onChange={(e) => setAdminFees(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm">
                <div className={labelHeadCls}>Furniture / setup estimate</div>
                <input
                  className={inputCls}
                  type="number"
                  value={furnitureSetup}
                  onChange={(e) => setFurnitureSetup(e.target.value)}
                  placeholder=" "
                />
              </label>

              <label className="text-sm sm:col-span-2">
                <div className={labelHeadCls}>Recommended cash buffer</div>
                <input
                  className={inputCls}
                  type="number"
                  value={emergencyCashBuffer}
                  onChange={(e) => setEmergencyCashBuffer(e.target.value)}
                  placeholder=" "
                />
              </label>
            </div>
      <div className="mt-4 w-full text-xs text-slate-500">
  Planning estimates only.
</div>
          </div>
        </div>

   {isUSDomesticRoute ? (
  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
      Domestic U.S. move detected
    </div>

    <div className="mt-2 text-lg font-semibold text-slate-900">
      Use your U.S. relocation calculator for state-to-state comparisons.
    </div>

    <p className="mt-2 text-sm leading-6 text-slate-700">
      This calculator is designed for international moves. For{" "}
      <span className="font-medium">United States → United States</span>,
      your domestic calculator will give a more trustworthy result for taxes,
      housing, and state-level cost differences.
    </p>

    <a
      href="https://www.relocationbynumbers.com/"
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
    >
      Go to Relocation by Numbers
    </a>
  </div>
) : null}

        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="mb-2 text-sm font-semibold">Results</div>
            <div className="mb-3 text-xs text-slate-500">
    Assumptions updated: March 2026 · Planning estimates only
  </div>

            <div className="mb-2 space-y-1 text-sm text-slate-600">
              <div>
                Current city: <span className="font-semibold">{fromCityLabel}</span>
              </div>
              <div>
                Target city: <span className="font-semibold">{toCityLabel}</span>
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <div>
                Net monthly (current):{" "}
                <span className="font-semibold">{displayAmount(results.netMonthlyFrom)}</span>
              </div>
              <div>
                Net monthly (target):{" "}
                <span className="font-semibold">{displayAmount(results.netMonthlyTo)}</span>
              </div>

             {results.salaryReady && (
  <>
    <div className="mt-2">
      Gross monthly:{" "}
      <span className="font-semibold">{displayAmount(results.grossMonthly, 2)}</span>
    </div>
    <div>
      Est. taxes (current):{" "}
      <span className="font-semibold">
        {displayAmount(results.grossMonthly * results.currentTaxRate, 2)}
      </span>{" "}
      <span className="text-xs text-slate-500">
        ({(results.currentTaxRate * 100).toFixed(1)}%)
      </span>
    </div>
    <div>
      Est. taxes (target):{" "}
      <span className="font-semibold">
        {displayAmount(results.grossMonthly * results.targetTaxRate, 2)}
      </span>{" "}
      <span className="text-xs text-slate-500">
        ({(results.targetTaxRate * 100).toFixed(1)}%)
      </span>
    </div>

    <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 shadow-sm">
  <div className="flex items-center gap-2 text-xs">
    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 font-semibold tracking-wide text-sky-700 ring-1 ring-sky-200">
      Tax model status
    </span>
    <InfoTip text="This describes how complete or simplified the tax estimate is for the selected destination. Some countries are modeled more precisely than others." />
  </div>

  <div className="mt-2 text-sm font-semibold text-slate-900">
    {results.targetTaxLabel}
  </div>

  <div className="mt-1 text-sm leading-6 text-slate-700">
    {results.targetTaxNote}
  </div>
</div>
  </>
)}

              <div className="mt-2 font-semibold">Monthly housing</div>
              <div className="grid gap-1 text-sm">
                <div>
                  Rent: <span className="font-semibold">{displayAmount(results.rentTo, 2)}</span>
                </div>
                {results.housingUtilities > 0 && (
                  <div>
                    Utilities gap:{" "}
                    <span className="font-semibold">{displayAmount(results.housingUtilities, 2)}</span>
                  </div>
                )}
                {results.carCost > 0 && (
                  <div>
                    Car: <span className="font-semibold">{displayAmount(results.carCost, 2)}</span>
                  </div>
                )}
                <div className="pt-1">
                  Total housing: <span className="font-bold">{displayAmount(results.housingTotal, 2)}</span>
                </div>
              </div>

              <div className="mt-2 font-semibold">Monthly living costs</div>
              <div>
                Total: <span className="font-bold">{displayAmount(results.livingCosts, 2)}</span>
              </div>

              <div className="mt-2">
                Upfront cash needed:{" "}
                <span className="font-semibold">{displayAmount(results.upfrontCashNeeded)}</span>
              </div>
              <div>
                Months covered by savings:{" "}
                <span className="font-semibold">
                  {Number.isFinite(results.monthsCovered)
                    ? results.monthsCovered.toFixed(1)
                    : "—"}
                </span>
              </div>

              <div className="mt-2">
                Housing % of net (target):{" "}
                <span className="font-semibold">
                  {Number.isFinite(results.pct) ? `${results.pct.toFixed(1)}%` : "—"}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 space-y-1">
              <div>Results are estimates only. No information entered is stored or shared.</div>
              <div>
                Tax estimates, rent, immigration costs, and retirement treatment vary by
                destination and personal circumstances.
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Tip: Your URL updates as you type — copy the page link to share this scenario.
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                  Monthly Flexibility
                </div>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                  {results.salaryReady ? displayAmount(results.monthlyFlexibility, 2) : "—"}
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                {mode === "retired" ? "After housing and essentials" : "After housing"}
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-amber-100">
              <div
                className={`h-full rounded-full ${
                  !results.salaryReady
                    ? "w-[0%] bg-slate-300"
                    : results.monthlyFlexibility >= 3000
                    ? "w-[92%] bg-emerald-500"
                    : results.monthlyFlexibility >= 2000
                    ? "w-[76%] bg-emerald-400"
                    : results.monthlyFlexibility >= 1000
                    ? "w-[58%] bg-amber-400"
                    : results.monthlyFlexibility >= 500
                    ? "w-[40%] bg-orange-400"
                    : "w-[24%] bg-rose-400"
                }`}
              />
            </div>

            <div className="mt-3 text-sm text-slate-700">
              {!results.salaryReady
                ? "Add salary and housing inputs to estimate how much room you have left each month."
                : `This is what you may have left each month in ${toCityLabel} after housing costs and core living expenses.`}
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Higher flexibility gives you more room for saving, investing, travel, and unexpected expenses.
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              COMPARABLE SALARY
            </div>
            <div className="mt-2 text-3xl font-bold">{displayAmount(results.comparableSalary)}</div>
            <p className="mt-2 text-sm text-slate-600">
              {toCityLabel} is roughly{" "}
              <span className="font-semibold">
                {Math.abs(Math.round(results.relativeDifference * 100))}%
              </span>{" "}
              {results.relativeDifference >= 0 ? "more" : "less"} expensive than {fromCityLabel}.
            </p>
            <div className="mt-1 text-xs text-slate-500">
              Based on housing, transportation, healthcare, and essential cost weighting.
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  {mode === "retired" ? "Retirement Readiness Score" : "Comfort Score™"}
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {results.comfort.band} · {results.comfort.label}
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Target housing
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-emerald-100">
              <div
                className={`h-full rounded-full ${
                  results.comfort.band === "A"
                    ? "w-[92%] bg-emerald-500"
                    : results.comfort.band === "B"
                    ? "w-[78%] bg-emerald-400"
                    : results.comfort.band === "C"
                    ? "w-[60%] bg-amber-400"
                    : "w-[42%] bg-orange-400"
                }`}
              />
            </div>

            <div className="mt-3 text-sm text-slate-700">{results.comfort.note}</div>
            <div className="mt-2 text-xs text-slate-500">
              Based on how much of your target net monthly income goes toward housing.
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                  Share this scenario
                </div>
                <div className="mt-1 text-sm text-slate-700">
                  Copy your current comparison link and send it to a partner, friend, or future self.
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const shareUrl = new URL(window.location.href);
                    const shareText = `My international relocation scenario: ${fromCityLabel} → ${toCityLabel}. Monthly flexibility ${displayAmount(results.monthlyFlexibility, 0)} after housing.`;
                    const canNativeShare =
                      typeof navigator !== "undefined" && "share" in navigator;

                    if (canNativeShare) {
                      await (navigator as Navigator & {
                        share: (data: {
                          title?: string;
                          text?: string;
                          url?: string;
                        }) => Promise<void>;
                      }).share({
                        title: "My International Relocation Scenario",
                        text: shareText,
                        url: shareUrl.toString(),
                      });
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
                {shareStatus === "copied"
                  ? "Link copied!"
                  : shareStatus === "shared"
                  ? "Shared!"
                  : shareStatus === "error"
                  ? "Share failed"
                  : "Share scenario"}
              </button>
            </div>
          </div>

          <AdSlot />
        </div>
      </div>
    </div>
  );
}