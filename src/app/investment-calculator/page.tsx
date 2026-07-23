import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import InvestmentCalculator from "@/components/InvestmentCalculator";

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/investment-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Investment Calculator — Compound Growth with a Realistic Range",
  description:
    "Free investment & compound interest calculator. Project how your savings grow with regular contributions, then switch to a Monte Carlo view to see the realistic range of outcomes with market volatility.",
  keywords: [
    "investment calculator",
    "compound interest calculator",
    "investment growth calculator",
    "monte carlo investment calculator",
    "future value calculator",
    "how much will my investment grow",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "Investment Calculator — Compound Growth with a Realistic Range",
    description: "Project compound growth with contributions, plus a Monte Carlo range of outcomes for market volatility.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Investment Calculator — Compound Growth with a Realistic Range",
    description: "Compound growth with contributions and a Monte Carlo range of outcomes.",
    site: "@relocationbynumbers",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Investment Calculator",
  url: CANONICAL,
  description:
    "Free investment and compound interest calculator that projects growth from a starting amount and regular contributions, with an optional Monte Carlo view showing a percentile range of outcomes under market volatility.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Compound growth from a lump sum plus monthly contributions",
    "Growth-over-time chart splitting contributions vs. growth",
    "Optional inflation adjustment (today's dollars)",
    "Monte Carlo range of outcomes (10th–90th percentile)",
    "PDF and CSV export, shareable links",
  ],
  author: { "@type": "Organization", name: "Relocation by Numbers", url: SITE_URL },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "How does compound growth work?", acceptedAnswer: { "@type": "Answer", text: "Your returns earn returns. Each period, growth is added to your balance, and the next period's growth is calculated on the larger balance. Over long horizons, this compounding means most of your final balance can come from growth rather than contributions." } },
    { "@type": "Question", name: "What return should I assume?", acceptedAnswer: { "@type": "Answer", text: "There's no single right number. A diversified stock-and-bond portfolio has historically returned roughly 6–8% per year before inflation over long periods, but future returns are uncertain. Try a range, and use the Monte Carlo view to see how volatility widens the outcomes." } },
    { "@type": "Question", name: "What does the Monte Carlo view show?", acceptedAnswer: { "@type": "Answer", text: "Instead of one smooth average, it runs 5,000 simulated market histories where each year's return varies around your expected return. It reports a range — the worst 10%, median, and best 10% — so you can see realistic uncertainty. The median usually lands below the simple average, which is normal (volatility drag)." } },
    { "@type": "Question", name: "Should I adjust for inflation?", acceptedAnswer: { "@type": "Answer", text: "If you want the final number to reflect real buying power, turn on 'today's dollars.' The portfolio then grows at your return minus inflation. Leaving it off shows the nominal (future-dollar) balance." } },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Calculators", item: `${SITE_URL}/explore` },
    { "@type": "ListItem", position: 3, name: "Investment Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  { q: "How does compound growth work?", a: "Your returns earn returns. Growth is added to the balance each period, and the next period's growth is figured on the larger balance — so over long horizons, most of the final total can come from growth, not contributions." },
  { q: "What return should I assume?", a: "No single right number. A diversified portfolio has historically returned ~6–8% before inflation over long periods, but the future is uncertain. Try a range, and use the Monte Carlo view to see how volatility widens outcomes." },
  { q: "What does the Monte Carlo view show?", a: "5,000 simulated market histories with year-to-year variation, reported as a range: worst 10%, median, best 10%. The median usually sits below the simple average — that's normal volatility drag." },
  { q: "Should I adjust for inflation?", a: "Turn on 'today's dollars' if you want the result in real buying power; the portfolio then grows at your return minus inflation. Off shows the nominal future-dollar balance." },
];

