import { STATES, type StateCode } from "@/lib/states";
import { citiesForState } from "@/lib/cities";
import Link from "next/link";

function scoreState(code: StateCode) {
  const cities = citiesForState(code);

  if (!cities.length) return 0;

  const avgRent =
    cities.reduce((sum, c) => sum + (c.defaultRent ?? 0), 0) / cities.length;

  return avgRent;
}

export default function Page() {
  const ranked = STATES
    .map((s) => ({
      ...s,
      score: scoreState(s.code),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <h1 className="text-3xl font-semibold">
          Best States for FIRE
        </h1>

        <p className="text-slate-300">
          Lower housing costs and taxes can dramatically shorten the path to financial independence.
        </p>

        <div className="space-y-3">
          {ranked.map((state, i) => (
            <div
              key={state.code}
              className="rounded-xl border border-white/10 bg-white/5 p-4 flex justify-between"
            >
              <div>
                #{i + 1} {state.name}
              </div>

              <Link
                href={`/best-states-for-fire/${state.name.toLowerCase().replace(/\s/g, "-")}`}
                className="text-emerald-300"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}