import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import USMapPreview from "@/components/USMapPreview";

export const metadata: Metadata = {
  title: "Relocation & FIRE Tools Hub | Cost of Living, Salary, Tax & Mortgage Calculators",
  description:
    "Compare cost of living, taxes, and take-home pay across US cities and states. Explore FIRE calculators, relocation comparisons, salary guides, a mortgage calculator, and financial independence tools in one place.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/explore",
  },
  openGraph: {
    title: "Relocation & FIRE Tools Hub | Cost of Living, Salary, Tax & Mortgage Calculators",
    description:
      "Compare cost of living, taxes, and take-home pay across US cities and states. Explore FIRE calculators, relocation comparisons, salary guides, and a mortgage calculator.",
    url: "https://www.relocationbynumbers.com/explore",
    siteName: "Relocation by Numbers",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Relocation & FIRE Tools Hub | Cost of Living, Salary, Tax & Mortgage Calculators",
    description:
      "Compare cost of living, taxes, and take-home pay across US cities and states. Explore FIRE calculators, relocation comparisons, salary guides, and a mortgage calculator.",
  },
};

type HubLink = {
  href: string;
  title: string;
  description?: string;
};

type HubSection = {
  title: string;
  description?: string;
  links: HubLink[];
  ctaHref?: string;
  ctaLabel?: string;
};

const quickLinks: HubLink[] = [
  {
    href: "/compare/nyc-ny/charlotte-nc",
    title: "NYC → Charlotte",
    description: "Compare affordability, taxes, and monthly costs.",
  },
  {
    href: "/compare/nyc-ny/austin-tx",
    title: "NYC → Austin",
    description: "See how a move could change your FIRE path.",
  },
  {
    href: "/fire-calculator",
    title: "FIRE Calculator",
    description: "Estimate your FIRE age and financial independence number.",
  },
  {
    href: "/mortgage-calculator",
    title: "Mortgage Calculator",
    description: "Monthly payments, cash to close, rent vs buy, DTI, and refinance — US & international.",
  },
  {
    href: "/international-relocation",
    title: "International Relocation Calculator",
    description: "Compare taxes, rent, living costs, and moving expenses across countries.",
  },
  {
    href: "/best-cities-for-fire",
    title: "Best Cities for FIRE",
    description: "Browse cities where your money may go further.",
  },
  {
    href: "/salary-needed-in/charlotte-nc",
    title: "Salary Needed in Charlotte",
    description: "Estimate the income needed to live comfortably.",
  },
  {
    href: "/best-states-for-fire/north-carolina",
    title: "North Carolina for FIRE",
    description: "Explore one of the strongest relocation targets on the site.",
  },
];

