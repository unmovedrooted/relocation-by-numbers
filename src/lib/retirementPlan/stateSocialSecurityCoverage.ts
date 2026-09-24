import type {StateCode} from "../states";
import {validateSocialSecurityLocationInput, type SocialSecurityLocationInput} from "./locationSocialSecurity";

// Classification is NOT a complete state tax calculation or an AGI subtraction.
// Official nationwide review, July 30, 2026; reviewed September 8, 2026.
export const STATE_SS_COVERAGE_SOURCE = "https://www.cga.ct.gov/2026/rpt/pdf/2026-R-0106.pdf";
type Classification = "exempt" | "conditional" | "federal-inclusion";
export const STATE_SS_CLASSIFICATION = {
  al:"exempt", ak:"exempt", az:"exempt", ar:"exempt", ca:"exempt",
  co:"conditional", ct:"conditional", dc:"exempt", de:"exempt", fl:"exempt", ga:"exempt",
  hi:"exempt", id:"exempt", il:"exempt", in:"exempt", ia:"exempt",
  ks:"exempt", ky:"exempt", la:"exempt", me:"exempt", md:"exempt",
  ma:"exempt", mi:"exempt", mn:"conditional", ms:"exempt", mo:"exempt",
  mt:"federal-inclusion", ne:"exempt", nv:"exempt", nh:"exempt", nj:"exempt",
  nm:"conditional", ny:"exempt", nc:"exempt", nd:"exempt", oh:"exempt",
  ok:"exempt", or:"exempt", pa:"exempt", ri:"conditional", sc:"exempt",
  sd:"exempt", tn:"exempt", tx:"exempt", ut:"conditional", vt:"conditional",
  va:"exempt", wa:"exempt", wv:"exempt", wi:"exempt", wy:"exempt",
} as const satisfies Record<StateCode, Classification>;

const CT_SOURCE = "https://portal.ct.gov/-/media/drs/publications/pubsip/2026/ip-2026-7.pdf";
const CO_SOURCE = "https://tax.colorado.gov/sites/tax/files/documents/ITT_Social_Security_Pensions_and_Annuities_Jan_2025.pdf";
const RI_SOURCE = "https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-11/ADV_2025_22_Inflation_Adjustments.pdf";
export type StateSocialSecurityInput = SocialSecurityLocationInput & {
  filing?: "single" | "married-joint" | "married-separate" | "head-of-household" | "surviving-spouse";
  /** CT worksheet line B: federal Pub. 505 worksheet 2-2 line 10.
   * Required above the AGI exemption threshold; not inferred from AGI because
   * federal exclusions and married-separate rules can change that worksheet.
   */
  ctFederalWorksheetLine10?: number;
  /** CO requires benefit ownership: joint federal taxable benefits are allocated
   * in proportion to each owner's gross benefits. Ages are at tax-year end.
   */
  owners?: readonly {ageAtYearEnd:number; grossBenefits:number}[];
  /** Actual M1M alternative-method provisional income, not inferred from AGI. */
  mnProvisionalIncome?: number;
  /** Vermont requires an election against the other nonmilitary exclusions. */
  vtExclusionElection?: "social-security" | "other-retirement";
  /** Utah 2026 statutory MAGI includes AGI, excluded interest and additions.
   * Eligible benefits exclude amounts already removed from state taxable income.
   * remainingTaxLiability is after other applicable credits, before this credit.
   */
  utah?: {
    excludedInterest:number;
    additionsToAgi:number;
    benefitsIncludedInStateIncome:number;
    remainingTaxLiability:number;
    competingRetirementCreditClaimed:boolean;
  };
  /** Rhode Island excludes a qualifying owner's own share of benefits only if
   * that owner has reached SSA full retirement age; ownership is allocated by
   * gross benefits, mirroring Colorado's owners field.
   */
  ri?: { owners: readonly {reachedFullRetirementAge:boolean; grossBenefits:number}[] };
};

/** Benefits-only inclusion, for full-year residents. Never a state/local tax
 * amount. No UI or annual settlement uses this helper yet. Future years freeze
 * these rules ONLY when the caller explicitly selects hold-2026-law.
 */
