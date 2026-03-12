import Calculator from "@/components/Calculator";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";


export const metadata = {
  title: "Relocation Affordability Calculator by State",
  description:
    "Compare take-home pay, housing costs, and property taxes across all 50 states.",
};

const POPULAR = [
  { href: "/compare/nyc-ny/charlotte-nc", label: "NYC vs Charlotte" },
  { href: "/compare/la-ca/austin-tx", label: "LA vs Austin" },
  { href: "/compare/seattle-wa/dallas-tx", label: "Seattle vs Dallas" },
  { href: "/compare/boston-ma/miami-fl", label: "Boston vs Miami" },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Page header (normalized) */}
      <header className="py-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          See How Far Your Salary Goes in Another State
        </h1>

        <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-300">
          Compare taxes, housing costs, and real affordability before you move.
        </p>

        <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-600/80" />
      </header>

  {/* FIRE CTA */}

<section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
  <div className="flex items-center justify-between gap-6">

    <div>
      <div className="text-sm font-semibold text-slate-900">
        Thinking Bigger Than Just Moving?
      </div>

      <p className="mt-1 text-sm text-slate-700">
        See how this relocation impacts your FIRE timeline.
      </p>

      <div className="mt-3 flex items-center gap-4 flex-wrap">
        <a
          href="/fire-calculator"
          className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          🔥 Calculate My FIRE Timeline
        </a>

        <div className="h-5 w-px bg-emerald-200" />

        <div className="flex items-center gap-5 text-sm text-slate-600">
          <a href="/coast-fire-calculator" className="hover:text-slate-900">
            Coast FIRE
          </a>

          <a href="/barista-fire-calculator" className="hover:text-slate-900">
            Barista FIRE
          </a>

          <a href="/lean-fire-calculator" className="hover:text-slate-900">
            Lean FIRE
          </a>
        </div>
      </div>
    </div>

    {/* Ad */}
{/* 
    <div className="min-w-[250px] hidden lg:block">
      <AdSlot />
    </div>
    */}

  </div>
</section>

        {/* Popular comparisons (card) */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Thinking About Moving to Another State?
            </h2>

            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              A higher salary can shrink fast after taxes and housing. Compare take-home pay and real monthly
              costs before you relocate.
            </p>

            <div className="mt-5 text-xs font-semibold tracking-widest text-slate-500">
              POPULAR COMPARISONS
            </div>

            {/* Pills (half-size, true chips) */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {POPULAR.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

                {/* SEO internal links */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Popular relocation comparisons
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Link href="/compare/nyc-ny/raleigh-nc" className="text-blue-600 hover:underline dark:text-blue-400">
              Moving from NYC to Raleigh
            </Link>
            <Link href="/compare/la-ca/austin-tx" className="text-blue-600 hover:underline dark:text-blue-400">
              Moving from Los Angeles to Austin
            </Link>
            <Link href="/compare/seattle-wa/denver-co" className="text-blue-600 hover:underline dark:text-blue-400">
              Moving from Seattle to Denver
            </Link>
            <Link href="/compare/boston-ma/miami-fl" className="text-blue-600 hover:underline dark:text-blue-400">
              Moving from Boston to Miami
            </Link>
            <Link href="/compare/sf-ca/charlotte-nc" className="text-blue-600 hover:underline dark:text-blue-400">
              Moving from San Francisco to Charlotte
            </Link>
            <Link href="/compare/chicago-il/dallas-tx" className="text-blue-600 hover:underline dark:text-blue-400">
              Moving from Chicago to Dallas
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Financial Independence Tools
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Link href="/fire-calculator" className="text-blue-600 hover:underline dark:text-blue-400">
              FIRE calculator
            </Link>
            <Link href="/fire-with-100k-salary" className="text-blue-600 hover:underline dark:text-blue-400">
              FIRE with 100k salary
            </Link>
            <Link href="/fire-with-150k-salary" className="text-blue-600 hover:underline dark:text-blue-400">
              FIRE with 150k salary
            </Link>
            <Link href="/best-cities-for-fire" className="text-blue-600 hover:underline dark:text-blue-400">
              Best cities for FIRE
            </Link>
            <Link href="/best-states-for-fire" className="text-blue-600 hover:underline dark:text-blue-400">
              Best states for FIRE
            </Link>
          </div>
        </section>
      
    </main>

    
  );
}