import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";
import { SEOFAQItem } from "@/components/SeoFAQ";
import { parseIncomeParam } from "@/lib/incomeParam";

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

type PageProps = { searchParams: Promise<{ income?: string }> };

export default async function Page({ searchParams }: PageProps) {
  const { income } = await searchParams;
  const initialIncome = parseIncomeParam(income);
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Coast FIRE Calculator
          </h1>

          <p className="text-lg font-semibold text-slate-200">
            How Much Do You Need Invested Today to Stop Contributing and Still Retire?
          </p>

          <p className="leading-relaxed text-slate-300">
            <span className="font-semibold text-white">Coast FIRE</span> is the point where
            your current investments are large enough that compound growth alone can carry
            your portfolio to your full retirement target by your chosen age — even if you
            stop making new contributions.
          </p>

          <p className="leading-relaxed text-slate-300">
            In plain terms, Coast FIRE means your portfolio has reached escape velocity.
            You still need enough income to cover your current lifestyle, but you no longer
            need to keep aggressively investing for traditional retirement if your assumptions hold.
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-400">
            <span>Assumptions updated: March 2026</span>
            <span className="hidden sm:inline">•</span>
            <Link href="/methodology" className="underline underline-offset-4 hover:no-underline">
              See methodology
            </Link>
          </div>
        </header>

        <section aria-label="Coast FIRE calculator">
          <FireCalculator hideFAQ initialIncome={initialIncome} />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            How Coast FIRE actually works
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Coast FIRE is based on present value. Instead of asking how much you need
              at retirement, it asks how much you need invested today so that compounding
              alone grows your portfolio to that future target.
            </p>
            <p>
              The basic idea is: full future FIRE target ÷ expected compounded growth over
              the years remaining until retirement = Coast FIRE number today. Once your portfolio
              reaches that number, additional contributions become optional rather than required
              under the model.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            What changes your Coast FIRE number most
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Years until retirement</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The more time compounding has to work, the smaller the Coast FIRE number you need today.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Investment return assumption</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Small changes in expected return can shift the Coast FIRE number materially because the model depends heavily on long-term compounding.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Full FIRE target</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Your Coast FIRE number depends on the full retirement number you eventually need, so higher expected retirement spending raises the target.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Living costs today</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Once you hit Coast FIRE, you still need enough earned income to cover your current life until retirement actually begins.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">
            Who Coast FIRE is usually best for
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Coast FIRE is often attractive for people who want to reduce work pressure
              before reaching full traditional FIRE. It can be a strong fit for someone who
              wants flexibility, career optionality, or the ability to shift into lower-stress work
              while still letting investments compound in the background.
            </p>
            <p>
              It is usually most useful for people who already have a meaningful investment base
              and enough time left before retirement for compounding to matter.
            </p>
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
                <li>Coast FIRE milestone logic</li>
                <li>Portfolio growth projection</li>
                <li>Return-based target modeling</li>
                <li>Comparison against a future FIRE target</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
              <h3 className="font-semibold text-white">Not fully modeled</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
                <li>Sequence-of-returns risk in detail</li>
                <li>Changing tax treatment over decades</li>
                <li>Every market-cycle scenario</li>
                <li>Your future spending changes with perfect precision</li>
              </ul>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            This tool is built for planning direction, not certainty. Coast FIRE is highly sensitive
            to long-term assumptions, so the output is most useful as a scenario-planning estimate.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about Coast FIRE
          </h2>

          <div className="grid gap-3">
            <SEOFAQItem
              q="What is Coast FIRE?"
              a="Coast FIRE is the point where your invested portfolio is large enough that compound growth alone can grow to your full retirement target by a chosen age, even without additional contributions."
            />
            <SEOFAQItem
              q="How do I calculate my Coast FIRE number?"
              a="Your Coast FIRE number is the present value of your future FIRE target, discounted back from your retirement age using your expected annual return."
            />
            <SEOFAQItem
              q="How is Coast FIRE different from regular FIRE?"
              a="Regular FIRE means you already have enough to fund retirement fully. Coast FIRE is an earlier milestone where compounding can do the rest, but you still need earned income for current living costs."
            />
            <SEOFAQItem
              q="How do I use this calculator to model Coast FIRE?"
              a="Enter your current portfolio, expected return, and full retirement target. Then reduce annual contributions to zero and check whether growth alone reaches the target by your chosen retirement age."
            />
            <SEOFAQItem
              q="What investment return should I use for Coast FIRE?"
              a="Many people use 5% to 7% as a planning range, but even small changes in the return assumption can materially change the result because Coast FIRE depends heavily on long compounding periods."
            />
            <SEOFAQItem
              q="Can moving to a cheaper city help me reach Coast FIRE sooner?"
              a="Yes. Lower living costs can reduce your full future FIRE number, which lowers the Coast FIRE number as well. Lower expenses can also make it easier to cover current life once you stop contributing aggressively."
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">
            Explore related FIRE and relocation tools
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">FIRE calculator →</Link>
            <Link href="/barista-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Barista FIRE →</Link>
            <Link href="/lean-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Lean FIRE →</Link>
            <Link href="/chubby-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Chubby FIRE →</Link>
            <Link href="/fat-fire-calculator" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Fat FIRE →</Link>
            <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Compare cities →</Link>
            <Link href="/explore" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">Explore all tools →</Link>
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