import type { Metadata } from "next";
import Calculator from "@/components/Calculator";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import { STATES, type StateCode } from "@/lib/states";
import Link from "next/link";
import { ALLOWED_STATE_CODES } from "@/lib/seo-allowlists";

type Props = {
  params: Promise<{ state: string }>;
};

const NO_INCOME_TAX_STATES: StateCode[] = [
  "ak",
  "fl",
  "nv",
  "nh",
  "sd",
  "tn",
  "tx",
  "wa",
  "wy",
];


const STATE_CONTENT: Record<
  string,
  {
    primary: string;
    secondary: string;
    caution: string;
  }
> = {
  tx: {
    primary:
      "Texas is one of the most common relocation targets because it has no state income tax, which can improve take-home pay for many earners.",
    secondary:
      "The real question is whether the tax advantage is enough to offset housing costs, property taxes, insurance, and the specific city you plan to move to.",
    caution:
      "Texas is not automatically cheap. The move only helps if the full income-to-cost ratio improves.",
  },
  fl: {
    primary:
      "Florida attracts many movers because it has no state income tax, which can increase take-home pay compared with higher-tax states.",
    secondary:
      "That said, affordability still depends heavily on which part of Florida you are moving to and how much housing costs absorb the tax benefit.",
    caution:
      "Do not assume no state income tax automatically means low cost of living.",
  },
  tn: {
    primary:
      "Tennessee is often appealing because it combines no personal state income tax with a cost structure that can be easier to manage than many coastal states.",
    secondary:
      "For many households, that creates a better relocation math story than higher-tax, higher-housing-cost states.",
    caution:
      "The benefit still depends on the city, your salary, and your actual housing costs after the move.",
  },
  nc: {
    primary:
      "North Carolina often stands out because several of its major metros can offer a better balance between income potential and housing costs than many more expensive states.",
    secondary:
      "This is usually less about tax savings and more about a stronger overall affordability profile.",
    caution:
      "A move only helps if your housing and monthly cost structure genuinely improve relative to where you live now.",
  },
  ga: {
    primary:
      "Georgia can be attractive for relocation when you want a major metro economy without the same cost burden as higher-priced coastal states.",
    secondary:
      "Its relocation value is usually tied more to practical cost management than to tax advantage alone.",
    caution:
      "Affordability varies sharply by city and commuting pattern.",
  },
  nv: {
    primary:
      "Nevada is attractive to many movers because it has no personal state income tax, which can reduce tax drag during your working years.",
    secondary:
      "That can improve your monthly budget, but only if housing and local costs do not erase the gain.",
    caution:
      "A no-tax state can still be expensive in practice depending on the city and your lifestyle.",
  },
  wa: {
    primary:
      "Washington has no personal state income tax, which can improve take-home pay, especially for higher earners.",
    secondary:
      "But the state can still be expensive in key metros, so the relocation math depends heavily on your destination city and housing burden.",
    caution:
      "Tax savings do not automatically outweigh high housing costs.",
  },
  az: {
    primary:
      "Arizona is often considered by movers coming from higher-cost Western states because it may offer a more manageable cost structure while still supporting metro living.",
    secondary:
      "Its value usually comes from the balance between cost reduction and maintaining access to jobs and city amenities.",
    caution:
      "The move only improves affordability if your destination city actually lowers your ongoing costs.",
  },
  co: {
    primary:
      "Colorado can still work well for relocation, but it is generally not a pure cost-reduction move compared with cheaper alternatives.",
    secondary:
      "Its appeal is often more about lifestyle fit and income opportunity than about dramatically lowering expenses.",
    caution:
      "If your main goal is aggressive cost reduction, Colorado may not change the math enough.",
  },
  ny: {
    primary:
      "New York is usually a harder state from a relocation-affordability standpoint because state tax and housing costs can both weigh heavily on take-home pay.",
    secondary:
      "For many users, New York is more useful as a comparison baseline than as a lower-cost destination.",
    caution:
      "A high salary in New York can still feel tight after taxes and housing are accounted for.",
  },
  ca: {
    primary:
      "California is one of the hardest states to make affordable because housing costs and state tax burden can both be substantial.",
    secondary:
      "The state can still work for high earners, but the cost structure is usually much less forgiving than lower-cost alternatives.",
    caution:
      "Do not assume a high salary automatically means the move is financially strong.",
  },
  ma: {
    primary:
      "Massachusetts can support strong incomes, but housing costs and tax drag still make relocation decisions here more demanding than in cheaper states.",
    secondary:
      "It is usually a better comparison state than a pure cost-cutting destination.",
    caution:
      "The state works best when income is strong enough to keep the monthly budget flexible after housing costs.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const matchedState = STATES.find((s) => s.code === state.toLowerCase());

  if (!matchedState) return { title: "State not found" };

  const title = `Moving to ${matchedState.name} | Cost, Taxes & Salary Calculator`;
  const description = `Thinking about moving to ${matchedState.name}? Compare take-home pay, state income taxes, housing costs, and affordability before you relocate. See how far your salary goes in ${matchedState.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/move-to/${state.toLowerCase()}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.relocationbynumbers.com/move-to/${state.toLowerCase()}`,
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

export function generateStaticParams() {
  return ALLOWED_STATE_CODES.map((state) => ({ state }));
}

export default async function MoveToStatePage({ params }: Props) {
  const { state } = await params;

  if (!state) notFound();

  const stateCode = state.toLowerCase() as StateCode;
  const matchedState = STATES.find((s) => s.code === stateCode);

  if (!matchedState || !ALLOWED_STATE_CODES.includes(stateCode)) notFound();

  const hasNoIncomeTax = NO_INCOME_TAX_STATES.includes(stateCode);
  const stateContent = STATE_CONTENT[stateCode];

  if (!stateContent) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10 sm:px-6">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Moving to {matchedState.name}
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
            Compare Take-Home Pay, Taxes &amp; Cost of Living Before You Relocate
          </p>

          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            {hasNoIncomeTax ? (
              <>
                {matchedState.name} has no state income tax, which can increase
                take-home pay compared with higher-tax states. The bigger question
                is whether the full move improves your monthly budget after housing
                and local living costs are included.
              </>
            ) : (
              <>
                Before moving to {matchedState.name}, it helps to understand how
                state income tax, housing costs, and everyday expenses will affect
                your monthly budget. The relocation math is not just about salary.
              </>
            )}
          </p>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Assumptions updated: March 2026
          </div>

          <div className="pt-1">
            <Link
              href="/methodology"
              className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:no-underline dark:text-slate-300"
            >
              See methodology
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Compare all states →
            </Link>
            <Link
              href="/fire-calculator"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              FIRE Calculator
            </Link>
            <Link
              href="/explore"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Explore all tools
            </Link>
          </div>
        </header>

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <Calculator initialToState={matchedState.code} monetization="state" />

        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <AdSlot
              slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID}
              className="min-h-[100px]"
            />
          </section>
        ) : null}

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            What to know before moving to {matchedState.name}
          </h2>
          <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <p>{stateContent.primary}</p>
            <p>{stateContent.secondary}</p>
            <p>{stateContent.caution}</p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Frequently asked questions about moving to {matchedState.name}
          </h2>
          <dl className="space-y-5 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is {matchedState.name} a good state to move to for affordability?
              </dt>
              <dd className="mt-1">
                It depends on your income, where you are moving from, and which city you are targeting.
                {hasNoIncomeTax
                  ? ` ${matchedState.name}'s lack of state income tax can be a real financial advantage, but only if local housing and living costs still work in your favor.`
                  : ` The answer depends on whether your income and destination city give you a better cost structure than your current location.`}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                {hasNoIncomeTax
                  ? `Does ${matchedState.name} really have no state income tax?`
                  : `How much is state income tax in ${matchedState.name}?`}
              </dt>
              <dd className="mt-1">
                {hasNoIncomeTax ? (
                  <>
                    Yes. {matchedState.name} is one of the states with no personal state income tax on earned wages.
                    You still pay federal income tax and FICA.
                  </>
                ) : (
                  <>
                    {matchedState.name} applies state income tax to wages and salary. The exact effect depends
                    on income and filing status, and this page uses a simplified model for planning comparisons.
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How do I compare my current salary to what I would need in {matchedState.name}?
              </dt>
              <dd className="mt-1">
                Enter your current state and income on one side of the calculator, then select {matchedState.name}
                as the destination. The tool estimates take-home pay and monthly budget differences after taxes and housing.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                Is moving to {matchedState.name} enough by itself to improve my finances?
              </dt>
              <dd className="mt-1">
                Not necessarily. A move helps only if the full income-to-cost ratio improves. Taxes matter, but housing,
                insurance, transportation, and city-level costs can matter just as much.
              </dd>
            </div>
          </dl>
        </section>

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Planning estimate only. Not tax, legal, or financial advice.
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/about" className="transition hover:text-slate-900 dark:hover:text-white">About</Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-slate-900 dark:hover:text-white">Disclaimer</Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-slate-900 dark:hover:text-white">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-slate-900 dark:hover:text-white">Terms</Link>
            <span>•</span>
            <Link href="/methodology" className="transition hover:text-slate-900 dark:hover:text-white">Methodology</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}