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
                International Relocation Calculator | Moving Abroad Cost, Taxes, Rent & Budget

          </h1>

         <p className="mx-auto mt-3 max-w-5xl text-sm text-slate-600 dark:text-slate-300 sm:text-base lg:whitespace-nowrap">
    Compare taxes, rent, living costs, take-home pay, and one-time moving expenses when relocating abroad. Plan an international move with a clearer budget.
</p>

     <p className="mx-auto mt-2 max-w-4xl text-sm text-slate-500 dark:text-slate-400">
  Use this international move calculator to pressure-test your budget before relocating overseas.
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

        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
    Explore more relocation planning tools
  </h2>

  <p className="mt-2 text-sm leading-6 text-slate-700">
    Keep comparing your options with more relocation, budgeting, and FIRE tools from Relocation by Numbers.
  </p>

  <div className="mt-4 flex flex-wrap gap-3">
    <a
      href="/explore"
      className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
    >
      Explore all tools
    </a>
    <a
      href="/fire-calculator"
      className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      FIRE Calculator
    </a>
    <a
      href="/best-cities-for-fire"
      className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Best Cities for FIRE
    </a>
  </div>
</section>

<section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
  <div className="grid gap-6 lg:grid-cols-2">
    <div>
      <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        What this calculator includes
      </h2>

      <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
        <p>
          This calculator estimates how a move abroad may affect your monthly budget
          using income, taxes, housing, living costs, and one-time relocation expenses.
        </p>

        <p>
          It is built for planning, not exact prediction. The goal is to help you compare
          locations consistently before you commit to a move.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            Income and taxes
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Estimated take-home income based on your salary, filing status, country,
            and selected tax model.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            Housing and essentials
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Rent, utilities, groceries, transportation, and healthcare adjusted
            for the selected destination scenario.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            One-time move costs
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Deposit, first month rent, visa fees, travel, setup costs, and a
            recommended emergency buffer.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            Planning signals
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Monthly flexibility, comparable salary, savings coverage, and comfort
            score to help you judge whether the move looks realistic.
          </p>
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-blue-200/70 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">
        Good to know before you use it
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
        <p>
          Results are estimates only. Real taxes, rent, healthcare, immigration
          rules, and household costs vary by residency status, visa path, and local market conditions.
        </p>

        <p>
          The current-city side is best treated as a normalized comparison when you enter
          destination-based budget assumptions. That makes the destination view coherent,
          while the current side acts more like a planning baseline than a perfect snapshot
          of what you spend today.
        </p>

        <p>
          This tool is most useful for testing scenarios, comparing countries, and seeing
          whether your income and savings create enough room to make the move comfortably.
        </p>
      </div>
    </div>
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