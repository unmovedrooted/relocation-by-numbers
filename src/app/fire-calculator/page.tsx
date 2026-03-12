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

 <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
  See how taxes, expenses, and moving cities change your FIRE date
</h1>

<p className="mt-3 max-w-4xl text-base leading-7 text-slate-300 sm:text-lg">
  Compare how location changes your FIRE timeline.
</p>
<div className="mt-6 max-w-4xl">
  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
    How it works
  </h2>

  <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
    Your FIRE number is based on a simple idea: <strong>how much you spend each year, divided by your withdrawal rate</strong>. But that target is not fixed—it changes with your location.
  </p>

  <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
    Your <strong>state shapes your taxes</strong>. Your <strong>city shapes your spending</strong>. Together, they shape <strong>how quickly you can build wealth</strong>.
  </p>

  <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
    This calculator estimates <strong>after-tax income by state</strong>, accounts for <strong>inflation and salary growth</strong>, and lets you compare your <strong>FIRE timeline across cities</strong>. The <strong>Move Impact</strong> section highlights how relocating could move your FIRE date closer.
  </p>
</div>

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