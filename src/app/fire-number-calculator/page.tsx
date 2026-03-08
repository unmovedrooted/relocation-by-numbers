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
          <p className="text-slate-300 leading-relaxed">
            Your <span className="font-semibold text-white">FIRE number</span> is the amount of money
            you need invested so you can live off your portfolio. Most people estimate it using the{" "}
            <span className="font-semibold text-white">4% rule</span> (about{" "}
            <span className="font-semibold text-white">25× annual expenses</span>).
          </p>

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
          <h2 className="text-xl font-semibold">FAQ</h2>
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
      </div>
    </main>
  );
}