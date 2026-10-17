import Link from "next/link";
import { MODE_NOTES, type FireModeKey } from "@/lib/fireModes";

export type FirePage = "fire" | "lean" | "barista" | "coast" | "chubby" | "fat";

const PAGES: { id: FirePage; label: string; href: string }[] = [
  { id: "fire", label: "FIRE", href: "/fire-calculator" },
  { id: "lean", label: "Lean FIRE", href: "/lean-fire-calculator" },
  { id: "barista", label: "Barista FIRE", href: "/barista-fire-calculator" },
  { id: "coast", label: "Coast FIRE", href: "/coast-fire-calculator" },
  { id: "chubby", label: "Chubby FIRE", href: "/chubby-fire-calculator" },
  { id: "fat", label: "Fat FIRE", href: "/fat-fire-calculator" },
];

const pill = "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10";

/**
 * The same row of links on every FIRE calculator page: the methodology link, the other FIRE calculators and Compare Cities,
 * with the one-line note for the page's calculator below. `current` hides the page's own link.
 */
export default function FireHeaderLinks({ current, mode = "standard" }: { current?: FirePage; mode?: FireModeKey }) {
  return (
    <div className="space-y-2 pt-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/methodology"
          className="text-sm font-medium text-emerald-200 underline decoration-emerald-300/40 underline-offset-4 transition hover:text-emerald-100"
        >
          See methodology and data sources
        </Link>
        <div className="flex flex-wrap gap-2">
          {PAGES.filter((p) => p.id !== current).map((p) => (
            <Link key={p.id} href={p.href} className={pill}>{p.label}</Link>
          ))}
          <Link
            href="/compare"
            className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
          >
            Compare Cities →
          </Link>
        </div>
      </div>
      <p className="max-w-3xl text-xs leading-5 text-slate-400">{MODE_NOTES[mode]}</p>
    </div>
  );
}
