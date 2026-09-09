import type { previewIraRows } from "@/lib/retirementPlan/previewIraContributions";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
export default function RetirementIraContributionResults({ rows, stale }: { rows: ReturnType<typeof previewIraRows>; stale: boolean }) {
  if (!rows.some(row => row.requested > 0)) return null;
  return <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/50" open>
    <summary className="cursor-pointer font-semibold">Annual IRA contributions, deductions &amp; basis</summary>
    <p id="plan-ira-results-help" className="mt-2 text-sm text-slate-500">Household totals in nominal USD. Eligible request means the requested amount after annual, compensation and income limits—not the maximum you could contribute. Funded amounts reflect available cash. A deduction is not tax savings. Basis added is this year’s contribution basis, not the ending basis balance. Scroll within the table on small screens.</p>
    {stale && <p role="status" className="mt-2 text-sm text-amber-700 dark:text-amber-400">Inputs changed — run the projection to refresh IRA results.</p>}
    <div className="mt-3 max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-emerald-500" role="region" aria-label="Annual IRA results" aria-describedby="plan-ira-results-help" tabIndex={0}>
      <table className="w-full text-right text-sm">
        <caption className="sr-only">Annual requested and eligible IRA contributions, funded traditional and Roth deposits, deductions and basis additions</caption>
        <thead><tr>{["Year", "Requested", "Eligible request", "Traditional funded", "Roth funded", "IRA deduction", "Traditional basis added", "Roth basis added"].map((label, index) =>
          <th key={label} scope="col" className={`whitespace-nowrap px-3 py-2 ${index === 0 ? "text-left" : ""}`}>{label}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.year} className="border-t border-slate-200 dark:border-slate-800">
          <th scope="row" className="whitespace-nowrap px-3 py-2 text-left">{row.year}</th>
          {[row.requested, row.eligible, row.traditionalFunded, row.rothFunded, row.deduction, row.traditionalBasisAdded, row.rothBasisAdded].map((amount, index) =>
            <td key={index} className="whitespace-nowrap px-3 py-2 tabular-nums">{money(amount)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </details>;
}
