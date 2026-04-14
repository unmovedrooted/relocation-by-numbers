import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import AdSlot from '@/components/AdSlot'
import RelocationIncomeCalculator from '@/components/RelocationIncomeCalculator'

// ─── METADATA ────────────────────────────────────────────────────────────────

const SITE_URL  = 'https://www.relocationbynumbers.com'
const PAGE_PATH = '/one-income-relocation-calculator'
const CANONICAL = `${SITE_URL}${PAGE_PATH}`

export const metadata: Metadata = {
  title: 'One Income vs Two Income Relocation Calculator | Can You Afford to Move?',
  description:
    'Find out if you can afford to relocate on one income. Compare one-income vs two-income housing costs, taxes, monthly flexibility, and minimum second income needed — for any US city.',
  keywords: [
    'one income relocation calculator',
    'can I afford to move on one income',
    'one income vs two income moving calculator',
    'relocation affordability calculator',
    'dual income relocation budget',
    'move on single income',
    'housing affordability by city',
    'minimum income to move to Charlotte',
    'one income family relocation',
    'relocation budget calculator',
    'cost of living one income',
    'afford to move calculator',
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website',
    url: CANONICAL,
    siteName: 'Relocation by Numbers',
    title: 'One Income vs Two Income Relocation Calculator',
    description:
      'Can you afford to move there on one income? Compare housing burden, taxes, monthly flexibility, and minimum second income needed for any US city.',
    images: [{ url: `${SITE_URL}/og/one-income-relocation-calculator.png`, width: 1200, height: 630, alt: 'One Income vs Two Income Relocation Calculator' }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'One Income vs Two Income Relocation Calculator',
    description:
      'Find out if you can afford to relocate on one income — taxes, housing, and monthly flexibility for any US city.',
    images: [`${SITE_URL}/og/one-income-relocation-calculator.png`],
    site: '@relocationbynumbers',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
}

// ─── STRUCTURED DATA ─────────────────────────────────────────────────────────

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'One Income vs Two Income Relocation Calculator',
  url: CANONICAL,
  description:
    'Calculate whether you can afford to relocate on one income. Compares one-income and two-income household affordability, housing burden, monthly flexibility, tax estimates, and minimum second income needed for any US city.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'One income vs two income affordability verdict',
    'Monthly flexibility comparison',
    'Housing pressure as % of take-home pay',
    'Minimum second income needed',
    'Federal, state, and local tax estimates',
    'Rent and buy housing modes',
    'Pre-filled city cost-of-living averages',
    'Childcare and debt payment support',
    'City-by-city comparison across all 50 states',
  ],
  author: {
    '@type': 'Organization',
    name: 'Relocation by Numbers',
    url: SITE_URL,
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Can a family afford to move on one income?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "It depends on the target city, income level, and housing costs. The calculator shows one-income affordability for any US city — including a Safe, Tight, or Stretch verdict based on housing burden and monthly leftover cash. It also shows exactly how much a second income changes the picture.",
      },
    },
    {
      '@type': 'Question',
      name: 'How much second income do we need to make a move work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "The Minimum Second Income Needed card calculates two thresholds: the income needed to break even on monthly cash flow, and the income needed to keep housing under 30% of take-home pay — the standard affordability guideline used by most financial planners.",
      },
    },
    {
      '@type': 'Question',
      name: 'Does this calculator work for renters and buyers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Toggle between Rent and Buy in the housing section. Buy mode factors in your estimated mortgage payment, property tax, homeowners insurance, HOA, and PMI (auto-estimated when down payment is under 20%).",
      },
    },
    {
      '@type': 'Question',
      name: 'Does it include taxes and childcare?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Federal income tax, state income tax (all 50 states), FICA, and local income taxes for major cities are all included. Childcare is a separate editable field pre-filled from city cost-of-living averages.",
      },
    },
    {
      '@type': 'Question',
      name: 'What does Safe, Tight, or Stretch mean?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "These labels combine housing burden and monthly flexibility. Safe means housing is under 30% of take-home pay with healthy leftover cash. Tight means housing is 30–40% with limited flexibility. Stretch means housing exceeds 40% of take-home or monthly cash flow is negative.",
      },
    },
    {
      '@type': 'Question',
      name: 'How accurate are the city cost-of-living averages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "City averages are based on cost-of-living index data and are updated periodically. They are planning estimates — your actual costs will vary. All fields are fully editable so you can enter your real numbers for groceries, utilities, transportation, healthcare, childcare, and miscellaneous expenses.",
      },
    },
  ],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Calculators', item: `${SITE_URL}/explore` },
    { '@type': 'ListItem', position: 3, name: 'One Income Relocation Calculator', item: CANONICAL },
  ],
}

