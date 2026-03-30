"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "@vnedyalk0v/react19-simple-maps";
import usStates from "@/data/us-states.json";

type FeaturedState = {
  id: string;
  name: string;
  href: string;
  notes: {
    fire: string;
    affordability: string;
    taxes: string;
    cost: string;
  };
};

type FilterKey = "fire" | "affordability" | "taxes" | "cost";

const allStatesById: Record<string, FeaturedState> = {
  "06": {
    id: "06",
    name: "California",
    href: "/best-states-for-fire/california",
    notes: {
      fire: "Explore a high-cost, high-income state with major FIRE tradeoffs.",
      affordability: "California is less affordability-driven, but useful as a comparison baseline.",
      taxes: "California stands out more for high-tax comparison than low-tax appeal.",
      cost: "A strong benchmark for high housing and higher overall living costs.",
    },
  },
  "08": {
    id: "08",
    name: "Colorado",
    href: "/best-states-for-fire/colorado",
    notes: {
      fire: "Colorado blends lifestyle appeal with solid long-term FIRE interest.",
      affordability: "Colorado is more balanced than cheap, with some cities still under pressure.",
      taxes: "Colorado can be useful in tax comparisons without being a no-tax state.",
      cost: "A good middle-ground state when comparing cost pressure and quality of life.",
    },
  },
  "12": {
    id: "12",
    name: "Florida",
    href: "/best-states-for-fire/florida",
    notes: {
      fire: "Florida remains a major retirement and FIRE destination.",
      affordability: "Some areas are rising in cost, but the state remains important in relocation planning.",
      taxes: "Florida is a major no-state-income-tax destination.",
      cost: "Florida offers mixed cost-of-living outcomes depending on metro and housing trends.",
    },
  },
  "13": {
    id: "13",
    name: "Georgia",
    href: "/best-states-for-fire/georgia",
    notes: {
      fire: "Georgia is a strong Southeast option for FIRE-focused movers.",
      affordability: "Georgia stands out for relatively accessible living costs in key metros.",
      taxes: "Georgia is more moderate on taxes than headline low-tax states.",
      cost: "Useful for comparing Southeast city costs against larger coastal metros.",
    },
  },
  "36": {
    id: "36",
    name: "New York",
    href: "/best-states-for-fire/new-york",
    notes: {
      fire: "New York is a strong high-cost benchmark for relocation and FIRE tradeoff analysis.",
      affordability: "New York is typically a baseline for higher cost pressure.",
      taxes: "New York is better used as a higher-tax comparison state.",
      cost: "A strong benchmark for expensive housing, taxes, and living costs.",
    },
  },
  "37": {
    id: "37",
    name: "North Carolina",
    href: "/best-states-for-fire/north-carolina",
    notes: {
      fire: "North Carolina stands out for affordability, taxes, and FIRE-focused movers.",
      affordability: "One of the strongest affordability-oriented relocation targets on the site.",
      taxes: "North Carolina is often attractive for moderate tax comparisons.",
      cost: "A strong cost-of-living option compared with many larger coastal markets.",
    },
  },
  "48": {
    id: "48",
    name: "Texas",
    href: "/best-states-for-fire/texas",
    notes: {
      fire: "Texas is one of the most popular relocation targets for higher earners and FIRE planners.",
      affordability: "Texas remains a major affordability and income-tradeoff destination.",
      taxes: "Texas stands out for no state income tax.",
      cost: "Texas often compares well on cost versus income, depending on city and property taxes.",
    },
  },
  "53": {
    id: "53",
    name: "Washington",
    href: "/best-states-for-fire/washington",
    notes: {
      fire: "Washington is important for high-salary FIRE planning and relocation tradeoffs.",
      affordability: "Washington is less affordability-led, but still useful in west coast comparisons.",
      taxes: "Washington stands out for no state income tax.",
      cost: "Washington offers a strong high-income versus high-cost comparison dynamic.",
    },
  },
};

const filterConfig: Record<
  FilterKey,
  {
    label: string;
    helperTitle: string;
    helperBody: string;
    stateIds: string[];
  }
> = {
  fire: {
    label: "FIRE",
    helperTitle: "Viewing: FIRE",
    helperBody:
      "Highlighted states currently stand out for FIRE-focused relocation, retirement flexibility, or long-term financial independence planning.",
    stateIds: ["37", "48", "12", "13", "08", "53"],
  },
  affordability: {
    label: "Affordability",
    helperTitle: "Viewing: Affordability",
    helperBody:
      "Highlighted states currently stand out for relative affordability, lower living costs, or better income-to-expense tradeoffs.",
    stateIds: ["37", "48", "13", "12", "08"],
  },
  taxes: {
    label: "Taxes",
    helperTitle: "Viewing: Taxes",
    helperBody:
      "Highlighted states currently stand out for lower state tax burden or no state income tax.",
    stateIds: ["48", "12", "53", "37"],
  },
  cost: {
    label: "Cost of Living",
    helperTitle: "Viewing: Cost of Living",
    helperBody:
      "Highlighted states currently stand out in cost-of-living comparisons, whether as lower-cost destinations or important high-cost benchmarks.",
    stateIds: ["37", "48", "13", "12", "06", "36"],
  },
};

