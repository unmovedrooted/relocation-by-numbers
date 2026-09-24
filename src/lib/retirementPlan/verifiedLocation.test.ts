import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {STATES} from "../states";
import {CITIES} from "../cities";
import {verifiedRetirementLocation} from "./verifiedLocation";
import {buildPreviewInput,calculatePreview,PREVIEW_DEFAULTS} from "./preview";
import {runRetirementTimeline} from "./timeline";
import {estimateHouseholdTax, type HouseholdIncome} from "./householdTax";
import {taxCharacter} from "./accountTax";

describe("restricted retirement locations",()=>{
  it("enables Texas cities and preserves federal taxes, withdrawals and balances",()=>{
    const florida=calculatePreview(PREVIEW_DEFAULTS);
    for(const cityId of ["",...CITIES.filter(city=>city.state==="tx").map(city=>city.id)]) {
      const input=buildPreviewInput({...PREVIEW_DEFAULTS,state:"tx",cityId});
      expect(input).toMatchObject({state:"tx",cityId,stateTreatment:"verified-resident-location"});
      const result=runRetirementTimeline(input);
      expect(result.years.map(row=>[row.result.tax.total,row.result.cash.voluntaryWithdrawals,row.endingPortfolio])).toEqual(florida.years.map(row=>[row.result.tax.total,row.result.cash.voluntaryWithdrawals,row.endingPortfolio]));
      expect(result.years.every(row=>row.result.tax.stateTax===0&&row.result.tax.localTax===0)).toBe(true);
      expect(result.warnings.some(warning=>warning.startsWith("Texas full-year"))).toBe(true);
    }
    expect(()=>verifiedRetirementLocation("tx","miami-fl")).toThrow(/city/);
    expect(()=>verifiedRetirementLocation("tx","unknown")).toThrow(/city/);
  });
  it.each(["wages","pension","social-security","interest","qualified-dividends"] as const)("Texas does not tax %s, without removing federal tax",kind=>{
    const income: HouseholdIncome[]=[{ownerId:"one",kind,amount:100000}];
    const input={year:2026,filing:"single" as const,state:"tx" as const,stateTreatment:"verified-resident-location" as const,
      people:[{id:"one",birthDate:"1960-01-01",blind:false,eligibleForSeniorDeduction:true}],income,
      accountIncome:taxCharacter(),lossCarryover:{shortTerm:0,longTerm:0}};
    const tx=estimateHouseholdTax(input), fl=estimateHouseholdTax({...input,state:"fl"});
    expect(tx.stateTax).toBe(0); expect(tx.localTax).toBe(0);
    expect(tx.total).toBe(fl.total); expect(tx.taxableBenefits).toBe(fl.taxableBenefits);
  });
  it.each(["retirementOrdinary","shortTermGain","longTermGain","esppCompensation"] as const)("Texas preserves federal account character for %s",character=>{
    const input={year:2026,filing:"single" as const,state:"tx" as const,stateTreatment:"verified-resident-location" as const,
      people:[{id:"one",birthDate:"1960-01-01",blind:false,eligibleForSeniorDeduction:true}],income:[],
      accountIncome:taxCharacter({[character]:100000}),lossCarryover:{shortTerm:0,longTerm:0}};
    const tx=estimateHouseholdTax(input);
    expect(tx.stateTax).toBe(0); expect(tx.localTax).toBe(0);
    expect(tx.total).toBe(estimateHouseholdTax({...input,state:"fl"}).total);
    expect(tx.total).toBeGreaterThan(0);
  });
  it.each(STATES.filter(state=>!["fl","tx","ny","md","in","dc","il","nj","pa"].includes(state.code)))("blocks $name without silently using a proxy",({code})=>{
    expect(()=>buildPreviewInput({...PREVIEW_DEFAULTS,state:code})).toThrow(/not yet verified/);
  });
  it("validates city ownership and unknown codes",()=>{
    expect(()=>verifiedRetirementLocation("fl","unknown")).toThrow(/city/);
    expect(()=>verifiedRetirementLocation("fl","nyc-ny")).toThrow(/city/);
    expect(()=>verifiedRetirementLocation("invalid")).toThrow(/state/);
    for(const city of CITIES.filter(city=>city.state==="fl")) expect(verifiedRetirementLocation("fl",city.id).localTax).toBe(0);
  });
  it("keeps the supported resident result identical across Florida cities",()=>{
    const baseline=calculatePreview(PREVIEW_DEFAULTS);
    const city=CITIES.find(city=>city.state==="fl")!;
    const selected=calculatePreview({...PREVIEW_DEFAULTS,cityId:city.id});
    expect(selected.years.map(row=>[row.result.tax.total,row.result.cash.voluntaryWithdrawals,row.endingPortfolio])).toEqual(baseline.years.map(row=>[row.result.tax.total,row.result.cash.voluntaryWithdrawals,row.endingPortfolio]));
    expect(selected.years.every(row=>row.result.tax.stateTax===0&&row.result.tax.localTax===0&&row.result.tax.stateDataYear===2026)).toBe(true);
    expect(selected.warnings.some(warning=>warning.includes("wage-based proxy"))).toBe(false);
  });
  it("enforces the restriction in the engine, not just in the form",()=>{
    const input=buildPreviewInput(PREVIEW_DEFAULTS);
    expect(()=>runRetirementTimeline({...input,state:"ri"})).toThrow(/not yet verified/);
    expect(()=>runRetirementTimeline({...input,cityId:"unknown"})).toThrow(/city/);
  });
  it("keeps existing Florida numerical results unchanged",()=>{
    const input=buildPreviewInput(PREVIEW_DEFAULTS);
    const old=runRetirementTimeline({...input,stateTreatment:"existing-2025-proxy"});
    const current=runRetirementTimeline(input);
    expect(current.years.map(row=>[row.endingPortfolio,row.result.tax.total])).toEqual(old.years.map(row=>[row.endingPortfolio,row.result.tax.total]));
  });
  it("associates selector labels and includes location in exports",()=>{
    const source=readFileSync("src/components/RetirementPlanPreview.tsx","utf8");
    for(const id of ["plan-state","plan-city"]) {
      expect(source.match(new RegExp(`id="${id}"`,"g"))).toHaveLength(1);
      expect(source).toContain(`htmlFor="${id}"`);
    }
    expect(source).toContain("State: values.state");
    expect(source).toContain('Metric: "Resident location"');
    expect(source).toContain('state: event.target.value, cityId: ""');
  });
});