const sections: HubSection[] = [
  {
    title: "Featured Relocation Comparisons",
    description:
      "Start with some of the most popular city-to-city moves on the site. Compare take-home pay, housing costs, and monthly budgets side by side.",
    links: [
      { href: "/compare/nyc-ny/charlotte-nc", title: "Compare NYC vs Charlotte" },
      { href: "/compare/nyc-ny/austin-tx", title: "Compare NYC vs Austin" },
      { href: "/compare/nyc-ny/la-ca", title: "Compare NYC vs Los Angeles" },
      { href: "/compare/austin-tx/seattle-wa", title: "Compare Austin vs Seattle" },
      { href: "/compare/boston-ma/miami-fl", title: "Compare Boston vs Miami" },
      { href: "/compare/charlotte-nc/miami-fl", title: "Compare Charlotte vs Miami" },
    ],
    ctaHref: "/compare",
    ctaLabel: "Explore all relocation comparisons",
  },
  {
    title: "City Cost of Living Guides",
    description:
      "Browse cost of living pages for major US cities — covering rent, median home prices, property tax, and the salary you need to live comfortably.",
    links: [
      { href: "/cost-of-living/charlotte-nc", title: "Charlotte Cost of Living" },
      { href: "/cost-of-living/nyc-ny", title: "NYC Cost of Living" },
      { href: "/cost-of-living/austin-tx", title: "Austin Cost of Living" },
      { href: "/cost-of-living/la-ca", title: "Los Angeles Cost of Living" },
      { href: "/cost-of-living/seattle-wa", title: "Seattle Cost of Living" },
      { href: "/cost-of-living/boston-ma", title: "Boston Cost of Living" },
      { href: "/cost-of-living/miami-fl", title: "Miami Cost of Living" },
    ],
  },
  {
    title: "Mortgage & Home Buying",
    description:
      "Plan a home purchase with a full decision toolkit — monthly payments, cash to close, rent vs buy break-even, DTI affordability check, rate sensitivity, and refinance analysis. Covers US and 26 international markets.",
    links: [
      {
        href: "/mortgage-calculator",
        title: "Mortgage Calculator",
        description: "Monthly payment, cash to close, DTI, rent vs buy break-even, rate sensitivity, and amortization schedule.",
      },
      {
        href: "/mortgage-calculator#refinance",
        title: "Refinance Calculator",
        description: "See your break-even month, monthly savings, and lifetime savings on any refi scenario.",
      },
      {
        href: "/mortgage-calculator#international",
        title: "International Mortgage Calculator",
        description: "Foreign buyer notes, indicative rates, and upfront cost estimates for 26 countries.",
      },
    ],
    ctaHref: "/mortgage-calculator",
    ctaLabel: "Open the mortgage calculator",
  },
  {
    title: "International Relocation Calculators",
    description:
      "Compare taxes, rent, living costs, and take-home pay across international destinations. Estimate your moving budget for cities in Europe, Asia, the Caribbean, and South America.",
    links: [
      {
        href: "/international-relocation",
        title: "International Relocation Calculator",
        description: "Compare cities across Europe, Asia, the Middle East, and North America.",
      },
      {
        href: "/europe-relocation-calculator",
        title: "Europe Relocation Calculator",
        description: "Compare Lisbon, Porto, London, and 35+ European destinations.",
      },
      {
        href: "/asia-relocation-calculator",
        title: "Asia Relocation Calculator",
        description: "Compare Bangkok, Tokyo, Singapore, Kuala Lumpur, Seoul, Dubai, and more.",
      },
      {
        href: "/caribbean-relocation-calculator",
        title: "Caribbean Relocation Calculator",
        description: "Compare 10 Caribbean destinations including Jamaica, Barbados, and Cayman Islands.",
      },
      {
        href: "/south-america-relocation-calculator",
        title: "South America Relocation Calculator",
        description: "Compare Medellín, Bogotá, Buenos Aires, Santiago, Lima, and São Paulo.",
      },
    ],
    ctaHref: "/international-relocation",
    ctaLabel: "Open the international calculator",
  },
  {
    title: "FIRE & Retirement Calculators",
    description:
      "Calculate your FIRE number, retirement target, and financial independence timeline. Compare FIRE styles — Lean, Barista, Coast — and see how location affects your path.",
    links: [
      { href: "/fire-calculator", title: "FIRE Calculator" },
      { href: "/fire-number-calculator", title: "FIRE Number Calculator" },
      { href: "/coast-fire-calculator", title: "Coast FIRE Calculator" },
      { href: "/barista-fire-calculator", title: "Barista FIRE Calculator" },
      { href: "/lean-fire-calculator", title: "Lean FIRE Calculator" },
      { href: "/how-much-do-i-need-to-retire", title: "How Much Do I Need to Retire?" },
      { href: "/savings-rate-for-fire", title: "Savings Rate for FIRE" },
    ],
    ctaHref: "/fire-calculator",
    ctaLabel: "Open the main FIRE calculator",
  },
  {
    title: "FIRE by Income Level",
    description:
      "Explore FIRE timelines at specific salary levels. See how income, taxes, and location interact for common earnings.",
    links: [
      { href: "/fire-with-70k-salary", title: "Can You FIRE on a $70K Salary?" },
      { href: "/fire-with-100k-salary", title: "Can You FIRE on a $100K Salary?" },
      { href: "/fire-with-150k-salary", title: "Can You FIRE on a $150K Salary?" },
    ],
  },
  {
    title: "Best Cities for FIRE",
    description:
      "Explore which cities offer the best combination of low taxes, affordable housing, and strong FIRE potential.",
    links: [
      { href: "/best-cities-for-fire", title: "Best Cities for FIRE" },
      { href: "/best-cities-for-fire/nyc-ny", title: "FIRE in NYC" },
      { href: "/best-cities-for-fire/miami-fl", title: "FIRE in Miami" },
      { href: "/best-cities-for-fire/atlanta-ga", title: "FIRE in Atlanta" },
      { href: "/best-cities-for-fire/charlotte-nc", title: "FIRE in Charlotte" },
      { href: "/best-cities-for-fire/austin-tx", title: "FIRE in Austin" },
      { href: "/best-cities-for-fire/seattle-wa", title: "FIRE in Seattle" },
      { href: "/best-cities-for-fire/denver-co", title: "FIRE in Denver" },
    ],
  },
  {
    title: "Best States for FIRE",
    description:
      "State-level pages covering income taxes, affordability, housing costs, and financial independence potential by state.",
    links: [
      { href: "/best-states-for-fire/north-carolina", title: "North Carolina for FIRE" },
      { href: "/best-states-for-fire/texas", title: "Texas for FIRE" },
      { href: "/best-states-for-fire/florida", title: "Florida for FIRE" },
      { href: "/best-states-for-fire/new-york", title: "New York for FIRE" },
    ],
  },
  {
    title: "Can You FIRE in This City?",
    description:
      "City-specific pages focused on whether financial independence is realistic — covering costs, taxes, and timeline estimates.",
    links: [
      { href: "/fire-in/raleigh-nc", title: "Can You FIRE in Raleigh?" },
      { href: "/fire-in/austin-tx", title: "Can You FIRE in Austin?" },
      { href: "/fire-in/denver-co", title: "Can You FIRE in Denver?" },
      { href: "/fire-in/charlotte-nc", title: "Can You FIRE in Charlotte?" },
    ],
  },
  {
    title: "Salary Needed by City",
    description:
      "Estimate the gross income required to cover rent and living costs in key US cities based on the 30% housing rule.",
    links: [
      { href: "/salary-needed-in/austin-tx", title: "Salary Needed in Austin" },
      { href: "/salary-needed-in/raleigh-nc", title: "Salary Needed in Raleigh" },
      { href: "/salary-needed-in/denver-co", title: "Salary Needed in Denver" },
      { href: "/salary-needed-in/charlotte-nc", title: "Salary Needed in Charlotte" },
    ],
  },
];

