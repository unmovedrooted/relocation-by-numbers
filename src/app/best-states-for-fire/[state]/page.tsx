import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATES, type StateCode } from "@/lib/states";
import { citiesForState } from "@/lib/cities";

type PageProps = {
  params: Promise<{ state: string }>;
};

function slugifyState(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

const STATE_PAGES = STATES.map((s) => ({
  code: s.code,
  name: s.name,
  slug: slugifyState(s.name),
}));

const NO_INCOME_TAX_STATES: StateCode[] = [
  "ak", "fl", "nv", "nh", "sd", "tn", "tx", "wa", "wy",
];

export async function generateStaticParams() {
  return STATE_PAGES.map((s) => ({
    state: s.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params;
  const found = STATE_PAGES.find((s) => s.slug === state);

  if (!found) return { title: "State not found" };

  const noTax = NO_INCOME_TAX_STATES.includes(found.code as StateCode);
  const taxNote = noTax
    ? `${found.name} has no state income tax, making it one of the most FIRE-friendly states in the US.`
    : `See how ${found.name} taxes, housing costs, and cost of living affect your FIRE number and timeline.`;

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

  const noTax = NO_INCOME_TAX_STATES.includes(found.code as StateCode);

  const stateCities = citiesForState(found.code as StateCode).filter(
    (c) => !c.id.startsWith("other-")
  );
  const featuredCities = stateCities.slice(0, 3);

  const avgRent =
    stateCities.length > 0
      ? Math.round(
          stateCities.reduce((sum, c) => sum + (c.defaultRent ?? 0), 0) /
            stateCities.length
        )
      : null;

  const relatedStates = STATE_PAGES
    .filter((s) => s.slug !== found.slug)
    .slice(0, 6);

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

          <p className="mt-1 text-lg font-semibold text-slate-200">
            {found.name} Taxes, Housing Costs &amp; Financial Independence Guide
          </p>

          <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
            {noTax ? (
              <>
                {found.name} has no state income tax — one of only nine states in the US
                without it. That means more of every paycheck goes toward saving and
                investing, which can meaningfully accelerate your path to financial
                independence. Whether {found.name} is right for FIRE depends on your
                income, housing costs, and lifestyle target.
              </>
            ) : (
              <>
                Whether {found.name} is good for FIRE depends on your income, housing
                costs, state tax burden, and lifestyle. For some people, moving within
                the state to a lower-cost city can meaningfully improve the path to
                financial independence even without changing states.
              </>
            )}
          </p>

          <div className="text-xs text-slate-400">Assumptions updated: March 2026</div>

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

        {/* State snapshot */}
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
              {noTax && (
                <div className="mt-1 text-xs text-emerald-300">
                  No state income tax
                </div>
              )}
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
        </section>

        {/* Why it's good for FIRE */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-xl font-semibold">
            Why {found.name} {noTax ? "is" : "could be"} good for FIRE
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              The best state for FIRE is usually the one that helps you keep expenses
              low and savings high. Housing costs, state income tax, and transportation
              costs often matter more than small differences in gross salary.
            </p>
            {noTax ? (
              <p>
                {found.name}'s lack of state income tax is a significant financial
                advantage. On a $100,000 salary, avoiding a 5–10% state income tax
                can add $5,000–$10,000 annually to your savings rate — directly
                accelerating the time it takes to reach your FIRE number.
              </p>
            ) : (
              <p>
                If moving to {found.name} — or within {found.name} to a lower-cost
                city — reduces your monthly expenses, your FIRE number may drop and
                your timeline to financial independence may shorten accordingly. At
                a 4% withdrawal rate, every $1,000 reduction in annual spending lowers
                your FIRE number by $25,000.
              </p>
            )}
            <p>
              Use the FIRE calculator to model how a specific move to or within{" "}
              {found.name} could change your personal timeline based on your income,
              spending, and savings assumptions.
            </p>
          </div>
        </section>

        {/* Cities */}
        {featuredCities.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
            <h2 className="text-xl font-semibold">
              Cities to explore in {found.name}
            </h2>
            <p className="text-sm text-slate-400">
              Compare housing costs across major cities in {found.name} to find the
              most FIRE-friendly location for your lifestyle.
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
                    Avg rent:{" "}
                    {city.defaultRent
                      ? `$${city.defaultRent.toLocaleString()}/mo`
                      : "N/A"}
                  </div>
                  <div className="text-xs text-slate-400">
                    Median home:{" "}
                    {city.medianHomePrice
                      ? `$${city.medianHomePrice.toLocaleString()}`
                      : "N/A"}
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
                Rent and home price figures use city-level planning data from Relocation
                by Numbers — designed for consistent comparison across cities and states.
                They are directional estimates for FIRE planning, not live market listings.
              </p>
            </div>
          </section>
        )}

        {/* FAQ */}
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
                  ? `${found.name}'s no-income-tax policy makes it one of the stronger states for both accumulation and early retirement. Lower tax drag during saving and no state tax on retirement withdrawals can significantly improve long-term outcomes.`
                  : `It depends on your income, lifestyle, and which city you choose. ${found.name} may offer lower housing costs in some metros that can reduce your FIRE number, even if the state income tax is a factor.`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How does {found.name} state income tax affect my FIRE number?
              </dt>
              <dd className="mt-1">
                {noTax
                  ? `${found.name} has no personal state income tax, which means your gross income and net income are much closer together. This increases your savings rate at a given income level and reduces the income you need to cover expenses in retirement.`
                  : `${found.name} levies state income tax on wages, which reduces take-home pay and can slow accumulation. The calculator applies state-specific tax estimates so you can see your real net income in ${found.name} based on your salary and filing status.`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                Which city in {found.name} is best for FIRE?
              </dt>
              <dd className="mt-1">
                The most FIRE-friendly city in {found.name} is generally the one with
                the lowest housing costs relative to your income. Use the city comparison
                tool to see how {found.name} cities stack up on rent, take-home pay,
                and monthly budget.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How do I calculate my FIRE number in {found.name}?
              </dt>
              <dd className="mt-1">
                Your FIRE number is 25x your expected annual spending in retirement
                (using the 4% rule). If you plan to live in {found.name}, enter your
                expected monthly expenses there into the FIRE calculator to get a
                location-specific estimate including state tax impacts on withdrawals.
              </dd>
            </div>
          </dl>
        </section>

        {/* Next step */}
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
          <h2 className="text-xl font-semibold">Next step</h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Compare your current city against places in {found.name}, then use the FIRE
            calculator to estimate how lower expenses or taxes could change your timeline.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Compare Cities →
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

        {/* Related states */}
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <h2 className="text-xl font-semibold">
            Compare other states for FIRE
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedStates.map((s) => (
              <Link
                key={s.code}
                href={`/best-states-for-fire/${s.slug}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="text-sm font-semibold text-white">
                  Is {s.name} good for FIRE?
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Explore taxes, housing, and FIRE potential in {s.name}
                </div>
              </Link>
            ))}
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
          </div>
        </footer>

      </div>
    </main>
  );
}
