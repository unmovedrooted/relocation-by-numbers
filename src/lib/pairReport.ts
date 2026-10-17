import { findCity } from "./cities";
import { governmentCity } from "./governmentData";
import { estimateNetBreakdown, type TaxBreakdown } from "./wageTax";
import { grossForNet } from "./grossForNet";
import { estimateMortgageMonthly } from "./mortgage";
import { PAIR_EXAMPLE_SALARY } from "./pairExample";
import electricity from "../data/eiaElectricity.json";

/**
 * Data behind the city-pair report: the same single filer in two cities, using the site's 2026 tax engine, Census rent, home value and
 * property tax, and BEA regional price parities. Everything here is computed; nothing is typed in per page.
 */

export const REPORT_SALARY = PAIR_EXAMPLE_SALARY;
export const ELECTRICITY_META = electricity.meta;
export const REPORT_SALARIES = [50_000, 75_000, 100_000, 150_000, 250_000] as const;

/** Assumptions for the rent-or-buy section, the same defaults the main calculator starts from. */
export const BUY_ASSUMPTIONS = { downPct: 0.2, ratePct: 6.5, years: 30, homeInsuranceMonthly: 150, rentShareOfIncome: 0.3, buyShareOfIncome: 0.28 } as const;

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** BEA regional price parity for all items (U.S. = 100) at the city's metro area, or its state when no metro figure exists. */
export function priceLevel(cityId: string): number | null {
  const v = governmentCity(cityId)?.rpp?.allItems;
  return typeof v === "number" && v > 0 ? v : null;
}

function netFor(cityId: string, gross: number): TaxBreakdown | null {
  const city = findCity(cityId);
  if (!city) return null;
  return estimateNetBreakdown({ grossAnnual: gross, state: city.state, filing: "single", k401Pct: 0, cityId: city.id });
}

/**
 * The destination salary with the same buying power as `gross` in the origin: after-tax pay divided by the local price level is equal
 * in both places. Rounded to the nearest $100.
 */
export function equalSalary(fromId: string, toId: string, gross: number): number | null {
  const fromNet = netFor(fromId, gross);
  const pFrom = priceLevel(fromId);
  const pTo = priceLevel(toId);
  const toCity = findCity(toId);
  if (!fromNet || !pFrom || !pTo || !toCity) return null;
  const wantedNet = fromNet.net * (pTo / pFrom);
  const solved = grossForNet(wantedNet, (g) => {
    const b = netFor(toId, g);
    return b && g > 0 ? 1 - b.net / g : 0;
  });
  return solved > 0 ? roundTo(solved, 100) : null;
}

export type SalaryRow = { salary: number; fromNet: number; toNet: number; change: number; equal: number | null };

export type CostRow = { label: string; from: string; to: string };

export type PairReport = {
  fromName: string;
  toName: string;
  fromState: string;
  toState: string;
  headline: { salary: number; equalSalary: number | null; takeHomeChange: number; purchasingPowerPct: number | null; priceDifferencePct: number | null };
  taxAtHeadline: { from: TaxBreakdown; to: TaxBreakdown };
  salaryRows: SalaryRow[];
  cost: {
    priceLevel: [number | null, number | null];
    housing: [number | null, number | null];
    utilities: [number | null, number | null];
    goods: [number | null, number | null];
    rent: [number | null, number | null];
    homeValue: [number | null, number | null];
    propertyTaxPaid: [number | null, number | null];
    propertyTaxRatePct: [number | null, number | null];
    /** Residential electricity price in cents per kWh (EIA, year to date), by state. */
    electricityCents: [number | null, number | null];
  };
  buy: {
    incomeToRent: [number | null, number | null];
    monthlyOwnCost: [number | null, number | null];
    incomeToBuy: [number | null, number | null];
  };
  budget: {
    rentYear: [number | null, number | null];
    ownYear: [number | null, number | null];
    rentTotal: [number | null, number | null];
    ownTotal: [number | null, number | null];
  };
};

const pair = <T>(f: (id: string) => T, a: string, b: string): [T, T] => [f(a), f(b)];

function rpp(cityId: string, key: "housing" | "utilities" | "goods"): number | null {
  const v = governmentCity(cityId)?.rpp?.[key];
  return typeof v === "number" ? v : null;
}

