import { notFound } from "next/navigation";
import Calculator from "@/components/Calculator";
import { findCity } from "@/lib/cities";
import Link from "next/link";
import { estimateMortgageMonthly } from "@/lib/mortgage";
import type { Metadata } from "next";
import { ALLOWED_FIRE_CITY_PAGES } from "@/lib/seo-allowlists";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

const ALLOWED_CITY_IDS = [
  "nyc-ny",
  "charlotte-nc",
  "austin-tx",
  "la-ca",
  "seattle-wa",
  "boston-ma",
  "miami-fl",
] as const;

const CITY_CONTENT: Record<
  string,
  {
    primary: string;
    secondary: string;
    caution: string;
    salaryNote: string;
  }
> = {
  "nyc-ny": {
    primary:
      "New York City is one of the hardest places in the country to make the cost-of-living math work comfortably unless income is very strong. Housing pressure alone can consume a large share of take-home pay.",
    secondary:
      "The city works financially for some households because income potential can be unusually high, but that only helps if salary growth is strong enough to offset housing and tax drag.",
    caution:
      "A high gross salary in New York can still feel tight once rent, state tax, and daily living costs are layered in.",
    salaryNote:
      "For New York City, the main question is not whether the city is expensive. It is how high your income must be before the cost structure stops crowding out savings and flexibility.",
  },
  "charlotte-nc": {
    primary:
      "Charlotte is often easier to manage than higher-cost coastal cities because housing pressure is usually much lower while still offering access to a large metro economy.",
    secondary:
      "For many households, Charlotte’s financial appeal comes from the balance between manageable housing costs and decent income potential rather than from ultra-low living costs alone.",
    caution:
      "Charlotte only creates a real affordability win if the move improves your income-to-cost ratio, not just your headline rent number.",
    salaryNote:
      "In Charlotte, the salary target is usually more about creating breathing room and savings capacity than merely surviving the rent payment.",
  },
  "austin-tx": {
    primary:
      "Austin often looks attractive because Texas has no state income tax, but the city is no longer a low-cost market in the way many people still assume.",
    secondary:
      "For some households, Austin works because take-home pay can improve relative to higher-tax states. But the result still depends heavily on rent, home prices, and insurance costs.",
    caution:
      "The tax advantage is real, but the housing side can narrow the gap more than people expect.",
    salaryNote:
      "For Austin, the salary question is less about tax headlines and more about whether your pay is strong enough to keep the city feeling flexible rather than merely acceptable.",
  },
  "la-ca": {
    primary:
      "Los Angeles is expensive primarily because of housing pressure. Rent, ownership costs, and overall recurring expenses can make even solid incomes feel stretched.",
    secondary:
      "The city can still work for high earners, but the cost-of-living burden usually means a larger salary is required before meaningful savings and flexibility show up.",
    caution:
      "Los Angeles often looks manageable on paper until housing and taxes are measured against real take-home pay.",
    salaryNote:
      "For Los Angeles, the main issue is how much income is needed not just to pay rent, but to still save, invest, and maintain a useful buffer afterward.",
  },
  "seattle-wa": {
    primary:
      "Seattle benefits from no state income tax, which helps take-home pay, but housing costs can still make the monthly budget feel tight.",
    secondary:
      "The city often works best for households with strong salaries that are high enough to capture the tax advantage without being overwhelmed by rent or ownership costs.",
    caution:
      "No state income tax helps, but it does not make Seattle cheap.",
    salaryNote:
      "In Seattle, the salary target matters because the city often sits in the uncomfortable middle ground between strong income potential and still-heavy housing costs.",
  },
  "boston-ma": {
    primary:
      "Boston can support a high-income lifestyle, but it is not an easy city from a cost-of-living perspective because housing remains expensive and tax drag still matters.",
    secondary:
      "The city tends to work better for people with strong earnings power than for households trying to optimize around low recurring expenses.",
    caution:
      "Boston often feels tighter than its salaries suggest once housing and taxes are measured together.",
    salaryNote:
      "For Boston, the salary you need is less about clearing rent and more about whether there is enough room left for savings and long-term financial progress.",
  },
  "miami-fl": {
    primary:
      "Miami attracts attention because Florida has no state income tax, but the city is not a low-cost market overall. Housing costs can still put real pressure on the budget.",
    secondary:
      "For some households, Miami works because the tax side improves take-home pay. For others, housing and ownership costs absorb too much of that advantage.",
    caution:
      "It is easy to overestimate Miami’s affordability if you focus only on the tax benefit.",
    salaryNote:
      "For Miami, the salary target should be thought of as a buffer against housing pressure, not just a number that clears the minimum monthly bills.",
  },
};

