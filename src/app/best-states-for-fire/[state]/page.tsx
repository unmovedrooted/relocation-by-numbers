import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES } from "@/lib/states";
import { citiesForState } from "@/lib/cities";

type PageProps = {
  params: Promise<{ state: string }>;
};

function slugifyState(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

const STATE_PAGES = STATES.map((s) => ({
  code: s.code,
  name: s.name,
  slug: slugifyState(s.name),
}));

export async function generateStaticParams() {
  return STATE_PAGES.map((s) => ({
    state: s.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params;
  const found = STATE_PAGES.find((s) => s.slug === state);

  if (!found) {
    return {
      title: "State not found",
    };
  }

  return {
    title: `Is ${found.name} Good for FIRE? | Best State for FIRE`,
    description: `See whether ${found.name} is a good state for FIRE based on taxes, housing costs, and cost of living.`,
  };
}

export default async function BestStateForFirePage({ params }: PageProps) {
  const { state } = await params;
  const found = STATE_PAGES.find((s) => s.slug === state);

  if (!found) return notFound();

  const stateCities = citiesForState(found.code).filter((c) => !c.id.startsWith("other-"));
  const featuredCities = stateCities.slice(0, 3);

    const relatedStates = STATE_PAGES
    .filter((s) => s.slug !== found.slug)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Is {found.name} a Good State for FIRE?
          </h1>

          <p className="max-w-2xl text-sm text-slate-300 leading-relaxed">
            {found.name} may be a strong state for financial independence depending on
            taxes, housing costs, and how expensive daily life is compared with where
            you live now.
          </p>

          <div className="flex flex-wrap gap-2">
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
          <h2 className="text-xl font-semibold">
            Why {found.name} could be good for FIRE
          </h2>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              The best state for FIRE is usually the one that helps you keep expenses
              low while maintaining the lifestyle you want. Housing, taxes, and
              transportation costs often matter more than small differences in salary.
            </p>

            <p>
              If moving to {found.name} lowers your monthly expenses, your FIRE number
              may drop and your timeline to financial independence may shorten.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">
            Cities to explore in {found.name}
          </h2>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
  <h2 className="text-xl font-semibold">Related states for FIRE</h2>

  <div className="grid gap-3 sm:grid-cols-2">
    {relatedStates.map((s) => (
      <Link
        key={s.code}
        href={`/best-state-for-fire/${s.slug}`}
        className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
      >
        <div className="text-sm font-semibold text-white">{s.name}</div>
        <div className="mt-1 text-xs text-slate-400">
          Explore FIRE-friendly cities in {s.name}
        </div>
      </Link>
    ))}
  </div>
</section>

          <div className="grid gap-3 sm:grid-cols-3">
            {featuredCities.map((city) => (
              <Link
                key={city.id}
                href={`/best-cities-for-fire/${city.id}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <div className="text-sm font-semibold text-white">{city.name}</div>
                <div className="mt-2 text-xs text-slate-400">
                  Rent: {city.defaultRent ? `$${city.defaultRent.toLocaleString()}` : "N/A"}
                </div>
                <div className="text-xs text-slate-400">
                  Home price: {city.medianHomePrice ? `$${city.medianHomePrice.toLocaleString()}` : "N/A"}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Next step</h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Compare your current city against places in {found.name}, then use the FIRE
            calculator to estimate how lower expenses could change your timeline.
          </p>

          <div className="flex flex-wrap gap-3">
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
      </div>
    </main>
  );
}