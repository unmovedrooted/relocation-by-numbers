import type { Metadata } from "next";
import MyScenarios from "@/components/MyScenarios";

// A personal page: what it shows lives in the visitor's own browser, so there is nothing for search engines to index.
export const metadata: Metadata = {
  title: "My Scenarios",
  description: "Scenarios you saved in this browser, with a side-by-side comparison.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://www.relocationbynumbers.com/my-scenarios" },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 text-slate-900 dark:text-slate-100">
      <h1 className="text-3xl font-bold tracking-tight">My scenarios</h1>
      <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
        Scenarios you saved from the calculators, and a side-by-side view of any two or three of them.
      </p>
      <MyScenarios />
    </main>
  );
}
