import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";

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

export const metadata: Metadata = {
  title: "Coast FIRE Calculator – How Much Do You Need Invested to Coast?",
  description:
    "Estimate Coast FIRE: the amount you need invested today so you can stop contributing and still reach retirement by letting compounding do the work.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Coast FIRE Calculator
          </h1>
          <p className="text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">Coast FIRE</span> means you’ve invested enough
            that your money can grow to a traditional retirement number—even if you{" "}
            <span className="font-semibold text-white">stop contributing</span>.
            Use this page to estimate your FIRE target and timeline. (Tonight we’re using the main
            calculator; we can add a dedicated Coast FIRE mode next.)
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

        <section aria-label="Coast FIRE calculator">
          <FireCalculator />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <div className="grid gap-3">
            <SEOFAQItem
              q="What is Coast FIRE?"
              a="Coast FIRE is when your current investments can grow to your retirement target without additional contributions—so you only need to cover your living expenses with income."
            />
            <SEOFAQItem
              q="How do I use this calculator for Coast FIRE?"
              a="Set your current portfolio, return assumptions, and expenses. To approximate Coast FIRE, reduce yearly contributions to near $0 and see whether you still reach FI by your target age."
            />
            <SEOFAQItem
              q="Will you add a dedicated Coast FIRE mode?"
              a="Yes—next step is a Coast FIRE input (retirement age) that calculates the required portfolio today based on compound growth."
            />
          </div>
        </section>
      </div>
    </main>
  );
}