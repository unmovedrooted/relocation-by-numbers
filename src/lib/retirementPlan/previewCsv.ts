import type { CsvRow } from "../csvExport";
import { PLANNER_NOTICE } from "./plannerNotice";
import type { calculatePreview } from "./preview";

/** Whole cents, with no -0 and none of the float noise (e.g. 0.30000000000000004) the engine's sums carry. */
export const csvCents = (value: number) => Math.round(value * 100) / 100 || 0;

/**
 * One CSV row per projection year, built from the same `result.years` fields the on-screen table renders,
 * so each exported amount equals the displayed whole-dollar amount to within rounding. "State tax" and
 * "Local tax" are the components of "Tax estimate" (local includes Oregon's SHS/PFA taxes); "Local tax" is
 * blank where the planner has no local-tax estimate for the selected location.
 */
export function projectionCsvRows(result: ReturnType<typeof calculatePreview>, state: string, location: string): CsvRow[] {
  return result.years.map(row => ({
    Year: row.year,
    State: state.toUpperCase(),
    Location: location,
    "Age(s)": row.people.map(person => person.ageAtYearEnd).join(" / "),
    Income: csvCents(row.result.cash.income),
    Spending: csvCents(row.spending),
    "Tax estimate": csvCents(row.result.tax.total),
    "State tax": csvCents(row.result.tax.stateTax),
    "Local tax": row.result.tax.localTax === null ? "" : csvCents(row.result.tax.localTax),
    RMDs: csvCents(row.result.cash.requiredWithdrawals),
    "Other withdrawals": csvCents(row.result.cash.voluntaryWithdrawals),
    Shortfall: csvCents(row.result.cash.shortfall),
    "Ending assets": csvCents(row.endingPortfolio),
  }));
}

/** The exported file ends with a text row carrying the planning-estimate notice, so it travels with the numbers. */
export function withPlannerNotice(rows: CsvRow[]): CsvRow[] {
  return rows.length === 0 ? rows : [...rows, { Year: "Notice", State: PLANNER_NOTICE }];
}
