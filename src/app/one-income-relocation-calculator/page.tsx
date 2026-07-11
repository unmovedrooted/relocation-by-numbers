import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import RelocationIncomeCalculator from '@/components/RelocationIncomeCalculator'

// ─── Constants ────────────────────────────────────────────────────────────────

const SITE_URL  = 'https://www.relocationbynumbers.com'
const PAGE_PATH = '/one-income-relocation-calculator'
const CANONICAL = `${SITE_URL}${PAGE_PATH}`

// ─── Metadata ─────────────────────────────────────────────────────────────────

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
      'Can you afford to move on one income — or do you need two? Compare housing burden, taxes, monthly flexibility, and minimum second income needed for any US city.',
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

// ─── Structured data ──────────────────────────────────────────────────────────

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
      name: 'How much salary do I need to move to a new city?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It depends on rent, local taxes, and lifestyle costs in that city. This calculator estimates the income needed to cover expenses and maintain a safe housing-to-income ratio, customized for 100+ US cities.',
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

// ─── Force dynamic rendering so the example preview rotates per request ───────
export const dynamic = 'force-dynamic'

// ─── Rotating example previews (server picks one at request time) ─────────────

const EXAMPLE_PREVIEWS = [
  {
    city:    'Charlotte, NC',
    income:  '$95K',
    net:     '~$5,400',
    housing: '$2,200+',
    note:    'leaving less breathing room than most couples expect on one income.',
  },
  {
    city:    'Austin, TX',
    income:  '$110K',
    net:     '~$6,700',
    housing: '$2,800+',
    note:    'and housing pressure is high enough to tip many households into Stretch territory.',
  },
  {
    city:    'Raleigh, NC',
    income:  '$85K',
    net:     '~$4,900',
    housing: '$1,900+',
    note:    'which still leaves one of the tighter monthly cushions of any Sun Belt city.',
  },
]

