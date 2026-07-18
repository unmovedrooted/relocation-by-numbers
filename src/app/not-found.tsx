import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found | Relocation by Numbers",
  description: "The page you are looking for does not exist. Explore relocation calculators, FIRE tools, and cost of living guides.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="mx-auto max-w-xl text-center space-y-8">

        {/* 404 number */}
        <div className="text-[8rem] font-bold leading-none tracking-tight text-white/5 select-none">
          404
        </div>

        {/* Badge */}
        <div className="-mt-16 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
          Page not found
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          This page doesn't exist
        </h1>

        {/* Body */}
        <p className="text-sm leading-7 text-slate-400">
          The page you're looking for may have moved or the URL may be incorrect.
          Use the links below to find what you need.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/explore"
            className="inline-flex items-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
          >
            Explore all tools →
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Relocation calculator
          </Link>
        </div>

        {/* Quick links */}
        <div className="border-t border-white/10 pt-6">
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Popular pages
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { href: "/fire-calculator", label: "FIRE Calculator" },
              { href: "/compare/nyc-ny/charlotte-nc", label: "NYC vs Charlotte" },
              { href: "/best-cities-for-fire", label: "Best Cities for FIRE" },
              { href: "/international-relocation", label: "International Calculator" },
              { href: "/best-states-for-fire", label: "Best States for FIRE" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
