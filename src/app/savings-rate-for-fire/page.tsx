import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";

export const metadata: Metadata = {
  title: "Savings Rate for FIRE Calculator | How Saving More Accelerates Financial Independence",
  description:
    "See how your savings rate affects your timeline to financial independence. Compare savings rates from 10% to 70% and find out how many years each rate takes to reach FIRE.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/savings-rate-for-fire",
  },
  openGraph: {
    title: "Savings Rate for FIRE Calculator | How Saving More Accelerates Financial Independence",
    description:
      "See how your savings rate affects your timeline to financial independence. Compare savings rates from 10% to 70% and find out how many years each rate takes to reach FIRE.",
    url: "https://www.relocationbynumbers.com/savings-rate-for-fire",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Savings Rate for FIRE Calculator | How Saving More Accelerates Financial Independence",
    description:
      "See how your savings rate affects your timeline to financial independence.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Savings Rate for FIRE Calculator
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            How Much Should You Save to Reach Financial Independence?
          </p>

          <p className="max-w-4xl text-slate-300 leading-7">
            Your savings rate is one of the strongest levers in the entire FIRE equation.
            Raising it does not just increase how much you invest. It also reduces how much
            you spend, which lowers the portfolio you need to retire.
          </p>

          <p className="max-w-4xl text-sm leading-6 text-slate-400">
            That is why savings rate matters so much: it pushes both sides of the math at once.
            Higher savings grow the portfolio faster while lower spending shrinks the target.
          </p>

          <div className="text-xs text-slate-400">Assumptions updated: March 2026</div>

          <div className="pt-1">
            <Link
              href="/methodology"
              className="text-sm font-medium text-emerald-200 underline decoration-emerald-300/40 underline-offset-4 transition hover:text-emerald-100"
            >
              See methodology and data sources
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">FIRE calculator</Link>
            <Link href="/barista-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Barista FIRE</Link>
            <Link href="/coast-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Coast FIRE</Link>
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE</Link>
          </div>
        </header>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            Why savings rate matters so much for FIRE
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Most people think of savings rate as just a percentage of income invested each month.
              For FIRE, it matters more than that. It is one of the few variables that changes both
              how fast your portfolio grows and how much you ultimately need.
            </p>
            <p>
              If you save more, you are usually spending less. That means the target portfolio needed
              to support your lifestyle falls at the same time your invested assets are growing faster.
              That two-sided effect is why even moderate improvements in savings rate can shorten the
              timeline meaningfully.
            </p>
          </div>
        </section>

        <FireCalculator hideFAQ />

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            What changes the savings-rate result most
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">After-tax income</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Savings rate is most useful when measured against after-tax income, because that shows how much of your real spendable cash is being saved.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Annual spending</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Lower spending reduces the FIRE number directly, which is why savings rate and spending are so tightly connected.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Location</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Lower taxes or lower cost of living can increase your effective savings rate even without raising your salary.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Current portfolio and return assumptions</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Starting assets and long-term growth assumptions still matter, especially for people already partway to financial independence.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            What this calculator includes — and what it does not
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <h3 className="font-semibold text-white">Included</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                <li>Savings-rate scenario comparison</li>
                <li>Years to financial independence</li>
                <li>Projected FIRE age</li>
                <li>Location-aware tax and spending context</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
              <h3 className="font-semibold text-white">Not fully modeled</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                <li>Every tax edge case</li>
                <li>Sequence-of-returns risk in full detail</li>
                <li>All future lifestyle changes with precision</li>
                <li>Guaranteed investment outcomes</li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            This is a planning tool, not a certainty engine. It is most useful for understanding
            the direction and magnitude of savings-rate changes, not for predicting an exact retirement date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about savings rate and FIRE
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What savings rate do I need to reach FIRE?"
              a="It depends on your starting point, income, spending, and target timeline. In general, higher savings rates shorten the timeline dramatically because they both increase investing and reduce spending."
            />
            <SEOFAQItem
              q="How does savings rate affect my FIRE number?"
              a="Your FIRE number is based on annual spending, not income. When you save more, you usually spend less, which lowers the portfolio you need."
            />
            <SEOFAQItem
              q="How is savings rate calculated for FIRE?"
              a="Many people calculate it as after-tax savings divided by after-tax income. The key is to use one method consistently when comparing scenarios."
            />
            <SEOFAQItem
              q="What is a good savings rate for early retirement?"
              a="Many people view 25–30% as a strong base, 40–50% as aggressive, and 60%+ as very high. The right number depends on your income, lifestyle, and goals."
            />
            <SEOFAQItem
              q="Does location affect how much I can save?"
              a="Yes. Lower taxes and a lower cost of living can increase your effective savings rate without changing your gross salary."
            />
          </div>
        </section>

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-400">Assumptions updated: March 2026</div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/about" className="transition hover:text-white">About</Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-white">Disclaimer</Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <span>•</span>
            <Link href="/methodology" className="transition hover:text-white">Methodology</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}