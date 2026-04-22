import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import Link from "next/link";
import { findCity } from "@/lib/cities";

type Props = {
  params: Promise<{ cityId: string }>;
};

const ALLOWED_CITY_IDS = [
  "charlotte-nc",
  "austin-tx",
  "miami-fl",
  "la-ca",
  "seattle-wa",
  "boston-ma",
  "nyc-ny",
] as const;

const CITY_CONTENT: Record<
  string,
  {
    primary: string;
    secondary: string;
    caution: string;
  }
> = {
  "charlotte-nc": {
    primary:
      "Charlotte often requires a lower salary than many major coastal cities because housing pressure is usually much lower.",
    secondary:
      "Its appeal is not just lower rent. It is that the city can leave more breathing room in the monthly budget if your income remains competitive.",
    caution:
      "The real question is whether your actual rent and neighborhood choice still support that advantage after the move.",
  },
  "austin-tx": {
    primary:
      "Austin is no longer a low-cost city in the way many people still assume, so the salary you need is often higher than people expect.",
    secondary:
      "Texas has no state income tax, which helps take-home pay, but housing and ownership costs can narrow that benefit quickly.",
    caution:
      "Do not treat Austin as a cheap-market salary target just because it is in Texas.",
  },
  "miami-fl": {
    primary:
      "Miami can require a higher salary than people expect because housing costs can stay high even though Florida has no state income tax.",
    secondary:
      "The tax advantage helps, but the affordability question usually comes down to how much rent or ownership costs absorb each paycheck.",
    caution:
      "It is easy to overstate Miami affordability if you focus only on taxes and ignore housing pressure.",
  },
  "la-ca": {
    primary:
      "Los Angeles usually requires a high salary because rent, home prices, and state tax drag all push against affordability.",
    secondary:
      "Even good incomes can feel stretched once housing is layered on top of taxes and other recurring costs.",
    caution:
      "A salary that looks strong on paper may still leave less flexibility than expected in Los Angeles.",
  },
  "seattle-wa": {
    primary:
      "Seattle benefits from no state income tax, but housing costs can still require a meaningfully higher salary than lower-cost metros.",
    secondary:
      "The city often works best when income is strong enough to preserve the tax benefit instead of letting housing consume it.",
    caution:
      "No state income tax does not automatically mean a low salary requirement.",
  },
  "boston-ma": {
    primary:
      "Boston often requires a strong salary because housing costs remain high and the city is not a low-cost market.",
    secondary:
      "The salary needed is usually less about bare survival and more about whether you still have room for savings after rent and taxes.",
    caution:
      "Boston can feel tighter than expected even for relatively high earners.",
  },
  "nyc-ny": {
    primary:
      "New York City usually demands one of the highest salary targets because both rent and tax drag can be substantial.",
    secondary:
      "The right number is not just about clearing rent. It is about how much income is left after housing and taxes to support the rest of your life.",
    caution:
      "A high gross salary in NYC can still leave surprisingly little room for savings or flexibility.",
  },
};

const RELATED_CITY_MAP: Record<string, string[]> = {
  "charlotte-nc": ["austin-tx", "miami-fl", "boston-ma", "nyc-ny"],
  "austin-tx": ["charlotte-nc", "miami-fl", "seattle-wa", "la-ca"],
  "miami-fl": ["charlotte-nc", "austin-tx", "boston-ma", "nyc-ny"],
  "la-ca": ["austin-tx", "seattle-wa", "miami-fl", "nyc-ny"],
  "seattle-wa": ["austin-tx", "la-ca", "boston-ma", "nyc-ny"],
  "boston-ma": ["charlotte-nc", "miami-fl", "seattle-wa", "nyc-ny"],
  "nyc-ny": ["charlotte-nc", "austin-tx", "miami-fl", "boston-ma"],
};