// ─── FAQ content ──────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Is moving on one income a bad idea?',
    a: 'Not always — but it depends on how much flexibility you have after housing, taxes, and fixed costs. This calculator shows whether you\'re safely within budget or at risk of financial strain. Many couples move on one income successfully; the key is knowing the numbers first.',
  },
  {
    q: 'Can a family afford to move on one income?',
    a: 'It depends on the target city, income level, and housing costs. The calculator shows a Safe, Tight, or Stretch verdict based on housing burden and monthly leftover cash — so you get a clear answer, not a guess.',
  },
  {
    q: 'How much salary do I need to move to a new city?',
    a: 'It depends on rent, local taxes, and lifestyle costs in that city. This calculator estimates the minimum income needed to cover expenses and stay under a safe housing ratio — customized per city, not national averages.',
  },
  {
    q: 'How much second income do we need to make this move work?',
    a: 'The calculator estimates two thresholds: the income needed to simply break even month-to-month, and the higher income needed to keep housing under 30% of take-home. Most couples need the second figure to feel comfortable.',
  },
  {
    q: 'Is this calculator for renters and buyers?',
    a: 'Yes. Toggle between rent and buy. The buy mode estimates mortgage P&I, property tax, homeowners insurance, and PMI based on your city and down payment. Both modes feed the same affordability verdict.',
  },
  {
    q: 'Does it include taxes and childcare?',
    a: 'Yes. Federal tax, state income tax, FICA, and city-level local taxes are built into the take-home estimate. Childcare costs are pre-filled by city and household type, and you can edit all inputs.',
  },
  {
    q: 'What does Safe, Tight, or Stretch mean?',
    a: 'Safe means housing stays under 30% of take-home with at least $400/month left over. Tight means limited flexibility or housing between 30–40%. Stretch means housing pressure is high or monthly cash flow turns negative.',
  },
  {
    q: 'Can I use this as a single person moving for a new job?',
    a: 'Yes. Choose Solo household and enter one income. The tool calculates your take-home, housing burden, and monthly flexibility in the destination city — and flags whether you\'re in safe or stretched territory.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  // Rotates per server render — different example each page load
  const example = EXAMPLE_PREVIEWS[new Date().getMinutes() % EXAMPLE_PREVIEWS.length]

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

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">

        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <header className="relative overflow-hidden py-14 text-center sm:py-20">
          {/* Subtle radial glow — gives depth without being loud */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-[420px] w-[700px] rounded-full bg-violet-100/50 blur-3xl dark:bg-violet-950/30" />
          </div>

          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            {/* Eyebrow badge */}
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              One Income vs Two Income
            </span>

            {/* Headline — tension + specificity */}
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl sm:leading-[1.1]">
              Can you actually afford<br className="hidden sm:block" /> this move on one income?
            </h1>

            {/* Emotional hook */}
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 dark:text-slate-400 sm:text-lg">
              Most people underestimate how tight a move feels on one income.
              This calculator shows you the real numbers — before you sign a lease.
            </p>

            {/* Trust line */}
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Real tax estimates · City-level housing data · 100+ US cities · Free, no signup
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Takes less than 60 seconds
            </p>

            {/* Feature pills */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[
                { label: 'Federal & state taxes',         highlight: false },
                { label: 'Rent & buy modes',              highlight: false },
                { label: 'Childcare costs',               highlight: false },
                { label: 'Second income needed',          highlight: true  },
                { label: 'Safe / Tight / Stretch verdict', highlight: false },
              ].map(({ label, highlight }) => (
                <span
                  key={label}
                  className={
                    highlight
                      ? 'rounded-full border border-transparent bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-sm'
                      : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Divider accent */}
            <div className="mx-auto mt-8 h-px w-24 rounded-full bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
          </div>
        </header>

        {/* ── PROOF BAR ──────────────────────────────────────────────────────── */}
        <div className="border-y border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
            {[
              { stat: '100+',         label: 'US cities modeled' },
              { stat: 'Real taxes',   label: 'Federal + state + local' },
              { stat: 'Instant answer', label: 'Safe · Tight · Stretch' },
            ].map(({ stat, label }) => (
              <div key={label} className="py-4 text-center">
                <p className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">{stat}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-5xl space-y-10 px-4 pb-16 pt-8 sm:px-6">

          {/* ── WHO THIS IS FOR ─────────────────────────────────────────────── */}
          <section aria-label="Who this calculator is for">
            <h2 className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              This calculator is for you if…
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  icon: '💼',
                  title: 'One job secured, one pending',
                  body: 'You\'re relocating for one offer and not sure when the second income arrives.',
                },
                {
                  icon: '🏡',
                  title: 'Moving before the plan is set',
                  body: 'You need to know if the move works at all on one salary, just in case.',
                },
                {
                  icon: '🧍',
                  title: 'Solo mover pressure-testing',
                  body: 'You want to see exactly how far your paycheck goes in the new city.',
                },
              ].map(({ icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="text-2xl">{icon}</span>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── KILLER FEATURE HOOK ─────────────────────────────────────────── */}
          <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 dark:border-violet-800/50 dark:bg-violet-950/30">
            <div className="flex items-start gap-3 sm:items-center">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white sm:mt-0">
                ↓
              </span>
              <p className="text-sm text-violet-900 dark:text-violet-200">
                <strong>See instantly:</strong> the exact second income your household needs to make this move work — down to the dollar, after taxes.
              </p>
            </div>
          </div>

          {/* ── TOP AD SLOT — removed, add back when ready ──────────────────── */}

          {/* ── PREVIEW RESULT ──────────────────────────────────────────────── */}
          {/* Rotates across 3 real city scenarios — gives a taste before any input */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <span className="mr-1.5 font-semibold text-slate-900 dark:text-white">
              Example:
            </span>
            A {example.income} salary in {example.city} becomes {example.net}/month after taxes — but housing alone can take {example.housing},{' '}
            {example.note}
          </div>

          {/* ── CALCULATOR ──────────────────────────────────────────────────── */}
          <div id="calculator">
            <RelocationIncomeCalculator />
          </div>

          {/* ── POST-CALCULATOR REASSURANCE + CTA ───────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              These results include estimated taxes, housing, and baseline living costs — adjust inputs for your exact situation.
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Want to compare this city with another option?
            </p>
            <Link
              href="/compare"
              className="mt-3 inline-block rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Compare Cities →
            </Link>
          </div>

          {/* ── HIGH-STAKES LINE ─────────────────────────────────────────────── */}
          <p className="text-sm text-slate-500 dark:text-slate-400">
            If this move doesn't work on one income, you need to know before you commit — not after.
          </p>

          {/* ── HOW IT WORKS ─────────────────────────────────────────────────  */}
          <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              How to use this calculator
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Four inputs. One clear verdict.
            </p>

            <ol className="mt-5 space-y-4">
              {[
                {
                  step: '01',
                  title: 'Enter your income',
                  body: 'Add income, 401(k), and filing status for accurate take-home — one income or two.',
                },
                {
                  step: '02',
                  title: 'Choose your cities',
                  body: 'Pick origin and destination. Tax rates and cost-of-living multipliers adjust automatically.',
                },
                {
                  step: '03',
                  title: 'Set your housing costs',
                  body: 'Toggle rent or buy. Rent auto-fills from city data; buy mode estimates mortgage, tax, insurance, and PMI.',
                },
                {
                  step: '04',
                  title: 'Read your verdict',
                  body: 'Get Safe, Tight, or Stretch — plus the exact second income needed to make the move work.',
                },
              ].map(({ step, title, body }) => (
                <li key={step} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── MID AD SLOT — removed, add back when ready ──────────────────── */}

          {/* ── WHAT THIS ANSWERS ────────────────────────────────────────────  */}
          <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              What this calculator helps you answer
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>
                This tool is built to answer a practical relocation question: does the move still work if your household has to rely on one income, or if the second income is delayed?
              </p>
              <p>
                It compares one-income and two-income affordability using real tax estimates, housing burden, monthly flexibility, childcare, and other recurring costs — so you can see whether the move looks safe, tight, or stretched before you commit.
              </p>
              <p>
                It is especially useful for couples relocating for one job, families moving before a second income is secured, and solo movers trying to pressure-test affordability in a new city.
              </p>
            </div>
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Assumptions updated March 2026 ·{' '}
              <Link href="/methodology" className="underline underline-offset-2 hover:no-underline">
                See methodology
              </Link>
            </p>
          </section>

          {/* ── FAQ ─────────────────────────────────────────────────────────── */}
          <section aria-labelledby="faq-heading">
            {/* Fix 7 — pain line keeps emotional tension alive before FAQ */}
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              Most relocation mistakes happen because people assume their income stretches further than it actually does.
            </p>
            <h2
              id="faq-heading"
              className="mb-4 text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg"
            >
              Frequently asked questions
            </h2>
            <div className="space-y-2">
              {FAQ_ITEMS.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                    {q}
                    <span className="shrink-0 select-none text-slate-400 transition-transform duration-200 group-open:rotate-45 dark:text-slate-500">
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

          {/* ── RELATED TOOLS ────────────────────────────────────────────────  */}
          <section className="rounded-2xl border border-violet-200/60 bg-violet-50 p-5 dark:border-violet-900/40 dark:bg-violet-950/20">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Keep planning
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              More tools for your relocation decision.
            </p>
            <nav className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/compare"
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Compare Cities
              </Link>
              <Link
                href="/cost-of-living/charlotte-nc"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cost of Living Guides
              </Link>
              <Link
                href="/fire-calculator"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                FIRE Calculator
              </Link>
            </nav>
          </section>

          <p className="text-center text-xs text-slate-400 dark:text-slate-600">
            Planning estimates only · Tax figures based on 2025 brackets · Assumptions updated March 2026
          </p>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <a href="/about"       className="transition hover:text-slate-900 dark:hover:text-white">About</a>
              <span aria-hidden="true">·</span>
              <a href="/disclaimer"  className="transition hover:text-slate-900 dark:hover:text-white">Disclaimer</a>
              <span aria-hidden="true">·</span>
              <a href="/privacy"     className="transition hover:text-slate-900 dark:hover:text-white">Privacy</a>
              <span aria-hidden="true">·</span>
              <a href="/terms"       className="transition hover:text-slate-900 dark:hover:text-white">Terms</a>
              <span aria-hidden="true">·</span>
              <a href="/methodology" className="transition hover:text-slate-900 dark:hover:text-white">Methodology</a>
            </div>
          </div>
        </footer>

        {/* ── STICKY MOBILE CTA ────────────────────────────────────────────── */}
        {/* Hidden on sm+ where the calculator is already visible in the viewport */}
        <a
          href="#calculator"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg ring-1 ring-violet-500/30 transition hover:bg-violet-500 sm:hidden"
        >
          <span>Start Calculator</span>
          <span aria-hidden>↑</span>
        </a>

      </main>
    </>
  )
}
