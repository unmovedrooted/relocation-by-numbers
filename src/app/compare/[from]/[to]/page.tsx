import type { Metadata } from "next";
import Calculator from "@/components/Calculator";
import { findCity } from "@/lib/cities";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamicParams = true;

const ALLOWED_COMPARE_ROUTES = [
  { from: "nyc-ny", to: "charlotte-nc" },
  { from: "nyc-ny", to: "austin-tx" },
  { from: "nyc-ny", to: "miami-fl" },
  { from: "la-ca", to: "austin-tx" },
  { from: "la-ca", to: "charlotte-nc" },
  { from: "seattle-wa", to: "dallas-tx" },
  { from: "seattle-wa", to: "miami-fl" },
  { from: "boston-ma", to: "miami-fl" },
  { from: "boston-ma", to: "charlotte-nc" },
  { from: "seattle-wa", to: "charlotte-nc" },
] as const;

const isAllowedWhitelistedRoute = (from: string, to: string) =>
  ALLOWED_COMPARE_ROUTES.some((route) => route.from === from && route.to === to);

const ROUTE_CONTENT: Record<
  string,
  {
    primary: string;
    secondary: string;
    caution: string;
    audienceTitle: string;
    audienceBody: string;
  }
> = {
  "nyc-ny__charlotte-nc": {
    primary:
      "For this route, the biggest potential affordability gain usually comes from lower housing pressure rather than tax differences alone.",
    secondary:
      "If you can keep a similar salary while moving from New York City to Charlotte, the destination may leave more room in your monthly budget because fixed housing costs are often easier to absorb.",
    caution:
      "The biggest risk is assuming the affordability win holds if your compensation drops materially after the move.",
    audienceTitle: "Best for people trying to lower housing pressure",
    audienceBody:
      "This comparison is often most useful for remote workers, renters, and households trying to reduce fixed monthly costs without relying only on a tax change.",
  },
  "nyc-ny__austin-tx": {
    primary:
      "This move is often framed as a tax win because Texas has no state income tax, but the better question is whether your full monthly budget actually improves.",
    secondary:
      "Austin can look stronger on take-home pay, yet the real result depends on what happens to housing costs and whether your salary stays close to New York levels after the move.",
    caution:
      "For buyers, the headline tax benefit can shrink once ownership costs like property tax and insurance are taken more seriously.",
    audienceTitle: "Best for higher earners testing a Sun Belt move",
    audienceBody:
      "This comparison is often most useful for remote workers and higher earners deciding whether a lower-tax destination actually creates more monthly flexibility.",
  },
  "nyc-ny__miami-fl": {
    primary:
      "The obvious draw in this route is the shift to a no-income-tax state, which can materially improve take-home pay for some households.",
    secondary:
      "But this is not a simple tax story. Miami can still put pressure on the budget depending on how much you spend on housing and whether you plan to rent or buy.",
    caution:
      "The route can look stronger on paper than it feels in a real budget if you understate destination housing and insurance assumptions.",
    audienceTitle: "Best for tax-focused comparisons with real cost tradeoffs",
    audienceBody:
      "This comparison is often most useful for higher earners and flexible households trying to decide whether tax savings outweigh the cost pressure of the destination.",
  },
  "la-ca__austin-tx": {
    primary:
      "This route is often treated as an easy tax-and-cost win, but the full answer depends on whether your housing costs actually fall enough to improve monthly flexibility.",
    secondary:
      "Moving from Los Angeles to Austin can improve take-home pay because of the state tax shift, but the budget outcome depends heavily on whether you rent or buy and whether your salary changes after the move.",
    caution:
      "For buyers, ownership costs can narrow the gap more than people expect, so the move is not automatically as favorable as the tax story makes it sound.",
    audienceTitle: "Best for remote workers and salary-stable movers",
    audienceBody:
      "This comparison is often most useful for households testing whether a move away from California really translates into a better monthly budget.",
  },
  "la-ca__charlotte-nc": {
    primary:
      "For this route, housing relief is often the biggest part of the affordability story.",
    secondary:
      "Compared with Los Angeles, Charlotte can materially reduce monthly housing pressure, which may matter more than the headline salary difference by itself.",
    caution:
      "The key question is whether your income stays strong enough for the lower-cost market to create a lasting budget advantage.",
    audienceTitle: "Best for households trying to cut fixed monthly costs",
    audienceBody:
      "This comparison is often most useful for renters, remote workers, and households that feel squeezed by high housing costs in Southern California.",
  },
  "seattle-wa__dallas-tx": {
    primary:
      "This route is usually about balancing tax savings and housing changes against a different overall cost structure.",
    secondary:
      "Moving from Seattle to Dallas can improve affordability for some households, but the outcome depends on whether housing and transportation costs offset part of the tax advantage.",
    caution:
      "Do not treat the move as automatically cheaper just because the destination has no state income tax.",
    audienceTitle: "Best for job-offer and relocation package comparisons",
    audienceBody:
      "This comparison is often most useful for people evaluating a similar salary in two different metros and trying to understand how taxes and housing interact.",
  },
  "seattle-wa__miami-fl": {
    primary:
      "The main draw in this route is usually tax treatment, but the real budget answer depends on what happens to housing and recurring destination costs.",
    secondary:
      "A move from Seattle to Miami can look attractive at the take-home level, but monthly affordability is still heavily shaped by how you handle housing.",
    caution:
      "The route can disappoint if you focus on tax savings and underweight housing or insurance assumptions.",
    audienceTitle: "Best for higher earners comparing two expensive markets",
    audienceBody:
      "This comparison is often most useful for flexible households deciding whether a different tax profile actually improves monthly breathing room.",
  },
  "boston-ma__miami-fl": {
    primary:
      "This route usually attracts attention because of state tax differences, but taxes are only part of the decision.",
    secondary:
      "A move from Boston to Miami can improve take-home pay, yet the real monthly benefit depends on housing and recurring destination costs much more than people assume.",
    caution:
      "The move can sound better on paper than it feels in practice if you do not pressure-test the housing assumptions.",
    audienceTitle: "Best for tax-sensitive households testing real affordability",
    audienceBody:
      "This comparison is often most useful for higher earners and households deciding whether tax savings create a real monthly advantage rather than just a better headline.",
  },
  "boston-ma__charlotte-nc": {
    primary:
      "For this route, lower housing pressure is often the biggest part of the affordability improvement.",
    secondary:
      "Moving from Boston to Charlotte may improve the budget more through lower fixed monthly costs than through any single headline tax difference.",
    caution:
      "The biggest question is whether your salary holds up well enough after the move for the cost difference to matter in a lasting way.",
    audienceTitle: "Best for people trying to lower monthly strain",
    audienceBody:
      "This comparison is often most useful for renters, remote workers, and households looking for a lower-cost metro without relying on a purely tax-driven story.",
  },
  "seattle-wa__charlotte-nc": {
    primary:
      "For many households, this route is mainly a housing-pressure story rather than a tax story.",
    secondary:
      "Compared with Seattle, Charlotte may leave more room in the budget if rent or ownership costs drop enough to improve monthly flexibility.",
    caution:
      "The result becomes much less compelling if the move comes with a large salary reset.",
    audienceTitle: "Best for remote workers and cost reducers",
    audienceBody:
      "This comparison is often most useful for households trying to trade a higher-cost market for lower monthly pressure while keeping income relatively strong.",
  },
};

