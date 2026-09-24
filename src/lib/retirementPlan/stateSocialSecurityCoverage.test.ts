import {describe,expect,it} from "vitest";
import {STATES} from "../states";
import {STATE_SS_CLASSIFICATION,stateSocialSecurityInclusion} from "./stateSocialSecurityCoverage";

const base={state:"ny" as const,year:2026,federalAgi:75500,grossBenefits:30000,federallyTaxableBenefits:25500};
describe("50-state benefits-only coverage",()=>{
  it("classifies every state exactly once",()=>{
    expect(Object.keys(STATE_SS_CLASSIFICATION).sort()).toEqual(STATES.map(state=>state.code).sort());
    expect(Object.values(STATE_SS_CLASSIFICATION).filter(value=>value==="exempt")).toHaveLength(43);
    expect(Object.values(STATE_SS_CLASSIFICATION).filter(value=>value==="conditional")).toHaveLength(7);
  });
  it.each(STATES.filter(state=>STATE_SS_CLASSIFICATION[state.code]==="exempt"))("exempts benefits in $name, not all income",({code})=>{
    expect(stateSocialSecurityInclusion({...base,state:code})).toMatchObject({
      status:"supported",taxableBenefits:0,excludedFederallyTaxableBenefits:25500,localTax:null,
    });
    expect(stateSocialSecurityInclusion({...base,state:code})).not.toHaveProperty("stateTax");
    expect(stateSocialSecurityInclusion({...base,state:code})).not.toHaveProperty("stateBase");
  });
  it("retains federal inclusion for Montana without computing tax",()=>{
    expect(stateSocialSecurityInclusion({...base,state:"mt"}).taxableBenefits).toBe(25500);
  });
  it.each(["mn","nm","ri","ut","vt"] as const)("never guesses missing %s worksheet inputs or rules",state=>{
    expect(stateSocialSecurityInclusion({...base,state})).toMatchObject({status:"unsupported",taxableBenefits:null});
  });
  it("enforces year and explicit future policy",()=>{
    expect(()=>stateSocialSecurityInclusion({...base,year:2025})).toThrow();
    expect(()=>stateSocialSecurityInclusion({...base,year:2040})).toThrow();
    expect(stateSocialSecurityInclusion({...base,year:2040,futurePolicy:"hold-2026-law"})).toMatchObject({isProjection:true,taxableBenefits:0});
  });
  it("validates money and does not mutate inputs",()=>{
    for(const grossBenefits of [-1,NaN,Infinity,1e13]) expect(()=>stateSocialSecurityInclusion({...base,grossBenefits})).toThrow();
    expect(()=>stateSocialSecurityInclusion({...base,federallyTaxableBenefits:30001})).toThrow();
    const frozen=Object.freeze({...base});
    stateSocialSecurityInclusion(frozen);
    expect(frozen).toEqual(base);
  });
});

