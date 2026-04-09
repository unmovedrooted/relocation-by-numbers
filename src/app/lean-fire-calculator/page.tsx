import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";

export const metadata: Metadata = {
  title: "Lean FIRE Calculator | Retire Early on a Smaller Budget",
  description:
    "Calculate your Lean FIRE number. See how a lower spending level reduces the portfolio you need to retire early. Model your savings target, timeline, taxes, and withdrawal rate.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/lean-fire-calculator",
  },
  openGraph: {
    title: "Lean FIRE Calculator | Retire Early on a Smaller Budget",
    description:
      "Calculate your Lean FIRE number. See how a lower spending level reduces the portfolio you need to retire early.",
    url: "https://www.relocationbynumbers.com/lean-fire-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lean FIRE Calculator | Retire Early on a Smaller Budget",
    description:
      "Calculate your Lean FIRE number. See how a lower spending level reduces the portfolio you need to retire early.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">

        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Lean FIRE Calculator
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            Retire Early on a Smaller Budget — How Low Can Your FIRE Number Go?
          </p>

          <p className="leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Lean FIRE</span> is financial
            independence on a lower spending level. Because your FIRE number is
            directly tied to your annual expenses, spending less means a smaller
            target portfolio — and a faster path to retiring early. Most people
            consider Lean FIRE to mean living on roughly $40,000 per year or less,
            though the threshold is personal.
          </p>

          <p className="leading-relaxed text-slate-300">
            Enter your income, state, and a lower monthly spending target below
            to see how Lean FIRE changes your timeline compared to your current
            spending level. Use the Move Impact tab to see how relocating to a
            lower cost-of-living city could make Lean FIRE more achievable.
          </p>

          <div className="text-xs text-slate-400">Assumptions updated: March 2026</div>

          <Link
            href="/explore"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Explore All Tools
          </Link>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">FIRE calculator →</Link>
            <Link href="/barista-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Barista FIRE →</Link>
            <Link href="/coast-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Coast FIRE →</Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Compare cities →</Link>
          </div>
        </header>

        <section aria-label="Lean FIRE calculator">
          {/* hideFAQ removes the component's built-in FAQ so only the page-level FAQ below renders */}
          <FireCalculator hideFAQ />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about Lean FIRE
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What is Lean FIRE?"
              a="Lean FIRE is early retirement on a frugal budget — typically under $40,000 per year for an individual. Because your FIRE number equals annual spending divided by your withdrawal rate, lower spending directly reduces the portfolio you need. At $30,000 per year and a 4% withdrawal rate, your Lean FIRE number is $750,000."
            />
            <SEOFAQItem
              q="What is the Lean FIRE number?"
              a="Your Lean FIRE number depends on your target annual spending. At a 4% withdrawal rate, divide your annual expenses by 0.04. Common examples: $25,000/year = $625,000 target; $30,000/year = $750,000; $40,000/year = $1,000,000. The lower your spending, the smaller and more achievable your FIRE number becomes."
            />
            <SEOFAQItem
              q="How is Lean FIRE different from regular FIRE?"
              a="Regular FIRE typically targets spending levels of $50,000–$100,000+ per year, requiring a portfolio of $1.25M–$2.5M or more. Lean FIRE uses a lower spending target — often $25,000–$40,000 per year — which means a smaller FIRE number and a faster timeline, but less financial cushion for unexpected costs."
            />
            <SEOFAQItem
              q="Is Lean FIRE realistic long-term?"
              a="It can be, but it requires more discipline and is more sensitive to unexpected expenses like healthcare, housing repairs, or family changes. Many Lean FIRE practitioners keep a buffer, use a more conservative withdrawal rate like 3–3.5%, or maintain a small income stream to reduce portfolio risk. Geographic arbitrage — moving to a lower cost-of-living area — is also a common strategy."
            />
            <SEOFAQItem
              q="How can moving to a cheaper city help with Lean FIRE?"
              a="Lower cost-of-living cities reduce your annual expenses directly, which lowers your FIRE number and increases how much you can save each month. Moving from a high-cost city like San Francisco or New York to a lower-cost area can shave years off a Lean FIRE timeline by simultaneously reducing the target and accelerating savings. Use the Move Impact tab in the calculator to compare cities."
            />
            <SEOFAQItem
              q="What withdrawal rate should I use for Lean FIRE?"
              a="Many Lean FIRE planners use 3–3.5% instead of the standard 4% rule, because early retirees have longer time horizons — sometimes 40–50 years — and less room for error at lower spending levels. A 3.5% rate means multiplying annual expenses by roughly 28.6 instead of 25."
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
