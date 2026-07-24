import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCity } from "@/lib/cities";
import { ALLOWED_CITY_DETAIL_PAGES, ALLOWED_FIRE_CITY_PAGES } from "@/lib/seo-allowlists";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

const isAllowedFireCityPage = (cityId: string) =>
  ALLOWED_FIRE_CITY_PAGES.includes(cityId as (typeof ALLOWED_FIRE_CITY_PAGES)[number]);

const CITY_CONTENT: Record<
  string,
  {
    primary: string;
    secondary: string;
    caution: string;
    bestFor: string;
  }
> = {
  "charlotte-nc": {
    primary:
      "Charlotte is often seen as a FIRE-friendly city because housing costs are lower than many major coastal metros, which can reduce the spending your portfolio needs to support.",
    secondary:
      "For many households, the main appeal is not that Charlotte is ultra-cheap. It is that the city can offer a better balance between income potential and monthly housing pressure than more expensive markets.",
    caution:
      "The key question is whether your salary remains strong enough after the move. A lower-cost city only helps if income does not fall too far with it.",
    bestFor:
      "Charlotte is usually most attractive for remote workers, households trying to lower housing costs, and people who want a major metro without top-tier coastal pricing.",
  },
  "austin-tx": {
    primary:
      "Austin can be attractive for FIRE because Texas has no state income tax, which may improve take-home pay, especially for higher earners.",
    secondary:
      "That said, Austin is not a low-cost city in the way many people still assume. The FIRE case is often strongest when income stays high enough to make the tax advantage matter.",
    caution:
      "Home prices, property taxes, and insurance can narrow the gap more than people expect, especially for buyers.",
    bestFor:
      "Austin is usually most relevant for higher earners, remote workers, and people comparing tax treatment against other expensive metros.",
  },
  "miami-fl": {
    primary:
      "Miami gets attention for FIRE because Florida has no state income tax, which can materially improve take-home pay for some households.",
    secondary:
      "The challenge is that Miami is not a low-cost city overall. The FIRE math depends heavily on how much you spend on housing and whether you are renting or buying.",
    caution:
      "It is easy to overstate the benefit by focusing only on the tax story and underweighting housing and recurring ownership costs.",
    bestFor:
      "Miami is usually most relevant for higher earners and flexible households testing whether tax savings outweigh destination cost pressure.",
  },
  "atlanta-ga": {
    primary:
      "Atlanta often appears in FIRE conversations because it can offer a large job market with lower housing costs than many coastal cities.",
    secondary:
      "The city can work well for FIRE when the income-to-cost ratio stays favorable, especially for people who want a major metro without Northeast or West Coast housing pressure.",
    caution:
      "Atlanta is not a universal bargain. The result still depends on neighborhood, commute, and housing choices.",
    bestFor:
      "Atlanta is usually most relevant for people who want scale, job access, and a potentially more workable cost structure for long-term FIRE planning.",
  },
  "denver-co": {
    primary:
      "Denver can still work for FIRE, but it is generally less compelling as a pure cost-reduction move than lower-cost Sun Belt or Southeast alternatives.",
    secondary:
      "The city appeals more for lifestyle fit and income potential than for being a low-expense destination.",
    caution:
      "If your main FIRE strategy is aggressive cost reduction, Denver may not move the needle as much as cheaper markets.",
    bestFor:
      "Denver is usually most relevant for households balancing FIRE goals with strong lifestyle preferences and decent income retention.",
  },
  "seattle-wa": {
    primary:
      "Seattle benefits from no state income tax, which can help take-home pay, but housing costs can still make the path to FIRE feel expensive.",
    secondary:
      "The city tends to work best for FIRE when income is high enough to offset housing pressure and maintain a strong savings rate.",
    caution:
      "The lack of state income tax does not automatically make Seattle FIRE-friendly if housing absorbs too much of the budget.",
    bestFor:
      "Seattle is usually most relevant for high-income households and remote workers testing whether income strength offsets the cost structure.",
  },
  "nyc-ny": {
    primary:
      "New York City is rarely considered FIRE-friendly from a cost perspective because housing and overall living costs can push the required portfolio much higher.",
    secondary:
      "The city can still work for FIRE if income is unusually strong, but the math is much less forgiving than in lower-cost metros.",
    caution:
      "NYC is a difficult market for expense control, and even high salaries can disappear quickly once rent and taxes are accounted for.",
    bestFor:
      "New York City is usually most relevant as a baseline comparison city rather than a pure destination for cost-efficient FIRE planning.",
  },
  "dallas-tx": {
    primary:
      "Dallas can be attractive for FIRE because of no state income tax and a cost structure that is often easier to manage than higher-cost coastal cities.",
    secondary:
      "The city is usually strongest as a middle-ground option: large metro economy, lower tax drag, and often better housing value than more expensive markets.",
    caution:
      "It is not enough to look at taxes alone. Housing, transportation, and ownership costs still shape the monthly result.",
    bestFor:
      "Dallas is usually most relevant for people seeking a large metro with lower tax drag and a potentially better income-to-cost ratio.",
  },
  "raleigh-nc": {
    primary:
      "Raleigh often comes up as a FIRE-friendly city because housing costs are typically lower than major coastal markets while still offering a strong white-collar economy.",
    secondary:
      "It can be especially compelling when paired with remote work or strong local income because the housing burden is often easier to carry.",
    caution:
      "The advantage is most meaningful when you are actually reducing expenses relative to your current city, not just moving laterally.",
    bestFor:
      "Raleigh is usually most relevant for remote workers, professionals, and households trying to balance career options with lower recurring costs.",
  },
  "boston-ma": {
    primary:
      "Boston can support FIRE for high earners, but it is generally not a low-cost path to early retirement because housing pressure is still significant.",
    secondary:
      "The city tends to make more sense for FIRE when income is strong enough to offset the expense burden and keep the savings rate high.",
    caution:
      "As with other expensive metros, the main risk is assuming a high salary automatically creates a FIRE-friendly setup.",
    bestFor:
      "Boston is usually most relevant for high-income households comparing whether a future move could improve the cost side of the FIRE equation.",
  },
};

