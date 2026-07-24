import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import FederalTaxCalculator from "@/components/FederalTaxCalculator";

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/income-tax-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "Income Tax Calculator, Federal Tax, Brackets & Effective Rate (2025)",
  description:
    "Free federal income tax calculator. See your 2025 federal tax, effective and marginal rates, and a bracket-by-bracket breakdown of how your income is taxed, with an optional state add-on.",
  keywords: [
    "income tax calculator",
    "federal income tax calculator",
    "tax bracket calculator",
    "effective tax rate calculator",
    "marginal tax rate calculator",
    "2025 tax calculator",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "Income Tax Calculator, Federal Tax, Brackets & Effective Rate (2025)",
    description: "Your 2025 federal tax, effective and marginal rates, and a bracket-by-bracket breakdown.",
    locale: "en_US",
  },
  twitter: { card: "summary", title: "Income Tax Calculator, Federal Tax, Brackets & Effective Rate (2025)", description: "Federal tax, effective/marginal rates, and a bracket breakdown.", site: "@relocationbynumbers" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Income Tax Calculator",
  url: CANONICAL,
  description:
    "Free federal income tax calculator showing 2025 federal tax, effective and marginal tax rates, and a bracket-by-bracket breakdown of taxable income, with an optional state income-tax add-on.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "2025 federal income tax and standard deduction",
    "Effective and marginal tax rates",
    "Bracket-by-bracket breakdown",
    "Pre-tax and itemized deductions",
    "Optional state income tax",
  ],
  author: { "@type": "Organization", name: "Relocation by Numbers", url: SITE_URL },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What's the difference between marginal and effective tax rates?", acceptedAnswer: { "@type": "Answer", text: "Your marginal rate is the rate applied to your last dollar of taxable income, the top bracket you reach. Your effective rate is your total tax divided by your income. The effective rate is always lower, because the first portions of your income are taxed at lower bracket rates before you reach the top one." } },
    { "@type": "Question", name: "How do federal tax brackets work?", acceptedAnswer: { "@type": "Answer", text: "The U.S. uses a progressive system: income is taxed in tiers. Only the income that falls within each bracket is taxed at that bracket's rate. So moving into a higher bracket only raises the tax on the income above that threshold, not your whole income." } },
    { "@type": "Question", name: "What is the 2025 standard deduction?", acceptedAnswer: { "@type": "Answer", text: "For 2025 the federal standard deduction is $15,750 for single filers and $31,500 for married filing jointly. Your taxable income is your income minus pre-tax deductions and either the standard deduction or your itemized deductions, whichever is larger." } },
    { "@type": "Question", name: "Does this include Social Security and Medicare?", acceptedAnswer: { "@type": "Answer", text: "No. This is income tax only. Social Security and Medicare (FICA) are separate payroll taxes. To see your full take-home pay including FICA and state tax, use the paycheck calculator." } },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Calculators", item: `${SITE_URL}/explore` },
    { "@type": "ListItem", position: 3, name: "Income Tax Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  { q: "Marginal vs. effective rate?", a: "Marginal is the rate on your last dollar (your top bracket); effective is total tax ÷ income. Effective is always lower because earlier dollars are taxed at lower rates." },
  { q: "How do brackets work?", a: "Progressive tiers: only the income within each bracket is taxed at that rate, so a higher bracket only raises tax on the income above its threshold." },
  { q: "2025 standard deduction?", a: "$15,750 single, $31,500 married filing jointly. Taxable income = income − pre-tax deductions − the larger of the standard or itemized deduction." },
  { q: "Does it include FICA?", a: "No, income tax only. For full take-home including Social Security, Medicare, and state tax, use the paycheck calculator." },
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Income Tax Calculator</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              See your 2025 federal income tax, your effective and marginal rates, and a clear bracket-by-bracket
              breakdown of how each part of your income is taxed.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Federal brackets · effective &amp; marginal rate · optional state.</p>
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/methodology" className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">See methodology</Link>
              <span className="mx-2" aria-hidden="true">·</span>
              Planning estimates only. Results depend on your inputs, tax status, and assumptions.
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Federal tax", "Effective & marginal rate", "Bracket breakdown", "Optional state"].map((f) => (<span key={f} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{f}</span>))}
            </div>
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-cyan-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <FederalTaxCalculator />

          <section aria-labelledby="how-heading" className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 id="how-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">How this calculator works</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  <p>
                    It subtracts your pre-tax deductions and either the standard or your itemized deduction to find your
                    taxable income, then runs it through the 2025 federal brackets, taxing each tier of income at its
                    own rate. The result is your federal tax, your marginal rate (the rate on your last dollar), and
                    your effective rate (total tax over income).
                  </p>
                  <p>
                    The bracket bar shows exactly how your income fills each tier, which makes it clear why moving into
                    a higher bracket doesn&apos;t raise the tax on your whole income, only the part above the threshold.
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Bracket breakdown", body: "See income taxed in each tier, not just a total." },
                    { title: "Both rates", body: "Marginal and effective, side by side." },
                    { title: "Deductions", body: "Standard, itemized, and pre-tax contributions." },
                    { title: "Optional state", body: "Add your state income tax for a combined rate." },
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
                  <p>This is income tax only, it doesn&apos;t include Social Security or Medicare (FICA). For full take-home, use the paycheck calculator.</p>
                  <p>It uses the standard deduction unless your itemized total is higher, and doesn&apos;t model tax credits, the QBI deduction, AMT, or capital-gains rates.</p>
                  <p>Comparing a move? The optional state add-on shows how your combined rate changes by state.</p>
                  <p>It&apos;s an estimate, not tax advice.</p>
                </div>
                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "2025 federal brackets", "Effective and marginal rates"].map((t) => (<div key={t} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"><span className="mt-0.5 flex-shrink-0 text-cyan-500">✓</span><span>{t}</span></div>))}
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="mb-5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">Frequently asked questions</h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map(({ q, a }) => (
                <details key={q} className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">{q}<span className="flex-shrink-0 text-slate-400 transition-transform group-open:rotate-45 dark:text-slate-500 select-none">+</span></summary>
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">{a}</div>
                </details>
              ))}
            </div>
          </section>

          <section aria-labelledby="crosssell-heading" className="rounded-2xl border border-cyan-200/60 bg-cyan-50 p-5 dark:border-cyan-900/40 dark:bg-cyan-950/20">
            <h2 id="crosssell-heading" className="text-sm font-semibold text-slate-900 dark:text-white">See the full picture</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Go from income tax to full take-home and beyond.</p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Paycheck Calculator", href: "/paycheck-calculator" },
                { label: "Compare Cities", href: "/compare-cities" },
                { label: "401(k) Calculator", href: "/401k-calculator" },
                { label: "FIRE Calculator", href: "/fire-calculator" },
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
