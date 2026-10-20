"use client";

import { useMemo, useState } from "react";
import { GridTable, level, num, orNA, toneStyles, usd } from "@/components/reportParts";

export type FireCityRow = {
  id: string;
  name: string;
  stateCode: string;
  rent: number | null;
  priceLevel: number | null;
  netMigration: number;
  /** Per filing status, then per salary (as a string key): take-home a month and state plus city income tax a year. */
  byFiling: Record<"single" | "married", Record<string, { monthlyNet: number; stateTax: number }>>;
};

/** The ranking table with a salary and filing-status choice. The server renders the default (single, headline salary), so the page is complete without scripts. */
export default function FireCitiesTable({ cities, salaries, defaultSalary, migrationYear }: { cities: FireCityRow[]; salaries: number[]; defaultSalary: number; migrationYear: string }) {
  const t = toneStyles("dark");
  const [salary, setSalary] = useState(defaultSalary);
  const [filing, setFiling] = useState<"single" | "married">("single");

  const ranked = useMemo(() => cities.map((c) => {
    const at = c.byFiling[filing][String(salary)];
    return { c, monthlyNet: at.monthlyNet, stateTax: at.stateTax, afterRent: c.rent === null ? null : at.monthlyNet - c.rent };
  }).sort((a, b) => (b.afterRent ?? -Infinity) - (a.afterRent ?? -Infinity)), [cities, salary, filing]);

  const who = filing === "single" ? "single filer" : "married couple filing jointly (one earner)";
  const button = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition ${active ? "bg-emerald-500 text-white" : "text-slate-300 hover:bg-white/10"}`;

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span>Salary</span>
          <div className="inline-flex flex-wrap rounded-lg border border-white/10 bg-white/5 p-0.5" role="group" aria-label="Salary">
            {salaries.map((s) => (
              <button key={s} type="button" aria-pressed={salary === s} onClick={() => setSalary(s)} className={button(salary === s)}>{usd(s)}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span>Filing</span>
          <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5" role="group" aria-label="Filing status">
            <button type="button" aria-pressed={filing === "single"} onClick={() => setFiling("single")} className={button(filing === "single")}>Single</button>
            <button type="button" aria-pressed={filing === "married"} onClick={() => setFiling("married")} className={button(filing === "married")}>Married</button>
          </div>
        </div>
      </div>
      <p className={`mt-3 text-sm leading-6 ${t.body}`}>
        One {who} on {usd(salary)} a year in each city, after 2026 federal, state, local and payroll tax and the typical Census rent. Open a city for the full numbers.
      </p>
      <GridTable
        tone="dark"
        columns={["City", "Take-home a month", "Typical rent", "Left after rent", "Price level", `State and city tax on ${usd(salary)}`, `State net migration (${migrationYear})`]}
        rows={ranked.map((x, i) => [
          `${i + 1}. ${x.c.name}, ${x.c.stateCode.toUpperCase()}`,
          usd(x.monthlyNet),
          orNA(x.c.rent),
          orNA(x.afterRent),
          level(x.c.priceLevel),
          x.stateTax === 0 ? "None" : usd(x.stateTax),
          `${x.c.netMigration >= 0 ? "+" : ""}${num(x.c.netMigration)}`,
        ])}
        minWidth="52rem"
      />
    </>
  );
}
