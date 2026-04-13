import type { Metadata } from "next";
import Calculator from "@/components/Calculator";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import { STATES } from "@/lib/states";
import Link from "next/link";

type Props = {
  params: Promise<{ state: string }>;
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
  return STATES.map((s) => ({ state: s.code }));
}

export default async function MoveToStatePage({ params }: Props) {
  const { state } = await params;

  if (!state) notFound();

  const stateCode = state.toLowerCase();
  const matchedState = STATES.find((s) => s.code === stateCode);

  if (!matchedState) notFound();

  const noIncomeTaxStates = ["ak", "fl", "nv", "nh", "sd", "tn", "tx", "wa", "wy"];
  const hasNoIncomeTax = noIncomeTaxStates.includes(stateCode);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8 sm:px-6">

        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Moving to {matchedState.name}
          </h1>

          <p className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
            Compare Take-Home Pay, Taxes &amp; Cost of Living Before You Relocate
          </p>

          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            {hasNoIncomeTax ? (
              <>
                {matchedState.name} has no state income tax, which means more of
                your paycheck stays in your pocket compared to high-tax states.
                Use the calculator below to compare your current take-home pay
                against what you would keep after moving to {matchedState.name}.
              </>
            ) : (
              <>
                Before moving to {matchedState.name}, it helps to understand how
                state income taxes, housing costs, and everyday expenses will
                affect your monthly budget. Use the calculator below to compare
                your current take-home pay against what you would net in{" "}
                {matchedState.name}.
              </>
            )}
          </p>

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

        <Calculator initialToState={matchedState.code} monetization="state" />

        {/* What to know before moving */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            What to know before moving to {matchedState.name}
          </h2>
          <div className="space-y-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <p>
              State income tax is one of the biggest financial differences between
              states.{" "}
              {hasNoIncomeTax ? (
                <>
                  {matchedState.name} is one of nine states with no state income
                  tax, which can meaningfully increase your take-home pay compared
                  to states like California, New York, or Oregon.
                </>
              ) : (
                <>
                  {matchedState.name} levies state income tax on earned income,
                  which reduces your take-home pay. The exact impact depends on
                  your income level and filing status.
                </>
              )}
            </p>
            <p>
              Beyond taxes, housing costs vary significantly by city within{" "}
              {matchedState.name}. The calculator above applies city-level cost
              defaults where available so you can compare your current budget
              against a realistic estimate for your destination.
            </p>
            <p>
              These estimates are for planning purposes. Real costs vary by
              neighborhood, employer, and personal circumstances. Always verify
              tax and housing figures with current local data before making a
              decision.
            </p>
          </div>
        </section>

        {/* FAQ */}
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
                It depends on your income, where you are moving from, and which
                city you are targeting.{" "}
                {hasNoIncomeTax
                  ? `${matchedState.name}'s lack of state income tax is a significant financial advantage for most earners. `
                  : ""}
                Use the calculator above to compare your current city against a
                destination in {matchedState.name} side by side.
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
                    Yes. {matchedState.name} is one of nine US states that
                    currently levy no personal state income tax. You still pay
                    federal income tax and FICA, but there is no additional state
                    tax on earned wages.
                  </>
                ) : (
                  <>
                    {matchedState.name} has a state income tax that applies to
                    wages and salary. The rate and structure varies by income
                    level and filing status. The calculator applies a simplified
                    state tax model to estimate your take-home pay for planning
                    purposes.
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900 dark:text-white">
                How do I compare my current salary to what I would need in{" "}
                {matchedState.name}?
              </dt>
              <dd className="mt-1">
                Enter your current state and income on the left side of the
                calculator, then select {matchedState.name} on the right. The
                calculator will estimate your take-home pay in both locations and
                show the monthly budget difference after housing and living costs.
              </dd>
            </div>
          </dl>
        </section>

        <footer className="pt-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <a href="/about" className="transition hover:text-slate-900 dark:hover:text-white">About</a>
            <span>•</span>
            <a href="/disclaimer" className="transition hover:text-slate-900 dark:hover:text-white">Disclaimer</a>
            <span>•</span>
            <a href="/privacy" className="transition hover:text-slate-900 dark:hover:text-white">Privacy</a>
            <span>•</span>
            <a href="/terms" className="transition hover:text-slate-900 dark:hover:text-white">Terms</a>
          </div>
        </footer>

      </div>
    </main>
  );
}
