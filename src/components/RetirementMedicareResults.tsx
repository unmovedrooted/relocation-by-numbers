import type { runRetirementTimeline } from "@/lib/retirementPlan/timeline";
const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
export default function RetirementMedicareResults({ result, stale }: { result: ReturnType<typeof runRetirementTimeline>; stale: boolean }) {
  const assessments = result.years.flatMap(row => row.irmaa);
  if (!assessments.length) return null;
  return <details open className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50">
    <summary className="cursor-pointer font-semibold">Annual Medicare IRMAA surcharges</summary>
    <p id="medicare-results-help" className="mt-2 text-sm text-slate-500">Per-person surcharges only, already included in the projection’s Spending column—not added to income tax. Base Medicare premiums remain in your budget. Income comes from two years before the premium year. Future-year figures are scenario estimates based on 2026 rules, not an SSA determination. Scroll within the table on small screens.</p>
    {stale && <p role="status" className="mt-2 text-sm text-amber-700 dark:text-amber-400">Inputs changed — run the projection to refresh Medicare results.</p>}
    <p className="mt-2 text-sm">Total modeled surcharges: <strong>{money(assessments.reduce((sum, item) => sum + item.total, 0))}</strong></p>
    <div role="region" aria-label="Annual Medicare surcharge results" aria-describedby="medicare-results-help" tabIndex={0} className="mt-3 max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-emerald-500">
      <table className="w-full text-right text-sm"><caption className="sr-only">Per-person Medicare income-related surcharges and lookback income</caption>
        <thead><tr>{["Premium year", "Person", "Income year", "MAGI", "Return status", "B months", "D months", "Part B surcharge", "Part D surcharge", "Total"].map(label => <th key={label} scope="col" className="whitespace-nowrap px-3 py-2">{label}</th>)}</tr></thead>
        <tbody>{assessments.map(item => <tr key={`${item.premiumYear}-${item.ownerId}`} className="border-t border-slate-200 dark:border-slate-800">
          <th scope="row" className="whitespace-nowrap px-3 py-2">{item.premiumYear}{item.isProjection ? " (projected)" : ""}</th>
          {[item.ownerId === "one" ? "1" : "2", item.incomeYear, money(item.magi), item.filing === "married" ? "Joint" : "Single", item.partBMonths, item.partDMonths, money(item.annualB), money(item.annualD), money(item.total)].map((cell, index) => <td key={index} className="whitespace-nowrap px-3 py-2 tabular-nums">{cell}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </details>;
}
