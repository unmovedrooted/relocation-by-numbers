import { describe, expect, it } from "vitest";
import { buildPreviewInput, PREVIEW_DEFAULTS } from "./preview";
import { initialAccountEditor, newAccountDraft } from "./previewAccounts";
import { addPreviewConversions, comparePreviewConversions, initialConversionEditor } from "./previewConversions";

function fixture() {
  const editor = initialAccountEditor();
  editor.accounts.push(newAccountDraft("roth", "roth-ira"));
  const input = buildPreviewInput({ ...PREVIEW_DEFAULTS, endYear: "2026" }, editor);
  const draft = { ...initialConversionEditor(), enabled: true, sourceId: "one-ira", destinationId: "roth", startYear: "2026", endYear: "2026", amount: "10000.1250" };
  return { input, draft };
}
describe("manual preview conversions", () => {
  it("reports the exact settled taxable and basis split without changing cash flows", () => {
    const {input,draft}=fixture();
    const scenario={...input,accounts:input.accounts.map(a=>({...a,annualReturn:0})),people:input.people.map(p=>({...p,iraBasis:250000}))};
    const {result,baseline}=comparePreviewConversions(scenario,{...draft,amount:"10000"});
    expect(result.years[0].result.conversionTax).toEqual([{ownerId:"one",taxable:5000,nontaxable:5000}]);
    expect(baseline!.years[0].result.conversionTax).toEqual([]);
    expect(result.years[0].result.conversionTax.reduce((s,c)=>s+c.taxable+c.nontaxable,0)).toBe(10000);
    expect(result.years[0].reconciliationResidual).toBeCloseTo(0,6);
    expect(Object.isFrozen(result.years[0].result.conversionTax[0])).toBe(true);
  });
  it("leaves disabled inputs unchanged and clears the comparison", () => {
    const {input} = fixture();
    expect(addPreviewConversions(input, initialConversionEditor())).toBe(input);
    expect(comparePreviewConversions(input, initialConversionEditor()).baseline).toBeNull();
  });
  it("preserves raw decimals, maps an inclusive schedule and does not mutate input", () => {
    const {input, draft} = fixture();
    const result = addPreviewConversions({...input,endYear:2028},{...draft,endYear:"2028"});
    expect(Object.keys(result.conversionsByYear!)).toEqual(["2026","2027","2028"]);
    expect(result.conversionsByYear![2026][0].amount).toBe(10000.125);
    expect(draft.amount).toBe("10000.1250");
    expect(input.conversionsByYear).toBeUndefined();
  });
  it("compares an exact conversion against unchanged baseline and increases tax", () => {
    const {input,draft} = fixture();
    const {baseline,result} = comparePreviewConversions(input,draft);
    expect(baseline!.years[0].result.cash.conversions).toEqual([]);
    expect(result.years[0].result.cash.conversions[0].amount).toBe(10000.125);
    expect(result.years[0].result.tax.total).toBeGreaterThan(baseline!.years[0].result.tax.total);
    expect(result.years[0].reconciliationResidual).toBeCloseTo(0,5);
  });
  it("applies owner IRA basis rather than taxing the entire conversion", () => {
    const {input,draft} = fixture();
    const taxable = comparePreviewConversions(input,draft).result.years[0].result.tax.total;
    const withBasis = {...input,people:input.people.map(p=>({...p,iraBasis:250000}))};
    expect(comparePreviewConversions(withBasis,draft).result.years[0].result.tax.total).toBeLessThan(taxable);
  });
  it.each(["", "-1", "NaN", "Infinity", "1000000001", "0"])("rejects invalid amount %s", amount => {
    const {input,draft}=fixture(); expect(()=>addPreviewConversions(input,{...draft,amount})).toThrow();
  });
  it.each(["2025","2027","2026.5",""])("rejects invalid years %s", startYear=>{
    const {input,draft}=fixture(); expect(()=>addPreviewConversions(input,{...draft,startYear})).toThrow();
  });
  it("rejects removed accounts, wrong ownership and wrong account types",()=>{
    const {input,draft}=fixture();
    for(const patch of [{sourceId:"deleted"},{destinationId:"one-ira"},{ownerId:"two"},{sourceId:"cash"}]) expect(()=>addPreviewConversions(input,{...draft,...patch})).toThrow();
  });
  it("rejects conversions larger than available assets",()=>{
    const {input,draft}=fixture(); expect(()=>comparePreviewConversions(input,{...draft,amount:"600000"})).toThrow();
  });
  it("rejects unfunded spending rather than presenting a successful conversion",()=>{
    const {input,draft}=fixture(); expect(()=>comparePreviewConversions({...input,spendingAnnual:10000000},draft)).toThrow();
  });
  it("carries conversion MAGI into IRMAA exactly two years later", () => {
    const {input,draft}=fixture();
    const comparison=comparePreviewConversions({...input,endYear:2028,irmaa:{
      budgetTreatment:"surcharges-outside-spending",annualSurchargeGrowth:0,historicalIncome:[],
      enrollmentByYear:{2028:[{ownerId:"one",partBMonths:12,partDMonths:12}]},
    }},{...draft,amount:"50000"});
    expect(comparison.baseline!.years[2].irmaaSurcharges).toBe(0);
    expect(comparison.result.years[0].irmaaSurcharges).toBe(0);
    expect(comparison.result.years[2].irmaaSurcharges).toBeCloseTo((81.2+14.5)*12,2);
  });
  it("takes the RMD before checking conversion capacity", () => {
    const {input,draft}=fixture();
    const older={...input,people:input.people.map(p=>({...p,birthDate:"1951-01-01"}))};
    expect(()=>comparePreviewConversions(older,{...draft,amount:"500000"})).toThrow(/remaining after required withdrawals/);
    expect(comparePreviewConversions(older,draft).result.years[0].result.cash.requiredWithdrawals).toBeGreaterThan(0);
  });
});
