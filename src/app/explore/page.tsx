import type { Metadata } from "next";
import Link from "next/link";
import USMapPreview from "@/components/USMapPreview";

export const metadata: Metadata = {
  title: "Explore Relocation Tools | Relocation by Numbers",
  description:
    "Explore relocation comparisons, cost of living guides, FIRE calculators, salary tools, and state-by-state financial independence resources.",
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
      "Start with some of the most popular city-to-city moves on the site.",
    links: [
      { href: "/compare/nyc-ny/charlotte-nc", title: "Compare NYC vs Charlotte" },
      { href: "/compare/nyc-ny/austin-tx", title: "Compare NYC vs Austin" },
      { href: "/compare/nyc-ny/la-ca", title: "Compare NYC vs Los Angeles" },
      { href: "/compare/austin-tx/seattle-wa", title: "Compare Austin vs Seattle" },
      { href: "/compare/boston-ma/miami-fl", title: "Compare Boston vs Miami" },
      { href: "/compare/charlotte-nc/miami-fl", title: "Compare Charlotte vs Miami" },
    ],
    ctaHref: "/compare/nyc-ny/charlotte-nc",
    ctaLabel: "Start with a featured comparison",
  },
  {
    title: "City Cost of Living Guides",
    description:
      "Browse current cost-of-living pages for major cities.",
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
    title: "FIRE & Retirement Tools",
    description:
      "Use calculators built to estimate your FIRE number, retirement target, and independence timeline.",
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
    title: "FIRE by Income",
    description:
      "Quick-entry pages for exploring FIRE timelines at different salary levels.",
    links: [
      { href: "/fire-with-70k-salary", title: "Can You FIRE on a $70K Salary?" },
      { href: "/fire-with-100k-salary", title: "Can You FIRE on a $100K Salary?" },
      { href: "/fire-with-150k-salary", title: "Can You FIRE on a $150K Salary?" },
    ],
  },
  {
    title: "Best Cities for FIRE",
    description:
      "Explore city-specific FIRE pages and broader city rankings.",
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
      "State-level pages focused on taxes, affordability, and FIRE potential.",
    links: [
      { href: "/best-states-for-fire/north-carolina", title: "North Carolina" },
      { href: "/best-states-for-fire/texas", title: "Texas" },
      { href: "/best-states-for-fire/florida", title: "Florida" },
      { href: "/best-states-for-fire/new-york", title: "New York" },
    ],
  },
  {
    title: "Can You FIRE in This City?",
    description:
      "City pages focused specifically on financial independence in individual metros.",
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
      "Estimate what income level is needed to live in key cities.",
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
                Compare States, Cities, and FIRE Paths in One Place
              </h1>

              <p className="max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Explore relocation comparisons, cost of living guides, salary tools,
                and FIRE calculators to find places where your money may go further.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/compare/nyc-ny/charlotte-nc"
                  className="inline-flex items-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                >
                  Start Comparing
                </Link>

                <Link
                  href="/fire-calculator"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open FIRE Tools
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
                Jump into some of the most useful pages on the site.
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

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section) => (
              <SectionCard key={section.title} section={section} />
            ))}
          </div>

          {/* Trust / transparency */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Built for people comparing real-life financial tradeoffs
              </h2>
              <p className="text-sm leading-7 text-slate-300">
                Relocation by Numbers is designed to help you compare cost of living,
                salary needs, taxes, and FIRE timelines across places. These pages are
                planning tools, not financial, tax, or legal advice.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/fire-calculator"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Try the FIRE Calculator
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
      Explore more
    </h2>
    <p className="mt-2 text-sm leading-6 text-slate-300">
      Keep exploring related calculators, state guides, and relocation tools.
    </p>

    <div className="mt-5 flex flex-wrap gap-3">
      <Link
        href="/explore"
        className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
      >
        Explore Hub
      </Link>
      <Link
        href="/fire-calculator"
        className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
      >
        
        FIRE Calculator
      </Link>
      <Link
        href="/best-cities-for-fire"
        className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
      >
        
         International Relocation
      </Link>
      <Link
        href="/international-relocation"
        className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
      >
        Best Cities for FIRE
      </Link>
      <Link
        href="/best-states-for-fire/north-carolina"
        className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
      >
        North Carolina for FIRE
      </Link>
    </div>
  </div>

  {/* FAQ */}
  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
    <h2 className="text-2xl font-semibold tracking-tight text-white">
      Frequently asked questions
    </h2>

    <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-base font-semibold text-white">
          How are these estimates calculated?
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          These pages use location-based assumptions, tax estimates, spending inputs,
          and financial independence formulas to help compare places and planning scenarios.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-base font-semibold text-white">
          Are these results financial or tax advice?
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          No. These tools are planning estimates only and should be used for educational
          and comparison purposes.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="text-base font-semibold text-white">
          Why can the numbers change over time?
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Taxes, housing, salaries, insurance, and cost-of-living assumptions can change,
          so estimates may be updated as newer data becomes available.
        </p>
      </div>
    </div>
  </div>

  {/* Assumptions + footer links */}
  <div className="flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
    <div>Assumptions updated: March 2026</div>

    <div className="flex flex-wrap items-center gap-2">
      <Link href="/about" className="transition hover:text-white">
        About
      </Link>
      <span>•</span>
      <Link href="/disclaimer" className="transition hover:text-white">
        Disclaimer
      </Link>
      <span>•</span>
      <Link href="/privacy" className="transition hover:text-white">
        Privacy
      </Link>
      <span>•</span>
      <Link href="/terms" className="transition hover:text-white">
        Terms
      </Link>
    </div>
  </div>
</section>
      </div>
    </main>

    
  );
}