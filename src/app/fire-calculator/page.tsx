import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";

export const metadata: Metadata = {
  title: "FIRE Calculator – How Much Do You Need to Retire Early?",
  description:
    "Estimate your FIRE number, years to financial independence, and projected FIRE age with this FIRE calculator.",
};

export default function FireCalculatorPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            FIRE Calculator
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            How many years until financial independence?
          </h1>

          <p className="max-w-2xl text-sm text-slate-300">
            Set your income, expenses, and investing pace to estimate your FIRE number,
            years to FI, and your projected FI year.
          </p>

         <div className="flex flex-wrap gap-2 pt-2">

  <a
    href="/lean-fire-calculator"
    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
  >
    Lean FIRE
  </a>

  <a
    href="/barista-fire-calculator"
    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
  >
    Barista FIRE
  </a>

  <a
    href="/coast-fire-calculator"
    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
  >
    Coast FIRE
  </a>

  <a
    href="/"
    className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
  >
    Compare Cities →
  </a>

</div>
        </header>

        <FireCalculator />
      </div>
    </main>
  );
}