describe("remaining conditional state rules",()=>{
  it.each([
    ["single",100000],["married-separate",75000],["married-joint",150000],
    ["head-of-household",150000],["surviving-spouse",150000],
  ] as const)("New Mexico includes the exact %s exemption boundary",(filing,cap)=>{
    for(const federalAgi of [cap-0.01,cap]) expect(stateSocialSecurityInclusion({...base,state:"nm",filing,federalAgi}).taxableBenefits).toBe(0);
    expect(stateSocialSecurityInclusion({...base,state:"nm",filing,federalAgi:cap+0.01}).taxableBenefits).toBe(25500);
  });
  it.each(["single","married-separate","married-joint","head-of-household","surviving-spouse"] as const)("Vermont preserves the %s phaseout and election",filing=>{
    const lower=filing==="married-joint"?70000:55000;
    const input={...base,state:"vt" as const,filing,vtExclusionElection:"social-security" as const};
    expect(stateSocialSecurityInclusion({...input,federalAgi:lower}).taxableBenefits).toBe(0);
    expect(stateSocialSecurityInclusion({...input,federalAgi:lower+5000}).taxableBenefits).toBe(12750);
    expect(stateSocialSecurityInclusion({...input,federalAgi:lower+10000}).taxableBenefits).toBe(25500);
    expect(stateSocialSecurityInclusion({...input,federalAgi:lower+0.01}).taxableBenefits).toBeCloseTo(0.0255,6);
    expect(stateSocialSecurityInclusion({...input,federalAgi:lower,vtExclusionElection:"other-retirement"}).taxableBenefits).toBe(25500);
  });
  it.each([
    ["single",86410,4000],["head-of-household",86410,4000],
    ["married-joint",110780,4000],["surviving-spouse",110780,4000],["married-separate",55390,2000],
  ] as const)("Minnesota %s uses statutory steps including fractional excess",(filing,threshold,step)=>{
    const input={...base,state:"mn" as const,filing,mnProvisionalIncome:1000000};
    expect(stateSocialSecurityInclusion({...input,federalAgi:threshold}).taxableBenefits).toBe(0);
    expect(stateSocialSecurityInclusion({...input,federalAgi:threshold+0.01}).taxableBenefits).toBe(2550);
    expect(stateSocialSecurityInclusion({...input,federalAgi:threshold+step}).taxableBenefits).toBe(2550);
    expect(stateSocialSecurityInclusion({...input,federalAgi:threshold+step+0.01}).taxableBenefits).toBe(5100);
    expect(stateSocialSecurityInclusion({...input,federalAgi:threshold+10*step}).taxableBenefits).toBe(25500);
  });
  it("Minnesota compares both methods, including alternate phaseout",()=>{
    const input={...base,state:"mn" as const,filing:"single" as const,federalAgi:150000};
    // Worksheet contract: independently supplied provisional income; no AGI inference.
    expect(stateSocialSecurityInclusion({...input,mnProvisionalIncome:70250}).taxableBenefits).toBe(21140);
    expect(stateSocialSecurityInclusion({...input,mnProvisionalIncome:69250,federallyTaxableBenefits:1000}).taxableBenefits).toBe(0);
    expect(()=>stateSocialSecurityInclusion({...input,mnProvisionalIncome:NaN})).toThrow();
  });
  const utah={excludedInterest:0,additionsToAgi:0,benefitsIncludedInStateIncome:25500,remainingTaxLiability:10000,competingRetirementCreditClaimed:false};
  it.each([
    ["single",54000],["married-separate",45000],["married-joint",90000],
    ["head-of-household",90000],["surviving-spouse",90000],
  ] as const)("Utah %s returns a credit, never an exclusion",(filing,cap)=>{
    const input={...base,state:"ut" as const,filing,utah};
    expect(stateSocialSecurityInclusion({...input,federalAgi:cap})).toMatchObject({status:"supported-credit",taxableBenefits:25500,excludedFederallyTaxableBenefits:0,allowedCredit:1134.75});
    expect(stateSocialSecurityInclusion({...input,federalAgi:cap+1000})).toMatchObject({allowedCredit:1109.75});
    expect(stateSocialSecurityInclusion({...input,federalAgi:cap+0.01})).toMatchObject({status:"supported-credit"});
    const r=stateSocialSecurityInclusion({...input,federalAgi:cap+0.01});
    if(r.status==="supported-credit") expect(r.allowedCredit).toBeCloseTo(1134.74975,8);
  });
  it("Utah uses statutory MAGI and nonrefundable/competing-credit limits",()=>{
    const input={...base,state:"ut" as const,filing:"single" as const,federalAgi:54000};
    expect(stateSocialSecurityInclusion({...input,utah:{...utah,excludedInterest:500,additionsToAgi:500}})).toMatchObject({allowedCredit:1109.75});
    expect(stateSocialSecurityInclusion({...input,utah:{...utah,remainingTaxLiability:100}})).toMatchObject({allowedCredit:100});
    expect(stateSocialSecurityInclusion({...input,utah:{...utah,remainingTaxLiability:0}})).toMatchObject({allowedCredit:0});
    expect(stateSocialSecurityInclusion({...input,utah:{...utah,competingRetirementCreditClaimed:true}})).toMatchObject({allowedCredit:0});
    expect(stateSocialSecurityInclusion({...input,utah:{...utah,benefitsIncludedInStateIncome:10000}})).toMatchObject({allowedCredit:445,taxableBenefits:10000});
    expect(stateSocialSecurityInclusion({...input,federalAgi:1000000,utah})).toMatchObject({allowedCredit:0});
    for(const amount of [-1,NaN,Infinity,1e13]) expect(()=>stateSocialSecurityInclusion({...input,utah:{...utah,remainingTaxLiability:amount}})).toThrow();
    expect(()=>stateSocialSecurityInclusion({...input,utah:{...utah,benefitsIncludedInStateIncome:25501}})).toThrow();
  });
  it("keeps Rhode Island blocked rather than relabeling 2025 limits as 2026",()=>{
    expect(stateSocialSecurityInclusion({...base,state:"ri",filing:"single"})).toMatchObject({status:"unsupported",taxableBenefits:null});
  });
});

