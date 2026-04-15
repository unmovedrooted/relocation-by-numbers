import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import AdSlot from '@/components/AdSlot'
import RelocationIncomeCalculator from '@/components/RelocationIncomeCalculator'

const SITE_URL = 'https://www.relocationbynumbers.com'
const PAGE_PATH = '/one-income-relocation-calculator'
const CANONICAL = `${SITE_URL}${PAGE_PATH}`

export const metadata: Metadata = {
  title: 'One Income vs Two Income Relocation Calculator | Can You Afford to Move?',
  description:
    'Find out if you can afford to relocate on one income. Compare one-income vs two-income housing costs, taxes, monthly flexibility, and minimum second income needed — for any US city.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: 'website',
    url: CANONICAL,
    siteName: 'Relocation by Numbers',
    title: 'One Income vs Two Income Relocation Calculator',
    description:
      'Can you afford to move there on one income? Compare housing burden, taxes, monthly flexibility, and minimum second income needed for any US city.',
    images: [
      {
        url: `${SITE_URL}/og/one-income-relocation-calculator.png`,
        width: 1200,
        height: 630,
        alt: 'One Income vs Two Income Relocation Calculator',
      },
    ],
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
}

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
        text: 'It depends on the target city, income level, and housing costs. The calculator shows a Safe, Tight, or Stretch verdict based on housing burden and monthly leftover cash.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much second income do we need to make this move work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The calculator estimates both the income needed to break even and the income needed to keep housing under 30% of take-home pay.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does this calculator work for renters and buyers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can compare both rent and buy scenarios, including taxes, monthly housing burden, and affordability.',
      },
    },
  ],
}

const FAQ_ITEMS = [
  {
    q: 'Can a family afford to move on one income?',
    a: 'It depends on the target city, income level, and housing costs. The calculator shows a Safe, Tight, or Stretch verdict based on housing burden and monthly leftover cash.',
  },
  {
    q: 'How much second income do we need to make this move work?',
    a: 'The calculator estimates both the income needed to cover all monthly expenses and the income needed to keep housing under 30% of take-home pay.',
  },
  {
    q: 'Is this calculator for renters and buyers?',
    a: 'Yes. You can compare both rent and buy scenarios, including taxes, monthly housing burden, and affordability.',
  },
  {
    q: 'Does it include taxes and childcare?',
    a: 'Yes. Federal tax, state tax, FICA, and childcare are built into the planning model, with editable inputs.',
  },
  {
    q: 'What does Safe, Tight, or Stretch mean?',
    a: 'Safe means housing stays under 30% of take-home pay with healthy monthly room. Tight means limited flexibility. Stretch means housing pressure is high or cash flow is negative.',
  },
  {
    q: 'Can I use this as a single person moving for a new job?',
    a: 'Yes. Choose a solo household and enter only one income to see how far your paycheck goes in the destination city.',
  },
]

export default function Page() {
  return (
    <>
      <Script
        id="sd-webapp"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <Script
        id="sd-faq"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <header className="py-10 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <span className="mb-4 inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              One Income vs Two Income
            </span>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Can you afford to move there on one income?
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Compare housing costs, taxes, and monthly flexibility for one-income vs two-income households before you relocate.
            </p>

            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Assumptions updated: March 2026
            </div>

            <div className="mt-3">
              <Link
                href="/methodology"
                className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300"
              >
                See methodology
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {['Federal & state taxes', 'Rent & buy', 'Childcare', 'Second income needed', 'City comparison'].map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {f}
                </span>
              ))}
            </div>

            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-violet-600/80" />
          </div>
        </header>

        <section className="mx-auto max-w-5xl space-y-10 px-4 pb-12 sm:px-6">
          {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <AdSlot
                slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP}
                className="min-h-[100px]"
              />
            </section>
          ) : null}

          <RelocationIncomeCalculator />

          {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <AdSlot
                slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
                className="min-h-[100px]"
              />
            </section>
          ) : null}

          <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
              What this calculator helps you answer
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>
                This tool is built to answer a practical relocation question: does the move still work if your household has to rely on one income, or if the second income is delayed?
              </p>
              <p>
                It compares one-income and two-income affordability using taxes, housing burden, monthly flexibility, childcare, and other recurring costs so you can see whether the move looks safe, tight, or stretched.
              </p>
              <p>
                It is especially useful for couples relocating for one job, families moving before a second income is secured, and solo movers trying to pressure-test affordability in a new city.
              </p>
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
                    <span className="select-none text-slate-400 transition-transform group-open:rotate-45 dark:text-slate-500">
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

          <section className="rounded-2xl border border-violet-200/60 bg-violet-50 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Related planning tools
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Keep planning with relocation, cost-of-living, and FIRE tools.
            </p>
            <nav className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/compare"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Compare Cities
              </Link>
              <Link
                href="/cost-of-living/charlotte-nc"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cost of Living Guides
              </Link>
              <Link
                href="/fire-calculator"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                FIRE Calculator
              </Link>
            </nav>
          </section>

          <p className="text-center text-xs text-slate-400 dark:text-slate-600">
            Planning estimates only · Tax figures based on 2025 brackets · Assumptions updated March 2026
          </p>
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
  )
}