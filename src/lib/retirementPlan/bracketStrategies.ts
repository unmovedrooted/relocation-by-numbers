import {runRetirementTimeline,type TimelineInput} from "./timeline";
import {conversionBracketCeiling,validatedDate} from "./householdTax";
import {firstRmdYear} from "./rules";
import {terminalValuation} from "./terminalValuation";
type Schedule=NonNullable<TimelineInput["conversionsByYear"]>;
export type StrategyRequest={ownerId:string;sourceId:string;destinationId:string;window?:{start:number;end:number};terminalRate:string};
export function defaultConversionWindow(input:TimelineInput) {
  const start=Math.max(input.startYear,...input.people.map(p=>{
    const date=validatedDate(input.retirementDates[p.id]);
    return date.getUTCFullYear()+(date.getUTCMonth()===0&&date.getUTCDate()===1?0:1);
  }));
  const end=Math.min(input.endYear,...input.people.map(p=>firstRmdYear(p.birthDate)-1));
  return start<=end?{start,end}:null;
}
/** Prefix reruns preserve original income origins and candidate-specific MAGI history. */
function prefix(input:TimelineInput,endYear:number,schedule:Schedule):TimelineInput {
  const through=<T,>(map:Readonly<Record<number,T>>|undefined)=>map&&Object.fromEntries(Object.entries(map).filter(([year])=>Number(year)<=endYear));
  return {...input,endYear,conversionsByYear:through(schedule),contributionCapacities:input.contributionCapacities.filter(c=>c.year<=endYear),
    employerMatchesByYear:through(input.employerMatchesByYear),iraPoliciesByYear:through(input.iraPoliciesByYear),
    irmaa:input.irmaa&&{...input.irmaa,enrollmentByYear:through(input.irmaa.enrollmentByYear)!}};
}
export function evaluateBracketStrategies(input:TimelineInput,request:StrategyRequest,onProgress?:(completed:number)=>void) {
  if(Object.keys(input.conversionsByYear??{}).length)throw new RangeError("Start strategy evaluation without an existing conversion schedule.");
  const source=input.accounts.find(a=>a.id===request.sourceId),destination=input.accounts.find(a=>a.id===request.destinationId);
  if(source?.kind!=="traditional-ira"||destination?.kind!=="roth-ira"||source.ownerId!==request.ownerId||destination.ownerId!==request.ownerId)throw new RangeError("Select same-owner traditional and Roth IRAs.");
  // Keep the first solver within the supported, ordinary-income settlement contract.
  if(input.contributions.some(c=>c.annualAmount>0)||input.income.some(i=>!["wages","pension","social-security"].includes(i.kind))
    ||input.accounts.some(a=>!["cash","traditional-ira","401k","roth-ira","roth-401k"].includes(a.kind)))throw new RangeError("Strategy evaluation currently supports retirement/cash accounts, wages, pensions and Social Security without contributions.");
  const baseline=runRetirementTimeline(input);
  terminalValuation(baseline,request.terminalRate); // Invalid rate/unsupported valuation is never ranked.
  const window=request.window??defaultConversionWindow(input);
  if(window&&(!Number.isInteger(window.start)||!Number.isInteger(window.end)||window.start<input.startYear||window.end>input.endYear||window.end<window.start))throw new RangeError("Invalid conversion window.");
  const candidates=([0,12,22,24] as const).map((target,index)=>{
    const schedule:Record<number,Schedule[number]>={};
    const annual:{year:number;ceiling:number;amount:number;ordinaryTaxable:number}[]=[];
    try {
      if(target && !window)throw new RangeError("No default conversion window exists; supply an explicit window.");
      if(target&&window)for(let year=window.start;year<=window.end;year++){
        const ceiling=conversionBracketCeiling(input.filing,year,target,input.taxProjection);
        const zero=runRetirementTimeline(prefix(input,year,schedule)).years.at(-1)!;
        const account=zero.result.cash.accounts.find(a=>a.accountId===source.id)!;
        let low=0,high=Math.floor(Math.max(0,account.opening-account.requiredWithdrawal)*100);
        const assess=(cents:number)=>{
          const trial={...schedule,[year]:[{sourceId:source.id,destinationId:destination.id,amount:cents/100}]};
          const row=runRetirementTimeline(prefix(input,year,trial)).years.at(-1)!;
          const rothUsed=row.result.cash.accounts.some(a=>a.conversionIn>0&&a.voluntaryWithdrawal>0);
          return {row,ok:row.result.cash.spendingFunded&&row.result.cash.requiredWithdrawalsSatisfied&&!rothUsed&&row.result.tax.ordinaryTaxable<=ceiling};
        };
        if(zero.result.tax.ordinaryTaxable<ceiling&&zero.result.cash.spendingFunded){
          // Finite cent-resolution search; not a global schedule optimizer.
          for(let iteration=0;low<high&&iteration<60;iteration++){
            const mid=Math.ceil((low+high)/2);
            if(assess(mid).ok)low=mid;else high=mid-1;
          }
          if(low<high)throw new RangeError("Annual solver did not converge.");
        }else high=low=0;
        const settled=low?assess(low):{row:zero,ok:true};
        if(low&&!settled.ok)throw new RangeError("Annual ceiling verification failed.");
        if(low)schedule[year]=[{sourceId:source.id,destinationId:destination.id,amount:low/100}];
        annual.push({year,ceiling,amount:low/100,ordinaryTaxable:settled.row.result.tax.ordinaryTaxable});
      }
      const projection=target?runRetirementTimeline({...input,conversionsByYear:schedule}):baseline;
      if(!projection.allYearsFunded||!projection.allRmdsSatisfied)throw new RangeError("Spending, taxes or RMDs are not fully funded across the horizon.");
      const valuation=terminalValuation(projection,request.terminalRate);
      const sensitivity=[Math.max(0,valuation.rate-5),Math.min(100,valuation.rate+5)].map(rate=>({rate,value:terminalValuation(projection,String(rate)).adjusted}));
      return {target,status:"eligible" as const,schedule,annual,projection,valuation,sensitivity,reason:null};
    }catch(error){return {target,status:"rejected" as const,schedule,annual,projection:null,valuation:null,sensitivity:[],reason:error instanceof Error?error.message:"Strategy could not be evaluated."};}
    finally { onProgress?.(index+1); }
  });
  const ranked=candidates.filter(c=>c.status==="eligible").sort((a,b)=>b.valuation!.adjusted-a.valuation!.adjusted||a.target-b.target);
  return {window,candidates,bestTarget:ranked[0]?.target??null,label:"Best among these four strategies under your assumptions",warnings:["Annual bracket filling is a bounded cent-resolution policy, not a global optimizer.","IRMAA uses candidate-specific two-year history; costs beyond the horizon are excluded.",...baseline.warnings,"No contributions or unsupported income types in this evaluator."]};
}
