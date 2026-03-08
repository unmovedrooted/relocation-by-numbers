import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
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

  return {
    title: `Salary Needed to Live in ${city.name} | Cost of Living Guide`,
    description: `Estimate the salary needed to live comfortably in ${city.name}, ${city.state.toUpperCase()} based on housing costs and taxes.`,
  };
}

export default async function Page({ params }: Props) {
  const { cityId } = await params;
  const city = findCity(cityId);

  if (!city) return notFound();

  const rent = city.defaultRent ?? 0;

  const comfortableSalary = Math.round((rent * 3 * 12) / 0.30);
  const basicSalary = Math.round((rent * 3 * 12) / 0.40);

  const relatedCities = majorCities()
    .filter((c) => c.id !== city.id)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">

        <h1 className="text-3xl font-semibold">
          Salary Needed to Live in {city.name}
        </h1>

        <p className="text-slate-300 max-w-2xl">
          Housing costs are usually the biggest factor in the salary needed
          to live comfortably in {city.name}, {city.state.toUpperCase()}.
        </p>

        {/* Salary estimates */}

        <div className="grid gap-4 sm:grid-cols-2">

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">
              Estimated comfortable salary
            </div>

            <div className="text-2xl font-semibold mt-2">
              ${comfortableSalary.toLocaleString()}
            </div>

            <div className="text-xs text-slate-400 mt-1">
              assumes housing = 30% of income
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">
              Minimum salary estimate
            </div>

            <div className="text-2xl font-semibold mt-2">
              ${basicSalary.toLocaleString()}
            </div>

            <div className="text-xs text-slate-400 mt-1">
              assumes housing = 40% of income
            </div>
          </div>

        </div>

        {/* Housing snapshot */}

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-2">

          <div>Average rent: ${city.defaultRent?.toLocaleString()}</div>

          <div>
            Median home price: ${city.medianHomePrice?.toLocaleString()}
          </div>

          <div>
            Property tax rate: {city.propertyTaxPct}%
          </div>

        </div>

        {/* Calculator links */}

        <div className="flex gap-3 flex-wrap">

          <Link
            href="/"
            className="rounded-xl bg-emerald-400 px-4 py-2 font-semibold text-slate-900"
          >
            Compare Cities →
          </Link>

          <Link
            href="/fire-calculator"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2"
          >
            FIRE Calculator
          </Link>

        </div>

        {/* Related cities */}

        <div className="space-y-3">

          <h2 className="text-xl font-semibold">
            Related cities
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {relatedCities.map((c) => (
              <Link
                key={c.id}
                href={`/salary-needed-in/${c.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
              >
                {c.name}
              </Link>
            ))}

          </div>

        </div>

      </div>
    </main>
  );
}