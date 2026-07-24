import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import HousingAffordabilityCalculator from "@/components/HousingAffordabilityCalculator";

// ─────────────────────────────────────────────────────────────
// METADATA
// ─────────────────────────────────────────────────────────────

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/housing-affordability-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Housing Affordability Calculator, How Much Rent or House Can I Afford?",
  description:
    "Free housing affordability calculator. Enter your income to see how much rent you can afford (30% rule) and the maximum home price you qualify for using standard 28/36 debt-to-income guidelines.",
  keywords: [
    "housing affordability calculator",
    "how much rent can I afford",
    "how much house can I afford",
    "30% rule rent calculator",
    "debt to income calculator",
    "28/36 rule calculator",
    "rent affordability",
    "home affordability calculator",
    "max mortgage calculator",
  ],
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "Housing Affordability Calculator, How Much Rent or House Can I Afford?",
    description:
      "See how much rent you can afford using the 30% rule, and the maximum home price you qualify for using standard 28/36 debt-to-income guidelines. Just enter your income.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Housing Affordability Calculator, How Much Rent or House Can I Afford?",
    description:
      "Enter your income to see your safe rent range and maximum affordable home price, using standard lending guidelines.",
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
  name: "Housing Affordability Calculator",
  url: CANONICAL,
  description:
    "Free housing affordability calculator covering both renting (30% rule) and buying (28/36 debt-to-income guidelines), including an estimated monthly payment breakdown for buyers.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Max affordable rent using the 30% rule",
    "Debt-adjusted rent guidance using back-end DTI",
    "Max affordable home price using front-end and back-end DTI",
    "Estimated monthly payment breakdown (P&I, tax, insurance, HOA, PMI)",
    "State-level property tax and insurance defaults",
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
      name: "How much of my income should go to rent?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The most common guideline is the 30% rule: spend no more than 30% of your gross (pre-tax) monthly income on rent. A more comfortable target is 25%, and 35%+ starts to strain most budgets, especially once other debts are factored in.",
      },
    },
    {
      "@type": "Question",
      name: "How much house can I afford based on my income?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Lenders typically use two debt-to-income (DTI) ratios: front-end DTI (housing costs alone) at or below 28% of gross monthly income, and back-end DTI (housing plus all other debts) at or below 36%. Your maximum home price is set by whichever ratio is more restrictive.",
      },
    },
    {
      "@type": "Question",
      name: "What counts as 'other debts' in a DTI calculation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Car loans, student loans, credit card minimum payments, personal loans, and any other recurring debt obligation that appears on your credit report. It does not typically include utilities, groceries, or discretionary spending.",
      },
    },
    {
      "@type": "Question",
      name: "Is this calculator based on gross or net income?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Gross (pre-tax) income, matching how the 30% rent rule and lender DTI ratios are conventionally quoted. Your actual after-tax discretionary budget will be tighter than these figures suggest.",
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
    { "@type": "ListItem", position: 3, name: "Housing Affordability Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  {
    q: "How much of my income should go to rent?",
    a: "The classic guideline is the 30% rule, no more than 30% of gross monthly income. 25% is more comfortable; 35%+ gets tight, especially with other debts.",
  },
  {
    q: "How much house can I afford?",
    a: "Lenders use front-end DTI (housing only, ≤28% of gross income) and back-end DTI (housing + all debts, ≤36%). Your max price is set by whichever is more restrictive.",
  },
  {
    q: "What counts as 'other debts'?",
    a: "Car loans, student loans, credit card minimums, personal loans, recurring obligations that show up on a credit report.",
  },
  {
    q: "Gross or net income?",
    a: "Gross (pre-tax), matching how the 30% rule and lender DTI guidelines are conventionally quoted. Your real after-tax budget will be tighter.",
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
              Housing Affordability Calculator
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              How much rent or house can you actually afford? Enter your income to see safe ranges for both,
              using the standard 30% rent rule and 28/36 debt-to-income guidelines.
            </p>

            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              Works for anyone, no specific city or move required.
            </p>

            <div className="mt-3">
              <Link
                href="/methodology"
                className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300"
              >
                See methodology
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["30% rent rule", "28/36 DTI", "Buy vs rent", "State tax defaults"].map((f) => (
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
          {/* Ad slots hidden for now, re-enable by restoring the two
              AdSlot blocks (see git history) once ready to show ads here. */}

          <HousingAffordabilityCalculator />

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
                    Enter your gross annual income and any other monthly debts. The{" "}
                    <strong className="text-slate-800 dark:text-slate-200">Renting</strong> tab applies the classic
                    30% rule (plus a comfortable 25% and a debt-adjusted figure). The{" "}
                    <strong className="text-slate-800 dark:text-slate-200">Buying</strong> tab uses the same
                    28/36 debt-to-income guidelines lenders reference, solving for the maximum home price your
                    income supports at a given rate, term, and down payment.
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "30% rent rule", body: "Comfortable, recommended, and debt-adjusted rent tiers." },
                    { title: "28/36 DTI for buying", body: "Front-end and back-end guidelines, whichever is stricter." },
                    { title: "Monthly payment breakdown", body: "P&I, property tax, insurance, HOA, and PMI when applicable." },
                    { title: "State tax & insurance defaults", body: "Optional state picker fills in typical assumptions." },
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
                    All figures use <strong>gross</strong> (pre-tax) income, matching how the 30% rule and DTI
                    guidelines are conventionally quoted. Your real after-tax budget will be tighter.
                  </p>
                  <p>
                    Lenders apply both front-end and back-end ratios and use whichever is more restrictive, this
                    tool does the same, so adding debts can only tighten your buying power, never loosen it.
                  </p>
                  <p>These are planning guidelines, not guaranteed loan approval or lease terms.</p>
                  <p>This calculator is not financial, tax, or legal advice.</p>
                </div>

                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "Works for renting or buying", "Not tied to a specific city or move"].map((t) => (
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
              Ready to run the full numbers?
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Once you know your range, the Mortgage Calculator covers a specific home price in detail, or plan a
              full relocation budget by city.
            </p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Mortgage Calculator", href: "/mortgage-calculator" },
                { label: "Relocation Calculator", href: "/" },
                { label: "Europe", href: "/europe-relocation-calculator" },
                { label: "Asia", href: "/asia-relocation-calculator" },
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
