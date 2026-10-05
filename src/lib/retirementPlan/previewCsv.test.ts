import { describe, expect, it } from "vitest";
import { rowsToCsv } from "../csvExport";
import { calculatePreview, PREVIEW_DEFAULTS } from "./preview";
import { csvCents, projectionCsvRows, withPlannerNotice } from "./previewCsv";
import { PLANNER_NOTICE } from "./plannerNotice";

// The on-screen table formats every amount with exactly this formatter (RetirementPlanPreview.tsx `money`).
const displayed = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const shownDollars = (value: number) => Number(displayed(value).replace(/[^0-9.-]/g, ""));
const AMOUNTS = ["Income", "Spending", "Tax estimate", "RMDs", "Other withdrawals", "Shortfall", "Ending assets"] as const;

/** Minimal RFC 4180 reader for the exporter's own output (BOM, CRLF, quoted cells). */
function parseCsv(text: string) {
  const body = text.replace(/^﻿/, "");
  const records: string[][] = [];
  let cell = "", record: string[] = [], quoted = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"' && body[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { record.push(cell); cell = ""; }
    else if (ch === "\r" && body[i + 1] === "\n") { record.push(cell); records.push(record); cell = ""; record = []; i++; }
    else cell += ch;
  }
  if (cell || record.length) { record.push(cell); records.push(record); }
  return records;
}

const oregon = { ...PREVIEW_DEFAULTS, state: "or", orContract: "confirmed", orMetro: "resident", orMultnomah: "resident",
  orLocalAdjustments: "none-confirmed", "one-pensionType": "private", endYear: "2026", "one-salary": "300000" };

describe("projection CSV export", () => {
  it("emits one row per projected year with stable columns", () => {
    const result = calculatePreview({ ...PREVIEW_DEFAULTS, household: "married" });
    const rows = projectionCsvRows(result, "fl", "");
    expect(rows).toHaveLength(result.years.length);
    expect(Object.keys(rows[0])).toEqual(["Year", "State", "Location", "Age(s)", "Income", "Spending", "Tax estimate",
      "State tax", "Local tax", "RMDs", "Other withdrawals", "Shortfall", "Ending assets"]);
    expect(rows.map(row => row.Year)).toEqual(result.years.map(row => row.year));
    expect(rows[0]).toMatchObject({ State: "FL", Location: "", "Age(s)": result.years[0].people.map(p => p.ageAtYearEnd).join(" / ") });
    expect(String(rows[0]["Age(s)"])).toContain(" / ");
  });

  it.each<[string, Record<string, string>]>([
    ["the default funded plan", { ...PREVIEW_DEFAULTS }],
    ["a married plan", { ...PREVIEW_DEFAULTS, household: "married" }],
    ["a plan with shortfalls", { ...PREVIEW_DEFAULTS, spending: "150000.37" }],
  ])("reconciles every exported amount with the displayed projection for %s", (_label, values) => {
    const result = calculatePreview(values);
    const rows = projectionCsvRows(result, "fl", "");
    const table = (row: (typeof result.years)[number]) => [row.result.cash.income, row.spending, row.result.tax.total,
      row.result.cash.requiredWithdrawals, row.result.cash.voluntaryWithdrawals, row.result.cash.shortfall, row.endingPortfolio];
    result.years.forEach((year, index) => {
      table(year).forEach((raw, column) => {
        const exported = Number(rows[index][AMOUNTS[column]]);
        expect(Math.abs(exported - raw)).toBeLessThanOrEqual(0.005 + 1e-9);
        // The screen shows whole dollars: the cents value may sit a half-dollar-plus-half-cent from it, never further.
        expect(Math.abs(exported - shownDollars(raw))).toBeLessThanOrEqual(0.505 + 1e-9);
      });
    });
    expect(rows.reduce((sum, row) => sum + Number(row["Tax estimate"]), 0))
      .toBeCloseTo(result.years.reduce((sum, row) => sum + row.result.tax.total, 0), 0);
    if (values.spending === "150000.37") expect(rows.some(row => Number(row.Shortfall) > 0)).toBe(true);
  });

  it("ends the exported file with the planning-estimate notice, leaving the year rows untouched", () => {
    const rows = projectionCsvRows(calculatePreview({ ...PREVIEW_DEFAULTS }), "fl", "");
    const withNotice = withPlannerNotice(rows);
    expect(withNotice).toHaveLength(rows.length + 1);
    expect(withNotice.slice(0, rows.length)).toEqual(rows);
    expect(withNotice[withNotice.length - 1]).toEqual({ Year: "Notice", State: PLANNER_NOTICE });
    expect(PLANNER_NOTICE).toMatch(/CPA or enrolled agent/);
    const parsed = parseCsv(rowsToCsv(withNotice));
    expect(parsed[parsed.length - 1][0]).toBe("Notice");
    expect(parsed[parsed.length - 1][1]).toBe(PLANNER_NOTICE);
    expect(withPlannerNotice([])).toEqual([]);
  });

  it("exports whole cents with no float noise or negative zero", () => {
    const result = calculatePreview({ ...PREVIEW_DEFAULTS, spending: "50000.123400", returns: "5.37" });
    for (const row of projectionCsvRows(result, "fl", "")) {
      for (const column of [...AMOUNTS, "State tax", "Local tax"]) {
        const value = row[column] as number;
        expect(Object.is(value, -0)).toBe(false);
        expect(Math.abs(value * 100 - Math.round(value * 100))).toBeLessThan(1e-6);
        expect(String(value)).not.toMatch(/\.\d{3,}/);
      }
    }
    expect(csvCents(0.1 + 0.2)).toBe(0.3);
    expect(csvCents(-0.0001)).toBe(0);
  });

  it("carries Oregon SHS and PFA into the Local tax column without altering State tax", () => {
    const inside = calculatePreview(oregon).years[0];
    const outside = calculatePreview({ ...oregon, orMetro: "outside-no-source", orMultnomah: "outside-no-source" }).years[0];
    const [row] = projectionCsvRows(calculatePreview(oregon), "or", "");
    expect(row["Local tax"]).toBe(4978.6);
    expect(row["State tax"]).toBe(csvCents(outside.result.tax.stateTax));
    expect(row["State tax"]).toBe(csvCents(inside.result.tax.stateTax));
    expect(projectionCsvRows(calculatePreview({ ...oregon, orMetro: "outside-no-source", orMultnomah: "outside-no-source" }), "or", "")[0]["Local tax"]).toBe(0);
    // State and local tax are components of the displayed tax estimate, never in addition to it.
    expect(Number(row["State tax"]) + Number(row["Local tax"])).toBeLessThanOrEqual(Number(row["Tax estimate"]));
    expect(Number(row["Tax estimate"]) - outside.result.tax.total).toBeCloseTo(4978.6, 5);
  });

  it("survives the CSV encoder: BOM, header order, quoted cells and every value round-trip", () => {
    const rows = projectionCsvRows(calculatePreview({ ...PREVIEW_DEFAULTS, household: "married" }), "ny", 'Outside "NYC", Yonkers');
    const text = rowsToCsv(rows);
    expect(text.startsWith("﻿")).toBe(true);
    const parsed = parseCsv(text);
    expect(parsed[0]).toEqual(Object.keys(rows[0]));
    expect(parsed).toHaveLength(rows.length + 1);
    parsed.slice(1).forEach((record, index) => {
      expect(record).toHaveLength(parsed[0].length);
      parsed[0].forEach((column, position) => expect(record[position]).toBe(String(rows[index][column] ?? "")));
    });
    expect(parsed[1][2]).toBe('Outside "NYC", Yonkers');
  });
});
