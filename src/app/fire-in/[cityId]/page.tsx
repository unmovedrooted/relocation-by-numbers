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

  if (!city) {
    return { title: "City not found" };
  }

  return {
    title: `FIRE in ${city.name} | Can You Retire Early There?`,
    description: `Estimate how living in ${city.name}, ${city.state.toUpperCase()} affects your financial independence timeline.`,
  };
}

export default async function Page({ params }: Props) {
  const { cityId } = await params;
  const city = findCity(cityId);

  if (!city) return notFound();

  const relatedCities = majorCities()
    .filter((c) => c.id !== city.id)
    .slice(0, 6);

  const affordabilityNote =
    typeof city.defaultRent === "number"
      ? city.defaultRent <= 1700
        ? `${city.name} may be relatively helpful for FIRE because rent is lower than many major U.S. cities.`
        : city.defaultRent <= 2200
          ? `${city.name} sits in a middle range for rent, so FIRE potential will depend heavily on your income and savings rate.`
          : `${city.name} is on the pricier side for rent, which can slow FIRE unless income is strong or housing costs are managed carefully.`
      : `${city.name} may still be worth comparing, especially if you can lower overall expenses relative to your current city.`;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            FIRE in {city.name}
          </h1>

          <p className="max-w-2xl text-slate-300">
            Reaching financial independence in {city.name}, {city.state.toUpperCase()}{" "}
            depends heavily on housing costs, taxes, and your savings rate.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              FIRE Calculator
            </Link>

            <Link
              href="/best-cities-for-fire"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Best Cities for FIRE
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
            >
              Compare Cities →
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-xl font-semibold">FIRE snapshot: {city.name}</h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">Average rent</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {city.defaultRent ? `$${city.defaultRent.toLocaleString()}` : "N/A"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">Median home price</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {city.medianHomePrice ? `$${city.medianHomePrice.toLocaleString()}` : "N/A"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">Property tax rate</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {typeof city.propertyTaxPct === "number" ? `${city.propertyTaxPct}%` : "N/A"}
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">
            {affordabilityNote}
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Why {city.name} could matter for FIRE</h2>

          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Your path to FIRE is driven mostly by the gap between what you earn and what you spend.
              That means a city with lower rent or housing costs can reduce your required FIRE number
              and shorten the years it takes to reach financial independence.
            </p>

            <p>
              In {city.name}, the biggest variables are likely housing and taxes. Even if salary is a little
              lower than a more expensive city, your timeline can still improve if your monthly costs drop enough.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">How to use this page</h2>

          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Start by comparing your current city to {city.name} in the relocation calculator. Then use the
              FIRE calculator to test how lower or higher expenses affect your FIRE age.
            </p>

            <p>
              A simple way to test this is to plug in your current income, current savings, and expected yearly
              investment, then adjust your monthly expenses to match what life in {city.name} might actually cost.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Compare Cities →
            </Link>

            <Link
              href="/fire-calculator"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Open FIRE Calculator
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Related FIRE cities</h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCities.map((c) => (
              <Link
                key={c.id}
                href={`/fire-in/${c.id}`}
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
                Is {city.name} good for FIRE?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                It can be, depending on your income and housing costs. Lower expenses generally make FIRE easier,
                but taxes, home prices, and lifestyle still matter.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Does housing cost affect FIRE a lot?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                Yes. Housing is usually the biggest recurring expense, so changes in rent or mortgage costs
                can have a major impact on your FIRE number.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Should I compare cities before planning FIRE?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                Absolutely. A move to a lower cost-of-living city can sometimes improve your FIRE timeline
                more than a small raise.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}