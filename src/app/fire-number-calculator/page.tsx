import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";

export const metadata: Metadata = {
  title: "FIRE Number Calculator – Calculate Your Financial Independence Number",
  description:
    "Calculate your FIRE number (financial independence number) based on your expenses and withdrawal rate. Estimate years to FI and FIRE age.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            FIRE Number Calculator
          </h1>

          <p className="leading-relaxed text-slate-300">
            Your <span className="font-semibold text-white">FIRE number</span> is the amount of money
            you need invested so you can live off your portfolio. Most people estimate it using the{" "}
            <span className="font-semibold text-white">4% rule</span> (about{" "}
            <span className="font-semibold text-white">25× annual expenses</span>).
          </p>

          <div className="text-xs text-slate-400">
            Assumptions updated: March 2026
          </div>

          <Link
  href="/explore"
  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
>
  Explore All Tools
</Link>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              FIRE calculator →
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Compare cities →
            </Link>
          </div>
        </header>

        <section aria-label="FIRE number calculator">
          <FireCalculator />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">FAQ</h2>

            <div className="text-xs text-slate-400">
              Assumptions updated: March 2026
            </div>
          </div>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What is a FIRE number?"
              a="Your FIRE number is the portfolio size needed to support your lifestyle. A common rule of thumb is annual expenses ÷ withdrawal rate (ex: 4%)."
            />
            <SEOFAQItem
              q="Is 4% always the right withdrawal rate?"
              a="Not always. 4% is a starting point. More conservative plans use 3%–3.5%, while others may use 4.5%+ depending on risk tolerance."
            />
            <SEOFAQItem
              q="Do I need to include taxes in my FIRE number?"
              a="Ideally yes. Taxes can change your investable cash flow and withdrawals. Your calculator can model state taxes for a more realistic estimate."
            />
          </div>
        </section>

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-400">
            Assumptions updated: March 2026
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/about" className="transition hover:text-white">
              About
            </Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-white">
              Disclaimer
            </Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}