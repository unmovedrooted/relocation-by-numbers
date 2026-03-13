import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
    <a href="/about" className="transition hover:text-white">
      About
    </a>
    <span>•</span>
    <a href="/disclaimer" className="transition hover:text-white">
      Disclaimer
    </a>
    <span>•</span>
    <a href="/privacy" className="transition hover:text-white">
      Privacy
    </a>
    <span>•</span>
    <a href="/terms" className="transition hover:text-white">
      Terms
    </a>
  </div>

  if (!city) {
    return { title: "City not found" };
  }

  return {
    title: `Cost of Living in ${city.name} | Housing, Rent, and Taxes`,
    description: `See housing costs, rent, and home prices in ${city.name}, ${city.state.toUpperCase()} and compare how affordable it may be.`,
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

  const affordabilityNote =
    rent <= 1700
      ? `${city.name} looks relatively affordable compared with many major U.S. cities, especially on rent.`
      : rent <= 2200
        ? `${city.name} sits in the middle range for cost of living, so affordability depends a lot on your income and housing choice.`
        : `${city.name} is on the more expensive side for rent, so housing costs may have a bigger impact on your budget.`

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Cost of Living in {city.name}
          </h1>

          <p className="max-w-2xl text-slate-300">
            The cost of living in {city.name}, {city.state.toUpperCase()} depends heavily on
            housing, taxes, and everyday expenses. Rent and home prices usually matter the most.
          </p>

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
              Salary Needed Here
            </Link>

            <Link
              href={`/fire-in/${city.id}`}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              FIRE in {city.name}
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Cost of living snapshot</h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">Average rent</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {rent ? `$${rent.toLocaleString()}` : "N/A"}
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

          <p className="text-sm leading-relaxed text-slate-300">
            {affordabilityNote}
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">What affects affordability in {city.name}?</h2>

          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Housing is usually the largest monthly expense, so rent and home prices shape how
              affordable a city feels more than almost anything else.
            </p>
            <p>
              Property taxes matter more if you plan to buy, while rent tends to matter most for
              renters. The right city for you depends on whether you rent, buy, and how much of
              your income you want going toward housing.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Use this page with your other tools</h2>

          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Start with cost of living to understand the housing picture. Then check the salary
              needed page to estimate income requirements, and use the FIRE calculator to see how
              the city could affect your timeline to financial independence.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/salary-needed-in/${city.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Salary Needed in {city.name}
            </Link>

            <Link
              href={`/fire-in/${city.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              FIRE in {city.name}
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Related cities</h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCities.map((c) => (
              <Link
                key={c.id}
                href={`/cost-of-living-in/${c.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <div className="text-sm font-semibold text-white">{c.name}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {c.state.toUpperCase()} • Rent{" "}
                  {c.defaultRent ? `$${c.defaultRent.toLocaleString()}` : "N/A"}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">FAQ</h2>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Is {city.name} expensive?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                It depends mostly on housing. Rent and home prices are usually the biggest drivers
                of cost of living in any city.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                What salary do I need in {city.name}?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                A common rule of thumb is to keep housing around 30% of gross income for a more
                comfortable budget.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Does cost of living affect FIRE?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                Yes. Lower recurring expenses generally lower your FIRE number and can shorten your
                path to financial independence.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}