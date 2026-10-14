import Link from "next/link";
import { buildPairExample, type PairCityExample } from "@/lib/pairExample";

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const signed = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const pct = (n: number, of: number) => (of > 0 ? `${((n / of) * 100).toFixed(1)}%` : "0.0%");

function localTaxLine(c: PairCityExample): string {
  const parts: string[] = [];
  parts.push(c.tax.state > 0 ? `${c.state} state income tax of ${usd(c.tax.state)}` : `no ${c.state} state income tax on wages`);
  if (c.tax.local > 0) parts.push(`a city income tax of ${usd(c.tax.local)}`);
  if (c.payrollPrograms.length > 0) parts.push(`employee-paid state programs (${c.payrollPrograms.join(", ")}) of ${usd(c.tax.statePayroll)}`);
  return `${c.name}: ${parts.join(", ")}.`;
}

/**
 * Worked example for a compare-pair page: the same single filer on the same salary in both cities, computed with the site's own
 * tax engine and the Census Bureau rent and home-value figures. Server component: the numbers are in the page HTML.
 */
export default function PairWorkedExample({ fromId, toId }: { fromId: string; toId: string }) {
  const ex = buildPairExample(fromId, toId);
  if (!ex) return null;
  const { from, to } = ex;
  const better = ex.afterRentChange === null ? null : ex.afterRentChange >= 0 ? to : from;
  const rows: Array<[string, string, string, string]> = [
    ["Federal income tax and payroll tax", usd(from.tax.federal + from.tax.fica), usd(to.tax.federal + to.tax.fica), signed(to.tax.federal + to.tax.fica - (from.tax.federal + from.tax.fica))],
    ["State and local taxes", usd(from.tax.state + from.tax.local + from.tax.statePayroll), usd(to.tax.state + to.tax.local + to.tax.statePayroll), signed(to.tax.state + to.tax.local + to.tax.statePayroll - (from.tax.state + from.tax.local + from.tax.statePayroll))],
    ["Take-home pay a year", usd(from.tax.net), usd(to.tax.net), signed(to.tax.net - from.tax.net)],
    ["Take-home pay a month", usd(from.monthlyNet), usd(to.monthlyNet), signed(ex.monthlyNetChange)],
  ];
  if (from.rent !== null && to.rent !== null && ex.rentChange !== null) {
    rows.push(["Typical rent (Census, recent movers)", usd(from.rent), usd(to.rent), signed(ex.rentChange)]);
    if (from.afterRent !== null && to.afterRent !== null && ex.afterRentChange !== null) {
      rows.push(["Left each month after rent", usd(from.afterRent), usd(to.afterRent), signed(ex.afterRentChange)]);
    }
  }
  return (
    <section aria-labelledby="worked-example" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <h2 id="worked-example" className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Worked example: {usd(ex.salary)} salary in {from.name} and {to.name}
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
        A single filer earning {usd(ex.salary)} a year, taking the standard deduction and saving nothing to a 401(k), keeps{" "}
        <strong className="text-slate-900 dark:text-slate-100">{usd(from.monthlyNet)} a month</strong> in {from.name} ({pct(from.tax.totalTax, ex.salary)} of pay goes to tax) and{" "}
        <strong className="text-slate-900 dark:text-slate-100">{usd(to.monthlyNet)} a month</strong> in {to.name} ({pct(to.tax.totalTax, ex.salary)}).
        {" "}The difference is {signed(ex.monthlyNetChange)} a month before housing
        {better && ex.afterRentChange !== null
          ? `; after the typical rent in each city, ${better.name} leaves more each month, by ${usd(Math.abs(ex.afterRentChange))}.`
          : "."}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="pb-2 pr-3">Per year unless noted</th>
              <th className="pb-2 pr-3 text-right">{from.name}</th>
              <th className="pb-2 pr-3 text-right">{to.name}</th>
              <th className="pb-2 text-right">Change</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-slate-300">
            {rows.map(([label, a, b, d]) => (
              <tr key={label} className="border-t border-slate-200 dark:border-slate-800">
                <td className="py-2 pr-3">{label}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{a}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{b}</td>
                <td className="py-2 text-right font-medium tabular-nums">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-slate-100">Local taxes involved</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-400">
        <li>{localTaxLine(from)}</li>
        <li>{localTaxLine(to)}</li>
        {from.propertyTaxPct !== null && to.propertyTaxPct !== null ? (
          <li>
            If you buy: effective property tax is about {from.propertyTaxPct.toFixed(2)}% of home value in {from.name} and {to.propertyTaxPct.toFixed(2)}% in {to.name}
            {from.homePrice !== null && to.homePrice !== null
              ? `, on typical recent-buyer home values of ${usd(from.homePrice)} and ${usd(to.homePrice)}`
              : ""}
            .
          </li>
        ) : null}
      </ul>

      <p className="mt-4 text-xs leading-6 text-slate-500 dark:text-slate-400">
        Computed with the site&apos;s 2026 tax engine; rent and home values are from the U.S. Census Bureau (2020 to 2024 American Community Survey). Planning
        estimate, not tax advice.{" "}
        <Link href={ex.calculatorHref} className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">
          Try your own salary and costs in the calculator
        </Link>
        .
      </p>
    </section>
  );
}