function SectionCard({ section }: { section: HubSection }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {section.title}
          </h2>
          {section.description ? (
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              {section.description}
            </p>
          ) : null}
        </div>

        {section.ctaHref && section.ctaLabel ? (
          <Link
            href={section.ctaHref}
            className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
          >
            {section.ctaLabel} →
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {section.links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/40 hover:bg-slate-900"
          >
            <div className="text-base font-semibold text-white transition group-hover:text-emerald-200">
              {link.title}
            </div>
            {link.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {link.description}
              </p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Open this page →
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-12">

          {/* Hero */}
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-6 py-10 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:px-8">
            <div className="max-w-4xl space-y-5">
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Relocation by Numbers
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Compare States, Cities &amp; FIRE Paths in One Place
              </h1>

              <p className="max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Explore relocation comparisons, cost of living guides, salary tools,
                FIRE calculators, and a full mortgage calculator to find places where
                your money goes further. Compare take-home pay and taxes across all 50
                states, estimate your FIRE number, and plan a home purchase — at home
                or abroad.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/compare/nyc-ny/charlotte-nc"
                  className="inline-flex items-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                >
                  Explore Comparisons
                </Link>
                <Link
                  href="/fire-calculator"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open FIRE Tools
                </Link>
                <Link
                  href="/mortgage-calculator"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Mortgage Calculator
                </Link>
                <a
                  href="#map"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explore the Map
                </a>
              </div>
            </div>
          </section>

          {/* Quick links */}
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Start Here
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Jump into the most popular tools and pages on the site — relocation
                comparisons, FIRE calculators, a mortgage calculator, and cost of living guides.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-emerald-300/40 hover:bg-white/[0.05]"
                >
                  <div className="text-lg font-semibold text-white group-hover:text-emerald-200">
                    {link.title}
                  </div>
                  {link.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {link.description}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>

          {/* Map */}
          <section id="map" className="scroll-mt-24">
            <USMapPreview />
          </section>

          {/* All sections */}
          <div className="space-y-8">
            {sections.map((section) => (
              <SectionCard key={section.title} section={section} />
            ))}
          </div>

          {/* Mortgage callout — standalone banner between sections and trust block */}
          <section className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                  Home Buying Tool
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Mortgage Calculator — US &amp; International
                </h2>
                <p className="max-w-xl text-sm leading-6 text-slate-300">
                  Monthly payments, cash to close, DTI check, rent vs buy break-even,
                  rate sensitivity, refinance analysis, and amortization — all in one place.
                  Covers US purchases and 26 international markets for post-relocation planning.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-400">
                  {[
                    "Monthly payment",
                    "Cash to close",
                    "Rent vs buy",
                    "DTI check",
                    "Refinance",
                    "26 countries",
                  ].map((f) => (
                    <span key={f} className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-violet-300">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="/mortgage-calculator"
                className="inline-flex flex-shrink-0 items-center rounded-full border border-violet-400/30 bg-violet-400/10 px-5 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/20"
              >
                Open calculator →
              </Link>
            </div>
          </section>

          {/* Trust / transparency */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Built for people comparing real-life financial tradeoffs
              </h2>
              <p className="text-sm leading-7 text-slate-300">
                Relocation by Numbers is designed to help you compare cost of living,
                salary needs, taxes, FIRE timelines, and home buying costs across places.
                Tax estimates use federal brackets, FICA, filing status, and state-specific
                models. Cost of living figures use city-level defaults updated regularly.
                These are planning tools, not financial, tax, or legal advice.
              </p>
              <div className="pt-1">
                <Link
                  href="/methodology"
                  className="text-sm font-medium text-emerald-200 underline decoration-emerald-300/40 underline-offset-4 transition hover:text-emerald-100"
                >
                  See methodology and data sources
                </Link>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/fire-calculator"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Try the FIRE Calculator
                </Link>
                <Link
                  href="/mortgage-calculator"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Try the Mortgage Calculator
                </Link>
                <Link
                  href="/best-cities-for-fire"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Explore Best Cities for FIRE
                </Link>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-12 space-y-8">

          {/* Related links */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              More tools to explore
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Keep exploring calculators, state guides, and relocation tools across the site.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/mortgage-calculator" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                Mortgage Calculator
              </Link>
              <Link href="/international-relocation" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                International Relocation Calculator
              </Link>
              <Link href="/europe-relocation-calculator" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                Europe Calculator
              </Link>
              <Link href="/asia-relocation-calculator" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                Asia Calculator
              </Link>
              <Link href="/caribbean-relocation-calculator" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                Caribbean Relocation Calculator
              </Link>
              <Link href="/south-america-relocation-calculator" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                South America Calculator
              </Link>
              <Link href="/fire-calculator" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                FIRE Calculator
              </Link>
              <Link href="/best-cities-for-fire" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                Best Cities for FIRE
              </Link>
              <Link href="/best-states-for-fire/north-carolina" className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                North Carolina for FIRE
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Frequently asked questions about Relocation by Numbers
            </h2>

            <div className="mt-5 space-y-4">
              {[
                {
                  q: "What tools does Relocation by Numbers offer?",
                  a: "The site includes a state-by-state relocation calculator, city cost of living guides, salary comparison tools, FIRE calculators (including Lean, Barista, and Coast FIRE), a mortgage calculator covering US and 26 international markets, and international relocation calculators covering Europe, Asia, the Caribbean, and South America — plus city and state-level financial independence pages.",
                },
                {
                  q: "How are cost of living and tax estimates calculated?",
                  a: "Tax estimates use federal income tax brackets, FICA, filing status, optional 401(k) contributions, and simplified state-specific tax models. Cost of living figures use city-level rent, utilities, groceries, transportation, and healthcare defaults updated regularly. These are planning estimates, not exact figures.",
                },
                {
                  q: "What does the mortgage calculator include?",
                  a: "The mortgage calculator covers monthly payment breakdown (P&I, tax, insurance, HOA, PMI), cash to close with closing cost estimate, rent vs buy break-even, front-end and back-end DTI, rate sensitivity, bi-weekly payment savings, amortization schedule and chart, and refinance analysis. There is also an international tab with planning data for 26 countries.",
                },
                {
                  q: "Which states have no income tax?",
                  a: "Nine states currently have no state income tax: Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming. The relocation calculator accounts for each state's tax rules so you can see the real take-home difference when comparing locations.",
                },
                {
                  q: "Are these results financial or tax advice?",
                  a: "No. All tools on this site are planning estimates intended for educational and comparison purposes only. They are not financial, tax, or legal advice. Always verify figures with a qualified professional before making relocation, home purchase, or retirement decisions.",
                },
                {
                  q: "How often are the estimates updated?",
                  a: "Tax brackets, cost of living defaults, and housing assumptions are reviewed and updated regularly. The most recent update across the site was March 2026. If you notice a figure that looks outdated, the methodology page has more detail on sources and assumptions.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-base font-semibold text-white">{q}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions + footer links */}
          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div>Assumptions updated: March 2026</div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/about"       className="transition hover:text-white">About</Link>
              <span>•</span>
              <Link href="/disclaimer"  className="transition hover:text-white">Disclaimer</Link>
              <span>•</span>
              <Link href="/privacy"     className="transition hover:text-white">Privacy</Link>
              <span>•</span>
              <Link href="/terms"       className="transition hover:text-white">Terms</Link>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
