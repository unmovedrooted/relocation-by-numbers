import type { Metadata } from "next";
import Link from "next/link";
import AdSlot from "@/components/AdSlot";
import { notFound } from "next/navigation";
import { findCity } from "@/lib/cities";

type Props = {
  params: Promise<{ cityId: string }>;
};

const ALLOWED_FIRE_CITY_IDS = [
  "charlotte-nc",
  "austin-tx",
  "miami-fl",
  "atlanta-ga",
  "denver-co",
  "seattle-wa",
  "nyc-ny",
  "dallas-tx",
  "raleigh-nc",
  "boston-ma",
] as const;

const CITY_CONTENT: Record<
  string,
  {
    primary: string;
    secondary: string;
    caution: string;
    bestForTitle: string;
    bestForBody: string;
  }
> = {
  "charlotte-nc": {
    primary:
      "Charlotte often looks strong for FIRE because housing costs are lower than many major coastal metros, which can reduce the spending your portfolio needs to support.",
    secondary:
      "Its appeal is usually not that it is ultra-cheap. It is that the balance between income potential and housing pressure can be more workable than in more expensive cities.",
    caution:
      "The biggest question is whether your salary stays strong enough after the move for the lower-cost structure to matter in a lasting way.",
    bestForTitle: "Best for lowering housing pressure",
    bestForBody:
      "Charlotte is often most relevant for remote workers, renters, and households trying to reduce fixed monthly costs without giving up major-metro access.",
  },
  "austin-tx": {
    primary:
      "Austin can help a FIRE plan because Texas has no state income tax, which may improve take-home pay during the accumulation phase.",
    secondary:
      "But Austin is not a low-cost city in the way many people still assume. The FIRE case depends heavily on whether your income stays high enough to make the tax advantage worth it.",
    caution:
      "Property taxes, insurance, and housing costs can narrow the benefit more than people expect.",
    bestForTitle: "Best for higher earners comparing tax tradeoffs",
    bestForBody:
      "Austin is often most relevant for remote workers and higher earners who want to test whether lower tax drag actually improves their savings rate.",
  },
  "miami-fl": {
    primary:
      "Miami gets attention in FIRE discussions because Florida has no state income tax, which can improve take-home pay for some households.",
    secondary:
      "The challenge is that Miami is not cheap overall. Housing costs can absorb a meaningful share of that tax advantage.",
    caution:
      "It is easy to overestimate Miami’s FIRE value if you focus only on taxes and underweight housing pressure.",
    bestForTitle: "Best for tax-sensitive households",
    bestForBody:
      "Miami is often most relevant for higher earners and flexible households testing whether tax savings outweigh destination cost pressure.",
  },
  "atlanta-ga": {
    primary:
      "Atlanta can be a useful FIRE city because it may offer a large metro economy with lower housing costs than many coastal markets.",
    secondary:
      "Its appeal is usually more about practical cost management than about being an extreme low-cost city.",
    caution:
      "The result still depends heavily on neighborhood, commute, and how much of your budget goes to housing.",
    bestForTitle: "Best for metro access without top-tier costs",
    bestForBody:
      "Atlanta is often most relevant for households that want a large regional economy while keeping recurring housing costs more manageable than in higher-cost coastal cities.",
  },
  "denver-co": {
    primary:
      "Denver can support FIRE, but it is generally less compelling as a pure cost-reduction move than cheaper alternatives.",
    secondary:
      "The city often makes more sense for people balancing lifestyle fit and income potential than for people trying to minimize expenses aggressively.",
    caution:
      "If your FIRE strategy depends on meaningfully lowering recurring costs, Denver may not move the math enough.",
    bestForTitle: "Best for lifestyle-first FIRE planning",
    bestForBody:
      "Denver is often most relevant for households willing to accept a higher cost structure in exchange for personal fit, while still trying to keep FIRE on track.",
  },
  "seattle-wa": {
    primary:
      "Seattle benefits from no state income tax, which helps on the savings side of the FIRE equation.",
    secondary:
      "But housing costs can still be high enough to make the city feel expensive unless income is strong.",
    caution:
      "No state income tax does not automatically make Seattle FIRE-friendly if rent and ownership costs absorb too much of the budget.",
    bestForTitle: "Best for high-income FIRE plans",
    bestForBody:
      "Seattle is often most relevant for high-income households and remote workers who want to test whether strong earnings offset the city’s housing pressure.",
  },
  "nyc-ny": {
    primary:
      "New York City is rarely a cost-efficient FIRE city because housing and tax drag can both push the required portfolio much higher.",
    secondary:
      "It can still work for people with unusually high income, but the math is less forgiving than in lower-cost cities.",
    caution:
      "A high salary in New York can still disappear quickly once rent, taxes, and recurring living costs are layered in.",
    bestForTitle: "Best as a comparison baseline",
    bestForBody:
      "NYC is often most useful as a baseline city for comparing how much a lower-cost move could improve your FIRE timeline.",
  },
  "dallas-tx": {
    primary:
      "Dallas can be attractive for FIRE because it combines no state income tax with a cost structure that is often easier to manage than more expensive metros.",
    secondary:
      "Its appeal is usually the middle-ground combination of large-metro opportunity and lower tax drag.",
    caution:
      "Taxes alone are not enough. Housing and transportation costs still shape the outcome.",
    bestForTitle: "Best for large-metro, lower-tax planning",
    bestForBody:
      "Dallas is often most relevant for households seeking a major metro with lower tax drag and a potentially stronger income-to-cost ratio.",
  },
  "raleigh-nc": {
    primary:
      "Raleigh often comes up as FIRE-friendly because housing costs are typically easier to carry than in major coastal metros while still offering a strong white-collar economy.",
    secondary:
      "The city can be especially compelling when paired with remote work or strong local income because the monthly cost structure is often more manageable.",
    caution:
      "The value is strongest when you are actually reducing expenses relative to your current city, not just moving laterally.",
    bestForTitle: "Best for balanced career-and-cost FIRE planning",
    bestForBody:
      "Raleigh is often most relevant for professionals and remote workers who want a better balance between housing costs, job access, and long-term savings potential.",
  },
  "boston-ma": {
    primary:
      "Boston can support FIRE for high earners, but it is not a low-cost route to financial independence because housing pressure is still meaningful.",
    secondary:
      "The city tends to make more sense when income is strong enough to keep the savings rate high despite the cost structure.",
    caution:
      "High salary alone does not guarantee a strong FIRE setup if housing and taxes consume too much of it.",
    bestForTitle: "Best for high earners evaluating tradeoffs",
    bestForBody:
      "Boston is often most relevant for households comparing whether a future move could improve the cost side of their FIRE math.",
  },
};

