"use client";
import { useState } from "react";
import NumberField from "@/components/calculator-form/CalculatorImmediateNumberField";
import { terminalValuation } from "@/lib/retirementPlan/terminalValuation";
import type { runRetirementTimeline } from "@/lib/retirementPlan/timeline";
type Projection=ReturnType<typeof runRetirementTimeline>;
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);
export default function RetirementTerminalComparison({baseline,result}:{baseline:Projection;result:Projection}) {
  const [rate,setRate]=useState("");
  let message="", valuations:null|{before:ReturnType<typeof terminalValuation>;after:ReturnType<typeof terminalValuation>}=null;
  if(rate.trim()) try {valuations={before:terminalValuation(baseline,rate),after:terminalValuation(result,rate)};} catch(error) {message=error instanceof Error?error.message:"Valuation unavailable.";}
  return <section className="min-w-0 space-y-3" aria-labelledby="terminal-heading">
    <h3 id="terminal-heading" className="font-semibold">Tax-adjusted ending-value estimate</h3>
    <NumberField id="terminal-rate" label="Assumed effective tax rate on future pretax withdrawals (%)" value={rate} onChange={setRate} min={0} max={100} step="any" wrapperClassName="min-w-0" className="w-full min-w-0 rounded-xl border p-3 dark:bg-slate-900" helpText="Explicit combined federal/state assumption, not today's marginal bracket. The same rate applies to both scenarios." />
    <p className="text-sm text-slate-500">Remaining untaxed balances only; taxes and IRMAA already paid are not deducted again. Nominal horizon values, not a liquidation tax bill or recommendation. Post-horizon Medicare costs and estate/inheritance taxes are excluded. No optimizer or ranking is performed.</p>
    {!rate.trim() && <p>Enter a rate to view the estimate; no rate is assumed.</p>}
    {message && <p role="status">{message}</p>}
    {valuations && <><p>Without conversions: <strong>{money(valuations.before.adjusted)}</strong>. With conversions: <strong>{money(valuations.after.adjusted)}</strong>. Difference: {money(valuations.after.adjusted-valuations.before.adjusted)}.</p>
      <p className="text-sm">Assumed remaining tax: {money(valuations.before.assumedTax)} without / {money(valuations.after.assumedTax)} with conversions.</p>
      {(!baseline.allYearsFunded||!result.allYearsFunded)&&<p role="status">At least one scenario fails to fund every year. These values must not be used to rank feasible strategies.</p>}
      <p className="text-sm">Sensitivity (difference, with minus without): {[Math.max(0,Number(rate)-5),Math.min(100,Number(rate)+5)].map(r=><span key={r}> at {r}%: {money(terminalValuation(result,String(r)).adjusted-terminalValuation(baseline,String(r)).adjusted)}; </span>)}</p>
    </>}
  </section>;
}
