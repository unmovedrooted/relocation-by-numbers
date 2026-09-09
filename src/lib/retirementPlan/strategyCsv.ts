import type {CsvRow} from "../csvExport";
import type {TimelineInput} from "./timeline";
import type {evaluateBracketStrategies,StrategyRequest} from "./bracketStrategies";
export type StrategyExportSnapshot={input:TimelineInput;request:StrategyRequest;completedAt:string};
/** Long-form CSV: stable columns for assumptions, summaries and annual records. */
export function strategyCsvRows(result:ReturnType<typeof evaluateBracketStrategies>,snapshot:StrategyExportSnapshot):CsvRow[]{
  const rows:CsvRow[]=[];
  const safe=(value:string)=>/^[\s]*[=+\-@]|^[\t\r\n]/.test(value)?`'${value}`:value;
  const add=(section:string,strategy:string,year:number|null,field:string,value:string|number|null,unit="",status="")=>rows.push({section,strategy,year,field:safe(field),value:typeof value==="string"?safe(value):value,unit,status});
  add("metadata","",null,"format","strategy-comparison-v1");
  add("metadata","",null,"completed_at",snapshot.completedAt);
  add("metadata","",null,"privacy","Contains financial assumptions. Generated locally; protect this downloaded file.");
  add("metadata","",null,"units","Amounts USD; annual nominal cash flows. Growth fields are decimals; terminalRate is percent. Dates ISO; basis is remaining after-tax principal.");
  const flatten=(value:unknown,path:string)=>{
    if(value!==null&&typeof value==="object"){
      const entries=Object.entries(value);if(!entries.length)add("assumption","",null,path,Array.isArray(value)?"[]":"{}");
      for(const [key,child] of entries)flatten(child,`${path}.${key}`);
    }else add("assumption","",null,path,value===null||value===undefined?null:typeof value==="number"?value:String(value));
  };
  flatten(snapshot.input,"input");flatten(snapshot.request,"request");flatten(result.window,"evaluated_window");
  add("summary","",null,"best_target",result.bestTarget===null?"No eligible candidate":result.bestTarget,"percent ceiling; 0 = baseline");
  for(const c of result.candidates){
    const strategy=c.target?`Fill to ${c.target}%`:"No conversions";
    add("candidate",strategy,null,"status",c.status,"",c.status);
    if(c.reason)add("candidate",strategy,null,"rejection_reason",c.reason,"",c.status);
    if(c.valuation)for(const field of ["gross","untaxed","assumedTax","adjusted","rate"] as const)add("valuation",strategy,null,field,c.valuation[field],field==="rate"?"percent":"USD",c.status);
    for(const s of c.sensitivity)add("sensitivity",strategy,null,`adjusted_at_${s.rate}_percent`,s.value,"USD",c.status);
    if(c.projection){
      for(const [field,value]of [["total_taxes",c.projection.years.reduce((s,y)=>s+y.result.tax.total,0)],["total_irmaa",c.projection.years.reduce((s,y)=>s+y.irmaaSurcharges,0)],["total_rmds",c.projection.years.reduce((s,y)=>s+y.result.cash.requiredWithdrawals,0)]] as const)add("candidate",strategy,null,field,value,"USD",c.status);
      for(const y of c.projection.years){
        for(const [field,value]of [["conversion",y.result.cash.conversions.reduce((s,t)=>s+t.amount,0)],["taxes",y.result.tax.total],["irmaa",y.irmaaSurcharges],["rmds",y.result.cash.requiredWithdrawals],["spending",y.spending],["ending_assets",y.endingPortfolio],["shortfall",y.result.cash.shortfall]] as const)add("annual",strategy,y.year,field,value,"USD",c.status);
      }
    }
    for(const y of c.annual)for(const [field,value]of [["conversion",y.amount],["ceiling",y.ceiling],["ordinary_taxable",y.ordinaryTaxable]] as const)add(c.status==="rejected"?"incomplete_trial_schedule":"schedule",strategy,y.year,field,value,"USD",c.status);
  }
  for(const warning of [...result.warnings,"Best among four tested strategies only, not a global optimum or financial recommendation.","Terminal valuation is an assumption, not liquidation tax. Tax and IRMAA already paid are not deducted again. Post-horizon Medicare costs and estate/inheritance taxes are excluded.","Rejected trial schedules are incomplete diagnostics, not applicable conversion instructions. No schedule was automatically applied."])add("limitation","",null,"note",warning);
  return rows;
}
