import { findCity } from "./cities";
import { estimateNetBreakdown, type TaxBreakdown } from "./wageTax";

/**
 * Worked example for a city-pair page: one single filer on the same salary in both cities, using the same tax engine as the
 * calculators and the Census Bureau rent and home-value figures stored on each city. Everything here is computed, not typed.
 */

/** One salary for every city-pair and origin page, so the worked example, tables and report all agree. */
export const PAIR_EXAMPLE_SALARY = 100_000;

export type PairCityExample = {
  id: string;
  name: string;
  state: string;
  tax: TaxBreakdown;
  monthlyNet: number;
  rent: number | null;
  afterRent: number | null;
  homePrice: number | null;
  propertyTaxPct: number | null;
  housingPriceLevel: number | null;
  payrollPrograms: string[];
};

export type PairExample = {
  salary: number;
  from: PairCityExample;
  to: PairCityExample;
  monthlyNetChange: number;
  rentChange: number | null;
  afterRentChange: number | null;
  /** Prefilled link into the calculator for this route. */
  calculatorHref: string;
};

function cityExample(id: string, salary: number): PairCityExample | null {
  const city = findCity(id);
  if (!city) return null;
  const tax = estimateNetBreakdown({ grossAnnual: salary, state: city.state, filing: "single", k401Pct: 0, cityId: city.id });
  const monthlyNet = tax.net / 12;
  const rent = city.defaultRent ?? null;
  return {
    id: city.id,
    name: city.name,
    state: city.state.toUpperCase(),
    tax,
    monthlyNet,
    rent,
    afterRent: rent === null ? null : monthlyNet - rent,
    homePrice: city.medianHomePrice ?? null,
    propertyTaxPct: city.propertyTaxPct ?? null,
    housingPriceLevel: city.col?.housing ?? null,
    payrollPrograms: tax.statePayrollLines.map((l) => l.name),
  };
}

export function buildPairExample(fromId: string, toId: string, salary: number = PAIR_EXAMPLE_SALARY): PairExample | null {
  const from = cityExample(fromId, salary);
  const to = cityExample(toId, salary);
  if (!from || !to) return null;
  const fromCity = findCity(fromId)!;
  const toCity = findCity(toId)!;
  const qs = new URLSearchParams({
    from: fromCity.state, to: toCity.state, filing: "single", mode: "rent", salary: String(salary), fromCity: fromCity.id, toCity: toCity.id,
  });
  return {
    salary,
    from,
    to,
    monthlyNetChange: to.monthlyNet - from.monthlyNet,
    rentChange: from.rent !== null && to.rent !== null ? to.rent - from.rent : null,
    afterRentChange: from.afterRent !== null && to.afterRent !== null ? to.afterRent - from.afterRent : null,
    calculatorHref: `/?${qs.toString()}`,
  };
}