const RELATED_CITY_MAP: Record<string, string[]> = {
  "charlotte-nc": ["raleigh-nc", "atlanta-ga", "dallas-tx", "austin-tx"],
  "austin-tx": ["dallas-tx", "charlotte-nc", "atlanta-ga", "miami-fl"],
  "miami-fl": ["austin-tx", "charlotte-nc", "dallas-tx", "boston-ma"],
  "atlanta-ga": ["charlotte-nc", "raleigh-nc", "dallas-tx", "austin-tx"],
  "denver-co": ["seattle-wa", "austin-tx", "dallas-tx", "charlotte-nc"],
  "seattle-wa": ["denver-co", "austin-tx", "charlotte-nc", "dallas-tx"],
  "nyc-ny": ["boston-ma", "charlotte-nc", "austin-tx", "miami-fl"],
  "dallas-tx": ["austin-tx", "charlotte-nc", "atlanta-ga", "raleigh-nc"],
  "raleigh-nc": ["charlotte-nc", "atlanta-ga", "dallas-tx", "austin-tx"],
  "boston-ma": ["nyc-ny", "charlotte-nc", "miami-fl", "raleigh-nc"],
};

export async function generateStaticParams() {
  return ALLOWED_FIRE_CITY_PAGES.map((cityId) => ({
    cityId,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cityId } = await params;

  if (!isAllowedFireCityPage(cityId)) {
    return { title: "City not found" };
  }

  const city = findCity(cityId);

  if (!city) return { title: "City not found" };

  const rent = city.defaultRent;
  const rentNote = rent ? ` Average rent is $${rent.toLocaleString()}/mo.` : "";

  const title = `Is ${city.name} Good for FIRE? | Cost of Living, Taxes & Early Retirement`;
  const description = `Can you reach financial independence in ${city.name}, ${city.state.toUpperCase()}? See housing costs, taxes, and how ${city.name} compares for early retirement planning.${rentNote}`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/best-cities-for-fire/${cityId}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.relocationbynumbers.com/best-cities-for-fire/${cityId}`,
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

export default async function CityFirePage({ params }: PageProps) {
  const { cityId } = await params;

  if (!isAllowedFireCityPage(cityId)) return notFound();

  const city = findCity(cityId);
  if (!city) return notFound();

  const rent = city.defaultRent ?? 0;
  const homePrice = city.medianHomePrice ?? 0;
  const taxRate = city.propertyTaxPct ?? 0;

  const annualTax = homePrice && taxRate ? Math.round((homePrice * taxRate) / 100) : null;
  const annualRent = rent ? rent * 12 : null;
  const housingOnlyBaseline = annualRent ? Math.round(annualRent / 0.04) : null;

  const routeContent = CITY_CONTENT[cityId];
  if (!routeContent) return notFound();

  const relatedCities = (RELATED_CITY_MAP[cityId] ?? [])
    .filter((id) => ALLOWED_FIRE_CITY_PAGES.includes(id as (typeof ALLOWED_FIRE_CITY_PAGES)[number]))
    .map((id) => findCity(id))
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Is {city.name} Good for FIRE?
          </h1>

          <p className="text-lg font-semibold text-slate-200">
            {city.name}, {city.state.toUpperCase()}, Cost of Living, Housing &amp; Early Retirement Guide
          </p>

          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            This page looks at whether {city.name} is likely to help or hurt a financial independence plan
            based on housing costs, tax drag, and how much room may be left in the budget after essentials.
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
            {ALLOWED_CITY_DETAIL_PAGES.includes(cityId as (typeof ALLOWED_CITY_DETAIL_PAGES)[number]) && (
              <>
                <Link
                  href={`/cost-of-living/${cityId}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                >
                  Cost of living in {city.name}
                </Link>
                <Link
                  href={`/salary-needed-in/${cityId}`}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                >
                  Salary needed in {city.name}
                </Link>
              </>
            )}
            <Link
              href={`/?to=${city.state}&toCity=${city.id}`}
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
            >
              Compare Cities →
            </Link>
          </div>
        </header>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">
            Housing costs in {city.name}
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-slate-400">Average rent</div>
              <div className="mt-2 font-semibold text-white">
                {rent ? `$${rent.toLocaleString()} / mo` : "N/A"}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-slate-400">Median home price</div>
              <div className="mt-2 font-semibold text-white">
                {homePrice ? `$${homePrice.toLocaleString()}` : "N/A"}
              </div>
              {annualTax ? (
                <div className="mt-1 text-xs text-slate-400">
                  ~${annualTax.toLocaleString()}/yr property tax
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-slate-400">Property tax rate</div>
              <div className="mt-2 font-semibold text-white">
                {taxRate ? `${taxRate}%` : "N/A"}
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">{routeContent.primary}</p>
          <p className="text-sm leading-relaxed text-slate-300">{routeContent.secondary}</p>
          <p className="text-sm leading-relaxed text-slate-300">{routeContent.caution}</p>

          {housingOnlyBaseline ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Housing-only FIRE baseline for {city.name}
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                ~${housingOnlyBaseline.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                This is not a full FIRE number. It is a rough 25× baseline using rent alone as a housing proxy,
                before groceries, healthcare, taxes, transportation, and all other living costs are added.
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-xl font-semibold">
            Can you reach FIRE in {city.name}?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Financial independence in {city.name} is possible, but the more useful question is whether
              the city helps or hurts the math relative to your income. A city becomes FIRE-friendly when
              your recurring expenses stay low enough that you can both save aggressively and retire on a
              smaller portfolio.
            </p>
            <p>
              In practice, that means looking at housing first, then taxes, then how much flexibility remains
              in your monthly budget. {city.name} is not automatically good or bad for FIRE in absolute terms.
              It depends on whether your income is strong enough to support the city’s cost structure.
            </p>
            <p>
              {routeContent.bestFor}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about FIRE in {city.name}
          </h2>
          <dl className="space-y-5 text-sm text-slate-300">
            <div>
              <dt className="font-semibold text-white">
                Is {city.name} a good place to retire early?
              </dt>
              <dd className="mt-1">
                It depends on your income and spending pattern. The city is more favorable when housing costs
                are manageable relative to your take-home pay and when the rest of your recurring expenses stay under control.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How much do I need to retire early in {city.name}?
              </dt>
              <dd className="mt-1">
                Your real FIRE number depends on your full annual spending, not housing alone. A rough first-pass approach
                is to estimate total yearly expenses in {city.name} and multiply by 25 using a 4% withdrawal rate.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How does moving to {city.name} affect my FIRE timeline?
              </dt>
              <dd className="mt-1">
                If {city.name} lowers your recurring expenses relative to your current city, it can both reduce the portfolio
                you need and increase how much you save each month. Those two effects together can materially shorten the path to FIRE.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                What should I look at first when evaluating {city.name} for FIRE?
              </dt>
              <dd className="mt-1">
                Start with housing costs, then look at tax drag and your expected income. That gives a much more useful signal than broad rankings alone.
              </dd>
            </div>
          </dl>
        </section>

        {relatedCities.length > 0 ? (
          <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h2 className="text-xl font-semibold">
              Compare {city.name} with other FIRE cities
            </h2>
            <p className="text-sm text-slate-400">
              Explore a smaller set of FIRE-focused city pages instead of a broad low-value inventory.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedCities.map((c) => (
                <Link
                  key={c!.id}
                  href={`/best-cities-for-fire/${c!.id}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div className="text-sm font-semibold text-white">
                    Is {c!.name} good for FIRE?
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {c!.state.toUpperCase()} · Avg rent{" "}
                    {c!.defaultRent ? `$${c!.defaultRent.toLocaleString()}/mo` : "N/A"}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
          <h2 className="text-xl font-semibold">
            Model your FIRE timeline in {city.name}
          </h2>
          <p className="text-sm text-slate-300">
            Use the relocation calculator to estimate your post-move budget in {city.name}, then plug that
            number into the FIRE calculator to see how relocating may change your timeline.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/fire-calculator"
              className="inline-flex items-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Open FIRE Calculator
            </Link>
            <Link
              href={`/?to=${city.state}&toCity=${city.id}`}
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Full relocation cost breakdown for {city.name}
            </Link>
            {ALLOWED_CITY_DETAIL_PAGES.includes(cityId as (typeof ALLOWED_CITY_DETAIL_PAGES)[number]) && (
              <Link
                href={`/cost-of-living/${cityId}`}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Full cost of living guide
              </Link>
            )}
          </div>
        </section>

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
