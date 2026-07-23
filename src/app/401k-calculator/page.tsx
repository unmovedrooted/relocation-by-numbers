import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import Retirement401kCalculator from "@/components/Retirement401kCalculator";

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/401k-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "401(k) Calculator — Employer Match, Tax Savings & Growth",
  description:
    "Free 401(k) calculator. See your employer match, this year's tax savings, and your projected balance at retirement — with 2025 contribution limits and a Monte Carlo range of outcomes.",
  keywords: [
    "401k calculator",
    "401k employer match calculator",
    "401k growth calculator",
    "401k contribution calculator 2025",
    "how much will my 401k be worth",
    "401k tax savings calculator",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "401(k) Calculator — Employer Match, Tax Savings & Growth",
    description: "Employer match, this year's tax savings, and your projected 401(k) balance with a Monte Carlo range.",
    locale: "en_US",
  },
  twitter: { card: "summary", title: "401(k) Calculator — Employer Match, Tax Savings & Growth", description: "Employer match, tax savings, and projected 401(k) balance.", site: "@relocationbynumbers" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "401(k) Calculator",
  url: CANONICAL,
  description:
    "Free 401(k) calculator that shows employer match, this year's federal and state tax savings, and a long-term balance projection with 2025 contribution limits and an optional Monte Carlo range.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Employer match calculation",
    "Federal and state pre-tax savings this year",
    "Projected balance at retirement with growth",
    "2025 contribution limits and catch-up",
    "Monte Carlo range of outcomes",
  ],
  author: { "@type": "Organization", name: "Relocation by Numbers", url: SITE_URL },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "How does employer 401(k) matching work?", acceptedAnswer: { "@type": "Answer", text: "Many employers match a percentage of what you contribute, up to a limit. A common formula is '50% up to 6% of salary,' meaning the employer adds 50 cents per dollar you contribute on the first 6% of your pay. Contributing at least up to the cap captures the full match — it's effectively free money." } },
    { "@type": "Question", name: "What is the 401(k) contribution limit for 2025?", acceptedAnswer: { "@type": "Answer", text: "For 2025, employees can defer up to $23,500. Those age 50-59 or 64+ can add a $7,500 catch-up (up to $31,000), and ages 60-63 can add an enhanced $11,250 catch-up (up to $34,750). The combined employee-plus-employer limit is $70,000." } },
    { "@type": "Question", name: "How much does a 401(k) reduce my taxes?", acceptedAnswer: { "@type": "Answer", text: "Pre-tax (traditional) 401(k) contributions lower your taxable income, cutting federal and, in most states, state income tax now — though not Social Security or Medicare. This calculator estimates your exact savings and the net effect on your paycheck. Withdrawals are taxed later as ordinary income." } },
    { "@type": "Question", name: "Do all states give 401(k) contributions a tax break?", acceptedAnswer: { "@type": "Answer", text: "Most do, matching the federal treatment, but California and Pennsylvania tax 401(k) contributions at the state level, so you don't get a state tax break there." } },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Calculators", item: `${SITE_URL}/explore` },
    { "@type": "ListItem", position: 3, name: "401(k) Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  { q: "How does employer matching work?", a: "Employers often match a percent of your contribution up to a cap — e.g. '50% up to 6%' means 50¢ per $1 on the first 6% of salary. Contributing at least to the cap captures the full match (free money)." },
  { q: "What's the 2025 contribution limit?", a: "$23,500 for employees; +$7,500 catch-up at 50-59/64+, +$11,250 at 60-63. The combined employee + employer limit is $70,000." },
  { q: "How much does a 401(k) cut my taxes?", a: "Pre-tax contributions lower federal and (in most states) state income tax now — not FICA. The calculator shows your savings and the net paycheck effect; withdrawals are taxed later." },
  { q: "Do all states give the tax break?", a: "Most match the federal treatment, but California and Pennsylvania tax 401(k) contributions at the state level." },
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">401(k) Calculator</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              See your employer match, this year&apos;s tax savings, and how your 401(k) could grow by retirement — with
              2025 limits and a realistic range of market outcomes.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Employer match · pre-tax savings · Monte Carlo range.</p>
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/methodology" className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">See methodology</Link>
              <span className="mx-2" aria-hidden="true">·</span>
              Planning estimates only. Results depend on your inputs, tax status, and assumptions.
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["Employer match", "Tax savings", "2025 limits", "Monte Carlo range"].map((f) => (<span key={f} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{f}</span>))}
            </div>
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-cyan-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <Retirement401kCalculator />

          <section aria-labelledby="how-heading" className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 id="how-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">How this calculator works</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  <p>
                    Enter your salary, contribution rate, and your employer&apos;s match formula. The calculator adds
                    your contribution and the employer match, checks it against the 2025 IRS limits, and estimates your
                    federal and state tax savings using the same verified tax engine as the rest of the site.
                  </p>
                  <p>
                    Then it grows the combined contributions plus your current balance to retirement age. Switch to the
                    Monte Carlo view to see a realistic range of outcomes instead of one smooth line.
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Employer match", body: "Captures the 'free money' and flags any you're missing." },
                    { title: "Real tax savings", body: "Federal + state, with CA/PA handled correctly." },
                    { title: "2025 limits", body: "Base, 50+ catch-up, and the 60-63 enhanced catch-up." },
                    { title: "Realistic range", body: "Monte Carlo shows the 10th–90th percentile." },
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
                  <p>Always contribute at least enough to get the full employer match — it&apos;s an immediate, guaranteed return.</p>
                  <p>Pre-tax contributions cut your taxes now; you pay ordinary income tax when you withdraw in retirement.</p>
                  <p>This doesn&apos;t model vesting schedules, Roth 401(k) contributions, loans, or fees.</p>
                  <p>It&apos;s a planning estimate, not tax or investment advice.</p>
                </div>
                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "2025 IRS limits and catch-up", "Seeded, reproducible simulation"].map((t) => (<div key={t} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"><span className="mt-0.5 flex-shrink-0 text-cyan-500">✓</span><span>{t}</span></div>))}
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
            <h2 id="crosssell-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Keep planning your retirement</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">See how your 401(k) fits the bigger picture.</p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Retirement Calculator", href: "/retirement-calculator" },
                { label: "Investment Calculator", href: "/investment-calculator" },
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
