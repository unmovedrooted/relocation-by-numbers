"use client";

import { STATES } from "@/lib/states";
import type { calculatePreview } from "@/lib/retirementPlan/preview";

type Result = ReturnType<typeof calculatePreview>;
type Row = Result["years"][number];

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const name = (code: string) => STATES.find(state => state.code === code)?.name ?? code.toUpperCase();
const signed = (value: number) => `${value >= 0 ? "+" : "−"}${money(Math.abs(value))}`;

/** State and local income tax for one projected year. */
const stateAndLocal = (row: Row) => row.result.tax.stateTax + (row.result.tax.localTax ?? 0);

/** What a planned move does to the plan: state and local tax and the ending portfolio, against staying in the resident state. */
export default function RetirementMoveResults({ withMove, stay, from, to, moveYear }: {
  withMove: Result; stay: Result; from: string; to: string; moveYear: number;
}) {
  const sum = (result: Result, fromYear = -Infinity) =>
    result.years.filter(row => row.year >= fromYear).reduce((total, row) => total + stateAndLocal(row), 0);
  const moveTax = sum(withMove);
  const stayTax = sum(stay);
  const afterYears = withMove.years.filter(row => row.year >= moveYear);
  const afterAvgMove = afterYears.length ? sum(withMove, moveYear) / afterYears.length : 0;
  const afterAvgStay = afterYears.length ? sum(stay, moveYear) / afterYears.length : 0;
  const endMove = withMove.years.at(-1)?.endingPortfolio ?? 0;
  const endStay = stay.years.at(-1)?.endingPortfolio ?? 0;
  const taxDiff = moveTax - stayTax;
  const endDiff = endMove - endStay;
  const good = "text-emerald-700 dark:text-emerald-400";
  const bad = "text-rose-700 dark:text-rose-400";
  const funded = (result: Result) => (result.allYearsFunded ? "yes" : `no, from ${result.firstUnfundedYear}`);

  return (
    <section aria-labelledby="plan-move-results-heading" className="min-w-0 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800">
      <h3 id="plan-move-results-heading" className="text-sm font-semibold">Planned move: {name(from)} to {name(to)} in {moveYear}</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Compared with staying in {name(from)} for the whole projection. Dollars are nominal.</p>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt>State and local income tax, a year after the move</dt>
          <dd className="font-semibold">{money(afterAvgMove)} vs {money(afterAvgStay)} staying</dd></div>
        <div className="flex justify-between gap-3"><dt>State and local income tax, whole projection</dt>
          <dd className={`font-semibold ${taxDiff <= 0 ? good : bad}`}>{signed(taxDiff)}</dd></div>
        <div className="flex justify-between gap-3"><dt>Ending portfolio</dt>
          <dd className={`font-semibold ${endDiff >= 0 ? good : bad}`}>{signed(endDiff)} ({money(endMove)})</dd></div>
        <div className="flex justify-between gap-3"><dt>Spending funded every year</dt>
          <dd className="font-semibold">{funded(withMove)}{funded(stay) === funded(withMove) ? "" : ` (staying: ${funded(stay)})`}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        The household is treated as a full-year resident of {name(to)} from January 1 of {moveYear}. Moving costs, housing costs and any change in
        spending are not part of this comparison; use the relocation calculator for those. Tax on income earned in {name(from)} after the move is not modeled.
      </p>
    </section>
  );
}
