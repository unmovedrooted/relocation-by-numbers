import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import RetirementCalculator from "@/components/RetirementCalculator";

// ─────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/retirement-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Retirement Calculator, Project Your Savings & Future Income",
  description:
    "Free retirement calculator. See what your current savings and contributions grow into by retirement, what income that could support, and how a few small changes move the number, all in today's dollars, no judgment.",
  keywords: [
    "retirement calculator",
    "retirement savings calculator",
    "retirement projection calculator",
    "how much will i have in retirement",
    "compound growth retirement calculator",
    "retirement income calculator",
    "401k growth calculator",
  ],
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "Retirement Calculator, Project Your Savings & Future Income",
    description:
      "See what your savings grow into by retirement, the income it supports, and how small changes move the number, in today's dollars.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Retirement Calculator, Project Your Savings & Future Income",
    description: "What your savings grow into, the income it supports, and how small changes move the number.",
    site: "@relocationbynumbers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

// ─────────────────────────────────────────────────────────────
// STRUCTURED DATA
// ─────────────────────────────────────────────────────────────

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Retirement Calculator",
  url: CANONICAL,
  description:
    "Free retirement calculator that projects what your savings and contributions grow into by retirement, breaks the balance into savings, contributions, and growth on a live chart, and estimates the income it could support, all in today's dollars.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Projected balance at retirement in today's dollars",
    "Live breakdown of savings, contributions, and growth",
    "Supportable income estimate via the 4% rule",
    "What-if scenarios for saving more, retiring later, or higher returns",
    "PDF and CSV export, shareable scenario links",
  ],
  author: {
    "@type": "Organization",
    name: "Relocation by Numbers",
    url: SITE_URL,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does this retirement calculator work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It grows your current savings and ongoing contributions to your chosen retirement age using an inflation-adjusted return, then shows the projected balance in today's dollars, breaks it into savings vs. contributions vs. investment growth, and estimates the income it could support with the 4% rule. There's no target to hit and no 'on track / behind' verdict, it simply shows where your current path lands.",
      },
    },
    {
      "@type": "Question",
      name: "Why are the results in today's dollars?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Showing a future balance in future dollars can be misleading because inflation erodes buying power. This calculator grows your portfolio at the inflation-adjusted 'real' return and assumes contributions keep pace with inflation, so the projected balance reflects real, present-day purchasing power.",
      },
    },
    {
      "@type": "Question",
      name: "How much income will my savings support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "As a quick reference, the calculator applies the 4% rule: withdrawing about 4% of the balance per year. For a detailed drawdown that accounts for taxes and how long the money lasts, use the Retirement Withdrawal Calculator.",
      },
    },
    {
      "@type": "Question",
      name: "What return should I assume?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There's no single right number. Historically, a diversified stock-and-bond portfolio has returned roughly 6–8% before inflation over long periods, but future returns are uncertain. Try a range of assumptions to see how sensitive your projection is.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Calculators", item: `${SITE_URL}/explore` },
    { "@type": "ListItem", position: 3, name: "Retirement Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  {
    q: "How does this calculator work?",
    a: "It grows your savings and contributions to your retirement age at an inflation-adjusted return, shows the projected balance in today's dollars, splits it into savings/contributions/growth, and estimates supportable income with the 4% rule. No target, no 'on track' verdict.",
  },
  {
    q: "Why today's dollars?",
    a: "A future balance in future dollars overstates real buying power. Growing at the inflation-adjusted real return (with contributions keeping pace) keeps every figure in present-day purchasing power.",
  },
  {
    q: "How much income will it support?",
    a: "As a reference, the 4% rule, roughly 4% of the balance per year. For a detailed, tax-aware drawdown, use the Retirement Withdrawal Calculator.",
  },
  {
    q: "What return should I assume?",
    a: "There's no single right number. A diversified portfolio has historically returned ~6–8% before inflation over long periods, but the future is uncertain, try a range to test sensitivity.",
  },
];

