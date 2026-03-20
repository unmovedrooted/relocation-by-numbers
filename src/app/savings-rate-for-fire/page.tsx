import type { Metadata } from "next";
import Link from "next/link";
import FireCalculator from "@/components/FireCalculator";

export const metadata: Metadata = {
  title: "Savings Rate for FIRE | How Much Should You Save?",
  description:
    "Estimate how your savings rate affects your timeline to financial independence.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <h1 className="text-3xl font-semibold lg:whitespace-nowrap">
          What Savings Rate Do You Need for FIRE?
        </h1>

        <p className="max-w-4xl text-slate-300 lg:whitespace-nowrap">
          Your savings rate is the most powerful factor in reaching financial
          independence. Higher savings rates dramatically shorten the time to
          FIRE.
        </p>

        <div className="text-xs text-slate-400">
          Assumptions updated: March 2026
        </div>

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