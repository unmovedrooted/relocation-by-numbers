import {expect,it} from "vitest";
import {buildPreviewInput,PREVIEW_DEFAULTS} from "./preview";
import {initialAccountEditor,newAccountDraft} from "./previewAccounts";
import {runRetirementTimeline} from "./timeline";
import {terminalValuation} from "./terminalValuation";
function fixture(){
  const editor=initialAccountEditor();
  editor.accounts[0].fields.returns="0";
  editor.owners.one.iraBasis="50000";
  const input=buildPreviewInput({...PREVIEW_DEFAULTS,endYear:"2026",spending:"0",cash:"0","one-salary":"0"},editor);
  return runRetirementTimeline(input);
}
it("values 500k with 50k basis at 20% as 410k without mutation",()=>{
  const result=fixture(),before=JSON.stringify(result);
  expect(terminalValuation(result,"20")).toEqual({gross:500000,untaxed:450000,assumedTax:90000,adjusted:410000,rate:20});
  expect(JSON.stringify(result)).toBe(before);
});
it.each([""," ","NaN","Infinity","-1","101"])("rejects invalid rate %s",rate=>expect(()=>terminalValuation(fixture(),rate)).toThrow());
it("accepts explicit zero, decimal and 100% rates",()=>{
  expect(terminalValuation(fixture(),"0").adjusted).toBe(500000);
  expect(terminalValuation(fixture(),"20.1250").assumedTax).toBe(90562.5);
  expect(terminalValuation(fixture(),"100").adjusted).toBe(50000);
});
it("counts owner basis once across multiple IRAs",()=>{
  const result=fixture(),account=result.nextState.accounts.find(a=>a.kind==="traditional-ira")!;
  const split={...result,nextState:{...result.nextState,accounts:[{...account,balance:200000},{...account,id:"second",balance:300000}]}};
  expect(terminalValuation(split,"20").adjusted).toBe(410000);
});
it("caps basis at remaining IRA value without a fictitious tax credit",()=>{
  const r=fixture();
  expect(terminalValuation({...r,nextState:{...r.nextState,people:r.nextState.people.map(p=>({...p,iraBasis:600000}))}},"20").adjusted).toBe(500000);
});
it.each(["1960-01-01","1970-01-01"])("checks terminal Roth age and tax-year clock for %s",birth=>{
  const editor=initialAccountEditor();editor.accounts=[];
  const roth=newAccountDraft("roth","roth-ira");roth.fields.balance="10000";roth.fields.returns="0";editor.accounts.push(roth);
  editor.owners.one.rothFirstYear="2020";
  editor.owners.one.conversions=[{id:"recent",year:"2026",taxable:"10000",nontaxable:"0"}];
  const result=runRetirementTimeline(buildPreviewInput({...PREVIEW_DEFAULTS,endYear:"2026",cash:"0",spending:"0","one-salary":"0","one-birth":birth},editor));
  if(birth.startsWith("1960"))expect(terminalValuation(result,"20").adjusted).toBe(10000);
  else expect(()=>terminalValuation(result,"20")).toThrow(/not qualified/);
});
it("rejects an unseasoned Roth even for an older owner",()=>{
  const r=fixture();
  const modified={...r,nextState:{...r.nextState,accounts:[{id:"roth",ownerId:"one",kind:"roth-ira" as const,balance:100,annualReturn:0}],people:r.nextState.people.map(p=>({...p,roth:{firstContributionYear:2025,regularContributionBasis:100,conversions:[]}}))}};
  expect(()=>terminalValuation(modified,"20")).toThrow(/not qualified/);
});
