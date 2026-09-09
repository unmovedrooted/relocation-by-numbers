import type { runRetirementTimeline } from "@/lib/retirementPlan/timeline";
import RetirementTerminalComparison from "./RetirementTerminalComparison";
type Result = ReturnType<typeof runRetirementTimeline>;
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
export default function RetirementConversionResults({ baseline, result, stale }: { baseline: Result; result: Result; stale: boolean }) {
  const metrics: [string, (r: Result) => number][] = [
    ["Total conversions", r => r.years.reduce((s, y) => s + y.result.cash.conversions.reduce((t, c) => t + c.amount, 0), 0)],
    ["Total estimated taxes", r => r.years.reduce((s, y) => s + y.result.tax.total, 0)],
    ["Total RMDs", r => r.years.reduce((s, y) => s + y.result.cash.requiredWithdrawals, 0)],
    ["Total IRMAA surcharges (if enabled)", r => r.years.reduce((s, y) => s + y.irmaaSurcharges, 0)],
    ["Ending assets, nominal, before liquidation taxes", r => r.years.at(-1)!.endingPortfolio],
  ];
  return <section aria-labelledby="conversion-results-heading" className="min-w-0 space-y-3">
    <h3 id="conversion-results-heading" className="font-semibold">Conversion comparison</h3>
    {stale && <p role="status">Inputs changed—run the projection to refresh this comparison.</p>}
    <p className="text-sm text-slate-500">Identical assumptions and withdrawal order; only the conversion schedule differs. This is not a recommendation or an after-tax wealth ranking. Future tax and Medicare effects beyond the horizon are excluded.</p>
    <p className="text-sm">Every year funded: without conversions {baseline.allYearsFunded ? "Yes" : "No"}; with conversions {result.allYearsFunded ? "Yes" : "No"}.</p>
    <div className="max-w-full overflow-x-auto" role="region" aria-label="Conversion comparison table" tabIndex={0}>
      <table className="w-full text-left text-sm"><caption className="sr-only">Conversion versus no-conversion projection</caption><thead><tr>{["Measure", "Without conversions", "With conversions", "Difference"].map(t => <th key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{metrics.map(([label, fn]) => <tr key={label}><th className="p-2" scope="row">{label}</th><td className="whitespace-nowrap p-2">{money(fn(baseline))}</td><td className="whitespace-nowrap p-2">{money(fn(result))}</td><td className="whitespace-nowrap p-2">{money(fn(result) - fn(baseline))}</td></tr>)}</tbody></table>
    </div>
    <RetirementTerminalComparison baseline={baseline} result={result} />
    <details open className="min-w-0">
      <summary className="cursor-pointer font-semibold">Annual conversion breakdown</summary>
      <p className="my-3 text-sm text-slate-500">Accepted requests are completed in full; unsupported requests are rejected. Tax differences include all downstream scenario effects. Funding lists actual account withdrawals for the combined spending-and-tax budget, not amounts earmarked solely for conversion taxes. Account IDs identify the source unambiguously. Scroll within the table on small screens.</p>
      <div className="max-w-full overflow-x-auto" role="region" aria-label="Annual conversion breakdown" tabIndex={0}>
        <table className="w-full text-left text-sm"><caption className="sr-only">Annual conversions, tax character and cash-flow sources</caption>
          <thead><tr>{["Year", "Requested / completed", "Taxable", "Nontaxable basis", "Tax difference", "Income / RMDs / other withdrawals", "Withdrawal sources", "IRMAA difference in year + 2"].map(label => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead>
          <tbody>{result.years.map(row => {
            const base = baseline.years.find(y => y.year === row.year)!;
            const converted = row.result.cash.conversions.reduce((s, c) => s + c.amount, 0);
            const later = result.years.find(y => y.year === row.year + 2);
            const baseLater = baseline.years.find(y => y.year === row.year + 2);
            return <tr key={row.year}>
              <th scope="row" className="p-2">{row.year}</th>
              <td className="whitespace-nowrap p-2">{money(converted)} / {money(converted)}{row.result.cash.conversions.map(c => <div key={`${c.sourceId}-${c.destinationId}`} className="whitespace-normal">{c.sourceId} → {c.destinationId}</div>)}</td>
              <td className="whitespace-nowrap p-2">{money(row.result.conversionTax.reduce((s,c)=>s+c.taxable,0))}</td>
              <td className="whitespace-nowrap p-2">{money(row.result.conversionTax.reduce((s,c)=>s+c.nontaxable,0))}</td>
              <td className="whitespace-nowrap p-2">{money(row.result.tax.total-base.result.tax.total)}</td>
              <td className="whitespace-nowrap p-2">{money(row.result.cash.income)} / {money(row.result.cash.requiredWithdrawals)} / {money(row.result.cash.voluntaryWithdrawals)}</td>
              <td className="p-2">{row.result.cash.accounts.filter(a=>a.requiredWithdrawal+a.voluntaryWithdrawal>0).map(a=><div key={a.accountId}>{a.accountId}: RMD {money(a.requiredWithdrawal)}, other {money(a.voluntaryWithdrawal)}</div>)}{row.result.cash.requiredWithdrawals+row.result.cash.voluntaryWithdrawals===0 && "None"}</td>
              <td className="p-2">{later && baseLater ? `${later.year}: ${later.irmaa.length ? money(later.irmaaSurcharges-baseLater.irmaaSurcharges) : "No modeled enrollment"}` : "Beyond horizon"}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </details>
  </section>;
}
