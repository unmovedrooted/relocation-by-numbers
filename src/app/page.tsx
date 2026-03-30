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
      {/* Page header */}
      <header className="py-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          See How Far Your Salary Goes in Another State
        </h1>

        <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-300">
          Compare taxes, housing costs, and real affordability before you move.
        </p>

        <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-600/80" />
      </header>

      <div className="text-center">
  <Link
    href="/methodology"
    className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-900 dark:text-slate-300 dark:decoration-slate-600 dark:hover:text-white"
  >
    See methodology and data sources
  </Link>
</div>

      {/* Main content container */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-12 space-y-10">
        <Calculator monetization="home" />

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
              <Link
  href="/fire-calculator"
  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
>
  🔥 Calculate My FIRE Timeline
</Link>

                <div className="h-5 w-px bg-emerald-200" />

                <div className="flex items-center gap-5 text-sm text-slate-600">
                 <Link href="/coast-fire-calculator" className="hover:text-slate-900">
  Coast FIRE
</Link>

<Link href="/barista-fire-calculator" className="hover:text-slate-900">
  Barista FIRE
</Link>

<Link href="/lean-fire-calculator" className="hover:text-slate-900">
  Lean FIRE
</Link>
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

        <section className="rounded-2xl border border-sky-200/60 bg-sky-50 p-5">
  <div className="flex items-center justify-between gap-6">
    <div>
      <div className="text-sm font-semibold text-slate-900">
        Planning a Move Abroad?
      </div>

      <p className="mt-1 text-sm text-slate-700">
        Compare taxes, rent, living costs, and take-home pay across countries before you relocate.
      </p>

      <div className="mt-3">
        <Link
          href="/international-relocation"
          className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Explore International Relocation →
        </Link>
      </div>
    </div>
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


<div className="mt-5">
  <Link
    href="/compare"
    className="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
  >
    Explore all relocation comparisons →
  </Link>
</div>
          </div>
        </section>

        <div className="mt-8 text-center">
  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
    Popular cost of living
  </div>

  <div className="mt-4 flex flex-wrap justify-center gap-3">
    {[
      { href: "/cost-of-living/charlotte-nc", label: "Charlotte" },
      { href: "/cost-of-living/nyc-ny", label: "NYC" },
      { href: "/cost-of-living/austin-tx", label: "Austin" },
      { href: "/cost-of-living/la-ca", label: "Los Angeles" },
      { href: "/cost-of-living/seattle-wa", label: "Seattle" },
      { href: "/cost-of-living/boston-ma", label: "Boston" },
      { href: "/cost-of-living/miami-fl", label: "Miami" },
    ].map((x) => (
      <Link
        key={x.href}
        href={x.href}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        {x.label}
      </Link>
    ))}
  </div>
</div>


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
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
  <div className="text-center">
    <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
      Explore More Relocation Tools
    </h2>

    <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
      Browse calculators, salary tools, cost of living pages, and FIRE planning resources in one place.
    </p>

    <div className="mt-5">
      <Link
        href="/explore"
        className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Explore All Tools
      </Link>
    </div>
  </div>
</section>
 

      <footer className="border-t border-slate-200 bg-slate-50">
  <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <a href="/about" className="transition hover:text-slate-900">
        About
      </a>
      <span>•</span>
      <a href="/disclaimer" className="transition hover:text-slate-900">
        Disclaimer
      </a>
      <span>•</span>
      <a href="/privacy" className="transition hover:text-slate-900">
        Privacy
      </a>
      <span>•</span>
      <a href="/terms" className="transition hover:text-slate-900">
        Terms
      </a>
    </div>
    
  </div>
  
</footer>

    </main>
  );
}