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
    { href: `/compare/${fromCity.id}/nyc-ny`, label: `${fromCity.name} vs NYC` },
    { href: `/compare/${fromCity.id}/austin-tx`, label: `${fromCity.name} vs Austin` },
    { href: `/compare/${toCity.id}/nyc-ny`, label: `${toCity.name} vs NYC` },
    { href: `/compare/${toCity.id}/charlotte-nc`, label: `${toCity.name} vs Charlotte` },
    { href: `/compare/${toCity.id}/miami-fl`, label: `${toCity.name} vs Miami` },
    { href: `/compare/${fromCity.id}/seattle-wa`, label: `${fromCity.name} vs Seattle` },
  ]
    .filter((x) => x.href !== `/compare/${fromCity.id}/${toCity.id}`)
    .filter((x) => {
      const parts = x.href.split("/compare/")[1]?.split("/");
      const a = parts?.[0];
      const b = parts?.[1];
      if (!a || !b) return false;
      return !!findCity(a) && !!findCity(b);
    })
    .slice(0, 4);

  // Dynamic links based on current route (keeps people clicking)
  const dynamicLinks = [
    { href: `/compare/${fromCity.id}/nyc-ny`, label: `${fromCity.name} vs NYC` },
    { href: `/compare/${fromCity.id}/charlotte-nc`, label: `${fromCity.name} vs Charlotte` },
    { href: `/compare/${fromCity.id}/austin-tx`, label: `${fromCity.name} vs Austin` },
    { href: `/compare/${fromCity.id}/seattle-wa`, label: `${fromCity.name} vs Seattle` },
    { href: `/compare/${fromCity.id}/boston-ma`, label: `${fromCity.name} vs Boston` },
    { href: `/compare/${fromCity.id}/miami-fl`, label: `${fromCity.name} vs Miami` },

    { href: `/compare/${toCity.id}/nyc-ny`, label: `${toCity.name} vs NYC` },
    { href: `/compare/${toCity.id}/charlotte-nc`, label: `${toCity.name} vs Charlotte` },
    { href: `/compare/${toCity.id}/austin-tx`, label: `${toCity.name} vs Austin` },
    { href: `/compare/${toCity.id}/seattle-wa`, label: `${toCity.name} vs Seattle` },
    { href: `/compare/${toCity.id}/boston-ma`, label: `${toCity.name} vs Boston` },
    { href: `/compare/${toCity.id}/miami-fl`, label: `${toCity.name} vs Miami` },
  ]
    .filter((x) => x.href !== `/compare/${fromCity.id}/${toCity.id}`)
    .filter((x, i, arr) => arr.findIndex((y) => y.href === x.href) === i)
    .filter((x) => {
      const parts = x.href.split("/compare/")[1]?.split("/");
      const a = parts?.[0];
      const b = parts?.[1];
      if (!a || !b) return false;
      return !!findCity(a) && !!findCity(b);
    })
    .slice(0, 4);

  const compareWhyTitle = `Why compare ${fromCity.name} and ${toCity.name}?`;

  const compareWhyTitleClass =
    "text-[1.8rem] sm:text-[2rem] lg:text-[2.05rem]";

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

          <div className="mx-auto mt-4 grid max-w-4xl grid-cols-2 gap-3 text-sm font-semibold sm:grid-cols-4">
            {dynamicLinks.map((x) => (
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

   <div className="mt-3 text-center text-xs text-slate-500">
  Assumptions updated: March 2026
</div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className={`${compareWhyTitleClass} font-semibold tracking-tight text-slate-900 lg:whitespace-nowrap`}>
            {compareWhyTitle}
          </h2>

          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            <p>
              Moving from <span className="font-semibold text-slate-900">{fromCity.name}</span> to{" "}
              <span className="font-semibold text-slate-900">{toCity.name}</span> can change taxes, housing costs, and monthly affordability.
            </p>

            <p>
              Use this calculator to compare take-home pay, estimate housing costs, and see how much
              monthly flexibility you may have in each location.
            </p>
          </div>
        </section>

        <Calculator
          monetization="compare"
          initialFromState={fromCity.state}
          initialToState={toCity.state}
          initialFromCityId={fromCity.id}
          initialToCityId={toCity.id}
        />

        <div className="mt-8 text-center">
          <div className="mb-3 text-xs text-slate-500">
            Assumptions updated: March 2026
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
            <Link href="/about" className="transition hover:text-slate-900">
              About
            </Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-slate-900">
              Disclaimer
            </Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-slate-900">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-slate-900">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}