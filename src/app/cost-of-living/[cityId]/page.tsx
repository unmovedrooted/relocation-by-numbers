import { notFound } from "next/navigation";
import Calculator from "@/components/Calculator";
import { findCity } from "@/lib/cities";
import Link from "next/link";
import { estimateMortgageMonthly } from "@/lib/mortgage";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

const MORE_COMPARE_IDS = [
  "nyc-ny",
  "la-ca",
  "seattle-wa",
  "austin-tx",
  "boston-ma",
  "miami-fl",
  "sf-ca",
  "chicago-il",
  "denver-co",
  "atlanta-ga",
  "dallas-tx",
  "houston-tx",
  "phoenix-az",
  "philadelphia-pa",
  "sd-ca",
  "portland-or",
];

export async function generateStaticParams() {
  return [
    { cityId: "nyc-ny" },
    { cityId: "charlotte-nc" },
    { cityId: "austin-tx" },
    { cityId: "la-ca" },
    { cityId: "seattle-wa" },
    { cityId: "boston-ma" },
    { cityId: "miami-fl" },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cityId } = await params;
  const city = findCity(cityId);
  if (!city) return {};

  const title = `Cost of Living in ${city.name}, ${city.state.toUpperCase()} — Rent, Taxes & Salary Guide`;
  const description = `How much does it cost to live in ${city.name}? Compare rent, median home prices, income taxes, and take-home pay. See the salary you need to live comfortably in ${city.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/cost-of-living/${cityId}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.relocationbynumbers.com/cost-of-living/${cityId}`,
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

export default async function CostOfLivingPage({ params }: PageProps) {
  const { cityId } = await params;
  const city = findCity(cityId);

  if (!city) return notFound();

  const moreCompare = MORE_COMPARE_IDS.filter((id) => id !== city.id)
    .map((id) => findCity(id))
    .filter(Boolean)
    .slice(0, 15) as { id: string; name: string; state: string }[];

  const popular = [
    { href: "/compare/nyc-ny/charlotte-nc", label: "NYC vs Charlotte" },
    { href: "/compare/la-ca/austin-tx", label: "LA vs Austin" },
    { href: "/compare/seattle-wa/dallas-tx", label: "Seattle vs Dallas" },
    { href: "/compare/boston-ma/miami-fl", label: "Boston vs Miami" },
  ];

  const rent = city.defaultRent ?? 0;
  const tighter = rent ? Math.round((rent * 12) / 0.35) : null;
  const target = rent ? Math.round((rent * 12) / 0.3) : null;
  const comfort = rent ? Math.round((rent * 12) / 0.28) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-10">

        <header className="py-2 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Cost of Living in {city.name}, {city.state.toUpperCase()}
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
            How much does it cost to live in {city.name}? This page covers rent,
            median home prices, property taxes, income taxes, and the salary you
            need to live comfortably — with a calculator to compare{" "}
            {city.name} against other cities.
          </p>

          <div className="mt-3 text-xs text-slate-500">
            Assumptions updated: March 2026
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Explore All Tools
            </Link>
            <Link
              href={`/compare/nyc-ny/${city.id}`}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Compare {city.name} with NYC
            </Link>
          </div>

          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-blue-600/80" />

          <div className="mx-auto mt-5 flex flex-wrap justify-center gap-2">
            {popular.map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                {x.label}
              </Link>
            ))}
          </div>
        </header>

        {/* Snapshot */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70">
          <h2 className="text-sm font-semibold">
            {city.name} cost of living snapshot
          </h2>
          <div className="mt-4 h-px w-full bg-slate-100" />

          <div className="mt-4 mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
            {[
              {
                label: "State",
                value: city.state.toUpperCase(),
              },
              {
                label: "Average Rent",
                value: city.defaultRent
                  ? `$${city.defaultRent.toLocaleString()} / month`
                  : "—",
              },
              {
                label: "Median Home Price",
                value: city.medianHomePrice
                  ? `$${city.medianHomePrice.toLocaleString()}`
                  : "—",
                extra: city.medianHomePrice
                  ? (() => {
                      const pmt = estimateMortgageMonthly(city.medianHomePrice, {
                        downPct: 0.2,
                        rate: 0.07,
                        years: 30,
                      });
                      return pmt
                        ? `Est. mortgage: $${pmt.toLocaleString()}/mo`
                        : null;
                    })()
                  : null,
              },
              {
                label: "Property Tax",
                value: city.propertyTaxPct ? `${city.propertyTaxPct}%` : "—",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {item.value}
                  </span>
                </div>
                {item.extra && (
                  <div className="mt-1 text-xs text-slate-500">{item.extra}</div>
                )}
              </div>
            ))}
          </div>

          {rent ? (
            <>
              <div className="mt-4 mb-2 text-sm font-semibold text-slate-900">
                Salary needed in {city.name} (rent ≈ ${rent.toLocaleString()}/mo)
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { label: "Tighter", value: tighter },
                  { label: "Target", value: target },
                  { label: "Comfort", value: comfort },
                ].map((x) => (
                  <div
                    key={x.label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <span className="text-xs font-medium text-slate-600">
                      {x.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      ${x.value?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Rule of thumb: rent is roughly 28–35% of gross income.
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500">
              No rent estimate found for this city yet.
            </div>
          )}
        </section>

        {/* What makes this city expensive */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Is {city.name} expensive to live in?
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              In most cities, housing drives the biggest part of the cost of living.
              Rent, mortgage size, insurance, and property taxes all affect how much
              flexibility you have left after monthly essentials.
            </p>
            <p>
              In {city.name}, the real question is not just what homes or apartments
              cost on paper, but how those costs compare with local salary levels and
              your take-home pay after state and federal income taxes. A city can feel
              manageable at one income level and extremely tight at another.
            </p>
            <p>
              Use the calculator below to compare {city.name} against other major
              cities and see whether your income would stretch further somewhere else,
              or whether staying put still makes financial sense.
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section>
          <Calculator
            monetization="state"
            initialToState={city.state}
            initialToCityId={city.id}
          />
        </section>

        {/* Salary section */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            What salary do you need to live in {city.name}?
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Salary targets matter because "affordable" means different things at
              different income levels. Someone renting conservatively may manage on a
              tighter budget, while someone trying to save, invest, or buy later may
              need a much larger buffer.
            </p>
            <p>
              That is why the guidance above shows a tighter, target, and comfort
              range — giving you a simple way to think about what salary may feel
              barely workable versus what creates real breathing room month to month.
            </p>
            {target ? (
              <p>
                Based on the current rent estimate for {city.name}, a salary around{" "}
                <span className="font-semibold text-slate-900">
                  ${target.toLocaleString()}
                </span>{" "}
                is a reasonable starting point for most renters, while a salary closer
                to{" "}
                <span className="font-semibold text-slate-900">
                  ${comfort?.toLocaleString()}
                </span>{" "}
                may leave more room for savings and unexpected costs.
              </p>
            ) : null}
          </div>
        </section>

        {/* Rent comparison */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70">
          <h2 className="text-sm font-semibold">
            How {city.name} rent compares to other cities
          </h2>
          <div className="mt-4 grid gap-3 text-sm">
            {[
              { id: "nyc-ny", label: "New York City" },
              { id: "austin-tx", label: "Austin" },
              { id: "miami-fl", label: "Miami" },
              { id: "boston-ma", label: "Boston" },
            ]
              .filter((x) => x.id !== city.id)
              .map((x) => {
                const other = findCity(x.id);
                if (!other) return null;

                const a = city.defaultRent ?? 0;
                const b = other.defaultRent ?? 0;
                const diff =
                  a > 0 && b > 0 ? Math.round((1 - a / b) * 100) : null;

                const badge =
                  diff === null
                    ? "—"
                    : diff >= 0
                    ? `~${diff}% cheaper rent`
                    : `~${Math.abs(diff)}% higher rent`;

                return (
                  <Link
                    key={x.id}
                    href={`/compare/${x.id}/${city.id}`}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 transition hover:bg-slate-100"
                  >
                    <span className="font-medium text-slate-900">
                      {x.label} vs {city.name}
                    </span>
                    <span className="text-slate-600">{badge} →</span>
                  </Link>
                );
              })}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Based on average rent estimates. Real listings vary by neighborhood,
            housing type, and timing.
          </div>

          {moreCompare.length > 0 ? (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="mb-3 text-xs font-semibold text-slate-700">
                More {city.name} comparisons
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
                {moreCompare.map((c) => (
                  <Link
                    key={c.id}
                    href={`/compare/${c.id}/${city.id}`}
                    className="whitespace-nowrap truncate text-slate-700 hover:underline"
                    title={`${c.name} vs ${city.name}`}
                  >
                    {c.name} vs {city.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* FAQ */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Frequently asked questions about {city.name}
          </h2>
          <dl className="mt-5 space-y-5 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-900">
                What is the cost of living in {city.name}?
              </dt>
              <dd className="mt-1">
                The cost of living in {city.name} is driven primarily by housing,
                state income taxes, and transportation. The average rent estimate is
                {rent ? ` $${rent.toLocaleString()} per month` : " available in the snapshot above"}.
                Use the calculator on this page to see a full monthly budget breakdown
                based on your income.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">
                What salary do you need to live comfortably in {city.name}?
              </dt>
              <dd className="mt-1">
                {target && comfort ? (
                  <>
                    Based on current rent estimates, a salary of around $
                    {target.toLocaleString()} is a reasonable target for most renters
                    in {city.name}. A salary closer to ${comfort.toLocaleString()} provides
                    more room for savings, emergencies, and discretionary spending.
                  </>
                ) : (
                  <>
                    The salary you need depends on your rent, lifestyle, and savings
                    goals. Use the calculator above to estimate based on your specific
                    income.
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">
                Is {city.name} a good place to move for affordability?
              </dt>
              <dd className="mt-1">
                It depends on where you are moving from and what your income is.
                Use the comparison links above to see how {city.name} stacks up
                against other major cities on rent, taxes, and take-home pay side
                by side.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">
                How does {city.state.toUpperCase()} state income tax affect take-home pay in {city.name}?
              </dt>
              <dd className="mt-1">
                State income tax is one of the biggest factors in how far your salary
                goes. The calculator on this page applies {city.state.toUpperCase()} state
                tax rules to your income so you can see your actual take-home pay, not
                just your gross salary.
              </dd>
            </div>
          </dl>
        </section>

        {/* Related pages */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Related pages for {city.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/salary-needed-in/${city.id}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Salary Needed in {city.name}
            </Link>
            <Link
              href={`/fire-in/${city.id}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              FIRE in {city.name}
            </Link>
            <Link
              href="/compare"
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Explore Compare Pages
            </Link>
            <Link
              href="/explore"
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Explore All Tools
            </Link>
          </div>
        </section>

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
