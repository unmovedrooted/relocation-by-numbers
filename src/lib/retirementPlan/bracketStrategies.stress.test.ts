import {expect,it} from "vitest";
import {buildPreviewInput,PREVIEW_DEFAULTS} from "./preview";
import {initialAccountEditor,newAccountDraft} from "./previewAccounts";
import {evaluateBracketStrategies} from "./bracketStrategies";
import {runRetirementTimeline} from "./timeline";

const request={ownerId:"one",sourceId:"one-ira",destinationId:"roth",window:{start:2026,end:2026},terminalRate:"20"};
function scenario(balance:number,basis:number,spending:number,birth:string,benefit:number,pension:number){
  const editor=initialAccountEditor();editor.accounts[0].fields.balance=String(balance);editor.accounts[0].fields.priorBalance=String(balance);
  editor.accounts.push(newAccountDraft("roth","roth-ira"));editor.accounts.forEach(a=>a.fields.returns="0");editor.owners.one.iraBasis=String(basis);editor.owners.one.rothFirstYear="2020";
  return buildPreviewInput({...PREVIEW_DEFAULTS,endYear:"2026",cash:"0",spending:String(spending),"one-birth":birth,"one-salary":"0","one-benefit":String(benefit),"one-benefitStart":"2026-01-01","one-pension":String(pension),"one-pensionStart":"2026-01-01"},editor);
}
const cases=[
  [500000,0,30000,"1960-01-01",24000,10000],
  [500000,200000,50000,"1960-01-01",36000,20000],
  [500000,0,30000,"1951-01-01",24000,12000],
  [15000,5000,10000,"1960-01-01",0,0],
  [500000,0,20000,"1960-01-01",24000,100000],
] as const;
it("evaluates high-basis strategies without reconstructing a smaller Roth cash balance",()=>{
  const input=scenario(500000,200000,50000,"1960-01-01",36000,20000);
  const small=runRetirementTimeline({...input,conversionsByYear:{2026:[{sourceId:"one-ira",destinationId:"roth",amount:10000}]}});
  expect(small.allYearsFunded).toBe(true);
  expect(small.years[0].result.tax.ordinaryTaxable).toBeLessThan(50400);
  const result=evaluateBracketStrategies(input,request);
  const rejected=result.candidates.filter(c=>c.status==="rejected");
  expect(rejected.length).toBe(0);
  expect(rejected.map(c=>c.reason)).toEqual([]);
  for(const candidate of rejected){expect(candidate.valuation).toBeNull();expect(result.bestTarget).not.toBe(candidate.target);}
  const boundary=runRetirementTimeline({...input,conversionsByYear:{2026:[{sourceId:"one-ira",destinationId:"roth",amount:247558.59}]}});
  expect(boundary.allYearsFunded).toBe(true);
  expect(boundary.years[0].result.cash.conversions[0].amount).toBe(247558.59);
  expect(Math.abs(boundary.years[0].reconciliationResidual)).toBeLessThan(.0001);
});
it.each(cases)("checks sampled feasible intervals and the selected cent boundary: %s/%s/%s/%s/%s/%s",(balance,basis,spending,birth,benefit,pension)=>{
  const input=scenario(balance,basis,spending,birth,benefit,pension),before=JSON.stringify(input);
  const result=evaluateBracketStrategies(input,request);
  const zero=runRetirementTimeline(input).years[0];
  const source=zero.result.cash.accounts.find(a=>a.accountId==="one-ira")!;
  const capacity=Math.floor((source.opening-source.requiredWithdrawal)*100);
  for(const candidate of result.candidates.filter(c=>c.target>0)){
    expect(candidate.status,candidate.reason??String(candidate.target)).toBe("eligible");
    const ceiling=candidate.annual[0].ceiling;
    const assess=(cents:number)=>{
      const row=runRetirementTimeline({...input,conversionsByYear:{2026:[{sourceId:"one-ira",destinationId:"roth",amount:cents/100}]}}).years[0];
      return {row,ok:row.result.cash.spendingFunded&&row.result.cash.requiredWithdrawalsSatisfied&&row.result.tax.ordinaryTaxable<=ceiling&&!row.result.cash.accounts.some(a=>a.conversionIn>0&&a.voluntaryWithdrawal>0)};
    };
    let seenFailure=false;
    for(let index=0;index<=100;index++){
      const check=assess(Math.floor(capacity*index/100));
      if(!check.ok)seenFailure=true;
      if(seenFailure)expect(check.ok).toBe(false);
      expect(Number.isFinite(check.row.result.tax.total)).toBe(true);
      expect(Math.abs(check.row.reconciliationResidual)).toBeLessThan(.0001);
    }
    const selected=Math.round(candidate.annual[0].amount*100);
    if(zero.result.tax.ordinaryTaxable<=ceiling){
      expect(assess(selected).ok).toBe(true);
      if(selected<capacity)expect(assess(selected+1).ok).toBe(false);
    }else expect(selected).toBe(0);
  }
  expect(JSON.stringify(input)).toBe(before);
});
it("returns zero conversions for exhausted sources and never ranks rejected strategies",()=>{
  const input=scenario(0,0,0,"1960-01-01",0,0);
  const result=evaluateBracketStrategies(input,request);
  expect(result.candidates.every(c=>c.status==="eligible")).toBe(true);
  expect(result.bestTarget).toBe(0);
  for(const c of result.candidates)expect(Object.keys(c.schedule)).toHaveLength(0);
  const failed=evaluateBracketStrategies({...input,spendingAnnual:10000},request);
  expect(failed.bestTarget).toBeNull();expect(failed.candidates.every(c=>c.reason&&c.valuation===null)).toBe(true);
});
it("keeps preexisting Roth withdrawals out of a positive conversion year",()=>{
  const input=scenario(1000,0,20000,"1960-01-01",0,0);
  const withRoth={...input,accounts:input.accounts.map(a=>a.kind==="roth-ira"?{...a,balance:100000}:a),people:input.people.map(p=>({...p,roth:{...p.roth,regularContributionBasis:100000}}))};
  const result=evaluateBracketStrategies(withRoth,request);
  for(const c of result.candidates.filter(c=>c.target))expect(c.annual[0].amount).toBe(0);
});
