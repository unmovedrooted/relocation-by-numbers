import Calculator from "@/components/Calculator";
import { findCity, isMajorCity } from "@/lib/cities";
import { majorCityPairs } from "@/lib/majorCities";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamicParams = true;

// Pre-generate major city compare routes
export async function generateStaticParams() {
  return majorCityPairs.map(({ from, to }) => ({ from, to }));
}

type PageProps = {
  params: Promise<{ from: string; to: string }>;
};

export default async function ComparePage({ params }: PageProps) {
  const { from, to } = await params;

  const fromCity = findCity(from);
  const toCity = findCity(to);

  if (!fromCity || !toCity) return notFound();

  // ✅ allow "major vs anything", block only "non-major vs non-major"
  if (!isMajorCity(fromCity) && !isMajorCity(toCity)) return notFound();

  // Curated popular links (safe / common)
  const popular = [
    { href: "/compare/nyc-ny/charlotte-nc", label: "NYC vs Charlotte" },
    { href: "/compare/la-ca/austin-tx", label: "LA vs Austin" },
    { href: "/compare/seattle-wa/dallas-tx", label: "Seattle vs Dallas" },
    { href: "/compare/boston-ma/miami-fl", label: "Boston vs Miami" },
  ];

  // Dynamic links based on current route (keeps people clicking)
  // NOTE: make sure these city ids exist in your dataset.
  const dynamicLinks = [
    { href: `/compare/${fromCity.id}/nyc-ny`, label: `${fromCity.name} vs NYC` },
    { href: `/compare/${fromCity.id}/charlotte-nc`, label: `${fromCity.name} vs Charlotte` },
    { href: `/compare/${toCity.id}/nyc-ny`, label: `${toCity.name} vs NYC` },
    { href: `/compare/${toCity.id}/austin-tx`, label: `${toCity.name} vs Austin` },
  ]
    // avoid linking to the same exact page
    .filter((x) => x.href !== `/compare/${fromCity.id}/${toCity.id}`)
    // avoid links that point to missing cities
    .filter((x) => {
      const parts = x.href.split("/compare/")[1]?.split("/");
      const a = parts?.[0];
      const b = parts?.[1];
      if (!a || !b) return false;
      return !!findCity(a) && !!findCity(b);
    })
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4 space-y-10">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            {fromCity.name}, {fromCity.state.toUpperCase()} vs{" "}
            {toCity.name}, {toCity.state.toUpperCase()}
          </h1>

          <p className="mx-auto max-w-3xl text-slate-600">
            Compare take-home pay, housing costs, and property taxes—then see what salary would feel equivalent.
          </p>

          {/* Popular comparisons (1 row of 4 on desktop) */}
          <div className="mx-auto mt-4 grid max-w-4xl grid-cols-2 gap-3 text-sm font-semibold sm:grid-cols-4">
            {popular.map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
              >
                {x.label}
              </Link>
            ))}
          </div>
        </header>

        <Calculator
          monetization="compare"
          initialFromState={fromCity.state}
          initialToState={toCity.state}
          initialFromCityId={fromCity.id}
          initialToCityId={toCity.id}
        />

      </div>
    </main>
  );
}