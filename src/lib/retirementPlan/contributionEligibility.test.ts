import { describe, expect, it } from "vitest";
import { iraEligibility2026, catchUpEligibility2026, type IraEligibilityInput } from "./contributionEligibility";

const ira = (change: Partial<IraEligibilityInput> = {}): IraEligibilityInput => ({ year: 2026, ageAtYearEnd: 40,
  filing: "single", taxableCompensation: 100000, rothMagi: 100000, deductionMagi: 100000,
  coveredByWorkplacePlan: false, spouseCoveredByWorkplacePlan: false, traditionalContributed: 0, rothContributed: 0, ...change });
const catchup = (age: number, wages = 0, roth = true) => catchUpEligibility2026({ year: 2026, ageAtYearEnd: age,
  planAllowsCatchUp: true, planHasRoth: roth, priorYearSponsorFicaWages: wages });
describe("2026 contribution eligibility", () => {
  it.each([[49,7500],[50,8600],[75,8600]])("IRA age %i limit %i", (age, limit) => {
    expect(iraEligibility2026(ira({ageAtYearEnd: age})).annualLimit).toBe(limit);
  });
  it.each([[153000,7500],[160500,3750],[167999,200],[168000,0]])("single Roth MAGI %i limit %i", (magi, expected) => {
    expect(iraEligibility2026(ira({rothMagi:magi})).rothTotalLimit).toBe(expected);
  });
  it("uses joint thresholds, compensation cap and required worksheet rounding", () => {
    expect(iraEligibility2026(ira({filing:"married",rothMagi:247000})).rothTotalLimit).toBe(3750);
    expect(iraEligibility2026(ira({rothMagi:160501})).rothTotalLimit).toBe(3750);
    expect(iraEligibility2026(ira({taxableCompensation:100,rothMagi:167999})).rothTotalLimit).toBe(100);
    expect(iraEligibility2026(ira({taxableCompensation:0})).combinedLimit).toBe(0);
  });
  it("subtracts other IRA contributions after phaseout and tracks existing Roth separately", () => {
    const r=iraEligibility2026(ira({rothMagi:160500,traditionalContributed:3000,rothContributed:1000}));
    expect(r.rothTotalLimit).toBe(3750); expect(r.rothRemaining).toBe(2750); expect(r.combinedRemaining).toBe(3500);
  });
  it("reports excess without negative available amounts or granting spousal compensation", () => {
    const r=iraEligibility2026(ira({traditionalContributed:8000,rothContributed:1000}));
    expect(r.combinedExcess).toBe(1500); expect(r.rothExcess).toBe(1000); expect(r.rothRemaining).toBe(0);
    expect(iraEligibility2026(ira({filing:"married",taxableCompensation:0})).combinedRemaining).toBe(0);
  });
  it("separates deduction phaseout from contribution eligibility", () => {
    const r=iraEligibility2026(ira({coveredByWorkplacePlan:true}));
    expect(r.deductionStatus).toBe("fully-phased-out"); expect(r.traditionalContributionRoom).toBe(7500);
    expect(r.deductionAmount).toBeNull();
    expect(iraEligibility2026(ira({coveredByWorkplacePlan:true,deductionMagi:86000})).deductionStatus).toBe("partially-phased-out");
    expect(iraEligibility2026(ira({filing:"married",spouseCoveredByWorkplacePlan:true,deductionMagi:247000})).deductionStatus).toBe("partially-phased-out");
  });
  it.each([[49,0],[50,8000],[59,8000],[60,11250],[63,11250],[64,8000]])("plan catch-up age %i limit %i", (age, expected) => {
    expect(catchup(age).availableCatchUp).toBe(expected);
  });
  it("uses a strict sponsor-wage threshold and blocks unavailable required Roth", () => {
    expect(catchup(60,150000).rothRequired).toBe(false);
    expect(catchup(60,150000.01)).toMatchObject({rothRequired:true,pretaxCatchUpCapacity:0,rothCatchUpCapacity:11250,totalDeferralCeiling:35750});
    expect(catchup(60,150001,false)).toMatchObject({availableCatchUp:0,blockedReason:"required-roth-feature-unavailable"});
    expect(catchup(60,0,false).pretaxCatchUpCapacity).toBe(11250);
  });
  it("honors plan permission and rejects unverified years and invalid values", () => {
    expect(catchUpEligibility2026({year:2026,ageAtYearEnd:60,planAllowsCatchUp:false,planHasRoth:true,priorYearSponsorFicaWages:0}).availableCatchUp).toBe(0);
    for(const value of [-1,NaN,Infinity]) expect(()=>iraEligibility2026(ira({rothMagi:value}))).toThrow();
    expect(()=>iraEligibility2026(ira({year:2027}))).toThrow(/2026/);
    expect(()=>iraEligibility2026(ira({ageAtYearEnd:50.5}))).toThrow(/Age/);
  });
});
