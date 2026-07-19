/**
 * Pure calculation engine for the US side of the compare-cities tool.
 *
 * This intentionally mirrors the math in components/Calculator.tsx's
 * `results` useMemo (net income, housing cost, monthly flexibility) but as
 * a plain function that can be called once per target city, since the
 * compare tool needs N results at once rather than one component instance
 * per destination. It calls the exact same underlying lib functions
 * (estimateNetAnnual, monthlyHousingCost) so the numbers stay consistent
 * with the main calculator — only the housing defaults (rent/home price)
 * differ, since Calculator.tsx requires manual entry per city while this
 * tool auto-fills from each city's defaultRent / medianHomePrice so 2-3
 * targets can be compared without re-typing housing assumptions each time.
 */
import { estimateNetAnnual, type FilingStatus } from "../tax";
import { monthlyHousingCost } from "../housing";
import type { City } from "../cities";
import type { StateCode } from "../states";

export type UsCompareMode = "rent" | "buy";

export type UsCompareBuyAssumptions = {
  downPct: number;
  ratePct: number;
  termYears: number;
  propertyTaxPct: number;
  homeInsMonthly: number;
  hoaMonthly: number;
  pmiAnnualPct: number;
};

export type UsCompareRentAssumptions = {
  rentersInsMonthly: number;
  parkingMonthly: number;
};

export type UsCompareInput = {
  city: City;
  grossAnnual: number;
  filing: FilingStatus;
  k401Pct: number;
  mode: UsCompareMode;
  buy: UsCompareBuyAssumptions;
  rent: UsCompareRentAssumptions;
};

export type UsCompareResult = {
  cityId: string;
  cityName: string;
  state: StateCode;
  netMonthly: number;
  effTaxPct: number;
  housingMonthly: number;
  housingLabel: string;
  monthlyFlexibility: number;
  pctOfIncome: number;
};

function estimatePMIMonthly(loanAmount: number, downPct: number, pmiAnnualPct: number): number {
  if (!Number.isFinite(loanAmount) || loanAmount <= 0) return 0;
  if (!Number.isFinite(downPct) || downPct >= 20) return 0;
  const rate = Math.max(0, Math.min(2.0, Number.isFinite(pmiAnnualPct) ? pmiAnnualPct : 0)) / 100;
  return (loanAmount * rate) / 12;
}

export function computeUsCityResult(input: UsCompareInput): UsCompareResult {
  const { city, grossAnnual, filing, k401Pct, mode } = input;
  const salaryReady = Number.isFinite(grossAnnual) && grossAnnual > 0;

  const netAnnual = salaryReady
    ? estimateNetAnnual({ grossAnnual, state: city.state, filing, k401Pct, cityId: city.id })
    : 0;
  const netMonthly = netAnnual / 12;
  const effTaxPct = salaryReady
    ? Math.max(0, Math.min(99.9, (1 - netAnnual / grossAnnual) * 100))
    : 0;

  let housingMonthly = 0;
  let housingLabel = "";

  if (mode === "buy") {
    const homePrice = city.medianHomePrice ?? 400_000;
    const buy = monthlyHousingCost({
      homePrice,
      downPct: input.buy.downPct,
      ratePct: input.buy.ratePct,
      termYears: input.buy.termYears,
      propertyTaxPct: input.buy.propertyTaxPct,
      homeInsMonthly: input.buy.homeInsMonthly,
      hoaMonthly: input.buy.hoaMonthly,
    });
    const pmi = estimatePMIMonthly(buy.loanAmount, input.buy.downPct, input.buy.pmiAnnualPct);
    housingMonthly = buy.totalMonthly + pmi;
    housingLabel = `Est. home price ${homePrice.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}`;
  } else {
    const rent = city.defaultRent ?? 1_800;
    housingMonthly = rent + input.rent.rentersInsMonthly + input.rent.parkingMonthly;
    housingLabel = `Est. rent ${rent.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}/mo`;
  }

  const monthlyFlexibility = netMonthly - housingMonthly;
  const pctOfIncome = netMonthly > 0 ? (housingMonthly / netMonthly) * 100 : 0;

  return {
    cityId: city.id,
    cityName: city.name,
    state: city.state,
    netMonthly,
    effTaxPct,
    housingMonthly,
    housingLabel,
    monthlyFlexibility,
    pctOfIncome,
  };
}
