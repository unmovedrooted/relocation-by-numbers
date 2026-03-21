import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";

export const metadata: Metadata = {
  title: "How Much Do I Need to Retire? | Retirement Calculator",
  description:
    "Estimate how much money you need to retire based on your expenses, investment returns, and savings rate.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <h1 className="text-3xl font-semibold lg:whitespace-nowrap">
          How Much Do I Need to Retire?
        </h1>

       <p className="text-slate-300 max-w-2xl">
          The amount you need to retire depends on your yearly spending,
          investment returns, and withdrawal rate. A common guideline is the
          <span className="text-white font-semibold"> 4% rule</span>, which suggests
          you need roughly
          <span className="text-white font-semibold"> 25× your yearly expenses</span>.
        </p>

        <div className="text-xs text-slate-400">
          Assumptions updated: March 2026
        </div>

        <Link
  href="/explore"
  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
>
  Explore All Tools
</Link>

        <FireCalculator />

        <footer className="pt-2">
          <div className="mb-3 text-xs text-slate-400">
            Assumptions updated: March 2026
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <Link href="/about" className="transition hover:text-white">
              About
            </Link>
            <span>•</span>
            <Link href="/disclaimer" className="transition hover:text-white">
              Disclaimer
            </Link>
            <span>•</span>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}