import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Cities for FIRE – Compare Cost of Living and FIRE Timelines",
  description:
    "Explore cities that can accelerate FIRE by lowering expenses. Compare cost of living, taxes, and how relocating may change your timeline to financial independence.",
};

const CITY_STARTERS = [
  { name: "New York City, NY", href: "/compare/nyc-ny/raleigh-nc" },
  { name: "San Francisco, CA", href: "/compare/sf-ca/austin-tx" },
  { name: "Boston, MA", href: "/compare/boston-ma/charlotte-nc" },
  { name: "Seattle, WA", href: "/compare/seattle-wa/denver-co" },
  { name: "Los Angeles, CA", href: "/compare/la-ca/phoenix-az" },
  { name: "Chicago, IL", href: "/compare/chicago-il/dallas-tx" },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Best Cities for FIRE
          </h1>
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
          <p className="text-slate-300 leading-relaxed">
            For most people pursuing FIRE, the biggest lever is{" "}
            <span className="font-semibold text-white">expenses</span>. Moving to a lower cost-of-living
            city can reduce your FIRE number and shorten the time to financial independence.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Compare cities →
            </Link>
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              FIRE calculator →
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h2 className="text-xl font-semibold">Quick comparisons to start with</h2>
          <p className="text-slate-300">
            These links jump you into common “high-cost → lower-cost” comparisons. Swap cities to match
            your situation.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {CITY_STARTERS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/10 transition"
              >
                <div className="text-sm font-semibold text-white">{c.name}</div>
                <div className="mt-1 text-xs text-slate-400">Open comparison →</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What makes a city “good for FIRE”?</h2>
          <div className="space-y-3 text-slate-300 leading-relaxed">
            <p>
              There’s no single best city for everyone. But cities that help people reach FIRE faster
              often have a few things in common:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Lower housing costs (rent or home price)</li>
              <li>Lower state/local taxes</li>
              <li>Access to jobs (or strong fit for remote work)</li>
              <li>Good quality of life for your priorities</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-lg font-semibold">Next step</h2>
          <p className="mt-2 text-slate-300">
            Use the relocation calculator to estimate your “after move” expenses, then plug that
            number into the FIRE calculator’s <span className="font-semibold text-white">Move Impact</span>{" "}
            section to see how many years relocating could save.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Compare cities →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}