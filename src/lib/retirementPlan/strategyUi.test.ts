import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
const ui=readFileSync("src/components/RetirementStrategyComparison.tsx","utf8");
const parent=readFileSync("src/components/RetirementPlanPreview.tsx","utf8");
it("keeps strategy execution separate from form submission and manual application",()=>{
  expect(ui).toContain('type="button" onClick={run}');
  expect(ui).toContain("worker.postMessage({input,request});");
  expect(ui).toContain("workerRef.current!==worker");
  expect(ui).toContain("disabled={busy}");
  expect(parent).toContain("buildInput={()=>buildPreviewInput(values,accounts,saving,medicare)}");
  expect(ui).not.toContain("setConversions");
});
it("requires an explicit rate and tracks stale results and resets",()=>{
  expect(ui).toContain('terminalRate:""');expect(ui).toContain("report?.key!==key");
  expect(ui).toContain("Inputs changed. Compare again");expect(parent).toContain("key={strategyReset}");
  expect(parent).toContain("setStrategyReset(v=>v+1)");
});
it("shows all candidates, rejected reasons and keyboard-accessible schedules",()=>{
  expect(ui).toContain("report.result.candidates.map");expect(ui).toContain("candidate.reason");
  expect(ui).toContain('tabIndex={0}');expect(ui).toContain('scope="col"');
  expect(ui).toContain('id="strategy-rate"');expect(ui).toContain('htmlFor="strategy-custom"');
});
