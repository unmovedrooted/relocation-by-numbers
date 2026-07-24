// app/waitlist/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist | Personalized FIRE Roadmap, Relocation by Numbers",
  description:
    "Get early access to personalized FIRE withdrawal strategies, account order, Roth conversions, tax bracket management, and ACA planning built from your exact numbers.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/waitlist",
  },
};

export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-xl">

        {/* ── Back nav ───────────────────────────────────────────────────── */}
        <Link
          href="/fire-calculator"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Relocation by Numbers
        </Link>

        {/* ── Headline ───────────────────────────────────────────────────── */}
        <div className="mt-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-400">
            Coming soon
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Personalized FIRE roadmap
          </h1>
          <p className="mt-4 text-lg leading-7 text-slate-300">
            A withdrawal strategy built from your exact numbers, not generic advice.
          </p>
        </div>

        {/* ── What you get ───────────────────────────────────────────────── */}
        <div className="mt-10 space-y-4">
          {[
            {
              title: "Withdrawal order",
              body: "Which accounts to draw from first, and why, based on your specific mix of traditional, Roth, and taxable accounts.",
            },
            {
              title: "Roth conversion strategy",
              body: "How much to convert each year, which tax brackets to target, and the optimal window before RMDs begin at 73.",
            },
            {
              title: "Tax bracket management",
              body: "How to blend account types to minimize lifetime tax on your retirement spending.",
            },
            {
              title: "ACA healthcare bridge",
              body: "How to manage MAGI to maximize ACA subsidies for the years between retirement and Medicare at 65.",
            },
            {
              title: "Sequence of returns protection",
              body: "A specific first-5-years strategy to survive a down market early in retirement without derailing the plan.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
            >
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>

        {/* ── Email capture ──────────────────────────────────────────────── */}
        <div className="mt-10 rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-6">
          <p className="text-base font-semibold text-white">Get early access</p>
          <p className="mt-1 text-sm text-slate-400">
            We'll email you when it's ready. No spam, one email when it launches.
          </p>
          <div className="mt-4">
            <WaitlistForm />
          </div>
        </div>

        {/* ── Footer note ────────────────────────────────────────────────── */}
        <p className="mt-8 text-center text-xs text-slate-500">
          Planning estimates only. Not tax, legal, or financial advice.
        </p>

      </div>
    </main>
  );
}