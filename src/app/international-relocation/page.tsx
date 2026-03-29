import type { Metadata } from "next";
import InternationalRelocationCalculator from "@/components/InternationalRelocationCalculator";

export const metadata: Metadata = {
  title: "International Relocation Cost Calculator",
  description:
    "Compare salary, taxes, rent, startup costs, and how much cash you may need before moving abroad.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            International Relocation Cost Calculator
          </h1>

         <p className="mx-auto mt-3 max-w-5xl text-sm text-slate-600 dark:text-slate-300 sm:text-base lg:whitespace-nowrap">
  Compare your move across countries using take-home income, taxes, housing, living costs, and one-time relocation expenses.
</p>

            <p className="mx-auto mt-3 max-w-4xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
      Built for early-stage planning. Use it to pressure-test whether a move abroad looks realistic before you commit.
    </p>


          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <InternationalRelocationCalculator />

        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Thinking Bigger Than Just Moving?
              </div>

              <p className="mt-1 text-sm text-slate-700">
                See how this relocation impacts your FIRE timeline.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <a
                  href="/fire-calculator"
                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  🔥 Calculate My FIRE Timeline
                </a>

                <div className="hidden h-5 w-px bg-emerald-200 sm:block" />

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
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
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              Thinking About Moving to Another Country?
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              A higher salary can shrink fast after taxes and housing. Compare
              take-home pay and real monthly costs before you relocate.
            </p>
          </div>
        </section>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <a href="/about" className="transition hover:text-slate-900 dark:hover:text-white">
              About
            </a>
            <span>•</span>
            <a href="/disclaimer" className="transition hover:text-slate-900 dark:hover:text-white">
              Disclaimer
            </a>
            <span>•</span>
            <a href="/privacy" className="transition hover:text-slate-900 dark:hover:text-white">
              Privacy
            </a>
            <span>•</span>
            <a href="/terms" className="transition hover:text-slate-900 dark:hover:text-white">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}