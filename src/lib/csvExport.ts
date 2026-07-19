// src/lib/csvExport.ts
// Dependency-free CSV export helper. Builds a CSV string from an array of
// flat row objects and triggers a browser download via a Blob + temporary
// anchor tag. No npm package required.

export type CsvRow = Record<string, string | number | null | undefined>;

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Quote any cell containing a comma, quote, or newline; escape inner quotes.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(",")),
  ];
  // Leading BOM so Excel opens UTF-8 CSVs (currency symbols, etc.) correctly.
  return "﻿" + lines.join("\r\n");
}

export function downloadCsv(filename: string, rows: CsvRow[]): void {
  if (typeof window === "undefined" || rows.length === 0) return;

  const csv = rowsToCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release the object URL on the next tick so the download has time to start.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
