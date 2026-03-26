import type { Metadata } from "next";
import InternationalRelocationCalculator from "@/components/InternationalRelocationCalculator";

export const metadata: Metadata = {
  title: "International Relocation Cost Calculator",
  description:
    "Compare salary, taxes, rent, startup costs, and how much cash you may need before moving abroad.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f3f4f6] text-[#0f172a]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <InternationalRelocationCalculator />
      </div>
    </main>
  );
}