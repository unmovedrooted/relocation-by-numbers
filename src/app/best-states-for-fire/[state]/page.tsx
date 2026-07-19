import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES, type StateCode } from "@/lib/states";
import { citiesForState } from "@/lib/cities";
import { ALLOWED_FIRE_CITY_PAGES, ALLOWED_STATE_CODES } from "@/lib/seo-allowlists";

type PageProps = {
  params: Promise<{ state: string }>;
};

function slugifyState(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

const NO_INCOME_TAX_STATES: StateCode[] = [
  "ak", "fl", "nv", "nh", "sd", "tn", "tx", "wa", "wy",
];


const STATE_PAGES = STATES
  .filter((s) => ALLOWED_STATE_CODES.includes(s.code as StateCode))
  .map((s) => ({
    code: s.code as StateCode,
    name: s.name,
    slug: slugifyState(s.name),
  }));

const STATE_CONTENT: Record<
  string,
  {
    primary: string;
    secondary: string;
    caution: string;
    bestForTitle: string;
    bestForBody: string;
  }
> = {
  tx: {
    primary:
      "Texas is one of the most discussed FIRE states because it has no personal state income tax, which can improve take-home pay during the accumulation phase.",
    secondary:
      "For many households, the state becomes attractive when income stays strong enough to take advantage of the lower tax drag while housing remains more manageable than in higher-cost coastal markets.",
    caution:
      "Texas is not automatically cheap. Property taxes, insurance, and metro-level housing costs can narrow the advantage more than people expect.",
    bestForTitle: "Best for higher earners and income-retention moves",
    bestForBody:
      "Texas often works best for people keeping a strong salary, especially remote workers or households moving from higher-tax states and trying to improve net monthly flexibility.",
  },
  fl: {
    primary:
      "Florida gets attention for FIRE because it has no personal state income tax, which can increase take-home pay and improve retirement cash flow.",
    secondary:
      "The state can be compelling for some FIRE plans, but the math depends heavily on where in Florida you live and how much you spend on housing.",
    caution:
      "The tax story is strong, but Florida is not uniformly low-cost. Housing and recurring ownership costs can materially reduce the benefit.",
    bestForTitle: "Best for tax-sensitive households",
    bestForBody:
      "Florida is often most relevant for higher earners and retirees who value lower tax drag, but it works best when housing choices stay under control.",
  },
  tn: {
    primary:
      "Tennessee can look attractive for FIRE because it combines no personal state income tax with a cost structure that is often easier to manage than many coastal states.",
    secondary:
      "For many households, the state’s FIRE appeal comes from the mix of lower tax drag and lower recurring costs rather than from any one city alone.",
    caution:
      "The state still needs to be evaluated city by city. A move only helps if the local housing and income balance works in your favor.",
    bestForTitle: "Best for lower-cost, lower-tax planning",
    bestForBody:
      "Tennessee is often most useful for households trying to reduce both tax drag and monthly housing pressure at the same time.",
  },
  nc: {
    primary:
      "North Carolina often shows up as a FIRE-friendly state because several of its larger metros can offer a better balance between income potential and housing costs than more expensive markets.",
    secondary:
      "The state may not dominate on taxes alone, but it can be attractive because the overall income-to-cost ratio is often easier to manage than in higher-cost states.",
    caution:
      "The advantage is strongest when you are genuinely reducing expenses relative to your current location, not just making a lateral move.",
    bestForTitle: "Best for balanced FIRE planning",
    bestForBody:
      "North Carolina is often most relevant for professionals and remote workers who want a stronger balance between housing costs, job access, and long-term savings potential.",
  },
  ga: {
    primary:
      "Georgia can work well for FIRE when the housing and income mix stays favorable, especially in and around its larger metros.",
    secondary:
      "The state is often more attractive as a practical cost-management move than as a pure tax play.",
    caution:
      "Georgia is not universally cheap, and the real answer depends on which city you choose and how much of your budget goes to housing.",
    bestForTitle: "Best for metro access without top-tier coastal costs",
    bestForBody:
      "Georgia is often most relevant for households that want a major regional economy while keeping recurring housing costs below the level of more expensive coastal cities.",
  },
  nv: {
    primary:
      "Nevada is notable for FIRE because it has no personal state income tax, which can help increase take-home pay during the years you are still saving aggressively.",
    secondary:
      "That makes the state attractive on paper, especially for higher earners, but the final outcome still depends on metro-level housing costs and overall spending.",
    caution:
      "No-income-tax status is a real advantage, but it does not automatically make a Nevada move low-cost or high-value for every household.",
    bestForTitle: "Best for tax-drag reduction",
    bestForBody:
      "Nevada is often most relevant for people trying to preserve more after-tax income while evaluating whether the local housing market still supports the FIRE plan.",
  },
  wa: {
    primary:
      "Washington is often mentioned in FIRE discussions because it has no personal state income tax, which can help on the savings side of the equation.",
    secondary:
      "The challenge is that Washington’s larger metros can still be expensive enough to offset much of the tax advantage if housing consumes too much of the budget.",
    caution:
      "The state can work for FIRE, but only if income is strong enough to justify the housing costs in the markets you are considering.",
    bestForTitle: "Best for high-income households",
    bestForBody:
      "Washington is usually most relevant for higher earners who want no state income tax and can still maintain a strong savings rate despite housing pressure.",
  },
  co: {
    primary:
      "Colorado can support FIRE for the right household, but it is generally not a pure low-cost state story.",
    secondary:
      "The appeal is often more about quality of life and income potential than about dramatically reducing your FIRE number through lower recurring expenses.",
    caution:
      "If your main goal is aggressive cost reduction, Colorado is often less compelling than cheaper states with lower housing pressure.",
    bestForTitle: "Best for lifestyle-first FIRE planning",
    bestForBody:
      "Colorado is often most relevant for households that want to balance lifestyle fit with long-term financial planning rather than optimize for the absolute lowest cost structure.",
  },
  ny: {
    primary:
      "New York is usually a hard state for FIRE from a cost perspective because both housing and tax drag can make the savings math much less forgiving.",
    secondary:
      "That does not make FIRE impossible in New York, but it raises the importance of strong income, tight expense control, or a future relocation plan.",
    caution:
      "A high salary in New York does not automatically create a strong FIRE setup if too much of the income disappears into housing and taxes.",
    bestForTitle: "Best as a baseline comparison state",
    bestForBody:
      "New York is often most useful as a comparison point for people trying to understand how much a lower-cost or lower-tax move could improve their timeline.",
  },
  ca: {
    primary:
      "California is one of the toughest FIRE states on pure cost because housing and state tax burden can both weigh heavily on the path to financial independence.",
    secondary:
      "The state can still support FIRE for high earners, but the math usually requires stronger income or a more deliberate plan to reduce recurring costs.",
    caution:
      "California often looks weaker for FIRE when compared with lower-cost or lower-tax alternatives, especially for households without unusually high income.",
    bestForTitle: "Best as a high-cost comparison state",
    bestForBody:
      "California is often most relevant for people testing whether staying in-state still works for FIRE or whether a future move could materially improve the numbers.",
  },
  ma: {
    primary:
      "Massachusetts can support FIRE for high earners, but it is not typically a low-cost path because housing pressure is still meaningful in many of its major markets.",
    secondary:
      "The state tends to work better for FIRE when the income side of the equation is especially strong.",
    caution:
      "Like other expensive states, Massachusetts becomes much less attractive if income is not strong enough to keep the savings rate high.",
    bestForTitle: "Best for high earners evaluating tradeoffs",
    bestForBody:
      "Massachusetts is often most useful as a state to compare against lower-cost alternatives rather than as the default answer for cost-efficient FIRE planning.",
  },
  az: {
    primary:
      "Arizona often enters FIRE conversations because it can offer lower costs than several coastal states while still supporting large-metro living.",
    secondary:
      "Its FIRE appeal is usually strongest when the move reduces housing pressure without requiring a major salary reset.",
    caution:
      "Arizona should not be treated as automatically cheap. The value depends on which metro you choose and how the local housing market fits your budget.",
    bestForTitle: "Best for cost-reduction moves with metro access",
    bestForBody:
      "Arizona is often most relevant for households moving from higher-cost western markets and trying to improve the balance between income and recurring expenses.",
  },
};

const RELATED_STATE_MAP: Record<string, StateCode[]> = {
  tx: ["fl", "tn", "nc", "ga"],
  fl: ["tx", "tn", "nv", "az"],
  tn: ["nc", "ga", "tx", "fl"],
  nc: ["ga", "tn", "tx", "fl"],
  ga: ["nc", "tn", "tx", "az"],
  nv: ["az", "tx", "fl", "wa"],
  wa: ["co", "tx", "nv", "az"],
  co: ["wa", "az", "tx", "nc"],
  ny: ["ma", "nc", "tn", "tx"],
  ca: ["az", "tx", "nv", "co"],
  ma: ["ny", "nc", "fl", "tx"],
  az: ["nv", "tx", "co", "fl"],
};

export async function generateStaticParams() {
  return STATE_PAGES.map((s) => ({
    state: s.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params;
  const found = STATE_PAGES.find((s) => s.slug === state);

  if (!found) return { title: "State not found" };

  const noTax = NO_INCOME_TAX_STATES.includes(found.code);
  const taxNote = noTax
    ? `${found.name} has no state income tax, which can improve FIRE math for some households.`
    : `See how ${found.name} taxes, housing costs, and cost of living affect FIRE planning.`;

  const title = `Is ${found.name} Good for FIRE? | Taxes, Housing & Financial Independence`;
  const description = `${taxNote} Compare cities in ${found.name} and estimate how a move could change your path to financial independence.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/best-states-for-fire/${state}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.relocationbynumbers.com/best-states-for-fire/${state}`,
      siteName: "Relocation by Numbers",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BestStateForFirePage({ params }: PageProps) {
  const { state } = await params;
  const found = STATE_PAGES.find((s) => s.slug === state);

  if (!found) return notFound();

  const noTax = NO_INCOME_TAX_STATES.includes(found.code);

  const stateCities = citiesForState(found.code).filter((c) => !c.id.startsWith("other-"));
  const featuredCities = stateCities
    .filter((city) => ALLOWED_FIRE_CITY_PAGES.includes(city.id as (typeof ALLOWED_FIRE_CITY_PAGES)[number]))
    .slice(0, 3);

  const avgRent =
    stateCities.length > 0
      ? Math.round(
          stateCities.reduce((sum, c) => sum + (c.defaultRent ?? 0), 0) / stateCities.length
        )
      : null;

  const stateContent = STATE_CONTENT[found.code];
  if (!stateContent) return notFound();

  const relatedStates = (RELATED_STATE_MAP[found.code] ?? [])
    .map((code) => STATE_PAGES.find((s) => s.code === code))
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Best States for FIRE
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Is {found.name} a Good State for FIRE?
          </h1>

          <p className="text-lg font-semibold text-slate-200">
            {found.name} Taxes, Housing Costs &amp; Financial Independence Guide
          </p>

          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            This page looks at whether {found.name} is likely to help or hurt a financial
            independence plan based on tax drag, housing costs, and how well the state may
            support a strong income-to-expense ratio.
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-400">
            <span>Assumptions updated: March 2026</span>
            <span className="hidden sm:inline">•</span>
            <Link href="/methodology" className="underline underline-offset-4 hover:no-underline">
              See methodology
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              FIRE Calculator
            </Link>
            <Link
              href="/best-cities-for-fire"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Best Cities for FIRE
            </Link>
            <Link
              href="/best-states-for-fire"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              All States for FIRE
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
            >
              Compare Cities →
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-xl font-semibold">
            {found.name} FIRE snapshot
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-slate-400">State income tax</div>
              <div className="mt-2 font-semibold text-white">
                {noTax ? "None" : "Yes"}
              </div>
              {noTax ? (
                <div className="mt-1 text-xs text-emerald-300">
                  No state income tax
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-slate-400">Avg rent (major cities)</div>
              <div className="mt-2 font-semibold text-white">
                {avgRent ? `~$${avgRent.toLocaleString()}/mo` : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-slate-400">Cities tracked</div>
              <div className="mt-2 font-semibold text-white">
                {stateCities.length > 0 ? stateCities.length : "—"}
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">{stateContent.primary}</p>
          <p className="text-sm leading-relaxed text-slate-300">{stateContent.secondary}</p>
          <p className="text-sm leading-relaxed text-slate-300">{stateContent.caution}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-xl font-semibold">
            Who {found.name} is usually best for
          </h2>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="font-semibold text-white">{stateContent.bestForTitle}</div>
            <p className="mt-2 text-sm leading-7 text-slate-300">{stateContent.bestForBody}</p>
          </div>
        </section>

        {featuredCities.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
            <h2 className="text-xl font-semibold">
              Cities to explore in {found.name}
            </h2>
            <p className="text-sm text-slate-400">
              Compare major cities in {found.name} to see where housing pressure may be lightest.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {featuredCities.map((city) => (
                <Link
                  key={city.id}
                  href={`/best-cities-for-fire/${city.id}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div className="text-sm font-semibold text-white">{city.name}</div>
                  <div className="mt-2 text-xs text-slate-400">
                    Avg rent: {city.defaultRent ? `$${city.defaultRent.toLocaleString()}/mo` : "N/A"}
                  </div>
                  <div className="text-xs text-slate-400">
                    Median home: {city.medianHomePrice ? `$${city.medianHomePrice.toLocaleString()}` : "N/A"}
                  </div>
                  <div className="mt-2 text-xs text-emerald-400">
                    View FIRE details →
                  </div>
                </Link>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-sm text-slate-400">
              <div className="font-semibold text-slate-300">Where these numbers come from</div>
              <p>
                Rent and home price figures use city-level planning data from Relocation by Numbers.
                They are designed for consistent comparison across locations, not live market listings.
              </p>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about FIRE in {found.name}
          </h2>
          <dl className="space-y-5 text-sm text-slate-300">
            <div>
              <dt className="font-semibold text-white">
                Is {found.name} a good state for early retirement?
              </dt>
              <dd className="mt-1">
                {noTax
                  ? `${found.name}'s no-income-tax structure can make it attractive for some FIRE plans, but the final answer still depends on housing costs, city choice, and your overall spending level.`
                  : `${found.name} can still work for FIRE, but the answer depends on whether the state’s cities give you a favorable enough income-to-cost ratio to keep your savings rate strong.`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How does {found.name} state income tax affect a FIRE plan?
              </dt>
              <dd className="mt-1">
                {noTax
                  ? `${found.name} has no personal state income tax, which can improve take-home pay during accumulation and reduce tax drag relative to higher-tax states.`
                  : `${found.name} does levy state income tax on wages, which can reduce take-home pay and make the savings side of the FIRE equation harder than in no-tax states.`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                Which city in {found.name} is best for FIRE?
              </dt>
              <dd className="mt-1">
                The best city is usually the one with the strongest balance between income and housing costs for your situation. Lower recurring housing pressure generally makes FIRE easier.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How should I evaluate {found.name} for FIRE?
              </dt>
              <dd className="mt-1">
                Start with housing costs, then tax drag, then compare how much monthly flexibility may remain after essentials. The best state for FIRE is the one that improves your actual math, not just the headline ranking.
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
          <h2 className="text-xl font-semibold">Next step</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Compare your current city against places in {found.name}, then use the FIRE calculator
            to estimate how lower expenses or lower tax drag could change your timeline.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/?to=${found.code}`}
              className="inline-flex items-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Full relocation cost breakdown for {found.name} →
            </Link>
            <Link
              href="/fire-calculator"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Open FIRE Calculator
            </Link>
            <Link
              href={`/move-to/${found.code}`}
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Moving to {found.name} →
            </Link>
          </div>
        </section>

        {relatedStates.length > 0 ? (
          <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
            <h2 className="text-xl font-semibold">
              Compare other states for FIRE
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedStates.map((s) => (
                <Link
                  key={s!.code}
                  href={`/best-states-for-fire/${s!.slug}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div className="text-sm font-semibold text-white">
                    Is {s!.name} good for FIRE?
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Explore taxes, housing, and FIRE potential in {s!.name}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-400">Assumptions updated: March 2026</div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
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
        </footer>
      </div>
    </main>
  );
}
