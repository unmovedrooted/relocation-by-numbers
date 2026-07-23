import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import HsaCalculator from "@/components/HsaCalculator";

// ─────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/hsa-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "HSA Calculator — Contribution Limits, Tax Savings & Growth Projection",
  description:
    "Free HSA calculator. See your 2025 contribution limit, this year's federal + FICA + state tax savings, and how your HSA balance could grow over time with tax-advantaged investing.",
  keywords: [
    "hsa calculator",
    "health savings account calculator",
    "hsa contribution limit 2025",
    "hsa tax savings calculator",
    "hsa growth calculator",
    "hdhp calculator",
    "triple tax advantage hsa",
    "hsa vs fsa",
  ],
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "HSA Calculator — Contribution Limits, Tax Savings & Growth Projection",
    description:
      "See your 2025 HSA contribution limit, this year's real tax savings (federal, FICA, and state), and a long-term growth projection.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "HSA Calculator — Contribution Limits, Tax Savings & Growth Projection",
    description: "2025 contribution limits, real tax savings, and long-term growth projection for your HSA.",
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
  name: "HSA Calculator",
  url: CANONICAL,
  description:
    "Free HSA calculator covering 2025 IRS contribution limits, real federal + FICA + state tax savings (including California and New Jersey's HSA non-conformity), and a long-term balance growth projection.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "2025 self-only, family, and 55+ catch-up contribution limits",
    "Federal, FICA, and state tax savings estimate",
    "California / New Jersey HSA state non-conformity handling",
    "Multi-year balance growth projection",
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
      name: "What is the HSA contribution limit for 2025?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For 2025, the IRS limit is $4,300 for self-only HDHP coverage and $8,550 for family coverage. Those age 55 or older can contribute an additional $1,000 catch-up contribution.",
      },
    },
    {
      "@type": "Question",
      name: "What is the triple tax advantage of an HSA?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Contributions are pre-tax or tax-deductible, investment growth inside the account is tax-free, and withdrawals for qualified medical expenses are tax-free. No other account type offers all three at once.",
      },
    },
    {
      "@type": "Question",
      name: "Do all states give HSA contributions the same tax treatment as the IRS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. California and New Jersey are the only two states that do not conform to the federal HSA tax exemption — contributions are still taxed at the state level in those states, and investment earnings inside the HSA are taxed annually as ordinary income rather than growing tax-free.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if I contribute more than the HSA limit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Excess HSA contributions are subject to a 6% excise tax for each year they remain in the account, unless withdrawn (along with any earnings on them) before the tax filing deadline.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use HSA money for non-medical expenses?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, but before age 65 non-medical withdrawals are taxed as ordinary income plus a 20% penalty. After age 65, non-medical withdrawals are taxed as ordinary income with no penalty — similar to a traditional IRA.",
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
    { "@type": "ListItem", position: 3, name: "HSA Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  {
    q: "What is the HSA contribution limit for 2025?",
    a: "$4,300 for self-only HDHP coverage, $8,550 for family coverage, plus a $1,000 catch-up contribution if you're 55 or older.",
  },
  {
    q: "What is the triple tax advantage of an HSA?",
    a: "Contributions are pre-tax, growth is tax-free, and qualified medical withdrawals are tax-free — no other account offers all three.",
  },
  {
    q: "Do California and New Jersey tax HSA contributions?",
    a: "Yes. They're the only two states that don't conform to the federal HSA exemption — contributions are still state-taxed, and earnings are taxed annually as ordinary income rather than growing tax-free.",
  },
  {
    q: "What if I contribute over the limit?",
    a: "Excess contributions face a 6% excise tax each year they remain in the account, unless withdrawn (with earnings) before the tax deadline.",
  },
  {
    q: "Can I spend HSA money on non-medical expenses?",
    a: "Yes, but under 65 you'll owe ordinary income tax plus a 20% penalty. After 65, only ordinary income tax applies — no penalty.",
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
              HSA Calculator
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              See your 2025 contribution limit, this year's real tax savings, and how your HSA balance could grow
              over time with tax-advantaged investing.
            </p>

            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Accounts for federal, FICA, and state tax rules — including California and New Jersey's HSA
              non-conformity.
            </p>

            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/methodology" className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">See methodology</Link>
              <span className="mx-2" aria-hidden="true">·</span>
              Planning estimates only. Results depend on your inputs, tax status, and assumptions.
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["2025 IRS limits", "Federal + FICA + state savings", "CA/NJ handling", "Growth projection"].map((f) => (
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
          <HsaCalculator />

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
                    Enter your coverage type, contribution amounts, and income. The calculator applies the actual
                    2025 IRS limits, then computes your real combined tax savings — federal income tax, FICA
                    (Social Security and Medicare), and state income tax — by comparing your tax bill with and
                    without the contribution, the same verified tax engine used across this site's other
                    calculators.
                  </p>
                  <p>
                    It then projects how your HSA balance could grow over time if invested, accounting for the fact
                    that California and New Jersey tax HSA contributions and annual investment earnings at the
                    state level, unlike every other state.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "2025 IRS limits", body: "Self-only, family, and 55+ catch-up contribution limits." },
                    { title: "Real tax savings", body: "Federal, FICA, and state — not just a flat estimate." },
                    { title: "CA / NJ handling", body: "The only two states that tax HSA contributions and growth." },
                    { title: "Growth projection", body: "Balance at 5, 10, 20, and 30 years, plus your custom horizon." },
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
                    An HSA is the only account with a true triple tax advantage: pre-tax contributions, tax-free
                    growth, and tax-free withdrawals for qualified medical expenses.
                  </p>
                  <p>
                    Exceeding the contribution limit triggers a 6% excise tax each year the excess remains in the
                    account, unless withdrawn before the tax deadline.
                  </p>
                  <p>
                    The growth projection assumes contributions are invested rather than spent on current medical
                    expenses, and doesn't model custodian fees or investment sequencing risk.
                  </p>
                  <p>This calculator is not tax or investment advice.</p>
                </div>

                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "Uses your actual marginal tax rate, not a flat estimate", "Handles CA/NJ HSA non-conformity"].map((t) => (
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
              Keep planning your finances
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Once your HSA plan is set, see how it fits into your broader retirement and relocation picture.
            </p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "FIRE Calculator", href: "/fire-calculator" },
                { label: "Housing Affordability", href: "/housing-affordability-calculator" },
                { label: "Relocation Calculator", href: "/" },
                { label: "Mortgage Calculator", href: "/mortgage-calculator" },
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
