import {describe,it,expect} from "vitest";
import {locationSocialSecurityBase} from "./locationSocialSecurity";
const example={state:"ny" as const,cityId:"nyc-ny",federalAgi:75500,grossBenefits:30000,federallyTaxableBenefits:25500};
describe("explicit location Social Security base contract",()=>{
  it.each(["ca","va","wv"] as const)("applies the verified 2026 %s subtraction without extending New York city treatment",state=>{
    const r=locationSocialSecurityBase({...example,state,year:2026});
    expect(r.stateBase).toBe(50000);
    expect(r.socialSecuritySubtraction).toBe(25500);
    expect(r.localBase).toBeNull();
    expect(r).toMatchObject({dataYear:2026,isProjection:false});
  });
  it("requires explicit future-law projection and rejects pre-2026 WV use",()=>{
    expect(()=>locationSocialSecurityBase({...example,state:"wv",year:2025})).toThrow();
    expect(()=>locationSocialSecurityBase({...example,state:"wv",year:2030})).toThrow();
    expect(locationSocialSecurityBase({...example,state:"wv",year:2030,futurePolicy:"hold-2026-law"})).toMatchObject({stateBase:50000,isProjection:true});
  });
  it.each(["ny","ca","va","wv"] as const)("preserves zero and partial taxable benefits for %s",state=>{
    expect(locationSocialSecurityBase({...example,state,federalAgi:0,grossBenefits:0,federallyTaxableBenefits:0}).stateBase).toBe(0);
    expect(locationSocialSecurityBase({...example,state,federalAgi:60000,federallyTaxableBenefits:15000}).stateBase).toBe(45000);
  });
  it("subtracts federally included benefits, not gross benefits: 75500 - 25500 = 50000",()=>{
    const r=locationSocialSecurityBase(example);
    expect(r.stateBase).toBe(50000);
    expect(r.localBase).toBe(50000);
    expect(r.socialSecuritySubtraction).toBe(25500);
  });
  it("uses the same subtraction for Yonkers without inventing a local tax amount",()=>{
    expect(locationSocialSecurityBase({...example,cityId:"yonkers-ny"}).localBase).toBe(50000);
  });
  it("leaves income untouched when benefits are not federally taxable",()=>{
    expect(locationSocialSecurityBase({...example,federalAgi:10000,federallyTaxableBenefits:0}).stateBase).toBe(10000);
  });
  it("preserves signed AGI and fractional dollars without premature rounding",()=>{
    expect(locationSocialSecurityBase({...example,federalAgi:-100.25,federallyTaxableBenefits:0}).stateBase).toBe(-100.25);
    expect(locationSocialSecurityBase({...example,federalAgi:75500.125}).stateBase).toBe(50000.125);
  });
  it("does not treat missing or unknown cities as verified zero tax",()=>{
    for(const cityId of [undefined,"unknown","philadelphia-pa"]) {
      expect(locationSocialSecurityBase({...example,cityId}).localBase).toBeNull();
    }
  });
  it("does not infer another state's treatment from New York",()=>{
    expect(locationSocialSecurityBase({...example,state:"ct"})).toMatchObject({status:"unsupported",stateBase:null,localBase:null});
  });
  it("rejects malformed inputs and impossible benefit splits",()=>{
    for(const value of [NaN,Infinity,-1,1e13]) expect(()=>locationSocialSecurityBase({...example,grossBenefits:value})).toThrow();
    expect(()=>locationSocialSecurityBase({...example,federallyTaxableBenefits:30001})).toThrow();
  });
  it("does not mutate the original federal income inputs",()=>{
    const frozen=Object.freeze({...example});
    locationSocialSecurityBase(frozen);
    expect(frozen).toEqual(example);
  });
});