export async function generateStaticParams() {
  return ALLOWED_CITY_IDS.map((cityId) => ({
    cityId,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cityId } = await params;
  const city = findCity(cityId);

  if (!city) return { title: "City not found" };

  const title = `Salary Needed to Live in ${city.name}, ${city.state.toUpperCase()} (2026)`;
  const description = `How much salary do you need to live comfortably in ${city.name}? See estimates based on rent, housing costs, and the 30% income rule — plus a minimum salary for tighter budgets.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/salary-needed-in/${cityId}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.relocationbynumbers.com/salary-needed-in/${cityId}`,
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

export default async function Page({ params }: Props) {
  const { cityId } = await params;

  if (!ALLOWED_CITY_IDS.includes(cityId as (typeof ALLOWED_CITY_IDS)[number])) {
    return notFound();
  }

  const city = findCity(cityId);
  if (!city) return notFound();

  const rent = city.defaultRent ?? 0;
  const cityContent = CITY_CONTENT[city.id];
  if (!cityContent) return notFound();

  const comfortableSalary = rent ? Math.round((rent * 12) / 0.3) : 0;
  const basicSalary = rent ? Math.round((rent * 12) / 0.4) : 0;

  const relatedCities = (RELATED_CITY_MAP[city.id] ?? [])
    .map((id) => findCity(id))
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Salary Needed to Live in {city.name}, {city.state.toUpperCase()}
          </h1>

          <p className="mt-2 text-base font-semibold text-slate-200">
            How Much Do You Need to Earn to Live Comfortably in {city.name}?
          </p>

          <p className="max-w-3xl text-sm text-slate-300 sm:text-base leading-7">
            This page uses housing-based planning estimates to show what salary may be needed
            to rent in {city.name}. The comfortable estimate uses the 30% income rule, while the
            tighter estimate uses a 40% housing-share threshold.
          </p>

          <div className="text-xs text-slate-500">Assumptions updated: March 2026</div>

          <div className="pt-1">
            <Link
              href="/methodology"
              className="text-sm font-medium text-emerald-200 underline decoration-emerald-300/40 underline-offset-4 transition hover:text-emerald-100"
            >
              See methodology and data sources
            </Link>
          </div>
        </header>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
          <section className="">
           
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">Comfortable salary in {city.name}</div>
            <div className="mt-2 text-2xl font-semibold">
              {comfortableSalary ? `$${comfortableSalary.toLocaleString()}` : "N/A"}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Based on housing at 30% of gross income
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400">Minimum salary estimate</div>
            <div className="mt-2 text-2xl font-semibold">
              {basicSalary ? `$${basicSalary.toLocaleString()}` : "N/A"}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              Based on housing at 40% of gross income
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">
            {city.name} housing snapshot
          </h2>
          <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-xs text-slate-400">Average rent</div>
              <div className="mt-1 font-semibold text-white">
                {city.defaultRent ? `$${city.defaultRent.toLocaleString()} / mo` : "N/A"}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-xs text-slate-400">Median home price</div>
              <div className="mt-1 font-semibold text-white">
                {city.medianHomePrice ? `$${city.medianHomePrice.toLocaleString()}` : "N/A"}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-xs text-slate-400">Property tax rate</div>
              <div className="mt-1 font-semibold text-white">
                {typeof city.propertyTaxPct === "number" ? `${city.propertyTaxPct}%` : "N/A"}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Rent and home price figures are planning estimates. Real costs vary by neighborhood and market conditions.
          </p>
        </section>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <section className="space-y-4 text-sm leading-7 text-slate-300 max-w-3xl">
          <h2 className="text-lg font-semibold text-white">
            How the salary estimate works
          </h2>
          <p>
            These numbers use rent as the starting point, not your full household budget.
            That means they are best treated as housing-based salary guidelines rather than
            complete lifestyle affordability numbers.
          </p>
          <p>{cityContent.primary}</p>
          <p>{cityContent.secondary}</p>
          <p>{cityContent.caution}</p>
          <p>
            State tax also matters. Gross salary is not the same as take-home pay, which is why
            city comparison and tax-aware planning tools are useful alongside this page.
          </p>
        </section>

        <div className="flex gap-3 flex-wrap">
          <Link
            href="/"
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:opacity-90"
          >
            Compare Cities →
          </Link>
          <Link
            href={`/cost-of-living/${cityId}`}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Full Cost of Living Guide for {city.name}
          </Link>
          <Link
            href="/fire-calculator"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            FIRE Calculator
          </Link>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Frequently asked questions about living in {city.name}
          </h2>
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            <div>
              <div className="font-semibold text-white">
                What salary do you need to live comfortably in {city.name}?
              </div>
              <p className="mt-1">
                Based on the current rent estimate, a salary around{" "}
                <span className="font-semibold text-white">
                  ${comfortableSalary.toLocaleString()}
                </span>{" "}
                is a useful housing-based planning target. A tighter minimum estimate is{" "}
                <span className="font-semibold text-white">
                  ${basicSalary.toLocaleString()}
                </span>.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white">
                How much is rent in {city.name}?
              </div>
              <p className="mt-1">
                This page uses an estimated average rent of{" "}
                <span className="font-semibold text-white">
                  {city.defaultRent ? `$${city.defaultRent.toLocaleString()} per month` : "N/A"}
                </span>
                . Actual rent varies by neighborhood, unit type, and timing.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white">
                Is {city.name} expensive to live in?
              </div>
              <p className="mt-1">
                That depends on where you are coming from and how your income compares with local housing costs.
                A city can look expensive on rent alone but still work if your income is strong enough, or look manageable
                on rent while still feeling tight after taxes and other costs.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white">
                Does state income tax affect the salary I need in {city.name}?
              </div>
              <p className="mt-1">
                Yes. State income tax affects take-home pay, which means your gross salary may need to be higher
                than the housing-only estimate suggests.
              </p>
            </div>
          </div>
        </section>

        {relatedCities.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              Salary needed in other cities
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCities.map((c) => (
                <Link
                  key={c!.id}
                  href={`/salary-needed-in/${c!.id}`}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-medium text-slate-200 hover:bg-white/10"
                >
                  Salary needed in {c!.name} →
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-500">
            Planning estimate only. Salary targets are housing-based guidelines, not a full personal budget.
          </div>
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