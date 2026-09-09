import { describe, expect, it } from "vitest";
import { iraSpecificMagi, runEligibleContributions2026, type IraOwnerPolicy, type CatchUpRoute } from "./eligibleContributions2026";
import { runHouseholdYear, type HouseholdYearInput, type YearAccount } from "./householdYear";

const cash: YearAccount={id:"cash",ownerId:"one",kind:"cash",balance:0,annualReturn:0,interestTreatment:"none"};
const ira: YearAccount={id:"ira",ownerId:"one",kind:"traditional-ira",balance:0,annualReturn:0,rmd:{table:"uniform",priorDecemberBalance:0}};
const policy: IraOwnerPolicy={ownerId:"one",traditionalAccountId:"ira",coveredByWorkplacePlan:false,spouseCoveredByWorkplacePlan:false,deductionChoice:"deduct-eligible",allocation:"traditional-first"};
function input(changes:Partial<HouseholdYearInput>={}):HouseholdYearInput { return {
  year:2026,distributionDate:"2026-12-31",filing:"single",state:"fl",stateTreatment:"existing-2025-proxy",
  people:[{id:"one",birthDate:"1980-01-01",blind:false,eligibleForSeniorDeduction:true,iraBasis:0,iraAdditionalTaxExceptionAmount:0,rothAdditionalTaxExceptionAmount:0,
    roth:{firstContributionYear:null,regularContributionBasis:0,conversions:[]}}], accounts:[cash,ira],income:[{ownerId:"one",kind:"wages",amount:50000}],
  spending:30000,contributions:[{accountId:"ira",amount:7500,taxTreatment:"after-tax",eligibility:"externally-validated"}],conversions:[],withdrawalOrder:["cash","ira"],surplusAccountId:"cash",lossCarryover:{shortTerm:0,longTerm:0},...changes}; }
