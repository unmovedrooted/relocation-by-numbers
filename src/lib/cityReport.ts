import { findCity } from "./cities";
import { governmentCity, NATIONAL_CENSUS } from "./governmentData";
import { estimateNetBreakdown, type TaxBreakdown } from "./wageTax";
import { BUY_ASSUMPTIONS, monthlyOwnCost, priceLevel, REPORT_SALARIES } from "./pairReport";
import { PAIR_EXAMPLE_SALARY } from "./pairExample";
import { stateTotals, topDestinations, topOrigins } from "./migration";
import electricity from "../data/eiaElectricity.json";

/** Numbers for a single-city report: 2026 taxes at several salaries, local prices against the U.S., housing costs, and state migration. */

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export type CityReport = {
  id: string;
  name: string;
  stateCode: string;
  salary: number;
  taxAtHeadline: TaxBreakdown;
  salaryRows: { salary: number; tax: TaxBreakdown; monthlyNet: number; afterRent: number | null }[];
  cost: {
    priceLevel: number | null;
    housing: number | null;
    utilities: number | null;
    goods: number | null;
    rent: number | null;
    homeValue: number | null;
    propertyTaxPaid: number | null;
    propertyTaxRatePct: number | null;
    electricityCents: number | null;
  };
  national: { priceLevel: number; rent: number | null; homeValue: number | null; propertyTaxPaid: number | null; propertyTaxRatePct: number | null; electricityCents: number };
  housing: { incomeToRent: number | null; monthlyOwnCost: number | null; incomeToBuy: number | null };
  migration: { inflow: number; outflow: number; net: number; origins: { state: string; households: number }[]; destinations: { state: string; households: number }[] };
};

export function buildCityReport(cityId: string, filing: "single" | "married" = "single"): CityReport | null {
  const city = findCity(cityId);
  if (!city) return null;
  const netFor = (gross: number) => estimateNetBreakdown({ grossAnnual: gross, state: city.state, filing, k401Pct: 0, cityId: city.id });
  const rent = city.defaultRent ?? null;
  const gov = governmentCity(cityId);
  const rpp = gov?.rpp;
  const own = monthlyOwnCost(cityId);
  const stateElectric = (electricity.residentialCentsPerKwh as Record<string, number>)[city.state] ?? null;

  return {
    id: city.id,
    name: city.name,
    stateCode: city.state,
    salary: PAIR_EXAMPLE_SALARY,
    taxAtHeadline: netFor(PAIR_EXAMPLE_SALARY),
    salaryRows: REPORT_SALARIES.map((salary) => {
      const tax = netFor(salary);
      const monthlyNet = tax.net / 12;
      return { salary, tax, monthlyNet, afterRent: rent === null ? null : monthlyNet - rent };
    }),
    cost: {
      priceLevel: priceLevel(cityId),
      housing: rpp?.housing ?? null,
      utilities: rpp?.utilities ?? null,
      goods: rpp?.goods ?? null,
      rent,
      homeValue: city.medianHomePrice ?? null,
      propertyTaxPaid: gov?.census?.medianRealEstateTaxesPaid ?? null,
      propertyTaxRatePct: city.propertyTaxPct ?? null,
      electricityCents: stateElectric,
    },
    national: {
      priceLevel: 100,
      rent: NATIONAL_CENSUS.rentUsed,
      homeValue: NATIONAL_CENSUS.homeValueUsed,
      propertyTaxPaid: NATIONAL_CENSUS.medianRealEstateTaxesPaid,
      propertyTaxRatePct: NATIONAL_CENSUS.propertyTaxRatePct,
      electricityCents: electricity.usResidentialCentsPerKwh,
    },
    housing: {
      incomeToRent: rent === null ? null : roundTo((rent * 12) / BUY_ASSUMPTIONS.rentShareOfIncome, 10),
      monthlyOwnCost: own,
      incomeToBuy: own === null ? null : roundTo((own * 12) / BUY_ASSUMPTIONS.buyShareOfIncome, 10),
    },
    migration: {
      ...stateTotals(city.state),
      origins: topOrigins(city.state, 8),
      destinations: topDestinations(city.state, 8),
    },
  };
}