export async function generateStaticParams() {
  return ALLOWED_COMPARE_ROUTES;
}

type PageProps = {
  params: Promise<{ from: string; to: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { from, to } = await params;

  if (!isAllowedWhitelistedRoute(from, to)) return {};

  const fromCity = findCity(from);
  const toCity = findCity(to);

  if (!fromCity || !toCity) return {};

  const title = `${fromCity.name} vs ${toCity.name} Cost of Living, Taxes & Salary Comparison`;
  const description = `Compare cost of living, take-home pay, rent, housing costs, and taxes between ${fromCity.name}, ${fromCity.state.toUpperCase()} and ${toCity.name}, ${toCity.state.toUpperCase()}. See what salary feels equivalent after moving.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/compare/${from}/${to}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.relocationbynumbers.com/compare/${from}/${to}`,
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

export default async function ComparePage({ params }: PageProps) {
  const { from, to } = await params;

  if (!isAllowedWhitelistedRoute(from, to)) return notFound();

  const fromCity = findCity(from);
  const toCity = findCity(to);

  if (!fromCity || !toCity) return notFound();

  const routeKey = `${from}__${to}`;
  const routeContent = ROUTE_CONTENT[routeKey];

  if (!routeContent) return notFound();

  const sameState = fromCity.state.toUpperCase() === toCity.state.toUpperCase();

  const isValidCompareHref = (href: string) => {
    const parts = href.split("/compare/")[1]?.split("/");
    const a = parts?.[0];
    const b = parts?.[1];
    if (!a || !b) return false;
    return isAllowedWhitelistedRoute(a, b);
  };

  const dynamicLinks = [
    { href: `/compare/${fromCity.id}/nyc-ny`, label: `${fromCity.name} vs NYC` },
    { href: `/compare/${fromCity.id}/charlotte-nc`, label: `${fromCity.name} vs Charlotte` },
    { href: `/compare/${fromCity.id}/austin-tx`, label: `${fromCity.name} vs Austin` },
    { href: `/compare/${fromCity.id}/seattle-wa`, label: `${fromCity.name} vs Seattle` },
    { href: `/compare/${fromCity.id}/miami-fl`, label: `${fromCity.name} vs Miami` },

    { href: `/compare/${toCity.id}/nyc-ny`, label: `${toCity.name} vs NYC` },
    { href: `/compare/${toCity.id}/charlotte-nc`, label: `${toCity.name} vs Charlotte` },
    { href: `/compare/${toCity.id}/austin-tx`, label: `${toCity.name} vs Austin` },
    { href: `/compare/${toCity.id}/seattle-wa`, label: `${toCity.name} vs Seattle` },
    { href: `/compare/${toCity.id}/miami-fl`, label: `${toCity.name} vs Miami` },
  ]
    .filter((x) => x.href !== `/compare/${fromCity.id}/${toCity.id}`)
    .filter((x) => isValidCompareHref(x.href))
    .filter((x, i, arr) => arr.findIndex((y) => y.href === x.href) === i)
    .slice(0, 4);

  const relatedComparisons = ALLOWED_COMPARE_ROUTES.map((route) => {
    const a = findCity(route.from);
    const b = findCity(route.to);
    if (!a || !b) return null;
    return {
      href: `/compare/${route.from}/${route.to}`,
      label: `${a.name} vs ${b.name}`,
      from: route.from,
      to: route.to,
    };
  })
    .filter(Boolean)
    .filter((x) => x!.href !== `/compare/${from}/${to}`)
    .filter((x) => x!.from === from || x!.to === to || x!.to === from || x!.from === to)
    .slice(0, 5) as { href: string; label: string; from: string; to: string }[];

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl space-y-10 px-4">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {fromCity.name} vs {toCity.name} Cost of Living Comparison
          </h1>

          <p className="mt-1 text-lg font-semibold text-slate-700">
            {fromCity.name}, {fromCity.state.toUpperCase()} vs {toCity.name},{" "}
            {toCity.state.toUpperCase()} — Salary, Taxes &amp; Housing
          </p>

          <p className="mx-auto max-w-3xl text-slate-600 leading-7">
            Compare take-home pay, housing costs, and monthly affordability between{" "}
            <span className="font-semibold text-slate-900">{fromCity.name}</span> and{" "}
            <span className="font-semibold text-slate-900">{toCity.name}</span>. This page is built
            to help you look past headline salary and see what a move may actually do to your budget.
          </p>

          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500">
            <span>Planning estimates only.</span>
            <span className="hidden sm:inline">•</span>
            <span>Results depend on salary, tax status, and housing assumptions.</span>
            <span className="hidden sm:inline">•</span>
            <Link
              href="/methodology"
              className="font-medium text-slate-700 underline underline-offset-4 hover:no-underline"
            >
              See methodology
            </Link>
          </div>

          {dynamicLinks.length > 0 ? (
            <div className="mx-auto mt-4 grid max-w-4xl grid-cols-2 gap-3 text-sm font-semibold sm:grid-cols-4">
              {dynamicLinks.map((x) => (
                <Link
                  key={x.href}
                  href={x.href}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 hover:bg-slate-50"
                >
                  {x.label}
                </Link>
              ))}
            </div>
          ) : null}
        </header>

        <div className="text-center text-xs text-slate-500">
          Assumptions updated: March 2026
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            What to pay attention to when comparing {fromCity.name} and {toCity.name}
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>{routeContent.primary}</p>
            <p>{routeContent.secondary}</p>
            <p>{routeContent.caution}</p>
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
            How to read this {fromCity.name} vs {toCity.name} comparison
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Start with take-home pay</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {sameState
                  ? `Because both cities are in ${fromCity.state.toUpperCase()}, the tax difference is less likely to be the main story. Start by looking at housing and budget pressure first.`
                  : `Because this move crosses state lines, start by checking whether the change in state tax treatment materially improves take-home pay.`}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Then check housing pressure</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Housing is usually the largest expense in a move. A tax win can disappear fast if
                rent, home prices, insurance, or ownership costs rise enough.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Focus on monthly flexibility</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The most useful question is simple: after essential costs, do you have more room,
                less room, or roughly the same room in your budget?
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Who this comparison is most useful for
          </h2>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-slate-900">{routeContent.audienceTitle}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{routeContent.audienceBody}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            What this comparison includes — and what it does not
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="font-semibold text-slate-900">Included</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                <li>Estimated state and federal tax differences</li>
                <li>Housing-related affordability differences</li>
                <li>Monthly budget comparison between the two cities</li>
                <li>Comparable salary planning estimate</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-semibold text-slate-900">Not fully modeled</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                <li>Neighborhood-level rent variation</li>
                <li>Childcare, school, or family-specific costs</li>
                <li>Detailed insurance and healthcare variation</li>
                <li>One-time moving or closing costs</li>
              </ul>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-slate-600">
            This page is built for planning direction and tradeoffs, not perfect prediction. It is
            most useful as a first-pass comparison before you plug in exact housing and household numbers.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {fromCity.name} vs {toCity.name} — common questions
          </h2>
          <dl className="mt-5 space-y-5 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-900">
                Is {toCity.name} cheaper than {fromCity.name}?
              </dt>
              <dd className="mt-1">
                It depends on your income, housing choice, and monthly cost structure. This page
                compares both cities using the same salary assumptions so you can see whether the
                destination actually improves affordability for your situation.
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-900">
                How does moving from {fromCity.name} to {toCity.name} affect taxes?
              </dt>
              <dd className="mt-1">
                {sameState
                  ? `Because both cities are in ${fromCity.state.toUpperCase()}, the state tax rate is broadly the same. The larger differences usually come from housing and local cost pressures.`
                  : `Because this move crosses state lines, state tax treatment can change your take-home pay. The calculator applies each state's tax rules so you can compare the net effect more realistically.`}
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-900">
                What salary do I need in {toCity.name} to match my lifestyle in {fromCity.name}?
              </dt>
              <dd className="mt-1">
                The comparable salary estimate is designed to show the gross income you may need in{" "}
                {toCity.name} to maintain a similar monthly budget after taxes, housing, and core cost
                differences are considered.
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-900">
                Why is housing such a big part of this comparison?
              </dt>
              <dd className="mt-1">
                Because housing is usually the biggest recurring expense in a move. In many cases, it
                matters more than the salary headline and can either reinforce or erase a tax advantage.
              </dd>
            </div>
          </dl>
        </section>

        {relatedComparisons.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Related city comparisons
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Explore nearby relocation paths from the same small set of flagship comparisons.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {relatedComparisons.map((x) => (
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
            <span>•</span>
            <Link href="/methodology" className="transition hover:text-slate-900">
              Methodology
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}