describe("Connecticut worksheet",()=>{
  it.each([
    ["single",75000],["married-separate",75000],["married-joint",100000],
    ["head-of-household",100000],["surviving-spouse",100000],
  ] as const)("checks the exact %s AGI boundary",(filing,threshold)=>{
    const input={...base,state:"ct" as const,filing,ctFederalWorksheetLine10:100000};
    expect(stateSocialSecurityInclusion({...input,federalAgi:threshold-0.01}).taxableBenefits).toBe(0);
    expect(stateSocialSecurityInclusion({...input,federalAgi:threshold}).taxableBenefits).toBe(7500);
    expect(stateSocialSecurityInclusion({...input,federalAgi:threshold+0.01}).taxableBenefits).toBe(7500);
  });
  it("uses the lesser worksheet value, not a flat 25% of federal taxable benefits",()=>{
    const result=stateSocialSecurityInclusion({...base,state:"ct",filing:"single",ctFederalWorksheetLine10:20000});
    expect(result.taxableBenefits).toBe(5000);
    expect(result.excludedFederallyTaxableBenefits).toBe(20500);
  });
  it("never exceeds federal inclusion and preserves fractional dollars",()=>{
    expect(stateSocialSecurityInclusion({...base,state:"ct",filing:"single",ctFederalWorksheetLine10:100000,federallyTaxableBenefits:6000}).taxableBenefits).toBe(6000);
    expect(stateSocialSecurityInclusion({...base,state:"ct",filing:"single",ctFederalWorksheetLine10:20000.125}).taxableBenefits).toBe(5000.03125);
  });
  it("requires filing and the actual worksheet rather than inferring it",()=>{
    expect(stateSocialSecurityInclusion({...base,state:"ct"}).status).toBe("unsupported");
    expect(stateSocialSecurityInclusion({...base,state:"ct",filing:"single"}).status).toBe("unsupported");
    expect(()=>stateSocialSecurityInclusion({...base,state:"ct",ctFederalWorksheetLine10:NaN})).toThrow();
  });
});

describe("Colorado owner-level benefit subtraction",()=>{
  const co={...base,state:"co" as const,filing:"single" as const,owners:[{ageAtYearEnd:64,grossBenefits:30000}]};
  it("checks the 55, 65 and income boundaries",()=>{
    expect(stateSocialSecurityInclusion({...co,owners:[{ageAtYearEnd:54,grossBenefits:30000}]}).status).toBe("unsupported");
    expect(stateSocialSecurityInclusion({...co,owners:[{ageAtYearEnd:55,grossBenefits:30000}]}).taxableBenefits).toBe(5500);
    expect(stateSocialSecurityInclusion({...co,federalAgi:75000}).taxableBenefits).toBe(0);
    expect(stateSocialSecurityInclusion({...co,federalAgi:75000.01}).taxableBenefits).toBe(5500);
    expect(stateSocialSecurityInclusion({...co,owners:[{ageAtYearEnd:65,grossBenefits:30000}]}).taxableBenefits).toBe(0);
  });
  it("allocates joint federal inclusion by gross benefits before applying each age cap",()=>{
    const joint={...co,filing:"married-joint" as const,federalAgi:95000.01,grossBenefits:60000,
      federallyTaxableBenefits:51000,owners:[{ageAtYearEnd:64,grossBenefits:40000},{ageAtYearEnd:65,grossBenefits:20000}]};
    // 51,000 * 40,000 / 60,000 = 34,000; less 20,000 = 14,000.
    expect(stateSocialSecurityInclusion(joint).taxableBenefits).toBe(14000);
    expect(stateSocialSecurityInclusion({...joint,federalAgi:95000}).taxableBenefits).toBe(0);
  });
  it("handles zero benefits without division by zero",()=>{
    expect(stateSocialSecurityInclusion({...co,grossBenefits:0,federallyTaxableBenefits:0,owners:[{ageAtYearEnd:64,grossBenefits:0}]}).taxableBenefits).toBe(0);
  });
  it("rejects malformed owners and blocks unsupported household contracts",()=>{
    for(const ageAtYearEnd of [NaN,54.5,-1,126]) expect(()=>stateSocialSecurityInclusion({...co,owners:[{ageAtYearEnd,grossBenefits:30000}]})).toThrow();
    expect(()=>stateSocialSecurityInclusion({...co,owners:[{ageAtYearEnd:64,grossBenefits:1}]})).toThrow();
    expect(stateSocialSecurityInclusion({...co,owners:undefined}).status).toBe("unsupported");
    expect(stateSocialSecurityInclusion({...co,filing:"married-joint"}).status).toBe("unsupported");
    expect(stateSocialSecurityInclusion({...co,filing:"married-separate"}).status).toBe("unsupported");
  });
});
