"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import NumberField from "./calculator-form/CalculatorImmediateNumberField";
import type { TimelineInput } from "@/lib/retirementPlan/timeline";
import type { simulateHousehold } from "@/lib/retirementPlan/monteCarlo";
import type { SimulationResponse } from "@/lib/retirementPlan/simulation.worker";
import { simulationRequest } from "@/lib/retirementPlan/simulationDraft";

const control = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-900";
const button = "rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:opacity-50";
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** Parent keys this component by every scenario draft and projection revision.
 * Unmount terminates work and drops results, including edits while already dirty. */
export default function RetirementSimulation({ children, getInput, investedAccounts }: {
  children: ReactNode; getInput: () => TimelineInput; investedAccounts: { id: string; name: string }[];
}) {
  const [view, setView] = useState<"average" | "range">("average");
  const [paths, setPaths] = useState("200"), [seed, setSeed] = useState("42");
  const [volatility, setVolatility] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof simulateHousehold> | null>(null);
  const [progress, setProgress] = useState<number | null>(null), [message, setMessage] = useState("");
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => { worker.current?.terminate(); worker.current = null; }, []);
  const clear = () => { worker.current?.terminate(); worker.current = null; setProgress(null); setResult(null); setMessage(""); };
  const run = () => {
    clear();
    try {
      const input = getInput();
      const request = simulationRequest(input, paths, seed, volatility, confirmed);
      const active = new Worker(new URL("../lib/retirementPlan/simulation.worker.ts", import.meta.url), { type: "module" });
      worker.current = active;
      setProgress(0);
      active.onmessage = (event: MessageEvent<SimulationResponse>) => {
        if (worker.current !== active) return;
        const response = event.data;
        if (response.type === "progress") setProgress(response.completed);
        else {
          active.terminate(); worker.current = null; setProgress(null);
          if (response.type === "result") setResult(response.result);
          else setMessage(response.message);
        }
      };
      active.onerror = () => {
        if (worker.current !== active) return;
        clear(); setMessage("The simulation worker could not complete. Retry or check your scenario.");
      };
      active.postMessage({ input, request });
    } catch (error) { clear(); setMessage(error instanceof Error ? error.message : "Check the simulation inputs."); }
  };
  return <section className="min-w-0 space-y-4" aria-label="Projection outcomes">
    <div className="flex flex-wrap gap-2" role="group" aria-label="Outcome view">
      <button type="button" className={button} aria-pressed={view === "average"} onClick={() => { clear(); setView("average"); }}>Average</button>
      <button type="button" className={button} aria-pressed={view === "range"} onClick={() => setView("range")}>Range of outcomes</button>
    </div>
    {view === "average" ? <><p className="text-sm text-slate-500">Fixed-return projection, not the average of simulated paths.</p>{children}</> : <div className="min-w-0 space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:p-6">
      <h2 className="text-lg font-semibold">Simulated household outcomes</h2>
      <p className="text-sm">Each path uses the current household inputs and manual conversion schedule. The separate bracket-strategy comparison is not applied. The summary, annual table and CSV/PDF exports elsewhere on this page remain the fixed-return projection.</p>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <NumberField id="simulation-paths" label="Simulated paths" value={paths} onChange={v => { clear(); setPaths(v); }} min={1} max={1000} step="1" className={control} />
        <NumberField id="simulation-seed" label="Reproducible seed" value={seed} onChange={v => { clear(); setSeed(v); }} min={0} max={4294967295} step="1" className={control} />
        {investedAccounts.map((a, index) => <NumberField key={a.id} id={`simulation-volatility-${index}`} label={`${a.name} annual volatility (%)`} value={volatility[a.id] ?? ""}
          onChange={v => { clear(); setVolatility(old => ({ ...old, [a.id]: v })); }} min={0} max={100} step="any" className={control} />)}
      </div>
      <p id="simulation-assumptions" className="text-sm text-slate-600 dark:text-slate-400">Volatility is the standard deviation of annual nominal returns; enter 13 for 13%. Expected returns come from the account inputs. Cash and annuity returns stay fixed. Invested accounts share one market shock per year; years are independent. This lognormal model does not capture every market risk. Manual conversions stay fixed, and unsupported path errors stop the whole run. Simulation frequency is not a guarantee or a calibrated forecast probability.</p>
      <label htmlFor="simulation-confirm" className="flex items-start gap-2 text-sm"><input id="simulation-confirm" type="checkbox" aria-describedby="simulation-assumptions" checked={confirmed} onChange={e => { clear(); setConfirmed(e.target.checked); }} className="mt-1" />I understand these simulation assumptions.</label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} disabled={progress !== null} onClick={run}>Run simulation</button>
        {progress !== null && <button type="button" className={button} onClick={() => { clear(); setMessage("Simulation cancelled. No partial result is shown."); }}>Cancel simulation</button>}
      </div>
      {progress !== null && <div role="status">Simulating {progress} of {paths} paths…<progress aria-label="Simulation progress" className="block w-full" value={progress} max={Number(paths)} /></div>}
      {message && <p role="alert">{message}</p>}
      {result && <>
        <p role="status" className="text-lg font-semibold">{(result.successRate * 100).toFixed(1)}% of paths funded every year ({result.successfulPaths} of {result.paths}).</p>
        <p className="text-sm">Spending, taxes and RMDs must be satisfied in every year. Seed: {result.seed}. All paths, including failed paths, remain in the ranges below.</p>
        <div className="h-[280px] w-full min-w-0" aria-label="Nominal balance percentiles">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={result.byYear} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
            <XAxis dataKey="year" /><YAxis width={65} tickFormatter={v => `$${Math.round(Number(v) / 1000)}k`} />
            <Tooltip formatter={(v: number) => money(Number(v))} />
            <Line dataKey="nominal.p10" name="10th percentile" stroke="#0284c7" dot={false} isAnimationActive={false} />
            <Line dataKey="nominal.p50" name="Median" stroke="#059669" dot={false} isAnimationActive={false} />
            <Line dataKey="nominal.p90" name="90th percentile" stroke="#9333ea" dot={false} isAnimationActive={false} />
          </LineChart></ResponsiveContainer>
        </div>
        <p className="text-sm">Nominal USD: 10th percentile (blue), median (green), 90th percentile (purple). Annual percentiles are cross-sectional summaries, not a single investable path.</p>
        <div className="max-w-full overflow-x-auto" role="region" aria-label="Simulation balance ranges" tabIndex={0}>
          <table className="w-full text-right text-sm"><caption>Ending balances in nominal USD</caption><thead><tr>{["Year", "10th percentile", "Median", "90th percentile"].map(t => <th key={t} scope="col" className="px-3 py-2">{t}</th>)}</tr></thead>
            <tbody>{result.byYear.map(row => <tr key={row.year}><th scope="row" className="px-3 py-2">{row.year}</th>{[row.nominal.p10, row.nominal.p50, row.nominal.p90].map((v, i) => <td key={i} className="whitespace-nowrap px-3 py-2">{money(v)}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <details><summary>Simulation limitations</summary><ul className="list-disc space-y-2 pl-5 text-sm">{result.warnings.map(w => <li key={w}>{w}</li>)}</ul></details>
      </>}
    </div>}
  </section>;
}
