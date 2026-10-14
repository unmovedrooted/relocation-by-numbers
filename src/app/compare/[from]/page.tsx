import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCity } from "@/lib/cities";
import { ALLOWED_COMPARE_ROUTES, COMPARE_ORIGIN_HUBS, COMPARE_HUB_DESTINATIONS } from "@/lib/seo-allowlists";
import { buildPairExample, PAIR_EXAMPLE_SALARY } from "@/lib/pairExample";

export const dynamicParams = false;

type PageProps = { params: Promise<{ from: string }> };

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const signed = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;

export function generateStaticParams() {
  return COMPARE_ORIGIN_HUBS.map((from) => ({ from }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { from } = await params;
  const city = (COMPARE_ORIGIN_HUBS as readonly string[]).includes(from) ? findCity(from) : undefined;
  if (!city) return {};
  const title = `Moving from ${city.name}: Take-Home Pay, Rent and Taxes in Popular Destinations`;
  const description = `What a ${usd(PAIR_EXAMPLE_SALARY)} salary keeps in ${city.name} and in popular destinations after federal, state and local taxes and typical rent, computed with 2026 tax rules and Census rents.`;
  return {
    title,
    description,
    alternates: { canonical: `https://www.relocationbynumbers.com/compare/${from}` },
    openGraph: { title, description, url: `https://www.relocationbynumbers.com/compare/${from}`, siteName: "Relocation by Numbers", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CompareOriginHub({ params }: PageProps) {
  const { from } = await params;
  if (!(COMPARE_ORIGIN_HUBS as readonly string[]).includes(from)) return notFound();
  const origin = findCity(from);
  if (!origin) return notFound();

  const destinations = COMPARE_HUB_DESTINATIONS.filter((id) => id !== from);
  const rows = destinations
    .map((id) => {
      const ex = buildPairExample(from, id);
      const to = findCity(id);
      if (!ex || !to) return null;
      const live = ALLOWED_COMPARE_ROUTES.some((r) => r.from === from && r.to === id);
      return { id, name: to.name, state: to.state.toUpperCase(), ex, live };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (rows.length === 0) return notFound();

  const base = rows[0].ex.from;
  const best = [...rows].filter((r) => r.ex.afterRentChange !== null).sort((a, b) => (b.ex.afterRentChange ?? 0) - (a.ex.afterRentChange ?? 0))[0];
  const taxFree = rows.filter((r) => r.ex.to.tax.state === 0 && r.ex.to.tax.local === 0).map((r) => r.name);

  return (
    <main className="min-h-screen bg-slate-50 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl space-y-8 px-4">
        <header className="space-y-3">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            <Link href="/compare" className="underline underline-offset-4 hover:no-underline">City comparisons</Link> / From {origin.name}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">Moving from {origin.name}: where {usd(PAIR_EXAMPLE_SALARY)} goes further</h1>
          <p className="max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-400">
            A single filer on {usd(PAIR_EXAMPLE_SALARY)} a year keeps <strong className="text-slate-900 dark:text-slate-100">{usd(base.monthlyNet)} a month</strong> in {origin.name} after federal,
            state and local taxes, and pays a typical rent of {base.rent !== null ? usd(base.rent) : "an amount we could not estimate"}, leaving{" "}
            {base.afterRent !== null ? usd(base.afterRent) : "an amount we could not estimate"} a month. The table shows what the same salary leaves in {rows.length} common destinations.
            {best && best.ex.afterRentChange !== null && best.ex.afterRentChange > 0
              ? ` On these assumptions ${best.name} leaves the most after rent, ${signed(best.ex.afterRentChange)} a month more than ${origin.name}.`
              : ` On these assumptions none of the destinations leaves more after rent than ${origin.name}.`}
            {taxFree.length > 0 ? ` ${taxFree.join(", ")} ${taxFree.length === 1 ? "has" : "have"} no state or local income tax on wages.` : ""}
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Same salary, {rows.length} destinations</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="pb-2 pr-3">Destination</th>
                  <th className="pb-2 pr-3 text-right">Take-home a month</th>
                  <th className="pb-2 pr-3 text-right">Change</th>
                  <th className="pb-2 pr-3 text-right">Typical rent</th>
                  <th className="pb-2 text-right">After rent vs {origin.name}</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-2 pr-3 font-medium">
                      {r.live ? (
                        <Link href={`/compare/${from}/${r.id}`} className="underline underline-offset-4 hover:no-underline">{r.name}, {r.state}</Link>
                      ) : (
                        <Link href={r.ex.calculatorHref} className="underline underline-offset-4 hover:no-underline">{r.name}, {r.state}</Link>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{usd(r.ex.to.monthlyNet)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{signed(r.ex.monthlyNetChange)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.ex.to.rent !== null ? usd(r.ex.to.rent) : "n/a"}</td>
                    <td className="py-2 text-right font-medium tabular-nums">{r.ex.afterRentChange !== null ? signed(r.ex.afterRentChange) : "n/a"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
            Computed with the site&apos;s 2026 tax engine (single filer, standard deduction, no 401(k) contribution). Rents are the U.S. Census Bureau&apos;s median for households that moved in the last year
            (2020 to 2024 American Community Survey). Links open a full two-city comparison or the calculator, prefilled for that route. Planning estimates, not tax advice.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">What the numbers do not show</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-400">
            <li>Your salary may change if you keep your job but get a local-pay adjustment, or look for work in the new city.</li>
            <li>Home prices, property tax and insurance can matter more than rent if you plan to buy; the calculator has a rent-or-buy switch.</li>
            <li>Moving costs, overlapping rent and deposits are one-time costs; the calculator shows the cash needed up front and how many months it takes to earn it back.</li>
            <li>For retirement, state taxes on Social Security, pensions and withdrawals differ from taxes on wages; see the <Link href="/retirement-state-tax" className="underline underline-offset-4 hover:no-underline">retirement tax by state</Link> page.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href={`/?from=${origin.state}&filing=single&mode=rent&salary=${PAIR_EXAMPLE_SALARY}&fromCity=${origin.id}`} className="rounded-xl border border-slate-200 px-4 py-2 text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800">Open the calculator from {origin.name}</Link>
            <Link href="/compare-cities" className="rounded-xl border border-slate-200 px-4 py-2 text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800">Compare up to three cities</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
