import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";

export const metadata: Metadata = {
  title: "Savings Rate for FIRE Calculator | How Saving More Accelerates Financial Independence",
  description:
    "See how your savings rate affects your timeline to financial independence. Compare savings rates from 10% to 70% and find out how many years each rate takes to reach FIRE.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/savings-rate-fire-calculator",
  },
  openGraph: {
    title: "Savings Rate for FIRE Calculator | How Saving More Accelerates Financial Independence",
    description:
      "See how your savings rate affects your timeline to financial independence. Compare savings rates from 10% to 70% and find out how many years each rate takes to reach FIRE.",
    url: "https://www.relocationbynumbers.com/savings-rate-fire-calculator",
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
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">

        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Savings Rate for FIRE Calculator
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            How Much Should You Save to Reach Financial Independence?
          </p>

          <p className="max-w-4xl text-slate-300">
            Your savings rate is one of the most powerful levers in reaching financial
            independence. Going from a 20% savings rate to a 40% savings rate doesn't
            just double your savings — it simultaneously lowers your FIRE number and
            increases how fast you get there. The effect is compounding in both directions.
          </p>

          <p className="max-w-4xl text-sm text-slate-400">
            Use the Savings Rate tab in the calculator below to see how each savings rate
            scenario changes your years to FI and projected FIRE age based on your income
            and current assumptions.
          </p>

          <div className="text-xs text-slate-400">Assumptions updated: March 2026</div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">FIRE calculator →</Link>
            <Link href="/barista-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Barista FIRE →</Link>
            <Link href="/coast-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Coast FIRE →</Link>
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE →</Link>
            <Link href="/explore" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Explore all tools →</Link>
          </div>
        </header>

        <FireCalculator hideFAQ />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about savings rate and FIRE
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What savings rate do I need to reach FIRE?"
              a="It depends on your starting point, income, and timeline. A 10% savings rate typically takes 40+ years to reach financial independence. A 50% savings rate can cut that to around 17 years. A 70% savings rate can get you there in roughly 8–10 years. The higher your rate, the faster you accumulate assets and the lower your required FIRE number."
            />
            <SEOFAQItem
              q="How does savings rate affect my FIRE number?"
              a="Your FIRE number is based on your annual spending, not your income. When you save more, you spend less — which directly lowers the portfolio you need to retire. A higher savings rate shrinks your FIRE number and grows your portfolio at the same time, creating a powerful compounding effect on your timeline."
            />
            <SEOFAQItem
              q="How is savings rate calculated for FIRE?"
              a="Savings rate for FIRE is typically calculated as after-tax savings divided by after-tax income. For example: if your take-home pay is $6,000 per month and you save $2,400, your savings rate is 40%. Some people calculate it on gross income instead — the important thing is to be consistent when comparing scenarios."
            />
            <SEOFAQItem
              q="What is a good savings rate for early retirement?"
              a="Most FIRE communities consider 25–30% a solid foundation, 40–50% as aggressive, and 60%+ as extreme or Lean FIRE territory. The right rate depends on your income, lifestyle, and target retirement age. Even moving from 15% to 25% can meaningfully shorten your timeline."
            />
            <SEOFAQItem
              q="Does location affect how much I can save?"
              a="Significantly. Moving to a lower cost-of-living city or a state with no income tax can increase your effective savings rate without changing your income at all. Lower rent, lower taxes, and cheaper everyday costs mean more of each paycheck goes toward your portfolio. Use the Move Impact tab to see how a city change could affect your timeline."
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
          </div>
        </footer>

      </div>
    </main>
  );
}