export default function Page() {
  return (
    <>
      <Script id="sd-webapp" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <Script id="sd-faq" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="sd-breadcrumb" type="application/ld+json" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
        <header className="py-10 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Investment Calculator</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Project how your money grows with compound returns and regular contributions — then see the realistic
              range of outcomes once you add market volatility.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Compound interest, contributions, optional inflation adjustment, and a Monte Carlo range.
            </p>
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/methodology" className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">See methodology</Link>
              <span className="mx-2" aria-hidden="true">·</span>
              Planning estimates only. Results depend on your inputs, tax status, and assumptions.
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Compound growth", "Regular contributions", "Monte Carlo range", "Today's dollars"].map((f) => (
                <span key={f} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{f}</span>
              ))}
            </div>
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-cyan-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <InvestmentCalculator />

          <section aria-labelledby="how-heading" className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 id="how-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">How this calculator works</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  <p>
                    Start with a lump sum, add a monthly contribution, and pick a return and time horizon. The average
                    view compounds it year by year and shows how much of your final balance comes from contributions
                    versus growth.
                  </p>
                  <p>
                    The Monte Carlo view replaces the single smooth return with 5,000 simulated market histories, so you
                    see a realistic range instead of one optimistic line. It&apos;s the honest way to picture an
                    uncertain future — and the seeded engine means the same inputs always reproduce the same range.
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Compound growth", body: "See returns compounding on a growing balance." },
                    { title: "Contributions vs. growth", body: "The chart splits what you put in from what the market added." },
                    { title: "Realistic range", body: "Monte Carlo shows the 10th–90th percentile outcomes." },
                    { title: "Today's dollars", body: "Optional inflation adjustment for real buying power." },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50 p-5 dark:border-cyan-900/60 dark:bg-cyan-950/30">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Good to know</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <p>The Monte Carlo median usually sits below the average line. That&apos;s volatility drag, not a bug — a single average tends to look optimistic.</p>
                  <p>Results are very sensitive to the return assumption. Small changes compound into big differences over decades.</p>
                  <p>This doesn&apos;t model taxes, fees, or changing contributions over time.</p>
                  <p>It&apos;s a projection, not investment advice.</p>
                </div>
                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "Seeded, reproducible simulation", "Shareable, exportable results"].map((t) => (
                    <div key={t} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"><span className="mt-0.5 flex-shrink-0 text-cyan-500">✓</span><span>{t}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="mb-5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">Frequently asked questions</h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                    {q}
                    <span className="flex-shrink-0 text-slate-400 transition-transform group-open:rotate-45 dark:text-slate-500 select-none">+</span>
                  </summary>
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">{a}</div>
                </details>
              ))}
            </div>
          </section>

          <section aria-labelledby="crosssell-heading" className="rounded-2xl border border-cyan-200/60 bg-cyan-50 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
            <h2 id="crosssell-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Put it to work</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">See how this growth fits your retirement and financial-independence plans.</p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Retirement Calculator", href: "/retirement-calculator" },
                { label: "FIRE Calculator", href: "/fire-calculator" },
                { label: "HSA Calculator", href: "/hsa-calculator" },
                { label: "Roth Conversion", href: "/roth-conversion-calculator" },
              ].map(({ label, href }, i) => (
                <a key={href} href={href} className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${i === 0 ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}>{label}</a>
              ))}
            </nav>
          </section>
        </section>

        <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <a href="/about" className="transition hover:text-slate-900 dark:hover:text-white">About</a>
              <span aria-hidden="true">•</span>
              <a href="/disclaimer" className="transition hover:text-slate-900 dark:hover:text-white">Disclaimer</a>
              <span aria-hidden="true">•</span>
              <a href="/privacy" className="transition hover:text-slate-900 dark:hover:text-white">Privacy</a>
              <span aria-hidden="true">•</span>
              <a href="/terms" className="transition hover:text-slate-900 dark:hover:text-white">Terms</a>
              <span aria-hidden="true">•</span>
              <a href="/methodology" className="transition hover:text-slate-900 dark:hover:text-white">Methodology</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