const RELATED_CITY_MAP: Record<string, string[]> = {
  "charlotte-nc": ["raleigh-nc", "atlanta-ga", "dallas-tx", "austin-tx"],
  "austin-tx": ["dallas-tx", "charlotte-nc", "miami-fl", "atlanta-ga"],
  "miami-fl": ["charlotte-nc", "austin-tx", "dallas-tx", "boston-ma"],
  "atlanta-ga": ["charlotte-nc", "raleigh-nc", "dallas-tx", "austin-tx"],
  "denver-co": ["seattle-wa", "austin-tx", "charlotte-nc", "dallas-tx"],
  "seattle-wa": ["denver-co", "austin-tx", "charlotte-nc", "dallas-tx"],
  "nyc-ny": ["boston-ma", "charlotte-nc", "austin-tx", "miami-fl"],
  "dallas-tx": ["austin-tx", "charlotte-nc", "atlanta-ga", "raleigh-nc"],
  "raleigh-nc": ["charlotte-nc", "atlanta-ga", "dallas-tx", "austin-tx"],
  "boston-ma": ["nyc-ny", "charlotte-nc", "miami-fl", "raleigh-nc"],
};

export async function generateStaticParams() {
  return ALLOWED_FIRE_CITY_IDS.map((cityId) => ({
    cityId,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cityId } = await params;
  const city = findCity(cityId);

  if (!city) {
    return { title: "City not found" };
  }

  return {
    title: `FIRE in ${city.name} | Can You Retire Early There?`,
    description: `Estimate how living in ${city.name}, ${city.state.toUpperCase()} affects your financial independence timeline.`,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/fire-in/${cityId}`,
    },
    openGraph: {
      title: `FIRE in ${city.name} | Can You Retire Early There?`,
      description: `Estimate how living in ${city.name}, ${city.state.toUpperCase()} affects your financial independence timeline.`,
      url: `https://www.relocationbynumbers.com/fire-in/${cityId}`,
      siteName: "Relocation by Numbers",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `FIRE in ${city.name} | Can You Retire Early There?`,
      description: `Estimate how living in ${city.name}, ${city.state.toUpperCase()} affects your financial independence timeline.`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { cityId } = await params;

  if (!ALLOWED_FIRE_CITY_IDS.includes(cityId as (typeof ALLOWED_FIRE_CITY_IDS)[number])) {
    return notFound();
  }

  const city = findCity(cityId);
  if (!city) return notFound();

  const cityContent = CITY_CONTENT[city.id];
  if (!cityContent) return notFound();

  const relatedCities = (RELATED_CITY_MAP[city.id] ?? [])
    .map((id) => findCity(id))
    .filter(Boolean);

  const rent = city.defaultRent ?? 0;
  const homePrice = city.medianHomePrice ?? 0;
  const propertyTaxPct = city.propertyTaxPct ?? 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            FIRE in {city.name}
          </h1>

          <p className="max-w-4xl text-sm leading-relaxed text-slate-300">
            Reaching financial independence in {city.name}, {city.state.toUpperCase()} depends heavily on housing costs, taxes, and your savings rate.
          </p>

          <div className="text-xs text-slate-400">
            Assumptions updated: March 2026
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
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
              href="/"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
            >
              Compare Cities →
            </Link>

            <Link
              href="/methodology"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            >
              Methodology
            </Link>
          </div>
        </header>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-xl font-semibold">FIRE snapshot: {city.name}</h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">Average rent</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {city.defaultRent ? `$${city.defaultRent.toLocaleString()}` : "N/A"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">Median home price</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {city.medianHomePrice ? `$${city.medianHomePrice.toLocaleString()}` : "N/A"}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-slate-400">Property tax rate</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {typeof city.propertyTaxPct === "number" ? `${city.propertyTaxPct}%` : "N/A"}
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">{cityContent.primary}</p>
          <p className="text-sm leading-relaxed text-slate-300">{cityContent.secondary}</p>
          <p className="text-sm leading-relaxed text-slate-300">{cityContent.caution}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Why {city.name} could matter for FIRE</h2>

          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Your path to FIRE is driven mostly by the gap between what you earn and what you spend.
              That means a city with lower rent or lower ownership pressure can reduce your required FIRE number
              and shorten the years it takes to reach financial independence.
            </p>

            <p>
              In {city.name}, the most important question is not whether the city is universally cheap or expensive.
              It is whether your income is strong enough relative to the city’s housing and tax burden to keep your savings rate high.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">Who {city.name} is usually best for</h2>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-white">{cityContent.bestForTitle}</div>
            <div className="mt-2 text-sm leading-relaxed text-slate-300">
              {cityContent.bestForBody}
            </div>
          </div>
        </section>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">How to use this page</h2>

          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Start by comparing your current city to {city.name} in the relocation calculator. Then use the
              FIRE calculator to test how lower or higher expenses affect your FIRE age.
            </p>

            <p>
              A practical way to do that is to plug in your current income, current savings, and expected yearly
              investing, then adjust your monthly expenses to match what life in {city.name} would likely cost.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Compare Cities →
            </Link>

            <Link
              href="/fire-calculator"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Open FIRE Calculator
            </Link>
          </div>
        </section>

        {relatedCities.length > 0 ? (
          <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
            <h2 className="text-xl font-semibold">Related FIRE cities</h2>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCities.map((c) => (
                <Link
                  key={c!.id}
                  href={`/fire-in/${c!.id}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div className="text-sm font-semibold text-white">{c!.name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {c!.state.toUpperCase()} • Rent{" "}
                    {c!.defaultRent ? `$${c!.defaultRent.toLocaleString()}` : "N/A"}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">FAQ</h2>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Is {city.name} good for FIRE?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                It can be, depending on your income and housing costs. Lower recurring expenses usually make FIRE easier, but taxes, home prices, and lifestyle still matter.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Does housing cost affect FIRE a lot?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                Yes. Housing is usually the biggest recurring expense, so changes in rent or mortgage costs can materially change your FIRE number.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Should I compare cities before planning FIRE?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                Yes. A move to a lower cost-of-living city can sometimes improve your FIRE timeline more than a small raise.
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                How do taxes in {city.state.toUpperCase()} affect FIRE?
              </div>
              <div className="mt-2 text-sm leading-relaxed text-slate-300">
                State tax treatment affects how much of your paycheck you keep while you are still saving for FIRE, which can change both your savings rate and your timeline.
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
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
          <span>•</span>
          <Link href="/methodology" className="transition hover:text-white">
            Methodology
          </Link>
        </div>
      </div>
    </main>
  );
}