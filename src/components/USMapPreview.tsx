"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography } from "@vnedyalk0v/react19-simple-maps";
import usStates from "@/data/us-states.json";
import { STATES, type StateCode } from "@/lib/states";
import { estimateNetBreakdown, type FilingStatus } from "@/lib/tax";

const SALARIES = [75000, 100000, 150000, 250000];
const NO_DATA = "#182235";

function money(n: number, digits = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits });
}

const NAME_TO_CODE = new Map<string, StateCode>(STATES.map((s) => [s.name, s.code]));
const CODE_TO_NAME = new Map<StateCode, string>(STATES.map((s) => [s.code, s.name]));

type StateStat = { code: StateCode; name: string; stateTax: number; effRate: number; takeHome: number };

export default function USMapPreview() {
  const router = useRouter();
  const [salary, setSalary] = useState(100000);
  const [filing, setFiling] = useState<FilingStatus>("single");
  const [hovered, setHovered] = useState<StateCode | null>(null);

  const { byCode, maxRate, lowest, highest } = useMemo(() => {
    const byCode = new Map<StateCode, StateStat>();
    for (const s of STATES) {
      const b = estimateNetBreakdown({ grossAnnual: salary, state: s.code, filing, k401Pct: 0 });
      const effRate = salary > 0 ? b.state / salary : 0;
      byCode.set(s.code, { code: s.code, name: s.name, stateTax: b.state, effRate, takeHome: salary - b.totalTax });
    }
    const all = [...byCode.values()];
    const maxRate = Math.max(0.0001, ...all.map((s) => s.effRate));
    const sorted = [...all].sort((a, b) => a.effRate - b.effRate);
    return { byCode, maxRate, lowest: sorted.slice(0, 5), highest: sorted.slice(-5).reverse() };
  }, [salary, filing]);

  function colorFor(code: StateCode | undefined) {
    if (!code) return NO_DATA;
    const stat = byCode.get(code);
    if (!stat) return NO_DATA;
    const t = Math.max(0, Math.min(1, stat.effRate / maxRate));
    // Single-hue blue sequential: pale (low tax) -> deep navy (high tax).
    const light = 88 - 56 * t;
    const sat = 55 + 12 * t;
    return `hsl(212, ${sat}%, ${light}%)`;
  }

  const hoveredStat = hovered ? byCode.get(hovered) : null;
  const openPaycheck = (code: StateCode) => router.push(`/paycheck-calculator?salary=${salary}&state=${code}`);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Take-home pay by state</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              State income tax on a {money(salary)} {filing === "married" ? "married" : "single"}-filer salary, computed live for all 50 states. Deeper blue means more tax; click a state to open it in the paycheck calculator.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
              {SALARIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSalary(s)}
                  className={`px-3.5 py-2 text-sm font-medium transition ${salary === s ? "bg-emerald-400 text-slate-950" : "text-slate-300 hover:bg-white/[0.08]"}`}
                >
                  ${s / 1000}k
                </button>
              ))}
            </div>
            <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
              {(["single", "married"] as FilingStatus[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiling(f)}
                  className={`px-3.5 py-2 text-sm font-medium capitalize transition ${filing === f ? "bg-emerald-400 text-slate-950" : "text-slate-300 hover:bg-white/[0.08]"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
              <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl">
                <ComposableMap projection="geoAlbersUsa" projectionConfig={{ scale: 1000 }} width={980} height={560} className="h-auto w-full">
                  <Geographies geography={usStates as unknown as object}>
                    {({ geographies }: { geographies: Array<{ rsmKey: string; id: string | number; properties?: { name?: string } }> }) =>
                      geographies.map((geo, index) => {
                        const name = String(geo.properties?.name ?? "");
                        const code = NAME_TO_CODE.get(name);
                        const isHovered = code != null && hovered === code;
                        return (
                          <Geography
                            key={`${geo.rsmKey}-${index}`}
                            geography={geo}
                            onMouseEnter={() => code && setHovered(code)}
                            onMouseLeave={() => setHovered(null)}
                            onFocus={() => code && setHovered(code)}
                            onBlur={() => setHovered(null)}
                            onClick={() => code && openPaycheck(code)}
                            tabIndex={code ? 0 : -1}
                            aria-label={code ? `${name} state income tax` : name}
                            style={{
                              default: { fill: colorFor(code), stroke: "#0f172a", strokeWidth: isHovered ? 1.6 : 0.6, outline: "none", cursor: code ? "pointer" : "default" },
                              hover: { fill: colorFor(code), stroke: "#f8fafc", strokeWidth: 1.6, outline: "none", cursor: code ? "pointer" : "default", opacity: 0.92 },
                              pressed: { fill: colorFor(code), stroke: "#f8fafc", strokeWidth: 1.6, outline: "none" },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ComposableMap>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                  <span>Less tax</span>
                  <span className="h-2.5 flex-1 rounded-full" style={{ background: "linear-gradient(90deg, hsl(212,55%,88%), hsl(212,61%,60%), hsl(212,67%,32%))" }} />
                  <span>More tax</span>
                  <span className="ml-2 text-slate-500">up to {(maxRate * 100).toFixed(1)}%</span>
                </div>

                {/* Hover detail */}
                <div className="mt-4 min-h-[104px] rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  {hoveredStat ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="text-base font-semibold text-white">{hoveredStat.name}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          State income tax: <span className="font-semibold text-white">{money(hoveredStat.stateTax)}</span> ({(hoveredStat.effRate * 100).toFixed(2)}% of salary) · take-home after all taxes: <span className="font-semibold text-white">{money(hoveredStat.takeHome)}</span>
                        </p>
                      </div>
                      <Link
                        href={`/paycheck-calculator?salary=${salary}&state=${hoveredStat.code}`}
                        className="inline-flex flex-shrink-0 items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
                      >
                        Open in paycheck calculator →
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <div className="text-base font-semibold text-white">Hover a state</div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        See its state income tax and take-home on a {money(salary)} salary. The nine palest states have no state income tax.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <h3 className="text-lg font-semibold text-white">Lowest state income tax</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">On a {money(salary)} {filing} salary.</p>
            <div className="mt-4 space-y-2">
              {lowest.map((s) => (
                <button key={s.code} type="button" onClick={() => openPaycheck(s.code)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left transition hover:border-sky-300/40 hover:bg-white/[0.06]">
                  <span className="font-medium text-white">{s.name}</span>
                  <span className="text-sm font-semibold text-sky-300">{s.stateTax <= 0.5 ? "No income tax" : `${money(s.stateTax)} · ${(s.effRate * 100).toFixed(1)}%`}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <h3 className="text-lg font-semibold text-white">Highest state income tax</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">On a {money(salary)} {filing} salary.</p>
            <div className="mt-4 space-y-2">
              {highest.map((s) => (
                <button key={s.code} type="button" onClick={() => openPaycheck(s.code)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left transition hover:border-rose-300/40 hover:bg-white/[0.06]">
                  <span className="font-medium text-white">{s.name}</span>
                  <span className="text-sm font-semibold text-rose-300">{money(s.stateTax)} · {(s.effRate * 100).toFixed(1)}%</span>
                </button>
              ))}
            </div>
          </div>

          <p className="px-1 text-xs leading-5 text-slate-500">
            Estimates use 2025 state income tax and the standard deduction, single or married filing jointly. They don&apos;t include local city taxes, credits, or deductions. Not tax advice.
          </p>
        </div>
      </div>
    </section>
  );
}