const featuredCities = [
  { name: "Charlotte", href: "/cost-of-living/charlotte-nc" },
  { name: "Raleigh", href: "/fire-in/raleigh-nc" },
  { name: "Austin", href: "/fire-in/austin-tx" },
  { name: "Denver", href: "/fire-in/denver-co" },
];

export default function USMapPreview() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("fire");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeConfig = filterConfig[activeFilter];
  const activeStateIds = new Set(activeConfig.stateIds);

  const visibleStates = useMemo(
    () =>
      activeConfig.stateIds
        .map((id) => allStatesById[id])
        .filter(Boolean),
    [activeConfig.stateIds]
  );

  const hoveredState = useMemo(() => {
    if (!hoveredId) return null;
    return allStatesById[hoveredId] ?? null;
  }, [hoveredId]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Explore by Map
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Switch views to explore featured states by FIRE potential,
              affordability, taxes, and cost-of-living tradeoffs.
            </p>
          </div>

          {/* Filter pills */}
          <div className="mt-5 flex flex-wrap gap-3">
            {(Object.keys(filterConfig) as FilterKey[]).map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setActiveFilter(filter);
                    setHoveredId(null);
                  }}
                  className={[
                    "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-200"
                      : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]",
                  ].join(" ")}
                >
                  {filterConfig[filter].label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium text-slate-300">
                Explore featured states on the map
              </div>
              <div className="text-xs text-slate-500">
                {filterConfig[activeFilter].label} view
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
              <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl">
                <ComposableMap
                  projection="geoAlbersUsa"
                  projectionConfig={{ scale: 1000 }}
                  width={980}
                  height={600}
                  className="h-auto w-full"
                >
                  <Geographies geography={usStates as any}>
  {({ geographies }) =>
    geographies.map((geo, index) => {
      const stateId = String(geo.id).padStart(2, "0");
      const stateName = String(geo.properties?.name ?? "");
      const state = allStatesById[stateId];
      const isHighlighted = activeStateIds.has(stateId);
      const isHovered = hoveredId === stateId;

      return (
        <Geography
          key={`${geo.rsmKey}-${stateId}-${index}`}
          geography={geo}
          onMouseEnter={() => setHoveredId(stateId)}
          onMouseLeave={() => setHoveredId(null)}
          onFocus={() => setHoveredId(stateId)}
          onBlur={() => setHoveredId(null)}
          onClick={() => {
            if (state && isHighlighted) router.push(state.href);
          }}
          tabIndex={0}
          style={{
            default: {
              fill: isHighlighted ? "#10b981" : "#182235",
              stroke: isHighlighted ? "#d1fae5" : "#334155",
              strokeWidth: isHovered ? 1.5 : 0.8,
              outline: "none",
              cursor: state && isHighlighted ? "pointer" : "default",
              opacity: isHighlighted ? 1 : 0.9,
            },
            hover: {
              fill: isHighlighted ? "#2dd4bf" : "#22304a",
              stroke: isHighlighted ? "#f0fdf4" : "#475569",
              strokeWidth: isHighlighted ? 1.8 : 1,
              outline: "none",
              cursor: state && isHighlighted ? "pointer" : "default",
              opacity: 1,
            },
            pressed: {
              fill: isHighlighted ? "#6ee7b7" : "#22304a",
              stroke: isHighlighted ? "#f0fdf4" : "#475569",
              strokeWidth: 1.8,
              outline: "none",
            },
          }}
          aria-label={state ? `Explore ${state.name}` : stateName || "State"}
        />
      );
    })
  }
</Geographies>
                </ComposableMap>

                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Highlighted in this view
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                    Not highlighted in this view
                  </div>
                </div>

                <div className="mt-4 min-h-[120px] rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  {hoveredState && activeStateIds.has(hoveredState.id) ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-white">
                            {hoveredState.name}
                          </div>
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                            {filterConfig[activeFilter].label}
                          </span>
                        </div>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                          {hoveredState.notes[activeFilter]}
                        </p>
                      </div>

                      <Link
                        href={hoveredState.href}
                        className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/20"
                      >
                        Explore {hoveredState.name} →
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <div className="text-base font-semibold text-white">
                        {activeConfig.helperTitle}
                      </div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        {activeConfig.helperBody}
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
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">
                Featured States
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                States currently highlighted in the selected map view.
              </p>
            </div>

            <div className="space-y-3">
              {visibleStates.map((state) => (
                <Link
                  key={state.href}
                  href={state.href}
                  className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-300/40 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-white">{state.name}</div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                      {filterConfig[activeFilter].label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {state.notes[activeFilter]}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">
                Featured Cities
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Quick-entry city pages for cost of living and FIRE planning.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {featuredCities.map((city) => (
                <Link
                  key={city.href}
                  href={city.href}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-300/40 hover:bg-white/[0.07]"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-lg font-semibold text-white">
              Explore everything
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Browse calculators, city guides, comparisons, and FIRE tools from
              the main hub.
            </p>
            <Link
              href="/explore"
              className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
            >
              Open Explore Hub →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}