// ─── STATIC CONTENT ───────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Can a family afford to move on one income?',
    a: "It depends on the target city, income level, and housing costs. The calculator shows a Safe, Tight, or Stretch verdict based on housing burden and monthly leftover cash — and how much a second income changes the picture.",
  },
  {
    q: 'How much second income do we need to make this move work?',
    a: "The Minimum Second Income Needed card calculates two thresholds: the amount needed to cover all monthly expenses, and the amount needed to keep housing under 30% of take-home pay — the standard affordability guideline.",
  },
  {
    q: 'Is this calculator for renters and buyers?',
    a: "Yes. Toggle between Rent and Buy in the housing section. Buy mode factors in mortgage payment, property tax, homeowners insurance, HOA, and PMI where applicable.",
  },
  {
    q: 'Does it include taxes and childcare?',
    a: "Yes. Federal income tax, state income tax for all 50 states, FICA, and local taxes for major cities are all included. Childcare is a separate editable field pre-filled from city averages.",
  },
  {
    q: "What does Safe, Tight, or Stretch mean?",
    a: "These labels combine housing burden and monthly flexibility. Safe = housing under 30% of take-home with positive cash flow. Tight = 30–40% housing with limited flexibility. Stretch = housing above 40% or negative monthly cash flow.",
  },
  {
    q: 'How accurate are the city cost-of-living averages?',
    a: "City averages are based on cost-of-living index data, updated periodically. They are planning estimates — your actual costs will vary. All fields are editable so you can enter your real numbers.",
  },
  {
    q: 'Can I use this as a single person moving for a new job?',
    a: "Absolutely. Select Solo as the household type and enter your income in Income 1. The calculator will show you exactly how far your income goes in the target city, including housing burden, monthly flexibility, and tax impact.",
  },
]

const COMPARISONS = [
  { label: 'NYC vs Charlotte', href: '/compare/new-york-city-ny-vs-charlotte-nc' },
  { label: 'LA vs Austin',     href: '/compare/los-angeles-ca-vs-austin-tx' },
  { label: 'Seattle vs Dallas', href: '/compare/seattle-wa-vs-dallas-tx' },
  { label: 'Boston vs Miami',  href: '/compare/boston-ma-vs-miami-fl' },
]

const COL_GUIDES = [
  { label: 'Charlotte', href: '/cost-of-living/charlotte-nc' },
  { label: 'NYC',       href: '/cost-of-living/new-york-city-ny' },
  { label: 'Austin',    href: '/cost-of-living/austin-tx' },
  { label: 'Los Angeles', href: '/cost-of-living/los-angeles-ca' },
  { label: 'Seattle',   href: '/cost-of-living/seattle-wa' },
  { label: 'Boston',    href: '/cost-of-living/boston-ma' },
]

