import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
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

  const title = `Salary Needed to Live in ${city.name}, ${city.state.toUpperCase()} (2026)`;
  const description = `How much salary do you need to live comfortably in ${city.name}? See estimates based on rent, housing costs, and the 30% income rule — plus a minimum salary for tighter budgets.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/salary-needed-in/${cityId}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.relocationbynumbers.com/salary-needed-in/${cityId}`,
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

  const rent = city.defaultRent ?? 0;

  const comfortableSalary = Math.round((rent * 3 * 12) / 0.30);
  const basicSalary = Math.round((rent * 3 * 12) / 0.40);

  const relatedCities = majorCities()
    .filter((c) => c.id !== city.id)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">

        <header className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Salary Needed to Live in {city.name}, {city.state.toUpperCase()}
          </h1>

          <p className="mt-2 text-base font-semibold text-slate-200">
            How Much Do You Need to Earn to Live Comfortably in {city.name}?
          </p>

          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Housing costs are the biggest driver of the salary you need in{" "}
            {city.name}. These estimates use the 30% income rule — the common
            guideline that housing should not exceed 30% of your gross income —
            alongside a tighter 40% threshold for a minimum baseline.
          </p>

          <div className="text-xs text-slate-500">Assumptions updated: March 2026</div>
        </header>

        {/* Salary estimates */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">Comfortable salary in {city.name}</div>
            <div className="text-2xl font-semibold mt-2">
              ${comfortableSalary.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Based on housing at 30% of gross income
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">Minimum salary estimate</div>
            <div className="text-2xl font-semibold mt-2">
              ${basicSalary.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Based on housing at 40% of gross income — tighter budget
            </div>
          </div>
        </section>

        {/* Housing snapshot */}
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            {city.name} housing snapshot
          </h2>
          <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-xs text-slate-400">Average rent</div>
              <div className="mt-1 font-semibold text-white">
                ${city.defaultRent?.toLocaleString()} / mo
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-xs text-slate-400">Median home price</div>
              <div className="mt-1 font-semibold text-white">
                ${city.medianHomePrice?.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-xs text-slate-400">Property tax rate</div>
              <div className="mt-1 font-semibold text-white">
                {city.propertyTaxPct}%
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Rent and home price figures are estimates for planning purposes.
            Real costs vary by neighborhood, unit type, and market conditions.
          </p>
        </section>

        {/* Explanation */}
        <section className="space-y-3 text-sm leading-7 text-slate-300 max-w-2xl">
          <h2 className="text-lg font-semibold text-white">
            How the salary estimate works
          </h2>
          <p>
            These figures use the average rent in {city.name} as the basis.
            The comfortable salary assumes housing costs 30% of your gross
            income — a widely used guideline for financial stability. The
            minimum estimate uses 40%, which leaves less room for savings,
            emergencies, or debt repayment.
          </p>
          <p>
            Neither figure accounts for state income taxes, which reduce your
            take-home pay and effectively raise the gross salary you need. Use
            the relocation calculator to see how {city.state.toUpperCase()} taxes
            affect your real take-home pay.
          </p>
        </section>

        {/* CTA links */}
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/"
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:opacity-90"
          >
            Compare Cities →
          </Link>
          <Link
            href={`/cost-of-living/${cityId}`}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Full Cost of Living Guide for {city.name}
          </Link>
          <Link
            href="/fire-calculator"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            FIRE Calculator
          </Link>
        </div>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about living in {city.name}
          </h2>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            <div>
              <div className="font-semibold text-white">
                What salary do you need to live comfortably in {city.name}?
              </div>
              <p className="mt-1">
                Based on current rent estimates, a salary of around{" "}
                <span className="font-semibold text-white">
                  ${comfortableSalary.toLocaleString()}
                </span>{" "}
                is a comfortable starting point for most renters in {city.name},
                assuming housing costs around 30% of gross income. At a tighter
                40% ratio, the minimum estimate is{" "}
                <span className="font-semibold text-white">
                  ${basicSalary.toLocaleString()}
                </span>.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white">
                How much is rent in {city.name}?
              </div>
              <p className="mt-1">
                The average rent estimate used in this calculation is{" "}
                <span className="font-semibold text-white">
                  ${city.defaultRent?.toLocaleString()} per month
                </span>
                . Actual rents vary by neighborhood, apartment size, and market
                conditions. This is a planning estimate, not a current market rate.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white">
                Is {city.name} expensive to live in?
              </div>
              <p className="mt-1">
                It depends on where you are coming from. Use the city comparison
                tool to see how {city.name} stacks up against other major cities
                on rent, taxes, and take-home pay side by side.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white">
                Does state income tax affect the salary I need in {city.name}?
              </div>
              <p className="mt-1">
                Yes. {city.state.toUpperCase()} state income tax reduces your
                take-home pay, which means your gross salary needs to be higher
                to cover the same expenses. The relocation calculator applies
                state-specific tax estimates so you can see your real net income.
              </p>
            </div>
          </div>
        </section>

        {/* Related cities */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            Salary needed in other cities
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCities.map((c) => (
              <Link
                key={c.id}
                href={`/salary-needed-in/${c.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-medium text-slate-200 hover:bg-white/10"
              >
                Salary needed in {c.name} →
              </Link>
            ))}
          </div>
        </section>

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-500">
            Assumptions updated: March 2026
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <a href="/about" className="transition hover:text-white">About</a>
            <span>•</span>
            <a href="/disclaimer" className="transition hover:text-white">Disclaimer</a>
            <span>•</span>
            <a href="/privacy" className="transition hover:text-white">Privacy</a>
            <span>•</span>
            <a href="/terms" className="transition hover:text-white">Terms</a>
          </div>
        </footer>

      </div>
    </main>
  );
}
