import type { Metadata } from "next";
import FireCalculator from "@/components/FireCalculator";

<div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
    <a href="/about" className="transition hover:text-white">
      About
    </a>
    <span>•</span>
    <a href="/disclaimer" className="transition hover:text-white">
      Disclaimer
    </a>
    <span>•</span>
    <a href="/privacy" className="transition hover:text-white">
      Privacy
    </a>
    <span>•</span>
    <a href="/terms" className="transition hover:text-white">
      Terms
    </a>
  </div>

export const metadata: Metadata = {
  title: "How Much Do I Need to Retire? | Retirement Calculator",
  description:
    "Estimate how much money you need to retire based on your expenses, investment returns, and savings rate.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <h1 className="text-3xl font-semibold">
          How Much Do I Need to Retire?
        </h1>

        <p className="text-slate-300 max-w-2xl">
          The amount you need to retire depends on your yearly spending,
          investment returns, and withdrawal rate. A common guideline is the
          <span className="text-white font-semibold"> 4% rule</span>, which suggests
          you need roughly
          <span className="text-white font-semibold"> 25× your yearly expenses</span>.
        </p>

        <FireCalculator />
      </div>
    </main>
  );
}