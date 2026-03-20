import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCity, majorCities } from "@/lib/cities";

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
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:whitespace-nowrap">
            Is {city.name} a Good City for FIRE?
          </h1>

          <p className="max-w-5xl text-sm text-slate-300 lg:whitespace-nowrap">
            {city.name}, {city.state.toUpperCase()} could help accelerate financial independence depending on housing costs, property taxes, and overall cost of living.
          </p>

          <div className="text-xs text-slate-400">
            Assumptions updated: March 2026
          </div>

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

        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Related FIRE cities</h2>

            <div className="text-xs text-slate-400">
              Assumptions updated: March 2026
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {relatedCities.map((c) => (
              <Link
                key={c.id}
                href={`/best-cities-for-fire/${c.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="text-sm font-semibold text-white">{c.name}</div>

                <div className="mt-1 text-xs text-slate-400">
                  {c.state.toUpperCase()} • Rent {c.defaultRent ? `$${c.defaultRent.toLocaleString()}` : "N/A"}
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                  Assumptions updated: March 2026
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              Housing costs in {city.name}
            </h2>

            <div className="text-xs text-slate-400">
              Assumptions updated: March 2026
            </div>
          </div>

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
          <h2 className="mb-3 text-xl font-semibold">
            Try the FIRE calculator
          </h2>

          <p className="mb-4 text-sm text-slate-300">
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

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-400">
            Assumptions updated: March 2026
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/about" className="transition hover:text-white">
              About
            </Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-white">
              Disclaimer
            </Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}