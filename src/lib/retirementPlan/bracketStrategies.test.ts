import {expect,it} from "vitest";
import {buildPreviewInput,PREVIEW_DEFAULTS} from "./preview";
import {initialAccountEditor,newAccountDraft} from "./previewAccounts";
import {defaultConversionWindow,evaluateBracketStrategies} from "./bracketStrategies";
import {conversionBracketCeiling} from "./householdTax";
function fixture(){const editor=initialAccountEditor();editor.accounts.push(newAccountDraft("roth","roth-ira"));editor.accounts.forEach(a=>a.fields.returns="0");editor.owners.one.rothFirstYear="2020";
return buildPreviewInput({...PREVIEW_DEFAULTS,endYear:"2028",spending:"0",cash:"100000","one-salary":"0"},editor);}
const request={ownerId:"one",sourceId:"one-ira",destinationId:"roth",window:{start:2026,end:2026},terminalRate:"20"};
it("reports four completed candidates without changing results",()=>{
const input=fixture(),progress:number[]=[];
const result=evaluateBracketStrategies(input,request,completed=>progress.push(completed));
expect(progress).toEqual([1,2,3,4]);
expect(result).toEqual(evaluateBracketStrategies(input,request));
});
it("evaluates exactly four named strategies without mutating input",()=>{
const input=fixture(),snapshot=JSON.stringify(input),r=evaluateBracketStrategies(input,request);
expect(r.candidates.map(c=>c.target)).toEqual([0,12,22,24]);expect(r.candidates.every(c=>c.status==="eligible")).toBe(true);
expect(JSON.stringify(input)).toBe(snapshot);
for(const c of r.candidates.filter(c=>c.target)){expect(c.annual[0].ordinaryTaxable).toBeLessThanOrEqual(c.annual[0].ceiling);expect(c.annual[0].ceiling-c.annual[0].ordinaryTaxable).toBeLessThan(.02);}
expect(r.candidates[0].schedule).toEqual({});
expect(r.candidates[1].annual[0].amount).toBe(66500);
});
it("solves with basis and tax-funded withdrawals rather than subtracting income alone",()=>{
const i=fixture();const withBasis={...i,spendingAnnual:30000,accounts:i.accounts.map(a=>a.kind==="cash"?{...a,balance:0}:a),people:i.people.map(p=>({...p,iraBasis:100000}))};
const r=evaluateBracketStrategies(withBasis,request),c=r.candidates[1];
expect(c.status).toBe("eligible");expect(c.projection!.years[0].result.cash.voluntaryWithdrawals).toBeGreaterThan(30000);
expect(c.annual[0].ordinaryTaxable).toBeLessThanOrEqual(50400);expect(50400-c.annual[0].ordinaryTaxable).toBeLessThan(.02);
expect(c.projection!.years[0].result.conversionTax[0].nontaxable).toBeGreaterThan(0);
});
it("shares 2026 ceilings and projects the same threshold growth",()=>{
const i=fixture();expect(conversionBracketCeiling("single",2026,12,i.taxProjection)).toBe(50400);
expect(conversionBracketCeiling("married",2026,24,i.taxProjection)).toBe(403550);
expect(conversionBracketCeiling("single",2027,22,i.taxProjection)).toBeCloseTo(105700*1.025);
});
it("uses both retirement dates and earliest RMD year, and reports an empty gap",()=>{
const i=fixture();expect(defaultConversionWindow(i)).toBeNull();
expect(defaultConversionWindow({...i,endYear:2060})).toEqual({start:2030,end:2039});
expect(defaultConversionWindow({...i,endYear:2060,retirementDates:{one:"2030-06-01"}})).toEqual({start:2031,end:2039});
});
it("rejects invalid rates, ownership and windows",()=>{
for(const patch of [{terminalRate:""},{ownerId:"two"},{window:{start:2025,end:2028}}])expect(()=>evaluateBracketStrategies(fixture(),{...request,...patch})).toThrow();
});
it("includes IRMAA cost after the two-year lookback without excluding higher brackets",()=>{
const i=fixture();const r=evaluateBracketStrategies({...i,irmaa:{budgetTreatment:"surcharges-outside-spending",annualSurchargeGrowth:0,historicalIncome:[],enrollmentByYear:{2028:[{ownerId:"one",partBMonths:12,partDMonths:12}]}}},request);
const high=r.candidates.find(c=>c.target===24)!;expect(high.status).toBe("eligible");expect(high.projection!.years[0].irmaaSurcharges).toBe(0);expect(high.projection!.years[2].irmaaSurcharges).toBeGreaterThan(0);
expect(r.candidates[0].projection!.years[2].irmaaSurcharges).toBe(0);
});
it("rejects unfunded candidates before ranking",()=>{
const r=evaluateBracketStrategies({...fixture(),spendingAnnual:10000000},request);
expect(r.candidates.every(c=>c.status==="rejected")).toBe(true);expect(r.bestTarget).toBeNull();
});