describe("integrated contribution eligibility",()=>{
  const plan:YearAccount={id:"plan",ownerId:"one",kind:"401k",balance:0,annualReturn:0,rmd:{table:"uniform",priorDecemberBalance:0},afterTaxBasis:0,deferRmdWhileWorking:false,additionalTaxExceptionAmount:0};
  it("uses funded pretax deferrals to determine the actual IRA deduction phaseout",()=>{
    const r=runEligibleContributions2026(input({accounts:[cash,ira,plan],income:[{ownerId:"one",kind:"wages",amount:96000}],
      contributions:[...input().contributions!,{accountId:"plan",amount:10000,taxTreatment:"pretax-401k",eligibility:"externally-validated"}]}),[{...policy,coveredByWorkplacePlan:true}]);
    expect(r.tax.pretaxDeferrals).toBe(10000);
    expect(r.tax.iraDeduction).toBe(3750);
    expect(r.tax.agi+r.tax.iraDeduction).toBe(86000);
    expect(r.nextState.people[0].iraBasis).toBe(3750);
  });
  it("restores Roth eligibility when funded deferrals reduce MAGI below the phaseout",()=>{
    const roth:YearAccount={id:"roth",ownerId:"one",kind:"roth-ira",balance:0,annualReturn:0};
    const r=runEligibleContributions2026(input({accounts:[cash,roth,plan],income:[{ownerId:"one",kind:"wages",amount:170000}],
      contributions:[{accountId:"roth",amount:7500,taxTreatment:"after-tax",eligibility:"externally-validated"},{accountId:"plan",amount:20000,taxTreatment:"pretax-401k",eligibility:"externally-validated"}],withdrawalOrder:["cash"]}),
      [{...policy,traditionalAccountId:undefined,rothAccountId:"roth",coveredByWorkplacePlan:true}]);
    expect(r.tax.agi).toBe(150000);expect(r.nextState.people[0].roth.regularContributionBasis).toBe(7500);
  });
  it("solves IRA/pretax funding feedback without stale MAGI",()=>{
    const r=runEligibleContributions2026(input({accounts:[cash,ira,plan],spending:40000,
      contributions:[...input().contributions!,{accountId:"plan",amount:10000,taxTreatment:"pretax-401k",eligibility:"externally-validated"}]}),[policy]);
    const funded = 2355/.88;
    expect(r.cash.contributions).toBeCloseTo(funded,5);
    expect(r.tax.pretaxDeferrals).toBeCloseTo(funded*10000/17500,5);
    expect(r.tax.iraDeduction).toBeCloseTo(funded*7500/17500,5);
    expect(r.nextState.people[0].iraBasis).toBe(0);
    expect(r.cash.cashResidual).toBeCloseTo(0,5);expect(r.cash.portfolioResidual).toBeCloseTo(0,5);
  });
  it("does not subtract Roth workplace deposits from IRA MAGI",()=>{
    const rothPlan:YearAccount={id:"roth-plan",ownerId:"one",kind:"roth-401k",balance:0,annualReturn:0,contributionBasis:0,firstContributionYear:2020,hasInPlanRollover:false,additionalTaxExceptionAmount:0};
    const r=runEligibleContributions2026(input({accounts:[cash,ira,rothPlan],income:[{ownerId:"one",kind:"wages",amount:96000}],
      contributions:[...input().contributions!,{accountId:"roth-plan",amount:10000,taxTreatment:"after-tax",eligibility:"externally-validated"}]}),[{...policy,coveredByWorkplacePlan:true}]);
    expect(r.tax.iraDeduction).toBe(0);expect(r.nextState.people[0].iraBasis).toBe(7500);expect(r.tax.agi).toBe(96000);
  });
  it("rechecks a partial deduction phaseout at the final funded MAGI",()=>{
    const r=runEligibleContributions2026(input({accounts:[cash,ira,plan],spending:70000,income:[{ownerId:"one",kind:"wages",amount:90000}],
      contributions:[...input().contributions!,{accountId:"plan",amount:10000,taxTreatment:"pretax-401k",eligibility:"externally-validated"}]}),[{...policy,coveredByWorkplacePlan:true}]);
    // No-saving federal tax 10,970 + FICA 6,885 leaves $2,145.
    // All funded saving is deductible in this case: C = 2,145 / .78.
    expect(r.cash.contributions).toBeCloseTo(2145/.78,5);
    expect(r.tax.pretaxDeferrals).toBeCloseTo((2145/.78)*4/7,5);
    expect(r.tax.iraDeduction).toBeCloseTo((2145/.78)*3/7,5);
    const finalMagi=r.tax.agi+r.tax.iraDeduction;
    expect(finalMagi).toBeGreaterThan(81000);expect(finalMagi).toBeLessThan(91000);
    const ceiling=Math.max(200,Math.ceil(7500*(91000-finalMagi)/10000/10)*10);
    expect(r.tax.iraDeduction).toBeLessThanOrEqual(ceiling);
  });
  it("solves feedback with a nondeductible IRA election",()=>{
    const r=runEligibleContributions2026(input({accounts:[cash,ira,plan],spending:40000,
      contributions:[...input().contributions!,{accountId:"plan",amount:10000,taxTreatment:"pretax-401k",eligibility:"externally-validated"}]}),[{...policy,deductionChoice:"nondeductible"}]);
    const funded=2355/(1-.12*4/7);
    expect(r.cash.contributions).toBeCloseTo(funded,5);
    expect(r.tax.iraDeduction).toBe(0);expect(r.nextState.people[0].iraBasis).toBeCloseTo(funded*3/7,5);
  });
  it("keeps feedback deterministic and does not mutate requests across retries",()=>{
    const i=input({accounts:[cash,ira,plan],spending:40000,
      contributions:[...input().contributions!,{accountId:"plan",amount:10000,taxTreatment:"pretax-401k",eligibility:"externally-validated"}]});
    const snapshot=JSON.stringify(i);
    expect(runEligibleContributions2026(i,[policy])).toEqual(runEligibleContributions2026(i,[policy]));
    expect(JSON.stringify(i)).toBe(snapshot);
  });
  it("derives separate IRA MAGIs, excluding conversion only from Roth",()=>{
    expect(iraSpecificMagi({agi:100000,iraDeduction:5000,taxableRothConversions:20000,studentLoanInterestDeduction:1000,
      foreignEarnedHousingExclusions:2000,savingsBondInterestExclusion:300,employerAdoptionExclusion:400})).toEqual({deductionMagi:108700,rothMagi:88700});
  });
  it("deducts actual traditional deposits without adding them to basis or reducing FICA",()=>{
    const r=runEligibleContributions2026(input(),[policy]);
    const n=runEligibleContributions2026(input(),[{...policy,deductionChoice:"nondeductible"}]);
    expect(r.tax.iraDeduction).toBe(7500); expect(r.tax.agi).toBe(42500);
    expect(r.tax.regularFederal).toBe(2920); expect(r.nextState.people[0].iraBasis).toBe(0);
    expect(n.tax.regularFederal).toBe(3820); expect(n.nextState.people[0].iraBasis).toBe(7500);
    expect(r.tax.socialSecurityPayroll+r.tax.medicarePayroll).toBe(3825);
    expect(r.cash.cashResidual).toBeCloseTo(0,6);expect(r.cash.portfolioResidual).toBeCloseTo(0,6);
  });
  it("splits partial deduction from nondeductible basis",()=>{
    const r=runEligibleContributions2026(input({income:[{ownerId:"one",kind:"wages",amount:86000}]}),[{...policy,coveredByWorkplacePlan:true}]);
    expect(r.tax.iraDeduction).toBe(3750);expect(r.nextState.people[0].iraBasis).toBe(3750);
  });
  it("only deducts funded amounts under tight cash",()=>{
    const r=runEligibleContributions2026(input({spending:40000}),[policy]);
    expect(r.cash.contributions).toBeCloseTo(2355/.88,5);
    expect(r.tax.iraDeduction).toBeCloseTo(r.cash.contributions,8);
    expect(r.nextState.people[0].iraBasis).toBe(0);
  });
  it("caps combined IRA requests, gives traditional explicit priority, and observes Roth phaseout",()=>{
    const roth:YearAccount={id:"roth",ownerId:"one",kind:"roth-ira",balance:0,annualReturn:0};
    const r=runEligibleContributions2026(input({accounts:[cash,ira,roth],income:[{ownerId:"one",kind:"wages",amount:160500}],
      contributions:[{accountId:"ira",amount:3000,taxTreatment:"after-tax",eligibility:"externally-validated"},{accountId:"roth",amount:7500,taxTreatment:"after-tax",eligibility:"externally-validated"}]}),[{...policy,rothAccountId:"roth",coveredByWorkplacePlan:true}]);
    expect(r.cash.contributions).toBe(6750);expect(r.nextState.people[0].iraBasis).toBe(3000);
    expect(r.nextState.people[0].roth.regularContributionBasis).toBe(3750);
  });
  it("routes mandatory Roth catch-up only with consent and keeps plan basis separate",()=>{
    const plan:YearAccount={id:"plan",ownerId:"one",kind:"401k",balance:0,annualReturn:0,rmd:{table:"uniform",priorDecemberBalance:0},afterTaxBasis:0,deferRmdWhileWorking:false,additionalTaxExceptionAmount:0};
    const roth:YearAccount={id:"plan-roth",ownerId:"one",kind:"roth-401k",balance:0,annualReturn:0,contributionBasis:0,firstContributionYear:2020,hasInPlanRollover:false,additionalTaxExceptionAmount:0};
    const i=input({people:[{...input().people[0],birthDate:"1965-01-01"}],accounts:[cash,plan,roth],income:[{ownerId:"one",kind:"wages",amount:200000}],
      contributions:[{accountId:"plan",amount:40000,taxTreatment:"pretax-401k",eligibility:"externally-validated"}],withdrawalOrder:["cash","plan"]});
    const route:CatchUpRoute={ownerId:"one",sourceAccountId:"plan",rothDestinationAccountId:"plan-roth",consentToRothRouting:true,
      eligibility:{planAllowsCatchUp:true,planHasRoth:true,priorYearSponsorFicaWages:150001}};
    expect(()=>runEligibleContributions2026(i,[],[{...route,consentToRothRouting:false}])).toThrow(/consent/);
    const r=runEligibleContributions2026(i,[],[route]);
    expect(r.cash.contributions).toBe(35750);expect(r.tax.pretaxDeferrals).toBe(24500);
    expect(r.nextState.accounts.find(a=>a.id==="plan-roth")).toMatchObject({balance:11250,contributionBasis:11250});
  });
  it("rejects unsupported years and SS/withdrawal circularity",()=>{
    expect(()=>runEligibleContributions2026(input({year:2027}),[policy])).toThrow(/2026/);
    expect(()=>runEligibleContributions2026(input({income:[...input().income,{ownerId:"one",kind:"social-security",amount:1000}]}),[policy])).toThrow(/wages\/pensions/);
    expect(()=>runEligibleContributions2026(input({spending:100000}),[policy])).toThrow(/shortfalls/);
  });
  it("preserves legacy nondeductible contribution behavior and inputs",()=>{
    const i=input();const before=JSON.stringify(i);const legacy=runHouseholdYear(i);
    const r=runEligibleContributions2026(i,[{...policy,deductionChoice:"nondeductible"}]);
    expect(r.nextState).toEqual(legacy.nextState);expect(r.tax).toEqual(legacy.tax);expect(JSON.stringify(i)).toBe(before);
  });
});
