import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import RothConversionCalculator from "@/components/RothConversionCalculator";

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/roth-conversion-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Roth Conversion Calculator, Convert Now or Pay Tax Later?",
  description:
    "Free Roth conversion calculator. See the tax due now, the after-tax value of converting vs. keeping your traditional 401(k)/IRA, and the break-even future tax rate, with federal and state taxes built in.",
  keywords: [
    "roth conversion calculator",
    "roth ira conversion calculator",
    "traditional to roth conversion",
    "roth conversion tax calculator",
    "roth conversion break even",
    "should i convert to roth",
    "backdoor roth calculator",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "Roth Conversion Calculator, Convert Now or Pay Tax Later?",
    description:
      "Compare the after-tax value of converting to Roth vs. keeping it traditional, with the break-even future tax rate and federal + state taxes.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Roth Conversion Calculator, Convert Now or Pay Tax Later?",
    description: "Tax due now, convert-vs-keep after-tax comparison, and the break-even future tax rate.",
    site: "@relocationbynumbers",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Roth Conversion Calculator",
  url: CANONICAL,
  description:
    "Free Roth conversion calculator that shows the tax due now on a conversion, compares the after-tax value of converting to Roth vs. keeping a traditional 401(k)/IRA, and computes the break-even future tax rate, with federal and state taxes.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Conversion tax computed across federal and state brackets",
    "Convert-to-Roth vs. keep-traditional after-tax comparison",
    "Break-even future tax rate",
    "Pay tax from the conversion or from outside savings",
    "PDF and CSV export, shareable scenario links",
  ],
  author: { "@type": "Organization", name: "Relocation by Numbers", url: SITE_URL },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a Roth conversion?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Roth conversion moves money from a traditional (pre-tax) 401(k) or IRA into a Roth account. You pay ordinary income tax on the converted amount in the year you convert, and in exchange the money grows tax-free and qualified withdrawals are tax-free.",
      },
    },
    {
      "@type": "Question",
      name: "When does a Roth conversion make sense?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Broadly, converting tends to win when you expect your tax rate in retirement to be higher than the rate you'd pay on the conversion today, and when you can pay the tax from outside savings. If you expect a lower rate later, keeping the money traditional often comes out ahead. This calculator shows the break-even rate for your situation.",
      },
    },
    {
      "@type": "Question",
      name: "Is there an income limit on Roth conversions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Unlike direct Roth IRA contributions, Roth conversions have no income limit, anyone can convert any amount. The conversion is taxed as ordinary income and cannot be undone (recharacterization was eliminated in 2018).",
      },
    },
    {
      "@type": "Question",
      name: "Should I pay the conversion tax from the converted funds or outside savings?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paying the tax from outside savings generally produces a better result, because the full converted amount stays invested and grows tax-free. Paying from the converted funds shrinks the Roth balance and, if you're under 59½, the withheld amount can trigger a 10% early-withdrawal penalty.",
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
    { "@type": "ListItem", position: 3, name: "Roth Conversion Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  {
    q: "What is a Roth conversion?",
    a: "Moving money from a traditional (pre-tax) 401(k)/IRA into a Roth. You pay ordinary income tax on the amount now, and it then grows and comes out tax-free.",
  },
  {
    q: "When does converting make sense?",
    a: "Generally when you expect a higher tax rate in retirement than the rate you'd pay converting today, and you can pay the tax from outside savings. Expect a lower rate later? Keeping it traditional often wins. The calculator shows your break-even rate.",
  },
  {
    q: "Is there an income limit?",
    a: "No. Conversions have no income limit (unlike direct Roth contributions). The conversion is taxed as ordinary income and can't be undone.",
  },
  {
    q: "Pay the tax from the conversion or outside savings?",
    a: "Outside savings usually wins, the full amount stays invested tax-free. Paying from the converted funds shrinks the Roth and can trigger a 10% penalty if you're under 59½.",
  },
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Roth Conversion Calculator
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              See the tax you&apos;d owe now, compare the after-tax value of converting to Roth against keeping your
              traditional account, and find the break-even future tax rate.
            </p>

            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Federal and state taxes built in, all figures in today&apos;s dollars.
            </p>

            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/methodology" className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">See methodology</Link>
              <span className="mx-2" aria-hidden="true">·</span>
              Planning estimates only. Results depend on your inputs, tax status, and assumptions.
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Tax due now", "Convert vs. keep", "Break-even rate", "Federal + state"].map((f) => (
                <span key={f} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {f}
                </span>
              ))}
            </div>

            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-cyan-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <RothConversionCalculator />

          <section
            aria-labelledby="what-included-heading"
            className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 id="what-included-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  How this calculator works
                </h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  <p>
                    It stacks the amount you&apos;d convert on top of your other income for the year and runs it through
                    the same verified federal + state tax engine as the rest of this site, so the conversion tax
                    reflects the actual brackets it falls into, not a single flat rate.
                  </p>
                  <p>
                    Then it grows both paths forward in today&apos;s dollars and compares the after-tax value at
                    withdrawal: the Roth (tax-free) against the traditional account (taxed at your expected retirement
                    rate). The break-even rate tells you the retirement tax rate at which the two paths tie.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Real conversion tax", body: "Computed across federal and state brackets, not a flat rate." },
                    { title: "Both paths compared", body: "After-tax value of converting vs. keeping traditional." },
                    { title: "Break-even rate", body: "The future tax rate where the two paths tie." },
                    { title: "Tax-payment choice", body: "Pay from the conversion or from outside savings." },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50 p-5 dark:border-cyan-900/60 dark:bg-cyan-950/30">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Good to know before you use it</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <p>A conversion is permanent, it can&apos;t be undone once done.</p>
                  <p>
                    A large conversion can push you into higher brackets, raise Medicare (IRMAA) premiums, or reduce ACA
                    subsidies in the conversion year. Some people spread conversions over several years to manage this.
                  </p>
                  <p>
                    This assumes the converted balance is fully pre-tax. If you have after-tax basis in your IRAs, the
                    pro-rata rule blends it in and the taxable portion differs.
                  </p>
                  <p>This calculator is a comparison, not tax or investment advice.</p>
                </div>

                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "Uses your actual brackets, not a flat rate", "Results in today's dollars"].map((t) => (
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
            <h2 id="faq-heading" className="mb-5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                    {q}
                    <span className="flex-shrink-0 text-slate-400 transition-transform group-open:rotate-45 dark:text-slate-500 select-none">+</span>
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
              Explore the accumulation, drawdown, and tax-advantaged sides of your plan.
            </p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Retirement Calculator", href: "/retirement-calculator" },
                { label: "Withdrawal Calculator", href: "/retirement-withdrawal-calculator" },
                { label: "HSA Calculator", href: "/hsa-calculator" },
                { label: "FIRE Calculator", href: "/fire-calculator" },
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
