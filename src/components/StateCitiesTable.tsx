import Link from "next/link";
import type { StateCode } from "@/lib/states";
import { STATES } from "@/lib/states";
import { citiesForState } from "@/lib/cities";
import { estimateNetBreakdown } from "@/lib/wageTax";
import { ALLOWED_CITY_DETAIL_PAGES } from "@/lib/seo-allowlists";
import { GOVERNMENT_DATA_META } from "@/lib/governmentData";

const SALARY = 100_000;
const MAX_CITIES = 12;
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * Every modeled city in a state with its Census rent and home value, property tax rate, BEA housing price level and the
 * take-home pay on a $100,000 salary in that city (including city income tax where the tax engine models it).
 */
export default function StateCitiesTable({ code, tone = "light" }: { code: StateCode; tone?: "light" | "dark" }) {
  const stateName = STATES.find((s) => s.code === code)?.name ?? code.toUpperCase();
  const cities = citiesForState(code)
    .filter((c) => !c.id.startsWith("other-") && (c.defaultRent != null || c.medianHomePrice != null))
    .slice(0, MAX_CITIES);
  if (cities.length < 2) return null;

  const rows = cities.map((c) => {
    const b = estimateNetBreakdown({ grossAnnual: SALARY, state: code, filing: "single", k401Pct: 0, cityId: c.id });
    return { city: c, net: b.net, local: b.local };
  });

  const dark = tone === "dark";
  const card = dark
    ? "rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4"
    : "rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 space-y-4";
  const heading = dark ? "text-xl font-semibold" : "text-lg font-semibold tracking-tight text-slate-900 dark:text-white";
  const body = dark ? "text-sm leading-7 text-slate-300" : "text-sm leading-7 text-slate-600 dark:text-slate-300";
  const thCls = dark ? "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400" : "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";
  const tdCls = dark ? "px-3 py-2 text-sm text-slate-200" : "px-3 py-2 text-sm text-slate-800 dark:text-slate-200";
  const wrap = dark ? "overflow-x-auto rounded-xl border border-white/10" : "overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800";
  const headBg = dark ? "bg-black/20" : "bg-slate-50 dark:bg-slate-900";
  const divide = dark ? "divide-y divide-white/10" : "divide-y divide-slate-100 dark:divide-slate-800";
  const note = dark ? "text-xs leading-5 text-slate-400" : "text-xs leading-5 text-slate-500 dark:text-slate-400";

  const rents = rows.map((r) => r.city.defaultRent).filter((n): n is number => typeof n === "number");
  const priciest = [...rows].filter((r) => r.city.medianHomePrice != null).sort((a, b) => (b.city.medianHomePrice ?? 0) - (a.city.medianHomePrice ?? 0));
  const summary =
    rents.length >= 2 && priciest.length >= 2
      ? `Among the ${rows.length} ${stateName} cities below, median rent runs from ${usd(Math.min(...rents))} to ${usd(Math.max(...rents))} a month, and home prices range from ${usd(priciest[priciest.length - 1].city.medianHomePrice!)} in ${priciest[priciest.length - 1].city.name} to ${usd(priciest[0].city.medianHomePrice!)} in ${priciest[0].city.name}.`
      : null;

  return (
    <section aria-labelledby={`cities-${code}`} className={card}>
      <h2 id={`cities-${code}`} className={heading}>{stateName} cities compared: rent, home prices and take-home pay</h2>
      {summary && <p className={body}>{summary}</p>}
      <div className={wrap}>
        <table className="w-full min-w-[40rem] border-collapse">
          <caption className="sr-only">Rent, home value, property tax rate, housing price level and take-home pay by city in {stateName}</caption>
          <thead className={headBg}>
            <tr>
              <th scope="col" className={thCls}>City</th>
              <th scope="col" className={thCls}>Rent a month</th>
              <th scope="col" className={thCls}>Home value</th>
              <th scope="col" className={thCls}>Property tax</th>
              <th scope="col" className={thCls}>Housing prices</th>
              <th scope="col" className={thCls}>Take-home on {usd(SALARY)}</th>
            </tr>
          </thead>
          <tbody className={divide}>
            {rows.map(({ city, net, local }) => (
              <tr key={city.id}>
                <td className={`${tdCls} font-semibold`}>
                  {(ALLOWED_CITY_DETAIL_PAGES as readonly string[]).includes(city.id) ? (
                    <Link className="underline underline-offset-4 hover:no-underline" href={`/cost-of-living/${city.id}`}>{city.name}</Link>
                  ) : (
                    city.name
                  )}
                </td>
                <td className={tdCls}>{city.defaultRent != null ? usd(city.defaultRent) : "n/a"}</td>
                <td className={tdCls}>{city.medianHomePrice != null ? usd(city.medianHomePrice) : "n/a"}</td>
                <td className={tdCls}>{city.propertyTaxPct != null ? `${city.propertyTaxPct.toFixed(2)}%${city.propertyTaxIsEstimate ? " (state)" : ""}` : "n/a"}</td>
                <td className={tdCls}>{city.col?.housing != null ? `${city.col.housing.toFixed(2)}x` : "n/a"}</td>
                <td className={tdCls}>{usd(net)}{local > 0 ? " (after city tax)" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={note}>
        Rent and home values: {GOVERNMENT_DATA_META.census.vintage.split(" (")[0]}; recent-mover figures where the sample is reliable. Property tax: median real estate taxes paid divided by median home value,
        using the state rate where the city has none. Housing prices: Bureau of Economic Analysis Regional Price Parities, U.S. average = 1.00x. Take-home: single filer, no 401(k) deferral, standard deduction,
        federal, payroll, {stateName} and modeled city income taxes. Planning estimates, not tax advice.
      </p>
    </section>
  );
}
