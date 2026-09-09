"use client";
import {useEffect,useRef,useState} from "react";
import RetirementPlanError from "./RetirementPlanError";
import NumberField from "@/components/calculator-form/CalculatorImmediateNumberField";
import type {evaluateBracketStrategies} from "@/lib/retirementPlan/bracketStrategies";
import type {StrategyWorkerResponse} from "@/lib/retirementPlan/strategy.worker";
import {strategyCsvRows,type StrategyExportSnapshot} from "@/lib/retirementPlan/strategyCsv";
import {downloadCsv} from "@/lib/csvExport";
import type {TimelineInput} from "@/lib/retirementPlan/timeline";
import type {AccountEditorState} from "@/lib/retirementPlan/previewAccounts";
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);
const name=(target:number)=>target?`Fill to ${target}%`:"No conversions";
export default function RetirementStrategyComparison({accounts,married,scenarioKey,buildInput}:{accounts:AccountEditorState;married:boolean;scenarioKey:string;buildInput:()=>TimelineInput}){
  const [draft,setDraft]=useState({ownerId:"one",sourceId:"",destinationId:"",terminalRate:"",start:"",end:"",custom:false});
  const [report,setReport]=useState<{key:string;result:ReturnType<typeof evaluateBracketStrategies>;snapshot:StrategyExportSnapshot}|null>(null);
  const [error,setError]=useState("");
  const key=JSON.stringify([scenarioKey,draft]);
  const workerRef=useRef<Worker|null>(null);
  const [job,setJob]=useState<{key:string;completed:number}|null>(null);
  const busy=job?.key===key;
  useEffect(()=>()=>{workerRef.current?.terminate();workerRef.current=null;},[key]);
  const cancel=()=>{workerRef.current?.terminate();workerRef.current=null;setJob(null);setError("Comparison cancelled. No schedule was applied.");};
  const stale=report?.key!==key;
  const control="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
  const select=(field:"ownerId"|"sourceId"|"destinationId",label:string,options:[string,string][])=> <div className="min-w-0"><label htmlFor={`strategy-${field}`} className="mb-1 block text-sm">{label}</label><select id={`strategy-${field}`} className={control} value={draft[field]} onChange={e=>setDraft({...draft,[field]:e.target.value})}><option value="">Choose…</option>{options.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div>;
  const run=()=>{try{
    if(workerRef.current)return;
    if(draft.custom&&(!draft.start.trim()||!draft.end.trim()))throw new RangeError("Enter both conversion-window years.");
    const input=buildInput();
    const request={ownerId:draft.ownerId,sourceId:draft.sourceId,destinationId:draft.destinationId,terminalRate:draft.terminalRate,window:draft.custom?{start:Number(draft.start),end:Number(draft.end)}:undefined};
    const worker=new Worker(new URL("../lib/retirementPlan/strategy.worker.ts",import.meta.url),{type:"module"});
    workerRef.current=worker;setJob({key,completed:0});setError("");setReport(null);
    worker.onmessage=(event:MessageEvent<StrategyWorkerResponse>)=>{
      if(workerRef.current!==worker)return;
      const message=event.data;
      if(message.type==="progress"){setJob({key,completed:message.completed});return;}
      worker.terminate();workerRef.current=null;setJob(null);
      if(message.type==="result")setReport({key,result:message.result,snapshot:{input,request,completedAt:new Date().toISOString()}});else setError(message.message);
    };
    worker.onerror=()=>{if(workerRef.current!==worker)return;worker.terminate();workerRef.current=null;setJob(null);setError("Background comparison failed. Please retry.");};
    worker.postMessage({input,request});
  }catch(cause){workerRef.current?.terminate();workerRef.current=null;setJob(null);setError(cause instanceof Error?cause.message:"Strategy comparison unavailable.");setReport(null);}};
  return <details className="min-w-0 space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-6 dark:border-slate-800">
    <summary className="cursor-pointer text-lg font-semibold">Compare bracket strategies</summary>
    <p className="text-sm text-slate-500">Separate from manual conversions. Tests no conversions and fills to the 12%, 22% and 24% brackets; never applies a schedule. Supports retirement/cash accounts and wages, pensions and Social Security without active contributions. Uses the household and Medicare settings above. Calculation may take several seconds.</p>
    {select("ownerId","Strategy owner",married?[["one","Person 1"],["two","Person 2"]]:[["one","Person 1"]])}
    {select("sourceId","Strategy source traditional IRA",accounts.accounts.filter(a=>a.ownerId===draft.ownerId&&a.kind==="traditional-ira").map(a=>[a.id,a.name]))}
    {select("destinationId","Strategy destination Roth IRA",accounts.accounts.filter(a=>a.ownerId===draft.ownerId&&a.kind==="roth-ira").map(a=>[a.id,a.name]))}
    <p className="text-sm text-slate-500">Choices use each account’s type and owner, not its nickname. Traditional and Roth 401(k)s are not eligible here.</p>
    {(!accounts.accounts.some(a=>a.ownerId===draft.ownerId&&a.kind==="traditional-ira")||!accounts.accounts.some(a=>a.ownerId===draft.ownerId&&a.kind==="roth-ira"))&&<p role="status" className="text-sm text-amber-700 dark:text-amber-300">Missing an eligible account? <a className="underline" href="#account-new-type">Choose Traditional IRA or Roth IRA under New account type, then click Add account.</a> Both must belong to the strategy owner.</p>}
    <NumberField id="strategy-rate" label="Strategy future withdrawal tax rate (%)" value={draft.terminalRate} onChange={v=>setDraft({...draft,terminalRate:v})} min={0} max={100} step="any" className={control} wrapperClassName="min-w-0" helpText="Explicit combined federal/state assumption, identical for all candidates. No rate is assumed." />
    <label htmlFor="strategy-custom" className="flex items-start gap-2"><input id="strategy-custom" type="checkbox" checked={draft.custom} onChange={e=>setDraft({...draft,custom:e.target.checked})}/>Use a custom conversion window</label>
    <p className="text-sm text-slate-500">Default: first full retired year for both people through the year before either person’s statutory RMD year, within the projection horizon. January 1 retirement includes that year.</p>
    {draft.custom&&<div className="grid min-w-0 gap-3 sm:grid-cols-2">{([['start','Strategy first year'],['end','Strategy last year']] as const).map(([field,label])=><NumberField key={field} id={`strategy-${field}`} label={label} value={draft[field]} onChange={v=>setDraft({...draft,[field]:v})} min={2026} max={2126} step="1" className={control} wrapperClassName="min-w-0" />)}</div>}
    <button type="button" onClick={run} disabled={busy} className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">Compare four strategies</button>
    {busy&&<div className="space-y-2"><p role="status">Evaluating strategies: {job.completed} of 4 complete. Inputs stay local.</p><progress aria-label="Strategy comparison progress" max={4} value={job.completed}/><button type="button" onClick={cancel} className="ml-3 rounded-xl border px-4 py-2">Cancel comparison</button></div>}
    {job&&job.key!==key&&<p role="status">Inputs changed. The previous run was stopped; compare again.</p>}
    {error&&<RetirementPlanError message={error}/>}
    {report&&<div className="min-w-0 space-y-4">
      <button type="button" disabled={stale||busy} onClick={()=>{if(!stale&&!busy)downloadCsv("retirement-strategy-comparison.csv",strategyCsvRows(report.result,report.snapshot));}} className="rounded-xl border px-4 py-2 disabled:opacity-50">Download strategy comparison CSV</button>
      <p className="text-sm text-slate-500">The CSV contains financial assumptions from this completed run. Generated locally; store and share it carefully. Compare again after changes to enable export.</p>
      {stale?<p role="status">Inputs changed. Compare again; these results use the previous settings.</p>:<p className="font-semibold">{report.result.bestTarget===null?"No eligible strategy to rank.":`${report.result.label}: ${name(report.result.bestTarget)}`}</p>}
      <p>Evaluated window: {report.result.window?`${report.result.window.start}–${report.result.window.end}`:"No default gap exists"}.</p>
      {report.result.candidates.map(candidate=><details key={candidate.target} open className="min-w-0 rounded-xl border p-3">
        <summary className="cursor-pointer font-semibold">{name(candidate.target)} — {candidate.status}</summary>
        {candidate.reason?<p role="status">{candidate.reason}</p>:<>
          <p>Tax-adjusted ending value: {money(candidate.valuation!.adjusted)}. Assumed remaining tax: {money(candidate.valuation!.assumedTax)}.</p>
          <p>Total estimated taxes: {money(candidate.projection!.years.reduce((s,y)=>s+y.result.tax.total,0))}. IRMAA: {money(candidate.projection!.years.reduce((s,y)=>s+y.irmaaSurcharges,0))}. RMDs: {money(candidate.projection!.years.reduce((s,y)=>s+y.result.cash.requiredWithdrawals,0))}.</p>
          <p>Sensitivity: {candidate.sensitivity.map(s=>`${s.rate}% → ${money(s.value)}`).join("; ")}. Same cash-flow projection, revalued only.</p>
        </>}
        {candidate.annual.length>0&&<div className="max-w-full overflow-x-auto" role="region" aria-label={`${name(candidate.target)} annual schedule`} tabIndex={0}><table className="w-full text-left text-sm"><caption className="sr-only">{name(candidate.target)} annual conversion schedule{candidate.status==="rejected"?" — incomplete, not applicable":""}</caption><thead><tr>{["Year","Conversion","Bracket ceiling","Settled ordinary taxable income"].map(t=><th scope="col" className="p-2" key={t}>{t}</th>)}</tr></thead><tbody>{candidate.annual.map(y=><tr key={y.year}><th scope="row" className="p-2">{y.year}</th>{[y.amount,y.ceiling,y.ordinaryTaxable].map((v,i)=><td key={i} className="whitespace-nowrap p-2">{money(v)}</td>)}</tr>)}</tbody></table></div>}
      </details>)}
      <p className="text-sm text-slate-500">Not a global optimum or recommendation. Rankings depend on the terminal tax assumption. Nonqualified Roth and unsupported terminal values cannot be ranked. IRMAA is included with the two-year lookback when enabled; post-horizon Medicare and estate/inheritance taxes are excluded. No additional deduction of taxes already paid.</p>
      {report.result.warnings.map(w=><p key={w} className="text-sm text-slate-500">{w}</p>)}
    </div>}
  </details>;
}