const FI_TOOLS = [
  { label: 'FIRE calculator',     href: '/fire-calculator' },
  { label: 'FIRE with 100k salary', href: '/fire-with-100k-salary' },
  { label: 'FIRE with 150k salary', href: '/fire-with-150k-salary' },
  { label: 'Best cities for FIRE', href: '/best-cities-for-fire' },
  { label: 'Best states for FIRE', href: '/best-states-for-fire' },
]

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <>
      {/* Structured data */}
      <Script id="sd-webapp"     type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <Script id="sd-faq"        type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="sd-breadcrumb" type="application/ld+json" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">

        {/* ── HERO ── */}
        <header className="py-10 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <span className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 mb-4">
              One Income vs Two Income
            </span>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl whitespace-nowrap">
              Can you afford to move there on one income?
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Compare housing costs, taxes, and monthly flexibility for one-income vs two-income households — before you relocate.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {['Federal & state taxes', 'Rent & buy', 'Childcare', 'Min. second income needed', 'City comparison'].map(f => (
                <span key={f} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {f}
                </span>
              ))}
            </div>

            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-violet-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">

          {/* ── AD: Leaderboard — below hero ── */}
          <AdSlot />

          {/* ── CALCULATOR ── */}
          <RelocationIncomeCalculator />

          {/* Popular comparisons */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Popular State-to-State Relocation Comparisons
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              A higher salary can shrink fast after state taxes and housing costs. Compare
              take-home pay and real monthly expenses before you commit to a move.
            </p>
            <div className="mt-5 text-xs font-semibold tracking-widest text-slate-500">
              POPULAR COMPARISONS
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {COMPARISONS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-5">
              <Link
                href="/compare"
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-900"
              >
                Explore all relocation comparisons →
              </Link>
            </div>
          </div>
        </section>

        {/* Popular cost of living */}
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Popular cost of living guides
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {[
              { href: "/cost-of-living/charlotte-nc", label: "Charlotte" },
              { href: "/cost-of-living/nyc-ny", label: "NYC" },
              { href: "/cost-of-living/austin-tx", label: "Austin" },
              { href: "/cost-of-living/la-ca", label: "Los Angeles" },
              { href: "/cost-of-living/seattle-wa", label: "Seattle" },
              { href: "/cost-of-living/boston-ma", label: "Boston" },
              { href: "/cost-of-living/miami-fl", label: "Miami" },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                {x.label}
              </Link>
            ))}
          </div>
        </div>


          {/* ── AD: Rectangle — between links and FI tools ── */}
          <div className="flex justify-center">
            <AdSlot />
          </div>

               {/* FIRE tools */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Financial Independence Tools
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <Link href="/fire-calculator" className="text-blue-600 hover:underline dark:text-blue-400">FIRE calculator</Link>
            <Link href="/fire-with-100k-salary" className="text-blue-600 hover:underline dark:text-blue-400">FIRE with 100k salary</Link>
            <Link href="/fire-with-150k-salary" className="text-blue-600 hover:underline dark:text-blue-400">FIRE with 150k salary</Link>
            <Link href="/best-cities-for-fire" className="text-blue-600 hover:underline dark:text-blue-400">Best cities for FIRE</Link>
            <Link href="/best-states-for-fire" className="text-blue-600 hover:underline dark:text-blue-400">Best states for FIRE</Link>
          </div>
        </section>

          {/* ── FAQ ── */}
          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="mb-5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
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

          {/* ── AD: Leaderboard — above footer ── */}
          <AdSlot />

          {/* ── DISCLAIMER ── */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-600">
            Planning estimates only · Tax figures based on 2025 brackets · Assumptions updated March 2026
          </p>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <a href="/about"      className="transition hover:text-slate-900 dark:hover:text-white">About</a>
              <span aria-hidden="true">•</span>
              <a href="/disclaimer" className="transition hover:text-slate-900 dark:hover:text-white">Disclaimer</a>
              <span aria-hidden="true">•</span>
              <a href="/privacy"    className="transition hover:text-slate-900 dark:hover:text-white">Privacy</a>
              <span aria-hidden="true">•</span>
              <a href="/terms"      className="transition hover:text-slate-900 dark:hover:text-white">Terms</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