export function monthlyOwnCost(cityId: string): number | null {
  const city = findCity(cityId);
  const price = city?.medianHomePrice;
  if (!city || !price) return null;
  const taxPct = city.propertyTaxPct ?? 0;
  const pi = estimateMortgageMonthly(price, { downPct: BUY_ASSUMPTIONS.downPct, rate: BUY_ASSUMPTIONS.ratePct / 100, years: BUY_ASSUMPTIONS.years });
  if (pi === null) return null;
  return pi + (price * taxPct) / 100 / 12 + BUY_ASSUMPTIONS.homeInsuranceMonthly;
}

export function buildPairReport(fromId: string, toId: string): PairReport | null {
  const from = findCity(fromId);
  const to = findCity(toId);
  if (!from || !to) return null;
  const fromTax = netFor(fromId, REPORT_SALARY);
  const toTax = netFor(toId, REPORT_SALARY);
  if (!fromTax || !toTax) return null;

  const pFrom = priceLevel(fromId);
  const pTo = priceLevel(toId);
  const takeHomeChange = toTax.net - fromTax.net;
  const purchasingPowerPct = pFrom && pTo ? ((toTax.net / pTo) / (fromTax.net / pFrom) - 1) * 100 : null;
  const priceDifferencePct = pFrom && pTo ? (1 - pTo / pFrom) * 100 : null;

  const salaryRows: SalaryRow[] = REPORT_SALARIES.map((salary) => {
    const a = netFor(fromId, salary)!;
    const b = netFor(toId, salary)!;
    return { salary, fromNet: a.net, toNet: b.net, change: b.net - a.net, equal: equalSalary(fromId, toId, salary) };
  });

  const rent = pair((id) => findCity(id)?.defaultRent ?? null, fromId, toId);
  const own = pair(monthlyOwnCost, fromId, toId);
  const incomeToRent = rent.map((r) => (r === null ? null : roundTo((r * 12) / BUY_ASSUMPTIONS.rentShareOfIncome, 10))) as [number | null, number | null];
  const incomeToBuy = own.map((o) => (o === null ? null : roundTo((o * 12) / BUY_ASSUMPTIONS.buyShareOfIncome, 10))) as [number | null, number | null];
  const taxes: [number, number] = [fromTax.totalTax, toTax.totalTax];
  const rentYear = rent.map((r) => (r === null ? null : r * 12)) as [number | null, number | null];
  const ownYear = own.map((o) => (o === null ? null : o * 12)) as [number | null, number | null];

  return {
    fromName: from.name,
    toName: to.name,
    fromState: from.state.toUpperCase(),
    toState: to.state.toUpperCase(),
    headline: { salary: REPORT_SALARY, equalSalary: equalSalary(fromId, toId, REPORT_SALARY), takeHomeChange, purchasingPowerPct, priceDifferencePct },
    taxAtHeadline: { from: fromTax, to: toTax },
    salaryRows,
    cost: {
      priceLevel: [pFrom, pTo],
      housing: pair((id) => rpp(id, "housing"), fromId, toId),
      utilities: pair((id) => rpp(id, "utilities"), fromId, toId),
      goods: pair((id) => rpp(id, "goods"), fromId, toId),
      rent,
      homeValue: pair((id) => findCity(id)?.medianHomePrice ?? null, fromId, toId),
      propertyTaxPaid: pair((id) => governmentCity(id)?.census?.medianRealEstateTaxesPaid ?? null, fromId, toId),
      propertyTaxRatePct: pair((id) => findCity(id)?.propertyTaxPct ?? null, fromId, toId),
      electricityCents: pair((id) => { const st = findCity(id)?.state; return st ? ((electricity.residentialCentsPerKwh as Record<string, number>)[st] ?? null) : null; }, fromId, toId),
    },
    buy: { incomeToRent, monthlyOwnCost: own, incomeToBuy },
    budget: {
      rentYear,
      ownYear,
      rentTotal: [rentYear[0] === null ? null : taxes[0] + rentYear[0], rentYear[1] === null ? null : taxes[1] + rentYear[1]],
      ownTotal: [ownYear[0] === null ? null : taxes[0] + ownYear[0], ownYear[1] === null ? null : taxes[1] + ownYear[1]],
    },
  };
}
