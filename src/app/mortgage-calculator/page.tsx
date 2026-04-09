import type { Metadata } from "next";
import MortgageCalculator from "@/components/MortgageCalculator";

export const metadata: Metadata = {
  title: "Mortgage Calculator | US & International Home Buying, Rent vs Buy & Affordability",
  description:
    "Calculate mortgage payments, total interest, rent vs buy break-even, and affordability for US and international home purchases. Plan your home buying decision with a clearer budget.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold tracking-widest text-violet-700 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
            🏠 MORTGAGE & HOME BUYING
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Mortgage Calculator | US &amp; International Home Buying, Rent vs Buy &amp; Affordability
          </h1>

          <p className="mx-auto mt-3 max-w-5xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Compare mortgage payments, total interest, rent vs buy break-even, and affordability across US and international markets. Make your home buying decision with a clearer picture.
          </p>

          <p className="mx-auto mt-2 max-w-4xl text-sm text-slate-500 dark:text-slate-400">
            Use this mortgage calculator to pressure-test your budget before buying at home or abroad.
          </p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-violet-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <MortgageCalculator />

        {/* Relocation cross-sell */}
        <section className="rounded-2xl border border-violet-200/60 bg-violet-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Planning to buy abroad after relocating?
              </div>
              <p className="mt-1 text-sm text-slate-700">
                Start with one of our relocation calculators to check your monthly budget first.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <a href="/europe-relocation-calculator" className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  🇪🇺 Europe
                </a>
                <a href="/asia-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  🌏 Asia
                </a>
                <a href="/caribbean-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  🌴 Caribbean
                </a>
                <a href="/south-america-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  🌎 South America
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Explore tools */}
        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Explore more planning tools
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Keep planning with more relocation, budgeting, and FIRE tools from Relocation by Numbers.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/explore" className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Explore all tools
            </a>
            <a href="/fire-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              FIRE Calculator
            </a>
            <a href="/international-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              International Relocation
            </a>
            <a href="/best-cities-for-fire" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Best Cities for FIRE
            </a>
          </div>
        </section>

        {/* What this calculator includes */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                What this calculator includes
              </h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                <p>
                  This calculator covers the full home buying decision — from monthly payments
                  and total interest to rent vs buy break-even and whether you can realistically
                  afford to buy in a given market.
                </p>
                <p>
                  Use the US tab for domestic planning or the International tab to explore
                  buying abroad after a relocation — with foreign buyer considerations built in.
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { title: "Monthly payment", body: "Principal, interest, taxes, insurance, and HOA — broken down clearly." },
                  { title: "Total interest", body: "See the full cost of your loan over its life, and how extra payments change the picture." },
                  { title: "Rent vs buy", body: "Break-even timeline that accounts for opportunity cost of your down payment." },
                  { title: "Affordability", body: "Front-end and back-end DTI ratios versus standard lender guidelines." },
                ].map(item => (
                  <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-violet-200/70 bg-violet-50 p-5 dark:border-violet-900/60 dark:bg-violet-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Good to know before you use it</div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Actual mortgage rates, tax treatment, insurance costs,
                  and lender requirements vary by location, credit profile, and loan type.
                </p>
                <p>
                  The international tab is designed for post-relocation planning — it reflects common
                  foreign buyer considerations like larger down payment requirements, higher rates,
                  and currency risk. Always consult a local mortgage broker before committing.
                </p>
                <p>
                  The rent vs buy break-even assumes consistent rent growth and home appreciation.
                  Real outcomes vary significantly based on local market conditions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <a href="/about" className="transition hover:text-slate-900 dark:hover:text-white">About</a>
            <span>•</span>
            <a href="/disclaimer" className="transition hover:text-slate-900 dark:hover:text-white">Disclaimer</a>
            <span>•</span>
            <a href="/privacy" className="transition hover:text-slate-900 dark:hover:text-white">Privacy</a>
            <span>•</span>
            <a href="/terms" className="transition hover:text-slate-900 dark:hover:text-white">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
