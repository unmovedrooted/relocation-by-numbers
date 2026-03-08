import { notFound } from "next/navigation";
import Calculator from "@/components/Calculator";
import { findCity } from "@/lib/cities";
import Link from "next/link";
import { estimateMortgageMonthly } from "@/lib/mortgage";

type PageProps = {
  params: Promise<{ cityId: string }>;
};

const MORE_COMPARE_IDS = [
  "nyc-ny",
  "la-ca",
  "seattle-wa",
  "austin-tx",
  "boston-ma",
  "miami-fl",
  "sf-ca",
  "chicago-il",
  "denver-co",
  "atlanta-ga",
  "dallas-tx",
  "houston-tx",
  "phoenix-az",
  "philadelphia-pa",
  "sd-ca",
  "portland-or",
];

export async function generateStaticParams() {
  return [
    { cityId: "nyc-ny" },
    { cityId: "charlotte-nc" },
    { cityId: "austin-tx" },
    { cityId: "la-ca" },
    { cityId: "seattle-wa" },
    { cityId: "boston-ma" },
    { cityId: "miami-fl" },
  ];
}

export async function generateMetadata({ params }: PageProps) {
  const { cityId } = await params;
  const city = findCity(cityId);
  if (!city) return {};

  return {
    title: `Cost of Living in ${city.name}, ${city.state.toUpperCase()} (2026)`,
    description: `Housing, taxes, and salary comparison for ${city.name}. Use our relocation calculator to estimate rent/buy affordability and compare to other cities.`,
  };
}

export default async function CostOfLivingPage({ params }: PageProps) {
  const { cityId } = await params;
  const city = findCity(cityId);

  if (!city) return notFound();

  const moreCompare = MORE_COMPARE_IDS.filter((id) => id !== city.id)
    .map((id) => findCity(id))
    .filter(Boolean)
    .slice(0, 15) as { id: string; name: string; state: string }[];

  const intro = `Cost of living in ${city.name} is driven mostly by housing, taxes, and transportation. Use the calculator below to estimate how your take-home pay and housing costs might change.`;

  const popular = [
    { href: "/compare/nyc-ny/charlotte-nc", label: "NYC vs Charlotte" },
    { href: "/compare/la-ca/austin-tx", label: "LA vs Austin" },
    { href: "/compare/seattle-wa/dallas-tx", label: "Seattle vs Dallas" },
    { href: "/compare/boston-ma/miami-fl", label: "Boston vs Miami" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-10">
        {/* Hero (normalized) */}
        <header className="py-2 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Cost of Living in {city.name}, {city.state.toUpperCase()}
          </h1>

          <p className="mx-auto mt-2 max-w-3xl text-sm sm:text-base text-slate-600">
            {intro}
          </p>

          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-blue-600/80" />

          {/* Popular comparisons (chips, consistent) */}
          <div className="mx-auto mt-5 flex flex-wrap justify-center gap-2">
            {popular.map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                {x.label}
              </Link>
            ))}
          </div>
        </header>

        {/* Snapshot + Salary Guidance (premium card) */}
<section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70">
  <h2 className="text-sm font-semibold">Snapshot for {city.name}</h2>
  <div className="mt-4 h-px w-full bg-slate-100" />

  {/* Row 1: compact stat chips */}
<div className="mt-4 mb-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
  {[
    {
      label: "State",
      value: city.state.toUpperCase(),
    },
    {
      label: "Average Rent",
      value: city.defaultRent
        ? `$${city.defaultRent.toLocaleString()} / month`
        : "—",
    },
    {
      label: "Median Home Price",
      value: city.medianHomePrice
        ? `$${city.medianHomePrice.toLocaleString()}`
        : "—",
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
      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">
          {item.label}
        </span>
        <span className="text-sm font-semibold text-slate-900">
          {item.value}
        </span>
      </div>

      {item.extra && (
        <div className="mt-1 text-xs text-slate-500">
          {item.extra}
        </div>
      )}
    </div>
  ))}
</div>

  {/* Salary Guidance (compact chips) */}
  {city.defaultRent ? (
    (() => {
      const rent = city.defaultRent;
      const low = Math.round((rent * 12) / 0.35);
      const mid = Math.round((rent * 12) / 0.3);
      const high = Math.round((rent * 12) / 0.28);

      return (
        <>
          <div className="mt-4 mb-2 text-sm font-semibold text-slate-900">
            Salary guidance (rent ≈ ${rent.toLocaleString()}/mo)
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { label: "Tighter", value: low },
              { label: "Target", value: mid },
              { label: "Comfort", value: high },
            ].map((x) => (
              <div
                key={x.label}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <span className="text-xs font-medium text-slate-600">{x.label}</span>
                <span className="text-sm font-semibold text-slate-900">
                  ${x.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 text-xs text-slate-500">
            Rule of thumb: rent is ~28–35% of gross income.
          </div>
        </>
      );
    })()
  ) : (
    <div className="text-xs text-slate-500">No rent estimate found for this city yet.</div>
  )}
</section>

        {/* Calculator Pre-Filled */}
        <section>
          <Calculator
            monetization="state"
            initialToState={city.state}
            initialToCityId={city.id}
          />
        </section>

        {/* Bottom: How compares (rent) + deeper links */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70">
          <h2 className="text-sm font-semibold">
            How {city.name} compares (rent)
          </h2>

          <div className="mt-4 grid gap-3 text-sm">
            {[
              { id: "nyc-ny", label: "New York City" },
              { id: "austin-tx", label: "Austin" },
              { id: "miami-fl", label: "Miami" },
              { id: "boston-ma", label: "Boston" },
            ]
              .filter((x) => x.id !== city.id)
              .map((x) => {
                const other = findCity(x.id);
                if (!other) return null;

                const a = city.defaultRent ?? 0;
                const b = other.defaultRent ?? 0;
                const diff = a > 0 && b > 0 ? Math.round((1 - a / b) * 100) : null;

                const badge =
                  diff === null
                    ? "—"
                    : diff >= 0
                    ? `~${diff}% cheaper rent`
                    : `~${Math.abs(diff)}% higher rent`;

                return (
                  <Link
                    key={x.id}
                    href={`/compare/${x.id}/${city.id}`}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 transition hover:bg-slate-100"
                  >
                    <span className="font-medium text-slate-900">
                      {x.label} vs {city.name}
                    </span>
                    <span className="text-slate-600">{badge} →</span>
                  </Link>
                );
              })}
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Based on the starter rent estimates in your dataset. Real listings can vary by neighborhood and timing.
          </div>

          {/* More comparisons */}
          {moreCompare.length > 0 ? (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="mb-3 text-xs font-semibold text-slate-700">
                More comparisons
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
                {moreCompare.map((c) => (
                  <Link
                    key={c.id}
                    href={`/compare/${c.id}/${city.id}`}
                    className="whitespace-nowrap truncate text-slate-700 hover:underline"
                    title={`${c.name} vs ${city.name}`}
                  >
                    {c.name} vs {city.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}