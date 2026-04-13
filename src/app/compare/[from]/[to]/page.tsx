import type { Metadata } from "next";
import Calculator from "@/components/Calculator";
import AdSlot from "@/components/AdSlot";
import { findCity, isMajorCity } from "@/lib/cities";
import { majorCityPairs } from "@/lib/majorCities";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamicParams = true;

function isSameCompare(a?: string, b?: string) {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}

export async function generateStaticParams() {
  return majorCityPairs
    .filter(({ from, to }) => !isSameCompare(from, to))
    .map(({ from, to }) => ({ from, to }));
}

type PageProps = {
  params: Promise<{ from: string; to: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { from, to } = await params;
  const fromCity = findCity(from);
  const toCity = findCity(to);

  if (!fromCity || !toCity) return {};

  const title = `${fromCity.name} vs ${toCity.name} Cost of Living, Taxes & Salary Comparison`;
  const description = `Compare cost of living, take-home pay, rent, housing costs, and taxes between ${fromCity.name}, ${fromCity.state.toUpperCase()} and ${toCity.name}, ${toCity.state.toUpperCase()}. See what salary feels equivalent after moving.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/compare/${from}/${to}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.relocationbynumbers.com/compare/${from}/${to}`,
      siteName: "Relocation by Numbers",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { from, to } = await params;

  if (isSameCompare(from, to)) return notFound();

  const fromCity = findCity(from);
  const toCity = findCity(to);

  if (!fromCity || !toCity) return notFound();

  if (!isMajorCity(fromCity) && !isMajorCity(toCity)) return notFound();

  const isValidCompareHref = (href: string) => {
    const parts = href.split("/compare/")[1]?.split("/");
    const a = parts?.[0];
    const b = parts?.[1];
    if (!a || !b) return false;
    if (isSameCompare(a, b)) return false;
    return !!findCity(a) && !!findCity(b);
  };

  const popular = [
    { href: `/compare/${fromCity.id}/nyc-ny`, label: `${fromCity.name} vs NYC` },
    { href: `/compare/${fromCity.id}/austin-tx`, label: `${fromCity.name} vs Austin` },
    { href: `/compare/${toCity.id}/nyc-ny`, label: `${toCity.name} vs NYC` },
    { href: `/compare/${toCity.id}/charlotte-nc`, label: `${toCity.name} vs Charlotte` },
    { href: `/compare/${toCity.id}/miami-fl`, label: `${toCity.name} vs Miami` },
    { href: `/compare/${fromCity.id}/seattle-wa`, label: `${fromCity.name} vs Seattle` },
  ]
    .filter((x) => x.href !== `/compare/${fromCity.id}/${toCity.id}`)
    .filter((x) => isValidCompareHref(x.href))
    .filter((x, i, arr) => arr.findIndex((y) => y.href === x.href) === i)
    .slice(0, 6);

  const dynamicLinks = [
    { href: `/compare/${fromCity.id}/nyc-ny`, label: `${fromCity.name} vs NYC` },
    { href: `/compare/${fromCity.id}/charlotte-nc`, label: `${fromCity.name} vs Charlotte` },
    { href: `/compare/${fromCity.id}/austin-tx`, label: `${fromCity.name} vs Austin` },
    { href: `/compare/${fromCity.id}/seattle-wa`, label: `${fromCity.name} vs Seattle` },
    { href: `/compare/${fromCity.id}/boston-ma`, label: `${fromCity.name} vs Boston` },
    { href: `/compare/${fromCity.id}/miami-fl`, label: `${fromCity.name} vs Miami` },

    { href: `/compare/${toCity.id}/nyc-ny`, label: `${toCity.name} vs NYC` },
    { href: `/compare/${toCity.id}/charlotte-nc`, label: `${toCity.name} vs Charlotte` },
    { href: `/compare/${toCity.id}/austin-tx`, label: `${toCity.name} vs Austin` },
    { href: `/compare/${toCity.id}/seattle-wa`, label: `${toCity.name} vs Seattle` },
    { href: `/compare/${toCity.id}/boston-ma`, label: `${toCity.name} vs Boston` },
    { href: `/compare/${toCity.id}/miami-fl`, label: `${toCity.name} vs Miami` },
  ]
    .filter((x) => x.href !== `/compare/${fromCity.id}/${toCity.id}`)
    .filter((x) => isValidCompareHref(x.href))
    .filter((x, i, arr) => arr.findIndex((y) => y.href === x.href) === i)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4 space-y-10">

        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {fromCity.name} vs {toCity.name} Cost of Living Comparison
          </h1>

          <p className="mt-1 text-lg font-semibold text-slate-700">
            {fromCity.name}, {fromCity.state.toUpperCase()} vs {toCity.name},{" "}
            {toCity.state.toUpperCase()} — Salary, Taxes &amp; Housing
          </p>

          <p className="mx-auto max-w-3xl text-slate-600">
            Compare take-home pay, housing costs, and affordability between{" "}
            <span className="font-semibold text-slate-900">{fromCity.name}</span> and{" "}
            <span className="font-semibold text-slate-900">{toCity.name}</span>. See how far
            your salary goes in each city and what income would feel equivalent after a move.
          </p>

          <div className="mx-auto mt-4 grid max-w-4xl grid-cols-2 gap-3 text-sm font-semibold sm:grid-cols-4">
            {dynamicLinks.map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
              >
                {x.label}
              </Link>
            ))}
          </div>
        </header>

        <div className="text-center text-xs text-slate-500">
          Assumptions updated: March 2026
        </div>

        {/* Is it worth it */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Is moving from {fromCity.name} to {toCity.name} worth it?
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Moving from{" "}
              <span className="font-semibold text-slate-900">{fromCity.name}</span> to{" "}
              <span className="font-semibold text-slate-900">{toCity.name}</span> can change
              more than just rent. State income taxes, home prices, monthly housing pressure,
              and how much is left after bills can all shift in meaningful ways — even if your
              gross salary stays exactly the same.
            </p>
            <p>
              This comparison is built to help you look past headline salary and focus on what
              your money may actually feel like in each place. A move that lowers housing
              pressure or improves take-home pay can make your income stretch further even if the
              gross number doesn't change.
            </p>
            <p>
              Use the calculator below to compare{" "}
              {fromCity.name} and {toCity.name} side by side on taxes, housing, and monthly
              affordability. This is especially useful if you are deciding whether a move could
              improve monthly breathing room or reduce the salary you would need to maintain a
              similar lifestyle.
            </p>
          </div>
        </section>

        <Calculator
          monetization="compare"
          initialFromState={fromCity.state}
          initialToState={toCity.state}
          initialFromCityId={fromCity.id}
          initialToCityId={toCity.id}
        />

        {/* Who this move is best for */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Who this {fromCity.name} to {toCity.name} move may be best for
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Remote workers</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If you can keep a stronger salary while moving to a lower-cost city, your
                take-home pay and monthly flexibility may improve significantly — especially
                if the move means a lower state income tax rate.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Future home buyers</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Housing differences matter most for people planning to buy. Median home price,
                mortgage size, property tax, and insurance can all shift the full affordability
                picture between {fromCity.name} and {toCity.name}.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">People in high housing pressure</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If a large share of your income currently goes to rent or a mortgage, comparing
                a lower-cost city can show whether a move could meaningfully improve monthly
                breathing room.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {fromCity.name} vs {toCity.name} — common questions
          </h2>
          <dl className="mt-5 space-y-5 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-900">
                Is {toCity.name} cheaper than {fromCity.name}?
              </dt>
              <dd className="mt-1">
                It depends on your income, housing choice, and lifestyle. The calculator above
                compares both cities based on your specific salary, state tax rules, and local
                housing costs — giving you a more accurate picture than generic cost-of-living
                indexes.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">
                How does moving from {fromCity.name} to {toCity.name} affect taxes?
              </dt>
              <dd className="mt-1">
                State income tax is one of the biggest variables when comparing{" "}
                {fromCity.state.toUpperCase()} and {toCity.state.toUpperCase()}.{" "}
                {fromCity.state.toUpperCase() === toCity.state.toUpperCase()
                  ? `Both cities are in the same state, so the state tax rate stays the same. The biggest differences will come from housing costs and local cost of living.`
                  : `The calculator applies the tax rules for each state to your gross income so you can see the real take-home difference.`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">
                What salary do I need in {toCity.name} to match my lifestyle in {fromCity.name}?
              </dt>
              <dd className="mt-1">
                The calculator above includes a "comparable salary" estimate — the gross income
                you would need in {toCity.name} to maintain the same monthly budget as your
                current salary in {fromCity.name}. It accounts for the difference in taxes,
                housing costs, and cost of living between the two cities.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">
                What is the cost of living difference between {fromCity.name} and {toCity.name}?
              </dt>
              <dd className="mt-1">
                Cost of living differences between cities are driven primarily by housing costs
                and state income taxes. Enter your income in the calculator above to see a
                side-by-side monthly budget breakdown for both cities, including rent, take-home
                pay, and estimated monthly flexibility.
              </dd>
            </div>
          </dl>
        </section>

        {/* Related comparisons */}
        {popular.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Related city comparisons
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Explore more city-to-city comparisons to see how taxes, housing costs, and salary
              needs change across popular relocation paths.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {popular.map((x) => (
                <Link
                  key={x.href}
                  href={x.href}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {x.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8 text-center">
          <div className="mb-3 text-xs text-slate-500">
            Assumptions updated: March 2026
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
            <Link href="/about" className="transition hover:text-slate-900">About</Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-slate-900">Disclaimer</Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-slate-900">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-slate-900">Terms</Link>
          </div>
        </div>

      </div>
    </main>
  );
}
