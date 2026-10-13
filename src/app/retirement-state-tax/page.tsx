import type { Metadata } from "next";
import RetirementStateTaxView from "@/components/RetirementStateTaxView";
import CalculatorSources from "@/components/CalculatorSources";

export const metadata: Metadata = {
  title: "Retirement Tax by State | Social Security, Pensions and 401(k) Withdrawals",
  description:
    "See how each state's income tax treats Social Security, a pension and 401(k) or IRA withdrawals, and compare the state you retire in with the one you are moving to.",
  alternates: { canonical: "https://www.relocationbynumbers.com/retirement-state-tax" },
};

export default function RetirementStateTaxPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          How each state taxes your retirement income
        </h1>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Assumptions updated: October 2026</p>
        <p className="mt-4 text-base leading-7 text-slate-700 dark:text-slate-300">
          Moving can change the tax on Social Security, a pension and 401(k) or IRA withdrawals as much as it changes your rent.
          Enter a year of retirement income to see the state income tax in the state you retire from, the one you retire to, and every
          other state.
        </p>
      </header>
      <RetirementStateTaxView />
      <CalculatorSources path="/retirement-state-tax" />
    </main>
  );
}
