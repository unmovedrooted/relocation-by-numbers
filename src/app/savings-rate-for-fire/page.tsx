import type { Metadata } from "next";
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
        <h1 className="text-3xl font-semibold">
          What Savings Rate Do You Need for FIRE?
        </h1>

        <p className="text-slate-300 max-w-2xl">
          Your savings rate is the most powerful factor in reaching financial
          independence. Higher savings rates dramatically shorten the time to
          FIRE.
        </p>

        <FireCalculator />
      </div>
    </main>
  );
}