export function stateSocialSecurityInclusion(input: StateSocialSecurityInput) {
  const year=validateSocialSecurityLocationInput(input);
  const classification=STATE_SS_CLASSIFICATION[input.state];
  if (!classification) throw new RangeError("Unknown state for Social Security treatment.");
  const filings=["single","married-joint","married-separate","head-of-household","surviving-spouse"];
  if (input.filing!==undefined && !filings.includes(input.filing)) throw new RangeError("Invalid filing status.");
  if(input.mnProvisionalIncome!==undefined&&(!Number.isFinite(input.mnProvisionalIncome)||Math.abs(input.mnProvisionalIncome)>1e12)) throw new RangeError("Invalid Minnesota provisional income.");
  if(input.vtExclusionElection!==undefined&&!(["social-security","other-retirement"] as string[]).includes(input.vtExclusionElection)) throw new RangeError("Invalid Vermont election.");
  if(input.utah) {
    for(const amount of [input.utah.excludedInterest,input.utah.additionsToAgi,input.utah.benefitsIncludedInStateIncome,input.utah.remainingTaxLiability]) {
      if(!Number.isFinite(amount)||amount<0||amount>1e12) throw new RangeError("Invalid Utah credit input.");
    }
    if(input.utah.benefitsIncludedInStateIncome>input.federallyTaxableBenefits||typeof input.utah.competingRetirementCreditClaimed!=="boolean") throw new RangeError("Invalid Utah benefit/credit contract.");
  }
  if (input.ctFederalWorksheetLine10!==undefined &&
      (!Number.isFinite(input.ctFederalWorksheetLine10)||Math.abs(input.ctFederalWorksheetLine10)>1e12)) {
    throw new RangeError("Invalid Connecticut federal worksheet value.");
  }
  if (input.owners!==undefined) {
    if (input.owners.length<1 || input.owners.length>2 || input.owners.some(owner=>
      !Number.isInteger(owner.ageAtYearEnd)||owner.ageAtYearEnd<0||owner.ageAtYearEnd>125||
      !Number.isFinite(owner.grossBenefits)||owner.grossBenefits<0||owner.grossBenefits>1e12)) {
      throw new RangeError("Invalid Social Security benefit owners.");
    }
    if (Math.abs(input.owners.reduce((sum,owner)=>sum+owner.grossBenefits,0)-input.grossBenefits)>0.000001) {
      throw new RangeError("Owner benefits must equal household benefits.");
    }
  }
  if (input.ri!==undefined) {
    if (input.ri.owners.length<1 || input.ri.owners.length>2 || input.ri.owners.some(owner=>
      typeof owner.reachedFullRetirementAge!=="boolean"||
      !Number.isFinite(owner.grossBenefits)||owner.grossBenefits<0||owner.grossBenefits>1e12)) {
      throw new RangeError("Invalid Rhode Island benefit owners.");
    }
    if (Math.abs(input.ri.owners.reduce((sum,owner)=>sum+owner.grossBenefits,0)-input.grossBenefits)>0.000001) {
      throw new RangeError("Owner benefits must equal household benefits.");
    }
  }
  const metadata={classification,year,isProjection:year>2026,dataYear:2026,
    source:STATE_SS_COVERAGE_SOURCE,localTax:null,
    warning:"Social Security inclusion only, before other deductions or credits; not a state tax bill. Local treatment is separate."};
  const supported=(taxableBenefits:number,source=metadata.source)=>({
    ...metadata,source,status:"supported" as const,taxableBenefits,
    excludedFederallyTaxableBenefits:input.federallyTaxableBenefits-taxableBenefits,
  });
  const unsupported=(reason:string)=>({...metadata,status:"unsupported" as const,
    taxableBenefits:null,excludedFederallyTaxableBenefits:null,reason});
  if (classification==="exempt") return supported(0);
  if (classification==="federal-inclusion") return supported(input.federallyTaxableBenefits);
  if(input.state==="nm") {
    if(!input.filing) return unsupported("New Mexico requires filing status.");
    // Enacted HB163 section 7: 'shall not exceed', including equality.
    const cap=input.filing==="single"?100000:input.filing==="married-separate"?75000:150000;
    return supported(input.federalAgi<=cap?0:input.federallyTaxableBenefits,"https://www.nmlegis.gov/Sessions/22%20Regular/final/HB0163.pdf");
  }
  if(input.state==="vt") {
    if(!input.filing||!input.vtExclusionElection) return unsupported("Vermont requires filing status and an explicit retirement-exclusion election.");
    const lower=input.filing==="married-joint"?70000:55000;
    const exemptFraction=input.vtExclusionElection==="other-retirement"?0:Math.max(0,Math.min(1,(lower+10000-input.federalAgi)/10000));
    return supported(input.federallyTaxableBenefits*(1-exemptFraction),"https://legislature.vermont.gov/statutes/section/32/151/05830e");
  }
  if(input.state==="mn") {
    if(!input.filing||input.mnProvisionalIncome===undefined) return unsupported("Minnesota requires filing status and alternative-method provisional income.");
    const joint=input.filing==="married-joint"||input.filing==="surviving-spouse";
    const separate=input.filing==="married-separate";
    const threshold=joint?110780:separate?55390:86410;
    const steps=Math.ceil(Math.max(0,input.federalAgi-threshold)/(separate?2000:4000));
    const simplified=input.federallyTaxableBenefits*Math.max(0,(10-steps)/10);
    const alternateCap=joint?5840:separate?2920:4560;
    const alternateThreshold=joint?88630:separate?44315:69250;
    const alternate=Math.min(input.federallyTaxableBenefits,Math.max(0,alternateCap-0.2*Math.max(0,input.mnProvisionalIncome-alternateThreshold)));
    return {...supported(input.federallyTaxableBenefits-Math.max(simplified,alternate),"https://www.revenue.state.mn.us/sites/default/files/2025-12/inflation-adjusted-amounts-2026.pdf"),
      simplifiedSubtraction:simplified,alternateSubtraction:alternate};
  }
  if(input.state==="ut") {
    if(!input.filing||!input.utah) return unsupported("Utah requires the explicit state credit inputs and filing status.");
    const cap=input.filing==="single"?54000:input.filing==="married-separate"?45000:90000;
    const magi=input.federalAgi+input.utah.excludedInterest+input.utah.additionsToAgi;
    const calculatedCredit=input.utah.competingRetirementCreditClaimed?0:Math.max(0,0.0445*input.utah.benefitsIncludedInStateIncome-0.025*Math.max(0,magi-cap));
    // A credit does NOT remove income. Never convert credit dollars into a subtraction.
    return {...supported(input.utah.benefitsIncludedInStateIncome,"https://le.utah.gov/xcode/Title59/Chapter10/C59-10-S1042_2026010120250507.pdf"),
      status:"supported-credit" as const,calculatedCredit,allowedCredit:Math.min(calculatedCredit,input.utah.remainingTaxLiability),
      excludedFederallyTaxableBenefits:input.federallyTaxableBenefits-input.utah.benefitsIncludedInStateIncome};
  }
  if (input.state==="ct") {
    if (!input.filing) return unsupported("Connecticut requires filing status.");
    const threshold=input.filing==="single"||input.filing==="married-separate"?75000:100000;
    if (input.federalAgi<threshold) return supported(0,CT_SOURCE);
    if (input.ctFederalWorksheetLine10===undefined) return unsupported("Connecticut requires federal Social Security worksheet line 10 above its AGI threshold.");
    // CT worksheet A=gross benefits, B=federal worksheet line 10, D=25% of
    // min(A,B). F=max(0,E-D), where E=federally taxable benefits.
    const included=Math.min(input.federallyTaxableBenefits,
      0.25*Math.min(input.grossBenefits,Math.max(0,input.ctFederalWorksheetLine10)));
    return supported(included,CT_SOURCE);
  }
  if (input.state==="co") {
    if (input.filing!=="single"&&input.filing!=="married-joint") return unsupported("Colorado currently supports single and married-joint filing only.");
    if (!input.owners || input.owners.length!==(input.filing==="single"?1:2)) return unsupported("Colorado requires one benefit owner for single, two for joint filing.");
    if (input.owners.some(owner=>owner.grossBenefits>0&&owner.ageAtYearEnd<55)) return unsupported("Colorado under-55 benefit treatment requires separate verification.");
    if (input.grossBenefits===0) return supported(0,CO_SOURCE);
    const threshold=input.filing==="single"?75000:95000;
    const included=input.owners.reduce((sum,owner)=>{
      const share=input.federallyTaxableBenefits*(owner.grossBenefits/input.grossBenefits);
      return sum+(owner.ageAtYearEnd>=65||input.federalAgi<=threshold?0:Math.max(0,share-20000));
    },0);
    return supported(included,CO_SOURCE);
  }
  if (input.state==="ri") {
    if (!input.filing || !input.ri) return unsupported("Rhode Island requires filing status and per-owner full-retirement-age status.");
    if (input.grossBenefits===0) return supported(0,RI_SOURCE);
    const threshold=input.filing==="married-joint"?133750:107000;
    if (input.federalAgi>=threshold) return supported(input.federallyTaxableBenefits,RI_SOURCE);
    // Only a qualifying owner's own share (by gross benefits) is excluded;
    // a spouse who has not reached full retirement age stays fully taxable.
    const included=input.ri.owners.reduce((sum,owner)=>sum+(owner.reachedFullRetirementAge?0:
      input.federallyTaxableBenefits*(owner.grossBenefits/input.grossBenefits)),0);
    return supported(included,RI_SOURCE);
  }
  return unsupported("Unknown Social Security treatment for this state.");
}
