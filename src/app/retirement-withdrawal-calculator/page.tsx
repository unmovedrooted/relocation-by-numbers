import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import RetirementWithdrawalCalculator from "@/components/RetirementWithdrawalCalculator";

// ─────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/retirement-withdrawal-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Retirement Withdrawal Calculator, How Long Will My Money Last?",
  description:
    "Free retirement withdrawal calculator. See how long your savings will last at a given withdrawal, or the safe amount you can withdraw for a target retirement length, with taxes, inflation, and the 4% rule built in.",
  keywords: [
    "retirement withdrawal calculator",
    "how long will my money last calculator",
    "safe withdrawal rate calculator",
    "4 percent rule calculator",
    "retirement drawdown calculator",
    "401k withdrawal calculator",
    "how much can i withdraw in retirement",
  ],
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "Retirement Withdrawal Calculator, How Long Will My Money Last?",
    description:
      "See how long your savings last, or your safe annual withdrawal for a target retirement length, with taxes, inflation, and the 4% rule.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Retirement Withdrawal Calculator, How Long Will My Money Last?",
    description: "How long your savings last, or your safe withdrawal amount, taxes, inflation, and the 4% rule included.",
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
  name: "Retirement Withdrawal Calculator",
  url: CANONICAL,
  description:
    "Free retirement withdrawal calculator that shows how long your savings will last at a given withdrawal, or the safe withdrawal amount for a target retirement length, accounting for taxes, inflation, and the 4% rule.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "How-long-will-it-last and safe-withdrawal modes",
    "Federal and state income tax on withdrawals (traditional vs Roth)",
    "Inflation-adjusted, today's-dollar projections",
    "4% rule reference and horizon comparison",
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
      name: "What is the 4% rule for retirement withdrawals?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The 4% rule suggests withdrawing 4% of your starting portfolio in year one, then adjusting that dollar amount for inflation each year. Based on historical data, this gave a high probability of a portfolio lasting a 30-year retirement. It's a rule of thumb, not a guarantee, actual safe rates depend on returns, inflation, and how long you need the money to last.",
      },
    },
    {
      "@type": "Question",
      name: "Are retirement account withdrawals taxed?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Withdrawals from traditional (pre-tax) 401(k) and IRA accounts are taxed as ordinary income at the federal level, and at the state level in most states. Roth withdrawals are tax-free. Payroll tax (FICA) does not apply to retirement-account distributions.",
      },
    },
    {
      "@type": "Question",
      name: "Which states don't tax retirement income?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The nine states with no income tax (Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, Wyoming) don't tax withdrawals. Illinois, Pennsylvania, and Mississippi also fully exempt qualified retirement-plan distributions. Many other states offer partial exclusions.",
      },
    },
    {
      "@type": "Question",
      name: "When do Required Minimum Distributions (RMDs) start?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Under SECURE 2.0, RMDs from traditional retirement accounts begin at age 73 (rising to 75 in 2033). Roth IRAs have no RMDs during the owner's lifetime. This calculator focuses on your chosen withdrawal amount and does not force RMDs.",
      },
    },
    {
      "@type": "Question",
      name: "Does this calculator account for inflation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Withdrawals grow with inflation to preserve your buying power, and your portfolio grows at the inflation-adjusted 'real' return. All results are shown in today's dollars.",
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
    { "@type": "ListItem", position: 3, name: "Retirement Withdrawal Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  {
    q: "What is the 4% rule?",
    a: "Withdraw 4% of your starting portfolio in year one, then adjust that dollar amount for inflation each year. Historically this gave a high chance of lasting a 30-year retirement, a rule of thumb, not a guarantee.",
  },
  {
    q: "Are my withdrawals taxed?",
    a: "Traditional 401(k)/IRA withdrawals are taxed as ordinary income (federal, and state in most states). Roth withdrawals are tax-free. FICA payroll tax never applies to retirement distributions.",
  },
  {
    q: "Which states don't tax retirement income?",
    a: "The nine no-income-tax states, plus Illinois, Pennsylvania, and Mississippi, which fully exempt qualified retirement-plan distributions. Others offer partial exclusions.",
  },
  {
    q: "When do RMDs start?",
    a: "Under SECURE 2.0, Required Minimum Distributions from traditional accounts begin at age 73 (rising to 75 in 2033). Roth IRAs have no lifetime RMDs.",
  },
  {
    q: "Is inflation included?",
    a: "Yes. Withdrawals rise with inflation to hold buying power constant, and the portfolio grows at the inflation-adjusted real return. Everything is shown in today's dollars.",
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
              Retirement Withdrawal Calculator
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              See how long your savings will last at a given withdrawal, or the safe amount you can withdraw for a
              target retirement length. Taxes, inflation, and the 4% rule are all built in.
            </p>

            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Handles traditional vs. Roth accounts and state tax treatment of retirement income.
            </p>

            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/methodology" className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">See methodology</Link>
              <span className="mx-2" aria-hidden="true">·</span>
              Planning estimates only. Results depend on your inputs, tax status, and assumptions.
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["How long will it last", "Safe withdrawal amount", "Taxes & inflation", "4% rule reference"].map((f) => (
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
          <RetirementWithdrawalCalculator />

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
                    Pick a mode. In <strong>&ldquo;How long will it last?&rdquo;</strong> you enter a withdrawal and
                    the calculator draws it down year by year until the money runs out. In <strong>&ldquo;Safe
                    withdrawal amount&rdquo;</strong> you enter a target retirement length and it solves for the
                    largest level withdrawal your balance can sustain for that many years.
                  </p>
                  <p>
                    Everything runs in today&apos;s dollars: withdrawals rise with inflation to hold your buying power
                    constant, and the portfolio compounds at the inflation-adjusted &ldquo;real&rdquo; return. Taxes
                    on traditional withdrawals use the same verified federal + state tax engine as the rest of this
                    site, Roth withdrawals come out tax-free.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Two modes", body: "Solve for how long it lasts, or for a sustainable amount." },
                    { title: "Real taxes", body: "Federal + state on traditional; tax-free on Roth. No FICA." },
                    { title: "Inflation-aware", body: "Today's-dollar results with an inflation-adjusted return." },
                    { title: "4% rule reference", body: "Compare your number against the classic benchmark." },
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
                    This is a smooth, average-return projection. Real markets are volatile, and a run of bad early
                    returns (sequence-of-returns risk) can deplete a portfolio faster than the average suggests.
                  </p>
                  <p>
                    Tax estimates treat the withdrawal as your only ordinary income with the standard deduction. They
                    don&apos;t include Social Security, the extra standard deduction at 65+, or capital-gains rules for
                    taxable brokerage accounts.
                  </p>
                  <p>
                    Required Minimum Distributions (age 73+) may force larger withdrawals than you choose here. This
                    calculator does not model RMDs.
                  </p>
                  <p>This calculator is not tax or investment advice.</p>
                </div>

                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "Uses your actual marginal tax rate", "Results in today's dollars"].map((t) => (
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
              See how your withdrawal plan fits with the rest of your financial picture.
            </p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "FIRE Calculator", href: "/fire-calculator" },
                { label: "HSA Calculator", href: "/hsa-calculator" },
                { label: "Housing Affordability", href: "/housing-affordability-calculator" },
                { label: "Relocation Calculator", href: "/" },
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
