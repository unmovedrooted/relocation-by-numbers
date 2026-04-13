import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import { findCity, majorCities } from "@/lib/cities";

type Props = {
  params: Promise<{ cityId: string }>;
};

export async function generateStaticParams() {
  return majorCities().map((c) => ({
    cityId: c.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cityId } = await params;
  const city = findCity(cityId);

  if (!city) return { title: "City not found" };

  const title = `Cost of Living in ${city.name}, ${city.state.toUpperCase()} — Rent, Housing & Taxes`;
  const description = `How much does it cost to live in ${city.name}? See average rent, median home prices, property tax rates, and the salary you need to live comfortably in ${city.name}, ${city.state.toUpperCase()}.`;

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

export default async function Page({ params }: Props) {
  const { cityId } = await params;
  const city = findCity(cityId);

  if (!city) return notFound();

  const relatedCities = majorCities()
    .filter((c) => c.id !== city.id)
    .slice(0, 6);

  const rent = city.defaultRent ?? 0;
  const homePrice = city.medianHomePrice ?? 0;
  const taxRate = city.propertyTaxPct ?? 0;

  const tighter = rent ? Math.round((rent * 12) / 0.35) : null;
  const target = rent ? Math.round((rent * 12) / 0.3) : null;
  const comfort = rent ? Math.round((rent * 12) / 0.28) : null;

  const affordabilityNote =
    rent <= 1700
      ? `${city.name} looks relatively affordable compared with many major US cities. Lower rent means your housing costs take a smaller share of your income, which helps both monthly budgeting and long-term saving.`
      : rent <= 2200
        ? `${city.name} sits in the mid-range for cost of living. Affordability depends significantly on your income level and whether you rent or own.`
        : `${city.name} is on the more expensive side for rent. Housing costs are likely to be one of the biggest factors in your monthly budget.`;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">

        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cost of Living in {city.name}, {city.state.toUpperCase()}
          </h1>

          <p className="mt-1 text-lg font-semibold text-slate-200">
            Rent, Housing Costs &amp; Salary Guide for {city.name}
          </p>

          <p className="max-w-2xl text-slate-300">
            The cost of living in {city.name} is shaped primarily by housing costs,
            state income taxes, and everyday expenses. This page covers average rent,
            median home prices, property tax rates, and the salary you need to live
            comfortably — with links to compare {city.name} against other cities.
          </p>

          <div className="text-xs text-slate-500">Assumptions updated: March 2026</div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
            >
              Compare Cities →
            </Link>
            <Link
              href={`/salary-needed-in/${city.id}`}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Salary Needed in {city.name}
            </Link>
            <Link
              href={`/fire-in/${city.id}`}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              FIRE in {city.name}
            </Link>
            <Link
              href={`/compare/nyc-ny/${city.id}`}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Compare {city.name} with NYC
            </Link>
          </div>
        </header>

        {/* Snapshot */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">
            {city.name} cost of living snapshot
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">Average rent</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {rent ? `$${rent.toLocaleString()} / mo` : "N/A"}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">Median home price</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {homePrice ? `$${homePrice.toLocaleString()}` : "N/A"}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">Property tax rate</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {typeof taxRate === "number" ? `${taxRate}%` : "N/A"}
              </div>
            </div>
          </div>

          {rent && target && tighter && comfort ? (
            <>
              <div className="mt-2 text-sm font-semibold text-slate-200">
                Salary needed in {city.name} (based on ${rent.toLocaleString()}/mo rent)
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { label: "Tighter (35% of income)", value: tighter },
                  { label: "Target (30% of income)", value: target },
                  { label: "Comfort (28% of income)", value: comfort },
                ].map((x) => (
                  <div key={x.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="text-xs text-slate-400">{x.label}</span>
                    <span className="text-sm font-semibold text-white">${x.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <p className="text-sm leading-relaxed text-slate-300">{affordabilityNote}</p>
        </section>

        {/* What affects affordability */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-xl font-semibold">
            Is {city.name} expensive to live in?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Housing is usually the largest monthly expense, so rent and home prices shape
              how affordable a city feels more than almost anything else. In {city.name},
              the average rent estimate is{" "}
              <span className="font-semibold text-white">
                {rent ? `$${rent.toLocaleString()} per month` : "not available"}
              </span>
              , with a median home price of{" "}
              <span className="font-semibold text-white">
                {homePrice ? `$${homePrice.toLocaleString()}` : "not available"}
              </span>.
            </p>
            <p>
              Property taxes matter more if you plan to buy. {city.name}'s property tax
              rate of{" "}
              <span className="font-semibold text-white">{taxRate}%</span> means annual
              taxes on a{" "}
              {homePrice ? `$${homePrice.toLocaleString()}` : "median-priced"} home would
              be roughly{" "}
              <span className="font-semibold text-white">
                {homePrice && taxRate
                  ? `$${Math.round((homePrice * taxRate) / 100).toLocaleString()} per year`
                  : "varies by home value"}
              </span>.
            </p>
            <p>
              State income taxes are also a key factor. The{" "}
              {city.state.toUpperCase()} state tax rate affects how much of each paycheck
              you actually keep — use the relocation calculator to see your estimated
              take-home pay in {city.name} based on your income.
            </p>
          </div>
        </section>

        {/* Tool links */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-xl font-semibold">
            Compare {city.name} with other cities
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Start with the cost of living snapshot above to understand the housing picture.
              Then check the salary needed page to estimate the income required to cover rent
              comfortably, and use the FIRE calculator to see how {city.name} could affect
              your timeline to financial independence.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/salary-needed-in/${city.id}`}
              className="inline-flex items-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Salary Needed in {city.name}
            </Link>
            <Link
              href={`/fire-in/${city.id}`}
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              FIRE in {city.name}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Full Relocation Calculator
            </Link>
          </div>
        </section>

        {/* Related cities */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-xl font-semibold">
            Cost of living in cities near {city.name}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCities.map((c) => (
              <Link
                key={c.id}
                href={`/cost-of-living/${c.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="text-sm font-semibold text-white">
                  Cost of living in {c.name}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {c.state.toUpperCase()} · Avg rent{" "}
                  {c.defaultRent ? `$${c.defaultRent.toLocaleString()}/mo` : "N/A"}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about {city.name}
          </h2>
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                What is the cost of living in {city.name}?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                The cost of living in {city.name} is driven primarily by housing. The average
                rent estimate is{" "}
                {rent ? `$${rent.toLocaleString()} per month` : "available in the snapshot above"},{" "}
                with a median home price of{" "}
                {homePrice ? `$${homePrice.toLocaleString()}` : "listed above"}.
                Use the full relocation calculator to see a complete monthly budget breakdown
                based on your income.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                What salary do you need to live in {city.name}?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                {target && comfort ? (
                  <>
                    Based on current rent estimates, a salary of around{" "}
                    <span className="font-semibold text-white">
                      ${target.toLocaleString()}
                    </span>{" "}
                    is a reasonable starting point for renters in {city.name} using the 30%
                    housing rule. A salary of{" "}
                    <span className="font-semibold text-white">
                      ${comfort.toLocaleString()}
                    </span>{" "}
                    provides more room for savings and unexpected costs.
                  </>
                ) : (
                  "Use the salary needed page for a full breakdown based on your income."
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Is {city.name} a good place to move for affordability?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                It depends on where you are moving from and your income level. Use the
                city comparison tool to see how {city.name} stacks up against other cities
                on rent, taxes, and take-home pay.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Does cost of living in {city.name} affect FIRE?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                Yes. Your FIRE number is based on annual spending. Lower living costs in{" "}
                {city.name} mean a smaller portfolio target and potentially years shaved off
                your financial independence timeline. See the FIRE in {city.name} page for
                a full breakdown.
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
            <Link href="/about" className="transition hover:text-white">About</Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-white">Disclaimer</Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
          </div>
        </div>

      </div>
    </main>
  );
}
