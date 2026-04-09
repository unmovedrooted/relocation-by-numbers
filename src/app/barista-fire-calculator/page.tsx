import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";

export const metadata: Metadata = {
  title: "Barista FIRE Calculator | Part-Time Income & Partial Retirement Planning",
  description:
    "Calculate your Barista FIRE number. See how part-time income reduces the portfolio you need to retire early. Model your savings target, timeline, and withdrawal rate.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/barista-fire-calculator",
  },
  openGraph: {
    title: "Barista FIRE Calculator | Part-Time Income & Partial Retirement Planning",
    description:
      "Calculate your Barista FIRE number. See how part-time income reduces the portfolio you need to retire early.",
    url: "https://www.relocationbynumbers.com/barista-fire-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Barista FIRE Calculator | Part-Time Income & Partial Retirement Planning",
    description:
      "Calculate your Barista FIRE number. See how part-time income reduces the portfolio you need to retire early.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">

        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Barista FIRE Calculator
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            Part-Time Income, Partial Retirement — How Much Do You Actually Need?
          </p>

          <p className="leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Barista FIRE</span> is a middle ground
            between full-time work and full retirement. You leave your career but continue earning
            part-time income — enough to cover some expenses so your investment portfolio doesn't
            have to do all the work. The result is a smaller FIRE number, a faster timeline, and
            more flexibility than traditional FIRE.
          </p>

          <p className="leading-relaxed text-slate-300">
            To model Barista FIRE, subtract your expected annual part-time income from your annual
            expenses and enter the remainder as your target spending. For example: $60,000 in
            expenses and $24,000 in part-time income means your portfolio only needs to cover
            $36,000 per year — a FIRE number of $900,000 at a 4% withdrawal rate instead of
            $1,500,000.
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
            <Link href="/coast-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Coast FIRE calculator →</Link>
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE calculator →</Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Compare cities →</Link>
          </div>
        </header>

        <section aria-label="Barista FIRE calculator">
          {/* hideFAQ removes the component's built-in FAQ so only the page-level FAQ below renders */}
          <FireCalculator hideFAQ />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about Barista FIRE
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What is Barista FIRE?"
              a="Barista FIRE is a partial retirement strategy where you leave full-time work but continue earning part-time income — enough to cover some living expenses so your investment portfolio can be smaller. The name comes from the idea of working a low-stress part-time job, like a barista, that may also provide benefits like health insurance."
            />
            <SEOFAQItem
              q="How is Barista FIRE different from regular FIRE?"
              a="Traditional FIRE requires a portfolio large enough to cover 100% of your expenses indefinitely, typically using the 4% rule. Barista FIRE reduces that requirement by supplementing with part-time income, which means you can reach your number sooner and with less saved."
            />
            <SEOFAQItem
              q="How do I calculate my Barista FIRE number?"
              a="Subtract your expected annual part-time income from your annual expenses. Divide the remainder by your withdrawal rate (commonly 4%, or 0.04). Example: $60,000 expenses minus $24,000 part-time income = $36,000 needed from portfolio. $36,000 ÷ 0.04 = $900,000 Barista FIRE target."
            />
            <SEOFAQItem
              q="How do I use this calculator for Barista FIRE?"
              a="Enter your annual expenses minus your expected part-time income as your target monthly spending. This gives you the portfolio size your investments need to cover. The calculator will then show your savings target, projected timeline, and safe withdrawal estimate."
            />
            <SEOFAQItem
              q="Why is Barista FIRE popular?"
              a="It significantly reduces the portfolio required to leave full-time work, which can shave years off your timeline. It also provides structure, social connection, and sometimes employer benefits like health insurance — which is one of the biggest financial challenges of early retirement in the US."
            />
            <SEOFAQItem
              q="What is a good part-time income for Barista FIRE?"
              a="It depends on your expenses and lifestyle. Even $15,000–$25,000 per year in part-time income can reduce your required portfolio by $375,000–$625,000 at a 4% withdrawal rate. Any consistent part-time income that covers healthcare, groceries, or utilities meaningfully lowers your FIRE number."
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
