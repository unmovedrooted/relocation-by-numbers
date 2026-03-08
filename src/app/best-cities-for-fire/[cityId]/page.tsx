import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, findCity, majorCities } from "@/lib/cities";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

export async function generateStaticParams() {
  return majorCities().map((c) => ({
    cityId: c.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cityId } = await params;
  const city = findCity(cityId);

  if (!city) {
    return {
      title: "City not found",
    };
  }

  return {
    title: `Is ${city.name} Good for FIRE? | Early Retirement City Guide`,
    description: `See whether ${city.name}, ${city.state.toUpperCase()} is a good city for FIRE based on housing costs, taxes, and cost of living.`,
  };
}

export default async function CityFirePage({ params }: PageProps) {
  const { cityId } = await params;

  const city = findCity(cityId);
  if (!city) return notFound();

    const relatedCities = majorCities()
    .filter((c) => c.id !== city.id && c.state !== city.state)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">

        <header className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Is {city.name} a Good City for FIRE?
          </h1>

          <p className="text-sm text-slate-300 max-w-2xl">
            {city.name}, {city.state.toUpperCase()} could help accelerate financial independence
            depending on housing costs, property taxes, and overall cost of living.
          </p>

          <div className="flex flex-wrap gap-2">

            <Link
              href="/fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              FIRE Calculator
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
            >
              Compare Cities →
            </Link>

          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
  <h2 className="text-xl font-semibold">Related FIRE cities</h2>

  <div className="grid gap-3 sm:grid-cols-2">
    {relatedCities.map((c) => (
      <Link
        key={c.id}
        href={`/best-cities-for-fire/${c.id}`}
        className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
      >
        <div className="text-sm font-semibold text-white">{c.name}</div>
        <div className="mt-1 text-xs text-slate-400">
          {c.state.toUpperCase()} • Rent {c.defaultRent ? `$${c.defaultRent.toLocaleString()}` : "N/A"}
        </div>
      </Link>
    ))}
  </div>
</section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h2 className="text-xl font-semibold">
            Housing costs in {city.name}
          </h2>

          <p className="text-sm text-slate-300">
            Median home price: <strong>${city.medianHomePrice?.toLocaleString() ?? "N/A"}</strong>
          </p>

          <p className="text-sm text-slate-300">
            Typical rent: <strong>${city.defaultRent?.toLocaleString() ?? "N/A"}</strong>
          </p>

          <p className="text-sm text-slate-300">
            Property tax rate: <strong>{city.propertyTaxPct}%</strong>
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-xl font-semibold mb-3">
            Try the FIRE calculator
          </h2>

          <p className="text-sm text-slate-300 mb-4">
            Use our calculator to estimate how moving to {city.name}
            might impact your timeline to financial independence.
          </p>

          <Link
            href="/fire-calculator"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
          >
            Open FIRE Calculator
          </Link>
        </section>

      </div>
    </main>
  );
}