"use client";

import { useEffect, useRef, useState } from "react";
import NumberField from "@/components/calculator-form/CalculatorImmediateNumberField";
import RetirementPlanError from "./RetirementPlanError";
import type { TimelineInput } from "@/lib/retirementPlan/timeline";
import type { searchMaxSustainableSpending } from "@/lib/retirementPlan/spendingSearch";
import type { SpendingSearchWorkerResponse } from "@/lib/retirementPlan/spendingSearch.worker";
import { spendingSearchRequest, type SpendingSearchDraft } from "@/lib/retirementPlan/spendingSearchDraft";

const control = "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const button = "rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-500 disabled:opacity-50";
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const DEFAULT_DRAFT: SpendingSearchDraft = { minSpending: "", maxSpending: "", resolution: "1000", successTarget: "90", paths: "200", seed: "42", volatility: {} };

/** Parent should key this component by every scenario draft and projection
 * revision, same as the simulation panel: unmount terminates work and drops
 * the result, including edits made while a search is already stale. */
export default function RetirementSpendingSearch({ investedAccounts, scenarioKey, buildInput }: {
  investedAccounts: { id: string; name: string }[]; scenarioKey: string; buildInput: () => TimelineInput;
}) {
  const [draft, setDraft] = useState<SpendingSearchDraft>(DEFAULT_DRAFT);
  const [confirmed, setConfirmed] = useState(false);
  const key = JSON.stringify([scenarioKey, draft, confirmed]);
  const workerRef = useRef<Worker | null>(null);
  const [job, setJob] = useState<{ key: string; completed: number; total: number } | null>(null);
  const [report, setReport] = useState<{ key: string; result: ReturnType<typeof searchMaxSustainableSpending> } | null>(null);
  const [error, setError] = useState("");
  const busy = job?.key === key;
  const stale = report?.key !== key;

  useEffect(() => () => { workerRef.current?.terminate(); workerRef.current = null; }, [key]);

  const edit = (patch: Partial<SpendingSearchDraft>) => { setDraft(previous => ({ ...previous, ...patch })); };
  const editVolatility = (accountId: string, value: string) => { setDraft(previous => ({ ...previous, volatility: { ...previous.volatility, [accountId]: value } })); };

  const cancel = () => {
    workerRef.current?.terminate(); workerRef.current = null; setJob(null);
    setError("Search cancelled. No result is shown.");
  };

  const run = () => {
    if (workerRef.current) return;
    try {
      const input = buildInput();
      const request = spendingSearchRequest(input, draft, confirmed);
      const worker = new Worker(new URL("../lib/retirementPlan/spendingSearch.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      setJob({ key, completed: 0, total: 0 });
      setError("");
      setReport(null);
      worker.onmessage = (event: MessageEvent<SpendingSearchWorkerResponse>) => {
        if (workerRef.current !== worker) return;
        const message = event.data;
        if (message.type === "progress") { setJob({ key, completed: message.completed, total: message.total }); return; }
        worker.terminate(); workerRef.current = null; setJob(null);
        if (message.type === "result") setReport({ key, result: message.result });
        else setError(message.message);
      };
      worker.onerror = () => {
        if (workerRef.current !== worker) return;
        worker.terminate(); workerRef.current = null; setJob(null);
        setError("Background search failed. Please retry.");
      };
      worker.postMessage({ input, request });
    } catch (cause) {
      workerRef.current?.terminate(); workerRef.current = null; setJob(null);
      setError(cause instanceof Error ? cause.message : "Spending search unavailable."); setReport(null);
    }
  };

  return <details className="min-w-0 space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-6 dark:border-slate-800">
    <summary className="cursor-pointer text-lg font-semibold">Find maximum sustainable spending</summary>
    <p className="text-sm text-slate-500">
      Tests annual spending amounts, in today’s dollars, against the household simulation between a minimum and maximum
      you choose, using the existing tax, RMD, withdrawal and IRMAA calculations. Every amount tested reuses the same
      seeded market paths, so only spending changes between runs. The result is the highest spending found within the
      tested range and resolution, not a guaranteed maximum.
    </p>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <NumberField id="spending-search-min" label="Minimum spending to test (USD)" value={draft.minSpending} onChange={v => edit({ minSpending: v })} min={0} max={1e12} step="any" className={control} />
      <NumberField id="spending-search-max" label="Maximum spending to test (USD)" value={draft.maxSpending} onChange={v => edit({ maxSpending: v })} min={0} max={1e12} step="any" className={control} />
      <NumberField id="spending-search-resolution" label="Resolution (USD)" value={draft.resolution} onChange={v => edit({ resolution: v })} min={1} max={1e9} step="1" className={control}
        helpText="The search stops once it has narrowed the answer to within this many dollars." />
      <NumberField id="spending-search-target" label="Success target (%)" value={draft.successTarget} onChange={v => edit({ successTarget: v })} min={1} max={100} step="any" className={control}
        helpText="Share of simulated paths that must fund every year’s spending, taxes and RMDs. Default 90%." />
    </div>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <NumberField id="spending-search-paths" label="Simulated paths" value={draft.paths} onChange={v => edit({ paths: v })} min={1} max={1000} step="1" className={control} />
      <NumberField id="spending-search-seed" label="Reproducible seed" value={draft.seed} onChange={v => edit({ seed: v })} min={0} max={4294967295} step="1" className={control} />
      {investedAccounts.map((a, index) => <NumberField key={a.id} id={`spending-search-volatility-${index}`} label={`${a.name} annual volatility (%)`}
        value={draft.volatility[a.id] ?? ""} onChange={v => editVolatility(a.id, v)} min={0} max={100} step="any" className={control} />)}
    </div>
    <p id="spending-search-assumptions" className="text-sm text-slate-600 dark:text-slate-400">
      Uses the same lognormal market model as the simulation panel above: one shared market shock per year across
      invested accounts, independent years, fixed cash and annuity returns. Manual conversions stay fixed on every
      candidate. Success rate is not proven monotonic in spending; the search assumes higher spending cannot help,
      and flags it if the tested points disagree. This is not a calibrated forecast or financial advice.
    </p>
    <label htmlFor="spending-search-confirm" className="flex items-start gap-2 text-sm">
      <input id="spending-search-confirm" type="checkbox" aria-describedby="spending-search-assumptions" checked={confirmed}
        onChange={e => setConfirmed(e.target.checked)} className="mt-1" />
      I understand these search assumptions.
    </label>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={run} disabled={busy} className={button}>Search</button>
      {busy && <button type="button" onClick={cancel} className={button}>Cancel search</button>}
    </div>
    {busy && <div className="space-y-2">
      <p role="status">{job.total > 0 ? `Testing spending levels: ${job.completed} of up to ${job.total} candidates.` : "Starting search…"} Inputs stay local.</p>
      <progress aria-label="Spending search progress" className="block w-full" max={Math.max(job.total, 1)} value={job.completed} />
    </div>}
    {job && job.key !== key && <p role="status">Inputs changed. The previous search was stopped; search again.</p>}
    {error && <RetirementPlanError message={error} />}
    {report && <div className="min-w-0 space-y-4">
      {stale && <p role="status">Inputs changed. Search again; these results use the previous settings.</p>}
      {report.result.found ? <>
        <p className="text-lg font-semibold">
          Highest spending found: {money(report.result.found.spending)}/yr ({(report.result.found.successRate * 100).toFixed(1)}% of paths funded).
        </p>
        <p className="text-sm text-slate-500">This is the highest spending level found within the tested range and resolution, not a guaranteed maximum.</p>
      </> : <p role="status" className="font-semibold">No spending level in the tested range met the target; even the minimum failed.</p>}
      <div className="max-w-full overflow-x-auto" role="region" aria-label="Tested spending levels" tabIndex={0}>
        <table className="w-full text-right text-sm">
          <caption className="sr-only">Every spending level tested, in the order tested</caption>
          <thead><tr>{["Tested spending", "Success rate"].map(t => <th key={t} scope="col" className="px-3 py-2">{t}</th>)}</tr></thead>
          <tbody>{report.result.tested.map((candidate, index) => <tr key={index}>
            <td className="whitespace-nowrap px-3 py-2">{money(candidate.spending)}</td>
            <td className="whitespace-nowrap px-3 py-2">{(candidate.successRate * 100).toFixed(1)}%</td>
          </tr>)}</tbody>
        </table>
      </div>
      <details><summary className="cursor-pointer">Search limitations</summary>
        <ul className="list-disc space-y-2 pl-5 text-sm">{report.result.warnings.map(w => <li key={w}>{w}</li>)}</ul>
      </details>
    </div>}
  </details>;
}
