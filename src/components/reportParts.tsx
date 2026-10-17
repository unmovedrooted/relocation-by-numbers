/** Formatters and styles shared by the city-pair report and the origin-city report. */
export const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
export const signed = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
export const orNA = (n: number | null, f: (v: number) => string = usd) => (n === null ? "n/a" : f(n));
export const level = (n: number | null) => (n === null ? "n/a" : n.toFixed(1));
export const diff = (a: number | null, b: number | null, f: (v: number) => string = signed) => (a === null || b === null ? "n/a" : f(b - a));
export const pctOf = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "0.0%");
export const num = (n: number) => n.toLocaleString("en-US");

export const card = "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]";
export const h2 = "text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100";
export const th = "pb-2 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
export const note = "mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400";
export const strong = "text-slate-900 dark:text-slate-100";

export function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{sub}</div>
    </div>
  );
}

/** A table with a label column and any number of value columns. */
export function GridTable({ columns, rows, minWidth = "34rem" }: { columns: string[]; rows: string[][]; minWidth?: string }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="text-left">
            {columns.map((c, i) => <th key={`${c}-${i}`} className={`${th} ${i === 0 ? "" : "text-right"}`}>{c}</th>)}
          </tr>
        </thead>
        <tbody className="text-slate-700 dark:text-slate-300">
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-slate-200 dark:border-slate-800">
              {row.map((cell, i) => <td key={i} className={`py-2 pr-3 tabular-nums ${i === 0 ? "" : "text-right"}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
