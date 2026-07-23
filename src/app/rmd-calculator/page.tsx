import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import RmdCalculator from "@/components/RmdCalculator";

const SITE_URL = "https://www.relocationbynumbers.com";
const PAGE_PATH = "/rmd-calculator";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: "RMD Calculator — Required Minimum Distribution (2025)",
  description:
    "Free RMD calculator. Find your required minimum distribution from a traditional IRA or 401(k) using the IRS Uniform Lifetime Table, plus a multi-year schedule and an estimate of the tax you'll owe.",
  keywords: [
    "rmd calculator",
    "required minimum distribution calculator",
    "rmd calculator 2025",
    "ira rmd calculator",
    "401k rmd calculator",
    "uniform lifetime table",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Relocation by Numbers",
    title: "RMD Calculator — Required Minimum Distribution (2025)",
    description: "Your required minimum distribution from a traditional IRA/401(k), with a multi-year schedule and tax estimate.",
    locale: "en_US",
  },
  twitter: { card: "summary", title: "RMD Calculator — Required Minimum Distribution (2025)", description: "Required minimum distribution with a multi-year schedule and tax estimate.", site: "@relocationbynumbers" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RMD Calculator",
  url: CANONICAL,
  description:
    "Free required minimum distribution (RMD) calculator using the IRS Uniform Lifetime Table, with a multi-year distribution schedule and an estimate of federal and state income tax on each RMD.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "This year's RMD from the Uniform Lifetime Table",
    "Multi-year RMD schedule by age",
    "Estimated income tax on each distribution",
    "SECURE 2.0 age-73 start",
    "PDF and CSV export, shareable links",
  ],
  author: { "@type": "Organization", name: "Relocation by Numbers", url: SITE_URL },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is a required minimum distribution (RMD)?", acceptedAnswer: { "@type": "Answer", text: "An RMD is the minimum amount you must withdraw each year from a traditional IRA or 401(k) once you reach the required age. It's calculated by dividing your prior year-end balance by a life-expectancy factor from the IRS Uniform Lifetime Table." } },
    { "@type": "Question", name: "At what age do RMDs start?", acceptedAnswer: { "@type": "Answer", text: "Under SECURE 2.0, RMDs begin at age 73 for people who reach 72 after 2022. The starting age rises to 75 in 2033. Your first RMD can be delayed to April 1 of the year after you turn 73, but then you'd take two that year." } },
    { "@type": "Question", name: "How is the RMD amount calculated?", acceptedAnswer: { "@type": "Answer", text: "Divide your December 31 prior-year account balance by the distribution period (divisor) for your age from the IRS Uniform Lifetime Table. For example, at age 73 the divisor is 26.5, so a $500,000 balance yields an RMD of about $18,868." } },
    { "@type": "Question", name: "Do Roth accounts have RMDs?", acceptedAnswer: { "@type": "Answer", text: "Roth IRAs have no required minimum distributions during the owner's lifetime. As of 2024, Roth 401(k)s also no longer require RMDs. RMDs apply to traditional (pre-tax) IRAs and 401(k)s." } },
    { "@type": "Question", name: "What happens if I miss an RMD?", acceptedAnswer: { "@type": "Answer", text: "The penalty is 25% of the amount you failed to withdraw, reduced to 10% if you correct it promptly. RMDs are also taxed as ordinary income in the year you take them." } },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Calculators", item: `${SITE_URL}/explore` },
    { "@type": "ListItem", position: 3, name: "RMD Calculator", item: CANONICAL },
  ],
};

const FAQ_ITEMS = [
  { q: "What is an RMD?", a: "The minimum you must withdraw each year from a traditional IRA/401(k) once you reach the required age — your prior year-end balance divided by an IRS Uniform Lifetime Table factor." },
  { q: "At what age do RMDs start?", a: "Age 73 under SECURE 2.0 (rising to 75 in 2033). The first can be delayed to April 1 of the following year, but then you take two that year." },
  { q: "How is it calculated?", a: "December 31 prior-year balance ÷ the age divisor. At 73 the divisor is 26.5, so $500,000 gives about an $18,868 RMD." },
  { q: "Do Roth accounts have RMDs?", a: "No — Roth IRAs never require lifetime RMDs, and as of 2024 neither do Roth 401(k)s. RMDs apply to traditional pre-tax accounts." },
  { q: "What if I miss one?", a: "A 25% penalty on the shortfall (10% if corrected promptly), and the RMD is taxed as ordinary income when taken." },
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">RMD Calculator</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Find your required minimum distribution from a traditional IRA or 401(k) using the IRS Uniform Lifetime
              Table — plus a multi-year schedule and the tax you&apos;ll owe.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-xs text-slate-500 dark:text-slate-400 sm:text-sm">SECURE 2.0 age-73 start · Uniform Lifetime Table · tax estimate.</p>
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/methodology" className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300">See methodology</Link>
              <span className="mx-2" aria-hidden="true">·</span>
              Planning estimates only. Results depend on your inputs, tax status, and assumptions.
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["This year's RMD", "Multi-year schedule", "Tax estimate", "Uniform Lifetime Table"].map((f) => (<span key={f} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{f}</span>))}
            </div>
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-cyan-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          <RmdCalculator />

          <section aria-labelledby="how-heading" className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 id="how-heading" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">How this calculator works</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  <p>
                    Your RMD is your prior year-end balance divided by a life-expectancy factor from the IRS Uniform
                    Lifetime Table for your age. At 73 that factor is 26.5 — about 3.77% of your balance — and it drops
                    each year, so RMDs take a larger share as you age.
                  </p>
                  <p>
                    The calculator shows this year&apos;s RMD, projects the schedule forward as your balance grows and is
                    drawn down, and estimates the federal and state income tax on each distribution using the same
                    verified tax engine as the rest of the site.
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Official divisors", body: "IRS Uniform Lifetime Table (2022 update)." },
                    { title: "Multi-year view", body: "See how RMDs rise as the divisor shrinks." },
                    { title: "Tax estimate", body: "Ordinary income tax, federal + state." },
                    { title: "Age-73 start", body: "SECURE 2.0 timing, rising to 75 in 2033." },
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
                  <p>Missing an RMD triggers a 25% penalty (10% if corrected promptly), so the deadlines matter.</p>
                  <p>This uses the Uniform Lifetime Table. If your sole beneficiary is a spouse more than 10 years younger, a different (lower) table applies.</p>
                  <p>Roth IRAs — and, since 2024, Roth 401(k)s — have no lifetime RMDs.</p>
                  <p>It&apos;s a planning estimate, not tax advice.</p>
                </div>
                <div className="mt-5 space-y-2">
                  {["No account or sign-up required", "IRS Uniform Lifetime Table", "Federal + state tax estimate"].map((t) => (<div key={t} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"><span className="mt-0.5 flex-shrink-0 text-cyan-500">✓</span><span>{t}</span></div>))}
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
            <h2 id="crosssell-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Plan your withdrawals</h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">See how RMDs fit your broader drawdown and tax plan.</p>
            <nav aria-label="Related calculators" className="mt-3 flex flex-wrap gap-3">
              {[
                { label: "Withdrawal Calculator", href: "/retirement-withdrawal-calculator" },
                { label: "Roth Conversion", href: "/roth-conversion-calculator" },
                { label: "Retirement Calculator", href: "/retirement-calculator" },
                { label: "401(k) Calculator", href: "/401k-calculator" },
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
