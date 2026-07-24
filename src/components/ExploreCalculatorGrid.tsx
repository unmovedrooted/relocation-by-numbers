"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Category = "Relocation" | "Housing" | "Taxes" | "FIRE" | "Retirement" | "International";
type Calc = { href: string; title: string; desc: string; cat: Category; isNew?: boolean };

const CAT_COLOR: Record<Category, string> = {
  Relocation: "#34d399",
  Housing: "#f59e0b",
  Taxes: "#22d3ee",
  FIRE: "#a78bfa",
  Retirement: "#60a5fa",
  International: "#fb7185",
};

const CALCULATORS: Calc[] = [
  // Relocation
  { href: "/", title: "US Relocation & Take-Home Calculator", desc: "Compare take-home pay, taxes, and living costs for a move between US cities.", cat: "Relocation" },
  { href: "/compare-cities", title: "Compare Cities Side by Side", desc: "One income, up to 3 destinations: net pay, taxes, housing, and flexibility.", cat: "Relocation" },
  { href: "/compare", title: "City Pair Comparisons", desc: "Ready-made two-city comparisons of pay, taxes, and monthly budget.", cat: "Relocation" },
  { href: "/one-income-relocation-calculator", title: "One vs Two Income Relocation", desc: "Can you afford the move on one income? Housing burden, taxes, and the second income needed.", cat: "Relocation" },
  // Housing
  { href: "/mortgage-calculator", title: "Mortgage Calculator", desc: "Monthly payment, cash to close, DTI, rent-vs-buy break-even, and amortization.", cat: "Housing" },
  { href: "/rent-vs-buy-calculator", title: "Rent vs. Buy Calculator", desc: "Compare buying vs. renting-and-investing by net worth, with a break-even year.", cat: "Housing", isNew: true },
  { href: "/housing-affordability-calculator", title: "Housing Affordability", desc: "How much rent or house can you afford? 30% rent rule and 28/36 DTI guidelines.", cat: "Housing" },
  // Taxes
  { href: "/paycheck-calculator", title: "Paycheck Calculator", desc: "Take-home pay after federal, Social Security, Medicare, and state (and city) taxes.", cat: "Taxes", isNew: true },
  { href: "/income-tax-calculator", title: "Income Tax Calculator", desc: "Federal tax, effective and marginal rates, and a bracket-by-bracket breakdown.", cat: "Taxes", isNew: true },
  // FIRE
  { href: "/fire-calculator", title: "FIRE Calculator", desc: "Estimate your FIRE age and financial-independence number.", cat: "FIRE" },
  { href: "/fire-number-calculator", title: "FIRE Number Calculator", desc: "The portfolio you need to retire early, from your spending and withdrawal rate.", cat: "FIRE" },
  { href: "/lean-fire-calculator", title: "Lean FIRE Calculator", desc: "Retire early on a smaller budget and a lower target portfolio.", cat: "FIRE" },
  { href: "/barista-fire-calculator", title: "Barista FIRE Calculator", desc: "Semi-retire with part-time income covering part of your spending.", cat: "FIRE" },
  { href: "/coast-fire-calculator", title: "Coast FIRE Calculator", desc: "The amount that grows into your FIRE number with no further contributions.", cat: "FIRE" },
  { href: "/chubby-fire-calculator", title: "Chubby FIRE Calculator", desc: "A comfortable early retirement (roughly $100k–$150k/yr).", cat: "FIRE", isNew: true },
  { href: "/fat-fire-calculator", title: "Fat FIRE Calculator", desc: "Retire early with a luxury budget ($200k+/yr).", cat: "FIRE", isNew: true },
  { href: "/savings-rate-for-fire", title: "Savings Rate for FIRE", desc: "How your savings rate maps to years until financial independence.", cat: "FIRE" },
  // Retirement
  { href: "/retirement-calculator", title: "Retirement Calculator", desc: "Project your savings with a live balance chart and a Monte Carlo range.", cat: "Retirement", isNew: true },
  { href: "/401k-calculator", title: "401(k) Calculator", desc: "Employer match, this year's tax savings, and projected balance with 2025 limits.", cat: "Retirement", isNew: true },
  { href: "/hsa-calculator", title: "HSA Calculator", desc: "2025 limits, real federal + FICA + state tax savings, and tax-free growth.", cat: "Retirement", isNew: true },
  { href: "/retirement-withdrawal-calculator", title: "Retirement Withdrawal", desc: "How long will your money last, or your safe withdrawal, with sequence-of-returns risk.", cat: "Retirement", isNew: true },
  { href: "/rmd-calculator", title: "RMD Calculator", desc: "Your required minimum distribution from the IRS Uniform Lifetime Table.", cat: "Retirement", isNew: true },
  { href: "/roth-conversion-calculator", title: "Roth Conversion Calculator", desc: "Convert now or pay tax later? Tax due, both paths, and break-even rate.", cat: "Retirement", isNew: true },
  { href: "/investment-calculator", title: "Investment Calculator", desc: "Compound growth from a lump sum plus contributions, with a Monte Carlo range.", cat: "Retirement", isNew: true },
  // International
  { href: "/international-relocation", title: "International Relocation", desc: "Compare taxes, rent, and living costs across countries.", cat: "International" },
  { href: "/europe-relocation-calculator", title: "Europe Relocation", desc: "Compare Lisbon, Porto, London, and more.", cat: "International" },
  { href: "/asia-relocation-calculator", title: "Asia Relocation", desc: "Compare Bangkok, Tokyo, Singapore, Dubai, and more.", cat: "International" },
  { href: "/caribbean-relocation-calculator", title: "Caribbean Relocation", desc: "Compare Jamaica, Barbados, Cayman Islands, and more.", cat: "International" },
  { href: "/south-america-relocation-calculator", title: "South America Relocation", desc: "Compare Medellín, Bogotá, Buenos Aires, Santiago, and more.", cat: "International" },
];

const CATEGORIES: (Category | "All")[] = ["All", "Relocation", "Housing", "Taxes", "FIRE", "Retirement", "International"];

export default function ExploreCalculatorGrid() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    return CALCULATORS.filter(
      (c) =>
        (cat === "All" || c.cat === cat) &&
        (!s || c.title.toLowerCase().includes(s) || c.desc.toLowerCase().includes(s) || c.cat.toLowerCase().includes(s)),
    );
  }, [query, cat]);

  return (
    <section id="calculators" aria-labelledby="all-calcs-heading" className="scroll-mt-24 space-y-5">
      <div className="flex flex-col gap-2">
        <h2 id="all-calcs-heading" className="text-2xl font-semibold tracking-tight text-white">
          Find your calculator
        </h2>
        <p className="text-sm leading-6 text-slate-300">
          {CALCULATORS.length} free calculators, no sign-up. Search or filter by category.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
            <path d="m14 14 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search calculators (e.g. roth, paycheck, mortgage)…"
            aria-label="Search calculators"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-300/40 focus:bg-white/[0.06] focus:ring-4 focus:ring-emerald-400/10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = cat === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                }`}
              >
                {c !== "All" && <span className="inline-block h-2 w-2 rounded-full" style={{ background: CAT_COLOR[c] }} />}
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-400">
          No calculators match “{query}”. Try another term or clear the filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/40 hover:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="mt-0.5 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: CAT_COLOR[c.cat] }} />
                  <span className="text-base font-semibold text-white transition group-hover:text-emerald-200">{c.title}</span>
                </div>
                {c.isNew && (
                  <span className="flex-shrink-0 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/30">
                    New
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{c.desc}</p>
              <span className="mt-auto pt-3 text-xs font-medium text-slate-500">{c.cat}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
