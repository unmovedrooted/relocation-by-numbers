import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCity, majorCities } from "@/lib/cities";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

export async function generateStaticParams() {
  return majorCities().map((c) => ({
    cityId: c.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cityId } = await params;
  const city = findCity(cityId);

  if (!city) return { title: "City not found" };

  const rent = city.defaultRent;
  const rentNote = rent
    ? ` Average rent is $${rent.toLocaleString()}/mo.`
    : "";

  const title = `Is ${city.name} Good for FIRE? | Cost of Living, Taxes & Early Retirement`;
  const description = `Can you reach financial independence in ${city.name}, ${city.state.toUpperCase()}? See housing costs, rent, property taxes, and how ${city.name} compares for early retirement planning.${rentNote}`;

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

  const city = findCity(cityId);
  if (!city) return notFound();

  const rent = city.defaultRent ?? 0;
  const homePrice = city.medianHomePrice ?? 0;
  const taxRate = city.propertyTaxPct ?? 0;

  const fireNumber25x = rent ? Math.round((rent * 12) / 0.04) : null;
  const annualTax = homePrice && taxRate ? Math.round((homePrice * taxRate) / 100) : null;

  const affordabilityNote =
    rent <= 1500
      ? `${city.name} has below-average rent for a major US city, which directly lowers your FIRE number and can shorten your timeline to financial independence.`
      : rent <= 2200
        ? `${city.name} sits in the mid-range for housing costs. Affordability depends significantly on your income and whether you rent or plan to buy.`
        : `${city.name} is on the more expensive side for rent. Higher housing costs mean a larger FIRE number and a longer timeline unless offset by a higher income or lower expenses elsewhere.`;

  const relatedCities = majorCities()
    .filter((c) => c.id !== city.id && c.state !== city.state)
    .slice(0, 6);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">

        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Is {city.name} Good for FIRE?
          </h1>

          <p className="mt-1 text-lg font-semibold text-slate-200">
            {city.name}, {city.state.toUpperCase()} — Cost of Living, Housing &amp; Early Retirement Guide
          </p>

          <p className="max-w-2xl text-sm text-slate-300">
            {city.name} {city.state.toUpperCase()} could help accelerate — or slow —
            financial independence depending on housing costs, state income taxes, and
            overall cost of living. This page covers the key numbers for FIRE planning
            in {city.name}.
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
            <Link
              href="/"
              className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
            >
              Compare Cities →
            </Link>
          </div>
        </header>

        {/* Housing snapshot */}
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

          <p className="text-sm leading-relaxed text-slate-300">{affordabilityNote}</p>

          {fireNumber25x ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
              <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wide">
                Estimated FIRE number if renting in {city.name}
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                ~${fireNumber25x.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Based on rent as your primary housing cost at a 4% withdrawal rate (25×
                annual expenses). Does not include taxes, utilities, or other living costs.
              </div>
            </div>
          ) : null}
        </section>

        {/* FIRE context */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-xl font-semibold">
            Can you reach FIRE in {city.name}?
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              Financial independence in {city.name} is achievable for many people —
              but the timeline depends heavily on your income, savings rate, and how
              much of your budget goes to housing. The key question is not just whether
              {" "}{city.name} is affordable in absolute terms, but whether it is affordable
              relative to your income.
            </p>
            <p>
              {city.state.toUpperCase()} state income taxes also affect how much of each
              paycheck you keep. Use the FIRE calculator to model your specific income,
              state tax, and housing scenario to see a realistic timeline.
            </p>
            <p>
              If you are moving to {city.name} from a higher-cost city, the reduction in
              housing expenses can directly lower your FIRE number and accelerate savings —
              especially if you maintain a similar income. Use the city comparison tool
              to see the before-and-after budget side by side.
            </p>
          </div>
        </section>

        {/* FAQ */}
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
                It depends on your income and lifestyle. {city.name}'s average rent of{" "}
                {rent ? `$${rent.toLocaleString()}/mo` : "N/A"} means your annual housing
                costs are roughly{" "}
                {rent ? `$${(rent * 12).toLocaleString()}` : "N/A"}, which directly shapes
                your FIRE number. Use the FIRE calculator to model your specific situation.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How much do I need to retire early in {city.name}?
              </dt>
              <dd className="mt-1">
                {fireNumber25x ? (
                  <>
                    If rent is your primary housing cost, a rough FIRE number for{" "}
                    {city.name} starts around{" "}
                    <span className="font-semibold text-white">
                      ${fireNumber25x.toLocaleString()}
                    </span>{" "}
                    — based on rent alone at a 4% withdrawal rate. Add groceries,
                    utilities, healthcare, and other expenses to get a more complete target.
                  </>
                ) : (
                  <>
                    Your FIRE number in {city.name} depends on your total annual expenses.
                    Use the 4% rule: multiply your expected annual spending by 25 to get
                    your portfolio target.
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                How does moving to {city.name} affect my FIRE timeline?
              </dt>
              <dd className="mt-1">
                If {city.name} has lower housing costs than where you currently live,
                your annual expenses drop — which lowers your FIRE number and increases
                how much you can save each month. Both effects compound over time. Use the
                city comparison tool to see the before-and-after budget based on your
                specific income.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-white">
                What is the cost of living in {city.name} for early retirement?
              </dt>
              <dd className="mt-1">
                The main costs to plan for in {city.name} are housing (average rent{" "}
                {rent ? `$${rent.toLocaleString()}/mo` : "N/A"}), state income taxes on
                withdrawals, healthcare, and everyday expenses. The full cost of living
                guide for {city.name} covers these in more detail.
              </dd>
            </div>
          </dl>
        </section>

        {/* Related cities */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5">
          <h2 className="text-xl font-semibold">
            Compare {city.name} with other FIRE cities
          </h2>
          <p className="text-sm text-slate-400">
            See how {city.name} stacks up against other cities on rent, housing costs,
            and FIRE potential.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedCities.map((c) => (
              <Link
                key={c.id}
                href={`/best-cities-for-fire/${c.id}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="text-sm font-semibold text-white">
                  Is {c.name} good for FIRE?
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {c.state.toUpperCase()} · Avg rent{" "}
                  {c.defaultRent ? `$${c.defaultRent.toLocaleString()}/mo` : "N/A"}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-3">
          <h2 className="text-xl font-semibold">
            Model your FIRE timeline in {city.name}
          </h2>
          <p className="text-sm text-slate-300">
            Use the relocation calculator to estimate your post-move budget in{" "}
            {city.name}, then plug that number into the FIRE calculator to see how
            many years relocating could save.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/fire-calculator"
              className="inline-flex items-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              Open FIRE Calculator
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Compare Cities
            </Link>
            <Link
              href={`/cost-of-living/${cityId}`}
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Full cost of living guide
            </Link>
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
