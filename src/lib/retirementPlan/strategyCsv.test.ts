import {expect,it} from "vitest";
import {strategyCsvRows} from "./strategyCsv";
import {evaluateBracketStrategies} from "./bracketStrategies";
import {buildPreviewInput,PREVIEW_DEFAULTS} from "./preview";
import {initialAccountEditor,newAccountDraft} from "./previewAccounts";
import {rowsToCsv} from "../csvExport";
import {readFileSync} from "node:fs";
function fixture(){const editor=initialAccountEditor();editor.accounts.push(newAccountDraft("roth","roth-ira"));editor.owners.one.rothFirstYear="2020";const input=buildPreviewInput({...PREVIEW_DEFAULTS,endYear:"2026"},editor);const request={ownerId:"one",sourceId:"one-ira",destinationId:"roth",terminalRate:"20.1250",window:{start:2026,end:2026}};return {input,request};}
it("exports captured assumptions, all four candidates, precision and annual baseline zeros",()=>{
const {input,request}=fixture(),result=evaluateBracketStrategies(input,request),snapshot={input,request,completedAt:"2026-09-07T00:00:00Z"};
const before=JSON.stringify({result,snapshot});const rows=strategyCsvRows(result,snapshot);
expect(rows.filter(r=>r.field==="status")).toHaveLength(4);
expect(rows.find(r=>r.field==="request.terminalRate")?.value).toBe("20.1250");
expect(rows.find(r=>r.section==="annual"&&r.strategy==="No conversions"&&r.field==="conversion")?.value).toBe(0);
expect(rows.every(r=>Object.keys(r).join()===Object.keys(rows[0]).join())).toBe(true);
expect(JSON.stringify({result,snapshot})).toBe(before);
expect(rowsToCsv(rows)).toContain("strategy-comparison-v1");
});
it("exports rejected candidates without invented valuation and neutralizes spreadsheet formulas",()=>{
const {input,request}=fixture(),result=evaluateBracketStrategies({...input,spendingAnnual:10000000},request);
const diagnostic={...result,candidates:result.candidates.map(c=>({...c,reason:'=HYPERLINK("unsafe")'}))};
const rows=strategyCsvRows(diagnostic,{input,request,completedAt:"test"});
expect(rows.filter(r=>r.section==="valuation")).toHaveLength(0);
expect(rows.filter(r=>r.field==="rejection_reason").every(r=>String(r.value).startsWith("'="))).toBe(true);
expect(rowsToCsv(rows)).toContain('""unsafe""');
});
it("exports only captured completed results and disables stale export",()=>{
const ui=readFileSync("src/components/RetirementStrategyComparison.tsx","utf8");
expect(ui).toContain("strategyCsvRows(report.result,report.snapshot)");expect(ui).toContain("disabled={stale||busy}");
expect(ui).toContain("snapshot:{input,request,completedAt:");
});
