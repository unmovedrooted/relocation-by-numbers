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

  // allow "major vs anything", block only "non-major vs non-major"
  if (!isMajorCity(fromCity) && !isMajorCity(toCity)) return notFound();

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
    .slice(0, 6);

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

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4 space-y-10">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {fromCity.name}, {fromCity.state.toUpperCase()} vs {toCity.name},{" "}
            {toCity.state.toUpperCase()} Cost of Living, Salary, and Housing Comparison
          </h1>

          <p className="mx-auto max-w-3xl text-slate-600">
            Compare take-home pay, estimated housing costs, and affordability between{" "}
            <span className="font-semibold text-slate-900">{fromCity.name}</span> and{" "}
            <span className="font-semibold text-slate-900">{toCity.name}</span>. See how far
            your salary may go in each city and what income could feel equivalent after a move.
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

        <div className="text-center text-xs text-slate-500">
          Assumptions updated: March 2026
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-[1.8rem] font-semibold tracking-tight text-slate-900 sm:text-[2rem] lg:text-[2.05rem]">
            Is moving from {fromCity.name} to {toCity.name} worth it?
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Moving from <span className="font-semibold text-slate-900">{fromCity.name}</span> to{" "}
              <span className="font-semibold text-slate-900">{toCity.name}</span> can change more
              than just rent. State taxes, home prices, monthly housing pressure, and how much
              flexibility you have left after bills can all shift in meaningful ways.
            </p>

            <p>
              This comparison is built to help you look past headline salary and focus on what your
              money may actually feel like in each place. A move that lowers housing pressure or
              improves take-home pay can make a salary stretch further even if the sticker salary
              stays the same.
            </p>

            <p>
              Use the calculator below to compare both cities side by side, then look at how taxes,
              housing, and affordability work together. This is especially useful if you are trying
              to decide whether a move could improve monthly breathing room or reduce the salary you
              would need to maintain a similar lifestyle.
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Who this move may be best for
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Remote workers</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If you can keep a stronger salary while moving to a lower-cost city, your take-home
                pay and monthly flexibility may improve faster than expected.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Future buyers</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Housing differences matter most for people planning to buy. Mortgage pressure,
                taxes, insurance, and down-payment expectations can change the full affordability
                picture.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">People leaving high housing pressure</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                If a large share of your income currently goes to rent or a mortgage, comparing a
                lower-cost city can show whether a move could improve monthly breathing room.
              </p>
            </div>
          </div>
        </section>

        {popular.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Related relocation comparisons
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Explore other city-to-city comparisons to see how taxes, housing costs, and salary
              needs change across major relocation paths.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {popular.map((x) => (
                <Link
                  key={x.href}
                  href={x.href}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {x.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

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