export default function Page() {
  return (
    <>
      <Script
        id="sd-webapp"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <Script
        id="sd-faq"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="sd-breadcrumb"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
        <header className="py-10 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Retirement Calculator
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              See what your current savings grow into by retirement, watch the balance split into savings,
              contributions, and growth on a live chart, and explore how small changes move the number.
            </p>

            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              All in today&apos;s dollars, no target to hit, no judgment. Just your trajectory.
            </p>

            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/methodology" className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">See methodology</Link>
              <span className="mx-2" aria-hidden="true">·</span>
              Planning estimates only. Results depend on your inputs, tax status, and assumptions.
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Live balance chart", "Today's dollars", "Supportable income", "What-if scenarios"].map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {f}
                </span>
              ))}
            </div>

            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-cyan-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <RetirementCalculator />

          <section
            aria-labelledby="what-included-heading"
            className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2
                  id="what-included-heading"
                  className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl"
                >
                  How this calculator works
                </h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  <p>
                    Enter where you are today, your age, when you&apos;d like to retire, what you&apos;ve saved, and
                    what you add each month. The calculator grows that forward at an inflation-adjusted return and
                    shows the projected balance in today&apos;s dollars, so the number reflects real buying power
                    rather than an inflated future figure.
                  </p>
                  <p>
                    The live chart breaks the balance into three parts, what you started with, what you contributed,
                    and what the market added, so you can see how much of the total is pure compound growth. Below
                    it, a 4%-rule estimate translates the balance into supportable monthly income, and the
                    &ldquo;what if&rdquo; cards show how saving a little more, retiring slightly later, or earning a
                    bit more changes things.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Live balance chart", body: "Savings, contributions, and growth, re-proportioning as you type." },
                    { title: "Today's dollars", body: "Inflation-adjusted, so the number reflects real buying power." },
                    { title: "Supportable income", body: "A 4%-rule translation from balance to monthly income." },
                    { title: "What-if scenarios", body: "See the effect of small changes, no pressure, just options." },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60"
                    >
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50 p-5 dark:border-cyan-900/60 dark:bg-cyan-950/30">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Good to know before you use it</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <p>
                    This is a smooth, average-return projection. Real markets are volatile, and the order of returns
                    matters, a projection is a guide, not a prediction.
                  </p>
                  <p>
                    There&apos;s deliberately no &ldquo;target&rdquo; or &ldquo;you&apos;re behind&rdquo; verdict. What
                    you should save and spend is your call; this tool just shows where your current path leads and lets
                    you explore.
                  </p>
                  <p>
                    The income figure is a simple 4%-rule reference. For a detailed drawdown with taxes and longevity,
                    use the Retirement Withdrawal Calculator.
                  </p>
                  <p>This calculator is not tax or investment advice.</p>
                </div>

                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "No target, no judgment", "Results in today's dollars"].map((t) => (
                    <div key={t} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="mt-0.5 flex-shrink-0 text-cyan-500">✓</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="mb-5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl"
            >
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                    {q}
                    <span className="flex-shrink-0 text-slate-400 transition-transform group-open:rotate-45 dark:text-slate-500 select-none">
                      +
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="crosssell-heading"
            className="rounded-2xl border border-cyan-200/60 bg-cyan-50 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20"
          >
            <h2 id="crosssell-heading" className="text-sm font-semibold text-slate-900 dark:text-white">
              Keep planning your retirement
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Explore the drawdown side, tax-advantaged savings, and the rest of your financial picture.
            </p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Withdrawal Calculator", href: "/retirement-withdrawal-calculator" },
                { label: "HSA Calculator", href: "/hsa-calculator" },
                { label: "FIRE Calculator", href: "/fire-calculator" },
                { label: "Housing Affordability", href: "/housing-affordability-calculator" },
              ].map(({ label, href }, i) => (
                <a
                  key={href}
                  href={href}
                  className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    i === 0
                      ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {label}
                </a>
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
