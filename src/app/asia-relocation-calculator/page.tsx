import type { Metadata } from "next";
import AsiaRelocationCalculator from "@/components/AsiaRelocationCalculator";

export const metadata: Metadata = {
  title: "Asia Relocation Calculator | Cost of Living, Taxes & Budget by City",
  description:
    "Compare taxes, rent, living costs, and take-home pay across 30+ Asian and Gulf cities. Estimate your moving budget for Bangkok, Tokyo, Singapore, Manila, Taipei, Hong Kong, Dubai, Doha, Riyadh, Muscat, and more.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/asia-relocation-calculator",
  },
  openGraph: {
    title: "Asia Relocation Calculator | Cost of Living, Taxes & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across 30+ Asian and Gulf cities. Estimate your moving budget for Bangkok, Tokyo, Singapore, Manila, Taipei, Hong Kong, Dubai, Doha, Riyadh, Muscat, and more.",
    url: "https://www.relocationbynumbers.com/asia-relocation-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asia Relocation Calculator | Cost of Living, Taxes & Budget by City",
    description:
      "Compare taxes, rent, living costs, and take-home pay across 30+ Asian and Gulf cities.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Asia &amp; Middle East Relocation Calculator
          </h1>

          <p className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-300 sm:text-2xl">
            Compare Cost of Living, Taxes, Rent &amp; Moving Budget by City
          </p>

          <p className="mx-auto mt-3 max-w-4xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Compare taxes, rent, living costs, take-home pay, and one-time moving expenses
            across Southeast Asia, East Asia, South Asia, and the Gulf — including Bangkok,
            Tokyo, Singapore, Manila, Taipei, Hong Kong, Bangalore, Shanghai, Dubai, Doha,
            Riyadh, and Muscat.
          </p>

          <p className="mx-auto mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Use this calculator to pressure-test your budget before relocating to Asia or the Middle East.
          </p>

          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-rose-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
        <AsiaRelocationCalculator />

        {/* FIRE cross-sell */}
        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">Thinking Bigger Than Just Moving?</div>
              <p className="mt-1 text-sm text-slate-700">See how relocating to Asia or the Gulf impacts your FIRE timeline.</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <a href="/fire-calculator" className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  🔥 Calculate My FIRE Timeline
                </a>
                <div className="hidden h-5 w-px bg-emerald-200 sm:block" />
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <a href="/coast-fire-calculator" className="hover:text-slate-900">Coast FIRE</a>
                  <a href="/barista-fire-calculator" className="hover:text-slate-900">Barista FIRE</a>
                  <a href="/lean-fire-calculator" className="hover:text-slate-900">Lean FIRE</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Explore tools */}
        <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Explore more relocation planning tools</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">Keep comparing your options with more relocation, budgeting, and FIRE tools from Relocation by Numbers.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/explore" className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Explore all tools</a>
            <a href="/international-relocation" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">International Calculator</a>
            <a href="/caribbean-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Caribbean Calculator</a>
            <a href="/europe-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Europe Calculator</a>
            <a href="/south-america-relocation-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">South America Calculator</a>
            <a href="/fire-calculator" className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">FIRE Calculator</a>
          </div>
        </section>

        {/* What this calculator includes */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                What this Asia &amp; Gulf relocation calculator includes
              </h2>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                <p>
                  This calculator estimates how a move to Asia or the Middle East may affect
                  your monthly budget — covering income taxes, housing, living costs, and
                  one-time relocation expenses across 18 countries and 30+ cities.
                </p>
                <p>
                  City-level cost defaults cover Southeast Asia (Bangkok, Kuala Lumpur, Ho Chi
                  Minh City, Jakarta, Manila, Cebu), East Asia (Tokyo, Seoul, Taipei,
                  Hong Kong, Shanghai, Beijing), South Asia (Bangalore, Mumbai, Delhi,
                  Hyderabad), Pacific (Singapore, Sydney, Auckland), and the Gulf (Dubai,
                  Abu Dhabi, Doha, Riyadh, Muscat).
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Income and taxes</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Country-specific resident income tax models for all 18 destinations, with confidence badges showing estimate quality.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Housing and essentials</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Rent, utilities, groceries, transportation, and healthcare costs for each destination city.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Visa and permit context</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Visa programs, estimated permit fees, and key immigration notes for every destination — LTR, Golden Visa, digital nomad passes, and more.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Planning signals</div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Monthly flexibility, comparable salary, savings coverage, and a comfort score to judge whether the move looks realistic.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200/70 bg-rose-50 p-5 dark:border-rose-900/60 dark:bg-rose-950/30">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Good to know before you use it</div>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  Results are estimates only. Real taxes, rent, healthcare, immigration rules,
                  and household costs vary by residency status, visa path, and local market
                  conditions.
                </p>
                <p>
                  Most Asian and Gulf countries do not offer automatic long-term residency to
                  foreigners. Visa options range from Thailand's flexible LTR visa and
                  Malaysia's DE Rantau nomad pass to the UAE's Golden Visa and Singapore's
                  strict Employment Pass. Gulf states (Qatar, Saudi Arabia, Oman) require
                  employer sponsorship for most expats.
                </p>
                <p>
                  This tool is most useful for testing scenarios, comparing cities, and seeing
                  whether your income and savings create enough room to make the move comfortably.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Frequently asked questions
          </h2>
          <dl className="mt-5 space-y-5 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">Which Asian country is the cheapest to live in?</dt>
              <dd className="mt-1">Among the destinations in this calculator, Indonesia (Jakarta) and Vietnam (Ho Chi Minh City) have the lowest cost indexes, running roughly 40–55% of an average US city. The Philippines (Davao, Iloilo) and India (Chennai, Hyderabad) are similarly affordable. Malaysia and Thailand offer a strong combination of low cost, English proficiency, and expat infrastructure. Singapore, Hong Kong Central, and Tokyo are the most expensive Asian destinations in this calculator.</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">Does this calculator include Asian income taxes?</dt>
              <dd className="mt-1">Yes. Country-specific resident income tax models are applied for Thailand, Japan, Singapore, South Korea, Malaysia, Vietnam, Indonesia, the UAE, Qatar, Saudi Arabia, Oman, Australia, New Zealand, Taiwan, Hong Kong, the Philippines, India, and China. Dubai, Abu Dhabi, Doha, Riyadh, and Muscat have no personal income tax. Tax estimates are based on published resident rates as of early 2026 and are intended for planning purposes only.</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">What visa do I need to live in Thailand, Japan, or Singapore?</dt>
              <dd className="mt-1">Visa requirements vary significantly by country. Thailand offers a Long-Term Resident (LTR) visa for remote workers and retirees. Japan has a points-based Highly Skilled Professional visa and a 2024 Digital Nomad Visa. Singapore's Employment Pass is employer-sponsored and difficult to obtain independently. Gulf states require employer sponsorship — the UAE's Golden Visa is the most accessible long-term option. Always verify current visa rules with official government sources.</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">How much money do I need to relocate to Asia?</dt>
              <dd className="mt-1">One-time relocation costs for most Asian destinations in this calculator range from $2,000 to $7,000, covering visa fees, flights, a security deposit, and temporary accommodation. Gulf destinations (Dubai, Doha, Riyadh) typically run higher due to visa fees and setup costs. The ongoing monthly cost difference between your current city and the destination is often the more significant financial factor — use the calculator to estimate both.</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">Is it cheaper to live in Asia than in the US?</dt>
              <dd className="mt-1">For most Asian cities in this calculator, yes — often significantly. Bangkok, Kuala Lumpur, Manila, Bangalore, and Ho Chi Minh City all have cost indexes well below major US cities. Tokyo, Singapore, and Hong Kong are exceptions that can approach or exceed US city costs. Gulf destinations like Dubai and Doha sit in the mid range, but with zero personal income tax, take-home pay is often materially higher than in comparable US cities.</dd>
            </div>
          </dl>
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
