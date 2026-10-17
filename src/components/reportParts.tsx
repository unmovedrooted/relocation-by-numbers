/** Formatters and styles shared by the city-pair, origin-city and single-city reports. */
export const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
export const signed = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
export const orNA = (n: number | null, f: (v: number) => string = usd) => (n === null ? "n/a" : f(n));
export const level = (n: number | null) => (n === null ? "n/a" : n.toFixed(1));
export const diff = (a: number | null, b: number | null, f: (v: number) => string = signed) => (a === null || b === null ? "n/a" : f(b - a));
export const pctOf = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "0.0%");
export const num = (n: number) => n.toLocaleString("en-US");

/**
 * "themed" follows the site's light and dark mode; "dark" is for the pages that use a fixed dark background (the FIRE and salary
 * pages), where light-mode cards would stand out.
 */
export type Tone = "themed" | "dark";

export function toneStyles(tone: Tone) {
  if (tone === "dark") {
    return {
      card: "rounded-2xl border border-white/10 bg-white/5 p-6",
      h2: "text-xl font-semibold text-white",
      th: "pb-2 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-400",
      note: "mt-3 text-xs leading-6 text-slate-400",
      strong: "text-white",
      body: "text-slate-300",
      muted: "text-slate-300",
      rowBorder: "border-t border-white/10",
      link: "underline underline-offset-2 hover:opacity-80",
      tile: "rounded-xl border border-white/10 bg-black/20 p-4",
      tileLabel: "text-[11px] font-semibold uppercase tracking-wide text-slate-400",
      tileValue: "mt-1 text-2xl font-bold tabular-nums text-white",
      tileSub: "mt-1 text-xs leading-5 text-slate-400",
    };
  }
  return {
    card: "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
    h2: "text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100",
    th: "pb-2 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",
    note: "mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400",
    strong: "text-slate-900 dark:text-slate-100",
    body: "text-slate-600 dark:text-slate-400",
    muted: "text-slate-700 dark:text-slate-300",
    rowBorder: "border-t border-slate-200 dark:border-slate-800",
    link: "underline underline-offset-2 hover:opacity-80",
    tile: "rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950",
    tileLabel: "text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",
    tileValue: "mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100",
    tileSub: "mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400",
  };
}

const themed = toneStyles("themed");
export const card = themed.card;
export const h2 = themed.h2;
export const th = themed.th;
export const note = themed.note;
export const strong = themed.strong;

export function Tile({ label, value, sub, tone = "themed" }: { label: string; value: string; sub: string; tone?: Tone }) {
  const t = toneStyles(tone);
  return (
    <div className={t.tile}>
      <div className={t.tileLabel}>{label}</div>
      <div className={t.tileValue}>{value}</div>
      <div className={t.tileSub}>{sub}</div>
    </div>
  );
}

/** A table with a label column and any number of value columns. */
export function GridTable({ columns, rows, minWidth = "34rem", tone = "themed" }: { columns: string[]; rows: string[][]; minWidth?: string; tone?: Tone }) {
  const t = toneStyles(tone);
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="text-left">
            {columns.map((c, i) => <th key={`${c}-${i}`} className={`${t.th} ${i === 0 ? "" : "text-right"}`}>{c}</th>)}
          </tr>
        </thead>
        <tbody className={t.muted}>
          {rows.map((row) => (
            <tr key={row[0]} className={t.rowBorder}>
              {row.map((cell, i) => <td key={i} className={`py-2 pr-3 tabular-nums ${i === 0 ? "" : "text-right"}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
