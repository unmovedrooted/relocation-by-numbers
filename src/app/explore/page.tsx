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
    href: "/one-income-relocation-calculator",
    title: "One Income Relocation Calculator",
    description:
      "Can you afford to move there on one income? Compare housing burden, taxes, and monthly flexibility.",
  },
  {
    href: "/fire-calculator",
    title: "FIRE Calculator",
    description:
      "Estimate your FIRE age and financial independence number.",
  },
  {
    href: "/housing-affordability-calculator",
    title: "Housing Affordability Calculator",
    description:
      "How much rent or house can you afford, based on your income?",
  },
  {
    href: "/compare-cities",
    title: "Compare Cities Side by Side",
    description:
      "One income, up to 3 destinations. Net pay, taxes, housing, and flexibility at once.",
  },
  {
    href: "/mortgage-calculator",
    title: "Mortgage Calculator",
    description:
      "Monthly payments, cash to close, rent vs buy, DTI, and refinance.",
  },
  {
    href: "/international-relocation",
    title: "International Relocation Calculator",
    description:
      "Compare taxes, rent, living costs, and moving expenses across countries.",
  },
];

const sections: HubSection[] = [
  {
    title: "Relocation Budget Calculators",
    description:
      "Plan your move with calculators that go beyond basic cost of living — covering one-income affordability, tax impact, and city-by-city housing pressure.",
    links: [
      {
        href: "/compare-cities",
        title: "Compare Cities Side by Side",
        description:
          "Pick your own income and up to 3 target cities — net pay, taxes, housing, and flexibility in one table.",
      },
      {
        href: "/one-income-relocation-calculator",
        title: "One Income vs Two Income Relocation Calculator",
        description:
          "Find out if you can afford to move on one income. Compare housing burden, monthly flexibility, taxes, and the minimum second income needed.",
      },
      {
        href: "/compare/nyc-ny/charlotte-nc",
        title: "Compare NYC vs Charlotte",
        description:
          "Side-by-side take-home pay, housing costs, and monthly budget breakdown.",
      },
      {
        href: "/compare/nyc-ny/austin-tx",
        title: "Compare NYC vs Austin",
        description:
          "See how taxes and cost of living shift when moving from New York to Texas.",
      },
    ],
    ctaHref: "/one-income-relocation-calculator",
    ctaLabel: "Open the one income calculator",
  },
  {
    title: "Mortgage & Home Buying",
    description:
      "Plan a home purchase with payment estimates, cash to close, rent vs buy, DTI checks, and refinance analysis.",
    links: [
      {
        href: "/housing-affordability-calculator",
        title: "Housing Affordability Calculator",
        description:
          "How much rent or house can you afford? 30% rent rule and 28/36 debt-to-income guidelines, just from your income.",
      },
      {
        href: "/mortgage-calculator",
        title: "Mortgage Calculator",
        description:
          "Monthly payment, cash to close, DTI, rent vs buy break-even, and amortization schedule.",
      },
      {
        href: "/mortgage-calculator#refinance",
        title: "Refinance Calculator",
        description:
          "See your break-even month, monthly savings, and lifetime savings.",
      },
      {
        href: "/mortgage-calculator#international",
        title: "International Mortgage Calculator",
        description:
          "Foreign buyer notes, indicative rates, and upfront cost estimates for 26 countries.",
      },
    ],
    ctaHref: "/mortgage-calculator",
    ctaLabel: "Open the mortgage calculator",
  },
  {
    title: "International Relocation Calculators",
    description:
      "Compare taxes, rent, living costs, and take-home pay across international destinations.",
    links: [
      {
        href: "/international-relocation",
        title: "International Relocation Calculator",
        description:
          "Compare cities across Europe, Asia, the Middle East, and North America.",
      },
      {
        href: "/europe-relocation-calculator",
        title: "Europe Relocation Calculator",
        description:
          "Compare Lisbon, Porto, London, and more.",
      },
      {
        href: "/asia-relocation-calculator",
        title: "Asia Relocation Calculator",
        description:
          "Compare Bangkok, Tokyo, Singapore, Kuala Lumpur, Seoul, Dubai, and more.",
      },
      {
        href: "/caribbean-relocation-calculator",
        title: "Caribbean Relocation Calculator",
        description:
          "Compare Caribbean destinations including Jamaica, Barbados, and Cayman Islands.",
      },
      {
        href: "/south-america-relocation-calculator",
        title: "South America Relocation Calculator",
        description:
          "Compare Medellín, Bogotá, Buenos Aires, Santiago, Lima, and São Paulo.",
      },
    ],
    ctaHref: "/international-relocation",
    ctaLabel: "Open the international calculator",
  },
  {
    title: "FIRE & Retirement Calculators",
    description:
      "Calculate your FIRE number, retirement target, and financial independence timeline.",
    links: [
      { href: "/fire-calculator", title: "FIRE Calculator" },
      { href: "/fire-number-calculator", title: "FIRE Number Calculator" },
      { href: "/coast-fire-calculator", title: "Coast FIRE Calculator" },
      { href: "/barista-fire-calculator", title: "Barista FIRE Calculator" },
      { href: "/lean-fire-calculator", title: "Lean FIRE Calculator" },
      { href: "/savings-rate-for-fire", title: "Savings Rate for FIRE" },
    ],
    ctaHref: "/fire-calculator",
    ctaLabel: "Open the main FIRE calculator",
  },
  {
    title: "Best Places for FIRE",
    description:
      "Explore curated city and state pages around housing costs, taxes, and financial independence potential.",
    links: [
      { href: "/best-cities-for-fire", title: "Best Cities for FIRE" },
      { href: "/best-states-for-fire", title: "Best States for FIRE" },
      { href: "/best-states-for-fire/north-carolina", title: "North Carolina for FIRE" },
      { href: "/best-states-for-fire/texas", title: "Texas for FIRE" },
      { href: "/best-states-for-fire/florida", title: "Florida for FIRE" },
      { href: "/best-cities-for-fire/charlotte-nc", title: "FIRE in Charlotte" },
      { href: "/best-cities-for-fire/austin-tx", title: "FIRE in Austin" },
      { href: "/best-cities-for-fire/miami-fl", title: "FIRE in Miami" },
    ],
  },
  {
    title: "City Cost of Living & Salary Guides",
    description:
      "Browse your strongest city pages for rent, salary targets, and affordability comparisons.",
    links: [
      { href: "/cost-of-living/charlotte-nc", title: "Charlotte Cost of Living" },
      { href: "/cost-of-living/nyc-ny", title: "NYC Cost of Living" },
      { href: "/cost-of-living/austin-tx", title: "Austin Cost of Living" },
      { href: "/cost-of-living/la-ca", title: "Los Angeles Cost of Living" },
      { href: "/cost-of-living/seattle-wa", title: "Seattle Cost of Living" },
      { href: "/cost-of-living/boston-ma", title: "Boston Cost of Living" },
      { href: "/cost-of-living/miami-fl", title: "Miami Cost of Living" },
      { href: "/salary-needed-in/charlotte-nc", title: "Salary Needed in Charlotte" },
      { href: "/salary-needed-in/austin-tx", title: "Salary Needed in Austin" },
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
                FIRE calculators, and mortgage tools to find places where your money
                may go further.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/compare/nyc-ny/charlotte-nc"
                  className="inline-flex items-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                >
                  Explore Comparisons
                </Link>
                <Link
                  href="/one-income-relocation-calculator"
                  className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-400/10 px-5 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/20"
                >
                  One Income Calculator
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

          {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
            <section className="">

          
            </section>
          ) : null}

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Start Here
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Jump into the most popular tools and strongest pages on the site.
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

          <section id="map" className="scroll-mt-24">
            <USMapPreview />
          </section>

          {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <AdSlot
                slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
                className="min-h-[100px]"
              />
            </section>
          ) : null}

          <div className="space-y-8">
            {sections.map((section) => (
              <SectionCard key={section.title} section={section} />
            ))}
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Built for people comparing real-life financial tradeoffs
              </h2>
              <p className="text-sm leading-7 text-slate-300">
                Relocation by Numbers is designed to help you compare cost of living,
                salary needs, taxes, FIRE timelines, and home buying costs across places.
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
            </div>
          </section>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Frequently asked questions about Relocation by Numbers
            </h2>

            <div className="mt-5 space-y-4">
              {[
                {
                  q: "What tools does Relocation by Numbers offer?",
                  a: "The site includes relocation calculators, cost of living guides, salary tools, FIRE calculators, mortgage tools, and international relocation calculators.",
                },
                {
                  q: "How are cost of living and tax estimates calculated?",
                  a: "Tax estimates use simplified federal, state, and country-specific models. Cost of living figures use city-level defaults and structured planning assumptions.",
                },
                {
                  q: "Are these results financial or tax advice?",
                  a: "No. All tools on this site are planning estimates intended for educational and comparison purposes only.",
                },
                {
                  q: "How often are the estimates updated?",
                  a: "Tax brackets, cost of living defaults, and housing assumptions are reviewed and updated regularly. The most recent sitewide update was March 2026.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-base font-semibold text-white">{q}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div>Assumptions updated: March 2026</div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/about" className="transition hover:text-white">About</Link>
              <span>•</span>
              <Link href="/disclaimer" className="transition hover:text-white">Disclaimer</Link>
              <span>•</span>
              <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
              <span>•</span>
              <Link href="/terms" className="transition hover:text-white">Terms</Link>
              <span>•</span>
              <Link href="/methodology" className="transition hover:text-white">Methodology</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}