const POPULAR_COMPARE_LINKS: Record<string, { href: string; label: string }[]> = {
  "nyc-ny": [
    { href: "/compare/nyc-ny/charlotte-nc", label: "NYC vs Charlotte" },
    { href: "/compare/nyc-ny/austin-tx", label: "NYC vs Austin" },
    { href: "/compare/nyc-ny/miami-fl", label: "NYC vs Miami" },
  ],
  "charlotte-nc": [{ href: "/compare/nyc-ny/charlotte-nc", label: "NYC vs Charlotte" }],
  "austin-tx": [{ href: "/compare/la-ca/austin-tx", label: "LA vs Austin" }],
  "la-ca": [{ href: "/compare/la-ca/austin-tx", label: "LA vs Austin" }],
  "seattle-wa": [{ href: "/compare/seattle-wa/miami-fl", label: "Seattle vs Miami" }],
  "boston-ma": [{ href: "/compare/boston-ma/miami-fl", label: "Boston vs Miami" }],
  "miami-fl": [
    { href: "/compare/nyc-ny/miami-fl", label: "NYC vs Miami" },
    { href: "/compare/boston-ma/miami-fl", label: "Boston vs Miami" },
  ],
};

export async function generateStaticParams() {
  return ALLOWED_CITY_IDS.map((cityId) => ({ cityId }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cityId } = await params;
  const city = findCity(cityId);
  if (!city) return {};

  const title = `Cost of Living in ${city.name}, ${city.state.toUpperCase()} — Rent, Taxes & Salary Guide`;
  const description = `How much does it cost to live in ${city.name}? Compare rent, median home prices, income taxes, and take-home pay. See the salary you need to live comfortably in ${city.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/cost-of-living/${cityId}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.relocationbynumbers.com/cost-of-living/${cityId}`,
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

export default async function CostOfLivingPage({ params }: PageProps) {
  const { cityId } = await params;

  if (!ALLOWED_CITY_IDS.includes(cityId as (typeof ALLOWED_CITY_IDS)[number])) {
    return notFound();
  }

  const city = findCity(cityId);
  if (!city) return notFound();

  const cityContent = CITY_CONTENT[city.id];
  if (!cityContent) return notFound();

  const popular = POPULAR_COMPARE_LINKS[city.id] ?? [];

  const rent = city.defaultRent ?? 0;
  const tighter = rent ? Math.round((rent * 12) / 0.35) : null;
  const target = rent ? Math.round((rent * 12) / 0.3) : null;
  const comfort = rent ? Math.round((rent * 12) / 0.28) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 dark:from-slate-950 to-white dark:to-slate-900 py-10 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6">
        <header className="py-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Cost of Living in {city.name}, {city.state.toUpperCase()}
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
            This page looks at rent, median home prices, property taxes, income taxes, and the
            salary you may need to live with breathing room in {city.name}.
          </p>

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Assumptions updated: March 2026
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/compare"
              className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 shadow-sm transition hover:bg-slate-50 hover:dark:bg-slate-950"
            >
              Compare {city.name} with NYC
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 shadow-sm transition hover:bg-slate-50 hover:dark:bg-slate-950"
            >
              See methodology
            </Link>
          </div>

          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-blue-600/80 dark:bg-blue-700/80" />

          {popular.length > 0 ? (
            <div className="mx-auto mt-5 flex flex-wrap justify-center gap-2">
              {popular.map((x) => (
                <Link
                  key={x.href}
                  href={x.href}
                  className="rounded-full bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 transition hover:bg-slate-50 hover:dark:bg-slate-950"
                >
                  {x.label}
                </Link>
              ))}
            </div>
          ) : null}
        </header>

        <section className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:ring-slate-800/70">
          <h2 className="text-sm font-semibold">
            {city.name} cost of living snapshot
          </h2>
          <div className="mt-4 h-px w-full bg-slate-100 dark:bg-slate-900/40" />

          <div className="mb-4 mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
            {[
              {
                label: "State",
                value: city.state.toUpperCase(),
              },
              {
                label: "Average Rent",
                value: city.defaultRent ? `$${city.defaultRent.toLocaleString()} / month` : "—",
              },
              {
                label: "Median Home Price",
                value: city.medianHomePrice ? `$${city.medianHomePrice.toLocaleString()}` : "—",
                extra: city.medianHomePrice
                  ? (() => {
                      const pmt = estimateMortgageMonthly(city.medianHomePrice, {
                        downPct: 0.2,
                        rate: 0.07,
                        years: 30,
                      });
                      return pmt ? `Est. mortgage: $${pmt.toLocaleString()}/mo` : null;
                    })()
                  : null,
              },
              {
                label: "Property Tax",
                value: city.propertyTaxPct ? `${city.propertyTaxPct}%` : "—",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
                </div>
                {item.extra ? (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.extra}</div>
                ) : null}
              </div>
            ))}
          </div>

          {rent ? (
            <>
              <div className="mb-2 mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Salary needed in {city.name} (rent ≈ ${rent.toLocaleString()}/mo)
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { label: "Tighter", value: tighter },
                  { label: "Target", value: target },
                  { label: "Comfort", value: comfort },
                ].map((x) => (
                  <div
                    key={x.label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2"
                  >
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{x.label}</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      ${x.value?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Rule of thumb: rent is roughly 28–35% of gross income.
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400">No rent estimate found for this city yet.</div>
          )}
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:ring-slate-800/70">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Is {city.name} expensive to live in?
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
            <p>{cityContent.primary}</p>
            <p>{cityContent.secondary}</p>
            <p>{cityContent.caution}</p>
          </div>
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:ring-slate-800/70">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            What this page measures
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Housing pressure</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Rent, home prices, and property taxes usually have the biggest effect on whether a city feels affordable.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Salary fit</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                A city is only workable if your income is high enough relative to its housing and tax burden.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                State and federal taxes shape how much of your paycheck is actually available for rent, savings, and flexibility.
              </p>
            </div>
          </div>
        </section>

        <section>
          <Calculator
            monetization="state"
            initialToState={city.state}
            initialToCityId={city.id}
          />
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:ring-slate-800/70">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            What salary do you need to live in {city.name}?
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-400">
            <p>{cityContent.salaryNote}</p>
            <p>
              The tighter, target, and comfort ranges are not exact promises. They are planning
              ranges meant to show the difference between barely workable, more sustainable, and
              more comfortable salary levels.
            </p>
            {target ? (
              <p>
                Based on the current rent estimate for {city.name}, a salary around{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">${target.toLocaleString()}</span>{" "}
                is a reasonable starting point for many renters, while a salary closer to{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">${comfort?.toLocaleString()}</span>{" "}
                may leave more room for savings and unexpected costs.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:ring-slate-800/70">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Frequently asked questions about {city.name}
          </h2>
          <dl className="mt-5 space-y-5 text-sm text-slate-600 dark:text-slate-400">
            <div>
              <dt className="font-semibold text-slate-900 dark:text-slate-100">
                What is the cost of living in {city.name}?
              </dt>
              <dd className="mt-1">
                The biggest drivers are usually housing, taxes, and transportation. This page uses planning estimates for rent, home prices, and tax context to help you compare {city.name} with other cities.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-slate-100">
                What salary do you need to live comfortably in {city.name}?
              </dt>
              <dd className="mt-1">
                {target && comfort ? (
                  <>
                    Based on current rent estimates, a salary of around ${target.toLocaleString()} is a reasonable target for many renters in {city.name}. A salary closer to ${comfort.toLocaleString()} usually leaves more room for savings and flexibility.
                  </>
                ) : (
                  <>
                    It depends on your rent, lifestyle, and savings goals. Use the calculator on this page to estimate based on your own income assumptions.
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-slate-100">
                Is {city.name} a good place to move for affordability?
              </dt>
              <dd className="mt-1">
                It depends on where you are moving from and whether the city improves your income-to-cost ratio. The comparison tool is the best way to pressure-test that.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-slate-100">
                How does {city.state.toUpperCase()} state income tax affect take-home pay in {city.name}?
              </dt>
              <dd className="mt-1">
                State income tax is one of the biggest variables in how far your salary goes. The calculator applies {city.state.toUpperCase()} state tax rules so you can compare take-home pay, not just gross salary.
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:ring-slate-800/70">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Related pages for {city.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/salary-needed-in/${city.id}`}
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              Salary Needed in {city.name}
            </Link>
            <Link
              href={
                ALLOWED_FIRE_CITY_PAGES.includes(city.id as (typeof ALLOWED_FIRE_CITY_PAGES)[number])
                  ? `/fire-in/${city.id}`
                  : "/fire-calculator"
              }
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              FIRE in {city.name}
            </Link>
            <Link
              href="/compare"
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 hover:dark:bg-slate-900/40"
            >
              Explore Compare Pages
            </Link>
          </div>
        </section>

        <div className="mt-8 text-center">
          <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Assumptions updated: March 2026
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/about" className="transition hover:text-slate-900 hover:dark:text-slate-100">About</Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-slate-900 hover:dark:text-slate-100">Disclaimer</Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-slate-900 hover:dark:text-slate-100">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-slate-900 hover:dark:text-slate-100">Terms</Link>
            <span>•</span>
            <Link href="/methodology" className="transition hover:text-slate-900 hover:dark:text-slate-100">Methodology</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
