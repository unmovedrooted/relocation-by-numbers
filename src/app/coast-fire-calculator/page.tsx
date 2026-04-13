import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";

export const metadata: Metadata = {
  title: "Coast FIRE Calculator | How Much Do You Need to Stop Contributing?",
  description:
    "Calculate your Coast FIRE number — the portfolio size you need today so compound growth alone carries you to retirement. Model your target, timeline, and investment return assumptions.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/coast-fire-calculator",
  },
  openGraph: {
    title: "Coast FIRE Calculator | How Much Do You Need to Stop Contributing?",
    description:
      "Calculate your Coast FIRE number — the portfolio size you need today so compound growth alone carries you to retirement.",
    url: "https://www.relocationbynumbers.com/coast-fire-calculator",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coast FIRE Calculator | How Much Do You Need to Stop Contributing?",
    description:
      "Calculate your Coast FIRE number — the portfolio size you need today so compound growth alone carries you to retirement.",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">

        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Coast FIRE Calculator
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-200">
            How Much Do You Need Invested Today to Stop Contributing and Still Retire?
          </p>

          <p className="leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Coast FIRE</span> is the point where
            your current investments are large enough that compound growth alone — with no
            additional contributions — will carry your portfolio to your retirement target by
            your chosen age. Once you hit your Coast FIRE number, you only need to earn enough
            to cover your living expenses. Your portfolio does the rest.
          </p>

          <p className="leading-relaxed text-slate-300">
            To model Coast FIRE with this calculator, enter your current portfolio, return
            assumptions, and retirement target. Then reduce annual contributions to zero and
            adjust your projection length to see whether your portfolio reaches your FIRE
            number by your target retirement age on growth alone.
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
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE →</Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Compare cities →</Link>
          </div>
        </header>

        <section aria-label="Coast FIRE calculator">
          {/* hideFAQ removes the component's built-in FAQ so only the page-level FAQ below renders */}
          <FireCalculator hideFAQ />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about Coast FIRE
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What is Coast FIRE?"
              a="Coast FIRE is the point where your invested portfolio is large enough that compound growth alone — with no additional contributions — will grow to your full retirement target by a specific age. Once you reach your Coast FIRE number, you only need income to cover current expenses. You no longer need to save or invest anything additional."
            />
            <SEOFAQItem
              q="How do I calculate my Coast FIRE number?"
              a="Your Coast FIRE number is the present value of your full FIRE target, discounted back from your retirement age using your expected investment return. For example: if you want $1.5 million at age 65 and expect 7% annual returns, and you are currently 35, your Coast FIRE number is approximately $1,500,000 ÷ (1.07^30) ≈ $197,000. Reaching that amount today means compounding does the rest."
            />
            <SEOFAQItem
              q="How is Coast FIRE different from regular FIRE?"
              a="Regular FIRE means accumulating a portfolio large enough to cover 100% of your expenses forever using the 4% rule. Coast FIRE is an earlier milestone — the point where you can stop contributing and still reach a traditional retirement number by a target age, though you still need earned income to cover current living expenses in the interim."
            />
            <SEOFAQItem
              q="How do I use this calculator to model Coast FIRE?"
              a="Enter your current portfolio balance, expected annual return, and your full FIRE number as the target. Then set your annual contributions to zero. Adjust the projection length until it matches the years remaining to your target retirement age. If the portfolio line reaches your FIRE target by then, you have already hit Coast FIRE."
            />
            <SEOFAQItem
              q="What investment return should I use for Coast FIRE?"
              a="A commonly used planning assumption is 6–7% nominal annual return for a diversified stock and bond portfolio. More conservative estimates use 5–6% to account for sequence-of-returns risk and longer time horizons. For Coast FIRE specifically, the return assumption matters a lot because your entire thesis depends on compounding over a long period — a 1% difference in assumed return can shift your Coast FIRE number by tens of thousands of dollars."
            />
            <SEOFAQItem
              q="Can moving to a cheaper city help me reach Coast FIRE sooner?"
              a="Yes. Lower living costs mean you need less income to cover current expenses once you hit your Coast FIRE number, making the strategy more practically achievable. Lower expenses also reduce your full FIRE number, which lowers the Coast FIRE target in turn. Use the Move Impact tab in the calculator to see how relocating changes your overall timeline."
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
